// CODE_03E2DF / DATA_03E334. The original caller supplies an outcome word:
// 1 = failed, 2 = cleared. Preserve all other flag bits, including bit 15.
export const SCENARIO_CLEAR_BITS=[1,2,4,8,16,32,64,128];
export function scenarioEnding(flags,index,outcome,{mode=3}={}){
 if(!Number.isInteger(index)||index<0||index>7)throw new RangeError('Invalid original scenario index');
 flags&=65535;outcome&=65535;const before=flags;let screen=9;
 if((mode&65535)===3&&outcome===2){flags|=SCENARIO_CLEAR_BITS[index];if(!(flags&0x8000)&&(flags&63)===63){flags|=0x8000;screen++;}screen++;}
 return {before,flags,screen,music:outcome===1?0x12:0x11};
}
export const validCareerFlags=n=>Number.isInteger(n)&&n>=0&&n<=65535;
