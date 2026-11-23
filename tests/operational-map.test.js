import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {operationalMap,installBuildingOperations} from '../src/building-operations.js';
import {City} from '../src/simulation.js';
installBuildingOperations(City);
test('enabled and stale operations reuse the map without allocating a workspace',()=>{
 const map=Uint16Array.of(0x8000,0x83c3,0x1234);let slices=0;map.slice=()=>{slices++;throw Error('Unexpected copy');};
 for(const disabledBuildings of[undefined,{}, {'1':960},{'99':963}])assert.equal(operationalMap({map,disabledBuildings}),map);
 assert.equal(slices,0);assert.deepEqual(Array.from(map),[0x8000,0x83c3,0x1234]);
});
test('disabled tiles receive one isolated workspace and retain metadata bits',()=>{
 const map=Uint16Array.of(0x83c3,0xfbc0,0x1c00),original=map.slice();let slices=0;
 map.slice=()=>{slices++;return Uint16Array.from(map);};
 const masked=operationalMap({map,disabledBuildings:{0:963,1:960}});
 assert.notEqual(masked,map);assert.equal(slices,1);assert.equal(masked[0],0x8000|971);assert.equal(masked[1],(original[1]&0xfc00)|971);assert.equal(masked[2],original[2]);assert.deepEqual(Array.from(map),Array.from(original));
});
test('power writes stay on the city map and outages still follow disabled generation',()=>{
 const c=new City(new Uint16Array(12000),JSON.parse(fs.readFileSync('assets/tables/build.json')),JSON.parse(fs.readFileSync('assets/tables/city.json')).flags);
 c.funds=1e6;assert.ok(c.place(33,3,3));for(let x=5;x<=15;x++)c.map[4*120+x]=0x32;c.refresh();c.disabledBuildings={};
 const map=c.map,zones=c.zones,originalSlice=map.slice.bind(map);let copies=0;map.slice=(...args)=>{copies++;return originalSlice(...args);};
 c.updatePower();assert.equal(copies,0);assert.equal(c.map,map);assert.equal(c.zones,zones);assert.equal(c.powerCapacity,10000);assert.equal(c.power[4*120+15],1);
 const plant=c.zones.find(z=>z.id===963);c.disabledBuildings[plant.i]=plant.id;c.updatePower();assert.equal(copies,1);assert.equal(c.map,map);assert.equal(c.zones,zones);assert.equal(c.id(plant.x,plant.y),963);assert.equal(c.powerCapacity,0);assert.equal(c.power[4*120+15],0);
 delete c.disabledBuildings[plant.i];c.updatePower();assert.equal(copies,1);assert.equal(c.power[4*120+15],1);assert.equal(c.powerCapacity,10000);
});
