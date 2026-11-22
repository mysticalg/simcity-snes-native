import test from 'node:test';import assert from 'node:assert/strict';import {romDensityField} from '../src/rom-density.js';
test('ROM density center averages flagged coordinates and uses source cap/smoothing',()=>{
 const map=Array(64).fill(0),flags=Array(1024).fill(0);flags[0x99]=1;map[2*8+2]=0x99;map[6*8+6]=0x99;
 const result=romDensityField(map,flags,()=>40,8,8);assert.equal(result.centerX,2);assert.equal(result.centerY,2);assert.ok(result.density.some(v=>v>0));assert.equal(result.density[18],result.density[19]);
 const empty=romDensityField(Array(64).fill(0),flags,()=>0,8,8);assert.equal(empty.centerX,30);assert.equal(empty.centerY,25);
});
