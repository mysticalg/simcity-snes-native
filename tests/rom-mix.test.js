import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {spcVoiceVolumes} from '../src/rom-mix.js';
const aram=fs.readFileSync(new URL('../assets/audio/aram.bin',import.meta.url));
test('SPC velocity/master/channel stages truncate each multiply before squaring',()=>{
 // 255*150>>8=149; 149*229>>8=133; 133*230>>8=119;
 // 119*119>>8=55; pan table center81 gives 55*81>>8=17.
 assert.deepEqual(spcVoiceVolumes(aram,{volume:230,masterVolume:150,articulation:0x7d}),{amplitude:55,left:17,right:17});
 assert.deepEqual(spcVoiceVolumes(aram,{volume:0}),{amplitude:0,left:0,right:0});assert.deepEqual(spcVoiceVolumes(aram,{masterVolume:0}),{amplitude:0,left:0,right:0});
 assert.ok(spcVoiceVolumes(aram,{articulation:0x7f}).amplitude>spcVoiceVolumes(aram,{articulation:0x70}).amplitude);
});
test('SPC pan endpoints, fractional interpolation and phase inversion use original table',()=>{
 const state={volume:230,masterVolume:150,articulation:0x7d};
 assert.deepEqual(spcVoiceVolumes(aram,{...state,pan:0}),{amplitude:55,left:0,right:27});assert.deepEqual(spcVoiceVolumes(aram,{...state,pan:20}),{amplitude:55,left:27,right:0});
 assert.deepEqual(spcVoiceVolumes(aram,{...state,pan:9,panFraction:128}),{amplitude:55,left:15,right:18});
 assert.deepEqual(spcVoiceVolumes(aram,{...state,pan:0x8a}),{amplitude:55,left:-17,right:17});assert.deepEqual(spcVoiceVolumes(aram,{...state,pan:0x4a}),{amplitude:55,left:17,right:-17});
});
