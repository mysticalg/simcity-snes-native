import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';import {navigateRomShip} from '../src/rom-ship.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');const romHash=sha(fs.readFileSync(rom));if(romHash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const offsets=[-120,-119,1,121,120,119,-1,-121],cases=[];
for(let direction=0;direction<8;direction++)for(let pattern=0;pattern<12;pattern++)for(const seed of [[0,0],[1,0],[2,0],[3,0],[0,1],[0,2],[0,3],[65535,65535]]){
 const map=new Uint16Array(12000),cells=[];for(let d=0;d<8;d++){const id=pattern===0?0:pattern===1?2:pattern===2?3:pattern===3?0x60:pattern===4?0x354:pattern===5?(d===direction?3:0):pattern===6?(d===(direction+4)%8?2:0):[0,2,3,0x60,0x61,0x70,0x71,0x354,0x355][(d+pattern)%9],far=pattern===2||pattern===5?0x71:0;for(const [index,value] of [[6060+offsets[d],id],[6060+offsets[d]*2,far]]){map[index]=value;cells.push([index,value]);}}
 const ship={active:true,initializing:true,x:60,y:50,direction,targetDirection:0,turn:0,turnPhase:1};let [a,b]=seed;
 const outcome=navigateRomShip(ship,map,()=>{const old=a,total=a+b;a=total&65535;b=(a+old+(total>65535?1:0))&65535;return b;});
 cases.push({direction,pattern,seed,cells,outcome,expected:[ship.active?0x8000:0,ship.targetDirection,ship.turn&255,ship.turnPhase],rng:[a,b]});
}
const lua=cases.map(c=>`{direction=${c.direction},seed={${c.seed}},cells={${c.cells.map(([i,v])=>`{${i},${v}}`).join(',')}},expected={${c.expected}},rng={${c.rng}}}`).join(',');
const script=`local cases={${lua}};local n=0;local injected=false;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=0;s['cpu.d']=0;s['cpu.dbr']=0;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 if index==1 then for i=0,11999 do emu.write16(0x10200+i*2,0,mem)end end
 for _,cell in ipairs(c.cells)do emu.write16(0x10200+cell[1]*2,cell[2],mem)end
 emu.write16(0xa95,0x8000,mem);emu.write16(0xa65,60,mem);emu.write16(0xa63,50,mem);emu.write16(0xb0b,c.direction,mem);emu.write16(0xb09,0,mem);emu.write(0xb07,0,mem);emu.write(0xb05,1,mem)
 emu.write16(0x59,c.seed[1],mem);emu.write16(0x5b,c.seed[2],mem)
 for i,v in ipairs({0x20,0x6d,0xb8,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n];local actual={emu.read16(0xa95,mem),emu.read16(0xb09,mem),emu.read(0xb07,mem),emu.read(0xb05,mem)}
 for i,v in ipairs(actual)do if v~=c.expected[i]then emu.stop(100000+n*16+i);return end end
 if emu.read16(0x59,mem)~=c.rng[1]or emu.read16(0x5b,mem)~=c.rng[2]then emu.stop(200000+n);return end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x001003,0x001003)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'ship-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=10',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},15000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log(JSON.stringify({cases:cases.length,exitCode:code}));if(code===0)fs.writeFileSync(path.join(root,'research/reference-ship.json'),JSON.stringify({routine:'CODE_00B86D',stateValuesCompared:cases.length*6,romSHA256:romHash,mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
