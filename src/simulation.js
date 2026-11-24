import {hashEconomySeed} from './commodities.js';
import {industryPlacement} from './industry.js?v=background-64';
import {advanceTradeMonth} from './trade.js?v=background-64';
import {normalizeSharing} from './regional-policy.js?v=background-64';
import {upgradeFullZoneFamily} from './zone-progression.js?v=growth-60';
import {TRANSIT_TOOLS,TRANSIT_ARRAYS,transitTool,installTransitTools,initTransit,transitCanBuild,placeTransit,clearTransit,transitPresent,transitDuplicate,serializeTransit,restoreTransit,transitAnnualCost} from './transit-tools.js?v=transit-59';
import {transitZoneAccess,traceCityTransport,addCityRouteTraffic,updateTransitFleet,advanceTransitFleet} from './transit-network.js?v=growth-60';
import {scenarioEnding,validCareerFlags} from './rom-scenario-ending.js?v=endings-48';
import {stepPracticeLesson,restorePracticeTutorial} from './rom-practice.js?v=practice-46';
import {practiceNotice} from './practice-lessons.js?v=practice-46';
import {isRomUtilityCenter,updateRomUtilityCenter} from './rom-utility-worker.js?v=utility-workers-32';
import {isRomGiftCenter,updateRomGiftCenter} from './rom-gift-worker.js?v=gift-workers-31';
import {expandServiceCoverage} from './police-range.js?v=services-57';
import {reconcileAviation,advanceAviation,aviationBenefits} from './aviation.js?v=background-64';
import {TREASURY_CAP,treasuryAmount} from './treasury.js?v=parks-23';
import {applyParkBenefits,plazaGrowthBonus} from './parks.js?v=background-64';
import {boostFireCoverage} from './fire-effectiveness.js?v=services-57';
import {compactEmergencyId,emergencyBounds,emergencyTransport} from './emergency.js?v=emergency-1';
import {addRomGrowthRate,decayRomGrowthRate} from './rom-growth-rate.js?v=job-growth-1';
import {createRomUfo,stepRomUfo,startRomUfoVisit} from './rom-ufo.js?v=emergency-1';
import {updateLocalHealth} from './social-fields.js?v=background-64';
import {createClimate,advanceClimate,combineAirPollution,windPower} from './climate.js?v=weather-1';
import {conductivePowerFlags,turboPowerBranchLimit} from './power-conductors.js?v=power-work-38';
import {createElevation,terrainCheck,plantForest} from './elevation.js?v=approaches-56';
import {employmentIncome} from './employment.js?v=growth-60';
import {buildingOff} from './building-operations.js?v=background-64';
import {updateRailFleet,advanceRailFleet,trainVehicles} from './rail-fleet.js?v=education-traffic-27';
import {updateSewageMonth,sewageServices} from './sewage.js?v=background-64';
import {createRomPlane,spawnRomPlane,stepRomPlane} from './rom-plane.js?v=emergency-1';
import {createRomHelicopter,spawnRomHelicopter,stepRomHelicopter} from './rom-helicopter.js?v=emergency-1';
import {installTerrainTools,reshapeTerrain} from './terrain-tools.js?v=approaches-56';
import {createRomMonster,startRomMonster,stepRomMonster,monsterPollutionTarget} from './rom-monster.js?v=emergency-1';
import {CIVIC_TOOLS,installCivicTools,civicForId,civicBounds,civicServices,civicAnnualCost,updateCivicMonth,educationEffects} from './civic.js?v=background-64';
import {createRomTornado,startRomTornado,stepRomTornado} from './rom-tornado.js?v=emergency-1';
import {createRomSeason,changeRomSeason,advanceRomSeason} from './rom-render.js?v=season-1';
import {generateCityDemand,cityFacilityDemand,cityProblems} from './turbo-demand.js?v=wide-demand-40';
import {cityPopulation,usesWideCensus} from './turbo-population.js?v=wide-census-39';
import {selectRomRandomDisaster} from './rom-random-disaster.js';
import {placeRomFacility,updateRomFacility} from './rom-facilities.js?v=gift-workers-31';
import {createRomTrain,spawnRomTrain,stepRomTrain} from './rom-train.js';
import {createRomShip,spawnRomShip,stepRomShip} from './rom-ship.js?v=megacity-1';
import {applyRomShipCollision,applyRomTrainCollision,burnRomZone} from './rom-collision.js?v=emergency-1';
import {recordRomHistory} from './rom-history.js';
import {createCityGraphs,cityGraphDemandHistory,recordCityGraphMonth,recordCityGraphYear,restoreCityGraphs,meanGraphPollution} from './turbo-graphs.js?v=graphs-44';
import {romCommercialRate,commercialLocalScore,industrialLocalScore} from './rom-commercial.js?v=megacity-1';
import {romCityScore,pollRomProblems,pollRomApproval,romAssessedValue} from './rom-evaluation.js?v=facilities-1';
import {romTransportFunding,updateRomTransportTile} from './rom-transport.js';
import {traceRomPower} from './rom-power.js?v=power-work-38';
import {romFieldSchedule} from './rom-schedule.js';
import {romGiftEffects,nextCoreMilestone,enqueueRomGift,ROM_GIFTS,giftToolForId} from './rom-gifts.js?v=gift-workers-31';
import {networkCrossing,hasRoadLayer} from './rom-networks.js?v=megacity-1';
import {romPoliceCoverage,romFireCoverage,fireBurnoutMaximum,romServiceFunding,seedRomServicePlane,expandRomServicePlane,addRomServiceCenter} from './rom-services.js?v=processing-1';
import {romDensityField} from './rom-density.js';
import {romCrimeValue,meanRomCrime} from './rom-crime.js';
import {romPollutionField} from './rom-pollution.js';
import {aggregateRomLandValue,romLandValue,romTerrainField} from './rom-land-value.js';
import {romAnnualRevenue,allocateRomBudget} from './rom-finance.js';
import {SIMULATION_SEED,nextSimulationWord,boundSimulationWord} from './rom-random.js?v=utility-workers-32';
import {decayTraffic,addRouteTraffic} from './rom-traffic.js';
import {applyRomMeltdown,applyRomEarthquake,startRomFire,startRomFlood,dispatchRomDisasterTile} from './rom-disasters.js?v=megacity-1';
import {SCENARIO_IDS,SCENARIO_DEADLINES,SCENARIO_EVENT_COUNTS,stepScenarioEvent,stepScenarioProgress,scenarioMeltdownSite} from './rom-scenarios.js?v=scenarios-45';
import {residentialDemandScore, residentialLocalScore, residentialDensityBand, residentialGrowthBase, residentialDeclineFootprint, decideResidentialUpdate, stampZoneFootprint, placeSmallHome, mergeResidentialZone,repairMergedZone,updateCommercialFootprint,updateIndustrialFootprint,decideJobZoneUpdate,findZoneTransport,traceZoneTransport} from './rom-growth.js?v=processing-1';
import {accumulateRomDemand,scanRomGrowthCaps} from './rom-demand.js?v=processing-1';
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
 {id:'SanFrancicso',name:'San Francisco',year:1906,description:'Rebuild after the earthquake. Become a metropolis by 1911.'},
 {id:'Bern',name:'Bern',year:1965,description:'Become a metropolis with traffic rating below 80 by 1975.'},
 {id:'Tokyo',name:'Tokyo',year:1961,description:'Survive the monster. Reach metropolis and city score 500 by 1966.'},
 {id:'Detroit',name:'Detroit',year:1972,description:'Reach metropolis with average crime below 60 by 1982.'},
 {id:'Boston',name:'Boston',year:2010,description:'Recover from the nuclear accident. Reach metropolis and city score 500 by 2015.'},
 {id:'RioDeJaneiro',name:'Rio de Janeiro',year:2047,description:'Survive flooding. Reach metropolis and city score 500 by 2057.'},
 {id:'LasVegas',name:'Las Vegas',year:2096,description:'Survive the UFO attacks and become a metropolis by 2106.'}
];
for(const [tool,name] of Object.entries(ROM_GIFTS))TOOLS[tool]=name;
for(const b of TRANSIT_TOOLS)TOOLS[b.tool]=b.name;for(const b of CIVIC_TOOLS)TOOLS[b.tool]=b.name;TOOLS[42]='Create land';TOOLS[43]='Create water';TOOLS[46]='Raise terrain';TOOLS[47]='Lower terrain';TOOLS[48]='Forest';
export function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
export function cityCategory(population){return LIMITS.filter(n=>population>=n).length;}
export class City {
 get wideCensus(){return usesWideCensus(this.map.length);}
 populationStats(){return cityPopulation(this.rci,this.populationBaseline,this.map.length);}
 get funds(){return this._funds??0;}
 set funds(value){this._funds=treasuryAmount(value);}
 constructor(map,build,flags,opts={}){
  this.nativeGrowthRules=!!opts.nativeGrowthRules;this.terrainSource=opts.terrainSource?.kind==='numbered'&&Number.isInteger(opts.terrainSource.number)&&opts.terrainSource.number>=0&&opts.terrainSource.number<=999&&Number.isInteger(opts.terrainSource.previousOnes)&&opts.terrainSource.previousOnes>=0&&opts.terrainSource.previousOnes<=255?{kind:'numbered',number:opts.terrainSource.number,previousOnes:opts.terrainSource.previousOnes}:null;
  this.width=opts.width??120;this.height=opts.height??100;if(![[120,100],[240,200]].some(([w,h])=>w===this.width&&h===this.height))throw Error('Unsupported city dimensions');this.coarseWidth=Math.ceil(this.width/8);this.coarseSize=this.coarseWidth*Math.ceil(this.height/8);
  if(map.length!==this.width*this.height)throw Error('Invalid map length');
  installCivicTools(build,flags);installTerrainTools(build);installTransitTools(build);this.map=Uint16Array.from(map);this.build=build;this.flags=flags;initTransit(this);this.pipes=new Uint8Array(this.width*this.height);this.busStops=new Uint8Array(this.width*this.height);this.civicLegacyLayouts={};this.terraform=new Uint8Array(this.width*this.height);this.elevation=createElevation(this.map);this.seaPollution=new Uint8Array(this.width*this.height);this.airPollution=new Float32Array(this.width*this.height);this.climate=createClimate();this.civicEnabled=opts.civicEnabled??false;this.civic={sewageEnabled:!!opts.civicEnabled,waterEnabled:!!opts.civicEnabled,garbage:0,health:100,education:0,water:100,buses:0,generatedGarbage:0,collectedGarbage:0};this.civicCapacity={};this.busRoutes=[];this.regionalPolicy=normalizeSharing(opts.regionalPolicy);this.regionalState=null;this.regionalProvider=null;
  this.name=opts.name||'New city';this.scenario=opts.scenario||'PracticeCity';this.resourceSeed=Number.isInteger(opts.resourceSeed)?opts.resourceSeed>>>0:opts.civic?.economy?.resourceSeed??hashEconomySeed(`${this.scenario}:${this.name}:${this.width}x${this.height}`);this.year=opts.year||1900;this.month=1;this.season=createRomSeason(1);this.populationBaseline=0;this.netMigration=0;this.score=500;this.scoreChange=0;this.evaluation=null;this.fireCount=0;this.facilityDemand=[0,0];this.facilityCounts=[0,0];this.facilityRepairPhase=0;this.eventHistory=[];if(['PracticeCity','FreeCity','FreeMegacity'].includes(this.scenario))recordRomHistory(this.eventHistory,0,this.year,this.month);
  this.disastersEnabled=opts.disastersEnabled!==false;this.difficulty=clamp(Math.trunc(opts.difficulty??0),0,2);this.funds=[20000,10000,5000][this.difficulty];this.infiniteMoney=opts.infiniteMoney===true;this.tax=7;this.funding=[100,100,100];this.serviceStrengths=[1000,1000];this.policeEffectiveness=opts.policeEffectiveness===1?1:2;this.transportStrength=32;this.ship=createRomShip();this.tornado=createRomTornado();this.monster=createRomMonster();this.plane=createRomPlane();this.helicopter=createRomHelicopter();this.helicopterNewsFrames=0;this.ufo=createRomUfo();this.ufoCampaign=null;this.ufoVisited=false;this.pollutionTarget={x:0,y:0};this.soundEvents=[];this.train=createRomTrain();this.extraTrains=[];this.nextTrainId=1;this.railSeed=0x51c17e;this.allocatedFunding=null;this.speed=1;
  this.simulationRng=[...SIMULATION_SEED];this.rngA=Number.isInteger(opts.rngA)?opts.rngA&65535:0x5cd6;this.rngB=Number.isInteger(opts.rngB)?opts.rngB&65535:0x1238;this.population=0;this.demand=[400,200,200];this.history=[];this.graphs=createCityGraphs();this.meanPollution=0;this.zoneGrowthLog={};this.taxAccumulator=opts.taxAccumulator||0;
  this.power=new Uint8Array(this.width*this.height);this.pollution=new Uint8Array(this.width*this.height);this.crime=new Uint8Array(this.width*this.height);this.landValue=new Uint8Array(this.width*this.height);this.traffic=new Uint8Array(this.width*this.height);
  this.baseStep=0;this.growthCaps={zoneTotal:0,suppressed:[false,false,false]};this.growthAdviceYear={};this.terrain=new Uint8Array(this.width*this.height);this.density=new Uint8Array(this.width*this.height);this.policeCoverage=new Uint16Array(this.width*this.height);this.fireCoverage=new Uint16Array(this.width*this.height);this.centerX=this.width/4;this.centerY=this.height/4;this.commercialRate=new Int16Array(this.coarseSize);this.growthRate=new Int16Array(this.coarseSize);this.fieldEpochs={};this.zones=[];this.notices=[];this.dismissedNotices=[];this.disasters=[];this.floodRemaining=0;this.quakeFrames=0;this.quakePhase=0;this.loans=[];this.elapsed=0;this.category=0;this.giftMilestones={};this.gifts=[];this.giftChoice=16;this.lastBudget=null;this.autoBudget=opts.autoBudget??false;this.pendingBudget=null;
  this.practiceTutorial=restorePracticeTutorial(null,this.year,this.month,{fresh:true});this.careerFlags=validCareerFlags(opts.careerFlags)?opts.careerFlags:0;this.scenarioEnding=null;this.scenarioRemaining=SCENARIO_EVENT_COUNTS[this.scenario]||0;this.scenarioReminders=[];this.scenarioStage=0;this.scenarioEvaluationDeferred=false;this.scenarioDecision=null;this.scenarioResult=null;this.scenarioDialogSeen=false;this.refresh();if(!opts.restoring)this.updatePracticeTutorial();
 }
 // CODE_00824F: additive RNG, including carry into the second 16-bit add.
 menuRandom(){const old=this.rngA;let n=old+this.rngB;this.rngA=n&65535;this.rngB=(this.rngA+old+(n>65535?1:0))&65535;return this.rngB;}
 random(){return nextSimulationWord(this.simulationRng);}
 boundedRandom(maximum){return boundSimulationWord(this.random(),maximum);}
 id(x,y){return x>=0&&x<this.width&&y>=0&&y<this.height?this.map[y*this.width+x]&1023:0;}
 flag(i){return this.flags[this.map[i]&1023]||0;}
 neighbors(i){const x=i%this.width,y=Math.floor(i/this.width);return [x>0?i-1:-1,y>0?i-this.width:-1,x<this.width-1?i+1:-1,y<this.height-1?i+this.width:-1].filter(n=>n>=0);}
 dismissNotice(text){if(this.practiceTutorial.pendingId!==null&&text===practiceNotice(this.practiceTutorial.pendingId))this.practiceTutorial.pendingId=null;this.notices=this.notices.filter(n=>n!==text);this.dismissedNotices=this.dismissedNotices.filter(n=>n.year===this.year);if(text&&!this.noticeIsDismissed(text))this.dismissedNotices.push({text,year:this.year});}
 noticeIsDismissed(text){return this.dismissedNotices.some(n=>n.text===text&&n.year===this.year);}
 message(text){if(this.notices[0]===text)return;this.notices=this.notices.filter(n=>n!==text);this.noticeSerial=(this.noticeSerial||0)+1;this.notices.unshift(text);this.notices.length=Math.min(8,this.notices.length);}
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
  this.revision=(this.revision||0)+1;if(this.transitEnabled)this.transitEnabled=this.transitTracks.some(Boolean);this.zones=[];this.roadCount=0;this.railCount=0;
  for(let i=0;i<this.map.length;i++){
   const id=this.map[i]&1023,f=this.flags[id]||0;
   if(this.heavyRoads[i]&&!(f&64)&&id!==0x7d&&id!==0x7e)this.heavyRoads[i]=0;if(this.transitRamps[i]&&!(f&32)){this.transitRamps[i]=0;this.transitRevision++;}
   if(f&1)this.zones.push({i,x:i%this.width,y:Math.floor(i/this.width),id,type:this.classify(id),layout:this.civicLegacyLayouts[i]});
   if(f&0x20)this.railCount++;else if(f&0x40)this.roadCount+=id>=0x80||(id&15)<2?5:1;
  }
  for(let i=0;i<this.busStops.length;i++)if(this.busStops[i]){if(this.flags[this.map[i]&1023]&64)this.zones.push({i,x:i%this.width,y:Math.floor(i/this.width),id:967,type:37});else this.busStops[i]=0;}
  this.updatePower();this.census();applyParkBenefits(this);this.reconcileGrowthFacilities();if(this.regionalProvider){this.regionalState=this.regionalProvider(this);this.updatePower();}if(this.civicEnabled){const services=civicServices(this);this.civicCapacity=services.capacity;this.busRoutes=services.routes;this.civicWatered=services.watered;this.waterField=services.water;this.waterAssignments=services.waterAssignments;this.waterNetworks=services.waterNetworks;if(this.civic.sewageEnabled)this.sewageFlow=sewageServices(this).flow;}reconcileAviation(this);updateRailFleet(this);updateTransitFleet(this);for(const key of Object.keys(this.zoneGrowthLog)){const id=this.map[+key]&1023,type=this.classify(id);if(!(this.flags[id]&1)||type<5||type>7)delete this.zoneGrowthLog[key];}
 }
 updatePower(){
  const fusionSeeds=this.zones.filter(z=>civicForId(z.id)?.kind==='power').map(z=>z.i);const result=traceRomPower(this.map,conductivePowerFlags(this.flags),this.width,this.height,{branchLimit:turboPowerBranchLimit(this.map.length),extraSeeds:fusionSeeds,extraCapacity:fusionSeeds.reduce((n,i)=>n+((this.map[i]&1023)===972?windPower(this):civicForId(this.map[i]&1023).capacity),0)});
  this.powerTraversal={limit:result.branchLimit,peak:result.peak,dropped:result.dropped};
  if(this.regionalState){for(let i=0;i<this.width*this.height;i++)if(this.regionalState.regionalPowerMask[i])result.power[i]=this.regionalState.importPower[i];result.exhausted ||=this.regionalState.powerShortfall;}
  this.power=result.power;this.powerCapacity=result.capacity+(this.regionalState?.powerSummary?.imported||0);this.powerUsed=this.regionalState?.powerSummary?.imported?result.power.reduce((n,v)=>n+v,0):result.used;this.powerOverloaded=result.exhausted;
  // CODE_03B152 writes the resulting power bit back to every map word.
  for(let i=0;i<this.map.length;i++)this.map[i]=(this.map[i]&0x7fff)|(this.power[i]?0x8000:0);
 }
 // Zone population bands follow CODE_03842F/038456/03847A; spatial desirability below is provisional.
 zonePopulation(z){
  // CODE_0391DF/039207 count original hospital/school facilities, not residents.
  if(z.type===5&&(z.id===0x129||z.id===0x132))return 0;
  if(z.type===5&&z.id>=0x376&&z.id<0x39a)return 48;
  if(z.type===6&&z.id>=0x39a)return 6;
  if(z.type===5){if(z.id<0x99)return 0;return (Math.floor(((z.id-0x99)%36)/9)+2)*8;}
  if(z.type===6)return z.id<0x144?0:Math.floor(((z.id-0x144)%45)/9)+1;
  if(z.type===7)return z.id<0x201?0:Math.floor(((z.id-0x201)%36)/9)+1;
  return 0;
 }
 countCensusTile(census,i,id,type){
   if(id===0x2e3)census.giftStats.banks++;
   if([0x249,0x307].includes(compactEmergencyId(id)))census.counts[8]++;
   if([0x252,0x310].includes(compactEmergencyId(id)))census.counts[9]++;
   if(id===0x25c||id===0x36b)census.counts[10]++;
   if(id===0x26c)census.counts[11]++;
   if(id===0x2a5||id===991||id===992)census.counts[12]++;
   if(id===0x129||id===0x132){census.facilityCounts[id===0x129?0:1]++;return;}if(type<5||type>7)return;
   census.counts[type]++;
   const units=type===5&&id===0x84?this.adjacentSmallHomeCount({x:i%this.width,y:Math.floor(i/this.width)}):this.zonePopulation({id,type});
   if(units>0)census.giftStats.developedZones++;
   const total=census.rci[type-5]+units;census.rci[type-5]=this.wideCensus?total:total&65535;
   if(!this.power[i])census.unpowered++;
 }
 applyCensus(census){
  this.giftStats=census.giftStats||this.giftMapStats();
  this.facilityCounts=[...census.facilityCounts];this.counts=census.counts.map(n=>n&65535);this.rci=census.rci.map(n=>this.wideCensus?n:n&65535);this.unpowered=census.unpowered;
  const population=this.populationStats();this.population=population.population;this.netMigration=population.netMigration;this.category=population.category;
 }
 giftMapStats(){const stats={emptyLand:0,parks:0,developedZones:0,banks:0};for(let i=0;i<this.map.length;i++){const id=this.map[i]&1023;if(id===0)stats.emptyLand++;if(id===38||id===39)stats.parks++;if(id===0x2e3)stats.banks++;if((this.flags[id]&1)&&[5,6,7].includes(this.classify(id))&&id!==0x129&&id!==0x132){const z={x:i%this.width,y:Math.floor(i/this.width),id,type:this.classify(id)};if((id===0x84?this.adjacentSmallHomeCount(z):this.zonePopulation(z))>0)stats.developedZones++;}}return stats;}
 census(fromMap=false){
  const saved=this.lastScanCensus;
  // Rendering, power updates and save reloads must not recount a map that has
  // already grown. Construction/disaster edits invalidate the stored scan.
  if(!fromMap&&saved&&saved.map.length===this.map.length&&this.map.every((n,i)=>(n&1023)===saved.map[i])){this.applyCensus(saved);return;}
  this.lastScanCensus=null;
  const census={facilityCounts:[0,0],counts:Array(16).fill(0),rci:[0,0,0],unpowered:0,giftStats:{emptyLand:0,parks:0,developedZones:0,banks:0}};
  for(let i=0;i<this.map.length;i++){const id=this.map[i]&1023;if(id===0)census.giftStats.emptyLand++;if(id===38||id===39)census.giftStats.parks++;if(this.flags[id]&1)this.countCensusTile(census,i,id,this.classify(id));}
  this.applyCensus(census);
 }
 footprint(tool,x,y){const b=this.build.buildings[tool];return b.tiles.map((id,i)=>({x:x+b.x[i],y:y+b.y[i],id}));}
 get spendingFunds(){return this.infiniteMoney?Number.MAX_SAFE_INTEGER:this.funds;}
 setInfiniteMoney(enabled){this.infiniteMoney=!!enabled;if(this.infiniteMoney){this.financialEmergency=false;this.financialAlertShown=false;}return this.infiniteMoney;}
 canBuild(tool,x,y){
  if(tool<0)return {ok:false,cost:0,reason:'Choose a construction tool.'};
  if(transitTool(tool))return transitCanBuild(this,tool,x,y);if(tool===0&&x>=0&&x<this.width&&y>=0&&y<this.height&&transitPresent(this,y*this.width+x))return {ok:this.spendingFunds>=1,cost:1,reason:this.spendingFunds>=1?'':'Insufficient funds.'};if(tool>4&&![40,42,43,46,47,48].includes(tool)&&this.footprint(tool,x,y).some(c=>c.x>=0&&c.x<this.width&&c.y>=0&&c.y<this.height&&(this.transitStations[c.y*this.width+c.x]||(this.transitTracks[c.y*this.width+c.x]&6))))return {ok:false,cost:this.build.costs[tool],reason:'Clear this site before building.'};
  if(tool>=46&&tool<=48)return terrainCheck(this.map,this.elevation,x,y,tool,this.spendingFunds,this.width,this.height);
  if(tool===42||tool===43){const inside=x>=0&&x<this.width&&y>=0&&y<this.height,id=this.id(x,y),same=tool===42?id===0:id>=1&&id<20,cost=tool===42?5:10;return {ok:inside&&id<48&&!same&&this.spendingFunds>=cost,cost,reason:!inside?'Terrain must fit inside the map.':same?'This terrain is already here.':id>=48?'Clear this site before building.':'Insufficient funds.'};}
  if(tool===37&&(this.flags[this.id(x,y)]&64)){return {ok:x>=0&&x<this.width&&y>=0&&y<this.height&&!this.busStops[y*this.width+x]&&this.spendingFunds>=25,cost:25,reason:this.busStops[y*this.width+x]?'A bus stop is already here.':'Insufficient funds.'};}
  if(tool===40){const ok=x>=0&&x<this.width&&y>=0&&y<this.height;return {ok:ok&&!this.pipes[y*this.width+x]&&this.spendingFunds>=2,cost:2,reason:!ok?'Pipe must fit inside the map.':this.pipes[y*this.width+x]?'A pipe is already here.':'Insufficient funds.'};}
  if(tool===0){const id=this.id(x,y);return {ok:x>=0&&x<this.width&&y>=0&&y<this.height&&(id>3||this.pipes[y*this.width+x]||this.busStops[y*this.width+x]),cost:1,reason:'There is nothing to clear here.'};}
  const cells=this.footprint(tool,x,y);let cost=this.build.costs[tool]||100;const resourceReason=industryPlacement(this,tool,x,y);if(resourceReason)return{ok:false,cost,reason:resourceReason};
  if(tool>=15&&tool<30){if(!(tool===17||tool===19?this.gifts.some(n=>n===17||n===19):this.gifts.includes(tool)))return {ok:false,cost:0,reason:'This gift has not been awarded.'};cost=0;}
  if(tool===20){if(cells.some(c=>c.x<0||c.x>=this.width||c.y<0||c.y>=this.height))return {ok:false,cost:100,reason:'The reclamation area must fit inside the map.'};if(cells.some(c=>{const id=this.id(c.x,c.y);return id>=48&&!(id>=98&&id<=108);}))return {ok:false,cost:100,reason:'Clear this site before reclaiming land.'};if(!cells.some(c=>[1,2,3].includes(this.id(c.x,c.y))))return {ok:false,cost:100,reason:'Land reclamation needs water to fill.'};return {ok:this.spendingFunds>=100,cost:100,reason:this.spendingFunds>=100?'':'Insufficient funds.'};}
  for(const c of cells){
   if(c.x<0||c.x>=this.width||c.y<0||c.y>=this.height)return {ok:false,cost,reason:'The building must fit inside the map.'};
   const id=this.id(c.x,c.y);
   if(id===0)continue;
   // Rubble is a vacant construction site. Clear it as part of the build,
   // with the same $1/cell preparation cost as other removable ground cover.
   if(id>=0x28&&id<=0x2b){cost++;continue;}
   if(id>=4&&id<0x26){cost++;continue;}
   if(tool<=3&&(id>=1&&id<=3)){cost=this.build.costs[tool]*2;continue;}
   if(tool<=3&&id>=0x30&&id<0x80&&((this.flags[id]||0)&(tool===1?0x40:tool===2?0x20:0x10))===0)continue;
   return {ok:false,cost,reason:'Clear this site before building.'};
  }
  return {ok:this.spendingFunds>=cost,cost,reason:this.spendingFunds>=cost?'':'Insufficient funds.'};
 }
 replacementPlan(tool,x,y){
  if(tool===2&&x>=0&&x<this.width&&y>=0&&y<this.height&&hasRoadLayer(this.id(x,y),this.flags)){const i=y*this.width+x,cost=(this.build.costs[2]||20)+1;if(this.spendingFunds<cost)return {ok:false,cost,reason:'Insufficient funds.',map:null,cleared:[]};const map=this._placementShadow?this.map:this.map.slice();map[i]=0;return {ok:true,cost,reason:'',map,cleared:[i]};}
  if(tool===40&&x>=0&&x<this.width&&y>=0&&y<this.height&&this.pipes[y*this.width+x])return {ok:this.spendingFunds>=3,cost:3,reason:this.spendingFunds>=3?'':'Insufficient funds.',map:null,cleared:[],replacedPipe:true};
  const check=this.canBuild(tool,x,y);if(check.ok||tool<=0||check.reason!=='Clear this site before building.')return {...check,map:null,cleared:[]};
  const original=this.map,candidate=Uint16Array.from(original),cleared=new Set();
  const add=(cx,cy)=>{if(cx>=0&&cx<this.width&&cy>=0&&cy<this.height){const i=cy*this.width+cx;if(original[i]&1023)cleared.add(i);candidate[i]=0;}};
  for(const c of this.footprint(tool,x,y)){
   const id=this.id(c.x,c.y);if(id<=3)continue;
   // Preserve legal network crossings and skip rebuilding an existing segment.
   if(tool<=3&&((this.flags[id]||0)&(tool===1?0x40:tool===2?0x20:0x10)))return {ok:false,cost:0,reason:'This network is already here.',map:null,cleared:[]};
   const z=this.zones.find(z=>{const custom=civicBounds(z);if(custom)return c.x>=custom.x&&c.x<custom.x+custom.width&&c.y>=custom.y&&c.y<custom.y+custom.height;const size=[10,11,13,14].includes(z.type)?4:z.type===12?6:3;return c.x>=z.x-1&&c.x<z.x-1+size&&c.y>=z.y-1&&c.y<z.y-1+size;});
   if(z){const custom=civicBounds(z);if(custom){for(let dy=0;dy<custom.height;dy++)for(let dx=0;dx<custom.width;dx++)add(custom.x+dx,custom.y+dy);}else{const size=[10,11,13,14].includes(z.type)?4:z.type===12?6:3;for(let dy=0;dy<size;dy++)for(let dx=0;dx<size;dx++)add(z.x-1+dx,z.y-1+dy);}}else add(c.x,c.y);
  }
  this.map=candidate;let next;try{next=this.canBuild(tool,x,y);}finally{this.map=original;}
  const cost=next.cost+cleared.size;return {...next,ok:next.ok&&this.spendingFunds>=cost,cost,reason:this.spendingFunds<cost?'Insufficient funds.':next.reason,map:candidate,cleared:[...cleared]};
 }
 planPlacements(tool,cells,options={}){
  const shadow=Object.assign(Object.create(Object.getPrototypeOf(this)),this,{map:Uint16Array.from(this.map),...Object.fromEntries(TRANSIT_ARRAYS.map(k=>[k,Uint8Array.from(this[k])])),gifts:[...this.gifts],pipes:Uint8Array.from(this.pipes),busStops:Uint8Array.from(this.busStops),terraform:Uint8Array.from(this.terraform),elevation:Int8Array.from(this.elevation),civic:{...this.civic,waterStored:{...this.civic.waterStored},landfillUsed:this.civic.landfillUsed?{...this.civic.landfillUsed}:undefined},civicLegacyLayouts:{...this.civicLegacyLayouts},zones:[...this.zones],notices:[]});
  shadow._placementShadow=true;if(this.infiniteMoney)shadow.funds=Number.MAX_SAFE_INTEGER;else if(options.ignoreFunds)shadow.funds=1000000000;const startingFunds=shadow.funds;let target=null,activeTool=tool,skipped=0;const occupied=new Set(),anchors=[];
  shadow.refresh=()=>{if(activeTool===40)return;shadow.zones=shadow.zones.filter(z=>(shadow.map[z.i]&1023)===z.id);if(activeTool>0)for(const c of shadow.footprint(activeTool,target.x,target.y)){const i=c.y*this.width+c.x,id=shadow.map[i]&1023;if((shadow.flags[id]&1)&&!shadow.zones.some(z=>z.i===i))shadow.zones.push({i,x:c.x,y:c.y,id,type:shadow.classify(id)});}};
  for(const c of cells){
   activeTool=c.tool??tool;const footprint=activeTool>4?shadow.footprint(activeTool,c.x,c.y):[c];if(footprint.some(p=>occupied.has(p.y*this.width+p.x)))continue;
   if(activeTool===0&&!shadow.canBuild(0,c.x,c.y).ok){skipped++;continue;}
   const id=shadow.id(c.x,c.y);if(activeTool===103&&!(shadow.transitTracks[c.y*this.width+c.x]&1)){skipped++;continue;}if(transitTool(activeTool)&&transitDuplicate(shadow,activeTool,c.y*this.width+c.x)){skipped++;continue;}if((activeTool===2||activeTool===94)&&options.replaceRoadOnly&&!hasRoadLayer(id,shadow.flags)){skipped++;continue;}const bit=[0,0x40,0x20,0x10][activeTool];
   if(activeTool>=1&&activeTool<=3&&id>=0x30&&id<0x80&&(shadow.flags[id]&bit)&&!(activeTool===2&&(options.autoDemolish||options.replaceRoadOnly)&&hasRoadLayer(id,shadow.flags))){skipped++;continue;}
   target=c;if(!shadow.place(activeTool,c.x,c.y,{...options,clearAllLayers:activeTool===0&&cells.length>1,autoDemolish:activeTool===0?false:activeTool===2&&options.replaceRoadOnly?true:options.skipBlocked?false:options.autoDemolish})){
    if(options.skipBlocked){skipped++;continue;}
    if(shadow.notices[0]==='Insufficient funds.'&&!options.ignoreFunds){const required=this.planPlacements(tool,cells,{...options,ignoreFunds:true});return {...required,ok:false,reason:'Insufficient funds.'};}
    return {ok:false,reason:shadow.notices[0]||'This blueprint cannot be placed.',anchors,cost:startingFunds-shadow.funds};
   }
   anchors.push(c);for(const p of footprint)occupied.add(p.y*this.width+p.x);
  }
  return {ok:true,tool,anchors,skipped,cost:startingFunds-shadow.funds,map:shadow.map,...Object.fromEntries(TRANSIT_ARRAYS.map(k=>[k,shadow[k]])),transitEnabled:shadow.transitEnabled,transitRevision:shadow.transitRevision,transitInfrastructure:shadow.transitInfrastructure,pipes:shadow.pipes,busStops:shadow.busStops,terraform:shadow.terraform,elevation:shadow.elevation,civicLegacyLayouts:shadow.civicLegacyLayouts,civicEnabled:shadow.civicEnabled,waterEnabled:shadow.civic.waterEnabled,waterStored:shadow.civic.waterStored,sewageEnabled:shadow.civic.sewageEnabled,landfillUsed:shadow.civic.landfillUsed,gifts:shadow.gifts};
 }

 applyPlacementPlan(plan){
  if(!plan.ok){this.message(plan.reason);return false;}
  if(plan.tool===0&&!plan.anchors.length)return true;
  this.map=plan.map;for(const k of TRANSIT_ARRAYS)if(plan[k])this[k]=plan[k];this.transitEnabled=plan.transitEnabled??this.transitEnabled;this.transitInfrastructure=plan.transitInfrastructure??this.transitInfrastructure;this.transitRevision=Math.max(this.transitRevision,plan.transitRevision||0)+1;if(plan.pipes)this.pipes=plan.pipes;if(plan.busStops)this.busStops=plan.busStops;if(plan.terraform)this.terraform=plan.terraform;if(plan.elevation)this.elevation=plan.elevation;if(plan.civicLegacyLayouts)this.civicLegacyLayouts=plan.civicLegacyLayouts;this.civicEnabled ||=plan.civicEnabled;this.civic.waterEnabled ||=plan.waterEnabled;this.civic.sewageEnabled ||=plan.sewageEnabled;if(plan.landfillUsed)this.civic.landfillUsed=plan.landfillUsed;if(plan.waterStored)this.civic.waterStored=plan.waterStored;if(!this.infiniteMoney||this._placementShadow)this.funds-=plan.cost;this.gifts=plan.gifts;this.refresh();if(plan.tool===8||plan.tool===21)this.message('Police station built. Coverage reduces crime as the simulation runs; power, roads and funding affect its strength.');return true;
 }
 place(tool,x,y,{autoDemolish=false,clearAllLayers=false}={}){
  if(transitTool(tool))return placeTransit(this,tool,x,y,{autoDemolish,clearAllLayers});if(tool===0&&x>=0&&x<this.width&&y>=0&&y<this.height&&transitPresent(this,y*this.width+x)){if(this.spendingFunds<1){this.message('Insufficient funds.');return false;}clearTransit(this,y*this.width+x,{all:clearAllLayers});if(!clearAllLayers||(this.id(x,y)<=3)){if(clearAllLayers){this.busStops[y*this.width+x]=0;this.pipes[y*this.width+x]=0;}if(!this.infiniteMoney||this._placementShadow)this.funds--;this.refresh();return true;}}
  const check=autoDemolish?this.replacementPlan(tool,x,y):this.canBuild(tool,x,y);if(!check.ok){this.message(check.reason);return false;}
  if(check.map)this.map=check.map;
  if(!this.infiniteMoney||this._placementShadow)this.funds-=check.cost;if(tool>=46&&tool<=48){const i=y*this.width+x,old=this.elevation[i];this.terraform[i]=1;if(tool===48)plantForest(this.map,x,y,this.width,this.height);else{this.elevation[i]+=tool===46?1:-1;const water=this.elevation[i]<=0;if((old<=0)!==water)reshapeTerrain(this.map,this.terraform,x,y,water,this.width,this.height);}this.refresh();return true;}if(tool===42||tool===43){this.elevation[y*this.width+x]=tool===43?0:1;reshapeTerrain(this.map,this.terraform,x,y,tool===43,this.width,this.height);this.refresh();return true;}
  if(tool===37&&(this.flags[this.id(x,y)]&64)){this.busStops[y*this.width+x]=1;this.civicEnabled=true;this.refresh();return true;}if(tool===0&&!clearAllLayers&&this.busStops[y*this.width+x]){this.busStops[y*this.width+x]=0;this.refresh();return true;}if(tool>=30)this.civicEnabled=true;if(tool===31){this.civic.landfillUsed??={};delete this.civic.landfillUsed[y*this.width+x];}if(tool===60){this.civic.waterStored??={};this.civic.waterStored[(y+1)*this.width+x]=0;}if(tool===44||tool===45)this.civic.sewageEnabled=true;if([39,40,60,61].includes(tool))this.civic.waterEnabled=true;if(tool===40){this.pipes[y*this.width+x]=1;this.refresh();return true;}
  if(tool===0){
   if(clearAllLayers){this.busStops[y*this.width+x]=0;this.pipes[y*this.width+x]=0;}
   const custom=this.zones.find(z=>{const b=civicBounds(z);return b&&x>=b.x&&x<b.x+b.width&&y>=b.y&&y<b.y+b.height;});if(custom){const b=civicBounds(custom);if(custom.id===961&&this.civic.landfillUsed)delete this.civic.landfillUsed[custom.i];if(custom.id===988&&this.civic.waterStored)delete this.civic.waterStored[custom.i];delete this.civicLegacyLayouts[custom.i];for(let dy=0;dy<b.height;dy++)for(let dx=0;dx<b.width;dx++)this.map[(b.y+dy)*this.width+b.x+dx]=0;this.refresh();return true;}
   const i=y*this.width+x,z=this.zones.find(z=>Math.abs(z.x-x)<=1&&Math.abs(z.y-y)<=1&&this.id(x,y)>=0x80);
   if(z){const size=civicForId(z.id)?.size||([10,11,13,14].includes(z.type)?4:z.type===12?6:3),offset=size===1?0:1;for(let dy=0;dy<size;dy++)for(let dx=0;dx<size;dx++){const n=(z.y-offset+dy)*this.width+z.x-offset+dx;if(n>=0&&n<this.map.length)this.map[n]=0;}}
   else {this.map[i]=0;this.pipes[i]=0;}
  } else {
   for(const c of this.footprint(tool,x,y)){const i=c.y*this.width+c.x;this.map[i]=networkCrossing(tool,this.map[i])??c.id;if(civicForId(c.id))delete this.civicLegacyLayouts[i];}
   if(tool===20)for(const c of this.footprint(tool,x,y)){const i=c.y*this.width+c.x;this.terraform[i]=1;this.elevation[i]=Math.max(1,this.elevation[i]);}if(tool>=15&&tool<30)this.gifts.splice(tool===17||tool===19?this.gifts.findIndex(n=>n===17||n===19):this.gifts.indexOf(tool),1);
  }
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)this.connect(x+dx,y+dy);
  for(const i of check.cleared||[])for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]])this.connect(i%this.width+dx,Math.floor(i/this.width)+dy);
  this.refresh();return true;
 }
 connect(x,y){
  if(x<0||x>=this.width||y<0||y>=this.height)return;
  const i=y*this.width+x,id=this.map[i]&1023;let kind=id>=0x70&&id<=0x7c?2:id>=0x60&&id<=0x6c?3:id>=0x30&&id<=0x5c&&(id&15)<=12?1:0;
  if(!kind)return;
  const bit=kind===1?0x40:kind===2?0x20:0x10;
  // DATA_018020, CODE_01B62F/645/65B. Bit directions follow CODE_01B6CC.
  let mask=0;[[0,-1,8],[1,0,2],[0,1,1],[-1,0,4]].forEach(([dx,dy,b])=>{if((this.flags[this.id(x+dx,y+dy)]||0)&(kind===3?0x80:bit))mask|=b;});
  const table=[2,3,2,5,2,6,2,10,3,3,4,9,7,11,8,12];this.map[i]=(kind===1?(id&0xf0):kind===2?0x70:0x60)+table[mask];
 }
 nearRoad(z){return findZoneTransport(this.map,z.x,z.y,this.width,this.height)!==null||transitZoneAccess(this,z);}
 coverage(x,y,type){let n=0;for(const z of this.zones)if(z.type===type)n=Math.max(n,clamp(1-(Math.abs(z.x-x)+Math.abs(z.y-y))/24,0,1));return n*this.funding[type===8?1:2]/100;}
 fields(){this.updateDensityField();this.updateLandPollutionField();this.updateCrimeField();this.updateFireField();}
 updateDensityField(){this.commercialRate=romCommercialRate(this.centerX,this.centerY,this.width,this.height);const spatial=romDensityField(this.map,this.flags,(id,x,y)=>id>=960?0:id>=0x376?48:id===0x84?this.adjacentSmallHomeCount({x,y}):this.zonePopulation({id,type:this.classify(id)})*(this.classify(id)===5?1:8),this.width,this.height);this.density=spatial.density;this.centerX=this.zones.length?spatial.centerX:this.width/4;this.centerY=this.zones.length?spatial.centerY:this.height/4;}
 updateLandPollutionField(){
  // CODE_039D50 reads old terrain $7FAB74, pollution $7F8270 and crime
  // $7F76B8 before CODE_039C75/039FA6 publishes the new planes.
  for(let y=0;y<this.height;y++)for(let x=0;x<this.width;x++){const i=y*this.width+x;this.landValue[i]=romLandValue(x>>1,y>>1,this.centerX,this.centerY,this.terrain[i],this.pollution[i],this.crime[i]);}
  this.meanLandValue=aggregateRomLandValue(this.map,this.landValue,this.width,this.height);const parks=applyParkBenefits(this,{newBase:true});if(parks.facilities.length)this.meanLandValue=aggregateRomLandValue(this.map,this.landValue.slice(),this.width,this.height);
  this.pollution=combineAirPollution(romPollutionField(this.map,this.width,this.height),this.airPollution);this.meanPollution=meanGraphPollution(this.pollution,this.width,this.height);this.pollutionTarget=monsterPollutionTarget(this.pollution,this.pollutionTarget,this.width,this.height);this.terrain=romTerrainField(this.map,this.width,this.height);
 }
 captureServiceInputs(){this.serviceInputs={police:seedRomServicePlane(this.map,this.serviceStrengths[0]*this.policeEffectiveness,'police',this.width,this.height),fire:seedRomServicePlane(this.map,this.serviceStrengths[1],'fire',this.width,this.height)};}
 updateCrimeField(){this.giftEffects=romGiftEffects(this.map,this.flags);this.policeCoverage=this.serviceInputs?expandServiceCoverage(this.serviceInputs.police,'police',this.width,this.height):expandServiceCoverage(seedRomServicePlane(this.map,this.serviceStrengths[0]*this.policeEffectiveness,'police',this.width,this.height),'police',this.width,this.height);for(let i=0;i<this.width*this.height;i++)this.crime[i]=romCrimeValue(this.landValue[i],this.density[i],this.giftEffects.crimeModifier,this.policeCoverage[i]);if(this.civicEnabled){const factor=1-educationEffects(this.civic.education).crimeReduction;for(let i=0;i<this.crime.length;i++)this.crime[i]=Math.floor(this.crime[i]*factor);}this.meanCrime=meanRomCrime(this.crime,this.landValue,this.width,this.height);}
 updateFireField(){this.fireCoverage=this.serviceInputs?expandServiceCoverage(this.serviceInputs.fire,'fire',this.width,this.height):boostFireCoverage(romFireCoverage(this.map,this.funding[2],this.width,this.height));}
 updateScheduledFields(){const due=romFieldSchedule(this.baseStep,this.speed);for(const [key,method]of [['landPollution','updateLandPollutionField'],['crime','updateCrimeField'],['density','updateDensityField'],['fire','updateFireField']])if(due[key]){this[method]();this.fieldEpochs[key]=this.baseStep;}}
 setPoliceEffectiveness(value){
  this.policeEffectiveness=value===1?1:2;
  this.serviceInputs={fire:this.serviceInputs?.fire||seedRomServicePlane(this.map,this.serviceStrengths[1],'fire',this.width,this.height),police:seedRomServicePlane(this.map,this.serviceStrengths[0]*this.policeEffectiveness,'police',this.width,this.height)};
  this.updateCrimeField();
 }
 policeEffectAt(x,y){
  x=clamp(Math.floor(x),0,this.width-1);y=clamp(Math.floor(y),0,this.height-1);const i=y*this.width+x;
  const station=this.zones.find(z=>[0x249,0x307].includes(compactEmergencyId(z.id))&&(()=>{const b=emergencyBounds(z);return x>=b.x&&x<b.x+b.width&&y>=b.y&&y<b.y+b.height;})());
  let nextUpdate=1;while(nextUpdate<16&&!romFieldSchedule((this.baseStep+nextUpdate)&65535,this.speed).crime)nextUpdate++;
  return {crime:this.crime[i],coverage:this.policeCoverage[i],strength:this.serviceStrengths[0],effectiveness:this.policeEffectiveness,nextUpdate,station:station?{powered:!!this.power[station.i],road:!!(station.id>=977?emergencyTransport(this.map,station.x,station.y,station.id,this.width,this.height):findZoneTransport(this.map,station.x,station.y,this.width,this.height))}:null};
 }
 grow(z,direction){
  if(direction>0&&this.civicEnabled&&this.civic.waterEnabled&&!(this.civicWatered||civicServices(this).watered).has(z.i)&&!(z.type===5&&this.id(z.x,z.y)===0x84&&this.adjacentSmallHomeCount(z)<8))return false;
  const record=(delta,changed)=>{addRomGrowthRate(this.growthRate,z.x,z.y,delta,this.width);return changed;};
  if(z.type===5){
   const id=z.scanId??this.id(z.x,z.y),current={...z,id};
   if(direction<0){
    if(id===0x37a||id===0x38c)return stampZoneFootprint(this.map,z.x,z.y,0x11c,this.width,this.height);
    if(id===0x383||id===0x395)return false;
   }
   const population=id===0x84?this.adjacentSmallHomeCount(z):this.zonePopulation(current);
   if(direction>0&&this.pollution[z.i]>=0x81)return false;
   const density=residentialDensityBand(this.landValue[z.i]||0,this.pollution[z.i]||0);
   if(direction>0&&!this.nativeGrowthRules&&upgradeFullZoneFamily(this,current,population,density))return record(0,true);
   if(direction>0){
    if(id===0x84){if(population<8)return record(1,placeSmallHome(this.map,z.x,z.y,density,()=>this.random(),()=>this.boundedRandom(2),this.width,this.height));if((this.density[z.i]||0)<0x41)return false;return record(8,stampZoneFootprint(this.map,z.x,z.y,residentialGrowthBase(8,density),this.width,this.height));}
    if(id===0x120||population>=40)return mergeResidentialZone(this.map,z.x,z.y,this.width,this.height);return record(8,stampZoneFootprint(this.map,z.x,z.y,residentialGrowthBase(population,density),this.width,this.height));
   }
   if(population===0)return false;return record(population>=16?-8:-1,residentialDeclineFootprint(this.map,z.x,z.y,population,density,()=>this.boundedRandom(2),this.width,this.height));
  }
  const id=z.scanId??this.id(z.x,z.y),population=this.zonePopulation({...z,id});
  if(z.type===6){if(direction>0&&!this.nativeGrowthRules&&upgradeFullZoneFamily(this,{...z,id,scanId:id},population,residentialDensityBand(this.landValue[z.i],this.pollution[z.i])))return record(0,true);const eligible=direction>0?(this.landValue[z.i]>>>5)>=population&&population<5:population>0&&![0x39e,0x3a7,0x3b0,0x3b9].includes(id),changed=updateCommercialFootprint(this.map,z.x,z.y,population,residentialDensityBand(this.landValue[z.i],this.pollution[z.i]),this.landValue[z.i],direction,this.width,this.height,id);return eligible?record(direction>0?8:-8,changed):changed;}
  const eligible=direction>0?population<4:population>0,changed=updateIndustrialFootprint(this.map,z.x,z.y,population,direction,()=>this.random(),this.width,this.height);return eligible?record(direction>0?8:-8,changed):changed;
 }
 adjacentSmallHomeCount(z){
  let count=0;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   if(dx===0&&dy===0)continue;
   const id=this.id(z.x+dx,z.y+dy);if(id>=0x89&&id<0x95)count++;
  }
  return count;
 }
 recordZoneGrowth(z,decision,transport,changed,score=null,commute=null){this.zoneGrowthLog??={};const previousTile=z.scanId??z.id,tile=this.map[z.i]&1023;this.zoneGrowthLog[z.i]={type:z.type,tile,previousTile,previousPopulation:previousTile===0x84?null:this.zonePopulation({...z,id:previousTile}),population:tile===0x84?this.adjacentSmallHomeCount(z):this.zonePopulation({...z,id:tile}),year:this.year,month:this.month,action:decision.action,reason:decision.reason,transport,changed:!!changed,score,connectedRoute:!!commute?.connected,commuteDistance:commute?.distance??null,routeTarget:commute?.target??null,powered:!!this.power[z.i],landValue:this.landValue[z.i]||0,pollution:this.pollution[z.i]||0,demand:this.demand[z.type-5]};}

 updateResidentialTile(z,nextRandomWord=()=>this.random()){
  const current={...z,id:z.scanId??this.id(z.x,z.y)};
  const population=current.id===0x84?this.adjacentSmallHomeCount(z):this.zonePopulation(current);
  let transport=1,commute=null;
  if(boundSimulationWord(nextRandomWord(),35)<population){
   const route=commute=traceCityTransport(this,{...z,type:5},nextRandomWord);transport=route.status;if(transport!==1&&this.regionalState?.zoneAccess.get(z.i)?.jobs>0)transport=1;
   if(transport===-1){const changed=this.grow(current,-1),decision={action:'decline',reason:'missing-transport',randomsUsed:0};this.recordZoneGrowth(z,decision,transport,changed,null,commute);return decision;}
   if(transport===1)addCityRouteTraffic(this,route.path);
  }
  const gateWord=current.id===0x84?0:nextRandomWord();
  // CODE_0399D2 reads land value $7F6B00 and pollution $7F8270.
  // The population-density redevelopment gate separately reads $7F8E28.
  const localScore=residentialLocalScore(this.landValue[z.i]||0,this.pollution[z.i]||0,transport!==0);
  const score=residentialDemandScore(this.map[z.i],localScore,this.demand[0]);
  const decision=decideResidentialUpdate({tileId:current.id,gateWord,score,population,nextRandomWord});
  let changed=false;if(decision.action==='special')changed=placeRomFacility(this.map,z.x,z.y,this.facilityDemand,this.width,this.height);else if(decision.action==='grow')changed=this.grow(current,1);
  else if(decision.action==='decline')changed=this.grow(z,-1);
  this.recordZoneGrowth(z,decision,transport,changed,score,commute);return decision;
 }
 updateJobZoneTile(z,nextRandomWord=()=>this.random()){
  const current={...z,id:z.scanId??this.id(z.x,z.y)};let transport=1,commute=null;
  if(boundSimulationWord(nextRandomWord(),5)<this.zonePopulation(current)){const route=commute=traceCityTransport(this,z,nextRandomWord);transport=route.status;if(transport!==1&&this.regionalState?.zoneAccess.get(z.i)?.workers>0)transport=1;if(transport===1)addCityRouteTraffic(this,route.path);}
  if(transport===-1){const changed=this.grow(current,-1),decision={action:'decline',reason:'missing-transport',randomsUsed:0};this.recordZoneGrowth(z,decision,transport,changed,null,commute);return decision;}
  const localScore=z.type===6?commercialLocalScore(this.commercialRate,z.x,z.y,transport,this.width)+(transport>0?plazaGrowthBonus(this,z):0):industrialLocalScore(transport),score=residentialDemandScore(this.map[z.i],localScore,this.demand[z.type-5]),decision=decideJobZoneUpdate({mapWord:this.map[z.i],demand:this.demand[z.type-5],localScore,gateWord:nextRandomWord(),nextRandomWord});
  const changed=decision.action==='grow'?this.grow(current,1):decision.action==='decline'?this.grow(current,-1):false;this.recordZoneGrowth(z,decision,transport,changed,score,commute);return decision;
 }
 budget(apply=false,taxRate=this.tax){
  // Revenue arithmetic is ROM-derived; complete budget dialog flow remains partial.
  const units=Math.floor(this.rci[0]/8)+this.rci[1]+this.rci[2];
  const meanLandValue=this.meanLandValue||0;
  let giftIncome=romGiftEffects(this.map,this.flags).income;
  const productivity=this.civicEnabled?educationEffects(this.civic.education).productivity:1;let propertyIncome=Math.floor(romAnnualRevenue(units,meanLandValue,taxRate,this.difficulty)*productivity),employmentTax=employmentIncome(this,taxRate).incomeTax,militaryIndustryIncome=Math.floor(romAnnualRevenue(this.rci[2],meanLandValue,taxRate,this.difficulty)*productivity*aviationBenefits(this).industryProductivity),income=propertyIncome+giftIncome+employmentTax+militaryIndustryIncome;
  // CODE_038E39 scales road + double rail count by a Q8 factor indexed by difficulty.
  const transportFactor=[0x00b3,0x00e6,0x0133][this.difficulty];
  let requests=[Math.min(9999,Math.floor((this.roadCount+2*this.railCount)*transportFactor/256)),Math.min(9999,Math.max(0,this.counts[8]-this.zones.filter(z=>[0x249,0x307].includes(compactEmergencyId(z.id))&&buildingOff(this,z)).length)*100),Math.min(9999,Math.max(0,this.counts[9]-this.zones.filter(z=>[0x252,0x310].includes(compactEmergencyId(z.id))&&buildingOff(this,z)).length)*100)];
  if(this.pendingBudget?.assessment){({income,giftIncome}=this.pendingBudget.assessment);employmentTax=this.pendingBudget.assessment.employmentTax||0;militaryIndustryIncome=this.pendingBudget.assessment.militaryIndustryIncome||0;propertyIncome=income-giftIncome-employmentTax-militaryIndustryIncome;requests=[...this.pendingBudget.assessment.requests];}
  const payment=this.loans.reduce((sum,loan)=>sum+loan.payment,0);
  const allocation=allocateRomBudget(requests,this.funding,this.spendingFunds+income,payment),expenses=allocation.expenses;
  const civicExpense=(this.civicEnabled?civicAnnualCost(this):0)+transitAnnualCost(this);const net=income-expenses.reduce((a,b)=>a+b,0)-payment-civicExpense;
  const result={income,propertyIncome,employmentTax,militaryIndustryIncome,productivity,civicExpense,requests,expenses,desired:allocation.desired,shortfall:allocation.shortfall,payment,net,taxRate,giftIncome};
  if(apply){this.transportStrength=romTransportFunding(expenses[0],requests[0]);this.allocatedFunding=[...expenses];this.serviceStrengths=[1,2].map(i=>romServiceFunding(expenses[i],requests[i]));if(!this.infiniteMoney)this.funds=clamp(this.funds+net,0,TREASURY_CAP);this.loans=this.loans.filter(loan=>--loan.years>0);this.lastBudget=result;}
  return result;
 }
 get loan(){return this.loans[0]??null;}
 takeLoan(amount=100000){amount=Number(amount);if(!Number.isInteger(amount)||amount<1000||amount>100000||amount%1000){this.message('Choose a loan from $1,000 to $100,000 in $1,000 increments.');return false;}if(this.loans.length>=3){this.message('The bank allows up to three active loans.');return false;}if(this.funds+amount>TREASURY_CAP){this.message('This loan would exceed the city funds limit.');return false;}const payment=amount/20;this.loans.push({principal:amount,years:21,payment});this.funds+=amount;this.message(`Bank loan received: $${amount.toLocaleString()}; 21 annual payments of $${payment.toLocaleString()}.`);return true;}
 cityEvaluationInputs(){return {assessedValue:romAssessedValue({roads:this.roadCount,rails:this.railCount,facilityA:this.facilityCounts[0],police:this.counts[8],fire:this.counts[9],stadiums:this.counts[10],coal:this.zones.filter(z=>z.id===0x28c).length,seaports:this.counts[11],nuclear:this.zones.filter(z=>z.id===0x27c).length,airports:this.counts[12]}),population:this.population,problems:cityProblems({crime:this.meanCrime||0,landValue:this.meanLandValue||0,pollution:this.pollution,traffic:this.traffic,landValues:this.landValue,tax:this.tax,rci:this.rci,fires:this.fireCount},this.width,this.height),caps:[...this.growthCaps.suppressed],demand:[...this.demand]};}
 evaluateCity(inputs=this.cityEvaluationInputs()){
  if(!inputs.population){this.netMigration=0;this.score=500;this.scoreChange=0;this.evaluation={year:this.year,score:500,change:0,assessedValue:0,problems:Array(7).fill(0),survey:null,approval:{approve:0,disapprove:0}};return this.evaluation;}
  const problems=inputs.problems;
  const survey=pollRomProblems(problems,max=>this.boundedRandom(max));
  const result=romCityScore({previous:this.score,problems,caps:inputs.caps,transport:this.transportStrength,police:this.serviceStrengths[0],fire:this.serviceStrengths[1],demand:inputs.demand});
  const approval=pollRomApproval(result.score,max=>this.boundedRandom(max));
  this.score=result.score;this.scoreChange=result.change;this.evaluation={year:this.year,assessedValue:inputs.assessedValue??0,problems,survey,approval,...result};return this.evaluation;
 }
 updatePracticeTutorial(){
  if(this.scenario!=='PracticeCity')return;
  const p=this.practiceTutorial,next=stepPracticeLesson(this.year,this.month,p.stage,{population:this.population,messagePending:p.pendingId!==null,messageBusy:!!this.pendingBudget});
  p.stage=next.stage;if(next.messageId===null)return;
  p.pendingId=next.messageId;p.lessons.push(next.messageId);this.message(practiceNotice(next.messageId));
  if(next.historyId!==null)this.recordEvent(next.historyId);
  if(next.outcome)p.decision={year:this.year,month:this.month,population:this.population,result:next.outcome};
 }
 recordScenarioCompletion(){
  const index=SCENARIO_IDS.indexOf(this.scenario);if(index<0||!['won','lost'].includes(this.scenarioResult)||this.scenarioEnding)return;
  this.scenarioEnding=scenarioEnding(this.careerFlags,index,this.scenarioResult==='won'?2:1);this.careerFlags=this.scenarioEnding.flags;
 }
 updateScenarioOutcome(){
  if(!SCENARIO_DEADLINES[this.scenario]||this.scenarioResult)return;
  if(this.pendingBudget){this.scenarioEvaluationDeferred=true;return;}
  this.scenarioEvaluationDeferred=false;const input={category:this.category,traffic:this.evaluation?.problems?.[4]??0,crime:this.meanCrime||0,score:this.score},next=stepScenarioProgress(this.scenario,this.year,this.scenarioStage,input);this.scenarioStage=next.stage;
  if(next.notice!==null){this.scenarioReminders.push(next.yearsLeft);this.message('Scenario deadline: '+next.yearsLeft+' '+(next.yearsLeft===1?'year':'years')+' remaining.');}
  if(next.outcome){this.scenarioResult=next.outcome;this.scenarioDecision={...input,year:this.year,result:next.outcome};this.recordScenarioCompletion();this.message('Scenario '+next.outcome+'.');}
 }
 settleAnnualBudget(){if(!this.pendingBudget)return null;const rate=this.pendingBudget.taxRate,inputs=this.pendingBudget.evaluationInputs;const result=this.budget(true,rate);this.pendingBudget=null;this.evaluateCity(inputs);if(this.scenarioEvaluationDeferred)this.updateScenarioOutcome();return result;}
 tick(){for(let n=0;n<4&&!this.pendingBudget;n++)this.stepSimulation();}
 stepSimulation(){
  if(this.pendingBudget||this.ufo.request)return false;
  // CODE_038016 runs demand and tile simulation on each of four base steps.
  this.taxAccumulator+=this.tax;

  if(this.regionalProvider)this.regionalState=this.regionalProvider(this);this.updatePower();
  const historyRci=cityGraphDemandHistory(this.graphs,this.history.at(-1)?.rci||[0,0,0]);
  const generatedDemand=generateCityDemand(this.rci.map((v,i)=>v+(this.regionalState?.externalRci[i]||0)),historyRci.map((v,i)=>v+(this.regionalState?.externalRci[i]||0)),this.difficulty,this.map.length,{regional:!!this.regionalState?.externalRci?.some(n=>n>0)}).scores;
  this.demand=generatedDemand.map((value,i)=>accumulateRomDemand(this.demand[i],value,this.tax,this.difficulty,i===0?2000:1500,{suppressPositive:this.growthCaps.suppressed[i]}));
  const services=this.civicEnabled?civicServices(this):null;this.civicWatered=services?.watered;if(services){const flight=aviationBenefits(this);this.demand[1]=Math.max(-1500,this.demand[1]-flight.commercialPenalty);this.demand[2]=Math.max(-1500,Math.min(1500,this.demand[2]+flight.industrialDemand-flight.industrialPenalty));this.demand[0]=Math.min(2000,this.demand[0]+Math.round((this.civic.parkHappiness||0)*3));this.demand[1]=Math.min(1500,this.demand[1]+Math.floor(this.civic.education)+Math.round((this.civic.plazaCommerce||0)*4));this.demand[2]=Math.min(1500,this.demand[2]+Math.floor(this.civic.education));for(let i=0;i<this.traffic.length;i++)if(services.busCoverage[i])this.traffic[i]=Math.floor(this.traffic[i]*.8);if(this.civic.garbage>this.civic.generatedGarbage*3)this.demand[0]=Math.max(-2000,this.demand[0]-100);}
  const displayedPopulation=this.population;this.scanCityTiles();
  this.updateDisasters(false);this.refresh();
  this.baseStep=(this.baseStep+1)&65535;
  if((this.baseStep&3)===0){
   const graphInput={rci:[...this.rci],crime:this.meanCrime||0,pollution:this.meanPollution,net:this.lastBudget?.net||0,facilityCounts:[...this.facilityCounts]};
   if(this.tradeProvider)this.tradeProvider(this);else advanceTradeMonth(this);advanceClimate(this);if(this.regionalProvider)this.regionalState=this.regionalProvider(this);this.updatePower();this.pollution=combineAirPollution(romPollutionField(this.map,this.width,this.height),this.airPollution);updateCivicMonth(this);updateSewageMonth(this);updateLocalHealth(this);updateRailFleet(this,{spawn:true});if(++this.month>12){this.month=1;this.year++;}recordCityGraphMonth(this.graphs,graphInput,{year:this.year,month:this.month},this.map.length);if(this.month===1)recordCityGraphYear(this.graphs,graphInput,this.year,this.map.length);changeRomSeason(this.season,this.month);this.facilityDemand=cityFacilityDemand(this.rci[0],this.facilityCounts,this.map.length);if(this.month===1){this.populationBaseline=displayedPopulation>>>0;this.netMigration=this.populationStats().netMigration;this.pendingBudget={year:this.year,taxRate:Math.floor(this.taxAccumulator/48)};const assessment=this.budget(false,this.pendingBudget.taxRate);this.pendingBudget.assessment={income:assessment.income,giftIncome:assessment.giftIncome,employmentTax:assessment.employmentTax,militaryIndustryIncome:assessment.militaryIndustryIncome,requests:[...assessment.requests]};this.pendingBudget.evaluationInputs=this.cityEvaluationInputs();this.taxAccumulator=0;if(this.autoBudget)this.settleAnnualBudget();}
   this.history.push({year:this.year,month:this.month,population:this.population,rci:[...this.rci],funds:this.funds,crime:this.meanCrime||0});if(this.history.length>240)this.history.shift();
  }
  this.scanGrowthCaps();
  this.checkMilestones();
  this.updatePracticeTutorial();
  this.updateScenarioOutcome();
  if((this.baseStep&3)===1)decayRomGrowthRate(this.growthRate);
  this.traffic=this.traffic.map(decayTraffic);
  this.updateScheduledFields();
  // CODE_038154 calls disaster handling after this pass's field workers.
  let scenarioTriggered=false;
  if(this.disastersEnabled){const e=stepScenarioEvent(this.scenario,this.scenarioRemaining,this.population);this.scenarioRemaining=e.remaining;if(e.event==='Meltdown'){const site=scenarioMeltdownSite(this.map,this.width);if(site){this.disaster(e.event,site.x,site.y);scenarioTriggered=true;}}else if(e.event){const result=this.disaster(e.event);scenarioTriggered=result?.started!==false;}}
  const pollution=this.cityEvaluationInputs().problems[1];
  const randomDisaster=selectRomRandomDisaster({disabled:!this.disastersEnabled,practice:this.scenario==='PracticeCity',difficulty:this.difficulty,pollution,messagePending:scenarioTriggered},max=>this.boundedRandom(max),()=>this.random());
  if(randomDisaster)this.disaster(randomDisaster,undefined,undefined,{randomDisaster:true});
 }
 scanCityTiles(){
  const census={facilityCounts:[0,0],counts:Array(16).fill(0),rci:[0,0,0],unpowered:0,giftStats:{emptyLand:0,parks:0,developedZones:0,banks:0}};
  this.fireCount=0;
  this.serviceInputs={police:new Uint16Array(this.coarseSize),fire:new Uint16Array(this.coarseSize)};
  for(let i=0;i<this.map.length;i++){
   if((this.map[i]&1023)===0x7f)this.fireCount++;
   const disaster=dispatchRomDisasterTile(this.map,i,this.flags,this.fireCoverage,this.floodRemaining,()=>this.random(),max=>this.boundedRandom(max),(x,y,id)=>this.igniteZone(x,y,id),this.width,this.height);
   if(disaster){this.floodRemaining=disaster.remaining;continue;}
   const giftScanId=this.map[i]&1023;if(giftScanId===0)census.giftStats.emptyLand++;if(giftScanId===38||giftScanId===39)census.giftStats.parks++;
   const scanId=this.map[i]&1023;if(this.flags[scanId]&0x20){const wasActive=this.train.active;spawnRomTrain(this.train,scanId,i%this.width,Math.floor(i/this.width),this.quakeFrames);if(!wasActive&&this.train.active){delete this.train.id;delete this.train.passengers;this.train.trail=[];}}
   updateRomTransportTile(this.map,i,this.flags,this.transportStrength,this.traffic[i],()=>this.random(),{shipX:this.ship.x,shipY:this.ship.y},this.width,this.height);
   const id=this.map[i]&1023;if(!(this.flags[id]&1))continue;
   // CODE_0382E5 marks the cell one row and one column after the center.
   const marker=i+this.width+1;if(marker<this.map.length)this.map[marker]|=0x4000;
   // CODE_0390C5 repairs this merged half now, retaining $0B89 for its worker.
   repairMergedZone(this.map,i%this.width,Math.floor(i/this.width),this.width,this.height);
   this.countCensusTile(census,i,id,this.classify(id));
   if(isRomGiftCenter(id)){const gift=updateRomGiftCenter(this.map,i%this.width,Math.floor(i/this.width),this.giftMilestones.mayorUpgradePending||0,{baseStep:this.baseStep,width:this.width,height:this.height});if(gift.pending!==((this.giftMilestones.mayorUpgradePending||0)&65535))this.giftMilestones.mayorUpgradePending=gift.pending;}
   if(isRomUtilityCenter(id)){const utility=updateRomUtilityCenter(this.map,this.flags,i%this.width,Math.floor(i/this.width),max=>this.boundedRandom(max),{baseStep:this.baseStep,difficulty:this.difficulty,allowMeltdown:this.disastersEnabled&&this.disabledBuildings?.[i]!==id,width:this.width,height:this.height});if(utility.meltdown){this.recordEvent(0x08);this.soundEvents.push({port:3,command:0x1e});this.message('Nuclear meltdown reported.');continue;}}
   if(scanId===0x2a5&&(this.map[i]&0x8000)){if(!this.plane.active){if((this.random()&3)===0){spawnRomPlane(this.plane,i%this.width,Math.floor(i/this.width));this.soundEvents.push({port:3,command:12});}}else if(!this.helicopter.active&&(this.random()&7)===0)spawnRomHelicopter(this.helicopter,i%this.width,Math.floor(i/this.width));}
   if(scanId===0x26c&&(this.map[i]&0x8000)&&!this.ship.active)spawnRomShip(this.ship,this.map,max=>this.boundedRandom(max),this.width,this.height);
   if(this.disabledBuildings?.[i]===scanId)continue;addRomServiceCenter(this.serviceInputs.police,this.map,i,this.serviceStrengths[0]*this.policeEffectiveness,'police',this.width,this.height);addRomServiceCenter(this.serviceInputs.fire,this.map,i,this.serviceStrengths[1],'fire',this.width,this.height);
   if(id===0x129||id===0x132){updateRomFacility(this.map,i%this.width,Math.floor(i/this.width),this.facilityDemand,max=>this.boundedRandom(max),{baseStep:this.baseStep,repairPhase:this.facilityRepairPhase,width:this.width,height:this.height});continue;}const z={i,x:i%this.width,y:Math.floor(i/this.width),id,scanId:id,type:this.classify(id)};if(z.type<5||z.type>7)continue;
   if(z.type===5){this.updateResidentialTile(z);continue;}
   this.updateJobZoneTile(z);
  }
  census.map=Uint16Array.from(this.map,n=>n&1023);this.lastScanCensus=census;this.applyCensus(census);return census;
 }
 reconcileGrowthFacilities(){for(const[index,count,limit,text]of[[0,this.counts[10],500,'A stadium is needed for further residential growth.'],[1,this.counts[12],100,'An airport is needed for further commercial growth.'],[2,this.counts[11],70,'A seaport is needed for further industrial growth.']])if(count>0||this.rci[index]<limit){this.growthCaps.suppressed[index]=false;this.notices=this.notices.filter(n=>n!==text);}}
 updateGrowthCaps(){for(let n=0;n<4;n++){this.baseStep=(this.baseStep+1)&65535;this.scanGrowthCaps();}}
 scanGrowthCaps(){const input={zones:this.counts.slice(5,8),roads:this.roadCount,rails:this.railCount,plants:this.zones.filter(z=>z.id===0x28c||z.id===0x27c).length,rci:this.rci,stadiums:this.counts[10],seaports:this.counts[11],airports:this.counts[12]};const advice=scanRomGrowthCaps(this.baseStep,input,this.growthCaps);if(advice>=6&&advice<=8&&this.growthAdviceYear[advice]!==this.year){this.growthAdviceYear[advice]=this.year;const text=['A stadium is needed for further residential growth.','A seaport is needed for further industrial growth.','An airport is needed for further commercial growth.'][advice-6];if(!this.noticeIsDismissed(text))this.message(text);}}
 chooseGift(tool){if(tool!==17&&tool!==19)return false;const i=this.gifts.findIndex(n=>n===17||n===19);if(i<0)return false;this.gifts[i]=tool;return true;}
 checkMilestones(){const event=nextCoreMilestone({population:this.population,category:this.category,police:this.counts[8],fire:this.counts[9],rail:this.railCount,inventorySize:this.gifts.length,practice:this.scenario==='PracticeCity',scriptedScenario:!['PracticeCity','FreeCity','FreeMegacity'].includes(this.scenario),funds:this.funds,roads:this.roadCount,hospitals:this.facilityCounts[0],schools:this.facilityCounts[1],stadiums:this.counts[10],...this.giftStats,airports:this.counts[12],seaports:this.counts[11],year:this.year},this.giftMilestones);if(event){if(event.historyId!=null)this.recordEvent(event.historyId);if(event.gift===null)this.message(event.text);else enqueueRomGift(this.gifts,event.gift);}return event;}
 advance(ms){if(this.pendingBudget||this.ufo.request)return;this.elapsed+=ms*this.speed;while(this.elapsed>=750&&!this.pendingBudget){this.elapsed-=750;this.stepSimulation();}if(this.pendingBudget)this.elapsed=0;}
 advanceVisualFrames(frames,blocked=false,{mapView=false,airTrafficView=false}={}){if(blocked||frames<=0)return;advanceAviation(this,frames,blocked||(mapView&&!airTrafficView));advanceTransitFleet(this,frames,blocked);if(!blocked)this.civic.busFrame=(this.civic.busFrame||0)+frames;for(let n=0;n<frames;n++){advanceRomSeason(this.season);if(this.ufo.request){this.advanceUfoFrame(blocked);this.quakePhase=this.quakePhase>=23?0:this.quakePhase+1;continue;}if((this.quakePhase&3)===0){const event=stepRomPlane(this.plane,this.map,()=>this.menuRandom(),{phase:this.quakePhase,width:this.width,height:this.height,paused:blocked,mapView,disastersEnabled:this.disastersEnabled,other:this.helicopter});if(event.engine)this.soundEvents.push({port:3,command:12});if(event.crashed){applyRomShipCollision(this.map,this.flags,this.plane.x,this.plane.y,()=>this.menuRandom(),this.width,this.height);this.recordEvent(9);this.soundEvents.push({port:3,command:15});this.focusRequest={x:this.plane.x,y:this.plane.y};this.message('A plane crashed.');this.refresh();}}const heliEvent=stepRomHelicopter(this.helicopter,this.map,()=>this.menuRandom(),{phase:this.quakePhase,mapView,width:this.width,height:this.height,newsBusy:this.helicopterNewsFrames>0});if(heliEvent.trafficReport){this.helicopterNewsFrames=heliEvent.messageFrames;this.focusRequest={x:heliEvent.x,y:heliEvent.y,source:'helicopter-traffic'};this.message('The helicopter reports heavy traffic here.');}if(this.helicopterNewsFrames>0)this.helicopterNewsFrames--;if(this.quakeFrames){this.quakeFrames--;for(const train of trainVehicles(this))train.active=false;}if((this.quakePhase&7)===1){const event=stepRomShip(this.ship,this.map,()=>this.menuRandom(),{width:this.width,height:this.height,paused:blocked});if(event.horn){this.soundEvents.push({port:3,command:5});if(this.soundEvents.length>16)this.soundEvents.shift();}if(event.navigation==='collision'){applyRomShipCollision(this.map,this.flags,event.collision.x,event.collision.y,()=>this.menuRandom(),this.width,this.height);this.recordEvent(0x10);this.message('A ship collided.');this.refresh();}}if((this.quakePhase&7)===3){const event=stepRomMonster(this.monster,this.map,this.flags,()=>this.menuRandom(),{phase:this.quakePhase,width:this.width,height:this.height,paused:blocked,onTileCross:(x,y)=>{let changed=false;if(this.ship.active&&x===this.ship.x&&y===this.ship.y){this.ship.active=false;applyRomShipCollision(this.map,this.flags,x,y,()=>this.menuRandom(),this.width,this.height);this.recordEvent(0x10);this.message('A ship collided.');return true;}for(const train of trainVehicles(this))if(x===(train.x>>>3)&&y===(train.y>>>3)){train.active=false;applyRomTrainCollision(this.map,this.flags,x,y,()=>this.menuRandom(),this.width,this.height);changed=true;}return changed;}});if(event.roar)this.soundEvents.push({port:3,command:1});if(event.changed)this.refresh();}if((this.quakePhase&7)===7){const event=stepRomTornado(this.tornado,this.map,this.flags,()=>this.menuRandom(),{width:this.width,height:this.height,paused:blocked});if(event.changed)this.refresh();}if(!blocked&&(this.quakePhase&7)===6)advanceRailFleet(this);this.quakePhase=this.quakePhase>=23?0:this.quakePhase+1;}}
 advanceUfoFrame(blocked=false){if(blocked)return;const s=this.ufo,event=stepRomUfo(s,this.map,this.flags,()=>this.menuRandom(),{width:this.width,height:this.height,cameraX:Math.max(0,s.targetX-16),cameraY:Math.max(0,s.targetY-14)});if(event.focus)this.focusRequest=event.focus;else if(s.focusFrames>0)s.focusFrames--;if(event.sound)this.soundEvents.push({port:3,command:event.sound});if(event.damage)this.refresh();if(!s.activeWord&&this.ufoCampaign){const campaign=this.ufoCampaign;campaign.index++;if(campaign.index<(campaign.repeat?3:9))startRomUfoVisit(s,campaign.index,max=>this.boundedRandom(max),campaign.repeat,this.width,this.height);else{s.request=0;this.ufoCampaign=null;this.recordEvent(0x14);this.message('The UFO has departed.');}}}
 recordEvent(id){recordRomHistory(this.eventHistory,id,this.year,this.month);}
 disaster(type,x=60,y=50,options={}){
  if(!this.disastersEnabled)return {started:false,disabled:true};
  if(type==='Plane crash'){if(!this.plane.active){this.message('No aircraft is currently in flight.');return {started:false};}this.plane.crashRequested=true;return {started:true};}
  if(type==='UFO'){if(this.ufo.request)return {started:false};this.ufoCampaign={index:0,repeat:this.ufoVisited};this.ufoVisited=true;startRomUfoVisit(this.ufo,0,max=>this.boundedRandom(max),this.ufoCampaign.repeat,this.width,this.height);this.message('A UFO is approaching the city.');return {started:true};}
  if(type==='Monster'){const started=startRomMonster(this.monster,this.pollutionTarget.x,this.pollutionTarget.y,max=>this.boundedRandom(max),this.width,this.height);if(started){this.focusRequest={x:this.monster.x,y:this.monster.y};this.recordEvent(7);this.message('A monster is crossing the city.');}return {started};}
  if(type==='Tornado'){const started=startRomTornado(this.tornado,max=>this.boundedRandom(max),this.width,this.height);if(started){this.focusRequest={x:this.tornado.x,y:this.tornado.y};this.recordEvent(0x0a);this.soundEvents.push({port:3,command:0x22});this.message('A tornado is crossing the city.');}return {started};}
  if(type==='Flood'){const result=startRomFlood(this.map,this.flags,max=>this.boundedRandom(max),this.width,this.height);if(result.started){this.floodRemaining=result.remaining;this.recordEvent(0x0c);this.message('Flood reported.');this.refresh();}else this.message('No vulnerable shoreline found.');return result;}
  if(type==='Earthquake'){const result=applyRomEarthquake(this.map,this.flags,max=>this.boundedRandom(max),this.width,this.height);this.quakeFrames=result.attempts;this.recordEvent(0x0e);this.message('Earthquake reported.');this.refresh();return result;}
  if(type==='Meltdown'){const result=applyRomMeltdown(this.map,this.flags,x,y,max=>this.boundedRandom(max),this.width,this.height);this.recordEvent(0x08);this.soundEvents.push({port:3,command:0x1e});this.message('Nuclear meltdown reported.');this.refresh();return result;}
  if(type==='Fire'){const result=startRomFire(this.map,this.flags,max=>this.boundedRandom(max),{...options,width:this.width,height:this.height});if(result.started){this.fireCount=(this.fireCount+1)&65535;this.recordEvent(0x0b);this.soundEvents.push({port:3,command:0x21});this.message('Fire reported.');this.refresh();}else if(!options.randomDisaster)this.message('No vulnerable fire site found.');return result;}
  this.disasters.push({type,x,y,life:type==='Earthquake'?1:16});this.message(`${type} reported. Emergency services are responding.`);
  if(type==='Fire')this.map[y*this.width+x]=0x2e;
  this.updateDisasters();this.refresh();

  this.updateScenarioOutcome();
 }
 igniteZone(x,y,id){burnRomZone(this.map,y*this.width+x,this.flags,this.width,this.height);}
 updateDisasters(scanTiles=true){
  if(scanTiles)for(let i=0;i<this.map.length;i++){const result=dispatchRomDisasterTile(this.map,i,this.flags,this.fireCoverage,this.floodRemaining,()=>this.random(),max=>this.boundedRandom(max),(x,y,id)=>this.igniteZone(x,y,id),this.width,this.height);if(result)this.floodRemaining=result.remaining;}
  for(const d of this.disasters){
   let radius=d.type==='Earthquake'?18:d.type==='Meltdown'?8:d.type==='Flood'?4:2;
   for(let n=0;n<(d.type==='Earthquake'?100:12);n++){
    const x=clamp(d.x+(this.random()%(radius*2+1))-radius,0,this.width-1),y=clamp(d.y+(this.random()%(radius*2+1))-radius,0,this.height-1),i=y*this.width+x,t=this.map[i]&1023;
    if(d.type==='Flood'){if(t!==0&&t<0x26)this.map[i]=1;}
    else if(t>3)this.map[i]=d.type==='Meltdown'?0x7f:d.type==='Fire'?0x2e:0x2a;
   }
   if(d.type==='Tornado'||d.type==='Monster'||d.type==='UFO'){d.x=clamp(d.x+(this.random()%7)-3,3,this.width-4);d.y=clamp(d.y+(this.random()%7)-3,3,this.height-4);}
   if(d.type==='Fire'&&this.boundedRandom(fireBurnoutMaximum(Math.min(255,this.fireCoverage?.[d.y*this.width+d.x]||0)))===0){this.map[d.y*this.width+d.x]=0x28;d.life=0;}
   d.life--;
  }
  this.disasters=this.disasters.filter(d=>d.life>0);
 }
 serialize(){return JSON.stringify({version:1,disabledBuildings:this.disabledBuildings||{},financialClearedAtZero:!!this.financialClearedAtZero,financialEmergency:!!this.financialEmergency,resourceSeed:this.resourceSeed,regionalPolicy:normalizeSharing(this.regionalPolicy),nativeGrowthRules:this.nativeGrowthRules,transit:serializeTransit(this),fireCoverageVersion:1,careerFlags:this.careerFlags,scenarioEnding:this.scenarioEnding,practiceTutorial:this.practiceTutorial,terrainSource:this.terrainSource,populationMode:this.wideCensus?'wide':'word',scanCensus:this.lastScanCensus&&this.map.every((n,i)=>(n&1023)===this.lastScanCensus.map[i])?{counterMode:this.wideCensus?'wide':'word',rci:this.lastScanCensus.rci,counts:this.lastScanCensus.counts,facilityCounts:this.lastScanCensus.facilityCounts,unpowered:this.lastScanCensus.unpowered,giftStats:this.lastScanCensus.giftStats}:null,width:this.width,height:this.height,zoneGrowthLog:this.zoneGrowthLog,growthRate:Array.from(this.growthRate),civicLayoutVersion:3,civicLegacyLayouts:this.civicLegacyLayouts,civicEnabled:this.civicEnabled,civic:this.civic,pipes:Array.from(this.pipes),busStops:Array.from(this.busStops),terraform:Array.from(this.terraform),elevation:Array.from(this.elevation),seaPollution:Array.from(this.seaPollution),climate:this.climate,airPollutionQ8:Array.from(this.airPollution,n=>Math.round(n*256)),disastersEnabled:this.disastersEnabled,dismissedNotices:this.dismissedNotices,tornado:this.tornado,monster:this.monster,plane:this.plane,ufo:this.ufo,ufoCampaign:this.ufoCampaign,ufoVisited:this.ufoVisited,helicopter:this.helicopter,helicopterNewsFrames:this.helicopterNewsFrames,pollutionTarget:this.pollutionTarget,season:this.season,policeEffectiveness:this.policeEffectiveness,populationBaseline:this.populationBaseline,netMigration:this.netMigration,facilityDemand:this.facilityDemand,facilityRepairPhase:this.facilityRepairPhase,score:this.score,scoreChange:this.scoreChange,evaluation:this.evaluation,fireCount:this.fireCount,commercialRate:Array.from(this.commercialRate),eventHistory:this.eventHistory,train:this.train,extraTrains:this.extraTrains,nextTrainId:this.nextTrainId,railSeed:this.railSeed,transportStrength:this.transportStrength,ship:this.ship,floodRemaining:this.floodRemaining,disasters:this.disasters,quakeFrames:this.quakeFrames,quakePhase:this.quakePhase,autoBudget:this.autoBudget,pendingBudget:this.pendingBudget,lastBudget:this.lastBudget,serviceStrengths:this.serviceStrengths,allocatedFunding:this.allocatedFunding,serviceInputs:this.serviceInputs?{police:Array.from(this.serviceInputs.police),fire:Array.from(this.serviceInputs.fire)}:null,fieldState:Object.fromEntries(['terrain','pollution','crime','landValue','density','policeCoverage','fireCoverage'].map(k=>[k,Array.from(k==='landValue'&&this.parkLandBase?this.parkLandBase:this[k])])),centerX:this.centerX,centerY:this.centerY,fieldEpochs:this.fieldEpochs,meanCrime:this.meanCrime,meanLandValue:this.meanLandValue,elapsed:this.elapsed,speed:this.speed,baseStep:this.baseStep,growthCaps:this.growthCaps,growthAdviceYear:this.growthAdviceYear,demand:this.demand,giftMilestones:this.giftMilestones,simulationRng:this.simulationRng,traffic:Array.from(this.traffic),scenarioRemaining:this.scenarioRemaining,scenarioStage:this.scenarioStage,scenarioEvaluationDeferred:this.scenarioEvaluationDeferred,scenarioDecision:this.scenarioDecision,scenarioResult:this.scenarioResult,scenarioReminders:this.scenarioReminders,scenarioDialogSeen:this.scenarioDialogSeen,map:Array.from(this.map),name:this.name,scenario:this.scenario,year:this.year,month:this.month,funds:this.funds,infiniteMoney:!!this.infiniteMoney,difficulty:this.difficulty,tax:this.tax,taxAccumulator:this.taxAccumulator,funding:this.funding,rngA:this.rngA,rngB:this.rngB,history:this.history,graphs:this.graphs,meanPollution:this.meanPollution,loans:this.loans,loan:this.loan,gifts:this.gifts});}
 static restore(text,build,flags){const s=JSON.parse(text);if(s.version!==1||!Array.isArray(s.map)||s.map.length!==(s.width??120)*(s.height??100)||s.map.some(n=>!Number.isInteger(n)||n<0||n>65535))throw Error('This is not a supported city save.');const c=new City(s.map,build,flags,{...s,restoring:true});if(s.eventHistory===undefined)c.eventHistory=[];for(const k of ['civicEnabled','civic','climate','dismissedNotices','tornado','monster','plane','helicopter','helicopterNewsFrames','ufo','ufoCampaign','ufoVisited','pollutionTarget','season','populationBaseline','netMigration','facilityDemand','facilityRepairPhase','score','scoreChange','evaluation','fireCount','eventHistory','train','extraTrains','nextTrainId','railSeed','transportStrength','ship','floodRemaining','disasters','quakeFrames','quakePhase','autoBudget','pendingBudget','lastBudget','serviceStrengths','allocatedFunding','centerX','centerY','fieldEpochs','meanCrime','meanLandValue','elapsed','speed','baseStep','growthCaps','growthAdviceYear','demand','giftMilestones','simulationRng','scenarioRemaining','scenarioResult','scenarioReminders','scenarioDialogSeen','month','funds','tax','taxAccumulator','funding','rngA','rngB','history','gifts'])if(s[k]!==undefined)c[k]=s[k];if(Array.isArray(s.growthRate)&&s.growthRate.length===c.coarseSize)c.growthRate=Int16Array.from(s.growthRate);c.zoneGrowthLog=Object.fromEntries(Object.entries(s.zoneGrowthLog||{}).filter(([i,e])=>Number.isInteger(+i)&&+i>=0&&+i<c.map.length&&e&&typeof e==='object'&&[5,6,7].includes(e.type)&&Number.isInteger(e.year)&&Number.isInteger(e.month)).slice(0,6000));c.civicLegacyLayouts=s.civicLegacyLayouts||{};if((s.civicLayoutVersion||0)<3)for(let i=0;i<c.map.length;i++)if((c.map[i]&1023)===969)c.civicLegacyLayouts[i]={width:3,height:3};if(s.civicLayoutVersion!==2)for(let i=0;i<c.map.length;i++)if([964,965,966,968].includes(c.map[i]&1023))c.civicLegacyLayouts[i]={width:3,height:3};if(Array.isArray(s.airPollutionQ8)&&s.airPollutionQ8.length===c.width*c.height)c.airPollution=Float32Array.from(s.airPollutionQ8,n=>clamp(Number(n)||0,0,64000)/256);if(Array.isArray(s.seaPollution)&&s.seaPollution.length===c.width*c.height)c.seaPollution=Uint8Array.from(s.seaPollution);if(Array.isArray(s.elevation)&&s.elevation.length===c.width*c.height)c.elevation=Int8Array.from(s.elevation,n=>clamp(Number(n)||0,-4,16));if(Array.isArray(s.terraform)&&s.terraform.length===c.width*c.height)c.terraform=Uint8Array.from(s.terraform);if(Array.isArray(s.busStops)&&s.busStops.length===c.width*c.height)c.busStops=Uint8Array.from(s.busStops);if(Array.isArray(s.pipes)&&s.pipes.length===c.width*c.height)c.pipes=Uint8Array.from(s.pipes);if(Array.isArray(s.traffic)&&s.traffic.length===c.width*c.height)c.traffic=Uint8Array.from(s.traffic);if(s.fieldState)for(const k of ['terrain','pollution','crime','landValue','density','policeCoverage','fireCoverage'])if(Array.isArray(s.fieldState[k])&&s.fieldState[k].length===c.width*c.height)c[k]=(k.endsWith('Coverage')?Uint16Array:Uint8Array).from(s.fieldState[k]);if(s.serviceInputs&&['police','fire'].every(k=>Array.isArray(s.serviceInputs[k])&&s.serviceInputs[k].length===c.coarseSize))c.serviceInputs={police:Uint16Array.from(s.serviceInputs.police),fire:Uint16Array.from(s.serviceInputs.fire)};if(Array.isArray(s.commercialRate)&&s.commercialRate.length===c.coarseSize)c.commercialRate=Int16Array.from(s.commercialRate);c.loans=(Array.isArray(s.loans)?s.loans:s.loan?[s.loan]:[]).slice(0,3).filter(l=>l&&Number.isInteger(l.years)&&l.years>0&&Number.isFinite(l.payment)&&l.payment>0).map(l=>({...l}));c.dismissedNotices=Array.isArray(c.dismissedNotices)?c.dismissedNotices.map(n=>typeof n==='string'?{text:n,year:c.year}:n).filter(n=>n&&typeof n.text==='string'&&Number.isInteger(n.year)):[];if(s.pollutionTarget===undefined)c.pollutionTarget=monsterPollutionTarget(c.pollution,c.pollutionTarget,c.width,c.height);c.plane={...createRomPlane(),...c.plane};c.helicopter={...createRomHelicopter(),...c.helicopter};c.ufo={...createRomUfo(),...c.ufo};c.monster={...createRomMonster(),...c.monster};c.tornado={...createRomTornado(),...c.tornado};c.ship={...createRomShip(),...c.ship};if(s.scanCensus&&(!c.wideCensus||s.scanCensus.counterMode==='wide')&&[[s.scanCensus.rci,3,c.wideCensus?c.map.length*48:65535],[s.scanCensus.counts,16,65535],[s.scanCensus.facilityCounts,2,65535]].every(([a,n,max])=>Array.isArray(a)&&a.length===n&&a.every(v=>Number.isInteger(v)&&v>=0&&v<=max))&&Number.isInteger(s.scanCensus.unpowered)&&s.scanCensus.unpowered>=0&&s.scanCensus.unpowered<=c.map.length)c.lastScanCensus={...s.scanCensus,giftStats:s.scanCensus.giftStats&&['emptyLand','parks','developedZones','banks'].every(k=>Number.isInteger(s.scanCensus.giftStats[k])&&s.scanCensus.giftStats[k]>=0&&s.scanCensus.giftStats[k]<=c.map.length)?s.scanCensus.giftStats:undefined,map:Uint16Array.from(c.map,n=>n&1023)};c.scenarioReminders=Array.isArray(c.scenarioReminders)?c.scenarioReminders.filter(n=>Number.isInteger(n)&&n>=1&&n<=5).slice(0,5):[];if(!['won','lost'].includes(c.scenarioResult))c.scenarioResult=null;c.scenarioStage=c.scenarioResult?6:Number.isInteger(s.scenarioStage)&&s.scenarioStage>=0&&s.scenarioStage<6?s.scenarioStage:Math.min(5,c.scenarioReminders.length);c.scenarioEvaluationDeferred=!!SCENARIO_DEADLINES[c.scenario]&&!!c.pendingBudget&&s.scenarioEvaluationDeferred!==false;const decision=s.scenarioDecision;if(decision&&['won','lost'].includes(decision.result)&&decision.result===c.scenarioResult&&['year','category','traffic','crime','score'].every(k=>Number.isInteger(decision[k])&&decision[k]>=0&&decision[k]<=(k==='category'?5:k==='score'?1000:k==='year'?10000000:65535)))c.scenarioDecision=Object.fromEntries(['year','category','traffic','crime','score','result'].map(k=>[k,decision[k]]));c.practiceTutorial=restorePracticeTutorial(s.practiceTutorial,c.year,c.month);if(c.scenario==='PracticeCity'&&c.practiceTutorial.pendingId!==null)c.message(practiceNotice(c.practiceTutorial.pendingId));const ending=s.scenarioEnding,endingIndex=SCENARIO_IDS.indexOf(c.scenario);if(ending&&endingIndex>=0&&c.scenarioResult&&validCareerFlags(ending.before)){const expected=scenarioEnding(ending.before,endingIndex,c.scenarioResult==='won'?2:1);if(['before','flags','screen','music'].every(k=>ending[k]===expected[k])){c.scenarioEnding=expected;c.careerFlags|=expected.flags;}}c.graphs=restoreCityGraphs(s.graphs,c.map.length);c.meanPollution=Number.isFinite(s.meanPollution)?Math.max(0,Math.min(255,Math.floor(s.meanPollution))):meanGraphPollution(c.pollution,c.width,c.height);c.refresh();if(s.populationBaseline===undefined||(c.wideCensus&&s.populationMode!=='wide')){c.populationBaseline=c.population;c.netMigration=0;}else if(s.netMigration!==undefined)c.netMigration=c.wideCensus?c.populationStats().netMigration:s.netMigration|0;if(s.policeEffectiveness===undefined)c.setPoliceEffectiveness(2);if(s.season===undefined)c.season=createRomSeason(c.month);if(!s.fireCoverageVersion)c.updateFireField();restoreTransit(c,s.transit);if(s.transit)c.refresh();return c;}
}































