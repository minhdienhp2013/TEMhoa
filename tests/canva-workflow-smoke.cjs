const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:820}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(process.cwd()+'/TemHoa-MinhDien.html').href);
  await page.evaluate(async()=>{await createBlankDesign(false);await newDesignText('<div>Dòng 1</div><div>Dòng 2</div>',null,{x:4,y:4,width:10});renderLayersPanel();});
  assert.equal(await page.locator('#smartLayerMenu').textContent(),'Vị trí ▾');
  await page.locator('#smartLayerMenu').click();
  assert.equal(await page.locator('#smartPositionPopup').isVisible(),true);
  for(const label of ['Đưa lên trên cùng','Căn trái','Căn giữa ngang','Dàn đều ngang']){
    assert.equal(await page.locator('#smartPositionPopup').getByRole('menuitem',{name:label}).count(),1);
  }
  await page.locator('#safeZoneToggle').click();
  assert.equal(await page.evaluate(()=>document.body.classList.contains('showPrintSafeZone')),true);
  const safe=await page.locator('#printSafeZone').boundingBox(),stage=await page.locator('#previewStage').boundingBox();
  assert.ok(safe&&stage&&safe.width<stage.width&&safe.height<stage.height&&safe.x>stage.x&&safe.y>stage.y);
  const ruler=await page.locator('#rulerTop').boundingBox();
  assert.ok(ruler);
  await page.mouse.move(ruler.x+ruler.width*.45,ruler.y+ruler.height/2);await page.mouse.down();await page.mouse.move(ruler.x+ruler.width*.55,stage.y+stage.height*.4,{steps:3});await page.mouse.up();
  assert.ok(await page.locator('.canvasGuide.vertical').count()>=1);
  await page.evaluate(async()=>{await selectLayerUnit(activeLabelId,'text-box',false,false)});
  const surface=await page.locator('#labelSurface').boundingBox();assert.ok(surface);
  await page.mouse.move(surface.x+surface.width/2,surface.y+surface.height/2);
  assert.equal(await page.evaluate(()=>document.body.classList.contains('preciseLayerHover')),true);
  assert.deepEqual(errors,[]);
  console.log('PASS: Canva workflow position menu, print safe zone, draggable guide and text-box selection');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
