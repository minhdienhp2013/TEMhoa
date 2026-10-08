'use strict';
let fontWarnings=[], fontLoadNotes=new Map();
// CSS can use installed fonts without permission to enumerate their files.
function detectSystemFonts(){
 const ctx=cv(1,1).getContext('2d'),sample='mmmmWWWWiiii 0123 Áệộ';
 const candidates=[...new Set([...recentFonts,'Arial','Times New Roman','Calibri','Cambria','Verdana','Tahoma','Georgia','Courier New','Helvetica','Helvetica Neue','Menlo','Segoe UI'])];
 return candidates.filter(name=>['serif','sans-serif','monospace'].some(base=>{ctx.font='32px '+base;let width=ctx.measureText(sample).width;ctx.font='32px '+JSON.stringify(name)+', '+base;return Math.abs(ctx.measureText(sample).width-width)>.01}));
}
function cssFamily(family){return /^(serif|sans-serif|monospace|system-ui)$/.test(family)?family:JSON.stringify(family)}
const vietnameseChars=["â", "Â", "ă", "Ă", "đ", "Đ", "ê", "Ê", "ô", "Ô", "ơ", "Ơ", "ư", "Ư", "á", "Á", "à", "À", "ả", "Ả", "ã", "Ã", "ạ", "Ạ", "ấ", "Ấ", "ầ", "Ầ", "ẩ", "Ẩ", "ẫ", "Ẫ", "ậ", "Ậ", "ắ", "Ắ", "ằ", "Ằ", "ẳ", "Ẳ", "ẵ", "Ẵ", "ặ", "Ặ", "é", "É", "è", "È", "ẻ", "Ẻ", "ẽ", "Ẽ", "ẹ", "Ẹ", "ế", "Ế", "ề", "Ề", "ể", "Ể", "ễ", "Ễ", "ệ", "Ệ", "í", "Í", "ì", "Ì", "ỉ", "Ỉ", "ĩ", "Ĩ", "ị", "Ị", "ó", "Ó", "ò", "Ò", "ỏ", "Ỏ", "õ", "Õ", "ọ", "Ọ", "ố", "Ố", "ồ", "Ồ", "ổ", "Ổ", "ỗ", "Ỗ", "ộ", "Ộ", "ớ", "Ớ", "ờ", "Ờ", "ở", "Ở", "ỡ", "Ỡ", "ợ", "Ợ", "ú", "Ú", "ù", "Ù", "ủ", "Ủ", "ũ", "Ũ", "ụ", "Ụ", "ứ", "Ứ", "ừ", "Ừ", "ử", "Ử", "ữ", "Ữ", "ự", "Ự", "ỳ", "Ỳ", "ỷ", "Ỷ", "ỹ", "Ỹ", "ỵ", "Ỵ", "ý", "Ý"];
const tcvnChars=["©", "¢", "¨", "¡", "®", "§", "ª", "£", "«", "¤", "¬", "¥", "­", "¦", "¸", "¸", "µ", "µ", "¶", "¶", "·", "·", "¹", "¹", "Ê", "Ê", "Ç", "Ç", "È", "È", "É", "É", "Ë", "Ë", "¾", "¾", "»", "»", "¼", "¼", "½", "½", "Æ", "Æ", "Ð", "Ð", "Ì", "Ì", "Î", "Î", "Ï", "Ï", "Ñ", "Ñ", "Õ", "Õ", "Ò", "Ò", "Ó", "Ó", "Ô", "Ô", "Ö", "Ö", "Ý", "Ý", "×", "×", "Ø", "Ø", "Ü", "Ü", "Þ", "Þ", "ã", "ã", "ß", "ß", "á", "á", "â", "â", "ä", "ä", "è", "è", "å", "å", "æ", "æ", "ç", "ç", "é", "é", "í", "í", "ê", "ê", "ë", "ë", "ì", "ì", "î", "î", "ó", "ó", "ï", "ï", "ñ", "ñ", "ò", "ò", "ô", "ô", "ø", "ø", "õ", "õ", "ö", "ö", "÷", "÷", "ù", "ù", "ú", "ú", "û", "û", "ü", "ü", "þ", "þ", "ý", "ý"];
const vniChars=["aâ", "AÂ", "aê", "AÊ", "ñ", "Ñ", "eâ", "EÂ", "oâ", "OÂ", "ô", "Ô", "ö", "Ö", "aù", "AÙ", "aø", "AØ", "aû", "AÛ", "aõ", "AÕ", "aï", "AÏ", "aá", "AÁ", "aà", "AÀ", "aå", "AÅ", "aã", "AÃ", "aä", "AÄ", "aé", "AÉ", "aè", "AÈ", "aú", "AÚ", "aü", "AÜ", "aë", "AË", "eù", "EÙ", "eø", "EØ", "eû", "EÛ", "eõ", "EÕ", "eï", "EÏ", "eá", "EÁ", "eà", "EÀ", "eå", "EÅ", "eã", "EÃ", "eä", "EÄ", "í", "Í", "ì", "Ì", "æ", "Æ", "ó", "Ó", "ò", "Ò", "où", "OÙ", "oø", "OØ", "oû", "OÛ", "oõ", "OÕ", "oï", "OÏ", "oá", "OÁ", "oà", "OÀ", "oå", "OÅ", "oã", "OÃ", "oä", "OÄ", "ôù", "ÔÙ", "ôø", "ÔØ", "ôû", "ÔÛ", "ôõ", "ÔÕ", "ôï", "ÔÏ", "uù", "UÙ", "uø", "UØ", "uû", "UÛ", "uõ", "UÕ", "uï", "UÏ", "öù", "ÖÙ", "öø", "ÖØ", "öû", "ÖÛ", "öõ", "ÖÕ", "öï", "ÖÏ", "yø", "YØ", "yû", "YÛ", "yõ", "YÕ", "î", "Î", "yù", "YÙ"];
function decodeInput(text,encoding=$('inputEncoding').value){
 if(encoding==='unicode')return text.normalize('NFC');
 let codes=encoding==='tcvn3'?tcvnChars:vniChars,map=new Map();codes.forEach((code,i)=>{if(!map.has(code))map.set(code,vietnameseChars[i])});
 let keys=[...map.keys()].sort((a,b)=>b.length-a.length),out='';for(let i=0;i<text.length;){let key=keys.find(k=>text.startsWith(k,i));if(key){out+=map.get(key);i+=key.length}else out+=text[i++]}return out.normalize('NFC');
}
function isTCVNFont(family){return /^(\.vn|tcvn[- _]?vn)/i.test(family)}
// Give a local TCVN3 face a Unicode cmap without altering its outlines.
function adaptTCVNFont(buffer){
 const src=new Uint8Array(buffer),view=new DataView(buffer),count=view.getUint16(4),tables=[];if(view.getUint32(0)===0x74746366)throw Error('Phông TTC cần dùng bản TTF riêng');
 for(let i=0;i<count;i++){let p=12+i*16,tag=String.fromCharCode(...src.slice(p,p+4)),offset=view.getUint32(p+8),length=view.getUint32(p+12);if(offset+length>src.length)throw Error('Tệp phông không hợp lệ');tables.push({tag,data:src.slice(offset,offset+length)})}
 let cmap=tables.find(t=>t.tag==='cmap');if(!cmap)throw Error('Phông thiếu bảng ký tự');let cv=new DataView(cmap.data.buffer),maps=[];
 for(let i=0;i<cv.getUint16(2);i++){let p=4+i*8,platform=cv.getUint16(p),enc=cv.getUint16(p+2),off=cv.getUint32(p+4);if(platform===0||platform===3){let map=new Map(),format=cv.getUint16(off);
  if(format===4){let n=cv.getUint16(off+6)/2,end=off+14,start=end+2*n+2,delta=start+2*n,range=delta+2*n;for(let j=0;j<n;j++){let a=cv.getUint16(start+j*2),b=cv.getUint16(end+j*2),d=cv.getInt16(delta+j*2),r=cv.getUint16(range+j*2);for(let c=a;c<=b&&c<65535;c++){let g;if(!r)g=(c+d)&65535;else{let address=range+j*2+r+(c-a)*2;if(address+2>cmap.data.length)continue;g=cv.getUint16(address);if(g)g=(g+d)&65535}if(g)map.set(c,g)}}}
  else if(format===12){let groups=cv.getUint32(off+12);for(let j=0;j<groups;j++){let p=off+16+j*12,a=cv.getUint32(p),b=Math.min(65534,cv.getUint32(p+4)),g=cv.getUint32(p+8);for(let c=a;c<=b;c++)map.set(c,g+c-a)}}
  if(map.size)maps.push({map,rank:platform===3&&enc===1?0:platform===0?1:2})
 }}maps.sort((a,b)=>a.rank-b.rank);let original=new Map();for(let {map}of maps.reverse())for(let [c,g]of map)original.set(c,g);
 // Some installed .Vn faces have already been converted to Unicode.
 if(vietnameseChars.filter(c=>c.codePointAt(0)>255&&original.has(c.codePointAt(0))).length>70)return buffer;
 let map=new Map(original);for(let [c,g]of original)if(c>=0xf020&&c<=0xf0ff&&!map.has(c-0xf000))map.set(c-0xf000,g);
 vietnameseChars.forEach((c,i)=>{let g=original.get(tcvnChars[i].codePointAt(0))||original.get(0xf000+tcvnChars[i].codePointAt(0));if(g)map.set(c.codePointAt(0),g)});
 let entries=[...map].filter(([c,g])=>c<65535&&g>0).sort((a,b)=>a[0]-b[0]);entries.push([65535,0]);let n=entries.length,len=16+n*8,format=new Uint8Array(len),f=new DataView(format.buffer),power=2**Math.floor(Math.log2(n));f.setUint16(0,4);f.setUint16(2,len);f.setUint16(6,n*2);f.setUint16(8,power*2);f.setUint16(10,Math.log2(power));f.setUint16(12,n*2-power*2);entries.forEach(([c,g],i)=>{f.setUint16(14+2*i,c);f.setUint16(16+2*n+2*i,c);f.setUint16(16+4*n+2*i,(g-c)&65535)});
 let cm=new Uint8Array(20+len),v=new DataView(cm.buffer);v.setUint16(2,2);v.setUint16(4,0);v.setUint16(6,3);v.setUint32(8,20);v.setUint16(12,3);v.setUint16(14,1);v.setUint32(16,20);cm.set(format,20);cmap.data=cm;
 let total=12+count*16;for(let t of tables)total+=(t.data.length+3)&~3;let out=new Uint8Array(total),o=new DataView(out.buffer);out.set(src.slice(0,12));let position=12+count*16,head=0;
 const checksum=data=>{let sum=0;for(let i=0;i<data.length;i+=4)sum=(sum+(((data[i]||0)*16777216)+((data[i+1]||0)<<16)+((data[i+2]||0)<<8)+(data[i+3]||0)))>>>0;return sum};
 tables.forEach((t,i)=>{if(t.tag==='head'){new DataView(t.data.buffer).setUint32(8,0);head=position}let p=12+i*16;out.set([...t.tag].map(c=>c.charCodeAt(0)),p);o.setUint32(p+4,checksum(t.data));o.setUint32(p+8,position);o.setUint32(p+12,t.data.length);out.set(t.data,position);position+=(t.data.length+3)&~3});if(head)o.setUint32(head+8,(0xb1b0afba-checksum(out))>>>0);return out.buffer;
}
function normalizeInsertedText(event){
 if($('inputEncoding').value==='unicode'||!event.data)return;
 const selection=window.getSelection();if(!selection.rangeCount)return;let caret=selection.getRangeAt(0);if(caret.startContainer.nodeType!==Node.TEXT_NODE)return;
 let node=caret.startContainer,end=caret.startOffset,start=Math.max(0,end-event.data.length);if(node.data.slice(start,end)!==event.data)return;
 let converted=decodeInput(event.data);if(converted===event.data)return;node.replaceData(start,end-start,converted);caret.setStart(node,start+converted.length);caret.collapse(true);selection.removeAllRanges();selection.addRange(caret);captureSelection();
}

