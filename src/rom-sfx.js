import {spcPitchQ8,spcTickSeconds} from './rom-sequence.js?v=horn-1';
// Port3 CODE_0AD7 adds16 to the command and chains via DATA_0E12.
// Effects use the independent $38/256 accumulator, not music tempo.
export function planOriginalShipHorn(aram){
 const word=p=>aram[p]|aram[p+1]<<8,voices=[],streams=[];let command=5;
 for(let channel=7;command;channel--){
  if(channel<0)throw Error('Invalid SFX chain');
  const pointer=word(0x0da4+(command+16)*2);streams.push({command,pointer,channel});
  let p=pointer,tick=3,length=1,left=112,right=112,instrument=null,current=null,ended=false;
  const finish=()=>{if(current){current.endTick=tick;current.gateEndTick=Math.max(current.tick,tick-2);}};
  for(let steps=0;steps<1024;steps++){
   let opcode=aram[p++];
   if(opcode===0){finish();ended=true;break;}
   if(opcode===0xe0){const id=aram[p++],base=0x0cd8+id*9;instrument={id,sample:aram[base+4],envelope:{adsr1:aram[base+5],adsr2:aram[base+6],gain:aram[base+7]},tuning:aram[base+8]*256};left=aram[base];right=aram[base+1];continue;}
   if(opcode<128){length=opcode;opcode=aram[p++];if(opcode<128){left=opcode;opcode=aram[p++];if(opcode<128){right=opcode;opcode=aram[p++];}else right=left;}}
   if(!instrument)throw Error('Missing SFX instrument');
   let note=null;
   if(opcode===0xf9){note=aram[p++]-128;}
   else if(opcode!==0xf1){if(opcode<128||opcode>=0xc8)throw Error('Unsupported SFX opcode '+opcode.toString(16));note=opcode-128;}
   if(opcode===0xf9||opcode===0xf1){const delay=aram[p++],slideTicks=aram[p++],target=aram[p++]-128;if(target!==(note??current?.note))throw Error('Unsupported nonconstant SFX pitch slide');if(delay!==0||slideTicks>length)throw Error('Unsupported SFX slide timing');}
   if(note!==null){finish();current={command,channel,tick,note,left,right,...instrument,pitch:spcPitchQ8(aram,note*256,0,instrument.tuning)};voices.push(current);}
   else if(!current||current.left!==left||current.right!==right)throw Error('Unsupported SFX continuation state');
   tick+=length;
  }
  if(!ended)throw Error('SFX stream did not terminate');command=aram[0x0e12+command];
 }
 for(const voice of voices){voice.seconds=spcTickSeconds(voice.tick,56);voice.gateDuration=spcTickSeconds(voice.gateEndTick,56)-voice.seconds;voice.duration=spcTickSeconds(voice.endTick,56)-voice.seconds;}
 return {voices,streams,duration:Math.max(...voices.map(v=>spcTickSeconds(v.endTick,56)))};
}
