const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.TEMHOA_CHROMIUM?{executablePath:process.env.TEMHOA_CHROMIUM}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(process.cwd()+'/TemHoa-MinhDien.html').href);await page.waitForTimeout(700);
  await page.getByRole('button',{name:'Thêm mẫu',exact:true}).click();
  await page.evaluate(async()=>{await newDesignText('<div>Một</div>',null,{x:2,y:2,width:6});await newDesignText('<div>Hai</div>',null,{x:10,y:8,width:6});await newDesignText('<div>Ba</div>',null,{x:18,y:14,width:6});designEditing=false;zoom()});
  const textIds=await page.evaluate(()=>labels.filter(label=>label.settings.designKind==='text').map(label=>label.id));
  await page.locator('#labelSurface').click({position:{x:10,y:10}});
  await page.locator('.otherLabel[data-label-id="'+textIds[0]+'"]').click({modifiers:['Shift'],position:{x:10,y:10}});
  assert.equal(await page.evaluate(()=>selectedLabels().length),2);
  await page.locator('#groupGraphics').click();await page.waitForFunction(()=>!groupBusy&&!!labelGroupKey(currentLabel()));
  assert.equal(await page.evaluate(()=>labelGroupMembers(currentLabel()).length),2);
  await page.locator('.otherLabel[data-label-id="'+textIds[0]+'"]').click({button:'right',position:{x:10,y:10}});
  await page.locator('#labelContextMenu').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>selectedLabels().length),2);
  await page.locator('#labelContextMenu .ctxItem').filter({has:page.locator('.ctxText', {hasText:'Bỏ nhóm'})}).click();await page.waitForFunction(()=>!groupBusy&&!labelGroupKey(currentLabel()));
  assert.equal(await page.evaluate(()=>selectedLabels().length),2);
  await page.locator('#labelSurface').click({button:'right',position:{x:10,y:10}});
  assert.equal(await page.evaluate(()=>selectedLabels().length),2);
  await page.locator('#labelContextMenu .ctxText').getByText('Căn chỉnh thành phần',{exact:true}).hover();await page.locator('#labelContextMenu .ctxText').getByText('Căn trên',{exact:true}).click();
  await page.waitForFunction(()=>new Set(selectedLabels().map(label=>Number(label.settings.labelY))).size===1);
  await page.evaluate(()=>{selectedLabelSet=new Set(labels.filter(label=>label.settings.designKind==='text').map(label=>label.id));syncGraphicControls()});
  const outer=await page.evaluate(()=>wholeGroupBounds(selectedLabels()));await page.evaluate(()=>contextDistributeSelection('horizontal'));
  const boxes=await page.evaluate(()=>selectedLabels().map(labelGeometry).sort((a,b)=>a.x-b.x));
  assert.ok(Math.abs((boxes[1].x-boxes[0].x-boxes[0].width)-(boxes[2].x-boxes[1].x-boxes[1].width))<1e-8);
  assert.ok(Math.abs(boxes[0].x-outer.x)<1e-8);
  await page.evaluate(()=>contextToggleLock());assert.equal(await page.evaluate(()=>contextSelectionLocked()),true);
  const locked=await page.evaluate(()=>selectedLabels().map(label=>[label.settings.labelX,label.settings.labelY]));await page.evaluate(()=>contextAlignSelection('left'));assert.deepEqual(await page.evaluate(()=>selectedLabels().map(label=>[label.settings.labelX,label.settings.labelY])),locked);
  const saved=await page.evaluate(()=>settings());await page.evaluate(async data=>restoreLabelDocument(data),saved);assert.equal(await page.evaluate(()=>currentLabel().settings.labelLocked),true);await page.evaluate(()=>{selectedLabelSet=new Set(labels.filter(label=>label.settings.designKind==='text').map(label=>label.id));return contextToggleLock()});
  await page.locator('.layerSectionTitle').filter({hasText:'Khối chữ'}).nth(1).click();await page.locator('.layerSectionTitle').filter({hasText:'Khối chữ'}).nth(2).click({modifiers:['Shift']});assert.equal(await page.evaluate(()=>selectedLabels().length),2);
  await page.locator('#groupGraphics').click();await page.waitForFunction(()=>!groupBusy&&labelGroupMembers(currentLabel()).length===2);
  const groupBefore=await page.evaluate(()=>labelGroupMembers(currentLabel()).map(labelGeometry));
  const surface=await page.locator('#labelSurface').boundingBox();await page.mouse.move(surface.x+10,surface.y+10);await page.mouse.down();await page.waitForTimeout(150);await page.mouse.move(surface.x+55,surface.y+35,{steps:5});await page.mouse.up();await page.waitForTimeout(250);
  const groupAfter=await page.evaluate(()=>labelGroupMembers(currentLabel()).map(labelGeometry));assert.ok(groupAfter[0].x>groupBefore[0].x);assert.ok(Math.abs((groupAfter[0].x-groupBefore[0].x)-(groupAfter[1].x-groupBefore[1].x))<1e-8);
  await page.evaluate(async()=>{selectedGraphicId=null;await addGraphic('heart');await addGraphic('smile');selectGraphicItems(decorations[0]);selectGraphicItems(decorations[1],true);positionGraphicOverlays();syncGraphicControls()});
  await page.locator('.graphicOverlay').first().click({button:'right',force:true});await page.locator('#labelContextMenu').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>graphicSelection().length),2);
  await page.locator('#labelContextMenu .ctxItem').filter({has:page.locator('.ctxText', {hasText:/^Nhóm$/})}).click();await page.waitForFunction(()=>!groupBusy&&graphicGroupItems(selectedGraphic()).length===2);
  await page.evaluate(()=>contextDuplicateSelection());assert.equal(await page.evaluate(()=>decorations.length),4);
  await page.evaluate(()=>groupGraphics(true));await page.evaluate(()=>contextDuplicateSelection());assert.equal(await page.evaluate(()=>decorations.length),6);assert.equal(await page.evaluate(()=>graphicSelection().length),2);
  await page.evaluate(()=>contextDeleteSelection());assert.equal(await page.evaluate(()=>decorations.length),4);
  await page.evaluate(async()=>{selectedGraphicId=null;selectedGraphicSet.clear();selectedLabelSet=new Set(labels.filter(label=>label.settings.designKind==='text').map(label=>label.id));await groupGraphics(true);await contextDuplicateSelection()});assert.equal(await page.evaluate(()=>labels.filter(label=>label.settings.designKind==='text').length),6);assert.equal(await page.evaluate(()=>selectedLabels().length),3);assert.ok(await page.evaluate(()=>selectedLabels().every(label=>!labelGroupKey(label))));
  await page.evaluate(()=>contextDeleteSelection());assert.equal(await page.evaluate(()=>labels.filter(label=>label.settings.designKind==='text').length),3);

  assert.deepEqual(errors,[]);console.log('PASS: grouping, selection, menu, alignment, spacing, lock persistence, group drag and graphic duplication');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
