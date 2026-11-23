import test from 'node:test';import assert from 'node:assert/strict';import {CityLayerCache} from '../src/city-layer-cache.js';
test('city layer redraws changed map/overlay pixels and animated VRAM ranges only',()=>{
 const city={map:new Uint16Array(10)},table={top:[0,0x360,0x4001],bottom:[1,1,0x3ff]},cache=new CityLayerCache();
 cache.begin(city,table,'frame0','summer');assert.equal(cache.dirty(0,0,null),true);assert.equal(cache.dirty(1,1,null),true);assert.equal(cache.dirty(2,2,null),true);assert.equal(cache.dirty(0,0,null),false);assert.equal(cache.dirty(1,1,null),false);
 cache.begin(city,table,'frame1','summer');assert.equal(cache.dirty(0,0,null),false);assert.equal(cache.dirty(1,1,null),true);assert.equal(cache.dirty(2,2,null),true);assert.equal(cache.dirty(1,1,null),false);
 assert.equal(cache.dirty(0,1,null),true);assert.equal(cache.dirty(0,1,'red'),true);assert.equal(cache.dirty(0,1,'red'),false);assert.equal(cache.dirty(0,1,null),true);
 cache.begin(city,table,'frame1','winter');assert.equal(cache.dirty(0,1,null),true);cache.begin({map:new Uint16Array(10)},table,'frame1','winter');assert.equal(cache.dirty(0,1,null),true);
});
