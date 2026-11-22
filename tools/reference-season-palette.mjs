import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import{spawn}from'node:child_process';import{romSeasonPalette}from'../src/rom-render.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=sha(fs.readFileSync(rom));if(hash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');const palettes=Array.from({length:4},(_,i)=>fs.readFileSync(path.join(root,`assets/palettes/DATA_058${i}00.bin`))),cases=[];for(let source=0;source<4;source++)for(const progress of[0,1,5,64,127,128,192,250,254,255])cases.push({source,progress,expected:[...romSeasonPalette(palettes,source,progress)]});
const lua=cases.map(c=>`{source=${c.source},progress=${c.progress},expected='${Buffer.from(c.expected).toString('hex')}'}`).join(',');
const script=`local cases={${lua}};local n=0;local injected=false;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=0;s['cpu.d']=0;s['cpu.dbr']=0;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 for i=0,255 do emu.write(0x2440+i,emu.read(0x058000+i,emu.memType.snesMemory),mem)end
 emu.write16(0xb4b,1,mem);emu.write16(0xb4d,c.source,mem);emu.write16(0xb4f,c.progress,mem);emu.write(0x3a,0,mem);emu.write(0xb3,0,mem)
 for i,v in ipairs({0x20,0xd9,0x94,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()if not injected then return end;local s=emu.getState();local sp=s['cpu.sp'];s['cpu.pc']=emu.read16(sp+1,mem)+1;s['cpu.sp']=sp+2;emu.setState(s)end,emu.callbackType.exec,0x008da6,0x008da6)
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n]
 for i=0,255 do if emu.read(0x2440+i,mem)~=tonumber(c.expected:sub(i*2+1,i*2+2),16)then emu.stop(100000+n*256+i);return end end
 if emu.read16(0xb4f,mem)~=c.progress+5 then emu.stop(200000+n);return end
 if emu.read16(0xb4b,mem)~=(c.progress+5>=256 and 0 or 1)then emu.stop(300000+n);return end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x001003,0x001003)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'season-palette-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=15',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},20000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log({cases:cases.length,exitCode:code});if(code===0)fs.writeFileSync(path.join(root,'research/reference-season-palette.json'),JSON.stringify({routine:'CODE_0094D9',scope:'Palette mirror and progress/active state; UI yield008DA6 intercepted',romSHA256:hash,mesenSHA256:sha(fs.readFileSync(exe)),valuesCompared:cases.length*258,cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
