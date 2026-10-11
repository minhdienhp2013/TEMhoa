// Real raster regression for the production painters, without DOM/browser dependencies.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createCanvas}=require('@napi-rs/canvas');
const html=fs.readFileSync('TemHoa-MinhDien.html','utf8');
const between=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
let transform={x:0,y:0,sx:1,sy:1},fixture;
const values={width:{value:12},fill:{value:'#ff0000'},body:{value:'#ffffff'},edge:{value:'#0000ff'}};
const context={console,cv:createCanvas,$:id=>values[id],number:(id)=>Number(values[id].value),textWidthLimit:()=>320,layout:()=>fixture,readLayerStack:()=>({transforms:{'text-box':transform}}),isDesign:()=>false,canvasPaint:()=> '#ff0000',colorStyles:{fill:{type:'solid'},body:{type:'solid'},edge:{type:'solid'}},previewPage:()=>({width:29.7,height:21}),drawGraphic:()=>{}};
vm.createContext(context);
vm.runInContext(between('function dilate(', '\nlet fontWarnings='),context);
vm.runInContext(between('function textRunBounds(', '\nasync function preview()'),context);
vm.runInContext('const textOnlyDraw=drawText;\n'+between('function layerUnits(', '\nfunction layerStackSVG('),context);
vm.runInContext(between(' const getTransform=key=>',' function sync(){'),context);
vm.runInContext(between('function labelGeometry(label)', '\n'),context);
const font='italic 48px "DejaVu Sans"',measure=createCanvas(1,1).getContext('2d');measure.font=font;
fixture={width:160,height:160,pad:12,border:3,margin:20,runs:[{text:'Chúc Mừng Sinh Nhật',font,x:20,y:70,width:measure.measureText('Chúc Mừng Sinh Nhật').width,size:48},{text:'Đặng Ánh',font,x:20,y:130,width:measure.measureText('Đặng Ánh').width,size:48}]};
for(const t of [{x:0,y:0,sx:1,sy:1},{x:250,y:80,sx:1,sy:1},{x:-180,y:-90,sx:1,sy:1},{x:40,y:20,sx:1.8,sy:1.4}]){
 transform=t;
 const result=vm.runInContext('render(false,1,false)',context),L=result.L,mask=createCanvas(result.c.width,result.c.height);
 context.mask=mask;context.L=L;context.s=result.c.width/L.width;
 vm.runInContext("drawText(mask.getContext('2d'),L,s,'#ffffff')",context);
 const rgba=result.c.getContext('2d').getImageData(0,0,result.c.width,result.c.height).data,alpha=mask.getContext('2d').getImageData(0,0,mask.width,mask.height).data;
 let ink=0,edge=0;
 for(let i=0;i<rgba.length;i+=4){if(alpha[i+3]>200){ink++;assert.ok(rgba[i]>200&&rgba[i+2]<160,'Every transformed text pixel is visible above the cloud '+JSON.stringify({t,i,rgba:[...rgba.slice(i,i+4)],a:alpha[i+3]}));}if(rgba[i+2]>200&&rgba[i]<20)edge++;}
 assert.ok(ink>500&&edge>100,'Text and following cloud both remain present');
 context.rgba=rgba;context.w=result.c.width;context.h=result.c.height;
 const b=vm.runInContext('visibleBounds(rgba,w,h)',context);
 assert.ok(b.x>0&&b.y>0&&b.x+b.width<result.c.width&&b.y+b.height<result.c.height,'Cloud and glyph overhangs fit inside the raster');
 assert.ok(Math.abs(result.cm/L.width-12/fixture.width)<1e-10,'Expanding raster preserves physical scale');
 const g=context.labelGeometry({settings:{labelX:2,labelY:3,labelScaleX:1,labelScaleY:1},size:result});
 const u=result.cm/L.width;
 assert.ok(Math.abs(g.x+(L.renderOffsetX+20*t.sx+t.x)*u-(2+(20*t.sx+t.x)*u))<1e-9,'Raster origin preserves page placement');
 // Compare to an uncropped reference with ample room, retaining true ink area.
 const reference=createCanvas(2400,1200),ctx=reference.getContext('2d');ctx.translate(500,300);ctx.translate(t.x,t.y);ctx.scale(t.sx,t.sy);context.reference=ctx;
 vm.runInContext("textOnlyDraw(reference,layout(),1,'#ffffff')",context);
 const pixels=reference.getContext('2d').getImageData(0,0,2400,1200).data;let referenceInk=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>200)referenceInk++;
 assert.ok(Math.abs(ink-referenceInk)<referenceInk*.02,'No text lost against uncropped reference');
}
console.log('PASS: translated/resized Vietnamese and italic text, cloud masks, raster bounds, and page scale');
