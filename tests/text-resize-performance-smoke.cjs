const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(process.cwd()+'/TemHoa-MinhDien.html').href);
  await page.evaluate(async()=>{
    await createBlankDesign(false);
    await newDesignText('<div>KIỂM TRA KÉO GIÃN CHỮ</div><div>MINH ĐIẾN</div>',null,{x:3,y:3,width:12});
    await selectLayerUnit(activeLabelId,'text-box',false,false);
    $('lockRatio').checked=true;syncAspectLock();
    window.__resizePerf={previews:0,history:history.length};
    const old=preview;window.__oldPreview=old;preview=async(...args)=>{window.__resizePerf.previews++;return old(...args)};
  });
  const handle=page.locator('.resizeHandle[data-handle=se]');
  await page.locator('#labelSurface').hover();
  const box=await handle.boundingBox();assert.ok(box);
  const t0=Date.now();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width/2+220,box.y+box.height/2+120,{steps:80});
  await page.mouse.up();
  await page.waitForTimeout(250);
  const elapsed=Date.now()-t0;
  const state=await page.evaluate(()=>({previews:window.__resizePerf.previews,historyDelta:history.length-window.__resizePerf.history,size:Number($('size').value),transform:readLayerStack().transforms['text-box']}));
  assert.ok(state.previews<=3,'live resize should not run full preview on every pointer move');
  assert.ok(state.historyDelta<=3,'resize should be one bounded history transaction');
  assert.ok(Math.abs((state.transform?.sx??1)-1)<.03&&Math.abs((state.transform?.sy??1)-1)<.03,'proportional resize should bake scale back into real font size');
  assert.ok(state.size>64,'dragging larger must increase the real font size');
  assert.ok(elapsed<5000,'80-step resize should complete without severe lag');
  assert.deepEqual(errors,[]);
  console.log('PASS: 80-step proportional text resize is frame-coalesced and baked into real font size; '+JSON.stringify({elapsed,...state}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
