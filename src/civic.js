import {allocateWater,updateWaterStorage} from './water-allocation.js?v=utilities-22';
import {landfillSites,garbageFacilities,collectGarbage,monthlyGarbageDemand} from './landfill.js?v=processing-1';
import {buildingOff} from './building-operations.js?v=utilities-22';
// Custom civic systems requested by the player. Values are game balance, not ROM-derived.
export const CIVIC_TOOLS=[
 {tool:8,id:977,name:"Police",icon:"🛡",cost:500,annual:0,kind:"police",size:2,nativeTool:8},
 {tool:9,id:978,name:"Fire station",icon:"🚒",cost:500,annual:0,kind:"fire",size:2,nativeTool:9},
 {tool:30,id:960,name:'Hospital',icon:'🏥',cost:1000,annual:250,kind:'health',capacity:5000},
 {tool:31,id:961,name:'Landfill tile',icon:'🗑',cost:50,annual:10,kind:'garbage',capacity:1000,size:1},
 {tool:32,id:962,name:'Incinerator',icon:'♨',cost:3000,annual:400,kind:'garbage',capacity:6000},
 {tool:33,id:963,name:'Fusion plant',icon:'⚛',cost:50000,annual:1000,kind:'power',capacity:10000},
 {tool:34,id:964,name:'School',icon:'🏫',cost:500,annual:150,kind:'education',capacity:3000,size:1},
 {tool:35,id:965,name:'College',icon:'🎓',cost:2000,annual:300,kind:'education',capacity:6000,width:2,height:1},
 {tool:36,id:966,name:'University',icon:'🏛',cost:5000,annual:600,kind:'education',capacity:10000,size:4},
 {tool:37,id:967,name:'Bus stop',icon:'🚏',cost:25,annual:5,kind:'bus',capacity:500,size:1},
 {tool:38,id:968,name:'Bus station',icon:'🚌',cost:1000,annual:200,kind:'bus',capacity:5000,size:1},
 {tool:39,id:969,name:'Water pump',icon:'💧',cost:500,annual:100,kind:'water',capacity:5000,size:2},
 {tool:60,id:988,name:'Water tower',icon:'🗼',cost:1000,annual:50,kind:'waterStorage',capacity:20000,flow:5000,width:1,height:2,sprite:26},
 {tool:61,id:989,name:'Heavy water pump',icon:'💦',cost:1500,annual:250,kind:'water',capacity:15000,size:3,sprite:27},
 {tool:62,id:990,name:'Solar power array',icon:'☀',cost:5000,annual:100,kind:'power',capacity:1000,size:2,sprite:28},
 {tool:41,id:972,name:'Wind turbine',icon:'🌬',cost:1000,annual:40,kind:'power',capacity:200,width:2,height:1,sprite:12,artHeight:24},
 {tool:44,id:973,name:'Sewage pump',icon:'🚰',cost:800,annual:150,kind:'sewage',capacity:8000,sprite:13},
 {tool:45,id:974,name:'Sewage treatment',icon:'♻',cost:5000,annual:800,kind:'treatment',capacity:20000,size:4,sprite:14},
 {tool:49,id:975,name:'Recycling centre',icon:'♻',cost:2000,annual:250,kind:'garbage',capacity:4000,size:2,sprite:15},
 {tool:50,id:976,name:'Garbage collection depot',icon:'🚛',cost:1000,annual:150,kind:'collection',capacity:12000,size:2,sprite:16},
 {tool:40,id:970,name:'Water pipe',icon:'🔵',cost:2,annual:0,kind:'pipe',size:1}
];
export function installCivicTools(build,flags){build.nativeEmergencyBuildings??=Object.fromEntries([8,9].map(tool=>[tool,structuredClone(build.buildings[tool])]));for(const b of CIVIC_TOOLS){if(b.kind==='pipe')continue;const width=b.width||b.size||3,height=b.height||b.size||3,center=Math.floor(height/2)*width+Math.floor(width/2);build.buildings[b.tool]={id:b.tool,tiles:Array.from({length:width*height},(_,i)=>i===center?b.id:971),x:Array.from({length:width*height},(_,i)=>i%width),y:Array.from({length:width*height},(_,i)=>Math.floor(i/width))};flags[b.id]=b.nativeTool?0x85:0x81;build.costs[b.tool]=b.cost;}flags[971]=0x80;build.buildings[40]={id:40,tiles:[0],x:[0],y:[0]};build.costs[40]=2;}
export const civicForId=id=>CIVIC_TOOLS.find(b=>b.id===id);
// Budget/HUD callers need only upkeep, not water-network allocation, bus BFS
// and waste-service calculations. This is the same enabled-facility total.
export function civicAnnualCost(city){let annual=0;for(const z of city.zones){if(z.id<960||buildingOff(city,z))continue;annual+=civicForId(z.id)?.annual||0;}return annual;}
export function civicServices(city){const landfills=landfillSites(city),garbage=garbageFacilities(city,civicRoadEntry);const capacity={health:0,garbage:0,education:0,bus:0,water:0},stations=[],stops=[],pumps=[];let annual=0,fusion=0;for(const z of city.zones){const b=civicForId(z.id);if(!b||buildingOff(city,z))continue;annual+=b.annual;const operational=b.id===961?!!landfills.sites[landfills.labels.get(z.i)]?.roadConnected:['water','waterStorage'].includes(b.kind)?pumpStatus(city,z).working:[973,974].includes(b.id)?utilityPipeStatus(city,z).working:(b.kind==='power'||b.id===961||b.id===967||city.power[z.i])&&civicRoadEntry(city,z)>=0;if(b.kind==='power'){fusion+=b.capacity;continue;}if(!operational)continue;if(b.kind in capacity)capacity[b.kind]+=b.id===961?Math.min(1000,Math.max(0,10000-(city.civic.landfillUsed?.[z.i]||0))):b.capacity||0;if(b.id===967)stops.push(z);if(b.id===968)stations.push(z);if(['water','waterStorage'].includes(b.kind))pumps.push({...z,capacity:b.kind==='water'?b.capacity:0,storage:b.kind==='waterStorage'?b.capacity:0,flow:b.flow||0});}
 const {water,watered,networks:waterNetworks,assignments:waterAssignments}=waterService(city,pumps);

 const routes=busRoutes(city,stations,stops),served=new Set(routes.flat());const busCoverage=new Uint8Array(city.map.length);if(routes.length)for(const stop of [...stops,...stations].filter(z=>[...served].some(i=>Math.abs(i%(city.width||120)-z.x)+Math.abs(Math.floor(i/(city.width||120))-z.y)<=3)))for(let dy=-8;dy<=8;dy++)for(let dx=-8;dx<=8;dx++){const x=stop.x+dx,y=stop.y+dy;if(x>=0&&x<(city.width||120)&&y>=0&&y<(city.height||100)&&Math.abs(dx)+Math.abs(dy)<=8)busCoverage[y*(city.width||120)+x]=1;}
 return {garbageFacilities:garbage,pumpStatuses:city.zones.filter(z=>['water','waterStorage'].includes(civicForId(z.id)?.kind)).map(z=>({x:z.x,y:z.y,...pumpStatus(city,z)})),capacity,annual,fusion,water,watered,waterNetworks,waterAssignments,busCoverage,routes,buses:stations.length?Math.min(stops.length+stations.length,Math.ceil(capacity.bus/500)):0};}
