// CODE_0390A7 seed words at $0CCF..$0CDB. CODE_03907E indexes
// $0CCD+12 down through +2: it never reads $0CCD itself.
export const SIMULATION_SEED=[0x03fa,0x11a9,0x00ca,0xfe5d,0x0003,0x9ba8,0x01d4];
export function nextSimulationWord(state,initialCarry=1){
 let sum=0,carry=initialCarry;
 for(let i=5;i>=0;i--){const value=state[i];state[i+1]=value;const total=value+sum+carry;sum=total&65535;carry=total>65535?1:0;}
 state[0]=sum;return sum;
}
// CODE_039035 divides twice; it does not take a remainder or clamp.
export function boundSimulationWord(randomWord,maximum){
 const divisor=Math.floor(32767/(maximum+1));
 if(divisor<1)throw Error('Unsupported bounded RNG maximum');
 return Math.floor((randomWord&32767)/divisor);
}
