'use strict';
/* Homepage shares the editor's existing templates and renderer. */
const homeStyle=document.createElement('style');
homeStyle.textContent=`
#temHome{display:block;max-width:none;width:100%;height:100%;padding:0;margin:0;position:fixed;inset:0;z-index:100;background:#fff;color:#18202e;overflow:auto;font-family:Arial,sans-serif}
#temHome[hidden]{display:none}.homeNav{display:flex;align-items:center;justify-content:space-between;padding:18px 32px;border-bottom:1px solid #eee;gap:15px}.homeBrand{font-size:23px;font-weight:800;color:#d32431}.homeBrand span{color:#ca970e}.homeNav button,.homeContinue{border:1px solid #dedee8;background:white;border-radius:10px;padding:10px 16px;font-size:14px}
.homeHero{text-align:center;padding:48px 24px 28px;background:radial-gradient(ellipse at top left,#c9f3ed,transparent 60%),radial-gradient(ellipse at top right,#e9d9ff,transparent 65%),linear-gradient(#f7f4ff,#fff)}.homeHero h1{font-size:clamp(27px,3vw,40px);font-weight:500;color:#6550de;margin:0 0 15px}.homeHero p{color:#60677a;font-size:15px}.homeSearch{max-width:670px;margin:26px auto 24px;display:flex;align-items:center;border:1px solid #a77bf5;background:white;border-radius:17px;padding:0 18px;box-shadow:0 5px 20px #8468df12}.homeSearch span{font-size:25px;color:#756691}.homeSearch input{flex:1;min-width:0;padding:17px 12px;border:0;background:transparent;font-size:15px;outline:none}
.homeTypes{display:flex;flex-wrap:wrap;justify-content:center;gap:18px}.homeTypes button{border:0;border-radius:12px;padding:10px 18px;background:transparent;font-size:13px;color:#435069}.homeTypes button[aria-pressed=true]{background:#f0e8ff;color:#6b35c4}.homeTypeIcon{display:block;margin:0 auto 9px;width:45px;height:45px;line-height:45px;border-radius:50%;background:#f2eaff;color:#8751dd;font-size:25px}.homeTypes button:nth-child(2) .homeTypeIcon{background:#e3f7f0;color:#168f64}.homeTypes button:nth-child(3) .homeTypeIcon{background:#fff1e0;color:#da8318}
.homeContent{max-width:1550px;margin:auto;padding:20px 32px 45px}.homeSectionTitle{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:18px}.homeSectionTitle h2{font-size:22px;margin:0}.homeSectionTitle span{font-size:13px;color:#687182}.homeGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:23px 20px}.homeCard{position:relative;min-width:0;padding:0;border:0;background:white;text-align:left;border-radius:13px;color:#18202e;cursor:pointer}.homeCard[hidden]{display:none}.homeCardOpen{display:block;width:100%;padding:0;border:0;background:transparent;text-align:left}.homeDelete{position:absolute;right:6px;top:6px;width:25px;height:25px;padding:0;border-radius:50%;background:#fff;color:#a31c2c;border:1px solid #ddd;font-size:20px;line-height:22px;z-index:2}.homeDelete:hover{background:#ffe1e1}.homeCard:hover .homeThumb{box-shadow:0 0 0 2px #a37add;transform:translateY(-2px)}.homeCard:focus-visible{outline:3px solid #a37add;outline-offset:5px}.homeThumb{height:160px;background:#f3f4f6;border-radius:13px;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:12px;transition:transform .15s}.homeThumb img,.homeThumb svg{width:100%;height:100%;object-fit:contain;display:block}.homeCard strong{display:block;font-size:14px;padding-top:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.homeCard small{display:block;color:#79808f;font-size:12px;margin-top:6px}.homeEmpty{padding:35px;text-align:center;color:#677080}.homeStatus{font-size:13px;color:#6c7484;min-height:20px;margin-top:20px}.wordTitle > div:first-child{display:flex;align-items:center;gap:12px}.homeBackButton{flex-shrink:0;border-radius:7px;padding:7px 12px;background:#ffffff1f;color:#fff;border:1px solid #ffffff66;font-size:13px}.homeBackButton:hover{background:#ffffff35}.homeBackButton:focus-visible{outline:2px solid #fff;outline-offset:2px}
@media(max-width:700px){.homeNav{padding:14px 16px}.homeContent{padding:15px}.homeHero{padding:30px 15px 20px}.homeTypes{gap:3px}.homeTypes button{padding:10px}.homeGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 12px}.homeThumb{height:125px}.homeBrand{font-size:18px}}
`;
document.head.append(homeStyle);
const home=document.createElement('main');home.id='temHome';home.setAttribute('aria-label','Trang chủ TEMhoa');
home.innerHTML=`<nav class="homeNav"><div class="homeBrand">MINH ĐIẾN <span>· TEMhoa</span></div><button id="homeContinue">Tạo tem / Tiếp tục chỉnh sửa →</button></nav><section class="homeHero"><h1>Hôm nay bạn muốn tạo tem gì?</h1><label class="homeSearch"><span aria-hidden="true">⌕</span><input id="homeSearch" type="search" aria-label="Tìm mẫu tem" placeholder="Tìm mẫu sinh nhật, khai trương, chúc mừng…"></label><div class="homeTypes" aria-label="Loại tem"><button data-home-type="all" aria-pressed="true"><span class="homeTypeIcon">▦</span>Tất cả mẫu</button><button data-home-type="cloud" aria-pressed="false"><span class="homeTypeIcon">☁</span>Tem mây</button><button data-home-type="normal" aria-pressed="false"><span class="homeTypeIcon">▤</span>Tem thường</button><button id="homeAddTheme" type="button"><span class="homeTypeIcon">＋</span>Thêm chủ đề</button></div></section><section class="homeContent"><div class="homeSectionTitle"><h2 id="homeHeading">Các mẫu dành cho bạn</h2><span id="homeCount"></span></div><div id="homeGrid" class="homeGrid"></div><p id="homeEmpty" class="homeEmpty" hidden>Chưa có mẫu phù hợp. Bấm Thêm mẫu để tự thiết kế.</p><p id="homeStatus" class="homeStatus" role="status"></p></section>`;
document.body.append(home);
const homeBack=document.createElement('button');homeBack.id='homeBack';homeBack.className='homeBackButton';homeBack.textContent='← Quay lại';homeBack.title='Về Trang chủ chọn mẫu';document.querySelector('.wordTitle > div').prepend(homeBack);
const homeBaseSettings=copyLabelData(oneLabelSettings());
let homeType='all',homeBusy=false,homeLoadRevision=0,homeLoadTask=Promise.resolve(),homeEntries=[];
const homeNormalize=value=>String(value).toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
function filterHome(){const query=homeNormalize($('homeSearch').value.trim());let count=0;for(const entry of homeEntries){const visible=(homeType==='all'||(homeType.startsWith('theme:')?homeTemplateTheme(entry.fileName)===homeType.slice(6):entry.type===homeType))&&homeNormalize(entry.name+' '+(entry.keywords||'')).includes(query);entry.card.hidden=!visible;if(visible)count++}for(const button of home.querySelectorAll('[data-home-type]'))button.setAttribute('aria-pressed',String(button.dataset.homeType===homeType));$('homeHeading').textContent={all:'Các mẫu dành cho bạn',cloud:'Mẫu tem mây',normal:'Mẫu tem thường',}[homeType]||homeType.slice(6);$('homeCount').textContent=count+' mẫu';$('homeEmpty').hidden=count>0}
function addHomeCard(entry,preview){const card=document.createElement('div');card.className='homeCard';card.dataset.homeKey=entry.key;const button=document.createElement('button');button.type='button';button.className='homeCardOpen';const thumb=document.createElement('div');thumb.className='homeThumb';if(preview)thumb.innerHTML=preview;else thumb.textContent='Đang tải hình mẫu…';const name=document.createElement('strong');name.textContent=entry.name;const caption=document.createElement('small');caption.textContent=(entry.type==='cloud'?'Tem mây':'Tem thường')+' · Mẫu đã lưu';button.append(thumb,name,caption);button.onclick=()=>openHomeEntry(entry);card.append(button);const remove=document.createElement('button');remove.type='button';remove.className='homeDelete';remove.textContent='×';remove.title='Xóa mẫu '+entry.name;remove.setAttribute('aria-label',remove.title);remove.onclick=event=>{event.preventDefault();event.stopPropagation();requestHomeDelete(entry)};card.append(remove);entry.card=card;entry.thumb=thumb;homeEntries.push(entry);$('homeGrid').append(card);return entry}
const homeDeleteDialog=document.createElement('dialog');homeDeleteDialog.id='homeDeleteDialog';homeDeleteDialog.style.cssText='width:min(420px,90vw);border:1px solid #d6d1df;border-radius:12px;padding:22px';homeDeleteDialog.innerHTML='<h3 style="margin-top:0">Xóa mẫu?</h3><p id="homeDeleteName"></p><p id="homeDeleteError" role="alert" style="color:#a31c2c"></p><div style="display:flex;justify-content:flex-end;gap:10px"><button id="homeDeleteCancel" type="button">Hủy</button><button id="homeDeleteConfirm" class="primary" type="button">Xóa mẫu</button></div>';document.body.append(homeDeleteDialog);
let homeDeleteEntry=null,homeDeleteBusy=false;
function requestHomeDelete(entry){if(homeBusy){$('homeStatus').textContent='Đang mở mẫu, vui lòng thử lại sau.';return}homeDeleteEntry=entry;$('homeDeleteName').textContent='Xóa “'+entry.name+'” khỏi kho mẫu trên máy?';$('homeDeleteError').textContent='';homeDeleteDialog.showModal()}
$('homeDeleteCancel').onclick=()=>{if(!homeDeleteBusy)homeDeleteDialog.close()};
homeDeleteDialog.addEventListener('cancel',event=>{if(homeDeleteBusy)event.preventDefault()});
$('homeDeleteConfirm').onclick=()=>{if(homeDeleteEntry&&!homeDeleteBusy)deleteHomeEntry(homeDeleteEntry)};
async function deleteHomeEntry(entry){if(homeBusy||homeDeleteBusy)return;homeBusy=true;homeDeleteBusy=true;homeLoadRevision++;$('homeDeleteConfirm').disabled=true;$('homeDeleteCancel').disabled=true;const remove=entry.card.querySelector('.homeDelete');remove.disabled=true;$('homeDeleteError').textContent='Đang xóa mẫu…';const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);try{
 if(!window.TEMHOA_TOKEN)throw Error('Hãy mở bằng Mo-TemHoa-Mac.command để xóa mẫu trên máy.');
 const response=await fetch('/api/templates?name='+encodeURIComponent(entry.fileName),{method:'DELETE',headers:{'X-TemHoa-Token':window.TEMHOA_TOKEN},signal:controller.signal});
 if(response.status===501||response.status===405)throw Error('Dịch vụ đang chạy là bản cũ. Nhấn Control+C trong Terminal rồi chạy lại bash Mo-TemHoa-Mac.command.');
 const raw=await response.text();let data;try{data=JSON.parse(raw)}catch{throw Error('Dịch vụ không trả kết quả hợp lệ. Đóng phiên Terminal cũ rồi mở lại phần mềm.')}
 if(!response.ok)throw Error(data.error||'Không xóa được mẫu.');
 entry.card.remove();homeEntries=homeEntries.filter(item=>item!==entry);autoContexts.delete(entry.fileName);if(autoContext?.name===entry.fileName)autoContext=null;if(currentTemplateName===entry.fileName)currentTemplateName='';filterHome();homeDeleteDialog.close();$('homeStatus').textContent='Đã xóa mẫu '+entry.name+'.';
 }catch(error){const message=error.name==='AbortError'?'Xóa mẫu quá thời gian chờ. Hãy kiểm tra Terminal rồi thử lại.':error.message;$('homeDeleteError').textContent=message;$('homeStatus').textContent=message;}finally{clearTimeout(timeout);homeBusy=false;homeDeleteBusy=false;remove.disabled=false;$('homeDeleteConfirm').disabled=false;$('homeDeleteCancel').disabled=false;}}

