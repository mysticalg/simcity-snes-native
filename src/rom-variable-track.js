import {decodeSpcOrders,decodeSpcChannel,spcPitchQ8} from './rom-sequence.js?v=music-global-42';
import {spcVoiceVolumes} from './rom-mix.js?v=horn-1';
import {instrumentEnvelope} from './rom-envelope.js?v=horn-1';
import {createSpcGlobals,applySpcGlobal,stepSpcGlobals,createSpcClock,createSpcFiniteClock,spcClockSeconds} from './rom-music-clock.js?v=ending-music-49';

// City loops and finite ending lists replace all streams when channel zero ends.
// Decode bounded local streams, then execute global commands in channel order
// and advance their shared fades at the original end-of-tick point.
export function planVariableCityTrack(aram,trackId,{maxPatterns=trackId===6?12:3,finite=false}={}){
 if(!(finite?[17,18]:[4,5,6]).includes(trackId))throw Error('Unsupported variable music command');
 const orders=decodeSpcOrders(aram,trackId,{maxPatterns});if(orders.patterns.some(p=>p.suppressed))throw Error('Untranslated music channel suppression');
 const states=Array.from({length:8},()=>({})),patterns=[],entries=new Map(),commands=new Map(),events=[];let startTick=0;
 for(const [patternIndex,pattern]of orders.patterns.entries()){
  const lead=decodeSpcChannel(aram,pattern.channels[0],{maxEvents:4096,state:states[0],startTick,globalCommands:[],percussion:true});
  if(!lead.ended||lead.unsupported||!lead.events.length)throw Error('Untranslated variable-theme lead');
  const endTick=lead.events.at(-1).tick+lead.events.at(-1).length;if(endTick<=startTick)throw Error('Empty music pattern');
  patterns.push({pattern:pattern.pattern,order:pattern.address,startTick,endTick,activeMask:pattern.channels.reduce((mask,p,ch)=>mask|((p>>>8)?1<<ch:0),0)});
  for(let channel=0;channel<8;channel++){
   if(!pattern.channels[channel])continue;const global=[];
   const decoded=decodeSpcChannel(aram,pattern.channels[channel],{maxEvents:4096,state:states[channel],startTick,maxTicks:endTick,globalCommands:global,percussion:true});
   if(decoded.unsupported)throw Error('Untranslated city command '+decoded.unsupported.toString(16));states[channel]=decoded.state;
   for(const c of global){if(c.tick>=endTick)continue;const list=commands.get(c.tick)||[];list.push({...c,channel});commands.set(c.tick,list);}
   let previous=null;
   for(const e of decoded.events){
    if(e.tick>=endTick)break;const end=Math.min(endTick,e.tick+e.length),natural=Math.max(1,Math.floor(e.length*aram[0x3496+((e.articulation??0)>>4&7)]/256)),gate=e.nextIsTie?e.length:Math.max(1,Math.min(natural,e.length-2));
    if(e.kind==='rest')previous=null;
    else if(e.kind==='tie'){if(previous){previous.gateEndTick=Math.min(end,e.tick+gate);previous.keyOffTick=e.nextIsTie||e.tick+gate>=endTick?null:e.tick+gate;}}
    else{previous={...e,channel,patternIndex,gateEndTick:Math.min(end,e.tick+gate),keyOffTick:e.nextIsTie||e.tick+gate>=endTick?null:e.tick+gate,sample:aram[0x3400+e.instrument*6],envelope:instrumentEnvelope(aram,e.instrument),mixAutomation:[]};events.push(previous);}
    const list=entries.get(e.tick)||[];list.push({event:e,voice:previous,channel});entries.set(e.tick,list);
   }
  }
  startTick=endTick;
 }
 const seen=new Map();let period=null;
 for(let i=0;i<patterns.length;i++){const address=patterns[i].order;if(seen.has(address)){period=i-seen.get(address);break;}seen.set(address,i);}
 if(finite?!orders.ended:(!period||patterns.length<period*2))throw Error(finite?'Complete finite order list required':'Complete repeated city order cycle required');
 const loop=finite?null:{startTick:patterns[patterns.length-period].startTick,endTick:startTick},tempos=new Uint8Array(startTick),masters=new Uint8Array(startTick),globalState=new Uint16Array(startTick*4),globals=createSpcGlobals(),current=Array(8).fill(null),voices=Array(8).fill(null),instruments=Array(8).fill(0),volumes=Array.from({length:8},()=>({...createSpcGlobals(),masterQ8:255*256}));
 const empty=[],noteDirty=new Uint8Array(8);let currentPattern=0;
 for(let tick=0;tick<startTick;tick++){
  while(tick>=patterns[currentPattern].endTick)currentPattern++;const activeMask=patterns[currentPattern].activeMask;
  const changes=commands.get(tick)||empty,notes=entries.get(tick)||empty;
  noteDirty.fill(0);
  for(let channel=0;channel<8;channel++){
   for(const c of changes)if(c.channel===channel){if(c.opcode===0xe0)instruments[channel]=c.value<128?c.value:(c.value-0xca+globals.instrumentBase)&255;else if(c.opcode===0xed||c.opcode===0xee)applySpcGlobal(volumes[channel],{...c,opcode:c.opcode===0xed?0xe5:0xe6});else applySpcGlobal(globals,c);}
   for(const entry of notes)if(entry.channel===channel){current[channel]=entry.event;voices[channel]=entry.voice;if(entry.event.kind==='note'){noteDirty[channel]=true;if(entry.event.percussionOffset!==undefined)instruments[channel]=(entry.event.percussionOffset+globals.instrumentBase)&255;entry.voice.instrument=instruments[channel];entry.voice.sample=aram[0x3400+entry.voice.instrument*6];entry.voice.envelope=instrumentEnvelope(aram,entry.voice.instrument);entry.voice.globalTranspose=globals.globalTranspose;entry.voice.pitch=spcPitchQ8(aram,((entry.event.note+entry.event.transpose+globals.globalTranspose)*256+(entry.event.finePitch||0))&65535,entry.voice.instrument);}}
  }
  const masterDirty=globals.masterFade.remaining>0,global=stepSpcGlobals(globals);tempos[tick]=global.tempo;masters[tick]=global.masterVolume;globalState[tick*4]=globals.tempoQ8;globalState[tick*4+1]=globals.masterQ8;globalState[tick*4+2]=globals.tempoFade.remaining;globalState[tick*4+3]=globals.masterFade.remaining;
  for(let channel=0;channel<8;channel++){
   if(!(activeMask&(1<<channel)))continue;const volumeDirty=volumes[channel].masterFade.remaining>0,volume=stepSpcGlobals(volumes[channel]).masterVolume,voice=voices[channel],local=current[channel];if(!voice||tick>=voice.gateEndTick||!(noteDirty[channel]||masterDirty||volumeDirty))continue;
   const mix=spcVoiceVolumes(aram,{...local,volume,masterVolume:global.masterVolume});
   if(tick===voice.tick){voice.volume=volume;voice.tempo=global.tempo;voice.masterVolume=global.masterVolume;voice.dspVolumes=mix;voice.lastMix=mix;}
   else if(mix.left!==voice.lastMix.left||mix.right!==voice.lastMix.right){voice.mixAutomation.push({tick,left:mix.left,right:mix.right});voice.lastMix=mix;}
  }
 }
 const clock=finite?createSpcFiniteClock(tempos):createSpcClock(tempos,loop);
 for(const e of events){delete e.lastMix;e.seconds=spcClockSeconds(clock,e.tick);e.duration=spcClockSeconds(clock,Math.min(patterns[e.patternIndex].endTick,e.tick+e.length))-e.seconds;e.gateDuration=spcClockSeconds(clock,e.gateEndTick)-e.seconds;}
 return {trackId,finite,events:events.sort((a,b)=>a.tick-b.tick||a.channel-b.channel),patterns,loop,clock,tempos,masters,globalState,duration:spcClockSeconds(clock,startTick),globalCommands:[...commands.values()].flat().sort((a,b)=>a.tick-b.tick||a.channel-b.channel)};
}

export function planOriginalEndingTrack(aram,trackId){return planVariableCityTrack(aram,trackId,{maxPatterns:32,finite:true});}
