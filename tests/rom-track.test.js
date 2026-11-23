import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {planOriginalTrackOne} from '../src/rom-track.js';import {decodeSpcChannel,planTrackOneOpening} from '../src/rom-sequence.js';
const aram=fs.readFileSync(new URL('../assets/audio/aram.bin',import.meta.url));
test('native track follows intro and body boundaries with original notes and pitches',()=>{
 const plan=planOriginalTrackOne(aram);assert.equal(plan.duration,67.262);assert.equal(plan.events.length,502);
 assert.deepEqual(plan.patterns.map(p=>[p.pattern,p.startTick,p.endTick]),[[0x1b50,0,192],[0x1b40,192,1344],[0x1b40,1344,2496]]);
 const fields=e=>[e.tick,e.channel,e.note,e.sample,e.pitch,e.seconds];assert.deepEqual(plan.events.slice(0,54).map(fields),planTrackOneOpening(aram).events.map(fields));
 assert.deepEqual(plan.events.slice(54,59).map(e=>[e.tick,e.channel,e.note,e.sample,e.pitch]),[[192,0,43,15,5614],[192,2,52,0,4050],[192,3,50,0,3606],[192,4,12,13,931],[192,6,43,15,5614]]);
});
test('all body repeats retain the original current-note articulation',()=>{
 const plan=planOriginalTrackOne(aram,{maxPatterns:4});const rows=plan.patterns.map(p=>plan.events.filter(e=>e.tick>=p.startTick&&e.tick<p.endTick).map(e=>[e.tick-p.startTick,e.channel,e.note,e.sample,e.pitch,e.volume,e.articulation,e.pan]));
 assert.deepEqual(rows[1],rows[2]);assert.deepEqual(rows[2],rows[3]);assert.deepEqual(rows.map(r=>r.length),[54,224,224,224]);
});
test('pattern boundaries stop command reads and preserve note duration and articulation',()=>{
 const bytes=Uint8Array.from([12,0x7f,0x91,0xed,20,0]);const first=decodeSpcChannel(bytes,0,{maxTicks:12});assert.equal(first.state.volume,255);assert.equal(first.next,3);assert.equal(first.state.noteLength,12);assert.equal(first.state.articulation,127);
 const second=decodeSpcChannel(Uint8Array.from([0x93,0]),0,{state:first.state,startTick:12});assert.equal(second.events[0].tick,12);assert.equal(second.events[0].length,12);assert.equal(second.events[0].articulation,127);
});
test('unsupported sequence commands fail explicitly in the full-track planner',()=>{
 const changed=Uint8Array.from(aram);changed[0x1d08]=0xff;assert.throws(()=>planOriginalTrackOne(changed),/Unsupported/);
});
test('SPC volume fades produce quantized stereo changes inside sustained notes',()=>{
 const plan=planOriginalTrackOne(aram),fading=plan.events.filter(e=>e.mixAutomation.length);assert.ok(fading.length>10);
 for(const event of fading)for(const point of event.mixAutomation){assert.ok(point.tick>event.tick&&point.tick<event.gateEndTick);assert.ok(Number.isInteger(point.left)&&Number.isInteger(point.right));}
});
