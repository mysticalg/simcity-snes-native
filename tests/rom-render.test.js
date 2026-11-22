import test from 'node:test';import assert from 'node:assert/strict';import {cityPaletteForMonth} from '../src/rom-render.js';
test('city seasonal target palettes follow ROM month transitions',()=>{
 assert.deepEqual(Array.from({length:12},(_,i)=>cityPaletteForMonth(i+1)),[0,0,1,1,1,2,2,2,3,3,3,0]);assert.throws(()=>cityPaletteForMonth(0));
});
