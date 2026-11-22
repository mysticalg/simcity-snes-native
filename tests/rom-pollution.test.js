import test from 'node:test';import assert from 'node:assert/strict';import {tilePollution,smoothPollution,romPollutionField} from '../src/rom-pollution.js';
test('ROM pollution contributions and smoothing divisor preserve source distinctions',()=>{
 assert.deepEqual([0x32,0x40,0x50,0x7f,0x201,0x26c,0x27c,0x28c,0x364].map(tilePollution),[0,10,25,60,50,60,0,60,-40]);
 assert.deepEqual([...smoothPollution(Uint8Array.from([0,0,0,0,100,0,0,0,0]),3,3)],[0,25,0,25,25,25,0,25,0]);
 const m=Array(16).fill(0);m[5]=0x201;const field=romPollutionField(m,4,4);assert.equal(field[0],field[5]);assert.ok(field[0]>0);
});
