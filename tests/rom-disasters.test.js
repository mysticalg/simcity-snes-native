import test from 'node:test';import assert from 'node:assert/strict';import {applyRomMeltdown} from '../src/rom-disasters.js';
test('ROM meltdown burns flagged plant cells and scatters radiation with exactly 400 bounded draws',()=>{
 const w=60,map=Array(w*50).fill(2),flags=Array(1024).fill(0);flags[2]=4;flags[0x27c]=5;flags[0x7f]=4;
 map[25*w+30]=0x827c;let calls=0;
 const result=applyRomMeltdown(map,flags,30,25,max=>{calls++;return max;},w,50);
 assert.equal(calls,400);assert.equal(result.attempts,200);
 assert.equal(map[25*w+30],0x7f);assert.equal(map[40*w+50],0x364);
 assert.equal(map[0],2);
});
