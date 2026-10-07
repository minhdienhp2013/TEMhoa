const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn,execFileSync}=require('node:child_process');
(async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'temhoa-image-')),profile=path.join(temp,'profile'),shots=process.env.TEMHOA_SCREENSHOTS||path.join(temp,'shots'),errors=[],failed=[];
 const server=spawn('python3',['-u','-c',"import mo_temhoa as m;from http.server import ThreadingHTTPServer;s=ThreadingHTTPServer(('127.0.0.1',0),m.Handler);print(s.server_address[1],flush=True);s.serve_forever()"],{env:{...process.env,TEMHOA_TEMPLATE_ROOT:path.join(temp,'templates')},stdio:['ignore','pipe','pipe']});
 const port=await new Promise((resolve,reject)=>{server.stdout.once('data',d=>resolve(Number(d.toString().trim())));server.once('error',reject);});
 const options={headless:true,args:['--no-sandbox'],viewport:{width:1600,height:1000}};if(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)options.executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
 let browser,p;
 const connect=async()=>{browser=await chromium.launchPersistentContext(profile,options);p=await browser.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico')&&!r.url().includes('/api/background'))failed.push(r.url())});await p.goto('http://127.0.0.1:'+port);await p.waitForFunction(()=>window.TemClipboard);};
 const idle=()=>p.evaluate(()=>TemClipboard.idle.catch(()=>{}));
 const shot=async name=>{fs.mkdirSync(shots,{recursive:true});await p.screenshot({path:path.join(shots,name+'.png'),animations:'disabled'});};
 const value=async(label,v)=>{await p.getByRole('spinbutton',{name:label+' — giá trị',exact:true}).fill(String(v));await p.getByRole('spinbutton',{name:label+' — giá trị',exact:true}).press('Tab');await idle();};
 const select=()=>p.evaluate(()=>{selectGraphicItems(decorations.find(x=>x.kind==='image'));syncGraphicControls();positionGraphicOverlays();});
 try{
 await connect();await p.getByRole('button',{name:'Thêm mẫu',exact:true}).click();


 await browser.grantPermissions(['clipboard-read','clipboard-write']);
 const paste=async()=>{await p.locator('#labelSurface').focus();await p.keyboard.press('Control+V');};
 await p.evaluate(()=>navigator.clipboard.writeText('Chúc mừng\nMinh Điến'));
 await paste();await p.waitForFunction(()=>editorText().includes('Minh Điến'));await idle();assert.equal(await p.evaluate(()=>designKind.value),'text');assert.ok(await p.evaluate(()=>editorText().includes('Chúc mừng')));assert.equal(await p.locator('#temEditor > div').count(),2);
 const fixture=await p.evaluate(()=>{const c=cv(180,90),ctx=c.getContext('2d');ctx.fillStyle='#b92c3b';ctx.fillRect(0,0,180,90);return c.toDataURL();});
 await p.evaluate(async src=>{const blob=await(await fetch(src)).blob();await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);},fixture);
 await paste();await p.waitForFunction(()=>decorations.some(i=>i.kind==='image'));await idle();assert.deepEqual(await p.evaluate(async()=>{const image=await loadGraphic(selectedGraphic().src),c=cv(180,90);c.getContext('2d').drawImage(image,0,0);return [...c.getContext('2d').getImageData(90,45,1,1).data]}),[185,44,59,255]);await idle();assert.equal(await p.evaluate(()=>selectedGraphic().kind),'image');assert.equal(await p.locator('#artImageZone').isVisible(),true);await shot('clipboard-image');
 const count=await p.evaluate(()=>decorations.length);await p.keyboard.press('Control+C');await p.waitForTimeout(100);await paste();await p.waitForFunction(n=>decorations.length===n+1,count);await idle();assert.ok(await p.evaluate(()=>decorations.every(x=>x.src===decorations[0].src)));
 await p.locator('#artUndo').click();await p.waitForFunction(n=>!labelOperation&&decorations.length===n,count);
 // Browser DataTransfer files exercise the external file-drop path and world position.
 const drop=async(data)=>{await p.evaluate(({fixture,...data})=>{const dt=new DataTransfer();if(data.text)dt.setData('text/plain',data.text);if(data.html)dt.setData('text/html',data.html);if(data.file){const bytes=Uint8Array.from(atob(fixture.split(',')[1]),c=>c.charCodeAt(0));dt.items.add(new File([bytes],data.file,{type:data.type||'image/png'}));}const rect=$('previewStage').getBoundingClientRect(),page=previewPage();$('previewArea').dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:dt}));$('previewArea').dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt,clientX:rect.left+4/page.width*rect.width,clientY:rect.top+5/page.height*rect.height}));},{fixture,...data});await idle();};
 await drop({file:'anh-keo.png'});assert.equal(await p.evaluate(()=>selectedGraphic().src),fixture);const g=await p.evaluate(()=>TemImageTools.worldGeometry(selectedGraphic()));assert.ok(Math.abs(g.x-4)<.04&&Math.abs(g.y-5)<.04);assert.equal(await p.locator('.externalDropActive').count(),0);
 await drop({text:'Chữ kéo vào\nDòng thứ hai'});assert.ok(await p.evaluate(()=>editorText().includes('Dòng thứ hai')));assert.ok(Math.abs(await p.evaluate(()=>Number($('labelX').value))-4)<.04);
 await drop({html:'<div>Chữ từ HTML</div><script>window.badImport=true</script><iframe src="http://example.invalid"></iframe>'});assert.ok(await p.evaluate(()=>editorText().includes('Chữ từ HTML')));assert.equal(await p.evaluate(()=>window.badImport),undefined);assert.equal(await p.locator('#temEditor iframe,#temEditor script').count(),0);
 const beforeBad=await p.evaluate(()=>JSON.stringify(settings()));await drop({file:'anh.gif',type:'image/gif'});assert.equal(await p.evaluate(()=>JSON.stringify(settings())),beforeBad);assert.ok((await p.locator('#status').textContent()).includes('PNG'));

 const invalid=await p.evaluate(()=>JSON.stringify(settings()));await p.evaluate(()=>{const dt=new DataTransfer();dt.items.add(new File(['broken'],'hong.png',{type:'image/png'}));$('previewArea').dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt}));});await idle();assert.equal(await p.evaluate(()=>JSON.stringify(settings())),invalid);
 await p.evaluate(()=>{const dt=new DataTransfer();dt.items.add(new File([new Uint8Array(13*1024*1024)],'lon.png',{type:'image/png'}));$('previewArea').dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt}));});await idle();assert.equal(await p.evaluate(()=>JSON.stringify(settings())),invalid);assert.ok((await p.locator('#status').textContent()).includes('12 MB'));
 await p.evaluate(()=>{const e=new KeyboardEvent('keydown',{key:'v',metaKey:true,bubbles:true,cancelable:true});$('labelSurface').dispatchEvent(e);window.macPasteAllowed=!e.defaultPrevented;});assert.equal(await p.evaluate(()=>macPasteAllowed),true);
 // Native text paste in an active text editor retains destination formatting.
 await p.evaluate(()=>editDesignText());await p.evaluate(()=>navigator.clipboard.writeText('Văn bản dán đúng chỗ'));await p.keyboard.press('Control+V');await p.waitForFunction(()=>editorText().includes('Văn bản dán đúng chỗ'));await p.locator('#designFinishText').click();

 await p.evaluate(()=>{editDesignText();labelLockControl.checked=true;});const lockedText=await p.evaluate(()=>editorText());await p.evaluate(()=>navigator.clipboard.writeText('Không được sửa ảnh/chữ khóa'));await p.keyboard.press('Control+V');await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>editorText()),lockedText);await p.evaluate(()=>{labelLockControl.checked=false;});await p.locator('#designFinishText').click();
 await p.evaluate(()=>navigator.clipboard.writeText('Dán bằng nút'));await p.locator('#systemPaste').click();await idle();assert.ok(await p.evaluate(()=>editorText().includes('Dán bằng nút')));
 const saved=await p.evaluate(()=>JSON.stringify(settings()));await p.evaluate(()=>flushAutoSave());const name=await p.evaluate(()=>currentTemplateName);await browser.close();await connect();await p.waitForFunction(n=>homeEntries.some(e=>e.fileName===n),name);await p.evaluate(async n=>{await openHomeEntry(homeEntries.find(e=>e.fileName===n));},name);await p.waitForFunction(()=>home.hidden&&!homeBusy&&!labelOperation);assert.equal(await p.evaluate(()=>JSON.stringify(settings())),saved);
 await p.setViewportSize({width:390,height:760});await shot('clipboard-small');assert.equal(await p.locator('#systemPaste').isVisible(),true);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 console.log('PASS native clipboard text/image, internal copy/paste, undo, external file/text/HTML drop, invalid file, editing, paste button, persistence and small window; '+temp);
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exit(1)});
