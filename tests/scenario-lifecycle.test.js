import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {stepScenarioProgress,stepScenarioEvent,SCENARIO_IDS} from '../src/rom-scenarios.js';
import {City} from '../src/simulation.js';
const json=name=>JSON.parse(fs.readFileSync(new URL('../'+name,import.meta.url))),build=json('assets/tables/build.json'),flags=json('assets/tables/city.json').flags;

test('all seven original scenario workers match executed stage, notice, outcome and scripted-event cases',()=>{
 const report=json('research/reference-scenario-lifecycle.json');assert.equal(report.exitCode,0);assert.equal(report.valuesCompared,2065);assert.equal(report.cases.length,819);assert.deepEqual(report.tables.thresholds,[5,4,3,2,1,0]);assert.equal(SCENARIO_IDS.length,7);
 for(const c of report.cases)assert.deepEqual(c.kind==='progress'?stepScenarioProgress(c.id,c.year,c.stage,c.input):stepScenarioEvent(c.id,c.remaining,c.population),c.expected);
});

test('late scenario state advances one stage per call and blocked notices still consume their stage',()=>{
 let stage=0;for(let n=0;n<5;n++){const step=stepScenarioProgress('Tokyo',1966,stage,{category:4,score:500,messageBusy:true});assert.equal(step.notice,null);assert.equal(step.outcome,null);assert.equal(step.yearsLeft,5-n);stage=step.stage;}
 const final=stepScenarioProgress('Tokyo',1966,stage,{category:4,score:500,newsBusy:true});assert.equal(final.outcome,'won');assert.equal(final.stage,6);assert.equal(stepScenarioProgress('Tokyo',1966,6,{category:4,score:500}).outcome,null);
});

test('an actual automatic January budget advances scenario review once after the year changes',()=>{
 const city=new City(new Uint16Array(12000),build,flags,{scenario:'Tokyo',year:1961,disastersEnabled:false,autoBudget:true});city.month=12;city.baseStep=3;city.scenarioStage=1;city.scenarioReminders=[5];city.stepSimulation();
 assert.equal(city.year,1962);assert.equal(city.scenarioStage,2);assert.deepEqual(city.scenarioReminders,[5,4]);assert.equal(city.scenarioEvaluationDeferred,false);assert.equal(city.scenarioResult,null);
});

test('manual January scenario review waits for settlement and survives a pending-budget reload',()=>{
 const city=new City(new Uint16Array(12000),build,flags,{scenario:'Tokyo',year:1961,disastersEnabled:false});city.month=12;city.baseStep=3;city.scenarioStage=1;city.scenarioReminders=[5];city.stepSimulation();assert.ok(city.pendingBudget);assert.equal(city.scenarioStage,1);assert.equal(city.scenarioEvaluationDeferred,true);
 const restored=City.restore(city.serialize(),build,flags);assert.equal(restored.scenarioStage,1);assert.equal(restored.scenarioEvaluationDeferred,true);restored.settleAnnualBudget();assert.equal(restored.scenarioStage,2);assert.deepEqual(restored.scenarioReminders,[5,4]);assert.equal(restored.scenarioEvaluationDeferred,false);assert.equal(restored.settleAnnualBudget(),null);assert.equal(restored.scenarioStage,2);
});

test('a scenario decision is recorded once and its qualifying inputs survive later decline and reload',()=>{
 const city=new City(new Uint16Array(12000),build,flags,{scenario:'Boston',year:2015});city.category=4;city.population=100000;city.score=500;city.scenarioStage=5;city.updateScenarioOutcome();assert.equal(city.scenarioResult,'won');assert.equal(city.scenarioStage,6);const decision=structuredClone(city.scenarioDecision),serial=city.noticeSerial;
 city.year=2016;city.category=0;city.population=0;city.score=0;city.updateScenarioOutcome();assert.equal(city.noticeSerial,serial);assert.deepEqual(city.scenarioDecision,decision);
 const restored=City.restore(city.serialize(),build,flags);assert.equal(restored.scenarioStage,6);assert.equal(restored.scenarioResult,'won');assert.deepEqual(restored.scenarioDecision,decision);restored.updateScenarioOutcome();assert.deepEqual(restored.scenarioDecision,decision);
});

test('older saves infer review stage from reminder history and retain completed results',()=>{
 const city=new City(new Uint16Array(12000),build,flags,{scenario:'Tokyo',year:1964});city.scenarioReminders=[5,4];const saved=JSON.parse(city.serialize());delete saved.scenarioStage;delete saved.scenarioDecision;delete saved.scenarioEvaluationDeferred;const restored=City.restore(JSON.stringify(saved),build,flags);assert.equal(restored.scenarioStage,2);restored.updateScenarioOutcome();assert.equal(restored.scenarioStage,3);assert.deepEqual(restored.scenarioReminders,[5,4,3]);
 saved.scenarioResult='won';saved.scenarioDialogSeen=true;const complete=City.restore(JSON.stringify(saved),build,flags);assert.equal(complete.scenarioStage,6);assert.equal(complete.scenarioDialogSeen,true);assert.equal(complete.scenarioDecision,null);
});
