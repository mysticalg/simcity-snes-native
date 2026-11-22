import test from 'node:test';import assert from 'node:assert/strict';import {romAnnualRevenue} from '../src/rom-finance.js';
test('ROM revenue uses staged integer division and difficulty Q8 factors',()=>{
 assert.equal(romAnnualRevenue(100,120,7,0),978);assert.equal(romAnnualRevenue(100,120,7,1),839);assert.equal(romAnnualRevenue(100,120,7,2),560);
 assert.equal(romAnnualRevenue(1,119,20,0),0);assert.equal(romAnnualRevenue(0,255,20,0),0);
});
import {allocateRomBudget} from '../src/rom-finance.js';
test('source budget shortfall reduces fire then police then transport',()=>{assert.deepEqual(allocateRomBudget([100,200,300],[100,100,100],450).expenses,[100,200,150]);assert.deepEqual(allocateRomBudget([100,200,300],[100,100,100],200).expenses,[100,100,0]);assert.deepEqual(allocateRomBudget([100,200,300],[100,100,100],50).expenses,[50,0,0]);assert.deepEqual(allocateRomBudget([100,200,300],[100,100,100],100,50).expenses,[50,0,0]);assert.equal(allocateRomBudget([100,200,300],[100,100,100],0,500).shortfall,500);assert.deepEqual(allocateRomBudget([3,3,3],[50,33,0],100).desired,[2,1,0]);});
