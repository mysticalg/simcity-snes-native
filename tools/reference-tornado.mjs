import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import{spawn}from'node:child_process';import{createRomTornado,stepRomTornado}from'../src/rom-tornado.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=sha(fs.readFileSync(rom));if(hash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');const flags=JSON.parse(fs.readFileSync(path.join(root,'assets/tables/city.json'))).flags,cases=[];const fields=[['x',0xa59],['y',0xa57],['targetX',0xaa5],['targetY',0xaa3],['offsetX',0xa75],['offsetY',0xa73],['direction',0xa97],['frame',0xac7],['surface',0xac5]];
function add(input,id=20,paused=false){const map=new Uint16Array(12000).fill(id),state={...createRomTornado(),active:true,...input},before={...state};let a=0x5cd6,b=0x1238;const result=stepRomTornado(state,map,flags,()=>{const old=a,n=old+b;a=n&65535;b=(a+old+(n>65535?1:0))&65535;return b;},{paused});const changed=[...map.entries()].filter(([i,v])=>v!==id);cases.push({before,id,paused,expected:state,rng:[a,b],result,changed});}
for(let direction=0;direction<8;direction++)for(const [x,y]of[[60,50],[0,0],[119,99]])for(const offset of[0,7])for(const id of[0,3,20,0x99])add({x,y,direction,offsetX:offset,offsetY:offset,targetX:60,targetY:50},id);
for(const targetX of[40,60,80])for(const targetY of[30,50,70])add({x:60,y:50,targetX,targetY,initializing:true});add({x:60,y:50,targetX:10,targetY:10},20,true);
const lua=cases.map(c=>`{input={${fields.map(([key])=>c.before[key])}},stage=${c.before.initializing?32768:1},id=${c.id},paused=${c.paused},expected={${fields.map(([key])=>c.expected[key])}},active=${c.expected.active?(c.expected.initializing?32768:1):0},rng={${c.rng}},changed={${c.changed.map(([i,v])=>`[${i}]=${v}`)}}}`).join(',');
const script=`local cases={${lua}};local addresses={${fields.map(f=>f[1])}};local n=0;local injected=false;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=0;s['cpu.d']=0;s['cpu.dbr']=0;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 for i=0,11999 do emu.write16(0x10200+i*2,c.id,mem)end;for i,address in ipairs(addresses)do emu.write16(address,c.input[i],mem)end
 emu.write16(0xa8b,c.stage,mem);emu.write16(0xe1,7,mem);emu.write16(0xe3,c.paused and 1 or 0,mem);emu.write16(0x193,0,mem);emu.write16(0xab5,1,mem);emu.write16(0x1930,0,mem);emu.write16(0x187,0,mem);emu.write16(0xaef,0,mem);emu.write16(0x3fe,0,mem)
 emu.write16(0x59,0x5cd6,mem);emu.write16(0x5b,0x1238,mem)
 for i,v in ipairs({0x20,0xc1,0xb0,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n]
 for i,address in ipairs(addresses)do if emu.read16(address,mem)~=c.expected[i]then emu.stop(100000+n*16+i);return end end
 if emu.read16(0xa8b,mem)~=c.active then emu.stop(200000+n);return end
 for i=0,11999 do if emu.read16(0x10200+i*2,mem)~=(c.changed[i] or c.id)then emu.stop(300000+n);return end end
 if emu.read16(0x59,mem)~=c.rng[1]or emu.read16(0x5b,mem)~=c.rng[2]then emu.stop(400000+n);return end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x001003,0x001003)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'tornado-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=15',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},20000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log({cases:cases.length,exitCode:code});if(code===0)fs.writeFileSync(path.join(root,'research/reference-tornado.json'),JSON.stringify({routines:['CODE_00B0C1','CODE_00AEDB','CODE_03A9C2'],scope:'State and full map; sprite transfer suppressed with0AB5. Final menu RNG compared too.',romSHA256:hash,mesenSHA256:sha(fs.readFileSync(exe)),valuesCompared:cases.length*12012,cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
