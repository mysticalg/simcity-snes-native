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
 const events=[];let p=pointer,tick=0,length=1;
 const handlers={0xe0:['instrument',1],0xe1:['pan',1],0xe5:['masterVolume',1],0xe7:['tempo',1],0xe9:['globalTranspose',1],0xea:['transpose',1],0xed:['volume',1],0xf4:['finePitch',1],0xfa:['instrumentBase',1]};
 for(let n=0;n<4096&&events.length<maxEvents;n++){
  const prefix=readSpcNotePrefix(aram,p,length);p=prefix.next;
  if(prefix.kind==='end')return {events,state:s,next:p,ended:true};
  if(prefix.kind==='command'){
   const h=handlers[prefix.opcode];if(!h)return {events,state:s,next:p-1,unsupported:prefix.opcode};
   s[h[0]]=aram[p++];continue;
  }
  length=prefix.length;
  events.push({tick,length,kind:prefix.kind,note:prefix.opcode-0x80,articulation:prefix.articulation,...s});tick+=length;
 }
 return {events,state:s,next:p,ended:false};
}
