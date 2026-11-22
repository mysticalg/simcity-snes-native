import test from 'node:test';import assert from 'node:assert/strict';import {unpoweredBuildings} from '../src/power-warnings.js';
test('power warning includes empty zones and clears with restored power',()=>{
 const city={zones:[{i:0,id:0x84,type:5},{i:1,id:0x249,type:8},{i:2,id:0x28c,type:14}],power:new Uint8Array(3)};
 assert.equal(unpoweredBuildings(city).length,2);city.power[0]=1;assert.equal(unpoweredBuildings(city).length,1);city.power[1]=1;assert.equal(unpoweredBuildings(city).length,0);
});
