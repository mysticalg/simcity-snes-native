import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {romPopulation} from '../src/rom-population.js';
test('population, migration and category match 60 original-ROM routine fixtures',()=>{
 const report=JSON.parse(fs.readFileSync(new URL('../research/reference-population.json',import.meta.url)));assert.equal(report.exitCode,0);assert.equal(report.valuesCompared,420);for(const c of report.cases)assert.deepEqual(romPopulation(c.rci,c.baseline),c.expected);
});
test('population preserves final ASL carry, wrapped census units and signed difference',()=>{
 assert.equal(romPopulation([0,8192,0]).population,20);assert.equal(romPopulation([65535,8192,0]).population,0);assert.equal(romPopulation([100,0,0],2500).netMigration,-500);assert.equal(romPopulation([0,0,0],0xffffffff).netMigration,1);
});
