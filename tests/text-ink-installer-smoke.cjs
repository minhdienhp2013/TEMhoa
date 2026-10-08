'use strict';
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.TEMHOA_CHROMIUM?{executablePath:process.env.TEMHOA_CHROMIUM}:{}),args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:900,height:700}});
  await page.goto('about:blank');
  await page.evaluate(()=>{window.layout=()=>({width:500,height:160,runs:[{text:'Chúc Mừng',font:'italic 85px Georgia',x:1,y:55,size:85,width:402.84}]})});
  await page.addScriptTag({content:require('node:fs').readFileSync(path.resolve(__dirname,'../editor-render.js'),'utf8').split('/* TEMhoa AI1:')[1].replace(/^/, '/* TEMhoa AI1:')});
  const state=await page.evaluate(()=>{
   const first=window.layout, fixed=window.layout();
   const installed=window.TEMHOA_TEXT_INK.install(window);
   const intentionallyOutside={width:100,height:80,runs:[{text:'Chúc Mừng',font:'italic 85px Georgia',x:-12,y:78,size:85,width:402}]};
   const clipped=window.TEMHOA_TEXT_INK.protectLayout(document.createElement('canvas').getContext('2d'),intentionallyOutside,{preserveCanvas:true});
   const nearEdge={width:500,height:160,runs:[{text:'Chúc Mừng',font:'italic 85px Georgia',x:1,y:55,size:85,width:402.84}],graphics:[{x:480,y:145,width:40,height:30,angle:0}]};
   const graphics=window.TEMHOA_TEXT_INK.protectLayout(document.createElement('canvas').getContext('2d'),nearEdge,{preserveCanvas:true});
   return {installed,once:first===window.layout,guarded:!!first.temhoaInkBoundsGuard,oldY:55,newY:fixed.runs[0].y,width:fixed.width,height:fixed.height,clipped:clipped===intentionallyOutside,graphicsNoMove:graphics===nearEdge};
  });
  assert.equal(state.installed,true);assert.equal(state.once,true);assert.equal(state.guarded,true);
  assert.equal(state.width,500,'Font guard must preserve physical-page mapping');
  assert.equal(state.height,160);
  assert.ok(state.newY>state.oldY,'Glyph top ink overhang must be moved into safe region');
  assert.ok(state.clipped,'An object intentionally outside a page must remain clipped');
  assert.ok(state.graphicsNoMove,'Do not cut a neighboring image when no safe shared translation exists');
  console.log('PASS production-safe installer: physical size, overflow intent, graphics and idempotence',JSON.stringify(state));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
