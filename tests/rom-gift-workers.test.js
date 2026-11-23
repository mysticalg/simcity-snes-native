import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {City} from '../src/simulation.js';
import {updateRomGiftCenter,isRomGiftCenter} from '../src/rom-gift-worker.js';
import {repairRomFootprint} from '../src/rom-maintenance.js';
import {stampZoneFootprint} from '../src/rom-growth.js';
import {nextCoreMilestone,romGiftEffects} from '../src/rom-gifts.js';
const build=JSON.parse(fs.readFileSync('assets/tables/build.json')),flags=JSON.parse(fs.readFileSync('assets/tables/city.json')).flags;

test('1440 captured original gift workers match map, promotion flag, income and bank count',()=>{
 const ref=JSON.parse(fs.readFileSync('research/reference-gift-workers.json'));assert.equal(ref.exitCode,0);assert.equal(ref.cases.length,1440);
 for(const f of ref.cases){const map=new Uint16Array(12000);ref.indices.forEach((i,n)=>map[i]=f.input[n]);const result=updateRomGiftCenter(map,60,50,f.pending,{baseStep:f.baseStep});const label=JSON.stringify([f.id,f.prefix,f.pending,f.baseStep,f.damage]);assert.deepEqual(result,f.result,label);assert.deepEqual(ref.indices.map(i=>map[i]),f.expected,label);assert.equal(romGiftEffects(map,flags).income,f.income,label);assert.equal([...map].filter(n=>(n&1023)===0x2e3).length,f.bank,label);}
});

test('native footprint repair copies center flags on blank cells only at the eighth-step phase',()=>{
 for(const side of [3,4,6]){const map=new Uint16Array(12000),offset=Math.floor((side-1)/2),pivot=offset*side+offset,center=0xc200;map[50*120+60]=center;map[(50-offset)*120+60-offset+1]=0x7f;assert.equal(repairRomFootprint(map,60,50,center,side,7),0);assert.equal(repairRomFootprint(map,60,50,center,side,8),side*side-2);assert.equal(map[(50-offset)*120+60-offset],center-pivot);assert.equal(map[(50-offset)*120+60-offset+1],0x7f);assert.equal(map[50*120+60],center);assert.equal(repairRomFootprint(map,60,50,center,side,8),0);}
});

test('promotion increments a wrapping pending word; a worker consumes the whole word for one stage',()=>{
 for(const before of [0,1,65535]){const progress={mayorUpgradePending:before};assert.equal(nextCoreMilestone({population:2000},progress).message,1);assert.equal(progress.mayorUpgradePending,(before+1)&65535);}
 const map=new Uint16Array(12000);stampZoneFootprint(map,60,50,0x2bb);const r=updateRomGiftCenter(map,60,50,4,{baseStep:1});assert.equal(r.to,0x2c8);assert.equal(r.pending,0);assert.ok(r.upgraded);assert.equal(updateRomGiftCenter(map,60,50,0,{baseStep:1}).to,0x2c8);
});

test('rejected upgrades still consume the flag; final house and other gifts retain it',()=>{
 const map=new Uint16Array(12000);stampZoneFootprint(map,60,50,0x2bb);map[49*120+59]=0x364;const before=map.slice(),r=updateRomGiftCenter(map,60,50,1,{baseStep:1});assert.equal(r.pending,0);assert.equal(r.upgraded,false);assert.deepEqual(map,before);
 for(const id of [0x2da,0x2e3,0x2fe]){map.fill(0);stampZoneFootprint(map,60,50,id-4);map[49*120+59]=id-4;const r=updateRomGiftCenter(map,60,50,65535);assert.equal(r.pending,65535);assert.equal(r.to,id);}
 for(const id of [0x307,0x310,960,977,978,1010])assert.equal(isRomGiftCenter(id),false);
});

test('actual city scan upgrades successive house stages and persists pending state through saves',()=>{
 let c=new City(new Uint16Array(12000),build,[...flags],{scenario:'FreeCity',disastersEnabled:false});c.funds=20000;c.gifts=[15];assert.ok(c.place(15,20,20));const cell=c.footprint(15,20,20)[4];assert.equal(c.id(cell.x,cell.y),0x2bf);
 for(const [stage,population] of [2000,10000,50000].entries()){const event=nextCoreMilestone({population},c.giftMilestones);assert.equal(event.message,stage+1);c=City.restore(c.serialize(),build,flags);assert.equal(c.giftMilestones.mayorUpgradePending,1);c.scanCityTiles();assert.equal(c.id(cell.x,cell.y),[0x2c8,0x2d1,0x2da][stage]);assert.equal(c.giftMilestones.mayorUpgradePending,0);c=City.restore(c.serialize(),build,flags);c.scanCityTiles();assert.equal(c.id(cell.x,cell.y),[0x2c8,0x2d1,0x2da][stage]);}
});

test('one scan consumes a pending flag once and repairs gift scars without overwriting occupied ground',()=>{
 const c=new City(new Uint16Array(12000),build,[...flags],{scenario:'FreeCity'});stampZoneFootprint(c.map,20,20,0x2bb);stampZoneFootprint(c.map,40,20,0x2bb);c.giftMilestones.mayorUpgradePending=4;c.baseStep=1;c.scanCityTiles();assert.equal(c.id(20,20),0x2c8);assert.equal(c.id(40,20),0x2bf);assert.equal(c.giftMilestones.mayorUpgradePending,0);
 c.map[19*120+39]=0x8000;c.map[19*120+41]=0x26;c.baseStep=8;c.scanCityTiles();assert.equal(c.id(39,19),0x2bb);assert.equal(c.id(41,19),0x26);const restored=City.restore(c.serialize(),build,flags);assert.equal(restored.id(39,19),0x2bb);assert.equal(restored.giftMilestones.mayorUpgradePending,0);
});
