// CODE_03C42A..03C473: ten six-byte records, oldest first.
export function recordRomHistory(history,id,year,month){
 if(history.length>=10)history.shift();
 history.push({id:id&65535,year:year&65535,month:month&65535});
}
export const HISTORY_LABELS={0:'New mayor elected',1:'Population came to 30,000',2:'Became town',3:'Became city',4:'Became capital',5:'Became metropolis',6:'Became megalopolis',7:'A monster appeared',8:'Nuclear melt down.',9:'A plane crashed.',10:'A tornado occurred.',11:'A fire occurred.',12:'A deluge occurred.',13:'Pollution warning.',14:'A big earthquake occurred.',15:'Crimnal warning.',16:'A shipwreck occurred.',17:'50th anniversary',18:'Formation of a sister city',19:'Population came to 600,000',20:"UFO's attack."};
