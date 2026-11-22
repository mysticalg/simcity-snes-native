import test from 'node:test';
import assert from 'node:assert/strict';
import {City,SCENARIOS,W,H,cityCategory} from '../src/simulation.js';
import fs from 'node:fs';
const build=JSON.parse(fs.readFileSync(new URL('../assets/tables/build.json',import.meta.url)));
const flags=JSON.parse(fs.readFileSync(new URL('../assets/tables/city.json',import.meta.url))).flags;
const map=JSON.parse(fs.readFileSync(new URL('../assets/maps/Map_PracticeCity.json',import.meta.url)));
test('ROM maps and scenario metadata stay aligned',()=>{
 assert.equal(map.length,W*H);assert.equal(SCENARIOS.length,9);
 for(const scenario of SCENARIOS){const file=new URL(`../assets/maps/Map_${scenario.id}.json`,import.meta.url);assert.equal(JSON.parse(fs.readFileSync(file)).length,12000);}
});
test('ROM population band routines preserve their thresholds',()=>{
 const c=new City(map,build,flags);
 assert.equal(c.zonePopulation({type:5,id:0x98}),0);
 assert.equal(c.zonePopulation({type:5,id:0x99}),16);
 assert.equal(c.zonePopulation({type:5,id:0xa2}),24);
 assert.equal(c.zonePopulation({type:5,id:0xb4}),40);
 assert.equal(c.zonePopulation({type:6,id:0x143}),0);
 assert.equal(c.zonePopulation({type:6,id:0x144}),1);
 assert.equal(c.zonePopulation({type:7,id:0x201}),1);
});
test('census matches CODE_038196 weighting across all developed tiles',()=>{
 const empty=Array(W*H).fill(0);
 empty[0]=0x99; // residential 16
 empty[1]=0x144; // commercial 1
 empty[2]=0x201; // industrial 1
 const c=new City(empty,build,flags);
 assert.deepEqual(c.rci,[16,1,1]);
 assert.equal(c.population,20*(8*(1+1)+16));
 assert.equal(c.population,640);
 assert.equal(c.counts[5],1);assert.equal(c.counts[6],1);assert.equal(c.counts[7],1);
});
test('city categories switch at ROM population thresholds',()=>{
 for(const [population,category] of [[0,0],[1999,0],[2000,1],[9999,1],[10000,2],[50000,3],[100000,4],[500000,5]]){
  assert.equal(cityCategory(population),category,`population ${population}`);
 }
});
test('scenario census counts only ROM-flagged growth tiles',()=>{
 for(const scenario of SCENARIOS){
  const m=JSON.parse(fs.readFileSync(new URL(`../assets/maps/Map_${scenario.id}.json`,import.meta.url)));
  const c=new City(m,build,flags);
  assert.ok(c.population<1_500_000,`${scenario.id} census is outside the ROM population range`);
  assert.ok(c.rci.every(Number.isFinite));
 }
});
test('city saves restore map, funds, difficulty, date, tax accrual, and RNG state',()=>{
 const c=new City(map,build,flags,{name:'Testopolis',year:1954,difficulty:2});c.funds=12345;c.month=8;c.random();
 c.taxAccumulator=137;
 const restored=City.restore(c.serialize(),build,flags);
 assert.equal(restored.name,c.name);assert.equal(restored.year,1954);assert.equal(restored.month,8);
 assert.equal(restored.funds,12345);assert.equal(restored.difficulty,2);assert.equal(restored.taxAccumulator,137);assert.deepEqual([...restored.map],[...c.map]);assert.equal(restored.random(),c.random());
});
test('tax rate stays within the original 0–20% range when applied',()=>{
 const c=new City(map,build,flags);c.tax=20;assert.equal(c.tax,20);
 const b=c.budget();assert.ok(Number.isFinite(b.net));assert.equal(b.expenses.length,3);
});
test('transport budget request follows the ROM difficulty Q8 factors and cap',()=>{
 const city=new City(Array(W*H).fill(0),build,flags);
 city.roadCount=100;city.railCount=20;city.counts[8]=2;city.counts[9]=3;
 for(const [difficulty,factor,transport] of [[0,0x00b3,97],[1,0x00e6,125],[2,0x0133,167]]){
  city.difficulty=difficulty;
  const b=city.budget();
  assert.equal(b.requests[0],Math.floor((100+2*20)*factor/256));
  assert.equal(b.requests[0],transport);
  assert.equal(b.requests[1],200);assert.equal(b.requests[2],300);
 }
 city.difficulty=2;city.roadCount=20000;city.railCount=0;
 assert.equal(city.budget().requests[0],9999);
});
test('annual budget uses the 48-step ROM average tax rate',()=>{
 const city=new City(Array(W*H).fill(0),build,flags);
 city.month=12;city.tax=16;city.taxAccumulator=8*4*6+16*4*5;
 city.tick();
 assert.equal(city.lastBudget.taxRate,12);
 assert.equal(city.taxAccumulator,0);
 assert.equal(city.month,1);assert.equal(city.year,1901);
});
test('invalid map saves are rejected',()=>assert.throws(()=>City.restore('{"version":1,"map":[0]}',build,flags),/supported city save/));


