import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';import {City} from '../src/simulation.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),romHash=sha(fs.readFileSync(rom));
if(romHash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const build=JSON.parse(fs.readFileSync(path.join(root,'assets/tables/build.json'))),flags=JSON.parse(fs.readFileSync(path.join(root,'assets/tables/city.json'))).flags,c=new City(new Uint16Array(12000),build,flags,{nativeGrowthRules:true}),x=60,y=50,i=y*120+x;
const rle=map=>{const out=[];for(const n of map){if(out.at(-1)?.[1]===n)out.at(-1)[0]++;else out.push([1,n]);}return out;};
const configs=[];
for(const [type,tiles]of [[6,[0x13b,0x144,0x14d,0x156,0x15f,0x168,0x1ef,0x39e,0x3a7,0x3b0,0x3b9]],[7,[0x1f8,0x201,0x20a,0x213,0x21c,0x240]]]){
 for(const tile of tiles)configs.push({name:(type===6?'Commercial ':'Industrial ')+tile.toString(16),type,tile});
 for(const network of ['none','dead'])configs.push({name:'transport '+network,type,tile:type===6?0x15f:0x213,network});
 configs.push({name:'unpowered',type,tile:type===6?0x144:0x201,powered:false},{name:'blocked stamp',type,tile:type===6?0x144:0x201,blocked:true});
}
for(const land of [31,32,127,128])configs.push({name:'commercial value gate '+land,type:6,tile:land<100?0x144:0x15f,land});
for(const merge of ['horizontal','vertical'])configs.push({name:'commercial '+merge+' merge',type:6,tile:0x1ef,merge});
configs.push({name:'commercial remote rate',type:6,tile:0x144,rate:-64});
const cases=[];let seed=0xc1c1abcd;
for(const input of configs)for(const demand of [-1500,1500]){
 const config={land:200,pollution:0,powered:true,network:'jobs',rate:64,...input,demand};const counts={};
 for(let attempt=0;attempt<160;attempt++){
  const rng=Array.from({length:7},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed&65535;});const map=new Uint16Array(12000),power=config.powered?32768:0;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)map[(y+dy)*120+x+dx]=(config.tile-4+(dy+1)*3+dx+1)|power;
  if(config.merge){const ox=config.merge==='horizontal'?3:0,oy=config.merge==='vertical'?3:0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)map[(y+oy+dy)*120+x+ox+dx]=(config.tile-4+(dy+1)*3+dx+1)|power;}
  if(config.network!=='none'){for(let px=59;px<78;px++)map[(y-2)*120+px]=0x32;if(config.network==='jobs')map[(y-3)*120+74]=0x99;}if(config.blocked)map[i+1]=0x7f;
  c.map=map.slice();c.simulationRng=[...rng];c.demand=[0,config.type===6?demand:0,config.type===7?demand:0];c.landValue.fill(config.land);c.pollution.fill(config.pollution);c.commercialRate.fill(config.rate);c.traffic.fill(0);c.growthRate.fill(0);
  const decision=c.updateJobZoneTile({x,y,i,id:config.tile,type:config.type});if((counts[decision.action]||0)>=2)continue;counts[decision.action]=(counts[decision.action]||0)+1;
  cases.push({name:config.name,config,seed:rng,input:rle(map),expected:rle(c.map),rng:[...c.simulationRng],action:decision.action,reason:decision.reason,growthRate:[...c.growthRate],traffic:Buffer.from(Array.from({length:3000},(_,at)=>c.traffic[Math.floor(at/60)*240+(at%60)*2])).toString('hex')});
 }
}
const fixtures=cases.map(c=>`{runs={${c.input.map(r=>'{'+r+'}')}},expected={${c.expected.map(r=>'{'+r+'}')}},seed={${c.seed}},rng={${c.rng}},tile=${c.config.tile},kind=${c.config.type},powered=${c.config.powered?32768:0},land=${c.config.land},pollution=${c.config.pollution},rate=${c.config.rate&65535},demand=${c.config.demand&65535},action='${c.action}',growthRate={${c.growthRate.map(v=>v&65535)}},traffic='${c.traffic}'}`).join(',');
const script=`local cases={${fixtures}};local n=0;local injected=false;local action='none';local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 local at=0;for _,run in ipairs(c.runs)do for j=1,run[1]do emu.write16(0x10200+at*2,run[2],mem);at=at+1 end end
 for at=0,2999 do emu.write(0x16b00+at,c.land,mem);emu.write(0x18270+at,c.pollution,mem);emu.write(0x199e0+at,0,mem)end
 for at=0xc13,0xc56 do emu.write(at,0,mem)end
 for at=0,194 do emu.write16(0x1ae62+at*2,0,mem);emu.write16(0x1b47a+at*2,c.rate,mem)end
 emu.write16(0xb85,60+50*256,mem);emu.write16(0xb87,c.tile+c.powered,mem);emu.write16(0xb89,c.tile,mem);emu.write16(0xb49,${i*2},mem);emu.write16(c.kind==6 and 0xbaf or 0xbb1,c.demand,mem)
 for at=0xb8b,0xb96 do emu.write(at,0,mem)end
 for j,v in ipairs(c.seed)do emu.write16(0xccf+(j-1)*2,v,mem)end
 for j,v in ipairs({0x20,c.kind==6 and 0xce or 0x2f,0x92,0xea})do emu.write(0x1000+j-1,v,mem)end
 action='none';emu.write(0x4200,0,emu.memType.snesMemory)
end
for _,item in ipairs({{0x039567,'grow'},{0x0395fc,'grow'},{0x03974b,'decline'},{0x039794,'decline'}})do local address=item[1];local value=item[2];emu.addMemoryCallback(function()if injected then action=value end end,emu.callbackType.exec,address,address)end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n]
 if action~=c.action then emu.stop(100000+n);return end
 for j,v in ipairs(c.rng)do if emu.read16(0xccf+(j-1)*2,mem)~=v then emu.stop(200000+n*8+j);return end end
 local at=0;for _,run in ipairs(c.expected)do for j=1,run[1]do if emu.read16(0x10200+at*2,mem)~=run[2]then emu.stop(1000000+n*12000+at);return end;at=at+1 end end
 for at,v in ipairs(c.growthRate)do if emu.read16(0x1ae62+(at-1)*2,mem)~=v then emu.stop(6000000+n*195+at);return end end
 for at=0,2999 do if emu.read(0x199e0+at,mem)~=tonumber(c.traffic:sub(at*2+1,at*2+2),16)then emu.stop(8000000+n*3000+at);return end end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'job-zone-fixtures.lua');fs.writeFileSync(file,script);const started=Date.now();const exitCode=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=45',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Job-zone reference exceeded55seconds'));},55000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});
console.log({cases:cases.length,actions:Object.fromEntries(['none','grow','decline'].map(a=>[a,cases.filter(c=>c.action===a).length])),exitCode,elapsedMs:Date.now()-started});
let failed;if(exitCode>=100000&&exitCode<200000)failed=exitCode-100000;if(exitCode>=200000&&exitCode<300000)failed=Math.floor((exitCode-200000)/8);if(exitCode>=1000000&&exitCode<6000000)failed=Math.floor((exitCode-1000000)/12000);if(exitCode>=6000000&&exitCode<8000000)failed=Math.floor((exitCode-6000000-1)/195);if(failed)console.log({case:failed,name:cases[failed-1]?.name,config:cases[failed-1]?.config,action:cases[failed-1]?.action});
if(exitCode===0)fs.writeFileSync(path.join(root,'research/reference-job-zones.json'),JSON.stringify({routines:['CODE_0392CE','CODE_03922F'],scope:'Full commercial/industrial workers: actual transport, gate, local score and grow/decline handlers. Action, full map, all traffic, growth-rate plane and final7RNG words. Controlled planes; no natural census/global scheduling claim.',romSHA256:romHash,mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode},null,2)+'\n');else process.exitCode=1;
