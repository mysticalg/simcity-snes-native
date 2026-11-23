import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import{spawn}from'node:child_process';import{createRomUfo,stepRomUfo}from'../src/rom-ufo.js';const root=path.resolve(import.meta.dirname,'..'),work=path.resolve(root,'../../work/tools/mesen2'),exe=path.join(work,'app/Mesen.exe'),rom=path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),romSHA256=sha(fs.readFileSync(rom));if(romSHA256!==JSON.parse(fs.readFileSync('assets/manifest.json')).romSHA256)throw Error('Wrong ROM');
const flags=JSON.parse(fs.readFileSync('assets/tables/city.json')).flags,fields=[['activeWord',0xaef],['request',0xaf1],['mode',0xaf5],['counter',0xaf3],['targetY',0xaf7],['targetX',0xaf9],['pixelY',0xafb],['pixelX',0xafd],['direction',0xaff],['visible',0xb03],['flags',0x195],['focusFrames',0x3fe],['x',0xa69],['y',0xa67],['offsetX',0xa85],['offsetY',0xa83]],cases=[];
function add(input={},id=0,opts={}){const s={...createRomUfo(),activeWord:0x8000,request:0x8000,targetX:50,targetY:40,pixelX:400,pixelY:320,...input},before={...s},map=new Uint16Array(12000).fill(id);let a=0x5cd6,b=0x1238;const next=()=>{const old=a,n=a+b;a=n&65535;b=(a+old+(n>65535?1:0))&65535;return b;};let event;for(let i=0;i<(opts.steps||1);i++)event=stepRomUfo(s,map,flags,next,opts);cases.push({before,id,opts,expected:{...s},event,rng:[a,b],changed:[...map.entries()].filter(([i,v])=>v!==id)});}
for(const mode of[0,1,2,3,4,5,6,7,8])for(const counter of[0,34,38,39])for(const id of[0,0x99])add({mode,counter,visible:mode>=2?65535:0});
for(const direction of[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15])add({mode:2,direction,visible:65535});
for(const flags of[0,4,0x1234,0x8038])add({flags,mode:0});
for(const focusFrames of[0,1,255,0x100])add({mode:1,focusFrames});
for(const blocked of[false,true])for(const gameMode of[0,6,7])add({mode:3,visible:65535},0,{blocked,gameMode});
for(const mode of[3,4,5,6,7,8])add({mode,visible:65535},0x99,{steps:42});
for(const direction of[0,4,8,12])add({mode:2,direction,visible:65535},0,{steps:128,cameraX:40,cameraY:30});
const lua=cases.map(c=>`{input={${fields.map(([k])=>c.before[k])}},expected={${fields.map(([k])=>c.expected[k])}},id=${Number(c.id)||0},mode=${c.opts.gameMode??6},blocked=${!!c.opts.blocked},cx=${c.opts.cameraX||0},cy=${c.opts.cameraY||0},steps=${c.opts.steps||1},rng={${c.rng}},frame=${c.expected.frame},changed={${c.changed.map(([i,v])=>`[${i}]=${v}`)}}}`).join(',');
const gfx=fs.readFileSync('assets/graphics/GFX_Sprite_UFO.bin');
const script=`local gfx='${gfx.toString('hex')}';local cases={${lua}};local fields={${fields.map(f=>f[1])}};local mem=emu.memType.snesWorkRam;local n=1;local step=1;local injected=false
local function setup()
 step=1;local c=cases[n];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=0;s['cpu.d']=0;s['cpu.dbr']=0;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 for i=0,11999 do emu.write16(0x10200+i*2,c.id,mem)end;for i,address in ipairs(fields)do emu.write16(address,c.input[i],mem)end
 emu.write16(0x40,c.mode,mem);emu.write16(0xab5,c.blocked and 1 or 0,mem);emu.write16(0x1bd,c.cx,mem);emu.write16(0x1bf,c.cy,mem);emu.write16(0x59,0x5cd6,mem);emu.write16(0x5b,0x1238,mem);emu.write16(0xd7,0,mem)
 for i,v in ipairs({0x20,0xf9,0xc3,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n]
 if step<c.steps then step=step+1;local s=emu.getState();s['cpu.pc']=0x1000;emu.setState(s);return end
 for i,address in ipairs(fields)do if emu.read16(address,mem)~=c.expected[i]then emu.stop(100000+n*32+i);return end end
 if emu.read16(0x59,mem)~=c.rng[1]or emu.read16(0x5b,mem)~=c.rng[2]then emu.stop(200000+n);return end
 for i=0,11999 do if emu.read16(0x10200+i*2,mem)~=(c.changed[i]or c.id)then emu.stop(300000+n);return end end
 if not c.blocked and c.mode==6 and c.expected[1]~=0 and c.expected[10]~=0 then for row=0,3 do local dest=({0x7000,0x7200,0x7080,0x7280})[row+1];for j=0,127 do local off=c.frame*512+row*128+j;if emu.read(dest+j,mem)~=tonumber(gfx:sub(off*2+1,off*2+2),16)then emu.stop(400000+n);return end end end end
 if n==#cases then emu.stop(0);return end;n=n+1;setup()
end,emu.callbackType.exec,0x001003,0x001003)
emu.addMemoryCallback(function()if injected then return end;setup();injected=true end,emu.callbackType.exec,0,0xffffff)
`;
const file=path.join(work,'ufo-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=90',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},100000);p.on('error',reject);p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log({cases:cases.length,exitCode:code});if(code>=100000&&code<200000){const n=Math.floor((code-100000)/32),f=(code-100000)%32;console.log({case:n,field:fields[f-1],input:cases[n-1]});}if(code===0)fs.writeFileSync('research/reference-ufo.json',JSON.stringify({routines:['CODE_00C3F9','CODE_00C440..00C798'],scope:'Controlled phase worker state, RNG, damage maps',romSHA256,mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode:code},null,2)+'\n');else process.exitCode=1;

