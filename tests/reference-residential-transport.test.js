import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {City} from '../src/simulation.js';import {traceZoneTransport} from '../src/rom-growth.js';import {addRouteTraffic} from '../src/rom-traffic.js';import {nextSimulationWord} from '../src/rom-random.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url))),expand=runs=>Uint16Array.from(runs.flatMap(([count,n])=>Array(count).fill(n))),coarse=traffic=>Buffer.from(Array.from({length:3000},(_,i)=>traffic[Math.floor(i/60)*240+(i%60)*2])).toString('hex');
const build=read('assets/tables/build.json'),flags=read('assets/tables/city.json').flags;
test('complete commute and traffic match126 original-ROM executions',()=>{
 const report=read('research/reference-transport.json');assert.equal(report.exitCode,0);assert.equal(report.cases.length,126);
 for(const fixture of report.cases){const map=expand(fixture.mapRle),before=map.slice(),traffic=new Uint8Array(12000).fill(fixture.trafficInitial),rng=[...fixture.seed];let draws=0;const route=traceZoneTransport(map,...fixture.origin,fixture.type,()=>{draws++;return nextSimulationWord(rng);});assert.equal(route.status,fixture.status,fixture.name);assert.equal(route.guarded,undefined);assert.deepEqual(route.path,fixture.path);assert.equal(draws,fixture.randomCalls);assert.deepEqual(rng,fixture.rng);if(route.status===1)addRouteTraffic(map,traffic,route.path);assert.equal(coarse(traffic),fixture.traffic);assert.deepEqual(map,before);}
});
test('complete residential decisions/maps/RNG/traffic match187 original-ROM executions',()=>{
 const report=read('research/reference-residential.json');assert.equal(report.exitCode,0);assert.equal(report.cases.length,187);const c=new City(new Uint16Array(12000),build,flags);
 for(const fixture of report.cases){c.map=expand(fixture.input);c.simulationRng=[...fixture.seed];c.facilityDemand=[...fixture.config.quota];c.demand=[fixture.config.demand,0,0];c.landValue.fill(fixture.config.land);c.density.fill(fixture.config.density);c.pollution.fill(fixture.config.pollution);c.traffic.fill(0);const decision=c.updateResidentialTile({x:60,y:50,i:6060,id:fixture.config.tile,type:5});assert.equal(decision.action,fixture.action,fixture.name);assert.deepEqual(c.map,expand(fixture.expected),fixture.name);assert.deepEqual(c.simulationRng,fixture.rng,fixture.name);assert.deepEqual(c.facilityDemand,fixture.quota);assert.equal(coarse(c.traffic),fixture.traffic);}
});
test('full houses use population density65 rather than land value65 for redevelopment',()=>{
 const c=new City(new Uint16Array(12000),build,flags),x=60,y=50,i=y*120+x,z={x,y,i,type:5,id:0x84};for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)c.map[(y+dy)*120+x+dx]=0x89;c.map[i]=0x8084;c.landValue[i]=200;c.density[i]=64;assert.equal(c.grow(z,1),false);c.landValue[i]=20;c.density[i]=65;assert.equal(c.grow(z,1),true);assert.equal(c.map[i]&1023,0x99);
});
