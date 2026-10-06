/* TEMhoa resource library, editable quick templates and print production. */
(() => {
  'use strict';
  const C = window.TemStudioCore, clone = value => JSON.parse(JSON.stringify(value));
  const status = message => { $('status').textContent = message; };
  const fail = error => status(error.message || String(error));
  const el = (tag, attrs = {}, text = '') => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    if (text) node.textContent = text;
    return node;
  };
  const button = (text, action, attrs = {}) => {
    const b = el('button', {type: 'button', ...attrs}, text);
    b.onclick = async () => { b.disabled = true; try {await action();} catch (e) {fail(e); const d = b.closest('dialog'); if (d) d.querySelector('[role=status]').textContent = e.message;} finally {b.disabled = false;} };
    return b;
  };
  function dialog(id, title) {
    const d = el('dialog', {id, class: 'studioDialog', 'aria-labelledby': id + 'Title'});
    const head = el('header'), h = el('h2', {id: id + 'Title'}, title);
    head.append(h, button('Đóng', () => d.close(), {'aria-label': 'Đóng ' + title}));
    d.append(head); document.body.append(d); return d;
  }
  const feedback = d => {const n = el('p', {role: 'status', class: 'studioStatus'}); d.append(n); return n;};
  const field = (parent, label, id, type = 'text', value = '') => {
    const wrapper = el('label', {}, label), input = el('input', {id, type});
    input.value = value; wrapper.append(input); parent.append(wrapper); return input;
  };
  let database;
  function db() {
    if (!database) database = new Promise((resolve, reject) => {
      const req = indexedDB.open('temhoa-studio', 1);let blocked=false;
      req.onupgradeneeded = () => req.result.createObjectStore('entries', {keyPath: 'id'});
      req.onsuccess = () => {if(blocked){req.result.close();return;}req.result.onversionchange = () => {req.result.close(); database=null;}; resolve(req.result);};
      req.onblocked = () => {blocked=true;database=null; reject(Error('Kho đang được mở ở cửa sổ khác. Đóng cửa sổ đó và thử lại.'));};
      req.onerror = () => {database = null; reject(Error('Không mở được kho tài nguyên. Kiểm tra quyền lưu trữ của trình duyệt.'));};
    });
    return database.catch(error=>{database=null;throw Error('Không mở được kho tài nguyên. Kiểm tra quyền lưu trữ và đóng các cửa sổ đang mở kho.');});
  }
  async function transact(mode, action) {
    const database = await db();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('entries', mode), store = tx.objectStore('entries'); let result;
      try {result = action(store);} catch (e) {tx.abort(); reject(Error(e.name==='QuotaExceededError'?'Không đủ dung lượng lưu kho. Hãy xuất bản sao lưu hoặc giảm dung lượng ảnh.':e.message)); return;}
      tx.oncomplete = () => resolve(result?.result);
      tx.onerror = tx.onabort = () => reject(Error('Không lưu được kho tài nguyên. Hãy xuất bản sao lưu và kiểm tra dung lượng.'));
    });
  }
  const listEntries = () => transact('readonly', s => s.getAll());
  const saveEntry = entry => transact('readwrite', s => s.put(entry));
  const removeEntry = id => transact('readwrite', s => s.delete(id));
  const picture = source => new Promise((resolve, reject) => {const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(Error('Không đọc được ảnh.')); img.src = source;});
  const fileData = file => new Promise((resolve, reject) => {const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(Error('Không đọc được tệp.')); r.readAsDataURL(file);});
  async function raster(source) {
    const image = await picture(source);
    if (image.width * image.height > 40000000) throw Error('Ảnh vượt 40 triệu pixel. Hãy giảm kích thước trước khi nhập.');
    const scale = Math.min(1, 180 / image.width, 130 / image.height);
    const canvas = cv(Math.max(1, Math.round(image.width * scale)), Math.max(1, Math.round(image.height * scale)));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    const thumb = cv(180, 130), ctx = thumb.getContext('2d'), fit = Math.min(172 / canvas.width, 122 / canvas.height);
    ctx.drawImage(canvas, (180 - canvas.width * fit) / 2, (130 - canvas.height * fit) / 2, canvas.width * fit, canvas.height * fit);
    return {src: source, thumbnail: thumb.toDataURL('image/png'), width: image.width, height: image.height};
  }
  async function assetFromFile(file) {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw Error('Kho ảnh nhận PNG, JPG và WebP.');
    if (file.size > 12 * 1024 * 1024) throw Error('Mỗi ảnh tối đa 12 MB.');
    const image = await raster(await fileData(file));
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', C.dataBytes(image.src))), b => b.toString(16).padStart(2, '0')).join('');
    return {id: 'asset-' + hash, type: 'image', name: file.name.replace(/\.[^.]+$/, '').slice(0, 80), tags: '', favorite: false, created: Date.now(), ...image};
  }
  const ornaments = [
    ['Hoa năm cánh', 'hoa sinh nhat khai truong', '<g fill="#C43A50"><ellipse cx="64" cy="39" rx="15" ry="25"/><ellipse cx="64" cy="39" rx="15" ry="25" transform="rotate(72 64 64)"/><ellipse cx="64" cy="39" rx="15" ry="25" transform="rotate(144 64 64)"/><ellipse cx="64" cy="39" rx="15" ry="25" transform="rotate(216 64 64)"/><ellipse cx="64" cy="39" rx="15" ry="25" transform="rotate(288 64 64)"/></g><circle cx="64" cy="64" r="15" fill="#E7BC58"/>'],
    ['Cành lá', 'la cay trang tri xanh', '<path d="M25 110Q55 70 104 18" fill="none" stroke="#456F50" stroke-width="4"/><g fill="#6F9663"><path d="M45 88Q8 60 31 45Q55 57 45 88M64 67Q35 32 58 20Q78 37 64 67M48 88Q72 100 89 73Q64 65 48 88M69 64Q96 70 113 42Q89 35 69 64"/></g>'],
    ['Nơ đỏ', 'no ruy bang hoa', '<path d="M57 65 34 119l-7-23-23 4 37-48M72 65l22 54 8-23 22 4-37-48" fill="#A52B3B"/><path d="M60 53Q7 1 7 41q0 42 52 28M69 53q52-52 52-12 0 42-52 28" fill="#CA4054"/><rect x="54" y="48" width="23" height="28" rx="7" fill="#E5B654"/>'],
    ['Huy hiệu vàng', 'huy hieu chuc mung', '<path d="m43 76-13 48 28-15 14 18 12-51" fill="#B92C3B"/><circle cx="64" cy="51" r="43" fill="#D9AD46"/><circle cx="64" cy="51" r="34" fill="none" stroke="#FFF4CC" stroke-width="2"/><path d="m64 25 8 17 19 3-14 14 3 20-16-10-17 10 3-20-14-14 20-3Z" fill="#FFF4CC"/>'],
    ['Góc hoa thanh lịch', 'goc khung hoa la', '<path d="M15 113V15h98" stroke="#BDA065" stroke-width="2" fill="none"/><path d="M23 100V23h77" stroke="#BDA065" fill="none"/><path d="M28 61Q60 22 102 28M27 88Q43 57 49 37" stroke="#647E60" fill="none" stroke-width="3"/><g fill="#CA6771"><circle cx="38" cy="38" r="16"/><circle cx="60" cy="24" r="12"/><circle cx="25" cy="65" r="11"/></g><g fill="#E5C573"><circle cx="38" cy="38" r="5"/><circle cx="60" cy="24" r="4"/></g>'],
    ['Trái tim', 'tim yeu cuoi sinh nhat', '<path d="M64 113 14 63C-11 26 36 3 64 36 92 3 139 26 114 63Z" fill="#BD3B53"/>'],
    ['Dải ruy băng', 'banner bang ron chu', '<path d="M0 37h30v56H0l13-28ZM98 37h30l-13 28 13 28H98Z" fill="#982638"/><path d="M20 26h88v56H20Z" fill="#C43A50"/><path d="m20 82 10 11V82m78 0-10 11V82" fill="#702334"/>'],
    ['Vòng nguyệt quế', 'vong la tri an', '<path d="M62 109Q6 91 21 24M66 109q56-18 41-85" stroke="#9E853E" stroke-width="3" fill="none"/><g fill="#BFA24F"><ellipse cx="24" cy="36" rx="8" ry="16" transform="rotate(-35 24 36)"/><ellipse cx="22" cy="66" rx="8" ry="16" transform="rotate(-55 22 66)"/><ellipse cx="39" cy="90" rx="8" ry="16" transform="rotate(-60 39 90)"/><ellipse cx="104" cy="36" rx="8" ry="16" transform="rotate(35 104 36)"/><ellipse cx="106" cy="66" rx="8" ry="16" transform="rotate(55 106 66)"/><ellipse cx="89" cy="90" rx="8" ry="16" transform="rotate(60 89 90)"/></g>']
  ].map(([name, tags, body], i) => ({id: 'builtin-' + i, type: 'ornament', name, tags, src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 128 128">' + body + '</svg>')}));
  const recipes = [
    ['khai-truong', 'Khai trương hồng phát', 'Khai trương', 'CHÚC MỪNG KHAI TRƯƠNG', 'Khai trương hồng phát', '#B92C3B'],
    ['sinh-nhat', 'Sinh nhật thanh lịch', 'Sinh nhật', 'CHÚC MỪNG SINH NHẬT', 'Tuổi mới nhiều niềm vui', '#A53C63'],
    ['tan-gia', 'Tân gia an khang', 'Tân gia', 'CHÚC MỪNG TÂN GIA', 'An cư lạc nghiệp', '#9A663A'],
    ['dam-cuoi', 'Hạnh phúc trăm năm', 'Cưới hỏi', 'CHÚC MỪNG HẠNH PHÚC', 'Trăm năm hạnh phúc', '#AC3E51'],
    ['tri-an', 'Tri ân thầy cô', 'Tri ân', 'TRÂN TRỌNG TRI ÂN', 'Kính chúc sức khỏe và hạnh phúc', '#4E6857'],
    ['hoi-nghi', 'Chúc mừng hội nghị', 'Hội nghị', 'CHÚC MỪNG HỘI NGHỊ', 'Thành công tốt đẹp', '#314E70'],
    ['kinh-vieng', 'Kính viếng trang trọng', 'Chia buồn', 'KÍNH VIẾNG', 'Thành kính phân ưu', '#34363D'],
    ['tet', 'Xuân an khang', 'Tết', 'CHÚC MỪNG NĂM MỚI', 'An khang thịnh vượng', '#B02936'],
    ['20-10', 'Ngày phụ nữ Việt Nam', '20/10', 'CHÚC MỪNG NGÀY 20/10', 'Luôn rạng rỡ và hạnh phúc', '#A44366'],
    ['8-3', 'Ngày quốc tế phụ nữ', '8/3', 'CHÚC MỪNG NGÀY 8/3', 'Yêu thương và trân trọng', '#AC455C'],
    ['ky-niem', 'Kỷ niệm đáng nhớ', 'Kỷ niệm', 'CHÚC MỪNG KỶ NIỆM', 'Bền vững cùng năm tháng', '#815D35'],
    ['chuc-mung', 'Lời chúc tinh tế', 'Chúc mừng', 'CHÚC MỪNG', 'Vạn sự như ý', '#B92C3B']
  ].map(([id, name, category, heading, wish, color]) => ({id, name, category, heading, wish, color}));
  const library = dialog('studioLibrary', 'Tài nguyên & mẫu thiết kế');
  const toolbar = el('div', {class: 'studioToolbar'});
  const search = el('input', {type: 'search', placeholder: 'Tìm hoa, logo, khai trương…', 'aria-label': 'Tìm tài nguyên'});
  const select = el('select', {'aria-label': 'Loại tài nguyên'});
  for (const [value, label] of [['image','Ảnh của tôi'], ['ornament','Hoa & trang trí'], ['template','Mẫu điền nhanh'], ['favorite','Yêu thích']]) select.add(new Option(label, value));
  toolbar.append(search, select); library.append(toolbar);
  const actions = el('div', {class: 'studioToolbar'}), grid = el('div', {class: 'studioGrid'}); library.append(actions, grid);
  library.append(el('p', {class: 'studioHint'}, 'Kho riêng lưu trên trình duyệt/máy đang dùng. Xuất kho để sao lưu hoặc chuyển máy. Ảnh đã chèn vào thiết kế được lưu cùng mẫu.'));
  const message = feedback(library);
  const upload = el('input', {type: 'file', accept: 'image/png,image/jpeg,image/webp', multiple: '', hidden: ''}); library.append(upload);
  upload.onchange = async () => {
    upload.disabled=true;try {
    let added = 0; const existing = new Set((await listEntries()).map(x => x.id)); const errors = [];
    for (const file of upload.files) try {const entry = await assetFromFile(file); if (!existing.has(entry.id)) {if(existing.size>=500)throw Error('Kho tối đa 500 tài nguyên; hãy xuất và chia kho trước khi thêm.');await saveEntry(entry); existing.add(entry.id); added++;}} catch (e) {errors.push(file.name + ': ' + e.message);}
    upload.value = ''; select.value = 'image'; await renderLibrary(); message.textContent = 'Đã thêm ' + added + ' ảnh. Ảnh trùng được bỏ qua. ' + errors.join(' ');
    }catch(e){message.textContent=e.message;}finally{upload.value='';upload.disabled=false;}
  };
  actions.append(button('Thêm ảnh', () => upload.click()), button('Lưu thiết kế thành mẫu', () => saveCurrentTemplate()), button('Xuất kho', exportLibrary), button('Nhập kho', importLibrary));
  let renderRevision = 0;
  async function renderLibrary() {
    const revision = ++renderRevision, entries = await listEntries();
    if (revision !== renderRevision) return;
    const builtin = recipes.map(recipe => ({...recipe, type: 'template', builtin: true, tags: recipe.category, thumbnail: actualRecipeThumb(recipe)}));
    const defaults=[...ornaments,...builtin].map(entry=>({...entry,builtin:true}));
    const items = [...entries.filter(x=>x.type!=='builtin-meta'),...defaults.map(entry=>({...entry,...entries.find(x=>x.id==='meta-'+entry.id),id:entry.id,type:entry.type,builtin:true}))].filter(x=>!x.deleted), query = C.normalize(search.value);
    const results = items.filter(x => (select.value === 'favorite' ? x.favorite : x.type === select.value) && C.normalize(x.name + ' ' + (x.tags || '')).includes(query));
    grid.replaceChildren();
    if (!results.length) grid.append(el('p', {class: 'studioEmpty'}, 'Chưa có tài nguyên phù hợp. Thêm ảnh từ máy hoặc đổi bộ lọc.'));
    for (const entry of results) {
      const card = el('article', {class: 'studioCard'});
      const open = button('', () => entry.type === 'template' ? openTemplate(entry) : insertAsset(entry), {'aria-label': (entry.type === 'template' ? 'Dùng mẫu ' : 'Chèn ') + entry.name, class: 'studioCardOpen'});
      open.append(el('img', {src: entry.thumbnail || entry.src, alt: '', loading: 'lazy'}), el('strong', {}, entry.name));
      card.append(open);
      {
        const row = el('div', {class: 'studioCardActions'});
        row.append(button(entry.favorite ? '★ Đã thích' : '☆ Yêu thích', async () => {entry.favorite = !entry.favorite; await saveEntry(entry.builtin?{id:'meta-'+entry.id,type:'builtin-meta',name:entry.name,tags:entry.tags,favorite:entry.favorite}:entry); await renderLibrary();}), button('Sửa', () => editEntry(entry)), button('Xóa', async () => {if (confirm('Xóa “' + entry.name + '” khỏi kho? Các thiết kế đã dùng tài nguyên vẫn được giữ.')) {if(entry.builtin)await saveEntry({id:'meta-'+entry.id,type:'builtin-meta',name:entry.name,tags:entry.tags,favorite:entry.favorite,deleted:true});else await removeEntry(entry.id); await renderLibrary();}}));
        card.append(row);
      }
      grid.append(card);
    }
    message.textContent = results.length + ' tài nguyên';
  }
  search.oninput = select.onchange = () => renderLibrary().catch(e => message.textContent = e.message);
  async function openLibrary(type = 'image') {select.value = type; search.value = ''; library.showModal();try{await renderLibrary();}catch(e){message.textContent=e.message;throw e;}}
  const entryEditor = dialog('studioEntryEditor', 'Thông tin tài nguyên');
  const entryName = field(entryEditor, 'Tên', 'studioEntryName'), entryTags = field(entryEditor, 'Từ khóa (cách nhau bằng dấu phẩy)', 'studioEntryTags');
  let editingEntry;
  entryEditor.append(button('Lưu thông tin', async () => {
    if (!entryName.value.trim()) throw Error('Hãy nhập tên tài nguyên.');
    await saveEntry({...editingEntry, ...(editingEntry.builtin?{id:'meta-'+editingEntry.id,type:'builtin-meta'}:{}), name: entryName.value.trim().slice(0,80), tags: entryTags.value.slice(0,400)}); entryEditor.close(); await renderLibrary();
  }, {class:'primary'})); feedback(entryEditor);
  function editEntry(entry) {editingEntry = entry; entryName.value = entry.name; entryTags.value = entry.tags || ''; entryEditor.showModal();}
  async function insertAsset(entry) {
    if (!home.hidden) throw Error('Hãy mở hoặc tạo thiết kế trước khi chèn ảnh.');
    let source = entry.src;
    if (entry.type === 'ornament') {const img = await picture(source), c = cv(img.width,img.height); c.getContext('2d').drawImage(img,0,0); source = c.toDataURL('image/png');}
    if (contextSelectionLocked()) throw Error('Hãy mở khóa khối đang chọn hoặc chọn khối khác trước khi chèn.');
    const image = await picture(source);
    if (isDesign() && (editorText().trim() || decorations.length)) await newDesignText('<div></div>');
    await addGraphic('image', source, {width:image.width,height:image.height});
    selectedGraphicId = null; selectedGraphicSet.clear();
    selectedLabelSet = new Set([activeLabelId]); syncGraphicControls();
    await preview();recordHistory();library.close(); status('Đã chèn ' + entry.name + '. Giữ Shift để chọn cùng khối chữ và Nhóm.');
  }

  async function exportLibrary() {
    const entries = await listEntries();
    const payload=new Blob([JSON.stringify({format:'temhoa-library', version:1, entries})],{type:'application/json'});if(payload.size>64*1024*1024)throw Error('Bản sao lưu vượt 64 MB. Hãy chia kho thành các bộ nhỏ.');
    download(payload, 'TEMhoa-Kho-' + new Date().toISOString().slice(0,10) + '.json');
  }
  async function validateEntries(data) {
    if (data?.format !== 'temhoa-library' || data.version !== 1 || !Array.isArray(data.entries) || data.entries.length > 500) throw Error('Tệp kho không hợp lệ (tối đa 500 tài nguyên).');
    const result = [];
    for (const item of data.entries) {
      if (typeof item.id !== 'string' || !/^(asset-[a-f0-9]{64}|template-[a-zA-Z0-9-]+|meta-[a-zA-Z0-9-]+)$/.test(item.id) || typeof item.name !== 'string' || !item.name.trim()) throw Error('Thông tin tài nguyên không hợp lệ.');
      const entry = {id:item.id, name:item.name.slice(0,80), tags:String(item.tags || '').slice(0,400), favorite:item.favorite === true, created:Date.now(), type:item.type};
      if (item.type === 'image') {
        if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(item.src || '') || item.src.length > 24*1024*1024) throw Error('Ảnh trong kho không hợp lệ.');
        Object.assign(entry, await raster(item.src));
        const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', C.dataBytes(entry.src))), b => b.toString(16).padStart(2,'0')).join('');
        entry.id = 'asset-' + digest;
      } else if (item.type === 'template') {
        if(!item.document)throw Error('Mẫu không hợp lệ.');const data = clone(item.document);
        if (!data || typeof data.text !== 'string' || !Array.isArray(data.labels) || !data.labels.length || data.labels.length > 20) throw Error('Mẫu không hợp lệ.');
        for (const label of data.labels) {
          if (typeof label.text !== 'string' || label.text.length > 2000) throw Error('Chữ trong mẫu không hợp lệ.');
          label.richHTML = cleanRichHTML(label.richHTML || plainHTML(label.text));
          if(!Array.isArray(label.decorations||[])||(label.decorations||[]).length>12)throw Error('Mỗi khối tối đa 12 hình.');
          label.decorations=await Promise.all((label.decorations||[]).map(async raw=>{for(const key of ['src','original','sourceOriginal'])if((raw[key]||'').length>24*1024*1024)throw Error('Ảnh trong mẫu quá lớn.');const graphic=safeGraphic(raw);if(!graphic)throw Error('Ảnh trong mẫu không hợp lệ.');if(graphic.kind==='image')await picture(graphic.src);return graphic;}));
        }
        data.richHTML=cleanRichHTML(data.richHTML||plainHTML(data.text));data.decorations=(data.decorations||[]).map(safeGraphic).filter(Boolean).slice(0,12);entry.document = clone(data);
        entry.thumbnail = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(item.thumbnail || '') ? item.thumbnail : '';
      } else if(item.type==='builtin-meta'&&[...ornaments,...recipes].some(x=>'meta-'+x.id===item.id)){entry.deleted=item.deleted===true;} else throw Error('Loại tài nguyên không được hỗ trợ.');
      result.push(entry);
    }
    return result;
  }
  function importLibrary() {
    const input = el('input', {type:'file', accept:'.json,application/json'});
    input.onchange = async () => {try {
      const file = input.files[0]; if (!file) return;
      if (file.size > 64*1024*1024) throw Error('Tệp kho tối đa 64 MB.');
      const entries = await validateEntries(JSON.parse(await file.text())), existing = new Set((await listEntries()).map(x => x.id));
      const added = entries.filter(x => {if(existing.has(x.id))return false;existing.add(x.id);return true;});
      await transact('readwrite', store => {for (const item of added){const request=store.add(item);request.onerror=event=>{if(request.error?.name==='ConstraintError'){event.preventDefault();event.stopPropagation();}}}});
      await renderLibrary(); message.textContent = 'Đã nhập ' + added.length + ' tài nguyên; giữ nguyên tài nguyên đang có.';
    } catch (e) {message.textContent = e.message;}}; input.click();
  }
  const recipeThumbnails=new Map();
  function actualRecipeThumb(recipe){const key=recipe.id+'|'+$('page').value;if(!recipeThumbnails.has(key))recipeThumbnails.set(key,studioThumbnail(recipeDocument(recipe,{heading:recipe.heading,recipient:'Tên người nhận',sender:'Người gửi lời chúc',wish:recipe.wish})));return recipeThumbnails.get(key);}
  const quick = dialog('studioQuickTemplate', 'Điền nội dung mẫu');
  const quickBody = el('div', {class:'studioQuickBody'}), quickFields = el('div'), quickPreview = el('img', {alt:'Xem trước nội dung mẫu', class:'studioTemplatePreview'});
  quickBody.append(quickFields, quickPreview); quick.append(quickBody);
  const quickInfo = el('p', {class:'studioHint'}); quick.append(quickInfo);
  let selectedTemplate, quickMap = [];
  quick.append(button('Tạo thiết kế từ mẫu', useTemplate, {id:'studioUseTemplate', class:'primary'})); feedback(quick);
  function openTemplate(entry) {
    selectedTemplate = entry; quickFields.replaceChildren(); quickMap = [];
    if (entry.builtin) {
      for (const [key, label, value] of [['heading','Tiêu đề',entry.heading], ['recipient','Người nhận',''], ['wish','Lời chúc',entry.wish], ['sender','Người gửi','']]) {
        const input = field(quickFields, label, 'studioField-' + key, 'text', value); input.maxLength = 180; quickMap.push({key,input});
        input.oninput = () => refreshQuickPreview().catch(e=>quickInfo.textContent=e.message);
      }
      refreshQuickPreview().catch(e=>quickInfo.textContent=e.message);
      quickInfo.textContent = 'Chữ dài được xuống dòng và giảm cỡ trong giới hạn của mẫu. Sau khi tạo, mọi khối chữ đều chỉnh sửa được.';
    } else {
      for (const [i, label] of entry.document.labels.entries()) {
        const holder = document.createElement('div'); holder.innerHTML = cleanRichHTML(label.richHTML || plainHTML(label.text));
        const walker = document.createTreeWalker(holder, NodeFilter.SHOW_TEXT); let node, index = 0;
        while ((node = walker.nextNode())) {
          if (node.textContent.trim()) {
            const input = field(quickFields, 'Khối ' + (i+1) + ' · đoạn ' + (index+1), 'studioField-' + i + '-' + index, 'text', node.textContent); input.maxLength = 500; quickMap.push({label:i, node:index, input});input.oninput=()=>refreshQuickPreview().catch(e=>quickInfo.textContent=e.message);
          }
          index++;
        }
      }
      refreshQuickPreview().catch(e=>quickInfo.textContent=e.message);
      quickInfo.textContent = 'Xem trước nội dung thực tế; giữ ảnh và định dạng của bản mẫu. Chữ dài sẽ giảm cỡ để vừa vùng cũ.';
    }
    quick.showModal();
  }
  function wrapText(value, length = 26) {
    const lines = []; let line = '';
    for (const word of value.trim().split(/\s+/)) {
      if (line && (line + ' ' + word).length > length) {lines.push(line); line = word;} else line += (line ? ' ' : '') + word;
    }
    if (line) lines.push(line);
    return lines;
  }
  function recipeDocument(recipe, values) {
    const source = clone(homeBaseSettings), page = previewPage(), width = page.width - 4;
    const rows = [
      [values.heading, .20, 46, true], [values.recipient, .36, 64, true],
      [values.wish, .60, 38, false], [values.sender, .76, 32, false]
    ].filter(x => x[0]?.trim());
    if (!rows.length) throw Error('Hãy nhập ít nhất một nội dung.');
    const docs = rows.map(([value, fraction, size, bold]) => {
      const lines = wrapText(value, fraction === .36 ? 24 : 36);
      size = Math.max(20, Math.min(size, 90 / Math.max(1, lines.length)));
      const richHTML = lines.map(line => '<div>' + C.escape(line) + '</div>').join('');
      return {...clone(source), designKind:'text', text:lines.join('\n'), richHTML, decorations:[], wordFrame:'', layerStack:'{}', labelGroup:'', mixedGroup:'', labelLocked:false, width, labelX:2, labelY:page.height*fraction, labelScaleX:1, labelScaleY:1, padding:0, border:0, curveAmount:0, curveOverrides:'{}', textOffsetX:0, textOffsetY:0, editLayer:'text', font:'Arial', customFont:'', size, bold, italic:false, underline:false, align:'center', spacing:.85, fill:recipe.color, defaultTextStyle:{size,bold,italic:false,underline:false}, lineStyles:[], colorStyles:{fill:{type:'solid'},body:{type:'clear'},edge:{type:'clear'}}};
    });
    let y=1.5;const available=page.height-3,gap=.5,slot=(available-gap*(docs.length-1))/docs.length;for(const label of docs){const measured=studioMeasure(label),scale=Math.min(1,slot/Math.max(.01,measured.height));label.labelScaleX=scale;label.labelScaleY=scale;label.labelX=(page.width-label.width*scale)/2;label.labelY=y+(slot-measured.height*scale)/2;y+=slot+gap;}
    return {...docs[0], page:$('page').value, labels:docs, activeLabel:0};
  }
  function quickDocument() {
    if(selectedTemplate.builtin)return recipeDocument(selectedTemplate,Object.fromEntries(quickMap.map(x=>[x.key,x.input.value])));
    const data=clone(selectedTemplate.document);
    for(const [i,label] of data.labels.entries()){
      const holder=document.createElement('div');holder.innerHTML=cleanRichHTML(label.richHTML||plainHTML(label.text));
      const walker=document.createTreeWalker(holder,NodeFilter.SHOW_TEXT);let node,index=0;
      while((node=walker.nextNode())){const match=quickMap.find(x=>x.label===i&&x.node===index++);if(match)node.textContent=match.input.value;}
      const before=studioMeasure(label);label.richHTML=holder.innerHTML;label.text=holder.textContent||'';
      // Scale the replacement into its previous physical box without altering inline styles.
      const after=studioMeasure(label);const fit=Math.min(1,before.height/Math.max(.01,after.height));
      label.labelScaleY=Number(label.labelScaleY||1)*fit;label.labelScaleX=Number(label.labelScaleX||1)*fit;
    }return data;
  }
  let quickRevision=0;
  async function refreshQuickPreview(){const revision=++quickRevision,data=quickDocument();await ensureGraphics(data.labels.flatMap(x=>x.decorations||[]));if(revision!==quickRevision)return;quickPreview.src=studioThumbnail(data);}
  function studioIsolate(data,action){
    saveActiveLabel();const saved={labels,activeLabelId,page:$('page').value,data:oneLabelSettings(),size:previewSize,graphic:selectedGraphicId,graphics:new Set(selectedGraphicSet),selected:new Set(selectedLabelSet),offsets:selectionOffsets()};
    try{labels=data.labels.map((settings,i)=>({id:'preview-'+i,settings:clone(settings)}));activeLabelId=labels[0].id;if(data.page)$('page').value=data.page;setLabelSettings(labels[0].settings);return action();}
    finally{labels=saved.labels;activeLabelId=saved.activeLabelId;$('page').value=saved.page;setLabelSettings(saved.data,true);previewSize=saved.size;selectedGraphicId=saved.graphic;selectedGraphicSet=saved.graphics;selectedLabelSet=saved.selected;if(saved.offsets)savedSelection=rangeOffsets($('temEditor'),saved.offsets);}
  }
  function studioMeasure(label){return studioIsolate({labels:[label]},()=>{const r=render(false,1,false);return {width:r.cm,height:r.heightCm};});}
  function studioThumbnail(data){return studioIsolate(data,()=>renderOutputPage(previewPage(),{dpi:50,white:true}).toDataURL('image/png'));}
  async function useTemplate() {
    if (typeof flushAutoSave === 'function' && !(await flushAutoSave())) throw Error('Thiết kế hiện tại chưa lưu được. Hãy xử lý lỗi lưu trước khi tạo mẫu mới.');
    const data=quickDocument();
    if (data.labels.some(l => l.text.length > 2000)) throw Error('Nội dung quá dài, tối đa 2.000 ký tự mỗi khối.');
    await homeLoadTask;recordHistory(); designEditing = false; await restoreLabelDocument(data);
    currentTemplateName = ''; recordHistory();
    enterHomeEditor(); beginAutoDocument(); captureAutoChanges(); quick.close(); library.close(); zoom();
    status('Đã tạo bản thiết kế mới từ mẫu. Bạn có thể chỉnh từng khối chữ.');
  }
  const templateSave = dialog('studioSaveTemplate', 'Lưu mẫu điền nhanh');
  const templateName = field(templateSave, 'Tên mẫu', 'studioTemplateName'), templateTags = field(templateSave, 'Chủ đề / từ khóa', 'studioTemplateTags');
  templateSave.append(el('p', {class:'studioHint'}, 'Lưu một bản mẫu riêng. Khi sử dụng, mỗi đoạn chữ trở thành một trường điền nhanh; thiết kế gốc được giữ.'));
  templateSave.append(button('Lưu vào kho mẫu', async () => {
    if (!templateName.value.trim()) throw Error('Hãy nhập tên mẫu.');
    await ensureDocumentFonts(); const data = clone(settings()), thumbnail = autoThumbnail();
    await saveEntry({id:'template-'+crypto.randomUUID(), type:'template', name:templateName.value.trim().slice(0,80), tags:templateTags.value.slice(0,400), document:data, thumbnail, created:Date.now(), favorite:false});
    templateSave.close(); select.value='template'; await renderLibrary();
  }, {class:'primary'})); feedback(templateSave);
  function saveCurrentTemplate() {
    if (!home.hidden) throw Error('Hãy mở thiết kế muốn lưu thành mẫu trước.');
    templateName.value = currentTemplateName || ''; templateTags.value = ''; templateSave.showModal();
  }
  // PDF and imposition reuse one high-resolution image; no huge canvas per copy.
  const production = dialog('studioProduction', 'Xuất PDF & dàn tem');
  const form = el('div', {class:'studioProductionForm'}), controls = el('div'), previewCanvas = el('canvas', {id:'studioPrintPreview'});
  form.append(controls, previewCanvas); production.append(form);
  const modeLabel = el('label', {}, 'Kiểu xuất'), mode = el('select', {id:'studioPrintMode'});
  mode.add(new Option('Toàn trang thiết kế','page')); mode.add(new Option('Dàn nhiều tem (lấy toàn bộ nội dung làm một tem)','pack')); modeLabel.append(mode); controls.append(modeLabel);
  const paperLabel = el('label', {}, 'Khổ giấy'), paperSelect = el('select', {id:'studioPaper'});
  for (const p of ['A5','A4','A3']) paperSelect.add(new Option(p,p)); paperLabel.append(paperSelect); controls.append(paperLabel);
  const orientationLabel = el('label', {}, 'Chiều giấy'), orientation = el('select', {id:'studioOrientation'});
  orientation.add(new Option('Ngang','landscape')); orientation.add(new Option('Dọc','portrait')); orientationLabel.append(orientation); controls.append(orientationLabel);
  const widthInput = field(controls, 'Rộng mỗi tem (mm)', 'studioLabelWidth', 'number', '100');
  widthInput.min='10'; widthInput.max='420'; widthInput.step='.1';
  const copiesInput = field(controls, 'Số lượng tem', 'studioCopies', 'number', '6'); copiesInput.min='1'; copiesInput.max='500';
  const marginInput = field(controls, 'Lề giấy (mm)', 'studioMargin', 'number', '5'); marginInput.min='0'; marginInput.step='.5';
  const gapInput = field(controls, 'Khoảng cách (mm)', 'studioGap', 'number', '4'); gapInput.min='0'; gapInput.step='.5';
  const marksInput = field(controls, 'Dấu cắt', 'studioMarks', 'checkbox'); marksInput.checked=false;
  const productionInfo = el('p', {class:'studioHint'}); production.append(productionInfo);
  production.append(el('p', {class:'studioHint'}, 'PDF dùng ảnh 300 DPI, giữ đúng màu hiển thị. Khi in PDF chọn khổ giấy tương ứng và tỷ lệ 100%. Chưa có chuyển đổi CMYK hoặc PDF vector.'));
  const pageLabel=el('label',{},'Trang xem trước'),pagePicker=el('select',{id:'studioPreviewPage'});pageLabel.append(pagePicker);controls.append(pageLabel);pagePicker.oninput=updateProduction;
  let productionSource = null, productionCrop = null, productionBusy = false;
  const pdfButton = button('Tải PDF', exportPDF, {id:'studioExportPDF', class:'primary'}); production.append(pdfButton);
  const productionMessage = feedback(production);
  function targetPaper() {const p=outputPapers[paperSelect.value]; return orientation.value==='landscape'?{width:p.height*10,height:p.width*10}:{width:p.width*10,height:p.height*10};}
  function printPlan() {
    const paper=targetPaper();
    if (mode.value==='page') {
      const source=previewPage(), scale=Math.min(paper.width/(source.width*10),paper.height/(source.height*10));
      const width=source.width*10*scale,height=source.height*10*scale;
      return {...paper,pages:1,perPage:1,slots:[{page:0,x:(paper.width-width)/2,y:(paper.height-height)/2,width,height}]};
    }
    const width=Number(widthInput.value), height=width*productionCrop.height/productionCrop.width;
    const plan=C.packing({paperWidth:paper.width,paperHeight:paper.height,width,height,margin:Number(marginInput.value),gap:Number(gapInput.value),copies:Number(copiesInput.value)});
    if (marksInput.checked && (Number(gapInput.value)<4||Number(marginInput.value)<2)) throw Error('Dấu cắt cần khoảng cách tối thiểu 4 mm và lề 2 mm.');
    return {...paper,...plan,slots:plan.slots.map(s=>({...s,marks:marksInput.checked}))};
  }
  function updateProduction() {
    if (!productionSource) return;
    for (const input of [widthInput,copiesInput,marginInput,gapInput,marksInput]) input.closest('label').hidden=mode.value!=='pack';
    try {
      const plan=printPlan(), unit=1.7, source=mode.value==='pack'?productionCrop:productionSource;
      previewCanvas.width=Math.round(plan.width*unit);previewCanvas.height=Math.round(plan.height*unit);
      const ctx=previewCanvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,previewCanvas.width,previewCanvas.height);
      const selected=Math.min(plan.pages-1,Number(pagePicker.value)||0);if(pagePicker.options.length!==plan.pages){pagePicker.replaceChildren();for(let i=0;i<plan.pages;i++)pagePicker.add(new Option('Trang '+(i+1),String(i)));}pagePicker.value=String(selected);
      for(const slot of plan.slots.filter(s=>s.page===selected)){ctx.drawImage(source,slot.x*unit,slot.y*unit,slot.width*unit,slot.height*unit);if(slot.marks){ctx.strokeStyle='#777';ctx.lineWidth=.5;for(const x of [slot.x,slot.x+slot.width])for(const y of [slot.y,slot.y+slot.height]){const dx=x===slot.x?-1:1,dy=y===slot.y?-1:1;ctx.beginPath();ctx.moveTo((x+dx*.5)*unit,y*unit);ctx.lineTo((x+dx*2)*unit,y*unit);ctx.moveTo(x*unit,(y+dy*.5)*unit);ctx.lineTo(x*unit,(y+dy*2)*unit);ctx.stroke();}}}
      productionInfo.textContent=plan.pages+' trang · '+plan.perPage+' tem/trang'+(mode.value==='pack'?' · mỗi tem '+plan.slots[0].width.toFixed(1)+' × '+plan.slots[0].height.toFixed(1)+' mm':'')+' · xem trước trang '+(selected+1);
      productionMessage.textContent='';pdfButton.disabled=false;
    }catch(e){productionMessage.textContent=e.message;pdfButton.disabled=true;}
  }
  for(const input of [mode,paperSelect,orientation,widthInput,copiesInput,marginInput,gapInput,marksInput])input.oninput=updateProduction;
  async function openProduction(pack=false){
    if(!home.hidden)throw Error('Hãy mở thiết kế trước khi xuất.');
    await ensureDocumentFonts();productionSource=renderOutputPage(previewPage(),{dpi:70,white:false});
    const b=productionSource.printInk;productionCrop=cv(b.width,b.height);productionCrop.getContext('2d').drawImage(productionSource,b.x,b.y,b.width,b.height,0,0,b.width,b.height);
    mode.value=pack?'pack':'page';paperSelect.value=sourcePaperName();orientation.value=previewPage().width>previewPage().height?'landscape':'portrait';
    updateProduction();production.showModal();
  }
  async function exportPDF(){
    if(productionBusy)return;productionBusy=true;productionMessage.textContent='Đang tạo PDF…';
    try{
      const plan=printPlan(), isPack=mode.value==='pack', source=previewPage();
      const width=plan.slots[0].width, dpi=isPack?Math.max(300,300*width/(productionCrop.width/70*25.4)):300*Math.max(plan.width/(source.width*10),plan.height/(source.height*10));
      await ensureDocumentFonts();
      const full=renderOutputPage(source,{dpi:Math.min(600,dpi,Math.floor(2.54*Math.sqrt(39000000/(source.width*source.height)))),white:false}), b=full.printInk;
      const artwork=isPack?cv(b.width,b.height):cv(full.width,full.height),ctx=artwork.getContext('2d');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,artwork.width,artwork.height);
      if(isPack)ctx.drawImage(full,b.x,b.y,b.width,b.height,0,0,b.width,b.height);else ctx.drawImage(full,0,0);
      const effectiveDpi=artwork.width/(width/25.4);
      const pages=Array.from({length:plan.pages},(_,page)=>plan.slots.filter(s=>s.page===page));
      const bytes=C.pdf({jpeg:C.dataBytes(artwork.toDataURL('image/jpeg',.98)),pixelWidth:artwork.width,pixelHeight:artwork.height,paperWidth:plan.width,paperHeight:plan.height,pages});
      download(new Blob([bytes],{type:'application/pdf'}),'TEMhoa-'+(isPack?'Dan-tem-':'')+paperSelect.value+'.pdf');
      productionMessage.textContent='Đã xuất '+plan.pages+' trang PDF · độ phân giải thực tế khoảng '+Math.round(effectiveDpi)+' DPI.';
    }finally{productionBusy=false;}
  }
  production.addEventListener('cancel',e=>{if(productionBusy)e.preventDefault();});
  production.addEventListener('close',()=>{productionSource=null;productionCrop=null;});
  const resourceButton=artButton('studioResources','Tài nguyên','image',()=>openLibrary().catch(fail));artDecorate(resourceButton,'image','Tài nguyên');artMain.append(resourceButton);
  const templateButton=button('Mẫu điền nhanh',()=>openLibrary('template'),{id:'studioHomeTemplates',class:'primary'});
  $('homeSearch').parentElement.append(templateButton);
  artExportMenu.append(button('PDF / Dàn tem…',()=>{artCloseExport();return openProduction();},{id:'studioPDF',role:'menuitem'}));
  window.TemStudio={openLibrary,listEntries,saveEntry,validateEntries,recipeDocument,recipes,openProduction,printPlan,exportPDF,insertAsset,openTemplate,studioThumbnail,studioMeasure,quickDocument,refreshQuickPreview,removeEntry,assetFromFile};
})();
