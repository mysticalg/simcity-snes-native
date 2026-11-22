import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {romCommercialRate,commercialLocalScore,industrialLocalScore} from '../src/rom-commercial.js';
test('commercial field and both job scores match 70 original-ROM executions',()=>{
 const report=JSON.parse(fs.readFileSync(new URL('../research/reference-commercial.json',import.meta.url)));assert.equal(report.exitCode,0);assert.equal(report.valuesCompared,13790);
 for(const c of report.cases){const rates=romCommercialRate(...c.center);assert.deepEqual(Array.from(rates),c.rates);assert.deepEqual([commercialLocalScore(rates,...c.coordinate,c.transport)&65535,industrialLocalScore(c.transport)&65535],c.expected);}
});
test('commercial lookup uses coarse cells and preserves no-transport return value',()=>{
 const rates=romCommercialRate(28,24);assert.equal(commercialLocalScore(rates,56,48,1),64);assert.equal(commercialLocalScore(rates,63,55,1),64);assert.equal(commercialLocalScore(rates,64,48,1),48);
 assert.equal(commercialLocalScore(rates,56,48,0),0);assert.equal(industrialLocalScore(0),-1000);
});
