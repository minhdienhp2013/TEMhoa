'use strict';

const assert = require('node:assert/strict');
const C = require('../cloud-cut-core.js');

function makeMask(w, h, fn) {
  const m = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (fn(x, y)) m[y * w + x] = 255;
    }
  }
  return m;
}

function bruteForceDilate(mask, w, h, radiusPx) {
  const out = new Uint8Array(w * h);
  const r2 = radiusPx * radiusPx;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let hit = false;
      for (let sy = 0; sy < h && !hit; sy++) {
        for (let sx = 0; sx < w; sx++) {
          if (!mask[sy * w + sx]) continue;
          const dx = x - sx;
          const dy = y - sy;
          if (dx * dx + dy * dy <= r2) {
            hit = true;
            break;
          }
        }
      }
      if (hit) out[y * w + x] = 255;
    }
  }
  return out;
}

function bruteForceErode(mask, w, h, radiusPx) {
  const out = new Uint8Array(w * h);
  const r2 = radiusPx * radiusPx;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let keep = true;
      for (let sy = -1; sy <= h && keep; sy++) {
        for (let sx = -1; sx <= w; sx++) {
          const inside = sx >= 0 && sx < w && sy >= 0 && sy < h;
          const val = inside ? mask[sy * w + sx] : 0;
          if (val) continue;
          const dx = x - sx;
          const dy = y - sy;
          if (dx * dx + dy * dy <= r2) {
            keep = false;
            break;
          }
        }
      }
      if (keep) out[y * w + x] = 255;
    }
  }
  return out;
}

function signedAreaScreen(pts) {
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum * 0.5;
}

function polylineLength(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return len;
}

// 1. dilateMask tests
{
  const single = makeMask(9, 9, (x, y) => x === 4 && y === 4);
  const d15 = C.dilateMask(single, 9, 9, 1.5);
  // Diagonal neighbor (3,3) is distance sqrt(2) <= 1.5; axis-2 neighbor (2,4) is distance 2 > 1.5
  assert.equal(d15[3 * 9 + 3], 255);
  assert.equal(d15[4 * 9 + 2], 0);
  assert.deepEqual(d15, bruteForceDilate(single, 9, 9, 1.5));

  // Multi-point brute-force verification
  const multi = makeMask(25, 25, (x, y) =>
    (x === 4 && y === 5) ||
    (x >= 10 && x <= 14 && y >= 10 && y <= 13) ||
    (x === 24 && y === 24)
  );
  assert.deepEqual(C.dilateMask(multi, 25, 25, 2.5), bruteForceDilate(multi, 25, 25, 2.5));

  // Non-255 input with radius 0 normalizes to binary 0/255
  const gray = new Uint8Array([0, 1, 128, 255]);
  assert.deepEqual(C.dilateMask(gray, 2, 2, 0), new Uint8Array([0, 255, 255, 255]));

  // Empty mask stays empty even for huge radius
  const empty = new Uint8Array(100);
  assert.deepEqual(C.dilateMask(empty, 10, 10, 100000), empty);
}

// 2. erodeMask & offsetMask tests
{
  // Full solid 10x10 block touching all edges must erode inward by 2px on every side
  const full = makeMask(10, 10, () => true);
  const eroded = C.erodeMask(full, 10, 10, 2);
  const expected = makeMask(10, 10, (x, y) => x >= 2 && x <= 7 && y >= 2 && y <= 7);
  assert.deepEqual(eroded, expected);

  // Brute-force check with fractional radius & edge-touching block
  const shapes = makeMask(20, 20, (x, y) =>
    (x <= 6 && y <= 6) ||
    (x >= 10 && x <= 17 && y >= 8 && y <= 15)
  );
  assert.deepEqual(C.erodeMask(shapes, 20, 20, 1.5), bruteForceErode(shapes, 20, 20, 1.5));
  assert.deepEqual(C.erodeMask(shapes, 20, 20, 0), shapes);

  // offsetMask dispatches +, -, and 0 cleanly
  assert.deepEqual(C.offsetMask(shapes, 20, 20, 2), C.dilateMask(shapes, 20, 20, 2));
  assert.deepEqual(C.offsetMask(shapes, 20, 20, -2), C.erodeMask(shapes, 20, 20, 2));
  const copy = C.offsetMask(shapes, 20, 20, 0);
  assert.deepEqual(copy, shapes);
  copy[0] = 0;
  assert.equal(shapes[0], 255, 'offsetMask(0) returns an independent copy');
}

