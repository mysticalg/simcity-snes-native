import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import{spawn}from'node:child_process';import{createRomHelicopter,stepRomHelicopter,spawnRomHelicopter}from'../src/rom-helicopter.js';
const root=path.resolve(import.meta.dirname,'..'),work=path.resolve(root,'../../work/tools/mesen2'),exe=path.join(work,'app/Mesen.exe'),rom=path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');const romSHA256=sha(fs.readFileSync(rom));if(romSHA256!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const fields=[['active',0xa8f],['x',0xa5d],['y',0xa5b],['offsetX',0xa79],['offsetY',0xa77],['direction',0xa9b],['targetX',0xaa9],['targetY',0xaa7],['targetDirection',0xa9d],['turn',0xaaf],['rotor',0xaeb]],cases=[];
function add(input,id=0,opts={}){const s={...createRomHelicopter(),active:true,x:60,y:50,targetX:80,targetY:70,...input},before={...s},map=new Uint16Array(12000).fill(id);let a=0x5cd6,b=0x1238;const next=()=>{const old=a,n=a+b;a=n&65535;b=(a+old+(n>65535?1:0))&65535;return b;};let result;for(let i=0;i<(opts.steps||1);i++)result=opts.spawn?(spawnRomHelicopter(s,opts.x,opts.y),{}):stepRomHelicopter(s,map,next,{...opts,phase:((opts.phase??5)+i)%24});cases.push({before,id,opts,expected:{...s},result,rng:[a,b]});}
for(const direction of[0,1,2,3,4,5,6,7,0x8000])for(const offset of[0,7])for(const turn of[0,1,-1])for(const id of[0,0x50,0x60])add({direction,offsetX:offset,offsetY:offset,turn});
for(const phase of[0,1,4,5,13,21,23])for(const mapView of[false,true])for(const newsBusy of[false,true])add({direction:2,rotor:65534},0x5f,{phase,mapView,newsBusy});
for(const [x,y]of[[0,0],[119,99],[60,50]])for(const direction of[0,1,2,3,4,5,6,7])for(const offset of[0,7])add({x,y,direction,offsetX:offset,offsetY:offset});
for(const direction of[0,2,4,6,0x8000])add({direction},0,{steps:8192});
for(const active of[false])for(const[x,y]of[[0,0],[60,50],[119,99]])add({active,turn:1,rotor:8,offsetX:7},0,{spawn:true,x,y});
const values=s=>fields.map(([k])=>k==='active'?+s[k]:k==='turn'?s[k]&255:s[k]&65535),lua=cases.map(c=>`{input={${values(c.before)}},expected={${values(c.expected)}},id=${c.id},phase=${c.opts.phase??5},view=${!!c.opts.mapView},busy=${!!c.opts.newsBusy},steps=${c.opts.steps||1},spawn=${!!c.opts.spawn},x=${c.opts.x||0},y=${c.opts.y||0},rng={${c.rng}},report=${!!c.result.trafficReport}}`).join(',');
const script=`local cases={${lua}};local fields={${fields.map(f=>f[1])}};local mem=emu.memType.snesWorkRam;local n=1;local step=1;local injected=false
local function setup()
 step=1;local c=cases[n];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=c.spawn and 3 or 0;s['cpu.d']=0;s['cpu.dbr']=c.spawn and 3 or 0;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 for i=0,11999 do emu.write16(0x10200+i*2,c.id,mem)end
 for i,address in ipairs(fields)do emu.write16(address,c.input[i],mem)end
 emu.write16(0x193,c.view and 3 or 0,mem);emu.write16(0xe1,c.phase,mem);emu.write16(0x387,c.busy and 1 or 0,mem);emu.write16(0x389,0,mem);emu.write16(0x38b,0,mem);emu.write16(0x59,0x5cd6,mem);emu.write16(0x5b,0x1238,mem);emu.write16(0xb85,c.x+c.y*256,mem)
 local code=c.spawn and {0x20,0x32,0xac,0xea}or{0x20,0x83,0xae,0xea};for i,v in ipairs(code)do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
local function check()
 if not injected then return end;local c=cases[n]
 if step<c.steps then step=step+1;emu.write16(0xe1,(c.phase+step-1)%24,mem);local s=emu.getState();s['cpu.pc']=0x1000;emu.setState(s);return end
 for i,address in ipairs(fields)do local got=i==10 and emu.read(address,mem)or emu.read16(address,mem);if got~=c.expected[i]then emu.stop(100000+n*16+i);return end end
 if emu.read16(0x59,mem)~=c.rng[1]or emu.read16(0x5b,mem)~=c.rng[2]then emu.stop(200000+n);return end
 if not c.spawn and c.steps==1 and ((emu.read16(0x389,mem)==28)~=c.report)then emu.stop(300000+n);return end
 if n==#cases then emu.stop(0);return end;n=n+1;setup()
end
emu.addMemoryCallback(check,emu.callbackType.exec,0x001003,0x001003);emu.addMemoryCallback(check,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if injected then return end;setup();injected=true end,emu.callbackType.exec,0,0xffffff)
`;
const file=path.join(work,'helicopter-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=90',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},100000);p.on('error',reject);p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log({cases:cases.length,exitCode:code});if(code>=100000&&code<200000){const n=Math.floor((code-100000)/16),f=(code-100000)%16;console.log({case:n,field:fields[f-1],input:cases[n-1]});}if(code===0)fs.writeFileSync(path.join(root,'research/reference-helicopter.json'),JSON.stringify({routines:['CODE_00AE83','CODE_03AC32','CODE_00B040'],scope:'Controlled worker/spawn: state, menu RNG and congestion notice',romSHA256,mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode:code},null,2)+'\n');else process.exitCode=1;

