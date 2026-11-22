import test from 'node:test';import assert from 'node:assert/strict';
import {spawnRomShip} from '../src/rom-ship.js';
test('ship spawn uses first open-water cell and original initial RNG bound',()=>{
 const map=new Uint16Array(12000);map[9]=0x8002;const ship={};const bounds=[];
 assert.equal(spawnRomShip(ship,map,max=>{bounds.push(max);return 0;}),true);
 assert.deepEqual(bounds,[0]);assert.deepEqual(ship,{active:true,x:9,y:0,direction:4,hornCountdown:100,initializing:true});
 assert.equal(spawnRomShip(ship,map,()=>{throw Error('active ship must not consume RNG');}),false);
});
test('ship border search preserves source offsets, edge order and bounds',()=>{
 for(const [index,x,y,direction,bounds] of [[244,0,6,2,[0,118]],[11890,10,99,0,[0,118,98]],[839,119,6,6,[0,118,98,118]]]){
  const map=new Uint16Array(12000);map[index]=2;const ship={};const calls=[];
  assert.equal(spawnRomShip(ship,map,max=>{calls.push(max);return 0;}),true);
  assert.deepEqual([ship.x,ship.y,ship.direction],[x,y,direction]);assert.deepEqual(calls,bounds);
 }
 const ship={x:0,y:0};assert.equal(spawnRomShip(ship,new Uint16Array(12000),()=>0),false);assert.deepEqual(ship,{x:0,y:0});
});
