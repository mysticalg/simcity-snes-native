import {signed16} from './rom-growth.js';

// DATA_038BA1: demand adjustment indexed by 2*(tax + difficulty), i.e. one
// signed word per effective tax rate from 0 through 20.
export const DEMAND_TAX_ADJUSTMENT=[
  0x00c8,0x0096,0x0078,0x0064,0x0050,0x0032,0x001e,0x0000,
  0xfff6,0xffd8,0xff9c,0xff6a,0xff38,0xff06,0xfed4,0xfea2,
  0xfe70,0xfe3e,0xfe0c,0xfdda,0xfda8
].map(signed16);

const word=value=>value&0xffff;

// CODE_03894C's final demand stage: generated score - $0258, tax/difficulty
// adjustment, then the previous score; clamp to the type's signed ROM range.
// `generatedScore` comes from generateRomDemand below.
export function accumulateRomDemand(previousScore,generatedScore,taxRate,difficulty,limit,{suppressPositive=false,forceMaximum=false}={}){
  const effectiveTax=Math.min(20,Math.max(0,Math.trunc(taxRate)+Math.trunc(difficulty)));
  const adjustment=DEMAND_TAX_ADJUSTMENT[effectiveTax];
  const next=signed16(word(word(generatedScore)-0x0258)+word(adjustment)+word(previousScore));
  if(forceMaximum)return limit;
  if(suppressPositive&&next>=0)return 0;
  return Math.max(-limit,Math.min(limit,next));
}
// CODE_03894C..038A83. Unsigned Q8/Q16 intermediates use byte-offset
// reads of the 32-bit CODE_03A2F5 product/CODE_03A421 quotient.
export function generateRomDemand(rci,historyRci=[0,0,0],difficulty=0){
 const u16=n=>n&65535,u32=n=>n>>>0;
 const divide=(n,d)=>d?Math.floor(u32(n)/d):0xffffffff;
 const multiply=(a,b)=>u32(u16(a)*u16(b));
 const residential=u16(rci[0])>>>3,commercial=u16(rci[1]),industrial=u16(rci[2]);
 const oldResidential=u16(historyRci[0])>>>3;
 const oldJobs=u16(u16(historyRci[1])+u16(historyRci[2]));
 // Consecutive ADC instructions retain the first addition's carry.
 const sum=residential+commercial,total=u16(sum+industrial+(sum>65535?1:0));
 const residentialRatio=Math.min(512,residential?u16((divide(oldJobs*65536,residential)>>>8)+5):332);
 const totalRatio=divide(total*65536,947);
 const historyRatio=oldJobs?Math.min(332,(divide(oldResidential*65536,oldJobs)>>>8)&65535):256;
 const commercialNumerator=u32(totalRatio+historyRatio);
 const commercialRatio=Math.min(512,commercial?divide(commercialNumerator,commercial)&65535:u16(commercialNumerator));
 let industrialRatio=512;
 if(industrial){
  const first=(multiply(industrial,historyRatio)>>>8)&65535;
  const adjusted=Math.max(5,(multiply(first,[307,282,251][difficulty])>>>8)&65535);
  industrialRatio=Math.min(512,divide(adjusted*256,industrial)&65535);
 }
 const ratios=[residentialRatio,commercialRatio,industrialRatio];
 return {ratios,scores:ratios.map(n=>(multiply(n,600)>>>8)&65535),totalUnits:total};
}
