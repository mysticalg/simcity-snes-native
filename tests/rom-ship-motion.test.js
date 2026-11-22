import test from 'node:test';import assert from 'node:assert/strict';import {createRomShip,stepRomShip} from '../src/rom-ship.js';
import fs from 'node:fs';
const water=()=>new Uint16Array(12000).fill(2);
const ship=()=>({...createRomShip(),active:true,x:60,y:50,pixelX:480,pixelY:400,direction:2,hornCountdown:100});
test('ship initializes at border without moving then advances one pixel per eligible frame',()=>{
 const s={...ship(),initializing:true,pixelX:0,pixelY:0};stepRomShip(s,water(),()=>2);assert.equal(s.initializing,false);assert.equal(s.pixelX,480);
 for(let i=0;i<8;i++)stepRomShip(s,water(),()=>2);assert.equal(s.x,61);assert.equal(s.pixelX,488);assert.equal(s.offsetX,0);assert.equal(s.hornCountdown,91);
});
test('ship turns one eighth-circle every two eligible frames and moves on final turn',()=>{
 const s=ship();s.turn=1;s.targetDirection=4;const map=water();
 stepRomShip(s,map,()=>0);assert.equal(s.direction,2);assert.equal(s.pixelY,400);
 stepRomShip(s,map,()=>0);assert.equal(s.direction,3);assert.equal(s.pixelY,400);
 stepRomShip(s,map,()=>0);stepRomShip(s,map,()=>0);assert.equal(s.direction,4);assert.equal(s.turn,0);assert.equal(s.pixelY,401);
});
test('ship pauses horn timer, blocked navigation still counts horn, and exits map',()=>{
 const s=ship();s.hornCountdown=1;const map=water();assert.deepEqual(stepRomShip(s,map,()=>0,{paused:true}),{});assert.equal(s.hornCountdown,1);
 assert.deepEqual(stepRomShip(s,map,()=>0,{blocked:true}),{horn:true});assert.equal(s.hornCountdown,600);assert.equal(s.pixelX,480);
 Object.assign(s,{x:119,pixelX:959,offsetX:7});stepRomShip(s,map,()=>2);assert.equal(s.active,false);assert.equal(s.x,120);
});
test('ship motion replays 64 original-ROM state fixtures',()=>{
 const report=JSON.parse(fs.readFileSync(new URL('../research/reference-ship-motion.json',import.meta.url)));assert.equal(report.exitCode,0);assert.equal(report.cases.length,64);
 for(const c of report.cases){
  const s=createRomShip();report.fields.forEach((key,i)=>s[key]=key==='active'?Boolean(c.input[i]):key==='turn'&&c.input[i]>127?c.input[i]-256:c.input[i]);s.initializing=c.input[0]===32768;
  let a=1,b=0;stepRomShip(s,water(),()=>{const old=a,total=a+b;a=total&65535;b=(a+old+(total>65535?1:0))&65535;return b;},c.options);
  assert.deepEqual(report.fields.map(key=>key==='active'?(s.active?(s.initializing?32768:1):0):key==='turn'?s[key]&255:s[key]),c.expected,`${c.d}/${c.mode}`);assert.deepEqual([a,b],c.rng);
 }
});