async function loadComputerFont(family){
 if(loadedFonts.has(family))return loadedFonts.get(family);if(fontLoads.has(family))return fontLoads.get(family);
 let records=fontRecords.get(family);if(!records?.length){if(isTCVNFont(family))fontLoadNotes.set(family,'Cấp quyền đọc phông cho trang để xử lý đúng phông TCVN3 này.');return family;}
 const promise=(async()=>{let alias='ComputerFont'+(++revision),chosen=new Map();
  function classify(r){let style=(r.style+' '+r.fullName).toLowerCase();return {italic:/italic|oblique/.test(style),bold:/bold|black|heavy|semibold|demibold/.test(style),regular:/regular|normal|book|roman/.test(style)}}
  for(let italic of [false,true])for(let bold of [false,true]){let sorted=[...records].sort((a,b)=>{let rank=r=>{let c=classify(r);return (c.italic===italic?0:20)+(c.bold===bold?0:10)+(c.regular&&!bold?0:1)};return rank(a)-rank(b)}),r=sorted[0];chosen.set(r.postscriptName||r.fullName,r)}
  let faces=[];try{for(let r of chosen.values()){let c=classify(r),bytes=await (await r.blob()).arrayBuffer(),face=new FontFace(alias,isTCVNFont(family)?adaptTCVNFont(bytes):bytes,{style:c.italic?'italic':'normal',weight:c.bold?'700':'400'});let timeout;try{await Promise.race([face.load(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Quá thời gian đọc phông')),3000)})])}finally{clearTimeout(timeout)};document.fonts.add(face);faces.push(face)}
   loadedFonts.set(family,alias);fontLoadNotes.delete(family);if(isTCVNFont(family))fontLoadNotes.set(family,'Phông TCVN3 dùng cùng bảng ký tự đã xử lý cho nhập, preview và xuất.');return alias;
  }catch(e){for(let face of faces)document.fonts.delete(face);fontLoadNotes.set(family,'Đang dùng '+family+' trực tiếp qua hệ điều hành vì trình duyệt không đọc được tệp phông.');loadedFonts.set(family,family);return family}
 })();fontLoads.set(family,promise);try{return await promise}finally{fontLoads.delete(family)}
}
async function ensureActiveFonts(){
 let base=$('font').value,lines=editorText().split('\n'),families=new Set([base]);$('temEditor').querySelectorAll('[data-family]').forEach(n=>families.add(n.dataset.family));lines.forEach((_,i)=>{if(lineStyles[i]?.choice)families.add(lineStyles[i].choice)});
 if(hoverFont)families.add(hoverFont.family||base);await Promise.all([...families].filter(Boolean).map(loadComputerFont));await ensureGraphics();
}
function computerFamily(family){return loadedFonts.get(family)||family||'sans-serif'}

function textNodes(root){let walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),out=[],n;while(n=walker.nextNode())out.push(n);return out}
function editorText(){return $('temEditor').innerText.replace(/\r/g,'').replace(/\n$/, '').normalize('NFC')}
function plainHTML(text){let root=document.createElement('div');for(let line of text.split('\n')){let d=document.createElement('div');if(line)d.textContent=line;else d.append(document.createElement('br'));root.append(d)}return root.innerHTML}
function cleanRichHTML(html){let root=document.createElement('div');root.innerHTML=html;let allowed=new Set(['DIV','P','SPAN','B','STRONG','I','EM','U','BR']);for(let n of [...root.querySelectorAll('*')]){if(['SCRIPT','STYLE','IFRAME','OBJECT','IMG','SVG'].includes(n.tagName)){n.remove();continue}if(!allowed.has(n.tagName)){n.replaceWith(...n.childNodes);continue}let style=n.style,values={fontSize:style.fontSize,fontWeight:style.fontWeight,fontStyle:style.fontStyle,textDecoration:style.textDecoration,fontFamily:style.fontFamily},family=n.dataset.family;for(let a of [...n.attributes])n.removeAttribute(a.name);for(let [key,value]of Object.entries(values))if(value)n.style[key]=value;if(family)n.dataset.family=family}return root.innerHTML}
function hasUnderline(node,root){for(let n=node.parentElement;n&&n!==root.parentElement;n=n.parentElement){if(n.style.textDecoration)return n.style.textDecoration.includes('underline');if(n.tagName==='U')return true}return false}
function syncEditorStyle(){let e=$('temEditor');e.dataset.baseFamily=$('font').value;Object.assign(e.style,{fontSize:defaultTextStyle.size*96/72+'px',fontFamily:cssFamily(computerFamily($('font').value)),fontWeight:defaultTextStyle.bold?'700':'400',fontStyle:defaultTextStyle.italic?'italic':'normal',textDecoration:defaultTextStyle.underline?'underline':'none',textAlign:$('align').value,lineHeight:String(1.35*number('spacing',0,2)/1.1)});[...e.children].forEach((n,i)=>{if(n.tagName==='DIV'||n.tagName==='P')n.style.fontFamily=cssFamily(computerFamily(lineStyles[i]?.choice||$('font').value))});e.querySelectorAll('[data-family]').forEach(n=>n.style.fontFamily=cssFamily(computerFamily(n.dataset.family)))}
function captureSelection(){let sel=window.getSelection();if(sel.rangeCount&&$('temEditor').contains(sel.anchorNode)&&$('temEditor').contains(sel.focusNode))savedSelection=sel.getRangeAt(0).cloneRange()}
function selectionOffsets(){if(!savedSelection||!$('temEditor').contains(savedSelection.commonAncestorContainer))return null;let r=document.createRange();r.selectNodeContents($('temEditor'));r.setEnd(savedSelection.startContainer,savedSelection.startOffset);let start=r.toString().length;r.setEnd(savedSelection.endContainer,savedSelection.endOffset);return {start,end:r.toString().length}}
function rangeOffsets(root,offsets){let nodes=textNodes(root),r=document.createRange(),count=0;for(let n of nodes){if(offsets.start>=count&&offsets.start<=count+n.length){r.setStart(n,offsets.start-count);break}count+=n.length}count=0;for(let n of nodes){if(offsets.end>=count&&offsets.end<=count+n.length){r.setEnd(n,offsets.end-count);break}count+=n.length}return r}
function formatOffsets(root,offsets,style,family){if(!offsets||offsets.start===offsets.end)return;let count=0;for(let n of textNodes(root)){let start=Math.max(0,offsets.start-count),end=Math.min(n.length,offsets.end-count),len=n.length;count+=len;if(start>=end)continue;let target=n;if(end<len)n.splitText(end);if(start>0)target=n.splitText(start);let span=document.createElement('span');Object.assign(span.style,style);if(family)span.dataset.family=family;target.replaceWith(span);span.append(target)}}
function applyToolbar(id){
 let offsets=selectionOffsets(),selected=offsets&&offsets.start!==offsets.end,style={},value;
 const wholeLength=textNodes($('temEditor')).reduce((sum,node)=>sum+node.length,0),wholeText=selected&&offsets.start===0&&offsets.end===wholeLength;
 const oldSize=Number(defaultTextStyle.size)||64;
 if(id==='font'){value=$('font').value;style.fontFamily=cssFamily(computerFamily(value))}else if(id==='size'){value=number('size',6,800);style.fontSize=value*96/72+'px'}else{value=$(id).checked;style[id==='bold'?'fontWeight':id==='italic'?'fontStyle':'textDecoration']=id==='bold'?(value?'700':'400'):id==='italic'?(value?'italic':'normal'):(value?'underline':'none')}
 if(selected&&!(id==='size'&&wholeText)){
  let oldFamily=$('temEditor').dataset.baseFamily;if(id==='font'&&oldFamily)$('font').value=oldFamily;formatOffsets($('temEditor'),offsets,style,id==='font'?value:null);savedSelection=rangeOffsets($('temEditor'),offsets);$('temEditor').focus({preventScroll:true});let sel=window.getSelection();sel.removeAllRanges();sel.addRange(savedSelection)
 }else{
  if(id==='font'){lineStyles=lineStyles.map(()=>({choice:'',custom:''}));$('temEditor').querySelectorAll('[data-family]').forEach(n=>{delete n.dataset.family;n.style.fontFamily=''})}
  else{
   defaultTextStyle[id]=value;let property=Object.keys(style)[0];$('temEditor').querySelectorAll('span').forEach(n=>n.style[property]='');
   if(id==='size'&&wholeText)$('temEditor').querySelectorAll('[style]').forEach(n=>n.style.fontSize='');
  }
  if(id==='size'&&$('designKind')?.value==='text'&&oldSize>0&&Number.isFinite(value)){
   const ratio=value/oldSize,current=Math.max(3,Number($('width').value)||12);
   $('width').value=String(Math.max(3,Math.min(textWidthLimit(),current*ratio)));
  }
  if(wholeText&&savedSelection){savedSelection=rangeOffsets($('temEditor'),offsets);const sel=getSelection();sel.removeAllRanges();sel.addRange(savedSelection)}
 }
 updateFontPicker($('font'));$('text').value=editorText();recordHistory();lineControls();preview();
}
function openCaseMenu(focus=false){const menu=$('caseMenu'),button=$('caseButton');closeFontPicker();document.body.append(menu);menu.hidden=false;button.setAttribute('aria-expanded','true');const r=button.getBoundingClientRect(),w=menu.offsetWidth,h=menu.offsetHeight;menu.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left))+'px';menu.style.top=(r.bottom+h+8<=innerHeight?r.bottom+6:Math.max(8,r.top-h-6))+'px';if(focus)menu.firstElementChild.focus()}
function closeCaseMenu(){ $('caseMenu').hidden=true;$('caseButton').setAttribute('aria-expanded','false') }
function changeCase(mode){
 const root=$('temEditor'),nodes=textNodes(root),offsets=selectionOffsets(),selected=offsets&&offsets.start!==offsets.end;
 const limits=selected?offsets:{start:0,end:nodes.reduce((sum,n)=>sum+n.length,0)};
 let count=0,delta=0,wordStart=true,sentenceStart=true,lastBlock=null;
 for(const node of nodes){const length=node.length,start=Math.max(0,limits.start-count),end=Math.min(length,limits.end-count);count+=length;if(start>=end)continue;
  const block=node.parentElement.closest('div,p');if(lastBlock&&lastBlock!==block){wordStart=true;sentenceStart=true}lastBlock=block;
  let converted='';for(const char of node.data.slice(start,end)){const lower=char.toLocaleLowerCase('vi-VN'),upper=char.toLocaleUpperCase('vi-VN'),letter=/\p{L}/u.test(char),word=/[\p{L}\p{M}\p{N}]/u.test(char);
   converted+=mode==='upper'?upper:mode==='lower'?lower:mode==='toggle'?(char===upper?lower:upper):mode==='title'?(wordStart&&letter?upper:lower):(sentenceStart&&letter?upper:lower);
   if(letter)sentenceStart=false;if(/[.!?\n\r]/u.test(char))sentenceStart=true;wordStart=!word;
  }
  delta+=converted.length-(end-start);node.data=node.data.slice(0,start)+converted+node.data.slice(end);
 }
 closeCaseMenu();root.focus({preventScroll:true});const sel=window.getSelection();sel.removeAllRanges();if(selected){savedSelection=rangeOffsets(root,{start:limits.start,end:limits.end+delta});sel.addRange(savedSelection)}else{savedSelection=null;sel.selectAllChildren(root);sel.collapseToEnd()}
 $('text').value=editorText();recordHistory();lineControls();preview();
}
$('caseButton').addEventListener('mousedown',event=>{captureSelection();event.preventDefault()});
$('caseButton').onclick=()=>{const opening=$('caseMenu').hidden;closeCaseMenu();if(opening)openCaseMenu()};
$('caseButton').onkeydown=event=>{if(event.key==='ArrowDown'){event.preventDefault();openCaseMenu(true)}};
$('caseMenu').querySelectorAll('[data-case]').forEach(button=>{button.onmousedown=event=>event.preventDefault();button.onclick=()=>changeCase(button.dataset.case)});
$('caseMenu').onkeydown=event=>{let items=[...$('caseMenu').children],index=items.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();items[event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length].focus()}};
document.addEventListener('mousedown',event=>{if(!event.target.closest('.casePicker')&&!$('caseMenu').contains(event.target))closeCaseMenu()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('caseMenu').hidden){closeCaseMenu();$('caseButton').focus()}});
function recordHistory(){let snapshot=JSON.stringify({html:$('temEditor').innerHTML,defaults:defaultTextStyle,font:$('font').value,lines:lineStyles,colors:Object.fromEntries(['fill','body','edge'].map(id=>[id,$(id).value])),paints:JSON.parse(JSON.stringify(colorStyles)),lockRatio:$('lockRatio').checked,resize:Object.fromEntries(['labelScaleX','labelScaleY','labelX','labelY'].map(id=>[id,$(id).value]))});if(history[historyIndex]===snapshot)return;history.splice(historyIndex+1);history.push(snapshot);if(history.length>80)history.shift();historyIndex=history.length-1}
function restoreHistory(delta){let index=historyIndex+delta;if(index<0||index>=history.length)return;historyIndex=index;let t=JSON.parse(history[index]);$('temEditor').innerHTML=t.html;defaultTextStyle=t.defaults;$('lockRatio').checked=t.lockRatio===true;syncAspectLock();$('font').value=t.font;lineStyles=t.lines;if(t.colors)for(const id of ['fill','body','edge'])$(id).value=t.colors[id];if(t.paints)colorStyles=t.paints;updateColorButtons();for(let id of ['labelScaleX','labelScaleY','labelX','labelY'])$(id).value=t.resize?.[id]??(id.includes('Scale')?'1':'');savedSelection=null;$('text').value=editorText();updateFontPicker($('font'));lineControls();preview()}
function initEditor(){let e=$('temEditor');e.innerHTML=plainHTML('Công ty Hòa Thịnh\nChúc Mừng Sinh Nhật');$('text').value=editorText();lineControls();recordHistory();
 document.addEventListener('selectionchange',()=>{captureSelection();updateFontPicker($('font'));if(document.activeElement!==e||!savedSelection||savedSelection.collapsed)return;let node=savedSelection.startContainer;if(node.nodeType!==Node.TEXT_NODE)node=node.childNodes[savedSelection.startOffset]||node;let element=node.nodeType===Node.TEXT_NODE?node.parentElement:node,style=getComputedStyle(element);$('size').value=Math.round(parseFloat(style.fontSize)*.75*10)/10;$('bold').checked=parseInt(style.fontWeight)>=600;$('italic').checked=style.fontStyle!=='normal';$('underline').checked=hasUnderline(node.nodeType===Node.TEXT_NODE?node:element.firstChild||element,e)});
 e.addEventListener('compositionstart',()=>composing=true);e.addEventListener('compositionend',event=>{composing=false;normalizeInsertedText(event);e.dispatchEvent(new Event('input'))});
 e.addEventListener('input',event=>{if(composing)return;if(event.inputType!=='insertCompositionText')normalizeInsertedText(event);$('text').value=editorText();captureSelection();lineControls();recordHistory();clearTimeout(timer);timer=setTimeout(preview,100)});
 e.addEventListener('paste',event=>{event.preventDefault();let text=decodeInput(event.clipboardData.getData('text/plain'));pasteRetainingStyle(text);e.dispatchEvent(new Event('input'))});
 e.addEventListener('keydown',event=>{
  if(composing||event.isComposing||event.altKey||!(event.ctrlKey||event.metaKey))return;
  const key=event.key.toLowerCase(),bracket=event.code==='BracketRight'||key===']'?1:event.code==='BracketLeft'||key==='['?-1:0,grow=event.shiftKey&&(event.code==='Period'||key==='>'),shrink=event.shiftKey&&(event.code==='Comma'||key==='<');
  if(bracket||grow||shrink){event.preventDefault();captureSelection();if(savedSelection&&!savedSelection.collapsed){let node=savedSelection.startContainer,element=node.nodeType===Node.TEXT_NODE?node.parentElement:node;$('size').value=parseFloat(getComputedStyle(element).fontSize)*.75}else $('size').value=defaultTextStyle.size;
   if(bracket)adjustSize(bracket);else{const steps=[6,8,10,12,14,16,18,20,22,24,26,28,36,48,64,72,96,120,144,168,200,240,300,360,480,600,800],current=number('size',6,800);$('size').value=grow?(steps.find(n=>n>current)||800):([...steps].reverse().find(n=>n<current)||6);applyToolbar('size')}
  }else if(key==='z'){event.preventDefault();restoreHistory(event.shiftKey?1:-1)}else if(key==='y'){event.preventDefault();restoreHistory(1)}else if(['b','i','u'].includes(key)){event.preventDefault();captureSelection();let id={b:'bold',i:'italic',u:'underline'}[key];$(id).checked=!$(id).checked;applyToolbar(id)}
 });
 for(let id of ['sizeUp','sizeDown'])$(id).addEventListener('mousedown',event=>{captureSelection();event.preventDefault()});
}
function layout(){
 syncEditorStyle();let text=editorText();if(text.length>2000||text.split('\n').length>20)throw Error('Tem tối đa 2.000 ký tự và 20 dòng.');
 let pad=number('padding',4,90),border=number('border',0,20),size=defaultTextStyle.size*96/72;
 const mirror=$('temEditor').cloneNode(true);mirror.removeAttribute('id');mirror.removeAttribute('contenteditable');mirror.classList.add('measureEditor');Object.assign(mirror.style,{left:'-30000px',top:'0',transform:'none',width:'max-content',height:'auto',padding:'0',minWidth:'0'});document.body.append(mirror);
 try{
  if(hoverFont){if(hoverFont.line===null&&savedSelection&&!savedSelection.collapsed){formatOffsets(mirror,selectionOffsets(),{fontFamily:cssFamily(computerFamily(hoverFont.family))})}else{let target=hoverFont.line===null?mirror:mirror.children[hoverFont.line];if(target){target.style.fontFamily=cssFamily(computerFamily(hoverFont.family||$('font').value));target.querySelectorAll('[data-family]').forEach(n=>n.style.fontFamily=target.style.fontFamily)}}}
  let nodes=textNodes(mirror),m=cv(1,1).getContext('2d'),maxSize=size;for(let n of nodes)maxSize=Math.max(maxSize,parseFloat(getComputedStyle(n.parentElement).fontSize));
  let margin=pad+border+maxSize*.45+4,natural=mirror.getBoundingClientRect(),width=Math.ceil(Math.max(number('width',3,textWidthLimit())*96/2.54,natural.width+margin*2));mirror.style.width=width+'px';mirror.style.padding=margin+'px';let origin=mirror.getBoundingClientRect(),runs=[],textOffset=0;
  for(let n of nodes){if(!n.textContent)continue;let style=getComputedStyle(n.parentElement),font=style.fontStyle+' '+style.fontWeight+' '+style.fontSize+' '+style.fontFamily,marker=document.createElement('span');Object.assign(marker.style,{display:'inline-block',width:'0',height:'0',padding:'0',margin:'0',verticalAlign:'baseline'});n.after(marker);let range=document.createRange();range.selectNodeContents(n);let rect=range.getBoundingClientRect(),baseline=marker.getBoundingClientRect().top-origin.top;m.font=font;
   runs.push({textStart:textOffset,textEnd:textOffset+n.length,text:n.textContent,font,x:rect.left-origin.left,y:baseline,width:rect.width,size:parseFloat(style.fontSize),underline:hasUnderline(n,mirror)});textOffset+=n.length;marker.remove();
  }
  let height=Math.ceil(Math.max(size*number('spacing',0,2)+margin*2,mirror.getBoundingClientRect().height)),lines=text.split('\n');if(width>12000||height>12000)throw Error('Tem quá lớn. Hãy giảm cỡ chữ hoặc xuống dòng.');
  curveGroups(runs).forEach((line,index)=>line.runs.forEach(run=>run.layerKey='text-'+index));
  return {lines,size,pad,border,margin,width,height,runs,font:runs[0]?.font||getComputedStyle(mirror).font,fonts:runs.map(r=>r.font)};
 }finally{mirror.remove()}
}
function drawText(ctx,L,scale,color){ctx.save();ctx.scale(scale,scale);ctx.fillStyle=color==='fill'?canvasPaint(ctx,'fill',L.width,L.height):color;ctx.textAlign='left';ctx.textBaseline='alphabetic';for(let r of L.runs){ctx.font=r.font;ctx.save();ctx.translate(r.x,r.y);if(r.angle)ctx.rotate(r.angle);ctx.scale(r.scaleX||1,r.scaleY||1);ctx.fillText(r.text,0,0);if(r.underline&&r.text.trim())ctx.fillRect(0,r.size*.1,r.width/(r.scaleX||1),Math.max(1,r.size/22));ctx.restore()}ctx.restore()}
function visibleBounds(data,w,h,mask=false){let left=w,top=h,right=-1,bottom=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(mask?data[y*w+x]:data[(y*w+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}}if(right<left){if(!mask&&['fill','body','edge'].some(id=>colorStyles[id]?.type==='clear'))return {x:0,y:0,width:w,height:h};throw Error('Hãy nhập nội dung tem trước khi xuất.');}return {x:left,y:top,width:right-left+1,height:bottom-top+1}}
function render(high=false,heightScale=1,pageOutput=true){
 let L=layout(),cm=number('width',3,textWidthLimit()),outW=Math.ceil(L.width*(high?Math.min(8,5000/L.width,3500/L.height):Math.min(1,1400/L.width,900/L.height))),outH=Math.max(1,Math.round(outW/L.width*L.height));
 if(outH>13000||outW*outH>40000000)throw Error('Tem quá lớn để xuất 600 DPI. Hãy giảm số dòng hoặc chiều rộng tem.');
 let s=outW/L.width,w=outW,h=outH,text=cv(w,h),tc=text.getContext('2d');drawText(tc,L,s,'#ffffff');let data=tc.getImageData(0,0,w,h).data,alpha=new Uint8Array(w*h);for(let i=0;i<alpha.length;i++)alpha[i]=data[i*4+3]>30?255:0;
 let inner=fillHoles(dilate(alpha,w,h,L.pad*s),w,h),outer=fillHoles(dilate(inner,w,h,L.border*s),w,h);
 let c=cv(outW,outH),ctx=c.getContext('2d');paintLayerStack(ctx,L,s,()=>{if(!isDesign())ctx.drawImage(maskCanvas(inner,w,h,'body'),0,0);ctx.drawImage(maskCanvas(outer.map((v,i)=>Math.max(0,v-inner[i])),w,h,'edge'),0,0);});if(high&&pageOutput){let bounds=visibleBounds(c.getContext('2d').getImageData(0,0,c.width,c.height).data,c.width,c.height),page=previewPage(),result=cv(Math.round(page.width/2.54*600),Math.round(page.height*heightScale/2.54*600));result.getContext('2d').drawImage(c,bounds.x,bounds.y,bounds.width,bounds.height,0,0,result.width,result.height);return {c:result,cm:page.width,heightCm:page.height*heightScale,L}}return {c,cm,heightCm:cm*outH/outW,L};
}
async function preview(){syncPaperWidth();let version=++previewRevision;$('status').textContent='Đang tải phông từ máy…';try{await ensureActiveFonts();if(version!==previewRevision)return;syncAlign();const output=render(),{c,cm,heightCm}=output,L=output.L||layout();$('canvas').width=c.width;$('canvas').height=c.height;$('canvas').getContext('2d').drawImage(c,0,0);let ink=null;try{ink=visibleBounds(c.getContext('2d').getImageData(0,0,c.width,c.height).data,c.width,c.height)}catch{}previewSize={cm,heightCm,L,ink:ink?{x:ink.x/c.width,y:ink.y/c.height,width:ink.width/c.width,height:ink.height/c.height}:null};$('fontNotice').textContent='Phông dùng: '+[...new Set([...L.lines.map((_,i)=>activeFamily(i)),...Array.from($('temEditor').querySelectorAll('[data-family]'),n=>n.dataset.family)])].join(' · ')+' (từ máy tính). '+[...new Set(L.lines.map((_,i)=>fontLoadNotes.get(activeFamily(i))).filter(Boolean))].join(' ');updateFontPicker($('font'));zoom();$('dimensions').textContent=`Kích thước in: ${cm.toFixed(1)} × ${heightCm.toFixed(1)} cm. PNG/SVG phủ kín ${previewPage().name}; Word cao 50% trang, ảnh 600 DPI, không lề.`;$('status').textContent='';}catch(e){if(version!==previewRevision)return;$('canvas').getContext('2d').clearRect(0,0,$('canvas').width,$('canvas').height);$('fontNotice').textContent='';$('dimensions').textContent='Chưa có bản xem trước.';$('status').textContent=e.message}}
function ruler(canvas,length,cm,vertical=false,pageLength=length,origin=0){
 let px=Math.max(1,Math.round(length)),dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round((vertical?24:px)*dpr);canvas.height=Math.round((vertical?px:24)*dpr);canvas.style.width=(vertical?24:px)+'px';canvas.style.height=(vertical?px:24)+'px';let ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.fillStyle='#eef0f3';ctx.fillRect(0,0,vertical?24:px,vertical?px:24);ctx.fillStyle='#fff';if(vertical)ctx.fillRect(0,origin,24,pageLength);else ctx.fillRect(origin,0,pageLength,24);ctx.strokeStyle='#7d766b';ctx.fillStyle='#413a32';ctx.font='10px Arial';ctx.lineWidth=1;let unit=pageLength/cm;
 let first=Math.max(0,Math.floor(-origin/unit*10)),last=Math.min(Math.floor(cm*10),Math.ceil((length-origin)/unit*10));
 for(let tenth=first;tenth<=last;tenth++){let pos=origin+tenth/10*unit,major=tenth%10===0,half=tenth%5===0;if(unit<45&&!major&&!half)continue;let tick=major?12:half?8:4;ctx.beginPath();if(vertical){ctx.moveTo(24,pos);ctx.lineTo(24-tick,pos)}else{ctx.moveTo(pos,24);ctx.lineTo(pos,24-tick)}ctx.stroke();if(major){if(vertical)ctx.fillText(String(tenth/10),1,Math.min(length-2,Math.max(10,pos+4)));else ctx.fillText(String(tenth/10),pos+3,10)}}
}
function previewPage(){return {landscape:{width:29.7,height:21,name:'A4 ngang'},portrait:{width:21,height:29.7,name:'A4 dọc'},'a3-landscape':{width:42,height:29.7,name:'A3 ngang'},'a3-portrait':{width:29.7,height:42,name:'A3 dọc'},'a5-landscape':{width:21,height:14.8,name:'A5 ngang'}}[$('page').value]||{width:29.7,height:21,name:'A4 ngang'}}
function textWidthLimit(){return $('designKind')?.value==='text'?320:previewPage().width-2}
function syncPaperWidth(){const max=textWidthLimit();$('width').max=max;if(+$('width').value>max)$('width').value=max}
function refreshRulers(){if(!previewSize)return;let area=$('previewArea'),stage=$('previewStage'),page=previewPage(),paperRect=stage.getBoundingClientRect(),areaRect=area.getBoundingClientRect();ruler($('rulerTop'),area.clientWidth,page.width,false,paperRect.width,paperRect.left-areaRect.left);ruler($('rulerLeft'),area.clientHeight,page.height,true,paperRect.height,paperRect.top-areaRect.top)}
function zoom(){
 $('zoomValue').textContent=$('zoom').value+'%';if(!previewSize)return;let page=previewPage(),area=$('previewArea'),availableWidth=Math.max(1,(window.TEMHOA_INTERACTION_VIEWPORT?.width??area.clientWidth)-32),availableHeight=Math.max(1,(window.TEMHOA_INTERACTION_VIEWPORT?.height??area.clientHeight)-32),fitWidth=Math.min(availableWidth,availableHeight*page.width/page.height),width=fitWidth*number('zoom',30,150)/100,height=width*page.height/page.width,unit=width/page.width,labelWidth=unit*previewSize.cm*number('labelScaleX',.05,10),labelHeight=unit*previewSize.heightCm*number('labelScaleY',.05,10);
 $('previewStage').style.width=width+'px';$('previewStage').style.height=height+'px';Object.assign($('labelSurface').style,{left:($('labelX').value===''?(width-unit*previewSize.cm)/2:parseFloat($('labelX').value)*unit)+'px',top:($('labelY').value===''?unit:parseFloat($('labelY').value)*unit)+'px',width:labelWidth+'px',height:labelHeight+'px'});$('canvas').style.width=labelWidth+'px';$('canvas').style.height=labelHeight+'px';let L=previewSize.L;Object.assign($('temEditor').style,{width:L.width+'px',height:L.height+'px',padding:L.margin+'px',transform:'scale('+labelWidth/L.width+','+labelHeight/L.height+')'});syncTemDimensions();const ink=previewSize.ink;Object.assign($('selectionFrame').style,{display:ink?'block':'none',left:(ink?ink.x*labelWidth:0)+'px',top:(ink?ink.y*labelHeight:0)+'px',width:(ink?ink.width*labelWidth:0)+'px',height:(ink?ink.height*labelHeight:0)+'px'});updatePreviewBounds(availableWidth,availableHeight,width,height);refreshRulers();
}
function preservePreviewOrigin(area,bounds,x,y){if(x>0)bounds.style.width=Math.max(parseFloat(bounds.style.width)||0,x+area.clientWidth)+'px';if(y>0)bounds.style.height=Math.max(parseFloat(bounds.style.height)||0,y+area.clientHeight)+'px';area.scrollLeft=Math.max(0,x);area.scrollTop=Math.max(0,y)}
// Expand the pasteboard around both the paper and the label, including negative coordinates.
function syncAspectLock(){const locked=$('lockRatio').checked;$('aspectLock').textContent=locked?'🔒 Đã khóa tỷ lệ':'🔓 Tỷ lệ tự do';$('aspectLock').setAttribute('aria-pressed',String(locked));$('aspectLock').title=locked?'Bấm để mở khóa tỷ lệ':'Bấm để khóa tỷ lệ'}
function temDimensions(){const ink=previewSize?.ink;return ink?{width:previewSize.cm*ink.width*number('labelScaleX',.05,10),height:previewSize.heightCm*ink.height*number('labelScaleY',.05,10)}:null}
function syncTemDimensions(){const size=temDimensions();for(const [id,key] of [['temWidth','width'],['temHeight','height']]){$(id).disabled=!size;if(document.activeElement!==$(id))$(id).value=size?Number(size[key].toFixed(2)):''}syncAspectLock()}
function setTemDimension(id){const size=temDimensions(),value=Number($(id).value);if(!size||!Number.isFinite(value)||value<=0){syncTemDimensions();return}recordHistory();const horizontal=id==='temWidth',sx=number('labelScaleX',.05,10),sy=number('labelScaleY',.05,10);let factor=value/(horizontal?size.width:size.height);factor=$('lockRatio').checked?Math.max(Math.max(.05/sx,.05/sy),Math.min(Math.min(10/sx,10/sy),factor)):Math.max(.05/(horizontal?sx:sy),Math.min(10/(horizontal?sx:sy),factor));
 const ink=previewSize.ink;if(horizontal||$('lockRatio').checked){const left=$('labelX').value===''?(previewPage().width-previewSize.cm)/2:Number($('labelX').value);$('labelX').value=left+previewSize.cm*ink.x*sx*(1-factor);$('labelScaleX').value=sx*factor}if(!horizontal||$('lockRatio').checked){const top=$('labelY').value===''?1:Number($('labelY').value);$('labelY').value=top+previewSize.heightCm*ink.y*sy*(1-factor);$('labelScaleY').value=sy*factor}zoom();$(id).value=Number(temDimensions()[horizontal?'width':'height'].toFixed(2));recordHistory()
}
$('aspectLock').onclick=()=>{recordHistory();$('lockRatio').checked=!$('lockRatio').checked;syncAspectLock();recordHistory()};for(const id of ['temWidth','temHeight'])$(id).addEventListener('change',()=>setTemDimension(id));
function updatePreviewBounds(availableWidth,availableHeight,width,height){
 const area=$('previewArea'),stage=$('previewStage'),surface=$('labelSurface'),bounds=$('previewBounds'),center=Math.max(0,(availableWidth-width)/2),x=parseFloat(surface.style.left),y=parseFloat(surface.style.top),w=parseFloat(surface.style.width),h=parseFloat(surface.style.height),left=Math.min(0,center+x-(x<0?8:0)),top=Math.min(0,y-(y<0?8:0)),right=Math.max(availableWidth,center+width,center+x+w+(x+w>width?8:0)),bottom=Math.max(availableHeight,height,y+h+(y+h>height?8:0)),oldLeft=parseFloat(stage.style.left)||0,oldTop=parseFloat(stage.style.top)||0,oldScrollLeft=area.scrollLeft,oldScrollTop=area.scrollTop;
 bounds.style.width=(right-left)+'px';bounds.style.height=(bottom-top)+'px';stage.style.left=(center-left)+'px';stage.style.top=(-top)+'px';
 if(labelDrag||window.TEMHOA_INTERACTION_VIEWPORT){preservePreviewOrigin(area,bounds,oldScrollLeft+center-left-oldLeft,oldScrollTop-top-oldTop)}
}
let labelDrag=null;
for(const axis of ['X','Y','Right','Bottom']){const guide=document.createElement('div');guide.id='snapGuide'+axis;guide.className='snapGuide';guide.setAttribute('aria-hidden','true');$('previewStage').append(guide)}
// Capture paper edges within 6 screen pixels; pull beyond 14 pixels to release.
function edgeSnapState(raw,targets){let target=targets.findIndex(v=>Math.abs(raw-v)<.1);return {last:raw,held:target>=0,target}}
function snapDragEdges(raw,state,targets){
 if(state.held){if(Math.abs(raw-targets[state.target])<=14){state.last=raw;return targets[state.target]}state.held=false;state.target=-1;state.last=raw;return raw}
 let target=-1,distance=Infinity;targets.forEach((value,i)=>{let gap=Math.abs(raw-value);if(gap<distance&&(gap<=6||((state.last-value)*(raw-value)<0&&gap<=14))){target=i;distance=gap}});state.last=raw;if(target>=0){state.held=true;state.target=target;return targets[target]}return raw;
}
function showZeroGuides(){const guides=labelDrag?.guides||{};for(const axis of ['X','Y','Right','Bottom'])$('snapGuide'+axis).style.display=guides[axis]?'block':'none'}
function snapGuides(d,x,y){d.guides={X:d.snapX.held&&d.snapX.target===0&&Math.abs(x)<.1,Right:d.snapX.held&&d.snapX.target===1&&Math.abs(x-(d.direction==='move'?d.pageW-d.w:d.pageW))<.1,Y:d.snapY.held&&d.snapY.target===0&&Math.abs(y)<.1,Bottom:d.snapY.held&&d.snapY.target===1&&Math.abs(y-(d.direction==='move'?d.pageH-d.h:d.pageH))<.1}}
const selectionFrame=document.createElement('div');selectionFrame.id='selectionFrame';$('labelSurface').append(selectionFrame);
for(const direction of ['nw','n','ne','w','e','sw','s','se','move']){
 const handle=document.createElement('button');handle.type='button';handle.className='resizeHandle';handle.dataset.handle=direction;if(direction==='move'){handle.textContent='✥';handle.title='Kéo để di chuyển cả ô tem'}handle.setAttribute('aria-label',direction==='move'?'Di chuyển cả ô tem':'Kéo đổi kích thước '+({nw:'góc trên trái',n:'chiều cao phía trên',ne:'góc trên phải',w:'chiều ngang bên trái',e:'chiều ngang bên phải',sw:'góc dưới trái',s:'chiều cao phía dưới',se:'góc dưới phải'}[direction]));selectionFrame.append(handle);
 handle.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();captureSelection();recordHistory();const rect=selectionFrame.getBoundingClientRect(),full=$('labelSurface').getBoundingClientRect(),page=$('previewStage').getBoundingClientRect();labelDrag={pointer:event.pointerId,x:event.clientX,y:event.clientY,w:rect.width,h:rect.height,left:full.left-page.left,top:full.top-page.top,inkX:rect.left-full.left,inkY:rect.top-full.top,unit:page.width/previewPage().width,sx:number('labelScaleX',.05,10),sy:number('labelScaleY',.05,10),locked:$('lockRatio').checked,pageW:page.width,pageH:page.height,snapX:edgeSnapState((direction==='move'||direction.includes('w')?rect.left:rect.right)-page.left,[0,page.width-(direction==='move'?rect.width:0)]),snapY:edgeSnapState((direction==='move'||direction.includes('n')?rect.top:rect.bottom)-page.top,[0,page.height-(direction==='move'?rect.height:0)]),direction};handle.setPointerCapture(event.pointerId);$('labelSurface').classList.add('resizing')};
 handle.onpointermove=event=>{const d=labelDrag;if(!d||d.pointer!==event.pointerId)return;let dx=event.clientX-d.x,dy=event.clientY-d.y,startX=d.left+d.inkX,startY=d.top+d.inkY;
 if(d.direction==='move'){const x=snapDragEdges(startX+dx,d.snapX,[0,d.pageW-d.w]),y=snapDragEdges(startY+dy,d.snapY,[0,d.pageH-d.h]);$('labelX').value=(x-d.inkX)/d.unit;$('labelY').value=(y-d.inkY)/d.unit;snapGuides(d,x,y);zoom();showZeroGuides();return}
 const horizontal=/[ew]/.test(d.direction),vertical=/[ns]/.test(d.direction),west=d.direction.includes('w'),north=d.direction.includes('n');let w=d.w+(west?-dx:dx),h=d.h+(north?-dy:dy);
 if(d.locked){let factor=horizontal&&vertical?(d.w*(w-d.w)+d.h*(h-d.h))/(d.w*d.w+d.h*d.h)+1:horizontal?w/d.w:h/d.h;const candidates=[];
  if(horizontal){const raw=west?startX+d.w-d.w*factor:startX+d.w*factor,snapped=snapDragEdges(raw,d.snapX,[0,d.pageW]);if(d.snapX.held)candidates.push(west?(startX+d.w-snapped)/d.w:(snapped-startX)/d.w)}
  if(vertical){const raw=north?startY+d.h-d.h*factor:startY+d.h*factor,snapped=snapDragEdges(raw,d.snapY,[0,d.pageH]);if(d.snapY.held)candidates.push(north?(startY+d.h-snapped)/d.h:(snapped-startY)/d.h)}
  if(candidates.length)factor=candidates.reduce((best,value)=>Math.abs(value-factor)<Math.abs(best-factor)?value:best);factor=Math.max(Math.max(.05/d.sx,.05/d.sy),Math.min(Math.min(10/d.sx,10/d.sy),factor));w=d.w*factor;h=d.h*factor;
 }else{
  if(horizontal){const edge=snapDragEdges(west?startX+dx:startX+d.w+dx,d.snapX,[0,d.pageW]);w=west?startX+d.w-edge:edge-startX}if(vertical){const edge=snapDragEdges(north?startY+dy:startY+d.h+dy,d.snapY,[0,d.pageH]);h=north?startY+d.h-edge:edge-startY}
  w=horizontal?Math.max(d.w*.05/d.sx,Math.min(d.w*10/d.sx,w)):d.w;h=vertical?Math.max(d.h*.05/d.sy,Math.min(d.h*10/d.sy,h)):d.h;
 }
 $('labelScaleX').value=d.sx*w/d.w;$('labelScaleY').value=d.sy*h/d.h;$('labelX').value=(d.left+(d.inkX+(west?d.w:0))*(1-w/d.w))/d.unit;$('labelY').value=(d.top+(d.inkY+(north?d.h:0))*(1-h/d.h))/d.unit;
 const edgeX=west?startX+d.w-w:startX+w,edgeY=north?startY+d.h-h:startY+h;snapGuides(d,edgeX,edgeY);if(!horizontal){d.guides.X=false;d.guides.Right=false}if(!vertical){d.guides.Y=false;d.guides.Bottom=false}zoom();showZeroGuides();
 };
 const finish=event=>{if(!labelDrag||labelDrag.pointer!==event.pointerId)return;labelDrag=null;showZeroGuides();$('labelSurface').classList.remove('resizing');refreshRulers();recordHistory()};handle.onpointerup=finish;handle.onpointercancel=finish;handle.onlostpointercapture=finish;
}
$('previewArea').addEventListener('scroll',refreshRulers,{passive:true});
window.addEventListener('resize',zoom);
new ResizeObserver(zoom).observe($('previewArea'));

