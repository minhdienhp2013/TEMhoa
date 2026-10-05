const {_electron:electron}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
(async()=>{
 const root=path.resolve(__dirname,'..'),data=fs.mkdtempSync(path.join(os.tmpdir(),'temhoa-test-'));
 const options=process.env.TEMHOA_TEST_PACKAGED?{executablePath:path.join(root,'release','win-unpacked','TEMhoa.exe'),args:['--user-data-dir='+data]}:{args:[__dirname,'--user-data-dir='+data]};
 const desktop=await electron.launch({...options,timeout:60000});
 let testImage;
 try{
  const page=await desktop.firstWindow({timeout:60000}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.waitForFunction(()=>window.TEMHOA_DESKTOP===true);
  await page.waitForFunction(()=>document.getElementById('scanStatus').textContent.includes('Đã nạp'),null,{timeout:60000});
  assert(await page.locator('#scanFonts').evaluate(e=>e.hidden));
  assert((await page.locator('#font option').count())>5);
  await page.locator('#temHome').waitFor({state:'visible'});
  await page.locator('[data-home-type="cloud"]').click();
  await page.locator('#homeSearch').fill('khai truong');
  assert.equal(await page.locator('.homeCard:visible').count(),4);
  await page.locator('.homeCard:visible').first().click();
  await page.locator('#temHome').waitFor({state:'hidden',timeout:120000});
  assert.match(await page.locator('#text').inputValue(),/Khai Trương/);
  await page.locator('#homeBack').click();
  await page.locator('#homeSearch').fill('');
  await page.locator('[data-home-type="normal"]').click();
  await page.waitForFunction(()=>document.querySelector('.homeCard[data-home-key^="saved:Word-"] img'),null,{timeout:120000});
  fs.mkdirSync(path.join(root,'release'),{recursive:true});
  await page.screenshot({path:path.join(root,'release','TEMhoa-home.png')});
  await page.locator('.homeCard:visible').first().click();
  await page.locator('#temHome').waitFor({state:'hidden',timeout:120000});
  await page.locator('#homeBack').click();
  await page.locator('#homeContinue').click();
  await page.locator('#temHome').waitFor({state:'hidden',timeout:120000});
  console.log('PASS: home gallery, accent-insensitive search, cloud and Word selection, return to editor');
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=64;c.height=64;const g=c.getContext('2d');g.fillStyle='white';g.fillRect(0,0,64,64);g.fillStyle='red';g.fillRect(16,16,32,32);return c.toDataURL('image/png')});
  testImage=png;
  await page.locator('#graphicFile').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from(png.split(',')[1],'base64')});
  await page.waitForFunction(()=>document.getElementById('graphicMessage').textContent.includes('Đã chèn'),null,{timeout:30000});
  const available=await page.evaluate(async()=>{const r=await fetch('/api/background',{headers:{'X-Temhoa-Token':window.TEMHOA_TOKEN}});return r.json()});assert.equal(available.available,true);
  assert.deepEqual(errors,[]);
  console.log('PASS: desktop launch, automatic local fonts, image upload, AI availability');
 }finally{await desktop.close()}
 const models=path.join(root,'build-models'),exe=path.join(root,'build-ai','temhoa-ai','temhoa-ai.exe');
 for(const mode of ['fast','quality']){
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'temhoa-ai-test-'));
  fs.writeFileSync(path.join(folder,'request.json'),JSON.stringify({mode,image:testImage}));
  const result=spawnSync(exe,['--job',folder],{env:{...process.env,U2NET_HOME:models},timeout:180000,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const output=JSON.parse(fs.readFileSync(path.join(folder,'result.json'),'utf8'));
  assert.equal(output.state,'done',JSON.stringify(output));
  assert.match(output.image,/^data:image\/png;base64,/);
  fs.rmSync(folder,{recursive:true,force:true});console.log('PASS: frozen AI removes background '+mode);
 }
 fs.rmSync(data,{recursive:true,force:true});
})().catch(e=>{console.error(e);process.exit(1)});
