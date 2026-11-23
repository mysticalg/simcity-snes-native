// Player-requested transport layers. Surface roads/rail retain native map IDs.
import {hasRoadLayer} from './rom-networks.js?v=megacity-1';
export const TRANSIT_TOOLS=[
 {tool:94,name:'High-density road',icon:'🛣',cost:50,kind:'road'},
 {tool:95,name:'Monorail track',icon:'🚝',cost:80,bit:4,kind:'track'},
 {tool:96,name:'Monorail station',icon:'🚉',cost:1000,bit:4,kind:'station'},
 {tool:97,name:'Subway track',icon:'🚇',cost:60,bit:1,kind:'track'},
 {tool:98,name:'Subway station',icon:'Ⓜ',cost:1000,bit:1,kind:'station'},
 {tool:99,name:'Elevated rail',icon:'🌉',cost:60,bit:2,kind:'track'},
 {tool:100,name:'Rail ramp: ground ↔ raised',icon:'↗',cost:150,bit:2,kind:'ramp'},
 {tool:101,name:'Rail portal: ground ↔ subway',icon:'↘',cost:150,bit:1,kind:'ramp'},
 {tool:102,name:'Elevated rail station',icon:'🚉',cost:750,bit:2,kind:'station'},
 {tool:103,name:'Remove subway',icon:'🧹',cost:1,bit:1,kind:'remove'}
];
export const transitTool=tool=>TRANSIT_TOOLS.find(b=>b.tool===tool);
export const TRANSIT_ARRAYS=['heavyRoads','transitTracks','transitStations','transitRamps'];
export function initTransit(city){for(const k of TRANSIT_ARRAYS)city[k]=new Uint8Array(city.map.length);city.transitRevision=0;city.transitEnabled=false;city.transitInfrastructure=false;city.transitFrames=0;city.heavyTrafficPhase=0;city.transitTrains=[];}
export function installTransitTools(build){for(const b of TRANSIT_TOOLS){build.costs[b.tool]=b.cost;build.buildings[b.tool]={id:b.tool,tiles:[b.tool===94?0x32:0x72],x:[0],y:[0]};}}
export function transitPresent(city,i){return !!(city.transitTracks?.[i]||city.transitStations?.[i]||city.transitRamps?.[i]);}
export function transitDuplicate(city,tool,i){const b=transitTool(tool);return !!b&&b.kind!=='remove'&&(b.kind==='road'?city.heavyRoads[i]&&hasRoadLayer(city.map[i],city.flags):b.kind==='station'?city.transitStations[i]&b.bit:b.kind==='ramp'?city.transitRamps[i]&b.bit:city.transitTracks[i]&b.bit);}
export function transitCanBuild(city,tool,x,y,options={}){
 const b=transitTool(tool);if(!b)return null;const i=y*city.width+x;
 if(x<0||x>=city.width||y<0||y>=city.height)return {ok:false,cost:b.cost,reason:'The transport tile must fit inside the map.'};
 if(transitDuplicate(city,tool,i))return {ok:false,cost:0,reason:'This transport layer is already here.'};
 const id=city.map[i]&1023,road=hasRoadLayer(id,city.flags);let cost=b.cost;if(b.kind==='remove')return {ok:!!(city.transitTracks[i]&1)&&city.spendingFunds>=1,cost:1,reason:!(city.transitTracks[i]&1)?'No subway exists here.':city.spendingFunds<1?'Insufficient funds.':''};
 if(b.kind==='road'){if(road)cost=40;else{const ground=options.autoDemolish?city.replacementPlan(1,x,y):city.canBuild(1,x,y);cost=ground.cost+40;if(!ground.ok)return {...ground,cost};}}
 else if(b.kind==='ramp'&&!(city.flags[id]&32))return {ok:false,cost,reason:'Place this ramp on ground-level rail; extend raised or subway rail from it.'};
 else if((b.kind==='station'||(b.kind==='track'&&b.bit!==1))&&id>=0x80)return {ok:false,cost,reason:'Clear the surface site first. Tracks can cross roads; subway tunnels can pass below buildings.'};
 if(b.kind==='station'&&city.transitStations[i])return {ok:false,cost,reason:'A station is already here.'};
 if((b.kind==='track'||b.kind==='station')&&id>0&&id<20)cost*=2;
 return {ok:city.spendingFunds>=cost,cost,reason:city.spendingFunds>=cost?'':'Insufficient funds.'};
}
export function placeTransit(city,tool,x,y,options={}){
 const b=transitTool(tool);if(!b)return null;const check=transitCanBuild(city,tool,x,y,options);if(!check.ok){city.message(check.reason);return false;}
 const i=y*city.width+x,initial=city.funds;
 if(b.kind==='remove'){city.transitTracks[i]&=~1;city.transitStations[i]&=~1;city.transitRamps[i]&=~1;}else if(b.kind==='road'){if(!hasRoadLayer(city.map[i],city.flags)&&!city.place(1,x,y,options))return false;city.heavyRoads[i]=1;}
 else{city.transitTracks[i]|=b.bit;if(b.kind==='station')city.transitStations[i]|=b.bit;if(b.kind==='ramp')city.transitRamps[i]|=b.bit;}
 if(!city.infiniteMoney||city._placementShadow)city.funds=initial-check.cost;city.transitInfrastructure=true;city.transitRevision++;city.transitEnabled ||=b.kind!=='road';city.refresh();return true;
}
export function clearTransit(city,i,{all=false}={}){if(!transitPresent(city,i))return false;if(all){city.transitTracks[i]=city.transitStations[i]=city.transitRamps[i]=0;}else{const bits=city.transitStations[i]||city.transitTracks[i],bit=bits&4?4:bits&2?2:1;if(city.transitStations[i]&bit)city.transitStations[i]&=~bit;else{city.transitTracks[i]&=~bit;city.transitRamps[i]&=~bit;}}city.transitRevision++;return true;}
export function serializeTransit(city){return {version:1,...Object.fromEntries(TRANSIT_ARRAYS.map(k=>[k,Array.from(city[k])])),frames:city.transitFrames,heavyTrafficPhase:city.heavyTrafficPhase,trains:city.transitTrains};}
export function restoreTransit(city,value){if(!value||value.version!==1)return;for(const k of TRANSIT_ARRAYS)if(Array.isArray(value[k])&&value[k].length===city.map.length&&value[k].every(n=>Number.isInteger(n)&&n>=0&&n<=(k==='heavyRoads'?1:7)))city[k]=Uint8Array.from(value[k]);city.transitEnabled=city.transitTracks.some(Boolean);city.transitInfrastructure=city.transitEnabled||city.heavyRoads.some(Boolean);city.transitRevision++;city.heavyTrafficPhase=value.heavyTrafficPhase===1?1:0;city.transitFrames=Number.isFinite(value.frames)&&value.frames>=0?value.frames:0;city.transitTrains=Array.isArray(value.trains)?value.trains.filter(t=>t&&Number.isInteger(t.layer)&&t.layer>=1&&t.layer<=3&&Array.isArray(t.route)&&t.route.length>=2&&t.route.length<=city.map.length*4&&t.route.every(i=>Number.isInteger(i)&&i>=0&&i<city.map.length*4)&&Number.isFinite(t.position)&&t.position>=0).slice(0,16):[];}
const costCache=new WeakMap();
export function transitAnnualCost(city){if(!city.transitInfrastructure)return 0;const old=costCache.get(city);if(old?.revision===city.revision&&old.serial===city.transitRevision)return old.cost;let cost=0;for(let i=0;i<city.map.length;i++){if(city.heavyRoads[i]&&hasRoadLayer(city.map[i],city.flags))cost+=4;const t=city.transitTracks[i];if(t&1)cost+=2;if(t&2)cost+=2;if(t&4)cost+=3;if(city.transitStations[i])cost+=100;}costCache.set(city,{revision:city.revision,serial:city.transitRevision,cost});return cost;}
