import test from 'node:test';import assert from 'node:assert/strict';import {networkCrossing} from '../src/rom-networks.js';
test('power road and rail crossings use exact ROM replacement tables',()=>{
 assert.equal(networkCrossing(3,0x32),0x3d);assert.equal(networkCrossing(3,0x33),0x3e);assert.equal(networkCrossing(3,0x72),0x6d);assert.equal(networkCrossing(3,0x73),0x6e);assert.equal(networkCrossing(1,0x62),0x3e);assert.equal(networkCrossing(2,0x62),0x6e);assert.equal(networkCrossing(3,0x34),null);
});