function enterHomeEditor(){home.hidden=true;homeLoadRevision++;$('temEditor').focus({preventScroll:true})}
async function openHomeEntry(entry){if(homeBusy)return;homeBusy=true;home.setAttribute('aria-busy','true');$('homeStatus').textContent='Đang mở mẫu…';homeLoadRevision++;try{await homeLoadTask;const template=entry.template||await templateAPI('?name='+encodeURIComponent(entry.fileName));await applyTemplate(template);currentTemplateName=entry.fileName;enterHomeEditor();$('status').textContent='Đã mở '+entry.name+'. Bấm vào chữ để thay nội dung.'}catch(error){$('homeStatus').textContent=error.message}finally{homeBusy=false;home.removeAttribute('aria-busy')}}
async function loadHomeSaved(){const revision=++homeLoadRevision;try{const list=await templateAPI();if(revision!==homeLoadRevision||home.hidden)return;for(const entry of [...homeEntries])if(entry.saved&&!list.names.includes(entry.fileName)){entry.card.remove();homeEntries=homeEntries.filter(item=>item!==entry)}for(const name of list.names){if(homeEntries.some(entry=>entry.fileName===name))continue;addHomeCard({key:'saved:'+name,name:name.replace(/^Word-\d+\s*/,''),fileName:name,saved:true,type:name.startsWith('Word-')||name.startsWith('Tem thường ')?'normal':'cloud'})}filterHome();for(const entry of homeEntries.filter(entry=>entry.saved)){if(revision!==homeLoadRevision||home.hidden)break;try{const template=await templateAPI('?name='+encodeURIComponent(entry.fileName));if(revision!==homeLoadRevision||home.hidden)break;entry.template=template;readTemplateTheme(entry.fileName,template);entry.type=(template.settings.wordFrame||['design','text'].includes(template.settings.designKind)||(template.settings.labels||[]).some(label=>label.wordFrame||['design','text'].includes(label.designKind)))?'normal':'cloud';const src=typeof template.thumbnail==='string'&&/^data:image\/png;base64,[a-zA-Z0-9+/=]+$/.test(template.thumbnail)?template.thumbnail:await templateThumbnail(template);if(revision!==homeLoadRevision||home.hidden)break;const image=document.createElement('img');image.alt='Mẫu '+entry.name;image.src=src;entry.thumb.replaceChildren(image);entry.card.querySelector('small').textContent=(entry.type==='normal'?'Tem thường':'Tem mây')+' · Mẫu đã lưu';filterHome()}catch(error){entry.template=null;entry.thumb.textContent='Bấm để mở mẫu';}}if(revision===homeLoadRevision&&!home.hidden)$('homeStatus').textContent='Chọn hình mẫu để bắt đầu chỉnh sửa.'}catch(error){if(revision===homeLoadRevision&&!home.hidden)$('homeStatus').textContent=window.TEMHOA_TOKEN?error.message:'Mở ứng dụng TEMhoa để xem thêm các mẫu thường và mẫu đã lưu trên máy.'}}
async function showTemHome(){if(homeBusy)return;home.hidden=false;closeFontPicker();$('homeSearch').focus({preventScroll:true});homeLoadRevision++;await homeLoadTask;homeLoadTask=loadHomeSaved()}
filterHome();$('homeSearch').oninput=filterHome;home.querySelectorAll('[data-home-type]').forEach(button=>button.onclick=()=>{homeType=button.dataset.homeType;filterHome()});
$('homeContinue').onclick=async()=>{if(homeBusy)return;homeBusy=true;homeLoadRevision++;try{await homeLoadTask;enterHomeEditor()}finally{homeBusy=false}};homeBack.onclick=showTemHome;
// Wait for automatic fonts before rendering thumbnails so editor state stays stable.
window.addEventListener('load',async()=>{homeLoadTask=loadHomeSaved()},{once:true});


