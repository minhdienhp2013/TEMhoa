const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn,execFileSync}=require('node:child_process');
(async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'temhoa-image-')),profile=path.join(temp,'profile'),shots=process.env.TEMHOA_SCREENSHOTS||path.join(temp,'shots'),errors=[],failed=[];
 const server=spawn('python3',['-u','-c',"import mo_temhoa as m;from http.server import ThreadingHTTPServer;s=ThreadingHTTPServer(('127.0.0.1',0),m.Handler);print(s.server_address[1],flush=True);s.serve_forever()"],{env:{...process.env,TEMHOA_TEMPLATE_ROOT:path.join(temp,'templates')},stdio:['ignore','pipe','pipe']});
 const port=await new Promise((resolve,reject)=>{server.stdout.once('data',d=>resolve(Number(d.toString().trim())));server.once('error',reject);});
 const options={headless:true,args:['--no-sandbox'],viewport:{width:1600,height:1000}};if(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)options.executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
 let browser,p;
 const connect=async()=>{browser=await chromium.launchPersistentContext(profile,options);p=await browser.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico')&&!r.url().includes('/api/background'))failed.push(r.url())});await p.goto('http://127.0.0.1:'+port);await p.waitForFunction(()=>window.TemImageTools);};
 const idle=()=>p.evaluate(()=>TemImageTools.idle);
 const shot=async name=>{fs.mkdirSync(shots,{recursive:true});await p.screenshot({path:path.join(shots,name+'.png'),animations:'disabled'});};
 const value=async(label,v)=>{await p.getByRole('spinbutton',{name:label+' — giá trị',exact:true}).fill(String(v));await p.getByRole('spinbutton',{name:label+' — giá trị',exact:true}).press('Tab');await idle();};
 const select=()=>p.evaluate(()=>{selectGraphicItems(decorations.find(x=>x.kind==='image'));syncGraphicControls();positionGraphicOverlays();});
 try{
 await connect();await p.getByRole('button',{name:'Thêm mẫu',exact:true}).click();

 const src=await p.evaluate(()=>{const c=cv(240,120),x=c.getContext('2d');x.fillStyle='#b92c3b';x.fillRect(0,0,240,120);return c.toDataURL();});
 await p.evaluate(async src=>{await TemStudio.insertAsset({type:'image',src,width:240,height:120});await preview();},src);await select();
 const box=await p.locator('.graphicOverlay.selected').boundingBox(),start={x:box.x+box.width/2,y:box.y+box.height/2};
 const old=await p.evaluate(()=>({revision:previewRevision,stage:$('previewStage').getBoundingClientRect().width}));
 await p.mouse.move(start.x,start.y);await p.mouse.down();
 for(let i=1;i<=8;i++){
   await p.mouse.move(start.x+i*12,start.y+i*6);await p.waitForTimeout(65);
   const b=await p.locator('.graphicOverlay.selected').boundingBox();
   assert.ok(Math.abs(b.x+b.width/2-start.x-i*12)<1,'move follows pointer X');assert.ok(Math.abs(b.y+b.height/2-start.y-i*6)<1,'move follows pointer Y');
   assert.equal(await p.evaluate(()=>previewRevision),old.revision,'no asynchronous full preview during drag');assert.equal(await p.evaluate(()=>TemLivePreview.active),true);
   assert.ok(Math.abs(await p.locator('#previewStage').evaluate(n=>n.getBoundingClientRect().width)-old.stage)<.01,'paper stays stable');
 }
 await shot('image-drag-live');const end=await p.locator('.graphicOverlay.selected').boundingBox();await p.mouse.up();await p.waitForFunction(()=>!TemLivePreview.active);await select();const committed=await p.locator('.graphicOverlay.selected').boundingBox();assert.ok(Math.abs(end.x-committed.x)<1&&Math.abs(end.y-committed.y)<1,'no jump on commit');
 const handle=await p.locator('.graphicOverlay.selected .graphicResize').boundingBox(),anchor={x:handle.x+handle.width/2,y:handle.y+handle.height/2};
 await p.mouse.move(anchor.x,anchor.y);await p.mouse.down();let last=committed.width;
 for(let i=1;i<=6;i++){await p.mouse.move(anchor.x+i*8,anchor.y+i*4);await p.waitForTimeout(65);const b=await p.locator('.graphicOverlay.selected').boundingBox();assert.ok(b.width>last,'resize monotonic');last=b.width;assert.equal(await p.evaluate(()=>TemLivePreview.active),true);}
 await shot('image-resize-live');const resized=await p.locator('.graphicOverlay.selected').boundingBox();await p.mouse.up();await p.waitForFunction(()=>!TemLivePreview.active);await select();const final=await p.locator('.graphicOverlay.selected').boundingBox();assert.ok(Math.abs(resized.width-final.width)<1,'resize commit stable');assert.equal(await p.evaluate(()=>$('canvas').toDataURL()===render().c.toDataURL()),true);


 // Whole-page handles remain available when a layer is not selected.
 await p.evaluate(()=>{selectedGraphicId=null;selectedGraphicSet.clear();selectedUnitKey='';selectedLayerUnits.clear();zoom();});
 // The outer label handles must also preserve the viewport when released.
 const wholeHandle=await p.locator('#selectionFrame [data-handle=nw]').boundingBox(),wx=wholeHandle.x+2,wy=wholeHandle.y+2;
 await p.mouse.move(wx,wy);await p.mouse.down();assert.equal(await p.evaluate(()=>!!labelDrag),true,'outer handle receives pointer');await p.mouse.move(wx-55,wy-27,{steps:8});await p.waitForTimeout(70);const wholeLive=await p.locator('#selectionFrame').boundingBox();await p.mouse.up();await p.waitForTimeout(200);const wholeFinal=await p.locator('#selectionFrame').boundingBox();assert.ok(Math.abs(wholeLive.x-wholeFinal.x)<1&&Math.abs(wholeLive.y-wholeFinal.y)<1&&Math.abs(wholeLive.width-wholeFinal.width)<1,'outer resize does not scroll on release');await select();
 const edgeStart=await p.locator('.graphicOverlay.selected').boundingBox(),edgeX=edgeStart.x+edgeStart.width/2,edgeY=edgeStart.y+edgeStart.height/2;
 await p.mouse.move(edgeX,edgeY);await p.mouse.down();await p.mouse.move(35,edgeY+20,{steps:12});await p.waitForTimeout(70);const edgeLive=await p.locator('.graphicOverlay.selected').boundingBox();await p.mouse.up();await p.waitForFunction(()=>!TemLivePreview.active);await p.waitForTimeout(250);await select();const edgeFinal=await p.locator('.graphicOverlay.selected').boundingBox();assert.ok(Math.abs(edgeLive.x-edgeFinal.x)<1&&Math.abs(edgeLive.y-edgeFinal.y)<1,'crossing page edge does not jump');
 for(const z of [150,30,100,150]){await p.locator('#zoom').evaluate((n,v)=>{n.value=v;n.dispatchEvent(new Event('input',{bubbles:true}));},z);await p.waitForTimeout(100);const w=await p.locator('#previewStage').evaluate(n=>n.getBoundingClientRect().width);await p.waitForTimeout(200);assert.ok(Math.abs(w-await p.locator('#previewStage').evaluate(n=>n.getBoundingClientRect().width))<.01,'zoom settles without oscillation');}
 await p.evaluate(async()=>{await newDesignText('<div>Thanh chữ tiếng Việt</div>');selectedGraphicId=null;await preview();});
 await p.locator('#caseButton').click();const menu=await p.locator('#caseMenu').boundingBox();assert.ok(menu.y>=0&&menu.y+menu.height<=1000);assert.equal(await p.locator('#caseMenu').evaluate(n=>n.parentElement===document.body),true);await shot('text-aa-menu');
 await p.getByRole('menuitem',{name:'CHỮ HOA',exact:true}).click();assert.ok(await p.evaluate(()=>editorText().includes('THANH CHỮ TIẾNG VIỆT')));assert.equal(await p.locator('#caseMenu').isVisible(),false);
 await p.locator('#caseButton').focus();await p.keyboard.press('ArrowDown');assert.equal(await p.evaluate(()=>document.activeElement.dataset.case),'sentence');await p.keyboard.press('End');assert.equal(await p.evaluate(()=>document.activeElement.dataset.case),'toggle');await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.activeElement.id),'caseButton');
 await p.setViewportSize({width:390,height:760});await p.locator('#caseButton').click();const m=await p.locator('#caseMenu').boundingBox();assert.ok(m.x>=0&&m.x+m.width<=390&&m.y>=0&&m.y+m.height<=760);await shot('text-aa-small');await p.getByRole('menuitem',{name:'chữ thường',exact:true}).click();assert.ok(await p.evaluate(()=>editorText().includes('thanh chữ tiếng việt')));
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log('PASS live image drag/resize, stable zoom, Aa mouse/keyboard, small window; screenshots '+shots);
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exit(1)});
