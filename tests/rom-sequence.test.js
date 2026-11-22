import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {trackPatternPointers,decodeSpcChannel} from '../src/rom-sequence.js';
test('track one startup command trace stops explicitly at untranslated echo/modulation',()=>{
 const aram=fs.readFileSync(new URL('../assets/audio/aram.bin',import.meta.url)),track=trackPatternPointers(aram,1);
 const lead=decodeSpcChannel(aram,track.channels[0]);assert.equal(lead.state.instrumentBase,23);assert.equal(lead.state.masterVolume,150);assert.deepEqual(lead.events.slice(0,3).map(e=>[e.tick,e.note,e.instrument,e.tempo]),[[0,48,15,19],[36,50,15,19],[48,48,15,19]]);assert.deepEqual(lead.events[0].echo,[255,75,75]);assert.deepEqual(lead.events[0].echoConfig,[2,60,0]);
 const second=decodeSpcChannel(aram,track.channels[1]);assert.equal(second.events[0].instrument,0);assert.equal(second.events[0].pan,10);assert.deepEqual(second.events[0].vibrato,[12,32,42]);assert.equal(second.events[0].note,57);
});
test('confirmed duration/instrument/volume commands emit deterministic note ticks',()=>{
 const stream=Uint8Array.from([0xe0,7,0xed,100,12,0x7f,0x91,0x93,0]);
 const result=decodeSpcChannel(stream,0);assert.equal(result.ended,true);assert.deepEqual(result.events.map(e=>[e.tick,e.length,e.note,e.instrument,e.volume]),[[0,12,17,7,100],[12,12,19,7,100]]);
});


test('SPC tick accumulator quantizes note boundaries and articulation persists',async()=>{
 const {spcTickSeconds,planTrackOneLead}=await import('../src/rom-sequence.js');
 assert.equal(spcTickSeconds(36,19),.972);assert.equal(spcTickSeconds(48,19),1.294);
 const aram=fs.readFileSync(new URL('../assets/audio/aram.bin',import.meta.url));const lead=planTrackOneLead(aram);
 assert.deepEqual(lead.map(e=>e.articulation),[125,125,125]);assert.deepEqual(lead.map(e=>e.pitch),[7497,8414,7497]);
 assert.equal(lead[0].seconds+lead[0].duration,lead[1].seconds);
});
