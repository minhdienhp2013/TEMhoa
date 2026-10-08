'use strict';

(()=> {
 let preciseLayerSelection=false;

 const oldSelectLayerUnit=selectLayerUnit;
 selectLayerUnit=async function(labelId,key,additive=false,preserve=false){
   preciseLayerSelection=!additive&&!preserve;
   try{
     const result=await oldSelectLayerUnit(labelId,key,additive,preserve);
     if(preciseLayerSelection){
       // Layer-panel clicks are exact: never expand to the object's saved group.
       selectedLabelSet=new Set([activeLabelId]);
       if(key.startsWith('graphic-')){
         const item=decorations.find(item=>item.id===key);
         if(item){
           selectedGraphicId=item.id;
           selectedGraphicSet=new Set([item.id]);
           graphicSelectionOwner=activeLabelId;
         }
       }else{
         selectedGraphicId=null;
         selectedGraphicSet.clear();
         selectedUnitKey=key==='text-box'?'text-box':key;
       }
       drawLabelGroupFrame();
       positionGraphicOverlays();
       syncGraphicControls();
       renderLayersPanel();
     }
     return result;
   }finally{preciseLayerSelection=false}
 };

 // A layer-panel click must also keep a grouped text box as one exact selected layer.
 const oldSelectedLabels=selectedLabels;
 selectedLabels=function(){
   if(preciseLayerSelection)return labels.filter(label=>label.id===activeLabelId);
   return oldSelectedLabels();
 };

 function selectedFrameRect(){
   if(selectionFrame.style.display==='none')return null;
   const rect=selectionFrame.getBoundingClientRect();
   return rect.width>0&&rect.height>0?rect:null;
 }
 function pointerInside(rect,event,pad=10){
   return !!rect&&event.clientX>=rect.left-pad&&event.clientX<=rect.right+pad&&event.clientY>=rect.top-pad&&event.clientY<=rect.bottom+pad;
 }
 function updateHandleHover(event){
   const frame=selectedFrameRect();
   document.body.classList.toggle('preciseLayerHover',pointerInside(frame,event,8));
   if(!wholeGroupFrame.hidden){
     const groupRect=wholeGroupFrame.getBoundingClientRect();
     document.body.classList.toggle('preciseGroupHover',pointerInside(groupRect,event,8));
   }else document.body.classList.remove('preciseGroupHover');
 }
 $('previewStage').addEventListener('pointermove',updateHandleHover,{passive:true});
 $('previewStage').addEventListener('pointerleave',()=>{
   document.body.classList.remove('preciseLayerHover','preciseGroupHover');
 });

 // One delegated listener avoids accumulating listeners as the Layers panel rerenders.
 $('layersList').addEventListener('pointerdown',event=>{
   const row=event.target.closest('.layerRow');if(!row?.dataset.unitKey)return;
   if(!event.shiftKey&&!event.ctrlKey&&!event.metaKey)selectedLayerUnits.clear();
 },true);

 // Keep the selected text-box frame usable after the one-box/one-layer migration.
 const oldLayerSyncGraphic=syncGraphicControls;
 syncGraphicControls=function(...args){
   const result=oldLayerSyncGraphic(...args);
   if(!selectedGraphic()&&activeUnitKey()==='text-box'){
     selectedLabelSet=new Set([activeLabelId]);
     wholeGroupFrame.hidden=true;
     document.body.classList.remove('wholeTemGroupSelected');
   }
   return result;
 };
})();
