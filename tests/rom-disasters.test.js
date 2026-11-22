import test from 'node:test';import assert from 'node:assert/strict';import {applyRomMeltdown,decayRomRadiation,scanRomFire} from '../src/rom-disasters.js';
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

test('source fire scan uses four directional gates and coverage burnout',()=>{
 const map=Array(25).fill(0),flags=Array(1024).fill(0);flags[4]=4;map[12]=0x7f;map[11]=4;map[13]=4;
 const words=[0,1,1,1];let maximum;
 scanRomFire(map,flags,Array(25).fill(100),()=>words.shift()??1,max=>{maximum=max;return 0;},()=>{},5,5);
 assert.equal(map[11],0x7f);assert.equal(map[12],0x28);assert.equal(map[13],4);assert.equal(maximum,1);
});
import {applyRomEarthquake} from '../src/rom-disasters.js';
test('earthquake uses global attempts, excludes centers and maps x lowbits to fire/rubble',()=>{const m=Array(12000).fill(0),flags=Array(1024).fill(0);flags[0x84]=1;for(const [x,id]of [[4,0x80],[5,0x81],[6,0x84],[7,0x2bc],[8,0x7f],[9,0x2bb]])m[10*120+x]=id;const draws=[0,4,10,5,10,6,10,7,10,8,10,9,10],bounds=[];let calls=0;const result=applyRomEarthquake(m,flags,max=>{bounds.push(max);return draws[calls++]??0;});assert.deepEqual(result,{attempts:200,fire:1,rubble:2});assert.equal(calls,401);assert.deepEqual(bounds.slice(0,5),[350,119,99,119,99]);assert.equal(m[1204],0x7f);assert.equal(m[1205],0x28);assert.equal(m[1206],0x84);assert.equal(m[1207],0x2bc);assert.equal(m[1209],0x28);});
test('earthquake maximum count and repeated damaged site consume all coordinate draws',()=>{const m=Array(12000).fill(0),flags=[];m[1204]=0x80;let calls=0;const result=applyRomEarthquake(m,flags,max=>{calls++;return calls===1?350:max===119?4:10;});assert.deepEqual(result,{attempts:550,fire:1,rubble:0});assert.equal(calls,1101);});
