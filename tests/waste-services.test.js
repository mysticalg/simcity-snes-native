import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {City} from '../src/simulation.js';import {civicServices,civicAnnualCost,updateCivicMonth} from '../src/civic.js';import {monthlyGarbageDemand,landfillTileVisual} from '../src/landfill.js';import {GarbageVisuals} from '../src/garbage-visuals.js';
function fresh(tools=[]){const c=new City(new Uint16Array(12000),JSON.parse(fs.readFileSync('assets/tables/build.json')),JSON.parse(fs.readFileSync('assets/tables/city.json')).flags);c.funds=200000;for(const [tool,x,y]of tools)assert.ok(c.place(tool,x,y));for(let x=0;x<90;x++)c.map[13*120+x]=0x32;c.refresh();c.power.fill(1);return c;}
const stock=c=>Object.values(c.civic.landfillUsed||{}).reduce((a,b)=>a+b,0);
test('new ImageGen service art is pinned, square and alpha-capable',()=>{const manifest=JSON.parse(fs.readFileSync('assets/custom/waste-manifest.json'));assert.equal(manifest.generator,'built-in image_gen');assert.deepEqual(manifest.logicalFootprint,[2,2]);for(const a of manifest.assets){const bytes=fs.readFileSync('assets/custom/'+a.file);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.sha256);assert.equal(bytes.readUInt32BE(16),a.width);assert.equal(bytes.readUInt32BE(20),a.height);assert.equal(a.width,a.height);assert.ok([4,6].includes(bytes[25]));}});
test('fast budget upkeep equals full service total through power and enable changes',()=>{const c=fresh([[32,20,10],[49,32,10],[50,36,10],[31,10,12]]);for(const enabled of [true,false,true]){c.disabledBuildings=enabled?{}:Object.fromEntries(c.zones.filter(z=>[975,976].includes(z.id)).map(z=>[z.i,z.id]));assert.equal(civicAnnualCost(c),civicServices(c).annual);assert.equal(c.budget(false).civicExpense,civicServices(c).annual);c.power.fill(0);assert.equal(civicAnnualCost(c),civicServices(c).annual);}});
test('balanced generation scales with population/jobs and preserves education benefit',()=>{
 const c={population:100000,rci:[0,500,750]};assert.equal(monthlyGarbageDemand(c),11000);assert.equal(monthlyGarbageDemand(c,.25),8250);assert.equal(monthlyGarbageDemand({population:0,rci:[0,0,0]}),0);
});
test('collection depot removes a real pickup bottleneck without creating disposal capacity',()=>{
 const c=fresh([[32,20,10],[32,26,10]]);c.population=100000;c.rci=[0,0,0];updateCivicMonth(c);assert.equal(c.civic.garbage,1000);assert.equal(c.civic.garbageBurned,9000);
 assert.ok(c.place(50,36,10));c.power.fill(1);c.population=100000;c.rci=[0,0,0];const services=civicServices(c).garbageFacilities;assert.equal(services.capacity.incineration,12000);assert.equal(services.capacity.depotCollection,12000);updateCivicMonth(c);assert.equal(c.civic.garbage,0);assert.equal(c.civic.garbageBurned,11000);
 const only=fresh([[50,36,10]]);only.population=10000;updateCivicMonth(only);assert.equal(only.civic.garbage,1000);assert.equal(only.civic.collectedGarbage,0);
});
test('recycling is disposal, preserves mass and uses no incineration',()=>{
 const c=fresh([[49,32,10]]);c.population=10000;updateCivicMonth(c);assert.equal(c.civic.garbage,0);assert.equal(c.civic.garbageRecycled,1000);assert.equal(c.civic.garbageBurned,0);assert.equal(c.civic.collectedGarbage,1000);assert.equal(stock(c),0);
});
test('spare processing empties full landfill, preserves total waste accounting and saves progress',()=>{
 const c=fresh([[32,20,10],[32,26,10],[49,32,10],[31,10,12]]),z=c.zones.find(z=>z.id===961);c.civic.landfillUsed[z.i]=10000;c.civic.garbage=2000;c.population=10000;const before=stock(c)+c.civic.garbage;updateCivicMonth(c);
 assert.ok(c.civic.garbageReclaimed>0);assert.ok(stock(c)<10000);assert.ok(landfillTileVisual(c,z).fill<1);assert.equal(before+c.civic.generatedGarbage,stock(c)+c.civic.garbage+c.civic.garbageBurned+c.civic.garbageRecycled+c.civic.garbageRegional);assert.ok(c.civic.garbageCollectionUsed<=civicServices(c).garbageFacilities.capacity.collection);
 const r=City.restore(c.serialize(),c.build,c.flags);assert.equal(stock(r),stock(c));assert.equal(r.civic.garbageReclaimed,c.civic.garbageReclaimed);assert.equal(r.civic.garbageRecycled,c.civic.garbageRecycled);
});
test('new services require road/power/enabled state and blocked landfill is not reclaimed',()=>{
 const c=fresh([[49,32,10],[50,36,10],[31,10,12]]),recycle=c.zones.find(z=>z.id===975),depot=c.zones.find(z=>z.id===976),land=c.zones.find(z=>z.id===961);
 c.civic.landfillUsed[land.i]=10000;c.disabledBuildings={[land.i]:961};c.refresh();c.power.fill(1);updateCivicMonth(c);assert.equal(stock(c),10000);assert.equal(c.civic.garbageReclaimed,0);
 c.power[recycle.i]=0;c.power[depot.i]=0;let statuses=civicServices(c).garbageFacilities.statuses;assert.equal(statuses.find(z=>z.id===975).reason,'Needs electricity');assert.equal(statuses.find(z=>z.id===976).capacity,0);
 c.power.fill(1);for(let x=0;x<90;x++)c.map[13*120+x]=0;c.refresh();c.power.fill(1);statuses=civicServices(c).garbageFacilities.statuses;assert.equal(statuses.find(z=>z.id===975).reason,'Needs road access');assert.equal(statuses.find(z=>z.id===976).capacity,0);
});
test('new facilities retain square footprints, budget expense and real road-bound depot trucks',()=>{
 const c=fresh([[32,20,10],[49,32,10],[50,36,10],[5,60,10]]),depot=c.zones.find(z=>z.id===976);for(const tool of [49,50]){assert.equal(c.build.buildings[tool].tiles.length,4);assert.equal(c.build.buildings[tool].x.at(-1),1);assert.equal(c.build.buildings[tool].y.at(-1),1);}assert.ok(c.budget(false).civicExpense>=800);
 c.civic.garbage=50000;c.civic.generatedGarbage=1000;const visuals=new GarbageVisuals(),state=visuals.update(c);assert.equal(state.trucks.filter(t=>t.root===depot.i).length,4);for(const truck of state.trucks)for(const i of truck.path)assert.ok(c.flags[c.map[i]&1023]&64);
 const r=City.restore(c.serialize(),c.build,c.flags);assert.ok(r.zones.some(z=>z.id===975));assert.ok(r.zones.some(z=>z.id===976));assert.equal(c.build.costs[49],2000);assert.equal(c.build.costs[50],1000);
});
