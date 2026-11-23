import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createRomGraphs,recordRomGraphMonth,recordRomGraphYear,GRAPH_SERIES} from '../src/rom-graphs.js';
import {createCityGraphs,recordCityGraphMonth,recordCityGraphYear,restoreCityGraphs,meanGraphPollution} from '../src/turbo-graphs.js';
import {City} from '../src/simulation.js';
const data=name=>JSON.parse(fs.readFileSync(new URL('../'+name,import.meta.url))),build=data('assets/tables/build.json'),flags=data('assets/tables/city.json').flags;

test('graph initialization, monthly and January workers retain every original compared word',()=>{
 const report=data('research/reference-graphs.json');assert.equal(report.exitCode,0);assert.equal(report.cases.length,72);assert.equal(report.initialization.wordsCompared,1440);
 const initial=createRomGraphs();for(const period of['monthly','annual'])for(const key of GRAPH_SERIES)assert.ok(initial[period][key].every(n=>n===(key==='finances'?128:0)));
 for(const c of report.cases){const state=structuredClone(c.initial);recordRomGraphMonth(state,c.input);assert.deepEqual(state,c.monthly);recordRomGraphYear(state,c.input);assert.deepEqual(state,c.annual);}
});

test('negative graph trends round toward minus infinity and unsigned history peaks exclude the discarded oldest sample',()=>{
 const state=createRomGraphs();state.crimeTrend=5;state.pollutionTrend=255;state.monthly.residential[118]=4;state.monthly.residential[119]=65535;
 recordRomGraphMonth(state,{rci:[80,2,3],crime:0,pollution:0,net:-1,facilityCounts:[0,1]});
 assert.equal(state.crimeTrend,3);assert.equal(state.pollutionTrend,191);assert.equal(state.monthly.finances[0],127);assert.equal(state.monthly.residential[0],10);assert.equal(state.monthly.residential[119],4);assert.equal(state.monthlyScale,4);assert.equal(state.longScale,10);assert.deepEqual(state.facilityDemand,[0,-1]);
 recordRomGraphYear(state,{rci:[0,0,0]});assert.equal(state.longScale,0);assert.equal(state.annual.finances[0],127);assert.equal(state.annual.crime[0],3);
});

test('actual January step records previous assessment and scheduled-field inputs before the new budget',()=>{
 const city=new City(new Uint16Array(12000),build,flags,{disastersEnabled:false});city.baseStep=47;city.month=12;city.year=1900;city.speed=3;city.meanCrime=200;city.meanPollution=120;city.lastBudget={net:400};
 city.stepSimulation();assert.equal(city.year,1901);assert.equal(city.month,1);assert.ok(city.pendingBudget);
 assert.equal(city.graphs.monthlySamples,1);assert.equal(city.graphs.annualSamples,1);assert.equal(city.graphs.monthly.crime[0],50);assert.equal(city.graphs.monthly.pollution[0],30);assert.equal(city.meanPollution,0);assert.equal(city.graphs.monthly.finances[0],148);assert.equal(city.graphs.annual.finances[0],148);assert.deepEqual(city.graphs.lastRecorded,{year:1901,month:1});
 const frozen=JSON.stringify(city.graphs);assert.equal(city.stepSimulation(),false);assert.equal(JSON.stringify(city.graphs),frozen);city.settleAnnualBudget();assert.equal(city.lastBudget.net,0);assert.equal(JSON.stringify(city.graphs),frozen);
});

test('city graph records survive save/reload; older and corrupt records start clean without rewriting the city',()=>{
 const city=new City(new Uint16Array(12000),build,flags,{disastersEnabled:false,autoBudget:true});for(let n=0;n<6;n++)city.tick();assert.equal(city.graphs.monthlySamples,6);
 const restored=City.restore(city.serialize(),build,flags);assert.deepEqual(restored.graphs,city.graphs);assert.equal(restored.meanPollution,city.meanPollution);
 const old=JSON.parse(city.serialize());delete old.graphs;delete old.meanPollution;const migrated=City.restore(JSON.stringify(old),build,flags);assert.equal(migrated.graphs.monthlySamples,0);assert.equal(migrated.history.length,6);assert.equal(migrated.funds,city.funds);
 const corrupt=JSON.parse(city.serialize());corrupt.graphs.monthly.crime[3]=null;const clean=City.restore(JSON.stringify(corrupt),build,flags);assert.equal(clean.graphs.monthlySamples,0);assert.equal(clean.funds,city.funds);
});

test('megacity graph counters and Turbo finances extend the source without changing the native helper',()=>{
 const state=createCityGraphs(),input={rci:[2000000,100000,90000],net:1e12,crime:0,pollution:0,facilityCounts:[2,3]};
 recordCityGraphMonth(state,input,{year:2000,month:1},48000);recordCityGraphMonth(state,input,{year:2000,month:2},48000);recordCityGraphYear(state,input,2000,48000);
 assert.equal(state.monthly.residential[0],250000);assert.equal(state.monthly.commercial[0],100000);assert.equal(state.monthlyScale,250000);assert.equal(state.longScale,250000);assert.equal(state.annual.residential[0],250000);assert.equal(state.monthly.finances[0],255);assert.deepEqual(restoreCityGraphs(state,48000),state);
 recordCityGraphMonth(state,{...input,net:-1e12},{year:2000,month:3},48000);assert.equal(state.monthly.finances[0],0);
 const native=createRomGraphs();recordRomGraphMonth(native,{rci:[0,0,0],net:30208});assert.equal(native.monthly.finances[0],0);
});

test('graph buffers and sample counters stay bounded across centuries',()=>{
 const state=createCityGraphs();for(let n=0;n<1600;n++){const year=1900+Math.floor(n/12),month=n%12+1,input={rci:[n*8,n,n],net:0};recordCityGraphMonth(state,input,{year,month});if(month===1)recordCityGraphYear(state,input,year);}
 assert.equal(state.monthlySamples,120);assert.equal(state.annualSamples,120);assert.equal(state.monthly.residential[0],1599);assert.equal(state.monthly.residential[119],1480);for(const period of['monthly','annual'])for(const key of GRAPH_SERIES)assert.equal(state[period][key].length,120);assert.deepEqual(restoreCityGraphs(state),state);
});

test('pollution history reads nonzero half-resolution cells once',()=>{
 const values=new Uint8Array(16).fill(255);values[0]=0;values[2]=30;values[8]=60;values[10]=91;assert.equal(meanGraphPollution(values,4,4),60);assert.equal(meanGraphPollution(new Uint8Array(16),4,4),0);
});

test('the actual demand tick consumes newest source graph words ahead of legacy history',()=>{
 const city=new City(new Uint16Array(12000),build,flags,{disastersEnabled:false});city.history=[{rci:[800,0,0]}];recordCityGraphMonth(city.graphs,{rci:[0,50,50],net:0},{year:1900,month:1});city.stepSimulation();assert.equal(city.demand[1],-400);
});