function activeFamily(index){
 if(hoverFont&&(hoverFont.line===null||hoverFont.line===index))return hoverFont.family||$('font').value;
 return lineStyles[index]?.choice||$('font').value||'sans-serif';
}
function closeFontPicker(){
 if(openFontPicker){openFontPicker.menu.remove();openFontPicker.button.setAttribute('aria-expanded','false');openFontPicker=null}
 if(hoverFont){hoverFont=null;preview()}
}
function nodeFontFamily(node){
 const root=$('temEditor');let element=node.nodeType===Node.TEXT_NODE?node.parentElement:node;
 for(let current=element;current&&current!==root;current=current.parentElement)if(current.dataset.family)return current.dataset.family;
 let top=element;while(top&&top.parentElement!==root&&top!==root)top=top.parentElement;const line=Array.from(root.children).indexOf(top);return line>=0&&['DIV','P'].includes(top.tagName)&&lineStyles[line]?.choice?lineStyles[line].choice:$('font').value;
}
function selectedFontFamily(){
 const root=$('temEditor'),range=savedSelection&&root.contains(savedSelection.commonAncestorContainer)?savedSelection:null;
 if(range?.collapsed){let node=range.startContainer;if(node.nodeType!==Node.TEXT_NODE)node=node.childNodes[Math.min(range.startOffset,Math.max(0,node.childNodes.length-1))]||node;return nodeFontFamily(node)}
 const offsets=range?selectionOffsets():null,families=new Set();let count=0;for(const node of textNodes(root)){const end=count+node.length;if(node.textContent.trim()&&(!offsets||(offsets.start<end&&offsets.end>count)))families.add(nodeFontFamily(node));count=end}return families.size===1?[...families][0]:families.size>1?null:$('font').value;
}
function updateFontPicker(select){
 if(select.pickerButton){const family=select.id==='font'?selectedFontFamily():select.value;select.pickerFamily=family;const option=Array.from(select.options).find(o=>o.value===family);select.pickerButton.textContent=(family===null?'Nhiều phông chữ':option?.textContent||family||'Theo phông trên thanh công cụ')+' ▾'}
}
function enhanceFontSelect(select,line=null){
 if(select.pickerButton){updateFontPicker(select);return}
 let button=document.createElement('button');button.type='button';button.className='fontPickerButton';button.setAttribute('aria-label',line===null?'Chọn phông chữ':'Chọn phông dòng '+(line+1));button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
 select.hidden=true;select.insertAdjacentElement('afterend',button);select.pickerButton=button;updateFontPicker(select);
 button.onclick=()=>{
  if(openFontPicker?.button===button){closeFontPicker();return}closeFontPicker();
  let menu=document.createElement('div');menu.className='fontPickerMenu';let help=document.createElement('div');help.className='fontPickerHelp';help.textContent=fontScanState==='denied'?'Quyền đọc phông bị từ chối; cấp lại trong quyền của trang.':'Rê chuột để xem thử · Bấm để chọn · Esc để hủy';menu.append(help);
  let list=document.createElement('div');list.className='fontPickerList';list.setAttribute('role','listbox');list.setAttribute('aria-label','Danh sách phông chữ');menu.append(list);
  let previousRecent=null;const rows=Array.from(select.options).sort((a,b)=>!a.value?-1:!b.value?1:recentFontRank(a.value)-recentFontRank(b.value)).map(option=>{const recent=recentFontRank(option.value)<12;if(option.value&&recent!==previousRecent){if(recent||previousRecent===true){const heading=document.createElement('div');heading.className='fontPickerSection';heading.textContent=recent?'Đã dùng gần đây':'Các phông khác';list.append(heading);}previousRecent=recent;}let row=document.createElement('button');row.type='button';row.className='fontPickerOption';row.textContent=option.textContent;row.style.fontFamily=cssFamily(option.value||$('font').value);row.setAttribute('role','option');row.setAttribute('aria-selected',String(option.value===(select.id==='font'?select.pickerFamily:select.value)));
   const tryFont=()=>{hoverFont={line,family:option.value};preview()};row.onmouseenter=tryFont;row.onfocus=tryFont;
   row.onclick=()=>{hoverFont=null;rememberRecentFont(option.value);select.value=option.value;closeFontPicker();if(line===null){select.dispatchEvent(new Event('input',{bubbles:true}))}else{select.onchange()}updateFontPicker(select);if(savedSelection&&!savedSelection.collapsed)$('temEditor').focus({preventScroll:true});else button.focus()};list.append(row);return row});
  menu.onmouseleave=()=>{if(hoverFont){hoverFont=null;preview()}};
  menu.onkeydown=e=>{let index=rows.indexOf(document.activeElement);if(e.key==='Escape'){e.preventDefault();closeFontPicker();button.focus()}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();rows[(index+(e.key==='ArrowDown'?1:-1)+rows.length)%rows.length]?.focus()}};
  document.body.append(menu);openFontPicker={menu,button};button.setAttribute('aria-expanded','true');let r=button.getBoundingClientRect();menu.style.width=Math.min(340,window.innerWidth-16)+'px';menu.style.left=Math.max(8,Math.min(r.left,window.innerWidth-menu.offsetWidth-8))+'px';menu.style.top=Math.max(8,Math.min(r.bottom+3,window.innerHeight-menu.offsetHeight-8))+'px';
 };
 button.onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();button.onclick();openFontPicker?.menu.querySelector('button')?.focus()}};
}
document.addEventListener('pointerdown',e=>{if(openFontPicker&&!openFontPicker.menu.contains(e.target)&&!openFontPicker.button.contains(e.target))closeFontPicker()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeFontPicker()});
window.addEventListener('resize',closeFontPicker);

