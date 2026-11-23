import {AMENITY_TOOLS} from './amenities.js?v=amenities-gifts-29';
import {educationCoverage} from './education.js?v=approaches-56';
import {allocateWater,updateWaterStorage} from './water-allocation.js?v=approaches-56';
import {landfillSites,garbageFacilities,collectGarbage,monthlyGarbageDemand} from './landfill.js?v=health-care-34';
import {buildingOff} from './building-operations.js?v=approaches-56';
// Custom civic systems requested by the player. Values are game balance, not ROM-derived.
export const CIVIC_TOOLS=[
 ...AMENITY_TOOLS,
 {tool:8,id:977,name:"Police",icon:"🛡",cost:500,annual:0,kind:"police",size:2,nativeTool:8},
 {tool:9,id:978,name:"Fire station",icon:"🚒",sprite:60,cost:500,annual:0,kind:"fire",size:2,nativeTool:9},
 {tool:30,id:960,name:'Hospital',icon:'🏥',cost:1000,annual:250,kind:'health',capacity:5000,healthRadius:24,ambulances:3},
 {tool:31,id:961,name:'Landfill tile',icon:'🗑',cost:50,annual:10,kind:'garbage',capacity:1000,size:1},
 {tool:32,id:962,name:'Incinerator',icon:'♨',cost:3000,annual:400,kind:'garbage',capacity:6000},
 {tool:33,id:963,name:'Fusion plant',icon:'⚛',cost:50000,annual:1000,kind:'power',capacity:10000},
 {tool:34,id:964,name:'School',icon:'🏫',cost:500,annual:150,kind:'education',capacity:6000,radius:20,strength:1,size:1},
 {tool:35,id:965,name:'College',icon:'🎓',cost:2000,annual:300,kind:'education',capacity:12000,radius:32,strength:1,width:2,height:1},
 {tool:36,id:966,name:'University',icon:'🏛',cost:5000,annual:600,kind:'education',capacity:25000,radius:48,strength:1,size:4},
 {tool:77,id:1005,name:'Nursery',icon:'🧸',cost:200,annual:60,kind:'education',capacity:1500,radius:14,strength:.45,size:1,sprite:43},
 {tool:78,id:1006,name:'Preschool',icon:'🧩',cost:350,annual:100,kind:'education',capacity:3000,radius:20,strength:.65,width:1,height:2,sprite:44},
 {tool:79,id:1007,name:'Library',icon:'📚',cost:700,annual:140,kind:'education',capacity:6000,radius:30,strength:.7,size:2,sprite:45},
 {tool:80,id:1008,name:'Private school',icon:'🏫',cost:1500,annual:300,kind:'education',capacity:10000,radius:32,strength:1.15,size:2,sprite:46},
 {tool:81,id:1009,name:'Special school',icon:'🏫',cost:1200,annual:250,kind:'education',capacity:5000,radius:28,strength:1.1,width:2,height:3,sprite:47},
 {tool:37,id:967,name:'Bus stop',icon:'🚏',cost:25,annual:5,kind:'bus',capacity:500,size:1},
 {tool:38,id:968,name:'Bus station',icon:'🚌',cost:1000,annual:200,kind:'bus',capacity:5000,size:1},
 {tool:39,id:969,name:'Water pump',icon:'💧',cost:500,annual:100,kind:'water',capacity:5000,size:2},
 {tool:60,id:988,name:'Water tower',icon:'🗼',cost:1000,annual:50,kind:'waterStorage',capacity:20000,flow:5000,width:1,height:2,sprite:26},
 {tool:61,id:989,name:'Heavy water pump',icon:'💦',cost:1500,annual:250,kind:'water',capacity:15000,size:3,sprite:27},
 {tool:62,id:990,name:'Solar power array',icon:'☀',cost:5000,annual:100,kind:'power',capacity:1000,size:2,sprite:28},
 {tool:63,id:991,name:'Municipal airport',icon:'🛩',cost:5000,annual:500,kind:'airport',capacity:1200,cargo:0,size:4,sprite:29},
 {tool:64,id:992,name:'International airport',icon:'✈',cost:50000,annual:4000,kind:'airport',capacity:15000,cargo:5000,width:24,height:18,sprite:30},
 {tool:65,id:993,name:'Military airbase',icon:'🛫',cost:20000,annual:1500,kind:'military',capacity:6,size:8,sprite:31},
 {tool:66,id:994,name:'Pocket garden',icon:'🌷',cost:25,annual:5,kind:'park',size:1,radius:12,landBonus:14,happiness:10,sprite:32},
 {tool:67,id:995,name:'Neighbourhood park',icon:'🌳',cost:100,annual:20,kind:'park',size:2,radius:20,landBonus:24,happiness:16,sprite:33},
 {tool:68,id:996,name:'City park',icon:'🌲',cost:750,annual:80,kind:'park',size:4,radius:32,landBonus:42,happiness:28,sprite:34},
 {tool:69,id:997,name:'Civic plaza',icon:'⛲',cost:500,annual:60,kind:'park',size:3,radius:24,landBonus:34,happiness:20,commerce:30,sprite:35},
 {tool:41,id:972,name:'Wind turbine',icon:'🌬',cost:1000,annual:40,kind:'power',capacity:200,width:2,height:1,sprite:12,artHeight:24},
 {tool:44,id:973,name:'Sewage pump',icon:'🚰',cost:800,annual:150,kind:'sewage',capacity:8000,sprite:13},
 {tool:45,id:974,name:'Sewage treatment',icon:'♻',cost:5000,annual:800,kind:'treatment',capacity:20000,size:4,sprite:14},
 {tool:49,id:975,name:'Recycling centre',icon:'♻',cost:2000,annual:250,kind:'garbage',capacity:4000,size:2,sprite:15},
 {tool:50,id:976,name:'Garbage collection depot',icon:'🚛',cost:1000,annual:150,kind:'collection',capacity:12000,size:2,sprite:16},
 {tool:51,id:979,name:'Pharmacy',icon:'⚕',cost:200,annual:50,kind:'health',capacity:500,size:1,sprite:17,healthRadius:12,ambulances:1},
 {tool:52,id:980,name:'Surgery',icon:'⚕',cost:700,annual:150,kind:'health',capacity:2500,size:2,sprite:18,healthRadius:18,ambulances:1},
 {tool:53,id:981,name:'Medical centre',icon:'🏥',cost:900,annual:200,kind:'health',capacity:3500,width:2,height:3,sprite:19,healthRadius:22,ambulances:2},
 {tool:54,id:982,name:'Clinic',icon:'⚕',cost:400,annual:100,kind:'health',capacity:1500,width:1,height:2,sprite:20,healthRadius:16,ambulances:1},
 {tool:40,id:970,name:'Water pipe',icon:'🔵',cost:2,annual:0,kind:'pipe',size:1}
];
export function installCivicTools(build,flags){build.nativeEmergencyBuildings??=Object.fromEntries([8,9].map(tool=>[tool,structuredClone(build.buildings[tool])]));for(const b of CIVIC_TOOLS){if(b.kind==='pipe')continue;const width=b.width||b.size||3,height=b.height||b.size||3,center=Math.floor(height/2)*width+Math.floor(width/2);build.buildings[b.tool]={id:b.tool,tiles:Array.from({length:width*height},(_,i)=>i===center?b.id:971),x:Array.from({length:width*height},(_,i)=>i%width),y:Array.from({length:width*height},(_,i)=>Math.floor(i/width))};flags[b.id]=b.nativeTool?0x85:0x81;build.costs[b.tool]=b.cost;}flags[971]=0x80;build.buildings[40]={id:40,tiles:[0],x:[0],y:[0]};build.costs[40]=2;}
const CIVIC_BY_ID=new Map(CIVIC_TOOLS.map(b=>[b.id,b]));
export const civicForId=id=>CIVIC_BY_ID.get(id);
// Budget/HUD callers need only upkeep, not water-network allocation, bus BFS
// and waste-service calculations. This is the same enabled-facility total.
export function civicAnnualCost(city){let annual=0;for(const z of city.zones){if(z.id<960||buildingOff(city,z))continue;annual+=civicForId(z.id)?.annual||0;}return annual;}
export function civicServices(city){const landfills=landfillSites(city),garbage=garbageFacilities(city,civicRoadEntry);const capacity={health:0,garbage:0,education:0,bus:0,water:0},stations=[],stops=[],pumps=[];let annual=0,fusion=0;for(const z of city.zones){const b=civicForId(z.id);if(!b||buildingOff(city,z))continue;annual+=b.annual;const operational=b.id===961?!!landfills.sites[landfills.labels.get(z.i)]?.roadConnected:['water','waterStorage'].includes(b.kind)?pumpStatus(city,z).working:[973,974].includes(b.id)?utilityPipeStatus(city,z).working:(b.kind==='power'||b.id===961||b.id===967||city.power[z.i])&&civicRoadEntry(city,z)>=0;if(b.kind==='power'){fusion+=b.capacity;continue;}if(!operational)continue;if(b.kind in capacity)capacity[b.kind]+=b.id===961?Math.min(1000,Math.max(0,10000-(city.civic.landfillUsed?.[z.i]||0))):b.capacity||0;if(b.id===967)stops.push(z);if(b.id===968)stations.push(z);if(['water','waterStorage'].includes(b.kind))pumps.push({...z,capacity:b.kind==='water'?b.capacity:0,storage:b.kind==='waterStorage'?b.capacity:0,flow:b.flow||0});}
 const {water,watered,networks:waterNetworks,assignments:waterAssignments}=waterService(city,pumps);

 const routes=busRoutes(city,stations,stops),served=new Set(routes.flat());const busCoverage=new Uint8Array(city.map.length);if(routes.length)for(const stop of [...stops,...stations].filter(z=>[...served].some(i=>Math.abs(i%(city.width||120)-z.x)+Math.abs(Math.floor(i/(city.width||120))-z.y)<=3)))for(let dy=-8;dy<=8;dy++)for(let dx=-8;dx<=8;dx++){const x=stop.x+dx,y=stop.y+dy;if(x>=0&&x<(city.width||120)&&y>=0&&y<(city.height||100)&&Math.abs(dx)+Math.abs(dy)<=8)busCoverage[y*(city.width||120)+x]=1;}
 return {garbageFacilities:garbage,pumpStatuses:city.zones.filter(z=>['water','waterStorage'].includes(civicForId(z.id)?.kind)).map(z=>({x:z.x,y:z.y,...pumpStatus(city,z)})),capacity,annual,fusion,water,watered,waterNetworks,waterAssignments,busCoverage,routes,buses:stations.length?Math.min(stops.length+stations.length,Math.ceil(capacity.bus/500)):0};}
