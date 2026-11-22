import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';import {romCityScore} from '../src/rom-evaluation.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');const hash=sha(fs.readFileSync(rom));if(hash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const cases=[],add=input=>cases.push({...input,expected:romCityScore(input)}),base={previous:500,problems:[0,0,0,70,0,0,0],caps:[false,false,false],transport:32,police:1000,fire:1000,demand:[0,0,0]};add(base);
for(const problems of [Array(7).fill(0),Array(7).fill(255),Array(7).fill(65535)])for(const transport of [0,31,32])add({...base,problems,transport});for(const fire of [0,999,1000,4095,4096])add({...base,fire});for(const value of [-1001,-1000,-999,-2000,1500])add({...base,demand:[value,value,value]});
let seed=0x5319;const random=max=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%max;};for(let i=0;i<64;i++)add({previous:random(1001),problems:Array.from({length:7},()=>random(301)),caps:Array.from({length:3},()=>Boolean(random(2))),transport:random(41),police:random(1001),fire:random(4097),demand:Array.from({length:3},()=>random(4001)-2000)});
const lua=cases.map(c=>`{previous=${c.previous},problems={${c.problems}},caps={${c.caps.map(Number)}},transport=${c.transport},police=${c.police},fire=${c.fire},demand={${c.demand.map(v=>v&65535)}},expected={${c.expected.score},${c.expected.change&65535}}}`).join(',');
const script=`local cases={${lua}};local n=0;local injected=false;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 emu.write16(0xded,c.previous,mem);for i,v in ipairs(c.problems)do emu.write16(0xbd1+(i-1)*2,v,mem)end
 for i,v in ipairs(c.caps)do emu.write16(0xbb3+(i-1)*2,v,mem)end;for i,v in ipairs(c.demand)do emu.write16(0xbad+(i-1)*2,v,mem)end
 emu.write16(0xbc5,c.transport,mem);emu.write16(0xbc7,c.police,mem);emu.write16(0xbc9,c.fire,mem)
 for i,v in ipairs({0x20,0x08,0xb7,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n];if emu.read16(0xded,mem)~=c.expected[1]then emu.stop(100000+n*2);return end;if emu.read16(0xdef,mem)~=c.expected[2]then emu.stop(100001+n*2);return end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'evaluation-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=10',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},15000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log(JSON.stringify({cases:cases.length,exitCode:code}));if(code===0)fs.writeFileSync(path.join(root,'research/reference-evaluation.json'),JSON.stringify({routine:'CODE_03B708',romSHA256:hash,mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
