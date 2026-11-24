import {drawAmbulanceSprite} from './ambulance-art.js?v=health-care-34';
export {ambulanceArtStats} from './ambulance-art.js?v=health-care-34';
import {civicForId,civicRoadEntry} from './civic.js?v=background-64';
import {buildingOff} from './building-operations.js?v=background-64';
import {socialFields,updateLocalHealth} from './social-fields.js?v=background-64';
const dispatchCache=new WeakMap();
const roadCache=new WeakMap();
const period=city=>city.year*12+city.month;
const neighbors=(i,w,n)=>[i>=w?i-w:-1,i%w<w-1?i+1:-1,i+w<n?i+w:-1,i%w?i-1:-1];
function roadParents(city,start,hash){let cache=roadCache.get(city);if(!cache||cache.hash!==hash){cache={hash,parents:new Map()};roadCache.set(city,cache);}let parent=cache.parents.get(start);if(parent)return parent;const w=city.width||120,n=city.map.length,q=[start];parent=new Int32Array(n).fill(-1);parent[start]=start;for(let at=0;at<q.length;at++)for(const k of neighbors(q[at],w,n))if(k>=0&&parent[k]<0&&(city.flags[city.map[k]&1023]&64)){parent[k]=q[at];q.push(k);}cache.parents.set(start,parent);if(cache.parents.size>32)cache.parents.delete(cache.parents.keys().next().value);return parent;}
export function healthFacilities(city){return city.zones.filter(z=>civicForId(z.id)?.kind==='health').map(z=>{const b=civicForId(z.id),road=civicRoadEntry(city,z),enabled=!buildingOff(city,z),powered=!!city.power[z.i],working=enabled&&powered&&road>=0;return {z,road,working,fleet:b.ambulances||1,capacity:Math.ceil(b.capacity/20),reason:!enabled?'Switched off':!powered?'Needs electricity':road<0?'Needs road access':'Ready'};});}
export function dispatchHealthCare(city){
 if(!city.civicEnabled)return;
 const c=city.civic,w=city.width||120,n=city.map.length;if(!Array.isArray(c.ambulances))c.ambulances=[];c.healthVisits??={};c.healthCare??={};
 if(c.healthPeriod!==period(city)){c.healthPeriod=period(city);c.healthCare={};for(const i of Object.keys(c.healthVisits)){c.healthVisits[i]*=.85;if(c.healthVisits[i]<.1)delete c.healthVisits[i];}c.healthResponseEpoch=(c.healthResponseEpoch||0)+1;updateLocalHealth(city);}
 const facilities=healthFacilities(city);if(!facilities.length){c.ambulances=[];return;}
 let roadHash=2166136261;for(let i=0;i<n;i++)if(city.flags[city.map[i]&1023]&64)roadHash=Math.imul(roadHash^i,16777619);
 const fields=socialFields(city),homeData=city.zones.filter(z=>z.type===5).map(z=>({z,score:fields.health[z.i],residents:(z.id===0x84?city.adjacentSmallHomeCount(z):city.zonePopulation(z))*20})).filter(h=>h.residents>0),homeState=homeData.map(h=>h.z.i+':'+h.residents+':'+h.score).join(',');
 const active=new Map(facilities.filter(f=>f.working).map(f=>[f.z.i,f])),homesPresent=new Set(homeData.map(h=>h.z.i));c.ambulances=c.ambulances.filter(v=>v&&!v.done&&active.has(v.root)&&homesPresent.has(v.target)&&Array.isArray(v.path)&&v.path.length>0&&v.path.length<=n&&Number.isInteger(v.at)&&v.at>=0&&v.at<v.path.length&&Number.isFinite(v.fraction)&&v.fraction>=0&&v.fraction<1&&Number.isInteger(v.patients)&&v.patients>0&&v.patients<=8&&Number.isFinite(v.need)&&v.need>=v.patients&&v.path.every((i,k)=>Number.isInteger(i)&&i>=0&&i<n&&(city.flags[city.map[i]&1023]&64)&&(!k||Math.abs(i%w-v.path[k-1]%w)+Math.abs(Math.floor(i/w)-Math.floor(v.path[k-1]/w))===1)));
 const key=[c.healthPeriod,roadHash,homeState,c.healthResponseEpoch,facilities.map(f=>f.z.i+':'+Number(f.working)).join(',')].join('|');if(dispatchCache.get(city)===key)return;dispatchCache.set(city,key);
 const owner=new Int32Array(n).fill(-1),parent=new Int32Array(n).fill(-1),q=[];
 for(const f of active.values()){const count=c.ambulances.filter(v=>v.root===f.z.i).length,used=(c.healthCare[f.z.i]?.served||0)+c.ambulances.filter(v=>v.root===f.z.i&&!v.returning).reduce((n,v)=>n+v.patients,0);if(count>=f.fleet||used>=f.capacity)continue;if(parent[f.road]<0){parent[f.road]=f.road;owner[f.road]=f.z.i;q.push(f.road);}}
 if(!q.length)return;
 for(let at=0;at<q.length;at++)for(const k of neighbors(q[at],w,n))if(k>=0&&parent[k]<0&&(city.flags[city.map[k]&1023]&64)){parent[k]=q[at];owner[k]=owner[q[at]];q.push(k);}
 const occupied=new Set(c.ambulances.filter(v=>!v.returning).map(v=>v.target)),homes=homeData.filter(h=>!occupied.has(h.z.i)&&h.residents>0&&h.score<75).sort((a,b)=>a.score-b.score||b.residents-a.residents||a.z.i-b.z.i);
 for(const h of homes){if(c.ambulances.length>=64)break;const end=civicRoadEntry(city,h.z);if(end<0||owner[end]<0)continue;let root=owner[end],f=active.get(root),tree=parent;const workload=()=>{const fleet=c.ambulances.filter(v=>v.root===root);return {count:fleet.length,used:(c.healthCare[root]?.served||0)+fleet.filter(v=>!v.returning).reduce((n,v)=>n+v.patients,0)};};let load=workload();
  if(load.count>=f.fleet||load.used>=f.capacity){let found=false;for(const candidate of [...active.values()].sort((a,b)=>Math.abs(a.z.x-h.z.x)+Math.abs(a.z.y-h.z.y)-Math.abs(b.z.x-h.z.x)-Math.abs(b.z.y-h.z.y))){root=candidate.z.i;f=candidate;load=workload();if(load.count>=f.fleet||load.used>=f.capacity)continue;tree=roadParents(city,f.road,roadHash);if(tree[end]>=0){found=true;break;}}if(!found)continue;}
  const need=Math.max(1,Math.ceil(h.residents*(75-h.score)/100)),patients=Math.min(8,need,f.capacity-load.used),path=[end];while(tree[path.at(-1)]!==path.at(-1))path.push(tree[path.at(-1)]);path.reverse();c.ambulances.push({root,target:h.z.i,patients,need,path,at:0,fraction:0,returning:false,wait:0});
 }
}
export function advanceHealthCare(city,frames,blocked=false){
 if(blocked||frames<=0||!city.civic.ambulances?.length)return;let changed=false;const c=city.civic;
 for(const v of c.ambulances){v.fraction+=frames/60*2.4;let guard=0;while(v.fraction>=1&&!v.done&&guard++<city.map.length*2){v.fraction--;if(v.wait){v.wait--;continue;}if(v.returning){if(v.at>0)v.at--;else v.done=true;}else if(v.at<v.path.length-1)v.at++;else{const entry=c.healthCare[v.root]??={served:0,calls:0};entry.served+=v.patients;entry.calls++;c.healthVisits[v.target]=Math.min(30,(c.healthVisits[v.target]||0)+30*v.patients/v.need);c.healthResponseEpoch=(c.healthResponseEpoch||0)+1;v.returning=true;v.wait=2;changed=true;}}}
 const finished=c.ambulances.some(v=>v.done);c.ambulances=c.ambulances.filter(v=>!v.done);if(changed||finished){if(changed)updateLocalHealth(city);dispatchCache.delete(city);dispatchHealthCare(city);}
}
export function drawAmbulances(ctx,city,view){const w=city.width||120,time=(city.civic.busFrame||0)/60;ctx.save();let visible=0;for(const v of city.civic.ambulances||[]){const a=v.path[v.at],next=v.wait?a:v.path[Math.max(0,Math.min(v.path.length-1,v.at+(v.returning?-1:1)))],ax=a%w*8+4,ay=Math.floor(a/w)*8+4,bx=next%w*8+4,by=Math.floor(next/w)*8+4,t=Math.min(1,v.fraction),angle=Math.atan2(by-ay,bx-ax),x=ax+(bx-ax)*t+Math.sin(angle)*1.3,y=ay+(by-ay)*t-Math.cos(angle)*1.3;if(x<view.x*8-8||x>(view.x+view.width)*8+8||y<view.y*8-8||y>(view.y+view.height)*8+8)continue;
  if(drawAmbulanceSprite(ctx,x,y,angle,Math.floor(time*6),!v.returning)){visible++;continue;}ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle='#172127';ctx.fillRect(-3.5,-2.2,7,4.4);ctx.fillStyle='#e8e9df';ctx.fillRect(-3.2,-1.8,6.4,3.6);ctx.fillStyle='#a82428';ctx.fillRect(-2.6,-1.8,3,1);ctx.fillRect(-1.6,-1.8,1,3.2);ctx.fillStyle='#304d5e';ctx.fillRect(1.6,-1.5,1,3);ctx.fillStyle=Math.floor(time*6)%2?'#ff4a46':'#5ebfff';ctx.fillRect(.1,-2.1,1.3,.9);ctx.restore();visible++;
 }ctx.restore();return visible;}
export function healthFleetStatus(city,z){const f=healthFacilities(city).find(f=>f.z.i===z.i);if(!f)return null;const active=(city.civic.ambulances||[]).filter(v=>v.root===z.i),m=city.civic.healthCare?.[z.i]||{served:0,calls:0};return {...f,served:m.served,calls:m.calls,active:active.length,targets:active.map(v=>v.target)};}
export function installHealthCare(City){
 if(City.prototype.updateHealthDispatch)return;City.prototype.updateHealthDispatch=function(){dispatchHealthCare(this);};
 const refresh=City.prototype.refresh;City.prototype.refresh=function(...args){const result=refresh.apply(this,args);dispatchHealthCare(this);return result;};
 const visual=City.prototype.advanceVisualFrames;City.prototype.advanceVisualFrames=function(frames,blocked=false,...args){const result=visual.call(this,frames,blocked,...args);advanceHealthCare(this,frames,blocked);return result;};
 const step=City.prototype.stepSimulation;City.prototype.stepSimulation=function(...args){const result=step.apply(this,args);dispatchHealthCare(this);return result;};
}
