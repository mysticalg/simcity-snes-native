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
// Names and IDs follow DATA_01BF8F: inventory byte +14 is the build tool.
export const ROM_GIFTS={15:'Mayor’s house',16:'Bank',17:'Amusement park',18:'Zoo',19:'Casino',20:'Land reclamation',21:'Police headquarters',22:'Fire headquarters',23:'Water fountain',24:'Mario statue',25:'Exposition',26:'Windmill',27:'Library',28:'City park',29:'Train station'};
export function giftToolForId(id){if(id>=0x2bb&&id<=0x2de)return 15;if(id>=0x2df&&id<=0x2e7)return 16;if(id>=0x2e8&&id<=0x2f0)return 17;if(id>=0x2f1&&id<=0x2f9)return 18;if(id>=0x2fa&&id<=0x302)return 19;if(id>=0x303&&id<=0x353)return 21+Math.floor((id-0x303)/9);return null;}
const stage=(p,key)=>Math.max(0,Math.trunc(Number(p[key])||0));
function reward(message,gift,text=ROM_GIFTS[gift]+' is available.'){return {message,gift,text};}
// CODE_03C0AD..03C424: one event per base step in cartridge priority order.
// UI adaption: the amusement/casino choice is an inline pair, with one slot.
export function nextCoreMilestone({population=0,category=0,police=0,fire=0,rail=0,inventorySize=0,practice=false,scriptedScenario=false,funds=Infinity,roads=0,hospitals=0,schools=0,stadiums=0,emptyLand=Infinity,parks=0,developedZones=0,banks=0,airports=0,seaports=0,year=1900},progress){
 const thresholds=[2000,10000,50000,100000,500000],promotion=stage(progress,'population');
 if(promotion<thresholds.length&&population>=thresholds[promotion]){progress.population=promotion+1;return {message:promotion+1,historyId:promotion+2,text:'Population milestone: '+thresholds[promotion].toLocaleString()+'.',gift:null};}
 if(!progress.highPopulation&&population>=(practice?100000:600000)){progress.highPopulation=true;return {message:practice?0x31:0x2f,historyId:practice?null:0x13,text:'Population milestone: '+(practice?100000:600000).toLocaleString()+'.',gift:null};}
 // Scenario mode3 returns after promotion/high-population checks.
 if(scriptedScenario)return null;
 // CODE_03C391 runs even when the gift inventory is full.
 if(!progress.capitalModel&&category>=3){progress.capitalModel=true;return reward(0x0c,null,'The city scale model is available in Information.');}
 if(inventorySize>=(category===0?3:4))return null;
 if(!progress.mayorHouse&&stage(progress,'population')>0){progress.mayorHouse=true;return reward(0x2c,15);}
 const bankStage=stage(progress,'bank');
 if(!bankStage&&category>=2&&funds>=0&&funds<2000){progress.bank=1;return reward(0x0b,16);}
 if(bankStage===1&&banks>0){progress.bank=2;return reward(0x1f,null,'The bank branch is open. City loans are available in the budget.');}
 for(const [key,value,limits] of [['amusementRoads',roads,[300,400,500]],['amusementFacilities',hospitals+schools,[6,10]]]){const n=stage(progress,key);if(n<limits.length&&value>=limits[n]){progress[key]=n+1;return reward(0x0d,17);}}
 // CODE_03C1CE: two stadium milestones, with24 successful visits of this
 // handler before the reward. Earlier messages and a full inventory freeze it.
 if(stage(progress,'zooDelay')>0){if(--progress.zooDelay===0)return reward(0x0e,18);}
 else {const n=stage(progress,'zoo');if(category>0&&n<2&&stadiums>=[1,3][n]){progress.zoo=n+1;progress.zooDelay=24;}}
 const spaceStage=stage(progress,'landfillSpace');if(spaceStage<4&&emptyLand>0&&emptyLand<[150,100,50,30][spaceStage]){progress.landfillSpace=spaceStage+1;return reward(0x10,20);}
 const landStage=stage(progress,'landfillPopulation');if(landStage<5&&population>=[200000,250000,300000,400000,450000][landStage]){progress.landfillPopulation=landStage+1;return reward(0x10,20);}
 for(const [key,value,limits,message,gift] of [['police',police,[6,12,18],0x11,21],['fire',fire,[6,12,18],0x12,22],['library',schools,[3,6,9],0x18,27],['cityPark',parks,[300,600,900],0x19,28],['rail',rail,[500,2000],0x1a,29],['windmill',developedZones,[150,500],0x17,26]]){const n=stage(progress,key);if(n<limits.length&&value>=limits[n]){progress[key]=n+1;return reward(message,gift);}}
 if(!progress.mario&&category>=5){progress.mario=true;return reward(0x14,24);}
 if(!progress.exposition&&category>=2&&airports>0&&seaports>0){progress.exposition=true;return reward(0x16,25);}
 if(!progress.fountain&&year>=1950){progress.fountain=true;return reward(0x13,23);}
 return null;
}
