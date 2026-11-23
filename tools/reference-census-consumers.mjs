import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';
import {romFacilityDemand} from '../src/rom-facilities.js';import {romCityProblems} from '../src/rom-evaluation.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const hash=sha(fs.readFileSync(rom));if(hash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const cases=[],fields={pollution:new Uint8Array(12000),traffic:new Uint8Array(12000),landValues:new Uint8Array(12000)};
for(const residential of [0,1,255,256,257,32767,65280,65535])for(const counts of [[0,0],[1,1],[127,128],[254,255],[256,65535]])cases.push({kind:'quota',rci:[residential,0,0],counts,expected:romFacilityDemand(residential,counts)});
for(const rci of [[0,0,0],[200,0,0],[80,10,0],[81,10,0],[100,10,0],[160,10,0],[200,10,0],[65535,8191,0],[65535,8192,0],[1,8192,0],[65535,65535,1],[65535,65535,65535]])cases.push({kind:'unemployment',rci,counts:[0,0],expected:[romCityProblems({...fields,rci})[5]]});
for(const fires of [0,1,50,51,52,12000,13107,13108,16384,26214,32768,48000,65535])cases.push({kind:'fire',rci:[0,0,0],counts:[0,0],fires,expected:[romCityProblems({...fields,fires})[6]]});
const lua=cases.map(c=>`{kind='${c.kind}',target=${c.kind==='quota'?0x1010:c.kind==='unemployment'?0xb6bd:0xb6f7},rci={${c.rci}},counts={${c.counts}},fires=${c.fires||0},expected={${c.expected.map(n=>n&65535)}}}`).join(',');
const script=`local cases={${lua}};local n=0;local injected=false;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.a']=0;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 emu.write16(0xb8b,c.rci[1],mem);emu.write16(0xb93,c.rci[2],mem);emu.write16(0xb8f,c.rci[3],mem);emu.write16(0xe03,c.counts[1],mem);emu.write16(0xe05,c.counts[2],mem);emu.write16(0xe01,c.fires,mem)
 for i,v in ipairs({0x20,c.target%256,math.floor(c.target/256),0xea})do emu.write(0x1000+i-1,v,mem)end
 -- Quota tail normally follows its caller's PHD. Keep the same stack layout:
 -- JSR to a WRAM trampoline, PHD inside it, then JMP to the original tail.
 for i,v in ipairs({0x0b,0x4c,0xe8,0x8c})do emu.write(0x1010+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n];local actual=c.kind=='quota' and {emu.read16(0xb97,mem),emu.read16(0xb99,mem)} or {emu.getState()['cpu.a']%65536}
 for i,v in ipairs(actual)do if v~=c.expected[i]then emu.stop(100000+n*4+i);return end end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'census-consumer-fixtures.lua');fs.writeFileSync(file,script);
const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=10',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},15000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});
console.log(JSON.stringify({cases:cases.length,exitCode:code}));if(code===0)fs.writeFileSync(path.join(root,'research/reference-census-consumers.json'),JSON.stringify({routines:['CODE_038CE8..038D24','CODE_03B6BD','CODE_03B6F7'],fixture:{directPage:0x1800,dataBank:3,stack:0x1eff,status:4,interrupts:false},romSHA256:hash,mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
