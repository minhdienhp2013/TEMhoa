const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:820}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(process.cwd()+'/TemHoa-MinhDien.html').href);
  await page.evaluate(async()=>{await createBlankDesign(false);await newDesignText('<div>FONT TEST</div>',null,{x:4,y:4,width:10});await selectLayerUnit(activeLabelId,'text-box',false,false);});
  const size=page.locator('#size');
  assert.equal(await size.getAttribute('max'),'800');
  await size.fill('64');await size.press('Enter');await size.blur();await page.waitForTimeout(180);
  const smallBox=await page.locator('#labelSurface').boundingBox();assert.ok(smallBox);
  await size.fill('320');
  await size.press('Enter');await size.blur();
  await page.waitForTimeout(250);
  let state=await page.evaluate(()=>({input:Number($('size').value),base:Number(defaultTextStyle.size),run:previewSize?.L?.runs?.[0]?.size}));
  assert.equal(state.input,320);
  assert.equal(state.base,320);
  assert.ok(state.run>420&&state.run<430,'320pt should render near 426.7 CSS px');
  const largeBox=await page.locator('#labelSurface').boundingBox();assert.ok(largeBox);
  assert.ok(largeBox.width>smallBox.width*3.5,'large font must visibly enlarge the text object instead of being scaled back into the old box');
  await page.evaluate(async()=>{await preview();saveActiveLabel(true);await preview()});
  state=await page.evaluate(()=>({input:Number($('size').value),base:Number(defaultTextStyle.size)}));
  assert.deepEqual(state,{input:320,base:320});

  await size.fill('120');await size.press('Enter');await size.blur();await page.waitForTimeout(150);
  await page.evaluate(()=>{
    const stack=readLayerStack();stack.transforms={...(stack.transforms||{}),'text-box':{x:0,y:0,sx:1.5,sy:1.5}};$('layerStack').value=JSON.stringify(stack);zoom();
  });
  await page.waitForTimeout(80);
  assert.equal(Number(await size.inputValue()),180);

  await page.evaluate(()=>{
    const stack=readLayerStack();stack.transforms={...(stack.transforms||{}),'text-box':{x:0,y:0,sx:1.5,sy:1.1}};$('layerStack').value=JSON.stringify(stack);zoom();
  });
  await page.waitForTimeout(80);
  assert.equal(Number(await size.inputValue()),180,'non-proportional stretch should not invent a new font size');
  assert.deepEqual(errors,[]);
  console.log('PASS: large font size persists and proportional text scaling updates effective size');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
