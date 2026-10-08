'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage();
    await page.goto('file://' + path.resolve(__dirname,'../editor-render.js').replace(/editor-render\.js$/,'TemHoa-MinhDien.html'));
    await page.addScriptTag({path:path.resolve(__dirname,'../editor-render.js')});
    const result = await page.evaluate(() => {
      const api=window.TEMHOA_TEXT_INK;
      const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
      const tests=[];
      for(const font of ['Arial','Georgia'])for(const size of [16,96,240])for(const align of ['left','center','right'])for(const zoom of [1,2]){
        const text='Chúc Mừng\nSinh Nhật';
        ctx.font=size+'px '+font;
        const runs=text.split('\n').map((line,i)=>({text:line,font:ctx.font,size,x:0,y:(i+1)*size*1.3,width:ctx.measureText(line).width}));
        const L={width:Math.ceil(Math.max(...runs.map(r=>r.width))),height:Math.ceil(size*2.6),runs};
        const fixed=api.protectLayout(ctx,L);
        for(const run of fixed.runs){const b=api.inkBounds(ctx,run);if(b.left<1.5||b.top<1.5||b.right>fixed.width-1.5||b.bottom>fixed.height-1.5)throw Error('Ink clipped: '+JSON.stringify({font,size,align,zoom,b,fixed}));}
        if(fixed.runs.length!==2)throw Error('Multiline lost');
        tests.push(font+' '+size+' '+align+' '+zoom);
      }
      return tests.length;
    });
    assert.equal(result,36);
    console.log('PASS text-ink-bounds: '+result+' cases');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
