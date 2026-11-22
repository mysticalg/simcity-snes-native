// DATA_0096AE selects transition source; DATA_00960E/613 selects the
// following palette as target. The helpers below reproduce the palette worker.
export const SEASON_SOURCE=[3,3,0,0,0,1,1,1,2,2,2,3];
export function cityPaletteForMonth(month){if(!Number.isInteger(month)||month<1||month>12)throw Error('Invalid city month');return (SEASON_SOURCE[month-1]+1)&3;}
// CODE_00952C..0095C1 uses the complement of progress on descending
// channels and adds the result to the target, retaining its rounding bias.
export function blendRomCityColor(source,target,progress){
 if(!Number.isInteger(progress)||progress<0||progress>255)throw Error('Invalid palette progress');
 if(progress===255||source===target)return target;
 let color=0;for(const shift of [0,5,10]){const a=(source>>shift)&31,b=(target>>shift)&31;
  const value=b<a?b+Math.floor((a-b)*(255-progress)/256):a+Math.floor((b-a)*progress/256);color|=(value&31)<<shift;
 }return color;
}
// The palette worker touches byte20..BF andE0..FF only. Palette0 and6
// retain their original winter upload, even during later seasons.
export function romSeasonPalette(palettes,source,progress){
 const output=new Uint8Array(palettes[0]),a=palettes[source],b=palettes[(source+1)&3];
 for(let i=0x20;i<0x100;i+=2){if(i>=0xc0&&i<0xe0)continue;const color=blendRomCityColor(a[i]|a[i+1]<<8,b[i]|b[i+1]<<8,progress);output[i]=color&255;output[i+1]=color>>8;}
 return output;
}
export function createRomSeason(month=1){cityPaletteForMonth(month);return {source:SEASON_SOURCE[month-1],progress:255,next:260,active:false};}
export function changeRomSeason(state,month){cityPaletteForMonth(month);const source=SEASON_SOURCE[month-1];if(source!==state.source){state.source=source;state.progress=0;state.next=0;state.active=true;}return state;}
export function advanceRomSeason(state,frames=1){for(let i=0;i<frames&&state.active;i++){state.progress=state.next;state.next+=5;if(state.next>=256)state.active=false;}return state;}