// 3. fillHoles tests
{
  // Ring with enclosed hole AND open U-bay touching bottom edge
  const w = 14, h = 14;
  const mask = makeMask(w, h, (x, y) => {
    const inRing = x >= 2 && x <= 7 && y >= 2 && y <= 7 && !(x >= 4 && x <= 5 && y >= 4 && y <= 5);
    const inEdgeU = (x === 9 || x === 12) && y >= 10 || (y === 10 && x >= 9 && x <= 12);
    return inRing || inEdgeU;
  });
  const snapshot = mask.slice();
  const filled = C.fillHoles(mask, w, h);
  assert.deepEqual(mask, snapshot, 'fillHoles does not mutate input mask');
  assert.equal(filled[4 * w + 4], 255, 'enclosed interior hole is filled');
  assert.equal(filled[5 * w + 5], 255, 'enclosed interior hole is filled');
  assert.equal(filled[12 * w + 10], 0, 'edge-connected U bay remains background');
}

// 4. extractOuterContours tests
{
  // Exact rectangle: 100x60 px at 10 px/mm => 10x6 mm
  const w = 140, h = 100;
  const rectMask = makeMask(w, h, (x, y) => x >= 20 && x < 120 && y >= 10 && y < 70);
  const contours = C.extractOuterContours(rectMask, w, h, {
    pxPerMm: 10,
    originXMm: 15,
    originYMm: 20,
    simplifyMm: 0.08,
    minAreaMm2: 1.5,
    overcutMm: 0.6,
    smoothCorners: false
  });
  assert.equal(contours.length, 1);
  const c = contours[0];
  assert.deepEqual(c.bounds, { minX: 17, minY: 21, maxX: 27, maxY: 27, width: 10, height: 6 });
  assert.equal(c.areaMm2, 60);
  assert.equal(c.closedPoints.length, 4);
  assert.deepEqual(c.closedPoints[0], { x: 17, y: 21 }, 'starts at top-left vertex');
  assert.deepEqual(c.closedPoints[1], { x: 27, y: 21 }, 'travels left-to-right along top edge (CW in screen coords)');
  assert.ok(signedAreaScreen(c.closedPoints) > 0, 'CW winding in screen coordinates');

  // Verify applyOvercut closes loop and continues 0.6 mm along top edge
  assert.equal(c.cutPoints.length, 6);
  assert.deepEqual(c.cutPoints[4], { x: 17, y: 21 });
  assert.ok(Math.abs(c.cutPoints[5].x - 17.6) < 1e-9);
  assert.ok(Math.abs(c.cutPoints[5].y - 21) < 1e-9);

  // Donut mask must produce ONLY 1 outer silhouette (inner hole filled automatically)
  const donut = makeMask(120, 120, (x, y) => {
    const outer = x >= 20 && x < 100 && y >= 20 && y < 100;
    const inner = x >= 40 && x < 80 && y >= 40 && y < 80;
    return outer && !inner;
  });
  const donutContours = C.extractOuterContours(donut, 120, 120, { pxPerMm: 10, smoothCorners: false });
  assert.equal(donutContours.length, 1);
  assert.equal(donutContours[0].areaMm2, 64);

  // Diagonal touch (NW+SE and NE+SW squares touching at vertex) + tiny 2x2 speck
  const diagNWSE = makeMask(100, 100, (x, y) =>
    (x >= 20 && x < 40 && y >= 20 && y < 40) ||
    (x >= 40 && x < 60 && y >= 40 && y < 60) ||
    (x >= 80 && x < 82 && y >= 80 && y < 82)
  );
  const diagContours = C.extractOuterContours(diagNWSE, 100, 100, {
    pxPerMm: 10,
    minAreaMm2: 1.5,
    smoothCorners: false
  });
  assert.equal(diagContours.length, 2, 'two NW-SE diagonally touching squares traced cleanly, speck filtered');
  assert.equal(diagContours[0].areaMm2, 4);
  assert.equal(diagContours[1].areaMm2, 4);

  const diagNESW = makeMask(100, 100, (x, y) =>
    (x >= 40 && x < 60 && y >= 20 && y < 40) ||
    (x >= 20 && x < 40 && y >= 40 && y < 60)
  );
  const diagNESWContours = C.extractOuterContours(diagNESW, 100, 100, {
    pxPerMm: 10,
    minAreaMm2: 1.5,
    smoothCorners: false
  });
  assert.equal(diagNESWContours.length, 2, 'two NE-SW diagonally touching squares traced cleanly');
  assert.equal(diagNESWContours[0].areaMm2, 4);
  assert.equal(diagNESWContours[1].areaMm2, 4);

  // Checkerboard single-pixel diagonal touch
  const checker = makeMask(4, 4, (x, y) => (x === 1 && y === 1) || (x === 2 && y === 2));
  const checkerContours = C.extractOuterContours(checker, 4, 4, {
    pxPerMm: 1,
    minAreaMm2: 0.5,
    simplifyMm: 0,
    smoothCorners: false
  });
  assert.equal(checkerContours.length, 2);
  assert.equal(checkerContours[0].areaMm2, 1);
  assert.equal(checkerContours[1].areaMm2, 1);

  // Corner smoothing & offsetPx & multi-segment overcut on circular/staircase sticker
  const circleMask = makeMask(200, 200, (x, y) => {
    const dx = x - 100;
    const dy = y - 100;
    return dx * dx + dy * dy <= 40 * 40;
  });
  const smoothContours = C.extractOuterContours(circleMask, 200, 200, {
    pxPerMm: 5,
    offsetPx: 5,
    simplifyMm: 0.08,
    overcutMm: 0.6,
    smoothCorners: true
  });
  assert.equal(smoothContours.length, 1);
  const sc = smoothContours[0];
  assert.ok(sc.closedPoints.length > 16, 'smoothed silhouette keeps curve fidelity');
  assert.ok(signedAreaScreen(sc.closedPoints) > 0, 'smoothed contour remains CW');
  assert.ok(sc.bounds.width > 17 && sc.bounds.width < 19, '40px radius + 5px dilate => ~18mm diameter');
  // Check overcut length past loop closure equals 0.6 mm even across short segments
  const loopCloseIdx = sc.closedPoints.length;
  assert.deepEqual(sc.cutPoints[loopCloseIdx], sc.closedPoints[0]);
  const overcutSegmentLen = polylineLength(sc.cutPoints.slice(loopCloseIdx));
  assert.ok(Math.abs(overcutSegmentLen - 0.6) < 1e-6);

  // Empty mask returns empty array
  assert.deepEqual(C.extractOuterContours(new Uint8Array(400), 20, 20, { pxPerMm: 10 }), []);

  // Corner smoothing on sharp rectangle produces short ~0.12-0.2mm corner segments and preserves bounds
  const sharpSmoothed = C.extractOuterContours(rectMask, w, h, {
    pxPerMm: 10,
    originXMm: 0,
    originYMm: 0,
    overcutMm: 0.6,
    smoothCorners: true
  });
  assert.equal(sharpSmoothed.length, 1);
  const ss = sharpSmoothed[0];
  assert.equal(ss.bounds.minX, 2);
  assert.equal(ss.bounds.minY, 1);
  assert.equal(ss.bounds.maxX, 12);
  assert.equal(ss.bounds.maxY, 7);
  assert.ok(ss.closedPoints.length > 4, 'corner smoothing subdivides sharp corners');
  const cornerSegLengths = [];
  for (let i = 1; i < ss.closedPoints.length; i++) {
    const d = Math.hypot(ss.closedPoints[i].x - ss.closedPoints[i - 1].x, ss.closedPoints[i].y - ss.closedPoints[i - 1].y);
    if (d < 1) cornerSegLengths.push(d);
  }
  assert.ok(cornerSegLengths.length >= 8);
  assert.ok(cornerSegLengths.every(d => d >= 0.1 && d <= 0.21), 'corner segments are ~0.12-0.20 mm');
  assert.throws(() => C.extractOuterContours(rectMask, w, h, { pxPerMm: 0 }));
}

