import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import{spawn}from'node:child_process';import{planOriginalTornado}from'../src/rom-sfx.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=sha(fs.readFileSync(rom));if(hash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');const aram=fs.readFileSync(path.join(root,'assets/audio/aram.bin')),voice=planOriginalTornado(aram).voices[0],cases=voice.slides.map(s=>({...s,points:voice.pitchSteps.filter(p=>p.tick>=s.tick&&p.tick<s.tick+s.ticks)}));
const lua=cases.map(c=>`{from=${c.fromQ8},target=${c.target},ticks=${c.ticks},step=${c.stepQ8&65535},q8={${c.points.map(p=>p.noteQ8)}},pitch={${c.points.map(p=>p.pitch)}}}`).join(',');
const script=`local cases={${lua}};local bytes='${aram.toString('hex')}';local n=0;local point=0;local phase=0;local injected=false;local main=false;local reg=0;local low=0;local high=0;local mem=emu.memType.spcRam
local function run(target,a)
 local s=emu.getState();s['spc.pc']=0x500;s['spc.a']=a or 0;s['spc.x']=14;s['spc.y']=0;s['spc.sp']=0xef;s['spc.ps']=0;emu.setState(s)
 emu.write(0x500,0x3f,mem);emu.write(0x501,target%256,mem);emu.write(0x502,math.floor(target/256),mem);emu.write(0x503,0,mem)
end
local function setup(index)
 local c=cases[index];phase=0;point=0;emu.write16(0x36e,c.from,mem);emu.write(0xae,c.ticks,mem);emu.write(0xaf,0,mem);emu.write(0x44,14,mem);emu.write(0x12,0,mem);emu.write16(0x0e,0,mem);emu.write16(0x22e,512,mem);run(0x17d5,c.target+128)
end
emu.addMemoryCallback(function()if main then return end;main=true;local s=emu.getState();s['cpu.pc']=0x1000;s['cpu.k']=0;s['cpu.dbr']=0;s['cpu.emulationMode']=false;s['cpu.ps']=4;emu.setState(s);emu.write(0x1000,0x80,emu.memType.snesWorkRam);emu.write(0x1001,0xfe,emu.memType.snesWorkRam);emu.write(0x4200,0,emu.memType.snesMemory)end,emu.callbackType.exec,0,0xffffff)
emu.addMemoryCallback(function(address,value)if address==0xf2 then reg=value elseif reg==0x72 then low=value elseif reg==0x73 then high=value end end,emu.callbackType.write,0xf2,0xf3,emu.cpuType.spc,emu.memType.spcMemory)
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n]
 if phase==0 then if emu.read16(0x37e,mem)~=c.step then emu.stop(100000+n);return end;phase=1;run(0x0cb0);return end
 point=point+1;if emu.read16(0x36e,mem)~=c.q8[point]then emu.stop(200000+n*1000+point);return end
 if low+high*256~=c.pitch[point]then emu.stop(300000+n*1000+point);return end
 if point==c.ticks then if n==#cases then emu.stop(0);return end;n=n+1;setup(n)else run(0x0cb0)end
end,emu.callbackType.exec,0x0503,0x0503,emu.cpuType.spc,emu.memType.spcMemory)
emu.addMemoryCallback(function()if injected then return end;for i=0,65535 do emu.write(i,tonumber(bytes:sub(i*2+1,i*2+2),16),mem)end;injected=true;n=1;setup(n)end,emu.callbackType.exec,0,0xffff,emu.cpuType.spc,emu.memType.spcMemory)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'spc-tornado-slides.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=15',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},20000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log({cases:cases.length,points:cases.reduce((n,c)=>n+c.points.length,0),exitCode:code});if(code===0)fs.writeFileSync(path.join(root,'research/reference-spc-tornado-slides.json'),JSON.stringify({routines:['SPC_CODE_17D5','SPC_CODE_0CB0','SPC_CODE_0970'],scope:'Original SPC instructions; Q8 note RAM and actual DSP pitch writes per slide tick',romSHA256:hash,aramSHA256:sha(aram),mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
