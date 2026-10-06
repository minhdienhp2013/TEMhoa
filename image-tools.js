/* Image properties are data, shared by the canvas, thumbnails and exports. */
(() => {
  'use strict';
  const defaults = {opacity:1, radius:0, strokeWidth:0, strokeColor:'#25262b', strokeStyle:'solid',
    shadowColor:'#25262b', shadowOpacity:0, shadowBlur:0, shadowX:0, shadowY:0,
    brightness:0, contrast:0, saturation:0, temperature:0, blur:0, imageMask:'rect'};
  const limits = {opacity:[0,1],radius:[0,50],strokeWidth:[0,50],shadowOpacity:[0,1],
    shadowBlur:[0,100],shadowX:[-200,200],shadowY:[-200,200],brightness:[-100,100],
    contrast:[-100,100],saturation:[-100,100],temperature:[-100,100],blur:[0,30]};
  const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
  const beforeSafe = safeGraphic;
  safeGraphic = function(value) {
    const item=beforeSafe(value);if(!item)return item;
    for(const [key,fallback] of Object.entries(defaults)) {
      item[key]=limits[key] ? (Number.isFinite(+value[key])?clamp(+value[key],...limits[key]):fallback)
        : ['strokeColor','shadowColor'].includes(key)?safeHex(value[key]||fallback):fallback;
    }
    item.strokeStyle=['solid','dash','dot'].includes(value.strokeStyle)?value.strokeStyle:'solid';
    item.imageMask=['rect','ellipse'].includes(value.imageMask)?value.imageMask:'rect';
    const c=value.imageCrop;
    if(c&&['x','y','width','height'].every(k=>Number.isFinite(c[k]))&&c.x>=0&&c.y>=0&&c.width>=.01&&c.height>=.01&&c.x+c.width<=1.0001&&c.y+c.height<=1.0001)item.imageCrop={...c};
    return item;
  };
  // Upgrade in-memory old documents too; setLabelSettings handles future loads.
  decorations=decorations.map(safeGraphic).filter(Boolean);
  const processed=new Map(),frames=new Map();
  function imagePixels(item) {
    const image=graphicImages.get(item.src);if(!image)return null;
    if(!['brightness','contrast','saturation','temperature','blur'].some(k=>item[k]))return image;
    const key=JSON.stringify([item.src,...['brightness','contrast','saturation','temperature','blur'].map(k=>item[k]||0),item.blur?item.width:0]);
    if(processed.has(key))return processed.get(key);
    const c=cv(image.width,image.height),ctx=c.getContext('2d');
    ctx.filter=`brightness(${1+(item.brightness||0)/100}) contrast(${1+(item.contrast||0)/100}) saturate(${1+(item.saturation||0)/100}) blur(${(item.blur||0)*image.width/Math.max(1,item.width)}px)`;
    ctx.drawImage(image,0,0);ctx.filter='none';
    if(item.temperature){const pixels=ctx.getImageData(0,0,c.width,c.height),t=item.temperature*.45;for(let i=0;i<pixels.data.length;i+=4){pixels.data[i]+=t;pixels.data[i+2]-=t;}ctx.putImageData(pixels,0,0);}
    processed.set(key,c);while(processed.size>1&&[...processed.values()].reduce((n,c)=>n+c.width*c.height,0)>40000000)processed.delete(processed.keys().next().value);while(processed.size>4)processed.delete(processed.keys().next().value);return c;
  }
  function path(ctx,item,inset=0) {
    const w=item.width-2*inset,h=item.height-2*inset;ctx.beginPath();
    if(item.imageMask==='ellipse')ctx.ellipse(item.width/2,item.height/2,Math.max(.01,w/2),Math.max(.01,h/2),0,0,Math.PI*2);
    else ctx.roundRect(inset,inset,Math.max(.01,w),Math.max(.01,h),Math.max(0,Math.min(w,h)*(item.radius||0)/100));
  }
  function cover(image,ratio) {
    const r=image.width/image.height;
    return r>ratio?{x:(1-ratio/r)/2,y:0,width:ratio/r,height:1}:{x:0,y:(1-r/ratio)/2,width:1,height:r/ratio};
  }
  drawGraphic=function(ctx,item,mask=false) {
    if(item.kind!=='image') { const bitmap=emojiBitmap(item.kind);ctx.save();ctx.translate(item.x,item.y);ctx.rotate(item.angle*Math.PI/180);ctx.scale(item.flipX?-1:1,item.flipY?-1:1);ctx.globalAlpha*=item.opacity??1;ctx.drawImage(mask?bitmap.mask:bitmap.canvas,-item.width/2,-item.height/2,item.width,item.height);ctx.restore();return; }
    const image=imagePixels(item);if(!image)return;
    // Clip into a transparent frame first. This also gives shadows the correct mask.
    const factor=Math.min(window.TEMHOA_LIVE_DRAW?1:4,Math.max(1,image.width/item.width),5000/item.width,5000/item.height,Math.sqrt(16000000/(item.width*item.height)));
    const frameKey=JSON.stringify([factor,item.src,item.width,item.height,item.imageCrop,item.radius,item.imageMask,...['brightness','contrast','saturation','temperature','blur'].map(k=>item[k]||0)]);
    let frame=frames.get(frameKey);if(!frame){
    frame=cv(Math.max(1,Math.ceil(item.width*factor)),Math.max(1,Math.ceil(item.height*factor)));const fc=frame.getContext('2d');fc.scale(factor,factor);path(fc,item);fc.clip();
    const c=item.imageCrop||{x:0,y:0,width:1,height:1};
    // Preserve legacy stretch unless a new replacement/crop provides an explicit region.
    fc.drawImage(image,c.x*image.width,c.y*image.height,c.width*image.width,c.height*image.height,0,0,item.width,item.height);
    frames.set(frameKey,frame);while(frames.size>1&&[...frames.values()].reduce((n,c)=>n+c.width*c.height,0)>20000000)frames.delete(frames.keys().next().value);while(frames.size>8)frames.delete(frames.keys().next().value);}
    ctx.save();ctx.translate(item.x,item.y);ctx.rotate(item.angle*Math.PI/180);ctx.scale(item.flipX?-1:1,item.flipY?-1:1);ctx.translate(-item.width/2,-item.height/2);ctx.globalAlpha*=item.opacity??1;
    if(!mask&&(item.shadowOpacity||0)>0){const hex=item.shadowColor||defaults.shadowColor;ctx.shadowColor=hex+Math.round(item.shadowOpacity*255).toString(16).padStart(2,'0');const scale=Math.hypot(ctx.getTransform().a,ctx.getTransform().b);ctx.shadowBlur=(item.shadowBlur||0)*scale;const m=ctx.getTransform();ctx.shadowOffsetX=(item.shadowX||0)*m.a+(item.shadowY||0)*m.c;ctx.shadowOffsetY=(item.shadowX||0)*m.b+(item.shadowY||0)*m.d;}
    ctx.drawImage(frame,0,0,item.width,item.height);ctx.shadowColor='transparent';
    const stroke=Math.min(item.strokeWidth||0,item.width/2,item.height/2);if(stroke){path(ctx,item,stroke/2);ctx.strokeStyle=item.strokeColor||defaults.strokeColor;ctx.lineWidth=stroke;ctx.setLineDash(item.strokeStyle==='dash'?[stroke*3,stroke*2]:item.strokeStyle==='dot'?[stroke,stroke*2]:[]);ctx.stroke();}ctx.restore();
  };
  const oldBounds=graphicBounds;
  graphicBounds=function(item){const b=oldBounds(item);if(!item.shadowOpacity)return b;const p=3*(item.shadowBlur||0),a=item.angle*Math.PI/180,dx=(item.shadowX||0)*Math.cos(a)-(item.shadowY||0)*Math.sin(a),dy=(item.shadowX||0)*Math.sin(a)+(item.shadowY||0)*Math.cos(a);return {x:b.x-p+Math.min(0,dx),y:b.y-p+Math.min(0,dy),width:b.width+2*p+Math.abs(dx),height:b.height+2*p+Math.abs(dy)};};
  const oldSVG=graphicSVGBody;
  graphicSVGBody=function(item,mask=false){if(item.kind!=='image')return oldSVG(item,mask);const b=graphicBounds({...item,x:item.width/2,y:item.height/2,angle:0}),c=cv(Math.ceil(b.width*3),Math.ceil(b.height*3)),ctx=c.getContext('2d');ctx.scale(3,3);ctx.translate(-b.x,-b.y);drawGraphic(ctx,{...item,x:item.width/2,y:item.height/2,angle:0,flipX:false,flipY:false},mask);return `<image href="${c.toDataURL('image/png')}" x="${b.x/item.width*100}" y="${b.y/item.height*100}" width="${b.width/item.width*100}" height="${b.height/item.height*100}" preserveAspectRatio="none"/>`;};

  // One mutation queue prevents async edits from applying to a different selection.
  let noneSelected=false,busy=false,queue=Promise.resolve(),popover=null,crop=null,styleClipboard=null;
  const currentImage=()=>selectedGraphic()?.kind==='image'&&graphicSelection().length===1&&!labelGroupKey(currentLabel())?selectedGraphic():null;
  const canEdit=item=>item&&item.id===currentImage()?.id&&!item.locked&&!labelLockControl.checked;
  const message=text=>{$('status').textContent=text;const status=$('imageToolStatus');if(status)status.textContent=text;};
  function mutate(change) {
    const item=currentImage(),owner=activeLabelId;if(!canEdit(item)||busy)return Promise.resolve(false);
    queue=queue.then(async()=>{if(activeLabelId!==owner||!canEdit(item))return false;recordHistory();await change(currentImage());await ensureGraphics();await preview();recordHistory();syncGraphicControls();renderLayersPanel();return true;}).catch(error=>{message(error.message);return false;});return queue;
  }
  const icons={edit:'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M9 15v6',replace:'M4 8V4h16v16H4v-4M1 12h12M9 8l4 4-4 4',background:'M4 4h16v16H4zM4 16l5-5 4 4 3-3 4 4M8 8h.01M3 21L21 3',stroke:'M4 5h16M4 12h16M4 19h16',radius:'M4 20v-7a9 9 0 0 1 9-9h7',flip:'M12 3v18M3 6l6 6-6 6zM21 6l-6 6 6 6z',opacity:'M12 3a9 9 0 1 0 0 18zM12 3a9 9 0 0 1 0 18',style:'M4 3h16v7H4zM12 10v4h5v7h-4v-7',more:'M5 12h.01M12 12h.01M19 12h.01',unlock:'M6 11h12v10H6zM16 7a4 4 0 0 0-8 0v4'};
  Object.assign(artPaths,icons);
  const bar=artImageZone;bar.replaceChildren();bar.setAttribute('aria-label','Thanh công cụ ảnh');bar.setAttribute('role','toolbar');
  function button(id,label,icon,action,iconOnly=false){const b=artButton(id,label,icon,()=>Promise.resolve(action()).catch(e=>message(e.message)));artDecorate(b,icon,iconOnly?null:label);b.setAttribute('aria-label',label);b.title=label;return b;}
  const buttons={};
  const entries=[['edit','Chỉnh sửa','edit',()=>openPanel('edit')],['replace','Thay thế','replace',()=>replaceInput.click()],['background','Xóa nền','background',()=>{closePopover();$('openBackgroundAI').click()}],['delete','Xóa ảnh','trash',()=>mutate(item=>{decorations=decorations.filter(x=>x!==item);selectedGraphicId=null;selectedGraphicSet.clear();})],['stroke','Viền ảnh','stroke',()=>openPanel('stroke'),true],['radius','Bo góc','radius',()=>openPanel('radius'),true],['crop','Cắt ảnh','crop',()=>startCrop(),true],['flip','Lật','flip',()=>openPanel('flip')],['opacity','Độ mờ','opacity',()=>openPanel('opacity'),true],['position','Vị trí','layers',()=>openPanel('position')],['style','Kiểu dáng','style',()=>openPanel('style')]];
  for(const [key,label,icon,action,only] of entries){if(['stroke','crop','position'].includes(key)){const d=document.createElement('span');d.className='artDivider imageDivider';bar.append(d);}const b=button('image-'+key,label,icon,action,only);b.dataset.imageAction=key;buttons[key]=b;bar.append(b);}
  const unlock=button('image-unlock','Mở khóa','unlock',async()=>{const item=currentImage();if(!item)return;recordHistory();item.locked=false;labelLockControl.checked=false;currentLabel().settings.labelLocked=false;await preview();recordHistory();syncGraphicControls();});unlock.hidden=true;bar.append(unlock);
  const more=button('image-more','Thêm','more',()=>openPanel('more'));bar.append(more);
  const replaceInput=document.createElement('input');replaceInput.id='image-replace-file';replaceInput.type='file';replaceInput.accept='image/png,image/jpeg,image/webp';replaceInput.hidden=true;document.body.append(replaceInput);
  buttons.replace.onclick=()=>{replaceInput.value='';replaceInput.click();};
  replaceInput.onchange=async()=>{const file=replaceInput.files[0],item=currentImage(),owner=activeLabelId;if(!file||!canEdit(item)||busy)return;busy=true;syncBar();message('Đang đọc ảnh thay thế…');try{const entry=await TemStudio.assetFromFile(file),image=await loadGraphic(entry.src);if(owner!==activeLabelId||!canEdit(item))throw Error('Vùng chọn đã đổi. Chọn lại ảnh để thay thế.');recordHistory();Object.assign(item,{src:entry.src,original:entry.src,sourceOriginal:entry.src,imageCrop:cover(image,item.width/item.height),removeWhite:false});delete item.crop;await preview();recordHistory();message('');}catch(e){message(e.message);}finally{busy=false;syncGraphicControls();}};
  function closePopover(restore=false){if(!popover)return;const {node,anchor}=popover;popover=null;if(node.contains(manualBackground))legacy.append(manualBackground);node.remove();anchor?.setAttribute('aria-expanded','false');if(restore)anchor?.focus();}
  function shell(kind,title){closePopover();closeFontPicker();artCloseExport();labelMenu.hidden=true;const node=document.createElement('section');node.className='imagePopover';node.id='imagePanel';node.setAttribute('role','dialog');node.setAttribute('aria-label',title);const header=document.createElement('div');header.className='imagePanelHeader';const h=document.createElement('strong');h.textContent=title;header.append(h,button('image-close-panel','Đóng bảng ảnh','close',()=>closePopover(true),true));node.append(header);document.body.append(node);const anchor=buttons[kind]?.offsetParent?buttons[kind]:more;popover={node,anchor,owner:activeLabelId,id:currentImage()?.id};anchor.setAttribute('aria-expanded','true');anchor.setAttribute('aria-haspopup','dialog');const s=document.createElement('p');s.id='imageToolStatus';s.setAttribute('role','status');node.append(s);return node;}
  function place(){if(!popover)return;const {node,anchor}=popover,r=anchor.getBoundingClientRect();node.style.left=clamp(r.left,8,Math.max(8,innerWidth-node.offsetWidth-8))+'px';node.style.top=clamp(r.bottom+6,8,Math.max(8,innerHeight-node.offsetHeight-8))+'px';}
  function control(node,key,label,min,max,step=1,multiplier=1) {
    const row=document.createElement('label');row.className='imageSlider';const name=document.createElement('span');name.textContent=label;const range=document.createElement('input'),number=document.createElement('input');range.type='range';number.type='number';
    for(const input of [range,number]){input.min=min;input.max=max;input.step=step;input.value=Math.round((currentImage()?.[key]??defaults[key])*multiplier*100)/100;input.setAttribute('aria-label',label+(input===range?'':' — giá trị'));}
    const change=input=>{let val=Number(input.value);if(!Number.isFinite(val))return;val=clamp(val,min,max);range.value=number.value=val;mutate(item=>item[key]=val/multiplier);};
    range.oninput=()=>change(range);number.onchange=()=>change(number);row.append(name,range,number);node.append(row);
  }
  function color(node,key,label){const row=document.createElement('label');row.textContent=label;const input=document.createElement('input');input.type='color';input.value=currentImage()?.[key]||defaults[key];input.setAttribute('aria-label',label);input.oninput=()=>mutate(item=>item[key]=input.value);row.append(input);node.append(row);}
  function reset(node,keys,label='Đặt lại'){node.append(button('',label,'undo',async()=>{await mutate(item=>keys.forEach(k=>item[k]=defaults[k]));const kind=popover?.kind;if(kind){closePopover();openPanel(kind);}}));}
  function openPanel(kind){if(!currentImage()&&kind!=='more')return;if(!canEdit(currentImage())&&kind!=='more')return;
    if(popover?.kind===kind){closePopover(true);return;}const title={edit:'Chỉnh sửa ảnh',stroke:'Viền ảnh',radius:'Bo góc và mask',flip:'Lật ảnh',opacity:'Độ mờ',position:'Vị trí ảnh',style:'Kiểu dáng ảnh',more:'Thêm công cụ ảnh'}[kind];const node=shell(kind,title);popover.kind=kind;
    if(kind==='edit'){for(const [key,label,min,max] of [['brightness','Sáng',-100,100],['contrast','Tương phản',-100,100],['saturation','Bão hòa',-100,100],['temperature','Nhiệt độ màu',-100,100],['blur','Làm mờ',0,30]])control(node,key,label,min,max);reset(node,['brightness','contrast','saturation','temperature','blur']);node.append(button('image-restore','Khôi phục ảnh gốc','undo',()=>restoreOriginal()));node.append(manualBackground);node.append(document.createTextNode('Điều chỉnh giữ ảnh gốc. Chuyển động trình chiếu chưa hỗ trợ.'));}
    if(kind==='stroke'){color(node,'strokeColor','Màu viền');control(node,'strokeWidth','Độ dày viền (px)',0,50,.5);const label=document.createElement('label');label.textContent='Kiểu nét';const select=document.createElement('select');select.setAttribute('aria-label','Kiểu nét');for(const [v,t] of [['solid','Liền'],['dash','Nét đứt'],['dot','Chấm']])select.add(new Option(t,v));select.value=currentImage().strokeStyle||'solid';select.onchange=()=>mutate(item=>item.strokeStyle=select.value);label.append(select);node.append(label);reset(node,['strokeColor','strokeWidth','strokeStyle']);}
    if(kind==='radius'){control(node,'radius','Bo góc (%)',0,50);const label=document.createElement('label');label.textContent='Mask';const select=document.createElement('select');select.setAttribute('aria-label','Mask ảnh');select.add(new Option('Chữ nhật','rect'));select.add(new Option('Elip','ellipse'));select.value=currentImage().imageMask||'rect';select.onchange=()=>mutate(item=>item.imageMask=select.value);label.append(select);node.append(label);reset(node,['radius','imageMask']);}
    if(kind==='flip')for(const [key,label] of [['flipX','Lật ngang'],['flipY','Lật dọc']])node.append(button('',label,'flip',async()=>{await mutate(item=>item[key]=!item[key]);closePopover(true);}));
    if(kind==='opacity'){control(node,'opacity','Độ mờ (%)',0,100,1,100);reset(node,['opacity']);}
    if(kind==='position')positionPanel(node);
    if(kind==='style'){color(node,'shadowColor','Màu bóng');control(node,'shadowOpacity','Độ mờ bóng (%)',0,100,1,100);control(node,'shadowBlur','Độ nhòe bóng (px)',0,100);control(node,'shadowX','Lệch ngang bóng (px)',-200,200);control(node,'shadowY','Lệch dọc bóng (px)',-200,200);reset(node,['shadowColor','shadowOpacity','shadowBlur','shadowX','shadowY']);node.append(button('image-copy-style','Sao chép kiểu ảnh','copy',()=>copyStyle()),button('image-paste-style','Dán kiểu ảnh','style',()=>pasteStyle()));$('image-paste-style').disabled=!styleClipboard;}
    if(kind==='more'){for(const key of ['delete','stroke','radius','crop','flip','opacity','position','style']){const source=buttons[key],b=button('',source.getAttribute('aria-label'),source.querySelector('svg')?'properties':'image',()=>{closePopover();source.click()});b.disabled=source.disabled;node.append(b);}const note=document.createElement('p');note.textContent='Chuyển động: dành cho trình chiếu, chưa hỗ trợ.';node.append(note);}
    place();artEnter(node,'menu');node.querySelector('input,select,button:not(#image-close-panel)')?.focus();
  }
  function positionPanel(node){
    const grid=document.createElement('div');grid.className='imagePositionGrid';node.append(grid);
    const geo=worldGeometry(currentImage());
    for(const [key,label] of [['x','X (cm)'],['y','Y (cm)'],['width','Rộng (cm)'],['height','Cao (cm)'],['angle','Góc xoay (độ)']]){const row=document.createElement('label');row.textContent=label;const input=document.createElement('input');input.type='number';input.step=key==='angle'?1:.1;input.value=+geo[key].toFixed(2);input.setAttribute('aria-label',label);input.onchange=()=>{const v=+input.value;if(!Number.isFinite(v)||(['width','height'].includes(key)&&v<=0))return;mutate(item=>setWorld(item,key,v));};row.append(input);grid.append(row);}
    const ratio=document.createElement('label');const check=document.createElement('input');check.type='checkbox';check.checked=currentImage().keepRatio!==false;check.onchange=()=>mutate(item=>item.keepRatio=check.checked);ratio.append(check,' Khóa tỷ lệ');node.append(ratio);
    const group=document.createElement('div');group.className='imageActionGrid';for(const [mode,label,icon] of [['up','Lên một lớp','up'],['down','Xuống một lớp','down'],['front','Lên trên cùng','up'],['back','Xuống dưới cùng','down']])group.append(button('',label,icon,()=>{if(canEdit(currentImage()))return moveImageLayer(mode);}));node.append(group);
    const align=document.createElement('select');align.setAttribute('aria-label','Căn theo trang');for(const [v,t] of [['','Căn theo trang…'],['left','Trái'],['hcenter','Giữa ngang'],['right','Phải'],['top','Trên'],['vcenter','Giữa dọc'],['bottom','Dưới']])align.add(new Option(t,v));align.onchange=()=>{const mode=align.value;mutate(item=>{const g=worldGeometry(item),page=previewPage();if(['left','right','hcenter'].includes(mode))setWorld(item,'x',mode==='left'?0:mode==='right'?page.width-g.width:(page.width-g.width)/2);else if(mode)setWorld(item,'y',mode==='top'?0:mode==='bottom'?page.height-g.height:(page.height-g.height)/2);});};node.append(align,button('image-lock','Khóa ảnh','lock',()=>{closePopover();return contextToggleLock();}));
  }

  async function moveImageLayer(mode){
    if(!canEdit(currentImage()))return;
    if(!editorText().trim()&&decorations.length===1){
      const id=selectedGraphicId;saveActiveLabel();selectedGraphicId=null;selectedGraphicSet.clear();selectedLabelSet=new Set([activeLabelId]);
      try{const t=layerTarget(),delta=mode==='up'?1:mode==='down'?-1:mode==='front'?t.items.length-1-t.index:-t.index;await moveObjectLayer(delta);}
      finally{selectGraphicItems(decorations.find(x=>x.id===id));syncGraphicControls();}
    }else{const t=layerTarget();await moveObjectLayer(mode==='up'?1:mode==='down'?-1:mode==='front'?t.items.length-1-t.index:-t.index);}
  }
  function worldGeometry(item){const L=previewSize?.L||layout(),u=graphicUnits(),g=labelGeometry(currentLabel()),a=(Number($('labelAngle').value)||0)*Math.PI/180,cx=g.x+g.width/2,cy=g.y+g.height/2,vx=(item.x+(L.graphicOffsetX??L.offsetX??0))*u.x-g.width/2,vy=(item.y+(L.graphicOffsetY??L.offsetY??0))*u.y-g.height/2,w=item.width*u.x,h=item.height*u.y;return {x:cx+vx*Math.cos(a)-vy*Math.sin(a)-w/2,y:cy+vx*Math.sin(a)+vy*Math.cos(a)-h/2,width:w,height:h,angle:(item.angle||0)+a*180/Math.PI};}
  function setWorld(item,key,value){const g=worldGeometry(item),u=graphicUnits(),a=(Number($('labelAngle').value)||0)*Math.PI/180;if(key==='angle'){item.angle=value-a*180/Math.PI;return;}if(['width','height'].includes(key)){const size=value/u[key==='width'?'x':'y'];if(item.keepRatio!==false)item[key==='width'?'height':'width']*=size/item[key];item[key]=clamp(size,8,2500);return;}const dx=key==='x'?value-g.x:0,dy=key==='y'?value-g.y:0;item.x+=(dx*Math.cos(a)+dy*Math.sin(a))/u.x;item.y+=(-dx*Math.sin(a)+dy*Math.cos(a))/u.y;}
  const styleKeys=['opacity','radius','imageMask','strokeWidth','strokeColor','strokeStyle','shadowColor','shadowOpacity','shadowBlur','shadowX','shadowY','brightness','contrast','saturation','temperature','blur'];
  function copyStyle(){const item=currentImage();if(item){styleClipboard=Object.fromEntries(styleKeys.map(k=>[k,item[k]??defaults[k]]));message('Đã sao chép kiểu ảnh.');if($('image-paste-style'))$('image-paste-style').disabled=false;}}
  function pasteStyle(){if(styleClipboard)return mutate(item=>Object.assign(item,contextClone(styleClipboard)));}
  async function restoreOriginal(){await mutate(async item=>{item.src=item.original=item.sourceOriginal||item.original||item.src;item.removeWhite=false;delete item.imageCrop;delete item.crop;const image=await loadGraphic(item.src);item.imageCrop={x:0,y:0,width:1,height:1};item.height=item.width*image.height/image.width;});}

  async function startCrop(){const item=currentImage();if(!canEdit(item))return;closePopover();cancelCrop();const image=await loadGraphic(item.src);if(!canEdit(item))return;
    const stage=$('previewStage').getBoundingClientRect(),g=worldGeometry(item),unit=stage.width/previewPage().width,W=g.width*unit,H=g.height*unit,region=contextClone(item.imageCrop||cover(image,item.width/item.height));
    const area=$('previewArea').getBoundingClientRect(),viewport=document.createElement('div');viewport.id='imageCropViewport';Object.assign(viewport.style,{left:area.left+'px',top:area.top+'px',width:area.width+'px',height:area.height+'px'});document.body.append(viewport);
    const root=document.createElement('div');root.id='imageCropCanvas';root.setAttribute('role','group');root.setAttribute('aria-label','Cắt ảnh trực tiếp trên canvas');Object.assign(root.style,{position:'absolute',left:(stage.left+g.x*unit-area.left)+'px',top:(stage.top+g.y*unit-area.top)+'px',width:W+'px',height:H+'px',transform:`rotate(${g.angle}deg) scale(${item.flipX?-1:1},${item.flipY?-1:1})`});
    const full=document.createElement('img');full.src=item.src;full.alt='Ảnh nguồn để cắt';full.draggable=false;const selection=document.createElement('div');selection.className='imageCropKeep';selection.tabIndex=0;selection.setAttribute('aria-label','Vùng giữ lại; phím mũi tên để di chuyển');root.append(full,selection);viewport.append(root);document.body.classList.add('imageCropActive');
    const actions=document.createElement('div');actions.id='imageCropActions';actions.innerHTML='<strong>Cắt ảnh</strong><label><input id="imageCropRatio" type="checkbox" checked> Giữ tỷ lệ</label><span>Kéo ảnh hoặc vùng giữ lại; kéo góc để cắt.</span>';actions.append(button('image-crop-apply','Áp dụng','crop',()=>applyCrop()),button('image-crop-cancel','Hủy','close',()=>cancelCrop(true)));document.body.append(actions);
    crop={item,owner:activeLabelId,viewport,root,full,selection,actions,region,W,H,scaleX:W/region.width,scaleY:H/region.height,originX:-region.x*W/region.width,originY:-region.y*H/region.height,aspect:region.width/region.height};
    for(const handle of ['nw','ne','sw','se']){const b=document.createElement('button');b.dataset.cropHandle=handle;b.setAttribute('aria-label','Đổi vùng cắt '+handle);selection.append(b);}updateCrop();selection.focus();syncBar();
    let drag;
    root.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();const a=item.angle*Math.PI/180;drag={x:e.clientX,y:e.clientY,region:{...crop.region},handle:e.target.dataset.cropHandle,move:e.target===full?'image':'region',a};root.setPointerCapture(e.pointerId);};
    root.onpointermove=e=>{if(!drag||!crop)return;const a=drag.a+Number($('labelAngle').value||0)*Math.PI/180,dx=((e.clientX-drag.x)*Math.cos(a)+(e.clientY-drag.y)*Math.sin(a))/crop.scaleX*(item.flipX?-1:1),dy=(-(e.clientX-drag.x)*Math.sin(a)+(e.clientY-drag.y)*Math.cos(a))/crop.scaleY*(item.flipY?-1:1),r=drag.region,c={...r};
      if(drag.handle){const west=drag.handle.includes('w'),north=drag.handle.includes('n');c.width=clamp(r.width+(west?-dx:dx),.03,west?r.x+r.width:1-r.x);c.height=clamp(r.height+(north?-dy:dy),.03,north?r.y+r.height:1-r.y);if($('imageCropRatio').checked){const scale=Math.min(c.width/r.width,c.height/r.height);c.width=r.width*scale;c.height=r.height*scale;}if(west)c.x=r.x+r.width-c.width;if(north)c.y=r.y+r.height-c.height;
      }else{const sign=drag.move==='image'?-1:1;c.x=clamp(r.x+dx*sign,0,1-r.width);c.y=clamp(r.y+dy*sign,0,1-r.height);}crop.region=c;updateCrop();};
    root.onpointerup=root.onpointercancel=()=>{drag=null;};selection.onkeydown=e=>{if(!crop||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const r=crop.region,step=e.shiftKey?.02:.005;r.x=clamp(r.x+(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0),0,1-r.width);r.y=clamp(r.y+(e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0),0,1-r.height);updateCrop();};
  }
  function updateCrop(){if(!crop)return;const c=crop,r=c.region;Object.assign(c.full.style,{left:c.originX+'px',top:c.originY+'px',width:c.scaleX+'px',height:c.scaleY+'px'});Object.assign(c.selection.style,{left:(c.originX+r.x*c.scaleX)+'px',top:(c.originY+r.y*c.scaleY)+'px',width:r.width*c.scaleX+'px',height:r.height*c.scaleY+'px'});c.root.style.clipPath=`inset(${c.originY}px ${c.W-c.originX-c.scaleX}px ${c.H-c.originY-c.scaleY}px ${c.originX}px)`;}
  function cancelCrop(restore=false){if(!crop)return;crop.viewport.remove();crop.actions.remove();crop=null;document.body.classList.remove('imageCropActive');syncBar();if(restore)buttons.crop.focus();}
  async function applyCrop(){if(!crop)return;const {item,owner,region}=crop;if(owner!==activeLabelId||!canEdit(item)){cancelCrop();return;}cancelCrop();await mutate(i=>{i.sourceOriginal ||= i.original||i.src;i.imageCrop={...region};const image=graphicImages.get(i.src);const ratio=region.width*image.width/(region.height*image.height);if(Math.abs(ratio-i.width/i.height)>.01)i.height=i.width/ratio;});buttons.crop.focus();}

  function syncBar(){const item=currentImage(),graphic=selectedGraphic(),multiple=graphic?graphicSelection().length>1:contextCanGroup(),single=!!item;
    if(graphic)noneSelected=false;bar.hidden=!single;artSelectionTools.hidden=single||noneSelected;artTextZone.hidden=!!graphic||multiple;
    document.body.classList.toggle('imageToolbarActive',single);document.body.classList.toggle('imageMultiple',multiple);
    if(!graphic&&!multiple){const page=noneSelected||(isDesign()&&designKind.value==='design'&&!editorText().trim());artTextZone.hidden=page;pageTools.hidden=!page;}else pageTools.hidden=true;
    for(const b of Object.values(buttons))b.disabled=!canEdit(item)||busy||!!crop;unlock.hidden=!single||!(item.locked||labelLockControl.checked);unlock.disabled=busy;more.disabled=!single||!!crop;
    if(popover&&(popover.owner!==activeLabelId||popover.id!==item?.id||!canEdit(item)))closePopover();
    if(crop&&(crop.owner!==activeLabelId||crop.item.id!==item?.id||item.locked||labelLockControl.checked))cancelCrop();
    for(const id of ['designEditText','designFinishText'])if(multiple)$(id).hidden=true;selectionPosition.hidden=!multiple;selectionLock.hidden=!multiple;
  }
  const pageTools=document.createElement('div');pageTools.id='imagePageTools';pageTools.append(button('image-page-properties','Khổ thiết kế','file',()=>artOpenPanel('properties')));artRibbon.prepend(pageTools);
  const selectionPosition=button('image-selection-position','Vị trí và căn chỉnh','layers',()=>{closePopover();rebuildContextMenu();const r=selectionPosition.getBoundingClientRect();labelMenu.hidden=false;labelMenu.style.left=clamp(r.left,8,Math.max(8,innerWidth-labelMenu.offsetWidth-8))+'px';labelMenu.style.top=clamp(r.bottom+6,8,Math.max(8,innerHeight-labelMenu.offsetHeight-8))+'px';labelMenu.querySelector('button:not(:disabled)')?.focus();});artSelectionTools.append(selectionPosition);
  const selectionLock=button('image-selection-lock','Khóa vùng chọn','lock',()=>contextToggleLock());artSelectionTools.append(selectionLock);
  const context=artSyncContext;artSyncContext=function(...args){const r=context(...args);syncBar();return r;};
  const sync=syncGraphicControls;syncGraphicControls=function(...args){const r=sync(...args);syncBar();return r;};
  // Remove duplicate image forms from the visible picker, retaining legacy handlers for old documents.
  const legacy=document.createElement('div');legacy.id='imageLegacyControls';legacy.hidden=true;legacy.inert=true;document.body.append(legacy);
  for(const node of [...graphicsDialog.children])if(!node.matches('h3,#iconGrid,.graphicActions')||node.querySelector?.('#graphicRatio'))legacy.append(node);
  for(const id of ['graphicPhotoTools','lockGraphic','graphicList','manualBackground'])if($(id))legacy.append($(id));
  graphicsDialog.querySelectorAll('p,.graphicFields').forEach(node=>legacy.append(node));
  graphicsDialog.querySelectorAll('.graphicActions').forEach(node=>{if(!node.querySelector('#importGraphic'))legacy.append(node);});
  graphicsDialog.querySelector('h3').firstChild.textContent='Thành phần ';
  $('graphicWhite').onchange=()=>{const enabled=$('graphicWhite').checked;return mutate(async item=>{item.sourceOriginal ||= item.original||item.src;item.removeWhite=enabled;await applyGraphicBackground(item);});};
  for(const id of ['graphicBackground','graphicTolerance'])$(id).onchange=()=>{const color=$('graphicBackground').value,tolerance=clamp(Number($('graphicTolerance').value)||0,0,150);return mutate(async item=>{item.sourceOriginal ||= item.original||item.src;item.backgroundColor=color;item.tolerance=tolerance;await applyGraphicBackground(item);});};
  let sampling=false;
  $('pickGraphicBackground').textContent='Lấy màu nền trên canvas';
  $('pickGraphicBackground').onclick=()=>{if(!canEdit(currentImage()))return;sampling=true;message('Bấm vào màu nền trong ảnh trên canvas. Escape để hủy.');};
  window.addEventListener('pointerdown',e=>{
    if(!sampling)return;
    if(!e.target.closest?.('.graphicOverlay')){if(!popover?.node.contains(e.target))sampling=false;return;}
    e.preventDefault();e.stopImmediatePropagation();sampling=false;
    const item=currentImage();if(!canEdit(item))return;
    const g=worldGeometry(item),stage=$('previewStage').getBoundingClientRect(),unit=stage.width/previewPage().width,a=-g.angle*Math.PI/180,dx=(e.clientX-stage.left)/unit-g.x-g.width/2,dy=(e.clientY-stage.top)/unit-g.y-g.height/2;
    const x=clamp(.5+(dx*Math.cos(a)-dy*Math.sin(a))/g.width*(item.flipX?-1:1),0,1),y=clamp(.5+(dx*Math.sin(a)+dy*Math.cos(a))/g.height*(item.flipY?-1:1),0,1),region=item.imageCrop||{x:0,y:0,width:1,height:1};
    mutate(async i=>{i.sourceOriginal ||= i.original||i.src;const image=await loadGraphic(i.original||i.src),c=cv(image.width,image.height),ctx=c.getContext('2d');ctx.drawImage(image,0,0);const pixel=ctx.getImageData(clamp(Math.floor((region.x+x*region.width)*image.width),0,image.width-1),clamp(Math.floor((region.y+y*region.height)*image.height),0,image.height-1),1,1).data;i.backgroundColor='#'+[...pixel.slice(0,3)].map(v=>v.toString(16).padStart(2,'0')).join('');i.removeWhite=true;await applyGraphicBackground(i);message('Đã xóa nền theo màu đã chọn.');});
  },true);
  document.addEventListener('pointerdown',e=>{if(popover&&!popover.node.contains(e.target)&&!bar.contains(e.target))closePopover();if(crop&&!crop.root.contains(e.target)&&!crop.actions.contains(e.target)&&e.target.closest('.layerRow,.otherLabel'))cancelCrop();},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(popover||crop||sampling)){e.preventDefault();e.stopImmediatePropagation();sampling=false;if(crop)cancelCrop(true);else closePopover(true);}},true);
  $('previewArea').addEventListener('pointerdown',e=>{if(e.button!==0||!['previewStage','previewBounds','previewArea'].includes(e.target.id))return;noneSelected=true;selectedGraphicId=null;selectedGraphicSet.clear();selectedLabelSet.clear();positionGraphicOverlays();syncGraphicControls();});
  document.addEventListener('pointerdown',e=>{if(e.target.closest?.('.graphicOverlay,.otherLabel,#temEditor,.layerRow,#designAddText,#designAddImage'))noneSelected=false;},true);
  window.addEventListener('resize',()=>{place();if(crop)cancelCrop();});
  const prevStyle=contextCopyStyle;contextCopyStyle=function(){if(currentImage())copyStyle();else prevStyle();};
  const prevPaste=contextApplyStyle;contextApplyStyle=async function(){if(currentImage()&&styleClipboard)return pasteStyle();return prevPaste();};
  // Mutations from keyboard/context menus must respect locks, not just disabled buttons.
  const remove=contextDeleteSelection;contextDeleteSelection=async function(...args){if(contextSelectionLocked())return message('Hãy mở khóa trước khi xóa.');return remove(...args);};
  const change=changeGraphic;changeGraphic=async function(...args){if(contextSelectionLocked())return;return change(...args);};
  const move=moveObjectLayer;moveObjectLayer=async function(delta,...args){if(contextSelectionLocked())return;if(Math.abs(delta)>=1000){const t=layerTarget();return move(delta>0?t.items.length-1-t.index:-t.index,...args);}return move(delta,...args);};
  const restore=$('studioRestoreImage').onclick;$('studioRestoreImage').onclick=async function(...args){const result=await restore(...args);const item=selectedGraphic();if(item&&canEdit(item)&&item.imageCrop)await mutate(i=>delete i.imageCrop);return result;};
  window.TemImageTools={defaults,mutate,worldGeometry,cover,imagePixels,openPanel,startCrop,applyCrop,cancelCrop,restoreOriginal,copyStyle,pasteStyle,get crop(){return crop},get idle(){return queue},sync:syncBar};
  syncGraphicControls();
})();