const recentFontStyle=document.createElement('style');recentFontStyle.textContent='.fontPickerSection{font:600 12px Arial,sans-serif;color:var(--ui-muted,#686B73);padding:10px 8px 5px;border-top:1px solid var(--ui-line,#E3E1DA)}';document.head.append(recentFontStyle);
const recentFontKey='TEMhoa_recent_fonts_v1';
function cleanRecentFonts(value){return Array.isArray(value)?[...new Map(value.filter(name=>typeof name==='string'&&name.trim()&&name.length<=200&&!['sans-serif','serif','monospace'].includes(name)).map(name=>[name.toLocaleLowerCase('vi'),name])).values()].slice(0,12):[];}
let recentFonts=[];try{recentFonts=cleanRecentFonts(JSON.parse(localStorage.getItem(recentFontKey)||'[]'));}catch{}
function recentFontRank(name){const index=recentFonts.findIndex(family=>family.toLocaleLowerCase('vi')===name.toLocaleLowerCase('vi'));return index<0?12:index;}
function rememberRecentFont(name){if(!name||['sans-serif','serif','monospace'].includes(name))return;recentFonts=cleanRecentFonts([name,...recentFonts.filter(family=>family.toLocaleLowerCase('vi')!==name.toLocaleLowerCase('vi'))]);try{localStorage.setItem(recentFontKey,JSON.stringify(recentFonts));}catch{}}
function sortComputerFonts(fonts){const rank=name=>/^UTM/i.test(name)?0:/^UVN/i.test(name)?1:2;return [...new Set(fonts)].sort((a,b)=>recentFontRank(a)-recentFontRank(b)||rank(a)-rank(b)||a.localeCompare(b,'vi'));}
function populateFontSelect(select,perLine=false,selected=''){
 select.replaceChildren();function option(parent,value,text){let o=document.createElement('option');o.value=value;o.textContent=text;parent.append(o)}
 if(perLine)option(select,'','Theo phông trên thanh công cụ');
 const available=[...new Set([...machineFonts,...recentFonts])];for(let name of sortComputerFonts(available))option(select,name,machineFonts.includes(name)?name:name+' — chưa tìm thấy trên máy');
 option(select,'sans-serif','Phông mặc định của hệ điều hành');
 if(selected!=='sans-serif'&&selected&&!available.includes(selected))option(select,selected,selected+' — chưa tìm thấy trên máy');
 select.value=selected||(!perLine?(machineFonts.includes('Times New Roman')?'Times New Roman':machineFonts.includes('Arial')?'Arial':machineFonts[0]||'sans-serif'):'');
 updateFontPicker(select);
}

