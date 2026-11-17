/* Pure cloud-cut contour extraction, registration placement, and HP-GL/SVG generators. No DOM dependencies. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TemCloudCutCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const HPGL_UNITS_PER_MM = 40;
  const AXIS_MODES = new Set([
    'artcut-cartesian',
    'screen-down',
    'mh721-direct-180',
    'mh721-direct-pos',
    'mh721-direct-90cw',
    'mh721-direct-xy'
  ]);

  const cleanZero = n => (n === 0 ? 0 : n);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const formatSvgNum = n => String(cleanZero(Math.round(n * 1000) / 1000));
  const toHpglUnit = mm => cleanZero(Math.round(mm * HPGL_UNITS_PER_MM));

  function validateMaskDimensions(mask, w, h) {
    if (!Number.isInteger(w) || !Number.isInteger(h) || w < 0 || h < 0) {
      throw new Error('Kích thước mặt nạ không hợp lệ.');
    }
    if (!mask || typeof mask.length !== 'number' || mask.length < w * h) {
      throw new Error('Dữ liệu mặt nạ không đủ kích thước.');
    }
  }

  function toBinaryMask(mask, w, h) {
    const len = w * h;
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      if (mask[i]) out[i] = 255;
    }
    return out;
  }

  function pointXY(point) {
    if (Array.isArray(point)) return { x: point[0], y: point[1] };
    return { x: point.x, y: point.y };
  }

  function signedArea(points) {
    let sum = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const a = points[i];
      const b = points[(i + 1) % n];
      sum += a.x * b.y - b.x * a.y;
    }
    return sum * 0.5;
  }

  function computeBounds(points) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  function computeUnionBounds(contours) {
    if (!Array.isArray(contours) || !contours.length) {
      throw new Error('Không có đường cắt nào để tính vùng bao.');
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < contours.length; i++) {
      const contour = contours[i];
      const b = contour && contour.bounds
        ? contour.bounds
        : contour && Array.isArray(contour.closedPoints) && contour.closedPoints.length
          ? computeBounds(contour.closedPoints.map(pointXY))
          : null;
      if (!b || ![b.minX, b.minY, b.maxX, b.maxY].every(Number.isFinite)) {
        throw new Error('Dữ liệu đường cắt không hợp lệ.');
      }
      if (b.minX < minX) minX = b.minX;
      if (b.minY < minY) minY = b.minY;
      if (b.maxX > maxX) maxX = b.maxX;
      if (b.maxY > maxY) maxY = b.maxY;
    }
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Dilate binary/alpha mask using an exact squared Euclidean distance transform.
   * Uses Felzenszwalb-Huttenlocher 2-pass parabola envelope for O(w*h) runtime.
   * @param {Uint8Array|Uint8ClampedArray|number[]} alpha
   * @param {number} w
   * @param {number} h
   * @param {number} radiusPx
   * @returns {Uint8Array}
   */
  function dilateMask(alpha, w, h, radiusPx) {
    validateMaskDimensions(alpha, w, h);
    if (!Number.isFinite(radiusPx)) throw new Error('Bán kính giãn nở không hợp lệ.');
    if (w === 0 || h === 0) return new Uint8Array(0);
    if (radiusPx <= 0) return toBinaryMask(alpha, w, h);

    const len = w * h;
    const limit = radiusPx * radiusPx;
    // Finite sentinel above any valid squared distance avoids Infinity - Infinity = NaN in envelope cuts.
    const inf = Math.max(1e12, w * w + h * h + limit + 10);
    const dist = new Float64Array(len);
    let hasForeground = false;

    for (let y = 0; y < h; y++) {
      const row = y * w;
      let last = -1;
      for (let x = 0; x < w; x++) {
        if (alpha[row + x]) {
          last = x;
          hasForeground = true;
        }
        dist[row + x] = last >= 0 ? (x - last) * (x - last) : inf;
      }
      last = -1;
      for (let x = w - 1; x >= 0; x--) {
        if (alpha[row + x]) last = x;
        if (last >= 0) {
          const d = (last - x) * (last - x);
          if (d < dist[row + x]) dist[row + x] = d;
        }
      }
    }

    if (!hasForeground) return new Uint8Array(len);

    const vertices = new Int32Array(h);
    const cuts = new Float64Array(h + 1);
    const out = new Uint8Array(len);

    for (let x = 0; x < w; x++) {
      let k = 0;
      vertices[0] = 0;
      cuts[0] = -Infinity;
      cuts[1] = Infinity;

      for (let q = 1; q < h; q++) {
        let v = vertices[k];
        let cut = (dist[q * w + x] + q * q - dist[v * w + x] - v * v) / (2 * (q - v));
        while (k > 0 && cut <= cuts[k]) {
          k--;
          v = vertices[k];
          cut = (dist[q * w + x] + q * q - dist[v * w + x] - v * v) / (2 * (q - v));
        }
        k++;
        vertices[k] = q;
        cuts[k] = cut;
        cuts[k + 1] = Infinity;
      }

      k = 0;
      for (let y = 0; y < h; y++) {
        while (cuts[k + 1] < y) k++;
        const v = vertices[k];
        const dy = y - v;
        if (dy * dy + dist[v * w + x] <= limit) out[y * w + x] = 255;
      }
    }
    return out;
  }

  /**
   * Erode binary/alpha mask by inverting with a 1px zero-padded outer border,
   * dilating the background, and inverting back so image-border pixels erode properly.
   * @param {Uint8Array|Uint8ClampedArray|number[]} alpha
   * @param {number} w
   * @param {number} h
   * @param {number} radiusPx
   * @returns {Uint8Array}
   */
  function erodeMask(alpha, w, h, radiusPx) {
    validateMaskDimensions(alpha, w, h);
    if (!Number.isFinite(radiusPx)) throw new Error('Bán kính thu nhỏ không hợp lệ.');
    if (w === 0 || h === 0) return new Uint8Array(0);
    if (radiusPx <= 0) return toBinaryMask(alpha, w, h);

    const pw = w + 2;
    const ph = h + 2;
    const paddedInv = new Uint8Array(pw * ph);
    paddedInv.fill(255);

    for (let y = 0; y < h; y++) {
      const srcRow = y * w;
      const dstRow = (y + 1) * pw + 1;
      for (let x = 0; x < w; x++) {
        if (alpha[srcRow + x]) paddedInv[dstRow + x] = 0;
      }
    }

    const dilatedBg = dilateMask(paddedInv, pw, ph, radiusPx);
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      const srcRow = (y + 1) * pw + 1;
      const dstRow = y * w;
      for (let x = 0; x < w; x++) {
        if (!dilatedBg[srcRow + x]) out[dstRow + x] = 255;
      }
    }
    return out;
  }

  /**
   * Offset mask outward (> 0), inward (< 0), or return a binary copy (0).
   * @param {Uint8Array|Uint8ClampedArray|number[]} mask
   * @param {number} w
   * @param {number} h
   * @param {number} offsetPx
   * @returns {Uint8Array}
   */
  function offsetMask(mask, w, h, offsetPx) {
    validateMaskDimensions(mask, w, h);
    if (!Number.isFinite(offsetPx)) throw new Error('Độ bù viền không hợp lệ.');
    if (offsetPx > 0) return dilateMask(mask, w, h, offsetPx);
    if (offsetPx < 0) return erodeMask(mask, w, h, -offsetPx);
    return toBinaryMask(mask, w, h);
  }

  /**
   * Fill enclosed interior holes using 4-connected flood fill from image borders.
   * Pure function returning a new 0/255 Uint8Array.
   * @param {Uint8Array|Uint8ClampedArray|number[]} mask
   * @param {number} w
   * @param {number} h
   * @returns {Uint8Array}
   */
  function fillHoles(mask, w, h) {
    validateMaskDimensions(mask, w, h);
    if (w === 0 || h === 0) return new Uint8Array(0);

    const len = w * h;
    const seen = new Uint8Array(len);
    const queue = new Int32Array(len);
    let head = 0;
    let tail = 0;

    function enqueue(idx) {
      if (!mask[idx] && !seen[idx]) {
        seen[idx] = 1;
        queue[tail++] = idx;
      }
    }

    for (let x = 0; x < w; x++) {
      enqueue(x);
      enqueue((h - 1) * w + x);
    }
    for (let y = 0; y < h; y++) {
      enqueue(y * w);
      enqueue(y * w + w - 1);
    }

    while (head < tail) {
      const idx = queue[head++];
      const x = idx % w;
      if (x > 0) enqueue(idx - 1);
      if (x < w - 1) enqueue(idx + 1);
      if (idx >= w) enqueue(idx - w);
      if (idx < len - w) enqueue(idx + w);
    }

    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      if (!seen[i]) out[i] = 255;
    }
    return out;
  }

  /**
   * Trace directed pixel boundary edges into closed rings.
   * At diagonal touches, prefers right-hand turns (delta = 1) to keep foreground on the right.
   */
  function traceOuterRings(mask, w, h) {
    const stride = w + 1;
    const edges = [];
    const outgoing = new Map();

    function addEdge(a, b, d) {
      const idx = edges.length;
      edges.push({ a, b, d, used: false });
      let list = outgoing.get(a);
      if (!list) {
        list = [];
        outgoing.set(a, list);
      }
      list.push(idx);
    }

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!mask[i]) continue;
        const a = y * stride + x;
        if (y === 0 || !mask[i - w]) addEdge(a, a + 1, 0);
        if (x === w - 1 || !mask[i + 1]) addEdge(a + 1, a + stride + 1, 1);
        if (y === h - 1 || !mask[i + w]) addEdge(a + stride + 1, a + stride, 2);
        if (x === 0 || !mask[i - 1]) addEdge(a + stride, a, 3);
      }
    }

    // Rank relative turns (delta = (nextD - curD + 4) & 3): 1(right)->0, 0(straight)->1, 3(left)->2, 2(U-turn)->3
    const turnRank = [1, 0, 3, 2];
    const rings = [];

    for (let start = 0; start < edges.length; start++) {
      if (edges[start].used) continue;
      let cur = start;
      let steps = 0;
      let closed = false;
      const ring = [];

      while (steps <= edges.length) {
        const e = edges[cur];
        if (e.used) break;
        e.used = true;
        ring.push({ x: e.a % stride, y: Math.floor(e.a / stride) });

        if (e.b === edges[start].a) {
          closed = true;
          break;
        }

        const nextList = outgoing.get(e.b);
        if (!nextList || !nextList.length) break;

        let bestIdx = -1;
        let bestRank = 99;
        for (let i = 0; i < nextList.length; i++) {
          const candidate = nextList[i];
          if (edges[candidate].used) continue;
          const rank = turnRank[(edges[candidate].d - e.d + 4) & 3];
          if (rank < bestRank) {
            bestRank = rank;
            bestIdx = candidate;
          }
        }
        if (bestIdx < 0) break;
        cur = bestIdx;
        steps++;
      }

      if (closed && ring.length >= 4) rings.push(ring);
    }

    return rings;
  }

  function removeCollinearAndDupes(points, eps = 1e-9) {
    if (points.length < 3) return points.slice();
    const deduped = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const prev = deduped[deduped.length - 1];
      if (!prev || Math.hypot(p.x - prev.x, p.y - prev.y) > eps) {
        deduped.push({ x: p.x, y: p.y });
      }
    }
    if (deduped.length > 1) {
      const first = deduped[0];
      const last = deduped[deduped.length - 1];
      if (Math.hypot(first.x - last.x, first.y - last.y) <= eps) deduped.pop();
    }
    if (deduped.length < 3) return deduped;

    const clean = [];
    const n = deduped.length;
    for (let i = 0; i < n; i++) {
      const a = deduped[(i + n - 1) % n];
      const b = deduped[i];
      const c = deduped[(i + 1) % n];
      const abx = b.x - a.x;
      const aby = b.y - a.y;
      const bcx = c.x - b.x;
      const bcy = c.y - b.y;
      const cross = abx * bcy - aby * bcx;
      const dot = abx * bcx + aby * bcy;
      const scale = Math.hypot(abx, aby) * Math.hypot(bcx, bcy);
      if (scale > eps && Math.abs(cross) <= 1e-9 * scale && dot > 0) continue;
      clean.push(b);
    }
    return clean;
  }

  function simplifyOpen(points, epsilon) {
    if (points.length < 3 || epsilon <= 0) return points.slice();
    const keep = new Uint8Array(points.length);
    keep[0] = 1;
    keep[points.length - 1] = 1;
    const stack = [[0, points.length - 1]];
    const limit = epsilon * epsilon;

    while (stack.length) {
      const pair = stack.pop();
      const a = pair[0];
      const b = pair[1];
      const p = points[a];
      const q = points[b];
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      const den = dx * dx + dy * dy;
      let far = -1;
      let best = limit;

      for (let i = a + 1; i < b; i++) {
        const t = den ? clamp(((points[i].x - p.x) * dx + (points[i].y - p.y) * dy) / den, 0, 1) : 0;
        const ex = points[i].x - p.x - t * dx;
        const ey = points[i].y - p.y - t * dy;
        const d2 = ex * ex + ey * ey;
        if (d2 > best) {
          far = i;
          best = d2;
        }
      }
      if (far >= 0) {
        keep[far] = 1;
        stack.push([a, far], [far, b]);
      }
    }

    const out = [];
    for (let i = 0; i < points.length; i++) {
      if (keep[i]) out.push(points[i]);
    }
    return out;
  }

  function farthestVertexIndex(points, fromIdx) {
    const origin = points[fromIdx];
    let bestIdx = fromIdx;
    let bestDist = -1;
    for (let i = 0; i < points.length; i++) {
      const dx = points[i].x - origin.x;
      const dy = points[i].y - origin.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > bestDist) {
        bestDist = d2;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  function simplifyRing(points, epsilon) {
    if (points.length < 4 || epsilon <= 0) return points.slice();
    // Pick approximate diameter endpoints so split pins true corners rather than an arbitrary seam.
    const anchorA = farthestVertexIndex(points, 0);
    const anchorB = farthestVertexIndex(points, anchorA);
    const rotated = [...points.slice(anchorB), ...points.slice(0, anchorB)];
    const split = (anchorA - anchorB + points.length) % points.length;
    if (split === 0 || split >= rotated.length) return rotated;

    const firstHalf = simplifyOpen(rotated.slice(0, split + 1), epsilon).slice(0, -1);
    const secondHalf = simplifyOpen([...rotated.slice(split), rotated[0]], epsilon).slice(0, -1);
    const merged = [...firstHalf, ...secondHalf];
    return merged.length >= 3 ? merged : points.slice();
  }

  /**
   * Flatten pixel stair-step corners using quadratic Bezier corner pulls converted
   * into short linear segments (approx 0.12-0.2 mm), preserving pure polyline compatibility.
   */
  function smoothPolygonCorners(points) {
    const n = points.length;
    if (n < 3) return points.slice();
    const out = [];

    for (let i = 0; i < n; i++) {
      const a = points[(i + n - 1) % n];
      const b = points[i];
      const c = points[(i + 1) % n];
      const d1 = Math.hypot(a.x - b.x, a.y - b.y);
      const d2 = Math.hypot(c.x - b.x, c.y - b.y);

      if (d1 <= 1e-6 || d2 <= 1e-6) {
        out.push({ x: b.x, y: b.y });
        continue;
      }

      const cosTheta = ((a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y)) / (d1 * d2);
      if (cosTheta < -0.998) {
        out.push({ x: b.x, y: b.y });
        continue;
      }

      const r = Math.min(0.35, d1 * 0.22, d2 * 0.22);
      const entry = { x: b.x + (a.x - b.x) * (r / d1), y: b.y + (a.y - b.y) * (r / d1) };
      const exit = { x: b.x + (c.x - b.x) * (r / d2), y: b.y + (c.y - b.y) * (r / d2) };
      const chord = Math.hypot(exit.x - entry.x, exit.y - entry.y);
      const approxArc = (chord + 2 * r) * 0.5;

      if (approxArc < 0.03) {
        out.push({ x: b.x, y: b.y });
        continue;
      }

      const steps = Math.max(1, Math.min(4, Math.ceil(approxArc / 0.17)));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const mt = 1 - t;
        out.push({
          x: mt * mt * entry.x + 2 * mt * t * b.x + t * t * exit.x,
          y: mt * mt * entry.y + 2 * mt * t * b.y + t * t * exit.y
        });
      }
    }

    return removeCollinearAndDupes(out, 1e-6);
  }

  function rotateToTopLeftClockwise(points) {
    const pts = points.map(p => ({ x: cleanZero(p.x), y: cleanZero(p.y) }));
    if (signedArea(pts) < 0) pts.reverse();

    const bounds = computeBounds(pts);
    let bestIdx = 0;
    let bestDist2 = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const dx = pts[i].x - bounds.minX;
      const dy = pts[i].y - bounds.minY;
      const d2 = dx * dx + dy * dy;
      if (
        d2 < bestDist2 - 1e-12 ||
        (Math.abs(d2 - bestDist2) <= 1e-12 &&
          (pts[i].y < pts[bestIdx].y || (pts[i].y === pts[bestIdx].y && pts[i].x < pts[bestIdx].x)))
      ) {
        bestDist2 = d2;
        bestIdx = i;
      }
    }
    return [...pts.slice(bestIdx), ...pts.slice(0, bestIdx)];
  }

  /**
   * Close a polygon loop and continue along the start perimeter by `overcutMm`
   * so drag-knife plotters cleanly finish the cut without leaving an uncut tab.
   * @param {Array<{x:number,y:number}|number[]>} closedPoints
   * @param {number} overcutMm
   * @returns {Array<{x:number,y:number}>}
   */
  function applyOvercut(closedPoints, overcutMm = 0) {
    if (!Array.isArray(closedPoints) || closedPoints.length < 3) {
      throw new Error('Đa giác đóng phải có ít nhất 3 điểm.');
    }
    if (!Number.isFinite(overcutMm) || overcutMm < 0) {
      throw new Error('Khoảng cắt chồng (overcutMm) không hợp lệ.');
    }

    const pts = closedPoints.map(pointXY);
    const out = pts.map(p => ({ x: p.x, y: p.y }));
    out.push({ x: pts[0].x, y: pts[0].y });
    if (overcutMm === 0) return out;

    const n = pts.length;
    let perimeter = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      perimeter += Math.hypot(b.x - a.x, b.y - a.y);
    }
    if (perimeter <= 1e-9) return out;

    let remaining = Math.min(overcutMm, perimeter);
    for (let step = 0; step < n && remaining > 1e-9; step++) {
      const a = pts[step];
      const b = pts[(step + 1) % n];
      const segLen = Math.hypot(b.x - a.x, b.y - a.y);
      if (segLen <= 1e-9) continue;

      if (remaining <= segLen + 1e-9) {
        const t = Math.min(1, remaining / segLen);
        out.push({
          x: cleanZero(a.x + (b.x - a.x) * t),
          y: cleanZero(a.y + (b.y - a.y) * t)
        });
        break;
      }
      out.push({ x: b.x, y: b.y });
      remaining -= segLen;
    }

    return out;
  }

  /**
   * Extract simplified, optionally corner-smoothed outer silhouettes in mm coordinates.
   * @param {Uint8Array|Uint8ClampedArray|number[]} mask
   * @param {number} w
   * @param {number} h
   * @param {object} options
   * @returns {Array<{closedPoints: Array<{x:number,y:number}>, cutPoints: Array<{x:number,y:number}>, bounds: object, areaMm2: number}>}
   */
  function extractOuterContours(mask, w, h, options) {
    validateMaskDimensions(mask, w, h);
    const opts = options || {};
    const {
      pxPerMm,
      originXMm = 0,
      originYMm = 0,
      offsetPx = 0,
      simplifyMm = 0.08,
      minAreaMm2 = 1.5,
      overcutMm = 0.6,
      smoothCorners = true
    } = opts;

    if (!Number.isFinite(pxPerMm) || pxPerMm <= 0) {
      throw new Error('Thông số pxPerMm phải là số dương.');
    }
    if (![originXMm, originYMm, offsetPx, simplifyMm, minAreaMm2, overcutMm].every(Number.isFinite)) {
      throw new Error('Tuỳ chọn trích xuất đường cắt không hợp lệ.');
    }
    if (w === 0 || h === 0) return [];

    const adjusted = offsetPx !== 0 ? offsetMask(mask, w, h, offsetPx) : toBinaryMask(mask, w, h);
    const filled = fillHoles(adjusted, w, h);
    const rawRings = traceOuterRings(filled, w, h);
    const results = [];

    for (let i = 0; i < rawRings.length; i++) {
      const mmRing = rawRings[i].map(p => ({
        x: originXMm + p.x / pxPerMm,
        y: originYMm + p.y / pxPerMm
      }));
      const rawArea = Math.abs(signedArea(mmRing));
      if (rawArea < minAreaMm2) continue;

      const cleaned = removeCollinearAndDupes(mmRing);
      if (cleaned.length < 3) continue;

      let poly = simplifyMm > 0 ? simplifyRing(cleaned, simplifyMm) : cleaned;
      poly = removeCollinearAndDupes(poly);
      if (poly.length < 3) poly = cleaned;

      if (smoothCorners) {
        const smoothed = smoothPolygonCorners(poly);
        if (smoothed.length >= 3) poly = smoothed;
      }

      const closedPoints = rotateToTopLeftClockwise(poly);
      const areaMm2 = Math.abs(signedArea(closedPoints));
      if (closedPoints.length < 3 || areaMm2 <= 1e-6) continue;

      const cutPoints = applyOvercut(closedPoints, overcutMm);
      const bounds = computeBounds(closedPoints);
      results.push({ closedPoints, cutPoints, bounds, areaMm2 });
    }

    return results;
  }

  /**
   * Sort contours top-to-bottom in horizontal rows (clustered by `rowToleranceMm`)
   * and left-to-right within each row. Avoids non-transitive comparator cycles.
   * @param {Array<object>} contours
   * @param {number} rowToleranceMm
   * @returns {Array<object>}
   */
  function sortContoursTopLeft(contours, rowToleranceMm = 12) {
    if (!Array.isArray(contours)) throw new Error('Danh sách đường cắt không hợp lệ.');
    if (!Number.isFinite(rowToleranceMm) || rowToleranceMm < 0) {
      throw new Error('Dung sai hàng (rowToleranceMm) không hợp lệ.');
    }
    if (contours.length <= 1) return contours.slice();

    const byY = contours.slice().sort((a, b) => {
      const dy = a.bounds.minY - b.bounds.minY;
      return dy !== 0 ? dy : a.bounds.minX - b.bounds.minX;
    });

    const rows = [];
    let currentRow = [byY[0]];
    let rowAnchorY = byY[0].bounds.minY;

    for (let i = 1; i < byY.length; i++) {
      const c = byY[i];
      if (c.bounds.minY - rowAnchorY <= rowToleranceMm) {
        currentRow.push(c);
      } else {
        rows.push(currentRow);
        currentRow = [c];
        rowAnchorY = c.bounds.minY;
      }
    }
    rows.push(currentRow);

    const sorted = [];
    for (let r = 0; r < rows.length; r++) {
      rows[r].sort((a, b) => {
        const dx = a.bounds.minX - b.bounds.minX;
        return dx !== 0 ? dx : a.bounds.minY - b.bounds.minY;
      });
      for (let c = 0; c < rows[r].length; c++) sorted.push(rows[r][c]);
    }
    return sorted;
  }

  /**
   * Compute primary top-left registration `+` mark and optional secondary alignment `+` mark.
   * @param {Array<object>} contours
   * @param {{width:number,height:number}} pageMm
   * @param {object} options
   * @returns {object}
   */
  function computeCutReference(contours, pageMm, options) {
    if (!Array.isArray(contours) || !contours.length) {
      throw new Error('Không có đường cắt nào để đặt dấu định vị (+).');
    }
    if (!pageMm || !Number.isFinite(pageMm.width) || !Number.isFinite(pageMm.height) || pageMm.width <= 0 || pageMm.height <= 0) {
      throw new Error('Kích thước trang giấy cắt không hợp lệ.');
    }

    const opts = options || {};
    const {
      marginMm = 3,
      safeEdgeMm = 4,
      crossSizeMm = 8,
      includeAlignMark = true
    } = opts;

    if (![marginMm, safeEdgeMm, crossSizeMm].every(Number.isFinite) || crossSizeMm <= 0 || safeEdgeMm < 0) {
      throw new Error('Tuỳ chọn dấu định vị không hợp lệ.');
    }

    const bounds = computeUnionBounds(contours);
    const refX = cleanZero(clamp(bounds.minX - marginMm, safeEdgeMm, pageMm.width - safeEdgeMm));
    const refY = cleanZero(clamp(bounds.minY - marginMm, safeEdgeMm, pageMm.height - safeEdgeMm));
    const alignX = cleanZero(clamp(bounds.maxX + marginMm, refX + 30, pageMm.width - safeEdgeMm));
    const hasAlignMark = Boolean(
      includeAlignMark && alignX <= pageMm.width - safeEdgeMm && alignX - refX >= 25
    );

    return {
      refX,
      refY,
      alignX,
      alignY: refY,
      hasAlignMark,
      crossSizeMm,
      bounds
    };
  }

  /**
   * Map a page-space point (mm) relative to `ref` into plotter/export axis coordinates.
   * @param {number} xMm
   * @param {number} yMm
   * @param {{refX:number,refY:number}} ref
   * @param {object} options
   * @returns {{x:number,y:number}}
   */
  function transformPointForCut(xMm, yMm, ref, options) {
    if (!Number.isFinite(xMm) || !Number.isFinite(yMm)) {
      throw new Error('Toạ độ điểm cắt không hợp lệ.');
    }
    if (!ref || !Number.isFinite(ref.refX) || !Number.isFinite(ref.refY)) {
      throw new Error('Điểm chuẩn định vị (+) không hợp lệ.');
    }

    const opts = options || {};
    const {
      scaleX = 1,
      scaleY = 1,
      axisMode = 'artcut-cartesian'
    } = opts;

    if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY) || scaleX <= 0 || scaleY <= 0) {
      throw new Error('Tỉ lệ hiệu chỉnh scaleX/scaleY phải là số dương.');
    }
    if (!AXIS_MODES.has(axisMode)) {
      throw new Error('Chế độ trục cắt không hợp lệ: ' + axisMode);
    }

    const dx = (xMm - ref.refX) * scaleX;
    const dy = (yMm - ref.refY) * scaleY;

    switch (axisMode) {
      case 'artcut-cartesian':
        return { x: cleanZero(dx), y: cleanZero(-dy) };
      case 'screen-down':
        return { x: cleanZero(dx), y: cleanZero(dy) };
      case 'mh721-direct-180':
        // MH721 roll cutter: HP-GL X = paper feed (roller), Y = carriage moving across the paper.
        // Strictly positive coordinates (+X, +Y) from the right-side ORIGIN (paper rotated 180°).
        return { x: cleanZero(dy), y: cleanZero(dx) };
      case 'mh721-direct-pos':
        return { x: cleanZero(dy), y: cleanZero(-dx) };
      case 'mh721-direct-90cw':
        // Swapped fallback: page width drives the roller (+X), page height drives the carriage (+Y).
        return { x: cleanZero(dx), y: cleanZero(dy) };
      case 'mh721-direct-xy':
        return { x: cleanZero(-dx), y: cleanZero(dy) };
    }
  }

  function resolveCutJob(cutJob) {
    if (!cutJob || !Array.isArray(cutJob.contours) || !cutJob.contours.length) {
      throw new Error('Công việc cắt không có đường cắt nào.');
    }
    const {
      contours,
      pageMm,
      scaleX = 1,
      scaleY = 1,
      axisMode = 'artcut-cartesian',
      includeRefMark = false
    } = cutJob;

    const ref = cutJob.ref || (pageMm ? computeCutReference(contours, pageMm) : null);
    if (!ref || !Number.isFinite(ref.refX) || !Number.isFinite(ref.refY)) {
      throw new Error('Thiếu điểm chuẩn định vị (+) hoặc kích thước trang.');
    }
    if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY) || scaleX <= 0 || scaleY <= 0) {
      throw new Error('Tỉ lệ hiệu chỉnh scaleX/scaleY không hợp lệ.');
    }
    if (!AXIS_MODES.has(axisMode)) {
      throw new Error('Chế độ trục cắt không hợp lệ: ' + axisMode);
    }

    return { contours, ref, pageMm, scaleX, scaleY, axisMode, includeRefMark };
  }

  function appendCrosshairHPGL(commands, cxMm, cyMm, halfMm, ref, txOpts) {
    const h1 = transformPointForCut(cxMm - halfMm, cyMm, ref, txOpts);
    const h2 = transformPointForCut(cxMm + halfMm, cyMm, ref, txOpts);
    const v1 = transformPointForCut(cxMm, cyMm - halfMm, ref, txOpts);
    const v2 = transformPointForCut(cxMm, cyMm + halfMm, ref, txOpts);
    commands.push(
      `PU${toHpglUnit(h1.x)},${toHpglUnit(h1.y)};PD${toHpglUnit(h2.x)},${toHpglUnit(h2.y)};`,
      `PU${toHpglUnit(v1.x)},${toHpglUnit(v1.y)};PD${toHpglUnit(v2.x)},${toHpglUnit(v2.y)};`
    );
  }

  /**
   * Push an HP-GL move (`PU` or `PD`) from `fromPt` to `toPt`, subdividing long moves into
   * <= 1600-unit (40 mm) collinear steps so 8-bit MH721 16-bit signed Bresenham counters never overflow.
   */
  function pushSteppedMove(cmds, prefix, fromPt, toPt, maxStepUnits = 1600) {
    const dx = toPt.x - fromPt.x;
    const dy = toPt.y - fromPt.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= maxStepUnits || !(maxStepUnits > 0)) {
      cmds.push(`${prefix}${toPt.x},${toPt.y};`);
      return;
    }
    const steps = Math.ceil(dist / maxStepUnits);
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const ix = Math.round(fromPt.x + dx * t);
      const iy = Math.round(fromPt.y + dy * t);
      cmds.push(`${prefix}${ix},${iy};`);
    }
  }

  /**
   * Generate HP-GL cutting command stream at 40 units/mm.
   * @param {object} cutJob
   * @returns {string}
   */
  function generateHPGL(cutJob) {
    const job = resolveCutJob(cutJob);
    const txOpts = { scaleX: job.scaleX, scaleY: job.scaleY, axisMode: job.axisMode };
    const isDirect = job.axisMode.startsWith('mh721-direct');
    const cmds = ['IN;SP1;'];

    if (job.includeRefMark) {
      const half = (Number.isFinite(job.ref.crossSizeMm) && job.ref.crossSizeMm > 0 ? job.ref.crossSizeMm : 8) / 2;
      appendCrosshairHPGL(cmds, job.ref.refX, job.ref.refY, half, job.ref, txOpts);
    }

    let curPt = { x: 0, y: 0 };
    for (let i = 0; i < job.contours.length; i++) {
      const contour = job.contours[i];
      const hasCut = Array.isArray(contour.cutPoints) && contour.cutPoints.length >= 2;
      const sourcePts = hasCut ? contour.cutPoints : contour.closedPoints;
      if (!Array.isArray(sourcePts) || sourcePts.length < 2) continue;

      const pts = sourcePts.map(pointXY);
      if (!hasCut) pts.push(pts[0]);

      const hpglPts = pts.map(p => {
        const mapped = transformPointForCut(p.x, p.y, job.ref, txOpts);
        return { x: toHpglUnit(mapped.x), y: toHpglUnit(mapped.y) };
      });

      const start = hpglPts[0];
      const coords = [];
      for (let j = 1; j < hpglPts.length; j++) {
        coords.push(`${hpglPts[j].x},${hpglPts[j].y}`);
      }
      if (coords.length) {
        if (isDirect) {
          pushSteppedMove(cmds, 'PU', curPt, start);
          cmds.push(`PD${start.x},${start.y};`);
          let prev = start;
          for (let j = 1; j < hpglPts.length; j++) {
            pushSteppedMove(cmds, 'PD', prev, hpglPts[j]);
            prev = hpglPts[j];
          }
          cmds.push('PU;');
          curPt = prev;
        } else {
          cmds.push(`PU${start.x},${start.y};PD${coords.join(',')};`);
        }
      }
    }

    if (isDirect) {
      cmds.push('PU;');
      pushSteppedMove(cmds, 'PU', curPt, { x: 0, y: 0 });
    } else {
      cmds.push('PU;PU0,0;');
    }
    return cmds.join('');
  }

  /**
   * Generate pen-up-only HP-GL bounding box path for verifying paper skew and axis direction.
   * @param {object} cutJob
   * @returns {string}
   */
  function generateTestBoxHPGL(cutJob) {
    const job = resolveCutJob(cutJob);
    const bounds = computeUnionBounds(job.contours);
    const txOpts = { scaleX: job.scaleX, scaleY: job.scaleY, axisMode: job.axisMode };
    const isDirect = job.axisMode.startsWith('mh721-direct');
    const cornerPts = [
      [bounds.minX, bounds.minY],
      [bounds.maxX, bounds.minY],
      [bounds.maxX, bounds.maxY],
      [bounds.minX, bounds.maxY],
      [bounds.minX, bounds.minY]
    ].map(([x, y]) => {
      const mapped = transformPointForCut(x, y, job.ref, txOpts);
      return { x: toHpglUnit(mapped.x), y: toHpglUnit(mapped.y) };
    });

    if (isDirect) {
      const cmds = ['IN;SP1;PU0,0;'];
      let cur = { x: 0, y: 0 };
      for (const pt of cornerPts) {
        pushSteppedMove(cmds, 'PU', cur, pt);
        cur = pt;
      }
      pushSteppedMove(cmds, 'PU', cur, { x: 0, y: 0 });
      return cmds.join('');
    }
    return 'IN;SP1;PU0,0;' + cornerPts.map(p => `PU${p.x},${p.y};`).join('') + 'PU0,0;';
  }

  function svgCrosshair(cx, cy, half) {
    return (
      `<path fill="none" stroke="#0055cc" stroke-width="0.25" d="` +
      `M ${formatSvgNum(cx - half)},${formatSvgNum(cy)} L ${formatSvgNum(cx + half)},${formatSvgNum(cy)} ` +
      `M ${formatSvgNum(cx)},${formatSvgNum(cy - half)} L ${formatSvgNum(cx)},${formatSvgNum(cy + half)}"/>`
    );
  }

  /**
   * Generate a flat millimeter-unit SVG with registration marks (#0055cc) and closed cut contours (#ff0000).
   * Never emits overcut tails or nested <svg> tags.
   * @param {object} cutJob
   * @returns {string}
   */
  function generateCutSVG(cutJob) {
    const job = resolveCutJob(cutJob);
    if (!job.pageMm || !Number.isFinite(job.pageMm.width) || !Number.isFinite(job.pageMm.height) || job.pageMm.width <= 0 || job.pageMm.height <= 0) {
      throw new Error('Thiếu kích thước trang pageMm hợp lệ để xuất SVG.');
    }

    const half = (Number.isFinite(job.ref.crossSizeMm) && job.ref.crossSizeMm > 0 ? job.ref.crossSizeMm : 8) / 2;
    const marks = [svgCrosshair(job.ref.refX, job.ref.refY, half)];
    if (job.ref.hasAlignMark && Number.isFinite(job.ref.alignX) && Number.isFinite(job.ref.alignY)) {
      marks.push(svgCrosshair(job.ref.alignX, job.ref.alignY, half));
    }

    const paths = [];
    for (let i = 0; i < job.contours.length; i++) {
      const closed = job.contours[i].closedPoints;
      if (!Array.isArray(closed) || closed.length < 3) continue;
      const cmds = closed.map((raw, idx) => {
        const p = pointXY(raw);
        const sx = job.ref.refX + (p.x - job.ref.refX) * job.scaleX;
        const sy = job.ref.refY + (p.y - job.ref.refY) * job.scaleY;
        return `${idx === 0 ? 'M' : 'L'} ${formatSvgNum(sx)},${formatSvgNum(sy)}`;
      });
      paths.push(`<path fill="none" stroke="#ff0000" stroke-width="0.1" d="${cmds.join(' ')} Z"/>`);
    }

    const wStr = formatSvgNum(job.pageMm.width);
    const hStr = formatSvgNum(job.pageMm.height);
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${wStr}mm" height="${hStr}mm" viewBox="0 0 ${wStr} ${hStr}">\n` +
      `  <g id="registration-marks" fill="none" stroke="#0055cc" stroke-width="0.25">\n    ${marks.join('\n    ')}\n  </g>\n` +
      `  <g id="cut-contours" fill="none" stroke="#ff0000" stroke-width="0.1">\n    ${paths.join('\n    ')}\n  </g>\n` +
      `</svg>`
    );
  }

  return {
    dilateMask,
    erodeMask,
    offsetMask,
    fillHoles,
    applyOvercut,
    extractOuterContours,
    sortContoursTopLeft,
    computeCutReference,
    transformPointForCut,
    generateHPGL,
    generateTestBoxHPGL,
    generateCutSVG
  };
});
