import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import{spawn}from'node:child_process';import{generateRomDemand,accumulateRomDemand}from'../src/rom-demand.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc');
const sha256=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');const romHash=sha256(rom);if(romHash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const cases=[];const add=(rci,history,previous=[0,0,0],tax=7,difficulty=0,suppressed=[false,false,false],force=false)=>{const generated=generateRomDemand(rci,history,difficulty),expected=generated.scores.map((n,i)=>accumulateRomDemand(previous[i],n,tax,difficulty,i===0?2000:1500,{suppressPositive:suppressed[i],forceMaximum:force}));cases.push({rci,history,previous,tax,difficulty,suppressed,force,ratios:generated.ratios,total:generated.totalUnits,expected});};
add([0,0,0],[0,0,0]);for(let d=0;d<3;d++){add([800,50,50],[800,50,50],[100,-100,500],7,d);add([800,50,50],[0,0,0],[-1900,1400,0],20,d);add([0,0,1],[0,1,0],[1900,0,-1400],0,d);}add([4000,200,100],[3000,100,50],[1900,1400,1400],7,0,[true,true,true]);add([4000,200,100],[3000,100,50],[-1900,-1400,-1400],7,2,[true,true,true]);add([4000,200,100],[3000,100,50],[-1900,-1400,-1400],20,2,[true,true,true],true);
let seed=0x31415926;const random=max=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%max;};
for(let i=0;i<64;i++)add([random(40001),random(8001),random(8001)],[random(40001),random(8001),random(8001)],[random(4001)-2000,random(3001)-1500,random(3001)-1500],random(21),random(3),[Boolean(random(2)),Boolean(random(2)),Boolean(random(2))]);
add([65535,65535,65535],[65535,65535,65535]);add([65535,1,0],[8,65535,1]);
const luaCases=cases.map(c=>`{r={${c.rci}},h={${[c.history[0]>>>3,c.history[1],c.history[2]]}},p={${c.previous.map(n=>n&65535)}},tax=${c.tax},difficulty=${c.difficulty},suppressed={${c.suppressed.map(x=>x?1:0)}},force=${c.force?4:0},ratios={${c.ratios}},expected={${c.expected.map(n=>n&65535)}},total=${c.total}}`).join(',');
const script=`local fixtures={${luaCases}}
local n=0
local injected=false
local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=fixtures[index];local s=emu.getState()
 s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 local addresses={0x0b8b,0x0b93,0x0b8f};local hist={0x15fc0,0x160b0,0x161a0};local demand={0x0bad,0x0baf,0x0bb1};local caps={0x0bb3,0x0bb5,0x0bb7}
 for i=1,3 do emu.write16(addresses[i],c.r[i],mem);emu.write16(hist[i],c.h[i],mem);emu.write16(demand[i],c.p[i],mem);emu.write16(caps[i],c.suppressed[i],mem)end
 emu.write16(0x0dc5,c.tax,mem);emu.write16(0x0b57,c.difficulty,mem);emu.write16(0x0425,c.force,mem);emu.write16(0x0dfb,123,mem)
 for i,v in ipairs({0x20,0x4c,0x89,0xea})do emu.write(0x1000+i-1,v,mem)end
 emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end
 local c=fixtures[n];local demand={0x0bad,0x0baf,0x0bb1}
 for i=1,3 do if emu.read16(demand[i],mem)~=c.expected[i] then emu.stop(1000+n*16+i);return end;if emu.read16(0x17f2+(i-1)*2,mem)~=c.ratios[i] then emu.stop(2000+n*16+i);return end end
 if emu.read16(0x0dfb,mem)~=c.total or emu.read16(0x0dfd,mem)~=123 then emu.stop(3000+n);return end
 if n==#fixtures then emu.stop(0);return end
 n=n+1;setup(n)
end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'demand-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=10',file,rom],{windowsHide:true,stdio:'ignore'});const timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},15000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});const report={routine:'CODE_03894C',wordsCompared:cases.length*8,romSHA256:romHash,mesenSHA256:sha256(exe),fixture:{directPage:0x1800,dataBank:3,stack:0x1eff,status:4,interrupts:false},cases,exitCode:code};console.log(JSON.stringify({cases:cases.length,exitCode:code}));if(code===0)fs.writeFileSync(path.join(root,'research/reference-demand.json'),JSON.stringify(report,null,2)+'\n');else process.exitCode=1;
