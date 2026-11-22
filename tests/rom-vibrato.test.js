import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {spcVibratoDelta,planSpcVibrato} from '../src/rom-vibrato.js';import {spcPitchQ8} from '../src/rom-sequence.js';
const aram=fs.readFileSync(new URL('../assets/audio/aram.bin',import.meta.url));
test('SPC vibrato folds the triangle with signed small and wide depth',()=>{
 const phases=[0,32,64,96,128,160,192,224];assert.deepEqual(phases.map(p=>spcVibratoDelta(p,42)),[0,21,41,20,0,-21,-41,-20]);assert.deepEqual(phases.map(p=>spcVibratoDelta(p,0xf3)),[0,384,765,381,0,-384,-765,-381]);
});
test('fractional pitch interpolates the source table and endpoint corrections',()=>{
 assert.equal(spcPitchQ8(aram,48*256,15),7497);assert.equal(spcPitchQ8(aram,48*256+128,15),7721);assert.equal(spcPitchQ8(aram,60*256,15),15022);
});
test('vibrato waits source delay then emits bounded 2ms pitch changes',()=>{
 const event={tick:0,gateEndTick:96,note:48,instrument:15,tempo:19,vibrato:[12,32,42]},points=planSpcVibrato(aram,event);
 assert.ok(points.length>100);assert.ok(points[0].offset>=12*256/19*.002);assert.ok(points.every(p=>p.offset>0&&p.offset<2.588&&p.pitch>7300&&p.pitch<7700));
 assert.deepEqual(planSpcVibrato(aram,{...event,vibrato:[0,32,0]}),[]);
 const shifted=planSpcVibrato(aram,event,1152);assert.ok(shifted.length>100);assert.notDeepEqual(shifted.slice(0,3),points.slice(0,3));
});
