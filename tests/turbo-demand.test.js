import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {generateCityDemand,cityFacilityDemand,cityProblems} from '../src/turbo-demand.js';import {accumulateRomDemand,generateRomDemand} from '../src/rom-demand.js';import {romFacilityDemand} from '../src/rom-facilities.js';import {romCityProblems} from '../src/rom-evaluation.js';import {stampZoneFootprint} from '../src/rom-growth.js';import {createPopulationStressCity} from '../tools/population-stress-fixture.mjs';
import {createPowerStressCity} from '../tools/power-stress-fixture.mjs';
const fields=length=>({pollution:new Uint8Array(length),traffic:new Uint8Array(length),landValues:new Uint8Array(length)});

test('native-size demand adapter retains all 79 executed-ROM ratios and final demands',()=>{
 const report=JSON.parse(fs.readFileSync('research/reference-demand.json'));assert.equal(report.exitCode,0);assert.equal(report.cases.length,79);
 for(const c of report.cases){const r=generateCityDemand(c.rci,c.history,c.difficulty,12000);assert.deepEqual(r.ratios,c.ratios);assert.equal(r.totalUnits,c.total);assert.deepEqual(r.scores.map((n,i)=>accumulateRomDemand(c.previous[i],n,c.tax,c.difficulty,i===0?2000:1500,{suppressPositive:c.suppressed[i],forceMaximum:c.force})),c.expected);}
});

test('native quotas, unemployment and fire problems retain all 65 new original-CPU executions',()=>{
 const report=JSON.parse(fs.readFileSync('research/reference-census-consumers.json'));assert.equal(report.exitCode,0);assert.equal(report.cases.length,65);const f=fields(12000);
 for(const c of report.cases)if(c.kind==='quota')assert.deepEqual(cityFacilityDemand(c.rci[0],c.counts),c.expected);else assert.equal(cityProblems({...f,rci:c.rci,fires:c.fires||0})[c.kind==='fire'?6:5],c.expected[0]);
});

test('large-city ratios do not jump at census rollover and retain fixed-point floors, caps and difficulty',()=>{
 for(const r of [65528,65536,65544]){const generated=generateCityDemand([r,8192,0],[r,8192,0],0,48000);assert.ok(Math.abs(generated.ratios[0]-261)<=1);assert.ok(generated.scores[0]>=609&&generated.scores[0]<=614);}
 assert.equal(generateRomDemand([65536,8192,0],[65536,8192,0]).ratios[0],332);
 const rci=[67600,8450,5070];assert.deepEqual(generateCityDemand(rci,rci,0,48000),{ratios:[414,179,191],scores:[970,419,447],totalUnits:21970});
 assert.deepEqual(generateCityDemand([0,0,0],[0,0,0],0,48000),{ratios:[332,256,512],scores:[778,600,1200],totalUnits:0});
 for(const difficulty of [0,1,2]){const r=generateCityDemand([50000000,10000000,10000000],[50000000,10000000,10000000],difficulty,48000);assert.ok(r.ratios.every(n=>Number.isSafeInteger(n)&&n>=0&&n<=512));assert.ok(r.scores.every(n=>Number.isSafeInteger(n)&&n>=0&&n<=1200));}
});

test('real megacity tick uses its full current and historical census in the demand update',()=>{
 const {city:c,expected}=createPopulationStressCity({mixed:true,dense:true});assert.deepEqual(expected,[67600,8450,5070]);
 c.history=[{year:2008,month:1,rci:[...expected],population:c.population}];c.demand=[0,0,0];c.stepSimulation();
 assert.deepEqual(c.demand,[370,-181,-153]);assert.deepEqual(c.rci,expected);assert.equal(c.lastScanCensus.rci[0],67600);
});

test('a native-size city receiving a regional exchange uses the combined unwrapped demand inputs',()=>{
 const c=createPowerStressCity({mega:false}),target=[67600,8450,5070],externalRci=target.map((n,i)=>n-c.rci[i]);assert.ok(externalRci.every(n=>n>0));
 c.history=[{year:c.year,month:1,rci:[...c.rci],population:c.population}];c.demand=[0,0,0];
 // Isolate the existing provider contract; physical boundary matching has its
 // separate region-exchange tests. No remote power is supplied in this case.
 c.regionalProvider=()=>({externalRci,regionalPowerMask:new Uint8Array(c.map.length),importPower:new Uint8Array(c.map.length),powerShortfall:false,powerSummary:{imported:0},zoneAccess:new Map()});
 c.stepSimulation();assert.deepEqual(c.demand,[370,-181,-153]);assert.equal(c.wideCensus,false);
 assert.deepEqual(generateCityDemand(target,target,0,12000,{regional:true}).scores,[970,419,447]);
});

test('wide monthly facility quota preserves existing hospitals instead of requesting retirement after rollover',()=>{
 const {city:c}=createPopulationStressCity({mixed:true,dense:true}),converted=c.zones.filter(z=>z.type===6).slice(0,200);
 for(const z of converted)stampZoneFootprint(c.map,z.x,z.y,0x125,c.width,c.height);c.refresh();assert.deepEqual(c.facilityCounts,[200,0]);assert.equal(c.rci[0],67600);
 assert.deepEqual(romFacilityDemand(c.rci[0],c.facilityCounts),[-1,1]);assert.deepEqual(cityFacilityDemand(c.rci[0],c.facilityCounts,48000),[1,1]);
 c.month=1;c.baseStep=3;c.facilityDemand=[0,0];c.stepSimulation();assert.equal(c.month,2);assert.deepEqual(c.facilityDemand,[1,1]);assert.deepEqual(c.facilityCounts,[200,0]);assert.ok(converted.every(z=>(c.map[z.i]&1023)===0x129));
 assert.deepEqual(cityFacilityDemand(65536,[255,256],48000),[1,0]);assert.deepEqual(cityFacilityDemand(65536,[257,255],48000),[-1,1]);
});

test('megacity annual problems sample its bottom-right district and use unwrapped employment/fire operands',()=>{
 const {city:c}=createPopulationStressCity({mixed:true,dense:true});c.pollution.fill(0);c.traffic.fill(0);c.landValue.fill(0);
 const corner=198*240+238;c.pollution[corner]=200;c.landValue[corner]=100;c.traffic[corner]=100;
 const p=c.cityEvaluationInputs().problems;assert.equal(p[1],200);assert.equal(p[4],239);
 const input={...fields(48000),rci:[100000,10000,0],fires:13108};assert.equal(romCityProblems(input,240,200)[5],255);assert.equal(romCityProblems(input,240,200)[6],4);
 assert.equal(cityProblems(input,240,200)[5],64);assert.equal(cityProblems(input,240,200)[6],255);assert.equal(cityProblems({...input,rci:[100000,0,0]},240,200)[5],0);
});
