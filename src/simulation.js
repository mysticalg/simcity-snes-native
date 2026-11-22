import {installTerrainTools,reshapeTerrain} from './terrain-tools.js';
import {createRomMonster,startRomMonster,stepRomMonster,monsterPollutionTarget} from './rom-monster.js';
import {CIVIC_TOOLS,installCivicTools,civicForId,civicBounds,civicServices,updateCivicMonth,educationEffects} from './civic.js?v=build-groups-1';
import {createRomTornado,startRomTornado,stepRomTornado} from './rom-tornado.js';
import {createRomSeason,changeRomSeason,advanceRomSeason} from './rom-render.js?v=season-1';
import {romPopulation} from './rom-population.js';
import {selectRomRandomDisaster} from './rom-random-disaster.js';
import {romFacilityDemand,placeRomFacility,updateRomFacility} from './rom-facilities.js';
import {createRomTrain,spawnRomTrain,stepRomTrain} from './rom-train.js';
import {createRomShip,spawnRomShip,stepRomShip} from './rom-ship.js?v=collision-2';
import {applyRomShipCollision,burnRomZone} from './rom-collision.js';
import {recordRomHistory} from './rom-history.js';
import {romCommercialRate,commercialLocalScore,industrialLocalScore} from './rom-commercial.js';
import {romCityProblems,romCityScore,pollRomProblems,pollRomApproval,romAssessedValue} from './rom-evaluation.js?v=facilities-1';
import {romTransportFunding,updateRomTransportTile} from './rom-transport.js';
import {traceRomPower} from './rom-power.js?v=regions-1';
import {romFieldSchedule} from './rom-schedule.js';
import {romGiftEffects,nextCoreMilestone,enqueueRomGift} from './rom-gifts.js?v=history-3';
import {networkCrossing} from './rom-networks.js';
import {romPoliceCoverage,romFireCoverage,fireBurnoutMaximum,romServiceFunding,seedRomServicePlane,expandRomServicePlane,addRomServiceCenter} from './rom-services.js';
import {romDensityField} from './rom-density.js';
import {romCrimeValue,meanRomCrime} from './rom-crime.js';
import {romPollutionField} from './rom-pollution.js';
import {aggregateRomLandValue,romLandValue,romTerrainField} from './rom-land-value.js';
import {romAnnualRevenue,allocateRomBudget} from './rom-finance.js';
import {SIMULATION_SEED,nextSimulationWord,boundSimulationWord} from './rom-random.js';
import {decayTraffic,addRouteTraffic} from './rom-traffic.js';
import {applyRomMeltdown,applyRomEarthquake,startRomFire,startRomFlood,dispatchRomDisasterTile} from './rom-disasters.js?v=fire-start-1';
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
for(const b of CIVIC_TOOLS)TOOLS[b.tool]=b.name;TOOLS[42]='Create land';TOOLS[43]='Create water';
export function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
export function cityCategory(population){return LIMITS.filter(n=>population>=n).length;}
export class City {
 constructor(map,build,flags,opts={}){
  if(map.length!==W*H)throw Error('Invalid map length');
  installCivicTools(build,flags);installTerrainTools(build);this.map=Uint16Array.from(map);this.build=build;this.flags=flags;this.pipes=new Uint8Array(W*H);this.busStops=new Uint8Array(W*H);this.civicLegacyLayouts={};this.terraform=new Uint8Array(W*H);this.civicEnabled=opts.civicEnabled??false;this.civic={waterEnabled:!!opts.civicEnabled,garbage:0,health:100,education:0,water:100,buses:0,generatedGarbage:0,collectedGarbage:0};this.civicCapacity={};this.busRoutes=[];this.regionalState=null;this.regionalProvider=null;
  this.name=opts.name||'New city';this.scenario=opts.scenario||'PracticeCity';this.year=opts.year||1900;this.month=1;this.season=createRomSeason(1);this.populationBaseline=0;this.netMigration=0;this.score=500;this.scoreChange=0;this.evaluation=null;this.fireCount=0;this.facilityDemand=[0,0];this.facilityCounts=[0,0];this.facilityRepairPhase=0;this.eventHistory=[];if(['PracticeCity','FreeCity'].includes(this.scenario))recordRomHistory(this.eventHistory,0,this.year,this.month);
  this.disastersEnabled=opts.disastersEnabled!==false;this.difficulty=clamp(Math.trunc(opts.difficulty??0),0,2);this.funds=[20000,10000,5000][this.difficulty];this.tax=7;this.funding=[100,100,100];this.serviceStrengths=[1000,1000];this.policeEffectiveness=opts.policeEffectiveness===1?1:2;this.transportStrength=32;this.ship=createRomShip();this.tornado=createRomTornado();this.monster=createRomMonster();this.pollutionTarget={x:0,y:0};this.soundEvents=[];this.train=createRomTrain();this.allocatedFunding=null;this.speed=1;
  this.simulationRng=[...SIMULATION_SEED];this.rngA=0x5cd6;this.rngB=0x1238;this.population=0;this.demand=[400,200,200];this.history=[];this.taxAccumulator=opts.taxAccumulator||0;
  this.power=new Uint8Array(W*H);this.pollution=new Uint8Array(W*H);this.crime=new Uint8Array(W*H);this.landValue=new Uint8Array(W*H);this.traffic=new Uint8Array(W*H);
  this.baseStep=0;this.growthCaps={zoneTotal:0,suppressed:[false,false,false]};this.terrain=new Uint8Array(W*H);this.density=new Uint8Array(W*H);this.policeCoverage=new Uint16Array(W*H);this.fireCoverage=new Uint16Array(W*H);this.centerX=30;this.centerY=25;this.commercialRate=new Int16Array(195);this.fieldEpochs={};this.zones=[];this.notices=[];this.dismissedNotices=[];this.disasters=[];this.floodRemaining=0;this.quakeFrames=0;this.quakePhase=0;this.loans=[];this.elapsed=0;this.category=0;this.giftMilestones={};this.gifts=[];this.giftChoice=16;this.lastBudget=null;this.autoBudget=opts.autoBudget??false;this.pendingBudget=null;
  this.scenarioRemaining=SCENARIO_EVENT_COUNTS[this.scenario]||0;this.scenarioReminders=[];this.scenarioResult=null;this.scenarioDialogSeen=false;this.refresh();
 }
 // CODE_00824F: additive RNG, including carry into the second 16-bit add.
 menuRandom(){const old=this.rngA;let n=old+this.rngB;this.rngA=n&65535;this.rngB=(this.rngA+old+(n>65535?1:0))&65535;return this.rngB;}
 random(){return nextSimulationWord(this.simulationRng);}
 boundedRandom(maximum){return boundSimulationWord(this.random(),maximum);}
 id(x,y){return x>=0&&x<W&&y>=0&&y<H?this.map[y*W+x]&1023:0;}
 flag(i){return this.flags[this.map[i]&1023]||0;}
 neighbors(i){const x=i%W,y=Math.floor(i/W);return [x>0?i-1:-1,y>0?i-W:-1,x<W-1?i+1:-1,y<H-1?i+W:-1].filter(n=>n>=0);}
 dismissNotice(text){this.dismissedNotices=this.dismissedNotices.filter(n=>n.year===this.year);if(text&&!this.noticeIsDismissed(text))this.dismissedNotices.push({text,year:this.year});}
 noticeIsDismissed(text){return this.dismissedNotices.some(n=>n.text===text&&n.year===this.year);}
 message(text){this.noticeSerial=(this.noticeSerial||0)+1;this.notices.unshift(text);this.notices.length=Math.min(8,this.notices.length);}
 classify(id){
  const custom=civicForId(id);if(custom)return custom.tool;
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
  this.revision=(this.revision||0)+1;this.zones=[];this.roadCount=0;this.railCount=0;
  for(let i=0;i<this.map.length;i++){
   const id=this.map[i]&1023,f=this.flags[id]||0;
   if(f&1)this.zones.push({i,x:i%W,y:Math.floor(i/W),id,type:this.classify(id),layout:this.civicLegacyLayouts[i]});
   if(f&0x20)this.railCount++;else if(f&0x40)this.roadCount+=id>=0x80||(id&15)<2?5:1;
  }
  for(let i=0;i<this.busStops.length;i++)if(this.busStops[i]){if(this.flags[this.map[i]&1023]&64)this.zones.push({i,x:i%W,y:Math.floor(i/W),id:967,type:37});else this.busStops[i]=0;}
  this.updatePower();this.census();if(this.regionalProvider){this.regionalState=this.regionalProvider(this);this.updatePower();}if(this.civicEnabled){const services=civicServices(this);this.civicCapacity=services.capacity;this.busRoutes=services.routes;this.civicWatered=services.watered;this.waterField=services.water;}
 }
 updatePower(){
  const fusionSeeds=this.zones.filter(z=>z.id===963||z.id===972).map(z=>z.i);const result=traceRomPower(this.map,this.flags,W,H,{extraSeeds:fusionSeeds,extraCapacity:fusionSeeds.reduce((n,i)=>n+((this.map[i]&1023)===972?200:10000),0)});
  if(this.regionalState){for(let i=0;i<W*H;i++)if(this.regionalState.regionalPowerMask[i])result.power[i]=this.regionalState.importPower[i];result.exhausted ||=this.regionalState.powerShortfall;}
  this.power=result.power;this.powerCapacity=result.capacity+(this.regionalState?.powerSummary?.imported||0);this.powerUsed=this.regionalState?.powerSummary?.imported?result.power.reduce((n,v)=>n+v,0):result.used;this.powerOverloaded=result.exhausted;
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
  this.facilityCounts=[0,0];this.counts=Array(16).fill(0);this.rci=[0,0,0];let unpowered=0;
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
   if(id===0x129||id===0x132){this.facilityCounts[id===0x129?0:1]++;continue;}if(type<5||type>7)continue;
   this.counts[type]++;
   this.rci[type-5]+=type===5&&id===0x84?this.adjacentSmallHomeCount({x:i%W,y:Math.floor(i/W)}):this.zonePopulation({id,type});
   if(!this.power[i])unpowered++;
  }
  // CODE_038196: word-sized census arithmetic, population and migration.
  this.rci=this.rci.map(value=>value&65535);const census=romPopulation(this.rci,this.populationBaseline);this.population=census.population;this.netMigration=census.netMigration;this.category=census.category;this.unpowered=unpowered;
 }
 footprint(tool,x,y){const b=this.build.buildings[tool];return b.tiles.map((id,i)=>({x:x+b.x[i],y:y+b.y[i],id}));}
 canBuild(tool,x,y){
  if(tool<0)return {ok:false,cost:0,reason:'Choose a construction tool.'};
  if(tool===42||tool===43){const inside=x>=0&&x<W&&y>=0&&y<H,id=this.id(x,y),same=tool===42?id===0:id>=1&&id<20,cost=tool===42?5:10;return {ok:inside&&id<48&&!same&&this.funds>=cost,cost,reason:!inside?'Terrain must fit inside the map.':same?'This terrain is already here.':id>=48?'Clear this site before building.':'Insufficient funds.'};}
  if(tool===37&&(this.flags[this.id(x,y)]&64)){return {ok:x>=0&&x<W&&y>=0&&y<H&&!this.busStops[y*W+x]&&this.funds>=25,cost:25,reason:this.busStops[y*W+x]?'A bus stop is already here.':'Insufficient funds.'};}
  if(tool===40){const ok=x>=0&&x<W&&y>=0&&y<H;return {ok:ok&&!this.pipes[y*W+x]&&this.funds>=2,cost:2,reason:!ok?'Pipe must fit inside the map.':this.pipes[y*W+x]?'A pipe is already here.':'Insufficient funds.'};}
  if(tool===0){const id=this.id(x,y);return {ok:x>=0&&x<W&&y>=0&&y<H&&id>3,cost:1,reason:'There is nothing to clear here.'};}
  const cells=this.footprint(tool,x,y);let cost=this.build.costs[tool]||100;
  if(tool>=15&&tool<30){if(!this.gifts.includes(tool))return {ok:false,cost:0,reason:'This gift has not been awarded.'};cost=0;}
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
 replacementPlan(tool,x,y){
  const check=this.canBuild(tool,x,y);if(check.ok||tool<=0||check.reason!=='Clear this site before building.')return {...check,map:null,cleared:[]};
  const original=this.map,candidate=Uint16Array.from(original),cleared=new Set();
  const add=(cx,cy)=>{if(cx>=0&&cx<W&&cy>=0&&cy<H){const i=cy*W+cx;if(original[i]&1023)cleared.add(i);candidate[i]=0;}};
  for(const c of this.footprint(tool,x,y)){
   const id=this.id(c.x,c.y);if(id<=3)continue;
   // Preserve legal network crossings and skip rebuilding an existing segment.
   if(tool<=3&&((this.flags[id]||0)&(tool===1?0x40:tool===2?0x20:0x10)))return {ok:false,cost:0,reason:'This network is already here.',map:null,cleared:[]};
   const z=this.zones.find(z=>{const custom=civicBounds(z);if(custom)return c.x>=custom.x&&c.x<custom.x+custom.width&&c.y>=custom.y&&c.y<custom.y+custom.height;const size=[10,11,13,14].includes(z.type)?4:z.type===12?6:3;return c.x>=z.x-1&&c.x<z.x-1+size&&c.y>=z.y-1&&c.y<z.y-1+size;});
   if(z){const custom=civicBounds(z);if(custom){for(let dy=0;dy<custom.height;dy++)for(let dx=0;dx<custom.width;dx++)add(custom.x+dx,custom.y+dy);}else{const size=[10,11,13,14].includes(z.type)?4:z.type===12?6:3;for(let dy=0;dy<size;dy++)for(let dx=0;dx<size;dx++)add(z.x-1+dx,z.y-1+dy);}}else add(c.x,c.y);
  }
  this.map=candidate;let next;try{next=this.canBuild(tool,x,y);}finally{this.map=original;}
  const cost=next.cost+cleared.size;return {...next,ok:next.ok&&this.funds>=cost,cost,reason:this.funds<cost?'Insufficient funds.':next.reason,map:candidate,cleared:[...cleared]};
 }
 planPlacements(tool,cells,options={}){
  const shadow=Object.assign(Object.create(Object.getPrototypeOf(this)),this,{map:Uint16Array.from(this.map),gifts:[...this.gifts],pipes:Uint8Array.from(this.pipes),busStops:Uint8Array.from(this.busStops),terraform:Uint8Array.from(this.terraform),civic:{...this.civic},civicLegacyLayouts:{...this.civicLegacyLayouts},zones:[...this.zones],notices:[]});
  if(options.ignoreFunds)shadow.funds=1000000000;const startingFunds=shadow.funds;let target=null,activeTool=tool,skipped=0;const occupied=new Set(),anchors=[];
  shadow.refresh=()=>{shadow.zones=shadow.zones.filter(z=>(shadow.map[z.i]&1023)===z.id);if(activeTool>0)for(const c of shadow.footprint(activeTool,target.x,target.y)){const i=c.y*W+c.x,id=shadow.map[i]&1023;if((shadow.flags[id]&1)&&!shadow.zones.some(z=>z.i===i))shadow.zones.push({i,x:c.x,y:c.y,id,type:shadow.classify(id)});}};
  for(const c of cells){
   activeTool=c.tool??tool;const footprint=activeTool>4?shadow.footprint(activeTool,c.x,c.y):[c];if(footprint.some(p=>occupied.has(p.y*W+p.x)))continue;
   const id=shadow.id(c.x,c.y),bit=[0,0x40,0x20,0x10][activeTool];
   if(activeTool>=1&&activeTool<=3&&id>=0x30&&id<0x80&&(shadow.flags[id]&bit)){skipped++;continue;}
   target=c;if(!shadow.place(activeTool,c.x,c.y,{...options,autoDemolish:options.skipBlocked?false:options.autoDemolish})){
    if(options.skipBlocked){skipped++;continue;}
    if(shadow.notices[0]==='Insufficient funds.'&&!options.ignoreFunds){const required=this.planPlacements(tool,cells,{...options,ignoreFunds:true});return {...required,ok:false,reason:'Insufficient funds.'};}
    return {ok:false,reason:shadow.notices[0]||'This blueprint cannot be placed.',anchors,cost:startingFunds-shadow.funds};
   }
   anchors.push(c);for(const p of footprint)occupied.add(p.y*W+p.x);
  }
  return {ok:true,tool,anchors,skipped,cost:startingFunds-shadow.funds,map:shadow.map,pipes:shadow.pipes,busStops:shadow.busStops,terraform:shadow.terraform,civicLegacyLayouts:shadow.civicLegacyLayouts,civicEnabled:shadow.civicEnabled,waterEnabled:shadow.civic.waterEnabled,gifts:shadow.gifts};
 }

 applyPlacementPlan(plan){
  if(!plan.ok){this.message(plan.reason);return false;}
  this.map=plan.map;if(plan.pipes)this.pipes=plan.pipes;if(plan.busStops)this.busStops=plan.busStops;if(plan.terraform)this.terraform=plan.terraform;if(plan.civicLegacyLayouts)this.civicLegacyLayouts=plan.civicLegacyLayouts;this.civicEnabled ||=plan.civicEnabled;this.civic.waterEnabled ||=plan.waterEnabled;this.funds-=plan.cost;this.gifts=plan.gifts;this.refresh();if(plan.tool===8||plan.tool===21)this.message('Police station built. Coverage reduces crime as the simulation runs; power, roads and funding affect its strength.');return true;
 }
 place(tool,x,y,{autoDemolish=false}={}){
  const check=autoDemolish?this.replacementPlan(tool,x,y):this.canBuild(tool,x,y);if(!check.ok){this.message(check.reason);return false;}
  if(check.map)this.map=check.map;
  this.funds-=check.cost;if(tool===42||tool===43){reshapeTerrain(this.map,this.terraform,x,y,tool===43);this.refresh();return true;}
  if(tool===37&&(this.flags[this.id(x,y)]&64)){this.busStops[y*W+x]=1;this.civicEnabled=true;this.refresh();return true;}if(tool===0&&this.busStops[y*W+x]){this.busStops[y*W+x]=0;this.refresh();return true;}if(tool>=30)this.civicEnabled=true;if(tool===39||tool===40)this.civic.waterEnabled=true;if(tool===40){this.pipes[y*W+x]=1;this.refresh();return true;}
  if(tool===0){
   const custom=this.zones.find(z=>{const b=civicBounds(z);return b&&x>=b.x&&x<b.x+b.width&&y>=b.y&&y<b.y+b.height;});if(custom){const b=civicBounds(custom);delete this.civicLegacyLayouts[custom.i];for(let dy=0;dy<b.height;dy++)for(let dx=0;dx<b.width;dx++)this.map[(b.y+dy)*W+b.x+dx]=0;this.refresh();return true;}
   const i=y*W+x,z=this.zones.find(z=>Math.abs(z.x-x)<=1&&Math.abs(z.y-y)<=1&&this.id(x,y)>=0x80);
   if(z){const size=civicForId(z.id)?.size||([10,11,13,14].includes(z.type)?4:z.type===12?6:3),offset=size===1?0:1;for(let dy=0;dy<size;dy++)for(let dx=0;dx<size;dx++){const n=(z.y-offset+dy)*W+z.x-offset+dx;if(n>=0&&n<this.map.length)this.map[n]=0;}}
   else {this.map[i]=0;this.pipes[i]=0;}
  } else {
   for(const c of this.footprint(tool,x,y)){const i=c.y*W+c.x;this.map[i]=networkCrossing(tool,this.map[i])??c.id;if(c.id>=960&&c.id<=969)delete this.civicLegacyLayouts[i];}
   if(tool>=15&&tool<30)this.gifts.splice(this.gifts.indexOf(tool),1);
  }
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)this.connect(x+dx,y+dy);
  for(const i of check.cleared||[])for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]])this.connect(i%W+dx,Math.floor(i/W)+dy);
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
 updateDensityField(){this.commercialRate=romCommercialRate(this.centerX,this.centerY);const spatial=romDensityField(this.map,this.flags,(id,x,y)=>id>=960?0:id>=0x376?48:id===0x84?this.adjacentSmallHomeCount({x,y}):this.zonePopulation({id,type:this.classify(id)})*(this.classify(id)===5?1:8),W,H);this.density=spatial.density;this.centerX=spatial.centerX;this.centerY=spatial.centerY;}
 updateLandPollutionField(){
  // CODE_039D50 reads old terrain $7FAB74, pollution $7F8270 and crime
  // $7F76B8 before CODE_039C75/039FA6 publishes the new planes.
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;this.landValue[i]=romLandValue(x>>1,y>>1,this.centerX,this.centerY,this.terrain[i],this.pollution[i],this.crime[i]);}
  this.meanLandValue=aggregateRomLandValue(this.map,this.landValue,W,H);
  this.pollution=romPollutionField(this.map,W,H);this.pollutionTarget=monsterPollutionTarget(this.pollution,this.pollutionTarget);this.terrain=romTerrainField(this.map,W,H);
 }
 captureServiceInputs(){this.serviceInputs={police:seedRomServicePlane(this.map,this.serviceStrengths[0]*this.policeEffectiveness,'police',W,H),fire:seedRomServicePlane(this.map,this.serviceStrengths[1],'fire',W,H)};}
 updateCrimeField(){this.giftEffects=romGiftEffects(this.map,this.flags);this.policeCoverage=this.serviceInputs?expandRomServicePlane(this.serviceInputs.police,'police',W,H):expandRomServicePlane(seedRomServicePlane(this.map,this.serviceStrengths[0]*this.policeEffectiveness,'police',W,H),'police',W,H);for(let i=0;i<W*H;i++)this.crime[i]=romCrimeValue(this.landValue[i],this.density[i],this.giftEffects.crimeModifier,this.policeCoverage[i]);if(this.civicEnabled){const factor=1-educationEffects(this.civic.education).crimeReduction;for(let i=0;i<this.crime.length;i++)this.crime[i]=Math.floor(this.crime[i]*factor);}this.meanCrime=meanRomCrime(this.crime,this.landValue,W,H);}
 updateFireField(){this.fireCoverage=this.serviceInputs?expandRomServicePlane(this.serviceInputs.fire,'fire',W,H):romFireCoverage(this.map,this.funding[2],W,H);}
 updateScheduledFields(){const due=romFieldSchedule(this.baseStep,this.speed);for(const [key,method]of [['landPollution','updateLandPollutionField'],['crime','updateCrimeField'],['density','updateDensityField'],['fire','updateFireField']])if(due[key]){this[method]();this.fieldEpochs[key]=this.baseStep;}}
 setPoliceEffectiveness(value){
  this.policeEffectiveness=value===1?1:2;
  this.serviceInputs={fire:this.serviceInputs?.fire||seedRomServicePlane(this.map,this.serviceStrengths[1],'fire',W,H),police:seedRomServicePlane(this.map,this.serviceStrengths[0]*this.policeEffectiveness,'police',W,H)};
  this.updateCrimeField();
 }
 policeEffectAt(x,y){
  x=clamp(Math.floor(x),0,W-1);y=clamp(Math.floor(y),0,H-1);const i=y*W+x;
  const station=this.zones.find(z=>(z.id===0x249||z.id===0x307)&&Math.abs(z.x-x)<=1&&Math.abs(z.y-y)<=1);
  let nextUpdate=1;while(nextUpdate<16&&!romFieldSchedule((this.baseStep+nextUpdate)&65535,this.speed).crime)nextUpdate++;
  return {crime:this.crime[i],coverage:this.policeCoverage[i],strength:this.serviceStrengths[0],effectiveness:this.policeEffectiveness,nextUpdate,station:station?{powered:!!this.power[station.i],road:!!findZoneTransport(this.map,station.x,station.y,W,H)}:null};
 }
 grow(z,direction){
  if(direction>0&&this.civicEnabled&&this.civic.waterEnabled&&!(this.civicWatered||civicServices(this).watered).has(z.i)&&!(z.type===5&&this.id(z.x,z.y)===0x84&&this.adjacentSmallHomeCount(z)<8))return false;
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
   const route=traceZoneTransport(this.map,z.x,z.y,5,nextRandomWord,W,H);transport=route.status;if(transport!==1&&this.regionalState?.zoneAccess.get(z.i)?.jobs>0)transport=1;
   if(transport===-1){this.grow(current,-1);return {action:'decline',reason:'missing-transport',randomsUsed:0};}
   if(transport===1)addRouteTraffic(this.map,this.traffic,route.path,W,H);
  }
  const gateWord=current.id===0x84?0:nextRandomWord();
  // CODE_0399D2's 0..255 lookup planes are represented by the model's
  // approximate land-value field; demand and these local inputs remain provisional.
  const localScore=residentialLocalScore(this.landValue[z.i]||0,this.pollution[z.i]||0,transport!==0);
  const score=residentialDemandScore(this.map[z.i],localScore,this.demand[0]);
  const decision=decideResidentialUpdate({tileId:current.id,gateWord,score,population,nextRandomWord});
  if(decision.action==='special')placeRomFacility(this.map,z.x,z.y,this.facilityDemand,W,H);else if(decision.action==='grow')this.grow(current,1);
  else if(decision.action==='decline')this.grow(z,-1);
  return decision;
 }
 budget(apply=false,taxRate=this.tax){
  // Revenue arithmetic is ROM-derived; complete budget dialog flow remains partial.
  const units=Math.floor(this.rci[0]/8)+this.rci[1]+this.rci[2];
  const meanLandValue=this.meanLandValue||0;
  let giftIncome=romGiftEffects(this.map,this.flags).income;
  const productivity=this.civicEnabled?educationEffects(this.civic.education).productivity:1;let income=Math.floor(romAnnualRevenue(units,meanLandValue,taxRate,this.difficulty)*productivity)+giftIncome;
  // CODE_038E39 scales road + double rail count by a Q8 factor indexed by difficulty.
  const transportFactor=[0x00b3,0x00e6,0x0133][this.difficulty];
  let requests=[Math.min(9999,Math.floor((this.roadCount+2*this.railCount)*transportFactor/256)),Math.min(9999,this.counts[8]*100),Math.min(9999,this.counts[9]*100)];
  if(this.pendingBudget?.assessment){({income,giftIncome}=this.pendingBudget.assessment);requests=[...this.pendingBudget.assessment.requests];}
  const payment=this.loans.reduce((sum,loan)=>sum+loan.payment,0);
  const allocation=allocateRomBudget(requests,this.funding,this.funds+income,payment),expenses=allocation.expenses;
  const civicExpense=this.civicEnabled?civicServices(this).annual:0;const net=income-expenses.reduce((a,b)=>a+b,0)-payment-civicExpense;
  const result={income,productivity,civicExpense,requests,expenses,desired:allocation.desired,shortfall:allocation.shortfall,payment,net,taxRate,giftIncome};
  if(apply){this.transportStrength=romTransportFunding(expenses[0],requests[0]);this.allocatedFunding=[...expenses];this.serviceStrengths=[1,2].map(i=>romServiceFunding(expenses[i],requests[i]));this.funds=clamp(this.funds+net,0,999999);this.loans=this.loans.filter(loan=>--loan.years>0);this.lastBudget=result;this.message(`Annual balance: ${net>=0?'+':''}$${net.toLocaleString()}.`);}
  return result;
 }
 get loan(){return this.loans[0]??null;}
 takeLoan(amount=100000){amount=Number(amount);if(!Number.isInteger(amount)||amount<1000||amount>100000||amount%1000){this.message('Choose a loan from $1,000 to $100,000 in $1,000 increments.');return false;}if(this.loans.length>=3){this.message('The bank allows up to three active loans.');return false;}if(this.funds+amount>999999){this.message('This loan would exceed the city funds limit.');return false;}const payment=amount/20;this.loans.push({principal:amount,years:21,payment});this.funds+=amount;this.message(`Bank loan received: $${amount.toLocaleString()}; 21 annual payments of $${payment.toLocaleString()}.`);return true;}
 cityEvaluationInputs(){return {assessedValue:romAssessedValue({roads:this.roadCount,rails:this.railCount,facilityA:this.facilityCounts[0],police:this.counts[8],fire:this.counts[9],stadiums:this.counts[10],coal:this.zones.filter(z=>z.id===0x28c).length,seaports:this.counts[11],nuclear:this.zones.filter(z=>z.id===0x27c).length,airports:this.counts[12]}),population:this.population,problems:romCityProblems({crime:this.meanCrime||0,landValue:this.meanLandValue||0,pollution:this.pollution,traffic:this.traffic,landValues:this.landValue,tax:this.tax,rci:this.rci,fires:this.fireCount}),caps:[...this.growthCaps.suppressed],demand:[...this.demand]};}
 evaluateCity(inputs=this.cityEvaluationInputs()){
  if(!inputs.population){this.netMigration=0;this.score=500;this.scoreChange=0;this.evaluation={year:this.year,score:500,change:0,assessedValue:0,problems:Array(7).fill(0),survey:null,approval:{approve:0,disapprove:0}};return this.evaluation;}
  const problems=inputs.problems;
  const survey=pollRomProblems(problems,max=>this.boundedRandom(max));
  const result=romCityScore({previous:this.score,problems,caps:inputs.caps,transport:this.transportStrength,police:this.serviceStrengths[0],fire:this.serviceStrengths[1],demand:inputs.demand});
  const approval=pollRomApproval(result.score,max=>this.boundedRandom(max));
  this.score=result.score;this.scoreChange=result.change;this.evaluation={year:this.year,assessedValue:inputs.assessedValue??0,problems,survey,approval,...result};return this.evaluation;
 }
 updateScenarioOutcome(){if(this.pendingBudget)return;const result=scenarioOutcome(this.scenario,this.year,{category:this.category,traffic:this.evaluation?.problems?.[4]??0,crime:this.meanCrime||0,score:this.score});if(result!=='active'&&!this.scenarioResult){this.scenarioResult=result;this.message('Scenario '+result+'.');}}
 settleAnnualBudget(){if(!this.pendingBudget)return null;const rate=this.pendingBudget.taxRate,inputs=this.pendingBudget.evaluationInputs;const result=this.budget(true,rate);this.pendingBudget=null;this.evaluateCity(inputs);this.updateScenarioOutcome();return result;}
 tick(){for(let n=0;n<4&&!this.pendingBudget;n++)this.stepSimulation();}
 stepSimulation(){
  if(this.pendingBudget)return false;
  // CODE_038016 runs demand and tile simulation on each of four base steps.
  this.taxAccumulator+=this.tax;
  this.traffic=this.traffic.map(decayTraffic);
  const reminder=stepScenarioReminder(this.scenario,this.year,this.scenarioReminders.length);if(reminder.yearsLeft!==null){this.scenarioReminders.push(reminder.yearsLeft);this.message('Scenario deadline: '+reminder.yearsLeft+' years remaining.');}
  let repaired=false;for(const z of this.zones)if(repairMergedZone(this.map,z.x,z.y,W,H))repaired=true;if(repaired)this.refresh();
  if(this.regionalProvider)this.regionalState=this.regionalProvider(this);this.updatePower();
  const historyRci=this.history.at(-1)?.rci||[0,0,0];
  const generatedDemand=generateRomDemand(this.rci.map((v,i)=>v+(this.regionalState?.externalRci[i]||0)),historyRci.map((v,i)=>v+(this.regionalState?.externalRci[i]||0)),this.difficulty).scores;
  this.demand=generatedDemand.map((value,i)=>accumulateRomDemand(this.demand[i],value,this.tax,this.difficulty,i===0?2000:1500,{suppressPositive:this.growthCaps.suppressed[i]}));
  const services=this.civicEnabled?civicServices(this):null;this.civicWatered=services?.watered;if(services){this.demand[1]=Math.min(1500,this.demand[1]+Math.floor(this.civic.education));this.demand[2]=Math.min(1500,this.demand[2]+Math.floor(this.civic.education));for(let i=0;i<this.traffic.length;i++)if(services.busCoverage[i])this.traffic[i]=Math.floor(this.traffic[i]*.8);if(this.civic.garbage>this.civic.generatedGarbage*3)this.demand[0]=Math.max(-2000,this.demand[0]-100);}
  const displayedPopulation=this.population;this.scanCityTiles();
  this.updateDisasters(false);this.refresh();
  this.baseStep=(this.baseStep+1)&65535;
  if((this.baseStep&3)===0){
   updateCivicMonth(this);if(++this.month>12){this.month=1;this.year++;}changeRomSeason(this.season,this.month);this.facilityDemand=romFacilityDemand(this.rci[0],this.facilityCounts);if(this.month===1){this.populationBaseline=displayedPopulation>>>0;this.netMigration=romPopulation(this.rci,this.populationBaseline).netMigration;this.pendingBudget={year:this.year,taxRate:Math.floor(this.taxAccumulator/48)};const assessment=this.budget(false,this.pendingBudget.taxRate);this.pendingBudget.assessment={income:assessment.income,giftIncome:assessment.giftIncome,requests:[...assessment.requests]};this.pendingBudget.evaluationInputs=this.cityEvaluationInputs();this.taxAccumulator=0;if(this.autoBudget)this.settleAnnualBudget();}
   this.history.push({year:this.year,month:this.month,population:this.population,rci:[...this.rci],funds:this.funds,crime:this.meanCrime||0});if(this.history.length>240)this.history.shift();
  }
  this.scanGrowthCaps();
  this.checkMilestones();
  this.updateScenarioOutcome();
  this.updateScheduledFields();
  // CODE_038154 calls disaster handling after this pass's field workers.
  let scenarioTriggered=false;
  if(this.disastersEnabled){const e=stepScenarioEvent(this.scenario,this.scenarioRemaining,this.population);this.scenarioRemaining=e.remaining;if(e.event==='Meltdown'){const site=scenarioMeltdownSite(this.map);if(site){this.disaster(e.event,site.x,site.y);scenarioTriggered=true;}}else if(e.event){const result=this.disaster(e.event);scenarioTriggered=result?.started!==false;}}
  const pollution=this.cityEvaluationInputs().problems[1];
  const randomDisaster=selectRomRandomDisaster({disabled:!this.disastersEnabled,practice:this.scenario==='PracticeCity',difficulty:this.difficulty,pollution,messagePending:scenarioTriggered},max=>this.boundedRandom(max),()=>this.random());
  if(randomDisaster)this.disaster(randomDisaster,undefined,undefined,{randomDisaster:true});
 }
 scanCityTiles(){
  this.fireCount=0;
  this.serviceInputs={police:new Uint16Array(195),fire:new Uint16Array(195)};
  for(let i=0;i<this.map.length;i++){
   if((this.map[i]&1023)===0x7f)this.fireCount++;
   const disaster=dispatchRomDisasterTile(this.map,i,this.flags,this.fireCoverage,this.floodRemaining,()=>this.random(),max=>this.boundedRandom(max),(x,y,id)=>this.igniteZone(x,y,id),W,H);
   if(disaster){this.floodRemaining=disaster.remaining;continue;}
   const scanId=this.map[i]&1023;if(this.flags[scanId]&0x20)spawnRomTrain(this.train,scanId,i%W,Math.floor(i/W),this.quakeFrames);
   if(scanId===0x26c&&(this.map[i]&0x8000)&&!this.ship.active)spawnRomShip(this.ship,this.map,max=>this.boundedRandom(max));
   updateRomTransportTile(this.map,i,this.flags,this.transportStrength,this.traffic[i],()=>this.random(),{shipX:this.ship.x,shipY:this.ship.y},W,H);
   const id=this.map[i]&1023;if(!(this.flags[id]&1))continue;
   addRomServiceCenter(this.serviceInputs.police,this.map,i,this.serviceStrengths[0]*this.policeEffectiveness,'police',W,H);addRomServiceCenter(this.serviceInputs.fire,this.map,i,this.serviceStrengths[1],'fire',W,H);
   if(id===0x129||id===0x132){updateRomFacility(this.map,i%W,Math.floor(i/W),this.facilityDemand,max=>this.boundedRandom(max),{baseStep:this.baseStep,repairPhase:this.facilityRepairPhase,width:W,height:H});continue;}const z={i,x:i%W,y:Math.floor(i/W),id,type:this.classify(id)};if(z.type<5||z.type>7)continue;
   if(z.type===5){this.updateResidentialTile(z);continue;}
   let transport=1;if(this.boundedRandom(5)<this.zonePopulation(z)){const route=traceZoneTransport(this.map,z.x,z.y,z.type,()=>this.random(),W,H);transport=route.status;if(transport!==1&&this.regionalState?.zoneAccess.get(z.i)?.workers>0)transport=1;if(transport===1)addRouteTraffic(this.map,this.traffic,route.path,W,H);}
   if(transport===-1){this.grow(z,-1);continue;}
   const decision=decideJobZoneUpdate({mapWord:this.map[z.i],demand:this.demand[z.type-5],localScore:z.type===6?commercialLocalScore(this.commercialRate,z.x,z.y,transport):industrialLocalScore(transport),gateWord:this.random(),nextRandomWord:()=>this.random()});
   if(decision.action==='grow')this.grow(z,1);
   else if(decision.action==='decline')this.grow(z,-1);
  }
 }
 updateGrowthCaps(){for(let n=0;n<4;n++){this.baseStep=(this.baseStep+1)&65535;this.scanGrowthCaps();}}
 scanGrowthCaps(){const input={zones:this.counts.slice(5,8),roads:this.roadCount,rails:this.railCount,plants:this.zones.filter(z=>z.id===0x28c||z.id===0x27c).length,rci:this.rci,stadiums:this.counts[10],seaports:this.counts[11],airports:this.counts[12]};const advice=scanRomGrowthCaps(this.baseStep,input,this.growthCaps);if(advice>=6&&advice<=8)this.message(['A stadium is needed for further residential growth.','A seaport is needed for further industrial growth.','An airport is needed for further commercial growth.'][advice-6]);}
 checkMilestones(){const event=nextCoreMilestone({population:this.population,category:this.category,police:this.counts[8],fire:this.counts[9],rail:this.railCount,inventorySize:this.gifts.length,practice:this.scenario==='PracticeCity'},this.giftMilestones);if(event){if(event.historyId!=null)this.recordEvent(event.historyId);this.message(event.text);if(event.gift!==null)enqueueRomGift(this.gifts,event.gift);}return event;}
 advance(ms){if(this.pendingBudget)return;this.elapsed+=ms*this.speed;while(this.elapsed>=750&&!this.pendingBudget){this.elapsed-=750;this.stepSimulation();}if(this.pendingBudget)this.elapsed=0;}
 advanceVisualFrames(frames,blocked=false){if(!blocked)this.civic.busFrame=(this.civic.busFrame||0)+frames;for(let n=0;n<frames;n++){advanceRomSeason(this.season);if(this.quakeFrames){this.quakeFrames--;this.train.active=false;}if((this.quakePhase&7)===1){const event=stepRomShip(this.ship,this.map,()=>this.menuRandom(),{paused:blocked});if(event.horn){this.soundEvents.push({port:3,command:5});if(this.soundEvents.length>16)this.soundEvents.shift();}if(event.navigation==='collision'){applyRomShipCollision(this.map,this.flags,event.collision.x,event.collision.y,()=>this.menuRandom());this.recordEvent(0x10);this.message('A ship collided.');this.refresh();}}if((this.quakePhase&7)===3){const event=stepRomMonster(this.monster,this.map,this.flags,()=>this.menuRandom(),{phase:this.quakePhase,paused:blocked,onTileCross:(x,y)=>{if(!this.ship.active||x!==this.ship.x||y!==this.ship.y)return false;this.ship.active=false;applyRomShipCollision(this.map,this.flags,x,y,()=>this.menuRandom());this.recordEvent(0x10);this.message('A ship collided.');return true;}});if(event.roar)this.soundEvents.push({port:3,command:1});if(event.changed)this.refresh();}if((this.quakePhase&7)===7){const event=stepRomTornado(this.tornado,this.map,this.flags,()=>this.menuRandom(),{paused:blocked});if(event.changed)this.refresh();}if(!blocked&&(this.quakePhase&7)===6)stepRomTrain(this.train,this.map,()=>this.menuRandom(),W,H);this.quakePhase=this.quakePhase>=23?0:this.quakePhase+1;}}
 recordEvent(id){recordRomHistory(this.eventHistory,id,this.year,this.month);}
 disaster(type,x=60,y=50,options={}){
  if(!this.disastersEnabled)return {started:false,disabled:true};
  if(type==='Monster'){const started=startRomMonster(this.monster,this.pollutionTarget.x,this.pollutionTarget.y,max=>this.boundedRandom(max));if(started){this.focusRequest={x:this.monster.x,y:this.monster.y};this.recordEvent(7);this.message('A monster is crossing the city.');}return {started};}
  if(type==='Tornado'){const started=startRomTornado(this.tornado,max=>this.boundedRandom(max));if(started){this.focusRequest={x:this.tornado.x,y:this.tornado.y};this.recordEvent(0x0a);this.soundEvents.push({port:3,command:0x22});this.message('A tornado is crossing the city.');}return {started};}
  if(type==='Flood'){const result=startRomFlood(this.map,this.flags,max=>this.boundedRandom(max),W,H);if(result.started){this.floodRemaining=result.remaining;this.recordEvent(0x0c);this.message('Flood reported.');this.refresh();}else this.message('No vulnerable shoreline found.');return result;}
  if(type==='Earthquake'){const result=applyRomEarthquake(this.map,this.flags,max=>this.boundedRandom(max),W,H);this.quakeFrames=result.attempts;this.recordEvent(0x0e);this.message('Earthquake reported.');this.refresh();return result;}
  if(type==='Meltdown'){const result=applyRomMeltdown(this.map,this.flags,x,y,max=>this.boundedRandom(max),W,H);this.recordEvent(0x08);this.soundEvents.push({port:3,command:0x1e});this.message('Nuclear meltdown reported.');this.refresh();return result;}
  if(type==='Fire'){const result=startRomFire(this.map,this.flags,max=>this.boundedRandom(max),options);if(result.started){this.fireCount=(this.fireCount+1)&65535;this.recordEvent(0x0b);this.soundEvents.push({port:3,command:0x21});this.message('Fire reported.');this.refresh();}else if(!options.randomDisaster)this.message('No vulnerable fire site found.');return result;}
  this.disasters.push({type,x,y,life:type==='Earthquake'?1:16});this.message(`${type} reported. Emergency services are responding.`);
  if(type==='Fire')this.map[y*W+x]=0x2e;
  this.updateDisasters();this.refresh();

  this.updateScenarioOutcome();
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
 serialize(){return JSON.stringify({version:1,civicLayoutVersion:2,civicLegacyLayouts:this.civicLegacyLayouts,civicEnabled:this.civicEnabled,civic:this.civic,pipes:Array.from(this.pipes),busStops:Array.from(this.busStops),terraform:Array.from(this.terraform),disastersEnabled:this.disastersEnabled,dismissedNotices:this.dismissedNotices,tornado:this.tornado,monster:this.monster,pollutionTarget:this.pollutionTarget,season:this.season,policeEffectiveness:this.policeEffectiveness,populationBaseline:this.populationBaseline,netMigration:this.netMigration,facilityDemand:this.facilityDemand,facilityRepairPhase:this.facilityRepairPhase,score:this.score,scoreChange:this.scoreChange,evaluation:this.evaluation,fireCount:this.fireCount,commercialRate:Array.from(this.commercialRate),eventHistory:this.eventHistory,train:this.train,transportStrength:this.transportStrength,ship:this.ship,floodRemaining:this.floodRemaining,disasters:this.disasters,quakeFrames:this.quakeFrames,quakePhase:this.quakePhase,autoBudget:this.autoBudget,pendingBudget:this.pendingBudget,lastBudget:this.lastBudget,serviceStrengths:this.serviceStrengths,allocatedFunding:this.allocatedFunding,serviceInputs:this.serviceInputs?{police:Array.from(this.serviceInputs.police),fire:Array.from(this.serviceInputs.fire)}:null,fieldState:Object.fromEntries(['terrain','pollution','crime','landValue','density','policeCoverage','fireCoverage'].map(k=>[k,Array.from(this[k])])),centerX:this.centerX,centerY:this.centerY,fieldEpochs:this.fieldEpochs,meanCrime:this.meanCrime,meanLandValue:this.meanLandValue,elapsed:this.elapsed,speed:this.speed,baseStep:this.baseStep,growthCaps:this.growthCaps,demand:this.demand,giftMilestones:this.giftMilestones,simulationRng:this.simulationRng,traffic:Array.from(this.traffic),scenarioRemaining:this.scenarioRemaining,scenarioResult:this.scenarioResult,scenarioReminders:this.scenarioReminders,scenarioDialogSeen:this.scenarioDialogSeen,map:Array.from(this.map),name:this.name,scenario:this.scenario,year:this.year,month:this.month,funds:this.funds,difficulty:this.difficulty,tax:this.tax,taxAccumulator:this.taxAccumulator,funding:this.funding,rngA:this.rngA,rngB:this.rngB,history:this.history,loans:this.loans,loan:this.loan,gifts:this.gifts});}
 static restore(text,build,flags){const s=JSON.parse(text);if(s.version!==1||!Array.isArray(s.map)||s.map.length!==12000||s.map.some(n=>!Number.isInteger(n)||n<0||n>65535))throw Error('This is not a supported city save.');const c=new City(s.map,build,flags,s);if(s.eventHistory===undefined)c.eventHistory=[];for(const k of ['civicEnabled','civic','dismissedNotices','tornado','monster','pollutionTarget','season','populationBaseline','netMigration','facilityDemand','facilityRepairPhase','score','scoreChange','evaluation','fireCount','eventHistory','train','transportStrength','ship','floodRemaining','disasters','quakeFrames','quakePhase','autoBudget','pendingBudget','lastBudget','serviceStrengths','allocatedFunding','centerX','centerY','fieldEpochs','meanCrime','meanLandValue','elapsed','speed','baseStep','growthCaps','demand','giftMilestones','simulationRng','scenarioRemaining','scenarioResult','scenarioReminders','scenarioDialogSeen','month','funds','tax','taxAccumulator','funding','rngA','rngB','history','gifts'])if(s[k]!==undefined)c[k]=s[k];c.civicLegacyLayouts=s.civicLegacyLayouts||{};if(s.civicLayoutVersion!==2)for(let i=0;i<c.map.length;i++)if([964,965,966,968].includes(c.map[i]&1023))c.civicLegacyLayouts[i]={width:3,height:3};if(Array.isArray(s.terraform)&&s.terraform.length===W*H)c.terraform=Uint8Array.from(s.terraform);if(Array.isArray(s.busStops)&&s.busStops.length===W*H)c.busStops=Uint8Array.from(s.busStops);if(Array.isArray(s.pipes)&&s.pipes.length===W*H)c.pipes=Uint8Array.from(s.pipes);if(Array.isArray(s.traffic)&&s.traffic.length===W*H)c.traffic=Uint8Array.from(s.traffic);if(s.fieldState)for(const k of ['terrain','pollution','crime','landValue','density','policeCoverage','fireCoverage'])if(Array.isArray(s.fieldState[k])&&s.fieldState[k].length===W*H)c[k]=(k.endsWith('Coverage')?Uint16Array:Uint8Array).from(s.fieldState[k]);if(s.serviceInputs&&['police','fire'].every(k=>Array.isArray(s.serviceInputs[k])&&s.serviceInputs[k].length===195))c.serviceInputs={police:Uint16Array.from(s.serviceInputs.police),fire:Uint16Array.from(s.serviceInputs.fire)};if(Array.isArray(s.commercialRate)&&s.commercialRate.length===195)c.commercialRate=Int16Array.from(s.commercialRate);c.loans=(Array.isArray(s.loans)?s.loans:s.loan?[s.loan]:[]).slice(0,3).filter(l=>l&&Number.isInteger(l.years)&&l.years>0&&Number.isFinite(l.payment)&&l.payment>0).map(l=>({...l}));c.dismissedNotices=Array.isArray(c.dismissedNotices)?c.dismissedNotices.map(n=>typeof n==='string'?{text:n,year:c.year}:n).filter(n=>n&&typeof n.text==='string'&&Number.isInteger(n.year)):[];if(s.pollutionTarget===undefined)c.pollutionTarget=monsterPollutionTarget(c.pollution,c.pollutionTarget);c.monster={...createRomMonster(),...c.monster};c.tornado={...createRomTornado(),...c.tornado};c.ship={...createRomShip(),...c.ship};c.refresh();if(s.populationBaseline===undefined){c.populationBaseline=c.population;c.netMigration=0;}else if(s.netMigration!==undefined)c.netMigration=s.netMigration|0;if(s.policeEffectiveness===undefined)c.setPoliceEffectiveness(2);if(s.season===undefined)c.season=createRomSeason(c.month);return c;}
}































