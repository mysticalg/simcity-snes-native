import {planTrackOneLead} from './rom-sequence.js';
// Native sample voice layer; sequence scheduling and DSP envelopes remain pending.
export class RomSampleAudio {
 constructor(){this.context=null;this.output=null;this.buffers=new Map();this.voices=new Set();this.directory=null;}
 async start(){
  if(!this.context){this.context=new AudioContext();this.output=this.context.createGain();this.output.connect(this.context.destination);}
  await this.context.resume();
  if(!this.directory){const response=await fetch(new URL('../assets/audio/directory.json',import.meta.url));if(!response.ok)throw Error('Sample directory unavailable');this.directory=await response.json();}
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
 async voice(index,{pitch=0x1000,volume=1,duration=.25,when}={}){
  await this.start();const buffer=await this.load(index),source=this.context.createBufferSource(),gain=this.context.createGain();
  source.buffer=buffer;source.playbackRate.value=pitch/0x1000;gain.gain.value=volume;
  const entry=this.directory[index];
  if(entry?.loop){source.loop=true;source.loopStart=((entry.loopAddress-entry.start)/9)*16/32000;source.loopEnd=buffer.duration;}
  source.connect(gain);gain.connect(this.output);this.voices.add(source);
  source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect();};
  const time=when??this.context.currentTime;source.start(time);source.stop(time+duration);return source;
 }
}