export function updateCivicMonth(city){if(!city.civicEnabled)return;const s=civicServices(city);updateWaterStorage(city,s.waterNetworks);city.civicWatered=s.watered;city.waterField=s.water;city.waterAssignments=s.waterAssignments;city.waterNetworks=s.waterNetworks;const external=city.regionalState||{},effects=educationEffects(city.civic.education),demand=monthlyGarbageDemand(city,effects.wasteReduction);city.civicCapacity=s.capacity;collectGarbage(city,demand,s.garbageFacilities);const healthCap=s.capacity.health+(external.health||0);city.civic.health=city.population?Math.min(100,Math.round(healthCap/city.population*100+100*effects.sicknessReduction)):100;city.civic.sickness=100-city.civic.health;const educationTarget=city.population?Math.min(100,s.capacity.education/city.population*100):0;city.civic.education=Math.max(0,Math.min(100,city.civic.education+(educationTarget-city.civic.education)/24));const zones=city.zones.filter(z=>z.type>=5&&z.type<=7);city.civic.water=zones.length?Math.round(zones.filter(z=>s.watered.has(z.i)).length/zones.length*100):100;city.busRoutes=s.routes;city.civic.buses=s.routes.length;city.civic.generatedGarbage=demand;}
// Buses use actual road paths between a powered depot and road-connected stops.
export function busRoutes(city,stations,stops){const road=i=>i>=0&&i<city.map.length&&(city.flags[city.map[i]&1023]&64),entry=z=>civicRoadEntry(city,z),routes=[];for(const station of stations){const root=entry(station);if(root<0)continue;const parent=new Int32Array(city.map.length).fill(-1),queue=[root];parent[root]=root;for(let n=0;n<queue.length;n++){const i=queue[n];for(const j of [i>=(city.width||120)?i-(city.width||120):-1,i%(city.width||120)<((city.width||120)-1)?i+1:-1,i+(city.width||120)<city.map.length?i+(city.width||120):-1,i%(city.width||120)?i-1:-1])if(road(j)&&parent[j]<0){parent[j]=i;queue.push(j);}}for(const stop of stops){const end=entry(stop);if(end<0||parent[end]<0)continue;const path=[end];while(path.at(-1)!==root)path.push(parent[path.at(-1)]);if(path.length>1)routes.push([...path,...path.slice(1,-1).reverse()]);if(routes.length>=32)return routes;}}return routes;}

