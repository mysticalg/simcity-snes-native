import test from 'node:test';
import assert from 'node:assert/strict';
import {accumulateRomDemand,DEMAND_TAX_ADJUSTMENT} from '../src/rom-demand.js';

test('DATA_038BA1 adjustment table matches all signed ROM words',()=>{
 assert.deepEqual(DEMAND_TAX_ADJUSTMENT,[200,150,120,100,80,50,30,0,-10,-40,-100,-150,-200,-250,-300,-350,-400,-450,-500,-550,-600]);
});

test('demand accumulation subtracts $0258, applies tax offset, and adds prior state',()=>{
 assert.equal(accumulateRomDemand(100,700,7,0,2000),200);
 assert.equal(accumulateRomDemand(100,700,8,0,2000),190);
 assert.equal(accumulateRomDemand(100,700,7,1,2000),190);
 assert.equal(accumulateRomDemand(100,700,30,0,2000),-400);
});

test('demand uses type-specific signed clamps and special flag behavior',()=>{
 assert.equal(accumulateRomDemand(1900,1000,7,0,2000),2000);
 assert.equal(accumulateRomDemand(-1900,0,7,0,1500),-1500);
 assert.equal(accumulateRomDemand(-100,700,7,0,2000,{suppressPositive:true}),0);
 assert.equal(accumulateRomDemand(0,-5000,7,0,1500,{forceMaximum:true}),1500);
});
import {generateRomDemand} from '../src/rom-demand.js';
test('source demand empty-city constants and job/resident Q8 ratios',()=>{
 assert.deepEqual(generateRomDemand([0,0,0]),{ratios:[332,256,512],scores:[778,600,1200],totalUnits:0});
 const p=generateRomDemand([800,50,50],[800,50,50]);assert.deepEqual(p.ratios,[261,281,302]);assert.deepEqual(p.scores,[611,658,707]);assert.equal(p.totalUnits,200);
 assert.deepEqual(generateRomDemand([800,50,50],[800,50,50],1).ratios,[261,281,281]);assert.deepEqual(generateRomDemand([800,50,50],[800,50,50],2).ratios,[261,281,250]);
});
test('source demand uses previous history and caps/floors ratios',()=>{assert.equal(generateRomDemand([8,1,1],[0,1000,1000]).ratios[0],512);assert.equal(generateRomDemand([800,50,50],[0,0,0]).ratios[0],5);assert.equal(generateRomDemand([0,0,1],[0,1,0]).ratios[2],512);assert.equal(generateRomDemand([0,0,1000],[0,1,0]).ratios[2],1);});
