
'use strict';
const $=id=>document.getElementById(id), ids=['text','font','customFont','size','spacing','curveAmount','curveLine','bold','italic','underline','align','fill','body','padding','border','edge','width','page','inputEncoding','labelScaleX','labelScaleY','labelX','labelY','lockRatio'];
const curveOverridesControl=document.createElement('input');curveOverridesControl.type='hidden';curveOverridesControl.id='curveOverrides';curveOverridesControl.value='{}';document.body.append(curveOverridesControl);ids.push('curveOverrides');
const layerStackControl=document.createElement('input');layerStackControl.type='hidden';layerStackControl.id='layerStack';layerStackControl.value='{}';document.body.append(layerStackControl);ids.push('layerStack');
const frameControl=document.createElement('input');frameControl.type='hidden';frameControl.id='wordFrame';frameControl.value='';document.body.append(frameControl);ids.push('wordFrame');

const layerFields=document.createElement('div');layerFields.innerHTML='<label>Chọn lớp <select id="editLayer"><option value="text">Lớp chữ</option><option value="image">Lớp ảnh / emoji</option></select></label><div class="ribbonRow"><label>X chữ (cm)</label><input id="textOffsetX" type="number" step="0.1" value="0"><label>Y chữ (cm)</label><input id="textOffsetY" type="number" step="0.1" value="0"></div>';document.querySelector('.alignTools').closest('.ribbonGroup').append(layerFields);ids.push('editLayer','textOffsetX','textOffsetY');


let uploadedFont='', timer, revision=0, lineStyles=[], previewSize=null, machineFonts=[], fontRecords=new Map(), loadedFonts=new Map(), fontLoads=new Map(), previewRevision=0, hoverFont=null, openFontPicker=null, savedSelection=null, composing=false;
let decorations=[];
let defaultTextStyle={size:64,bold:true,italic:false,underline:false},history=[],historyIndex=-1;

