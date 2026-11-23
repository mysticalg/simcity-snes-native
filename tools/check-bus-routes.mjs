import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {busRoutes,civicRoadEntry} from '../src/civic.js';
const source=execFileSync('git',['show','c1f179f:src/civic.js'],{encoding:'utf8'});
const block=source.slice(source.indexOf('export function busRoutes('),source.indexOf('\n\nexport function waterService'));
const original=Function('civicRoadEntry',block.replace('export function','function')+';return busRoutes;')(civicRoadEntry);
let seed=0x51c17e;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
let comparisons=0,totalRoutes=0;const flags=new Uint8Array(1024);flags[50]=64;flags[51]=64;flags[52]=32;
for(let n=0;n<600;n++){
 const width=[3,8,31,120,240][n%5],height=[7,11,19,100,200][n%5],map=new Uint16Array(width*height);
 for(let i=0;i<map.length;i++)map[i]=random()%100<(n%4)*25?50:0;
 const point=(id)=>({x:random()%width,y:random()%height,id});
 const stations=Array.from({length:n%9},()=>point(968)),stops=Array.from({length:n%41},()=>point(967));
 const city={width,height,map,flags},before=map.slice(),expected=original(city,stations,stops),actual=busRoutes(city,stations,stops);
 assert.deepEqual(actual,expected,'Route changed in case '+n);assert.deepEqual(map,before);comparisons++;totalRoutes+=actual.length;
}
// Shared open component, duplicate and same-entry stops, then topology edits.
const map=new Uint16Array(48000).fill(50),city={width:240,height:200,map,flags},stations=[{x:10,y:10,id:968},{x:200,y:190,id:968}],stops=Array.from({length:40},(_,i)=>({x:i%20,y:10,id:967}));
for(const edit of[()=>{},()=>{for(let y=0;y<200;y++)map[y*240+100]=0;},()=>{map.fill(0);},()=>{map.fill(51);}]){edit();const expected=original(city,stations,stops),actual=busRoutes(city,stations,stops);assert.deepEqual(actual,expected);comparisons++;totalRoutes+=actual.length;}
const result={reference:'c1f179f',comparisons,totalRoutes,exactRouteOrder:true,topologyEdits:true,sourceMapUnchanged:true};
fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/bus-routes-v51.json',JSON.stringify(result,null,2));console.log(result);
