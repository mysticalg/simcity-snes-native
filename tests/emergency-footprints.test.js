import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {City,TOOLS} from '../src/simulation.js';
import {CIVIC_TOOLS} from '../src/civic.js';
import {emergencyBounds} from '../src/emergency.js';
import {addRomServiceCenter} from '../src/rom-services.js';
import {burnRomZone} from '../src/rom-collision.js';
import {buildingAt,buildingSummary,installBuildingOperations} from '../src/building-operations.js';
import {budgetBreakdown} from '../src/budget-view.js';
installBuildingOperations(City);
const build=JSON.parse(fs.readFileSync('assets/tables/build.json')),flags=JSON.parse(fs.readFileSync('assets/tables/city.json')).flags;
const fresh=()=>{const c=new City(new Uint16Array(12000),structuredClone(build),[...flags]);c.funds=100000;return c;};

test('police/fire station blueprints occupy 2x2, charge $500 and clear only four tiles',()=>{
 for(const [tool,id] of [[8,977],[9,978]]){
  const c=fresh(),plan=c.planPlacements(tool,[{x:20,y:20}]);assert.equal(c.footprint(tool,20,20).length,4);assert.ok(plan.ok);assert.equal(plan.cost,500);
  assert.ok(c.place(tool,20,20));assert.ok(c.place(tool,22,20));const z=c.zones.find(z=>z.id===id);assert.equal(c.funds,99000);assert.equal(c.counts[tool],2);
  assert.deepEqual(emergencyBounds(z),{x:20,y:20,width:2,height:2});
  for(let y=20;y<22;y++)for(let x=20;x<22;x++)assert.equal(buildingAt(c,x,y)?.i,z.i);
  assert.equal(buildingAt(c,20,22),null);assert.equal(buildingAt(c,22,20)?.x,23);
  c.pipes[20*120+20]=1;assert.ok(c.place(0,20,20));for(let y=20;y<22;y++)for(let x=20;x<22;x++)assert.equal(c.id(x,y),0);
  assert.equal(c.id(23,21),id);assert.equal(c.pipes[20*120+20],1);
 }
});

test('compact stations receive full service strength on all four adjacent road sides, plus power/funding penalties',()=>{
 for(const [id,kind] of [[977,'police'],[978,'fire']])for(const [x,y] of [[20,19],[22,20],[20,22],[19,20]]){
  const c=fresh();c.place(id===977?8:9,20,20);const z=c.zones[0],cell=(z.y>>3)*15+(z.x>>3),value=()=>{const field=new Uint16Array(195);addRomServiceCenter(field,c.map,z.i,1000,kind);return field[cell];};
  c.map[z.i]|=0x8000;assert.equal(value(),500);c.map[y*120+x]=0x32;assert.equal(value(),1000);c.map[z.i]&=0x7fff;assert.equal(value(),500);
  c.refresh();assert.equal(c.budget(false).requests[kind==='police'?1:2],100);const summary=buildingSummary(c,c.zones[0],TOOLS,CIVIC_TOOLS);assert.equal(summary.annualUpkeep,100);assert.ok(c.setBuildingEnabled(c.zones[0],false));assert.equal(c.budget(false).requests[kind==='police'?1:2],0);assert.equal(buildingSummary(c,c.zones[0],TOOLS,CIVIC_TOOLS).annualUpkeep,0);
  assert.equal(budgetBreakdown(c).allocatedCost,c.budget(false).income-c.budget(false).net);
 }
});

test('headquarters stay 3x3 gifts, double source strength and support full footprint inspection and toggling',()=>{
 for(const [tool,id,kind] of [[21,0x307,'police'],[22,0x310,'fire']]){
  const c=fresh();assert.equal(c.footprint(tool,30,30).length,9);assert.equal(c.place(tool,30,30),false);c.gifts.push(tool);assert.ok(c.place(tool,30,30));assert.ok(!c.gifts.includes(tool));const z=c.zones.find(z=>z.id===id);
  for(let y=30;y<33;y++)for(let x=30;x<33;x++)assert.equal(buildingAt(c,x,y)?.i,z.i);
  assert.match(buildingSummary(c,z,TOOLS,CIVIC_TOOLS).name,/headquarters/);assert.ok(c.setBuildingEnabled(z,false));assert.equal(c.budget(false).requests[kind==='police'?1:2],0);assert.ok(c.setBuildingEnabled(z,true));
  c.map[z.i]|=0x8000;c.map[29*120+31]=0x32;const field=new Uint16Array(195);addRomServiceCenter(field,c.map,z.i,1000,kind);assert.equal(field[(z.y>>3)*15+(z.x>>3)],2000);
  c.map[30*120+33]=44;assert.ok(c.place(0,32,32));assert.equal(c.id(33,30),44);for(let y=30;y<33;y++)for(let x=30;x<33;x++)assert.equal(c.id(x,y),0);
 }
});

test('legacy 3x3 stations and compact stations persist together without resizing or losing neighboring tiles',()=>{
 const c=fresh();for(const tool of [8,9]){const b=build.buildings[tool],x=tool===8?10:16;for(let n=0;n<9;n++)c.map[(10+b.y[n])*120+x+b.x[n]]=b.tiles[n];assert.ok(c.place(tool,x,16));}c.refresh();const before=Array.from(c.map,n=>n&1023),saved=City.restore(c.serialize(),c.build,c.flags);assert.deepEqual(Array.from(saved.map,n=>n&1023),before);assert.deepEqual([saved.counts[8],saved.counts[9]],[2,2]);
 for(const [x,id] of [[10,0x249],[16,0x252]]){for(let y=10;y<13;y++)for(let xx=x;xx<x+3;xx++)assert.equal(buildingAt(saved,xx,y)?.id,id);saved.map[10*120+x+3]=44;assert.ok(saved.place(0,x+2,12));assert.equal(saved.id(x+3,10),44);for(let y=10;y<13;y++)for(let xx=x;xx<x+3;xx++)assert.equal(saved.id(xx,y),0);}
});

test('fire/collision damage to compact stations never burns a neighboring 3x3-sized margin',()=>{
 for(const tool of [8,9]){const c=fresh();c.place(tool,20,20);const z=c.zones[0];for(let y=19;y<=22;y++)for(let x=19;x<=22;x++)if(x<20||x>21||y<20||y>21)c.map[y*120+x]=0x89;const before=c.map.slice();burnRomZone(c.map,z.i,c.flags);for(let y=19;y<=22;y++)for(let x=19;x<=22;x++)assert.equal(c.map[y*120+x],x>=20&&x<=21&&y>=20&&y<=21?0x7f:before[y*120+x]);}
});
