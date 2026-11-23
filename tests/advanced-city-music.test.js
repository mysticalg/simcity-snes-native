import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {planOriginalCityTrack} from '../src/rom-track.js';import {spcClockPosition,spcClockSeconds,createSpcClock,createSpcGlobals,applySpcGlobal,stepSpcGlobals} from '../src/rom-music-clock.js';import {planSpcVibrato} from '../src/rom-vibrato.js';import {decodeSpcChannel} from '../src/rom-sequence.js';import {cityMusicTrack} from '../src/city-music.js';
const aram=fs.readFileSync('assets/audio/aram.bin'),reference=JSON.parse(fs.readFileSync('research/reference-spc-advanced-themes.json')),plans=new Map(reference.cases.map(c=>[c.trackId,planOriginalCityTrack(aram,c.trackId,{maxPatterns:c.patternCount})]));
const row=e=>({tick:e.tick,channel:e.channel,gateEndTick:e.gateEndTick,keyOffTick:e.keyOffTick,mixAutomation:e.mixAutomation,sample:e.sample,pitch:e.pitch,left:e.dspVolumes.left&255,right:e.dspVolumes.right&255,tempo:e.tempo,masterVolume:e.masterVolume});
test('later city themes retain every original note/gate/mix and global Q8 tick from 29,826 executed driver ticks',()=>{
 assert.equal(reference.exitCode,0);assert.equal(reference.aramSHA256,crypto.createHash('sha256').update(aram).digest('hex'));assert.equal(reference.cases.reduce((n,c)=>n+c.endTick,0),29826);assert.equal(reference.cases.reduce((n,c)=>n+c.events.length,0),8447);
 for(const c of reference.cases){const p=plans.get(c.trackId);assert.equal(p.events.length,c.events.length);for(let i=0;i<p.events.length;i++)assert.deepEqual(row(p.events[i]),c.events[i],`track${c.trackId} note${i}`);for(let tick=0;tick<c.endTick;tick++)assert.deepEqual([...p.globalState.subarray(tick*4,tick*4+4)],c.globals.slice(tick*4,tick*4+4),`track${c.trackId} global tick${tick}`);}
});
test('shared tempo ramp survives an immediate tempo setter until the original countdown expires',()=>{
 const p=plans.get(5);assert.equal(p.globalState[0],12*256+40);assert.equal(p.globalState[42*4],20*256+40);assert.equal(p.globalState[48*4]>>>8,21);assert.equal(p.globalState[49*4],20*256);assert.equal(p.globalState[49*4+2],0);
 const global=createSpcGlobals();global.masterQ8=100*256+127;applySpcGlobal(global,{opcode:0xe6,ticks:2,value:80});assert.equal(stepSpcGlobals(global).masterVolume,90);assert.equal(global.masterQ8,90*256+127);assert.equal(stepSpcGlobals(global).masterVolume,80);assert.equal(global.masterQ8,80*256);
});
test('percussion reads the shared instrument base and a held tie does not force stereo rewriting',()=>{
 const metro=plans.get(5),drum=metro.events.find(e=>e.tick===42&&e.channel===4);assert.equal(drum.instrument,23);assert.equal(drum.sample,23);assert.deepEqual([...new Set(metro.events.filter(e=>e.channel===4).map(e=>e.sample))].sort((a,b)=>a-b),[23,24]);
 const held=plans.get(6).events.find(e=>e.tick===1440&&e.channel===3);assert.deepEqual([held.dspVolumes.left,held.dspVolumes.right],[7,14]);assert.equal(held.gateEndTick,1526);assert.ok(!held.mixAutomation.some(p=>p.tick===1512));
});
test('clock carry and phase match 13,525 actual SPC timer pulses, including fades and distant loops',()=>{
 const r=JSON.parse(fs.readFileSync('research/reference-spc-tempo-clock.json'));assert.equal(r.exitCode,0);assert.equal(r.cases.length,12);assert.equal(r.cases.reduce((n,c)=>n+c.rows.length,0),13525);
 for(const c of r.cases){const clock=plans.get(c.track).clock,start=spcClockPosition(clock,c.start);let tick=c.start;for(const [i,pulse]of c.rows.entries())if(pulse.carry){tick++;const actual=spcClockPosition(clock,tick);assert.equal(actual.pulses-start.pulses,i+1);assert.equal(actual.phase,pulse.phase);assert.equal(actual.tempo,pulse.nextTempo);}assert.equal(tick,c.start+c.count);}
});
test('Megalopolis keeps its complete six-pattern loop and stable original second/third cycles',()=>{
 const p=plans.get(6),signature=(from,to)=>p.events.filter(e=>e.tick>=from&&e.tick<to).map(e=>[e.tick-from,e.channel,e.sample,e.pitch,e.volume,e.tempo,e.masterVolume,e.gateEndTick-e.tick,e.keyOffTick===null?null:e.keyOffTick-e.tick,e.mixAutomation.map(m=>[m.tick-from,m.left,m.right])]);
 assert.deepEqual(signature(6600,13200),signature(13200,19800));const live=planOriginalCityTrack(aram,6);assert.equal(live.patterns.length,12);assert.deepEqual(live.loop,{startTick:6600,endTick:13200});
 for(const cycles of [1,1000,1000000])assert.ok(spcClockSeconds(live.clock,13200+cycles*6600)>live.duration);assert.ok(live.clock.prefixes.size<=256);assert.ok(live.clock.loopPhases.length<=257);
 assert.deepEqual([0,1,2,3,4,5].map(cityMusicTrack),[1,2,3,4,5,6]);assert.equal(cityMusicTrack(0,5),6);
});
test('clock-aware vibrato keeps the existing constant-tempo path exact and unsupported direct fades fail explicitly',()=>{
 const event=planOriginalCityTrack(aram,1).events.find(e=>e.vibrato?.[2]&&e.gateEndTick<1000),clock=createSpcClock(new Uint8Array(1000).fill(19),{startTick:0,endTick:1000});assert.deepEqual(planSpcVibrato(aram,event,0,clock),planSpcVibrato(aram,event));
 assert.equal(decodeSpcChannel(Uint8Array.from([0xe8,8,20,1,0x91,0]),0).unsupported,0xe8);assert.throws(()=>createSpcClock(Uint8Array.from([0]),{startTick:0,endTick:1}),/zero tempo/);
});
