'use strict';

(()=> {
 const stage=$('previewStage'),surface=$('labelSurface');
 if(!stage||!surface)return;

 // 1) Drag on empty canvas to marquee-select several objects.
 const marquee=document.createElement('div');marquee.id='marqueeSelectBox';marquee.hidden=true;document.body.append(marquee);
 let marqueeDrag=null;
 const intersects=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
 function emptyCanvasTarget(target){
   return !!target.closest('#previewStage,#previewBounds,.preview')&&!target.closest('.graphicOverlay,.otherLabel,#labelSurface,.resizeHandle,#wholeGroupFrame,button,input,select,textarea,[contenteditable=true]');
 }
 stage.addEventListener('pointerdown',event=>{
   if(event.button!==0||designEditing||!emptyCanvasTarget(event.target))return;
   marqueeDrag={pointer:event.pointerId,x:event.clientX,y:event.clientY};marquee.hidden=false;
   Object.assign(marquee.style,{left:event.clientX+'px',top:event.clientY+'px',width:'0px',height:'0px'});
   stage.setPointerCapture?.(event.pointerId);
 },true);
 stage.addEventListener('pointermove',event=>{
   if(!marqueeDrag||event.pointerId!==marqueeDrag.pointer)return;
   const x=Math.min(marqueeDrag.x,event.clientX),y=Math.min(marqueeDrag.y,event.clientY),w=Math.abs(event.clientX-marqueeDrag.x),h=Math.abs(event.clientY-marqueeDrag.y);
   Object.assign(marquee.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});
 },true);
 async function finishMarquee(event){
   if(!marqueeDrag||event.pointerId!==marqueeDrag.pointer)return;
   const box=marquee.getBoundingClientRect();marqueeDrag=null;marquee.hidden=true;
   if(box.width<6&&box.height<6)return;
   const graphics=[...surface.querySelectorAll('.graphicOverlay')].filter(node=>intersects(box,node.getBoundingClientRect()));
   if(graphics.length){
     selectedLabelSet=new Set([activeLabelId]);selectedGraphicSet.clear();graphicSelectionOwner=activeLabelId;
     for(const node of graphics){const item=decorations.find(item=>item.id===node.dataset.graphicId);if(item){selectedGraphicSet.add(item.id);selectedGraphicId=item.id}}
     positionGraphicOverlays();syncGraphicControls();renderLayersPanel();return;
   }
   const labelNodes=[...document.querySelectorAll('.otherLabel,#labelSurface')].filter(node=>intersects(box,node.getBoundingClientRect()));
   if(labelNodes.length){
     selectedGraphicId=null;selectedGraphicSet.clear();selectedLabelSet.clear();
     for(const node of labelNodes){const id=node.dataset.labelId||activeLabelId;if(labels.some(label=>label.id===id))selectedLabelSet.add(id)}
     const first=labels.find(label=>selectedLabelSet.has(label.id));if(first&&first.id!==activeLabelId)await activateLabel(first.id);
     drawLabelGroupFrame();syncGraphicControls();renderLayersPanel();
   }
 }
 for(const type of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(type,finishMarquee,true);

 // 2) Double-click a photo to enter Crop immediately.
 stage.addEventListener('dblclick',event=>{
   const overlay=event.target.closest('.graphicOverlay');if(!overlay)return;
   const item=decorations.find(graphic=>graphic.id===overlay.dataset.graphicId);if(!item||item.kind!=='image'||item.locked)return;
   event.preventDefault();event.stopImmediatePropagation();
   selectedGraphicId=item.id;selectedGraphicSet=new Set([item.id]);graphicSelectionOwner=activeLabelId;syncGraphicControls();
   if(!graphicsDialog.open){if(typeof graphicsDialog.showModal==='function')graphicsDialog.showModal();else graphicsDialog.show();}
   $('startGraphicCrop').click();$('graphicPhotoPreview').focus?.();
 },true);

 // 3) Clicking outside a text box ends text editing automatically.
 document.addEventListener('pointerdown',event=>{
   if(!designEditing||event.target.closest('#temEditor,#smartEditToggle,.fontPickerMenu,#artProperties,.wordRibbon,dialog'))return;
   queueMicrotask(()=>{if(designEditing)$('designFinishText').click()});
 },false);

 // 4) Position = layer + align + distribute in one compact menu.
 const positionButton=$('smartLayerMenu');
 if(positionButton){
   positionButton.textContent='Vị trí ▾';positionButton.title='Vị trí, lớp và căn chỉnh';positionButton.setAttribute('aria-label','Vị trí, lớp và căn chỉnh');
   let menu=$('smartPositionPopup');if(!menu){menu=document.createElement('div');menu.id='smartPositionPopup';menu.className='compactActionMenu';menu.hidden=true;menu.setAttribute('role','menu');document.body.append(menu)}
   const add=(label,fn,disabled=false)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=disabled;b.setAttribute('role','menuitem');b.onclick=async()=>{menu.hidden=true;await fn()};menu.append(b)};
   positionButton.onclick=()=>{
     menu.replaceChildren();const target=layerTarget(),up=target.index>=target.items.length-1,down=target.index<=0,count=contextUnitCount();
     add('Đưa lên trên cùng',()=>contextMoveLayer('front'),up);
     add('Lên 1 lớp',()=>contextMoveLayer('up'),up);
     add('Xuống 1 lớp',()=>contextMoveLayer('down'),down);
     add('Đưa xuống dưới cùng',()=>contextMoveLayer('back'),down);
     const sep=document.createElement('hr');sep.style.cssText='border:0;border-top:1px solid #eee;margin:5px';menu.append(sep);
     add('Căn trái',()=>contextAlignSelection('left'),count<2);add('Căn giữa ngang',()=>contextAlignSelection('hcenter'),count<2);add('Căn phải',()=>contextAlignSelection('right'),count<2);
     add('Căn trên',()=>contextAlignSelection('top'),count<2);add('Căn giữa dọc',()=>contextAlignSelection('vcenter'),count<2);add('Căn dưới',()=>contextAlignSelection('bottom'),count<2);
     add('Căn vùng chọn vào giữa tem',()=>contextCenterSelection(),count<1);
     add('Dàn đều ngang',()=>contextDistributeSelection('horizontal'),count<3);add('Dàn đều dọc',()=>contextDistributeSelection('vertical'),count<3);
     menu.hidden=false;const r=positionButton.getBoundingClientRect();requestAnimationFrame(()=>{menu.style.left=Math.max(8,Math.min(innerWidth-menu.offsetWidth-8,r.left))+'px';menu.style.top=Math.max(8,Math.min(innerHeight-menu.offsetHeight-8,r.bottom+6))+'px'});
   };
   document.addEventListener('pointerdown',event=>{if(!event.target.closest('#smartPositionPopup,#smartLayerMenu'))menu.hidden=true},true);
 }

 // 5) Guides can be dragged directly from the rulers.
 const guides={vertical:[],horizontal:[]};let guideDrag=null;
 function renderGuides(){
   stage.querySelectorAll('.canvasGuide').forEach(node=>node.remove());
   const paper=stage.getBoundingClientRect(),sr=stage.getBoundingClientRect();
   for(const [axis,values] of Object.entries(guides))for(const value of values){
     const line=document.createElement('div');line.className='canvasGuide '+axis;line.dataset.axis=axis;line.dataset.value=value;
     if(axis==='vertical')line.style.left=(paper.left-sr.left+value*paper.width)+'px';else line.style.top=(paper.top-sr.top+value*paper.height)+'px';
     line.title='Kéo để di chuyển guide · Nhấp đúp để xóa';
     line.ondblclick=()=>{const list=guides[axis],index=list.indexOf(value);if(index>=0)list.splice(index,1);renderGuides()};
     line.onpointerdown=event=>{event.preventDefault();guideDrag={axis,value,node:line,pointer:event.pointerId};line.setPointerCapture(event.pointerId)};
     line.onpointermove=event=>{if(!guideDrag||guideDrag.pointer!==event.pointerId)return;moveGuide(event)};
     line.onpointerup=event=>{if(!guideDrag||guideDrag.pointer!==event.pointerId)return;finishGuide(event)};
     stage.append(line);
   }
 }
 function ratioFromEvent(axis,event){const paper=stage.getBoundingClientRect();return axis==='vertical'?(event.clientX-paper.left)/paper.width:(event.clientY-paper.top)/paper.height}
 function moveGuide(event){if(!guideDrag)return;const ratio=Math.max(0,Math.min(1,ratioFromEvent(guideDrag.axis,event))),sr=stage.getBoundingClientRect(),paper=stage.getBoundingClientRect();if(guideDrag.axis==='vertical')guideDrag.node.style.left=(paper.left-sr.left+ratio*paper.width)+'px';else guideDrag.node.style.top=(paper.top-sr.top+ratio*paper.height)+'px';guideDrag.next=ratio}
 function finishGuide(){if(!guideDrag)return;const list=guides[guideDrag.axis],index=list.indexOf(guideDrag.value),value=guideDrag.next??guideDrag.value;if(index>=0)list[index]=value;guideDrag=null;renderGuides()}
 for(const [id,axis] of [['rulerTop','vertical'],['rulerLeft','horizontal']]){
   const ruler=$(id);if(!ruler)continue;ruler.style.cursor=axis==='vertical'?'ew-resize':'ns-resize';
   ruler.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();const value=Math.max(0,Math.min(1,ratioFromEvent(axis,event)));guides[axis].push(value);renderGuides();const line=[...stage.querySelectorAll('.canvasGuide.'+axis)].at(-1);guideDrag={axis,value,node:line,pointer:event.pointerId};line?.setPointerCapture?.(event.pointerId)});
 }
 const oldZoomGuides=zoom;zoom=function(...args){const result=oldZoomGuides(...args);renderGuides();syncSafeZone();return result};

 // 6) Printing safe-zone overlay. 3 mm inset by default.
 const safe=document.createElement('div');safe.id='printSafeZone';stage.append(safe);
 const safeToggle=document.createElement('button');safeToggle.id='safeZoneToggle';safeToggle.type='button';safeToggle.textContent='Vùng an toàn';safeToggle.setAttribute('aria-pressed','false');stage.append(safeToggle);
 safeToggle.onclick=()=>{const active=!document.body.classList.contains('showPrintSafeZone');document.body.classList.toggle('showPrintSafeZone',active);safeToggle.setAttribute('aria-pressed',String(active));syncSafeZone()};
 function syncSafeZone(){
   if(!stage.isConnected)return;const paper=stage.getBoundingClientRect(),sr=stage.getBoundingClientRect(),page=previewPage(),insetCm=.3,ux=paper.width/page.width,uy=paper.height/page.height;
   Object.assign(safe.style,{left:(paper.left-sr.left+insetCm*ux)+'px',top:(paper.top-sr.top+insetCm*uy)+'px',width:Math.max(0,paper.width-insetCm*ux*2)+'px',height:Math.max(0,paper.height-insetCm*uy*2)+'px'});
 }
 const oldOpenPrint=openPrint;openPrint=async function(...args){document.body.classList.add('showPrintSafeZone');safeToggle.setAttribute('aria-pressed','true');syncSafeZone();return oldOpenPrint(...args)};
 renderGuides();syncSafeZone();
})();
