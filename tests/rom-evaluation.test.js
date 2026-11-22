import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {romCityProblems,romCityScore} from '../src/rom-evaluation.js';
test('city score and annual delta match 84 original-ROM executions',()=>{
 const report=JSON.parse(fs.readFileSync(new URL('../research/reference-evaluation.json',import.meta.url)));assert.equal(report.exitCode,0);assert.equal(report.cases.length,84);for(const c of report.cases)assert.deepEqual(romCityScore(c),c.expected);
});
test('problem ratings sample half-resolution planes and source job/fire formulas',()=>{
 const pollution=new Uint8Array(12000),traffic=new Uint8Array(12000),landValues=new Uint8Array(12000);pollution[0]=10;pollution[4]=30;landValues[0]=landValues[4]=100;traffic[0]=40;traffic[2]=200;traffic[4]=100;
 assert.deepEqual(romCityProblems({crime:80,landValue:100,pollution,traffic,landValues,tax:7,rci:[200,10,0],fires:2}),[80,20,69,70,167,255,10]);
 assert.equal(romCityProblems({pollution,traffic,landValues,rci:[200,0,0]})[5],0);
});
test('score preserves original unsigned underflow and fire threshold distinction',()=>{
 const input={previous:500,problems:Array(7).fill(255),transport:0};assert.equal(romCityScore(input).score,750);
 const clear={previous:500,problems:Array(7).fill(0)};assert.equal(romCityScore({...clear,fire:1000}).score,748);assert.equal(romCityScore({...clear,fire:4096}).score,750);
});
