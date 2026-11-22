import test from 'node:test';import assert from 'node:assert/strict';import {romCrimeValue,meanRomCrime} from '../src/rom-crime.js';
test('crime source clamps before and after police subtraction and excludes empty cells',()=>{
 assert.equal(romCrimeValue(0,255,100,0),0);assert.equal(romCrimeValue(100,20,0,10),38);assert.equal(romCrimeValue(200,0,-100,0),0);
 assert.equal(romCrimeValue(1,255,100,60),240);assert.equal(romCrimeValue(1,255,100,0),250);
 assert.equal(meanRomCrime([100,0,200,0,0,0,0,0],[1,0,1,0,0,0,0,0],4,2),150);
});
