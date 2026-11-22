import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import{spawn}from'node:child_process';import{createRomTornado,startRomTornado}from'../src/rom-tornado.js';import{SIMULATION_SEED,nextSimulationWord,boundSimulationWord}from'../src/rom-random.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=sha(fs.readFileSync(rom));if(hash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');const fields=[['x',0xa59],['y',0xa57],['targetX',0xaa5],['targetY',0xaa3],['offsetX',0xa75],['offsetY',0xa73]],cases=[];let seed=77;const seeds=[SIMULATION_SEED,Array(7).fill(0),...Array.from({length:10},()=>Array.from({length:7},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed>>>16;}))];for(const active of[false,true])for(const input of seeds){const rng=[...input],state={...createRomTornado(),active,x:60,y:50,targetX:20,targetY:40,offsetX:3,offsetY:6};startRomTornado(state,max=>boundSimulationWord(nextSimulationWord(rng),max));cases.push({active,seed:input,expected:state,rng});}
const lua=cases.map(c=>`{active=${c.active},seed={${c.seed}},rng={${c.rng}},expected={${fields.map(([key])=>c.expected[key])}},stage=${c.expected.initializing?32768:1}}`).join(',');
const script=`local cases={${lua}};local fields={${fields.map(f=>f[1])}};local injected=false;local n=0;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 for i,v in ipairs(c.seed)do emu.write16(0xccf+(i-1)*2,v,mem)end
 for i,v in ipairs({60,50,20,40,3,6})do emu.write16(fields[i],v,mem)end;emu.write16(0xa8b,c.active and 1 or 0,mem)
 for i,v in ipairs({0x20,0xdb,0xb9,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n]
 for i,address in ipairs(fields)do if emu.read16(address,mem)~=c.expected[i]then emu.stop(100000+n*8+i);return end end
 if emu.read16(0xa8b,mem)~=c.stage then emu.stop(200000+n);return end
 for i,v in ipairs(c.rng)do if emu.read16(0xccf+(i-1)*2,mem)~=v then emu.stop(300000+n*8+i);return end end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'tornado-spawn-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=15',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},20000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log({cases:cases.length,exitCode:code});if(code===0)fs.writeFileSync(path.join(root,'research/reference-tornado-spawn.json'),JSON.stringify({routine:'CODE_03B9DB',romSHA256:hash,mesenSHA256:sha(fs.readFileSync(exe)),valuesCompared:cases.length*14,cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
