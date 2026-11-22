import {createRomTrain,spawnRomTrain,stepRomTrain} from './rom-train.js';
import {createRomShip,spawnRomShip,stepRomShip} from './rom-ship.js?v=collision-2';
import {applyRomShipCollision,burnRomZone} from './rom-collision.js';
import {recordRomHistory} from './rom-history.js';
import {romTransportFunding,updateRomTransportTile} from './rom-transport.js';
import {traceRomPower} from './rom-power.js';
import {romFieldSchedule} from './rom-schedule.js';
import {romGiftEffects,nextCoreMilestone,enqueueRomGift} from './rom-gifts.js';
import {networkCrossing} from './rom-networks.js';
import {romPoliceCoverage,romFireCoverage,fireBurnoutMaximum,romServiceFunding,seedRomServicePlane,expandRomServicePlane,addRomServiceCenter} from './rom-services.js';
import {romDensityField} from './rom-density.js';
import {romCrimeValue,meanRomCrime} from './rom-crime.js';
import {romPollutionField} from './rom-pollution.js';
import {aggregateRomLandValue,romLandValue,romTerrainField} from './rom-land-value.js';
import {romAnnualRevenue,allocateRomBudget} from './rom-finance.js';
import {SIMULATION_SEED,nextSimulationWord,boundSimulationWord} from './rom-random.js';
import {decayTraffic,addRouteTraffic} from './rom-traffic.js';
import {applyRomMeltdown,applyRomEarthquake,startRomFlood,dispatchRomDisasterTile} from './rom-disasters.js';
import {scenarioOutcome,SCENARIO_EVENT_COUNTS,stepScenarioEvent,stepScenarioReminder,scenarioMeltdownSite} from './rom-scenarios.js';
import {residentialDemandScore, residentialLocalScore, residentialDensityBand, residentialGrowthBase, residentialDeclineFootprint, decideResidentialUpdate, stampZoneFootprint, placeSmallHome, mergeResidentialZone,repairMergedZone,updateCommercialFootprint,updateIndustrialFootprint,decideJobZoneUpdate,findZoneTransport,traceZoneTransport} from './rom-growth.js';
import {accumulateRomDemand,generateRomDemand,scanRomGrowthCaps} from './rom-demand.js';
// Native simulation model. ROM-backed tables and direct translations are marked.
// Monthly growth, coverage and disasters are provisional reconstructions, not yet
// instruction-for-instruction ports of the SNES simulation (see research/STATUS.md).
export const W=120,H=100;
export const TOOLS=['Bulldozer','Road','Rail','Power line','Park','Residential','Commercial','Industrial','Police','Fire station','Stadium','Seaport','Airport','Nuclear plant','Coal plant','Gift'];
export const LIMITS=[2000,10000,50000,100000,500000];
export const CATEGORIES=['Village','Town','City','Capital','Metropolis','Megalopolis'];
export const SCENARIOS=[
 {id:'PracticeCity',name:'Practice city',year:1900,description:'Start a city on the original practice island.'},
 {id:'FreeCity',name:'Free city',year:1991,description:'Build freely on the original open landscape.'},
 {id:'SanFrancicso',name:'San Francisco',year:1906,description:'Rebuild after the earthquake. Original map; objective timing is still being reconstructed.'},
 {id:'Bern',name:'Bern',year:1965,description:'Improve transport and traffic. Original map; victory rules are pending.'},
 {id:'Tokyo',name:'Tokyo',year:1961,description:'A monster threatens Tokyo. Original map; scripted disaster timing is pending.'},
 {id:'Detroit',name:'Detroit',year:1972,description:'Revive the city and reduce crime. Original map; victory rules are pending.'},
 {id:'Boston',name:'Boston',year:2010,description:'Manage the aftermath of a nuclear accident. Original map; scripted events are pending.'},
 {id:'RioDeJaneiro',name:'Rio de Janeiro',year:2047,description:'Protect the city from flooding. Original map; scenario rules are pending.'},
 {id:'LasVegas',name:'Las Vegas',year:2096,description:'The bonus city from the original cartridge. Scenario rules are pending.'}
];
export function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
export function cityCategory(population){return LIMITS.filter(n=>population>=n).length;}
export class City {
 constructor(map,build,flags,opts={}){
  if(map.length!==W*H)throw Error('Invalid map length');
  this.map=Uint16Array.from(map);this.build=build;this.flags=flags;
  this.name=opts.name||'New city';this.scenario=opts.scenario||'PracticeCity';this.year=opts.year||1900;this.month=1;this.eventHistory=[];if(['PracticeCity','FreeCity'].includes(this.scenario))recordRomHistory(this.eventHistory,0,this.year,this.month);
  this.difficulty=clamp(Math.trunc(opts.difficulty??0),0,2);this.funds=[20000,10000,5000][this.difficulty];this.tax=7;this.funding=[100,100,100];this.serviceStrengths=[1000,1000];this.transportStrength=32;this.ship=createRomShip();this.train=createRomTrain();this.allocatedFunding=null;this.speed=1;
  this.simulationRng=[...SIMULATION_SEED];this.rngA=0x5cd6;this.rngB=0x1238;this.population=0;this.demand=[400,200,200];this.history=[];this.taxAccumulator=opts.taxAccumulator||0;
  this.power=new Uint8Array(W*H);this.pollution=new Uint8Array(W*H);this.crime=new Uint8Array(W*H);this.landValue=new Uint8Array(W*H);this.traffic=new Uint8Array(W*H);
  this.baseStep=0;this.growthCaps={zoneTotal:0,suppressed:[false,false,false]};this.terrain=new Uint8Array(W*H);this.density=new Uint8Array(W*H);this.policeCoverage=new Uint16Array(W*H);this.fireCoverage=new Uint16Array(W*H);this.centerX=30;this.centerY=25;this.fieldEpochs={};this.zones=[];this.notices=[];this.disasters=[];this.floodRemaining=0;this.quakeFrames=0;this.quakePhase=0;this.loan=null;this.elapsed=0;this.category=0;this.giftMilestones={};this.gifts=[];this.giftChoice=16;this.lastBudget=null;this.autoBudget=opts.autoBudget??false;this.pendingBudget=null;
  this.scenarioRemaining=SCENARIO_EVENT_COUNTS[this.scenario]||0;this.scenarioReminders=[];this.scenarioResult=null;this.scenarioDialogSeen=false;this.refresh();
 }
 // CODE_00824F: additive RNG, including carry into the second 16-bit add.
 menuRandom(){const old=this.rngA;let n=old+this.rngB;this.rngA=n&65535;this.rngB=(this.rngA+old+(n>65535?1:0))&65535;return this.rngB;}
 random(){return nextSimulationWord(this.simulationRng);}
 boundedRandom(maximum){return boundSimulationWord(this.random(),maximum);}
 id(x,y){return x>=0&&x<W&&y>=0&&y<H?this.map[y*W+x]&1023:0;}
 flag(i){return this.flags[this.map[i]&1023]||0;}
 neighbors(i){const x=i%W,y=Math.floor(i/W);return [x>0?i-1:-1,y>0?i-W:-1,x<W-1?i+1:-1,y<H-1?i+W:-1].filter(n=>n>=0);}
 message(text){this.notices.unshift(text);this.notices.length=Math.min(8,this.notices.length);}
 classify(id){
  if(id>=0x376&&id<0x39a)return 5;
  if(id>=0x39a&&id<0x3c0)return 6;
  if(id>=0x80&&id<0x137)return 5;
  if(id>=0x137&&id<0x1f4)return 6;
  if(id>=0x1f4&&id<0x245)return 7;
  if(id>=0x245&&id<0x24e)return 8;
  if(id>=0x24e&&id<0x257)return 9;
  if(id>=0x257&&id<0x267)return 10;
  if(id>=0x267&&id<0x277)return 11;
  if(id>=0x277&&id<0x287)return 13;
  if(id>=0x287&&id<0x297)return 14;
  if(id>=0x297&&id<0x2bb)return 12;
  return 15;
 }
 refresh(){
  this.zones=[];this.roadCount=0;this.railCount=0;
  for(let i=0;i<this.map.length;i++){
   const id=this.map[i]&1023,f=this.flags[id]||0;
   if(f&1)this.zones.push({i,x:i%W,y:Math.floor(i/W),id,type:this.classify(id)});
   if(f&0x20)this.railCount++;else if(f&0x40)this.roadCount+=id>=0x80||(id&15)<2?5:1;
  }
  this.updatePower();this.census();
 }
 updatePower(){
  const result=traceRomPower(this.map,this.flags,W,H);
  this.power=result.power;this.powerCapacity=result.capacity;this.powerUsed=result.used;this.powerOverloaded=result.exhausted;
  // CODE_03B152 writes the resulting power bit back to every map word.
  for(let i=0;i<this.map.length;i++)this.map[i]=(this.map[i]&0x7fff)|(this.power[i]?0x8000:0);
 }
 // Zone population bands follow CODE_03842F/038456/03847A; spatial desirability below is provisional.
 zonePopulation(z){
  if(z.type===5&&z.id>=0x376&&z.id<0x39a)return 48;
  if(z.type===6&&z.id>=0x39a)return 6;
  if(z.type===5){if(z.id<0x99)return 0;return (Math.floor(((z.id-0x99)%36)/9)+2)*8;}
  if(z.type===6)return z.id<0x144?0:Math.floor(((z.id-0x144)%45)/9)+1;
  if(z.type===7)return z.id<0x201?0:Math.floor(((z.id-0x201)%36)/9)+1;
  return 0;
 }
 census(){
  this.counts=Array(16).fill(0);this.rci=[0,0,0];let unpowered=0;
  // CODE_038297 scans all 120×100 tiles. Its residential, commercial and
  // industrial routines add per-tile values to $0B8B, $0B93 and $0B8F.
  for(let i=0;i<this.map.length;i++){
   const id=this.map[i]&1023,type=this.classify(id);
   // CODE_038297 dispatches only entries whose ROM tile flag has bit 0 set.
   if(!(this.flags[id]&1))continue;
   if(id===0x249||id===0x307)this.counts[8]++;
   if(id===0x252||id===0x310)this.counts[9]++;
   if(id===0x25c||id===0x36b)this.counts[10]++;
   if(id===0x26c)this.counts[11]++;
   if(id===0x2a5)this.counts[12]++;
   if(type<5||type>7)continue;
   this.counts[type]++;
   this.rci[type-5]+=type===5&&id===0x84?this.adjacentSmallHomeCount({x:i%W,y:Math.floor(i/W)}):this.zonePopulation({id,type});
   if(!this.power[i])unpowered++;
  }
  // CODE_038196: population = 20 × (8 × (industrial + commercial) + residential).
  this.population=20*(8*(this.rci[1]+this.rci[2])+this.rci[0]);this.unpowered=unpowered;
  this.category=cityCategory(this.population);
  this.score=clamp(Math.round(500+this.population/400-unpowered*8-this.tax*4-(this.meanCrime||0)),0,1000);
 }
 footprint(tool,x,y){const b=this.build.buildings[tool];return b.tiles.map((id,i)=>({x:x+b.x[i],y:y+b.y[i],id}));}
 canBuild(tool,x,y){
  if(tool<0)return {ok:false,cost:0,reason:'Choose a construction tool.'};
  if(tool===0){const id=this.id(x,y);return {ok:x>=0&&x<W&&y>=0&&y<H&&id>3,cost:1,reason:'There is nothing to clear here.'};}
  const cells=this.footprint(tool,x,y);let cost=this.build.costs[Math.min(tool,15)]||100;
  if(tool>=15){if(!this.gifts.includes(tool))return {ok:false,cost:0,reason:'This gift has not been awarded.'};cost=0;}
  for(const c of cells){
   if(c.x<0||c.x>=W||c.y<0||c.y>=H)return {ok:false,cost,reason:'The building must fit inside the map.'};
   const id=this.id(c.x,c.y);
   if(id===0)continue;
   if(id>=4&&id<0x26){cost++;continue;}
   if(tool<=3&&(id>=1&&id<=3)){cost=this.build.costs[tool]*2;continue;}
   if(tool<=3&&id>=0x30&&id<0x80&&((this.flags[id]||0)&(tool===1?0x40:tool===2?0x20:0x10))===0)continue;
   return {ok:false,cost,reason:'Clear this site before building.'};
  }
  return {ok:this.funds>=cost,cost,reason:this.funds>=cost?'':'Insufficient funds.'};
 }
 place(tool,x,y){
  const check=this.canBuild(tool,x,y);if(!check.ok){this.message(check.reason);return false;}
  this.funds-=check.cost;
  if(tool===0){
   const i=y*W+x,z=this.zones.find(z=>Math.abs(z.x-x)<=1&&Math.abs(z.y-y)<=1&&this.id(x,y)>=0x80);
   if(z){const size=[10,11,13,14].includes(z.type)?4:z.type===12?6:3;for(let dy=0;dy<size;dy++)for(let dx=0;dx<size;dx++){const n=(z.y-1+dy)*W+z.x-1+dx;if(n>=0&&n<this.map.length)this.map[n]=0x2a;}}
   else this.map[i]=0;
  } else {
   for(const c of this.footprint(tool,x,y)){const i=c.y*W+c.x;this.map[i]=networkCrossing(tool,this.map[i])??c.id;}
   if(tool>=15)this.gifts.splice(this.gifts.indexOf(tool),1);
  }
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)this.connect(x+dx,y+dy);
  this.refresh();return true;
 }
 connect(x,y){
  if(x<0||x>=W||y<0||y>=H)return;
  const i=y*W+x,id=this.map[i]&1023;let kind=id>=0x70&&id<=0x7c?2:id>=0x60&&id<=0x6c?3:id>=0x30&&id<=0x5c&&(id&15)<=12?1:0;
  if(!kind)return;
  const bit=kind===1?0x40:kind===2?0x20:0x10;
  // DATA_018020, CODE_01B62F/645/65B. Bit directions follow CODE_01B6CC.
  let mask=0;[[0,-1,8],[1,0,2],[0,1,1],[-1,0,4]].forEach(([dx,dy,b])=>{if((this.flags[this.id(x+dx,y+dy)]||0)&(kind===3?0x80:bit))mask|=b;});
  const table=[2,3,2,5,2,6,2,10,3,3,4,9,7,11,8,12];this.map[i]=(kind===1?(id&0xf0):kind===2?0x70:0x60)+table[mask];
 }
 nearRoad(z){return findZoneTransport(this.map,z.x,z.y,W,H)!==null;}
 coverage(x,y,type){let n=0;for(const z of this.zones)if(z.type===type)n=Math.max(n,clamp(1-(Math.abs(z.x-x)+Math.abs(z.y-y))/24,0,1));return n*this.funding[type===8?1:2]/100;}
 fields(){this.updateDensityField();this.updateLandPollutionField();this.updateCrimeField();this.updateFireField();}
 updateDensityField(){const spatial=romDensityField(this.map,this.flags,(id,x,y)=>id>=0x376?48:id===0x84?this.adjacentSmallHomeCount({x,y}):this.zonePopulation({id,type:this.classify(id)})*(this.classify(id)===5?1:8),W,H);this.density=spatial.density;this.centerX=spatial.centerX;this.centerY=spatial.centerY;}
 updateLandPollutionField(){
  // CODE_039D50 reads old terrain $7FAB74, pollution $7F8270 and crime
  // $7F76B8 before CODE_039C75/039FA6 publishes the new planes.
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;this.landValue[i]=romLandValue(x>>1,y>>1,this.centerX,this.centerY,this.terrain[i],this.pollution[i],this.crime[i]);}
  this.meanLandValue=aggregateRomLandValue(this.map,this.landValue,W,H);
  this.pollution=romPollutionField(this.map,W,H);this.terrain=romTerrainField(this.map,W,H);
 }
 captureServiceInputs(){this.serviceInputs={police:seedRomServicePlane(this.map,this.serviceStrengths[0],'police',W,H),fire:seedRomServicePlane(this.map,this.serviceStrengths[1],'fire',W,H)};}
 updateCrimeField(){this.giftEffects=romGiftEffects(this.map,this.flags);this.policeCoverage=this.serviceInputs?expandRomServicePlane(this.serviceInputs.police,'police',W,H):romPoliceCoverage(this.map,this.funding[1],W,H);for(let i=0;i<W*H;i++)this.crime[i]=romCrimeValue(this.landValue[i],this.density[i],this.giftEffects.crimeModifier,this.policeCoverage[i]);this.meanCrime=meanRomCrime(this.crime,this.landValue,W,H);}
 updateFireField(){this.fireCoverage=this.serviceInputs?expandRomServicePlane(this.serviceInputs.fire,'fire',W,H):romFireCoverage(this.map,this.funding[2],W,H);}
 updateScheduledFields(){const due=romFieldSchedule(this.baseStep,this.speed);for(const [key,method]of [['landPollution','updateLandPollutionField'],['crime','updateCrimeField'],['density','updateDensityField'],['fire','updateFireField']])if(due[key]){this[method]();this.fieldEpochs[key]=this.baseStep;}}
 grow(z,direction){
  if(z.type===5){
   const id=this.id(z.x,z.y),current={...z,id};
   if(direction<0){
    if(id===0x37a||id===0x38c)return stampZoneFootprint(this.map,z.x,z.y,0x11c,W,H);
    if(id===0x383||id===0x395)return false;
   }
   const population=id===0x84?this.adjacentSmallHomeCount(z):this.zonePopulation(current);
   if(direction>0&&this.pollution[z.i]>=0x81)return false;
   const density=residentialDensityBand(this.landValue[z.i]||0,this.pollution[z.i]||0);
   if(direction>0){
    if(id===0x84){if(population<8)return placeSmallHome(this.map,z.x,z.y,density,()=>this.random(),()=>this.boundedRandom(2),W,H);if((this.landValue[z.i]||0)<0x41)return false;return stampZoneFootprint(this.map,z.x,z.y,residentialGrowthBase(8,density),W,H);}
    if(id===0x120||population>=40)return mergeResidentialZone(this.map,z.x,z.y,W,H);return stampZoneFootprint(this.map,z.x,z.y,residentialGrowthBase(population,density),W,H);
   }
   return residentialDeclineFootprint(this.map,z.x,z.y,population,density,()=>this.boundedRandom(2),W,H);
  }
  if(z.type===6)return updateCommercialFootprint(this.map,z.x,z.y,this.zonePopulation({...z,id:this.id(z.x,z.y)}),residentialDensityBand(this.landValue[z.i],this.pollution[z.i]),this.landValue[z.i],direction,W,H);
  return updateIndustrialFootprint(this.map,z.x,z.y,this.zonePopulation({...z,id:this.id(z.x,z.y)}),direction,()=>this.random(),W,H);
 }
 adjacentSmallHomeCount(z){
  let count=0;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   if(dx===0&&dy===0)continue;
   const id=this.id(z.x+dx,z.y+dy);if(id>=0x89&&id<0x95)count++;
  }
  return count;
 }
 updateResidentialTile(z,nextRandomWord=()=>this.random()){
  const current={...z,id:this.id(z.x,z.y)};
  const population=current.id===0x84?this.adjacentSmallHomeCount(z):this.zonePopulation(current);
  let transport=1;
  if(boundSimulationWord(nextRandomWord(),35)<population){
   const route=traceZoneTransport(this.map,z.x,z.y,5,nextRandomWord,W,H);transport=route.status;
   if(transport===-1){this.grow(current,-1);return {action:'decline',reason:'missing-transport',randomsUsed:0};}
   if(transport===1)addRouteTraffic(this.map,this.traffic,route.path,W,H);
  }
  const gateWord=current.id===0x84?0:nextRandomWord();
  // CODE_0399D2's 0..255 lookup planes are represented by the model's
  // approximate land-value field; demand and these local inputs remain provisional.
  const localScore=residentialLocalScore(this.landValue[z.i]||0,this.pollution[z.i]||0,transport!==0);
  const score=residentialDemandScore(this.map[z.i],localScore,this.demand[0]);
  const decision=decideResidentialUpdate({tileId:current.id,gateWord,score,population,nextRandomWord});
  if(decision.action==='grow')this.grow(current,1);
  else if(decision.action==='decline')this.grow(z,-1);
  return decision;
 }
 budget(apply=false,taxRate=this.tax){
  // Revenue arithmetic is ROM-derived; complete budget dialog flow remains partial.
  const units=Math.floor(this.rci[0]/8)+this.rci[1]+this.rci[2];
  const meanLandValue=this.meanLandValue||0;
  let giftIncome=romGiftEffects(this.map,this.flags).income;
  let income=romAnnualRevenue(units,meanLandValue,taxRate,this.difficulty)+giftIncome;
  // CODE_038E39 scales road + double rail count by a Q8 factor indexed by difficulty.
  const transportFactor=[0x00b3,0x00e6,0x0133][this.difficulty];
  let requests=[Math.min(9999,Math.floor((this.roadCount+2*this.railCount)*transportFactor/256)),Math.min(9999,this.counts[8]*100),Math.min(9999,this.counts[9]*100)];
  if(this.pendingBudget?.assessment){({income,giftIncome}=this.pendingBudget.assessment);requests=[...this.pendingBudget.assessment.requests];}
  const payment=this.loan?this.loan.payment:0;
  const allocation=allocateRomBudget(requests,this.funding,this.funds+income,payment),expenses=allocation.expenses;
  const net=income-expenses.reduce((a,b)=>a+b,0)-payment;
  const result={income,requests,expenses,desired:allocation.desired,shortfall:allocation.shortfall,payment,net,taxRate,giftIncome};
  if(apply){this.transportStrength=romTransportFunding(expenses[0],requests[0]);this.allocatedFunding=[...expenses];this.serviceStrengths=[1,2].map(i=>romServiceFunding(expenses[i],requests[i]));this.funds=clamp(this.funds+net,0,999999);if(this.loan&&--this.loan.years<=0)this.loan=null;this.lastBudget=result;this.message(`Fiscal year ${this.year}: ${net>=0?'+':''}$${net.toLocaleString()}.`);}
  return result;
 }
 takeLoan(){if(this.loan){this.message('Repay the current loan before borrowing again.');return false;}this.loan={years:21,payment:500};this.funds=Math.min(999999,this.funds+10000);this.message('Bank loan received: $10,000; 21 annual payments of $500.');return true;}
 settleAnnualBudget(){if(!this.pendingBudget)return null;const rate=this.pendingBudget.taxRate;const result=this.budget(true,rate);this.pendingBudget=null;return result;}
 tick(){for(let n=0;n<4&&!this.pendingBudget;n++)this.stepSimulation();}
 stepSimulation(){
  if(this.pendingBudget)return false;
  // CODE_038016 runs demand and tile simulation on each of four base steps.
  this.taxAccumulator+=this.tax;
  this.traffic=this.traffic.map(decayTraffic);
  {const e=stepScenarioEvent(this.scenario,this.scenarioRemaining,this.population);this.scenarioRemaining=e.remaining;if(e.event==='Meltdown'){const site=scenarioMeltdownSite(this.map);if(site)this.disaster(e.event,site.x,site.y);}else if(e.event)this.disaster(e.event);}
  const reminder=stepScenarioReminder(this.scenario,this.year,this.scenarioReminders.length);if(reminder.yearsLeft!==null){this.scenarioReminders.push(reminder.yearsLeft);this.message('Scenario deadline: '+reminder.yearsLeft+' years remaining.');}
  let repaired=false;for(const z of this.zones)if(repairMergedZone(this.map,z.x,z.y,W,H))repaired=true;if(repaired)this.refresh();
  this.updatePower();
  const historyRci=this.history.at(-1)?.rci||[0,0,0];
  const generatedDemand=generateRomDemand(this.rci,historyRci,this.difficulty).scores;
  this.demand=generatedDemand.map((value,i)=>accumulateRomDemand(this.demand[i],value,this.tax,this.difficulty,i===0?2000:1500,{suppressPositive:this.growthCaps.suppressed[i]}));
  this.scanCityTiles();
  this.updateDisasters(false);this.refresh();
  this.baseStep=(this.baseStep+1)&65535;
  if((this.baseStep&3)===0){
   if(++this.month>12){this.month=1;this.year++;this.pendingBudget={year:this.year,taxRate:Math.floor(this.taxAccumulator/48)};const assessment=this.budget(false,this.pendingBudget.taxRate);this.pendingBudget.assessment={income:assessment.income,giftIncome:assessment.giftIncome,requests:[...assessment.requests]};this.taxAccumulator=0;if(this.autoBudget)this.settleAnnualBudget();}
   this.history.push({year:this.year,month:this.month,population:this.population,rci:[...this.rci],funds:this.funds,crime:this.meanCrime||0});if(this.history.length>240)this.history.shift();
  }
  this.scanGrowthCaps();
  this.checkMilestones();
  const result=scenarioOutcome(this.scenario,this.year,{category:this.category,traffic:Math.max(...this.traffic),crime:this.meanCrime||0,score:this.score});if(result!=='active'&&!this.scenarioResult){this.scenarioResult=result;this.message('Scenario '+result+'.');}
  this.updateScheduledFields();
 }
 scanCityTiles(){
  this.serviceInputs={police:new Uint16Array(195),fire:new Uint16Array(195)};
  for(let i=0;i<this.map.length;i++){
   const disaster=dispatchRomDisasterTile(this.map,i,this.flags,this.fireCoverage,this.floodRemaining,()=>this.random(),max=>this.boundedRandom(max),(x,y,id)=>this.igniteZone(x,y,id),W,H);
   if(disaster){this.floodRemaining=disaster.remaining;continue;}
   const scanId=this.map[i]&1023;if(this.flags[scanId]&0x20)spawnRomTrain(this.train,scanId,i%W,Math.floor(i/W),this.quakeFrames);
   if(scanId===0x26c&&(this.map[i]&0x8000)&&!this.ship.active)spawnRomShip(this.ship,this.map,max=>this.boundedRandom(max));
   updateRomTransportTile(this.map,i,this.flags,this.transportStrength,this.traffic[i],()=>this.random(),{shipX:this.ship.x,shipY:this.ship.y},W,H);
   const id=this.map[i]&1023;if(!(this.flags[id]&1))continue;
   addRomServiceCenter(this.serviceInputs.police,this.map,i,this.serviceStrengths[0],'police',W,H);addRomServiceCenter(this.serviceInputs.fire,this.map,i,this.serviceStrengths[1],'fire',W,H);
   const z={i,x:i%W,y:Math.floor(i/W),id,type:this.classify(id)};if(z.type<5||z.type>7)continue;
   if(z.type===5){this.updateResidentialTile(z);continue;}
   let transport=1;if(this.boundedRandom(5)<this.zonePopulation(z)){const route=traceZoneTransport(this.map,z.x,z.y,z.type,()=>this.random(),W,H);transport=route.status;if(transport===1)addRouteTraffic(this.map,this.traffic,route.path,W,H);}
   if(transport===-1){this.grow(z,-1);continue;}
   const decision=decideJobZoneUpdate({mapWord:this.map[z.i],demand:this.demand[z.type-5],localScore:transport===0?(z.type===7?-1000:-3000):0,gateWord:this.random(),nextRandomWord:()=>this.random()});
   if(decision.action==='grow')this.grow(z,1);
   else if(decision.action==='decline')this.grow(z,-1);
  }
 }
 updateGrowthCaps(){for(let n=0;n<4;n++){this.baseStep=(this.baseStep+1)&65535;this.scanGrowthCaps();}}
 scanGrowthCaps(){const input={zones:this.counts.slice(5,8),roads:this.roadCount,rails:this.railCount,plants:this.zones.filter(z=>z.id===0x28c||z.id===0x27c).length,rci:this.rci,stadiums:this.counts[10],seaports:this.counts[11],airports:this.counts[12]};const advice=scanRomGrowthCaps(this.baseStep,input,this.growthCaps);if(advice>=6&&advice<=8)this.message(['A stadium is needed for further residential growth.','A seaport is needed for further industrial growth.','An airport is needed for further commercial growth.'][advice-6]);}
 checkMilestones(){const event=nextCoreMilestone({population:this.population,category:this.category,police:this.counts[8],fire:this.counts[9],rail:this.railCount,inventorySize:this.gifts.length},this.giftMilestones);if(event){this.message(event.text);if(event.gift!==null)enqueueRomGift(this.gifts,event.gift);}return event;}
 advance(ms){if(this.pendingBudget)return;this.elapsed+=ms*this.speed;while(this.elapsed>=750&&!this.pendingBudget){this.elapsed-=750;this.stepSimulation();}if(this.pendingBudget)this.elapsed=0;}
 advanceVisualFrames(frames,blocked=false){for(let n=0;n<frames;n++){if(this.quakeFrames){this.quakeFrames--;this.train.active=false;}if((this.quakePhase&7)===1){const event=stepRomShip(this.ship,this.map,()=>this.menuRandom(),{paused:blocked});if(event.navigation==='collision'){applyRomShipCollision(this.map,this.flags,event.collision.x,event.collision.y,()=>this.menuRandom());this.recordEvent(0x10);this.message('A ship collided.');this.refresh();}}if(!blocked&&(this.quakePhase&7)===6)stepRomTrain(this.train,this.map,()=>this.menuRandom(),W,H);this.quakePhase=(this.quakePhase+1)&255;}}
 recordEvent(id){recordRomHistory(this.eventHistory,id,this.year,this.month);}
 disaster(type,x=60,y=50){
  if(type==='Flood'){const result=startRomFlood(this.map,this.flags,max=>this.boundedRandom(max),W,H);if(result.started){this.floodRemaining=result.remaining;this.recordEvent(0x0c);this.message('Flood reported.');this.refresh();}else this.message('No vulnerable shoreline found.');return result;}
  if(type==='Earthquake'){const result=applyRomEarthquake(this.map,this.flags,max=>this.boundedRandom(max),W,H);this.quakeFrames=result.attempts;this.recordEvent(0x0e);this.message('Earthquake reported.');this.refresh();return result;}
  if(type==='Meltdown'){const result=applyRomMeltdown(this.map,this.flags,x,y,max=>this.boundedRandom(max),W,H);this.recordEvent(0x08);this.message('Nuclear meltdown reported.');this.refresh();return result;}
  if(type==='Fire'){this.map[y*W+x]=0x7f;this.recordEvent(0x0b);this.message('Fire reported.');this.refresh();return;}
  this.disasters.push({type,x,y,life:type==='Earthquake'?1:16});this.message(`${type} reported. Emergency services are responding.`);
  if(type==='Fire')this.map[y*W+x]=0x2e;
  this.updateDisasters();this.refresh();

  const result=scenarioOutcome(this.scenario,this.year,{category:this.category,traffic:Math.max(...this.traffic),crime:this.meanCrime||0,score:this.score});if(result!=='active'&&!this.scenarioResult){this.scenarioResult=result;this.message('Scenario '+result+'.');}
 }
 igniteZone(x,y,id){burnRomZone(this.map,y*W+x,this.flags);}
 updateDisasters(scanTiles=true){
  if(scanTiles)for(let i=0;i<this.map.length;i++){const result=dispatchRomDisasterTile(this.map,i,this.flags,this.fireCoverage,this.floodRemaining,()=>this.random(),max=>this.boundedRandom(max),(x,y,id)=>this.igniteZone(x,y,id),W,H);if(result)this.floodRemaining=result.remaining;}
  for(const d of this.disasters){
   let radius=d.type==='Earthquake'?18:d.type==='Meltdown'?8:d.type==='Flood'?4:2;
   for(let n=0;n<(d.type==='Earthquake'?100:12);n++){
    const x=clamp(d.x+(this.random()%(radius*2+1))-radius,0,W-1),y=clamp(d.y+(this.random()%(radius*2+1))-radius,0,H-1),i=y*W+x,t=this.map[i]&1023;
    if(d.type==='Flood'){if(t!==0&&t<0x26)this.map[i]=1;}
    else if(t>3)this.map[i]=d.type==='Meltdown'?0x7f:d.type==='Fire'?0x2e:0x2a;
   }
   if(d.type==='Tornado'||d.type==='Monster'||d.type==='UFO'){d.x=clamp(d.x+(this.random()%7)-3,3,W-4);d.y=clamp(d.y+(this.random()%7)-3,3,H-4);}
   if(d.type==='Fire'&&this.boundedRandom(fireBurnoutMaximum(Math.min(255,this.fireCoverage?.[d.y*W+d.x]||0)))===0){this.map[d.y*W+d.x]=0x28;d.life=0;}
   d.life--;
  }
  this.disasters=this.disasters.filter(d=>d.life>0);
 }
 serialize(){return JSON.stringify({version:1,eventHistory:this.eventHistory,train:this.train,transportStrength:this.transportStrength,ship:this.ship,floodRemaining:this.floodRemaining,disasters:this.disasters,quakeFrames:this.quakeFrames,quakePhase:this.quakePhase,autoBudget:this.autoBudget,pendingBudget:this.pendingBudget,lastBudget:this.lastBudget,serviceStrengths:this.serviceStrengths,allocatedFunding:this.allocatedFunding,serviceInputs:this.serviceInputs?{police:Array.from(this.serviceInputs.police),fire:Array.from(this.serviceInputs.fire)}:null,fieldState:Object.fromEntries(['terrain','pollution','crime','landValue','density','policeCoverage','fireCoverage'].map(k=>[k,Array.from(this[k])])),centerX:this.centerX,centerY:this.centerY,fieldEpochs:this.fieldEpochs,meanCrime:this.meanCrime,meanLandValue:this.meanLandValue,elapsed:this.elapsed,speed:this.speed,baseStep:this.baseStep,growthCaps:this.growthCaps,demand:this.demand,giftMilestones:this.giftMilestones,simulationRng:this.simulationRng,traffic:Array.from(this.traffic),scenarioRemaining:this.scenarioRemaining,scenarioResult:this.scenarioResult,scenarioReminders:this.scenarioReminders,scenarioDialogSeen:this.scenarioDialogSeen,map:Array.from(this.map),name:this.name,scenario:this.scenario,year:this.year,month:this.month,funds:this.funds,difficulty:this.difficulty,tax:this.tax,taxAccumulator:this.taxAccumulator,funding:this.funding,rngA:this.rngA,rngB:this.rngB,history:this.history,loan:this.loan,gifts:this.gifts});}
 static restore(text,build,flags){const s=JSON.parse(text);if(s.version!==1||!Array.isArray(s.map)||s.map.length!==12000||s.map.some(n=>!Number.isInteger(n)||n<0||n>65535))throw Error('This is not a supported city save.');const c=new City(s.map,build,flags,s);for(const k of ['eventHistory','train','transportStrength','ship','floodRemaining','disasters','quakeFrames','quakePhase','autoBudget','pendingBudget','lastBudget','serviceStrengths','allocatedFunding','centerX','centerY','fieldEpochs','meanCrime','meanLandValue','elapsed','speed','baseStep','growthCaps','demand','giftMilestones','simulationRng','scenarioRemaining','scenarioResult','scenarioReminders','scenarioDialogSeen','month','funds','tax','taxAccumulator','funding','rngA','rngB','history','loan','gifts'])if(s[k]!==undefined)c[k]=s[k];if(Array.isArray(s.traffic)&&s.traffic.length===W*H)c.traffic=Uint8Array.from(s.traffic);if(s.fieldState)for(const k of ['terrain','pollution','crime','landValue','density','policeCoverage','fireCoverage'])if(Array.isArray(s.fieldState[k])&&s.fieldState[k].length===W*H)c[k]=(k.endsWith('Coverage')?Uint16Array:Uint8Array).from(s.fieldState[k]);if(s.serviceInputs&&['police','fire'].every(k=>Array.isArray(s.serviceInputs[k])&&s.serviceInputs[k].length===195))c.serviceInputs={police:Uint16Array.from(s.serviceInputs.police),fire:Uint16Array.from(s.serviceInputs.fire)};c.ship={...createRomShip(),...c.ship};c.refresh();return c;}
}































