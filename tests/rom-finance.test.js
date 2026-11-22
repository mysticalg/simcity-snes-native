import test from 'node:test';import assert from 'node:assert/strict';import {romAnnualRevenue} from '../src/rom-finance.js';
test('ROM revenue uses staged integer division and difficulty Q8 factors',()=>{
 assert.equal(romAnnualRevenue(100,120,7,0),978);assert.equal(romAnnualRevenue(100,120,7,1),839);assert.equal(romAnnualRevenue(100,120,7,2),560);
 assert.equal(romAnnualRevenue(1,119,20,0),0);assert.equal(romAnnualRevenue(0,255,20,0),0);
});