function scanError(e){
 if(e?.name==='NotAllowedError')return 'Quyền đọc phông đã bị từ chối. Có thể cấp lại trong cài đặt quyền của trang; phông hệ thống vẫn dùng được.';
 if(e?.name==='SecurityError')return 'Trình duyệt đang chặn quyền đọc phông cho tệp này. Hãy kiểm tra quyền phông của trang; nếu vẫn bị chặn, cần mở phần mềm qua localhost hoặc HTTPS.';
 return 'Không đọc được danh sách phông: '+(e?.message||'Hãy thử lại bằng Chrome hoặc Edge trên máy tính.');
}
let fontScanState='idle',fontScanNeedsGesture=true;
async function scanComputerFonts({startup=false}={}){
 if(fontScanState==='loading')return;
 if(typeof window.queryLocalFonts!=='function'){fontScanState='unsupported';fontScanNeedsGesture=false;$('scanStatus').textContent='Trình duyệt này chưa hỗ trợ lấy phông trên máy. Hãy mở tệp bằng Chrome hoặc Edge trên máy Mac/Windows. Bạn vẫn có thể xem trước và xuất tệp bằng phông hệ thống.';return}
 fontScanState='loading';$('scanStatus').textContent='Đang đọc danh sách phông…';
 try{
  // Invoke immediately inside the click handler to retain browser user activation.
  const records=await window.queryLocalFonts();
  fontRecords.clear();for(let r of records){if(typeof r.family!=='string'||!r.family.trim())continue;let group=fontRecords.get(r.family)||[];group.push(r);fontRecords.set(r.family,group)}
  machineFonts=sortComputerFonts(records.map(v=>v.family).filter(v=>typeof v==='string'&&v.trim()));
  if(!machineFonts.length){fontScanState='empty';fontScanNeedsGesture=false;$('scanStatus').textContent='Trình duyệt không trả về phông nào. Phông hệ thống vẫn dùng được.';return}
  fontScanState='loaded';fontScanNeedsGesture=false;
  let chosen=$('font').value;populateFontSelect($('font'),false,chosen);lineControls();await preview();
  $('scanStatus').textContent=`Đã nạp ${machineFonts.length} họ phông trên máy. Phông bạn vừa chọn nằm trong nhóm Đã dùng gần đây ở đầu danh sách; các phông khác giữ nhóm UTM, UVN. Chọn tại Phông mặc định hoặc Phông riêng từng dòng. Phông .Vn được xử lý TCVN3 từ tệp phông trên máy. Nên để bộ gõ Unicode; nếu bộ gõ đang dùng TCVN3, chọn đúng Bảng mã bộ gõ.`;
 }catch(e){if(startup&&e?.name==='SecurityError'){fontScanState='waiting';fontScanNeedsGesture=true;$('scanStatus').textContent='Ứng dụng sẽ tự xin quyền đọc phông khi bạn bắt đầu thao tác.';}else{fontScanState=e?.name==='NotAllowedError'?'denied':'error';fontScanNeedsGesture=false;$('scanStatus').textContent=scanError(e);}}
}
document.addEventListener('click',event=>{if(event.isTrusted&&fontScanNeedsGesture&&fontScanState!=='loading')scanComputerFonts();},true);
document.addEventListener('keydown',event=>{if(event.isTrusted&&fontScanNeedsGesture&&fontScanState!=='loading'&&navigator.userActivation?.isActive)scanComputerFonts();},true);

function lineControls(){
 let lines=editorText().split('\n').slice(0,20);lineStyles.length=lines.length;let host=$('lineFonts');host.replaceChildren();
 lines.forEach((line,i)=>{let v=lineStyles[i]||(lineStyles[i]={choice:'',custom:''}),card=document.createElement('div');card.className='lineFontCard';let label=document.createElement('label');label.textContent=`Dòng ${i+1}: ${line.trim().slice(0,35)||'(trống)'}`;card.append(label);let select=document.createElement('select');select.setAttribute('aria-label',`Phông chữ dòng ${i+1}`);
 populateFontSelect(select,true,v.choice);
 select.value=v.choice;card.append(select);
 let custom=document.createElement('input');custom.type='text';custom.placeholder='Tên phông đã cài trên máy';custom.setAttribute('aria-label',`Tên phông riêng dòng ${i+1}`);custom.value=v.custom;custom.hidden=true;card.append(custom);
 select.onchange=()=>{updateFontPicker(select);v.choice=select.value;let block=$('temEditor').children[i];if(block)block.querySelectorAll('[data-family]').forEach(n=>{delete n.dataset.family;n.style.fontFamily='' });v.uploaded='';custom.hidden=true;preview()};custom.oninput=()=>{v.custom=custom.value;v.uploaded='';clearTimeout(timer);timer=setTimeout(preview,180)};host.append(card);enhanceFontSelect(select,i);
 });
}

