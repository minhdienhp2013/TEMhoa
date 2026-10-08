'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],executablePath:process.env.TEMHOA_CHROMIUM||'/usr/bin/chromium'});
 try{
  const page=await browser.newPage();
  await page.setContent('<input id="size" aria-label="Cỡ chữ" type="number" min="6" max="800" value="64">');
  await page.evaluate(()=>{
   window.applied=[];window.zoom=()=>{document.getElementById('size').value='6'};
   window.preview=async()=>{await Promise.resolve();window.zoom()};
   document.getElementById('size').addEventListener('input',()=>{
    const el=document.getElementById('size');window.applied.push(el.value);window.preview();
   });
  });
  await page.addScriptTag({path:path.resolve(__dirname,'../editor-font-size.js')});
  const size=page.locator('#size');
  await size.fill('');await size.pressSequentially('120');
  await page.waitForTimeout(70);
  assert.equal(await size.inputValue(),'120');
  assert.deepEqual(await page.evaluate(()=>window.applied),['12','120']);
  await size.fill('');await size.pressSequentially('320');await page.waitForTimeout(50);
  assert.equal(await size.inputValue(),'320');
  assert.deepEqual((await page.evaluate(()=>window.applied)).slice(-2),['32','320']);
  await size.fill('0');assert.equal(await size.inputValue(),'0');
  await size.blur();assert.equal(await size.inputValue(),'320','invalid font size must revert on blur');
  assert.equal(await page.evaluate(()=>window.TEMHOA_FONT_DRAFT.install(window)),true);
  console.log('PASS font-size draft: type 120/320, transient zero, blur and idempotence');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});