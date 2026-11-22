import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';import {romAssessedValue} from '../src/rom-evaluation.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');const hash=sha(fs.readFileSync(rom));if(hash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const fields=[['roads',0xe15],['rails',0xe17],['facilityA',0xe03],['police',0xe07],['fire',0xe09],['stadiums',0xe0b],['coal',0xe0d],['seaports',0xe11],['nuclear',0xe0f],['airports',0xe13]],cases=[];const add=input=>{const counts=Object.fromEntries(fields.map(([key])=>[key,input[key]||0]));cases.push({counts,expected:romAssessedValue(counts)});};add({});for(const [key]of fields)add({[key]:1});add(Object.fromEntries(fields.map(([key])=>[key,65535])));let seed=0x58a3;for(let n=0;n<32;n++)add(Object.fromEntries(fields.map(([key])=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return[key,seed&65535];})));
const lua=cases.map(c=>`{counts={${fields.map(([key])=>c.counts[key])}},expected={${c.expected&65535},${c.expected>>>16}}}`).join(',');
const script=`local cases={${lua}};local addresses={${fields.map(f=>f[1])}};local n=0;local injected=false;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 for i,address in ipairs(addresses)do emu.write16(address,c.counts[i],mem)end;for i,v in ipairs({0x20,0xaa,0xb4,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n];if emu.read16(0xde7,mem)~=c.expected[1]or emu.read16(0xde9,mem)~=c.expected[2]then emu.stop(100000+n);return end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'valuation-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=10',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},15000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log(JSON.stringify({cases:cases.length,exitCode:code}));if(code===0)fs.writeFileSync(path.join(root,'research/reference-valuation.json'),JSON.stringify({routine:'CODE_03B4AA',romSHA256:hash,mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
