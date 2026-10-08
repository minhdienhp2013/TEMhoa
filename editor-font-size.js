/* AI1: preserve in-progress numeric typing without committing invalid font sizes. */
(function (root) {
 'use strict';
 function install(target=root){
  const input=target.document?.getElementById('size');
  if(!input) return false;
  if(input.dataset.temhoaDraftGuard==='1')return true;
  input.dataset.temhoaDraftGuard='1';
  let draft=null,lastValid=input.value;
  const min=()=>Number(input.min)||6,max=()=>Number(input.max)||800;
  const valid=v=>v.trim()!==''&&Number.isFinite(Number(v))&&Number(v)>=min()&&Number(v)<=max();
  const restoreDraft=()=>{
   if(target.document.activeElement===input&&draft!==null&&input.value!==draft)input.value=draft;
  };
  input.addEventListener('focus',()=>{draft=input.value;if(valid(draft))lastValid=draft});
  input.addEventListener('input',event=>{
   if(target.document.activeElement!==input)return;
   draft=input.value;
   if(!valid(draft)){
    // Allow empty, 0 or 1 as intermediate text when entering e.g. 120;
    // do not let the app clamp these intermediate states back to its minimum.
    event.stopImmediatePropagation();
    event.stopPropagation();
    return;
   }
   lastValid=draft;
   if(typeof target.queueMicrotask==='function')target.queueMicrotask(restoreDraft);
  },true);
  input.addEventListener('blur',()=>{
   const raw=draft;
   draft=null;
   if(!valid(raw??input.value))input.value=lastValid;
  });
  const originalZoom=target.zoom;
  if(typeof originalZoom==='function'){
   const wrapped=function(...args){const result=originalZoom.apply(this,args);restoreDraft();return result;};
   wrapped.temhoaFontDraftGuard=true;
   target.zoom=wrapped;
  }
  const originalPreview=target.preview;
  if(typeof originalPreview==='function'){
   target.preview=function(...args){
    const result=originalPreview.apply(this,args);
    if(result&&typeof result.then==='function')return result.finally(restoreDraft);
    restoreDraft();return result;
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