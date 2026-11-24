import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {City} from '../src/simulation.js';import {civicBounds,civicServices,pumpStatus,updateCivicMonth} from '../src/civic.js';
import {installBuildingOperations,buildingAt} from '../src/building-operations.js';import {processingMeters} from '../src/facility-meters.js';import {unpoweredBuildings} from '../src/power-warnings.js';import {analyzeCity} from '../src/regions.js';
installBuildingOperations(City);
const fresh=()=>{const c=new City(new Uint16Array(12000),JSON.parse(fs.readFileSync('assets/tables/build.json')),JSON.parse(fs.readFileSync('assets/tables/city.json')).flags);c.funds=200000;return c;};
test('new utility footprints, costs, upkeep and exact removal match their displayed plot sizes',()=>{
 for(const [tool,w,h,cost,annual]of[[39,2,2,500,100],[60,1,2,1000,50],[61,3,3,1500,250],[62,2,2,5000,100]]){const c=fresh(),funds=c.funds;assert.equal(c.footprint(tool,20,20).length,w*h);assert.ok(c.place(tool,20,20));const z=c.zones.find(z=>z.type===tool),b=civicBounds(z);assert.equal(b.width,w);assert.equal(b.height,h);assert.equal(c.funds,funds-cost);assert.equal(c.budget(false).civicExpense,annual);assert.ok(c.place(0,z.x,z.y));for(const p of c.footprint(tool,20,20))assert.equal(c.id(p.x,p.y),0);}
});
test('heavy pump delivers exactly triple output and connects from each shoreline edge without road access',()=>{
 for(const tool of[39,61])for(const side of['north','south','east','west']){const c=fresh();c.place(tool,20,20);const z=c.zones.find(z=>z.type===tool),b=civicBounds(z),[x,y]=side==='north'?[b.x,b.y-1]:side==='south'?[b.x,b.y+b.height]:side==='west'?[b.x-1,b.y]:[b.x+b.width,b.y];c.map[y*120+x]=2;c.pipes[z.i]=1;c.refresh();c.power.fill(1);assert.ok(pumpStatus(c,z).working);const s=civicServices(c);assert.equal(s.capacity.water,tool===39?20000:60000);assert.equal(s.waterNetworks.find(n=>n.pumps).capacity,tool===39?20000:60000);assert.equal(analyzeCity(c).water.groups.find(n=>n.generation).generation,tool===39?20000:60000);}
});
test('water tower fills only from surplus, releases finite stored water, saves it and never changes during previews',()=>{
 const c=fresh();c.place(39,20,20);c.place(60,25,20);c.place(5,28,23);c.map[20*120+19]=2;for(let x=21;x<=30;x++)c.pipes[22*120+x]=1;c.refresh();c.power.fill(1);const tower=c.zones.find(z=>z.type===60),pump=c.zones.find(z=>z.type===39);assert.equal(pumpStatus(c,tower).intake,false);assert.ok(pumpStatus(c,tower).working);
 const state=c.serialize();civicServices(c);civicServices(c);assert.equal(c.serialize(),state);updateCivicMonth(c);assert.equal(c.civic.waterStored[tower.i],5000);assert.equal(processingMeters(c,tower).meters[0].value,5000);
 const saved=City.restore(c.serialize(),c.build,c.flags);assert.equal(saved.civic.waterStored[tower.i],5000);c.disabledBuildings={[pump.i]:pump.id};c.power.fill(1);let s=civicServices(c);assert.equal(s.capacity.water,0);assert.ok(s.watered.size);updateCivicMonth(c);assert.equal(c.civic.waterStored[tower.i],4980);assert.equal(c.civic.waterStorageFlow[tower.i].released,20);
 c.civic.waterStored[tower.i]=0;s=civicServices(c);assert.equal(s.watered.size,0);assert.ok(s.waterNetworks.every(n=>n.capacity===0));
});
test('solar array powers connected loads, contributes to regional generation, and respects building on/off',()=>{
 const c=fresh();c.place(62,20,20);c.place(1,22,21);assert.equal(c.powerCapacity,1000);assert.ok(c.power[21*120+22]);const z=c.zones.find(z=>z.type===62);assert.ok(!unpoweredBuildings(c).some(n=>n.i===z.i));assert.equal(analyzeCity(c).power.groups.reduce((n,g)=>n+g.generation,0),1000);assert.equal(processingMeters(c,z).status,'Generating');c.setBuildingEnabled(z,false);assert.equal(c.powerCapacity,0);assert.equal(c.power[21*120+22],0);c.setBuildingEnabled(z,true);assert.equal(c.powerCapacity,1000);
});
test('old pump saves preserve their three by three footprint across reload and demolition',()=>{
 const c=fresh();c.place(61,20,20);const heavy=c.zones.find(z=>z.type===61);c.map[heavy.i]=969;const s=JSON.parse(c.serialize());s.civicLayoutVersion=2;const restored=City.restore(JSON.stringify(s),c.build,c.flags),z=restored.zones.find(z=>z.id===969);assert.equal(civicBounds(z).width,3);assert.equal(civicBounds(z).height,3);assert.equal(buildingAt(restored,22,22)?.id,969);const again=City.restore(restored.serialize(),c.build,c.flags);assert.equal(civicBounds(again.zones.find(z=>z.id===969)).width,3);again.place(0,z.x,z.y);for(let y=20;y<23;y++)for(let x=20;x<23;x++)assert.equal(again.id(x,y),0);
});
test('tower replacement cannot retain free stored water and atomic previews preserve the original reserve',()=>{
 const c=fresh();c.place(60,20,20);const z=c.zones.find(z=>z.type===60);c.civic.waterStored[z.i]=20000;const plan=c.planPlacements(60,[{x:20,y:20}],{autoDemolish:true});assert.ok(plan.ok);assert.equal(c.civic.waterStored[z.i],20000);assert.equal(plan.waterStored[z.i],0);c.applyPlacementPlan(plan);assert.equal(c.civic.waterStored[z.i],0);c.civic.waterStored[z.i]=5000;c.place(0,z.x,z.y);assert.equal(c.civic.waterStored[z.i],undefined);
});
