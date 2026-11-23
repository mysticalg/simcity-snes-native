// Calls the unchanged ROM's complete commute + traffic routine, not a handler stub.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {traceZoneTransport} from '../src/rom-growth.js';
import {addRouteTraffic} from '../src/rom-traffic.js';
import {SIMULATION_SEED,nextSimulationWord} from '../src/rom-random.js';

const root=path.resolve(import.meta.dirname,'..');
const work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2');
const exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe');
const rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const romHash=sha(fs.readFileSync(rom));
if(romHash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const rle=map=>{const out=[];for(const n of map){if(out.at(-1)?.[1]===n)out.at(-1)[0]++;else out.push([1,n]);}return out;};
const cases=[];
for(const type of [5,6,7])for(const [seedIndex,seed]of [SIMULATION_SEED,Array(7).fill(0),Array(7).fill(65535)].entries()){
 const destination=type===5?0x144:0x99;
 const add=(name,layout,origin=[60,50],trafficInitial=0)=>{
  const map=new Uint16Array(12000),traffic=new Uint8Array(12000).fill(trafficInitial);
  layout((x,y,id)=>map[y*120+x]=id);
  const rng=[...seed];let randomCalls=0;
  const route=traceZoneTransport(map,...origin,type,()=>{randomCalls++;return nextSimulationWord(rng);});
  if(route.guarded)throw Error('Fixture hit browser guard');
  if(route.status===1)addRouteTraffic(map,traffic,route.path);
  const coarse=Buffer.from(Array.from({length:3000},(_,i)=>traffic[Math.floor(i/60)*240+(i%60)*2]));
  cases.push({name,type,origin,seed:[...seed],trafficInitial,mapRle:rle(map),status:route.status,path:route.path,rng,randomCalls,traffic:coarse.toString('hex')});
 };
 add('no transport',()=>{});
 add('pure wires rejected',set=>{for(let x=58;x<72;x++)set(x,48,0x62);set(70,47,destination);});
 add('isolated road',set=>set(60,48,0x32));
 for(const id of [0x32,0x72,0x3d,0x6d,0x7d])add('straight network '+id,set=>{for(let x=60;x<=80;x++)set(x,48,id|0x8000);set(72,47,destination);},[60,50],[0,198,230][seedIndex]);
 add('dead-end T',set=>{for(let x=55;x<=82;x++)set(x,48,0x32);for(let y=42;y<56;y++)set(67,y,0x32);set(80,47,destination);});
 add('long unreachable road',set=>{for(let x=60;x<=115;x++)set(x,48,0x32);set(110,47,destination);});
 add('loop without destination',set=>{for(let x=55;x<=69;x++){set(x,43,0x32);set(x,48,0x32);}for(let y=43;y<=48;y++){set(55,y,0x32);set(69,y,0x32);}});
 add('origin-zero traffic stack slot',set=>{for(let x=0;x<=15;x++)set(x,0,0x32);set(10,1,destination);},[1,2],230);
 add('right bottom border',set=>{for(let y=80;y<100;y++)set(119,y,0x72);set(118,85,destination);},[117,98]);
 add('power plant excluded as residential job destination',set=>{for(let x=60;x<=78;x++)set(x,48,0x32);set(65,47,0x27c);set(75,47,destination);});
}
const fixtures=cases.map(c=>`{runs={${c.mapRle.map(r=>'{'+r+'}')}},kind=${c.type-5},origin={${c.origin}},seed={${c.seed}},initial=${c.trafficInitial},status=${c.status&65535},path={${c.path.map(p=>'{'+[p.x,p.y]+'}')}},rng={${c.rng}},randomCalls=${c.randomCalls},traffic='${c.traffic}'}`).join(',');
const script=`local cases={${fixtures}};local n=0;local injected=false;local draws=0;local pops={};local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 local at=0;for _,run in ipairs(c.runs)do for j=1,run[1]do emu.write16(0x10200+at*2,run[2],mem);at=at+1 end end
 for i=0,2999 do emu.write(0x199e0+i,c.initial,mem)end
 for i=0xc13,0xc56 do emu.write(i,0,mem)end
 emu.write16(0xb85,c.origin[1]+c.origin[2]*256,mem)
 for i,v in ipairs(c.seed)do emu.write16(0xccf+(i-1)*2,v,mem)end
 for i,v in ipairs({0xa9,c.kind,0,0x20,0xa5,0xb1,0xea})do emu.write(0x1000+i-1,v,mem)end
 draws=0;pops={};emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()if injected then draws=draws+1 end end,emu.callbackType.exec,0x03907e,0x03907e)
emu.addMemoryCallback(function()if injected then local i=emu.read16(0xc13,mem);pops[#pops+1]={emu.read(0xc15+i,mem),emu.read(0xc34+i,mem)}end end,emu.callbackType.exec,0x03b258,0x03b258)
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n]
 if emu.getState()['cpu.a']%65536~=c.status then emu.stop(100000+n);return end
 if emu.read(0xb85,mem)~=c.origin[1]or emu.read(0xb86,mem)~=c.origin[2]then emu.stop(200000+n);return end
 if draws~=c.randomCalls then emu.stop(300000+n);return end
 for i,v in ipairs(c.rng)do if emu.read16(0xccf+(i-1)*2,mem)~=v then emu.stop(400000+n*8+i);return end end
 if #pops~=#c.path then emu.stop(500000+n);return end
 for i,p in ipairs(pops)do if p[1]~=c.path[i][1]or p[2]~=c.path[i][2]then emu.stop(600000+n*100+i);return end end
 for i=0,2999 do if emu.read(0x199e0+i,mem)~=tonumber(c.traffic:sub(i*2+1,i*2+2),16)then emu.stop(1000000+n*3000+i);return end end
 local at=0;for _,run in ipairs(c.runs)do for j=1,run[1]do if emu.read16(0x10200+at*2,mem)~=run[2]then emu.stop(2000000+n*12000+at);return end;at=at+1 end end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031006,0x031006)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'transport-fixtures.lua');fs.writeFileSync(file,script);
const started=Date.now();const exitCode=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=45',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Transport reference exceeded55seconds'));},55000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});
console.log({cases:cases.length,exitCode,elapsedMs:Date.now()-started});
if(exitCode===0)fs.writeFileSync(path.join(root,'research/reference-transport.json'),JSON.stringify({routines:['CODE_03B1A5','CODE_03B26B','CODE_03B2D6','CODE_03B1F5'],scope:'Full original commute and traffic call; status, restored coordinates, random call count, final seven RNG words, every popped traffic coordinate, all3000 traffic bytes and unchanged12000 map words. Zero-initialized scratch slot0. Controlled fixtures, not natural full-city timing.',romSHA256:romHash,mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode},null,2)+'\n');else process.exitCode=1;
