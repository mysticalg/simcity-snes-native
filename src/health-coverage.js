// Shared preventive-care field for simulation and the placement overlay.
import {civicForId,civicRoadEntry} from './civic.js?v=background-64';
import {buildingOff} from './building-operations.js?v=background-64';
const cache=new WeakMap();
export function healthCoverage(city){const w=city.width||120,h=city.height||100,homes=city.zones.filter(z=>z.type===5).map(z=>({...z,residents:(z.id===0x84?city.adjacentSmallHomeCount(z):city.zonePopulation(z))*20})),operating=city.zones.filter(z=>civicForId(z.id)?.kind==='health'&&!buildingOff(city,z)&&city.power[z.i]&&civicRoadEntry(city,z)>=0),key=[w,h,homes.map(z=>z.i+':'+z.residents).join(','),operating.map(z=>{const b=civicForId(z.id);return[z.i,b.capacity,b.healthRadius,b.healthStrength].join(':');}).join(',')].join('|'),old=cache.get(city);if(old?.key===key)return old.result;
 const field=new Uint16Array(city.map.length),facilities=[];
 for(const z of operating){const b=civicForId(z.id),radius=b.healthRadius||24,load=homes.reduce((n,p)=>n+(Math.abs(p.x-z.x)+Math.abs(p.y-z.y)<radius?p.residents:0),0),factor=Math.min(1,b.capacity/Math.max(1,load))*(b.healthStrength||1);facilities.push({...z,radius,load,capacity:b.capacity,factor});
  for(let y=Math.max(0,z.y-radius);y<=Math.min(h-1,z.y+radius);y++)for(let x=Math.max(0,z.x-radius);x<=Math.min(w-1,z.x+radius);x++){const influence=Math.max(0,1-(Math.abs(x-z.x)+Math.abs(y-z.y))/radius)*factor,i=y*w+x;field[i]=Math.min(1000,field[i]+Math.round(influence*1000));}
 }const result={field,facilities};cache.set(city,{key,result});return result;
}
