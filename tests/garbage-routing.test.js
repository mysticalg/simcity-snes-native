import test from 'node:test';
import assert from 'node:assert/strict';
import {GarbageVisuals} from '../src/garbage-visuals.js';
import {truckRoutingFixture} from '../tools/fixtures-truck-routing.mjs';

function routeAllocations(fn){
 const Native=globalThis.Int32Array;let count=0;
 globalThis.Int32Array=new Proxy(Native,{construct(target,args,newTarget){
  if(new Error().stack.split('\n')[2]?.includes('GarbageVisuals.update'))count++;
  return Reflect.construct(target,args,newTarget);
 }});
 try{fn();return count;}finally{globalThis.Int32Array=Native;}
}

test('full surviving fleets retain truck identity without rebuilding unused routes',()=>{
 const city=truckRoutingFixture(),fx=new GarbageVisuals();
 assert.equal(routeAllocations(()=>fx.update(city)),4);
 const trucks=[...fx.states.get(city).trucks];assert.equal(trucks.length,10);
 city.map[40*120+100]=24;city.refresh();
 assert.equal(routeAllocations(()=>fx.update(city)),0);
 assert.deepEqual(fx.states.get(city).trucks,trucks);
 for(let n=0;n<40;n++){city.civic.busFrame+=60;fx.update(city);}
 city.civic.busFrame+=120;const saved=city.serialize(),state=fx.update(city);
 assert.ok(state.trucks.some(t=>t.at!==0||t.fraction>0));assert.ok(state.pickups>0);
 assert.equal(city.serialize(),saved);
});

test('deleted route cells remove stranded trucks and reconnecting roads restores fleets',()=>{
 const city=truckRoutingFixture(),fx=new GarbageVisuals();fx.update(city);
 city.map[8*120+40]=0;city.refresh();assert.equal(fx.update(city).trucks.length,0);
 city.map[8*120+40]=0x32;city.refresh();
 assert.equal(routeAllocations(()=>fx.update(city)),4);assert.equal(fx.states.get(city).trucks.length,10);
 for(const truck of fx.states.get(city).trucks)for(const i of truck.path)assert.ok(city.flags[city.map[i]&1023]&64);
});

test('facility shutdowns, full landfill and real blackouts still remove their trucks',()=>{
 const city=truckRoutingFixture(),fx=new GarbageVisuals(),depot=city.zones.find(z=>z.id===976),landfill=city.zones.find(z=>z.id===961),plant=city.zones.find(z=>z.id===963);
 assert.equal(fx.update(city).trucks.length,10);
 city.setBuildingEnabled(depot,false);assert.equal(fx.update(city).trucks.length,6);
 city.civic.landfillUsed[landfill.i]=10000;city.refresh();assert.equal(fx.update(city).trucks.length,4);
 city.setBuildingEnabled(plant,false);assert.equal(fx.update(city).trucks.length,0);
 city.setBuildingEnabled(plant,true);city.setBuildingEnabled(depot,true);city.civic.landfillUsed[landfill.i]=0;city.refresh();
 assert.equal(fx.update(city).trucks.length,10);
 const restored=city.constructor.restore(city.serialize(),city.build,city.flags);
 assert.equal(new GarbageVisuals().update(restored).trucks.length,10);
});
