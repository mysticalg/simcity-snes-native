import test from 'node:test';
import assert from 'node:assert/strict';
import {tileDrawBounds} from '../src/tile-draw-bounds.js';
import {drawElevation} from '../src/elevation.js';
import {drawTerrainShore} from '../src/terrain-tools.js';

test('terrain capture bounds retain edge cells and clip outside the map',()=>{
 assert.deepEqual(tileDrawBounds(240,200),{x0:0,y0:0,x1:240,y1:200});
 assert.deepEqual(tileDrawBounds(240,200,{x:-2,y:198,width:5,height:8}),{x0:0,y0:198,x1:3,y1:200});
 assert.deepEqual(tileDrawBounds(240,200,{x:2.25,y:4.75,width:1.5,height:2.5}),{x0:2,y0:4,x1:4,y1:8});
 assert.deepEqual(tileDrawBounds(240,200,{x:300,y:-10,width:3,height:3}),{x0:240,y0:0,x1:240,y1:0});
});

test('small terrain captures keep neighbor shading without reading every map cell',()=>{
 const width=240,height=200,n=width*height,reads={elevation:0,terraform:0},elevation=new Int8Array(n).fill(1),terraform=new Uint8Array(n),map=new Uint16Array(n),i=40*width+40;
 elevation[i]=4;elevation[i-width]=2;elevation[i-1]=6;terraform[i]=1;map[i]=2;
 const counted=(a,key)=>new Proxy(a,{get(target,p){if(/^\d+$/.test(String(p)))reads[key]++;return Reflect.get(target,p,target);}}),city={width,height,map,elevation:counted(elevation,'elevation'),terraform:counted(terraform,'terraform')},calls=[],ctx={fillRect(...args){calls.push([this.fillStyle,...args]);}};
 drawElevation(ctx,city,{x:40,y:40,width:1,height:1});
 assert.equal(reads.elevation,3);assert.equal(calls.length,3);assert.ok(calls.some(c=>c[0]==='#d1ce9a88'));assert.ok(calls.some(c=>c[0]==='#273d2688'));
 calls.length=0;drawTerrainShore(ctx,city,{x:40,y:40,width:1,height:1});
 assert.equal(reads.terraform,1);assert.equal(calls.length,4);
});
