const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
(async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'temhoa-top-')),shots=process.env.TEMHOA_SCREENSHOTS||path.join(temp,'shots'),errors=[],failed=[];
 const server=spawn('python3',['-u','-c',"import mo_temhoa as m;from http.server import ThreadingHTTPServer;s=ThreadingHTTPServer(('127.0.0.1',0),m.Handler);print(s.server_address[1],flush=True);s.serve_forever()"],{env:{...process.env,TEMHOA_TEMPLATE_ROOT:path.join(temp,'templates')},stdio:['ignore','pipe','pipe']});
 const port=await new Promise((resolve,reject)=>{server.stdout.once('data',d=>resolve(Number(d.toString().trim())));server.once('error',reject);});
 const options={headless:true,args:['--no-sandbox']};if(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)options.executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
 let browser;
 try{browser=await chromium.launch(options);const p=await browser.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))failed.push(r.url())});await p.goto('http://127.0.0.1:'+port);await p.waitForFunction(()=>window.TemClipboard);await p.getByRole('button',{name:'Thêm mẫu',exact:true}).click();
 await p.evaluate(async()=>{await restoreLabelDocument({...copyLabelData(homeBaseSettings),designKind:'cloud',wordFrame:'',text:'Kiểm tra công cụ',richHTML:'<div>Kiểm tra công cụ</div>'});});
 const snapshot=await p.evaluate(()=>JSON.stringify(settings()));const stage=await p.locator('#previewStage').boundingBox();
 assert.equal(await p.locator('#layersPanel #artProperties').count(),0);assert.equal(await p.locator('#artPropertiesTab').count(),0);
 fs.mkdirSync(shots,{recursive:true});
 for(const viewport of [{width:1440,height:900},{width:900,height:500},{width:390,height:760},{width:390,height:420}]){
 await p.setViewportSize(viewport);for(const id of ['artPropertiesButton','topProperty-1','topProperty-2','topProperty-3']){
 await p.locator('#'+id).click();await p.waitForTimeout(180);const box=await p.locator('#artProperties').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=viewport.width+1);assert.ok(box.y>=0&&box.y+box.height<=viewport.height+1);assert.equal(await p.locator('#layersPanel #artProperties').count(),0);assert.equal(await p.locator('#artProperties .artPropertySection:visible').count(),1);
 if(id==='artPropertiesButton'){await p.locator('#textOffsetY').scrollIntoViewIfNeeded();const bottom=await p.locator('#textOffsetY').boundingBox();assert.ok(bottom.y+bottom.height<=viewport.height-7);}
 if(id==='topProperty-1'){await p.locator('#paint-edge').click();await p.locator('#paintDialog').waitFor({state:'visible'});await p.keyboard.press('Escape');await p.locator('#paintDialog').waitFor({state:'hidden'});}
 if(id==='topProperty-3'){await p.locator('#scanFonts').scrollIntoViewIfNeeded();assert.equal(await p.locator('#scanFonts').isVisible(),true);}
 await p.screenshot({path:path.join(shots,`${viewport.width}x${viewport.height}-${id}.png`),animations:'disabled'});await p.keyboard.press('Escape');assert.equal(await p.locator('#artProperties').isVisible(),false);assert.equal(await p.locator('#'+id).evaluate(n=>n===document.activeElement),true);
 }assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await p.setViewportSize({width:1440,height:900});await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>JSON.stringify(settings())),snapshot);assert.deepEqual(await p.locator('#previewStage').boundingBox(),stage);
 await p.locator('#artPropertiesButton').click();await p.locator('#spacing').fill('1.6');await p.locator('#spacing').press('Tab');await p.evaluate(()=>TemClipboard.idle);assert.equal(await p.evaluate(()=>Number(settings().spacing)),1.6);await p.keyboard.press('Escape');await p.locator('#artPropertiesButton').click();assert.equal(await p.locator('#spacing').inputValue(),'1.6');await p.locator('#topProperty-2').click();assert.equal(await p.locator('#artProperties .artPropertySection:visible').count(),1);await p.locator('.layersHeading strong').click();assert.equal(await p.locator('#artProperties').isVisible(),false);
 await p.evaluate(async()=>{for(let i=0;i<12;i++)await newDesignText('<div>Lớp '+i+'</div>');});await p.locator('#layersList').hover();await p.mouse.wheel(0,2000);await p.waitForTimeout(150);assert.ok(await p.locator('#layersList').evaluate(n=>n.scrollTop)>0);
 await p.screenshot({path:path.join(shots,'layers-only.png'),animations:'disabled'});assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log('PASS top icon tools, real property edits, color dialog, Escape/focus, outside click, one popup, unchanged canvas/data and layers scroll in four window sizes; '+shots);
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exit(1)});
