import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {traceRomPower} from '../src/rom-power.js';import {conductivePowerFlags} from '../src/power-conductors.js';import {City} from '../src/simulation.js';import {installBuildingOperations} from '../src/building-operations.js';import {unpoweredBuildings} from '../src/power-warnings.js';import {createPowerStressCity} from '../tools/power-stress-fixture.mjs';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const generators=city=>city.zones.filter(z=>z.type===33||z.type===62);
function oldLimitedPower(city){const seeds=generators(city);return traceRomPower(city.map,conductivePowerFlags(city.flags),city.width,city.height,{extraSeeds:seeds.map(z=>z.i),extraCapacity:seeds.reduce((n,z)=>n+(z.type===33?10000:1000),0)});}
// Independent coverage oracle for ample generation: graph reachability only,
// with no original walk ordering, deferred junctions or visit accounting.
function reachablePower(city){const flags=conductivePowerFlags(city.flags),power=new Uint8Array(city.map.length),queue=generators(city).map(z=>z.i);for(const i of queue)power[i]=1;for(let at=0;at<queue.length;at++){const i=queue[at],x=i%city.width,y=Math.floor(i/city.width);for(const n of[y?i-city.width:-1,x+1<city.width?i+1:-1,y+1<city.height?i+city.width:-1,x?i-1:-1])if(n>=0&&!power[n]&&(flags[city.map[n]&1023]&128)){power[n]=1;queue.push(n);}}return power;}
test('native saturation retains all ten executed-ROM bitmap, counter and stack comparisons',()=>{
 const report=JSON.parse(fs.readFileSync(new URL('../research/reference-power-stack.json',import.meta.url))),flags=JSON.parse(fs.readFileSync(new URL('../assets/tables/city.json',import.meta.url))).flags;
 assert.equal(report.exitCode,0);assert.equal(report.cases.length,10);assert.equal(report.mapWordsCompared,120000);
 for(const c of report.cases){const map=c.mapRle.flatMap(([n,id])=>Array(n).fill(id)),r=traceRomPower(map,flags),bitmap=new Uint8Array(1500),words=Buffer.alloc(24000);for(let i=0;i<map.length;i++){if(r.power[i])bitmap[Math.floor(i/120)*15+Math.floor(i%120/8)]|=128>>(i%120&7);words.writeUInt16LE((map[i]&32767)|(r.power[i]?32768:0),i*2);}assert.equal(sha(bitmap),c.bitmapSHA256,c.name);assert.equal(sha(words),c.mapSHA256,c.name);assert.deepEqual([r.capacity,r.used,r.exhausted,r.peak,r.dropped],[c.capacity,c.used,c.exhausted,c.branchPeak,c.dropped],c.name);}
 const saturation=report.cases.at(-1);assert.equal(saturation.powered,11900);assert.equal(saturation.branchPeak,5000);assert.equal(saturation.dropped,6763);assert.equal(saturation.exhausted,false);
});
test('Turbo connected MegaCity powers every reachable tile and all 1833 complete RCI plots',()=>{
 const c=createPowerStressCity(),zones=c.zones.filter(z=>z.type>=5&&z.type<=7),old=oldLimitedPower(c);
 assert.equal(zones.length,1833);assert.ok(zones.some(z=>!old.power[z.i]));assert.equal(old.exhausted,false);assert.ok(old.dropped>0);
 assert.deepEqual(c.power,reachablePower(c));assert.ok(zones.every(z=>c.power[z.i]));assert.equal(c.powerOverloaded,false);assert.equal(c.powerTraversal.dropped,0);assert.ok(c.powerTraversal.peak>5000);assert.ok(c.powerTraversal.peak<c.powerTraversal.limit);assert.equal(c.powerCapacity,234000);assert.equal(c.powerUsed,37683);
});
test('reloading old power flags repairs the grid without changing funds, map markers or saved census',()=>{
 const c=createPowerStressCity(),old=oldLimitedPower(c),zones=c.zones.filter(z=>z.type>=5&&z.type<=7),missed=zones.filter(z=>!old.power[z.i]).length;
 c.lastScanCensus={rci:[...c.rci],counts:[...c.counts],facilityCounts:[...c.facilityCounts],unpowered:missed,giftStats:{...c.giftStats},map:Uint16Array.from(c.map,n=>n&1023)};
 const save=JSON.parse(c.serialize());save.map=save.map.map((word,i)=>(word&32767)|(old.power[i]?32768:0));const restored=City.restore(JSON.stringify(save),c.build,c.flags);
 assert.equal(restored.funds,c.funds);assert.equal(restored.population,c.population);assert.deepEqual([...restored.map].map(n=>n&32767),save.map.map(n=>n&32767));assert.deepEqual(restored.power,c.power);assert.equal(unpoweredBuildings(restored).length,0);assert.equal(restored.lastScanCensus.unpowered,missed);
 for(let i=0;i<restored.map.length;i++)assert.equal(!!(restored.map[i]&32768),!!restored.power[i]);
});
test('larger work stack preserves genuine outages, finite supply and building shutdowns',()=>{
 installBuildingOperations(City);const c=createPowerStressCity({mega:false}),plants=generators(c);c.disabledBuildings=Object.fromEntries(plants.map(z=>[z.i,z.id]));c.refresh();assert.equal(c.powerCapacity,0);assert.equal(c.powerUsed,0);assert.ok(unpoweredBuildings(c).length>0);
 const solar=plants.find(z=>z.type===62);delete c.disabledBuildings[solar.i];c.refresh();assert.equal(c.powerCapacity,1000);assert.equal(c.powerUsed,1001);assert.equal(c.powerOverloaded,true);assert.equal(c.powerTraversal.dropped,0);
 c.disabledBuildings={};c.refresh();assert.equal(c.powerOverloaded,false);assert.ok(c.zones.filter(z=>z.type>=5&&z.type<=7).every(z=>c.power[z.i]));
 for(let y=20;y<23;y++)for(let x=90;x<93;x++)c.map[y*c.width+x]=0;assert.ok(c.place(5,90,20));const isolated=c.zones.find(z=>z.type===5&&z.x===91&&z.y===21);assert.ok(isolated);assert.equal(c.power[isolated.i],0);assert.equal(c.powerOverloaded,false);
});