export function updateCivicMonth(city){if(!city.civicEnabled)return;const s=civicServices(city);updateWaterStorage(city,s.waterNetworks);city.civicWatered=s.watered;city.waterField=s.water;city.waterAssignments=s.waterAssignments;city.waterNetworks=s.waterNetworks;const external=city.regionalState||{},effects=educationEffects(city.civic.education),demand=monthlyGarbageDemand(city,effects.wasteReduction);city.civicCapacity=s.capacity;collectGarbage(city,demand,s.garbageFacilities);const healthCap=s.capacity.health+(external.health||0);city.civic.health=city.population?Math.min(100,Math.round(healthCap/city.population*100+100*effects.sicknessReduction)):100;city.civic.sickness=100-city.civic.health;const educationTarget=educationCoverage(city).target;city.civic.educationTarget=educationTarget;city.civic.education=Math.max(0,Math.min(100,city.civic.education+(educationTarget-city.civic.education)/12));const zones=city.zones.filter(z=>z.type>=5&&z.type<=7);city.civic.water=zones.length?Math.round(zones.filter(z=>s.watered.has(z.i)).length/zones.length*100):100;city.busRoutes=s.routes;city.civic.buses=s.routes.length;city.civic.generatedGarbage=demand;}
// Buses use actual road paths between a powered depot and road-connected stops.
export function busRoutes(city,stations,stops){
 const width=city.width||120,length=city.map.length,routes=[];
 if(!stations.length||!stops.length)return routes;
 // Entry order and N/E/S/W discovery order determine the original routes.
 // Once all stops have parents, the rest of the component cannot change
 // their paths. An unreachable stop still requires the complete search.
 const ends=stops.map(z=>civicRoadEntry(city,z)),targets=new Set(ends.filter(i=>i>=0));
 if(!targets.size)return routes;
 for(const station of stations){
  const root=civicRoadEntry(city,station);if(root<0)continue;
  const parent=new Int32Array(length).fill(-1),queue=[root];parent[root]=root;
  let remaining=targets.size-Number(targets.has(root));
  const visit=(from,to)=>{
   if(to<0||parent[to]>=0||!(city.flags[city.map[to]&1023]&64))return;
   parent[to]=from;queue.push(to);if(targets.has(to))remaining--;
  };
  for(let at=0;at<queue.length&&remaining>0;at++){
   const i=queue[at];
   visit(i,i>=width?i-width:-1);
   visit(i,i%width<width-1?i+1:-1);
   visit(i,i+width<length?i+width:-1);
   visit(i,i%width?i-1:-1);
  }
  for(const end of ends){
   if(end<0||parent[end]<0)continue;
   const path=[end];while(path.at(-1)!==root)path.push(parent[path.at(-1)]);
   if(path.length>1)routes.push([...path,...path.slice(1,-1).reverse()]);
   if(routes.length>=32)return routes;
  }
 }
 return routes;
}

