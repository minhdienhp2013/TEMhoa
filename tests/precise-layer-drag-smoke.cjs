const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(process.cwd()+'/TemHoa-MinhDien.html').href);
  await page.evaluate(async()=>{
    await createBlankDesign(false);
    await newDesignText('<div>Layer A</div>',null,{x:3,y:3,width:8});
    const a=activeLabelId;
    await newDesignText('<div>Layer B</div>',null,{x:12,y:8,width:8});
    const b=activeLabelId;
    selectedLabelSet=new Set([a,b]);
    activeLabelId=a;
    setLabelSettings(labels.find(x=>x.id===a).settings,true);
    await groupGraphics(false);
    renderLayersPanel();
    window.__layerTest={a,b};
  });
  const ids=await page.evaluate(()=>window.__layerTest);
  await page.evaluate(async ids=>{await selectLayerUnit(ids.a,'text-box',false,false)},ids);
  const selected=await page.evaluate(()=>selectedLabels().map(x=>x.id));
  assert.deepEqual(selected,[ids.a]);
  const before=await page.evaluate(ids=>({
    labels:Object.fromEntries(labels.filter(x=>[ids.a,ids.b].includes(x.id)).map(x=>[x.id,{x:Number(x.settings.labelX),y:Number(x.settings.labelY)}])),
    transform:{...(readLayerStack().transforms?.['text-box']||{x:0,y:0,sx:1,sy:1})}
  }),ids);
  const box=await page.locator('#labelSurface').boundingBox();
  assert.ok(box&&box.width>10&&box.height>10);
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  assert.equal(await page.evaluate(()=>document.body.classList.contains('preciseLayerHover')),true);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width/2+70,box.y+box.height/2+35,{steps:4});
  await page.mouse.up();
  await page.waitForTimeout(180);
  const after=await page.evaluate(ids=>({
    labels:Object.fromEntries(labels.filter(x=>[ids.a,ids.b].includes(x.id)).map(x=>[x.id,{x:Number(x.settings.labelX),y:Number(x.settings.labelY)}])),
    transform:{...(readLayerStack().transforms?.['text-box']||{x:0,y:0,sx:1,sy:1})}
  }),ids);
  assert.ok(Math.abs(after.transform.x-before.transform.x)>.05||Math.abs(after.transform.y-before.transform.y)>.05,'chosen text-box layer should move through its own transform');
  assert.equal(after.labels[ids.b].x,before.labels[ids.b].x);
  assert.equal(after.labels[ids.b].y,before.labels[ids.b].y);
  await page.mouse.move(5,5);
  assert.equal(await page.evaluate(()=>document.body.classList.contains('preciseLayerHover')),false);
  assert.deepEqual(errors,[]);
  console.log('PASS: layer-panel selection moves only the chosen text layer and handles are hover-only');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
