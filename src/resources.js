import {GOODS,hashEconomySeed} from './commodities.js';
export const RESOURCE_GOODS=['oil','metals','gold','diamonds','uranium'];
const cache=new WeakMap(),land=word=>{const id=word&1023;return !(id>0&&id<20);};
export function resourceSeed(city){return city.resourceSeed??city.civic?.economy?.resourceSeed??hashEconomySeed(`${city.scenario}:${city.name}:${city.width}x${city.height}`);}
export function geology(city){const seed=resourceSeed(city),old=cache.get(city);if(old?.seed===seed&&old.width===(city.width||120)&&old.height===(city.height||100))return old;
 const width=city.width||120,height=city.height||100,types=new Uint8Array(width*height),quantity=new Uint32Array(width*height),strength=new Float32Array(width*height);let state=hashEconomySeed(seed)||1;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 for(let type=0;type<RESOURCE_GOODS.length;type++){const patches=(type<2?1+Math.floor(random()*3):Math.floor(random()*3))*Math.max(1,Math.round(width*height/12000));for(let n=0;n<patches;n++){const cx=random()*width,cy=random()*height,radius=6+random()*12,yieldPerTile=[1200,1800,180,100,350][type]*(.6+random()*.8);
  for(let y=Math.max(0,Math.floor(cy-radius));y<Math.min(height,Math.ceil(cy+radius));y++)for(let x=Math.max(0,Math.floor(cx-radius));x<Math.min(width,Math.ceil(cx+radius));x++){const score=1-Math.hypot(x-cx,y-cy)/radius,i=y*width+x;if(score<=0||score<=strength[i])continue;strength[i]=score;types[i]=type+1;quantity[i]=Math.max(1,Math.floor(score*score*yieldPerTile));}
 }}
 const result={seed,width,height,types,quantity};cache.set(city,result);return result;
}
export function depositAt(city,i){const g=geology(city);if(i<0||i>=g.types.length||!land(city.map[i])||!g.types[i])return {good:null,initial:0,remaining:0};const initial=g.quantity[i],used=Math.max(0,Math.trunc(Number(city.civic?.economy?.depleted?.[i])||0));return {good:RESOURCE_GOODS[g.types[i]-1],initial,remaining:Math.max(0,initial-used)};}
export function depositsUnder(city,cells,good=null){return cells.flatMap(p=>{if(p.x<0||p.x>=(city.width||120)||p.y<0||p.y>=(city.height||100))return [];const i=p.y*(city.width||120)+p.x,d=depositAt(city,i);return d.remaining&&(!good||d.good===good)?[{i,...d}]:[];});}
export function extractResources(city,indices,good,requested){if(!RESOURCE_GOODS.includes(good))return 0;let left=Math.max(0,Math.trunc(requested)||0),extracted=0;city.civic.economy??={resourceSeed:resourceSeed(city)};city.civic.economy.depleted??={};for(const i of new Set(indices)){if(left<=0)break;const d=depositAt(city,i);if(d.good!==good)continue;const amount=Math.min(left,d.remaining);if(!amount)continue;city.civic.economy.depleted[i]=(city.civic.economy.depleted[i]||0)+amount;extracted+=amount;left-=amount;}return extracted;}
export function resourceColor(city,i){const d=depositAt(city,i);if(!d.good||!d.remaining)return null;return GOODS[d.good].color+'aa';}
export function resourceDescription(city,x,y){const d=depositAt(city,y*(city.width||120)+x);return d.good?`${GOODS[d.good].name}: ${d.remaining.toLocaleString()} / ${d.initial.toLocaleString()} remaining`:'No extractable deposit here';}
