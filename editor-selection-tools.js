'use strict';

(()=> {
 const selectionTools=$('artSelectionTools'),imageZone=$('artImageZone');
 if(!selectionTools||!imageZone)return;

 const makeButton=(id,label,title,action)=>{
  const b=document.createElement('button');b.id=id;b.type='button';b.className='artButton';b.textContent=label;b.title=title||label;b.setAttribute('aria-label',title||label);b.onclick=action;return b
 };
 const placeMenu=(menu,anchor)=>{
  const r=anchor.getBoundingClientRect(),w=menu.offsetWidth||200,h=menu.offsetHeight||160;
  menu.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left))+'px';
  menu.style.top=Math.max(8,Math.min(innerHeight-h-8,r.bottom+6))+'px';
 };
 const closeMenus=()=>document.querySelectorAll('.compactActionMenu').forEach(menu=>menu.hidden=true);
 const popup=(id,anchor,items)=>{
  let menu=$(id);if(!menu){menu=document.createElement('div');menu.id=id;menu.className='compactActionMenu';menu.setAttribute('role','menu');document.body.append(menu)}
  menu.replaceChildren(...items.map(([label,action,disabled=false])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=disabled;b.setAttribute('role','menuitem');b.onclick=async()=>{menu.hidden=true;await action()};return b}));
  menu.hidden=false;requestAnimationFrame(()=>placeMenu(menu,anchor));return menu
 };

 const smartGroup=makeButton('smartGroupToggle','Nhóm','Nhóm / Bỏ nhóm',async()=>{
  const ungroup=contextCanUngroup?.()??false;
  if(ungroup)await $('ungroupGraphics').onclick?.();
  else await $('groupGraphics').onclick?.();
  smartSync()
 });
 smartGroup.setAttribute('aria-pressed','false');
 selectionTools.prepend(smartGroup);

 const smartEdit=makeButton('smartEditToggle','Sửa chữ','Sửa chữ / Xong',async()=>{
  if(!isDesign()||designKind.value!=='text')return;
  if(designEditing)await $('designFinishText').onclick?.();
  else await $('designEditText').onclick?.();
  smartSync()
 });
 smartEdit.setAttribute('aria-pressed','false');
 selectionTools.insertBefore(smartEdit,smartGroup.nextSibling);

 const smartLayer=makeButton('smartLayerMenu','Lớp ▾','Sắp xếp lớp',()=>{
  const target=layerTarget(),up=target.index>=target.items.length-1,down=target.index<=0;
  popup('smartLayerPopup',smartLayer,[
   ['Đưa lên trên cùng',async()=>{if(typeof contextMoveLayer==='function')await contextMoveLayer('front');else while(!$('layerUp').disabled)await moveObjectLayer(1)},up],
   ['Lên 1 lớp',async()=>moveObjectLayer(1),up],
   ['Xuống 1 lớp',async()=>moveObjectLayer(-1),down],
   ['Đưa xuống dưới cùng',async()=>{if(typeof contextMoveLayer==='function')await contextMoveLayer('back');else while(!$('layerDown').disabled)await moveObjectLayer(-1)},down]
  ])
 });
 smartLayer.setAttribute('aria-haspopup','menu');
 selectionTools.insertBefore(smartLayer,smartEdit.nextSibling);

 const smartFlip=makeButton('smartFlipMenu','Lật ▾','Lật ảnh',()=>{
  const item=selectedGraphic(),disabled=!item;
  popup('smartFlipPopup',smartFlip,[
   ['Lật ngang',async()=>{$('flipGraphicX').click();await Promise.resolve()},disabled],
   ['Lật dọc',async()=>{$('flipGraphicY').click();await Promise.resolve()},disabled]
  ])
 });
 smartFlip.setAttribute('aria-haspopup','menu');
 imageZone.append(smartFlip);

 // Direct AI: avoid the redundant graphics-dialog step.
 const backgroundButton=$('artImageBackground');
 if(backgroundButton)backgroundButton.onclick=()=>{if(!$('openBackgroundAI').disabled)$('openBackgroundAI').click()};

 // Duplicate/delete stay as compact icons; they are frequent one-click actions.
 for(const id of ['designDuplicate','designDelete']){
  const b=$(id);if(b){b.title=b.getAttribute('aria-label')||b.title||b.textContent;b.classList.add('artIconButton')}
 }

 function smartSync(){
  const graphic=selectedGraphic(),canGroup=contextCanGroup?.()??false,canUngroup=contextCanUngroup?.()??false;
  smartGroup.hidden=!(canGroup||canUngroup);smartGroup.disabled=!(canGroup||canUngroup);
  smartGroup.textContent=canUngroup?'Bỏ nhóm':'Nhóm';smartGroup.setAttribute('aria-pressed',String(canUngroup));
  const textMode=isDesign()&&designKind.value==='text'&&!graphic;
  smartEdit.hidden=!textMode;smartEdit.textContent=designEditing?'Xong':'Sửa chữ';smartEdit.setAttribute('aria-pressed',String(!!designEditing));
  const target=layerTarget();smartLayer.hidden=target.index<0;
  smartFlip.hidden=!graphic;
 }
 const oldSync=syncGraphicControls;syncGraphicControls=function(...args){const r=oldSync(...args);smartSync();return r};
 const oldZoom=zoom;zoom=function(...args){const r=oldZoom(...args);smartSync();return r};
 const oldArtSync=artSyncContext;artSyncContext=function(...args){const r=oldArtSync(...args);smartSync();return r};
 document.addEventListener('pointerdown',event=>{if(!event.target.closest('.compactActionMenu,#smartLayerMenu,#smartFlipMenu'))closeMenus()},true);
 window.addEventListener('resize',closeMenus);
 smartSync();
})();
