// CODE_03AEA1..03AF2F: repair blank cells every eighth base step. Source
// tables describe3x3,4x4 and6x6 footprints with center indices4,5 and14.
// The complete center word supplies flags; existing nonblank cells survive.
export function repairRomFootprint(map,x,y,centerWord,side,baseStep=0,width=120,height=100){
 if(baseStep&7)return 0;if(![3,4,6].includes(side))throw Error('Unsupported original facility footprint');
 const offset=Math.floor((side-1)/2),pivot=offset*side+offset;let repaired=0;
 for(let n=0;n<side*side;n++){const cx=x+n%side-offset,cy=y+Math.floor(n/side)-offset;if(cx<0||cx>=width||cy<0||cy>=height)continue;const i=cy*width+cx;if((map[i]&1023)===0){map[i]=(centerWord-pivot+n)&65535;repaired++;}}
 return repaired;
}
