import test from 'node:test';import assert from 'node:assert/strict';import {romGiftEffects} from '../src/rom-gifts.js';
test('gift income and casino crime follow source centers and flag filtering',()=>{
 const flags=Array(1024).fill(0);for(const id of [0x2fe,0x2ec,0x2f5])flags[id]=1;
 assert.deepEqual(romGiftEffects([0x82fe,0x2fe,0x2ec,0x2f5,0x319],flags),{income:900,crimeModifier:2});
 assert.deepEqual(romGiftEffects([],flags),{income:0,crimeModifier:0});
});
