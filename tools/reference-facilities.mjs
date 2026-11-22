import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';import {placeRomFacility,updateRomFacility} from '../src/rom-facilities.js';import {SIMULATION_SEED,nextSimulationWord,boundSimulationWord} from '../src/rom-random.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');const hash=sha(fs.readFileSync(rom));if(hash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const indices=Array.from({length:9},(_,n)=>(49+Math.floor(n/3))*120+59+n%3),cases=[];
const add=(kind,id,demand,seed,baseStep,repairPhase,blocked)=>{const map=new Uint16Array(12000);indices.forEach((i,n)=>map[i]=(id-4+n)|(n%2?0:32768)|(n===8?16384:0));if(kind==='update'){map[indices[0]]=0;map[indices[8]]=0;}if(blocked)map[indices[1]]=0x7f;const input=indices.map(i=>map[i]),flags=[...demand],state=[...seed];if(kind==='spawn')placeRomFacility(map,60,50,flags);else updateRomFacility(map,60,50,flags,max=>boundSimulationWord(nextSimulationWord(state),max),{baseStep,repairPhase});cases.push({kind,id,demand,seed:[...seed],baseStep,repairPhase,blocked,input,expected:indices.map(i=>map[i]),flags,rng:state});};
for(const id of [0x129,0x132])for(const value of [-1,0,1])for(const seed of [SIMULATION_SEED,Array(7).fill(0)])for(const [baseStep,repairPhase]of [[0,0],[1,0],[0,1]])for(const blocked of [false,true])add('update',id,id===0x129?[value,0]:[0,value],seed,baseStep,repairPhase,blocked);
for(const demand of [[-1,0],[0,1],[1,1],[0,0]])for(const blocked of [false,true])add('spawn',0x84,demand,SIMULATION_SEED,0,0,blocked);
const lua=cases.map(c=>`{target=${c.kind==='spawn'?0x9449:c.id===0x129?0x91df:0x9207},input={${c.input}},demand={${c.demand.map(v=>v&65535)}},seed={${c.seed}},baseStep=${c.baseStep},repairPhase=${c.repairPhase},expected={${c.expected}},flags={${c.flags.map(v=>v&65535)}},rng={${c.rng}}}`).join(',');
const script=`local cases={${lua}};local indices={${indices}};local n=0;local injected=false;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 for i,v in ipairs(c.input)do emu.write16(0x10200+indices[i]*2,v,mem)end
 emu.write16(0xb85,60+50*256,mem);emu.write16(0xb87,c.input[5],mem);emu.write16(0xb89,c.input[5]%1024,mem);emu.write16(0xb97,c.demand[1],mem);emu.write16(0xb99,c.demand[2],mem);emu.write16(0xb51,c.baseStep,mem);emu.write16(0xb9b,c.repairPhase,mem);emu.write16(0x1800,6060*2+2,mem);emu.write16(0xe03,0,mem);emu.write16(0xe05,0,mem)
 for i,v in ipairs(c.seed)do emu.write16(0xccf+(i-1)*2,v,mem)end
 for i,v in ipairs({0x20,c.target%256,math.floor(c.target/256),0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n]
 for i,v in ipairs(c.expected)do if emu.read16(0x10200+indices[i]*2,mem)~=v then emu.stop(100000+n*32+i);return end end
 if emu.read16(0xb97,mem)~=c.flags[1]or emu.read16(0xb99,mem)~=c.flags[2]then emu.stop(200000+n);return end
 for i,v in ipairs(c.rng)do if emu.read16(0xccf+(i-1)*2,mem)~=v then emu.stop(300000+n*8+i);return end end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'facility-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=10',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},15000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log(JSON.stringify({cases:cases.length,exitCode:code}));if(code===0)fs.writeFileSync(path.join(root,'research/reference-facilities.json'),JSON.stringify({routines:['CODE_039449','CODE_0391DF','CODE_039207'],indices,valuesCompared:cases.length*18,romSHA256:hash,mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
