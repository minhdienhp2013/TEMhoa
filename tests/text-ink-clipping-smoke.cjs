'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {chromium} = require('playwright');
(async () => {
  const browser = await chromium.launch({
    headless:true,args:['--no-sandbox'],
    ...(process.env.TEMHOA_CHROMIUM?{executablePath:process.env.TEMHOA_CHROMIUM}:{})
  });
  try{
    const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
    await page.goto('about:blank');
    await page.addScriptTag({content:fs.readFileSync(path.join(__dirname,'..','editor-render.js'),'utf8').split('/* TEMhoa AI1:')[1].replace(/^/, '/* TEMhoa AI1:')});
    const result=await page.evaluate(()=>{
      const variants=[['Georgia,serif','italic'],['Arial,sans-serif','normal']];
      const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
      const pixelSum=c=>{const p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<p.length;i+=4)n+=p[i];return n};
      function draw(c,runs){
        const ctx=c.getContext('2d');ctx.textBaseline='alphabetic';ctx.textAlign='left';
        runs.forEach(r=>{ctx.save();ctx.translate(r.x,r.y);ctx.rotate(r.angle||0);ctx.scale(r.scaleX||1,r.scaleY||1);ctx.font=r.font;ctx.fillText(r.text,0,0);ctx.restore()});
      }
      let cases=0,previouslyClipped=0,restored=0;
      for(const [family,style] of variants) for(const align of ['left','center','right']) for(const size of [32,96,220]) for(const scale of [1,1.6]){
        const font=style+' '+size+'px '+family;
        const shift=align==='right'?-size*.3:align==='center'?-size*.1:0;
        const runs=[{text:'Chúc Mừng',font,x:-Math.round(size*.17)+shift,y:size*.65,size,scaleX:scale,scaleY:scale},
          {text:'Sinh Nhật',font,x:-Math.round(size*.11)+shift,y:size*1.75,size,scaleX:scale,scaleY:scale}];
        const original={width:Math.ceil(size*2.75*scale),height:Math.ceil(size*2.6*scale),runs,graphics:[{x:12,y:18,kind:'image'}],offsetX:0,offsetY:0};
        const before=mk(original.width,original.height);draw(before,runs);
        const out=TEMHOA_TEXT_INK.protectLayout(before.getContext('2d'),original);
        const after=mk(out.width,out.height);draw(after,out.runs);
        const ref=mk(out.width+800,out.height+800);
        draw(ref,runs.map(r=>({...r,x:r.x+400+(out.inkPadding?.left||0),y:r.y+400+(out.inkPadding?.top||0)})));
        const clipped=pixelSum(before),actual=pixelSum(after),full=pixelSum(ref);
        // Absolute raster origins can alter tiny antialias alpha values. Test clipping
        // directly: not one reference alpha value may fall outside the guarded box.
        const referencePixels=ref.getContext('2d').getImageData(0,0,ref.width,ref.height).data;let outsideAlpha=0;
        for(let y=0;y<ref.height;y++)for(let x=0;x<ref.width;x++){
          if(x<400||y<400||x>=400+out.width||y>=400+out.height)outsideAlpha+=referencePixels[(y*ref.width+x)*4+3];
        }
        assertShim(outsideAlpha===0,'reference glyph ink outside guarded canvas');
        assertShim(actual>=clipped,'guard must never remove existing alpha');
        assertShim(Math.abs(actual-full)<=Math.max(1,full*.00002),'protect all actual glyph ink');
        for(const run of out.runs){
          const box=TEMHOA_TEXT_INK.inkBounds(after.getContext('2d'),run);
          assertShim(box.left>=1&&box.top>=1&&box.right<=out.width-1&&box.bottom<=out.height-1,'run still clipped');
        }
        if(out!==original){
          assertShim(out.graphics[0].x===original.graphics[0].x+out.inkPadding.left,'graphic shifted differently from text');
          assertShim(original.runs[0].x===runs[0].x,'original layout mutated');
        }
        if(clipped<full)previouslyClipped++;if(outsideAlpha===0&&Math.abs(actual-full)<=Math.max(1,full*.00002))restored++;
        cases++;
        if(style==='italic'&&align==='left'&&size===220&&scale===1.6){
          window.__before=before.toDataURL('image/png');window.__after=after.toDataURL('image/png');
        }
      }
      function assertShim(value,message){if(!value)throw Error(message)}
      const safe={width:600,height:200,runs:[{text:'Chúc Mừng',font:'32px Arial',size:32,x:100,y:120}]};
      assertShim(TEMHOA_TEXT_INK.protectLayout(mk(600,200).getContext('2d'),safe)===safe,'unaffected layout should not shift');
      const ctx=mk(1,1).getContext('2d');
      const rotated=TEMHOA_TEXT_INK.inkBounds(ctx,{text:'Chúc Mừng',font:'italic 150px Georgia',size:150,x:12,y:24,angle:.4,scaleX:1.3,scaleY:1.7});
      assertShim(rotated.left<rotated.right&&rotated.top<rotated.bottom,'rotation bounds invalid');
      const decorated=TEMHOA_TEXT_INK.inkBounds(ctx,{text:'Chúc Mừng',font:'150px Arial',size:150,x:12,y:24},{strokeWidth:12,shadowBlur:9,shadowOffsetX:-8});
      const plain=TEMHOA_TEXT_INK.inkBounds(ctx,{text:'Chúc Mừng',font:'150px Arial',size:150,x:12,y:24});
      assertShim(decorated.left<plain.left&&decorated.right>plain.right,'stroke/shadow bounds lost');
      return {cases,previouslyClipped,restored};
    });
    assert.equal(result.cases,36);
    assert.ok(result.previouslyClipped>0,'must reproduce missing real ink');
    assert.equal(result.restored,36,'all cases need intact raster');
    console.log('PASS text-ink clipping regression:',JSON.stringify(result));
    if(process.env.TEMHOA_SCREENSHOTS){
      fs.mkdirSync(process.env.TEMHOA_SCREENSHOTS,{recursive:true});
      const imgs=await page.evaluate(()=>[window.__before,window.__after]);
      for(const [i,name] of ['temhoa-chu-bi-cat-truoc.png','temhoa-chu-khong-cat-sau.png'].entries())
        fs.writeFileSync(path.join(process.env.TEMHOA_SCREENSHOTS,name),Buffer.from(imgs[i].split(',')[1],'base64'));
    }
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
