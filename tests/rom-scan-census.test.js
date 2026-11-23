import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {City} from '../src/simulation.js';import {romPopulation} from '../src/rom-population.js';import {installBuildingOperations} from '../src/building-operations.js';
installBuildingOperations(City);
const build=JSON.parse(fs.readFileSync('assets/tables/build.json')),flags=JSON.parse(fs.readFileSync('assets/tables/city.json')).flags,ref=JSON.parse(fs.readFileSync('research/reference-scan-census.json'));
const expand=runs=>Uint16Array.from(runs.flatMap(([n,v])=>Array(n).fill(v)));
function fixture(f){const c=new City(new Uint16Array(12000),structuredClone(build),[...flags]);c.map=expand(f.input);c.power.fill(1);c.landValue.fill(200);c.pollution.fill(0);c.density.fill(100);c.commercialRate.fill(64);c.traffic.fill(0);c.growthRate.fill(0);c.simulationRng=[...f.seed];c.demand=[f.demand,f.demand,f.demand];c.facilityDemand=[0,0];c.giftMilestones.mayorUpgradePending=f.giftPending||0;c.census(true);return c;}
test('native full scan replays 84 ROM executions: census, population, RNG and every map word',()=>{
 assert.equal(ref.exitCode,0);assert.equal(ref.cases.length,84);
 for(const f of ref.cases){const c=fixture(f);c.scanCityTiles();assert.deepEqual(c.giftStats,f.giftStats,f.name);assert.equal(c.giftMilestones.mayorUpgradePending||0,f.giftRemaining,f.name);assert.deepEqual(c.rci,f.visit,f.name);assert.deepEqual(c.counts.slice(5,8),f.counts);assert.equal(c.population,romPopulation(f.visit).population);assert.deepEqual(c.simulationRng,f.rng);assert.deepEqual(c.map,expand(f.expected),f.name);c.refresh();assert.deepEqual(c.rci,f.visit,'refresh '+f.name);}
});
test('save reload preserves scan census rather than substituting post-growth population',()=>{
 const cases=ref.cases.filter(f=>JSON.stringify(f.visit)!==JSON.stringify(f.post));assert.ok(cases.length>=40);
 for(const f of cases){const c=fixture(f);c.scanCityTiles();const saved=City.restore(c.serialize(),c.build,c.flags);assert.deepEqual(saved.rci,f.visit,f.name);assert.equal(saved.population,romPopulation(f.visit).population);saved.refresh();assert.deepEqual(saved.rci,f.visit);saved.census(true);assert.deepEqual(saved.rci,f.post);}
});
test('real construction invalidates a prior scan; corrupt/legacy saved counters fall back to map census',()=>{
 const f=ref.cases.find(f=>JSON.stringify(f.visit)!==JSON.stringify(f.post)),c=fixture(f);c.scanCityTiles();c.funds=10000;assert.ok(c.place(4,3,3));assert.deepEqual(c.rci,f.post);assert.equal(c.lastScanCensus,null);const bad=JSON.parse(fixture(f).serialize());bad.scanCensus={rci:[-1,0,0],counts:Array(16).fill(0),facilityCounts:[0,0],unpowered:0};assert.deepEqual(City.restore(JSON.stringify(bad),build,flags).rci,f.initial);
});
