// World simulation animations use game speed; UI input/zoom retains wall time.
export function visualFrameBudget(ms,speed=1,remainder=0){
 const rate=[1,2,4,8,16].includes(speed)?speed:1,total=Math.max(0,ms)*60/1000*rate+remainder,frames=Math.floor(total+1e-9);return {frames,remainder:Math.max(0,total-frames)};
}
