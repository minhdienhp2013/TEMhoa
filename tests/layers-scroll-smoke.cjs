const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:700}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(process.cwd()+'/TemHoa-MinhDien.html').href);
  await page.evaluate(async()=>{
    await createBlankDesign(false);
    for(let i=0;i<14;i++)await newDesignText('<div>Layer '+(i+1)+'</div>',null,{x:2+(i%4)*5,y:2+(i%6)*2,width:4});
    renderLayersPanel();
  });
  const panel=await page.locator('#layersPanel').evaluate(el=>({client:el.clientHeight,scroll:el.scrollHeight,overflow:getComputedStyle(el).overflowY}));
  const list=await page.locator('#layersList').evaluate(el=>({client:el.clientHeight,scroll:el.scrollHeight,overflow:getComputedStyle(el).overflowY}));
  assert.ok(list.scroll>list.client,'layers list should overflow and scroll');
  assert.ok(['auto','scroll'].includes(list.overflow));
  assert.ok(panel.scroll<=panel.client+2,'whole layers panel should not be the scrolling container');
  const rows=page.locator('#layersList .layerRow');const count=await rows.count();assert.ok(count>=14);
  await rows.nth(count-1).click();
  await page.waitForTimeout(120);
  const vis=await rows.nth(count-1).evaluate(el=>{const r=el.getBoundingClientRect(),p=document.querySelector('#layersList').getBoundingClientRect();return r.top>=p.top-1&&r.bottom<=p.bottom+1});
  assert.equal(vis,true);
  assert.deepEqual(errors,[]);
  console.log('PASS: layers panel has independent scroll and keeps selected layer visible');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
