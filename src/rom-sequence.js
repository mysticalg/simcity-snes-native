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
