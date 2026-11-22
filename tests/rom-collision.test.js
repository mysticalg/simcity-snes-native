import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {applyRomShipCollision,burnRomZone,damageRomCollisionTile} from '../src/rom-collision.js';
const flags=JSON.parse(fs.readFileSync(new URL('../assets/tables/city.json',import.meta.url))).flags;
test('collision damage matches 72 original-ROM map and RNG fixtures',()=>{
 const report=JSON.parse(fs.readFileSync(new URL('../research/reference-collision.json',import.meta.url)));assert.equal(report.exitCode,0);assert.equal(report.cases.length,72);
 for(const c of report.cases){const map=new Uint16Array(12000);for(const i of report.region)map[i]=0xc081;map[6060]=c.id;let[a,b]=c.seed;
  assert.equal(damageRomCollisionTile(map,flags,60,50,()=>{const old=a,total=a+b;a=total&65535;b=(a+old+(total>65535?1:0))&65535;return b;}),c.result);
  assert.deepEqual(report.region.map(i=>map[i]),c.expected,`tile ${c.id}`);assert.deepEqual([a,b],c.rng);
 }
});
test('ship collision visits center and diagonals in source RNG order',()=>{
 const map=new Uint16Array(12000).fill(0x81),words=[0,1,2,3,0];applyRomShipCollision(map,flags,60,50,()=>words.shift());
 assert.deepEqual([6060,5939,5941,6179,6181].map(i=>map[i]),[0x7f,0x28,0x28,0x28,0x7f]);assert.equal(map[6061],0x81);assert.equal(words.length,0);
});
test('zone burn preserves original airport row offset and clears markers',()=>{
 const map=new Uint16Array(12000).fill(0xc081);map[6060]=0x2a5;burnRomZone(map,6060,flags);
 assert.equal(map[6060-242+220],0x7f);assert.equal(map[6060-242+240],0xc081);assert.equal(map[6181]&0xfc00,0);
 assert.equal(damageRomCollisionTile(map,flags,-1,50,()=>{throw Error('outside consumed RNG');}),'outside');
});