/* Graphic-design mode: each text box is an editable independent document object. */
const designKind=document.createElement('input');designKind.type='hidden';designKind.id='designKind';designKind.value='';document.body.append(designKind);ids.push('designKind');
const beforeDesignSettings=setLabelSettings;setLabelSettings=function(value,ui=false){designKind.value=value.designKind|| (value.wordFrame?'design':'cloud');beforeDesignSettings(value,ui)};
const isDesign=()=>designKind.value==='design'||designKind.value==='text'||!!$('wordFrame').value;
let designEditing=false,designDrag=null;
const designStyle=document.createElement('style');designStyle.textContent='.designMode #temEditor{opacity:0;pointer-events:none!important}.designMode.designEditing #temEditor{opacity:1;pointer-events:auto!important}.designMode:not(.designEditing) #labelSurface{cursor:move}.designMode #labelSurface .graphicOverlay{pointer-events:auto!important}.designMode #labelSurface .graphicOverlay button{pointer-events:auto}.designTools{display:flex;gap:7px;align-items:center;padding:8px 18px;background:#fff;border-bottom:1px solid #d3d9e2}.designTools button{padding:7px 12px;font-size:13px}.designTools p{font-size:12px;margin:0;color:#596c80}.designMode #selectionFrame{outline:1px solid #8855ff}.designMode #textMoveHandle{display:none}';document.head.append(designStyle);
const designTools=document.createElement('div');designTools.className='designTools';designTools.innerHTML='<button id="designAddText" type="button"><b>T</b> · Văn bản</button><button id="designAddImage" type="button">＋ Tải ảnh lên</button><button id="designEditText" type="button">Sửa chữ</button><button id="designFinishText" type="button">Xong</button><button id="designDuplicate" type="button">Nhân đôi</button><button id="designDelete" type="button">Xóa khối</button><p id="designHint"></p>';document.querySelector('.wordTabs').after(designTools);
const designZoom=zoom;zoom=function(){designZoom();const free=isDesign();document.body.classList.toggle('designMode',free);document.body.classList.toggle('designEditing',free&&designEditing);$('designEditText').hidden=!free||designKind.value!=='text';$('designFinishText').hidden=!free||!designEditing;$('designDuplicate').hidden=!free;$('designDelete').hidden=!free||designKind.value!=='text';$('designHint').textContent=free?'Bấm chọn · kéo để di chuyển · kéo góc để đổi cỡ · bấm đúp để sửa chữ':'Tem mây: nhập chữ trực tiếp như trước.';if(free){textMoveHandle.hidden=true;$('temEditor').style.pointerEvents=designEditing?'auto':'none';if(!designEditing&&document.activeElement===$('temEditor'))$('labelSurface').focus({preventScroll:true})}};
const designActivate=activateLabel;activateLabel=async function(...args){designEditing=false;await designActivate(...args);zoom()};
async function newDesignText(richHTML='<div>Nhập văn bản</div>',source=null,position=null){
 if(labels.length>=20)throw Error('Một trang hiện hỗ trợ tối đa 20 khối; hãy xóa khối không dùng trước.');
 await preview();saveActiveLabel(true);recordHistory();designEditing=false;
 const base=copyLabelData(source||oneLabelSettings()),page=previewPage();
 const data={...base,designKind:'text',wordFrame:'',text:'Nhập văn bản',richHTML,decorations:[],layerStack:'{}',labelGroup:'',padding:0,border:0,body:'#ffffff',edge:'#ffffff',curveAmount:0,curveOverrides:'{}',curveLine:0,textOffsetX:0,textOffsetY:0,labelScaleX:1,labelScaleY:1,width:position?.width||Math.min(12,page.width-2),labelX:position?.x??2,labelY:position?.y??2,editLayer:'text',colorStyles:{...base.colorStyles,body:{type:'clear'},edge:{type:'clear'}}};
 const root=document.createElement('div');root.innerHTML=richHTML;data.text=root.textContent||'';
 const item={id:'tem-'+(++labelSequence),settings:data};labels.push(item);activeLabelId=item.id;selectedLabelSet=new Set([item.id]);setLabelSettings(data,true);await preview();recordHistory();$('status').textContent='Khối chữ mới: kéo đến bất kỳ vị trí nào; bấm đúp để sửa.';return item;
}
function editDesignText(){if(designKind.value!=='text')return;designEditing=true;zoom();$('temEditor').focus({preventScroll:true});const range=document.createRange();range.selectNodeContents($('temEditor'));const selection=getSelection();selection.removeAllRanges();selection.addRange(range);captureSelection()}
$('designAddText').onclick=async()=>{try{if(!isDesign()){recordHistory();$('temEditor').insertAdjacentHTML('beforeend','<div>Nhập văn bản</div>');await preview();recordHistory();$('temEditor').focus();return}await newDesignText();editDesignText()}catch(error){$('status').textContent=error.message}};
$('designEditText').onclick=editDesignText;
$('designFinishText').onclick=async()=>{designEditing=false;savedSelection=null;await preview();recordHistory();zoom()};
$('designDuplicate').onclick=()=>duplicateLabel().catch(error=>$('status').textContent=error.message);
$('designDelete').onclick=()=>deleteLabel().catch(error=>$('status').textContent=error.message);
async function convertNormalText(){
 if(!isDesign()||designKind.value==='text')return;
 await preview();saveActiveLabel(true);
 const original=copyLabelData(oneLabelSettings()),html=original.richHTML||plainHTML(original.text||''),plain=(new DOMParser().parseFromString('<body>'+html+'</body>','text/html').body.textContent||'').trim();
 if(!plain)return;
 const L=previewSize.L,g=labelGeometry(currentLabel()),unit=g.width/L.width,runs=L.runs||[];
 const left=runs.length?Math.min(...runs.map(r=>r.x)):0,top=runs.length?Math.min(...runs.map(r=>r.y-r.size*(r.scaleY||1))):0,right=runs.length?Math.max(...runs.map(r=>r.x+r.width)):Math.max(300,L.width*.6);
 const scale=L.textScale||1,source={...original,size:Number(original.size)*scale,defaultTextStyle:{...original.defaultTextStyle,size:Number(original.defaultTextStyle?.size||original.size)*scale},lineStyles:copyLabelData(original.lineStyles||[])};
 recordHistory();
 $('temEditor').innerHTML='<div><br></div>';$('text').value='';designKind.value='design';await preview();saveActiveLabel(true);
 await newDesignText(html,source,{x:g.x+left*unit,y:g.y+top*unit,width:Math.max(3,Math.min(previewPage().width-2,(right-left)*unit+1))});
 const fresh=previewSize.L,newUnit=Number($('width').value)/fresh.width;
 if(fresh.runs.length){$('labelX').value=String(g.x+left*unit-Math.min(...fresh.runs.map(r=>r.x))*newUnit);$('labelY').value=String(g.y+top*unit-Math.min(...fresh.runs.map(r=>r.y-r.size*(r.scaleY||1)))*newUnit);await preview();saveActiveLabel(true)}
 designEditing=false;await preview();recordHistory();
 $('status').textContent='Khối chữ nhiều dòng được giữ trong một layer.';
}
const designApplyTemplate=applyTemplate;applyTemplate=async function(template){designEditing=false;await designApplyTemplate(template);if(isDesign()&&designKind.value!=='text')await convertNormalText();zoom()};
$('previewArea').addEventListener('pointerdown',async event=>{
 if(event.button!==0||homeBusy||event.target.closest('.graphicOverlay,#wholeGroupFrame,.resizeHandle,.layerMoveHandle')||designDrag)return;
 const node=event.target.closest('.otherLabel,#labelSurface');if(!node)return;
 const id=node.dataset.labelId||activeLabelId,label=labels.find(item=>item.id===id);if(!label||!(label.settings.designKind==='text'||label.settings.designKind==='design'||label.settings.wordFrame))return;
 if(designEditing&&id===activeLabelId&&event.target.closest('#temEditor'))return;
 if(event.shiftKey)return;
 event.preventDefault();event.stopImmediatePropagation();designEditing=false;
 const pointer=event.pointerId,startX=event.clientX,startY=event.clientY,stage=$('previewStage');stage.setPointerCapture(pointer);
 const pending={pointer,startX,startY,id};designDrag=pending;await activateLabel(id);if(designDrag!==pending)return;recordHistory();saveActiveLabel();const g=labelGeometry(currentLabel());Object.assign(pending,{x:g.x,y:g.y,unit:stage.getBoundingClientRect().width/previewPage().width});zoom();
},true);
$('previewStage').addEventListener('pointermove',event=>{const d=designDrag;if(!d||d.pointer!==event.pointerId||!d.unit)return;event.preventDefault();$('labelX').value=String(d.x+(event.clientX-d.startX)/d.unit);$('labelY').value=String(d.y+(event.clientY-d.startY)/d.unit);saveActiveLabel();zoom()});
async function finishDesignDrag(event){if(!designDrag||designDrag.pointer!==event.pointerId)return;designDrag=null;await preview();recordHistory()}
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('previewStage').addEventListener(event,finishDesignDrag);
$('previewArea').addEventListener('dblclick',event=>{if(!isDesign()||event.target.closest('.graphicOverlay'))return;editDesignText()});
document.addEventListener('keydown',event=>{if(home.hidden&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.target.closest('input,textarea,select,[contenteditable=true]')&&event.key.toLowerCase()==='t'&&isDesign()){event.preventDefault();$('designAddText').click()}});
const normalNew=document.createElement('button');normalNew.type='button';normalNew.textContent='＋ Tem thường mới';/* Creation stays in the first template tile. */
async function createBlankDesign(addText=true){if(homeBusy)return;homeBusy=true;homeLoadRevision++;try{await homeLoadTask;const page=previewPage(),w=(page.width-2)*96/2.54,h=(page.height-2)*96/2.54,data={...copyLabelData(homeBaseSettings),designKind:'design',text:'',richHTML:'<div><br></div>',decorations:[],wordFrame:JSON.stringify({width:w,height:h,box:{x:0,y:0,width:w,height:h}}),width:page.width-2,labelX:1,labelY:1,padding:0,border:0,colorStyles:{fill:null,body:{type:'clear'},edge:{type:'clear'}}};currentTemplateName='';await restoreLabelDocument(data);enterHomeEditor();if(addText){await newDesignText();editDesignText()}else{$('status').textContent='Mẫu trống: Tải ảnh lên hoặc bấm T · Văn bản để thêm chữ.';zoom()}}catch(error){$('homeStatus').textContent=error.message}finally{homeBusy=false}}
normalNew.onclick=()=>createBlankDesign(true);
const designLayers=renderLayersPanel;renderLayersPanel=function(){designLayers();for(const title of $('layersList').querySelectorAll('.layerSectionTitle')){const id=title.parentElement.querySelector('.layerRow')?.dataset.labelId,label=labels.find(item=>item.id===id);if(label?.settings.designKind==='text')title.textContent='T · Khối chữ';else if(label?.settings.designKind==='design'||label?.settings.wordFrame)title.textContent='Thiết kế · Ảnh'}};
zoom();


const addTemplateCard=document.createElement('button');addTemplateCard.type='button';addTemplateCard.id='homeAddTemplate';addTemplateCard.className='homeCard homeAddTemplate';addTemplateCard.innerHTML='<div class="homeThumb" style="border:2px dashed #b99de6;background:#faf7ff"><span style="font-size:58px;color:#8952d1" aria-hidden="true">＋</span></div><strong>Thêm mẫu</strong><small>Tạo mẫu tự do · thêm ảnh và chữ</small>';addTemplateCard.setAttribute('aria-label','Thêm mẫu');addTemplateCard.onclick=()=>homeType==='cloud'?createCloudTemplate():createBlankDesign(false);$('homeGrid').prepend(addTemplateCard);
$('designAddImage').onclick=async()=>{try{if(isDesign()){designEditing=false;const base=labels.find(item=>item.settings.designKind==='design'||item.settings.wordFrame);if(base&&base.id!==activeLabelId)await activateLabel(base.id);$('editLayer').value='image';zoom()}$('importGraphic').click()}catch(error){$('status').textContent=error.message}};
const designImportGraphic=addGraphic;addGraphic=async function(...args){const free=isDesign(),item=await designImportGraphic(...args);if(free&&designKind.value==='design'){const L=layout(),scale=Math.min(L.width*.6/item.width,L.height*.6/item.height);item.width*=scale;item.height*=scale;item.x=L.width/2;item.y=L.height/2;await preview();recordHistory()}return item};
const designImageChange=$('graphicFile').onchange;$('graphicFile').onchange=async()=>{await designImageChange();if(isDesign())$('status').textContent=$('graphicMessage').textContent};


async function createCloudTemplate(){if(homeBusy)return;homeBusy=true;homeLoadRevision++;try{await homeLoadTask;designEditing=false;const data={...copyLabelData(homeBaseSettings),designKind:'cloud',wordFrame:'',text:'Nhập nội dung tem',richHTML:'<div>Nhập nội dung tem</div>',decorations:[],lineStyles:[],layerStack:'{}',labelGroup:'',textOffsetX:0,textOffsetY:0,labelX:'',labelY:'',labelScaleX:1,labelScaleY:1,padding:Math.max(20,Number(homeBaseSettings.padding)||40),border:Math.max(.2,Number(homeBaseSettings.border)||.3),editLayer:'text',colorStyles:{fill:{type:'solid'},body:{type:'solid'},edge:{type:'solid'}}};currentTemplateName='';await restoreLabelDocument(data);recordHistory();enterHomeEditor();zoom();const range=document.createRange();range.selectNodeContents($('temEditor'));const selection=getSelection();selection.removeAllRanges();selection.addRange(range);captureSelection();$('status').textContent='Tem mây mới: nhập chữ; viền mây tự bo theo nội dung.';}catch(error){$('homeStatus').textContent=error.message}finally{homeBusy=false}}
const typeFilterHome=filterHome;filterHome=function(){typeFilterHome();const card=$('homeAddTemplate');if(card){card.querySelector('small').textContent=homeType==='cloud'?'Tem mây · viền bo theo chữ':'Tem thường · tự do thêm ảnh và chữ';card.title=homeType==='cloud'?'Tạo mẫu tem mây mới':'Tạo mẫu tem thường mới'}};
filterHome();


