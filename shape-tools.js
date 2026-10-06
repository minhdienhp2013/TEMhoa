/* Offline vector primitives. Shapes remain editable objects, separate from emoji. */
(()=>{'use strict';
const shapes=new Map(),poly=points=>points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ')+'Z';
const polygon=(n,inner=1)=>poly(Array.from({length:inner===1?n:n*2},(_,i)=>{const count=inner===1?n:n*2,a=-Math.PI/2+i*2*Math.PI/count,r=44*(inner!==1&&i%2?inner:1);return [+(50+Math.cos(a)*r).toFixed(3),+(50+Math.sin(a)*r).toFixed(3)];}));
function define(id,name,group,path,options={}){const key='shape-'+id;shapes.set(key,{key,name,group,path,...options});graphicNames[key]=name;}
const basic='Hình học',arrows='Mũi tên & đường',stars='Sao & huy hiệu',decor='Trang trí & khung';
const rect='M6 6H94V94H6Z',circle='M94 50A44 44 0 1 1 6 50A44 44 0 1 1 94 50Z';
define('square','Hình vuông',basic,rect);
define('rectangle','Chữ nhật',basic,'M6 24H94V76H6Z',{ratio:1.7});
define('rounded','Chữ nhật bo góc',basic,'M20 6H80Q94 6 94 20V80Q94 94 80 94H20Q6 94 6 80V20Q6 6 20 6Z');
define('pill','Viên nhộng',basic,'M28 24H72A26 26 0 0 1 72 76H28A26 26 0 0 1 28 24Z',{ratio:1.7});
define('circle','Hình tròn',basic,circle);
define('ellipse','Bầu dục',basic,'M94 50A44 28 0 1 1 6 50A44 28 0 1 1 94 50Z',{ratio:1.6});
define('triangle','Tam giác',basic,poly([[50,6],[94,94],[6,94]]));
define('triangle-down','Tam giác ngược',basic,poly([[6,6],[94,6],[50,94]]));
define('right-triangle','Tam giác vuông',basic,poly([[6,6],[94,94],[6,94]]));
define('diamond','Hình thoi',basic,poly([[50,6],[94,50],[50,94],[6,50]]));
define('parallelogram','Bình hành',basic,poly([[28,12],[94,12],[72,88],[6,88]]));
define('trapezoid','Hình thang',basic,poly([[28,12],[72,12],[94,88],[6,88]]));
for(const [n,name]of [[5,'Ngũ giác'],[6,'Lục giác'],[7,'Thất giác'],[8,'Bát giác'],[10,'Thập giác']])define('polygon-'+n,name,basic,polygon(n));
define('semicircle','Nửa hình tròn',basic,'M6 72A44 44 0 0 1 94 72Z');
define('quarter','Một phần tư tròn',basic,'M6 6H94A88 88 0 0 1 6 94Z');
define('pie','Miếng bánh',basic,'M50 50L50 6A44 44 0 1 1 6 50Z');
define('ring','Vòng tròn rỗng',basic,circle+'M76 50A26 26 0 1 0 24 50A26 26 0 1 0 76 50Z');
define('plus','Dấu cộng',basic,poly([[36,6],[64,6],[64,36],[94,36],[94,64],[64,64],[64,94],[36,94],[36,64],[6,64],[6,36],[36,36]]));
define('cross','Dấu nhân',basic,poly([[18,6],[50,38],[82,6],[94,18],[62,50],[94,82],[82,94],[50,62],[18,94],[6,82],[38,50],[6,18]]));
define('line','Đường thẳng',arrows,'M6 50H94',{open:true,ratio:3});
define('diagonal','Đường chéo',arrows,'M6 94L94 6',{open:true});
define('curve','Đường cong',arrows,'M6 80Q50 6 94 80',{open:true,ratio:2});
define('wave','Đường sóng',arrows,'M6 50Q28 6 50 50T94 50',{open:true,ratio:3});
define('zigzag','Đường zigzag',arrows,'M6 70L28 30L50 70L72 30L94 70',{open:true,ratio:3});
const right=poly([[6,34],[60,34],[60,6],[94,50],[60,94],[60,66],[6,66]]);
for(const [id,name,rotation]of [['right','Mũi tên phải',0],['down','Mũi tên xuống',90],['left','Mũi tên trái',180],['up','Mũi tên lên',270]])define('arrow-'+id,name,arrows,right,{rotation});
define('arrow-double','Mũi tên hai chiều',arrows,poly([[6,50],[32,16],[32,34],[68,34],[68,16],[94,50],[68,84],[68,66],[32,66],[32,84]]),{ratio:1.8});
define('arrow-double-vertical','Mũi tên dọc hai chiều',arrows,shapes.get('shape-arrow-double').path,{rotation:90});
define('chevron','Chevron',arrows,poly([[6,6],[50,6],[94,50],[50,94],[6,94],[50,50]]));
define('arrow-bent','Mũi tên gấp khúc',arrows,poly([[6,94],[6,28],[64,28],[64,6],[94,42],[64,78],[64,56],[34,56],[34,94]]));
for(const n of [4,5,6,8,10,12])define('star-'+n,'Ngôi sao '+n+' cánh',stars,polygon(n,.44));
define('burst','Tia nắng 24 cánh',stars,polygon(24,.8));
define('seal','Huy hiệu 16 cánh',stars,polygon(16,.88));
define('shield','Khiên',stars,'M8 8H92V46Q92 76 50 94Q8 76 8 46Z');
define('ribbon','Dải ruy băng',stars,poly([[6,28],[22,28],[22,16],[78,16],[78,28],[94,28],[84,50],[94,72],[78,72],[78,84],[22,84],[22,72],[6,72],[16,50]]),{ratio:2});
define('heart','Trái tim',decor,'M50 92C40 80 6 58 6 30C6 6 36 0 50 24C64 0 94 6 94 30C94 58 60 80 50 92Z');
define('moon','Trăng khuyết',decor,'M66 6A44 44 0 1 0 66 94A46 46 0 0 1 66 6Z');
define('drop','Giọt nước',decor,'M50 6C42 24 16 48 16 64A34 30 0 1 0 84 64C84 48 58 24 50 6Z');
define('leaf','Chiếc lá',decor,'M6 94Q6 6 94 6Q94 94 6 94Z');
define('cloud','Đám mây',decor,'M26 84C0 84 0 48 22 44C14 14 56 4 66 30C84 16 102 38 88 54C106 76 86 90 68 84Z',{ratio:1.4});
define('bubble','Bong bóng thoại',decor,'M20 6H80Q94 6 94 20V62Q94 76 80 76H46L22 94V76H20Q6 76 6 62V20Q6 6 20 6Z');
define('oval-bubble','Thoại bầu dục',decor,'M94 42A44 34 0 1 1 20 68L12 94L46 76A44 34 0 0 0 94 42Z');
define('ticket','Vé',decor,'M6 18H94V36A14 14 0 0 0 94 64V82H6V64A14 14 0 0 0 6 36Z',{ratio:1.7});
define('bracket','Ngoặc vuông',decor,'M32 6H12V94H32M68 6H88V94H68',{open:true});
define('frame','Khung chữ nhật',decor,rect+'M18 18V82H82V18Z');
define('flower','Hoa sáu cánh',decor,'M50 36C22 0 4 28 36 50C0 68 22 100 50 64C78 100 100 68 64 50C96 28 78 0 50 36Z');
const paths=new Map([...shapes].map(([key,s])=>[key,new Path2D(s.path)]));
const safeBefore=safeGraphic;safeGraphic=function(value){const item=safeBefore(value);if(item&&shapes.has(item.kind))item.shapeFill=value.shapeFill!==false;return item;};
function svgBody(item,mask=false){const s=shapes.get(item.kind),fill=s.open||item.shapeFill===false?'none':mask?'#ffffff':safeHex(item.color),stroke=mask?'#ffffff':safeHex(item.strokeColor),dash=item.strokeStyle==='dash'?'12 8':item.strokeStyle==='dot'?'2 6':'';return `<g opacity="${item.opacity??1}" transform="rotate(${s.rotation||0} 50 50)"><path d="${s.path}" fill="${fill}" fill-rule="evenodd" stroke="${stroke}" stroke-width="${item.strokeWidth||0}" stroke-dasharray="${dash}" stroke-linejoin="round" stroke-linecap="round"/></g>`;}
const drawBefore=drawGraphic;drawGraphic=function(ctx,item,mask=false){const s=shapes.get(item.kind);if(!s)return drawBefore(ctx,item,mask);ctx.save();ctx.translate(item.x,item.y);ctx.rotate(item.angle*Math.PI/180);ctx.scale(item.flipX?-1:1,item.flipY?-1:1);ctx.translate(-item.width/2,-item.height/2);ctx.scale(item.width/100,item.height/100);ctx.translate(50,50);ctx.rotate((s.rotation||0)*Math.PI/180);ctx.translate(-50,-50);ctx.globalAlpha*=item.opacity??1;const path=paths.get(item.kind);if(!s.open&&item.shapeFill!==false){ctx.fillStyle=mask?'#ffffff':safeHex(item.color);ctx.fill(path,'evenodd');}if(item.strokeWidth){ctx.lineWidth=item.strokeWidth;ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle=mask?'#ffffff':safeHex(item.strokeColor);ctx.setLineDash(item.strokeStyle==='dash'?[12,8]:item.strokeStyle==='dot'?[2,6]:[]);ctx.stroke(path);}ctx.restore();};
const svgBefore=graphicSVGBody;graphicSVGBody=function(item,mask=false){return shapes.has(item.kind)?svgBody(item,mask):svgBefore(item,mask);};
artPaths.emoji='M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M8 9h.01M16 9h.01M7 14q5 6 10 0';
const emojiButton=$('insertGraphics');emojiButton.setAttribute('aria-label','Emoji');emojiButton.title='Emoji';artDecorate(emojiButton,'emoji','Emoji');graphicsDialog.querySelector('h3').firstChild.textContent='Emoji ';graphicsDialog.insertBefore(emojiFilters,$('iconGrid'));
const picker=document.createElement('dialog');picker.id='shapePicker';picker.setAttribute('aria-labelledby','shapePickerTitle');picker.innerHTML='<div class="shapePickerHeading"><h2 id="shapePickerTitle">Thành phần · Hình dạng</h2><button id="closeShapePicker" type="button" aria-label="Đóng hình dạng">'+artIcon('close')+'</button></div><div class="shapeSearchRow"><input id="shapeSearch" type="search" placeholder="Tìm hình: vuông, tròn, sao…" aria-label="Tìm hình dạng"><select id="shapeCategory" aria-label="Nhóm hình dạng"></select></div><div id="shapeGrid"></div><p id="shapePickerStatus" role="status"></p>';document.body.append(picker);
for(const group of ['Tất cả',basic,arrows,stars,decor])$('shapeCategory').add(new Option(group,group));
function filter(){const q=TemStudioCore.normalize($('shapeSearch').value);for(const b of $('shapeGrid').children){const s=shapes.get(b.dataset.shape);b.hidden=($('shapeCategory').value!=='Tất cả'&&s.group!==$('shapeCategory').value)||!TemStudioCore.normalize(s.name+' '+s.group).includes(q);}}
$('shapeSearch').oninput=filter;$('shapeCategory').onchange=filter;
$('closeShapePicker').onclick=()=>picker.close();picker.addEventListener('close',()=>shapeButton.focus({preventScroll:true}));picker.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();picker.close();}});
let inserting=false;async function insert(key){const s=shapes.get(key);if(!s||inserting)return;inserting=true;$('shapePickerStatus').textContent='';try{if(labelLockControl.checked)throw Error('Mở khóa tem trước khi thêm hình.');if(decorations.length>=12)throw Error('Một tem tối đa 12 hình.');recordHistory();const L=textOnlyLayout(),item=safeGraphic({id:'graphic-'+(++graphicSequence),kind:key,x:L.width/2,y:L.height/2,width:110*(s.ratio||1),height:110,color:'#B92C3B',shapeFill:!s.open,strokeColor:'#25262B',strokeWidth:s.open?4:0,keepRatio:false});decorations.push(item);selectGraphicItems(item);await preview();recordHistory();syncGraphicControls();picker.close();}catch(e){$('shapePickerStatus').textContent=e.message;}finally{inserting=false;}}
for(const s of shapes.values()){const b=document.createElement('button');b.type='button';b.dataset.shape=s.key;b.title=s.name;b.setAttribute('aria-label',s.name);const example={kind:s.key,color:'#25262B',strokeColor:'#25262B',strokeWidth:s.open?4:0,shapeFill:!s.open};b.innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true">'+svgBody(example)+'</svg><span>'+s.name+'</span>';b.onclick=()=>insert(s.key);$('shapeGrid').append(b);}
const shapeButton=artButton('insertShapes','Thành phần','shapes',()=>{closeTopProperties();graphicsDialog.close();$('shapeSearch').value='';$('shapeCategory').value='Tất cả';filter();picker.showModal();$('shapeSearch').focus();});artDecorate(shapeButton,'shapes','Thành phần');emojiButton.after(shapeButton);
const toolbar=document.createElement('div');toolbar.id='shapeToolbar';toolbar.className='artContextZone';toolbar.hidden=true;toolbar.setAttribute('role','group');toolbar.setAttribute('aria-label','Chỉnh hình dạng');toolbar.innerHTML='<label>Màu tô <input id="shapeFillColor" type="color" aria-label="Màu tô hình dạng"></label><label><input id="shapeFillEnabled" type="checkbox">Tô nền</label><label>Màu viền <input id="shapeStrokeColor" type="color" aria-label="Màu viền hình dạng"></label><label>Viền <input id="shapeStrokeWidth" type="number" min="0" max="20" step="1" aria-label="Độ dày viền hình dạng"></label><select id="shapeStrokeStyle" aria-label="Kiểu viền hình dạng"><option value="solid">Nét liền</option><option value="dash">Nét đứt</option><option value="dot">Nét chấm</option></select><label>Độ mờ <input id="shapeOpacity" type="number" min="0" max="100" aria-label="Độ mờ hình dạng"></label>';artRibbon.insertBefore(toolbar,artSelectionTools);
let queue=Promise.resolve();function change(patch){const item=selectedGraphic(),owner=activeLabelId;if(!item||!shapes.has(item.kind)||item.locked||labelLockControl.checked||graphicSelection().length!==1)return;queue=queue.then(async()=>{const target=selectedGraphic();if(owner!==activeLabelId||target?.id!==item.id||target.locked||labelLockControl.checked)return;if(Object.entries(patch).every(([key,value])=>target[key]===value))return;recordHistory();Object.assign(target,patch);await preview();recordHistory();syncGraphicControls();}).catch(e=>$('status').textContent=e.message);}
$('shapeFillColor').oninput=$('shapeFillColor').onchange=()=>change({color:$('shapeFillColor').value,shapeFill:true});$('shapeFillEnabled').onchange=()=>change({shapeFill:$('shapeFillEnabled').checked});$('shapeStrokeColor').oninput=$('shapeStrokeColor').onchange=()=>change({strokeColor:$('shapeStrokeColor').value,strokeWidth:selectedGraphic()?.strokeWidth||2});$('shapeStrokeWidth').onchange=()=>change({strokeWidth:Math.min(20,Math.max(0,Number($('shapeStrokeWidth').value)||0))});$('shapeStrokeStyle').onchange=()=>change({strokeStyle:$('shapeStrokeStyle').value});$('shapeOpacity').onchange=()=>change({opacity:Math.min(100,Math.max(0,Number($('shapeOpacity').value)||0))/100});
function sync(){const item=selectedGraphic(),s=shapes.get(item?.kind),single=!!s&&graphicSelection().length===1&&!labelGroupKey(currentLabel());toolbar.hidden=!single;if(!single)return;if(document.activeElement!==$('shapeFillColor'))$('shapeFillColor').value=item.color;$('shapeFillEnabled').checked=item.shapeFill!==false;if(document.activeElement!==$('shapeStrokeColor'))$('shapeStrokeColor').value=item.strokeColor;$('shapeStrokeWidth').value=item.strokeWidth;$('shapeStrokeStyle').value=item.strokeStyle;$('shapeOpacity').value=Math.round((item.opacity??1)*100);for(const input of toolbar.querySelectorAll('input,select'))input.disabled=item.locked||labelLockControl.checked;if(s.open){$('shapeFillColor').disabled=true;$('shapeFillEnabled').disabled=true;}}
const syncBefore=syncGraphicControls;syncGraphicControls=function(...args){const r=syncBefore(...args);sync();return r;};const contextBefore=artSyncContext;artSyncContext=function(...args){const r=contextBefore(...args);sync();return r;};
const style=document.createElement('style');style.textContent='#shapePicker{width:min(640px,calc(100vw - 24px));max-height:calc(100dvh - 24px);padding:16px;border:1px solid var(--ui-line);border-radius:6px;overflow:auto}#shapePicker::backdrop{background:#25262b55}.shapePickerHeading,.shapeSearchRow{display:flex;gap:8px;align-items:center;margin-bottom:12px}.shapePickerHeading h2{font-size:17px;margin:0;flex:1}.shapePickerHeading button{width:44px;height:44px;padding:10px}.shapeSearchRow input{min-width:0;flex:1}.shapeSearchRow select{max-width:45%}#shapeGrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}#shapeGrid button{padding:8px 4px;min-width:0;min-height:94px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font-size:12px}#shapeGrid svg{width:44px;height:44px;overflow:visible}#shapeGrid button[hidden]{display:none}#compactInsertTools #studioResources{grid-column:1/-1}#shapeToolbar label{display:flex;align-items:center;gap:5px;margin:0;font-size:12px}#shapeToolbar input[type=color]{width:30px;height:30px;padding:2px}#shapeToolbar input[type=number]{width:60px}#shapeToolbar input[type=checkbox]{width:16px}@media(max-width:540px){#shapeGrid{grid-template-columns:repeat(3,minmax(0,1fr))}}';document.head.append(style);
window.TemShapes={catalog:[...shapes.values()],insert,get idle(){return queue;}};sync();
})();
