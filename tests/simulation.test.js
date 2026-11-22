import test from 'node:test';
import assert from 'node:assert/strict';
import {City,SCENARIOS,W,H,cityCategory} from '../src/simulation.js';
import fs from 'node:fs';
const build=JSON.parse(fs.readFileSync(new URL('../assets/tables/build.json',import.meta.url)));
const flags=JSON.parse(fs.readFileSync(new URL('../assets/tables/city.json',import.meta.url))).flags;
const map=JSON.parse(fs.readFileSync(new URL('../assets/maps/Map_PracticeCity.json',import.meta.url)));
test('commercial scoring snapshots the old density center and survives save/load',()=>{
 const c=new City(Array(W*H).fill(0),build,flags);c.centerX=28;c.centerY=24;c.map[20*W+20]=0x144;c.refresh();c.updateDensityField();
 assert.equal(c.commercialRate[6*15+7],64);assert.equal(c.centerX,10);assert.equal(c.centerY,10);
 const saved=City.restore(c.serialize(),build,flags);assert.deepEqual(saved.commercialRate,c.commercialRate);assert.equal(saved.commercialRate[0],-64);
 c.updateDensityField();assert.equal(c.commercialRate[6*15+7],-64);
});
test('city scan grows commercial zone near center and rejects identical draw far away',async()=>{
 const {romCommercialRate}=await import('../src/rom-commercial.js');
 for(const [x,y,shouldGrow]of [[60,48,true],[8,8,false]]){
  const c=new City(Array(W*H).fill(0),build,flags),i=y*W+x;c.map[i]=0x8144;c.landValue[i]=255;c.demand[1]=0;c.commercialRate=romCommercialRate(30,25);const words=[0,39200,0];c.random=()=>words.shift()??0;c.boundedRandom=()=>5;
  c.scanCityTiles();assert.equal((c.map[i]&1023)!==0x144,shouldGrow);if(shouldGrow)assert.equal(c.map[i]&1023,0x1d4);
 }
});
test('ship horn frame command queues original port3 effect5 and is not replayed on load',()=>{
 const c=new City(Array(W*H).fill(2),build,flags);Object.assign(c.ship,{active:true,x:60,y:50,pixelX:480,pixelY:400,direction:2,hornCountdown:100});
 c.advanceVisualFrames(800);assert.deepEqual(c.soundEvents,[{port:3,command:5}]);assert.equal(c.ship.hornCountdown,600);
 c.advanceVisualFrames(800,true);assert.equal(c.soundEvents.length,1);assert.equal(c.ship.hornCountdown,600);
 assert.deepEqual(City.restore(c.serialize(),build,flags).soundEvents,[]);
});
test('population promotions and 600000 milestone record original history IDs once',()=>{
 const c=new City(Array(W*H).fill(0),build,flags,{scenario:'FreeCity'});c.population=600000;c.category=5;c.year=2000;c.month=3;
 for(let n=0;n<6;n++)c.checkMilestones();assert.deepEqual(c.eventHistory.map(e=>e.id),[0,2,3,4,5,6,19]);
 const restored=City.restore(c.serialize(),build,flags);restored.population=600000;restored.category=5;restored.checkMilestones();assert.equal(restored.eventHistory.filter(e=>e.id===19).length,1);
});
test('disaster history records original IDs and dates once and survives reload',()=>{
 const c=new City(Array(W*H).fill(0),build,flags);c.year=1957;c.month=6;c.disaster('Earthquake');c.disaster('Fire',20,20);
 assert.deepEqual(c.eventHistory.slice(-2),[{id:14,year:1957,month:6},{id:11,year:1957,month:6}]);
 const restored=City.restore(c.serialize(),build,flags);assert.deepEqual(restored.eventHistory,c.eventHistory);restored.advanceVisualFrames(10,true);assert.deepEqual(restored.eventHistory,c.eventHistory);
});
test('older saves do not invent a foundation event on their saved date',()=>{
 const c=new City(Array(W*H).fill(0),build,flags),old=JSON.parse(c.serialize());delete old.eventHistory;old.year=1987;old.month=9;
 assert.deepEqual(City.restore(JSON.stringify(old),build,flags).eventHistory,[]);
});
test('blocked live ship damages five cells and preserves damage through save/load',()=>{for(let direction=0;direction<8;direction++){
 const c=new City(Array(W*H).fill(0x81),build,flags);Object.assign(c.ship,{active:true,x:60,y:50,pixelX:480,pixelY:400,direction,hornCountdown:100});
 c.advanceVisualFrames(2);assert.equal(c.ship.active,false);
 const changed=[6060,5939,5941,6179,6181];for(const i of changed)assert.ok([0x7f,0x28].includes(c.map[i]&1023));assert.equal(c.map[6061]&1023,0x81);
 const restored=City.restore(c.serialize(),build,flags);for(const i of changed)assert.equal(restored.map[i],c.map[i]);assert.equal(restored.ship.active,false);
}});
test('powered seaport spawns a saved ship and visual frames move it',()=>{
 const c=new City(Array(W*H).fill(2),build,flags);const i=50*W+60;c.map[i]=0x826c;c.scanCityTiles();
 assert.equal(c.ship.active,true);assert.equal(c.ship.initializing,true);assert.equal(c.ship.y,0);
 const saved=City.restore(c.serialize(),build,flags);assert.deepEqual(saved.ship,c.ship);
 c.advanceVisualFrames(2);assert.equal(c.ship.initializing,false);const before=[c.ship.pixelX,c.ship.pixelY];
 c.advanceVisualFrames(64,true);assert.deepEqual([c.ship.pixelX,c.ship.pixelY],before);
 c.advanceVisualFrames(64);assert.notDeepEqual([c.ship.pixelX,c.ship.pixelY],before);
 const noPower=new City(Array(W*H).fill(2),build,flags);noPower.map[i]=0x26c;noPower.scanCityTiles();assert.equal(noPower.ship.active,false);
});
test('live ship tile coordinates open the original horizontal drawbridge',()=>{
 const c=new City(Array(W*H).fill(2),build,flags),i=50*W+60,offsets=[-122,-2,-1,0,1,2,-118];
 [1,0x30,0x30,0x30,0x30,0x30,1].forEach((id,j)=>c.map[i+offsets[j]]=id);
 Object.assign(c.ship,{active:true,x:61,y:50,pixelX:488,pixelY:400});c.scanCityTiles();
 assert.equal(c.map[i]&1023,0x354);assert.equal(c.map[i-2]&1023,0x357);
});
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
 assert.equal(city.pendingBudget.taxRate,12);city.settleAnnualBudget();assert.equal(city.lastBudget.taxRate,12);
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
test('construction power tools place matching ROM centers and provide capacity',()=>{
 for(const [tool,center,capacity] of [[14,0x28c,700],[13,0x27c,2000],[11,0x26c,0]]){
  const c=new City(Array(W*H).fill(0),build,flags);assert.equal(c.place(tool,60,50),true);
  assert.equal(c.id(61,51),center);assert.equal(c.powerCapacity,capacity);
 }
});
test('road and rail masks connect horizontal vertical corners and junctions',()=>{
 for(const [tool,base] of [[1,0x30],[2,0x70]]){
 const c=new City(Array(W*H).fill(0),build,flags),x=60,y=50;
 for(const [dx,dy] of [[0,0],[1,0],[-1,0]])assert.equal(c.place(tool,x+dx,y+dy),true);
 assert.equal(c.id(x,y),base+2);
 c.place(tool,x,y-1);assert.equal(c.id(x,y),base+8);
 c.place(tool,x,y+1);assert.equal(c.id(x,y),base+12);
 }
});
test('coal line crossing carries power to residential and disconnecting clears marker',()=>{
 const c=new City(Array(W*H).fill(0),build,flags);c.place(14,20,20);
 c.place(1,27,20);c.place(1,27,21);c.place(1,27,22);
 for(let x=24;x<=31;x++)assert.equal(c.place(3,x,21),true);
 c.place(5,32,20);c.refresh();assert.ok(c.map[21*W+33]&0x8000);assert.equal(c.id(27,21),0x3e);
 c.place(0,29,21);assert.equal(c.map[21*W+33]&0x8000,0);
});
test('gift placement consumes one duplicate and retains inventory after reload',()=>{
 const c=new City(Array(W*H).fill(0),build,flags);c.gifts=[21,21,22];const funds=c.funds;
 assert.equal(c.place(21,60,50),true);assert.deepEqual(c.gifts,[21,22]);assert.equal(c.funds,funds);assert.equal(c.id(61,51),0x307);
 const restored=City.restore(c.serialize(),build,flags);assert.deepEqual(restored.gifts,[21,22]);assert.equal(restored.place(21,60,50),false);assert.deepEqual(restored.gifts,[21,22]);
});
test('service center census includes headquarters and Mayor house placement consumes awarded slot',()=>{
 const c=new City(Array(W*H).fill(0),build,flags);assert.equal(c.canBuild(15,10,10).ok,false);c.gifts=[15];assert.equal(c.place(15,10,10),true);assert.equal(c.id(11,11),0x2bf);assert.deepEqual(c.gifts,[]);
 for(const [i,id]of [[1000,0x249],[1010,0x307],[1020,0x252],[1030,0x310]])c.map[i]=id;c.refresh();assert.equal(c.counts[8],2);assert.equal(c.counts[9],2);assert.deepEqual(c.budget().requests.slice(1),[200,200]);
 c.population=2000;c.category=1;assert.equal(c.checkMilestones().message,1);assert.equal(c.checkMilestones().gift,15);const loaded=City.restore(c.serialize(),build,flags);assert.equal(loaded.giftMilestones.mayorHouse,true);assert.deepEqual(loaded.gifts,[15]);assert.equal(loaded.checkMilestones(),null);
});
test('city tick uses source generated demand and retains history input across reload',()=>{const c=new City(Array(W*H).fill(0),build,flags);c.tick();assert.deepEqual(c.demand,[1112,200,1500]);const saved=City.restore(c.serialize(),build,flags);assert.deepEqual(saved.demand,c.demand);c.tick();saved.tick();assert.deepEqual(c.demand,[1824,200,1500]);assert.deepEqual(saved.demand,c.demand);});
test('facility demand cap scan integrates real census centers and saved state',()=>{const map=Array(W*H).fill(0);for(let n=0;n<13;n++)map[1000+n*3]=0xb4;const c=new City(map,build,flags);assert.equal(c.rci[0],520);c.baseStep=25;c.updateGrowthCaps();assert.equal(c.growthCaps.suppressed[0],true);const loaded=City.restore(c.serialize(),build,flags);assert.equal(loaded.baseStep,c.baseStep);assert.deepEqual(loaded.growthCaps,c.growthCaps);assert.equal(loaded.place(10,60,50),true);assert.equal(loaded.counts[10],1);loaded.baseStep=25;loaded.updateGrowthCaps();assert.equal(loaded.growthCaps.suppressed[0],false);loaded.map[2000]=0x36b;loaded.map[2010]=0x26c;loaded.map[2020]=0x2a5;loaded.refresh();assert.deepEqual(loaded.counts.slice(10,13),[2,1,1]);});
test('four source base steps make a month and fractional cadence survives reload',()=>{const c=new City(Array(W*H).fill(0),build,flags);c.advance(749);assert.equal(c.baseStep,0);c.advance(1);assert.equal(c.baseStep,1);assert.equal(c.month,1);assert.deepEqual(c.demand,[578,200,800]);assert.equal(c.taxAccumulator,7);assert.equal(c.history.length,0);c.advance(1500);assert.equal(c.baseStep,3);assert.equal(c.month,1);c.advance(749);const loaded=City.restore(c.serialize(),build,flags);loaded.advance(1);assert.equal(loaded.baseStep,4);assert.equal(loaded.month,2);assert.equal(loaded.history.length,1);assert.equal(loaded.taxAccumulator,28);assert.deepEqual(loaded.demand,[1112,200,1500]);for(let n=0;n<44;n++)loaded.stepSimulation();assert.equal(loaded.month,1);assert.equal(loaded.year,1901);assert.equal(loaded.taxAccumulator,0);assert.equal(loaded.pendingBudget.taxRate,7);loaded.settleAnnualBudget();assert.equal(loaded.lastBudget.taxRate,7);});
test('staggered fields retain prior planes and survive save/reload between passes',()=>{const map=Array(W*H).fill(0);map[60*W+60]=0x99;const c=new City(map,build,flags);c.terrain.fill(80);c.pollution.fill(20);c.crime.fill(190);c.baseStep=1;c.updateScheduledFields();assert.deepEqual(c.fieldEpochs,{});c.baseStep=2;c.updateScheduledFields();assert.equal(c.landValue[60*W+60],156);assert.deepEqual(c.fieldEpochs,{landPollution:2});const saved=City.restore(c.serialize(),build,flags);for(const key of ['terrain','pollution','crime','landValue','density','policeCoverage','fireCoverage'])assert.deepEqual(saved[key],c[key]);assert.deepEqual(saved.fieldEpochs,c.fieldEpochs);c.updateLandPollutionField();assert.equal(c.landValue[60*W+60],96);saved.baseStep=6;saved.updateScheduledFields();assert.deepEqual(saved.fieldEpochs,{landPollution:2,crime:6});saved.baseStep=10;saved.updateScheduledFields();assert.equal(saved.fieldEpochs.density,10);saved.baseStep=14;saved.updateScheduledFields();assert.equal(saved.fieldEpochs.fire,14);});
test('captured service inputs persist until next tile pass and survive reload',()=>{const c=new City(Array(W*H).fill(0),build,flags);assert.equal(c.place(9,40,40),true);c.captureServiceInputs();const saved=City.restore(c.serialize(),build,flags);assert.deepEqual(saved.serviceInputs,c.serviceInputs);c.map.fill(0);c.refresh();c.updateFireField();assert.ok(c.fireCoverage.some(n=>n>0));c.captureServiceInputs();c.updateFireField();assert.equal(c.fireCoverage.some(n=>n>0),false);saved.updateFireField();assert.ok(saved.fireCoverage.some(n=>n>0));});
test('annual actual allocations set persistent service strengths after shortfall',()=>{const c=new City(Array(W*H).fill(0),build,flags);c.place(8,20,20);c.place(9,30,20);c.funds=50;const b=c.budget(true);assert.deepEqual(b.requests,[0,100,100]);assert.deepEqual(b.expenses,[0,50,0]);assert.equal(c.funds,0);assert.deepEqual(c.serviceStrengths,[500,0]);c.funding=[100,100,100];const saved=City.restore(c.serialize(),build,flags);assert.deepEqual(saved.serviceStrengths,[500,0]);assert.deepEqual(saved.allocatedFunding,[0,50,0]);saved.captureServiceInputs();assert.equal(saved.serviceInputs.fire.some(n=>n>0),false);assert.ok(saved.serviceInputs.police.some(n=>n>0));});
test('ROM bank loan credits10000 and repays500 on21 annual settlements',()=>{const c=new City(Array(W*H).fill(0),build,flags);assert.equal(c.takeLoan(),true);assert.equal(c.funds,30000);assert.deepEqual(c.loan,{years:21,payment:500});assert.equal(c.takeLoan(),false);for(let n=0;n<20;n++)c.budget(true);assert.equal(c.loan.years,1);assert.equal(c.funds,20000);c.budget(true);assert.equal(c.loan,null);assert.equal(c.funds,19500);});
test('manual annual review freezes simulation and settles once after reload',()=>{const c=new City(Array(W*H).fill(0),build,flags);c.takeLoan();c.month=12;c.baseStep=44;c.advance(3000);assert.equal(c.pendingBudget.year,1901);assert.equal(c.loan.years,21);assert.equal(c.funds,30000);const step=c.baseStep;c.advance(30000);assert.equal(c.baseStep,step);const saved=City.restore(c.serialize(),build,flags);assert.deepEqual(saved.pendingBudget,c.pendingBudget);const result=saved.settleAnnualBudget();assert.equal(result.payment,500);assert.equal(saved.funds,29500);assert.equal(saved.loan.years,20);assert.equal(saved.settleAnnualBudget(),null);assert.equal(saved.funds,29500);saved.advance(750);assert.equal(saved.baseStep,step+1);});
test('automatic annual budget settles without pending pause and persists option',()=>{const c=new City(Array(W*H).fill(0),build,flags,{autoBudget:true});c.month=12;c.baseStep=44;c.advance(3750);assert.equal(c.pendingBudget,null);assert.equal(c.baseStep,49);assert.equal(c.year,1901);assert.ok(c.lastBudget);assert.equal(City.restore(c.serialize(),build,flags).autoBudget,true);});
test('native earthquake damages citywide and saves visual countdown without generic radius effect',()=>{const c=new City(Array(W*H).fill(0x80),build,flags),result=c.disaster('Earthquake');assert.ok(result.attempts>=200&&result.attempts<=551);assert.ok(result.fire+result.rubble>0);assert.equal(c.disasters.length,0);assert.ok(Array.from(c.map).some((id,i)=>(id===0x7f||id===0x28)&&Math.abs(i%W-60)>18));c.advanceVisualFrames(10);const saved=City.restore(c.serialize(),build,flags);assert.equal(saved.quakeFrames,result.attempts-10);assert.equal(saved.quakePhase,c.quakePhase);assert.deepEqual(saved.map,c.map);saved.advanceVisualFrames(1000);assert.equal(saved.quakeFrames,0);});
test('native flood starts at shoreline, persists timer and avoids generic radius damage',()=>{const c=new City(Array(W*H).fill(0),build,flags);c.map[50*W+50]=4;c.map[49*W+50]=0x80;const old=c.boundedRandom;c.boundedRandom=max=>50;const r=c.disaster('Flood');c.boundedRandom=old;assert.equal(r.started,true);assert.equal(c.map[49*W+50]&1023,0x365);assert.equal(c.floodRemaining,60);assert.equal(c.disasters.length,0);const saved=City.restore(c.serialize(),build,flags);assert.equal(saved.floodRemaining,60);assert.deepEqual(saved.map,c.map);saved.random=()=>1;saved.updateDisasters();assert.equal(saved.floodRemaining,59);});
test('live tile scan burns later center before growth and omits destroyed station service input',()=>{const c=new City(Array(W*H).fill(0),build,flags),i=10*W+10;c.map[i]=0x7f;c.map[i+1]=0x84;c.map[i+2]=0x249;const words=[1,1,0,1];c.random=()=>words.shift()??1;c.boundedRandom=()=>1;let growth=0;c.updateResidentialTile=()=>{growth++;};c.scanCityTiles();assert.equal(growth,0);assert.equal(c.map[i+1]&1023,0x7f);assert.equal(c.map[i+2]&1023,0x7f);assert.equal(c.serviceInputs.police.some(n=>n>0),false);});
test('transport scan applies decay and traffic art while reconnecting busy roads',()=>{const c=new City(Array(W*H).fill(0),build,flags),i=1000;c.map[i]=0x32;c.transportStrength=0;c.random=()=>0;c.scanCityTiles();assert.equal(c.map[i]&1023,0x28);c.map[i]=0x32;c.map[i+1]=0x32;c.transportStrength=33;c.traffic[i]=210;c.scanCityTiles();assert.equal(c.map[i]&1023,0x52);c.connect(i%W,Math.floor(i/W));c.connect((i+1)%W,Math.floor((i+1)/W));assert.equal(c.map[i]&1023,0x52);assert.equal(c.map[i+1]&1023,0x32);const saved=City.restore(c.serialize(),build,flags);assert.equal(saved.transportStrength,33);const roads=new City(Array(W*H).fill(0),build,flags);roads.map[1000]=0x30;roads.map[1010]=0x355;roads.map[1020]=0x32;roads.refresh();assert.equal(roads.roadCount,11);});
test('rail tile scan spawns train and visual phase pauses/moves/saves it',()=>{const c=new City(Array(W*H).fill(0),build,flags);for(let x=10;x<30;x++)c.map[10*W+x]=0x72;c.refresh();c.scanCityTiles();assert.equal(c.train.active,true);assert.equal(c.train.x,84);c.quakePhase=6;c.advanceVisualFrames(1,true);assert.equal(c.train.x,84);c.quakePhase=6;c.advanceVisualFrames(1);assert.equal(c.train.x,85);const saved=City.restore(c.serialize(),build,flags);assert.deepEqual(saved.train,c.train);saved.quakeFrames=2;saved.advanceVisualFrames(1);assert.equal(saved.train.active,false);});
test('menu RNG returns second updated word like CODE_00824F',()=>{const c=new City(Array(W*H).fill(0),build,flags);c.rngA=1;c.rngB=0;assert.equal(c.menuRandom(),2);assert.equal(c.rngA,1);assert.equal(c.rngB,2);});
