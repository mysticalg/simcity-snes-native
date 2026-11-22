import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';import {selectRomRandomDisaster} from '../src/rom-random-disaster.js';import {SIMULATION_SEED,nextSimulationWord,boundSimulationWord} from '../src/rom-random.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=sha(fs.readFileSync(rom));if(hash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const cases=[];function add(input,seed){const state=[...seed],event=selectRomRandomDisaster(input,max=>boundSimulationWord(nextSimulationWord(state),max),()=>nextSimulationWord(state));cases.push({input,seed:[...seed],event,rng:state});}
let seed=0x32fe;for(let difficulty=0;difficulty<3;difficulty++){const found=new Map();for(let n=0;n<500000&&found.size<8;n++){const state=Array.from({length:7},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed>>>16;}),probe=[...state];if(boundSimulationWord(nextSimulationWord(probe),[4800,2400,1200][difficulty])===0){const kind=nextSimulationWord(probe)&7;if(!found.has(kind))found.set(kind,state);}}if(found.size!==8)throw Error('Missing selector seed');for(const state of found.values())for(const pollution of [79,80])add({difficulty,pollution},state);add({difficulty,pollution:255},SIMULATION_SEED);}
for(const input of [{practice:true},{disabled:true},{messagePending:true},{messagePending:true,messageBypass:true}])add({difficulty:0,pollution:100,...input},Array(7).fill(0));
const ids={Fire:1,Flood:2,Tornado:3,Earthquake:4,Monster:5},lua=cases.map(c=>`{difficulty=${c.input.difficulty},pollution=${c.input.pollution},practice=${!!c.input.practice},disabled=${!!c.input.disabled},pending=${!!c.input.messagePending},bypass=${!!c.input.messageBypass},seed={${c.seed}},rng={${c.rng}},event=${ids[c.event]||0}}`).join(',');
const script=`local cases={${lua}};local n=0;local injected=false;local event=0;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];event=0;local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 for i,v in ipairs(c.seed)do emu.write16(0xccf+(i-1)*2,v,mem)end
 emu.write16(0x425,c.disabled and 1 or 0,mem);emu.write16(0x3e,c.practice and 1 or 2,mem);emu.write16(0xb57,c.difficulty,mem);emu.write16(0xc07,c.pollution,mem);emu.write16(0x395,c.pending and 1 or 0,mem);emu.write16(0xd7,c.bypass and 1 or 0,mem);emu.write16(0xab5,0,mem);emu.write16(0x197,0,mem);emu.write16(0x199,0,mem)
 for i,v in ipairs({0x20,0x4b,0xb8,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
for address,id in pairs({[0x03bb6a]=1,[0x03bc0b]=2,[0x03b9db]=3,[0x03baf5]=4,[0x03ba47]=5})do
 emu.addMemoryCallback(function()if not injected then return end;event=id;local s=emu.getState();local stack=s['cpu.sp'];s['cpu.pc']=emu.read16(stack+1,mem)+1;s['cpu.sp']=stack+2;emu.setState(s)end,emu.callbackType.exec,address,address)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n];if event~=c.event then emu.stop(100000+n*8+event);return end
 for i,v in ipairs(c.rng)do if emu.read16(0xccf+(i-1)*2,mem)~=v then emu.stop(200000+n*8+i);return end end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'random-disaster-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=15',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},20000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log({cases:cases.length,exitCode:code});if(code===0)fs.writeFileSync(path.join(root,'research/reference-random-disaster.json'),JSON.stringify({routine:'CODE_03B84B',valuesCompared:cases.length*8,scope:'Selection and final RNG only; selected disaster handlers intercepted at entry and returned without effects',romSHA256:hash,mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
