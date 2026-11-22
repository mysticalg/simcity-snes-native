// CODE_03AE25..03AE98 scans flagged gift centers for annual income
// and the casino crime modifier. No population weighting is applied.
export function romGiftEffects(map,flags){
 let income=0,crimeModifier=0;
 const hundred=new Set([0x2f5,0x34f,0x33d,0x334,0x32b,0x319]);
 for(const word of map){const id=word&1023;if(!(flags[id]&1))continue;
  if(id===0x2fe){income+=300;crimeModifier++;}else if(id===0x2ec)income+=200;else if(hundred.has(id))income+=100;
 }
 return {income:income&65535,crimeModifier};
}
