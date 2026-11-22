import {spcPitchQ8,spcTickSeconds} from './rom-sequence.js?v=vibrato-1';
// CODE_19D9: folded triangle, sign from phase bit7. Depth >=F1 uses
// the low nibble as a wider Q8 pitch displacement rather than high-byte MUL.
export function spcVibratoDelta(phase,depth){
 phase&=255;depth&=255;let wave=(phase*4)&255;if(phase&64)wave^=255;
 const magnitude=depth>=241?wave*(depth&15):Math.floor(wave*depth/256);
 return (phase&128?-magnitude:magnitude)||0;
}
// CODE_19A6 and CODE_1A40 interpolate LFO position on 2ms timer pulses.
// Global tempo phase is anchored to zero, as in the native track scheduler;
// original track-start phase still requires runtime comparison.
export function planSpcVibrato(aram,event,shift=0){
 const [delay,rate,depth]=event.vibrato||[0,0,0];if(!depth||!rate)return [];
 const startTick=event.tick+shift,endTick=event.gateEndTick+shift,start=spcTickSeconds(startTick,event.tempo),end=spcTickSeconds(endTick,event.tempo);
 const base=((event.note+(event.transpose||0)+(event.globalTranspose||0))*256+(event.finePitch||0))&65535,points=[];let previous=spcPitchQ8(aram,base,event.instrument);
 for(let pulse=Math.round(start/.002)+1;pulse*.002<end;pulse++){
  const accumulator=pulse*event.tempo,elapsed=Math.floor(accumulator/256)-startTick;if(elapsed<delay)continue;
  const phase=(rate*(elapsed-delay)+Math.floor(rate*(accumulator&255)/256))&255,pitch=spcPitchQ8(aram,base+spcVibratoDelta(phase,depth),event.instrument);
  if(pitch!==previous){points.push({offset:pulse*.002-start,pitch});previous=pitch;}
 }
 return points;
}