/* Physical output paper is independent from the editor's design paper. */
const outputPapers={A5:{width:14.8,height:21},A4:{width:21,height:29.7},A3:{width:29.7,height:42}};
let activeOutputPage=null,activeOutputDpi=300;
function sourcePaperName(){const key=$('page').value;return key.startsWith('a3')?'A3':key.startsWith('a5')?'A5':'A4'}
function outputPaperDimensions(name){const base=outputPapers[name]||outputPapers.A4,landscape=previewPage().width>previewPage().height;return {width:landscape?base.height:base.width,height:landscape?base.width:base.height,name:name+(landscape?' ngang':' dọc')}}
function outputPageTransform(source,target,area={x:0,y:0,width:target.width,height:target.height}){const scale=Math.min(area.width/source.width,area.height/source.height);return {scale,x:area.x+(area.width-source.width*scale)/2,y:area.y+(area.height-source.height*scale)/2}}
function renderOutputPage(target,{dpi=300,white=false,gray=false,protect=false}={}){
 const source=previewPage(),unit=dpi/2.54,w=Math.round(target.width*unit),h=Math.round(target.height*unit);if(w*h>40000000)throw Error('Khổ này quá lớn ở '+dpi+' DPI. Hãy chọn 300 DPI.');
 const result=cv(w,h),ctx=result.getContext('2d'),transform=outputPageTransform(source,target,protect?printSafeArea(target):undefined);if(white){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h)}if(gray)ctx.filter='grayscale(1)';
 const boxes=withLabels(label=>{if(!editorText().trim()&&!decorations.length)return null;const {c,cm,heightCm}=render(true,1,false),sx=Number(label.settings.labelScaleX||1),sy=Number(label.settings.labelScaleY||1),x=label.settings.labelX===''?(source.width-cm)/2:Number(label.settings.labelX),y=label.settings.labelY===''?1:Number(label.settings.labelY),g={x:transform.x+x*transform.scale,y:transform.y+y*transform.scale,width:cm*sx*transform.scale,height:heightCm*sy*transform.scale};const angle=Number(label.settings.labelAngle)||0;ctx.save();ctx.translate((g.x+g.width/2)*unit,(g.y+g.height/2)*unit);ctx.rotate(angle*Math.PI/180);ctx.drawImage(c,-g.width*unit/2,-g.height*unit/2,g.width*unit,g.height*unit);ctx.restore();if(angle){const b=TemStudioObjects.rotated({...g,angle});return b;}const bounds=visibleBounds(c.getContext('2d').getImageData(0,0,c.width,c.height).data,c.width,c.height);return {x:g.x+bounds.x/c.width*g.width,y:g.y+bounds.y/c.height*g.height,width:bounds.width/c.width*g.width,height:bounds.height/c.height*g.height}}).filter(Boolean);
 if(!boxes.length)throw Error('Hãy thêm chữ hoặc ảnh trước khi in/xuất.');
 const left=Math.max(0,Math.min(...boxes.map(box=>box.x))*unit),top=Math.max(0,Math.min(...boxes.map(box=>box.y))*unit),right=Math.min(w,Math.max(...boxes.map(box=>box.x+box.width))*unit),bottom=Math.min(h,Math.max(...boxes.map(box=>box.y+box.height))*unit);result.printInk={x:Math.floor(left),y:Math.floor(top),width:Math.max(1,Math.ceil(right)-Math.floor(left)),height:Math.max(1,Math.ceil(bottom)-Math.floor(top))};result.outputTransform=transform;return result;
}
const printPaperPane=document.createElement('div');printPaperPane.innerHTML='<label for="printOutputPaper">Khổ giấy bản in</label><select id="printOutputPaper"><option>A5</option><option selected>A4</option><option>A3</option></select><label for="printOutputDpi">Độ phân giải</label><select id="printOutputDpi"><option value="300">300 DPI</option><option value="600">600 DPI</option></select><label><input id="printProtectEdges" type="checkbox"> Bảo vệ mép (có thể thu nhỏ thêm)</label><p style="font-size:12px">Giữ tỷ lệ bố cục của trang thiết kế. Khổ giấy trên màn hình không đổi.</p>';$('printSizeInfo').before(printPaperPane);
printEdgePane.hidden=true;
renderPrintPage=function(gray=false){return renderOutputPage(outputPaperDimensions($('printOutputPaper').value),{dpi:Number($('printOutputDpi').value),white:true,gray,protect:$('printProtectEdges').checked})};
function refreshOutputPrint(){try{const target=outputPaperDimensions($('printOutputPaper').value);printPageCanvas=renderPrintPage();printSnapshot={page:target,dimensions:temDimensions()};const source=previewPage(),scale=printPageCanvas.outputTransform.scale;$('printSizeInfo').textContent='Thiết kế '+source.name+' → '+target.name+' · tỷ lệ '+(scale*100).toFixed(1)+'%';$('confirmPrint').disabled=false;$('printMessage').textContent='';updatePrintPreview()}catch(error){printPageCanvas=null;$('confirmPrint').disabled=true;$('printMessage').textContent=error.message}}
$('printOutputPaper').onchange=refreshOutputPrint;$('printOutputDpi').onchange=refreshOutputPrint;$('printProtectEdges').onchange=()=>{printEdgePane.hidden=!$('printProtectEdges').checked;refreshOutputPrint()};
exportPNG=async function(){const target=activeOutputPage||previewPage(),c=renderOutputPage(target,{dpi:activeOutputDpi,white:false});return {png:await pngBytes(c),cm:target.width,heightCm:target.height}};
vectorSVG=function(){
 const source=previewPage(),target=activeOutputPage||source,parts=withLabels((label,index)=>{if(!editorText().trim()&&!decorations.length)return '';const L=layout(),s=Math.min(4,5000/L.width,2600/L.height),w=Math.ceil(L.width*s),h=Math.ceil(L.height*s),cm=number('width',3,source.width-2),sx=Number(label.settings.labelScaleX||1),sy=Number(label.settings.labelScaleY||1),x=label.settings.labelX===''?(source.width-cm)/2:Number(label.settings.labelX),y=label.settings.labelY===''?1:Number(label.settings.labelY);let svg=oneLabelSVG().replace(/<\?xml[^>]*>\s*/,'');const bounds=svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);svg=svg.replace(/width="[^"]+" height="[^"]+"/,`x="${x+bounds[0]/w*cm*sx}" y="${y+bounds[1]/h*cm*h/w*sy}" width="${bounds[2]/w*cm*sx}" height="${bounds[3]/h*(cm*h/w)*sy}"`);const angle=Number(label.settings.labelAngle)||0;const result=svg.replace(/id="([^"]+)"/g,(_,id)=>`id="out${index}-${id}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#out${index}-${id})`);return angle?`<g transform="rotate(${angle} ${x+cm*sx/2} ${y+cm*h/w*sy/2})">${result}</g>`:result}).join('\n');return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${target.width}cm" height="${target.height}cm" viewBox="0 0 ${source.width} ${source.height}" preserveAspectRatio="xMidYMid meet">${parts}</svg>`;
};
const outputDialog=document.createElement('dialog');outputDialog.id='outputDialog';outputDialog.className='printDialog';outputDialog.innerHTML='<h2 id="outputTitle">Xuất thiết kế</h2><label for="exportOutputPaper">Khổ giấy xuất</label><select id="exportOutputPaper"><option>A5</option><option selected>A4</option><option>A3</option></select><label for="exportOutputDpi">Độ phân giải ảnh</label><select id="exportOutputDpi"><option value="300">300 DPI</option><option value="600">600 DPI</option></select><p id="outputSizeInfo"></p><p>Xuất toàn trang theo đúng vị trí trên màn hình. Khổ thiết kế được giữ nguyên.</p><canvas id="outputPreview" style="display:block;max-width:100%;max-height:300px;margin:auto;background:white;border:1px solid #d2d7df"></canvas><p id="outputMessage" role="status"></p><div class="printActions"><button id="cancelOutput" type="button">Hủy</button><button id="confirmOutput" type="button" class="primary">Xuất file</button></div>';document.body.append(outputDialog);let outputFormat='png',outputBusy=false;
function updateOutputPreview(){try{const target=outputPaperDimensions($('exportOutputPaper').value),c=renderOutputPage(target,{dpi:40,white:true});const preview=$('outputPreview');preview.width=c.width;preview.height=c.height;preview.getContext('2d').drawImage(c,0,0);$('outputSizeInfo').textContent='Trang thiết kế '+previewPage().name+' → '+target.name+' ('+target.width+' × '+target.height+' cm)';$('outputMessage').textContent='';$('confirmOutput').disabled=false}catch(error){$('outputMessage').textContent=error.message;$('confirmOutput').disabled=true}}
async function openOutputDialog(format){if(outputBusy)return;outputFormat=format;try{await ensureDocumentFonts();$('exportOutputPaper').value=sourcePaperName();$('exportOutputDpi').value='300';$('exportOutputDpi').disabled=format==='svg';$('outputTitle').textContent='Xuất '+{png:'ảnh PNG',svg:'SVG vector',word:'Word'}[format];updateOutputPreview();outputDialog.showModal()}catch(error){$('status').textContent=error.message}}
$('exportOutputPaper').onchange=updateOutputPreview;$('exportOutputDpi').onchange=updateOutputPreview;$('cancelOutput').onclick=()=>{if(!outputBusy)outputDialog.close()};outputDialog.addEventListener('cancel',event=>{if(outputBusy)event.preventDefault()});
$('confirmOutput').onclick=async()=>{if(outputBusy)return;outputBusy=true;$('confirmOutput').disabled=true;$('cancelOutput').disabled=true;$('outputMessage').textContent='Đang xuất…';try{activeOutputPage=outputPaperDimensions($('exportOutputPaper').value);activeOutputDpi=Number($('exportOutputDpi').value);await ensureDocumentFonts();const name='TemHoa-'+$('exportOutputPaper').value;if(outputFormat==='word')await word();else if(outputFormat==='svg')download(new Blob([vectorSVG()],{type:'image/svg+xml;charset=utf-8'}),name+'.svg');else download(new Blob([(await exportPNG()).png],{type:'image/png'}),name+'.png');outputDialog.close();$('status').textContent='Đã xuất '+activeOutputPage.name+'. Trang thiết kế giữ nguyên.'}catch(error){$('outputMessage').textContent=error.message}finally{activeOutputPage=null;outputBusy=false;$('confirmOutput').disabled=false;$('cancelOutput').disabled=false}};
$('png').onclick=()=>openOutputDialog('png');$('svg').onclick=()=>openOutputDialog('svg');$('word').onclick=()=>openOutputDialog('word');


