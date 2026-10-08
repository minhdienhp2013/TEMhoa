'use strict';

/* Interaction hot paths do not rebuild document UI or clone image payloads. */
(() => {
  let rows=null,structure=[];
  const oldPanel=renderLayersPanel;
  renderLayersPanel=function(...args){
    if(!previewSize)return;
    const next=[],units=new Map();
    for(const label of [...labels].reverse()){
      const L=label.id===activeLabelId?previewSize.L:label.size?.L;if(!L)continue;
      next.push(label.id,label.settings.designKind);
      for(const unit of orderedLayerUnits(L,readLayerStack(label.id===activeLabelId?$('layerStack').value:label.settings.layerStack||'{}'))){
        next.push(unit.key,unit.kind,unit.item?.kind||'');units.set(layerSelectionId(label.id,unit.key),unit);
      }
    }
    if(!rows||next.length!==structure.length||next.some((v,i)=>v!==structure[i])){
      oldPanel(...args);structure=next;rows=[...$('layersList').querySelectorAll('.layerRow')];window.TemPerformance?.count('layerBuilds');
    }
    for(const row of rows){const id=layerSelectionId(row.dataset.labelId,row.dataset.unitKey),unit=units.get(id),selected=selectedLayerUnits.size?selectedLayerUnits.has(id):row.dataset.labelId===activeLabelId&&activeUnitKey()===row.dataset.unitKey;if(row.classList.contains('selected')!==selected){row.classList.toggle('selected',selected);row.setAttribute('aria-pressed',String(selected));}if(!unit)continue;const name=unit.kind==='text'?'Chữ · '+(unit.text.trim()||'Dòng trống'):unit.item.kind==='image'?'Ảnh':graphicNames[unit.item.kind]||'Emoji',text=row.querySelector('.layerName');if(text?.textContent!==name){text.textContent=name;row.setAttribute('aria-label',name);row.title=name+' · Shift + bấm để chọn/bỏ chọn nhiều lớp';}const thumb=row.querySelector('img');if(thumb&&thumb.getAttribute('src')!==unit.item.src)thumb.src=unit.item.src;const lock=row.querySelector('.layerLock');if(lock){const title=unit.item.locked?'Mở khóa hình':'Khóa hình';if(lock.title!==title){lock.title=title;lock.setAttribute('aria-label',title);}}}
  };
  const overlays=positionGraphicOverlays;
  let overlayFrame=0;
  positionGraphicOverlays=function(...args){
    if(!graphicDrag||!previewSize){cancelAnimationFrame(overlayFrame);overlayFrame=0;return overlays(...args);}
    if(overlayFrame)return;overlayFrame=requestAnimationFrame(()=>{overlayFrame=0;if(!graphicDrag||!previewSize)return;
    const L=previewSize.L,sx=parseFloat($('labelSurface').style.width)/L.width,sy=parseFloat($('labelSurface').style.height)/L.height;
    const ids=new Set((graphicDrag.group||[graphicDrag.original]).map(i=>i.id));
    for(const box of $('labelSurface').querySelectorAll('.graphicOverlay')){
      if(!ids.has(box.dataset.graphicId))continue;const item=decorations.find(i=>i.id===box.dataset.graphicId);if(!item)continue;
      const members=selectedGraphicSet.size===1&&selectedGraphicSet.has(item.id)?[item]:graphicGroupItems(item),b=members.length>1?graphicGroupBounds(members):{x:item.x-item.width/2,y:item.y-item.height/2,width:item.width,height:item.height};
      Object.assign(box.style,{left:(b.x+(L.graphicOffsetX??L.offsetX??0))*sx+'px',top:(b.y+(L.graphicOffsetY??L.offsetY??0))*sy+'px',width:b.width*sx+'px',height:b.height*sy+'px',transform:members.length>1?'none':`rotate(${item.angle}deg)`});
    }
    });
  };
  let zoomFrame=0;const committedZoom=zoom;zoom=function(...args){if(labelDrag||labelGroupDrag||designDrag){if(!zoomFrame)zoomFrame=requestAnimationFrame(()=>{zoomFrame=0;committedZoom(...args)});return;}cancelAnimationFrame(zoomFrame);zoomFrame=0;return committedZoom(...args);};
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(overlayFrame);cancelAnimationFrame(zoomFrame);});
  const saveActive=saveActiveLabel;
  saveActiveLabel=function(...args){if(typing){const label=currentLabel();if(args[0]&&previewSize){label.size=previewSize;if(!label.bitmap||label.bitmap.width!==$('canvas').width||label.bitmap.height!==$('canvas').height)label.bitmap=cv($('canvas').width,$('canvas').height);const ctx=label.bitmap.getContext('2d');ctx.clearRect(0,0,label.bitmap.width,label.bitmap.height);ctx.drawImage($('canvas'),0,0);label.renderVersion=(label.renderVersion||0)+1;}return label;}if(!args[0]&&(labelDrag||labelGroupDrag||designDrag)){
    const label=currentLabel();for(const id of ['labelX','labelY','labelScaleX','labelScaleY'])label.settings[id]=$(id).value;return label;
  }return saveActive(...args);};
  const capture=captureAutoChanges;
  let transformPointer=null;
  function releaseTransform(event){if(transformPointer===null||event?.pointerId!==undefined&&event.pointerId!==transformPointer)return;transformPointer=null;autoSuspended--;colorSaveGate.leave();if(autoContext?.dirty&&!autoSuspended)captureAutoChanges();}
  document.addEventListener('pointerdown',event=>{if(event.button!==0||transformPointer!==null||!event.target.closest('#previewStage')||event.target.closest('.graphicOverlay')||(activeUnitKey()==='text-box'||activeUnitKey()?.startsWith('text-'))&&!event.target.closest('#wholeGroupFrame'))return;transformPointer=event.pointerId;clearTimeout(autoTimer);autoSuspended++;colorSaveGate.enter();},true);
  document.addEventListener('pointerup',releaseTransform,true);document.addEventListener('pointercancel',releaseTransform,true);window.addEventListener('blur',()=>releaseTransform());window.addEventListener('pagehide',()=>releaseTransform());
  let typing=false,typingTimer=null;
  const buildLineControls=lineControls;let lineControlStyles=null,lineControlFonts=null;
  lineControls=function(...args){const lines=editorText().split('\n').slice(0,20),host=$('lineFonts');if(typing&&lineControlStyles===lineStyles&&lineControlFonts===machineFonts&&host.children.length===lines.length){for(let i=0;i<lines.length;i++){const label=host.children[i].querySelector('label'),text=`Dòng ${i+1}: ${lines[i].trim().slice(0,35)||'(trống)'}`;if(label&&label.textContent!==text)label.textContent=text;}return;}const result=buildLineControls(...args);lineControlStyles=lineStyles;lineControlFonts=machineFonts;return result;};
  const historyCommit=recordHistory;
  recordHistory=function(...args){if(typing)return;return historyCommit(...args);};
  function finishTyping(){clearTimeout(typingTimer);typingTimer=null;if(!typing)return;typing=false;autoSuspended--;colorSaveGate.leave();recordHistory();clearTimeout(autoTimer);autoTimer=setTimeout(()=>flushAutoSave(),400);}
  function beginTyping(){if(typing)return;typing=true;autoSuspended++;colorSaveGate.enter();clearTimeout(autoTimer);}
  $('temEditor').addEventListener('beforeinput',beginTyping,true);
  $('temEditor').addEventListener('input',()=>{beginTyping();clearTimeout(typingTimer);typingTimer=setTimeout(finishTyping,800);},true);
  $('temEditor').addEventListener('blur',finishTyping);
  document.addEventListener('pointerdown',event=>{if(typing&&!event.target.closest('#temEditor'))finishTyping();},true);
  document.addEventListener('keydown',event=>{if(typing&&(event.ctrlKey||event.metaKey)&&['z','y','s'].includes(event.key.toLowerCase()))finishTyping();},true);
  captureAutoChanges=function(force=false){
    if(autoSuspended||!autoContext||!home.hidden||!window.TEMHOA_TOKEN)return;
    if(force){autoContext.capturedDirtyVersion=autoContext.dirtyVersion||0;autoContext.dirty=false;return capture();}
    autoContext.dirty=true;autoContext.dirtyVersion=(autoContext.dirtyVersion||0)+1;clearTimeout(autoTimer);autoTimer=setTimeout(()=>flushAutoSave(),1000);
  };
  const flush=flushAutoSave;
  flushAutoSave=async function(...args){finishTyping();await TemColors.finish();await TemImageTools.idle;const context=autoContext,result=await flush(...args);if(context){if(!result)context.dirty=true;else if((context.dirtyVersion||0)===context.capturedDirtyVersion&&!context.pending)context.dirty=false;}return result;};
  const finishCapture=capture;
  // Browser termination cannot wait for async wrappers to settle.
  window.addEventListener('pagehide',()=>{finishTyping();if(!autoSuspended&&autoContext?.dirty)finishCapture();});
  const beginDocument=beginAutoDocument;beginAutoDocument=function(...args){const result=beginDocument(...args);if(!autoWritePromise)for(const [name,context] of autoContexts)if(context!==autoContext&&!context.pending&&!context.error)autoContexts.delete(name);return result;};
  const sourceLoad=loadGraphic;
  $('graphicFile').onchange=async()=>{try{const file=$('graphicFile').files[0];if(!file)return;const asset=await TemStudio.assetFromFile(file);await addGraphic('image',asset.src,{width:asset.width,height:asset.height});$('graphicMessage').textContent='Đã chèn ảnh; giữ nguồn gốc để xuất và in.';}catch(error){$('graphicMessage').textContent=error.message;}finally{if(isDesign())$('status').textContent=$('graphicMessage').textContent;}};
  loadGraphic=async function(src){
    if(graphicImages.has(src))return graphicImages.get(src);
    const image=await sourceLoad(src);graphicImages.delete(src);graphicImages.set(src,image);
    const used=new Set(decorations.filter(i=>i.kind==='image').map(i=>i.src));for(const label of labels)for(const item of label.settings.decorations||[])if(item.kind==='image')used.add(item.src);
    let pixels=[...graphicImages.values()].reduce((n,image)=>n+image.width*image.height,0);
    for(const [key,value] of graphicImages){if((graphicImages.size<=32&&pixels<=64000000)||key===src)continue;if(!used.has(key)){graphicImages.delete(key);pixels-=value.width*value.height;}}
    return image;
  };
  // Optional counters have no polling or animation loop when disabled/idle.
  const enabled=new URLSearchParams(location.search).get('debugPerformance')==='1';
  if(enabled){
    const values={canvas:0,layerBuilds:0,history:0,autosaves:0,frames:0},panel=document.createElement('pre');panel.id='performanceDebug';panel.style.cssText='position:fixed;left:8px;bottom:8px;z-index:500;background:#fff;color:#25262b;border:1px solid #aaa;padding:8px;font:11px monospace;pointer-events:none';document.body.append(panel);
    let frame=0;const update=()=>{if(frame)return;frame=requestAnimationFrame(()=>{frame=0;panel.textContent=JSON.stringify({...values,objects:decorations.length,labels:labels.length,undo:historyIndex,redo:history.length-historyIndex-1,imageCache:graphicImages.size,heap:performance.memory?.usedJSHeapSize},null,2)});};
    let lastFrame=0;window.TemPerformance={values,count(key){values[key]=(values[key]||0)+1;update();},frame(){const now=performance.now();if(lastFrame)values.fps=Math.round(1000/Math.max(1,now-lastFrame));lastFrame=now;values.frames++;update();},dispose(){cancelAnimationFrame(frame);panel.remove();}};
    for(const [key,get,set] of [['canvas',()=>render,v=>render=v],['history',()=>recordHistory,v=>recordHistory=v],['autosaves',()=>postAutoTemplate,v=>postAutoTemplate=v]]){const old=get();set(function(...args){TemPerformance.count(key);return old(...args);});}
    window.addEventListener('pagehide',()=>TemPerformance.dispose(),{once:true});update();
  }
})();
