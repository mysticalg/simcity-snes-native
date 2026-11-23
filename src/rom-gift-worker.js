import {repairRomFootprint} from './rom-maintenance.js?v=gift-workers-31';
import {stampZoneFootprint} from './rom-growth.js?v=processing-1';
// Headquarters use the police/fire workers instead of CODE_03AE25.
const centers=new Set([0x2bf,0x2c8,0x2d1,0x2da,0x2e3,0x2ec,0x2f5,0x2fe,0x319,0x322,0x32b,0x334,0x33d,0x346,0x34f]);
export const isRomGiftCenter=id=>centers.has(id);
// CODE_03AE25/03AE47: repair first, then consume the promotion flag for
// one house stage. Even a rejected redraw clears the complete flag word.
export function updateRomGiftCenter(map,x,y,pending,{baseStep=0,width=120,height=100}={}){
 const center=map[y*width+x],id=center&1023;if(!centers.has(id))return null;
 const repaired=repairRomFootprint(map,x,y,center,3,baseStep,width,height);let upgraded=false,remaining=pending&65535;
 if(remaining&&[0x2bf,0x2c8,0x2d1].includes(id)){upgraded=stampZoneFootprint(map,x,y,id+5,width,height);remaining=0;}
 return {repaired,upgraded,pending:remaining,from:id,to:map[y*width+x]&1023};
}