// 5. sortContoursTopLeft tests (including non-transitive stagger trap)
{
  const fake = (id, minX, minY) => ({ id, bounds: { minX, minY, maxX: minX + 10, maxY: minY + 10, width: 10, height: 10 } });
  const input = [
    fake('r2-right', 80, 58),
    fake('r1-mid', 50, 18),
    fake('r1-right', 90, 10),
    fake('r2-left', 12, 55),
    fake('r1-left', 10, 21)
  ];
  const sorted = C.sortContoursTopLeft(input, 12);
  assert.deepEqual(
    sorted.map(x => x.id),
    ['r1-left', 'r1-mid', 'r1-right', 'r2-left', 'r2-right']
  );
  // Input array remains unmutated
  assert.equal(input[0].id, 'r2-right');
}

// 6. computeCutReference tests
{
  assert.throws(() => C.computeCutReference([], { width: 210, height: 297 }), /Không có đường cắt/);

  const c1 = { bounds: { minX: 20, minY: 15, maxX: 60, maxY: 45, width: 40, height: 30 } };
  const c2 = { bounds: { minX: 80, minY: 20, maxX: 120, maxY: 65, width: 40, height: 45 } };
  const ref = C.computeCutReference([c1, c2], { width: 210, height: 297 });
  assert.equal(ref.refX, 17);
  assert.equal(ref.refY, 12);
  assert.equal(ref.alignX, 123);
  assert.equal(ref.alignY, 12);
  assert.equal(ref.hasAlignMark, true);
  assert.deepEqual(ref.bounds, { minX: 20, minY: 15, maxX: 120, maxY: 65, width: 100, height: 50 });

  // Safe edge clamping near top-left & narrow label forcing min +30 alignX
  const edgeLabel = { bounds: { minX: 2, minY: 1, maxX: 12, maxY: 11, width: 10, height: 10 } };
  const refEdge = C.computeCutReference([edgeLabel], { width: 210, height: 297 });
  assert.equal(refEdge.refX, 4);
  assert.equal(refEdge.refY, 4);
  assert.equal(refEdge.alignX, 34);
  assert.equal(refEdge.hasAlignMark, true);

  // Page too narrow for align mark (>= 30mm from refX within safeEdge)
  const rightEdge = { bounds: { minX: 70, minY: 10, maxX: 90, maxY: 30, width: 20, height: 20 } };
  const refNarrow = C.computeCutReference([rightEdge], { width: 100, height: 100 });
  assert.equal(refNarrow.hasAlignMark, false);
}

