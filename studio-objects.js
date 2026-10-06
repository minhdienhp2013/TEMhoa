/* Keep original image bytes and group mixed page objects without flattening. */
(() => {
  'use strict';
  const previousSafeGraphic = safeGraphic;
  safeGraphic = function(value) {
    const item = previousSafeGraphic(value);
    if (!item) return item;
    if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value.sourceOriginal || '')) item.sourceOriginal = value.sourceOriginal;
    if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value.original || ''))item.original=value.original;
    if (value.crop && ['x','y','width','height'].every(k => Number.isFinite(value.crop[k])&&value.crop[k]>=0&&value.crop[k]<=1)&&value.crop.width>0&&value.crop.height>0&&value.crop.x+value.crop.width<=1.001&&value.crop.y+value.crop.height<=1.001) item.crop = {...value.crop};
    return item;
  };
  $('applyGraphicCrop').onclick = async () => {
    const item = selectedGraphic();
    if (!item || !photoCrop || !photoOriginal || graphicGroupItems(item).length>1 || item.locked || contextSelectionLocked()) return;
    try {
      recordHistory();
      item.sourceOriginal ||= item.original || item.src;
      const crop = {...photoCrop}, c = cv(Math.max(1,Math.round(crop.width*photoOriginal.width)),Math.max(1,Math.round(crop.height*photoOriginal.height)));
      c.getContext('2d').drawImage(photoOriginal,crop.x*photoOriginal.width,crop.y*photoOriginal.height,crop.width*photoOriginal.width,crop.height*photoOriginal.height,0,0,c.width,c.height);
      item.crop = crop; item.original = c.toDataURL('image/png'); item.src = item.original;
      item.height = item.width*c.height/c.width;
      await applyGraphicBackground(item); await preview(); recordHistory(); syncGraphicControls();
      $('graphicMessage').textContent = 'Đã cắt ảnh; ảnh gốc vẫn được giữ để khôi phục.';
    } catch(error) {$('graphicMessage').textContent=error.message;}
  };
  const restore = document.createElement('button'); restore.type='button';restore.id='studioRestoreImage';restore.textContent='Khôi phục ảnh gốc';
  $('applyGraphicCrop').after(restore);
  restore.onclick=async()=>{
    const item=selectedGraphic();if(!item?.sourceOriginal||graphicGroupItems(item).length>1||item.locked||contextSelectionLocked())return;
    try{const image=await loadGraphic(item.sourceOriginal);recordHistory();item.src=item.original=item.sourceOriginal;delete item.crop;item.removeWhite=false;item.height=item.width*image.height/image.width;await preview();recordHistory();syncGraphicControls();}
    catch(error){$('graphicMessage').textContent=error.message;}
  };
  const oldSync=syncGraphicControls;
  syncGraphicControls=function(){oldSync();restore.disabled=!selectedGraphic()?.sourceOriginal||graphicGroupItems(selectedGraphic()).length>1||contextSelectionLocked();};
  // Shift-click an image when page labels are selected extends the page selection.
  // Images within a label stay attached to that label and retain their own properties.
  $('previewArea').addEventListener('pointerdown',event=>{
    if(event.button!==0||!event.shiftKey||!event.target.closest('.graphicOverlay'))return;
    if(selectedLabelSet.size && !selectedLabelSet.has(activeLabelId)) {
      event.preventDefault();event.stopImmediatePropagation();selectWholeLabel(currentLabel(),true);
    }
  },true);
  // A grouped image label uses the common transform handles instead of moving
  // an image out of its page group by accident.
  $('previewArea').addEventListener('pointerdown',event=>{
    if(event.button!==0||event.shiftKey||!event.target.closest('.graphicOverlay')||!labelGroupKey(currentLabel()))return;
    event.preventDefault();event.stopImmediatePropagation();selectWholeLabel(currentLabel(),false);
  },true);
  const group=groupWholeLabels;
  groupWholeLabels=async function(ungroup=false){
    if(contextSelectionLocked()){$('status').textContent='Hãy mở khóa các thành phần trước khi nhóm.';return;}
    await group(ungroup);
  };
})();

/* Page groups share transforms while retaining editable text and image blocks.
   Legacy text+decorations blocks stay intact; no destructive data migration. */
