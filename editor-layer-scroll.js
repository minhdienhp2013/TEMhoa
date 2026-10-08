'use strict';

(()=> {
 const list=$('layersList');
 if(!list)return;
 // Keep the active layer visible when selection changes in long layer lists.
 const oldSelectLayerForScroll=selectLayerUnit;
 selectLayerUnit=async function(...args){
   const result=await oldSelectLayerForScroll(...args);
   requestAnimationFrame(()=>{
     const selected=list.querySelector('.layerRow.selected');
     if(selected)selected.scrollIntoView({block:'nearest',inline:'nearest'});
   });
   return result;
 };
})();
