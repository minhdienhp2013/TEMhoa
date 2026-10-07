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
  await page.waitForTimeout(250);
  await page.getByRole('button',{name:/Văn bản/}).click();
  await page.waitForTimeout(200);
  await page.evaluate(async()=>{
    editorHTML('<div>Dòng 1</div><div>Dòng 2</div><div>Dòng 3</div>');
    await preview();saveActiveLabel(true);renderLayersPanel();
  });
  const state=await page.evaluate(()=>({
    labels:labels.filter(x=>x.settings.designKind==='text').length,
    units:layerUnits(previewSize.L).filter(x=>x.kind==='text').map(x=>x.key),
    textRows:[...document.querySelectorAll('#layersList .layerRow')].filter(row=>row.querySelector('.layerIcon')?.textContent==='T').length,
    text:editorText()
  }));
  assert.equal(state.labels,1);
  assert.deepEqual(state.units,['text-box']);
  assert.equal(state.textRows,1);
  assert.match(state.text,/Dòng 1/);assert.match(state.text,/Dòng 2/);assert.match(state.text,/Dòng 3/);
  await page.getByRole('button',{name:/Văn bản/}).click();
  await page.waitForTimeout(200);
  const after=await page.evaluate(()=>labels.filter(x=>x.settings.designKind==='text').length);
  assert.equal(after,2);
  assert.deepEqual(errors,[]);
  console.log('PASS: one text box stays one layer across line breaks; Add Text creates a new layer');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
