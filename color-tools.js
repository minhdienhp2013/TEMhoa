/* Live color edits reuse geometry/masks. Storage contains only user-picked colors. */
(() => {
  'use strict';
  let ready=null,session=null,frame=0,pending=Promise.resolve(),settling=null;
  const storageKey='TEMhoa_recent_colors_v1',limit=24;
  function paintValue(value){
    if(!value||typeof value!=='object')return null;
    if(value.type==='solid'&&/^#[0-9a-f]{6}$/i.test(value.color||''))return {type:'solid',color:safeHex(value.color)};
    if(['linear','radial'].includes(value.type)&&Array.isArray(value.colors)&&value.colors.length===2&&value.colors.every(c=>/^#[0-9a-f]{6}$/i.test(c)))return safePaint(value);
    return null;
  }
  let recent=[];try{const data=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(data))recent=data.map(paintValue).filter(Boolean).slice(0,limit);}catch{}
  const signature=value=>JSON.stringify(value);
  function remember(value){const p=paintValue(value);if(!p)return;recent=[p,...recent.filter(x=>signature(x)!==signature(p))].slice(0,limit);try{localStorage.setItem(storageKey,JSON.stringify(recent));}catch{}refreshMemory();}
  function rememberSession(s){for(const p of s.colors.values())remember(p);}
  const valid=()=>!labelLockControl.checked&&(!selectedGraphic()||!selectedGraphic().locked)&&graphicSelection().length<=1;
  function prepare(kind){
    const id=kind==='graphic'?selectedGraphic()?.id:kind.startsWith('text:')?kind.slice(5):null;
    if(ready?.owner===activeLabelId&&ready.kind===kind&&ready.id===id)return ready;
    const oldMask=maskCanvas,oldStack=paintLayerStack,masks={},segments=[];let L,scale;
    try{
      maskCanvas=(alpha,w,h,color)=>{if(['body','edge'].includes(color))masks[color]=oldMask(alpha,w,h,'#ffffff');return oldMask(alpha,w,h,color);};
      paintLayerStack=(ctx,l,s,background)=>{
        L=l;scale=s;background();let staticCanvas=null;
        for(const unit of orderedLayerUnits(l)){
          const dynamic=kind==='page'?unit.kind==='text':kind.startsWith('text:')?unit.kind==='text'&&unit.key===id:unit.kind==='graphic'&&unit.item.id===id;
          if(dynamic){staticCanvas=null;segments.push({unit});}
          else{if(!staticCanvas){staticCanvas=cv(ctx.canvas.width,ctx.canvas.height);segments.push({canvas:staticCanvas});}paintLayerUnit(staticCanvas.getContext('2d'),l,s,unit);}
        }
      };
      const output=render();ready={owner:activeLabelId,kind,id,L,scale,masks,segments,width:output.c.width,height:output.c.height,scratch:cv(output.c.width,output.c.height)};
      return ready;
    }finally{maskCanvas=oldMask;paintLayerStack=oldStack;}
  }
  function paintLive(s){
    window.TemPerformance?.frame();
    if(s.owner!==activeLabelId||!valid()||s.kind==='graphic'&&selectedGraphic()?.id!==s.id)return;
    const p=s.prepared,c=$('canvas'),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
    for(const key of ['body','edge'])if(p.masks[key]){
      const scratch=p.scratch,x=scratch.getContext('2d');x.clearRect(0,0,scratch.width,scratch.height);x.drawImage(p.masks[key],0,0);x.globalCompositeOperation='source-in';x.fillStyle=canvasPaint(x,key,scratch.width,scratch.height);x.fillRect(0,0,scratch.width,scratch.height);x.globalCompositeOperation='source-over';ctx.drawImage(scratch,0,0);
    }
    const oldLive=window.TEMHOA_LIVE_DRAW;window.TEMHOA_LIVE_DRAW=true;
    try{for(const segment of p.segments){if(segment.canvas)ctx.drawImage(segment.canvas,0,0);else{
      let unit=segment.unit;if(s.kind==='graphic'){const item=selectedGraphic();unit={...unit,item:{...item,x:item.x+(p.L.graphicOffsetX??p.L.offsetX??0),y:item.y+(p.L.graphicOffsetY??p.L.offsetY??0)}};}
      paintLayerUnit(ctx,p.L,p.scale,unit);
    }}}finally{window.TEMHOA_LIVE_DRAW=oldLive;}
    const label=currentLabel();label.size=previewSize;
    if(!label.bitmap||label.bitmap.width!==c.width||label.bitmap.height!==c.height)label.bitmap=cv(c.width,c.height);
    const bitmap=label.bitmap.getContext('2d');bitmap.clearRect(0,0,c.width,c.height);bitmap.drawImage(c,0,0);label.renderVersion=(label.renderVersion||0)+1;
  }
  function release(){if(session?.saveHeld){autoSuspended--;colorSaveGate.leave();session.saveHeld=false;}}
  function begin(kind){
    if(!valid()||!previewSize)return null;
    const id=kind==='graphic'?selectedGraphic()?.id:null;
    if(session&&(session.owner!==activeLabelId||session.kind!==kind||session.id!==id)){finish();return null;}
    if(!session){const prepared=prepare(kind);recordHistory();clearTimeout(timer);clearTimeout(autoTimer);autoSuspended++;colorSaveGate.enter();session={kind,id,owner:activeLabelId,prepared,colors:new Map(),saveHeld:true};}
    return session;
  }
  function schedule(){if(frame)return pending;pending=new Promise(resolve=>{frame=requestAnimationFrame(()=>{frame=0;try{if(session)paintLive(session);}catch(error){release();session=null;ready=null;captureAutoChanges();$('status').textContent=error.message;}resolve();});});return pending;}
  const oldPreview=preview;
  preview=async function(...args){const s=session;release();session=null;ready=null;try{return await oldPreview(...args);}finally{if(s){rememberSession(s);recordHistory();syncGraphicControls();renderLayersPanel();if(autoContext?.pending)oldSave().catch(error=>$('status').textContent=error.message);}}};
  async function finish(){
    if(settling){await settling;if(session)return finish();return;}
    const target=session,paintTask=pending;
    settling=(async()=>{await paintTask;if(target&&session===target){const prepared=ready;await preview();if(prepared?.owner===activeLabelId&&(prepared.kind==='page'||prepared.id===selectedGraphic()?.id))ready=prepared;}})();
    try{return await settling;}finally{settling=null;}
  }
  commitPaint=function(paint,hex){
    const s=begin('page');if(!s)return;
    if(hex)$(colorTarget).value=safeHex(hex);colorStyles[colorTarget]=safePaint(paint);syncColorDialog();
    s.colors.set(colorTarget,colorStyles[colorTarget].type==='solid'?{type:'solid',color:$(colorTarget).value}:colorStyles[colorTarget]);schedule();
  };
  function graphicPatch(patch){
    const s=begin('graphic');if(!s)return Promise.resolve(false);Object.assign(selectedGraphic(),patch);
    for(const [colorKey,paintKey] of [['color','shapeFillPaint'],['strokeColor','shapeStrokePaint']])if(patch[colorKey]||patch[paintKey]){const p=safePaint(selectedGraphic()[paintKey]);s.colors.set(colorKey,p.type==='solid'?{type:'solid',color:selectedGraphic()[colorKey]}:p);}
    return schedule();
  }
  const oldSave=flushAutoSave;flushAutoSave=async function(...args){await finish();return oldSave(...args);};
  const oldRestore=restoreHistory;restoreHistory=function(delta){if(session||frame)return finish().then(()=>oldRestore(delta));return oldRestore(delta);};
  for(const id of ['paint-fill','paint-body','paint-edge'])$(id)?.addEventListener('click',()=>{if(valid())prepare('page');});
  for(const id of ['paintDialog','shapeGradientDialog'])$(id).addEventListener('close',()=>{if(!$(id).open)finish();});
  document.addEventListener('change',event=>{if(event.target.matches('input[type=color],#spectrumHue,#paintAngle,#shapeGradientMode,#shapeGradientAngle,#paintMode,#paintHex'))finish();});
  document.addEventListener('click',event=>{if(event.target.closest?.('#solidSwatches button,#gradientSwatches button'))finish();});
  document.addEventListener('keyup',event=>{if(event.target.id==='spectrumSV'&&event.key.startsWith('Arrow'))finish();});
  document.addEventListener('focusout',event=>{if(event.target.matches('input[type=color],#spectrumHue'))finish();});
  document.addEventListener('pointerup',event=>{if(event.target.closest?.('#spectrumSV,#spectrumHue'))finish();});
  document.addEventListener('keydown',event=>{if(!session&&!frame)return;if(event.key==='Escape')finish();if((event.ctrlKey||event.metaKey)&&!event.altKey&&['z','y'].includes(event.key.toLowerCase())){event.preventDefault();event.stopImmediatePropagation();finish().then(()=>oldRestore(event.shiftKey||event.key.toLowerCase()==='y'?1:-1));}},true);
  document.addEventListener('pointerdown',event=>{if(session&&!event.target.closest?.('#paintDialog,#shapeGradientDialog,#shapeToolbar'))finish();},true);
  window.addEventListener('pagehide',()=>{const s=session;release();if(s)rememberSession(s);captureAutoChanges();oldSave();});

  // The same bounded palette is offered alongside all visible color controls.
  const memories=new Set();
  function swatchCSS(p){return p.type==='solid'?p.color:p.type==='radial'?`radial-gradient(${p.colors.join(',')})`:`linear-gradient(${p.angle}deg,${p.colors.join(',')})`;}
  function addMemory(host,apply,gradient=true){
    const details=document.createElement('details');details.className='colorMemory';const summary=document.createElement('summary');summary.textContent='Màu đã dùng';const grid=document.createElement('div');grid.className='colorMemorySwatches';grid.setAttribute('role','group');grid.setAttribute('aria-label','Màu đã dùng gần đây');details.append(summary,grid);host.append(details);details.addEventListener('toggle',()=>{if(!details.open)return;for(const other of memories)if(other.details!==details)other.details.open=false;if(!host.closest('#shapeToolbar'))return;const r=summary.getBoundingClientRect();grid.style.position='fixed';grid.style.zIndex='190';grid.style.right='auto';grid.style.left=Math.max(8,Math.min(r.left,innerWidth-grid.offsetWidth-8))+'px';grid.style.top=Math.max(8,Math.min(r.bottom+4,innerHeight-grid.offsetHeight-8))+'px';});
    const item={details,grid,apply,gradient};memories.add(item);refreshMemory();return details;
  }
  function refreshMemory(){for(const item of memories){if(!item.details.isConnected){memories.delete(item);continue;}item.grid.replaceChildren();const entries=recent.filter(p=>item.gradient||p.type==='solid');if(!entries.length){const label=document.createElement('span');label.textContent='Chưa có màu đã dùng';item.grid.append(label);}for(const p of entries){const b=document.createElement('button');b.type='button';b.className='colorMemorySwatch';b.style.background=swatchCSS(p);const name=p.type==='solid'?p.color.toUpperCase():`Chuyển sắc ${p.type==='linear'?'thẳng':'tròn'} ${p.colors.join(' → ')} · ${p.angle}°`;b.title=name;b.setAttribute('aria-label','Dùng màu '+name);b.onclick=()=>{if(!valid())return;item.apply(copyLabelData(p));item.details.open=false;remember(p);item.details.querySelector('summary').focus({preventScroll:true});};item.grid.append(b);}}}
  const pageMemory=addMemory($('paintDialog'),p=>{commitPaint(p,p.color||p.colors[0]);finish();});$('paintDialog').insertBefore(pageMemory,$('paintDialog').querySelector('h3'));
  for(const [id,target] of [['shapeFillColor','fill'],['shapeStrokeColor','stroke']])addMemory($(id).parentElement,p=>{TemShapes.applyPaint(p,target);finish();});
  addMemory($('shapeGradientDialog'),p=>{const target=$('shapeGradientTitle').textContent.startsWith('Màu viền')?'stroke':'fill';TemShapes.applyPaint(p,target);$('shapeGradientMode').value=p.type;$('shapeGradientColor1').value=p.color||p.colors[0];if(p.colors)$('shapeGradientColor2').value=p.colors[1];$('shapeGradientSample').style.background=swatchCSS(p);finish();});
  const wired=new WeakSet();
  function wireColors(){
    const mode=$('imageTintMode');if(mode&&!wired.has(mode)){wired.add(mode);addMemory(mode.parentElement.parentElement,p=>{mode.value=p.type;$('imageTintColor').value=p.color||p.colors[0];if(p.colors)$('imageTintColor2').value=p.colors[1];$('imageTintAngle').value=p.angle??90;mode.dispatchEvent(new Event('change',{bubbles:true}));});}
    for(const input of document.querySelectorAll('input[type=color]')){
    if(wired.has(input)||input.hidden||input.closest('#imageLegacyControls,.colorMemory'))continue;wired.add(input);
    if(input.closest('#paintDialog,#shapeToolbar,#shapeGradientDialog'))continue;
    addMemory(input.parentElement,p=>{input.value=p.color;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));},false);
  }}
  document.addEventListener('pointerdown',event=>{for(const {details} of memories)if(details.open&&!details.contains(event.target))details.open=false;});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')for(const {details} of memories)details.open=false;});
  window.addEventListener('resize',()=>{for(const {details} of memories)details.open=false;});
  const observer=new MutationObserver(wireColors);observer.observe(document.body,{childList:true,subtree:true});wireColors();
  document.addEventListener('change',event=>{const input=event.target;if(input.matches('input[type=color]')&&!input.closest('#paintDialog,#shapeToolbar,#shapeGradientDialog'))remember({type:'solid',color:input.value});});
  const style=document.createElement('style');style.textContent='.colorMemory{position:relative;display:inline-block;margin:5px 4px;font-size:12px}.colorMemory summary{cursor:pointer;min-height:34px;display:flex;align-items:center;padding:5px 8px;border:1px solid var(--ui-line,#E3E1DA);border-radius:4px;background:var(--ui-surface,#fff)}.colorMemorySwatches{max-height:60dvh;overflow:auto;display:grid;grid-template-columns:repeat(6,28px);gap:6px;padding:10px;background:var(--ui-surface,#fff);border:1px solid var(--ui-line,#E3E1DA);border-radius:4px}.colorMemory:not([open]) .colorMemorySwatches{display:none}.colorMemorySwatches span{grid-column:1/-1;white-space:nowrap}.colorMemorySwatch{width:28px!important;height:28px!important;min-height:28px!important;min-width:28px!important;padding:0!important;margin:0!important;border:1px solid #9a9ca2!important;border-radius:3px!important}.colorMemory :focus-visible{outline:2px solid #4967C9;outline-offset:2px}#shapeToolbar .colorMemory{margin:0 2px}#shapeToolbar .colorMemorySwatches{position:absolute;right:0;top:100%;z-index:190;box-shadow:var(--ui-shadow)}@media(pointer:coarse){.colorMemory summary{min-height:44px}.colorMemorySwatches{grid-template-columns:repeat(4,44px)}.colorMemorySwatch{width:44px!important;height:44px!important;min-height:44px!important}}';document.head.append(style);
  window.TemColors={prepare,graphicPatch,finish,remember,textFrame(prepared){paintLive({owner:activeLabelId,kind:prepared.kind,prepared});},get pending(){return pending;},get idle(){return finish();},get recent(){return copyLabelData(recent);}};
})();
