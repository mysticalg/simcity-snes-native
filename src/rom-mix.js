// SPC CODE_1A8E: high byte of each MUL YA, including the final square.
// CODE_18BE/18C3: Q8 pan-table interpolation and side-specific phase bits.
export function spcVoiceVolumes(aram,{volume=255,masterVolume=192,articulation=0x7f,pan=10,panFraction=0,tremolo=255}={}){
 const high=(a,b)=>((a&255)*(b&255))>>>8;
 let amplitude=high(tremolo,masterVolume);amplitude=high(amplitude,aram[0x349e+(articulation&15)]);amplitude=high(amplitude,volume);amplitude=high(amplitude,amplitude);
 const panWord=((pan&31)<<8)|(panFraction&255),side=word=>{const index=word>>>8,fraction=word&255,base=aram[0x1aa0+index],difference=(aram[0x1aa1+index]-base)&255;return high(amplitude,(base+high(difference,fraction))&255);};
 const left=side(panWord)*(pan&128?-1:1),right=side((0x1400-panWord)&65535)*(pan&64?-1:1);
 return {amplitude,left,right};
}
