import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {City} from '../src/simulation.js';import {pumpStatus,utilityPipeStatus,civicServices} from '../src/civic.js';import {sewageServices} from '../src/sewage.js';import {utilityInspectionHTML} from '../src/utility-inspection.js';
const build=JSON.parse(fs.readFileSync('assets/tables/build.json')),flags=JSON.parse(fs.readFileSync('assets/tables/city.json')).flags;
const fresh=()=>{const c=new City(new Uint16Array(12000),structuredClone(build),[...flags],{civicEnabled:true});c.funds=200000;return c;};
test('water intakes and sewage outfalls operate equally on north, south, east and west sides',()=>{
 for(const [x,y] of [[21,19],[21,23],[19,21],[23,21]])for(const tool of [39,44]){
  const c=fresh();c.place(tool,20,20);c.map[y*120+x]=2;c.place(5,26,20);c.map[21*120+27]=0x99;for(let px=21;px<=28;px++)c.pipes[23*120+px]=1;c.refresh();c.power.fill(1);const z=c.zones.find(z=>z.type===tool);assert.ok(utilityPipeStatus(c,z).intake,`${tool}: water ${x},${y}`);
  if(tool===39){assert.ok(pumpStatus(c,z).working);assert.ok(civicServices(c).watered.has(21*120+27));}else{const s=sewageServices(c);assert.equal(s.dumped,320);assert.equal(s.backlog,0);assert.ok(s.discharges.some(d=>d.points.includes(y*120+x)));}
 }
});
test('treatment accepts a pipe underneath any tile or beside any edge without drinking water',()=>{
 for(const [x,y]of[[20,20],[23,23],[22,22],[19,21],[24,21],[21,19],[21,24]]){
  const c=fresh();c.place(45,20,20);c.pipes[y*120+x]=1;c.refresh();c.power.fill(1);const z=c.zones.find(z=>z.id===974),s=utilityPipeStatus(c,z);assert.ok(s.working,`pipe ${x},${y}`);assert.ok(s.pipePoints.includes(y*120+x));assert.equal(s.intake,false);const html=utilityInspectionHTML(c,z);assert.match(html,/Pipe network: <b>connected/);assert.match(html,/Needs a sewage pump/);assert.match(html,/drinking-water supply is not required/);
 }
});
test('connected treatment reports its real processing allocation and missing power/pipe',()=>{
 const c=fresh();c.place(44,20,20);c.place(45,30,20);c.place(5,25,25);c.map[26*120+26]=0x99;for(let x=21;x<35;x++)c.pipes[23*120+x]=1;c.refresh();c.power.fill(1);const z=c.zones.find(z=>z.id===974);let s=sewageServices(c),p=s.statuses.find(p=>p.i===z.i);assert.equal(p.treated,320);assert.equal(p.capacity,20000);assert.equal(p.reason,'Treating sewage');assert.equal(s.dumped,0);c.power[z.i]=0;assert.match(utilityInspectionHTML(c,z),/Needs electricity/);c.power[z.i]=1;c.pipes.fill(0);assert.match(utilityInspectionHTML(c,z),/Connect a pipe/);
});
