/* System clipboard and external drop import. Internal copies keep their group data. */
(() => {
  const marker=crypto.randomUUID(),mime='application/x-temhoa-selection',area=$('previewArea');
  let pending=Promise.resolve(),copyReady=Promise.resolve();
  const editing=target=>!!target?.closest?.('input,textarea,select,[contenteditable=true]');
  const active=()=>home.hidden&&!document.querySelector('dialog[open]');
  const report=e=>{$('status').textContent=e.message||String(e);};
  function enqueue(task){const context=autoContext;pending=pending.catch(()=>{}).then(()=>{if(context!==autoContext)throw Error('Thiết kế đã đổi. Hãy dán lại vào thiết kế đang mở.');return task();});pending.catch(report);return pending;}
  function plainHTML(html){const doc=new DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('script,style,iframe,object').forEach(n=>n.remove());doc.querySelectorAll('br').forEach(n=>n.replaceWith('\n'));doc.querySelectorAll('div,p,li,h1,h2,h3').forEach(n=>n.append('\n'));return doc.body.textContent.trim();}
  function richText(text){const n=document.createElement('div');n.textContent=text;return n.innerHTML.split(/\r?\n/).map(line=>'<div>'+(line||'<br>')+'</div>').join('');}
  function point(e){const r=$('previewStage').getBoundingClientRect(),p=previewPage();return {x:(e.clientX-r.left)/r.width*p.width,y:(e.clientY-r.top)/r.height*p.height};}
  async function importPayload({files=[],text='',html='',internal=false},position=null,inline=false){
    if(!active())throw Error('Hãy mở thiết kế trước khi dán hoặc kéo thả.');
    if(internal){if(contextSelectionLocked())throw Error('Hãy mở khóa hoặc chọn khối khác trước khi dán đối tượng.');await copyReady;await contextPasteSelection();return;}
    const owner=activeLabelId,context=autoContext;
    if(!files.length&&html){const image=new DOMParser().parseFromString(html,'text/html').querySelector('img[src]');if(image){const url=image.getAttribute('src');if(!/^data:image\/(png|jpeg|webp);base64,/i.test(url))throw Error('Ảnh liên kết web chưa nhập được trực tiếp. Hãy sao chép ảnh hoặc tải ảnh rồi thả vào canvas.');const blob=await (await fetch(url)).blob();files=[new File([blob],'Anh-da-dan.png',{type:blob.type})];}}
    if(files.length){
      if(contextSelectionLocked())throw Error('Hãy chọn vùng trống hoặc mở khóa trước khi thêm ảnh.');
      if(!isDesign()&&decorations.length+files.length>12)throw Error('Một tem tối đa 12 ảnh hoặc hình.');
      if(isDesign()&&labels.length+files.length>20)throw Error('Một trang tối đa 20 khối. Hãy giảm số ảnh.');
      const assets=[];for(const file of files)assets.push(await TemStudio.assetFromFile(file));
      if(!active()||owner!==activeLabelId||context!==autoContext)throw Error('Thiết kế đã đổi trong lúc đọc ảnh. Hãy dán lại.');
      for(let i=0;i<assets.length;i++){
        await TemStudio.insertAsset(assets[i]);
        if(position){const item=decorations.find(x=>x.kind==='image'),g=TemImageTools.worldGeometry(item);const dx=position.x-g.x+i*.5,dy=position.y-g.y+i*.5;if(!editorText().trim()&&decorations.length===1){$('labelX').value=Number($('labelX').value)+dx;$('labelY').value=Number($('labelY').value)+dy;}else{const L=previewSize.L,box=labelGeometry(currentLabel()),a=Number($('labelAngle').value||0)*Math.PI/180;item.x+=(dx*Math.cos(a)+dy*Math.sin(a))/(box.width/L.width);item.y+=(-dx*Math.sin(a)+dy*Math.cos(a))/(box.height/L.height);}await preview();recordHistory();}
        const image=decorations.find(x=>x.kind==='image');if(image){selectGraphicItems(image);positionGraphicOverlays();syncGraphicControls();}
      }
      $('labelSurface').focus({preventScroll:true});return;
    }
    text=text||plainHTML(html);if(!text)return;
    if(text.length>20000)throw Error('Văn bản tối đa 20.000 ký tự mỗi lần dán.');
    if(inline){if(contextSelectionLocked())throw Error('Hãy mở khóa trước khi sửa chữ.');pasteRetainingStyle(decodeInput(text));$('temEditor').dispatchEvent(new Event('input',{bubbles:true}));return;}
    await newDesignText(richText(text),{...oneLabelSettings(),labelLocked:false,labelAngle:0},position?{...position,width:Math.min(12,previewPage().width-2)}:null);$('labelSurface').focus({preventScroll:true});
  }
  function payload(dt){return {files:[...dt.files],text:dt.getData('text/plain'),html:dt.getData('text/html'),internal:dt.getData(mime)===marker||dt.getData('text/html').includes('<!--TEMhoa:'+marker+'-->')};}
  const copy=contextCopySelection;
  contextCopySelection=async function(native=false){await copy();const text=selectedGraphic()?'Ảnh TEMhoa':editorText();if(!native&&navigator.clipboard?.write&&window.ClipboardItem){try{await navigator.clipboard.write([new ClipboardItem({'text/plain':new Blob([text],{type:'text/plain'}),'text/html':new Blob(['<!--TEMhoa:'+marker+'-->'+richText(text)],{type:'text/html'})})]);}catch{/* Native copy event supplies the same payload without permission. */}}};
  window.addEventListener('keydown',e=>{if(!active()||editing(e.target)||!(e.metaKey||e.ctrlKey)||e.altKey)return;if(['c','v'].includes(e.key.toLowerCase()))e.stopImmediatePropagation();},true);
  window.addEventListener('copy',e=>{if(!active()||editing(e.target)||!e.clipboardData)return;e.preventDefault();e.stopImmediatePropagation();e.clipboardData.setData(mime,marker);e.clipboardData.setData('text/plain',selectedGraphic()?'Ảnh TEMhoa':editorText());e.clipboardData.setData('text/html','<!--TEMhoa:'+marker+'-->'+richText(editorText()));copyReady=contextCopySelection(true);copyReady.catch(report);},true);
  window.addEventListener('paste',e=>{
    if(!active()||!e.clipboardData)return;
    const data=payload(e.clipboardData),inEditor=$('temEditor').contains(e.target);
    if(inEditor&&contextSelectionLocked()){e.preventDefault();e.stopImmediatePropagation();report(Error('Hãy mở khóa trước khi sửa chữ.'));return;}
    if(editing(e.target)&&(!inEditor||(!data.files.length&&!data.html.includes('<img'))))return;
    e.preventDefault();e.stopImmediatePropagation();enqueue(()=>importPayload(data,null,inEditor&&!data.files.length));
  },true);
  function eligible(dt){return dt&&(dt.types.includes('Files')||(!layerDragData&&(dt.types.includes('text/plain')||dt.types.includes('text/html'))));}
  area.addEventListener('dragover',e=>{if(!active()||!eligible(e.dataTransfer))return;e.preventDefault();e.dataTransfer.dropEffect='copy';area.classList.add('externalDropActive');},true);
  area.addEventListener('dragleave',e=>{if(!area.contains(e.relatedTarget))area.classList.remove('externalDropActive');});
  area.addEventListener('drop',e=>{area.classList.remove('externalDropActive');if(!active()||!eligible(e.dataTransfer))return;e.preventDefault();e.stopImmediatePropagation();const data=payload(e.dataTransfer),at=point(e);enqueue(()=>importPayload(data,at));},true);
  window.addEventListener('dragend',()=>area.classList.remove('externalDropActive'));
  const paste=document.createElement('button');paste.id='systemPaste';paste.className='artButton';paste.type='button';paste.title='Dán ảnh hoặc chữ từ máy — ⌘V / Ctrl+V';paste.setAttribute('aria-label','Dán từ clipboard');paste.innerHTML=artIcon('copy')+'<span>Dán</span>';$('designAddImage').after(paste);
  paste.onclick=()=>enqueue(async()=>{if(!navigator.clipboard?.read)throw Error('Trình duyệt chưa cho đọc clipboard bằng nút. Hãy dùng ⌘V / Ctrl+V trên canvas.');try{const data={files:[],text:'',html:''};for(const item of await navigator.clipboard.read()){for(const type of item.types){if(type.startsWith('image/'))data.files.push(new File([await item.getType(type)],'Anh-clipboard.png',{type}));else if(type==='text/plain'||type==='text/html')data[type==='text/html'?'html':'text']=await (await item.getType(type)).text();}}data.internal=data.html.includes('<!--TEMhoa:'+marker+'-->');await importPayload(data);}catch(e){throw Error('Không đọc được clipboard: '+e.message+'. Bạn có thể dùng ⌘V / Ctrl+V trực tiếp trên canvas.');}});
  const style=document.createElement('style');style.textContent='#previewArea.externalDropActive{outline:2px solid var(--ui-selection,#4967C9);outline-offset:-4px}#systemPaste svg{width:19px;height:19px}@media(max-width:900px){#systemPaste span{display:none}#systemPaste{min-width:44px;min-height:44px}}';document.head.append(style);
  window.TemClipboard={get idle(){return pending},importPayload};
})();