/* Keep the paper scale and bitmap origin stable for the duration of a gesture.
   Paint transient layers at screen resolution; commit through the usual renderer. */
(() => {
  let live=null,frame=0;
  const area=$('previewArea'),surface=$('labelSurface');
  function viewport(){window.TEMHOA_INTERACTION_VIEWPORT={width:area.clientWidth,height:area.clientHeight};}
  function startGraphic(){
    if(!graphicDrag||!previewSize)return;
    clearTimeout(timer);viewport();
    const L=previewSize.L,sx=parseFloat(surface.style.width)/L.width,sy=parseFloat(surface.style.height)/L.height;
    const root=document.createElement('div');root.className='livePreviewLayers';surface.append(root);
    const originalLayout=layout,originalStack=paintLayerStack;
    let background;
    try{layout=()=>L;paintLayerStack=(ctx,l,s,paint)=>paint();background=render().c;}
    finally{layout=originalLayout;paintLayerStack=originalStack;}
    const add=(c,left,top,width,height)=>{Object.assign(c.style,{left:left+'px',top:top+'px',width:width+'px',height:height+'px'});root.append(c);return c;};
    add(background,0,0,L.width*sx,L.height*sy);
    live={root,L,sx,sy,nodes:[],owner:activeLabelId};
    for(const unit of orderedLayerUnits(L)){
      if(unit.kind==='graphic'){const c=document.createElement('canvas');root.append(c);live.nodes.push({unit,c});}
      else{const c=cv($('canvas').width,$('canvas').height);paintLayerUnit(c.getContext('2d'),L,c.width/L.width,unit);add(c,0,0,L.width*sx,L.height*sy);}
    }
    surface.classList.add('liveGraphicActive');$('canvas').style.visibility='hidden';paint();
  }
  function paint(){
    if(!live)return;
    const {L,sx,sy}=live,dpr=Math.min(2,devicePixelRatio||1);
    window.TEMHOA_LIVE_DRAW=true;
    try{for(const {unit,c} of live.nodes){
      const raw=decorations.find(i=>i.id===unit.item.id);if(!raw)continue;
      const item={...raw,x:raw.x+(L.graphicOffsetX??L.offsetX??0),y:raw.y+(L.graphicOffsetY??L.offsetY??0)},b=graphicBounds(item),pad=2;
      const w=Math.max(1,b.width*sx+pad*2),h=Math.max(1,b.height*sy+pad*2);
      c.width=Math.ceil(w*dpr);c.height=Math.ceil(h*dpr);
      Object.assign(c.style,{left:(b.x*sx-pad)+'px',top:(b.y*sy-pad)+'px',width:w+'px',height:h+'px'});
      const ctx=c.getContext('2d');ctx.scale(dpr,dpr);ctx.translate(pad,pad);ctx.scale(sx,sy);ctx.translate(-b.x,-b.y);drawGraphic(ctx,item);
    }}finally{window.TEMHOA_LIVE_DRAW=false;}
  }
  function draw(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;paint();});}
  function clear(){cancelAnimationFrame(frame);frame=0;live?.root.remove();live=null;surface.classList.remove('liveGraphicActive');$('canvas').style.visibility='';window.TEMHOA_INTERACTION_VIEWPORT=null;}
  const previous=preview;
  preview=async function(...args){
    if(live&&graphicDrag){draw();return;}
    const finishing=!!live;
    try{return await previous(...args);}
    finally{if(finishing){const stage=$('previewStage'),before=stage.getBoundingClientRect();clear();viewport();zoom();const after=stage.getBoundingClientRect();preservePreviewOrigin(area,$('previewBounds'),area.scrollLeft+after.left-before.left,area.scrollTop+after.top-before.top);window.TEMHOA_INTERACTION_VIEWPORT=null;}}
  };
  window.addEventListener('pointerdown',e=>{
    if(e.button!==0||!e.target.closest?.('#previewStage'))return;
    viewport();
  },true);
  function end(){queueMicrotask(()=>{if(!live){window.TEMHOA_INTERACTION_VIEWPORT=null;}});}
  window.addEventListener('pointerup',end,true);window.addEventListener('pointercancel',end,true);
  window.addEventListener('blur',()=>{if(live){graphicDrag=null;preview();}else window.TEMHOA_INTERACTION_VIEWPORT=null;});
  window.addEventListener('resize',()=>{closeCaseMenu();});
  area.addEventListener('scroll',()=>{if(!$('caseMenu').hidden)closeCaseMenu();},{passive:true});
  window.TemLivePreview={startGraphic,draw,get active(){return !!live;}};
})();
