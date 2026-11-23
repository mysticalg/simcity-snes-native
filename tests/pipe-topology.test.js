import test from 'node:test';import assert from 'node:assert/strict';
import {pipeTopology} from '../src/pipe-topology.js';import {allocateWater} from '../src/water-allocation.js';
test('pipe components retain row-major seeds, BFS order and row boundaries',()=>{
 const city={width:3},nodes=Uint8Array.of(1,1,0,1,1,0,0,0,1),t=pipeTopology(city,nodes);
 assert.deepEqual(Array.from(t.labels),[0,0,-1,0,0,-1,-1,-1,1]);assert.deepEqual(t.components,[[0,1,3,4],[8]]);
 assert.equal(pipeTopology(city,Uint8Array.from(nodes)),t);assert.throws(()=>t.components[0].push(8),TypeError);
});
test('in-place pipe edits and width changes invalidate exact topology',()=>{
 const city={width:3},nodes=Uint8Array.of(0,0,1,1,0,0),first=pipeTopology(city,nodes);assert.deepEqual(first.components,[[2],[3]]);
 city.width=2;const next=pipeTopology(city,nodes);assert.notEqual(next,first);assert.deepEqual(next.components,[[2,3]]);
 nodes[3]=0;assert.deepEqual(pipeTopology(city,nodes).components,[[2]]);assert.deepEqual(next.components,[[2,3]]);
 nodes.fill(0);assert.deepEqual(pipeTopology(city,nodes).components,[]);
});
test('water output ownership and source changes never leak into the cached graph',()=>{
 const city={width:3,height:3,civic:{},zones:[{x:1,y:1,i:4,id:0x99,type:5}],zonePopulation:()=>16},nodes=new Uint8Array(9).fill(1),pumps=[{i:0,capacity:5000}];
 const a=allocateWater(city,nodes,pumps),expected=a.networks[0].cells.slice();assert.ok(a.watered.has(4));
 a.networks[0].cells.length=0;a.water.fill(0);a.assignments.clear();
 const b=allocateWater(city,nodes,pumps);assert.deepEqual(b.networks[0].cells,expected);assert.ok(b.watered.has(4));
 const dry=allocateWater(city,nodes,[]);assert.equal(dry.watered.size,0);assert.equal(dry.assignments.get(4).code,'no-source');
 assert.ok(allocateWater(city,nodes,pumps).watered.has(4));
});
