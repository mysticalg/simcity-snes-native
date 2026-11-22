import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import{spawn}from'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))),hash=sha(fs.readFileSync(rom));if(hash!==manifest.romSHA256)throw Error('Wrong ROM');const cases=manifest.assets.filter(a=>a.packed&&(['GFX_Layer1_CitySimulationTiles','GFX_Layer3_CitySimulationTiles','GFX_Layer1_TitleScreen'].includes(a.name))).map(a=>({...a,bytes:fs.readFileSync(path.join(root,a.path))}));
const lua=cases.map(c=>`{bank=${parseInt(c.start.slice(0,2),16)},address=${parseInt(c.start.slice(2),16)},size=${c.size},bytes='${c.bytes.toString('hex')}'}`).join(',');
const script=`local cases={${lua}};local n=0;local injected=false;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=0;s['cpu.d']=0;s['cpu.dbr']=0;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 emu.write16(9,c.address,mem);emu.write(11,c.bank,mem);emu.write16(14,0,mem)
 for i,v in ipairs({0x20,0xdd,0x90,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n]
 for i=0,c.size-1 do if emu.read(0x8000+i,mem)~=tonumber(c.bytes:sub(i*2+1,i*2+2),16)then emu.stop(100000+n*65536+i);return end end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x001003,0x001003)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'graphics-decompression.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=15',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},20000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log({cases:cases.length,exitCode:code});if(code===0)fs.writeFileSync(path.join(root,'research/reference-graphics-decompression.json'),JSON.stringify({routine:'CODE_0090DD',romSHA256:hash,mesenSHA256:sha(fs.readFileSync(exe)),bytesCompared:cases.reduce((n,c)=>n+c.size,0),cases:cases.map(({bytes,...c})=>c),exitCode:code},null,2)+'\n');else process.exitCode=1;
