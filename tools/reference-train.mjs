import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import{spawn}from'node:child_process';import{createRomTrain,stepRomTrain}from'../src/rom-train.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');const romHash=sha(fs.readFileSync(rom));if(romHash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const cases=[];for(const id of [0,0x6d,0x6e,0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7a,0x7b,0x7c,0x7d,0x7e,0x34b])for(const [dx,dy]of [[1,0],[0,1],[-1,0],[0,-1]])for(const seed of [[0,0],[1,0],[2,0],[3,0],[0,1],[0,2],[0,3],[65535,65535]]){const t={...createRomTrain(),active:true,x:84-dx,y:84-dy,dx,dy,frame:dx?0:1},input={...t,x:84,y:84},m=Array(12000).fill(0);for(const n of [10*120+10-120,10*120+10+1,10*120+10+120,10*120+10-1])m[n]=0x72;m[1210]=id;let [a,b]=seed;stepRomTrain(t,m,()=>{const old=a,total=a+b;a=total&65535;b=(a+old+(total>65535?1:0))&65535;return b;});cases.push({id,seed,input,expected:t,rng:[a,b]});}
const fields=[['active',0x0a93],['x',0x0ae1],['y',0x0ae3],['dx',0x0add],['dy',0x0adf],['reversed',0x0ae5],['hidden',0x0ae7],['frame',0x0adb]];
const words=t=>fields.map(([k])=>k==='frame'?0x9e00+t[k]*128:k==='hidden'?(t[k]?128:0):typeof t[k]==='boolean'?(t[k]?1:0):t[k]&65535);
const lua=cases.map(c=>`{id=${c.id},seed={${c.seed}},input={${words(c.input)}},expected={${words(c.expected)}},rng={${c.rng}}}`).join(',');
const script=`local cases={${lua}};local n=0;local injected=false;local mem=emu.memType.snesWorkRam;local fields={${fields.map(f=>f[1])}}
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=0;s['cpu.d']=0;s['cpu.dbr']=0;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 if index==1 then for i=0,11999 do emu.write16(0x10200+i*2,0,mem)end end
 for _,i in ipairs({1090,1211,1330,1209})do emu.write16(0x10200+i*2,0x72,mem)end;emu.write16(0x10200+1210*2,c.id,mem)
 for i,address in ipairs(fields)do emu.write16(address,c.input[i],mem)end
 emu.write16(0x59,c.seed[1],mem);emu.write16(0x5b,c.seed[2],mem)
 for i,v in ipairs({0x20,0x60,0xb2,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n]
 for i,address in ipairs(fields)do if emu.read16(address,mem)~=c.expected[i]then emu.stop(100000+n*16+i);return end end
 if emu.read16(0x59,mem)~=c.rng[1]or emu.read16(0x5b,mem)~=c.rng[2]then emu.stop(200000+n);return end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x001003,0x001003)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'train-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=10',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},15000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log(JSON.stringify({cases:cases.length,exitCode:code}));if(code===0)fs.writeFileSync(path.join(root,'research/reference-train.json'),JSON.stringify({routine:'CODE_00B260',stateWordsCompared:cases.length*10,romSHA256:romHash,mesenSHA256:sha(fs.readFileSync(exe)),fields:fields.map(f=>f[0]),cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
