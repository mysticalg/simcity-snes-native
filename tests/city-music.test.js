import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {cityMusicTrack} from '../src/city-music.js';
import {planOriginalCityTrack} from '../src/rom-track.js';
import {spcNextNoteIsTie} from '../src/rom-sequence.js';
const aram=fs.readFileSync(new URL('../assets/audio/aram.bin',import.meta.url));
test('city category selects all six translated original promotion themes',()=>{
 assert.deepEqual([0,1,2,3,4,5].map(cityMusicTrack),[1,2,3,4,5,6]);
 assert.equal(cityMusicTrack(0,1),2);assert.equal(cityMusicTrack(0,2),3);assert.equal(cityMusicTrack(NaN),1);assert.equal(cityMusicTrack(-2),1);
 assert.throws(()=>planOriginalCityTrack(aram,7),/Unsupported city music track/);
});
test('three native themes match original SPC note registers, fades and gate timings',()=>{
 const reference=JSON.parse(fs.readFileSync(new URL('../research/reference-spc-city-themes.json',import.meta.url)));
 assert.equal(reference.exitCode,0);assert.equal(crypto.createHash('sha256').update(aram).digest('hex'),reference.aramSHA256);
 for(const c of reference.cases){const plan=planOriginalCityTrack(aram,c.trackId);assert.equal(plan.patterns.at(-1).endTick,c.endTick);
  assert.deepEqual(plan.events.map(e=>({tick:e.tick,channel:e.channel,gateEndTick:e.gateEndTick,keyOffTick:e.keyOffTick,mixAutomation:e.mixAutomation,sample:e.sample,pitch:e.pitch,left:e.dspVolumes.left&255,right:e.dspVolumes.right&255,tempo:e.tempo,masterVolume:e.masterVolume})),c.events);
 }
});
test('original short city-theme note holds through tie lookahead outside its replaced pattern',()=>{
 const plan=planOriginalCityTrack(aram,3),note=plan.events.find(e=>e.channel===7&&e.tick===19);
 assert.equal(note.length,5);assert.equal(note.gateEndTick,24);assert.equal(note.keyOffTick,null);assert.ok(note.nextIsTie);
 const village=planOriginalCityTrack(aram,1),first=village.events[0];assert.equal(first.gateEndTick,34);assert.equal(first.keyOffTick,34);
 const fading=village.events.find(e=>e.tick===1296&&e.channel===2);assert.equal(fading.volume,197);assert.equal(fading.dspVolumes.left,4);
});
test('tie lookahead follows phrase calls, repeats and final returns without executing commands',()=>{
 const bytes=new Uint8Array(64);bytes.set([0xe0,3,0xef,32,0,1,0x91]);bytes.set([0xc8,0],32);
 assert.ok(spcNextNoteIsTie(bytes,0));assert.ok(spcNextNoteIsTie(bytes,33,{remaining:2,target:32,returnTo:6}));assert.equal(spcNextNoteIsTie(bytes,33,{remaining:1,target:32,returnTo:6}),false);
});
test('Town and City bodies are stable repeat patterns with original quantized times',()=>{
 for(const id of [2,3]){const p=planOriginalCityTrack(aram,id,{maxPatterns:4}),rows=p.patterns.map(pattern=>p.events.filter(e=>e.tick>=pattern.startTick&&e.tick<pattern.endTick).map(e=>[e.tick-pattern.startTick,e.channel,e.note,e.sample,e.pitch,e.articulation,e.volume]));assert.deepEqual(rows[1],rows[2]);assert.deepEqual(rows[2],rows[3]);assert.ok(p.events.length>1000);assert.equal(p.patterns[0].endTick,24);}
});
