import {aviationTraffic} from './aviation.js?v=approaches-56';
const cache=new WeakMap();
export function transportOverlay(city,kind){
 const frame=kind==='airTraffic'?Math.floor((city.civic.aviation?.frames||0)/60):0,entries=cache.get(city)||new Map();cache.set(city,entries);const prior=entries.get(kind);if(prior&&prior.revision===city.revision&&prior.step===city.baseStep&&prior.frame===frame&&prior.population===city.population&&prior.commercial===city.rci[1]&&prior.industrial===city.rci[2])return prior.value;
 const width=city.width||120,height=city.height||100,mask=new Uint8Array(city.map.length);let field,max=100,facilities=[],traffic=null;
 if(kind==='traffic'){field=city.traffic;max=240;for(let i=0;i<mask.length;i++)mask[i]=!!(city.flags[city.map[i]&1023]&64);}
 else if(kind==='railTraffic'){field=Uint16Array.from(city.railTrafficField||new Uint16Array(mask.length));let seats=null,riders=null;if(city.transitEnabled){seats=new Uint32Array(mask.length);riders=new Uint32Array(mask.length);for(const t of city.transitTrains||[])for(const i of new Set(t.route.map(node=>node%mask.length))){seats[i]+=t.capacity;riders[i]+=t.passengers;}}for(let i=0;i<mask.length;i++){mask[i]=!!((city.flags[city.map[i]&1023]&32)||city.transitTracks?.[i]);if(seats?.[i])field[i]=Math.max(field[i],Math.round(riders[i]/seats[i]*100));}}
 else if(kind==='airTraffic'){field=new Uint16Array(mask.length);traffic=aviationTraffic(city);facilities=traffic.facilities;
  for(const f of facilities){const b=f.bounds,load=Math.max(f.load,Math.round(traffic.requested/traffic.capacity*100));
   for(const a of city.civic.aviation?.aircraft||[]){if(a.root!==f.i)continue;let from={x:a.x,y:a.y};for(const to of a.route.slice(a.segment)){const steps=Math.min((width+height)*2+64,Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)*2)));for(let n=0;n<=steps;n++){const xx=Math.floor(from.x+(to.x-from.x)*n/steps),yy=Math.floor(from.y+(to.y-from.y)*n/steps);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=xx+dx,y=yy+dy;if(x<0||x>=width||y<0||y>=height)continue;const i=y*width+x;mask[i]=1;field[i]=Math.max(field[i],load);}}from=to;}}
   for(let y=Math.max(0,b.y-2);y<Math.min(height,b.y+b.height+2);y++)for(let x=Math.max(0,b.x-2);x<Math.min(width,b.x+b.width+2);x++){const i=y*width+x;mask[i]=1;field[i]=Math.max(field[i],load);}
  }
 }
 const value={kind,name:kind==='traffic'?'Road traffic':kind==='railTraffic'?'Rail traffic':'Air traffic',field,max,mask,goodHigh:false,includeWater:kind==='airTraffic',facilities,width,height,canvas:null,traffic};entries.set(kind,{revision:city.revision,step:city.baseStep,frame,population:city.population,commercial:city.rci[1],industrial:city.rci[2],value});return value;
}