test('scenario outcome and countdown survive city saves without duplicate outcomes',()=>{
 const c=new City(map,build,flags,{scenario:'Tokyo'});c.scenarioRemaining=2;c.scenarioResult='won';c.scenarioDialogSeen=true;
 const restored=City.restore(c.serialize(),build,flags);
 assert.equal(restored.scenarioRemaining,2);assert.equal(restored.scenarioResult,'won');assert.equal(restored.scenarioDialogSeen,true);
 restored.tick();assert.equal(restored.scenarioRemaining,0);assert.equal(restored.scenarioResult,'won');
 assert.equal(restored.notices.filter(n=>n==='Scenario won.').length,0);
});

test('residential lookup matches the ROM subtract loop across all ordinary residential IDs',()=>{
 const c=new City(map,build,flags);
 for(let id=0x99;id<=0x128;id++){
  let a=(id-0x99)&255;while(a>=36)a-=36;
  let y=1,carry;do{y++;carry=a>=9;a=(a-9)&255;}while(carry);
  assert.equal(c.zonePopulation({id,type:5}),y*8,`tile ${id.toString(16)}`);
 }
 const m=Array(W*H).fill(0),i=50*W+60;m[i]=0x84;m[i-1]=0x89;m[i+1]=0x94;
 const homes=new City(m,build,flags);assert.equal(homes.rci[0],2);assert.equal(homes.population,40);
});
test('merged residential/commercial census follows ROM dispatch and fixed contributions',()=>{
 const m=Array(W*H).fill(0);for(const [j,id] of [0x37a,0x383,0x38c,0x395,0x39e,0x3a7,0x3b0,0x3b9].entries())m[50*W+20+j*3]=id;
 const c=new City(m,build,flags);assert.deepEqual(c.rci,[192,24,0]);assert.equal(c.population,7680);
 const i=50*W+20,z={i,x:20,y:50,type:5,id:0x37a};assert.equal(c.grow(z,-1),true);assert.equal(c.map[i]&1023,0x120);
 const other={i:i+3,x:23,y:50,type:5,id:0x383};const before=[...c.map];assert.equal(c.grow(other,-1),false);assert.deepEqual([...c.map],before);
});
test('power scan counts ROM coal/nuclear center IDs and writes map power markers',()=>{
 const m=Array(W*H).fill(0),i=50*W+60;m[i]=0x28c;m[i+1]=0x60;m[i+10]=0x27c;
 const c=new City(m,build,flags);assert.equal(c.powerCapacity,2700);assert.ok(c.map[i]&0x8000);assert.ok(c.map[i+1]&0x8000);
 assert.equal(c.map[0]&0x8000,0);
 c.map[i]=0;c.map[i+10]=0;c.refresh();assert.equal(c.powerCapacity,0);assert.equal(c.map[i+1]&0x8000,0);
});
