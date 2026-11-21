import test from 'node:test';import assert from 'node:assert/strict';import {applyRomMeltdown,decayRomRadiation} from '../src/rom-disasters.js';
test('ROM meltdown burns flagged plant cells and scatters radiation with exactly 400 bounded draws',()=>{
 const w=60,map=Array(w*50).fill(2),flags=Array(1024).fill(0);flags[2]=4;flags[0x27c]=5;flags[0x7f]=4;
 map[25*w+30]=0x827c;let calls=0;
 const result=applyRomMeltdown(map,flags,30,25,max=>{calls++;return max;},w,50);
 assert.equal(calls,400);assert.equal(result.attempts,200);
 assert.equal(map[25*w+30],0x7f);assert.equal(map[40*w+50],0x364);
 assert.equal(map[0],2);
});

test('radiation scan clears only zero draws and preserves all other tiles',()=>{
 const map=[0x364,0x8364,0x7f,0],draws=[1,0],bounds=[];
 assert.equal(decayRomRadiation(map,max=>{bounds.push(max);return draws.shift();}),1);
 assert.deepEqual(map,[0x364,0,0x7f,0]);assert.deepEqual(bounds,[4000,4000]);
});