// 7. transformPointForCut tests (all 5 axis modes + calibration scale + zero check)
{
  const ref = { refX: 10, refY: 20 };
  assert.deepEqual(C.transformPointForCut(10, 20, ref), { x: 0, y: 0 });
  assert.deepEqual(
    C.transformPointForCut(25, 40, ref, { scaleX: 1.1, scaleY: 0.9, axisMode: 'artcut-cartesian' }),
    { x: 16.5, y: -18 }
  );
  assert.deepEqual(
    C.transformPointForCut(25, 40, ref, { axisMode: 'screen-down' }),
    { x: 15, y: 20 }
  );
  assert.deepEqual(
    C.transformPointForCut(25, 40, ref, { axisMode: 'mh721-direct-180' }),
    { x: 20, y: -15 }
  );
  assert.deepEqual(
    C.transformPointForCut(25, 40, ref, { axisMode: 'mh721-direct-pos' }),
    { x: 20, y: 15 }
  );
  assert.deepEqual(
    C.transformPointForCut(25, 40, ref, { axisMode: 'mh721-direct-90cw' }),
    { x: 15, y: -20 }
  );
  assert.deepEqual(
    C.transformPointForCut(25, 40, ref, { axisMode: 'mh721-direct-xy' }),
    { x: -15, y: 20 }
  );
  assert.throws(() => C.transformPointForCut(25, 40, ref, { axisMode: 'unknown' }));
}

