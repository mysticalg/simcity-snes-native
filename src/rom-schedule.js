// CODE_0380F4..038154; DATA_03817E/182/186/18A/18E.
// Source modes0/1/2 correspond to slow/medium/fast. Browser speeds>=3
// retain fast field cadence while its additional multipliers accelerate time.
export function romFieldSchedule(step,speed=1){
 const mode=speed===1?0:speed===2?1:2,mask=[15,7,3][mode],phase=step&mask;
 return {landPollution:phase===[2,1,0][mode],crime:phase===[6,3,1][mode],density:phase===[10,5,2][mode],fire:phase===[14,7,3][mode]};
}