function download(blob,name){let a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000)}
async function pngBytes(c){
 let blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)throw Error('Không tạo được ảnh. Hãy giảm kích thước tem.');
 let raw=new Uint8Array(await blob.arrayBuffer()),chunk=new Uint8Array(21),v=new DataView(chunk.buffer);v.setUint32(0,9);chunk.set([112,72,89,115],4);v.setUint32(8,23622);v.setUint32(12,23622);chunk[16]=1;v.setUint32(17,crc32(chunk.slice(4,17)));let out=new Uint8Array(raw.length+21);out.set(raw.slice(0,33));out.set(chunk,33);out.set(raw.slice(33),54);return out;
}
// Standard ZIP with stored entries; no network or third-party scripts.
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
function crc32(a){let c=0xffffffff;for(let v of a)c=crcTable[(c^v)&255]^(c>>>8);return(c^0xffffffff)>>>0}
function zip(files){let enc=new TextEncoder(),chunks=[],central=[],offset=0;function header(n){let a=new Uint8Array(n),v=new DataView(a.buffer);return [a,v]}
 for(let [name,value] of Object.entries(files)){let nameB=enc.encode(name),b=typeof value==='string'?enc.encode(value):value,crc=crc32(b),[a,v]=header(30+nameB.length);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,crc,true);v.setUint32(18,b.length,true);v.setUint32(22,b.length,true);v.setUint16(26,nameB.length,true);a.set(nameB,30);chunks.push(a,b);let [d,dv]=header(46+nameB.length);dv.setUint32(0,0x02014b50,true);dv.setUint16(4,20,true);dv.setUint16(6,20,true);dv.setUint16(8,0x800,true);dv.setUint32(16,crc,true);dv.setUint32(20,b.length,true);dv.setUint32(24,b.length,true);dv.setUint16(28,nameB.length,true);dv.setUint32(42,offset,true);d.set(nameB,46);central.push(d);offset+=a.length+b.length;}
 let [end,ev]=header(22),centralSize=central.reduce((n,a)=>n+a.length,0);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,central.length,true);ev.setUint16(10,central.length,true);ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);return new Blob([...chunks,...central,end],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
let exportPNGCache=null;
async function exportPNG(heightScale=1){const key=JSON.stringify([settings(),[...loadedFonts],heightScale]);if(exportPNGCache?.key===key)return exportPNGCache.promise;const entry={key,promise:null};entry.promise=(async()=>{const {c,cm,heightCm}=render(true,heightScale);return {png:await pngBytes(c),cm,heightCm}})();exportPNGCache=entry;try{return await entry.promise}catch(error){if(exportPNGCache===entry)exportPNGCache=null;throw error}}
async function word(){let {png,cm,heightCm}=await exportPNG(),paper=activeOutputPage||previewPage(),land=paper.width>paper.height;let cx=Math.round(cm*360000),cy=Math.round(heightCm*360000);
 let files={
 '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
 '_rels/.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
 'word/_rels/document.xml.rels':'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdImage" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/tem.png"/></Relationships>',
 'word/media/tem.png':png,
 'word/document.xml':`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body><w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0" w:line="1" w:lineRule="exact"/></w:pPr><w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="0" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionV><wp:extent cx="${cx}" cy="${cy}"/><wp:wrapNone/><wp:docPr id="1" name="Tem hoa"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="tem.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImage"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p><w:sectPr><w:pgSz w:w="${Math.round(paper.width/2.54*1440)}" w:h="${Math.round(paper.height/2.54*1440)}"${land?' w:orient="landscape"':''}/><w:pgMar w:top="0" w:right="0" w:bottom="0" w:left="0" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>`};download(zip(files),'Tem-Hoa-Minh-Dien.docx');
}
async function action(fn,message){closeFontPicker();$('status').textContent='Đang tạo tệp…';try{await ensureDocumentFonts();await fn();$('status').textContent=message}catch(e){$('status').textContent=e.message}}
ids.forEach(id=>$(id).addEventListener('input',()=>{if(id==='curveAmount')return;if(['font','size','bold','italic','underline'].includes(id)){applyToolbar(id);return}if(id==='page')syncPaperWidth();clearTimeout(timer);timer=setTimeout(preview,100)}));$('zoom').oninput=zoom;
$('png').onclick=()=>action(async()=>download(new Blob([(await exportPNG()).png],{type:'image/png'}),'Tem-Hoa-Minh-Dien.png'),'Đã tạo ảnh PNG. Kiểm tra thư mục Tải về.');$('word').onclick=()=>action(word,'Đã tạo Word. Kiểm tra thư mục Tải về.');
let currentTemplateName='';
async function templateAPI(query='',payload){
 if(!window.TEMHOA_TOKEN)throw Error('Hãy mở phần mềm bằng Mo-TemHoa-Windows.bat hoặc Mo-TemHoa-Mac.command để dùng thư mục mẫu cố định.');
 let response=await fetch('/api/templates'+query,{method:payload?'POST':'GET',headers:{'X-TemHoa-Token':window.TEMHOA_TOKEN,...(payload?{'Content-Type':'application/json'}:{})},...(payload?{body:JSON.stringify(payload)}:{})});let data=await response.json();if(!response.ok)throw Error(data.error||'Không truy cập được thư mục mẫu.');return data;
}
async function applyTemplate(t){
 if(t.version!==1||!t.settings||typeof t.settings.text!=='string')throw Error('Tệp mẫu không hợp lệ.');
 closeFontPicker();hoverFont=null;clearTimeout(timer);++previewRevision;
 $('lockRatio').checked=false;syncAspectLock();for(let id of ['labelScaleX','labelScaleY','labelX','labelY'])$(id).value=id.includes('Scale')?'1':'';
 for(let id of ids){let v=t.settings[id];if(v!==undefined){if($(id).type==='checkbox')$(id).checked=v===true;else {if(id==='font'&&v!=='custom'&&!Array.from($('font').options).some(o=>o.value===String(v))){let option=document.createElement('option');option.value=String(v);option.textContent=String(v);$('font').append(option)}$(id).value=String(v)}}}
 colorStyles=Object.fromEntries(['fill','body','edge'].map(id=>[id,id==='body'?cloudBodyPaint(t.settings):safePaint(t.settings.colorStyles?.[id])]));updateColorButtons();
 uploadedFont='';defaultTextStyle=t.settings.defaultTextStyle||{size:+$('size').value,bold:$('bold').checked,italic:$('italic').checked,underline:$('underline').checked};$('temEditor').innerHTML=t.settings.richHTML?cleanRichHTML(t.settings.richHTML):plainHTML(t.settings.text);savedSelection=null;
 lineStyles=Array.isArray(t.settings.lineStyles)?t.settings.lineStyles.slice(0,20).map(v=>({choice:typeof v?.choice==='string'?v.choice:'',custom:typeof v?.custom==='string'?v.custom:''})):[];
 $('text').value=editorText();recordHistory();lineControls();updateFontPicker($('font'));$('customFont').hidden=true;await preview();
}
function templateDialog(save){$('templateTitle').textContent=save?'Lưu mẫu':'Mở mẫu';$('templateSavePane').hidden=!save;$('templateConfirm').hidden=!save;$('templateList').hidden=save;$('templateImport').hidden=save;$('templateMessage').textContent='';if(!$('templateDialog').open)$('templateDialog').showModal()}
$('save').onclick=()=>{templateDialog(true);$('templateName').value=currentTemplateName||editorText().split('\n')[0].replace(/[\\/:*?"<>|]/g,'').trim().slice(0,60)||'Tem mới';$('templateName').focus()};
$('templateConfirm').onclick=async()=>{let button=$('templateConfirm');button.disabled=true;try{await ensureDocumentFonts();let t={version:1,settings:settings()};t.thumbnail=await templateThumbnail(t);let data=await templateAPI('',{name:$('templateName').value,template:t});currentTemplateName=data.name;$('templateDialog').close();$('status').textContent='Đã lưu Mau-Tem-Hoa/'+data.name+'.json';}catch(e){$('templateMessage').textContent=e.message}finally{button.disabled=false}};
let templateListRevision=0;
async function templateThumbnail(template){
 if(template.version!==1||!template.settings||typeof template.settings.text!=='string')throw Error('Tệp mẫu không hợp lệ.');
 const docs=Array.isArray(template.settings.labels)&&template.settings.labels.length?template.settings.labels.slice(0,20):[template.settings],families=new Set();
 for(const data of docs){families.add(data.font);for(const line of data.lineStyles||[])if(line.choice)families.add(line.choice);const rich=document.createElement('div');rich.innerHTML=cleanRichHTML(data.richHTML||'');rich.querySelectorAll('[data-family]').forEach(node=>families.add(node.dataset.family))}
 await Promise.all([...families].filter(Boolean).map(loadComputerFont));await ensureGraphics(docs.flatMap(data=>data.decorations||[]));
 const original=oneLabelSettings(),pageValue=$('page').value,offsets=selectionOffsets(),selected=selectedGraphicId,oldHover=hoverFont;
 try{
  $('page').value=template.settings.page||'landscape';const page=previewPage(),unit=640/page.width,result=cv(640,Math.round(page.height*unit)),ctx=result.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,result.width,result.height);
  for(const data of docs){setLabelSettings({...template.settings,...data});if(!editorText().trim()&&!decorations.length)continue;const {c,cm,heightCm}=render(false,1,false),sx=Number(data.labelScaleX||1),sy=Number(data.labelScaleY||1),x=data.labelX===''||data.labelX===undefined?(page.width-cm)/2:Number(data.labelX),y=data.labelY===''||data.labelY===undefined?1:Number(data.labelY);ctx.drawImage(c,x*unit,y*unit,cm*sx*unit,heightCm*sy*unit)}
  return result.toDataURL('image/png');
 }finally{
  $('page').value=pageValue;setLabelSettings(original,true);selectedGraphicId=selected;hoverFont=oldHover;if(offsets)savedSelection=rangeOffsets($('temEditor'),offsets);syncGraphicControls();
 }
}
$('load').onclick=async(event)=>{
 const wordOnly=event?.wordTemplates===true;templateDialog(false);if(wordOnly)$('templateTitle').textContent='Tem thường · Mẫu Word';const revision=++templateListRevision;$('templateList').replaceChildren();$('templateMessage').textContent='Đang đọc thư mục mẫu…';
 try{
  const data=await templateAPI();if(wordOnly)data.names=data.names.filter(name=>name.startsWith('Word-'));if(revision!==templateListRevision||!$('templateDialog').open)return;
  $('templateMessage').textContent=data.names.length?'Chọn hình mẫu để mở.':'Chưa có mẫu. Bấm Lưu mẫu hoặc Nhập mẫu JSON cũ.';
  const cards=data.names.map(name=>{const button=document.createElement('button');button.type='button';button.title='Mở mẫu '+name;const placeholder=document.createElement('span');placeholder.className='templateThumb templateThumbStatus';placeholder.textContent='Đang tải hình mẫu…';const caption=document.createElement('span');caption.className='templateCardName';caption.textContent=name;button.append(placeholder,caption);$('templateList').append(button);return {name,button,placeholder}});
  let cursor=0;
  async function worker(){while(cursor<cards.length&&revision===templateListRevision&&$('templateDialog').open){const card=cards[cursor++];try{const t=await templateAPI('?name='+encodeURIComponent(card.name));if(revision!==templateListRevision||!$('templateDialog').open)return;const src=typeof t.thumbnail==='string'&&/^data:image\/png;base64,[a-zA-Z0-9+/=]+$/.test(t.thumbnail)?t.thumbnail:await templateThumbnail(t);if(revision!==templateListRevision||!$('templateDialog').open)return;const image=document.createElement('img');image.className='templateThumb';image.alt='Xem trước mẫu '+card.name;image.src=src;card.placeholder.replaceWith(image);card.button.onclick=async()=>{card.button.disabled=true;try{++templateListRevision;await applyTemplate(t);currentTemplateName=card.name;beginAutoDocument(card.name,true);$('templateDialog').close()}catch(e){$('templateMessage').textContent=e.message}finally{card.button.disabled=false}}}catch(e){card.placeholder.textContent='Không tải được hình mẫu';card.button.onclick=async()=>{try{++templateListRevision;await applyTemplate(await templateAPI('?name='+encodeURIComponent(card.name)));currentTemplateName=card.name;beginAutoDocument(card.name,true);$('templateDialog').close()}catch(error){$('templateMessage').textContent=error.message}}}}}
  await Promise.all([worker(),worker()]);
 }catch(e){$('templateMessage').textContent=e.message}
};
$('templateCancel').onclick=()=>$('templateDialog').close();$('templateImport').onclick=()=>{$('template').value='';$('template').click()};
$('template').onchange=async()=>{try{let file=$('template').files[0];if(!file)return;await applyTemplate(JSON.parse(await file.text()));currentTemplateName=file.name.replace(/\.json$/i,'');$('templateDialog').close();$('status').textContent='Đã nhập mẫu. Bấm Lưu mẫu để đưa vào thư mục Mau-Tem-Hoa.'}catch(e){$('templateMessage').textContent=e.message;$('status').textContent=e.message}finally{$('template').value=''}};
// Trace closed silhouette contours; holes retain their own subpaths.
function traceContours(mask,w,h){
 const stride=w+1,edges=[],outgoing=new Map();
 function edge(a,b,d){let i=edges.length;edges.push({a,b,d,used:false});let list=outgoing.get(a);if(!list)outgoing.set(a,list=[]);list.push(i)}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let i=y*w+x;if(!mask[i])continue;let a=y*stride+x;
 if(y===0||!mask[i-w])edge(a,a+1,0);
 if(x===w-1||!mask[i+1])edge(a+1,a+stride+1,1);
 if(y===h-1||!mask[i+w])edge(a+stride+1,a+stride,2);
 if(x===0||!mask[i-1])edge(a+stride,a,3);
 }
 const rings=[];
 for(let start=0;start<edges.length;start++){if(edges[start].used)continue;let cur=start,ring=[],steps=0;
 while(true){let e=edges[cur];if(e.used)throw Error('Không khép được đường viền vector.');e.used=true;ring.push([e.a%stride,Math.floor(e.a/stride)]);if(e.b===edges[start].a)break;
 let candidates=(outgoing.get(e.b)||[]).filter(i=>!edges[i].used);if(!candidates.length)throw Error('Đường viền vector bị hở.');
 // At a diagonal touch, keep the contour on the right of the directed edge.
 let priority=[1,0,3,2];candidates.sort((a,b)=>priority.indexOf((edges[a].d-e.d+4)%4)-priority.indexOf((edges[b].d-e.d+4)%4));cur=candidates[0];if(++steps>edges.length)throw Error('Đường viền vector quá phức tạp.');
 }
 if(ring.length>=4)rings.push(ring);
 }
 return rings;
}
function simplifyOpen(points,epsilon){
 if(points.length<3)return points;const keep=new Uint8Array(points.length);keep[0]=keep[points.length-1]=1;const stack=[[0,points.length-1]],limit=epsilon*epsilon;
 while(stack.length){let [a,b]=stack.pop(),p=points[a],q=points[b],dx=q[0]-p[0],dy=q[1]-p[1],den=dx*dx+dy*dy,far=-1,best=limit;
 for(let i=a+1;i<b;i++){let t=den?Math.max(0,Math.min(1,((points[i][0]-p[0])*dx+(points[i][1]-p[1])*dy)/den)):0;let ex=points[i][0]-p[0]-t*dx,ey=points[i][1]-p[1]-t*dy,d=ex*ex+ey*ey;if(d>best){far=i;best=d}}
 if(far>=0){keep[far]=1;stack.push([a,far],[far,b])}}
 return points.filter((_,i)=>keep[i]);
}
function simplifyRing(p,epsilon){let split=1,best=0;for(let i=1;i<p.length;i++){let d=(p[i][0]-p[0][0])**2+(p[i][1]-p[0][1])**2;if(d>best){best=d;split=i}}return [...simplifyOpen(p.slice(0,split+1),epsilon).slice(0,-1),...simplifyOpen([...p.slice(split),p[0]],epsilon).slice(0,-1)]}
function contourPath(mask,w,h,round=false){
 const f=n=>Math.round(n*100)/100;
 return traceContours(mask,w,h).map(raw=>{let p=simplifyRing(raw,round?1:.55);if(p.length<3)p=raw;
 if(!round)return 'M'+p.map(v=>f(v[0])+','+f(v[1])).join('L')+'Z';
 // Short quadratic corners soften raster stair steps on the outer cloud.
 let entries=[],exits=[];for(let i=0;i<p.length;i++){let a=p[(i+p.length-1)%p.length],b=p[i],c=p[(i+1)%p.length],d1=Math.hypot(a[0]-b[0],a[1]-b[1]),d2=Math.hypot(c[0]-b[0],c[1]-b[1]),r=Math.min(2,d1*.2,d2*.2);entries.push([b[0]+(a[0]-b[0])*r/d1,b[1]+(a[1]-b[1])*r/d1]);exits.push([b[0]+(c[0]-b[0])*r/d2,b[1]+(c[1]-b[1])*r/d2])}
 let d=`M${f(exits[p.length-1][0])},${f(exits[p.length-1][1])}`;for(let i=0;i<p.length;i++)d+=`L${f(entries[i][0])},${f(entries[i][1])}Q${f(p[i][0])},${f(p[i][1])} ${f(exits[i][0])},${f(exits[i][1])}`;return d+'Z';
 }).join('');
}
function vectorSVG(){
 let L=layout(),s=Math.min(4,5000/L.width,2600/L.height),w=Math.ceil(L.width*s),h=Math.ceil(L.height*s),c=cv(w,h),ctx=c.getContext('2d');drawText(ctx,L,s,'#ffffff',false);let rgba=ctx.getImageData(0,0,w,h).data;const silhouetteCanvas=cv(w,h);drawText(silhouetteCanvas.getContext('2d'),L,s,'#ffffff');const silhouetteRGBA=silhouetteCanvas.getContext('2d').getImageData(0,0,w,h).data;
 const text=new Uint8Array(w*h),silhouette=new Uint8Array(w*h);for(let i=0;i<text.length;i++){text[i]=rgba[i*4+3]>=128?255:0;silhouette[i]=silhouetteRGBA[i*4+3]>30?255:0}
 let inner=fillHoles(dilate(silhouette,w,h,L.pad*s),w,h),outer=fillHoles(dilate(inner,w,h,L.border*s),w,h),bounds=visibleBounds(outer,w,h,true),page=previewPage();
 const defs=[];const color=id=>{const p=safePaint(colorStyles[id]);if(p.type==='clear')return 'none';if(p.type==='solid')return safeHex($(id).value);let gid='paint-'+id,stops=p.colors.map((c,i)=>`<stop offset="${i*100}%" stop-color="${c}"/>`).join('');if(p.type==='radial')defs.push(`<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${w/2}" cy="${h/2}" r="${Math.hypot(w,h)/2}">${stops}</radialGradient>`);else{const [x1,y1,x2,y2]=gradientPoints(w,h,p.angle);defs.push(`<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient>`)}return `url(#${gid})`};
 let paths=layerStackSVG(L,s,w,h,inner,outer,color);
 return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${page.width}cm" height="${page.height}cm" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}" preserveAspectRatio="none"><title>Tem Hoa Minh Điến</title><desc>Chữ và viền được chuyển thành đường vector từ nét hiển thị. Không cần phông chữ khi mở tệp. Các đường là xấp xỉ biên chữ, không phải đường glyph gốc của phông.</desc>\n<defs>${defs.join('')}</defs>\n${paths}\n</svg>`;
}
$('svg').onclick=()=>action(async()=>{await new Promise(resolve=>requestAnimationFrame(resolve));download(new Blob([vectorSVG()],{type:'image/svg+xml;charset=utf-8'}),'Tem-Hoa-Minh-Dien.svg')},'Đã tạo SVG vector. Chữ đã chuyển thành đường, không cần cài phông khi mở tệp.');

const printDialog=document.createElement('dialog');printDialog.id='printDialog';printDialog.className='printDialog';printDialog.innerHTML=`<h2>In tem hoa</h2><div class="printLayout"><div class="printControls"><label for="printPrinter">Máy in</label><div class="printOptions"><select id="printPrinter" aria-label="Máy in"><option value="">Chọn trong hộp thoại in</option></select><button id="printerProperties" type="button" class="smallButton" disabled>Properties</button></div><p id="printSizeInfo"></p><label for="printCopies">Số bản</label><input id="printCopies" type="number" min="1" max="99" step="1" value="1"><label for="printColor">Chế độ màu</label><select id="printColor"><option value="color">In màu</option><option value="gray">Trắng đen</option></select><p>Ảnh 600 DPI · bảo vệ viền sát mép 0,3 mm. Giữ kích thước nếu vùng in đủ rộng; chỉ thu nhỏ khi cần.</p><p id="printDriverHelp"></p><p id="printMessage" role="status"></p></div><div class="printPagePreview"><canvas id="printPreviewCanvas"></canvas></div></div><div class="printActions"><button id="cancelPrint" type="button">Hủy</button><button id="confirmPrint" type="button" class="exportWord">In…</button></div>`;document.body.append(printDialog);
const printSheet=document.createElement('div');printSheet.id='printSheet';document.body.append(printSheet);const printStyle=document.createElement('style');document.head.append(printStyle);let printBusy=false,printPageCanvas=null,printSnapshot=null;
async function printerAPI(route,payload){const response=await fetch('/api/'+route,{method:payload?'POST':'GET',headers:{'X-TemHoa-Token':window.TEMHOA_TOKEN||'',...(payload?{'Content-Type':'application/json'}:{})},...(payload?{body:JSON.stringify(payload)}:{})});const data=await response.json();if(!response.ok)throw Error(data.error||'Không truy cập được máy in.');return data}
// Fit the complete outer outline, including antialiased pixels, inside the print area.
function fitPrintInk(rect,area){const scale=Math.min(1,area.width/rect.width,area.height/rect.height),width=rect.width*scale,height=rect.height*scale;return {x:Math.max(area.x,Math.min(rect.x,area.x+area.width-width)),y:Math.max(area.y,Math.min(rect.y,area.y+area.height-height)),width,height,scale}}
const printEdgeDefaults={top:1.6,right:1,bottom:.3,left:.3};
const printEdgePane=document.createElement('fieldset');printEdgePane.style.cssText='margin:10px 0;padding:8px;border:1px solid #ced8e4';printEdgePane.innerHTML='<legend>Bảo vệ mép khi in (mm)</legend><div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">'+Object.entries({top:'Trên',right:'Phải',bottom:'Dưới',left:'Trái'}).map(([side,name])=>`<label>${name}<input id="printEdge-${side}" type="number" min="0" max="10" step="0.1" value="${printEdgeDefaults[side]}" style="width:100%"></label>`).join('')+'</div><p style="font-size:12px;margin:7px 0 0">Ưu tiên giữ đủ viền ở góc trên phải. Tăng từng mép 0,2–0,5 mm nếu còn lẹm; đặt 0 để sát nhất.</p>';
$('printColor').after(printEdgePane);
printEdgePane.nextElementSibling.textContent='Toàn bộ bố cục được đổi tỷ lệ theo khổ giấy bản in. Bảo vệ mép chỉ áp dụng khi bật tùy chọn.';
try{const saved=JSON.parse(localStorage.getItem('temhoa-print-edges')||'null');if(saved?.top===1&&saved?.right===1&&saved?.bottom===.3&&saved?.left===.3){saved.top=printEdgeDefaults.top;localStorage.setItem('temhoa-print-edges',JSON.stringify(saved))}if(saved)for(const side in printEdgeDefaults)if(Number.isFinite(saved[side])&&saved[side]>=0&&saved[side]<=10)$('printEdge-'+side).value=saved[side]}catch{}
function printEdges(){return Object.fromEntries(Object.entries(printEdgeDefaults).map(([side,fallback])=>{const value=$('printEdge-'+side).valueAsNumber;return [side,Number.isFinite(value)?Math.max(0,Math.min(10,value)):fallback]}))}
function printSafeArea(page){const edges=printEdges();return {x:edges.left/10,y:edges.top/10,width:page.width-(edges.left+edges.right)/10,height:page.height-(edges.top+edges.bottom)/10}}
for(const side in printEdgeDefaults)$('printEdge-'+side).onchange=()=>{try{const edges=printEdges();for(const key in edges)$('printEdge-'+key).value=edges[key];try{localStorage.setItem('temhoa-print-edges',JSON.stringify(edges))}catch{}if(printPageCanvas){printPageCanvas=renderPrintPage();updatePrintPreview()}$('printMessage').textContent='Đã cập nhật khoảng bảo vệ mép bản in.'}catch(error){$('printMessage').textContent=error.message}};
function renderPrintPage(gray=false){
 const page=previewPage(),{c,cm,heightCm}=render(true,1,false),result=cv(Math.round(page.width/2.54*600),Math.round(page.height/2.54*600)),ctx=result.getContext('2d'),unit=600/2.54,sx=number('labelScaleX',.05,10),sy=number('labelScaleY',.05,10),x=$('labelX').value===''?(page.width-cm)/2:Number($('labelX').value),y=$('labelY').value===''?1:Number($('labelY').value);
 const ink=visibleBounds(c.getContext('2d').getImageData(0,0,c.width,c.height).data,c.width,c.height),left=Math.max(0,ink.x-2),top=Math.max(0,ink.y-2),right=Math.min(c.width,ink.x+ink.width+2),bottom=Math.min(c.height,ink.y+ink.height+2),source={x:left,y:top,width:right-left,height:bottom-top},raw={x:x+left/c.width*cm*sx,y:y+top/c.height*heightCm*sy,width:source.width/c.width*cm*sx,height:source.height/c.height*heightCm*sy},guard=.03;
 const fitted=fitPrintInk(raw,printSafeArea(page));
 ctx.fillStyle='#fff';ctx.fillRect(0,0,result.width,result.height);if(gray)ctx.filter='grayscale(1)';ctx.drawImage(c,source.x,source.y,source.width,source.height,fitted.x*unit,fitted.y*unit,fitted.width*unit,fitted.height*unit);
 // Integer source bounds include interpolation pixels; the native driver checks these again.
 const px=Math.max(0,Math.floor(fitted.x*unit)-1),py=Math.max(0,Math.floor(fitted.y*unit)-1);result.printInk={x:px,y:py,width:Math.min(result.width,Math.ceil((fitted.x+fitted.width)*unit)+1)-px,height:Math.min(result.height,Math.ceil((fitted.y+fitted.height)*unit)+1)-py};result.printFit=fitted;return result;
}
function updatePrintPreview(){if(!printPageCanvas)return;const c=$('printPreviewCanvas'),page=printSnapshot?.page||previewPage();c.width=Math.round(500*page.width/Math.max(page.width,page.height));c.height=Math.round(500*page.height/Math.max(page.width,page.height));const ctx=c.getContext('2d');ctx.filter=$('printColor').value==='gray'?'grayscale(1)':'none';ctx.drawImage(printPageCanvas,0,0,c.width,c.height)}
async function openPrint(){if(printBusy||printDialog.open)return;printBusy=true;$('print').disabled=true;try{closeFontPicker();captureSelection();$('printOutputPaper').value=sourcePaperName();$('printOutputDpi').value='300';await ensureDocumentFonts();printPageCanvas=renderPrintPage();printSnapshot={page:outputPaperDimensions($('printOutputPaper').value),dimensions:temDimensions()};$('printMessage').textContent='';$('printColor').value='color';const page=printSnapshot.page,size=printSnapshot.dimensions;$('printSizeInfo').textContent=`${page.name}: ${page.width} × ${page.height} cm. ${labels.length>1?labels.length+' tem trên trang':'Tem cả viền: '+size.width.toFixed(2)+' × '+size.height.toFixed(2)+' cm'}.`;updatePrintPreview();$('printPrinter').replaceChildren(new Option('Chọn trong hộp thoại in',''));$('printerProperties').disabled=true;
 $('printDriverHelp').textContent='Trong hộp thoại in, chọn đúng khổ giấy, tỷ lệ 100%, không lề và tắt đầu/chân trang. Muốn in sát mép, chọn Borderless và tắt mở rộng ảnh (Expansion) trong driver.';
 if(window.TEMHOA_NATIVE_PRINT){try{const data=await printerAPI('printers');for(const name of data.names)$('printPrinter').append(new Option(name,name));$('printPrinter').value=data.default||data.names[0]||'';$('printerProperties').disabled=!$('printPrinter').value;$('printDriverHelp').textContent='Properties: chọn giấy đang dùng, Color, chất lượng cao. In sát mép: Borderless và Expansion = 0 / Off. Tem được dịch vào vùng in thực tế để giữ viền; chỉ thu nhỏ nếu không đủ chỗ.'}catch(error){$('printMessage').textContent=error.message+' Có thể dùng hộp thoại in của trình duyệt.'}}
 refreshOutputPrint();printDialog.showModal();
 }catch(error){$('status').textContent=error.message}finally{printBusy=false;$('print').disabled=false}}
$('print').onclick=openPrint;$('cancelPrint').onclick=()=>printDialog.close();$('printColor').onchange=updatePrintPreview;$('printPrinter').onchange=()=>{$('printerProperties').disabled=!window.TEMHOA_NATIVE_PRINT||!$('printPrinter').value};$('printerProperties').onclick=async()=>{try{await printerAPI('printer-properties',{printer:$('printPrinter').value});$('printMessage').textContent='Đã mở Properties của máy in được chọn.'}catch(error){$('printMessage').textContent=error.message}};
$('confirmPrint').onclick=async()=>{const button=$('confirmPrint');button.disabled=true;try{if(!printPageCanvas||!printSnapshot)throw Error('Chưa có trang để in.');const page=printSnapshot.page;let output=printPageCanvas;if($('printColor').value==='gray'){output=cv(printPageCanvas.width,printPageCanvas.height);const ctx=output.getContext('2d');ctx.filter='grayscale(1)';ctx.drawImage(printPageCanvas,0,0)}
 if(window.TEMHOA_NATIVE_PRINT&&$('printPrinter').value){$('printMessage').textContent='Đang gửi lệnh in…';await printerAPI('print',{printer:$('printPrinter').value,widthCm:page.width,heightCm:page.height,color:$('printColor').value==='color',copies:Math.max(1,Math.min(99,Math.round(Number($('printCopies').value)||1))),edges:$('printProtectEdges').checked?printEdges():{top:0,right:0,bottom:0,left:0},ink:printPageCanvas.printInk,png:output.toDataURL('image/png').split(',')[1]});$('printMessage').textContent='Đã chuyển lệnh in tới Windows.'}
 else{printSheet.replaceChildren();const c=cv(output.width,output.height);c.getContext('2d').drawImage(output,0,0);printSheet.append(c);printSheet.style.width=page.width+'cm';printSheet.style.height=page.height+'cm';printStyle.textContent=`@page{size:${page.width}cm ${page.height}cm;margin:0}`;printDialog.close();await new Promise(resolve=>requestAnimationFrame(resolve));window.print()}
 }catch(error){$('printMessage').textContent=error.message}finally{button.disabled=false}};
document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&!event.altKey&&event.key.toLowerCase()==='p'){event.preventDefault();openPrint()}});
window.addEventListener('afterprint',()=>{printSheet.replaceChildren();printStyle.textContent=''});

/* TEMhoa AI1: glyph-ink aware bounds guard for the existing classic-script renderer.
   The editor's document units are CSS pixels. These bounds are also CSS pixels:
   do NOT multiply by zoom / DPR here. The canvas renderer applies output scale. */
(function (root) {
  'use strict';
  const MIN_SAFE_INSET = 2;
  const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  function inkBounds(ctx, run, effects = {}) {
    if (!run || !run.text) return null;
    ctx.save();
    let m;
    try {
      ctx.font = run.font || `${finite(run.size, 16)}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      m = ctx.measureText(String(run.text));
    } finally {
      ctx.restore();
    }
    // actualBoundingBoxLeft is the distance to the *left* of the anchor.
    // It may be negative for fonts with substantial rightward side-bearing.
    let left = -finite(m.actualBoundingBoxLeft, 0);
    let right = finite(m.actualBoundingBoxRight, finite(m.width, finite(run.width, 0)));
    let top = -finite(m.actualBoundingBoxAscent, finite(run.size, 16));
    let bottom = finite(m.actualBoundingBoxDescent, finite(run.size, 16) * .3);
    if (run.underline && String(run.text).trim()) {
      right = Math.max(right, finite(run.width, finite(m.width, 0)) / Math.max(0.001, finite(run.scaleX, 1)));
      bottom = Math.max(bottom, finite(run.size, 16) * .1 + Math.max(1, finite(run.size, 16) / 22));
    }
    // Reserve genuine stroke/shadow overflow without removing either effect.
    const stroke = Math.max(0, finite(effects.strokeWidth, finite(run.strokeWidth, 0))) / 2;
    const blur = Math.max(0, finite(effects.shadowBlur, finite(run.shadowBlur, 0))) * 1.5;
    const shadowX = finite(effects.shadowOffsetX, finite(run.shadowOffsetX, 0));
    const shadowY = finite(effects.shadowOffsetY, finite(run.shadowOffsetY, 0));
    left -= stroke + blur + Math.max(0, -shadowX);
    right += stroke + blur + Math.max(0, shadowX);
    top -= stroke + blur + Math.max(0, -shadowY);
    bottom += stroke + blur + Math.max(0, shadowY);
    const sx = finite(run.scaleX, 1), sy = finite(run.scaleY, 1);
    const angle = finite(run.angle, 0), c = Math.cos(angle), s = Math.sin(angle);
    const x = finite(run.x, 0), y = finite(run.y, 0);
    const corners = [[left, top], [right, top], [left, bottom], [right, bottom]];
    const xs = [], ys = [];
    for (const [px, py] of corners) {
      const xx = px * sx, yy = py * sy;
      xs.push(x + c * xx - s * yy);
      ys.push(y + s * xx + c * yy);
    }
    return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
  }

  function protectLayout(ctx, layout, effects = {}) {
    if (!layout || !Array.isArray(layout.runs) || !layout.runs.length) return layout;
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const run of layout.runs) {
      const rect = inkBounds(ctx, run, effects);
      if (!rect) continue;
      left = Math.min(left, rect.left);
      top = Math.min(top, rect.top);
      right = Math.max(right, rect.right);
      bottom = Math.max(bottom, rect.bottom);
    }
    // Graphics live in the same local coordinates as the text. Account for them
    // before shifting the origin so an image near the opposite edge cannot clip.
    for (const g of layout.graphics || []) {
      if (![g.x, g.y, g.width, g.height].every(v => Number.isFinite(Number(v)))) continue;
      const gx = Number(g.x), gy = Number(g.y);
      const hw = Math.abs(Number(g.width)) / 2, hh = Math.abs(Number(g.height)) / 2;
      const theta = finite(g.angle, 0) * Math.PI / 180, cos = Math.cos(theta), sin = Math.sin(theta);
      for (const [cx, cy] of [[-hw,-hh],[hw,-hh],[-hw,hh],[hw,hh]]) {
        const px = gx + cx * cos - cy * sin, py = gy + cx * sin + cy * cos;
        left = Math.min(left, px); top = Math.min(top, py);
        right = Math.max(right, px); bottom = Math.max(bottom, py);
      }
    }
    if (!Number.isFinite(left)) return layout;
    // The host maps layout.width to a fixed physical width. Never silently grow
    // that width when installed in the production editor: doing so shrinks text
    // on the printed page. Move only when the original logical content is inside
    // the page and its actual ink fits after a small origin adjustment.
    const inset = Math.max(MIN_SAFE_INSET, finite(effects.safeInset, MIN_SAFE_INSET));
    if (effects.preserveCanvas) {
      const w = finite(layout.width, 0), h = finite(layout.height, 0);
      const inside = layout.runs.every(run =>
        finite(run.x, -Infinity) >= 0 && finite(run.x, Infinity) + finite(run.width, 0) <= w &&
        finite(run.y, -Infinity) >= 0 && finite(run.y, Infinity) <= h);
      if (!inside) return layout; // User deliberately placed text across page boundary.
      const minX = inset - left, maxX = w - inset - right;
      const minY = inset - top, maxY = h - inset - bottom;
      if (minX > maxX || minY > maxY) return layout; // Needs a host-level page-size decision.
      const dx = Math.max(minX, Math.min(0, maxX));
      const dy = Math.max(minY, Math.min(0, maxY));
      if (!dx && !dy) return layout;
      const move = item => ({...item, x:finite(item.x,0)+dx, y:finite(item.y,0)+dy});
      return {
        ...layout, runs:layout.runs.map(move),
        graphics:Array.isArray(layout.graphics) ? layout.graphics.map(move) : layout.graphics,
        offsetX:finite(layout.offsetX,0)+dx, offsetY:finite(layout.offsetY,0)+dy,
        graphicOffsetX:finite(layout.graphicOffsetX,finite(layout.offsetX,0))+dx,
        graphicOffsetY:finite(layout.graphicOffsetY,finite(layout.offsetY,0))+dy,
        inkPadding:{left:dx,top:dy,right:0,bottom:0}
      };
    }
    // Pixels near the bitmap edge can be removed by antialiasing/raster rounding.
    const addLeft = Math.max(0, Math.ceil(inset - left));
    const addTop = Math.max(0, Math.ceil(inset - top));
    const addRight = Math.max(0, Math.ceil(right + inset - finite(layout.width, 0)));
    const addBottom = Math.max(0, Math.ceil(bottom + inset - finite(layout.height, 0)));
    if (!addLeft && !addTop && !addRight && !addBottom) return layout;
    const width = Math.ceil(finite(layout.width, 0)) + addLeft + addRight;
    const height = Math.ceil(finite(layout.height, 0)) + addTop + addBottom;
    if (width > 12000 || height > 12000) {
      throw new RangeError('Text ink bounds exceed the existing 12000px editor limit');
    }
    const move = item => ({ ...item, x: finite(item.x, 0) + addLeft, y: finite(item.y, 0) + addTop });
    return {
      ...layout, width, height,
      runs: layout.runs.map(move),
      graphics: Array.isArray(layout.graphics) ? layout.graphics.map(move) : layout.graphics,
      offsetX: finite(layout.offsetX, 0) + addLeft,
      offsetY: finite(layout.offsetY, 0) + addTop,
      graphicOffsetX: finite(layout.graphicOffsetX, finite(layout.offsetX, 0)) + addLeft,
      graphicOffsetY: finite(layout.graphicOffsetY, finite(layout.offsetY, 0)) + addTop,
      inkPadding: {left: addLeft, top: addTop, right: addRight, bottom: addBottom}
    };
  }

  // Called only after the host app has defined its final layout() wrapper.
  // Do not patch drawText / preview / editor selection / export independently:
  // all those paths already consume the same layout() contract.
  function install(target = root) {
    if (typeof target.layout !== 'function' || !target.document) return false;
    if (target.layout.temhoaInkBoundsGuard) return true;
    const previous = target.layout;
    // One tiny measurement context per editor; never allocate a canvas per preview.
    const context = target.document.createElement('canvas').getContext('2d');
    const guarded = function (...args) {
      const result = previous.apply(this, args);
      return context ? protectLayout(context, result, {preserveCanvas:true}) : result;
    };
    guarded.temhoaInkBoundsGuard = true;
    target.layout = guarded;
    return true;
  }
  const api = {inkBounds, protectLayout, install};
  root.TEMHOA_TEXT_INK = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  // Classic-script modules are loaded in order; wait until the final layout()
  // wrapper from the host editor has been declared before instrumenting it.
  if (root.document) {
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', () => install(root), {once:true});
    } else install(root);
  }
})(typeof window !== 'undefined' ? window : globalThis);
