// Turbo education: displayed reach and monthly education use the same service field.
import {civicForId,civicRoadEntry} from './civic.js?v=production-63';
import {buildingOff} from './building-operations.js?v=approaches-56';
const cache=new WeakMap();
export function educationCoverage(city){const key=city.revision+':'+Object.entries(city.disabledBuildings||{}).join(';'),old=cache.get(city);if(old?.key===key&&old.power===city.power)return old.value;
 const width=city.width||120,height=city.height||100,field=new Uint16Array(city.map.length),homes=city.zones.filter(z=>z.type===5).map(z=>({...z,residents:(z.id===0x84?city.adjacentSmallHomeCount(z):city.zonePopulation(z))*20})),facilities=[];
 for(const z of city.zones){const b=civicForId(z.id);if(b?.kind!=='education')continue;const radius=b.radius||20,load=homes.reduce((n,h)=>n+(Math.abs(h.x-z.x)+Math.abs(h.y-z.y)<radius?h.residents:0),0),operating=!buildingOff(city,z)&&!!city.power[z.i]&&civicRoadEntry(city,z)>=0,factor=Math.min(1,b.capacity/Math.max(1,load))*(b.strength||1);facilities.push({...z,radius,capacity:b.capacity,load,operating,strength:b.strength||1,reason:buildingOff(city,z)?'Switched off':!city.power[z.i]?'Needs electricity':!operating?'Needs road access':'Teaching'});if(!operating)continue;
  for(let y=Math.max(0,z.y-radius);y<=Math.min(height-1,z.y+radius);y++)for(let x=Math.max(0,z.x-radius);x<=Math.min(width-1,z.x+radius);x++){const distance=Math.abs(x-z.x)+Math.abs(y-z.y),falloff=distance<=radius*.65?1:Math.max(0,(radius-distance)/(radius*.35)),i=y*width+x;field[i]=Math.min(1000,field[i]+Math.round(falloff*factor*1000));}
 }
 const residents=homes.reduce((n,h)=>n+h.residents,0),target=residents?homes.reduce((n,h)=>n+h.residents*field[h.i]/10,0)/residents:0,value={field,facilities,residents,target};cache.set(city,{key,power:city.power,value});return value;
}
