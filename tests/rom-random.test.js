import test from 'node:test';import assert from 'node:assert/strict';import {SIMULATION_SEED,nextSimulationWord,boundSimulationWord} from '../src/rom-random.js';
test('ROM additive shift generator uses six source words and propagates carry',()=>{
 const state=[...SIMULATION_SEED];let sum=1;for(const n of SIMULATION_SEED.slice(0,6))sum+=n;
 const first=nextSimulationWord(state);assert.equal(first,0xb077);assert.deepEqual(state.slice(1),SIMULATION_SEED.slice(0,6));
 const overflow=Array(7).fill(65535);assert.equal(nextSimulationWord(overflow),0);
});
test('ROM bounded random uses quotient scaling including endpoint overflow',()=>{
 assert.equal(boundSimulationWord(0,35),0);assert.equal(boundSimulationWord(32767,35),36);assert.equal(boundSimulationWord(65535,2),3);
});


import fs from 'node:fs';
test('native RNG retains the ROM-executed256-call reference state',()=>{const evidence=JSON.parse(fs.readFileSync(new URL('../research/reference-rng.json',import.meta.url)));assert.equal(evidence.exitCode,0);assert.equal(evidence.calls,256);assert.equal(evidence.stateWordsCompared,1792);const state=[...evidence.fixture.seed],first=[];for(let i=0;i<evidence.calls;i++){const n=nextSimulationWord(state);if(i<8)first.push(n);}assert.deepEqual(first,evidence.expectedFirstWords);assert.deepEqual(state,evidence.expectedFinalState);});
