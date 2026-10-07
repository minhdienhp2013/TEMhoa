const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(process.cwd()+'/TemHoa-MinhDien.html').href);
  await page.evaluate(async()=>{
    await createBlankDesign(false);
    await addGraphic('grin');await addGraphic('sad');
    decorations[0].x=180;decorations[0].y=180;decorations[1].x=420;decorations[1].y=260;
    selectGraphicItems(decorations[0],false);selectGraphicItems(decorations[1],true);
    await contextGroupSelection(false);
    window.__ids=decorations.map(x=>x.id);
    await selectLayerUnit(activeLabelId,window.__ids[0],false,false);
  });
  const ids=await page.evaluate(()=>window.__ids);
  assert.equal(await page.evaluate(()=>graphicSelection().length),1);
  const before=await page.evaluate(ids=>ids.map(id=>{const x=decorations.find(g=>g.id===id);return {id,x:x.x,y:x.y,w:x.width,h:x.height,groupId:x.groupId}}),ids);
  await page.evaluate(async()=>{await $('copyGraphic').onclick()});
  const duplicate=await page.evaluate(()=>decorations.at(-1));
  assert.equal(duplicate.groupId,'','duplicating an exact group member must create an independent layer');
  assert.equal(await page.evaluate(()=>decorations.length),3);
  await page.evaluate(async id=>{await selectLayerUnit(activeLabelId,id,false,false);await $('deleteGraphic').onclick()},duplicate.id);
  assert.equal(await page.evaluate(()=>decorations.length),2);
  await page.evaluate(async id=>{await selectLayerUnit(activeLabelId,id,false,false)},ids[0]);
  assert.ok(before[0].groupId&&before[0].groupId===before[1].groupId);

  const selectedOverlay=page.locator('.graphicOverlay.selected');
  assert.equal(await selectedOverlay.count(),1);
  const ob=await selectedOverlay.boundingBox();assert.ok(ob);
  const individual=await page.evaluate(id=>{const item=decorations.find(x=>x.id===id),L=previewSize.L,sx=parseFloat(labelSurface.style.width)/L.width,sy=parseFloat(labelSurface.style.height)/L.height;return {w:item.width*sx,h:item.height*sy}},ids[0]);
  assert.ok(Math.abs(ob.width-individual.w)<3&&Math.abs(ob.height-individual.h)<3,'exact layer overlay must match one graphic, not the whole group');

  await page.evaluate(()=>{window.__exactDragDebug={down:0,move:0};labelSurface.addEventListener('pointerdown',()=>window.__exactDragDebug.down++,true);labelSurface.addEventListener('pointermove',()=>window.__exactDragDebug.move++,true)});
  await page.mouse.move(ob.x+ob.width/2,ob.y+ob.height/2);await page.mouse.down();
  await page.mouse.move(ob.x+ob.width/2+80,ob.y+ob.height/2+35,{steps:8});await page.mouse.up();await page.waitForTimeout(180);
  const after=await page.evaluate(ids=>ids.map(id=>{const x=decorations.find(g=>g.id===id);return {x:x.x,y:x.y,groupId:x.groupId}}),ids);
  const debug=await page.evaluate(()=>({events:window.__exactDragDebug,selectedGraphicId,selected:[...selectedGraphicSet],editLayer:$('editLayer').value,drag:graphicDrag&&{id:graphicDrag.id,mode:graphicDrag.mode}}));
  console.log('EXACT_DRAG_DEBUG '+JSON.stringify({before:before[0],after:after[0],debug}));
  assert.ok(after[0].x!==before[0].x||after[0].y!==before[0].y,'selected group member must move: '+JSON.stringify(debug));
  assert.equal(after[1].x,before[1].x);assert.equal(after[1].y,before[1].y);

  await page.evaluate(async id=>{await selectLayerUnit(activeLabelId,id,false,false);await groupGraphics(true)},ids[0]);
  assert.ok(await page.evaluate(()=>decorations.every(x=>!x.groupId)),'Ungroup from an exact member must clear the whole saved group');
  assert.deepEqual(errors,[]);
  console.log('PASS: exact Layers selection isolates one grouped graphic; sibling stays fixed; ungroup clears group');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
