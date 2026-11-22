import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {planOriginalShipHorn} from '../src/rom-sfx.js';
const aram=fs.readFileSync(new URL('../assets/audio/aram.bin',import.meta.url));
test('original ship horn follows port3 command5 and its chained voice14',()=>{
 const plan=planOriginalShipHorn(aram);assert.deepEqual(plan.streams,[{command:5,pointer:0x1329,channel:7},{command:14,pointer:0x130c,channel:6}]);assert.equal(plan.duration,3.732);
 assert.deepEqual(plan.voices.map(v=>[v.channel,v.tick,v.endTick,v.gateEndTick,v.left,v.right,v.sample,v.pitch]),[[7,3,390,388,35,35,5,3707],[6,3,21,19,0,0,5,3707],[6,21,408,406,0,10,5,3707]]);
 for(const voice of plan.voices)assert.deepEqual(voice.envelope,{adsr1:0x86,adsr2:0xeb,gain:0x7f});
});
test('untranslated ship effect slides fail explicitly instead of guessed playback',()=>{
 const changed=Uint8Array.from(aram);changed[0x1331]=0x9d;assert.throws(()=>planOriginalShipHorn(changed),/nonconstant/);
});
