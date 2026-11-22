import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import{spawn}from'node:child_process';import{seedRomServicePlane,smoothRomServicePlane}from'../src/rom-services.js';import{romCrimeValue}from'../src/rom-crime.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=sha(fs.readFileSync(rom));if(hash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const cases=[];for(const strength of[0,500,1000])for(const powered of[false,true])for(const road of[false,true])for(const hq of[false,true]){const map=new Uint16Array(12000),id=hq?0x307:0x249;map[41*120+41]=id|(powered?0x8000:0);if(road)map[39*120+41]=0x32;const raw=seedRomServicePlane(map,strength,'police'),coverage=smoothRomServicePlane(raw),crime=Array.from({length:3000},(_,i)=>romCrimeValue(50,200,0,coverage[(Math.floor(i/60)>>2)*15+((i%60)>>2)]));cases.push({strength,powered,road,hq,id,raw:[...raw],coverage:[...coverage],crime});}
const lua=cases.map(c=>`{strength=${c.strength},word=${c.id|(c.powered?0x8000:0)},id=${c.id},road=${c.road},raw={${c.raw}},coverage={${c.coverage}},crime='${Buffer.from(c.crime).toString('hex')}'}`).join(',');
const script=`local cases={${lua}};local n=0;local injected=false;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 for i=0,11999 do emu.write16(0x10200+i*2,0,mem)end;emu.write16(0x10200+(41*120+41)*2,c.word,mem);if c.road then emu.write16(0x10200+(39*120+41)*2,0x32,mem)end
 for i=0,194 do emu.write16(0x1b2f4+i*2,0,mem)end
 for i=0,2999 do emu.write(0x16b00+i,50,mem);emu.write(0x18e28+i,200,mem);emu.write(0x176b8+i,0,mem)end
 emu.write16(0xb85,41+41*256,mem);emu.write16(0xb87,c.word,mem);emu.write16(0xb89,c.id,mem);emu.write16(0xbc7,c.strength,mem);emu.write16(0xc71,0,mem);emu.write16(0xb9b,1,mem);emu.write16(0xb51,1,mem)
 for i,v in ipairs({0x20,0x44,0xab,0x20,0x8e,0x9e,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()if not injected then return end;local c=cases[n];for i,v in ipairs(c.raw)do if emu.read16(0x1b2f4+(i-1)*2,mem)~=v then emu.stop(100000+n*200+i);return end end end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n]
 for i,v in ipairs(c.coverage)do if emu.read16(0x1b2f4+(i-1)*2,mem)~=v then emu.stop(200000+n*200+i);return end end
 for i=0,2999 do local expected=tonumber(c.crime:sub(i*2+1,i*2+2),16);if emu.read(0x176b8+i,mem)~=expected then emu.stop(300000+n*3000+i);return end end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031006,0x031006)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'police-crime-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=15',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},20000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log({cases:cases.length,exitCode:code});if(code===0)fs.writeFileSync(path.join(root,'research/reference-police-crime.json'),JSON.stringify({routines:['CODE_03AB44','CODE_039E8E','CODE_03A1CC'],valuesCompared:cases.length*3390,romSHA256:hash,mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
