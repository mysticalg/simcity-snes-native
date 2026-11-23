import test from 'node:test';import assert from 'node:assert/strict';
import {busRoutes} from '../src/civic.js';
const point=(x,y,id=967)=>({x,y,id});
function fixture(width,height,roads){
 const flags=new Uint8Array(1024);flags[0x32]=64;
 const map=new Uint16Array(width*height);for(const i of roads)map[i]=0x32;
 return {width,height,map,flags};
}
test('bus routes retain N/E/S/W tie breaking and the return path',()=>{
 const c=fixture(3,3,Array.from({length:9},(_,i)=>i));
 assert.deepEqual(busRoutes(c,[point(0,0,968)],[point(2,2)]),[[8,5,2,1,0,1,2,5]]);
 assert.deepEqual(busRoutes(c,[point(0,0,968)],[point(0,0),point(2,2),point(2,2)]),[[8,5,2,1,0,1,2,5],[8,5,2,1,0,1,2,5]]);
});
test('disconnected stops and row boundaries remain unreachable',()=>{
 assert.deepEqual(busRoutes(fixture(3,2,[2,3]),[point(2,0,968)],[point(0,1)]),[]);
 assert.deepEqual(busRoutes(fixture(8,4,[0,1,2,29,30,31]),[point(0,0,968)],[point(7,3)]),[]);
 assert.deepEqual(busRoutes(fixture(8,4,[]),[point(0,0,968)],[point(7,3)]),[]);
});
test('empty destinations, same entry, duplicates and the 32-route cap',()=>{
 const c=fixture(8,1,[0,1,2,3,4,5,6,7]),station=point(0,0,968);
 assert.deepEqual(busRoutes(c,[station],[]),[]);assert.deepEqual(busRoutes(c,[],[point(7,0)]),[]);
 assert.deepEqual(busRoutes(c,[station],[point(0,0)]),[]);
 const routes=busRoutes(c,[station,station],Array.from({length:40},()=>point(7,0)));
 assert.equal(routes.length,32);for(const route of routes)assert.deepEqual(route,[7,6,5,4,3,2,1,0,1,2,3,4,5,6]);
});
test('nearby stops do not explore the rest of a large unchanged component',()=>{
 const c=fixture(240,200,Array.from({length:48000},(_,i)=>i));let reads=0;
 const flags=c.flags;c.flags=new Proxy(flags,{get:(a,k)=>{if(k==='50')reads++;return a[k];}});
 assert.deepEqual(busRoutes(c,[point(0,0,968)],[point(1,0)]),[[1,0]]);
 assert.ok(reads<12,'Only the discovered prefix should be needed');
});
