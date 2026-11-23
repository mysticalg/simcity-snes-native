// Requested Turbo amenities; these are explicit balance rules, not ROM formulas.
import {civicForId,civicBounds,civicRoadEntry} from './civic.js?v=education-traffic-27';
import {buildingOff} from './building-operations.js?v=education-traffic-27';
const cache=new WeakMap();
export function parkServices(city){
 const key=city.revision+':'+Object.entries(city.disabledBuildings||{}).join(';'),prior=cache.get(city);
 if(prior?.key===key)return prior.value;
 const w=city.width||120,h=city.height||100,land=new Uint8Array(city.map.length),happiness=new Uint8Array(city.map.length),facilities=[];
 for(const z of city.zones){const b=civicForId(z.id);if(b?.kind!=='park')continue;const bounds=civicBounds(z),operating=!buildingOff(city,z)&&civicRoadEntry(city,z)>=0;
  facilities.push({i:z.i,operating,reason:buildingOff(city,z)?'Switched off':!operating?'Needs road access':'Open to residents',radius:b.radius,landBonus:b.landBonus,happiness:b.happiness});if(!operating)continue;
  for(let y=Math.max(0,bounds.y-b.radius);y<Math.min(h,bounds.y+bounds.height+b.radius);y++)for(let x=Math.max(0,bounds.x-b.radius);x<Math.min(w,bounds.x+bounds.width+b.radius);x++){
   const dx=Math.max(bounds.x-x,0,x-(bounds.x+bounds.width-1)),dy=Math.max(bounds.y-y,0,y-(bounds.y+bounds.height-1)),distance=Math.hypot(dx,dy);if(distance>b.radius)continue;const falloff=1-distance/(b.radius+1),i=y*w+x;
   land[i]=Math.min(60,land[i]+Math.round(b.landBonus*falloff));happiness[i]=Math.min(30,happiness[i]+Math.round(b.happiness*falloff));
  }
 }
 const value={land,happiness,facilities};cache.set(city,{key,value});return value;
}
export function applyParkBenefits(city,{newBase=false}={}){
 const s=parkServices(city);
 if(newBase||city._parkLandOutput!==city.landValue)city.parkLandBase=city.landValue.slice();
 if(s.facilities.length||city._parkHadFacilities){const base=city.parkLandBase;for(let i=0;i<base.length;i++)city.landValue[i]=Math.min(250,base[i]+s.land[i]);}
 city._parkLandOutput=city.landValue;city._parkHadFacilities=!!s.facilities.length;
 let total=0,people=0,crime=0,pollution=0;
 for(const z of city.zones)if(z.type===5){const weight=Math.max(1,z.id===0x84?city.adjacentSmallHomeCount(z):city.zonePopulation(z));people+=weight;total+=s.happiness[z.i]*weight;crime+=(city.crime[z.i]||0)*weight;pollution+=(city.pollution[z.i]||0)*weight;}
 city.civic.parkHappiness=people?total/people:0;
 city.civic.happiness=Math.round(Math.max(0,Math.min(100,50+city.civic.parkHappiness-(people?(crime+pollution)/people/255*20:0))));
 return s;
}
export function drawParkCoverage(ctx,city,z){const b=civicForId(z?.id);if(b?.kind!=='park')return;const service=parkServices(city).facilities.find(p=>p.i===z.i);ctx.save();ctx.beginPath();ctx.arc(z.x*8+4,z.y*8+4,b.radius*8,0,Math.PI*2);ctx.fillStyle=service?.operating?'#8ed68d22':'#b4b4b422';ctx.strokeStyle=service?.operating?'#a9ef8b':'#a5a5a5';ctx.lineWidth=.7;ctx.fill();ctx.stroke();ctx.restore();}