/* Autosave uses stable template identity and a serialized write queue. */
$('save').hidden=true;saveAsButton.hidden=true;
const autoSaveStatus=document.createElement('span');autoSaveStatus.id='autoSaveStatus';autoSaveStatus.setAttribute('role','status');autoSaveStatus.style.cssText='font-size:12px;align-self:center;padding:6px 9px;border-radius:5px;background:#ffffff18;color:white';autoSaveStatus.textContent='Tự động lưu';autoSaveStatus.hidden=true;document.querySelector('.quickActions').prepend(autoSaveStatus);
let autoContext=null,autoTimer=null,autoSuspended=0,autoWritePromise=null,autoDraftChain=Promise.resolve();
const autoContexts=new Map();
// Defer expensive queued draft/network work until a live color gesture has ended.
const colorSaveGate={count:0,waiters:[],enter(){this.count++},leave(){if(this.count>0)this.count--;if(!this.count){const waiting=this.waiters.splice(0);for(const resolve of waiting)resolve()}},async idle(){while(this.count)await new Promise(resolve=>this.waiters.push(resolve))}};
function autoMessage(message){autoSaveStatus.textContent=message;autoSaveStatus.title=autoContext?autoContext.name:''}
function autoName(){const date=new Date(),stamp=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')+' '+[date.getHours(),date.getMinutes(),date.getSeconds()].map(x=>String(x).padStart(2,'0')).join('-');return (labels.some(label=>label.settings.wordFrame||['design','text'].includes(label.settings.designKind))?'Tem thường ':'Tem mây ')+stamp+'-'+crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0,5)}
function autoFingerprint(data){const value={...data,labels:data.labels?.map(label=>{const copy={...label};delete copy.editLayer;return copy})};delete value.activeLabel;delete value.editLayer;return JSON.stringify(value)}
function autoThumbnail(){const page=previewPage(),unit=400/page.width,c=cv(400,Math.round(page.height*unit)),ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);for(const label of labels){if(!label.bitmap||!label.size)continue;const g=labelGeometry(label);ctx.drawImage(label.bitmap,g.x*unit,g.y*unit,g.width*unit,g.height*unit)}return c.toDataURL('image/png')}
function autoDraft(action,value){autoDraftChain=autoDraftChain.catch(()=>{}).then(async()=>{await colorSaveGate.idle();return new Promise((resolve,reject)=>{const open=indexedDB.open('temhoa-autosave',1);open.onupgradeneeded=()=>open.result.createObjectStore('pending',{keyPath:'name'});open.onerror=()=>reject(open.error);open.onsuccess=async()=>{const db=open.result;try{await colorSaveGate.idle();const tx=db.transaction('pending','readwrite'),store=tx.objectStore('pending');if(action==='put')store.put(value);else store.delete(value);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}}catch(error){db.close();reject(error)}}})});return autoDraftChain}
function beginAutoDocument(name='',existing=false){if(!window.TEMHOA_TOKEN){autoContext=null;autoMessage('Tự lưu cần mở bằng Terminal');return}const identity=name||autoName();currentTemplateName=identity;autoContext={name:identity,revision:0,pending:null,last:existing?autoFingerprint(settings()):'',error:false};autoContexts.set(identity,autoContext);autoMessage(existing?'Đã lưu':'Đã sửa');captureAutoChanges()}
function captureAutoChanges(){if(autoSuspended||!autoContext||home.hidden===false||!window.TEMHOA_TOKEN)return;const data=copyLabelData(settings()),fingerprint=autoFingerprint(data);if(fingerprint===autoContext.last)return;autoContext.last=fingerprint;const job={name:autoContext.name,revision:++autoContext.revision,template:{version:1,settings:data,thumbnail:autoThumbnail(),recentAt:Date.now(),theme:homeTemplateTheme(autoContext.name)}};autoContext.pending=job;rememberRecentTemplate(job.name,job.template.recentAt);autoContext.error=false;autoMessage('Đã sửa · chờ lưu');autoDraft('put',job).catch(()=>{});clearTimeout(autoTimer);autoTimer=setTimeout(()=>flushAutoSave(),600)}
async function postAutoTemplate(job){await colorSaveGate.idle();const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);try{const response=await fetch('/api/templates',{method:'POST',headers:{'X-TemHoa-Token':window.TEMHOA_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({name:job.name,template:job.template}),signal:controller.signal});const raw=await response.text();let data;try{data=JSON.parse(raw)}catch{throw Error('Khởi động lại phần mềm bằng Terminal để tự lưu.')}if(!response.ok)throw Error(data.error||'Không lưu được mẫu.');return data;}finally{clearTimeout(timeout)}}
async function flushAutoSave(){clearTimeout(autoTimer);captureAutoChanges(true);clearTimeout(autoTimer);if(autoWritePromise)return autoWritePromise;autoWritePromise=(async()=>{let allSaved=true;for(const context of autoContexts.values()){while(context.pending){const job=context.pending;context.pending=null;if(context===autoContext)autoMessage('Đang lưu…');try{await autoDraftChain.catch(()=>{});await postAutoTemplate(job);if(context.revision===job.revision){await autoDraft('delete',job.name).catch(()=>{});if(context===autoContext)autoMessage('Đã lưu')}context.error=false;const entry=homeEntries.find(entry=>entry.fileName===job.name);if(entry){entry.template=job.template;const image=document.createElement('img');image.src=job.template.thumbnail;image.alt='Mẫu '+entry.name;entry.thumb.replaceChildren(image)}}catch(error){if(!context.pending)context.pending=job;context.error=true;if(context===autoContext){autoMessage('Lưu lỗi');autoSaveStatus.title=error.name==='AbortError'?'Lưu quá thời gian chờ; bản nháp giữ trên trình duyệt.':error.message;}allSaved=false;break}}}return allSaved})().finally(()=>{autoWritePromise=null});return autoWritePromise}
const autoPreview=preview;preview=async function(...args){const result=await autoPreview(...args);captureAutoChanges();return result};
const autoRecord=recordHistory;recordHistory=function(...args){const result=autoRecord(...args);captureAutoChanges();return result};
const autoShowHome=showTemHome;showTemHome=async function(...args){await flushAutoSave();return autoShowHome(...args)};homeBack.onclick=showTemHome;
const autoOpenHome=openHomeEntry;openHomeEntry=async function(...args){await flushAutoSave();autoSuspended++;try{await autoOpenHome(...args);if(home.hidden)beginAutoDocument(currentTemplateName,true)}finally{autoSuspended--;captureAutoChanges()}};
const autoCreateDesign=createBlankDesign;createBlankDesign=async function(...args){await flushAutoSave();autoSuspended++;try{await autoCreateDesign(...args);if(home.hidden)beginAutoDocument('',false)}finally{autoSuspended--;captureAutoChanges()}};
const autoCreateCloud=createCloudTemplate;createCloudTemplate=async function(...args){await flushAutoSave();autoSuspended++;try{await autoCreateCloud(...args);if(home.hidden)beginAutoDocument('',false)}finally{autoSuspended--;captureAutoChanges()}};
const autoApplyTemplate=applyTemplate;applyTemplate=async function(...args){if(!autoSuspended)await flushAutoSave();autoSuspended++;try{return await autoApplyTemplate(...args)}finally{autoSuspended--}};
const autoContinue=$('homeContinue').onclick;$('homeContinue').onclick=async()=>{await autoContinue();if(home.hidden&&!autoContext)beginAutoDocument(currentTemplateName,false)};
$('save').onclick=()=>flushAutoSave();saveAsButton.onclick=()=>flushAutoSave();
document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&!event.altKey&&event.key.toLowerCase()==='s'){event.preventDefault();event.stopImmediatePropagation();flushAutoSave()}},true);
window.addEventListener('online',()=>flushAutoSave());window.addEventListener('pagehide',()=>flushAutoSave());

async function recoverAutoDrafts(){if(!window.TEMHOA_TOKEN)return;const jobs=await new Promise((resolve,reject)=>{const open=indexedDB.open('temhoa-autosave',1);open.onupgradeneeded=()=>open.result.createObjectStore('pending',{keyPath:'name'});open.onerror=()=>reject(open.error);open.onsuccess=()=>{const db=open.result,tx=db.transaction('pending'),request=tx.objectStore('pending').getAll();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);tx.oncomplete=()=>db.close()}});for(const job of jobs){try{await postAutoTemplate(job);await autoDraft('delete',job.name)}catch(error){autoMessage('Có bản nháp chưa lưu');return}}if(jobs.length&&!home.hidden){await homeLoadTask;homeLoadTask=loadHomeSaved()}}
window.addEventListener('load',()=>recoverAutoDrafts().catch(()=>{}),{once:true});


/* Recently edited or printed templates, persisted with each document. */
let homeRecentTimes={};
try{const stored=JSON.parse(localStorage.getItem('temhoa-recent-templates')||'{}');if(stored&&typeof stored==='object'&&!Array.isArray(stored))homeRecentTimes=stored}catch{}
function rememberRecentTemplate(name,time=Date.now()){if(!name)return;homeRecentTimes[name]=time;try{localStorage.setItem('temhoa-recent-templates',JSON.stringify(homeRecentTimes))}catch{}}
const recentStyle=document.createElement('style');recentStyle.textContent='.homeRecentSection{margin-bottom:30px}.homeRecentSection[hidden]{display:none}.homeRecentGrid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:16px}.homeRecentGrid .homeThumb{height:125px}.homeRecentGrid .homeCard strong{font-size:13px}@media(max-width:900px){.homeRecentGrid{grid-template-columns:repeat(6,160px);overflow-x:auto;padding:3px 3px 12px}}';document.head.append(recentStyle);
const recentSection=document.createElement('section');recentSection.id='homeRecentSection';recentSection.className='homeRecentSection';recentSection.hidden=true;recentSection.innerHTML='<div class="homeSectionTitle"><h2>Tem sửa hoặc in gần đây</h2></div><div id="homeRecentGrid" class="homeRecentGrid"></div>';home.querySelector('.homeContent').prepend(recentSection);
function renderHomeRecent(){const query=homeNormalize($('homeSearch').value.trim());const entries=homeEntries.filter(entry=>entry.saved&&homeNormalize(entry.name+' '+(entry.keywords||'')).includes(query)).map(entry=>({entry,time:Math.max(Number(homeRecentTimes[entry.fileName])||0,Number(entry.template?.recentAt)||0)})).filter(item=>item.time>0).sort((a,b)=>b.time-a.time).slice(0,6);recentSection.hidden=homeType!=='all'||!entries.length;$('homeRecentGrid').replaceChildren();for(const {entry} of entries){const card=entry.card.cloneNode(true);card.hidden=false;card.dataset.recentTemplate=entry.fileName;card.querySelector('.homeCardOpen').onclick=()=>openHomeEntry(entry);card.querySelector('.homeDelete').onclick=event=>{event.preventDefault();event.stopPropagation();requestHomeDelete(entry)};card.querySelector('small').textContent='Vừa sửa hoặc in';$('homeRecentGrid').append(card)}}
const recentFilterHome=filterHome;filterHome=function(...args){recentFilterHome(...args);renderHomeRecent()};
const recentConfirmPrint=$('confirmPrint').onclick;$('confirmPrint').onclick=async function(...args){if(printPageCanvas&&printSnapshot&&currentTemplateName){const time=Date.now();rememberRecentTemplate(currentTemplateName,time);const context=autoContext;if(context){const template={version:1,settings:copyLabelData(settings()),thumbnail:autoThumbnail(),recentAt:time,theme:homeTemplateTheme(context.name)};const job={name:context.name,revision:++context.revision,template};context.pending=job;autoDraft('put',job).catch(()=>{});flushAutoSave()}renderHomeRecent()}return recentConfirmPrint.apply(this,args)};
filterHome();$('homeSearch').oninput=filterHome;


