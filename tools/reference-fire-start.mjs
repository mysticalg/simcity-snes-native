import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';import {startRomFire} from '../src/rom-disasters.js';import {SIMULATION_SEED,nextSimulationWord,boundSimulationWord} from '../src/rom-random.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=sha(fs.readFileSync(rom));if(hash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const flags=JSON.parse(fs.readFileSync(path.join(root,'assets/tables/city.json'))).flags,cases=[];
for(const randomDisaster of [false,true])for(const id of [0,0x14,0x30,0x88,0x99,0x364,0x8014])for(const seed of [SIMULATION_SEED,Array(7).fill(0)]){const map=new Uint16Array(12000).fill(id),state=[...seed],expected=startRomFire(map,flags,max=>boundSimulationWord(nextSimulationWord(state),max),{randomDisaster});cases.push({randomDisaster,id,seed,expected,rng:state});}
const lua=cases.map(c=>`{target=${c.randomDisaster?0xbb6a:0xbbb9},id=${c.id},seed={${c.seed}},rng={${c.rng}},changed=${c.expected.started?c.expected.y*120+c.expected.x:-1}}`).join(',');
const script=`local cases={${lua}};local n=0;local injected=false;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 for i=0,11999 do emu.write16(0x10200+i*2,c.id,mem)end
 for i,v in ipairs(c.seed)do emu.write16(0xccf+(i-1)*2,v,mem)end
 emu.write16(0x3fe,0,mem);emu.write16(0xc9f,0,mem)
 for i,v in ipairs({0x20,c.target%256,math.floor(c.target/256),0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n]
 for i=0,11999 do local expected=c.id;if i==c.changed then expected=0x7f end;if emu.read16(0x10200+i*2,mem)~=expected then emu.stop(100000+n);return end end
 for i,v in ipairs(c.rng)do if emu.read16(0xccf+(i-1)*2,mem)~=v then emu.stop(200000+n*8+i);return end end
 if emu.read16(0xc9f,mem)~=(c.changed>=0 and 1 or 0)then emu.stop(300000+n);return end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'fire-start-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=15',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},20000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log({cases:cases.length,exitCode:code});if(code===0)fs.writeFileSync(path.join(root,'research/reference-fire-start.json'),JSON.stringify({routines:['CODE_03BBB9','CODE_03BB6A','CODE_03BC9F'],valuesCompared:cases.length*12008,romSHA256:hash,mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