// 8. generateHPGL, generateTestBoxHPGL, generateCutSVG tests
{
  const square = {
    closedPoints: [
      { x: 10, y: 10 },
      { x: 20, y: 10 },
      { x: 20, y: 20 },
      { x: 10, y: 20 }
    ],
    cutPoints: [
      { x: 10, y: 10 },
      { x: 20, y: 10 },
      { x: 20, y: 20 },
      { x: 10, y: 20 },
      { x: 10, y: 10 },
      { x: 10.5, y: 10 }
    ],
    bounds: { minX: 10, minY: 10, maxX: 20, maxY: 20, width: 10, height: 10 },
    areaMm2: 100
  };
  const pageMm = { width: 210, height: 297 };
  const ref = C.computeCutReference([square], pageMm); // refX=7, refY=7, alignX=37

  const hpgl = C.generateHPGL({ contours: [square], ref, pageMm, axisMode: 'artcut-cartesian' });
  assert.ok(hpgl.startsWith('IN;SP1;'));
  assert.ok(hpgl.endsWith('PU;PU0,0;'));
  // (10-7)*40 = 120, -(10-7)*40 = -120; (20-7)*40 = 520, (10.5-7)*40 = 140
  assert.ok(hpgl.includes('PU120,-120;PD520,-120,520,-520,120,-520,120,-120,140,-120;'));

  const hpglWithMark = C.generateHPGL({
    contours: [square],
    ref,
    pageMm,
    axisMode: 'screen-down',
    includeRefMark: true
  });
  assert.ok(hpglWithMark.includes('PU-160,0;PD160,0;PU0,-160;PD0,160;'));

  // Fallback when cutPoints is absent still closes loop
  const noCutPtsContour = { closedPoints: square.closedPoints, bounds: square.bounds };
  const hpglFallback = C.generateHPGL({ contours: [noCutPtsContour], ref, pageMm, axisMode: 'screen-down' });
  assert.ok(hpglFallback.includes('PU120,120;PD520,120,520,520,120,520,120,120;'));

  // TestBoxHPGL: pen-up only, zero PD commands; direct MH721 mode starts with SP1;PA;PU0,0; (no IN;) and negative Y for carriage
  const testBox = C.generateTestBoxHPGL({ contours: [square], ref, pageMm, axisMode: 'mh721-direct-180' });
  assert.ok(testBox.startsWith('SP1;PA;PU0,0;'));
  assert.ok(!testBox.includes('IN;'));
  assert.ok(testBox.endsWith('PU0,0;'));
  assert.ok(!testBox.includes('PD'), 'Test box HPGL must never lower the blade (no PD)');
  assert.equal(testBox, 'SP1;PA;PU0,0;PU120,-120;PU120,-520;PU520,-520;PU520,-120;PU120,-120;PU0,0;');

  const hpglDirect = C.generateHPGL({ contours: [square], ref, pageMm, axisMode: 'mh721-direct-180' });
  assert.ok(hpglDirect.startsWith('SP1;PA;PU120,-120;PD120,-120;'));
  assert.ok(!hpglDirect.includes('IN;'));
  assert.ok(!hpglDirect.includes('\r') && !hpglDirect.includes('\n'), 'Direct HP-GL must not contain CRLF between PD commands');

  // generateCutSVG: flat single <svg>, registration marks (#0055cc), closedPoints only (#ff0000), scaled around ref
  const svg = C.generateCutSVG({ contours: [square], ref, pageMm, scaleX: 1.05, scaleY: 1.0 });
  assert.equal((svg.match(/<svg\b/g) || []).length, 1, 'single flat <svg> without nested <svg>');
  assert.ok(svg.includes('width="210mm" height="297mm" viewBox="0 0 210 297"'));
  assert.ok(svg.includes('<g id="registration-marks"'));
  assert.ok(svg.includes('#0055cc'));
  assert.ok(svg.includes('stroke-width="0.25"'));
  assert.ok(svg.includes('<g id="cut-contours"'));
  assert.ok(svg.includes('#ff0000'));
  assert.ok(svg.includes('stroke-width="0.1"'));
  // Scaled X of 10 around refX=7 with scaleX=1.05 => 7 + 3*1.05 = 10.15; X of 20 => 7 + 13*1.05 = 20.65
  assert.ok(svg.includes('M 10.15,10 L 20.65,10 L 20.65,20 L 10.15,20 Z'));
  // Overcut point (10.5) must NOT appear in SVG
  assert.ok(!svg.includes('10.675') && !svg.includes('10.5,'));
  // Align mark present at (37, 7) => horizontal arm from 33..41 at y=7
  assert.ok(svg.includes('M 33,7 L 41,7'));

  // SVG without align mark draws only 1 crosshair
  const refSingle = C.computeCutReference([square], pageMm, { includeAlignMark: false });
  const svgSingle = C.generateCutSVG({ contours: [square], ref: refSingle, pageMm });
  const marksSection = svgSingle.slice(
    svgSingle.indexOf('<g id="registration-marks"'),
    svgSingle.indexOf('</g>')
  );
  assert.equal((marksSection.match(/<path\b/g) || []).length, 1);

  // Multi-contour test box uses union bounding box
  const square2 = {
    closedPoints: [
      { x: 30, y: 25 },
      { x: 45, y: 25 },
      { x: 45, y: 40 },
      { x: 30, y: 40 }
    ],
    bounds: { minX: 30, minY: 25, maxX: 45, maxY: 40, width: 15, height: 15 }
  };
  const multiBox = C.generateTestBoxHPGL({
    contours: [square, square2],
    ref,
    pageMm,
    axisMode: 'artcut-cartesian'
  });
  // Union bounds: x=[10..45], y=[10..40]; relative to ref=(7,7): dx=[3..38]->[120..1520], -dy=[-3..-33]->[-120..-1320]
  assert.equal(
    multiBox,
    'IN;SP1;PU0,0;PU120,-120;PU1520,-120;PU1520,-1320;PU120,-1320;PU120,-120;PU0,0;'
  );

  // Invalid cutJob inputs throw cleanly
  assert.throws(() => C.generateHPGL({ contours: [], ref, pageMm }));
  assert.throws(() => C.generateTestBoxHPGL({ contours: [], ref, pageMm }));
  assert.throws(() => C.generateCutSVG({ contours: [square], ref }));
}

console.log('PASS cloud-cut-core: morphology, hole filling, outer contour tracing, smoothing, overcut, sorting, reference marks, axis transforms, HP-GL & SVG');
