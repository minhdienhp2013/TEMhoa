'use strict';
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.TEMHOA_CHROMIUM?{executablePath:process.env.TEMHOA_CHROMIUM}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../TemHoa-MinhDien.html')).href);
  await page.evaluate(async()=>{await createBlankDesign(false);await newDesignText('<div>Chúc Mừng</div><div>Sinh Nhật</div>',null,{x:4,y:4,width:12});await selectLayerUnit(activeLabelId,'text-box',false,false)});
  const input=page.locator('#size');
  const base=()=>page.evaluate(()=>Number(defaultTextStyle.size));
  const old=await base();const historyBefore=await page.evaluate(()=>historyIndex);
  await input.click();await input.press('ControlOrMeta+a');await input.press('Backspace');
  assert.equal(await input.inputValue(),'');
  for(const [digit,value] of [['1','1'],['2','12'],['0','120']]){await input.press(digit);assert.equal(await input.inputValue(),value);assert.equal(await base(),old)}
  await input.press('Enter');await page.waitForFunction(()=>Number(defaultTextStyle.size)===120);
  assert.equal(await input.inputValue(),'120');
  assert.equal(await page.evaluate(()=>historyIndex),historyBefore+1,'one committed edit = one undo step');
  await input.fill('0');assert.equal(await input.inputValue(),'0');assert.equal(await base(),120);
  await input.blur();assert.equal(await input.inputValue(),'120');
  await input.fill('320');await input.press('Escape');assert.equal(await input.inputValue(),'120');assert.equal(await base(),120);
  await input.fill('320');await input.blur();await page.waitForFunction(()=>Number(defaultTextStyle.size)===320);
  await page.locator('#artUndo').click();await page.waitForFunction(()=>!labelOperation&&Number(defaultTextStyle.size)===120);
  await page.locator('#artRedo').click();await page.waitForFunction(()=>!labelOperation&&Number(defaultTextStyle.size)===320);
  await input.fill('1');assert.equal(await input.inputValue(),'1');await input.press('Enter');await page.waitForFunction(()=>Number(defaultTextStyle.size)===6);
  assert.equal(await input.inputValue(),'6');
  assert.equal(await page.evaluate(()=>TEMHOA_FONT_DRAFT.install(window)),true);
  assert.deepEqual(errors,[]);
  console.log('PASS real font draft: select all, empty, 1→12→120, Enter/blur, zero, Escape, min, one-step undo/redo');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
