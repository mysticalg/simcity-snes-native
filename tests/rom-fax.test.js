import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {FAX_ASSETS,faxAssetPath,faxMemory,faxScene,faxFrame,faxAppearance,faxPaperStep} from '../src/rom-fax.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url))),graphics=read('research/reference-fax-graphics-v0.2.53.json'),animation=read('research/reference-fax-animation-v0.2.53.json'),files=Object.fromEntries(Object.keys(FAX_ASSETS).map(n=>[n,new Uint8Array(fs.readFileSync(new URL('../'+faxAssetPath(n),import.meta.url)))])),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
test('native fax memory and 21 RGB frames match original CPU/PPU captures',()=>{
 assert.equal(graphics.romSHA256,read('assets/manifest.json').romSHA256);assert.equal(graphics.rgbaPixels,1204224);
 for(const memory of graphics.memories){const scene=faxScene(files,memory.screen);assert.equal(sha(Buffer.concat([scene.vram.subarray(0,0xb000),scene.vram.subarray(0xc000,0xd000)])),memory.writtenVramSHA256);assert.equal(sha(scene.cgram),memory.cgramSHA256);assert.equal(sha(scene.oam),memory.oamSHA256);
  for(const r of graphics.results.filter(r=>r.screen===memory.screen))assert.equal(sha(faxFrame(scene,r.scroll,r.brightness)),r.referenceOpaqueRgbaSHA256);
 }
});
test('all 414 original menu NMI states match fade, hold and synchronized feed',()=>{
 assert.equal(animation.frames,414);for(const c of animation.cases)for(const[r,row]of c.states.entries()){const a=faxAppearance(r);assert.equal(a.display,row[0]);assert.equal(a.scroll&65535,row[1]);assert.equal(a.scroll&65535,row[2]);assert.equal(a.menu,row[3]);assert.equal(row[4]-c.states[0][4],r);}
 let y=-120;for(let i=0;i<120;i++)y=faxPaperStep(y);assert.equal(y,0);assert.equal(faxPaperStep(y),0);assert.equal(faxAppearance(999).complete,true);
});
test('fax renderer validates inputs and reuses caller-owned frame storage',()=>{
 assert.throws(()=>faxMemory({},9));assert.throws(()=>faxMemory(files,8));assert.throws(()=>faxAppearance(-1));assert.throws(()=>faxAppearance(.5));assert.throws(()=>faxPaperStep(-121));
 const scene=faxScene(files,10),before=sha(scene.vram),data=new Uint8ClampedArray(256*224*4);
 assert.equal(faxFrame(scene,0,15,data),data);assert.equal(sha(scene.vram),before);faxFrame(scene,0,0,data);assert.ok(data.every((n,i)=>n===(i%4===3?255:0)));assert.equal(sha(scene.vram),before);assert.throws(()=>faxFrame(scene,1));assert.throws(()=>faxFrame(scene,0,16));
});
