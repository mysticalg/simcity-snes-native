import {planTrackOneLead,planTrackOneOpening} from './rom-sequence.js?v=mix-1';
import {spcTickSeconds} from './rom-sequence.js?v=mix-1';
import {planOriginalTrackOne} from './rom-track.js?v=mix-1';
// Native sample voice layer; sequence scheduling and DSP envelopes remain pending.
export class RomSampleAudio {
 constructor(){this.context=null;this.output=null;this.buffers=new Map();this.voices=new Set();this.directory=null;}
 async start(){
  if(!this.context){this.context=new AudioContext();this.output=this.context.createGain();this.output.connect(this.context.destination);}
  await this.context.resume();
  if(!this.directory){const response=await fetch(new URL('../assets/audio/directory.json',import.meta.url));if(!response.ok)throw Error('Sample directory unavailable');this.directory=await response.json();}
 }
 async playOriginalOpening(){
  await this.start();const r=await fetch(new URL('../assets/audio/aram.bin',import.meta.url));if(!r.ok)throw Error('Music data unavailable');const plan=planTrackOneOpening(new Uint8Array(await r.arrayBuffer()));
  await Promise.all([...new Set(plan.events.map(e=>e.sample))].map(i=>this.load(i)));const origin=this.context.currentTime+.05;
  for(const e of plan.events)await this.voice(e.sample,{pitch:e.pitch,volume:.12*(e.volume/255)*(e.masterVolume/255),duration:e.gateDuration,when:origin+e.seconds});return plan;
 }
 stopMusic(){if(this.musicTimer)clearInterval(this.musicTimer);this.musicTimer=null;this.music=null;for(const voice of this.voices){try{voice.stop();}catch{}}}
 async playOriginalTrackOne({offline=false}={}){
  await this.start();this.stopMusic();const response=await fetch(new URL('../assets/audio/aram.bin',import.meta.url));if(!response.ok)throw Error('Music data unavailable');
  const plan=planOriginalTrackOne(new Uint8Array(await response.arrayBuffer()));
  await Promise.all([...new Set(plan.events.map(e=>e.sample))].map(i=>this.load(i)));const origin=this.context.currentTime+.05;
  const play=(event,shift=0)=>{const seconds=spcTickSeconds(event.tick+shift,event.tempo),gate=spcTickSeconds(event.gateEndTick+shift,event.tempo)-seconds;return this.voice(event.sample,{pitch:event.pitch,volume:.5,stereo:[event.dspVolumes.left/128,event.dspVolumes.right/128],stereoAutomation:event.mixAutomation.map(p=>({offset:spcTickSeconds(p.tick+shift,event.tempo)-seconds,gains:[p.left/128,p.right/128]})),duration:gate,when:origin+seconds});};
  if(offline){for(const event of plan.events)await play(event);return plan;}
  const loop=plan.patterns.at(-1),loopIndex=plan.events.findIndex(e=>e.tick>=loop.startTick);let index=0,shift=0;
  this.music={track:1,scheduled:0,cycles:0};
  const schedule=()=>{while(this.music){const event=plan.events[index],when=origin+spcTickSeconds(event.tick+shift,event.tempo);if(when>this.context.currentTime+1)break;play(event,shift).catch(error=>{this.lastError=error.message;this.stopMusic();});this.music.scheduled++;if(++index===plan.events.length){index=loopIndex;shift+=loop.endTick-loop.startTick;this.music.cycles++;}}};
  schedule();this.musicTimer=setInterval(schedule,100);return plan;
 }
 async playOriginalLead(){
  await this.start();const response=await fetch(new URL('../assets/audio/aram.bin',import.meta.url));const aram=new Uint8Array(await response.arrayBuffer()),events=planTrackOneLead(aram);
  await Promise.all(events.map(e=>this.load(e.sample)));const origin=this.context.currentTime+.05;
  for(const e of events)await this.voice(e.sample,{pitch:e.pitch,volume:.15*e.volume/255,duration:e.gateDuration,when:origin+e.seconds});return events;
 }
 mute(muted){if(this.output)this.output.gain.setValueAtTime(muted?0:1,this.context.currentTime);}
 async load(index){
  if(this.buffers.has(index))return this.buffers.get(index);
  const name=index.toString(16).toUpperCase().padStart(2,'0');
  const response=await fetch(new URL(`../assets/audio/BRRSample${name}.wav`,import.meta.url));
  if(!response.ok)throw Error(`Sample ${index} unavailable`);
  const buffer=await this.context.decodeAudioData(await response.arrayBuffer());this.buffers.set(index,buffer);return buffer;
 }
 async voice(index,{pitch=0x1000,volume=1,stereo=null,stereoAutomation=[],duration=.25,when}={}){
  await this.start();const buffer=await this.load(index),source=this.context.createBufferSource(),gain=this.context.createGain();
  source.buffer=buffer;source.playbackRate.value=pitch/0x1000;gain.gain.value=volume;
  const entry=this.directory[index];
  if(entry?.loop){source.loop=true;source.loopStart=((entry.loopAddress-entry.start)/9)*16/32000;source.loopEnd=buffer.duration;}
  source.connect(gain);const spatial=[];
  if(stereo){const merger=this.context.createChannelMerger(2);for(let side=0;side<2;side++){const channelGain=this.context.createGain();channelGain.gain.value=stereo[side];for(const point of stereoAutomation)channelGain.gain.setValueAtTime(point.gains[side],(when??this.context.currentTime)+point.offset);gain.connect(channelGain);channelGain.connect(merger,0,side);spatial.push(channelGain);}merger.connect(this.output);spatial.push(merger);}else gain.connect(this.output);this.voices.add(source);
  source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect();for(const node of spatial)node.disconnect();};
  const time=when??this.context.currentTime;source.start(time);source.stop(time+duration);return source;
 }
}

