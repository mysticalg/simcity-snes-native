import {repairRomFootprint} from './rom-maintenance.js?v=gift-workers-31';
import {applyRomMeltdown} from './rom-disasters.js?v=megacity-1';
// CODE_03AA9F..03ABF5. Custom resized facilities do not use these tables.
const sides=new Map([[0x28c,4],[0x27c,4],[0x249,3],[0x252,3],[0x307,3],[0x310,3],[0x25c,4],[0x36b,4],[0x2a5,6],[0x26c,4]]);
export const NUCLEAR_RANDOM_MAXIMA=[45000,30000,15000];
export const isRomUtilityCenter=id=>sides.has(id);
export function updateRomUtilityCenter(map,flags,x,y,nextBounded,{baseStep=0,difficulty=0,allowMeltdown=true,width=120,height=100}={}){
 const center=map[y*width+x],id=center&1023,side=sides.get(id);if(!side)return null;
 if(id===0x27c){const roll=nextBounded(NUCLEAR_RANDOM_MAXIMA[difficulty]);if(roll===0&&allowMeltdown)return {repaired:0,meltdown:applyRomMeltdown(map,flags,x,y,nextBounded,width,height)};}
 return {repaired:repairRomFootprint(map,x,y,center,side,baseStep,width,height),meltdown:null};
}
