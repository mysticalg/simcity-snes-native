// CODE_03A24B builds $7FB47A (15x13 words) using CODE_039E61's byte
// Manhattan distance. Called by density before it replaces $0BAB/$0BAC.
export function romCommercialRate(centerX,centerY,width=120,height=100){const columns=Math.ceil(width/8);
 return Int16Array.from({length:columns*Math.ceil(height/8)},(_,i)=>{
  const x=(i%columns)*4,y=Math.floor(i/columns)*4;
  const distance=Math.min(32,(Math.abs(x-(centerX&255))+Math.abs(y-(centerY&255)))&255);
  return 64-distance*4;
 });
}
// CODE_039A0E's disabled branch returns A=0; its LDY #F448 is unused.
export function commercialLocalScore(rates,x,y,transport,width=120){return transport===0?0:rates[(y>>3)*Math.ceil(width/8)+(x>>3)];}
// CODE_039A31 returns Y via TYA on both branches.
export function industrialLocalScore(transport){return transport===0?-1000:0;}
