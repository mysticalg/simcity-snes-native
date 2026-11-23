// CODE_03C500..03C5B2 / DATA_03C5B3: absolute scenario deadline years.
export const SCENARIO_DEADLINES={SanFrancicso:1911,Bern:1975,Tokyo:1966,Detroit:1982,Boston:2015,RioDeJaneiro:2057,LasVegas:2106};
export const SCENARIO_IDS=Object.keys(SCENARIO_DEADLINES);
export const SCENARIO_REMINDER_CODES=[0x14,0x15,0x16,0x18,0x19];
export function scenarioOutcome(id,year,{category,traffic,crime,score}){
 const deadline=SCENARIO_DEADLINES[id];if(deadline===undefined||year<deadline)return 'active';
 if(category<4)return 'lost';
 if(id==='Bern')return traffic<80?'won':'lost';
 if(id==='Detroit')return crime<60?'won':'lost';
 if(['Tokyo','Boston','RioDeJaneiro'].includes(id))return score>=500?'won':'lost';
 return 'won';
}
// DATA_03CEC9 and CODE_03B96F; one countdown decrement per base step.
export const SCENARIO_EVENT_COUNTS={SanFrancicso:10,Bern:20,Tokyo:5,Detroit:3,Boston:1,RioDeJaneiro:258,LasVegas:384};
export function stepScenarioEvent(id,remaining,population){
 let event=null;
 if(remaining===1)event=({SanFrancicso:'Earthquake',Tokyo:'Monster',Boston:'Meltdown'})[id]||null;
 else if(remaining>0&&(remaining&15)===0){if(id==='RioDeJaneiro')event='Flood';if(id==='LasVegas'&&population>=85000)event='UFO';}
 return {remaining:Math.max(0,remaining-1),event};
}
// CODE_03C50B..03C548 advances one reminder stage per invocation,
// including when the current date has already passed a threshold.
export function stepScenarioReminder(id,year,stage){
 const deadline=SCENARIO_DEADLINES[id];
 if(deadline===undefined||stage>=5)return {stage,yearsLeft:null};
 const left=Math.max(0,deadline-year),threshold=5-stage;
 return left<=threshold?{stage:stage+1,yearsLeft:threshold}:{stage,yearsLeft:null};
}
// CODE_03C500: only mode3 runs this worker. Stages0..4 consume their
// threshold even when a notice is blocked. Stage5 performs the actual decision.
// The browser keeps a completed city playable, so stage6 is explicitly terminal.
export function stepScenarioProgress(id,year,stage,{category=0,traffic=0,crime=0,score=0,mode=3,messageBusy=false,newsBusy=false}={}){
 const result={stage,notice:null,yearsLeft:null,outcome:null},deadline=SCENARIO_DEADLINES[id];
 if(mode!==3||deadline===undefined||!Number.isInteger(stage)||stage<0||stage>=6)return result;
 const left=Math.max(0,deadline-(year&65535)),threshold=5-stage;if(left>threshold)return result;
 result.stage=stage+1;
 if(stage<5){result.yearsLeft=threshold;if(!messageBusy&&!newsBusy)result.notice=SCENARIO_REMINDER_CODES[stage];}
 else result.outcome=scenarioOutcome(id,year&65535,{category:category&65535,traffic:traffic&65535,crime:crime&65535,score:score&65535});
 return result;
}
// CODE_03BAC1 scans row-major for the first nuclear plant center ($027C).
export function scenarioMeltdownSite(map,width=120){
 const i=map.findIndex(word=>(word&1023)===0x27c);
 return i<0?null:{x:i%width,y:Math.floor(i/width)};
}
