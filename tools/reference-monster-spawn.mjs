import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import{spawn}from'node:child_process';import{createRomMonster,startRomMonster}from'../src/rom-monster.js';import{SIMULATION_SEED,nextSimulationWord,boundSimulationWord}from'../src/rom-random.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=sha(fs.readFileSync(rom));if(hash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');const fields=[['x',0xa51],['y',0xa4f],['targetX',0xabd],['targetY',0xabb],['offsetX',0xa6d],['offsetY',0xa6b],['walk',0xabf],['direction',0xac1],['frame',0xac3],['surface',0xab9]],cases=[];let seed=77;const seeds=[SIMULATION_SEED,Array(7).fill(0),...Array.from({length:10},()=>Array.from({length:7},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed>>>16;}))];for(const active of[false,true])for(const target of[{x:0,y:0},{x:29,y:24},{x:80,y:70}])for(const input of seeds){const rng=[...input],state={...createRomMonster(),active,x:60,y:50,targetX:20,targetY:40,offsetX:3,offsetY:6,walk:7,direction:2,frame:8,surface:1};const before={...state};startRomMonster(state,target.x,target.y,max=>boundSimulationWord(nextSimulationWord(rng),max));cases.push({active,target,before,seed:input,expected:state,rng});}
const lua=cases.map(c=>`{active=${c.active},input={${fields.map(([key])=>c.before[key])}},target={${c.target.x},${c.target.y}},seed={${c.seed}},rng={${c.rng}},expected={${fields.map(([key])=>c.expected[key])}},stage=${c.expected.initializing?32768:1}}`).join(',');
const script=`local cases={${lua}};local fields={${fields.map(f=>f[1])}};local injected=false;local n=0;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 for i,v in ipairs(c.seed)do emu.write16(0xccf+(i-1)*2,v,mem)end
 emu.write16(0xc09,c.target[1],mem);emu.write16(0xc0b,c.target[2],mem);for i,v in ipairs(c.input)do emu.write16(fields[i],v,mem)end;emu.write16(0xa91,c.active and 1 or 0,mem)
 for i,v in ipairs({0x20,0x47,0xba,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n]
 for i,address in ipairs(fields)do if emu.read16(address,mem)~=c.expected[i]then emu.stop(100000+n*16+i);return end end
 if emu.read16(0xa91,mem)~=c.stage then emu.stop(200000+n);return end
 for i,v in ipairs(c.rng)do if emu.read16(0xccf+(i-1)*2,mem)~=v then emu.stop(300000+n*16+i);return end end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'monster-spawn-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=15',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},20000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log({cases:cases.length,exitCode:code});if(code===0)fs.writeFileSync(path.join(root,'research/reference-monster-spawn.json'),JSON.stringify({routine:'CODE_03BA47',romSHA256:hash,mesenSHA256:sha(fs.readFileSync(exe)),valuesCompared:cases.length*18,cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