/* Seasonal topics can be created by the user and assigned to templates. */
var homeThemes=[],homeTemplateThemes={};
try{const value=JSON.parse(localStorage.getItem('temhoa-themes')||'{}');homeThemes=Array.isArray(value.names)?value.names.filter(x=>typeof x==='string'&&x.trim()):[];homeTemplateThemes=value.templates&&typeof value.templates==='object'?value.templates:{}}catch{}
function persistHomeThemes(){try{localStorage.setItem('temhoa-themes',JSON.stringify({names:homeThemes,templates:homeTemplateThemes}))}catch{}}
function homeTemplateTheme(name){return (homeTemplateThemes||{})[name]||''}
function readTemplateTheme(name,template){if(typeof template.theme!=='string')return;homeTemplateThemes[name]=template.theme;if(template.theme&&!homeThemes.includes(template.theme)){homeThemes.push(template.theme);renderHomeThemes()}persistHomeThemes()}
function renderHomeThemes(){home.querySelectorAll('[data-home-theme]').forEach(button=>button.remove());for(const name of homeThemes){const button=document.createElement('button');button.type='button';button.dataset.homeType='theme:'+name;button.dataset.homeTheme=name;button.setAttribute('aria-pressed',String(homeType===button.dataset.homeType));const icon=document.createElement('span');icon.className='homeTypeIcon';icon.textContent='❀';button.append(icon,document.createTextNode(name));button.onclick=()=>{homeType=button.dataset.homeType;filterHome()};$('homeAddTheme').before(button)}}
function refreshThemeSelectors(){for(const entry of homeEntries){let select=entry.card.querySelector('.homeThemeSelect');if(!select){select=document.createElement('select');select.className='homeThemeSelect';select.setAttribute('aria-label','Chủ đề của '+entry.name);select.style.cssText='width:100%;margin-top:9px;padding:6px;border:1px solid #ddd;border-radius:6px;font-size:12px;background:white';select.onchange=()=>assignHomeTheme(entry,select);entry.card.append(select)}const selected=homeTemplateTheme(entry.fileName);select.replaceChildren(new Option('Chọn chủ đề', ''));for(const name of homeThemes)select.add(new Option(name,name));select.value=selected}}
async function assignHomeTheme(entry,select){const previous=homeTemplateTheme(entry.fileName),next=select.value;select.disabled=true;try{await flushAutoSave();const template=await templateAPI('?name='+encodeURIComponent(entry.fileName));template.theme=next;await postAutoTemplate({name:entry.fileName,template});homeTemplateThemes[entry.fileName]=next;entry.template=template;persistHomeThemes();filterHome()}catch(error){select.value=previous;$('homeStatus').textContent=error.message}finally{select.disabled=false}}
const themeDialog=document.createElement('dialog');themeDialog.id='homeThemeDialog';themeDialog.className='printDialog';themeDialog.innerHTML='<h2>Thêm chủ đề</h2><form id="homeThemeForm"><label for="homeThemeName">Tên chủ đề</label><input id="homeThemeName" maxlength="60" required placeholder="Ví dụ: Tết, Giáng sinh, Mùa cưới" style="width:100%"><p id="homeThemeError" role="status"></p><div class="printActions"><button id="homeThemeCancel" type="button">Hủy</button><button type="submit" class="primary">Thêm chủ đề</button></div></form>';document.body.append(themeDialog);
$('homeAddTheme').onclick=()=>{$('homeThemeName').value='';$('homeThemeError').textContent='';themeDialog.showModal();$('homeThemeName').focus()};$('homeThemeCancel').onclick=()=>themeDialog.close();$('homeThemeForm').onsubmit=event=>{event.preventDefault();const name=$('homeThemeName').value.trim();if(!name)return;if(homeThemes.some(item=>homeNormalize(item)===homeNormalize(name))){$('homeThemeError').textContent='Chủ đề này đã có.';return}homeThemes.push(name);persistHomeThemes();renderHomeThemes();homeType='theme:'+name;themeDialog.close();filterHome()};
const themeBeginAuto=beginAutoDocument;beginAutoDocument=function(name='',existing=false){if(!existing&&homeType.startsWith('theme:')){name=name||autoName();homeTemplateThemes[name]=homeType.slice(6);persistHomeThemes()}return themeBeginAuto(name,existing)};
const themeFilterHome=filterHome;filterHome=function(...args){themeFilterHome(...args);refreshThemeSelectors();/* Recent cards retain just open/delete controls. */$('homeRecentGrid').querySelectorAll('.homeThemeSelect').forEach(select=>select.remove())};
renderHomeThemes();filterHome();$('homeSearch').oninput=filterHome;




/* Canva-like context menu for TEMhoa. Commands operate on the actual current selection. */
const contextMenuStyle=document.createElement('style');contextMenuStyle.textContent="\n#labelContextMenu.canvaMenu{position:fixed;z-index:1000;width:292px;max-height:min(720px,calc(100vh - 20px));overflow:visible;padding:9px;background:#111214;color:#f7f7f8;border:1px solid #292b30;border-radius:16px;box-shadow:0 18px 55px #0008;font:14px Arial,sans-serif}\n#labelContextMenu.canvaMenu[hidden]{display:none}\n.canvaMenu .ctxItem{position:relative;display:flex;width:100%;min-height:43px;align-items:center;gap:11px;padding:8px 10px;border:0;border-radius:9px;background:transparent;color:inherit;text-align:left}\n.canvaMenu .ctxItem:hover,.canvaMenu .ctxItem:focus-visible,.canvaMenu .ctxItem.ctxOpen{background:#1c1e22;outline:none}\n.canvaMenu .ctxItem:disabled{opacity:.38;cursor:not-allowed}.canvaMenu .ctxIcon{display:grid;place-items:center;width:25px;flex:0 0 25px;font-size:20px}.canvaMenu .ctxText{flex:1;min-width:0}.canvaMenu .ctxShortcut{margin-left:auto;padding:4px 7px;border-radius:6px;background:#18191c;color:#d4d5d8;font-size:12px}.canvaMenu .ctxArrow{font-size:22px;margin-left:auto}.canvaMenu .ctxDivider{height:1px;background:#24262a;margin:6px 5px}\n.canvaMenu .ctxSub{position:absolute;left:calc(100% + 7px);top:-7px;width:240px;padding:8px;background:#111214;border:1px solid #292b30;border-radius:13px;box-shadow:0 14px 38px #0008;display:none}.canvaMenu .ctxHasSub:hover>.ctxSub,.canvaMenu .ctxHasSub:focus-within>.ctxSub{display:block}.canvaMenu.ctxOpenLeft .ctxSub{left:auto;right:calc(100% + 7px)}\n.canvaMenu .ctxDanger{color:#ff9b9b}\n";document.head.append(contextMenuStyle);
const contextMenuCompat=document.createElement('div');contextMenuCompat.hidden=true;contextMenuCompat.setAttribute('aria-hidden','true');for(const id of ['menuLayerUp','menuLayerDown','menuGroup','menuUngroup']){const node=$(id)||Object.assign(document.createElement('button'),{id});contextMenuCompat.append(node)}document.body.append(contextMenuCompat);


const labelLockControl=document.createElement('input');labelLockControl.type='checkbox';labelLockControl.id='labelLocked';labelLockControl.hidden=true;document.body.append(labelLockControl);ids.push('labelLocked');
const contextSetLabelSettings=setLabelSettings;setLabelSettings=function(value,ui=false){if(value?.labelLocked===undefined)labelLockControl.checked=false;return contextSetLabelSettings(value,ui)};

let contextClipboardKind='',contextGraphicClipboard=null,contextStyleClipboard=null;
const contextClone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));

function contextGraphicUnits(){
 const chosen=new Set(graphicSelection().map(item=>item.id)),seen=new Set(),units=[];
 for(const item of decorations){
  if(!chosen.has(item.id))continue;
  const key=item.groupId||item.id;if(seen.has(key))continue;seen.add(key);
  const items=item.groupId?decorations.filter(member=>member.groupId===item.groupId&&chosen.has(member.id)):[item];
  units.push({items,bounds:graphicGroupBounds(items)})
 }
 return units
}
function contextLabelUnits(){
 saveActiveLabel();const chosen=new Set(selectedLabels().map(label=>label.id)),seen=new Set(),units=[];
 for(const label of labels){
  if(!chosen.has(label.id))continue;
  const key=labelGroupKey(label)||label.id;if(seen.has(key))continue;seen.add(key);
  const items=labelGroupKey(label)?labels.filter(member=>labelGroupKey(member)===labelGroupKey(label)&&chosen.has(member.id)):[label];
  units.push({items,bounds:wholeGroupBounds(items)})
 }
 return units
}
function contextSelectionLocked(){if(selectedGraphic())return graphicSelection().some(item=>item.locked);saveActiveLabel();return selectedLabels().some(label=>label.settings.labelLocked===true)}
function contextCanGroup(){return selectedGraphic()?graphicSelection().length>1:selectedLabels().length>1}
function contextCanUngroup(){return selectedGraphic()?graphicSelection().some(item=>item.groupId):selectedLabels().some(label=>labelGroupKey(label))}
function contextUnitCount(){return selectedGraphic()?contextGraphicUnits().length:contextLabelUnits().length}
function contextMoveGraphicUnit(unit,dx,dy){for(const item of unit.items){item.x+=dx;item.y+=dy}}
function contextMoveLabelUnit(unit,dx,dy){for(const label of unit.items){const g=labelGeometry(label);label.settings.labelX=String(g.x+dx);label.settings.labelY=String(g.y+dy)}}
async function contextCommit(message=''){if(!selectedGraphic()){const active=currentLabel();setLabelSettings(active.settings,true);previewSize=active.size}await preview();recordHistory();syncGraphicControls();renderLayersPanel();if(message)$('status').textContent=message}

