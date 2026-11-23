import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {pathToFileURL} from 'node:url';import path from 'node:path';
import {allocateWater} from '../src/water-allocation.js';import {sewageServices} from '../src/sewage.js';import {waterNetwork,utilityPipeStatus} from '../src/civic.js';
import {installBuildingOperations} from '../src/building-operations.js';import {installHealthCare} from '../src/health-care.js';import {installFinancialSafety} from '../src/financial-safety.js';
import {activeUtilityFixture} from './fixtures-active-utilities.mjs';
const reference='7f36c07',source=name=>execFileSync('git',['show',reference+':src/'+name+'.js'],{encoding:'utf8'});
const waterSource=source('water-allocation'),oldWater=Function(waterSource.slice(waterSource.indexOf('export function allocateWater'),waterSource.indexOf('// Allocation previews')).replace('export function','function')+';return allocateWater;')();
const sewageSource=source('sewage'),oldSewage=Function('waterNetwork','utilityPipeStatus',sewageSource.slice(sewageSource.indexOf('export function sewageServices'),sewageSource.indexOf('export function updateSewageMonth')).replace('export function','function')+';return sewageServices;')(waterNetwork,utilityPipeStatus);
let seed=0x51c17e;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed>>>8;};let waterCases=0,sewageCases=0,operationsCases=0;
for(let n=0;n<300;n++){
 const width=[3,17,120,240][n%4],height=[5,13,100,200][n%4],length=width*height,nodes=Uint8Array.from({length},()=>Number(random()%100<n%5*20)),zones=Array.from({length:20},(_,k)=>{const i=random()%length;return {i,x:i%width,y:Math.floor(i/width),id:k%4?0x99:0x84,type:[5,6,7,30][k%4],pop:random()%49};}),city={width,height,map:new Uint16Array(length),zones,civic:{waterStored:{}},zonePopulation:z=>z.pop,adjacentSmallHomeCount:z=>z.pop%9,regionalState:n%3?null:{waterAllocations:new Map([[0,5000],[random()%length,random()%10000]])}},pumps=Array.from({length:8},(_,k)=>{const i=random()%length;city.civic.waterStored[i]=random()%20001;return k%3?{i,capacity:random()%15001}:{i,storage:20000,flow:5000};});
 for(let edit=0;edit<3;edit++){
  if(edit===1){pumps[0].flow=1000;city.civic.waterStored[pumps[0].i]=0;pumps[1].capacity=0;}
  if(edit===2)for(let k=0;k<20;k++){const i=random()%length;nodes[i]=nodes[i]?0:1;}
  assert.deepEqual(allocateWater(city,nodes,pumps),oldWater(city,nodes,pumps),'Water case '+n+':'+edit);waterCases++;
 }
}
const fixture=activeUtilityFixture(),snapshot=fixture.serialize(),build=fixture.build,flags=fixture.flags;
const {City:Before}=await import('../src/simulation.js?utility-before-52'),{City:After}=await import('../src/simulation.js?utility-after-52');
const operations=source('building-operations').replace(/(['"])\.\/([^'"]+)\1/g,(_,q,p)=>q+pathToFileURL(path.resolve('src',p.split('?')[0])).href+(p.includes('?')?'?'+p.split('?')[1]:'')+q),oldOps=await import('data:text/javascript;base64,'+Buffer.from(operations).toString('base64'));
oldOps.installBuildingOperations(Before);installBuildingOperations(After);for(const C of[Before,After]){installHealthCare(C);installFinancialSafety(C);}
const choices=fixture.zones.filter(z=>[963,973,974,969,989,960,966,968].includes(z.id));
for(let n=0;n<18;n++){
 const save=JSON.parse(snapshot);save.disabledBuildings={};
 for(const z of choices)if(n===1?z.id===963:n>1&&(z.i+n)%n===0)save.disabledBuildings[z.i]=z.id;
 if(n===2)save.disabledBuildings[1]=963; // Stale saved entry.
 const text=JSON.stringify(save),a=Before.restore(text,build,flags),b=After.restore(text,build,flags);
 for(const action of[c=>c.updatePower(),c=>c.captureServiceInputs(),c=>c.setPoliceEffectiveness(1),c=>c.setPoliceEffectiveness(2)]){action(a);action(b);assert.equal(b.serialize(),a.serialize(),'Operations case '+n);operationsCases++;}
}
const c=After.restore(snapshot,build,flags),initialPipes=c.pipes.slice(),pump=c.zones.find(z=>z.id===973),plant=c.zones.find(z=>z.id===974);
const edits=[()=>{},()=>c.pipes.fill(0),()=>{c.pipes=initialPipes.slice();},()=>{for(let y=0;y<c.height;y++)c.pipes[y*c.width+100]=0;},()=>{c.pipes=initialPipes.slice();c.disabledBuildings[pump.i]=pump.id;},()=>{delete c.disabledBuildings[pump.i];c.disabledBuildings[plant.i]=plant.id;},()=>{c.disabledBuildings={};c.civic.sewageDebt={[6000]:1234567,[pump.i]:42000};},()=>{c.civic.education=90;},()=>{c.civic.sewageDebt=null;c.civic.sewageBacklog=120000;},()=>{c.map[pump.i+2]=2;for(const z of c.zones)if(z.id===974)c.disabledBuildings[z.i]=z.id;},()=>{c.disabledBuildings={};for(const z of c.zones)if(z.id===963)c.disabledBuildings[z.i]=z.id;},()=>{c.disabledBuildings={};}];
for(const edit of edits){edit();c.refresh();const before=c.serialize();assert.deepEqual(sewageServices(c),oldSewage(c),'Sewage edit '+sewageCases);assert.equal(c.serialize(),before);sewageCases++;}
const result={reference,waterCases,sewageCases,operationsCases,exactOutputs:true,previewPure:true,edits:['pipes','widths','pump capacity','tower storage','regional supply','off facilities','stale off entries','education','source debt','legacy debt','outfall','total blackout','police effectiveness']};
fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/utility-work-v52.json',JSON.stringify(result,null,2));console.log(result);
