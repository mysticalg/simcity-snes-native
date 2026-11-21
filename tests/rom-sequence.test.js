import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {trackPatternPointers,decodeSpcChannel} from '../src/rom-sequence.js';
test('track one startup command trace stops explicitly at untranslated echo/modulation',()=>{
 const aram=fs.readFileSync(new URL('../assets/audio/aram.bin',import.meta.url)),track=trackPatternPointers(aram,1);
 const lead=decodeSpcChannel(aram,track.channels[0]);assert.equal(lead.state.instrumentBase,23);assert.equal(lead.state.masterVolume,150);assert.equal(lead.unsupported,0xf5);assert.equal(lead.events.length,0);
 const second=decodeSpcChannel(aram,track.channels[1]);assert.equal(second.state.instrument,0);assert.equal(second.state.pan,10);assert.equal(second.unsupported,0xe3);
});
test('confirmed duration/instrument/volume commands emit deterministic note ticks',()=>{
 const stream=Uint8Array.from([0xe0,7,0xed,100,12,0x7f,0x91,0x93,0]);
 const result=decodeSpcChannel(stream,0);assert.equal(result.ended,true);assert.deepEqual(result.events.map(e=>[e.tick,e.length,e.note,e.instrument,e.volume]),[[0,12,17,7,100],[12,12,19,7,100]]);
});
