import fs from 'node:fs';import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';import inspector from 'node:inspector';
import {registerHooks} from 'node:module';import {execFileSync} from 'node:child_process';
const reference=process.argv.find(a=>a.startsWith('--civic-ref='))?.slice(12)||null;
if(reference){const source=execFileSync('git',['show',reference+':src/civic.js'],{encoding:'utf8'});registerHooks({load(url,context,next){return new URL(url).pathname.endsWith('/src/civic.js')?{format:'module',source,shortCircuit:true}:next(url,context);}});}
const {activeUtilityFixture}=await import('./fixtures-active-utilities.mjs');
const {civicServices}=await import('../src/civic.js'),{sewageServices}=await import('../src/sewage.js');

const c=activeUtilityFixture(),snapshot=c.serialize(),samples=[];
const session=new inspector.Session();session.connect();
const post=(name,args={})=>new Promise((resolve,reject)=>session.post(name,args,(e,r)=>e?reject(e):resolve(r)));
await post('Profiler.enable');await post('Profiler.start');
for(let n=0;n<20;n++){
 const start=performance.now();c.stepSimulation();assert.equal(c.baseStep,n+1);
 samples.push({baseStep:c.baseStep,ms:performance.now()-start,month:c.month,population:c.population});
}
const {profile}=await post('Profiler.stop');session.disconnect();
const hits=new Map();for(const node of profile.nodes)if(node.hitCount){const k=node.callFrame.functionName+' '+node.callFrame.url.split('/src/').at(-1);hits.set(k,(hits.get(k)||0)+node.hitCount);}
const sorted=samples.map(s=>s.ms).sort((a,b)=>a-b),monthly=samples.filter(s=>s.baseStep%4===0).map(s=>s.ms);
const services=civicServices(c),sewage=sewageServices(c);
const result={reference,method:'Node CPU step timings, actual enabled utilities and power; not rendered frame time or display FPS',initial:JSON.parse(snapshot),samples,medianMs:sorted[sorted.length>>1],maximumMs:sorted.at(-1),monthlyMs:monthly,top:[...hits].sort((a,b)=>b[1]-a[1]).slice(0,24),final:c.serialize(),services:{waterPumps:services.pumpStatuses.filter(p=>p.working).length,watered:services.watered.size,busRoutes:services.routes.length,sewagePumps:sewage.statuses.filter(p=>p.id===973&&p.powered&&p.connected).length,generated:sewage.generated,treated:sewage.treated,collected:sewage.collected,backlog:sewage.backlog},errors:[]};
fs.mkdirSync('output',{recursive:true});fs.writeFileSync(process.argv[2]||'output/active-utilities-profile.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({samples,medianMs:result.medianMs,maximumMs:result.maximumMs,top:result.top,services:result.services},null,2));
