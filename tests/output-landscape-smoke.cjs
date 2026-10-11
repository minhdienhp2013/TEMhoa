const {chromium}=require('playwright'),{pathToFileURL}=require('node:url'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
const papers={A5:[21,14.8],A4:[29.7,21],A3:[42,29.7]};
function pngInfo(buffer,dpi,width,height){
 assert.equal(buffer.readUInt32BE(16),Math.round(width/2.54*dpi));assert.equal(buffer.readUInt32BE(20),Math.round(height/2.54*dpi));
 let physical=[];for(let offset=8;offset<buffer.length;){const size=buffer.readUInt32BE(offset);if(buffer.toString('ascii',offset+4,offset+8)==='pHYs')physical.push(buffer.subarray(offset+8,offset+8+size));offset+=12+size;}
 assert.equal(physical.length,1);assert.equal(physical[0].readUInt32BE(0),Math.round(dpi/.0254));assert.equal(physical[0].readUInt32BE(4),Math.round(dpi/.0254));assert.equal(physical[0][8],1);
}
(async()=>{
 const options={headless:true,args:['--no-sandbox']};if(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)options.executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
 const browser=await chromium.launch(options),temp=fs.mkdtempSync(path.join(os.tmpdir(),'temhoa-landscape-'));
 try{
  const page=await browser.newPage({viewport:{width:1400,height:1000},acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(process.cwd()+'/TemHoa-MinhDien.html').href);await page.waitForFunction(()=>window.TemStudio);
  await page.getByRole('button',{name:'Tạo tem / Tiếp tục chỉnh sửa →',exact:true}).click();
  for(const sourcePage of ['landscape','portrait','a3-portrait']){
   await page.evaluate(async sourcePage=>{const base=copyLabelData(homeBaseSettings);await restoreLabelDocument({...base,page:sourcePage,text:'Tỷ lệ Việt',richHTML:'<div>Tỷ lệ Việt</div>',width:8,labelX:3,labelY:5,decorations:[]});},sourcePage);
   const snapshot=await page.evaluate(()=>JSON.stringify(settings()));
   const geometry=await page.evaluate(()=>{const results={};for(const name of ['A4','A3','A5']){const target=outputPaperDimensions(name),c=renderOutputPage(target,{dpi:40}),b=visibleBounds(c.getContext('2d').getImageData(0,0,c.width,c.height).data,c.width,c.height);results[name]={target,x:b.x/c.width,y:b.y/c.height,width:b.width/c.width,height:b.height/c.height};}return results;});
   for(const name of Object.keys(papers)){assert.deepEqual([geometry[name].target.width,geometry[name].target.height],papers[name]);for(const key of ['x','y','width','height'])assert.ok(Math.abs(geometry[name][key]-geometry.A4[key])<.006,'Layout changes for '+sourcePage+' → '+name+' '+key);}
   for(const paper of Object.keys(papers)){
    const [width,height]=papers[paper];
    for(const [format,label] of [['png','Ảnh PNG'],['svg','Vector SVG'],['word','Xuất Word']]){
     await page.locator('#artExportButton').click();await page.getByRole('menuitem',{name:label,exact:true}).click();await page.locator('#exportOutputPaper').selectOption(paper);
     const pending=page.waitForEvent('download');await page.locator('#confirmOutput').click();const filename=await (await pending).path(),buffer=fs.readFileSync(filename);
     if(format==='png')pngInfo(buffer,300,width,height);
     if(format==='svg'){const svg=buffer.toString(),source=await page.evaluate(()=>previewPage());assert.ok(svg.includes(`width="${width}cm" height="${height}cm"`));assert.ok(svg.includes(`viewBox="0 0 ${source.width} ${source.height}"`));assert.ok(svg.includes('preserveAspectRatio="xMidYMid meet"'));}
     if(format==='word')execFileSync('python3',['-c',`import zipfile,sys,xml.etree.ElementTree as E
z=zipfile.ZipFile(sys.argv[1]);r=E.fromstring(z.read('word/document.xml'));n={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','wp':'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'}
p=r.find('.//w:pgSz',n);assert p.get('{'+n['w']+'}orient')=='landscape'
assert int(p.get('{'+n['w']+'}w'))==round(float(sys.argv[2])/2.54*1440);assert int(p.get('{'+n['w']+'}h'))==round(float(sys.argv[3])/2.54*1440)
e=r.find('.//wp:extent',n);assert int(e.get('cx'))==round(float(sys.argv[2])*360000);assert int(e.get('cy'))==round(float(sys.argv[3])*360000)`,filename,String(width),String(height)]);
    }
    await page.evaluate(()=>{window.print=()=>{window.printCalled=true;};window.printCalled=false;});
    await page.evaluate(()=>openPrint());await page.locator('#printOutputPaper').selectOption(paper);assert.deepEqual(await page.evaluate(()=>[printSnapshot.page.width,printSnapshot.page.height]),papers[paper]);
    await page.evaluate(()=>$('confirmPrint').onclick());assert.equal(await page.evaluate(()=>window.printCalled),true);
    const printed=path.join(temp,sourcePage+'-'+paper+'.pdf');await page.pdf({path:printed,preferCSSPageSize:true,printBackground:true});
    execFileSync('python3',['-c',`import sys
from pypdf import PdfReader
r=PdfReader(sys.argv[1]);assert len(r.pages)==1
p=r.pages[0];assert abs(float(p.mediabox.width)-float(sys.argv[2])/2.54*72)<1;assert abs(float(p.mediabox.height)-float(sys.argv[3])/2.54*72)<1`,printed,String(width),String(height)]);
    await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));assert.equal(await page.evaluate(()=>JSON.stringify(settings())),snapshot);
   }
   await page.evaluate(()=>TemStudio.openProduction());assert.equal(await page.locator('#studioOrientation').inputValue(),'landscape');assert.equal(await page.locator('#studioOrientation').isDisabled(),true);
   for(const paper of Object.keys(papers)){await page.locator('#studioPaper').selectOption(paper);const plan=await page.evaluate(()=>TemStudio.printPlan());assert.deepEqual([plan.width,plan.height],papers[paper].map(x=>x*10));}
   await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>JSON.stringify(settings())),snapshot);
  }
  await page.evaluate(()=>openOutputDialog('png'));await page.locator('#exportOutputPaper').selectOption('A5');await page.locator('#exportOutputDpi').selectOption('600');
  const pending=page.waitForEvent('download');await page.locator('#confirmOutput').click();pngInfo(fs.readFileSync(await (await pending).path()),600,...papers.A5);
  await page.evaluate(()=>{window.TEMHOA_NATIVE_PRINT=true;printerAPI=async(action,payload)=>{if(action==='printers')return {names:['Test printer'],default:'Test printer'};if(action==='print')window.nativeJob=payload;return {};};});
  await page.evaluate(()=>openPrint());await page.locator('#printOutputPaper').selectOption('A4');await page.evaluate(()=>$('confirmPrint').onclick());assert.deepEqual(await page.evaluate(()=>({width:window.nativeJob.widthCm,height:window.nativeJob.heightCm})),{width:29.7,height:21});await page.locator('#cancelPrint').click();
  assert.deepEqual(errors,[]);console.log('PASS: landscape PNG/SVG/Word, browser print PDFs and native payload across A5/A4/A3; portrait editor unchanged; PNG DPI correct');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