(() => {
 const angle=document.createElement('input');angle.id='labelAngle';angle.type='hidden';angle.value='0';document.body.append(angle);ids.push('labelAngle');
 const set=setLabelSettings;setLabelSettings=function(data,ui=false){return set({...data,labelAngle:Number.isFinite(+data.labelAngle)?Math.max(-360,Math.min(360,+data.labelAngle)):0},ui)};
 const geometry=labelGeometry;
 const rotated=g=>{const a=(g.angle||0)*Math.PI/180,cx=g.x+g.width/2,cy=g.y+g.height/2,w=Math.abs(g.width*Math.cos(a))+Math.abs(g.height*Math.sin(a)),h=Math.abs(g.width*Math.sin(a))+Math.abs(g.height*Math.cos(a));return {x:cx-w/2,y:cy-h/2,width:w,height:h};};
 wholeGroupBounds=function(items){const b=items.map(label=>rotated({...geometry(label),angle:Number(label.settings.labelAngle)||0})),x=Math.min(...b.map(g=>g.x)),y=Math.min(...b.map(g=>g.y));return {x,y,width:Math.max(...b.map(g=>g.x+g.width))-x,height:Math.max(...b.map(g=>g.y+g.height))-y};};
 const zoomBefore=zoom;zoom=function(...args){const result=zoomBefore(...args);$('labelSurface').style.transform='rotate('+Number(angle.value||0)+'deg)';$('labelSurface').style.transformOrigin='center';for(const node of document.querySelectorAll('.otherLabel')){const label=labels.find(x=>x.id===node.dataset.labelId);node.style.transform='rotate('+(Number(label?.settings.labelAngle)||0)+'deg)';node.style.transformOrigin='center';}return result;};
 const rotate=document.createElement('button');rotate.type='button';rotate.dataset.groupHandle='rotate';rotate.className='studioGroupRotate';rotate.setAttribute('aria-label','Xoay nhóm');rotate.innerHTML=artIcon('redo');wholeGroupFrame.append(rotate);
 let drag;
 for(const handle of wholeGroupFrame.querySelectorAll('button')){
  handle.onpointerdown=event=>{if(event.button!==0||labelOperation||contextSelectionLocked())return;event.preventDefault();event.stopPropagation();saveActiveLabel();recordHistory();const items=selectedLabels(),bounds=wholeGroupBounds(items),stage=$('previewStage').getBoundingClientRect(),unit=stage.width/previewPage().width,cx=bounds.x+bounds.width/2,cy=bounds.y+bounds.height/2;
   drag={pointer:event.pointerId,kind:handle.dataset.groupHandle,startX:event.clientX,startY:event.clientY,bounds,unit,cx,cy,screenX:stage.left+cx*unit,screenY:stage.top+cy*unit,items:items.map(label=>({id:label.id,...geometry(label),angle:Number(label.settings.labelAngle)||0}))};drag.startAngle=Math.atan2(event.clientY-drag.screenY,event.clientX-drag.screenX);labelGroupDrag=drag;handle.setPointerCapture(event.pointerId);
  };
  handle.onpointermove=event=>{if(!drag||event.pointerId!==drag.pointer)return;const d=drag,b=d.bounds,dx=(event.clientX-d.startX)/d.unit,dy=(event.clientY-d.startY)/d.unit;let scale=1,a=0,ax=b.x,ay=b.y;
   if(d.kind==='rotate')a=Math.atan2(event.clientY-d.screenY,event.clientX-d.screenX)-d.startAngle;
   else if(d.kind!=='move'){const west=d.kind.includes('w'),north=d.kind.includes('n');scale=Math.max((b.width+(west?-dx:dx))/b.width,(b.height+(north?-dy:dy))/b.height);scale=Math.max(Math.max(...d.items.map(x=>.05/Math.min(x.sx,x.sy))),Math.min(Math.min(...d.items.map(x=>10/Math.max(x.sx,x.sy))),scale));ax=west?b.x+b.width:b.x;ay=north?b.y+b.height:b.y;}
   for(const o of d.items){const data=labels.find(x=>x.id===o.id).settings;let x=o.x,y=o.y;if(d.kind==='move'){x+=dx;y+=dy;}else if(d.kind==='rotate'){const vx=o.x+o.width/2-d.cx,vy=o.y+o.height/2-d.cy;x=d.cx+vx*Math.cos(a)-vy*Math.sin(a)-o.width/2;y=d.cy+vx*Math.sin(a)+vy*Math.cos(a)-o.height/2;}else{x=ax+(o.x-ax)*scale;y=ay+(o.y-ay)*scale;}Object.assign(data,{labelX:x,labelY:y,labelScaleX:o.sx*scale,labelScaleY:o.sy*scale,labelAngle:(o.angle+a*180/Math.PI)%360});}
   for(const id of ['labelX','labelY','labelScaleX','labelScaleY','labelAngle'])$(id).value=currentLabel().settings[id];zoom();
  };
  const finish=async event=>{if(!drag||event.pointerId!==drag.pointer)return;drag=null;labelGroupDrag=null;await preview();recordHistory();syncGraphicControls();};handle.onpointerup=handle.onpointercancel=handle.onlostpointercapture=finish;
 }
 const layerSelect=selectLayerUnit;selectLayerUnit=async function(owner,key,additive=false,preserve=false){
  if(additive&&owner!==activeLabelId){const chosen=new Set(selectedLabels().map(x=>x.id));chosen.add(owner);await activateLabel(owner);selectedLabelSet=chosen;selectedGraphicId=null;selectedGraphicSet.clear();for(const label of selectedLabels())selectedLayerUnits.add(layerSelectionId(label.id,label.settings.decorations?.[0]?.id||'text-0'));drawLabelGroupFrame();syncGraphicControls();renderLayersPanel();return;}
  await layerSelect(owner,key,additive,preserve);if(!additive&&labelGroupKey(currentLabel()))selectWholeLabel(currentLabel());
 };
 window.addEventListener('contextmenu',event=>{
  if(!event.target.closest?.('.graphicOverlay')||!labelGroupKey(currentLabel()))return;
  event.preventDefault();event.stopImmediatePropagation();selectWholeLabel(currentLabel());rebuildContextMenu();labelMenu.hidden=false;labelMenu.style.left=Math.max(8,Math.min(event.clientX,innerWidth-280))+'px';labelMenu.style.top=Math.max(8,Math.min(event.clientY,innerHeight-labelMenu.offsetHeight-8))+'px';
 },true);
 const sync=syncGraphicControls;syncGraphicControls=function(...args){const result=sync(...args);const locked=contextSelectionLocked();for(const id of ['applyGraphicCrop','startGraphicCrop','studioRestoreImage','restoreGraphicOriginal','openBackgroundAI','graphicWhite','graphicBackground','graphicTolerance'])if(locked)$(id).disabled=true;return result;};
 // Guard asynchronous image edits too: disabling a button alone is insufficient.
 for(const id of ['graphicWhite','graphicBackground','graphicTolerance','restoreGraphicOriginal','aiApply']){const node=$(id),prop=id.startsWith('graphic')?'onchange':'onclick',previous=node[prop];if(previous)node[prop]=async function(...args){if(contextSelectionLocked())return;const item=selectedGraphic();if(item?.kind==='image')item.sourceOriginal ||= item.original||item.src;return previous.apply(this,args);};}
 const beforeAdd=addGraphic;addGraphic=async function(...args){if(isDesign()&&designKind.value==='text'&&editorText().trim()){if(contextSelectionLocked())throw Error('Khối đang khóa.');await newDesignText('<div></div>');}window.TEMHOA_STUDIO_ADDING=true;try{return await beforeAdd(...args);}finally{window.TEMHOA_STUDIO_ADDING=false;await preview();recordHistory();}};
 autoThumbnail=function(){const page=previewPage(),unit=400/page.width,c=cv(400,Math.round(page.height*unit)),ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);for(const label of labels){if(!label.bitmap||!label.size)continue;const g=geometry(label);ctx.save();ctx.translate((g.x+g.width/2)*unit,(g.y+g.height/2)*unit);ctx.rotate((Number(label.settings.labelAngle)||0)*Math.PI/180);ctx.drawImage(label.bitmap,-g.width*unit/2,-g.height*unit/2,g.width*unit,g.height*unit);ctx.restore();}return c.toDataURL('image/png');};
 window.TemStudioObjects={geometry,rotated};
})();

