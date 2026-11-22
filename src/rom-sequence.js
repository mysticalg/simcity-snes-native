// Confirmed SPC music start dispatch CODE_13C9 and pattern table CODE_147D.
export function trackPatternPointers(aram,trackId){
 if(trackId<1||trackId>19)throw Error('Unsupported music command');
 const word=p=>aram[p]|aram[p+1]<<8;
 const order=word(0x1b10+(trackId-1)*2),pattern=word(order);
 return {trackId,order,pattern,channels:Array.from({length:8},(_,i)=>word(pattern+i*2))};
}
// CODE_14DA/14FC note prefix decoding. Commands >= E0 must be handled
// before note emission; stop explicitly rather than inventing their semantics.
export function readSpcNotePrefix(aram,pointer,previousLength=1){
 let p=pointer,length=previousLength,articulation=null,value=aram[p++];
 if(value===0)return {kind:'end',next:p};
 if(value<0x80){length=value;value=aram[p++];if(value<0x80){articulation=value;value=aram[p++];}}
 if(value>=0xe0)return {kind:'command',opcode:value,next:p,length,articulation};
 return {kind:value===0xc9?'rest':value===0xc8?'tie':'note',opcode:value,length,articulation,next:p};
}
// Confirmed DATA_1814 command handlers. Modulation/echo commands are rejected
// until their state transitions are translated, even where lengths are known.
export function decodeSpcChannel(aram,pointer,{maxEvents=64,state={}}={}){
 const s={instrument:0,pan:10,volume:255,tempo:32,masterVolume:192,transpose:0,globalTranspose:0,...state};
 const events=[];let p=pointer,tick=0,length=1,articulation=null,call=null;
 const handlers={0xe0:['instrument',1],0xe1:['pan',1],0xe5:['masterVolume',1],0xe7:['tempo',1],0xe9:['globalTranspose',1],0xea:['transpose',1],0xed:['volume',1],0xf4:['finePitch',1],0xfa:['instrumentBase',1]};
 for(let n=0;n<4096&&events.length<maxEvents;n++){
  const prefix=readSpcNotePrefix(aram,p,length);p=prefix.next;
  length=prefix.length??length;
  if(prefix.articulation!==null&&prefix.articulation!==undefined)articulation=prefix.articulation;
  if(prefix.kind==='end'){
   // CODE_14BE: a single return slot and repeat counter, not a stack.
   if(call){call.remaining=(call.remaining-1)&255;if(call.remaining){p=call.target;continue;}p=call.returnTo;call=null;continue;}
   return {events,state:s,next:p,ended:true};
  }
  if(prefix.kind==='command'){
   // EE -> CODE_16BD/17F8: signed Q8 step, countdown and target byte.
   if(prefix.opcode===0xee){const ticks=aram[p++],target=aram[p++];s.volumeFade={startTick:tick,ticks,target,start:s.volume,step:Math.trunc((target-s.volume)*256/(ticks||256))};continue;}
   // EF -> CODE_16DA saves the address following all three operands.
   if(prefix.opcode===0xef){const target=aram[p]|aram[p+1]<<8,remaining=aram[p+2];call={target,remaining,returnTo:p+3};p=target;continue;}
   // CODE_1626: vibrato delay/rate/depth. CODE_16FD: echo mask and
   // left/right volumes. CODE_173B: echo delay, feedback and FIR preset.
   // These are retained in note state for a dry render; DSP modulation and
   // echo processing are deliberately not claimed reproduced here.
   const grouped={0xe3:['vibrato',3],0xf5:['echo',3],0xf7:['echoConfig',3]};
   if(grouped[prefix.opcode]){const [key,count]=grouped[prefix.opcode];s[key]=Array.from(aram.slice(p,p+count));p+=count;continue;}
   if(prefix.opcode===0xe4){s.vibrato=[0,0,0];continue;}
   const h=handlers[prefix.opcode];if(!h)return {events,state:s,next:p-1,unsupported:prefix.opcode};
   s[h[0]]=aram[p++];continue;
  }
  length=prefix.length;
  if(s.volumeFade){const f=s.volumeFade,elapsed=tick-f.startTick;s.volume=elapsed>=f.ticks?f.target:Math.floor((f.start*256+f.step*elapsed)/256);}
  events.push({tick,length,kind:prefix.kind,note:prefix.opcode-0x80,articulation,...s});tick+=length;
 }
 return {events,state:s,next:p,ended:false};
}

export function spcFadeVolume(fade,tick){
 const elapsed=Math.max(0,tick-fade.startTick);
 return elapsed>=fade.ticks?fade.target:Math.floor((fade.start*256+fade.step*elapsed)/256);
}
// CODE_0986..09F3: semitone table, octave shifts and instrument tuning.
export function spcPitch(aram,note,instrument){
 const word=p=>aram[p]|aram[p+1]<<8;
 const n=note&127,octave=Math.floor(n/12),table=word(0x1ae9+2*(n%12));
 let base=table*2;for(let o=octave;o<6;o++)base=Math.floor(base/2);
 const tuning=(aram[0x3400+instrument*6+4]<<8)|aram[0x3400+instrument*6+5];
 return Math.floor(base*tuning/256)&65535;
}
// Initial timer target $10 gives 2ms pulses; CODE_08AE accumulates tempo
// into an 8-bit phase and advances the music tick on carry.
export function planTrackOneLead(aram,maxEvents=3){
 const track=trackPatternPointers(aram,1),decoded=decodeSpcChannel(aram,track.channels[0],{maxEvents});
 return decoded.events.filter(e=>e.kind==='note').map(e=>({
  ...e,sample:aram[0x3400+e.instrument*6],pitch:spcPitch(aram,e.note+e.transpose+e.globalTranspose,e.instrument),
  seconds:spcTickSeconds(e.tick,e.tempo),duration:spcTickSeconds(e.tick+e.length,e.tempo)-spcTickSeconds(e.tick,e.tempo),
  gateDuration:spcTickSeconds(e.tick+Math.max(1,Math.floor(e.length*aram[0x3496+((e.articulation??0)>>4&7)]/256)),e.tempo)-spcTickSeconds(e.tick,e.tempo)
 }));
}

// Relative to the first music tick, phase starts at zero here. Track-start
// timer phase remains to be compared with original runtime capture.
export function spcTickSeconds(tick,tempo,phase=0){
 if(!Number.isInteger(tempo)||tempo<1||tempo>255)throw Error('Invalid SPC tempo');
 return Math.max(0,Math.ceil((tick*256-phase)/tempo))*.002;
}
// CODE_1453..147D. Order entries with high byte zero are control words;
// $80/$81 toggle channel suppression, other bytes repeat/jump via $42.
export function decodeSpcOrders(aram,trackId,{maxPatterns=64}={}){
 const word=p=>aram[p]|aram[p+1]<<8,track=trackPatternPointers(aram,trackId);
 let pointer=track.order,counter=0,suppressed=0;const patterns=[];
 for(let steps=0;steps<4096&&patterns.length<maxPatterns;steps++){
  const address=pointer,value=word(pointer);pointer+=2;
  if(value>>>8){patterns.push({address,pattern:value,suppressed,channels:Array.from({length:8},(_,i)=>word(value+2*i))});continue;}
  if(value===0)return {patterns,ended:true,pointer};
  if(value===0x80||value===0x81){suppressed=value===0x80?0x80:0;continue;}
  counter=(counter-1)&255;if(counter&128)counter=value;
  const target=word(pointer);pointer+=2;if(counter!==0)pointer=target;
 }
 return {patterns,ended:false,pointer};
}
