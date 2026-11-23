// CODE_03961D: signed byte development delta *4, added to an 8x8-cell
// coarse word at $7FAE62. This is an index, not a percentage or population.
export function addRomGrowthRate(field,x,y,delta,width=120){
 const i=(y>>3)*Math.ceil(width/8)+(x>>3),signedByte=(delta<<24)>>24;
 field[i]=(field[i]+signedByte*4)<<16>>16;return field[i];
}
// CODE_03891F, after the city's incremented base step satisfies (step&3)==1.
export function decayRomGrowthRate(field){
 // The source uses an unsigned comparison after INC on negative words:
 // -1 becomes zero, fails CMP #$FF38/BCS, and is reset to -200.
 for(let i=0;i<field.length;i++){const v=field[i];field[i]=v>0?Math.min(200,v-1):v<0?(v===-1?-200:Math.max(-200,v+1)):0;}
 return field;
}
export function cityGrowthRateAt(city,x,y){return city.growthRate?.[(y>>3)*Math.ceil(city.width/8)+(x>>3)]||0;}