(() => {
 const locked=contextSelectionLocked;contextSelectionLocked=function(){return locked()||(selectedGraphic()&&labelLockControl.checked);};
 window.addEventListener('pointerdown',event=>{if(event.button===0&&event.target.closest?.('.graphicOverlay')&&labelLockControl.checked){event.preventDefault();event.stopImmediatePropagation();selectWholeLabel(currentLabel());}},true);
})();
(() => {const sync=syncGraphicControls;syncGraphicControls=function(...args){const result=sync(...args);artSyncContext();return result;};})();
(() => {
 const remove=contextDeleteSelection;contextDeleteSelection=async function(){
  if(!selectedGraphic()&&selectedLabels().length===labels.length){const base={...copyLabelData(homeBaseSettings),designKind:'design',text:'',richHTML:'<div><br></div>',decorations:[],labelGroup:'',labelLocked:false,labelAngle:0,wordFrame:JSON.stringify({width:(previewPage().width-2)*96/2.54,height:(previewPage().height-2)*96/2.54,box:{x:0,y:0,width:(previewPage().width-2)*96/2.54,height:(previewPage().height-2)*96/2.54}}),padding:0,border:0};recordHistory();await restoreLabelDocument({...base,page:$('page').value});recordHistory();return;}
  await remove();if(labelGroupKey(currentLabel()))selectWholeLabel(currentLabel());
 };
})();
/* A free photo block uses its image bounds, not an entire invisible paper sheet. */
(() => {
 function compact(){
  if(window.TEMHOA_STUDIO_ADDING||!isDesign()||editorText().trim()||!decorations.length||graphicDrag||labelGroupDrag||!$('wordFrame').value)return;
  const L=layout(),r=render(false,1,false),b=graphicGroupBounds(decorations),ox=L.graphicOffsetX||0,oy=L.graphicOffsetY||0;
  const sx=Number($('labelScaleX').value||1),sy=Number($('labelScaleY').value||1),ux=r.cm*sx/L.width,uy=r.heightCm*sy/L.height;
  const x=$('labelX').value===''?(previewPage().width-r.cm)/2:Number($('labelX').value),y=$('labelY').value===''?1:Number($('labelY').value),cx=x+r.cm*sx/2,cy=y+r.heightCm*sy/2,w=b.width*ux,h=b.height*uy,a=Number($('labelAngle').value||0)*Math.PI/180;
  const vx=x+(b.x+ox+b.width/2)*ux-cx,vy=y+(b.y+oy+b.height/2)*uy-cy,base=Math.max(3,Math.min(previewPage().width-2,w));
  for(const item of decorations){item.x-=b.x;item.y-=b.y;}$('labelX').value=cx+vx*Math.cos(a)-vy*Math.sin(a)-w/2;$('labelY').value=cy+vx*Math.sin(a)+vy*Math.cos(a)-h/2;
  $('width').value=base;$('labelScaleX').value=w/base;$('labelScaleY').value=h/(base*b.height/b.width);$('wordFrame').value=JSON.stringify({width:b.width,height:b.height,box:{x:0,y:0,width:b.width,height:b.height}});
 }
 const previous=preview;preview=async function(...args){compact();return previous(...args);};
})();
(() => {
 const open=$('openBackgroundAI').onclick;
 $('openBackgroundAI').onclick=async function(...args){
  if(contextSelectionLocked())return;const item=selectedGraphic();if(!item)return;item.sourceOriginal ||= item.original||item.src;
  await open.apply(this,args);if(!aiTarget||aiTarget.id!==item.id)return;
  if(!aiTarget.original.startsWith('data:image/png;base64,')){const image=await loadGraphic(aiTarget.original),canvas=cv(image.width,image.height);canvas.getContext('2d').drawImage(image,0,0);aiTarget.original=canvas.toDataURL('image/png');}
 };
})();

(() => {const down=$('graphicPhotoPreview').onpointerdown;$('graphicPhotoPreview').onpointerdown=function(...args){if(contextSelectionLocked()||graphicGroupItems(selectedGraphic()).length>1)return;return down.apply(this,args);};})();
