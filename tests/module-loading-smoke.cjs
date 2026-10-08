'use strict';
// Use the shipped Python handler, rather than a generic static web server.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'temhoa-modules-'));
 const server=spawn(process.env.PYTHON||'python3',['-u','-c',"import mo_temhoa as m;from http.server import ThreadingHTTPServer;s=ThreadingHTTPServer(('127.0.0.1',0),m.Handler);print(s.server_address[1],flush=True);s.serve_forever()"],{cwd:root,env:{...process.env,TEMHOA_TEMPLATE_ROOT:path.join(temp,'templates')},stdio:['ignore','pipe','pipe']});
 let stderr='',browser;server.stderr.on('data',d=>stderr+=d);
 try{
 const port=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Python server startup timed out: '+stderr)),15000);server.stdout.on('data',d=>{out+=d;const line=out.split('\n')[0];if(/^\d+$/.test(line)){clearTimeout(timer);resolve(Number(line));}});server.once('error',e=>{clearTimeout(timer);reject(e);});server.once('exit',code=>{clearTimeout(timer);reject(Error('Python server exited '+code+': '+stderr));});});
 const base='http://127.0.0.1:'+port,htmlResponse=await fetch(base),html=await htmlResponse.text();assert.equal(htmlResponse.status,200);
 const scripts=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(m=>m[1]);
 const styles=[...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+\.css(?:\?[^"']*)?)["']/gi)].map(m=>m[1]);
 const assets=[...new Set([...scripts,...styles].filter(x=>!/^https?:|^data:|^\/\//.test(x)))];
 for(const module of ['editor-core.js','editor-render.js','editor-objects.js','editor-documents.js','editor-shell.js','editor-topbar.js','editor-actions.js','editor-text-transform.js','editor-performance.js','editor-selection-tools.js','editor-precise-selection.js','editor-canvas-interactions.js','editor-layer-scroll.js','editor-font-size.js'])assert.ok(scripts.includes(module),module+' must load as an external script');assert.ok(scripts.indexOf('editor-performance.js')>scripts.indexOf('color-tools.js'));assert.ok(scripts.indexOf('editor-selection-tools.js')>scripts.indexOf('editor-performance.js'));assert.equal(scripts.at(-1),'editor-font-size.js');
 for(const src of assets){const response=await fetch(new URL(src,base));assert.equal(response.status,200,src+' must be served');assert.match(response.headers.get('content-type')||'',src.split('?')[0].endsWith('.css')?/^text\/css/:/^(?:text|application)\/javascript/,src+' MIME');assert.ok((await response.text()).trim().length,src+' cannot be empty');}
 console.log('PASS Python launcher: '+assets.length+' local script/style URLs return 200 and correct MIME');
 if(process.env.TEMHOA_MODULES_HTTP_ONLY==='1')return;
 const options={headless:true,args:['--no-sandbox']};if(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)options.executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
 browser=await chromium.launch(options);const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});
 await page.goto(base+'/?debugPerformance=1');await page.waitForFunction(()=>window.TemStudio&&window.TemImageTools&&window.TemColors&&window.TemPerformance);
 assert.deepEqual(await page.evaluate(()=>['TemStudioCore','TemStudio','TemStudioObjects','TemImageTools','TemClipboard','TemShapes','TemColors','TemPerformance'].filter(k=>!window[k])),[]);
 assert.equal(await page.locator('#performanceDebug').count(),1);
 await page.getByRole('button',{name:'Thêm mẫu',exact:true}).click();
 await page.evaluate(async()=>{await newDesignText('<div>Bản đầu tiếng Việt</div>');editDesignText();await flushAutoSave();});
 await page.locator('#temEditor').press('End');await page.locator('#temEditor').pressSequentially(' — chỉnh sửa',{delay:5});await page.evaluate(()=>flushAutoSave());
 assert.match(await page.evaluate(()=>editorText()),/chỉnh sửa/);
 await page.locator('#artUndo').click();await page.waitForFunction(()=>!labelOperation);assert.equal(await page.evaluate(()=>editorText()),'Bản đầu tiếng Việt');
 await page.locator('#artRedo').click();await page.waitForFunction(()=>!labelOperation);assert.match(await page.evaluate(()=>editorText()),/chỉnh sửa/);
 const name=await page.evaluate(async()=>{await flushAutoSave();return currentTemplateName;});assert.ok(name);
 const layoutCalls=await page.evaluate(async()=>{await ensureDocumentFonts();const original=layout;let calls=0;layout=function(...args){calls++;return original(...args);};try{await oneLabelPreview();return calls;}finally{layout=original;}});assert.equal(layoutCalls,1,'Base preview must reuse the layout returned by render');console.log('PASS base preview computes layout once');
 const png=await page.evaluate(async()=>{await ensureDocumentFonts();const {png,cm,heightCm}=await exportPNG();return {length:png.length,signature:Array.from(png.slice(0,8)),cm,heightCm,svg:oneLabelSVG()};});assert.deepEqual(png.signature,[137,80,78,71,13,10,26,10]);assert.ok(png.length>100&&png.cm>0&&png.heightCm>0);assert.match(png.svg,/<svg/);
 await page.evaluate(()=>TemStudio.openProduction(true));const downloadPromise=page.waitForEvent('download');await page.locator('#studioExportPDF').click();const download=await downloadPromise;const pdfPath=path.join(temp,'module-regression.pdf');await download.saveAs(pdfPath);assert.ok(fs.readFileSync(pdfPath).subarray(0,5).equals(Buffer.from('%PDF-')));
 await page.goto(base);await page.waitForFunction(n=>homeEntries.some(e=>e.fileName===n),name);await page.evaluate(async n=>openHomeEntry(homeEntries.find(e=>e.fileName===n)),name);await page.waitForFunction(()=>home.hidden&&!homeBusy&&!labelOperation);assert.ok(await page.evaluate(()=>labels.some(l=>l.settings.text.includes('chỉnh sửa'))));
 assert.equal(await page.locator('#performanceDebug').count(),0);assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 console.log('PASS module globals, real create/edit/undo/redo/save/reopen and PNG/SVG/PDF export; no page errors');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
