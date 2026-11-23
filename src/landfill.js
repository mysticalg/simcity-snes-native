import {CIVIC_ART_EXTRAS,civicTexturePath} from './civic-textures.js?v=health-care-34';
const photoSoil=typeof Image==='undefined'?null:new Image(),photoWaste=typeof Image==='undefined'?null:new Image();if(photoSoil){photoSoil.src=CIVIC_ART_EXTRAS.soil;photoWaste.src=civicTexturePath(1);}const landfillPhotoReady=()=>!!(photoSoil?.complete&&photoSoil.naturalWidth&&photoWaste?.complete&&photoWaste.naturalWidth);
const cache=new WeakMap();
export function landfillSites(city){const old=cache.get(city);if(old?.revision===city.revision)return old.value;const width=city.width||120,height=city.height||100,tiles=new Map(city.zones.filter(z=>z.id===961&&city.disabledBuildings?.[z.i]!==z.id).map(z=>[z.i,z])),labels=new Map(),sites=[];for(const [i,z]of tiles){if(labels.has(i))continue;const site={id:sites.length,tiles:[],roadConnected:false},q=[i];sites.push(site);labels.set(i,site.id);for(let at=0;at<q.length;at++){const n=q[at],cell=tiles.get(n);site.tiles.push(cell);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const x=cell.x+dx,y=cell.y+dy;if(x>=0&&x<width&&y>=0&&y<height&&(city.flags[city.map[y*width+x]&1023]&64))site.roadConnected=true;}for(const k of[n>=width?n-width:-1,n%width<width-1?n+1:-1,n+width<width*height?n+width:-1,n%width?n-1:-1])if(tiles.has(k)&&!labels.has(k)){labels.set(k,site.id);q.push(k);}}}const value={sites,labels};cache.set(city,{revision:city.revision,value});return value;}
export function landfillTileVisual(city,z){const width=city.width||120,height=city.height||100,isLand=(x,y)=>x>=0&&x<width&&y>=0&&y<height&&(city.map[y*width+x]&1023)===961,used=Math.max(0,Math.min(10000,city.civic.landfillUsed?.[z.i]||0)),edges=[!isLand(z.x,z.y-1),!isLand(z.x+1,z.y),!isLand(z.x,z.y+1),!isLand(z.x-1,z.y)];return {fill:used/10000,piles:Math.ceil(used/10000*12),edges};}
const landfillSprites=new Map();let landfillRasterizations=0;
const landfillLayers=new WeakMap();
function landfillSpriteKey(z,{fill,piles,edges}){return [Number(landfillPhotoReady()),piles,Number(fill>.8)|Number(fill>.65)<<1|Number(fill>.4)<<2,piles?z.i%12:0,edges.reduce((n,on,i)=>n|(Number(on)<<i),0)].join(':');}
// Large sites are static between changes to their fill buckets or boundaries.
// Update only those eight-pixel cells, then submit one image for the whole site.
export function drawLandfillLayer(ctx,city,zones,view=null){if(view?.zoom>1.01)return drawLandfillDetailLayer(ctx,city,zones,view);let layer=landfillLayers.get(city);if(!layer){const canvas=document.createElement('canvas');canvas.width=city.width*8;canvas.height=city.height*8;layer={canvas,entries:new Map(),updates:0};landfillLayers.set(city,layer);}const target=layer.canvas.getContext('2d'),present=new Set();
 for(const z of zones){present.add(z.i);const visual=landfillTileVisual(city,z),key=landfillSpriteKey(z,visual);if(layer.entries.get(z.i)===key)continue;target.clearRect(z.x*8,z.y*8,8,8);drawLandfill(target,city,z);layer.entries.set(z.i,key);layer.updates++;}
 for(const i of layer.entries.keys())if(!present.has(i)){target.clearRect(i%city.width*8,Math.floor(i/city.width)*8,8,8);layer.entries.delete(i);layer.updates++;}
 if(view){const x=Math.max(0,Math.floor(view.x)*8),y=Math.max(0,Math.floor(view.y)*8),w=Math.min(layer.canvas.width-x,Math.ceil((view.x+view.width)*8)-x),h=Math.min(layer.canvas.height-y,Math.ceil((view.y+view.height)*8)-y);if(w>0&&h>0)ctx.drawImage(layer.canvas,x,y,w,h,x,y,w,h);}else ctx.drawImage(layer.canvas,0,0);
 return {tiles:layer.entries.size,updates:layer.updates};
}
export function landfillRenderStats(){return {entries:landfillSprites.size,rasterizations:landfillRasterizations,photorealReady:landfillPhotoReady()};}
export function drawLandfill(ctx,city,z){const visual=landfillTileVisual(city,z);if(typeof document==='undefined'){drawLandfillPixels(ctx,z,visual);return;}
 const key=landfillSpriteKey(z,visual);
 let tile=landfillSprites.get(key);if(!tile){tile=document.createElement('canvas');tile.width=tile.height=landfillPhotoReady()?32:8;if(landfillPhotoReady())drawLandfillPhoto(tile.getContext('2d'),z,visual);else drawLandfillPixels(tile.getContext('2d'),{...z,x:0,y:0},visual);landfillSprites.set(key,tile);landfillRasterizations++;if(landfillSprites.size>1024)landfillSprites.delete(landfillSprites.keys().next().value);}
 ctx.drawImage(tile,z.x*8,z.y*8,8,8);
}
function drawLandfillPhoto(ctx,z,{piles,edges}){ctx.drawImage(photoSoil,0,0,32,32);for(let n=0;n<piles;n++){const slot=(n*5+z.i%12)%12,x=slot%4*8,y=Math.floor(slot/4)*32/3;ctx.drawImage(photoWaste,slot%4*photoWaste.width/4,Math.floor(slot/4)*photoWaste.height/3,photoWaste.width/4,photoWaste.height/3,x,y,8,32/3);}ctx.strokeStyle='#b8b5a4';ctx.lineWidth=1.4;ctx.beginPath();if(edges[0]){ctx.moveTo(0,.7);ctx.lineTo(32,.7);}if(edges[1]){ctx.moveTo(31.3,0);ctx.lineTo(31.3,32);}if(edges[2]){ctx.moveTo(0,31.3);ctx.lineTo(32,31.3);}if(edges[3]){ctx.moveTo(.7,0);ctx.lineTo(.7,32);}ctx.stroke();}
const landfillDetails=new WeakMap();
// Only the visible rectangle gets high-resolution pixels. A4x close-up never
// allocates a4x bitmap for the entire megacity.
function drawLandfillDetailLayer(ctx,city,zones,view){const scale=Math.min(4,Math.ceil(view.zoom)),x0=Math.max(0,Math.floor(view.x)),y0=Math.max(0,Math.floor(view.y)),x1=Math.min(city.width,Math.ceil(view.x+view.width)),y1=Math.min(city.height,Math.ceil(view.y+view.height)),w=(x1-x0)*8,h=(y1-y0)*8;if(w<=0||h<=0)return {tiles:0,updates:0};let layer=landfillDetails.get(city);if(!layer){layer={canvas:document.createElement('canvas'),entries:new Map(),updates:0};landfillDetails.set(city,layer);}const bounds=[x0,y0,x1,y1,scale].join(':');if(layer.bounds!==bounds){layer.canvas.width=w*scale;layer.canvas.height=h*scale;layer.entries.clear();layer.bounds=bounds;}const target=layer.canvas.getContext('2d'),present=new Set();target.setTransform(scale,0,0,scale,-x0*8*scale,-y0*8*scale);for(const z of zones){if(z.x<x0||z.x>=x1||z.y<y0||z.y>=y1)continue;present.add(z.i);const key=landfillSpriteKey(z,landfillTileVisual(city,z));if(layer.entries.get(z.i)===key)continue;target.clearRect(z.x*8,z.y*8,8,8);drawLandfill(target,city,z);layer.entries.set(z.i,key);layer.updates++;}for(const i of layer.entries.keys())if(!present.has(i)){target.clearRect(i%city.width*8,Math.floor(i/city.width)*8,8,8);layer.entries.delete(i);layer.updates++;}ctx.drawImage(layer.canvas,0,0,w*scale,h*scale,x0*8,y0*8,w,h);return {tiles:layer.entries.size,updates:layer.updates,pixels:layer.canvas.width*layer.canvas.height};}
function drawLandfillPixels(ctx,z,{fill,piles,edges}){const x=z.x*8,y=z.y*8;ctx.fillStyle=fill>.8?'#706858':'#756047';ctx.fillRect(x,y,8,8);ctx.fillStyle='#8b7757';ctx.fillRect(x,y+3,8,1);ctx.fillStyle='#4c4436';ctx.fillRect(x,y+6,8,1);const points=[[1,1],[4,3],[2,5],[5,6],[6,1],[0,4],[3,1],[5,4],[1,6],[6,3],[3,6],[4,0]],colors=['#b5b9aa','#748279','#d7c9a0','#8c969c','#b8b2a0','#535e5b'];for(let n=0;n<piles;n++){const [px,py]=points[(n+(z.i%12))%12];ctx.fillStyle='#3b3b31';ctx.fillRect(x+px,y+py+1,2,1);ctx.fillStyle=colors[(n+z.i)%colors.length];ctx.fillRect(x+px,y+py,2,1+Number(fill>.65));if(fill>.4){ctx.fillStyle='#d1ccb5';ctx.fillRect(x+px,y+py,1,1);}}ctx.strokeStyle='#af9a70';ctx.lineWidth=.7;ctx.beginPath();if(edges[0]){ctx.moveTo(x,y+.5);ctx.lineTo(x+8,y+.5);}if(edges[1]){ctx.moveTo(x+7.5,y);ctx.lineTo(x+7.5,y+8);}if(edges[2]){ctx.moveTo(x,y+7.5);ctx.lineTo(x+8,y+7.5);}if(edges[3]){ctx.moveTo(x+.5,y);ctx.lineTo(x+.5,y+8);}ctx.stroke();}
// Player extension: monthly abstract waste units, separate from ROM population.
// The original rate made a 100k city require at least 17 incinerators. Keep
// existing stock intact, but generate 0.1 unit per population-equivalent/month.
export function monthlyGarbageDemand(city,wasteReduction=0){return Math.ceil((Math.max(0,city.population)+8*(Math.max(0,city.rci[1])+Math.max(0,city.rci[2])))*.1*(1-Math.max(0,Math.min(1,wasteReduction))));}
export function collectGarbage(city,demand,services){
 const usage=Object.fromEntries(services.statuses.map(p=>[p.i,{id:p.id,capacity:p.capacity,processed:0,stored:0,reclaimed:0,reason:p.reason}]));
 const before=Math.max(0,city.civic.garbage||0);let remaining=before+demand;
 let pickup=services.capacity.collection??Infinity;
 const freshRecycled=Math.min(remaining,services.capacity.recycling||0,pickup);remaining-=freshRecycled;pickup-=freshRecycled;
 const freshBurned=Math.min(remaining,services.capacity.incineration,pickup);remaining-=freshBurned;pickup-=freshBurned;
 const regional=Math.min(remaining,city.regionalState?.garbage||0);remaining-=regional;
 let stored=0,reclaimed=0,landfillRecycled=0,landfillBurned=0,spareBurn=services.capacity.incineration-freshBurned,spareRecycle=(services.capacity.recycling||0)-freshRecycled;city.civic.landfillUsed??={};
 for(const site of services.sites)if(site.roadConnected)for(const z of site.tiles){
  let used=city.civic.landfillUsed[z.i]||0;
  const deposit=Math.min(remaining,1000,Math.max(0,10000-used),pickup);used+=deposit;remaining-=deposit;stored+=deposit;pickup-=deposit;
  // Only capacity left after collecting street/new waste may empty a landfill.
  // This follows the existing citywide collection model and requires an enabled,
  // road-accessible site plus an operating, powered incinerator.
  const recycle=Math.min(used,spareRecycle,pickup);used-=recycle;spareRecycle-=recycle;pickup-=recycle;landfillRecycled+=recycle;
  const burn=Math.min(used,spareBurn,pickup);used-=burn;spareBurn-=burn;pickup-=burn;landfillBurned+=burn;reclaimed+=recycle+burn;
  city.civic.landfillUsed[z.i]=used;if(usage[z.i])Object.assign(usage[z.i],{processed:deposit,stored:deposit,reclaimed:recycle+burn});
 }
 Object.assign(city.civic,{garbage:remaining,generatedGarbage:demand,collectedGarbage:freshBurned+freshRecycled+stored+regional,garbageBurned:freshBurned+landfillBurned,garbageRecycled:freshRecycled+landfillRecycled,garbageBurnedFresh:freshBurned,garbageReclaimed:reclaimed,garbageStored:stored,garbageRegional:regional,garbageBacklogChange:remaining-before,garbageLandfillChange:stored-reclaimed,garbageCollectionUsed:freshBurned+freshRecycled+stored+reclaimed});
 // Explicit dispatch allocation, in map order. Shared municipal pickup is used
 // before the additional capacity provided by collection depots.
 const assign=(id,total)=>{for(const p of services.statuses)if(p.id===id){const used=Math.min(total,p.capacity);usage[p.i].processed=used;total-=used;}};
 assign(975,city.civic.garbageRecycled);assign(962,city.civic.garbageBurned);assign(976,Math.max(0,city.civic.garbageCollectionUsed-(services.capacity.collection-services.capacity.depotCollection)));
 city.civic.garbageFacilityUsage=usage;

}
export function garbageFacilities(city,roadEntry){
 const layout=landfillSites(city),sites=layout.sites.map(site=>({...site,used:site.tiles.reduce((sum,z)=>sum+(city.civic.landfillUsed?.[z.i]||0),0),capacity:site.tiles.length*10000})),statuses=[];
 let incineration=0,recycling=0,depotCollection=0,landfill=0,plants=0,landfillTiles=0;
 for(const z of city.zones){
  if(![961,962,975,976].includes(z.id))continue;
  const off=city.disabledBuildings?.[z.i]===z.id;let reason='Operating',capacity=0;
  if(off)reason='Switched off';
  else if(z.id!==961){
   if(!city.power[z.i])reason='Needs electricity';else if(roadEntry(city,z)<0)reason='Needs road access';
   else if(z.id===962){capacity=6000;incineration+=capacity;plants++;}
   else if(z.id===975){capacity=4000;recycling+=capacity;plants++;}
   else{capacity=12000;depotCollection+=capacity;}
  }else{
   const site=sites[layout.labels.get(z.i)],used=city.civic.landfillUsed?.[z.i]||0;
   if(site?.roadConnected)landfillTiles++;
   if(used>=10000)reason='Full';else if(!site?.roadConnected)reason='Site needs road access';else{capacity=Math.min(1000,10000-used);landfill+=capacity;}
  }
  statuses.push({i:z.i,x:z.x,y:z.y,id:z.id,reason,capacity,operating:capacity>0});
 }
 // Disposal facilities include basic municipal pickup. Depots add trucks and
 // throughput without pretending to destroy waste or create landfill space.
 const collection=plants||landfillTiles||depotCollection?5000+plants*2000+landfillTiles*500+depotCollection:0;
 return {sites,statuses,capacity:{incineration,recycling,depotCollection,collection,landfill,total:incineration+recycling+landfill}};
}
