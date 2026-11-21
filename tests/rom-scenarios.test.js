import test from 'node:test';import assert from 'node:assert/strict';
import {scenarioOutcome,SCENARIO_DEADLINES,stepScenarioEvent,stepScenarioReminder,scenarioMeltdownSite} from '../src/rom-scenarios.js';
test('ROM scenario deadlines require metropolis plus scenario-specific objective',()=>{
 for(const [id,deadline] of Object.entries(SCENARIO_DEADLINES)){
  const values={category:4,traffic:79,crime:59,score:500};
  assert.equal(scenarioOutcome(id,deadline-1,values),'active');assert.equal(scenarioOutcome(id,deadline,values),'won');
  assert.equal(scenarioOutcome(id,deadline,{...values,category:3}),'lost');
 }
 assert.equal(scenarioOutcome('Bern',1975,{category:4,traffic:80}),'lost');
 assert.equal(scenarioOutcome('Detroit',1982,{category:4,crime:60}),'lost');
 assert.equal(scenarioOutcome('Tokyo',1966,{category:4,score:499}),'lost');
 assert.equal(scenarioOutcome('FreeCity',9999,{}),'active');
});
test('scripted disaster counters reproduce source boundaries',()=>{
 assert.deepEqual(stepScenarioEvent('Boston',1,0),{remaining:0,event:'Meltdown'});
 assert.equal(stepScenarioEvent('Tokyo',2,0).event,null);
 assert.equal(stepScenarioEvent('Tokyo',1,0).event,'Monster');
 assert.equal(stepScenarioEvent('RioDeJaneiro',256,0).event,'Flood');
 assert.equal(stepScenarioEvent('LasVegas',384,84999).event,null);
 assert.equal(stepScenarioEvent('LasVegas',384,85000).event,'UFO');
});


test('reminder sequence advances once and Boston selects first nuclear center',()=>{
 assert.deepEqual(stepScenarioReminder('Tokyo',1961,0),{stage:1,yearsLeft:5});
 assert.deepEqual(stepScenarioReminder('Tokyo',1961,1),{stage:1,yearsLeft:null});
 assert.deepEqual(stepScenarioReminder('Tokyo',1966,4),{stage:5,yearsLeft:1});
 assert.equal(stepScenarioReminder('Tokyo',1966,5).yearsLeft,null);
 assert.deepEqual(scenarioMeltdownSite([0,0x827c,0x27c],3),{x:1,y:0});
 assert.equal(scenarioMeltdownSite([0,0]),null);
});
