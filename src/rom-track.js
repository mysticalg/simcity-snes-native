import {planVariableCityTrack} from './rom-variable-track.js?v=music-global-42';
import {decodeSpcOrders,decodeSpcChannel,spcPitch,spcTickSeconds,spcFadeVolume} from './rom-sequence.js?v=city-music-36';
import {spcVoiceVolumes} from './rom-mix.js?v=horn-1';
import {instrumentEnvelope} from './rom-envelope.js?v=horn-1';
// Fixed-tempo city themes use intro/body planning below. Later themes dispatch
// to the shared-clock planner. All verified city boundaries follow channel zero
// (CODE_14BE -> CODE_1453); other streams must not read past that boundary.
export function planOriginalCityTrack(aram,trackId=1,{maxPatterns}={}){
 if([4,5,6].includes(trackId))return planVariableCityTrack(aram,trackId,{maxPatterns});maxPatterns??=3;
 if(![1,2,3].includes(trackId))throw Error(`Unsupported city music track ${trackId}`);
 const orders=decodeSpcOrders(aram,trackId,{maxPatterns}),events=[],patterns=[],states=Array.from({length:8},()=>({}));let startTick=0,tempo=19,masterVolume=150;
 for(const pattern of orders.patterns){
  const lead=decodeSpcChannel(aram,pattern.channels[0],{maxEvents:2048,state:states[0],startTick});
  if(!lead.ended||lead.unsupported)throw Error('Unsupported city music lead command');
  const endTick=lead.events.at(-1).tick+lead.events.at(-1).length;
  if(!lead.events.length||endTick<=startTick)throw Error('Empty pattern');
  tempo=lead.events[0].tempo;masterVolume=lead.events[0].masterVolume;
  if(lead.events.some(e=>e.tempo!==tempo||e.masterVolume!==masterVolume))throw Error('Global automation needs a tick scheduler');
  patterns.push({pattern:pattern.pattern,startTick,endTick});
  for(let channel=0;channel<8;channel++){
   if(!pattern.channels[channel])continue;
   const decoded=decodeSpcChannel(aram,pattern.channels[channel],{maxEvents:2048,state:{...states[channel],tempo,masterVolume},startTick,maxTicks:endTick});
   if(decoded.unsupported)throw Error('Unsupported city music command '+decoded.unsupported.toString(16));states[channel]=channel===0?lead.state:decoded.state;
   let previous=null;
   for(let eventIndex=0;eventIndex<decoded.events.length;eventIndex++){
    const e=decoded.events[eventIndex],nextIsTie=e.nextIsTie;
    // CODE_1920: gate countdown or two ticks before the next non-tied note.
    const naturalGate=Math.max(1,Math.floor(e.length*aram[0x3496+((e.articulation??0)>>4&7)]/256));
    const gate=nextIsTie?e.length:Math.max(1,Math.min(naturalGate,e.length-2));
    if(e.tick>=endTick)break;const end=Math.min(endTick,e.tick+e.length);
    if(e.tempo!==tempo||e.masterVolume!==masterVolume)throw Error('Cross-channel global automation needs a tick scheduler');
    if(e.kind==='rest'){previous=null;continue;}
    if(e.kind==='tie'){if(previous){previous.gateEndTick=Math.min(end,e.tick+gate);previous.gateDuration=spcTickSeconds(previous.gateEndTick,tempo)-previous.seconds;previous.keyOffTick=nextIsTie||e.tick+gate>=endTick?null:e.tick+gate;}continue;}
    if(e.note>=74)throw Error('Untranslated percussion note');
    previous={...e,channel,gateEndTick:Math.min(end,e.tick+gate),sample:aram[0x3400+e.instrument*6],pitch:spcPitch(aram,e.note+e.transpose+e.globalTranspose,e.instrument),seconds:spcTickSeconds(e.tick,tempo),duration:spcTickSeconds(end,tempo)-spcTickSeconds(e.tick,tempo),gateDuration:spcTickSeconds(Math.min(end,e.tick+gate),tempo)-spcTickSeconds(e.tick,tempo)};
    previous.keyOffTick=nextIsTie||e.tick+gate>=endTick?null:e.tick+gate;previous.dspVolumes=spcVoiceVolumes(aram,e);previous.envelope=instrumentEnvelope(aram,e.instrument);events.push(previous);
   }
  }
  startTick=endTick;
 }
 for(const event of events){event.mixAutomation=[];if(!event.volumeFade)continue;let previous=event.dspVolumes;for(let tick=event.tick+1;tick<event.gateEndTick;tick++){const mixed=spcVoiceVolumes(aram,{...event,volume:spcFadeVolume(event.volumeFade,tick)});if(mixed.left!==previous.left||mixed.right!==previous.right){event.mixAutomation.push({tick,left:mixed.left,right:mixed.right});previous=mixed;}}}
 return {trackId,events:events.sort((a,b)=>a.seconds-b.seconds||a.channel-b.channel),patterns,duration:spcTickSeconds(startTick,tempo)};
}

export function planOriginalTrackOne(aram,options){return planOriginalCityTrack(aram,1,options);}
