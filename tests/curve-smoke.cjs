const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(process.cwd()+'/TemHoa-MinhDien.html').href);
  await page.getByRole('button',{name:'Thêm mẫu',exact:true}).click();
  await page.waitForTimeout(300);
  await page.evaluate(async()=>{$('temEditor').innerHTML='<div>CHÚC MỪNG KHAI TRƯƠNG</div>';$('text').value=editorText();await preview();saveActiveLabel(true);});
  assert.equal(await page.locator('#curveAmount').getAttribute('min'),'-360');
  assert.equal(await page.locator('#curveAmount').getAttribute('max'),'360');
  assert.equal(await page.locator('#curveReset').count(),0);
  assert.equal(await page.locator('#curveRainbow').textContent(),'⌒ Chữ cong');
  await page.evaluate(()=>curveRainbow.click());
  await page.waitForFunction(()=>String(settings().curveAmount)==='40');
  assert.equal(await page.evaluate(()=>Number(settings().curveAmount)),40);
  assert.equal(await page.locator('#curveRainbow').textContent(),'— Chữ thẳng');
  await page.evaluate(()=>curveRainbow.click());
  await page.waitForFunction(()=>Number(settings().curveAmount)===0);
  assert.equal(await page.evaluate(()=>Number(settings().curveAmount)),0);
  assert.equal(await page.locator('#curveRainbow').textContent(),'⌒ Chữ cong');
  await page.evaluate(()=>{curveAmount.value='360';curveAmount.dispatchEvent(new Event('change',{bubbles:true}))});
  await page.waitForFunction(()=>Number(settings().curveAmount)===360);
  const curve=await page.evaluate(()=>{const L=layout();return {amount:Number(settings().curveAmount),finite:L.runs.every(r=>Number.isFinite(r.x)&&Number.isFinite(r.y)&&Number.isFinite(r.angle||0)),maxAngle:Math.max(...L.runs.map(r=>Math.abs(r.angle||0)))}});
  assert.equal(curve.amount,360);assert.equal(curve.finite,true);assert.ok(curve.maxAngle>2.5,'360 degree text should wrap strongly enough to form a circle');
  assert.deepEqual(errors,[]);
  console.log('PASS: one curve toggle switches 40°/0° and input/render supports 360°');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
