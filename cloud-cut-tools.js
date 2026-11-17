/* Tem May · Cat may MH721 workflow, print border hiding, registration crosshairs, and HP-GL/SVG/COM export. */
(() => {
  'use strict';

  if (typeof $ !== 'function' || !window.TemCloudCutCore) return;
  const Core = window.TemCloudCutCore;

  const AXIS_MODES = new Set([
    'artcut-cartesian',
    'mh721-direct-180',
    'mh721-direct-90cw',
    'mh721-direct-xy',
    'screen-down'
  ]);

  const AXIS_OPTIONS = [
    ['mh721-direct-180', 'Cắt thẳng MH721 (mặc định) · Xoay giấy 180° (trục +X/+Y dương)'],
    ['mh721-direct-90cw', 'Cắt thẳng MH721 · Xoay 90° theo chiều kim đồng hồ (trục +X/+Y dương)'],
    ['mh721-direct-xy', 'Cắt thẳng MH721 · Gốc trên-trái (-X sang phải, +Y xuống)'],
    ['artcut-cartesian', 'Phần mềm cắt ngoài (Artcut / SignMaster / Corel) · Gốc + trên-trái'],
    ['screen-down', 'Tọa độ màn hình (+X phải, +Y xuống)']
  ];

  const CLOUD_CUT_DEFAULTS = {
    cloudCutMode: false,
    cloudCutHideBorder: true,
    cloudCutCrosshair: true,
    cloudCutAlignMark: true,
    cloudCutMarginMm: '3',
    cloudCutOffsetMm: '0',
    cloudCutOvercutMm: '0.6',
    cloudCutScaleX: '100',
    cloudCutScaleY: '100',
    cloudCutAxisMode: 'mh721-direct-180',
    cloudCutCrossSizeMm: '8'
  };

  const COM_PREF_KEY = 'temhoa-mh721-com';

  function readComPref() {
    try {
      const parsed = JSON.parse(localStorage.getItem(COM_PREF_KEY) || 'null');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveComPref(partial) {
    try {
      const next = { ...readComPref(), ...partial };
      localStorage.setItem(COM_PREF_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota or private browsing errors.
    }
  }

  const CLOUD_CUT_KEYS = Object.keys(CLOUD_CUT_DEFAULTS);
  const CLOUD_CUT_DOC_KEYS = CLOUD_CUT_KEYS.filter(key => key !== 'cloudCutMode');

  function syncCutSettingsAcrossLabels() {
    if (!Array.isArray(labels) || !isCloudCutDocument()) return;
    const shared = {};
    for (const key of CLOUD_CUT_DOC_KEYS) {
      const node = $(key);
      if (!node) continue;
      shared[key] = node.type === 'checkbox' ? node.checked : node.value;
    }
    for (const label of labels) {
      if (label && label.settings && typeof label.settings === 'object') {
        Object.assign(label.settings, shared);
      }
    }
  }

  const clampNum = (raw, min, max, fallback) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  };

  /* ------------------------------------------------------------------
   * 1. Document state controls in `ids` & clean reset on setLabelSettings
   * ------------------------------------------------------------------ */
  const stateHost = document.createElement('div');
  stateHost.id = 'cloudCutStateInputs';
  stateHost.hidden = true;
  stateHost.setAttribute('aria-hidden', 'true');

  for (const [id, def] of Object.entries(CLOUD_CUT_DEFAULTS)) {
    if (id === 'cloudCutAxisMode') {
      const sel = document.createElement('select');
      sel.id = id;
      for (const [value, label] of AXIS_OPTIONS) sel.add(new Option(label, value));
      sel.value = def;
      stateHost.append(sel);
    } else if (typeof def === 'boolean') {
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = id;
      cb.checked = def;
      stateHost.append(cb);
    } else {
      const num = document.createElement('input');
      num.type = 'number';
      num.id = id;
      num.value = def;
      stateHost.append(num);
    }
    if (!ids.includes(id)) ids.push(id);
  }
  document.body.append(stateHost);

  function applyCloudCutDefaults() {
    for (const [id, def] of Object.entries(CLOUD_CUT_DEFAULTS)) {
      const node = $(id);
      if (!node) continue;
      if (node.type === 'checkbox') node.checked = def === true;
      else node.value = String(def);
    }
  }

  function isCloudCutDocument() {
    return (
      (Array.isArray(labels) && labels.some(l => l?.settings?.cloudCutMode === true)) ||
      Boolean($('cloudCutMode')?.checked)
    );
  }

  const prevSetLabelSettings = setLabelSettings;
  setLabelSettings = function (value, ui = false) {
    const data = value && typeof value === 'object' ? value : {};
    applyCloudCutDefaults();
    if (data.cloudCutMode === true) {
      const res = prevSetLabelSettings(data, ui);
      if ($('cloudCutAxisMode') && !AXIS_MODES.has($('cloudCutAxisMode').value)) {
        $('cloudCutAxisMode').value = CLOUD_CUT_DEFAULTS.cloudCutAxisMode;
      }
      return res;
    }
    const clean = { ...data };
    for (const key of CLOUD_CUT_KEYS) delete clean[key];
    return prevSetLabelSettings(clean, ui);
  };

  const prevAutoName = autoName;
  autoName = function () {
    const name = prevAutoName();
    if (isCloudCutDocument()) {
      return name.replace(/^Tem (?:mây|thường) /, 'Tem cắt máy ');
    }
    return name;
  };

  /* ------------------------------------------------------------------
   * 2. Separate Home Gallery section (#temHome)
   * ------------------------------------------------------------------ */
  const scissorsIcon =
    '<svg class="artIcon" viewBox="0 0 24 24" aria-hidden="true">' +
    '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>' +
    '<path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/></svg>';

  function isCloudCutTemplate(template) {
    const s = template?.settings;
    if (!s) return false;
    if (s.cloudCutMode === true) return true;
    return Array.isArray(s.labels) && s.labels.some(l => l?.cloudCutMode === true || l?.settings?.cloudCutMode === true);
  }

  function isCloudCutEntry(entry) {
    if (!entry) return false;
    if (typeof entry.fileName === 'string' && entry.fileName.startsWith('Tem cắt máy ')) return true;
    if (typeof entry.name === 'string' && entry.name.startsWith('Tem cắt máy ')) return true;
    return isCloudCutTemplate(entry.template);
  }

  function syncCloudCutEntry(entry) {
    if (!entry || !isCloudCutEntry(entry)) return;
    entry.type = 'cloud-cut';
    const caption = entry.card?.querySelector('small');
    if (caption) caption.textContent = 'Cắt máy MH721 · Mẫu đã lưu';
  }

  async function createCloudCutTemplate() {
    if (homeBusy) return;
    homeBusy = true;
    homeLoadRevision++;
    try {
      await flushAutoSave();
      autoSuspended++;
      try {
        await homeLoadTask;
        designEditing = false;
        const data = {
          ...copyLabelData(homeBaseSettings),
          page: 'landscape',
          designKind: 'cloud',
          wordFrame: '',
          text: 'Nhập nội dung tem',
          richHTML: '<div>Nhập nội dung tem</div>',
          decorations: [],
          lineStyles: [],
          layerStack: '{}',
          labelGroup: '',
          textOffsetX: 0,
          textOffsetY: 0,
          labelX: '',
          labelY: '',
          labelScaleX: 1,
          labelScaleY: 1,
          padding: Math.max(24, Number(homeBaseSettings.padding) || 40),
          border: Math.max(0.3, Number(homeBaseSettings.border) || 0.35),
          editLayer: 'text',
          colorStyles: { fill: { type: 'solid' }, body: { type: 'solid' }, edge: { type: 'solid' } },
          ...CLOUD_CUT_DEFAULTS,
          cloudCutMode: true
        };
        currentTemplateName = '';
        await restoreLabelDocument(data);
        recordHistory();
        enterHomeEditor();
        zoom();
        const range = document.createRange();
        range.selectNodeContents($('temEditor'));
        const selection = getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        captureSelection();
        $('status').textContent =
          'Tem cắt máy MH721: mặc định Ẩn viền khi in + sẵn sàng cắt trực tiếp qua cổng COM (Windows).';
        if (home.hidden) beginAutoDocument('', false);
      } finally {
        autoSuspended--;
        captureAutoChanges();
      }
    } catch (error) {
      $('homeStatus').textContent = error.message;
    } finally {
      homeBusy = false;
    }
  }

  const addThemeButton = $('homeAddTheme');
  if (addThemeButton && !home.querySelector('[data-home-type="cloud-cut"]')) {
    const cutFilterBtn = document.createElement('button');
    cutFilterBtn.type = 'button';
    cutFilterBtn.dataset.homeType = 'cloud-cut';
    cutFilterBtn.setAttribute('aria-pressed', 'false');
    const iconSpan = document.createElement('span');
    iconSpan.className = 'homeTypeIcon';
    iconSpan.innerHTML = scissorsIcon;
    cutFilterBtn.append(iconSpan, document.createTextNode('Cắt máy MH721'));
    cutFilterBtn.onclick = () => {
      homeType = 'cloud-cut';
      filterHome();
    };
    addThemeButton.before(cutFilterBtn);
  }

  const homeContinueBtn = $('homeContinue');
  if (homeContinueBtn && !$('homeCreateCloudCut')) {
    const createCutBtn = document.createElement('button');
    createCutBtn.type = 'button';
    createCutBtn.id = 'homeCreateCloudCut';
    createCutBtn.textContent = '✂ Tạo Tem cắt máy MH721';
    createCutBtn.onclick = () => createCloudCutTemplate();
    homeContinueBtn.before(createCutBtn);
  }

  const addTemplateBtn = $('homeAddTemplate');
  if (addTemplateBtn) {
    const prevAddTemplateClick = addTemplateBtn.onclick;
    addTemplateBtn.onclick = () => {
      if (homeType === 'cloud-cut') return createCloudCutTemplate();
      return prevAddTemplateClick
        ? prevAddTemplateClick()
        : homeType === 'cloud'
          ? createCloudTemplate()
          : createBlankDesign(false);
    };
  }

  const prevAddHomeCard = addHomeCard;
  addHomeCard = function (entry, previewHtml) {
    if (isCloudCutEntry(entry)) entry.type = 'cloud-cut';
    const created = prevAddHomeCard(entry, previewHtml);
    syncCloudCutEntry(created);
    return created;
  };

  const prevFilterHome = filterHome;
  filterHome = function (...args) {
    for (const entry of homeEntries) syncCloudCutEntry(entry);
    const res = prevFilterHome(...args);
    if (homeType === 'cloud-cut') {
      $('homeHeading').textContent = 'Mẫu Tem mây · Cắt máy MH721';
    }
    const card = $('homeAddTemplate');
    if (card && homeType === 'cloud-cut') {
      const small = card.querySelector('small');
      if (small) small.textContent = 'Tem mây ẩn viền khi in · xuất cắt MH721';
      card.title = 'Tạo mẫu Tem cắt máy MH721 mới';
    }
    return res;
  };

  const prevLoadHomeSaved = loadHomeSaved;
  loadHomeSaved = async function (...args) {
    const res = await prevLoadHomeSaved(...args);
    for (const entry of homeEntries) syncCloudCutEntry(entry);
    filterHome();
    return res;
  };

  $('homeSearch').oninput = filterHome;

  /* ------------------------------------------------------------------
   * 3. Cloud Outer Contour Extraction (uniform 8 px/mm = 203 DPI)
   * ------------------------------------------------------------------ */
  function readCutParams(opts = {}) {
    const rawAxis = opts.axisMode ?? $('cloudCutAxisMode')?.value;
    return {
      marginMm: clampNum(opts.marginMm ?? $('cloudCutMarginMm')?.value, 0, 30, 3),
      offsetMm: clampNum(opts.offsetMm ?? $('cloudCutOffsetMm')?.value, -2, 2, 0),
      overcutMm: clampNum(opts.overcutMm ?? $('cloudCutOvercutMm')?.value, 0, 2, 0.6),
      scaleX: clampNum(opts.scaleXPercent ?? $('cloudCutScaleX')?.value, 90, 110, 100) / 100,
      scaleY: clampNum(opts.scaleYPercent ?? $('cloudCutScaleY')?.value, 90, 110, 100) / 100,
      axisMode: AXIS_MODES.has(rawAxis) ? rawAxis : 'mh721-direct-180',
      crossSizeMm: clampNum(opts.crossSizeMm ?? $('cloudCutCrossSizeMm')?.value, 3, 20, 8),
      includeAlignMark:
        opts.includeAlignMark !== undefined
          ? Boolean(opts.includeAlignMark)
          : Boolean($('cloudCutAlignMark')?.checked)
    };
  }

  function extractCurrentDomLabelContours(labelSettings, transform, params, pxPerMm) {
    if (!editorText().trim() && !decorations.length) return [];

    const L = layout();
    const cm = number('width', 3, textWidthLimit()) * L.width / (L.baseWidth || L.width);
    const outW = Math.ceil(L.width * Math.min(8, 5000 / L.width, 3500 / L.height));
    const outH = Math.max(1, Math.round((outW / L.width) * L.height));
    const s = outW / L.width;
    const heightCm = (cm * outH) / outW;

    const textCanvas = cv(outW, outH);
    const tc = textCanvas.getContext('2d');
    drawText(tc, L, s, '#ffffff');
    const rgba = tc.getImageData(0, 0, outW, outH).data;
    const alpha = new Uint8Array(outW * outH);
    for (let i = 0; i < alpha.length; i++) {
      alpha[i] = rgba[i * 4 + 3] > 30 ? 255 : 0;
    }

    const inner = Core.fillHoles(Core.dilateMask(alpha, outW, outH, L.pad * s), outW, outH);
    const outer = Core.fillHoles(Core.dilateMask(inner, outW, outH, L.border * s), outW, outH);

    const outerCanvas = cv(outW, outH);
    const octx = outerCanvas.getContext('2d');
    const oimg = octx.createImageData(outW, outH);
    for (let i = 0; i < outer.length; i++) {
      if (outer[i]) {
        const p = i * 4;
        oimg.data[p] = 255;
        oimg.data[p + 1] = 255;
        oimg.data[p + 2] = 255;
        oimg.data[p + 3] = 255;
      }
    }
    octx.putImageData(oimg, 0, 0);

    const sx = Number(labelSettings.labelScaleX || 1);
    const sy = Number(labelSettings.labelScaleY || 1);
    const geom = labelGeometry({ settings: labelSettings, size: { cm, heightCm, L } });
    const boxXMm = (transform.x + geom.x * transform.scale) * 10;
    const boxYMm = (transform.y + geom.y * transform.scale) * 10;
    const boxWMm = cm * sx * transform.scale * 10;
    const boxHMm = heightCm * sy * transform.scale * 10;
    const angle = Number(labelSettings.labelAngle) || 0;
    const cxMm = boxXMm + boxWMm / 2;
    const cyMm = boxYMm + boxHMm / 2;
    const rad = (angle * Math.PI) / 180;
    const rotHalfW = Math.abs((boxWMm / 2) * Math.cos(rad)) + Math.abs((boxHMm / 2) * Math.sin(rad));
    const rotHalfH = Math.abs((boxWMm / 2) * Math.sin(rad)) + Math.abs((boxHMm / 2) * Math.cos(rad));
    // Extra millimeter margin guarantees outward offset dilation never clips on the offscreen mask canvas.
    const padMm = Math.max(2, Math.abs(params.offsetMm) + 2);
    const originXMm = cxMm - rotHalfW - padMm;
    const originYMm = cyMm - rotHalfH - padMm;
    const cw = Math.max(1, Math.ceil((rotHalfW * 2 + padMm * 2) * pxPerMm));
    const ch = Math.max(1, Math.ceil((rotHalfH * 2 + padMm * 2) * pxPerMm));
    if (cw > 8000 || ch > 8000 || cw * ch > 25000000) {
      throw Error('Kích thước tem quá lớn để trích xuất đường cắt.');
    }

    const mapped = cv(cw, ch);
    const mctx = mapped.getContext('2d');
    mctx.translate((cxMm - originXMm) * pxPerMm, (cyMm - originYMm) * pxPerMm);
    if (angle) mctx.rotate(rad);
    mctx.drawImage(
      outerCanvas,
      (-boxWMm / 2) * pxPerMm,
      (-boxHMm / 2) * pxPerMm,
      boxWMm * pxPerMm,
      boxHMm * pxPerMm
    );

    const mdata = mctx.getImageData(0, 0, cw, ch).data;
    const maskData = new Uint8Array(cw * ch);
    for (let i = 0; i < maskData.length; i++) {
      maskData[i] = mdata[i * 4 + 3] >= 128 ? 255 : 0;
    }

    return Core.extractOuterContours(maskData, cw, ch, {
      pxPerMm,
      originXMm,
      originYMm,
      offsetPx: params.offsetMm * pxPerMm,
      simplifyMm: 0.08,
      minAreaMm2: 1.5,
      overcutMm: params.overcutMm,
      smoothCorners: true
    });
  }

  const otherLabelContourCache = new Map();

  function otherLabelCacheKey(label, paper, transform, params) {
    const d = label?.settings || {};
    return JSON.stringify([
      paper.width,
      paper.height,
      transform.scale,
      transform.x,
      transform.y,
      params.offsetMm,
      params.overcutMm,
      d.text,
      d.richHTML,
      d.font,
      d.size,
      d.bold,
      d.italic,
      d.underline,
      d.align,
      d.spacing,
      d.padding,
      d.border,
      d.width,
      d.labelX,
      d.labelY,
      d.labelScaleX,
      d.labelScaleY,
      d.labelAngle,
      d.curveAmount,
      d.curveLine,
      d.curveOverrides,
      d.textOffsetX,
      d.textOffsetY,
      d.layerStack,
      d.lineStyles,
      d.defaultTextStyle,
      d.decorations
    ]);
  }

  function extractDocumentCutJob(targetPaper, opts = {}) {
    const paper = targetPaper && Number.isFinite(targetPaper.width) && Number.isFinite(targetPaper.height)
      ? targetPaper
      : outputPaperDimensions(sourcePaperName());
    const source = previewPage();
    const protect = Boolean(opts.protect);
    const transform = outputPageTransform(source, paper, protect ? printSafeArea(paper) : undefined);
    const pageMm = { width: paper.width * 10, height: paper.height * 10 };
    const params = readCutParams(opts);
    const pxPerMm = 8;
    const allContours = [];

    // Read the active label from live DOM first so typing/IME selection stays undisturbed.
    const liveActive = oneLabelSettings();
    const active = typeof currentLabel === 'function' ? currentLabel() : null;
    if (!opts.onlyCloudCutLabels || liveActive?.cloudCutMode === true) {
      for (const c of extractCurrentDomLabelContours(liveActive, transform, params, pxPerMm)) {
        allContours.push(c);
      }
    }

    const others = Array.isArray(labels)
      ? labels.filter(label => label && label.id !== active?.id && (!opts.onlyCloudCutLabels || label.settings?.cloudCutMode === true))
      : [];

    const uncachedOthers = [];
    for (const label of others) {
      const key = otherLabelCacheKey(label, paper, transform, params);
      if (otherLabelContourCache.has(key)) {
        for (const c of otherLabelContourCache.get(key)) allContours.push(c);
      } else {
        uncachedOthers.push({ label, key });
      }
    }

    if (uncachedOthers.length) {
      const offsets = selectionOffsets();
      const oldSize = previewSize;
      const graphicSelected = selectedGraphicId;
      try {
        for (const { label, key } of uncachedOthers) {
          setLabelSettings(label.settings);
          const extracted = extractCurrentDomLabelContours(label.settings, transform, params, pxPerMm);
          otherLabelContourCache.set(key, extracted);
          while (otherLabelContourCache.size > 40) {
            otherLabelContourCache.delete(otherLabelContourCache.keys().next().value);
          }
          for (const c of extracted) {
            allContours.push(c);
          }
        }
      } finally {
        setLabelSettings(liveActive, true);
        selectedGraphicId = graphicSelected;
        previewSize = oldSize;
        if (offsets) {
          savedSelection = rangeOffsets($('temEditor'), offsets);
          if (document.activeElement === $('temEditor')) {
            const selection = getSelection();
            selection.removeAllRanges();
            selection.addRange(savedSelection);
          }
        }
      }
    }

    if (!allContours.length) return null;
    const contours = Core.sortContoursTopLeft(allContours, 12);
    const ref = Core.computeCutReference(contours, pageMm, {
      marginMm: params.marginMm,
      safeEdgeMm: 4,
      crossSizeMm: params.crossSizeMm,
      includeAlignMark: params.includeAlignMark
    });

    return {
      contours,
      ref,
      pageMm,
      transform,
      scaleX: params.scaleX,
      scaleY: params.scaleY,
      axisMode: params.axisMode
    };
  }

  /* ------------------------------------------------------------------
   * 4. Ribbon bar (#cloudCutBar) & On-Screen Overlay (#cloudCutStageOverlay)
   * ------------------------------------------------------------------ */
  const ribbonHost = $('homeRibbon');
  const cloudCutBar = document.createElement('div');
  cloudCutBar.id = 'cloudCutBar';
  cloudCutBar.className = 'artContextZone cloudCutBar';
  cloudCutBar.hidden = true;
  cloudCutBar.innerHTML =
    '<label class="cloudCutToggle" title="Màn hình vẫn hiện đủ viền mây để căn; khi in hoặc xuất ảnh bản in sẽ tự ẩn viền mây">' +
    '<input id="cutBarHideBorder" type="checkbox"><span>Ẩn viền khi in</span></label>' +
    '<label class="cloudCutToggle" title="In thêm dấu (+) góc trên-trái làm gốc (0,0) cho máy cắt MH721">' +
    '<input id="cutBarCrosshair" type="checkbox"><span>Dấu +</span></label>' +
    '<button id="openCloudCutDialog" type="button" class="artButton primary">✂ Cắt trực tiếp MH721…</button>';
  if (ribbonHost) ribbonHost.append(cloudCutBar);

  const exportMenu = $('artExportMenu');
  let cutExportMenuItem = null;
  if (exportMenu) {
    cutExportMenuItem = document.createElement('button');
    cutExportMenuItem.type = 'button';
    cutExportMenuItem.id = 'artExportCutMH721';
    cutExportMenuItem.setAttribute('role', 'menuitem');
    cutExportMenuItem.textContent = 'Cắt trực tiếp MH721 (COM / .PLT / .SVG)…';
    cutExportMenuItem.hidden = true;
    cutExportMenuItem.onclick = () => {
      if (typeof artCloseExport === 'function') artCloseExport();
      openCloudCutDialog();
    };
    exportMenu.append(cutExportMenuItem);
  }

  const stageHost = $('previewStage');
  const stageOverlay = document.createElement('div');
  stageOverlay.id = 'cloudCutStageOverlay';
  stageOverlay.hidden = true;
  stageOverlay.setAttribute('aria-hidden', 'true');
  stageOverlay.innerHTML =
    '<svg class="cloudCutStageSvg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"></svg>' +
    '<span class="cloudCutOriginTag" hidden>0,0</span>' +
    '<span class="cloudCutStageBadge" hidden>Đang hiện đủ viền để căn · Khi in tự ẩn viền mây</span>';
  if (stageHost) stageHost.append(stageOverlay);

  const stageSvg = stageOverlay.querySelector('.cloudCutStageSvg');
  const stageOriginTag = stageOverlay.querySelector('.cloudCutOriginTag');
  const stageBadge = stageOverlay.querySelector('.cloudCutStageBadge');

  let lastStageSignature = '';
  let cachedStageJob = null;
  let stageSyncFrame = 0;

  function stageOverlaySignature() {
    const s = oneLabelSettings();
    const activeId = typeof currentLabel === 'function' ? currentLabel()?.id : '';
    const pageKey = $('page')?.value || '';
    const activeLabels = Array.isArray(labels)
      ? labels.map(l => {
          const d = (l.id === activeId ? s : l.settings) || {};
          return [
            d.text,
            d.richHTML,
            d.font,
            d.size,
            d.bold,
            d.italic,
            d.underline,
            d.align,
            d.spacing,
            d.padding,
            d.border,
            d.width,
            d.labelX,
            d.labelY,
            d.labelScaleX,
            d.labelScaleY,
            d.labelAngle,
            d.curveAmount,
            d.curveOverrides,
            d.textOffsetX,
            d.textOffsetY,
            d.layerStack,
            (d.decorations || []).map(g => `${g.id}:${g.x}:${g.y}:${g.width}:${g.height}:${g.angle}:${g.flipX}:${g.flipY}`).join(',')
          ];
        })
      : [];
    return JSON.stringify([
      pageKey,
      s.cloudCutMode,
      s.cloudCutCrosshair,
      s.cloudCutAlignMark,
      s.cloudCutMarginMm,
      s.cloudCutOffsetMm,
      s.cloudCutCrossSizeMm,
      activeLabels
    ]);
  }

  function renderStageCrosshairs(job) {
    if (!stageSvg) return;
    if (!job || !job.ref || !$('cloudCutCrosshair')?.checked) {
      stageSvg.replaceChildren();
      if (stageOriginTag) stageOriginTag.hidden = true;
      return;
    }
    const { ref, pageMm } = job;
    const half = (Number.isFinite(ref.crossSizeMm) && ref.crossSizeMm > 0 ? ref.crossSizeMm : 8) / 2;
    const svgNS = 'http://www.w3.org/2000/svg';
    stageSvg.setAttribute('viewBox', `0 0 ${pageMm.width} ${pageMm.height}`);

    const path = document.createElementNS(svgNS, 'path');
    let d =
      `M ${ref.refX - half},${ref.refY} L ${ref.refX + half},${ref.refY} ` +
      `M ${ref.refX},${ref.refY - half} L ${ref.refX},${ref.refY + half}`;
    if (ref.hasAlignMark && Number.isFinite(ref.alignX) && Number.isFinite(ref.alignY)) {
      d +=
        ` M ${ref.alignX - half},${ref.alignY} L ${ref.alignX + half},${ref.alignY} ` +
        `M ${ref.alignX},${ref.alignY - half} L ${ref.alignX},${ref.alignY + half}`;
    }
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#0055cc');
    path.setAttribute('stroke-width', '1.6');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    stageSvg.replaceChildren(path);

    if (stageOriginTag) {
      stageOriginTag.style.left = `${(ref.refX / pageMm.width) * 100}%`;
      stageOriginTag.style.top = `${(ref.refY / pageMm.height) * 100}%`;
      stageOriginTag.hidden = false;
    }
  }

  function updateStageCutOverlay(force = false) {
    if (!stageOverlay) return;
    const active = isCloudCutDocument() && !isDesign() && home?.hidden === true;
    stageOverlay.hidden = !active;
    if (!active) return;

    if (stageBadge) {
      stageBadge.hidden = !Boolean($('cloudCutHideBorder')?.checked);
    }

    if (!$('cloudCutCrosshair')?.checked) {
      lastStageSignature = '';
      cachedStageJob = null;
      renderStageCrosshairs(null);
      return;
    }

    const sig = stageOverlaySignature();
    if (force || sig !== lastStageSignature) {
      if (typeof composing !== 'undefined' && composing && Array.isArray(labels) && labels.length > 1) return;
      lastStageSignature = sig;
      try {
        cachedStageJob = extractDocumentCutJob(previewPage(), { protect: false });
      } catch {
        cachedStageJob = null;
      }
    }
    renderStageCrosshairs(cachedStageJob);
  }

  function scheduleStageOverlaySync() {
    if (stageSyncFrame) return;
    stageSyncFrame = requestAnimationFrame(() => {
      stageSyncFrame = 0;
      if (!isCloudCutDocument() || isDesign() || !home?.hidden) {
        if (stageOverlay) stageOverlay.hidden = true;
        return;
      }
      if (labelDrag || labelGroupDrag || designDrag) return;
      updateStageCutOverlay(false);
    });
  }

  function syncCutBarControls() {
    const barHide = $('cutBarHideBorder');
    const barCross = $('cutBarCrosshair');
    if (barHide) barHide.checked = Boolean($('cloudCutHideBorder')?.checked);
    if (barCross) barCross.checked = Boolean($('cloudCutCrosshair')?.checked);
  }

  const prevArtSyncContext = artSyncContext;
  artSyncContext = function (...args) {
    const res = prevArtSyncContext(...args);
    const cutMode = isCloudCutDocument() && !isDesign();
    const graphic = typeof selectedGraphic === 'function' ? selectedGraphic() : null;
    if (cutMode && !graphic && $('artContextLabel')) {
      $('artContextLabel').textContent = 'Cắt máy';
    }
    cloudCutBar.hidden = !(cutMode && !graphic);
    document.body.classList.toggle('cloudCutDocument', cutMode && !graphic);
    if (cutExportMenuItem) cutExportMenuItem.hidden = !cutMode;
    syncCutBarControls();
    return res;
  };

  $('cutBarHideBorder')?.addEventListener('change', () => {
    $('cloudCutHideBorder').checked = $('cutBarHideBorder').checked;
    saveActiveLabel();
    syncCutSettingsAcrossLabels();
    recordHistory();
    captureAutoChanges();
    updateStageCutOverlay(false);
    $('status').textContent = $('cloudCutHideBorder').checked
      ? 'Đã bật: Màn hình vẫn hiện đủ viền mây, khi in tự ẩn viền.'
      : 'Đã tắt Ẩn viền khi in: bản in sẽ giữ nguyên viền mây.';
  });

  $('cutBarCrosshair')?.addEventListener('change', () => {
    $('cloudCutCrosshair').checked = $('cutBarCrosshair').checked;
    saveActiveLabel();
    syncCutSettingsAcrossLabels();
    recordHistory();
    captureAutoChanges();
    updateStageCutOverlay(true);
  });

  $('openCloudCutDialog')?.addEventListener('click', () => {
    openCloudCutDialog();
  });

  const prevPreviewForCut = preview;
  preview = async function (...args) {
    const res = await prevPreviewForCut(...args);
    updateStageCutOverlay(true);
    return res;
  };

  const prevZoomForCut = zoom;
  zoom = function (...args) {
    const res = prevZoomForCut(...args);
    if (labelDrag || labelGroupDrag || designDrag) {
      if (stageOverlay) stageOverlay.hidden = true;
    } else {
      scheduleStageOverlaySync();
    }
    return res;
  };

  // Update the crosshair overlay immediately when a #selectionFrame label drag settles.
  const refreshOverlayAfterDrag = () => {
    queueMicrotask(() => {
      if (!labelDrag && !labelGroupDrag && !designDrag && isCloudCutDocument() && !isDesign() && home?.hidden === true) {
        updateStageCutOverlay(false);
      }
    });
  };
  for (const evt of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    window.addEventListener(evt, refreshOverlayAfterDrag);
  }

  /* ------------------------------------------------------------------
   * 5. Print & Print-Export Cloud Border Hiding + Crosshair Drawing
   * ------------------------------------------------------------------ */
  let cutPrintOutputDepth = 0;
  let hidingCloudBorder = false;

  function isCutPrintOutputActive(opts) {
    return cutPrintOutputDepth > 0 || (Boolean($('studioProduction')?.open) && opts?.white === false);
  }

  function clampPrintInk(ink, width, height) {
    const x = Math.max(0, Math.min(width - 1, Math.floor(ink.x)));
    const y = Math.max(0, Math.min(height - 1, Math.floor(ink.y)));
    const right = Math.max(x + 1, Math.min(width, Math.ceil(ink.x + ink.width)));
    const bottom = Math.max(y + 1, Math.min(height, Math.ceil(ink.y + ink.height)));
    return { x, y, width: right - x, height: bottom - y };
  }

  function drawCutCrosshairsOnCanvas(canvas, targetCm, ref) {
    const ctx = canvas.getContext('2d');
    const pxPerMmX = canvas.width / (targetCm.width * 10);
    const pxPerMmY = canvas.height / (targetCm.height * 10);
    const halfMm = (Number.isFinite(ref.crossSizeMm) && ref.crossSizeMm > 0 ? ref.crossSizeMm : 8) / 2;
    const strokePx = Math.max(1.5, 0.3 * pxPerMmX);

    const marks = [{ x: ref.refX, y: ref.refY }];
    if (ref.hasAlignMark && Number.isFinite(ref.alignX) && Number.isFinite(ref.alignY)) {
      marks.push({ x: ref.alignX, y: ref.alignY });
    }

    ctx.save();
    ctx.filter = 'none';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = strokePx;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    for (const m of marks) {
      const cx = m.x * pxPerMmX;
      const cy = m.y * pxPerMmY;
      const hx = halfMm * pxPerMmX;
      const hy = halfMm * pxPerMmY;
      ctx.moveTo(cx - hx, cy);
      ctx.lineTo(cx + hx, cy);
      ctx.moveTo(cx, cy - hy);
      ctx.lineTo(cx, cy + hy);
    }
    ctx.stroke();
    ctx.restore();

    const baseInk = canvas.printInk || { x: 0, y: 0, width: canvas.width, height: canvas.height };
    let minX = baseInk.x;
    let minY = baseInk.y;
    let maxX = baseInk.x + baseInk.width;
    let maxY = baseInk.y + baseInk.height;
    const padPx = strokePx / 2 + 2;
    for (const m of marks) {
      minX = Math.min(minX, (m.x - halfMm) * pxPerMmX - padPx);
      minY = Math.min(minY, (m.y - halfMm) * pxPerMmY - padPx);
      maxX = Math.max(maxX, (m.x + halfMm) * pxPerMmX + padPx);
      maxY = Math.max(maxY, (m.y + halfMm) * pxPerMmY + padPx);
    }
    canvas.printInk = clampPrintInk(
      { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      canvas.width,
      canvas.height
    );
  }

  const prevPaintLayerStack = paintLayerStack;
  paintLayerStack = function (ctx, L, scale, paintBackground) {
    return prevPaintLayerStack(ctx, L, scale, hidingCloudBorder ? () => {} : paintBackground);
  };

  const prevRenderOutputPage = renderOutputPage;
  renderOutputPage = function (target, opts = {}) {
    const cutActive = isCutPrintOutputActive(opts) && isCloudCutDocument();
    const shouldHideBorder = cutActive && Boolean($('cloudCutHideBorder')?.checked);
    const shouldDrawCrosshair = cutActive && Boolean($('cloudCutCrosshair')?.checked);

    let cutJob = null;
    if (cutActive) {
      try {
        cutJob = extractDocumentCutJob(target, { protect: Boolean(opts?.protect) });
      } catch {
        cutJob = null;
      }
    }

    let result;
    if (shouldHideBorder) {
      hidingCloudBorder = true;
      try {
        result = prevRenderOutputPage(target, opts);
      } finally {
        hidingCloudBorder = false;
      }
    } else {
      result = prevRenderOutputPage(target, opts);
    }

    if (result && shouldDrawCrosshair && cutJob && cutJob.ref) {
      drawCutCrosshairsOnCanvas(result, target, cutJob.ref);
    }
    if (result && result.printInk) {
      result.printInk = clampPrintInk(result.printInk, result.width, result.height);
    }
    return result;
  };

  const prevRenderPrintPage = renderPrintPage;
  renderPrintPage = function (...args) {
    cutPrintOutputDepth++;
    try {
      return prevRenderPrintPage(...args);
    } finally {
      cutPrintOutputDepth--;
    }
  };

  const prevExportPNG = exportPNG;
  exportPNG = async function (...args) {
    cutPrintOutputDepth++;
    try {
      return await prevExportPNG(...args);
    } finally {
      cutPrintOutputDepth--;
    }
  };

  const prevUpdateOutputPreview = updateOutputPreview;
  updateOutputPreview = function (...args) {
    cutPrintOutputDepth++;
    try {
      return prevUpdateOutputPreview(...args);
    } finally {
      cutPrintOutputDepth--;
    }
  };

  function wrapAsyncCutOutput(fn) {
    if (typeof fn !== 'function') return fn;
    return async function (...args) {
      cutPrintOutputDepth++;
      try {
        return await fn.apply(this, args);
      } finally {
        cutPrintOutputDepth--;
      }
    };
  }

  if (window.TemStudio) {
    if (typeof window.TemStudio.openProduction === 'function') {
      window.TemStudio.openProduction = wrapAsyncCutOutput(window.TemStudio.openProduction);
    }
    if (typeof window.TemStudio.exportPDF === 'function') {
      window.TemStudio.exportPDF = wrapAsyncCutOutput(window.TemStudio.exportPDF);
    }
  }
  const studioPdfMenuBtn = $('studioPDF');
  if (studioPdfMenuBtn && typeof studioPdfMenuBtn.onclick === 'function') {
    studioPdfMenuBtn.onclick = wrapAsyncCutOutput(studioPdfMenuBtn.onclick);
  }
  const studioExportPdfBtn = $('studioExportPDF');
  if (studioExportPdfBtn && typeof studioExportPdfBtn.onclick === 'function') {
    studioExportPdfBtn.onclick = wrapAsyncCutOutput(studioExportPdfBtn.onclick);
  }

  function applyCutPrintHints() {
    if (!isCloudCutDocument() || !printPageCanvas) return;
    const hideOn = Boolean($('cloudCutHideBorder')?.checked);
    const protectOn = Boolean($('printProtectEdges')?.checked);
    $('printMessage').textContent = protectOn
      ? 'Lưu ý: Đang bật Bảo vệ mép có thể thu nhỏ bản in lệch với file cắt MH721; khuyên tắt khi in Borderless.'
      : hideOn
        ? 'Chế độ cắt máy MH721: viền mây đã ẩn khi in; đặt dao máy cắt vào tâm dấu (+) góc trên-trái rồi chạy file cắt.'
        : 'Đang giữ viền mây khi in. Khuyên bật "Ẩn viền khi in" để khi cắt viền mây không lộ mực.';
    const help = $('printDriverHelp');
    const tip = ' Cắt máy MH721: tắt Fit to Page, giữ tỷ lệ 100% và tắt mở rộng Borderless nếu có.';
    if (help && !help.textContent.includes('MH721')) {
      help.textContent = help.textContent + tip;
    }
  }

  const prevRefreshOutputPrint = refreshOutputPrint;
  refreshOutputPrint = function (...args) {
    const res = prevRefreshOutputPrint(...args);
    applyCutPrintHints();
    return res;
  };

  const prevOpenPrint = openPrint;
  openPrint = async function (...args) {
    const res = await prevOpenPrint(...args);
    applyCutPrintHints();
    return res;
  };

  if ($('printOutputPaper')) $('printOutputPaper').onchange = refreshOutputPrint;
  if ($('printOutputDpi')) $('printOutputDpi').onchange = refreshOutputPrint;
  if ($('exportOutputPaper')) $('exportOutputPaper').onchange = updateOutputPreview;
  if ($('exportOutputDpi')) $('exportOutputDpi').onchange = updateOutputPreview;
  if ($('print')) $('print').onclick = openPrint;

  /* ------------------------------------------------------------------
   * 6. Dedicated "Xuất & Cắt máy MH721" Dialog (#cloudCutDialog)
   * ------------------------------------------------------------------ */
  const cutDialog = document.createElement('dialog');
  cutDialog.id = 'cloudCutDialog';
  cutDialog.className = 'cloudCutDialog';
  cutDialog.setAttribute('aria-labelledby', 'cloudCutDialogTitle');
  cutDialog.innerHTML =
    '<div class="cloudCutDialogHeader">' +
    '<h2 id="cloudCutDialogTitle">Cắt trực tiếp máy cắt Refine MH721</h2>' +
    '<button id="cutDlgClose" type="button" class="cloudCutCloseBtn" aria-label="Đóng">×</button>' +
    '</div>' +
    '<div class="cloudCutLayout">' +
    '<div class="cloudCutControls">' +
    '<fieldset class="cloudCutFieldset cloudCutDirectCard"><legend>1. Cắt trực tiếp trên phần mềm (Cổng COM · Windows)</legend>' +
    '<label for="cutComPort">Cổng COM máy cắt MH721</label>' +
    '<select id="cutComPort"><option value="">Chưa có cổng COM</option></select>' +
    '<p class="cloudCutHint">Lưu ý cáp USB: Cắm cáp USB từ MH721 vào Windows sẽ tạo cổng COM ảo (vd: USB-SERIAL CH340 (COM3)).</p>' +
    '<div class="cloudCutGrid2">' +
    '<div><label for="cutComBaud">Tốc độ Baud</label><select id="cutComBaud"><option value="4800">4800</option><option value="9600" selected>9600</option><option value="19200">19200</option><option value="38400">38400</option><option value="57600">57600</option><option value="115200">115200</option></select></div>' +
    '<div><label for="cutComFlow">Điều khiển luồng</label><select id="cutComFlow"><option value="None" selected>None (khuyên dùng CH340)</option><option value="RequestToSend">RequestToSend (RS232)</option></select></div>' +
    '</div>' +
    '<div class="cloudCutComButtons">' +
    '<button id="cutSendDirect" type="button" class="primary" disabled>✂ Cắt trực tiếp ngay</button>' +
    '<button id="cutTestBox" type="button" disabled>Chạy thử khung (không hạ dao)</button>' +
    '<button id="cutRefreshPorts" type="button">Làm mới COM</button>' +
    '</div>' +
    '<p id="cutComStatus" class="cloudCutComStatus" role="status"></p>' +
    '<p class="cloudCutHint">Thao tác nhanh: Xoay giấy đã in 180° đưa vào máy (dấu + góc dưới-phải) → đưa mũi dao vào tâm (+) rồi bấm <strong>ORIGIN</strong> trên MH721 → bấm <strong>Chạy thử khung</strong> → bấm <strong>Cắt trực tiếp ngay</strong>.</p>' +
    '</fieldset>' +
    '<fieldset class="cloudCutFieldset"><legend>2. Khổ giấy &amp; dấu định vị (+)</legend>' +
    '<label for="cutDlgPaper">Khổ giấy</label>' +
    '<select id="cutDlgPaper"><option value="A5">A5 ngang</option><option value="A4">A4 ngang</option><option value="A3">A3 ngang</option></select>' +
    '<label class="cloudCutCheckRow"><input id="cutDlgHideBorder" type="checkbox"> Ẩn viền mây khi in</label>' +
    '<label class="cloudCutCheckRow"><input id="cutDlgCrosshair" type="checkbox"> Dấu + tham chiếu gốc (0,0)</label>' +
    '<label class="cloudCutCheckRow"><input id="cutDlgAlignMark" type="checkbox"> Dấu + phụ căn thẳng ngang</label>' +
    '<div class="cloudCutGrid2">' +
    '<div><label for="cutDlgMarginMm">Khoảng cách dấu + (mm)</label><input id="cutDlgMarginMm" type="number" min="0" max="30" step="0.5"></div>' +
    '<div><label for="cutDlgCrossSizeMm">Cỡ dấu + (mm)</label><input id="cutDlgCrossSizeMm" type="number" min="3" max="20" step="0.5"></div>' +
    '</div>' +
    '</fieldset>' +
    '<fieldset class="cloudCutFieldset"><legend>3. Hiệu chỉnh đường cắt MH721</legend>' +
    '<div class="cloudCutGrid2">' +
    '<div><label for="cutDlgOffsetMm">Bù mép cắt / Độ lẹm viền (mm)</label><input id="cutDlgOffsetMm" type="number" min="-2" max="2" step="0.1"></div>' +
    '<div><label for="cutDlgOvercutMm">Cắt chồng khép vòng (mm)</label><input id="cutDlgOvercutMm" type="number" min="0" max="2" step="0.1"></div>' +
    '</div>' +
    '<div class="cloudCutGrid2">' +
    '<div><label for="cutDlgScaleX">Bù máy in Borderless X (%)</label><input id="cutDlgScaleX" type="number" min="90" max="110" step="0.1"></div>' +
    '<div><label for="cutDlgScaleY">Bù máy in Borderless Y (%)</label><input id="cutDlgScaleY" type="number" min="90" max="110" step="0.1"></div>' +
    '</div>' +
    '<p class="cloudCutHint">Mẹo: Nếu in Borderless (iX6770 / G1010) làm hình hơi phóng, chỉnh X/Y khoảng 101–102%; khổ A5 in thường giữ 100%.</p>' +
    '<label for="cutDlgAxisMode">Hệ trục / Chiều nạp giấy MH721</label>' +
    '<select id="cutDlgAxisMode">' +
    AXIS_OPTIONS.map(([val, label]) => `<option value="${val}">${label}</option>`).join('') +
    '</select>' +
    '</fieldset>' +
    '</div>' +
    '<div class="cloudCutPreviewPane">' +
    '<div class="cloudCutPreviewBox"><canvas id="cloudCutPreviewCanvas"></canvas></div>' +
    '<div class="cloudCutLegend">' +
    '<span class="cloudCutLegendItem"><span class="cloudCutSwatch cloudCutSwatch--cut"></span>Đường cắt MH721 (trên-trái → phải)</span>' +
    '<span class="cloudCutLegendItem"><span class="cloudCutSwatch cloudCutSwatch--ref"></span>Dấu (+) gốc 0,0 &amp; căn thẳng</span>' +
    '<span class="cloudCutLegendItem"><span class="cloudCutSwatch cloudCutSwatch--ghost"></span>Hình mây tham chiếu</span>' +
    '</div>' +
    '<p id="cloudCutSummary" class="cloudCutSummary"></p>' +
    '<p id="cloudCutDialogStatus" class="cloudCutStatus" role="status"></p>' +
    '<div class="cloudCutActions">' +
    '<button id="cutOpenPrint" type="button" class="primary">In bản in có dấu +…</button>' +
    '<button id="cutDownloadPlt" type="button">Tải .PLT (dự phòng)</button>' +
    '<button id="cutDownloadSvg" type="button">Tải .SVG cắt thuần</button>' +
    '</div>' +
    '</div>' +
    '</div>';
  document.body.append(cutDialog);

  let cutBusy = false;
  let lastCutJob = null;
  let cutterSupported = false;

  const DIALOG_TO_STATE = [
    ['cutDlgHideBorder', 'cloudCutHideBorder', 'checkbox'],
    ['cutDlgCrosshair', 'cloudCutCrosshair', 'checkbox'],
    ['cutDlgAlignMark', 'cloudCutAlignMark', 'checkbox'],
    ['cutDlgMarginMm', 'cloudCutMarginMm', 'number'],
    ['cutDlgOffsetMm', 'cloudCutOffsetMm', 'number'],
    ['cutDlgOvercutMm', 'cloudCutOvercutMm', 'number'],
    ['cutDlgScaleX', 'cloudCutScaleX', 'number'],
    ['cutDlgScaleY', 'cloudCutScaleY', 'number'],
    ['cutDlgAxisMode', 'cloudCutAxisMode', 'select'],
    ['cutDlgCrossSizeMm', 'cloudCutCrossSizeMm', 'number']
  ];

  function syncStateToCutDialog() {
    for (const [dlgId, stateId, kind] of DIALOG_TO_STATE) {
      const dlgEl = $(dlgId);
      const stateEl = $(stateId);
      if (!dlgEl || !stateEl) continue;
      if (kind === 'checkbox') dlgEl.checked = stateEl.checked;
      else dlgEl.value = stateEl.value;
    }
  }

  function syncCutDialogToState(commitHistory = false) {
    for (const [dlgId, stateId, kind] of DIALOG_TO_STATE) {
      const dlgEl = $(dlgId);
      const stateEl = $(stateId);
      if (!dlgEl || !stateEl) continue;
      if (kind === 'checkbox') stateEl.checked = dlgEl.checked;
      else stateEl.value = dlgEl.value;
    }
    syncCutBarControls();
    saveActiveLabel();
    syncCutSettingsAcrossLabels();
    if (commitHistory) {
      recordHistory();
      captureAutoChanges();
      updateStageCutOverlay(true);
    }
  }

  function drawArrowHead(ctx, fromX, fromY, toX, toY, size = 7) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.save();
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - size * Math.cos(angle - Math.PI / 6), toY - size * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - size * Math.cos(angle + Math.PI / 6), toY - size * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function contourDirectionSample(points, scaleX, scaleY, ref) {
    const mapped = points.map(p => ({
      x: ref.refX + (p.x - ref.refX) * scaleX,
      y: ref.refY + (p.y - ref.refY) * scaleY
    }));
    const start = mapped[0];
    let dist = 0;
    let target = mapped[1] || start;
    for (let i = 1; i < mapped.length; i++) {
      dist += Math.hypot(mapped[i].x - mapped[i - 1].x, mapped[i].y - mapped[i - 1].y);
      target = mapped[i];
      if (dist >= 6) break;
    }
    return { mapped, start, target };
  }

  function refreshCutDialogPreview() {
    const paperName = $('cutDlgPaper').value;
    const targetPaper = outputPaperDimensions(paperName);
    const canvas = $('cloudCutPreviewCanvas');
    const summaryEl = $('cloudCutSummary');
    const statusEl = $('cloudCutDialogStatus');

    const maxW = 560;
    const maxH = 400;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssScale = Math.min(maxW / (targetPaper.width * 10), maxH / (targetPaper.height * 10));
    const cssW = Math.max(120, Math.round(targetPaper.width * 10 * cssScale));
    const cssH = Math.max(90, Math.round(targetPaper.height * 10 * cssScale));

    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cssW, cssH);

    // Subtle paper margin border
    ctx.strokeStyle = '#d6d4cd';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, cssW - 1, cssH - 1);

    try {
      // Ghost reference silhouette (full cloud visible at 24% opacity)
      try {
        const ghost = prevRenderOutputPage(targetPaper, { dpi: 40, white: false });
        ctx.save();
        ctx.globalAlpha = 0.24;
        ctx.drawImage(ghost, 0, 0, cssW, cssH);
        ctx.restore();
      } catch {
        // Ignore ghost preview error if label has no ink yet; contour extraction reports clearly below.
      }

      const job = extractDocumentCutJob(targetPaper, { protect: false });
      lastCutJob = job;

      if (!job || !job.contours.length) {
        summaryEl.textContent = `${targetPaper.name} · 0 vùng cắt`;
        statusEl.textContent = 'Hãy nhập nội dung chữ hoặc hình trước khi xuất cắt MH721.';
        $('cutDownloadPlt').disabled = true;
        $('cutDownloadSvg').disabled = true;
        syncCutterActionButtons();
        return;
      }

      const mmToPx = cssScale;
      const { ref, contours, scaleX, scaleY, pageMm } = job;

      // Crisp red cut paths + numbered start points + direction arrow
      contours.forEach((contour, idx) => {
        const { mapped, start, target } = contourDirectionSample(contour.closedPoints, scaleX, scaleY, ref);
        ctx.save();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        mapped.forEach((pt, i) => {
          const px = pt.x * mmToPx;
          const py = pt.y * mmToPx;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        const sx = start.x * mmToPx;
        const sy = start.y * mmToPx;
        const tx = target.x * mmToPx;
        const ty = target.y * mmToPx;
        if (Math.hypot(tx - sx, ty - sy) > 3) {
          drawArrowHead(ctx, sx, sy, tx, ty, 6.5);
        }

        // Start marker badge
        ctx.save();
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(sx, sy, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(idx + 1), sx, sy + 0.5);
        ctx.restore();
      });

      // Registration blue (+) crosshairs
      const halfPx = ((Number.isFinite(ref.crossSizeMm) ? ref.crossSizeMm : 8) / 2) * mmToPx;
      const drawBlueCross = (xMm, yMm, label) => {
        const cx = xMm * mmToPx;
        const cy = yMm * mmToPx;
        ctx.save();
        ctx.strokeStyle = '#0055cc';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx - halfPx, cy);
        ctx.lineTo(cx + halfPx, cy);
        ctx.moveTo(cx, cy - halfPx);
        ctx.lineTo(cx, cy + halfPx);
        ctx.stroke();
        if (label) {
          ctx.fillStyle = '#0055cc';
          ctx.font = 'bold 10px Arial, sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(label, cx + 4, cy + 4);
        }
        ctx.restore();
      };

      drawBlueCross(ref.refX, ref.refY, '0,0');
      if (ref.hasAlignMark) {
        drawBlueCross(ref.alignX, ref.alignY, '+');
      }

      const b = ref.bounds;
      summaryEl.textContent =
        `${targetPaper.name} (${pageMm.width} × ${pageMm.height} mm) · ` +
        `${contours.length} vùng cắt · Vùng bao: ${b.width.toFixed(1)} × ${b.height.toFixed(1)} mm · ` +
        `Gốc (+): (${ref.refX.toFixed(1)}, ${ref.refY.toFixed(1)}) mm`;
      statusEl.textContent = '';
      $('cutDownloadPlt').disabled = false;
      $('cutDownloadSvg').disabled = false;
      syncCutterActionButtons();
    } catch (error) {
      lastCutJob = null;
      summaryEl.textContent = targetPaper.name;
      statusEl.textContent = error.message || 'Không tính được đường cắt.';
      $('cutDownloadPlt').disabled = true;
      $('cutDownloadSvg').disabled = true;
      syncCutterActionButtons();
    }
  }

  function syncCutterActionButtons() {
    const port = $('cutComPort')?.value || '';
    const canCut = !cutBusy && cutterSupported && Boolean(port) && Boolean(lastCutJob?.contours?.length);
    $('cutTestBox').disabled = !canCut;
    $('cutSendDirect').disabled = !canCut;
    $('cutRefreshPorts').disabled = cutBusy;
  }

  async function refreshCutterPorts() {
    const portSelect = $('cutComPort');
    const baudSelect = $('cutComBaud');
    const flowSelect = $('cutComFlow');
    const comStatus = $('cutComStatus');
    const pref = readComPref();
    if (baudSelect && pref.baudRate && [...baudSelect.options].some(o => o.value === String(pref.baudRate))) {
      baudSelect.value = String(pref.baudRate);
    }
    if (flowSelect && pref.flowControl && [...flowSelect.options].some(o => o.value === String(pref.flowControl))) {
      flowSelect.value = String(pref.flowControl);
    }
    cutterSupported = false;

    if (!window.TEMHOA_TOKEN || location.protocol === 'file:') {
      portSelect.replaceChildren(new Option('Chưa kết nối máy chủ', ''));
      comStatus.textContent =
        'Kết nối cổng COM trực tiếp hỗ trợ trên Windows (Mo-TemHoa-Windows.bat); hãy tải file .PLT hoặc .SVG.';
      syncCutterActionButtons();
      return;
    }

    comStatus.textContent = 'Đang kiểm tra cổng COM…';
    try {
      const response = await fetch('/api/cutters', {
        method: 'GET',
        headers: { 'X-TemHoa-Token': window.TEMHOA_TOKEN }
      });
      const data = await response.json();
      if (!response.ok) {
        throw Error(data.error || 'Không đọc được danh sách cổng COM.');
      }

      const rawDetails = Array.isArray(data.portDetails) ? data.portDetails : [];
      const ports = Array.isArray(data.ports) ? data.ports : [];
      const details = rawDetails.length
        ? rawDetails.filter(d => d && typeof d.port === 'string')
        : ports.map(p => ({ port: p, label: p, usb: false }));
      cutterSupported = data.supported === true;
      portSelect.replaceChildren();

      if (!cutterSupported) {
        portSelect.add(new Option('Chỉ hỗ trợ trên Windows', ''));
        comStatus.textContent =
          data.reason || 'Kết nối cổng COM trực tiếp hỗ trợ trên Windows; hãy tải file .PLT hoặc .SVG.';
      } else if (!details.length) {
        portSelect.add(new Option('Chưa thấy cổng COM', ''));
        comStatus.textContent =
          'Chưa phát hiện cổng COM nào. Kiểm tra cáp USB-Serial máy cắt MH721 (driver CH340/FTDI) rồi bấm Làm mới COM.';
      } else {
        for (const item of details) {
          portSelect.add(new Option(item.label || item.port, item.port));
        }
        const preferred =
          (pref.port && details.find(d => d.port === pref.port)?.port) ||
          details.find(d => d.usb)?.port ||
          details[0].port;
        portSelect.value = preferred;
        const selectedDetail = details.find(d => d.port === preferred);
        const selectedLabel = portSelect.selectedOptions[0]?.textContent || preferred;
        comStatus.textContent = selectedDetail?.usb
          ? `Đã sẵn sàng cổng USB-Serial: ${selectedLabel}. Đặt dao vào tâm (+) rồi bấm ORIGIN trên MH721 trước khi chạy.`
          : `Cảnh báo: ${selectedLabel} có thể là cổng mainboard (không phải USB máy cắt). Hãy kiểm tra Device Manager → Ports (COM & LPT) xem có USB-SERIAL CH340 chưa hoặc cài driver CH340.`;
      }
    } catch (error) {
      cutterSupported = false;
      portSelect.replaceChildren(new Option('Không khả dụng', ''));
      comStatus.textContent =
        error.message || 'Kết nối cổng COM trực tiếp hỗ trợ trên Windows; hãy tải file .PLT hoặc .SVG.';
    }
    syncCutterActionButtons();
  }

  async function sendDirectComCut(testBox = false) {
    if (cutBusy || !lastCutJob?.contours?.length) return;
    const port = $('cutComPort').value;
    if (!port) {
      $('cutComStatus').textContent = 'Vui lòng chọn cổng COM.';
      return;
    }

    const baudRate = Number($('cutComBaud').value) || 9600;
    const flowControl = $('cutComFlow').value || 'None';
    saveComPref({ port, baudRate: String(baudRate), flowControl });

    cutBusy = true;
    syncCutterActionButtons();
    $('cutComStatus').textContent = testBox
      ? `Đang gửi khung chạy thử (không hạ dao) tới ${port} (${baudRate} bps, ${flowControl})…`
      : `Đang gửi lệnh cắt trực tiếp MH721 tới ${port} (${baudRate} bps, ${flowControl})…`;

    try {
      const hpgl = testBox
        ? Core.generateTestBoxHPGL(lastCutJob)
        : Core.generateHPGL({ ...lastCutJob, includeRefMark: false });
      const response = await fetch('/api/cut', {
        method: 'POST',
        headers: {
          'X-TemHoa-Token': window.TEMHOA_TOKEN || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          port,
          baudRate,
          flowControl,
          hpgl
        })
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'Không gửi được lệnh cắt.');
      $('cutComStatus').textContent = testBox
        ? `Đã gửi khung chạy thử (${data.bytes || hpgl.length} bytes) tới ${data.port || port} [${baudRate} bps, ${flowControl}]. Nếu máy chưa chạy: (1) kiểm tra MH721 đang ONLINE (không Pause); (2) thử Baud 38400 / 4800 / 9600; (3) thử đổi Luồng None ↔ RequestToSend.`
        : `Đã gửi lệnh cắt xong (${data.bytes || hpgl.length} bytes) tới ${data.port || port} [${baudRate} bps, ${flowControl}].`;
    } catch (error) {
      $('cutComStatus').textContent = error.message;
    } finally {
      cutBusy = false;
      syncCutterActionButtons();
    }
  }

  async function openCloudCutDialog() {
    if (typeof closeFontPicker === 'function') closeFontPicker();
    if (typeof captureSelection === 'function') captureSelection();
    try {
      await ensureDocumentFonts();
      $('cutDlgPaper').value = sourcePaperName();
      syncStateToCutDialog();
      refreshCutDialogPreview();
      cutDialog.showModal();
      refreshCutterPorts();
    } catch (error) {
      $('status').textContent = error.message;
    }
  }

  $('cutDlgClose').onclick = () => {
    if (!cutBusy) cutDialog.close();
  };
  cutDialog.addEventListener('cancel', event => {
    if (cutBusy) event.preventDefault();
  });

  $('cutDlgPaper').onchange = refreshCutDialogPreview;
  for (const [dlgId, , kind] of DIALOG_TO_STATE) {
    const el = $(dlgId);
    if (!el) continue;
    el.addEventListener(kind === 'number' ? 'input' : 'change', () => {
      syncCutDialogToState(kind !== 'number');
      refreshCutDialogPreview();
    });
    if (kind === 'number') {
      el.addEventListener('change', () => {
        syncCutDialogToState(true);
        refreshCutDialogPreview();
      });
    }
  }

  $('cutDownloadPlt').onclick = () => {
    if (!lastCutJob?.contours?.length) return;
    try {
      const hpgl = Core.generateHPGL({ ...lastCutJob, includeRefMark: false });
      const paper = $('cutDlgPaper').value;
      download(new Blob([hpgl], { type: 'application/octet-stream' }), `TEMhoa-CatMay-${paper}.plt`);
      $('cloudCutDialogStatus').textContent = `Đã tải TEMhoa-CatMay-${paper}.plt (40 units/mm).`;
    } catch (error) {
      $('cloudCutDialogStatus').textContent = error.message;
    }
  };

  $('cutDownloadSvg').onclick = () => {
    if (!lastCutJob?.contours?.length) return;
    try {
      const svg = Core.generateCutSVG(lastCutJob);
      const paper = $('cutDlgPaper').value;
      download(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `TEMhoa-CatMay-${paper}.svg`);
      $('cloudCutDialogStatus').textContent = `Đã tải TEMhoa-CatMay-${paper}.svg.`;
    } catch (error) {
      $('cloudCutDialogStatus').textContent = error.message;
    }
  };

  $('cutOpenPrint').onclick = async () => {
    if (cutBusy) return;
    const chosenPaper = $('cutDlgPaper').value;
    cutDialog.close();
    await openPrint();
    if ($('printOutputPaper') && $('printOutputPaper').value !== chosenPaper) {
      $('printOutputPaper').value = chosenPaper;
      refreshOutputPrint();
    }
  };

  $('cutRefreshPorts').onclick = refreshCutterPorts;
  $('cutComPort').onchange = () => {
    if ($('cutComPort').value) saveComPref({ port: $('cutComPort').value });
    syncCutterActionButtons();
  };
  $('cutComBaud').onchange = () => saveComPref({ baudRate: $('cutComBaud').value });
  $('cutComFlow').onchange = () => saveComPref({ flowControl: $('cutComFlow').value });
  $('cutTestBox').onclick = () => sendDirectComCut(true);
  $('cutSendDirect').onclick = () => sendDirectComCut(false);

  /* ------------------------------------------------------------------
   * 7. Initial synchronization
   * ------------------------------------------------------------------ */
  for (const entry of homeEntries) syncCloudCutEntry(entry);
  filterHome();
  artSyncContext();
  updateStageCutOverlay(true);

  window.createCloudCutTemplate = createCloudCutTemplate;
  window.isCloudCutDocument = isCloudCutDocument;
  window.extractDocumentCutJob = extractDocumentCutJob;
  window.TemCloudCutTools = {
    createCloudCutTemplate,
    isCloudCutDocument,
    extractDocumentCutJob,
    openCloudCutDialog
  };
})();