export function waterService(city,pumps){return allocateWater(city,waterNetwork(city).nodes,pumps);}

export function civicRoadEntry(city,z){const b=civicForId(z.id),reach=Math.max(2,Math.ceil(Math.max(b?.width||b?.size||3,b?.height||b?.size||3)/2)+1);for(let radius=0;radius<=reach;radius++)for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;const x=z.x+dx,y=z.y+dy,i=y*(city.width||120)+x;if(x>=0&&x<(city.width||120)&&y>=0&&y<(city.height||100)&&(city.flags[city.map[i]&1023]&64))return i;}return -1;}

export function civicBounds(z){const b=civicForId(z.id);if(!b)return null;const width=z.layout?.width||b.width||b.size||3,height=z.layout?.height||b.height||b.size||3;return {x:z.x-Math.floor(width/2),y:z.y-Math.floor(height/2),width,height};}

export function educationEffects(level){const education=Math.max(0,Math.min(100,Number(level)||0));return {crimeReduction:education/400,wasteReduction:education/400,sicknessReduction:education/500,productivity:1+education/400};}

export function utilityPipeStatus(city,z){const powered=!buildingOff(city,z)&&!!city.power[z.i],b=civicBounds(z);let intake=false,connected=false;const waterPoints=[],pipePoints=[];for(let y=b.y-1;y<=b.y+b.height;y++)for(let x=b.x-1;x<=b.x+b.width;x++){if(x<0||x>=(city.width||120)||y<0||y>=(city.height||100))continue;const corner=(x===b.x-1||x===b.x+b.width)&&(y===b.y-1||y===b.y+b.height),i=y*(city.width||120)+x,id=city.map[i]&1023;if(id>=1&&id<20){intake=true;waterPoints.push(i);}if(city.pipes[i]&&!corner){connected=true;pipePoints.push(i);}}return {powered,intake,connected,waterPoints,pipePoints,working:powered&&connected,reason:!powered?'Needs electricity':!connected?'Connect a pipe':'Connected'};}
export function pumpStatus(city,z){const s=utilityPipeStatus(city,z),tower=civicForId(z.id)?.kind==='waterStorage';return {...s,working:s.powered&&(tower||s.intake)&&s.connected,reason:!s.powered?'Needs electricity':!tower&&!s.intake?'Needs nearby water intake':!s.connected?'Connect a water pipe':tower?'Storage connected':'Pumping'};}

export function waterNetwork(city){const nodes=Uint8Array.from(city.pipes);for(const z of city.zones)if((['water','waterStorage'].includes(civicForId(z.id)?.kind)&&pumpStatus(city,z).working)||([973,974].includes(z.id)&&utilityPipeStatus(city,z).working)){const b=civicBounds(z);for(let dy=0;dy<b.height;dy++)for(let dx=0;dx<b.width;dx++)nodes[(b.y+dy)*(city.width||120)+b.x+dx]=1;}return {nodes};}
