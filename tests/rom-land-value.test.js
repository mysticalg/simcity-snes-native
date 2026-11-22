import test from 'node:test';import assert from 'node:assert/strict';import {aggregateRomLandValue} from '../src/rom-land-value.js';
test('ROM mean land value samples developed half-resolution cells once',()=>{
 const map=Array(16).fill(0),values=Uint8Array.from([100,1,200,1,1,1,1,1,50,1,250,1,1,1,1,1]);map[0]=0x32;map[3]=0x144;map[8]=0x20;
 assert.equal(aggregateRomLandValue(map,values,4,4),150);assert.deepEqual([...values],[100,100,200,200,100,100,200,200,0,0,0,0,0,0,0,0]);
});
