// CODE_03AE25..03AE98 scans flagged gift centers for annual income
// and the casino crime modifier. No population weighting is applied.
export function romGiftEffects(map,flags){
 let income=0,crimeModifier=0;
 const hundred=new Set([0x2f5,0x34f,0x33d,0x334,0x32b,0x319]);
 for(const word of map){const id=word&1023;if(!(flags[id]&1))continue;
  if(id===0x2fe){income+=300;crimeModifier++;}else if(id===0x2ec)income+=200;else if(hundred.has(id))income+=100;
 }
 return {income:income&65535,crimeModifier};
}
// CODE_03C26B/03C291/03C303: source milestone message thresholds.
export function serviceMilestoneNotices({police,fire,rail},progress){
 const notices=[];
 for(const [key,value,thresholds] of [['police',police,[6,12,18]],['fire',fire,[6,12,18]],['rail',rail,[500,2000]]]){
  const stage=progress[key]||0;if(stage<thresholds.length&&value>=thresholds[stage]){progress[key]=stage+1;notices.push(`${key==='rail'?'Rail network':key==='police'?'Police stations':'Fire stations'} milestone: ${thresholds[stage]}.`);}
 }
 return notices;
}
export function serviceMilestoneGift(notice){return notice.startsWith('Police stations')?21:notice.startsWith('Fire stations')?22:null;}
// CODE_01BFFF scans four slots; a full inventory drops the new reward.
export function enqueueRomGift(inventory,tool){if(inventory.length>=4)return false;inventory.push(tool);return true;}
// CODE_03C0FA runs population promotion before the gift-capacity gate.
// CODE_03C131 emits Mayor's House message $2C once after first promotion.
// CODE_03C405 then reserves one of the four inventory slots in a village.
export function nextCoreMilestone({population,category,police,fire,rail,inventorySize,practice=false},progress){
 const thresholds=[2000,10000,50000,100000,500000],stage=progress.population||0;
 if(stage<thresholds.length&&population>=thresholds[stage]){progress.population=stage+1;return {message:stage+1,historyId:stage+2,text:`Population milestone: ${thresholds[stage].toLocaleString()}.`,gift:null};}
 // CODE_03C3CD runs before the gift-capacity gate, using threshold table indices6/7.
 if(!progress.highPopulation&&population>=(practice?100000:600000)){progress.highPopulation=true;return {message:practice?0x31:0x2f,historyId:practice?null:0x13,text:`Population milestone: ${(practice?100000:600000).toLocaleString()}.`,gift:null};}
 if(inventorySize>=(category===0?3:4))return null;
 if(!progress.mayorHouse&&(progress.population||0)>0){progress.mayorHouse=true;return {message:0x2c,text:'The Mayor’s House is available.',gift:15};}
 // Earlier unported Wright conditions can preempt these in the cartridge.
 for(const [key,value,limits,message,gift] of [['police',police,[6,12,18],0x11,21],['fire',fire,[6,12,18],0x12,22],['rail',rail,[500,2000],0x1a,29]]){
  const n=progress[key]||0;if(n<limits.length&&value>=limits[n]){progress[key]=n+1;return {message,text:`${key==='rail'?'Rail network':key==='police'?'Police stations':'Fire stations'} milestone: ${limits[n]}.`,gift};}
 }
 return null;
}
