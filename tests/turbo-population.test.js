import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {City} from '../src/simulation.js';import {cityPopulation} from '../src/turbo-population.js';import {romPopulation} from '../src/rom-population.js';import {createPopulationStressCity} from '../tools/population-stress-fixture.mjs';

test('native population arithmetic retains all 60 executed-ROM cases; Mega counters cross both word boundaries',()=>{
 const report=JSON.parse(fs.readFileSync('research/reference-population.json'));
 assert.equal(report.exitCode,0);assert.equal(report.cases.length,60);
 for(const f of report.cases)assert.deepEqual(cityPopulation(f.rci,f.baseline,12000),f.expected);
 for(const r of [65520,65536,65560,131040,131080])assert.equal(cityPopulation([r,0,0],0,48000).population,r*20);
 for(const jobs of [8191,8192,8193,65535,65536])assert.equal(cityPopulation([0,jobs,0],0,48000).population,jobs*160);
 assert.equal(cityPopulation([65560,0,0],1_311_200,48000).netMigration,0);
 assert.equal(cityPopulation([65520,0,0],1_311_200,48000).netMigration,-800);
});

test('complete developed Mega map counts every zone without census/population wrap',()=>{
 const {city:c,expected,population,plots}=createPopulationStressCity();
 assert.equal(plots,2891);assert.deepEqual(expected,[115640,0,0]);assert.deepEqual(c.rci,expected);assert.equal(c.counts[5],plots);assert.equal(c.population,population);assert.equal(population,2312800);assert.equal(c.category,5);
 assert.equal(romPopulation(expected).population,1002080);
 const mixed=createPopulationStressCity({mixed:true});assert.deepEqual(mixed.city.rci,mixed.expected);assert.equal(mixed.city.population,mixed.population);
});

test('actual full scan retains pre-growth wide census through refresh and save/load',()=>{
 const {city:c,expected,population}=createPopulationStressCity();c.populationBaseline=population-400;c.scanCityTiles();
 assert.deepEqual(c.rci,expected);assert.equal(c.population,population);assert.equal(c.netMigration,400);
 const post=Array(3).fill(0);for(const z of c.zones)if(z.type===5)post[0]+=c.zonePopulation({...z,id:c.map[z.i]&1023});
 c.refresh();assert.deepEqual(c.rci,expected);
 const s=JSON.parse(c.serialize());assert.equal(s.populationMode,'wide');assert.equal(s.scanCensus.counterMode,'wide');assert.ok(s.scanCensus.rci[0]>65535);
 const restored=City.restore(JSON.stringify(s),structuredClone(c.build),[...c.flags]);assert.deepEqual(restored.rci,expected);assert.equal(restored.population,population);assert.equal(restored.netMigration,400);
 restored.census(true);assert.deepEqual(restored.rci,post);assert.ok(post[0]<expected[0]);assert.equal(restored.population,post[0]*20);
});

test('legacy Mega saves repair wrapped counters and reset the untrustworthy migration baseline',()=>{
 const {city:c,expected,population}=createPopulationStressCity(),s=JSON.parse(c.serialize());
 delete s.populationMode;s.scanCensus={rci:expected.map(n=>n&65535),counts:[...c.counts],facilityCounts:[0,0],unpowered:c.unpowered};s.populationBaseline=romPopulation(expected).population;s.netMigration=-999;
 const oldMap=[...s.map],restored=City.restore(JSON.stringify(s),structuredClone(c.build),[...c.flags]);
 assert.deepEqual(restored.rci,expected);assert.equal(restored.population,population);assert.equal(restored.populationBaseline,population);assert.equal(restored.netMigration,0);assert.deepEqual([...restored.map],oldMap);assert.equal(restored.funds,s.funds);
 const fresh=City.restore(restored.serialize(),structuredClone(c.build),[...c.flags]);assert.equal(fresh.population,population);assert.equal(fresh.netMigration,0);
});

test('malformed wide counters are recounted and a real zone removal lowers the wide population',()=>{
 const {city:c,expected,population}=createPopulationStressCity(),s=JSON.parse(c.serialize());
 for(const invalid of [-1,0.5,c.map.length*48+1,Number.MAX_SAFE_INTEGER]){
  s.scanCensus={counterMode:'wide',rci:[invalid,0,0],counts:[...c.counts],facilityCounts:[0,0],unpowered:c.unpowered};
  assert.deepEqual(City.restore(JSON.stringify(s),structuredClone(c.build),[...c.flags]).rci,expected);
 }
 c.funds=1e6;assert.equal(c.place(0,3,3),true);assert.equal(c.rci[0],expected[0]-40);assert.equal(c.population,population-800);assert.equal(c.lastScanCensus,null);
});

test('December to January uses the wide census for annual migration, history and pending budget reload',()=>{
 const {city:c,expected,population}=createPopulationStressCity();c.month=12;c.baseStep=3;c.autoBudget=false;
 c.stepSimulation();assert.equal(c.year,2009);assert.equal(c.month,1);assert.deepEqual(c.rci,expected);
 assert.equal(c.population,population);assert.equal(c.populationBaseline,population);assert.equal(c.netMigration,0);assert.equal(c.history.at(-1).population,population);assert.ok(c.pendingBudget);
 const restored=City.restore(c.serialize(),structuredClone(c.build),[...c.flags]);assert.equal(restored.population,population);assert.equal(restored.netMigration,0);assert.equal(restored.pendingBudget.year,2009);
});