async function contextCopySelection(){
 if(selectedGraphic()){const items=graphicSelection();contextGraphicClipboard=items.map(contextClone);contextClipboardKind='graphic';$('status').textContent='Đã sao chép '+items.length+' thành phần.'}
 else{await copyLabel();contextClipboardKind='label';contextGraphicClipboard=null}
}
async function contextPasteGraphics(){
 const source=contextGraphicClipboard||[];if(!source.length)return;if(decorations.length+source.length>12){$('status').textContent='Một tem tối đa 12 hình / icon.';return}
 recordHistory();groupSequence=Math.max(groupSequence,...decorations.map(item=>Number(item.groupId?.split('-')[1])||0),0);
 const groups=new Map(),copies=source.map(original=>{let groupId='';if(original.groupId){if(!groups.has(original.groupId))groups.set(original.groupId,'group-'+(++groupSequence));groupId=groups.get(original.groupId)}return safeGraphic({...contextClone(original),id:'graphic-'+(++graphicSequence),groupId,x:original.x+25,y:original.y+25})});
 decorations.push(...copies);selectedGraphicSet=new Set(copies.map(item=>item.id));selectedGraphicId=copies.at(-1)?.id||null;graphicSelectionOwner=activeLabelId;await ensureGraphics(copies);await contextCommit('Đã dán '+copies.length+' thành phần.')
}
async function contextPasteSelection(){if(contextClipboardKind==='graphic')return contextPasteGraphics();return pasteLabel()}
async function contextDuplicateSelection(){
 if(selectedGraphic()){const oldKind=contextClipboardKind,oldClip=contextGraphicClipboard;contextGraphicClipboard=graphicSelection().map(contextClone);contextClipboardKind='graphic';try{await contextPasteGraphics()}finally{contextClipboardKind=oldKind;contextGraphicClipboard=oldClip}}
 else await duplicateLabel()
}
async function contextDeleteSelection(){
 if(selectedGraphic()){const idsToDelete=new Set(graphicSelection().map(item=>item.id));if(!idsToDelete.size)return;recordHistory();decorations=decorations.filter(item=>!idsToDelete.has(item.id));selectedGraphicId=null;selectedGraphicSet.clear();await contextCommit('Đã xóa '+idsToDelete.size+' thành phần.');return}
 saveActiveLabel();const chosen=selectedLabels(),remove=new Set(chosen.map(label=>label.id));if(labels.length-remove.size<1){$('status').textContent='Cần giữ lại ít nhất một khối thiết kế.';return}
 recordHistory();labels=labels.filter(label=>!remove.has(label.id));activeLabelId=labels.at(-1).id;selectedLabelSet=new Set([activeLabelId]);setLabelSettings(currentLabel().settings,true);previewSize=currentLabel().size;await contextCommit('Đã xóa '+remove.size+' khối.')
}
function contextCopyStyle(){
 if(selectedGraphic()){const item=selectedGraphic();contextStyleClipboard={kind:'graphic',style:contextClone({color:item.color,backgroundColor:item.backgroundColor,tolerance:item.tolerance,removeWhite:item.removeWhite,keepRatio:item.keepRatio,flipX:item.flipX,flipY:item.flipY})}}
 else{saveActiveLabel();const data=currentLabel().settings,keys=['font','customFont','size','spacing','bold','italic','underline','align','fill','body','padding','border','edge','colorStyles','defaultTextStyle','lineStyles','curveAmount','curveOverrides','curveLine'];contextStyleClipboard={kind:'label',style:Object.fromEntries(keys.map(key=>[key,contextClone(data[key])]))}}
 $('status').textContent='Đã sao chép định dạng.'
}
async function contextApplyStyle(){
 if(!contextStyleClipboard){$('status').textContent='Chưa có định dạng đã sao chép.';return}
 recordHistory();
 if(selectedGraphic()&&contextStyleClipboard.kind==='graphic'){const style=contextStyleClipboard.style;for(const item of graphicSelection())for(const [key,value] of Object.entries(style)){if(item.kind==='image'&&key==='color')continue;if(item.kind!=='image'&&['backgroundColor','tolerance','removeWhite'].includes(key))continue;item[key]=contextClone(value)}}
 else if(!selectedGraphic()&&contextStyleClipboard.kind==='label'){saveActiveLabel();for(const label of selectedLabels())Object.assign(label.settings,contextClone(contextStyleClipboard.style))}
 else{$('status').textContent='Định dạng đã sao chép không cùng loại thành phần.';return}
 await contextCommit('Đã dán định dạng.')
}
async function contextToggleLock(){
 recordHistory();
 if(selectedGraphic()){const items=graphicSelection(),lock=!items.every(item=>item.locked);items.forEach(item=>item.locked=lock);await contextCommit(lock?'Đã khóa thành phần.':'Đã mở khóa thành phần.')}
 else{saveActiveLabel();const items=selectedLabels(),lock=!items.every(label=>label.settings.labelLocked===true);items.forEach(label=>label.settings.labelLocked=lock);labelLockControl.checked=currentLabel().settings.labelLocked===true;await contextCommit(lock?'Đã khóa thành phần.':'Đã mở khóa thành phần.')}
}
async function contextGroupSelection(ungroup=false){
 if(ungroup&&!contextCanUngroup()){$('status').textContent='Vùng chọn chưa được nhóm.';return}
 if(!ungroup&&!contextCanGroup()){$('status').textContent='Giữ Shift và chọn từ 2 thành phần trở lên để Nhóm.';return}
 await groupGraphics(ungroup);renderLayersPanel()
}
async function contextMoveLayer(mode){
 if(contextSelectionLocked()){$('status').textContent='Hãy mở khóa trước khi đổi lớp.';return}
 recordHistory();
 if(selectedGraphic()){
  const selected=new Set(graphicSelection().map(item=>item.id));let array=decorations.slice();
  if(mode==='front')array=[...array.filter(x=>!selected.has(x.id)),...array.filter(x=>selected.has(x.id))];
  else if(mode==='back')array=[...array.filter(x=>selected.has(x.id)),...array.filter(x=>!selected.has(x.id))];
  else if(mode==='up'){for(let i=array.length-2;i>=0;i--)if(selected.has(array[i].id)&&!selected.has(array[i+1].id))[array[i],array[i+1]]=[array[i+1],array[i]]}
  else if(mode==='down'){for(let i=1;i<array.length;i++)if(selected.has(array[i].id)&&!selected.has(array[i-1].id))[array[i],array[i-1]]=[array[i-1],array[i]]}
  decorations=array
 }else{
  saveActiveLabel();const selected=new Set(selectedLabels().map(label=>label.id));let array=labels.slice();
  if(mode==='front')array=[...array.filter(x=>!selected.has(x.id)),...array.filter(x=>selected.has(x.id))];
  else if(mode==='back')array=[...array.filter(x=>selected.has(x.id)),...array.filter(x=>!selected.has(x.id))];
  else if(mode==='up'){for(let i=array.length-2;i>=0;i--)if(selected.has(array[i].id)&&!selected.has(array[i+1].id))[array[i],array[i+1]]=[array[i+1],array[i]]}
  else if(mode==='down'){for(let i=1;i<array.length;i++)if(selected.has(array[i].id)&&!selected.has(array[i-1].id))[array[i],array[i-1]]=[array[i-1],array[i]]}
  labels=array
 }
 await contextCommit('Đã thay đổi thứ tự lớp.')
}
async function contextAlignSelection(mode){
 if(contextSelectionLocked()){$('status').textContent='Hãy mở khóa trước khi căn chỉnh.';return}
 const units=selectedGraphic()?contextGraphicUnits():contextLabelUnits();if(units.length<2){$('status').textContent='Chọn ít nhất 2 thành phần để căn chỉnh.';return}
 const left=Math.min(...units.map(u=>u.bounds.x)),top=Math.min(...units.map(u=>u.bounds.y)),right=Math.max(...units.map(u=>u.bounds.x+u.bounds.width)),bottom=Math.max(...units.map(u=>u.bounds.y+u.bounds.height)),cx=(left+right)/2,cy=(top+bottom)/2;recordHistory();
 for(const unit of units){const b=unit.bounds;let dx=0,dy=0;if(mode==='left')dx=left-b.x;if(mode==='right')dx=right-(b.x+b.width);if(mode==='hcenter')dx=cx-(b.x+b.width/2);if(mode==='top')dy=top-b.y;if(mode==='bottom')dy=bottom-(b.y+b.height);if(mode==='vcenter')dy=cy-(b.y+b.height/2);selectedGraphic()?contextMoveGraphicUnit(unit,dx,dy):contextMoveLabelUnit(unit,dx,dy)}
 await contextCommit('Đã căn chỉnh vùng chọn.')
}
async function contextDistributeSelection(axis){
 if(contextSelectionLocked()){$('status').textContent='Hãy mở khóa trước khi dàn cách.';return}
 const units=selectedGraphic()?contextGraphicUnits():contextLabelUnits();if(units.length<3){$('status').textContent='Chọn ít nhất 3 thành phần để dàn cách đều.';return}
 const horizontal=axis==='horizontal',sorted=units.slice().sort((a,b)=>(horizontal?a.bounds.x:a.bounds.y)-(horizontal?b.bounds.x:b.bounds.y)),start=horizontal?sorted[0].bounds.x:sorted[0].bounds.y,end=horizontal?sorted.at(-1).bounds.x+sorted.at(-1).bounds.width:sorted.at(-1).bounds.y+sorted.at(-1).bounds.height,total=sorted.reduce((sum,u)=>sum+(horizontal?u.bounds.width:u.bounds.height),0),gap=(end-start-total)/(sorted.length-1);recordHistory();let cursor=start;
 for(const unit of sorted){const pos=horizontal?unit.bounds.x:unit.bounds.y,delta=cursor-pos;selectedGraphic()?contextMoveGraphicUnit(unit,horizontal?delta:0,horizontal?0:delta):contextMoveLabelUnit(unit,horizontal?delta:0,horizontal?0:delta);cursor+=(horizontal?unit.bounds.width:unit.bounds.height)+gap}
 await contextCommit('Đã dàn cách đều '+(horizontal?'theo chiều ngang.':'theo chiều dọc.'))
}
async function contextCenterSelection(){
 if(contextSelectionLocked()){$('status').textContent='Hãy mở khóa trước khi căn giữa.';return}
 if(selectedGraphic()){const units=contextGraphicUnits(),all=units.flatMap(u=>u.items);if(!all.length)return;const b=graphicGroupBounds(all),L=previewSize?.L||layout(),dx=L.width/2-(b.x+b.width/2),dy=L.height/2-(b.y+b.height/2);recordHistory();units.forEach(unit=>contextMoveGraphicUnit(unit,dx,dy))}
 else{const units=contextLabelUnits();if(!units.length)return;const all=units.flatMap(u=>u.items),b=wholeGroupBounds(all),page=previewPage(),dx=page.width/2-(b.x+b.width/2),dy=page.height/2-(b.y+b.height/2);recordHistory();units.forEach(unit=>contextMoveLabelUnit(unit,dx,dy))}
 await contextCommit('Đã căn vùng chọn vào giữa tem.')
}
async function contextDownloadSelection(){
 let canvas;
 if(selectedGraphic()){
  const items=graphicSelection();if(!items.length)return;await ensureGraphics(items);const bounds=graphicGroupBounds(items),scale=Math.min(4,Math.max(1,1800/Math.max(bounds.width,bounds.height))),pad=8;canvas=cv(Math.max(1,Math.ceil(bounds.width*scale+pad*2)),Math.max(1,Math.ceil(bounds.height*scale+pad*2)));const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.translate(-bounds.x+pad/scale,-bounds.y+pad/scale);for(const item of decorations)if(items.includes(item))drawGraphic(ctx,item,false)
 }else{
  saveActiveLabel();const chosen=selectedLabels();if(!chosen.length)return;await ensureDocumentFonts();const original=oneLabelSettings(),parts=[];try{for(const label of chosen){setLabelSettings(label.settings);const output=render(false,1,false),page=previewPage(),x=label.settings.labelX===''?(page.width-output.cm)/2:Number(label.settings.labelX),y=label.settings.labelY===''?1:Number(label.settings.labelY),sx=Number(label.settings.labelScaleX||1),sy=Number(label.settings.labelScaleY||1);parts.push({c:output.c,x,y,w:output.cm*sx,h:output.heightCm*sy})}}finally{setLabelSettings(original,true)}const left=Math.min(...parts.map(p=>p.x)),top=Math.min(...parts.map(p=>p.y)),right=Math.max(...parts.map(p=>p.x+p.w)),bottom=Math.max(...parts.map(p=>p.y+p.h)),unit=120;canvas=cv(Math.max(1,Math.ceil((right-left)*unit)),Math.max(1,Math.ceil((bottom-top)*unit)));const ctx=canvas.getContext('2d');for(const p of parts)ctx.drawImage(p.c,(p.x-left)*unit,(p.y-top)*unit,p.w*unit,p.h*unit)
 }
 const link=document.createElement('a');link.download='TEMhoa-vung-chon.png';link.href=canvas.toDataURL('image/png');document.body.append(link);link.click();link.remove();$('status').textContent='Đã xuất vùng chọn PNG.'
}

