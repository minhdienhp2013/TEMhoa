const {chromium}=require('playwright'),{pathToFileURL}=require('node:url'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(process.cwd()+'/TemHoa-MinhDien.html').href);
 await page.evaluate(async()=>{await createCloudTemplate();$('temEditor').innerHTML='<div>Chúc Mừng Sinh Nhật</div><div>Đặng Ánh</div>';defaultTextStyle.size=100;$('size').value='100';await preview();await selectLayerUnit(activeLabelId,'text-box',false,false);});
 const handle=page.locator('#selectionFrame [data-handle=move]'),b=await handle.boundingBox();assert.ok(b);
 await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+95,b.y+b.height/2+45,{steps:8});await page.mouse.up();
 await page.evaluate(async()=>{await preview();const stack=readLayerStack();stack.transforms['text-box'].sx=1.7;stack.transforms['text-box'].sy=1.7;$('layerStack').value=JSON.stringify(stack);await preview();});
 const result=await page.evaluate(()=>{
  const c=$('canvas'),L=previewSize.L,s=c.width/L.width,mask=cv(c.width,c.height);drawText(mask.getContext('2d'),L,s,'#ffffff');
  const a=mask.getContext('2d').getImageData(0,0,c.width,c.height).data,p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  let missing=0,ink=0;for(let i=0;i<a.length;i+=4)if(a[i+3]>245){ink++;if(p[i]<180||p[i+1]>180)missing++;}
  const bounds=visibleBounds(p,c.width,c.height);return {ink,missing,bounds,w:c.width,h:c.height,t:readLayerStack().transforms['text-box'],svg:vectorSVG()};
 });
 assert.ok(result.t.x>0&&result.t.y>0,'Dragging updates text position');assert.ok(result.ink>500);assert.equal(result.missing,0,'Visible letters agree with transformed cloud silhouette');
 assert.ok(result.bounds.x>0&&result.bounds.y>0&&result.bounds.x+result.bounds.width<result.w&&result.bounds.y+result.bounds.height<result.h,'Expanded raster contains cloud and text');
 assert.match(result.svg,/<svg/);assert.deepEqual(errors,[]);
 console.log('PASS: cloud text drag/resize retains letters and following border in editor and SVG');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
