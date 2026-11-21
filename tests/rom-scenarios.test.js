import test from 'node:test';import assert from 'node:assert/strict';
import {scenarioOutcome,SCENARIO_DEADLINES} from '../src/rom-scenarios.js';
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
