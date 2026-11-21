// Native sample voice layer; sequence scheduling and DSP envelopes remain pending.
export class RomSampleAudio {
 constructor(){this.context=null;this.output=null;this.buffers=new Map();this.voices=new Set();}
 async start(){
  if(!this.context){this.context=new AudioContext();this.output=this.context.createGain();this.output.connect(this.context.destination);}
  await this.context.resume();
 }
 mute(muted){if(this.output)this.output.gain.setValueAtTime(muted?0:1,this.context.currentTime);}
 async load(index){
  if(this.buffers.has(index))return this.buffers.get(index);
  const name=index.toString(16).toUpperCase().padStart(2,'0');
  const response=await fetch(new URL(`../assets/audio/BRRSample${name}.wav`,import.meta.url));
  if(!response.ok)throw Error(`Sample ${index} unavailable`);
  const buffer=await this.context.decodeAudioData(await response.arrayBuffer());this.buffers.set(index,buffer);return buffer;
 }
 async voice(index,{pitch=0x1000,volume=1,duration=.25}={}){
  await this.start();const buffer=await this.load(index),source=this.context.createBufferSource(),gain=this.context.createGain();
  source.buffer=buffer;source.playbackRate.value=pitch/0x1000;gain.gain.value=volume;
  source.connect(gain);gain.connect(this.output);this.voices.add(source);
  source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect();};
  source.start();source.stop(this.context.currentTime+duration);return source;
 }
}
