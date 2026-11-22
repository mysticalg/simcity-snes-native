import {spcPitchQ8,spcTickSeconds} from './rom-sequence.js?v=horn-1';
// Port3 CODE_0AD7 adds16 to the command and chains via DATA_0E12.
// Effects use the independent $38/256 accumulator, not music tempo.
function planOriginalEffect(aram,rootCommand,{pitchSlides=false,volumeAutomation=false}={}){
 const word=p=>aram[p]|aram[p+1]<<8,voices=[],streams=[];let command=rootCommand;
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
   let note=null,slide=null;
   if(opcode===0xf9){note=aram[p++]-128;}
   else if(opcode!==0xf1){if(opcode<128||opcode>=0xc8)throw Error('Unsupported SFX opcode '+opcode.toString(16));note=opcode-128;}
   if(opcode===0xf9||opcode===0xf1){const delay=aram[p++],slideTicks=aram[p++],target=aram[p++]-128;if(!pitchSlides&&target!==(note??current?.note))throw Error('Unsupported nonconstant SFX pitch slide');if(delay!==0||slideTicks===0||slideTicks>length)throw Error('Unsupported SFX slide timing');slide={ticks:slideTicks,target};}
   if(note!==null){finish();current={command,channel,tick,note,left,right,...instrument,pitch:spcPitchQ8(aram,note*256,0,instrument.tuning),noteQ8:note*256,pitchSteps:[],slides:[]};if(volumeAutomation)current.stereoSteps=[];voices.push(current);}
   else{if(!current)throw Error('Missing SFX continuation voice');const prior=current.stereoSteps?.at(-1)||current;if(prior.left!==left||prior.right!==right){if(!volumeAutomation)throw Error('Unsupported SFX continuation state');current.stereoSteps.push({tick,left,right});}}
   if(slide&&pitchSlides){const fromQ8=current.noteQ8,stepQ8=spcSfxSlideStep(fromQ8,slide.target,slide.ticks);current.slides.push({tick,fromQ8,target:slide.target,ticks:slide.ticks,stepQ8});for(let n=1;n<=slide.ticks;n++){current.noteQ8=n===slide.ticks?slide.target*256:(current.noteQ8+stepQ8)&65535;current.pitchSteps.push({tick:tick+n-1,noteQ8:current.noteQ8,pitch:spcPitchQ8(aram,current.noteQ8,0,current.tuning)});}}
   tick+=length;
  }
  if(!ended)throw Error('SFX stream did not terminate');command=aram[0x0e12+command];
 }
 for(const voice of voices){voice.seconds=spcTickSeconds(voice.tick,56);voice.gateDuration=spcTickSeconds(voice.gateEndTick,56)-voice.seconds;voice.duration=spcTickSeconds(voice.endTick,56)-voice.seconds;if(voice.stereoSteps)voice.stereoAutomation=voice.stereoSteps.map(p=>({offset:spcTickSeconds(p.tick,56)-voice.seconds,gains:[p.left/128,p.right/128]}));voice.pitchAutomation=voice.pitchSteps.filter(p=>p.tick<=voice.gateEndTick).map(p=>({offset:spcTickSeconds(p.tick,56)-voice.seconds,pitch:p.pitch}));}
 return {voices,streams,duration:Math.max(...voices.map(v=>spcTickSeconds(v.endTick,56)))};
}

// CODE_17D5/17F8 creates a signed Q8 delta from integer note difference;
// CODE_0CB0/18FF snaps exactly to the target on the final tick.
export function spcSfxSlideStep(fromQ8,target,ticks){if(!Number.isInteger(ticks)||ticks<1||ticks>255)throw Error('Invalid SFX slide length');const delta=(target&127)-(fromQ8>>>8);return Math.sign(delta)*Math.floor(Math.abs(delta)*256/ticks);}
export function planOriginalShipHorn(aram){return planOriginalEffect(aram,5);}
export function planOriginalTornado(aram){return planOriginalEffect(aram,34,{pitchSlides:true});}

export function planOriginalFire(aram){return planOriginalEffect(aram,33,{pitchSlides:true,volumeAutomation:true});}
export function planOriginalMeltdown(aram){return planOriginalEffect(aram,30,{pitchSlides:true,volumeAutomation:true});}
