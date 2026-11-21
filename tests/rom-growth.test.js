import test from 'node:test';
import assert from 'node:assert/strict';
import {City,W,H} from '../src/simulation.js';
import {decideResidentialUpdate,residentialDemandScore,residentialLocalScore,residentialUpdateGate,stampZoneFootprint} from '../src/rom-growth.js';
import fs from 'node:fs';

const build=JSON.parse(fs.readFileSync(new URL('../assets/tables/build.json',import.meta.url)));
const flags=JSON.parse(fs.readFileSync(new URL('../assets/tables/city.json',import.meta.url))).flags;

test('residential update gate uses one-in-eight low bits and tile $0084 bypass',()=>{
 assert.equal(residentialUpdateGate(0x99,0x1235),false);
 assert.equal(residentialUpdateGate(0x99,0x1238),true);
 assert.equal(residentialUpdateGate(0x84,0x1237),true);
});

test('residential local score and signed map-word fallback follow CODE_0399D2/03937A',()=>{
 assert.equal(residentialLocalScore(100,120),-3000);
 assert.equal(residentialLocalScore(255,0,false),-3000);
 assert.equal(residentialLocalScore(100,0),200);
 assert.equal(residentialLocalScore(255,0),3000);
 assert.equal(residentialLocalScore(255,3),3000); // 252×32 is capped at 6000
 assert.equal(residentialDemandScore(0x0099,2000,1000),-500);
 assert.equal(residentialDemandScore(0x8099,1200,-300),900);
});

test('positive demand random comparison grows only on the signed branch pass',()=>{
 const pass=decideResidentialUpdate({tileId:0x99,gateWord:0,score:0,population:8,randomWords:[0x2000]});
 const fail=decideResidentialUpdate({tileId:0x99,gateWord:0,score:0,population:8,randomWords:[0]});
 assert.equal(pass.action,'grow');assert.equal(pass.reason,'positive-demand');
 assert.equal(fail.action,'none');assert.equal(fail.reason,'threshold');
});

test('negative demand decay is bounded by the ROM signed threshold at +350',()=>{
 const decay=decideResidentialUpdate({tileId:0x99,gateWord:0,score:-351,population:8,randomWords:[0x7000]});
 const lowerBoundary=decideResidentialUpdate({tileId:0x99,gateWord:0,score:-350,population:8,randomWords:[0,0x7000]});
 const upperBoundary=decideResidentialUpdate({tileId:0x99,gateWord:0,score:350,population:8,randomWords:[0]});
 assert.equal(decay.action,'decline');
 assert.equal(lowerBoundary.action,'decline');
 assert.equal(upperBoundary.action,'none');
});

test('city residential map changes only when injected ROM branches confirm growth or decline',()=>{
 const map=Array(W*H).fill(0),center=50*W+60;map[center]=0x8099;
 const city=new City(map,build,flags);const zone=city.zones.find(z=>z.i===center);city.landValue[center]=255;
 let words=[1];const beforeGate=[...city.map];
 assert.equal(city.updateResidentialTile(zone,()=>words.shift()).action,'none');
 assert.deepEqual([...city.map],beforeGate);assert.deepEqual(words,[]);
 words=[0,0];const beforeThreshold=[...city.map];
 assert.equal(city.updateResidentialTile(zone,()=>words.shift()).action,'none');
 assert.deepEqual([...city.map],beforeThreshold);
 words=[0,0x4000];
 assert.equal(city.updateResidentialTile(zone,()=>words.shift()).action,'grow');
 assert.notDeepEqual([...city.map],beforeThreshold);
});

test('CODE_039940 footprint rejects blocked sites and writes the marker bits exactly',()=>{
 const map=Array(W*H).fill(0),x=60,y=50;
 map[y*W+x]=0x8099;map[(y-1)*W+x-1]=0x8099;map[(y+1)*W+x+1]=0x8099;
 assert.equal(stampZoneFootprint(map,x,y,0x95),true);
 const topLeft=(y-1)*W+x-1,bottomRight=(y+1)*W+x+1;
 assert.equal(map[topLeft],0x8095);
 assert.equal(map[bottomRight],0xc09d);

 const blocked=Array(W*H).fill(0);blocked[y*W+x+1]=0x0040;const before=[...blocked];
 assert.equal(stampZoneFootprint(blocked,x,y,0x95),false);
 assert.deepEqual(blocked,before);
 assert.equal(stampZoneFootprint(blocked,0,y,0x95),false);
});
