/* TEMhoa AI1: glyph-ink aware bounds guard for the existing classic-script renderer.
   The editor's document units are CSS pixels. These bounds are also CSS pixels:
   do NOT multiply by zoom / DPR here. The canvas renderer applies output scale. */
(function (root) {
  'use strict';
  const MIN_SAFE_INSET = 2;
  const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  function inkBounds(ctx, run, effects = {}) {
    if (!run || !run.text) return null;
    ctx.save();
    let m;
    try {
      ctx.font = run.font || `${finite(run.size, 16)}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      m = ctx.measureText(String(run.text));
    } finally {
      ctx.restore();
    }
    // actualBoundingBoxLeft is the distance to the *left* of the anchor.
    // It may be negative for fonts with substantial rightward side-bearing.
    let left = -finite(m.actualBoundingBoxLeft, 0);
    let right = finite(m.actualBoundingBoxRight, finite(m.width, finite(run.width, 0)));
    let top = -finite(m.actualBoundingBoxAscent, finite(run.size, 16));
    let bottom = finite(m.actualBoundingBoxDescent, finite(run.size, 16) * .3);
    if (run.underline && String(run.text).trim()) {
      right = Math.max(right, finite(run.width, finite(m.width, 0)) / Math.max(0.001, finite(run.scaleX, 1)));
      bottom = Math.max(bottom, finite(run.size, 16) * .1 + Math.max(1, finite(run.size, 16) / 22));
    }
    // Reserve genuine stroke/shadow overflow without removing either effect.
    const stroke = Math.max(0, finite(effects.strokeWidth, finite(run.strokeWidth, 0))) / 2;
    const blur = Math.max(0, finite(effects.shadowBlur, finite(run.shadowBlur, 0))) * 1.5;
    const shadowX = finite(effects.shadowOffsetX, finite(run.shadowOffsetX, 0));
    const shadowY = finite(effects.shadowOffsetY, finite(run.shadowOffsetY, 0));
    left -= stroke + blur + Math.max(0, -shadowX);
    right += stroke + blur + Math.max(0, shadowX);
    top -= stroke + blur + Math.max(0, -shadowY);
    bottom += stroke + blur + Math.max(0, shadowY);
    const sx = finite(run.scaleX, 1), sy = finite(run.scaleY, 1);
    const angle = finite(run.angle, 0), c = Math.cos(angle), s = Math.sin(angle);
    const x = finite(run.x, 0), y = finite(run.y, 0);
    const corners = [[left, top], [right, top], [left, bottom], [right, bottom]];
    const xs = [], ys = [];
    for (const [px, py] of corners) {
      const xx = px * sx, yy = py * sy;
      xs.push(x + c * xx - s * yy);
      ys.push(y + s * xx + c * yy);
    }
    return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
  }

  function protectLayout(ctx, layout, effects = {}) {
    if (!layout || !Array.isArray(layout.runs) || !layout.runs.length) return layout;
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const run of layout.runs) {
      const rect = inkBounds(ctx, run, effects);
      if (!rect) continue;
      left = Math.min(left, rect.left);
      top = Math.min(top, rect.top);
      right = Math.max(right, rect.right);
      bottom = Math.max(bottom, rect.bottom);
    }
    // Graphics live in the same local coordinates as the text. Account for them
    // before shifting the origin so an image near the opposite edge cannot clip.
    for (const g of layout.graphics || []) {
      if (![g.x, g.y, g.width, g.height].every(v => Number.isFinite(Number(v)))) continue;
      const gx = Number(g.x), gy = Number(g.y);
      const hw = Math.abs(Number(g.width)) / 2, hh = Math.abs(Number(g.height)) / 2;
      const theta = finite(g.angle, 0) * Math.PI / 180, cos = Math.cos(theta), sin = Math.sin(theta);
      for (const [cx, cy] of [[-hw,-hh],[hw,-hh],[-hw,hh],[hw,hh]]) {
        const px = gx + cx * cos - cy * sin, py = gy + cx * sin + cy * cos;
        left = Math.min(left, px); top = Math.min(top, py);
        right = Math.max(right, px); bottom = Math.max(bottom, py);
      }
    }
    if (!Number.isFinite(left)) return layout;
    // The host maps layout.width to a fixed physical width. Never silently grow
    // that width when installed in the production editor: doing so shrinks text
    // on the printed page. Move only when the original logical content is inside
    // the page and its actual ink fits after a small origin adjustment.
    const inset = Math.max(MIN_SAFE_INSET, finite(effects.safeInset, MIN_SAFE_INSET));
    if (effects.preserveCanvas) {
      const w = finite(layout.width, 0), h = finite(layout.height, 0);
      const inside = layout.runs.every(run =>
        finite(run.x, -Infinity) >= 0 && finite(run.x, Infinity) + finite(run.width, 0) <= w &&
        finite(run.y, -Infinity) >= 0 && finite(run.y, Infinity) <= h);
      if (!inside) return layout; // User deliberately placed text across page boundary.
      const minX = inset - left, maxX = w - inset - right;
      const minY = inset - top, maxY = h - inset - bottom;
      if (minX > maxX || minY > maxY) return layout; // Needs a host-level page-size decision.
      const dx = Math.max(minX, Math.min(0, maxX));
      const dy = Math.max(minY, Math.min(0, maxY));
      if (!dx && !dy) return layout;
      const move = item => ({...item, x:finite(item.x,0)+dx, y:finite(item.y,0)+dy});
      return {
        ...layout, runs:layout.runs.map(move),
        graphics:Array.isArray(layout.graphics) ? layout.graphics.map(move) : layout.graphics,
        offsetX:finite(layout.offsetX,0)+dx, offsetY:finite(layout.offsetY,0)+dy,
        graphicOffsetX:finite(layout.graphicOffsetX,finite(layout.offsetX,0))+dx,
        graphicOffsetY:finite(layout.graphicOffsetY,finite(layout.offsetY,0))+dy,
        inkPadding:{left:dx,top:dy,right:0,bottom:0}
      };
    }
    // Pixels near the bitmap edge can be removed by antialiasing/raster rounding.
    const addLeft = Math.max(0, Math.ceil(inset - left));
    const addTop = Math.max(0, Math.ceil(inset - top));
    const addRight = Math.max(0, Math.ceil(right + inset - finite(layout.width, 0)));
    const addBottom = Math.max(0, Math.ceil(bottom + inset - finite(layout.height, 0)));
    if (!addLeft && !addTop && !addRight && !addBottom) return layout;
    const width = Math.ceil(finite(layout.width, 0)) + addLeft + addRight;
    const height = Math.ceil(finite(layout.height, 0)) + addTop + addBottom;
    if (width > 12000 || height > 12000) {
      throw new RangeError('Text ink bounds exceed the existing 12000px editor limit');
    }
    const move = item => ({ ...item, x: finite(item.x, 0) + addLeft, y: finite(item.y, 0) + addTop });
    return {
      ...layout, width, height,
      runs: layout.runs.map(move),
      graphics: Array.isArray(layout.graphics) ? layout.graphics.map(move) : layout.graphics,
      offsetX: finite(layout.offsetX, 0) + addLeft,
      offsetY: finite(layout.offsetY, 0) + addTop,
      graphicOffsetX: finite(layout.graphicOffsetX, finite(layout.offsetX, 0)) + addLeft,
      graphicOffsetY: finite(layout.graphicOffsetY, finite(layout.offsetY, 0)) + addTop,
      inkPadding: {left: addLeft, top: addTop, right: addRight, bottom: addBottom}
    };
  }

  // Called only after the host app has defined its final layout() wrapper.
  // Do not patch drawText / preview / editor selection / export independently:
  // all those paths already consume the same layout() contract.
  function install(target = root) {
    if (typeof target.layout !== 'function' || !target.document) return false;
    if (target.layout.temhoaInkBoundsGuard) return true;
    const previous = target.layout;
    // One tiny measurement context per editor; never allocate a canvas per preview.
    const context = target.document.createElement('canvas').getContext('2d');
    const guarded = function (...args) {
      const result = previous.apply(this, args);
      return context ? protectLayout(context, result, {preserveCanvas:true}) : result;
    };
    guarded.temhoaInkBoundsGuard = true;
    target.layout = guarded;
    return true;
  }
  const api = {inkBounds, protectLayout, install};
  root.TEMHOA_TEXT_INK = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  // Classic-script modules are loaded in order; wait until the final layout()
  // wrapper from the host editor has been declared before instrumenting it.
  if (root.document) {
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', () => install(root), {once:true});
    } else install(root);
  }
})(typeof window !== 'undefined' ? window : globalThis);