function syncAlign(){document.querySelectorAll('[data-align]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.align===$('align').value)))}
document.querySelectorAll('[data-align]').forEach(button=>button.onclick=()=>{$('align').value=button.dataset.align;preview()});
function adjustSize(delta){$('size').value=Math.max(6,Math.min(800,number('size',6,800)+delta));applyToolbar('size')}
$('sizeUp').onclick=()=>adjustSize(4);$('sizeDown').onclick=()=>adjustSize(-4);
$('zoomOut').onclick=()=>{$('zoom').value=Math.max(30,+$('zoom').value-10);zoom()};$('zoomIn').onclick=()=>{$('zoom').value=Math.min(150,+$('zoom').value+10);zoom()};


$('tabHome').onclick=()=>{closeFontPicker();requestAnimationFrame(zoom)};

function settings(){return {decorations:copyLabelData(decorations),colorStyles:copyLabelData(colorStyles),richHTML:cleanRichHTML($('temEditor').innerHTML),defaultTextStyle:{...defaultTextStyle},...Object.fromEntries(ids.map(id=>[id,$(id).type==='checkbox'?$(id).checked:$(id).value])),lineStyles:lineStyles.map(v=>({choice:v.choice||'',custom:v.custom||''}))}}
let colorStyles={fill:{type:'solid'},body:{type:'clear'},edge:{type:'solid'}},colorTarget='fill';
const printPalette=[['Đỏ R01 (mặc định)','#ff0000'],['Đỏ cam nhẹ','#ff5349'],['Đỏ tươi','#ef3024'],['Cam','#f47721'],['Vàng tươi','#ffcf32'],['Vàng ấm','#f6b832'],['Hồng','#ec4c85'],['Hồng nhạt','#f7b5cd'],['Tím','#9164b5'],['Xanh dương','#267dc3'],['Xanh da trời','#42b9dd'],['Xanh ngọc','#20a99d'],['Xanh lá','#43a65b'],['Kem','#fff2cc'],['Trắng','#ffffff'],['Đen','#000000']];
const gradientPalette=[['Đỏ – cam','#ef3024','#ff9448'],['Cam – vàng','#f47721','#ffdb54'],['Hồng – đào','#ec4c85','#ffb28c'],['Tím – hồng','#9164b5','#ed8cb8'],['Xanh biển','#267dc3','#78d5ed'],['Xanh lá – vàng','#43a65b','#cddd65'],['Vàng ấm','#f6b832','#fff2cc'],['Hồng nhẹ','#f7b5cd','#fff2cc']];
const safeHex=v=>/^#[0-9a-f]{6}$/i.test(v)?v:'#ffffff';
function safePaint(value){if(value?.type==='clear')return {type:'clear'};return value&&['linear','radial'].includes(value.type)&&Array.isArray(value.colors)&&value.colors.length===2?{type:value.type,colors:value.colors.map(safeHex),angle:Number.isFinite(+value.angle)?((+value.angle%360)+360)%360:90}:{type:'solid'}}
function cloudBodyPaint(value){return !['text','design'].includes(value.designKind)&&value.colorStyles?.body?safePaint(value.colorStyles.body):{type:'clear'}}
function gradientPoints(w,h,angle){const rad=angle*Math.PI/180,dx=Math.sin(rad),dy=-Math.cos(rad),extent=(Math.abs(dx)*w+Math.abs(dy)*h)/2;return [w/2-dx*extent,h/2-dy*extent,w/2+dx*extent,h/2+dy*extent]}
function canvasPaint(ctx,id,w,h){const paint=safePaint(colorStyles[id]);if(paint.type==='clear')return 'rgba(0,0,0,0)';if(paint.type==='solid')return safeHex($(id).value);let gradient=paint.type==='radial'?ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.hypot(w,h)/2):ctx.createLinearGradient(...gradientPoints(w,h,paint.angle));paint.colors.forEach((c,i)=>gradient.addColorStop(i,c));return gradient}
function paintCSS(id){const p=safePaint(colorStyles[id]);return p.type==='clear'?'repeating-conic-gradient(#d5d9df 0% 25%,#fff 0% 50%) 0 / 12px 12px':p.type==='solid'?safeHex($(id).value):p.type==='radial'?`radial-gradient(${p.colors.join(',')})`:`linear-gradient(${p.angle}deg,${p.colors.join(',')})`}
function updateColorButtons(){for(const id of ['fill','body','edge']){let b=$('paint-'+id);if(b){b.style.background=paintCSS(id);b.title=({fill:'Màu chữ',body:'Nền tem',edge:'Màu viền'}[id])+' · '+(colorStyles[id]?.type==='clear'?'Clear / Trong suốt':colorStyles[id]?.type==='solid'?$(id).value:'Gradient')}}}
function syncColorDialog(){const p=safePaint(colorStyles[colorTarget]);$('paintTitle').textContent={fill:'Màu chữ',body:'Nền tem',edge:'Màu viền'}[colorTarget];$('paintMode').value=p.type;$('paintGradientControls').hidden=!p.colors;$('paintHex').value=$(colorTarget).value;$('paintCustom').value=$(colorTarget).value;$('paintColor1').value=p.colors?.[0]||$(colorTarget).value;$('paintColor2').value=p.colors?.[1]||'#ffcf32';$('paintAngle').value=p.angle??90;$('paintAngleRow').hidden=p.type==='radial';$('paintSample').style.background=paintCSS(colorTarget);$('solidSwatches').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.clear?p.type==='clear':p.type==='solid'&&b.dataset.color===$(colorTarget).value)));updateColorButtons();syncSpectrum()}
function commitPaint(paint,hex){if(hex)$(colorTarget).value=safeHex(hex);colorStyles[colorTarget]=safePaint(paint);syncColorDialog();recordHistory();clearTimeout(timer);timer=setTimeout(preview,70)}
let spectrum={h:0,s:1,v:1};
function hexHSV(hex){const [r,g,b]=safeHex(hex).slice(1).match(/../g).map(x=>parseInt(x,16)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=d?(max===r?((g-b)/d+6)%6:max===g?(b-r)/d+2:(r-g)/d+4)*60:spectrum.h;return {h,s:max?d/max:0,v:max}}
function hsvHex({h,s,v}){const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c,parts=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return '#'+parts.map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('')}
function syncSpectrum(){const p=safePaint(colorStyles[colorTarget]),index=+$('spectrumStop').value;spectrum=hexHSV(p.colors?p.colors[index]:$(colorTarget).value);$('spectrumStopRow').hidden=!p.colors;$('spectrumHue').value=Math.round(spectrum.h);$('spectrumSV').style.backgroundColor=hsvHex({h:spectrum.h,s:1,v:1});$('spectrumMarker').style.left=spectrum.s*100+'%';$('spectrumMarker').style.top=(1-spectrum.v)*100+'%';$('spectrumSV').setAttribute('aria-valuetext',`Độ bão hòa ${Math.round(spectrum.s*100)}%, độ sáng ${Math.round(spectrum.v*100)}%`)}
function commitSpectrum(){const color=hsvHex(spectrum),p=safePaint(colorStyles[colorTarget]);if(!p.colors)commitPaint({type:'solid'},color);else{p.colors[+$('spectrumStop').value]=color;commitPaint(p,p.colors[0])}}
function initSpectrum(){const square=$('spectrumSV');let pointer=null;
 const choose=event=>{const r=square.getBoundingClientRect();spectrum.s=Math.max(0,Math.min(1,(event.clientX-r.left)/r.width));spectrum.v=Math.max(0,Math.min(1,1-(event.clientY-r.top)/r.height));commitSpectrum()};
 square.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();pointer=event.pointerId;square.setPointerCapture(pointer);square.focus({preventScroll:true});choose(event)};
 square.onpointermove=event=>{if(pointer===event.pointerId)choose(event)};square.onpointerup=square.onpointercancel=square.onlostpointercapture=()=>pointer=null;
 square.onkeydown=event=>{const step=event.shiftKey?.1:.01;if(event.key==='ArrowLeft')spectrum.s-=step;else if(event.key==='ArrowRight')spectrum.s+=step;else if(event.key==='ArrowUp')spectrum.v+=step;else if(event.key==='ArrowDown')spectrum.v-=step;else return;event.preventDefault();spectrum.s=Math.max(0,Math.min(1,spectrum.s));spectrum.v=Math.max(0,Math.min(1,spectrum.v));commitSpectrum()};
 $('spectrumHue').oninput=()=>{spectrum.h=+$('spectrumHue').value;commitSpectrum()};$('spectrumStop').onchange=syncSpectrum;
}

