// CODE_03C42A..03C473: ten six-byte records, oldest first.
export function recordRomHistory(history,id,year,month){
 if(history.length>=10)history.shift();
 history.push({id:id&65535,year:year&65535,month:month&65535});
}
export const HISTORY_LABELS={0:'City founded',8:'Nuclear meltdown',11:'Fire',12:'Flood',14:'Earthquake',16:'Shipwreck'};
