// Requested Turbo amenities; these are explicit balance rules, not ROM formulas.
import {civicForId,civicBounds} from './civic.js?v=region-traffic-62';
import {buildingOff} from './building-operations.js?v=approaches-56';
import {aggregateRomLandValue} from './rom-land-value.js';
export const PARK_LAND_CAP=250;
const cache=new WeakMap();
const nativePark={name:'Park',tool:4,kind:'park',radius:8,landBonus:10,happiness:6,size:1};
export function parkProfile(b){return {...b,radius:Math.ceil(b.radius*1.5),landBonus:b.landBonus*2};}
export function parkTransportEntry(city,z){const b=civicBounds(z)||{width:1,height:1},reach=Math.max(2,Math.ceil(Math.max(b.width,b.height)/2)+1),w=city.width,h=city.height;for(let dy=-reach;dy<=reach;dy++)for(let dx=-reach;dx<=reach;dx++){const x=z.x+dx,y=z.y+dy;if(x>=0&&x<w&&y>=0&&y<h&&(city.flags[city.map[y*w+x]&1023]&96))return y*w+x;}return -1;}
export function plazaGrowthBonus(city,z){return z.type===6?parkServices(city).commerce[z.i]*12:0;}
export function parkContribution(p,x,y){const b=p.bounds,dx=Math.max(b.x-x,0,x-(b.x+b.width-1)),dy=Math.max(b.y-y,0,y-(b.y+b.height-1)),distance=Math.hypot(dx,dy);if(distance>p.radius)return {land:0,commerce:0,happiness:0};const falloff=1-distance/(p.radius+1);return {land:Math.round(p.landBonus*falloff),commerce:Math.round(p.commerce*falloff),happiness:Math.round(p.happiness*falloff)};}
export function parkServices(city){
 const key=city.revision+':'+Object.entries(city.disabledBuildings||{}).join(';'),prior=cache.get(city);
 if(prior?.key===key)return prior.value;
 const active=city.zones.filter(z=>civicForId(z.id)?.kind==='park').map(z=>({z,b:parkProfile(civicForId(z.id)),off:buildingOff(city,z),road:parkTransportEntry(city,z)>=0}));
 // Tool 4 uses terrain tile 38, so it is absent from the zone-centre list.
 for(let i=0;i<city.map.length;i++)if((city.map[i]&1023)===38)active.push({z:{i,id:38,x:i%city.width,y:Math.floor(i/city.width)},b:parkProfile(nativePark),off:false,road:true});
 const layout=active.map(({z,off,road})=>z.i+':'+z.id+':'+Number(off)+':'+Number(road)).join(';');if(prior?.layout===layout){prior.key=key;return prior.value;}
 const w=city.width||120,h=city.height||100,land=new Uint8Array(city.map.length),happiness=new Uint8Array(city.map.length),commerce=new Uint8Array(city.map.length),rawLand=new Uint32Array(city.map.length),rawCommerce=new Uint32Array(city.map.length),facilities=[];
 for(const {z,b,off,road} of active){const bounds=civicBounds(z)||{x:z.x,y:z.y,width:1,height:1},operating=!off&&road;
  const facility={i:z.i,id:z.id,tool:b.tool,name:b.name,bounds,operating,reason:off?'Switched off':!operating?'Needs road or rail access':'Open to residents',radius:b.radius,landBonus:b.landBonus,happiness:b.happiness,commerce:b.commerce||0};facilities.push(facility);if(!operating)continue;
  for(let y=Math.max(0,bounds.y-b.radius);y<Math.min(h,bounds.y+bounds.height+b.radius);y++)for(let x=Math.max(0,bounds.x-b.radius);x<Math.min(w,bounds.x+bounds.width+b.radius);x++){
   const dx=Math.max(bounds.x-x,0,x-(bounds.x+bounds.width-1)),dy=Math.max(bounds.y-y,0,y-(bounds.y+bounds.height-1)),distance=Math.hypot(dx,dy);if(distance>b.radius)continue;const falloff=1-distance/(b.radius+1),i=y*w+x;
   rawLand[i]+=Math.round(b.landBonus*falloff);rawCommerce[i]+=Math.round((b.commerce||0)*falloff);land[i]=Math.min(PARK_LAND_CAP,rawLand[i]);happiness[i]=Math.min(50,happiness[i]+Math.round(b.happiness*falloff));commerce[i]=Math.min(60,rawCommerce[i]);
  }
 }
 const value={land,happiness,commerce,rawLand,rawCommerce,facilities};cache.set(city,{key,layout,value});return value;
}
export function applyParkBenefits(city,{newBase=false}={}){
 const s=parkServices(city);
 if(newBase||city._parkLandOutput!==city.landValue)city.parkLandBase=city.landValue.slice();
 if(s.facilities.length||city._parkHadFacilities){const base=city.parkLandBase;for(let i=0;i<base.length;i++)city.landValue[i]=Math.min(250,base[i]+s.land[i]);city.meanLandValue=aggregateRomLandValue(city.map,city.landValue.slice(),city.width,city.height);}
 city._parkLandOutput=city.landValue;city._parkHadFacilities=!!s.facilities.length;
 let total=0,people=0,crime=0,pollution=0;
 for(const z of city.zones)if(z.type===5){const weight=Math.max(1,z.id===0x84?city.adjacentSmallHomeCount(z):city.zonePopulation(z));people+=weight;total+=s.happiness[z.i]*weight;crime+=(city.crime[z.i]||0)*weight;pollution+=(city.pollution[z.i]||0)*weight;}
 let commerce=0,jobs=0;for(const z of city.zones)if(z.type===6){const weight=Math.max(1,city.zonePopulation(z));jobs+=weight;commerce+=s.commerce[z.i]*weight;}city.civic.plazaCommerce=jobs?commerce/jobs:0;
 city.civic.parkHappiness=people?total/people:0;
 city.civic.happiness=Math.round(Math.max(0,Math.min(100,50+city.civic.parkHappiness-(people?(crime+pollution)/people/255*20:0))));
 return s;
}
export function drawParkCoverage(ctx,city,z){const b=civicForId(z?.id);if(b?.kind!=='park')return;const service=parkServices(city).facilities.find(p=>p.i===z.i),bounds=civicBounds(z),r=parkProfile(b).radius*8;ctx.save();ctx.beginPath();ctx.roundRect(bounds.x*8-r,bounds.y*8-r,bounds.width*8+2*r,bounds.height*8+2*r,r);ctx.fillStyle=service?.operating?'#8ed68d22':'#b4b4b422';ctx.strokeStyle=service?.operating?'#a9ef8b':'#a5a5a5';ctx.lineWidth=.7;ctx.fill();ctx.stroke();ctx.restore();}
