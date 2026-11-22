import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';import {createRomShip,stepRomShip} from '../src/rom-ship.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');const hash=sha(fs.readFileSync(rom));if(hash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const fields=[['active',0xa95,2],['x',0xa65,2],['y',0xa63,2],['direction',0xb0b,2],['targetDirection',0xb09,2],['turn',0xb07,1],['turnPhase',0xb05,1],['pixelX',0xb13,2],['pixelY',0xb11,2],['offsetX',0xa81,2],['offsetY',0xa7f,2],['hornCountdown',0xb0f,2],['travelCountdown',0xb0d,1]];
const words=s=>fields.map(([k,,size])=>k==='active'?(s.active?(s.initializing?32768:1):0):s[k]&(size===1?255:65535));
const cases=[],map=new Uint16Array(12000).fill(2);
for(let d=0;d<8;d++)for(const mode of ['init','center','offset','turn1','turn0','paused','blocked','exit']){
 const input={...createRomShip(),active:true,x:60,y:50,pixelX:480,pixelY:400,direction:d,hornCountdown:100};
 if(mode==='init')input.initializing=true;
 if(mode==='offset'){input.pixelX++;input.offsetX=1;}
 if(mode.startsWith('turn'))Object.assign(input,{turn:1,targetDirection:(d+1)&7,turnPhase:mode==='turn1'?1:0});
 if(mode==='exit')Object.assign(input,{x:119,y:99,pixelX:959,pixelY:799,offsetX:7,offsetY:7});
 const expected={...input};let a=1,b=0;const options={paused:mode==='paused',blocked:mode==='blocked'};
 stepRomShip(expected,map,()=>{const old=a,total=a+b;a=total&65535;b=(a+old+(total>65535?1:0))&65535;return b;},options);
 cases.push({d,mode,input:words(input),expected:words(expected),options,rng:[a,b]});
}
const lua=cases.map(c=>`{input={${c.input}},expected={${c.expected}},paused=${c.options.paused?3:0},blocked=${c.options.blocked?1:0},rng={${c.rng}}}`).join(',');
const script=`local cases={${lua}};local n=0;local injected=false;local mem=emu.memType.snesWorkRam;local addresses={${fields.map(f=>f[1])}};local sizes={${fields.map(f=>f[2])}}
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=0;s['cpu.d']=0;s['cpu.dbr']=0;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 if index==1 then for i=0,11999 do emu.write16(0x10200+i*2,2,mem)end end
 for i,address in ipairs(addresses)do if sizes[i]==1 then emu.write(address,c.input[i],mem)else emu.write16(address,c.input[i],mem)end end
 emu.write16(0x59,1,mem);emu.write16(0x5b,0,mem);emu.write16(0xe1,1,mem);emu.write16(0xe3,c.blocked,mem);emu.write16(0x193,c.paused,mem);emu.write16(0xd7,0,mem)
 for i,v in ipairs({0x20,0x59,0xb7,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n]
 for i,address in ipairs(addresses)do local actual;if sizes[i]==1 then actual=emu.read(address,mem)else actual=emu.read16(address,mem)end;if actual~=c.expected[i]then emu.stop(100000+n*32+i);return end end
 if emu.read16(0x59,mem)~=c.rng[1]or emu.read16(0x5b,mem)~=c.rng[2]then emu.stop(200000+n);return end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x001003,0x001003)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'ship-motion-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=10',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},15000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log(JSON.stringify({cases:cases.length,exitCode:code}));if(code===0)fs.writeFileSync(path.join(root,'research/reference-ship-motion.json'),JSON.stringify({routine:'CODE_00B759',romSHA256:hash,mesenSHA256:sha(fs.readFileSync(exe)),fields:fields.map(f=>f[0]),cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
