import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {instrumentEnvelope,renderSpcEnvelope} from '../src/rom-envelope.js';
const aram=fs.readFileSync(new URL('../assets/audio/aram.bin',import.meta.url));
test('instrument records select original ADSR and gain bytes',()=>{
 assert.deepEqual(instrumentEnvelope(aram,0),{adsr1:0x8f,adsr2:0xe0,gain:0xb8});assert.deepEqual(instrumentEnvelope(aram,15),{adsr1:0x8f,adsr2:0xee,gain:0xb8});
});
test('fast attack, held sustain and key-off release follow 11-bit envelope steps',()=>{
 const env=renderSpcEnvelope(instrumentEnvelope(aram,0),{gateSamples:1000});
 assert.deepEqual(Array.from(env.slice(0,8)),[0,0,0,0,0,0,.5,2047/2048]);assert.equal(env[999],2047/2048);assert.equal(env[1000],2047/2048);assert.equal(env[1001],2039/2048);assert.equal(env[1255],7/2048);
 const fading=renderSpcEnvelope(instrumentEnvelope(aram,15),{gateSamples:32000});assert.equal(fading[31999],468/2048);assert.equal(fading.at(-1),0);
});
test('envelope rate counter phase moves slow attack by one sample',()=>{
 const instrument={adsr1:0x80,adsr2:0xe0,gain:0},options={gateSamples:3000,keyOnDelay:0};
 const first=renderSpcEnvelope(instrument,options),shifted=renderSpcEnvelope(instrument,{...options,counterPhase:1});assert.equal(first.findIndex(v=>v>0),2048);assert.equal(shifted.findIndex(v=>v>0),2047);
});
test('direct gain and bent increase retain hardware envelope scale',()=>{
 const direct=renderSpcEnvelope({adsr1:0,adsr2:0,gain:0x40},{gateSamples:1000,keyOnDelay:0});assert.equal(direct[1],.5);assert.equal(direct[1128],0);
 const bent=renderSpcEnvelope({adsr1:0,adsr2:0,gain:0xff},{gateSamples:100,keyOnDelay:0});assert.equal(bent[48],.75);assert.equal(bent[49],1544/2048);
});
