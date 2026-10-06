const C=require('../studio-core.js'),assert=require('node:assert/strict');
assert.equal(C.normalize('ĐỎ — Hải Phòng'),'do — hai phong');
const p=C.packing({paperWidth:210,paperHeight:297,width:98,height:60,margin:5,gap:4,copies:31});assert.equal(p.pages,4);assert.equal(p.slots.length,31);assert.equal(p.slots.at(-1).page,3);
for(const s of p.slots){assert.ok(s.x>=5&&s.y>=5&&s.x+s.width<=205&&s.y+s.height<=292);}
for(const copies of [0,-1,501,1.1,NaN])assert.throws(()=>C.packing({paperWidth:210,paperHeight:297,width:100,height:60,copies}));
assert.throws(()=>C.packing({paperWidth:148,paperHeight:210,width:150,height:60}));
assert.throws(()=>C.pdf({jpeg:new Uint8Array(),pixelWidth:100,pixelHeight:100,paperWidth:210,paperHeight:297,pages:[[]]}));
console.log('PASS studio core: Vietnamese search, complete packing, invalid quantities and PDF input');
