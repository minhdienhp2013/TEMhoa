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
    await newDesignText('<div>Dòng một</div><div>Dòng hai</div>',null,{x:3,y:3,width:10});
    window.__textA=activeLabelId;
    await newDesignText('<div>Khối chữ thứ hai</div>',null,{x:16,y:8,width:8});
    window.__textB=activeLabelId;
    await activateLabel(window.__textA);
    await addGraphic('grin');
    window.__graphic=decorations[0].id;
    await selectLayerUnit(activeLabelId,'text-box',false,false);
  });
  const ids=await page.evaluate(()=>({a:window.__textA,b:window.__textB,g:window.__graphic}));
  const before=await page.evaluate(ids=>({
    a:{...labelGeometry(labels.find(x=>x.id===ids.a))},
    b:{...labelGeometry(labels.find(x=>x.id===ids.b))},
    graphic:{...decorations.find(x=>x.id===ids.g)},
    transforms:copyLabelData(readLayerStack().transforms||{})
  }),ids);

  await page.locator('#labelSurface').hover();
  let handle=page.locator('.resizeHandle[data-handle=e]');
  let hb=await handle.boundingBox();assert.ok(hb);
  await page.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2);await page.mouse.down();
  await page.mouse.move(hb.x+hb.width/2+70,hb.y+hb.height/2,{steps:10});await page.mouse.up();await page.waitForTimeout(220);
  let state=await page.evaluate(ids=>({
    t:readLayerStack().transforms?.['text-box'],
    b:{...labelGeometry(labels.find(x=>x.id===ids.b))},
    graphic:{...decorations.find(x=>x.id===ids.g)}
  }),ids);
  assert.ok(state.t?.sx>1,'text-box horizontal resize must change only its transform');
  assert.equal(state.t.sy??1,1);
  assert.deepEqual(state.b,before.b);
  assert.equal(state.graphic.x,before.graphic.x);assert.equal(state.graphic.y,before.graphic.y);

  const first=state.t;
  handle=page.locator('.resizeHandle[data-handle=move]');
  const mb=await handle.boundingBox();assert.ok(mb);
  await page.mouse.move(mb.x+mb.width/2,mb.y+mb.height/2);await page.mouse.down();
  await page.mouse.move(mb.x+mb.width/2+35,mb.y+mb.height/2+24,{steps:8});await page.mouse.up();await page.waitForTimeout(180);
  state=await page.evaluate(()=>readLayerStack().transforms?.['text-box']);
  assert.notEqual(state.x,first.x);assert.notEqual(state.y,first.y);

  const saved=await page.evaluate(()=>settings());
  await page.evaluate(async data=>restoreLabelDocument(data),saved);
  assert.deepEqual(await page.evaluate(()=>readLayerStack().transforms?.['text-box']),state);
  assert.deepEqual(errors,[]);
  console.log('PASS: one multiline text-box resizes/moves independently and survives save/restore');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
