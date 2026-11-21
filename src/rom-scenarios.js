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