export function waterService(city,pumps){return allocateWater(city,waterNetwork(city).nodes,pumps);}

export function civicRoadEntry(city,z){const b=civicForId(z.id),reach=Math.max(2,Math.ceil(Math.max(b?.width||b?.size||3,b?.height||b?.size||3)/2)+1);for(let radius=0;radius<=reach;radius++)for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;const x=z.x+dx,y=z.y+dy,i=y*(city.width||120)+x;if(x>=0&&x<(city.width||120)&&y>=0&&y<(city.height||100)&&(city.flags[city.map[i]&1023]&64))return i;}return -1;}

export function civicBounds(z){const b=civicForId(z.id);if(!b)return null;const width=z.layout?.width||b.width||b.size||3,height=z.layout?.height||b.height||b.size||3;return {x:z.x-Math.floor(width/2),y:z.y-Math.floor(height/2),width,height};}

export function educationEffects(level){const education=Math.max(0,Math.min(100,Number(level)||0));return {crimeReduction:education/400,wasteReduction:education/400,sicknessReduction:education/500,productivity:1+education/400};}

export function utilityPipeStatus(city,z){const powered=!buildingOff(city,z)&&!!city.power[z.i],b=civicBounds(z);let intake=false,connected=false;const waterPoints=[],pipePoints=[];for(let y=b.y-1;y<=b.y+b.height;y++)for(let x=b.x-1;x<=b.x+b.width;x++){if(x<0||x>=(city.width||120)||y<0||y>=(city.height||100))continue;const corner=(x===b.x-1||x===b.x+b.width)&&(y===b.y-1||y===b.y+b.height),i=y*(city.width||120)+x,id=city.map[i]&1023;if(id>=1&&id<20){intake=true;waterPoints.push(i);}if(city.pipes[i]&&!corner){connected=true;pipePoints.push(i);}}return {powered,intake,connected,waterPoints,pipePoints,working:powered&&connected,reason:!powered?'Needs electricity':!connected?'Connect a pipe':'Connected'};}
export function pumpStatus(city,z){const s=utilityPipeStatus(city,z),tower=civicForId(z.id)?.kind==='waterStorage';return {...s,working:s.powered&&(tower||s.intake)&&s.connected,reason:!s.powered?'Needs electricity':!tower&&!s.intake?'Needs nearby water intake':!s.connected?'Connect a water pipe':tower?'Storage connected':'Pumping'};}

export function waterNetwork(city){const nodes=Uint8Array.from(city.pipes);for(const z of city.zones)if((['water','waterStorage'].includes(civicForId(z.id)?.kind)&&pumpStatus(city,z).working)||([973,974].includes(z.id)&&utilityPipeStatus(city,z).working)){const b=civicBounds(z);for(let dy=0;dy<b.height;dy++)for(let dx=0;dx<b.width;dx++)nodes[(b.y+dy)*(city.width||120)+b.x+dx]=1;}return {nodes};}
