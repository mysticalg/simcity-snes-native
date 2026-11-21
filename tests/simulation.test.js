import test from 'node:test';
import assert from 'node:assert/strict';
import {City,SCENARIOS,W,H} from '../src/simulation.js';
import fs from 'node:fs';
const build=JSON.parse(fs.readFileSync(new URL('../assets/tables/build.json',import.meta.url)));
const flags=JSON.parse(fs.readFileSync(new URL('../assets/tables/city.json',import.meta.url))).flags;
const map=JSON.parse(fs.readFileSync(new URL('../assets/maps/Map_PracticeCity.json',import.meta.url)));
test('ROM maps and scenario metadata stay aligned',()=>{
 assert.equal(map.length,W*H);assert.equal(SCENARIOS.length,9);
 for(const scenario of SCENARIOS){const file=new URL(`../assets/maps/Map_${scenario.id}.json`,import.meta.url);assert.equal(JSON.parse(fs.readFileSync(file)).length,12000);}
});
test('ROM population band routines preserve their thresholds',()=>{
 const c=new City(map,build,flags);
 assert.equal(c.zonePopulation({type:5,id:0x98}),0);
 assert.equal(c.zonePopulation({type:5,id:0x99}),8);
 assert.equal(c.zonePopulation({type:5,id:0xa2}),16);
 assert.equal(c.zonePopulation({type:5,id:0xb4}),32);
 assert.equal(c.zonePopulation({type:6,id:0x143}),0);
 assert.equal(c.zonePopulation({type:6,id:0x144}),1);
 assert.equal(c.zonePopulation({type:7,id:0x201}),1);
});
test('city saves restore map, funds, date, and RNG state',()=>{
 const c=new City(map,build,flags,{name:'Testopolis',year:1954});c.funds=12345;c.month=8;c.random();
 const restored=City.restore(c.serialize(),build,flags);
 assert.equal(restored.name,c.name);assert.equal(restored.year,1954);assert.equal(restored.month,8);
 assert.equal(restored.funds,12345);assert.deepEqual([...restored.map],[...c.map]);assert.equal(restored.random(),c.random());
});
test('tax rate stays within the original 0–20% range when applied',()=>{
 const c=new City(map,build,flags);c.tax=20;assert.equal(c.tax,20);
 const b=c.budget();assert.ok(Number.isFinite(b.net));assert.equal(b.expenses.length,3);
});
test('invalid map saves are rejected',()=>assert.throws(()=>City.restore('{"version":1,"map":[0]}',build,flags),/supported city save/));


