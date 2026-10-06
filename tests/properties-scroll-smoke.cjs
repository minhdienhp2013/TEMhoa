const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn,execFileSync}=require('node:child_process');
(async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'temhoa-image-')),profile=path.join(temp,'profile'),shots=process.env.TEMHOA_SCREENSHOTS||path.join(temp,'shots'),errors=[],failed=[];
 const server=spawn('python3',['-u','-c',"import mo_temhoa as m;from http.server import ThreadingHTTPServer;s=ThreadingHTTPServer(('127.0.0.1',0),m.Handler);print(s.server_address[1],flush=True);s.serve_forever()"],{env:{...process.env,TEMHOA_TEMPLATE_ROOT:path.join(temp,'templates')},stdio:['ignore','pipe','pipe']});
 const port=await new Promise((resolve,reject)=>{server.stdout.once('data',d=>resolve(Number(d.toString().trim())));server.once('error',reject);});
 const options={headless:true,args:['--no-sandbox'],viewport:{width:1440,height:700}};if(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)options.executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
 let browser,p;
 const connect=async()=>{browser=await chromium.launchPersistentContext(profile,options);p=await browser.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico')&&!r.url().includes('/api/background'))failed.push(r.url())});await p.goto('http://127.0.0.1:'+port);await p.waitForFunction(()=>window.TemClipboard);};
 const idle=()=>p.evaluate(()=>TemClipboard.idle.catch(()=>{}));
 const shot=async name=>{fs.mkdirSync(shots,{recursive:true});await p.screenshot({path:path.join(shots,name+'.png'),animations:'disabled'});};
 const value=async(label,v)=>{await p.getByRole('spinbutton',{name:label+' — giá trị',exact:true}).fill(String(v));await p.getByRole('spinbutton',{name:label+' — giá trị',exact:true}).press('Tab');await idle();};
 const select=()=>p.evaluate(()=>{selectGraphicItems(decorations.find(x=>x.kind==='image'));syncGraphicControls();positionGraphicOverlays();});
 try{
 await connect();await p.getByRole('button',{name:'Thêm mẫu',exact:true}).click();



 await p.evaluate(async()=>{await restoreLabelDocument({...copyLabelData(homeBaseSettings),designKind:'cloud',wordFrame:'',text:'Tem kiểm tra cuộn',richHTML:'<div>Tem kiểm tra cuộn</div>'});});
 const snapshot=await p.evaluate(()=>JSON.stringify(settings()));
 await p.locator('#artPropertiesButton').click();await p.waitForTimeout(250);
 const sizes=await p.evaluate(()=>({workspace:document.querySelector('.wordWorkspace').clientHeight,panel:$('layersPanel').clientHeight,props:$('artProperties').clientHeight,total:$('artProperties').scrollHeight,body:document.body.scrollHeight}));assert.ok(sizes.panel<=sizes.workspace+1);assert.ok(sizes.total>sizes.props);assert.equal(sizes.body,700);
 const heading=await p.locator('.layersHeading').boundingBox(),stage=await p.locator('#previewStage').boundingBox();
 await p.locator('#artProperties').hover();await p.mouse.wheel(0,1600);await p.waitForTimeout(150);assert.ok(await p.locator('#artProperties').evaluate(n=>n.scrollTop)>0);await p.locator('#scanFonts').scrollIntoViewIfNeeded();assert.equal(await p.locator('#scanFonts').isVisible(),true);const bottom=await p.locator('#scanFonts').boundingBox(),panel=await p.locator('#layersPanel').boundingBox();assert.ok(bottom.y+bottom.height<=panel.y+panel.height+1);assert.deepEqual(await p.locator('.layersHeading').boundingBox(),heading);assert.deepEqual(await p.locator('#previewStage').boundingBox(),stage);await shot('properties-bottom-desktop');await p.locator('#paint-edge').scrollIntoViewIfNeeded();await p.locator('#paint-edge').click();await p.locator('#paintDialog').waitFor({state:'visible'});await p.keyboard.press('Escape');await p.locator('#paintDialog').waitFor({state:'hidden'});assert.equal(await p.locator('#paintDialog').isVisible(),false);
 await p.locator('#artProperties').focus();await p.keyboard.press('Home');await p.keyboard.press('PageUp');await p.waitForTimeout(150);const up=await p.locator('#artProperties').evaluate(n=>n.scrollTop);await p.keyboard.press('PageDown');await p.waitForTimeout(150);assert.ok(await p.locator('#artProperties').evaluate(n=>n.scrollTop)>up,'keyboard scroll');
 assert.equal(await p.evaluate(()=>JSON.stringify(settings())),snapshot,'scrolling must not change design');
 await p.locator('#artLayersTab').click();await p.locator('#artPropertiesTab').click();await p.locator('#artProperties').hover();await p.mouse.wheel(0,-3000);await p.waitForTimeout(150);assert.equal(await p.locator('#artProperties').evaluate(n=>n.scrollTop),0);await shot('properties-top-desktop');
 for(const viewport of [{width:900,height:500},{width:390,height:760},{width:390,height:420}]){await p.setViewportSize(viewport);await p.locator('#artPropertiesButton').click();await p.waitForTimeout(250);await p.locator('#artProperties').hover();await p.mouse.wheel(0,3000);await p.waitForTimeout(150);await p.locator('#scanFonts').scrollIntoViewIfNeeded();const b=await p.locator('#scanFonts').boundingBox(),r=await p.locator('#layersPanel').boundingBox();assert.ok(r.y>=0&&r.y+r.height<=viewport.height);assert.ok(b.y>=r.y&&b.y+b.height<=r.y+r.height+1);assert.ok(await p.locator('#artProperties').evaluate(n=>n.scrollTop)>0);await shot('properties-bottom-'+viewport.width+'x'+viewport.height);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}

 await p.setViewportSize({width:1440,height:700});await p.evaluate(async()=>{for(let i=0;i<12;i++)await newDesignText('<div>Lớp kiểm thử '+i+'</div>');});await p.locator('#artLayersTab').click();await p.locator('#layersList').hover();await p.mouse.wheel(0,2500);await p.waitForTimeout(150);assert.ok(await p.locator('#layersList').evaluate(n=>n.scrollTop)>0,'layers also scroll independently');await shot('layers-bottom');
 await p.evaluate(()=>{for(let i=0;i<5;i++){document.getElementById('closeLayersPanel').click();artOpenPanel('properties');}});await p.waitForTimeout(250);assert.equal(await p.locator('#layersPanel').evaluate(n=>n.inert),false);await p.locator('#scanFonts').scrollIntoViewIfNeeded();const restored=await p.locator('#scanFonts').boundingBox();assert.ok(restored.y+restored.height<700,'controls accessible after repeated close/open');
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log('PASS independent properties scroll, bottom controls, fixed heading/canvas, keyboard, tabs and 4 viewport sizes; '+shots);
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exit(1)});
