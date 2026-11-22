import test from 'node:test';import assert from 'node:assert/strict';
import {navigateRomShip} from '../src/rom-ship.js';
import fs from 'node:fs';
const origin=50*120+60,offsets=[-120,-119,1,121,120,119,-1,-121];
const ship=()=>({active:true,x:60,y:50,direction:2});
test('ship chooses open directions in randomized clockwise order and sets turn sign',()=>{
 for(let start=0;start<8;start++){const map=new Uint16Array(12000);map.fill(2);const s=ship();const result=navigateRomShip(s,map,()=>start);const expected=start===6?7:start;
  assert.equal(result,expected===2?'straight':'route');if(expected!==2){assert.equal(s.targetDirection,expected);assert.equal(s.turn,[0,1,1,1,1,-1,-1,-1][(expected-2)&7]);}
 }
});
test('ship distinguishes straight crossings, bridge lookahead and reverse escape',()=>{
 for(const id of [2,0x354,0x355,0x60,0x61,0x70,0x71]){const map=new Uint16Array(12000);map[origin+1]=id;assert.equal(navigateRomShip(ship(),map,()=>2),'straight');}
 const map=new Uint16Array(12000);map[origin+1]=3;map[origin+2]=0x60;
 assert.equal(navigateRomShip(ship(),map,()=>2),'straight');
 map[origin+2]=0;map[origin-1]=2;const s=ship();assert.equal(navigateRomShip(s,map,()=>2),'route');assert.equal(s.targetDirection,6);
});
test('ship falls back to bridge turn only with navigable cell beyond it',()=>{
 const map=new Uint16Array(12000);map[origin+offsets[4]]=3;map[origin+offsets[4]*2]=0x71;
 const s=ship();assert.equal(navigateRomShip(s,map,()=>0),'route');assert.equal(s.targetDirection,4);
 map[origin+offsets[4]*2]=0;const blocked=ship();assert.equal(navigateRomShip(blocked,map,()=>0),'collision');assert.equal(blocked.active,false);
 const initial={...ship(),initializing:true};assert.equal(navigateRomShip(initial,map,()=>0),'despawn');
});
test('ship navigation matches 768 original-ROM execution fixtures',()=>{
 const report=JSON.parse(fs.readFileSync(new URL('../research/reference-ship.json',import.meta.url)));
 assert.equal(report.exitCode,0);assert.equal(report.cases.length,768);
 for(const c of report.cases){
  const map=new Uint16Array(12000);for(const [i,v]of c.cells)map[i]=v;
  const s={...ship(),direction:c.direction,initializing:true,targetDirection:0,turn:0,turnPhase:1};let [a,b]=c.seed;
  assert.equal(navigateRomShip(s,map,()=>{const old=a,total=a+b;a=total&65535;b=(a+old+(total>65535?1:0))&65535;return b;}),c.outcome);
  assert.deepEqual([s.active?0x8000:0,s.targetDirection,s.turn&255,s.turnPhase],c.expected);
  assert.deepEqual([a,b],c.rng);
 }
});
