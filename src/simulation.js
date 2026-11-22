import {romAnnualRevenue} from './rom-finance.js';
import {SIMULATION_SEED,nextSimulationWord,boundSimulationWord} from './rom-random.js';
import {decayTraffic,addRouteTraffic} from './rom-traffic.js';
import {applyRomMeltdown,decayRomRadiation} from './rom-disasters.js';
import {scenarioOutcome,SCENARIO_EVENT_COUNTS,stepScenarioEvent,stepScenarioReminder,scenarioMeltdownSite} from './rom-scenarios.js';
import {residentialDemandScore, residentialLocalScore, residentialDensityBand, residentialGrowthBase, residentialDeclineFootprint, decideResidentialUpdate, stampZoneFootprint, placeSmallHome, mergeResidentialZone,repairMergedZone,updateCommercialFootprint,updateIndustrialFootprint,decideJobZoneUpdate,findZoneTransport,traceZoneTransport} from './rom-growth.js';
import {accumulateRomDemand} from './rom-demand.js';
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
  this.name=opts.name||'New city';this.scenario=opts.scenario||'PracticeCity';this.year=opts.year||1900;this.month=1;
  this.difficulty=clamp(Math.trunc(opts.difficulty??0),0,2);this.funds=[20000,10000,5000][this.difficulty];this.tax=7;this.funding=[100,100,100];this.speed=1;
  this.simulationRng=[...SIMULATION_SEED];this.rngA=0x5cd6;this.rngB=0x1238;this.population=0;this.demand=[400,200,200];this.history=[];this.taxAccumulator=opts.taxAccumulator||0;
  this.power=new Uint8Array(W*H);this.pollution=new Uint8Array(W*H);this.crime=new Uint8Array(W*H);this.landValue=new Uint8Array(W*H);this.traffic=new Uint8Array(W*H);
  this.zones=[];this.notices=[];this.disasters=[];this.loan=null;this.elapsed=0;this.category=0;this.gifts=[];this.giftChoice=16;this.lastBudget=null;
  this.scenarioRemaining=SCENARIO_EVENT_COUNTS[this.scenario]||0;this.scenarioReminders=[];this.scenarioResult=null;this.scenarioDialogSeen=false;this.refresh();
 }
 // CODE_00824F: additive RNG, including carry into the second 16-bit add.
 menuRandom(){const old=this.rngA;let n=old+this.rngB;this.rngA=n&65535;this.rngB=(this.rngA+old+(n>65535?1:0))&65535;return this.rngA;}
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
   if(f&0x40)this.roadCount++;if(f&0x20)this.railCount++;
  }
  this.updatePower();this.census();
 }
 updatePower(){
  this.power.fill(0);const queue=[];let capacity=0;
  // CODE_03AA9F/03AFB0 count coal center $028C and nuclear $027C.
  for(const z of this.zones)if(z.id===0x28c||z.id===0x27c){queue.push(z.i);this.power[z.i]=1;capacity+=z.id===0x28c?700:2000;}
  let q=0;
  while(q<queue.length&&q<capacity){const i=queue[q++];for(const n of this.neighbors(i))if(!this.power[n]&&(this.flag(n)&0x80)){this.power[n]=1;queue.push(n);}}
  this.powerCapacity=capacity;this.powerUsed=q;
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
  if(tool>=16){if(!this.gifts.includes(tool))return {ok:false,cost:0,reason:'This gift has not been awarded.'};cost=0;}
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
   for(const c of this.footprint(tool,x,y))this.map[c.y*W+c.x]=c.id;
   if(tool>=16)this.gifts=this.gifts.filter(g=>g!==tool);
  }
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)this.connect(x+dx,y+dy);
  this.refresh();return true;
 }
 connect(x,y){
  if(x<0||x>=W||y<0||y>=H)return;
  const i=y*W+x,id=this.map[i]&1023;let kind=id>=0x70&&id<=0x7c?2:id>=0x60&&id<=0x6c?3:id>=0x30&&id<=0x3c?1:0;
  if(!kind)return;
  const bit=kind===1?0x40:kind===2?0x20:0x10;
  // DATA_018020, CODE_01B62F/645/65B. Bit directions follow CODE_01B6CC.
  let mask=0;[[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]].forEach(([dx,dy,b])=>{if((this.flags[this.id(x+dx,y+dy)]||0)&bit)mask|=b;});
  const table=[2,3,2,5,2,6,2,10,3,3,4,9,7,11,8,12];this.map[i]=(kind===1?0x30:kind===2?0x70:0x60)+table[mask];
 }
 nearRoad(z){return findZoneTransport(this.map,z.x,z.y,W,H)!==null;}
 coverage(x,y,type){let n=0;for(const z of this.zones)if(z.type===type)n=Math.max(n,clamp(1-(Math.abs(z.x-x)+Math.abs(z.y-y))/24,0,1));return n*this.funding[type===8?1:2]/100;}
 fields(){
  this.pollution.fill(0);this.crime.fill(0);
  for(const z of this.zones){
   const amount=z.type===7?90:z.type===14?160:0;
   if(amount)for(let dy=-8;dy<=8;dy++)for(let dx=-8;dx<=8;dx++){const x=z.x+dx,y=z.y+dy,d=Math.abs(dx)+Math.abs(dy);if(x>=0&&x<W&&y>=0&&y<H&&d<9){const i=y*W+x;this.pollution[i]=clamp(this.pollution[i]+amount*(9-d)/9,0,255);}}
  }
  let crime=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const i=y*W+x,t=this.map[i]&1023;this.landValue[i]=clamp(150-this.pollution[i]+(t>=4&&t<0x30?30:0),0,255);
   this.crime[i]=t>=0x80?clamp(90+this.population/5000-this.coverage(x,y,8)*140,0,255):0;crime+=this.crime[i];

  }
  this.meanCrime=crime/12000;
 }
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
  // This gross-income estimate remains provisional; original budget tracing is incomplete.
  const units=Math.floor(this.rci[0]/8)+this.rci[1]+this.rci[2];
  const meanLandValue=this.zones.length?Math.floor(this.zones.reduce((sum,z)=>sum+this.landValue[z.i],0)/this.zones.length):0;
  const income=romAnnualRevenue(units,meanLandValue,taxRate,this.difficulty);
  // CODE_038E39 scales road + double rail count by a Q8 factor indexed by difficulty.
  const transportFactor=[0x00b3,0x00e6,0x0133][this.difficulty];
  const requests=[Math.min(9999,Math.floor((this.roadCount+2*this.railCount)*transportFactor/256)),Math.min(9999,this.counts[8]*100),Math.min(9999,this.counts[9]*100)];
  const expenses=requests.map((n,i)=>Math.round(n*this.funding[i]/100));let payment=this.loan?this.loan.payment:0;
  const net=income-expenses.reduce((a,b)=>a+b,0)-payment;
  const result={income,requests,expenses,payment,net,taxRate};
  if(apply){this.funds=clamp(this.funds+net,0,999999);if(this.loan&&--this.loan.years<=0)this.loan=null;this.lastBudget=result;this.message(`Fiscal year ${this.year}: ${net>=0?'+':''}$${net.toLocaleString()}.`);}
  return result;
 }
 takeLoan(){if(this.loan){this.message('Repay the current loan before borrowing again.');return false;}this.loan={years:10,payment:600};this.funds=Math.min(999999,this.funds+5000);this.message('Bank loan received: $5,000; $600 annually for ten years. Provisional loan terms.');return true;}
 tick(){
  // CODE_038016 accrues tax once per base step; four steps make a month.
  this.taxAccumulator+=this.tax*4;
  for(let step=0;step<4;step++)this.traffic=this.traffic.map(decayTraffic);
  for(let step=0;step<4;step++)decayRomRadiation(this.map,max=>this.boundedRandom(max));
  for(let step=0;step<4;step++){const e=stepScenarioEvent(this.scenario,this.scenarioRemaining,this.population);this.scenarioRemaining=e.remaining;if(e.event==='Meltdown'){const site=scenarioMeltdownSite(this.map);if(site)this.disaster(e.event,site.x,site.y);}else if(e.event)this.disaster(e.event);}
  const reminder=stepScenarioReminder(this.scenario,this.year,this.scenarioReminders.length);if(reminder.yearsLeft!==null){this.scenarioReminders.push(reminder.yearsLeft);this.message('Scenario deadline: '+reminder.yearsLeft+' years remaining.');}
  let repaired=false;for(const z of this.zones)if(repairMergedZone(this.map,z.x,z.y,W,H))repaired=true;if(repaired)this.refresh();
  const oldCategory=this.category;this.updatePower();this.fields();
  const jobs=(this.rci[1]+this.rci[2])*8;
  const generatedDemand=[700+(jobs-this.rci[0])*8-(this.tax-7)*90,500+(this.rci[0]/5-this.rci[1])*15-(this.tax-7)*80,450+(this.rci[0]/4-this.rci[2])*12-(this.tax-7)*70];
  this.demand=generatedDemand.map((value,i)=>accumulateRomDemand(this.demand[i],value,this.tax,this.difficulty,i===0?2000:1500));
  for(const z of this.zones){if(z.type<5||z.type>7)continue;
   if(z.type===5){this.updateResidentialTile(z);continue;}
   let transport=1;if(this.boundedRandom(5)<this.zonePopulation(z)){const route=traceZoneTransport(this.map,z.x,z.y,z.type,()=>this.random(),W,H);transport=route.status;if(transport===1)addRouteTraffic(this.map,this.traffic,route.path,W,H);}
   if(transport===-1){this.grow(z,-1);continue;}
   const decision=decideJobZoneUpdate({mapWord:this.map[z.i],demand:this.demand[z.type-5],localScore:transport===0?(z.type===7?-1000:-3000):0,gateWord:this.random(),nextRandomWord:()=>this.random()});
   if(decision.action==='grow')this.grow(z,1);
   else if(decision.action==='decline')this.grow(z,-1);
  }
  this.updateDisasters();this.refresh();
  const result=scenarioOutcome(this.scenario,this.year,{category:this.category,traffic:Math.max(...this.traffic),crime:this.meanCrime||0,score:this.score});if(result!=='active'&&!this.scenarioResult){this.scenarioResult=result;this.message('Scenario '+result+'.');}
  if(this.category>oldCategory){this.gifts.push(16);this.message(`Congratulations! ${this.name} is now a ${CATEGORIES[this.category].toLowerCase()}. A gift is available.`);}
  this.history.push({year:this.year,month:this.month,population:this.population,rci:[...this.rci],funds:this.funds,crime:this.meanCrime||0});if(this.history.length>240)this.history.shift();
  if(++this.month>12){this.month=1;this.budget(true,Math.floor(this.taxAccumulator/48));this.taxAccumulator=0;this.year++;}
 }
 advance(ms){this.elapsed+=ms*this.speed;while(this.elapsed>=3000){this.elapsed-=3000;this.tick();}}
 disaster(type,x=60,y=50){
  if(type==='Meltdown'){const result=applyRomMeltdown(this.map,this.flags,x,y,max=>this.boundedRandom(max),W,H);this.message('Nuclear meltdown reported.');this.refresh();return result;}
  this.disasters.push({type,x,y,life:type==='Earthquake'?1:16});this.message(`${type} reported. Emergency services are responding.`);
  if(type==='Fire')this.map[y*W+x]=0x2e;
  this.updateDisasters();this.refresh();
  const result=scenarioOutcome(this.scenario,this.year,{category:this.category,traffic:Math.max(...this.traffic),crime:this.meanCrime||0,score:this.score});if(result!=='active'&&!this.scenarioResult){this.scenarioResult=result;this.message('Scenario '+result+'.');}
 }
 updateDisasters(){
  for(const d of this.disasters){
   let radius=d.type==='Earthquake'?18:d.type==='Meltdown'?8:d.type==='Flood'?4:2;
   for(let n=0;n<(d.type==='Earthquake'?100:12);n++){
    const x=clamp(d.x+(this.random()%(radius*2+1))-radius,0,W-1),y=clamp(d.y+(this.random()%(radius*2+1))-radius,0,H-1),i=y*W+x,t=this.map[i]&1023;
    if(d.type==='Flood'){if(t!==0&&t<0x26)this.map[i]=1;}
    else if(t>3)this.map[i]=d.type==='Meltdown'?0x7f:d.type==='Fire'?0x2e:0x2a;
   }
   if(d.type==='Tornado'||d.type==='Monster'||d.type==='UFO'){d.x=clamp(d.x+(this.random()%7)-3,3,W-4);d.y=clamp(d.y+(this.random()%7)-3,3,H-4);}
   if(d.type==='Fire'&&this.coverage(d.x,d.y,9)>.5)d.life-=3;
   d.life--;
  }
  this.disasters=this.disasters.filter(d=>d.life>0);
 }
 serialize(){return JSON.stringify({version:1,simulationRng:this.simulationRng,traffic:Array.from(this.traffic),scenarioRemaining:this.scenarioRemaining,scenarioResult:this.scenarioResult,scenarioReminders:this.scenarioReminders,scenarioDialogSeen:this.scenarioDialogSeen,map:Array.from(this.map),name:this.name,scenario:this.scenario,year:this.year,month:this.month,funds:this.funds,difficulty:this.difficulty,tax:this.tax,taxAccumulator:this.taxAccumulator,funding:this.funding,rngA:this.rngA,rngB:this.rngB,history:this.history,loan:this.loan,gifts:this.gifts});}
 static restore(text,build,flags){const s=JSON.parse(text);if(s.version!==1||!Array.isArray(s.map)||s.map.length!==12000||s.map.some(n=>!Number.isInteger(n)||n<0||n>65535))throw Error('This is not a supported city save.');const c=new City(s.map,build,flags,s);for(const k of ['simulationRng','scenarioRemaining','scenarioResult','scenarioReminders','scenarioDialogSeen','month','funds','tax','taxAccumulator','funding','rngA','rngB','history','loan','gifts'])if(s[k]!==undefined)c[k]=s[k];if(Array.isArray(s.traffic)&&s.traffic.length===W*H)c.traffic=Uint8Array.from(s.traffic);c.refresh();return c;}
}
















