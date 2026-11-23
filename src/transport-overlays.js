import {aviationTraffic} from './aviation.js?v=patch-work-54';
const cache=new WeakMap();
export function transportOverlay(city,kind){
 const frame=kind==='airTraffic'?Math.floor((city.civic.aviation?.frames||0)/60):0,entries=cache.get(city)||new Map();cache.set(city,entries);const prior=entries.get(kind);if(prior&&prior.revision===city.revision&&prior.step===city.baseStep&&prior.frame===frame&&prior.population===city.population&&prior.commercial===city.rci[1]&&prior.industrial===city.rci[2])return prior.value;
 const width=city.width||120,height=city.height||100,mask=new Uint8Array(city.map.length);let field,max=100,facilities=[],traffic=null;
 if(kind==='traffic'){field=city.traffic;max=240;for(let i=0;i<mask.length;i++)mask[i]=!!(city.flags[city.map[i]&1023]&64);}
 else if(kind==='railTraffic'){field=city.railTrafficField||new Uint16Array(mask.length);for(let i=0;i<mask.length;i++)mask[i]=!!(city.flags[city.map[i]&1023]&32);}
 else if(kind==='airTraffic'){field=new Uint16Array(mask.length);traffic=aviationTraffic(city);facilities=traffic.facilities;
  for(const f of facilities){const b=f.bounds,runway=b.y+b.height*(f.id===992?.145:f.id===993?.18:.25),load=Math.max(f.load,Math.round(traffic.requested/traffic.capacity*100));
   for(let y=Math.max(0,Math.floor(runway-3));y<=Math.min(height-1,Math.ceil(runway+3));y++)for(let x=0;x<width;x++){const i=y*width+x;mask[i]=1;field[i]=Math.max(field[i],load);}
   for(let y=Math.max(0,b.y-2);y<Math.min(height,b.y+b.height+2);y++)for(let x=Math.max(0,b.x-2);x<Math.min(width,b.x+b.width+2);x++){const i=y*width+x;mask[i]=1;field[i]=Math.max(field[i],load);}
  }
 }
 const value={kind,name:kind==='traffic'?'Road traffic':kind==='railTraffic'?'Rail traffic':'Air traffic',field,max,mask,goodHigh:false,includeWater:kind==='airTraffic',facilities,width,height,canvas:null,traffic};entries.set(kind,{revision:city.revision,step:city.baseStep,frame,population:city.population,commercial:city.rci[1],industrial:city.rci[2],value});return value;
}
