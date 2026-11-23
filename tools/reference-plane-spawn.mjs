import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import{spawn}from'node:child_process';import{createRomPlane,spawnRomPlane}from'../src/rom-plane.js';import{SIMULATION_SEED}from'../src/rom-random.js';const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=path.join(work,'app/Mesen.exe'),rom=path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=sha(fs.readFileSync(rom));if(hash!==JSON.parse(fs.readFileSync('assets/manifest.json')).romSHA256)throw Error('Wrong ROM');const fields=[['x',0xa61],['y',0xa5f],['offsetX',0xa7d],['offsetY',0xa7b],['direction',0xa9f],['targetX',0xaad],['targetY',0xaab],['targetDirection',0xaa1],['turn',0xab3],['turnPhase',0xad9],['taxi',0xacb]],cases=[];for(const x of[10,60,110])for(const y of[10,50,90])for(const offsetY of[0,7])for(const taxi of[0,2]){const state={...createRomPlane(),x:40,y:30,offsetX:3,offsetY,taxi},before={...state};spawnRomPlane(state,x,y);cases.push({active:false,target:{x,y},before,seed:[...SIMULATION_SEED],rng:[...SIMULATION_SEED],expected:state});}const lua=cases.map(c=>`{active=false,input={${fields.map(([key])=>c.before[key])}},target={${c.target.x},${c.target.y}},seed={${c.seed}},rng={${c.rng}},expected={${fields.map(([key])=>c.expected[key])}},stage=1}`).join(',');
const script=`local cases={${lua}};local fields={${fields.map(f=>f[1])}};local injected=false;local n=0;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 for i,v in ipairs(c.seed)do emu.write16(0xccf+(i-1)*2,v,mem)end
 emu.write16(0xb85,c.target[1]+c.target[2]*256,mem);for i,v in ipairs(c.input)do emu.write16(fields[i],v,mem)end;emu.write16(0xa8d,c.active and 1 or 0,mem)
 for i,v in ipairs({0x20,0xfc,0xab,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n]
 for i,address in ipairs(fields)do if emu.read16(address,mem)~=c.expected[i]then emu.stop(100000+n*16+i);return end end
 if emu.read(6,mem)~=12 then emu.stop(400000+n);return end
 if emu.read16(0xa8d,mem)~=c.stage then emu.stop(200000+n);return end
 for i,v in ipairs(c.rng)do if emu.read16(0xccf+(i-1)*2,mem)~=v then emu.stop(300000+n*16+i);return end end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'plane-spawn-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=15',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},20000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log({cases:cases.length,exitCode:code});if(code===0)fs.writeFileSync(path.join(root,'research/reference-plane-spawn.json'),JSON.stringify({routine:'CODE_03ABFC',romSHA256:hash,mesenSHA256:sha(fs.readFileSync(exe)),valuesCompared:cases.length*18,cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
