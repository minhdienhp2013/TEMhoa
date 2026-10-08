'use strict';
// Real-editor test to run after AI5 loads editor-render.js as the last classic script.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.TEMHOA_CHROMIUM?{executablePath:process.env.TEMHOA_CHROMIUM}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../TemHoa-MinhDien.html')).href);
  await page.evaluate(async()=>{
   if(!window.TEMHOA_TEXT_INK || !layout.temhoaInkBoundsGuard)throw Error('AI5: load editor-render.js after all layout() wrappers in TemHoa-MinhDien.html');
   await createBlankDesign(false);
   await newDesignText('<div>Chúc Mừng</div><div>Sinh Nhật</div>',null,{x:4,y:4,width:12});
   await selectLayerUnit(activeLabelId,'text-box',false,false);
  });
  let rasterCases=0;
  for(const font of ['Arial','Georgia'])for(const size of [64,180,320]){
   await page.evaluate(async({font,size})=>{
    $('font').value=font;$('size').value=String(size);savedSelection=null;
    applyToolbar('font');applyToolbar('size');await preview();saveActiveLabel(true);
   },{font,size});
   for(const align of ['left','center','right'])for(const zoomValue of [50,100,140]){
    const state=await page.evaluate(async({align,zoomValue})=>{
     $('align').value=align;$('zoom').value=String(zoomValue);await preview();zoom();
     const L=previewSize.L;
     const safe=L.runs.every(r=>r.x>=0&&r.y>=0&&r.x+r.width<=L.width&&r.y<=L.height);
     if(!safe)return {logicalInside:false};
     const pad=300,bounded=document.createElement('canvas'),ref=document.createElement('canvas');
     bounded.width=L.width;bounded.height=L.height;ref.width=L.width+2*pad;ref.height=L.height+2*pad;
     textOnlyDraw(bounded.getContext('2d'),L,1,'#fff');
     const rc=ref.getContext('2d');rc.translate(pad,pad);textOnlyDraw(rc,L,1,'#fff');
     const sum=c=>{const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let a=0;for(let i=3;i<data.length;i+=4)a+=data[i];return a};
     return {logicalInside:true,ink:sum(bounded),reference:sum(ref),units:layerUnits(L).filter(u=>u.kind==='text').map(u=>u.key),runs:L.runs.length};
    },{align,zoomValue});
    if(state.logicalInside){rasterCases++;
     assert.deepEqual(state.units,['text-box']);assert.ok(state.runs>=2);
     assert.ok(state.ink>=state.reference*.995,JSON.stringify({font,size,align,zoomValue,...state}));
    }
   }
  }
  assert.equal(rasterCases,54,'every font/size/align/zoom variant must reach pixel assertion');
  await page.locator('#labelSurface').hover();
  const handle=page.locator('.resizeHandle[data-handle=se]'),rect=await handle.boundingBox();
  assert.ok(rect,'text resize handle must exist');
  await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();
  await page.mouse.move(rect.x+rect.width/2+100,rect.y+rect.height/2+50,{steps:25});await page.mouse.up();
  await page.waitForTimeout(200);await page.evaluate(async()=>{await preview();saveActiveLabel(true)});
  const resized=await page.evaluate(()=>({width:previewSize.L.width,height:previewSize.L.height,size:Number($('size').value),layers:layerUnits(previewSize.L).filter(u=>u.kind==='text').length}));
  assert.equal(resized.layers,1);assert.ok(resized.width>0&&resized.height>0);assert.deepEqual(errors,[]);
  console.log('PASS real TEMhoa ink regression: Vietnamese font/align/zoom/resize/DPR',JSON.stringify(resized));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});