import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('original sample directory points into ARAM and WAVs contain nonzero PCM',()=>{
 const entries=JSON.parse(fs.readFileSync(new URL('../assets/audio/directory.json',import.meta.url))),aram=fs.readFileSync(new URL('../assets/audio/aram.bin',import.meta.url));
 for(const e of entries){
  assert.equal(aram.readUInt16LE(0x3500+e.index*4),e.start);
  const wav=fs.readFileSync(new URL(`../assets/audio/${e.name}.wav`,import.meta.url));
  assert.equal(wav.readUInt32LE(24),32000);
  let energy=0;for(let p=44;p+1<wav.length;p+=2)energy+=wav.readInt16LE(p)**2;
  assert.ok(energy>0,e.name);
  if(e.loop){assert.ok(e.loopAddress>=e.start);assert.ok((e.loopAddress-e.start)/9*16<e.samples);}
 }
});
