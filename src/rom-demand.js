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
// `generatedScore` is the result of the earlier fixed-point ratio work, which
// the current city model still estimates rather than reproduces.
export function accumulateRomDemand(previousScore,generatedScore,taxRate,difficulty,limit,{suppressPositive=false,forceMaximum=false}={}){
  const effectiveTax=Math.min(20,Math.max(0,Math.trunc(taxRate)+Math.trunc(difficulty)));
  const adjustment=DEMAND_TAX_ADJUSTMENT[effectiveTax];
  const next=signed16(word(word(generatedScore)-0x0258)+word(adjustment)+word(previousScore));
  if(forceMaximum)return limit;
  if(suppressPositive&&next>=0)return 0;
  return Math.max(-limit,Math.min(limit,next));
}
