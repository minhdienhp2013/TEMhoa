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

  await page.evaluate(async ids=>{
    await selectLayerUnit(ids.a,'text-box',false,false);
    await selectLayerUnit(ids.b,'text-box',true,false);
  },ids);
  const groupBefore=await page.evaluate(ids=>Object.fromEntries(labels.filter(x=>[ids.a,ids.b].includes(x.id)).map(x=>[x.id,{x:Number(x.settings.labelX),y:Number(x.settings.labelY)}])),ids);
  const selectedSurface=await page.locator('#labelSurface').boundingBox();
  assert.ok(selectedSurface&&selectedSurface.width>10&&selectedSurface.height>10);
  await page.mouse.move(selectedSurface.x+selectedSurface.width/2,selectedSurface.y+selectedSurface.height/2);
  await page.mouse.down();
  await page.mouse.move(selectedSurface.x+selectedSurface.width/2+64,selectedSurface.y+selectedSurface.height/2+32,{steps:4});
  await page.mouse.up();
  await page.waitForTimeout(180);
  const groupAfter=await page.evaluate(ids=>({
    labels:Object.fromEntries(labels.filter(x=>[ids.a,ids.b].includes(x.id)).map(x=>[x.id,{x:Number(x.settings.labelX),y:Number(x.settings.labelY)}])),
    selected:[...selectedLayerUnits]
  }),ids);
  const deltaA={x:groupAfter.labels[ids.a].x-groupBefore[ids.a].x,y:groupAfter.labels[ids.a].y-groupBefore[ids.a].y};
  const deltaB={x:groupAfter.labels[ids.b].x-groupBefore[ids.b].x,y:groupAfter.labels[ids.b].y-groupBefore[ids.b].y};
  assert.ok(Math.abs(deltaA.x)>.05||Math.abs(deltaA.y)>.05,'first selected layer should move');
  assert.ok(Math.abs(deltaB.x)>.05||Math.abs(deltaB.y)>.05,'second selected layer should move');
  assert.ok(Math.abs(deltaA.x-deltaB.x)<.01&&Math.abs(deltaA.y-deltaB.y)<.01,'all selected layers should keep their spacing while moving');
  assert.equal(groupAfter.selected.length,2,'multi-layer selection should remain active after moving');

  await page.evaluate(()=>selectedLayerUnits.clear());
  const rows=page.locator('.layerRow');
  const firstRow=await rows.nth(0).boundingBox(),secondRow=await rows.nth(1).boundingBox();
  assert.ok(firstRow&&secondRow,'layer rows should be visible');
  await page.mouse.move(firstRow.x+firstRow.width/2,firstRow.y+firstRow.height/2);
  await page.mouse.down();
  await page.mouse.move(secondRow.x+secondRow.width/2,secondRow.y+secondRow.height/2,{steps:5});
  await page.mouse.up();
  await page.waitForTimeout(80);
  assert.equal(await page.evaluate(()=>selectedLayerUnits.size),2,'dragging across the Layers panel should select both rows');
  assert.equal(await page.locator('.layerRow.selected').count(),2,'the Layers panel should highlight the dragged range');

  await page.evaluate(()=>{selectedLayerUnits.clear();renderLayersPanel()});
  const stage=await page.locator('#previewStage').boundingBox();assert.ok(stage);
  await page.mouse.move(stage.x+2,stage.y+2);
  await page.mouse.down();
  await page.mouse.move(stage.x+stage.width-2,stage.y+stage.height-2,{steps:6});
  await page.mouse.up();
  await page.waitForTimeout(120);
  const marqueeResult=await page.evaluate(()=>({selected:selectedLayerUnits.size,highlighted:document.querySelectorAll('.layerRow.selected').length,status:$('status').textContent}));
  assert.ok(marqueeResult.selected>=2,'marquee on the workspace should select multiple layers');
  assert.equal(marqueeResult.highlighted,marqueeResult.selected,'workspace marquee should stay synchronized with the Layers panel');
  assert.match(marqueeResult.status,/màn hình làm việc/);
  await page.mouse.move(5,5);
  assert.equal(await page.evaluate(()=>document.body.classList.contains('preciseLayerHover')),false);
  assert.deepEqual(errors,[]);
  console.log('PASS: exact drag, group move, and drag selection in the Layers panel work together');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
