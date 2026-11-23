import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {City} from '../src/simulation.js';import {updateRomUtilityCenter,isRomUtilityCenter} from '../src/rom-utility-worker.js';import {nextSimulationWord,boundSimulationWord,SIMULATION_SEED} from '../src/rom-random.js';
const flags=JSON.parse(fs.readFileSync('assets/tables/city.json')).flags,build=JSON.parse(fs.readFileSync('assets/tables/build.json')),expand=runs=>Uint16Array.from(runs.flatMap(([n,v])=>Array(n).fill(v)));
test('216 original utility workers match every map cell and final RNG state',()=>{
 const ref=JSON.parse(fs.readFileSync('research/reference-utility-workers.json'));assert.equal(ref.exitCode,0);assert.equal(ref.cases.length,216);assert.ok(ref.cases.some(f=>f.result.meltdown));
 for(const f of ref.cases){const map=expand(f.input),state=[...f.seed];let calls=0;const result=updateRomUtilityCenter(map,flags,60,50,max=>{calls++;return boundSimulationWord(nextSimulationWord(state),max);},{difficulty:f.difficulty,baseStep:f.baseStep}),label=JSON.stringify([f.id,f.prefix,f.baseStep,f.damage,f.difficulty,f.seed]);assert.deepEqual(result,f.result,label);assert.deepEqual(map,expand(f.expected),label);assert.deepEqual(state,f.rng,label);assert.equal(calls,f.calls,label);}
});
test('bounded source software division handles large maxima and16-bit range overflow',()=>{
 for(const max of [32767,45000,65534])for(const word of [0,1,32767,65535])assert.equal(boundSimulationWord(word,max),65535);
 for(const word of [0,1,32767,65535])assert.equal(boundSimulationWord(word,65535),0);
 for(const max of [-1,65536,1.5,NaN])assert.throws(()=>boundSimulationWord(0,max));
 for(const max of [45000,65535]){const ref=JSON.parse(fs.readFileSync(`research/reference-bounded-${max}.json`));assert.equal(ref.exitCode,0);assert.equal(ref.boundedValuesCompared,256);const state=[...ref.fixture.seed];for(let n=0;n<256;n++)assert.equal(boundSimulationWord(nextSimulationWord(state),max),max===65535?0:65535);assert.deepEqual(state,ref.expectedFinalState);}
});
test('nuclear roll precedes repair, and disaster/off override suppresses damage while consuming the draw',()=>{
 const f=JSON.parse(fs.readFileSync('research/reference-utility-workers.json')).cases.find(f=>f.id===0x27c&&f.damage==='empty'&&f.baseStep===0&&f.result.meltdown);assert.ok(f);const map=expand(f.input);let calls=0;const result=updateRomUtilityCenter(map,flags,60,50,()=>{calls++;return 0;},{allowMeltdown:false});assert.equal(calls,1);assert.equal(result.meltdown,null);assert.equal(result.repaired,2);assert.equal(map[50*120+60]&1023,0x27c);
 for(const id of [960,972,977,978,991,992,1010])assert.equal(isRomUtilityCenter(id),false);
});
test('actual city scan triggers a nuclear meltdown once and saves the damaged map',()=>{
 const c=new City(new Uint16Array(12000),build,[...flags],{scenario:'FreeCity',disastersEnabled:true,difficulty:2});c.funds=100000;assert.ok(c.place(13,30,30));const maxima=[];c.boundedRandom=max=>{maxima.push(max);return 0;};c.scanCityTiles();assert.equal(maxima[0],15000);assert.equal(c.map.filter(n=>(n&1023)===0x27c).length,0);assert.equal(c.soundEvents.filter(e=>e.command===0x1e).length,1);const restored=City.restore(c.serialize(),build,flags);assert.equal(restored.map.filter(n=>(n&1023)===0x27c).length,0);restored.scanCityTiles();assert.equal(restored.soundEvents.filter(e=>e.command===0x1e).length,0);
});
test('city disasters toggle and disabled plant prevent automatic meltdown without skipping the source random advance',()=>{
 for(const disabled of [false,true]){const c=new City(new Uint16Array(12000),build,[...flags],{scenario:'FreeCity',disastersEnabled:disabled,difficulty:1});c.funds=100000;c.place(13,30,30);const center=c.zones.find(z=>z.id===0x27c);if(disabled)c.disabledBuildings={[center.i]:0x27c};c.boundedRandom=()=>0;c.scanCityTiles();assert.equal(c.id(center.x,center.y),0x27c);assert.equal(c.soundEvents.filter(e=>e.command===0x1e).length,0);}
 const c=new City(new Uint16Array(12000),build,[...flags],{scenario:'FreeCity',disastersEnabled:false});c.funds=100000;c.place(13,30,30);c.simulationRng=[...SIMULATION_SEED];c.scanCityTiles();const state=[...SIMULATION_SEED];nextSimulationWord(state);assert.deepEqual(c.simulationRng,state);
});
