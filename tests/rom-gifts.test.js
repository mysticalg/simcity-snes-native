import test from 'node:test';import assert from 'node:assert/strict';import {romGiftEffects,serviceMilestoneNotices,enqueueRomGift} from '../src/rom-gifts.js';
test('gift income and casino crime follow source centers and flag filtering',()=>{
 const flags=Array(1024).fill(0);for(const id of [0x2fe,0x2ec,0x2f5])flags[id]=1;
 assert.deepEqual(romGiftEffects([0x82fe,0x2fe,0x2ec,0x2f5,0x319],flags),{income:900,crimeModifier:2});
 assert.deepEqual(romGiftEffects([],flags),{income:0,crimeModifier:0});
});

test('service milestones advance once per source stage and serialize without repeats',()=>{
 const state={};assert.equal(serviceMilestoneNotices({police:6,fire:5,rail:499},state).length,1);
 assert.equal(serviceMilestoneNotices({police:6,fire:5,rail:499},JSON.parse(JSON.stringify(state))).length,0);
 assert.equal(serviceMilestoneNotices({police:18,fire:6,rail:500},state).length,3);assert.deepEqual(state,{police:2,fire:1,rail:1});
});

test('original gift queue has four slots and permits duplicate rewards',()=>{
 const inventory=[21,21,22];assert.equal(enqueueRomGift(inventory,16),true);assert.equal(enqueueRomGift(inventory,17),false);assert.deepEqual(inventory,[21,21,22,16]);
});
import {nextCoreMilestone} from '../src/rom-gifts.js';
test('population announcements precede one-time Mayor house and service gifts',()=>{const p={},input={population:2000,category:1,police:18,fire:18,rail:2000,inventorySize:0};assert.equal(nextCoreMilestone(input,p).message,1);assert.equal(nextCoreMilestone(input,p).gift,15);assert.equal(nextCoreMilestone(input,p).gift,21);assert.equal(nextCoreMilestone(input,p).gift,21);assert.equal(nextCoreMilestone(input,p).gift,21);assert.equal(nextCoreMilestone(input,p).gift,22);const saved=JSON.parse(JSON.stringify(p));assert.equal(saved.mayorHouse,true);assert.equal(nextCoreMilestone({...input,inventorySize:4},saved),null);assert.equal(nextCoreMilestone({...input,population:10000,inventorySize:4},saved).message,2);assert.equal(nextCoreMilestone({...input,category:0,population:0,inventorySize:3},{}),null);});
