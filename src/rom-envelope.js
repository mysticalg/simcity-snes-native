// Envelope behavior adapted to native JS from snes_spc 0.9.0 SPC_DSP.cpp.
// Copyright (C) 2007 Shay Green; LGPL-2.1-or-later.
// Modifications: standalone envelope-only renderer, explicit phase/key-off inputs.
// Source/terms: ../LICENSES/README.md and LGPL-2.1-or-later.txt.
const PERIODS=[30721,2048,1536,1280,1024,768,640,512,384,320,256,192,160,128,96,80,64,48,40,32,24,20,16,12,10,8,6,5,4,3,2,1];
const OFFSETS=Array.from({length:32},(_,rate)=>rate===0?1:rate>=30?0:[536,0,1040][rate%3]);
export function instrumentEnvelope(aram,instrument){const p=0x3400+instrument*6;return {adsr1:aram[p+1],adsr2:aram[p+2],gain:aram[p+3]};}
export function renderSpcEnvelope({adsr1,adsr2,gain},{gateSamples,totalSamples=gateSamples+256,keyOnDelay=5,counterPhase=0}={}){
 const samples=new Float32Array(totalSamples);let envelope=0,hidden=0,mode='attack';
 for(let i=0;i<totalSamples;i++){
  if(i>=keyOnDelay)samples[i]=envelope/2048;
  if(i<keyOnDelay)continue;
  if(i>=gateSamples){envelope=Math.max(0,envelope-8);continue;}
  let candidate=envelope,rate,data=adsr2;
  if(adsr1&128){
   if(mode==='attack'){rate=(adsr1&15)*2+1;candidate+=rate===31?1024:32;}
   else{candidate--;candidate-=candidate>>8;rate=mode==='decay'?((adsr1>>3)&14)+16:adsr2&31;}
  }else{
   data=gain;const shape=gain>>5;rate=shape<4?31:gain&31;
   if(shape<4)candidate=gain*16;
   else if(shape===4)candidate-=32;
   else if(shape===5){candidate--;candidate-=candidate>>8;}
   else candidate+=shape===7&&hidden>=1536?8:32;
  }
  if(mode==='decay'&&(candidate>>8)===(data>>5))mode='sustain';
  hidden=candidate;
  if(candidate<0||candidate>2047){candidate=Math.max(0,Math.min(2047,candidate));if(mode==='attack')mode='decay';}
  const counter=(30720-((counterPhase+i+1)%30720))%30720;
  if((counter+OFFSETS[rate])%PERIODS[rate]===0)envelope=candidate;
 }
 return samples;
}
