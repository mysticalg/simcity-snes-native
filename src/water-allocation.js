// Custom finite water allocation. Reach, source pressure and a zone's actual
// allocation are separate: a blue pipe must not imply unlimited pump capacity.
export function allocateWater(city,nodes,pumps){
 const width=city.width||120,height=city.height||100,labels=new Int32Array(nodes.length).fill(-1),groups=[],water=new Uint8Array(nodes.length),watered=new Set(),assignments=new Map();
 for(let i=0;i<nodes.length;i++){
  if(!nodes[i]||labels[i]>=0)continue;const id=groups.length,g={cells:[],capacity:0,generation:0,towers:[],pumps:0,requested:0,unserved:0},q=[i];groups.push(g);labels[i]=id;
  for(let at=0;at<q.length;at++){const j=q[at];g.cells.push(j);for(const k of[j>=width?j-width:-1,j%width<width-1?j+1:-1,j+width<nodes.length?j+width:-1,j%width?j-1:-1])if(k>=0&&nodes[k]&&labels[k]<0){labels[k]=id;q.push(k);}}
 }
 for(const p of pumps){const id=labels[p.i];if(id>=0){const g=groups[id];if(p.storage){const stored=Math.max(0,Math.min(p.storage,Number(city.civic.waterStored?.[p.i])||0));g.towers.push({i:p.i,capacity:p.storage,flow:p.flow,stored});g.capacity+=Math.min(p.flow,stored);}else{const capacity=p.capacity??5000;g.capacity+=capacity;g.generation+=capacity;g.pumps++;}}}
 for(const g of groups){const regional=city.regionalState?.waterAllocations?.get(g.cells[0]);if(regional!==undefined){g.capacity=regional+g.towers.reduce((n,t)=>n+Math.min(t.flow,t.stored),0);g.generation=regional;}g.available=g.capacity;if(g.capacity)for(const i of g.cells)water[i]=1;}
 for(const z of city.zones){
  if(!((z.type>=5&&z.type<=14)||[30,32,33,34,35,36,38,51,52,53,54].includes(z.type)))continue;
  const need=Math.max(20,(z.id===0x84?city.adjacentSmallHomeCount(z):city.zonePopulation(z))*20),nearby=new Set();
  for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const x=z.x+dx,y=z.y+dy;if(x>=0&&x<width&&y>=0&&y<height&&labels[y*width+x]>=0)nearby.add(labels[y*width+x]);}
  const options=[...nearby],id=options.find(id=>groups[id].capacity>=need)??options.find(id=>groups[id].available>0)??options[0];
  if(id===undefined){assignments.set(z.i,{need,supplied:false,code:'out-of-range',reason:'Outside the three-tile pipe service radius',network:null});continue;}
  const g=groups[id];g.requested+=need;const supplied=g.capacity>=need;if(supplied){g.capacity-=need;watered.add(z.i);}else g.unserved+=need;
  assignments.set(z.i,{need,supplied,code:supplied?'supplied':g.available?'capacity':'no-source',reason:supplied?'Water supplied':g.available?'Insufficient pumping capacity':'This pipe network has no working water supply',network:id});
 }
 const networks=groups.map(g=>({cells:g.cells,capacity:g.available,generation:g.generation,towers:g.towers,used:g.available-g.capacity,requested:g.requested,unserved:g.unserved,shortfall:Math.max(0,g.requested-g.available),pumps:g.pumps}));
 for(const a of assignments.values())if(a.network!==null){const n=networks[a.network];a.capacity=n.capacity;a.networkDemand=n.requested;a.shortfall=n.shortfall;if(a.code==='capacity')a.reason=`Insufficient pumping capacity: network needs ${n.requested.toLocaleString()}/month; supply ${n.capacity.toLocaleString()}/month. Add ${Math.max(1,Math.ceil(n.shortfall/5000))} working water pump${n.shortfall>5000?'s':''} on this network.`;}
 return {water,watered,networks,assignments};
}
// Allocation previews are pure. Storage changes once per simulated month only.
export function updateWaterStorage(city,networks){
 const stored=city.civic.waterStored||{},next={},flow={};
 const extant=new Set(city.zones.filter(z=>z.id===988).map(z=>String(z.i)));
 for(const [i,value]of Object.entries(stored))if(extant.has(i))next[i]=Math.max(0,Math.min(20000,Number(value)||0));
 for(const n of networks){let release=Math.max(0,n.used-n.generation),surplus=Math.max(0,n.generation-n.used);
  for(const tower of n.towers){let value=tower.stored;const released=Math.min(value,tower.flow,release);value-=released;release-=released;const charged=Math.min(tower.capacity-value,tower.flow,surplus);value+=charged;surplus-=charged;next[tower.i]=value;flow[tower.i]={charged,released};}
 }
 city.civic.waterStored=next;city.civic.waterStorageFlow=flow;
}
export function waterConsumerBounds(city,z){
 const b=city.build?.buildings[z.type],n=b?.tiles.indexOf(z.id);if(n>=0)return {x:z.x-b.x[n],y:z.y-b.y[n],width:Math.max(...b.x)+1,height:Math.max(...b.y)+1};
 const size=[13,14].includes(z.type)?4:z.type===12?6:3,offset=size===6?2:1;return {x:z.x-offset,y:z.y-offset,width:size,height:size};
}
