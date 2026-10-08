const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
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

  await page.evaluate(()=>{window.__exactDragDebug={down:0,move:0,live:[]};labelSurface.addEventListener('pointerdown',()=>window.__exactDragDebug.down++,true);labelSurface.addEventListener('pointermove',()=>{window.__exactDragDebug.move++;const item=selectedGraphic();window.__exactDragDebug.live.push({drag:graphicDrag&&{id:graphicDrag.id,mode:graphicDrag.mode},x:item?.x,y:item?.y})})});
  // Free photo blocks compact their local coordinates after preview. Compare
  // rendered centers in viewport space so rebasing cannot look like a failed drag.
  const graphicGeometry=async()=>Promise.all(ids.map(async id=>{
    const box=await page.locator(`.graphicOverlay[data-graphic-id="${id}"]`).boundingBox();
    assert.ok(box,'graphic overlay must remain visible: '+id);
    return {id,x:box.x+box.width/2,y:box.y+box.height/2,width:box.width,height:box.height};
  }));
  const beforeWorld=await graphicGeometry();
  await page.mouse.move(ob.x+ob.width/2,ob.y+ob.height/2);await page.mouse.down();
  await page.mouse.move(ob.x+ob.width/2+80,ob.y+ob.height/2+35,{steps:8});
  const live=await page.evaluate(()=>window.__exactDragDebug);
  assert.ok(live.down>0&&live.move>0&&live.live.some(state=>state.drag?.mode==='move'&&(Math.abs(state.x-before[0].x)>1||Math.abs(state.y-before[0].y)>1)), 'pointer gesture must change the selected member during drag');
  await page.mouse.up();await page.waitForTimeout(180);
  const afterWorld=await graphicGeometry();
  const context=JSON.stringify({beforeWorld,afterWorld});
  const close=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<2,message+': '+context);
  close(afterWorld[0].x-beforeWorld[0].x,80,'selected group member must follow horizontal drag');
  close(afterWorld[0].y-beforeWorld[0].y,35,'selected group member must follow vertical drag');
  close(afterWorld[1].x,beforeWorld[1].x,'sibling horizontal position must remain fixed');
  close(afterWorld[1].y,beforeWorld[1].y,'sibling vertical position must remain fixed');
  for(let index=0;index<ids.length;index++){
    close(afterWorld[index].width,beforeWorld[index].width,'drag must preserve graphic width');
    close(afterWorld[index].height,beforeWorld[index].height,'drag must preserve graphic height');
  }
  const after=await page.evaluate(ids=>ids.map(id=>{const x=decorations.find(g=>g.id===id);return {groupId:x.groupId}}),ids);
  assert.deepEqual(after.map(x=>x.groupId),before.map(x=>x.groupId),'exact drag must preserve saved group membership');

  await page.evaluate(async id=>{await selectLayerUnit(activeLabelId,id,false,false);await groupGraphics(true)},ids[0]);
  assert.ok(await page.evaluate(()=>decorations.every(x=>!x.groupId)),'Ungroup from an exact member must clear the whole saved group');
  assert.deepEqual(errors,[]);
  console.log('PASS: exact Layers selection isolates one grouped graphic; sibling stays fixed; ungroup clears group');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
