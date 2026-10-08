'use strict';
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.TEMHOA_CHROMIUM?{executablePath:process.env.TEMHOA_CHROMIUM}:{})});
 try{
  const page=await browser.newPage({viewport:{width:900,height:700}});
  await page.goto('about:blank');
  await page.evaluate(()=>{window.layout=()=>({width:100,height:80,runs:[{text:'Chúc Mừng',font:'italic 85px Georgia',x:-12,y:78,size:85}]})});
  await page.addScriptTag({path:path.resolve(__dirname,'../editor-render.js')});
  const value=await page.evaluate(()=>{
    const first=window.layout;
    const layout=window.layout();
    const installed=window.TEMHOA_TEXT_INK.install(window);
    return {installed,once:first===window.layout,guarded:!!window.layout.temhoaInkBoundsGuard,
      originalX:-12,newX:layout.runs[0].x,width:layout.width,padding:layout.inkPadding};
  });
  assert.ok(value.installed&&value.once&&value.guarded&&value.newX>value.originalX&&value.width>100&&value.padding.left>0,JSON.stringify(value));
  console.log('PASS installer prevents double wrap and repairs negative glyph bounds',JSON.stringify(value));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
