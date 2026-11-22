import test from 'node:test';import assert from 'node:assert/strict';import {aggregateRomLandValue,romLandValue,romTerrainField} from '../src/rom-land-value.js';
test('ROM mean land value samples developed half-resolution cells once',()=>{
 const map=Array(16).fill(0),values=Uint8Array.from([100,1,200,1,1,1,1,1,50,1,250,1,1,1,1,1]);map[0]=0x32;map[3]=0x144;map[8]=0x20;
 assert.equal(aggregateRomLandValue(map,values,4,4),150);assert.deepEqual([...values],[100,100,200,200,100,100,200,200,0,0,0,0,0,0,0,0]);
});

test('ROM land-value arithmetic caps distance, applies crime threshold and clamps signed result',()=>{
 assert.equal(romLandValue(30,25,30,25,0,0,189),136);assert.equal(romLandValue(30,25,30,25,0,0,190),116);
 assert.equal(romLandValue(100,100,30,25,0,0,0),8);assert.equal(romLandValue(30,25,30,25,255,0,0),250);assert.equal(romLandValue(30,25,30,25,0,255,0),1);
});

test('terrain plane retains source byte wrap and half weighted smoothing',()=>{
 const empty=Array(64).fill(0);assert.ok(romTerrainField(empty,8,8).every(v=>v===0));
 const trees=Array(64).fill(4),field=romTerrainField(trees,8,8);assert.equal(field[0],180);assert.equal(field[7],180);
 const gift=Array(64).fill(0);gift[0]=0x2bf;assert.ok(romTerrainField(gift,8,8)[0]>0);
 const station=Array(64).fill(0);station[0]=0x307;assert.equal(romTerrainField(station,8,8)[0],0);
});
