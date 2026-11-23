import {SCENARIO_IDS} from './rom-scenarios.js?v=scenarios-45';
import {scenarioEnding,validCareerFlags} from './rom-scenario-ending.js?v=endings-48';
export const CAREER_STORAGE_KEY='simcity.scenarioCareer.v1';
export class ScenarioCareer{
 constructor(storage){this.storage=storage;this.flags=0;this.lastAttempt=null;try{this.receive(storage.getItem(CAREER_STORAGE_KEY));}catch{}}
 receive(text){try{const record=JSON.parse(text);if(record?.version===1)this.merge(record.flags);}catch{}}
 merge(flags){if(validCareerFlags(flags))this.flags|=flags;}
 sync(city){
  this.merge(city.careerFlags);city.careerFlags=this.flags;city.recordScenarioCompletion();this.merge(city.careerFlags);
  // Consolidated older city archives can complete the six-bit record even
  // when their individual, already-viewed ending was an ordinary victory.
  const index=SCENARIO_IDS.indexOf(city.scenario);if(index>=0&&city.scenarioResult==='won'&&(this.flags&0x803f)===0x003f)this.merge(scenarioEnding(this.flags,index,2).flags);
  city.careerFlags=this.flags;
  if(this.lastAttempt!==this.flags){this.lastAttempt=this.flags;try{this.storage.setItem(CAREER_STORAGE_KEY,JSON.stringify({version:1,flags:this.flags}));}catch{}}
  return this.flags;
 }
}