function initColorPickers(){for(const id of ['fill','body','edge']){const input=$(id);input.hidden=true;const button=document.createElement('button');button.type='button';button.id='paint-'+id;button.className='paintButton';button.setAttribute('aria-label','Chọn '+{fill:'màu chữ',body:'màu nền mây',edge:'màu viền'}[id]);button.onclick=()=>{colorTarget=id;captureSelection();syncColorDialog();$('paintDialog').showModal()};input.after(button)}
 const clear=document.createElement('button');clear.type='button';clear.className='swatch';clear.dataset.clear='true';clear.title='Clear / Trong suốt';clear.setAttribute('aria-label',clear.title);clear.style.background='repeating-conic-gradient(#d5d9df 0% 25%,#fff 0% 50%) 0 / 10px 10px';clear.onclick=()=>commitPaint({type:'clear'});$('solidSwatches').append(clear);
 for(const [name,color]of printPalette){const b=document.createElement('button');b.type='button';b.className='swatch';b.style.background=color;b.title=name+' · '+color.toUpperCase();b.setAttribute('aria-label',b.title);b.dataset.color=color;b.onclick=()=>commitPaint({type:'solid'},color);$('solidSwatches').append(b)}
 for(const [name,a,b]of gradientPalette){const button=document.createElement('button');button.type='button';button.className='swatch';button.style.background=`linear-gradient(90deg,${a},${b})`;button.title=name;button.setAttribute('aria-label',name);button.onclick=()=>commitPaint({type:'linear',colors:[a,b],angle:90},a);$('gradientSwatches').append(button)}
 $('paintMode').onchange=()=>commitPaint({type:$('paintMode').value,colors:[$('paintColor1').value,$('paintColor2').value],angle:+$('paintAngle').value});
 for(const id of ['paintColor1','paintColor2','paintAngle'])$(id).oninput=()=>commitPaint({type:$('paintMode').value,colors:[$('paintColor1').value,$('paintColor2').value],angle:+$('paintAngle').value});
 $('paintHex').onchange=()=>{if(/^#[0-9a-f]{6}$/i.test($('paintHex').value)){ $('paintHex').setCustomValidity('');commitPaint({type:'solid'},$('paintHex').value)}else{$('paintHex').setCustomValidity('Nhập mã màu dạng #FF0000');$('paintHex').reportValidity()}};
 $('paintCustom').oninput=()=>commitPaint({type:'solid'},$('paintCustom').value);$('paintClose').onclick=()=>$('paintDialog').close();updateColorButtons();
}

function number(id,min,max){return Math.max(min,Math.min(max,Number($(id).value)||min))}
function cv(w,h){let c=document.createElement('canvas');c.width=w;c.height=h;return c}
function dilate(alpha,w,h,r){
 r=Math.ceil(r);if(r<=0)return alpha.slice();const distance=new Uint32Array(w*h),infinity=1000000000;
 // Exact squared Euclidean distance: row scans, then a parabola envelope per column.
 for(let y=0;y<h;y++){const row=y*w;let last=-100000;for(let x=0;x<w;x++){if(alpha[row+x])last=x;const d=x-last;distance[row+x]=Math.min(infinity,d*d)}last=w+100000;for(let x=w-1;x>=0;x--){if(alpha[row+x])last=x;const d=last-x;distance[row+x]=Math.min(distance[row+x],d*d)}}
 const vertices=new Int32Array(h),cuts=new Float64Array(h+1),out=new Uint8Array(w*h),limit=r*r;
 for(let x=0;x<w;x++){let k=0;vertices[0]=0;cuts[0]=-Infinity;cuts[1]=Infinity;
  for(let q=1;q<h;q++){let v=vertices[k],cut=(distance[q*w+x]+q*q-distance[v*w+x]-v*v)/(2*(q-v));while(cut<=cuts[k]){k--;v=vertices[k];cut=(distance[q*w+x]+q*q-distance[v*w+x]-v*v)/(2*(q-v))}k++;vertices[k]=q;cuts[k]=cut;cuts[k+1]=Infinity}
  k=0;for(let y=0;y<h;y++){while(cuts[k+1]<y)k++;let v=vertices[k],d=y-v;if(d*d+distance[v*w+x]<=limit)out[y*w+x]=255}
 }
 return out;
}
function fillHoles(mask,w,h){const seen=new Uint8Array(w*h),q=new Int32Array(w*h);let n=0,k=0;function add(i){if(!mask[i]&&!seen[i]){seen[i]=1;q[n++]=i}}for(let x=0;x<w;x++){add(x);add((h-1)*w+x)}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1)}while(k<n){let i=q[k++],x=i%w;if(x)add(i-1);if(x<w-1)add(i+1);if(i>=w)add(i-w);if(i<(h-1)*w)add(i+w)}for(let i=0;i<mask.length;i++)if(!seen[i])mask[i]=255;return mask}
function maskCanvas(mask,w,h,color){let c=cv(w,h),ctx=c.getContext('2d'),im=ctx.createImageData(w,h);const id=['fill','body','edge'].includes(color)?color:null;let rgb=(id?$(id).value:color).match(/\w\w/g).map(x=>parseInt(x,16));for(let i=0;i<mask.length;i++){im.data[i*4]=rgb[0];im.data[i*4+1]=rgb[1];im.data[i*4+2]=rgb[2];im.data[i*4+3]=mask[i]}ctx.putImageData(im,0,0);if(id&&colorStyles[id]?.type!=='solid'){ctx.globalCompositeOperation='source-in';ctx.fillStyle=canvasPaint(ctx,id,w,h);ctx.fillRect(0,0,w,h)}return c}

