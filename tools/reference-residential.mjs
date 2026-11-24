import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';
import {City} from '../src/simulation.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),romHash=sha(fs.readFileSync(rom));
if(romHash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const build=JSON.parse(fs.readFileSync(path.join(root,'assets/tables/build.json'))),flags=JSON.parse(fs.readFileSync(path.join(root,'assets/tables/city.json'))).flags,c=new City(new Uint16Array(12000),build,flags,{nativeGrowthRules:true}),x=60,y=50,i=y*120+x;
const rle=map=>{const out=[];for(const n of map){if(out.at(-1)?.[1]===n)out.at(-1)[0]++;else out.push([1,n]);}return out;};
const configs=[
 {name:'empty homes',tile:0x84,homes:0},{name:'one home',tile:0x84,homes:1},{name:'house preference coordinate',tile:0x84,homes:0,scoreObstacle:true},{name:'full homes low density high value',tile:0x84,homes:8,density:64},
 {name:'full homes high density low value',tile:0x84,homes:8,density:65,land:64},{name:'full homes high density',tile:0x84,homes:8,density:65},
 {name:'first apartments',tile:0x99},{name:'second apartments',tile:0xa2},{name:'third apartments',tile:0xab},
 {name:'top apartments',tile:0x120},{name:'horizontal merge',tile:0x120,merge:'horizontal'},{name:'vertical merge',tile:0x120,merge:'vertical'},
 {name:'merged left',tile:0x37a},{name:'merged right',tile:0x383},{name:'unpowered apartments',tile:0x99,powered:false},
 {name:'polluted apartment',tile:0x99,pollution:129},{name:'no transport',tile:0x99,network:'none'},
 {name:'no destination',tile:0x99,network:'dead'},{name:'blocked footprint',tile:0xa2,blocked:true},
 {name:'marked small houses',tile:0x84,homes:8,marked:true,density:65},
 {name:'special facilities',tile:0x84,homes:0,quota:[1,1]}
];
const cases=[];let seed=0xc570123;
for(const input of configs)for(const demand of [-2000,2000]){
 const config={land:200,pollution:0,density:100,powered:true,network:'jobs',quota:[0,0],...input,demand};const counts={};
 for(let attempt=0;attempt<160;attempt++){
  const rng=Array.from({length:7},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed&65535;});
  const map=new Uint16Array(12000),power=config.powered?32768:0;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)map[(y+dy)*120+x+dx]=(config.tile-4+(dy+1)*3+dx+1)|power;
  if(config.tile===0x84){let n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy)map[(y+dy)*120+x+dx]=n++<(config.homes||0)?0x89|(config.marked?32768:0):0x80+(dy+1)*3+dx+1;map[i]=config.tile|power;}
  if(config.merge){const ox=config.merge==='horizontal'?3:0,oy=config.merge==='vertical'?3:0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)map[(y+oy+dy)*120+x+ox+dx]=(config.tile-4+(dy+1)*3+dx+1)|power;}
  if(config.network!=='none'){for(let px=59;px<78;px++)map[(y-2)*120+px]=0x32;if(config.network==='jobs')map[(y-3)*120+74]=0x144;}
  if(config.blocked)map[i+1]=0x7f;
  if(config.scoreObstacle){map[58*120+59]=0x89;map[59*120+60]=0x89;}
  c.map=map.slice();c.simulationRng=[...rng];c.demand=[demand,0,0];c.facilityDemand=[...config.quota];c.landValue.fill(config.land);c.pollution.fill(config.pollution);c.density.fill(config.density);c.traffic.fill(0);c.growthRate.fill(0);
  const decision=c.updateResidentialTile({x,y,i,id:config.tile,type:5});
  const key=decision.action==='none'?'none':decision.action;if((counts[key]||0)>=2)continue;counts[key]=(counts[key]||0)+1;
  cases.push({name:config.name,config,seed:rng,input:rle(map),expected:rle(c.map),rng:[...c.simulationRng],quota:[...c.facilityDemand],action:decision.action,reason:decision.reason,growthRate:[...c.growthRate],traffic:Buffer.from(Array.from({length:3000},(_,at)=>c.traffic[Math.floor(at/60)*240+(at%60)*2])).toString('hex')});
 }
}
const fixtures=cases.map(c=>`{runs={${c.input.map(r=>'{'+r+'}')}},expected={${c.expected.map(r=>'{'+r+'}')}},seed={${c.seed}},rng={${c.rng}},quota={${c.config.quota}},expectedQuota={${c.quota}},tile=${c.config.tile},powered=${c.config.powered?32768:0},land=${c.config.land},pollution=${c.config.pollution},density=${c.config.density},demand=${c.config.demand&65535},action='${c.action}',growthRate={${c.growthRate.map(v=>v&65535)}},traffic='${c.traffic}'}`).join(',');
const script=`local cases={${fixtures}};local n=0;local injected=false;local action='none';local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 local at=0;for _,run in ipairs(c.runs)do for j=1,run[1]do emu.write16(0x10200+at*2,run[2],mem);at=at+1 end end
 for at=0,2999 do emu.write(0x16b00+at,c.land,mem);emu.write(0x18270+at,c.pollution,mem);emu.write(0x18e28+at,c.density,mem);emu.write(0x199e0+at,0,mem)end
 for at=0xc13,0xc56 do emu.write(at,0,mem)end
 for at=0,194 do emu.write16(0x1ae62+at*2,0,mem)end
 emu.write16(0xb85,60+50*256,mem);emu.write16(0xb87,c.tile+c.powered,mem);emu.write16(0xb89,c.tile,mem);emu.write16(0xb49,${i*2},mem);emu.write16(0xbad,c.demand,mem)
 for at=0xb8b,0xb94 do emu.write(at,0,mem)end
 emu.write16(0xb97,c.quota[1],mem);emu.write16(0xb99,c.quota[2],mem)
 for j,v in ipairs(c.seed)do emu.write16(0xccf+(j-1)*2,v,mem)end
 for j,v in ipairs({0x20,0x7a,0x93,0xea})do emu.write(0x1000+j-1,v,mem)end
 action='none';emu.write(0x4200,0,emu.memType.snesMemory)
end
for _,item in ipairs({{0x039495,'grow'},{0x039659,'decline'},{0x039449,'special'}})do local address=item[1];local value=item[2];emu.addMemoryCallback(function()if injected then action=value end end,emu.callbackType.exec,address,address)end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n]
 if action~=c.action then emu.stop(100000+n);return end
 for j,v in ipairs(c.rng)do if emu.read16(0xccf+(j-1)*2,mem)~=v then emu.stop(200000+n*8+j);return end end
 local at=0;for _,run in ipairs(c.expected)do for j=1,run[1]do if emu.read16(0x10200+at*2,mem)~=run[2]then emu.stop(1000000+n*12000+at);return end;at=at+1 end end
 for j,v in ipairs(c.expectedQuota)do if emu.read16(0xb97+(j-1)*2,mem)~=v then emu.stop(300000+n);return end end
 for at,v in ipairs(c.growthRate)do if emu.read16(0x1ae62+(at-1)*2,mem)~=v then emu.stop(6000000+n*195+at);return end end
 for at=0,2999 do if emu.read(0x199e0+at,mem)~=tonumber(c.traffic:sub(at*2+1,at*2+2),16)then emu.stop(5000000+n*3000+at);return end end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'residential-fixtures.lua');fs.writeFileSync(file,script);
const started=Date.now();const exitCode=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=45',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Residential reference exceeded55seconds'));},55000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});
console.log({cases:cases.length,actions:Object.fromEntries(['none','grow','decline','special'].map(a=>[a,cases.filter(c=>c.action===a).length])),exitCode,elapsedMs:Date.now()-started});
if(exitCode>=1000000&&exitCode<5000000){const n=Math.floor((exitCode-1000000)/12000);console.log({case:n,cell:(exitCode-1000000)%12000,fixture:cases[n-1]?.name,config:cases[n-1]?.config,action:cases[n-1]?.action});}
if(exitCode>=200000&&exitCode<300000){const n=Math.floor((exitCode-200000)/8);console.log({rngCase:n,fixture:cases[n-1]?.name,config:cases[n-1]?.config,action:cases[n-1]?.action});}
if(exitCode===0)fs.writeFileSync(path.join(root,'research/reference-residential.json'),JSON.stringify({routine:'CODE_03937A',scope:'Full residential update, including transport/random gate, local score, selected grow/decline/special branch, full map, final RNG, traffic, growth-rate plane and facility quotas. Controlled fields; no census/natural timing claim.',romSHA256:romHash,mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode},null,2)+'\n');else process.exitCode=1;