window.addEventListener('pointerdown',event=>{
 if(event.button!==0||event.target.closest?.('.graphicOverlay'))return;
 if(event.target.closest?.('#wholeGroupFrame')&&selectedLabels().some(label=>label.settings.labelLocked===true)){event.preventDefault();event.stopPropagation();$('status').textContent='Thành phần đang khóa.';return}
 const node=event.target.closest?.('.otherLabel,#labelSurface');if(!node)return;const id=node.dataset.labelId||activeLabelId,label=labels.find(item=>item.id===id);if(!label)return;const locked=label.id===activeLabelId?labelLockControl.checked:label.settings.labelLocked===true;if(!locked)return;
 event.preventDefault();event.stopPropagation();if(label.id!==activeLabelId)activateLabel(label.id).then(()=>{selectedLabelSet=new Set([label.id]);drawLabelGroupFrame()});else{selectedLabelSet=new Set([label.id]);drawLabelGroupFrame()}$('status').textContent='Thành phần đang khóa. Chuột phải → Mở khóa để chỉnh.'
},true);

function ctxDivider(){const d=document.createElement('div');d.className='ctxDivider';return d}
function ctxItem(label,icon='',shortcut='',action=null,disabled=false,extraClass=''){
 const button=document.createElement('button');button.type='button';button.className='ctxItem '+extraClass;button.disabled=disabled;button.setAttribute('role','menuitem');button.setAttribute('aria-label',label);const i=document.createElement('span');i.className='ctxIcon';i.textContent=icon;i.setAttribute('aria-hidden','true');const t=document.createElement('span');t.className='ctxText';t.textContent=label;button.append(i,t);
 if(shortcut){const s=document.createElement('span');s.className='ctxShortcut';s.textContent=shortcut;s.setAttribute('aria-hidden','true');button.append(s)}
 if(action)button.onclick=async event=>{event.stopPropagation();labelMenu.hidden=true;try{await action()}catch(error){$('status').textContent=error.message}};return button
}
function ctxSub(label,icon,items){const host=ctxItem(label,icon,'',null,false,'ctxHasSub'),arrow=document.createElement('span');arrow.className='ctxArrow';arrow.textContent='›';host.append(arrow);const sub=document.createElement('div');sub.className='ctxSub';sub.setAttribute('role','menu');for(const item of items)sub.append(item);host.append(sub);return host}
function rebuildContextMenu(){
 const lock=contextSelectionLocked(),units=contextUnitCount(),mac=navigator.platform?.toLowerCase().includes('mac'),mod=mac?'⌘':'Ctrl+';
 labelMenu.className='labelContextMenu canvaMenu';labelMenu.replaceChildren(
  ctxItem('Sao chép','▣',mod+'C',contextCopySelection),
  ctxItem('Sao chép định dạng','🖌','',()=>{contextCopyStyle()}),
  ctxItem('Dán','▢',mod+'V',contextPasteSelection,contextClipboardKind===''&&!labelClipboard),
  ctxItem('Tạo bản sao','⊞',mod+'D',contextDuplicateSelection),
  ctxItem('Xóa','⌫','Delete',contextDeleteSelection,false,'ctxDanger'),
  ctxDivider(),
  ctxSub('Lớp','◇',[ctxItem('Đưa lên trên cùng','⇈','',()=>contextMoveLayer('front'),lock),ctxItem('Lên 1 lớp','↑','',()=>contextMoveLayer('up'),lock),ctxItem('Xuống 1 lớp','↓','',()=>contextMoveLayer('down'),lock),ctxItem('Đưa xuống dưới cùng','⇊','',()=>contextMoveLayer('back'),lock)]),
  ctxSub('Căn chỉnh thành phần','≡',[ctxItem('Căn trái','⇤','',()=>contextAlignSelection('left'),lock||units<2),ctxItem('Căn giữa ngang','↔','',()=>contextAlignSelection('hcenter'),lock||units<2),ctxItem('Căn phải','⇥','',()=>contextAlignSelection('right'),lock||units<2),ctxItem('Căn trên','↥','',()=>contextAlignSelection('top'),lock||units<2),ctxItem('Căn giữa dọc','↕','',()=>contextAlignSelection('vcenter'),lock||units<2),ctxItem('Căn dưới','↧','',()=>contextAlignSelection('bottom'),lock||units<2),ctxDivider(),ctxItem('Căn vùng chọn vào giữa tem','⊙','',contextCenterSelection,lock)]),
  ctxSub('Dàn cách đều','▦',[ctxItem('Theo chiều ngang','↔','',()=>contextDistributeSelection('horizontal'),lock||units<3),ctxItem('Theo chiều dọc','↕','',()=>contextDistributeSelection('vertical'),lock||units<3)]),
  ctxDivider(),
  ctxItem(contextCanUngroup()?'Bỏ nhóm':'Nhóm','▧',contextCanUngroup()?mod+'Shift+G':mod+'G',()=>contextGroupSelection(contextCanUngroup()),contextCanUngroup()?false:!contextCanGroup()),
  ctxItem(lock?'Mở khóa':'Khóa',lock?'🔓':'🔒','',contextToggleLock),
  ctxDivider(),
  ctxItem('Dán định dạng','✥','',contextApplyStyle,!contextStyleClipboard),
  ctxItem('Tải xuống phần đã chọn','↓','',contextDownloadSelection)
 )
}
async function openCanvaContextMenu(event){
 event.preventDefault();event.stopImmediatePropagation();const overlay=event.target.closest('.graphicOverlay'),other=event.target.closest('.otherLabel'),active=event.target.closest('#labelSurface');
 if(overlay){const item=decorations.find(x=>x.id===overlay.dataset.graphicId);if(item&&!selectedGraphicSet.has(item.id))selectGraphicItems(item,false);else if(item)selectedGraphicId=item.id;selectedLabelSet.clear();positionGraphicOverlays();syncGraphicControls()}
 else{selectedGraphicId=null;selectedGraphicSet.clear();const id=other?.dataset.labelId||(active?activeLabelId:'');if(id&&id!==activeLabelId)await activateLabel(id);const label=labels.find(x=>x.id===id)||currentLabel();if(!selectedLabelSet.has(label.id))selectWholeLabel(label,false);syncGraphicControls()}
 rebuildContextMenu();labelMenu.hidden=false;labelMenu.classList.toggle('ctxOpenLeft',event.clientX>innerWidth-600);requestAnimationFrame(()=>{const w=labelMenu.offsetWidth,h=labelMenu.offsetHeight;labelMenu.style.left=Math.max(8,Math.min(event.clientX,innerWidth-w-8))+'px';labelMenu.style.top=Math.max(8,Math.min(event.clientY,innerHeight-h-8))+'px'})
}
$('previewArea').addEventListener('contextmenu',openCanvaContextMenu,true);
document.addEventListener('pointerdown',event=>{if(!labelMenu.hidden&&!labelMenu.contains(event.target))labelMenu.hidden=true},true);
document.addEventListener('keydown',event=>{
 if(!home.hidden||event.target.closest?.('input,textarea,select,[contenteditable=true],dialog'))return;const mod=event.ctrlKey||event.metaKey,key=event.key.toLowerCase();
 if(mod&&!event.altKey&&['c','v','d','g'].includes(key)){event.preventDefault();event.stopImmediatePropagation();const task=key==='c'?contextCopySelection:key==='v'?contextPasteSelection:key==='d'?contextDuplicateSelection:()=>contextGroupSelection(event.shiftKey);Promise.resolve(task()).catch(error=>$('status').textContent=error.message);return}
 if(!mod&&!event.altKey&&(event.key==='Delete'||event.key==='Backspace')){event.preventDefault();event.stopImmediatePropagation();contextDeleteSelection().catch(error=>$('status').textContent=error.message)}
},true);

