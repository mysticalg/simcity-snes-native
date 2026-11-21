// CODE_03C500..03C5B2 / DATA_03C5B3: absolute scenario deadline years.
export const SCENARIO_DEADLINES={SanFrancicso:1911,Bern:1975,Tokyo:1966,Detroit:1982,Boston:2015,RioDeJaneiro:2057,LasVegas:2106};
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
