import test from 'node:test';import assert from 'node:assert/strict';import {recordRomHistory} from '../src/rom-history.js';
test('dated event history keeps ten entries in original chronological order',()=>{
 const history=[];for(let n=0;n<13;n++)recordRomHistory(history,n,1900+n,1+n%12);
 assert.equal(history.length,10);assert.deepEqual(history[0],{id:3,year:1903,month:4});assert.deepEqual(history[9],{id:12,year:1912,month:1});
 recordRomHistory(history,0x10010,0x1076c,0x10002);assert.deepEqual(history.at(-1),{id:16,year:1900,month:2});
});
