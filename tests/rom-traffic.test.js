import test from 'node:test';import assert from 'node:assert/strict';import {decayTraffic,addRouteTraffic} from '../src/rom-traffic.js';
test('traffic decay thresholds and road-only half-resolution saturation match ROM',()=>{
 assert.deepEqual([0,23,24,199,200,240].map(decayTraffic),[0,0,0,175,166,206]);
 const map=Array(16).fill(0),traffic=new Uint8Array(16);map[5]=0x32;map[6]=0x72;
 addRouteTraffic(map,traffic,Array(6).fill({x:1,y:1}),4,4);assert.equal(traffic[0],240);assert.equal(traffic[5],240);assert.equal(traffic[2],0);
 addRouteTraffic(map,traffic,[{x:2,y:1}],4,4);assert.equal(traffic[2],0);
});
