import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';import {damageRomCollisionTile} from '../src/rom-collision.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');const hash=sha(fs.readFileSync(rom));if(hash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const flags=JSON.parse(fs.readFileSync(path.join(root,'assets/tables/city.json'))).flags,region=[];for(let y=45;y<=57;y++)for(let x=55;x<=67;x++)region.push(y*120+x);
const cases=[];for(const id of [0,2,19,20,0x30,0x60,0x81,0x84,0x140,0x1fd,0x249,0x25c,0x26c,0x27c,0x28c,0x2a5,0x36b,0x364])for(const seed of [[0,0],[1,0],[0,1],[65535,65535]]){
 const map=new Uint16Array(12000);for(const i of region)map[i]=0xc081;map[6060]=id;let [a,b]=seed;
 const result=damageRomCollisionTile(map,flags,60,50,()=>{const old=a,total=a+b;a=total&65535;b=(a+old+(total>65535?1:0))&65535;return b;});
 cases.push({id,seed,result,expected:region.map(i=>map[i]),rng:[a,b]});
}
const lua=cases.map(c=>`{id=${c.id},seed={${c.seed}},expected={${c.expected}},rng={${c.rng}}}`).join(',');
const script=`local cases={${lua}};local region={${region}};local n=0;local injected=false;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 if index==1 then for i=0,11999 do emu.write16(0x10200+i*2,0,mem)end end
 for _,i in ipairs(region)do emu.write16(0x10200+i*2,0xc081,mem)end;emu.write16(0x10200+6060*2,c.id,mem)
 emu.write16(0x59,c.seed[1],mem);emu.write16(0x5b,c.seed[2],mem);emu.write16(0xaef,0,mem)
 for i,v in ipairs({0xa9,60,50,0x20,0xc6,0xa9,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n]
 for j,i in ipairs(region)do if emu.read16(0x10200+i*2,mem)~=c.expected[j]then emu.stop(100000+n*256+j);return end end
 if emu.read16(0x59,mem)~=c.rng[1]or emu.read16(0x5b,mem)~=c.rng[2]then emu.stop(200000+n);return end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031006,0x031006)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'collision-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=10',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},15000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log(JSON.stringify({cases:cases.length,exitCode:code}));if(code===0)fs.writeFileSync(path.join(root,'research/reference-collision.json'),JSON.stringify({routine:'CODE_03A9C6',romSHA256:hash,mesenSHA256:sha(fs.readFileSync(exe)),region,cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
