import {repairRomFootprint} from './rom-maintenance.js?v=gift-workers-31';
import {stampZoneFootprint} from './rom-growth.js?v=processing-1';
// CODE_038CE8..038D24: compare residential census units>>8 to each count.
export function romFacilityDemand(residential,counts){const quota=(residential&65535)>>>8;return counts.map(count=>quota===(count&65535)?0:quota>(count&65535)?1:-1);}
// CODE_039449 tests nonzero, including negative quota flags, and clears the
// selected flag even when CODE_039940 rejects the site.
export function placeRomFacility(map,x,y,demand,width=120,height=100){
 const index=demand[0]!==0?0:demand[1]!==0?1:-1;if(index<0)return false;
 const changed=stampZoneFootprint(map,x,y,index===0?0x125:0x12e,width,height);demand[index]=0;return changed;
}
// CODE_0391DF/039207 plus three-wide CODE_03AF08 repair. $0B9B is
// exposed as repairPhase rather than silently treating it as the city tick.
export function updateRomFacility(map,x,y,demand,nextBounded,{baseStep=0,repairPhase=0,width=120,height=100}={}){
 const i=y*width+x,center=map[i],id=center&1023,index=id===0x129?0:id===0x132?1:-1;if(index<0)return null;
 const repaired=!(repairPhase&15)?repairRomFootprint(map,x,y,center,3,baseStep,width,height):0;
 const retired=demand[index]<0&&nextBounded(20)===0&&stampZoneFootprint(map,x,y,0x80,width,height);
 return {index,repaired,retired};
}
