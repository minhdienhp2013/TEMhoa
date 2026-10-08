'use strict';

(()=> {
 const sizeInput=$('size');if(!sizeInput)return;
 let syncing=false;

 function textLayerTransform(){
   const key=activeUnitKey?.();
   if(!(key==='text-box'||key?.startsWith?.('text-')))return null;
   const stack=readLayerStack();
   const t=stack.transforms?.[key]||{};
   return {key,stack,sx:Number.isFinite(Number(t.sx))?Number(t.sx):1,sy:Number.isFinite(Number(t.sy))?Number(t.sy):1};
 }
 function basePointSize(){
   // If a text selection has its own inline font size, report that; otherwise use the box base size.
   const offsets=selectionOffsets?.(),selected=offsets&&offsets.start!==offsets.end;
   if(selected&&savedSelection){
     let node=savedSelection.startContainer;
     if(node?.nodeType!==Node.TEXT_NODE)node=node?.childNodes?.[savedSelection.startOffset]||node;
     const el=node?.nodeType===Node.TEXT_NODE?node.parentElement:node;
     const px=parseFloat(el&&getComputedStyle(el).fontSize);
     if(Number.isFinite(px))return px*.75;
   }
   return Number(defaultTextStyle.size)||Number(sizeInput.value)||64;
 }
 function syncEffectiveSize(){
   if(syncing||designEditing)return;
   const info=textLayerTransform();if(!info)return;
   // Only a proportional resize maps cleanly to a font size.
   if(Math.abs(info.sx-info.sy)>.02)return;
   const effective=Math.max(6,Math.min(800,basePointSize()*((info.sx+info.sy)/2)));
   const rounded=Math.round(effective*10)/10;
   if(Math.abs(Number(sizeInput.value)-rounded)>.05){syncing=true;sizeInput.value=String(rounded);syncing=false}
 }
 const previousZoom=zoom;zoom=function(...args){const result=previousZoom(...args);syncEffectiveSize();return result};
 const previousSelect=selectLayerUnit;selectLayerUnit=async function(...args){const result=await previousSelect(...args);syncEffectiveSize();return result};
 const previousSync=syncGraphicControls;syncGraphicControls=function(...args){const result=previousSync(...args);syncEffectiveSize();return result};

 // While a proportional text resize is happening, keep the displayed size in sync frame-by-frame.
 // Coalesce high-frequency pointer events so trackpads/mice cannot queue dozens of callbacks per frame.
 const stage=$('previewStage');let sizeSyncFrame=0;
 const scheduleSizeSync=()=>{if(sizeSyncFrame)return;sizeSyncFrame=requestAnimationFrame(()=>{sizeSyncFrame=0;syncEffectiveSize()})};
 stage?.addEventListener('pointermove',event=>{
   if(!$('labelSurface')?.classList.contains('resizing'))return;
   scheduleSizeSync();
 },{passive:true});
 stage?.addEventListener('pointerup',scheduleSizeSync,true);

 async function bakeAfterResize(completed){
   if(!completed||completed.dir==='move'||completed.key!=='text-box'||$('designKind')?.value!=='text')return false;
   const stack=readLayerStack(),raw=stack.transforms?.[completed.key]||{},sx=Number(raw.sx)||1,sy=Number(raw.sy)||1;
   if(Math.abs(sx-sy)>.025||Math.abs((sx+sy)/2-1)<.002)return false;
   const factor=(sx+sy)/2,oldBase=Math.max(6,Number(defaultTextStyle.size)||64),newBase=Math.max(6,Math.min(800,oldBase*factor)),bakedFactor=newBase/oldBase;
   if(!Number.isFinite(bakedFactor)||Math.abs(bakedFactor-1)<.002)return false;
   const oldRect=selectionFrame.getBoundingClientRect();
   defaultTextStyle.size=newBase;sizeInput.value=String(Math.round(newBase*10)/10);
   for(const node of $('temEditor').querySelectorAll('[style]')){
     const px=parseFloat(node.style.fontSize);if(Number.isFinite(px)&&px>0)node.style.fontSize=(px*bakedFactor)+'px';
   }
   $('width').value=String(Math.max(3,Math.min(textWidthLimit(),(Number($('width').value)||12)*bakedFactor)));
   const residual=Math.max(.05,Math.min(10,factor/bakedFactor));
   stack.transforms={...(stack.transforms||{}),[completed.key]:{...raw,x:0,y:0,sx:residual,sy:residual}};
   $('layerStack').value=JSON.stringify(stack);syncEditorStyle();$('text').value=editorText();
   await preview();
   const nextRect=selectionFrame.getBoundingClientRect(),stageRect=$('previewStage').getBoundingClientRect(),unit=stageRect.width/previewPage().width;
   if(unit>0&&Number.isFinite(oldRect.left)&&Number.isFinite(nextRect.left)){
     const currentX=$('labelX').value===''?0:Number($('labelX').value)||0,currentY=$('labelY').value===''?1:Number($('labelY').value)||0;
     $('labelX').value=String(currentX+(oldRect.left-nextRect.left)/unit);
     $('labelY').value=String(currentY+(oldRect.top-nextRect.top)/unit);
     await preview();
   }
   return true;
 }
 window.TemTextSize={bakeAfterResize,syncEffectiveSize};

 // Prevent an old saved text selection from unexpectedly taking over the whole-box size control.
 sizeInput.addEventListener('pointerdown',()=>{if(!designEditing&&activeUnitKey?.()==='text-box')savedSelection=null},true);
})();

/* AI1 draft guard, integrated with the real toolbar: commit once on Enter/blur. */
(function (root) {
 'use strict';
 function install(target=root){
  const input=target.document?.getElementById('size');
  if(!input)return false;
  if(input.dataset.temhoaDraftGuard==='1')return true;
  input.dataset.temhoaDraftGuard='1';
  let draft=null,committed=input.value;
  const min=()=>Number(input.min)||6,max=()=>Number(input.max)||800;
  const restoreDraft=()=>{
   if(target.document.activeElement===input&&draft!==null&&input.value!==draft)input.value=draft;
  };
  const commit=()=>{
   if(draft===null)return;
   const raw=draft;draft=null;
   const parsed=Number(raw);
   if(raw.trim()===''||!Number.isFinite(parsed)||parsed<=0){input.value=committed;return;}
   const value=String(Math.max(min(),Math.min(max(),parsed)));
   input.value=value;
   if(value!==committed){
    if(typeof target.applyToolbar==='function')target.applyToolbar('size');
    else input.dispatchEvent(new target.Event('input',{bubbles:true}));
   }
   committed=value;
  };
  input.addEventListener('focus',()=>{draft=input.value;committed=input.value});
  input.addEventListener('input',event=>{
   if(target.document.activeElement!==input)return;
   draft=input.value;event.stopImmediatePropagation();event.stopPropagation();
  },true);
  input.addEventListener('blur',commit);
  input.addEventListener('keydown',event=>{
   if(event.key==='Enter'){event.preventDefault();event.stopPropagation();commit();draft=input.value;}
   else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();draft=null;input.value=committed;input.blur();}
  },true);
  for(const name of ['zoom','preview']){
   const original=target[name];if(typeof original!=='function')continue;
   target[name]=function(...args){
    const result=original.apply(this,args);restoreDraft();
    if(result&&typeof result.then==='function')return result.finally(restoreDraft);
    return result;
   };
  }
  return true;
 }
 const api={install};root.TEMHOA_FONT_DRAFT=api;
 if(root.document){
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',()=>install(root),{once:true});
  else install(root);
 }
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
