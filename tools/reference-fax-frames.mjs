import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),sourceExe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
if(sha(rom)!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const out=path.join(root,'output/fax-reference-v53');fs.mkdirSync(out,{recursive:true});
// Mesen's Lua file library is disabled by default. Use an isolated portable
// copy for capture I/O, leaving the existing emulator/settings/saves intact.
const portable=path.join(out,'mesen');fs.mkdirSync(portable,{recursive:true});
for(const name of['Mesen.exe','MesenCore.dll','libHarfBuzzSharp.dll','libSkiaSharp.dll','MesenNesDB.txt']){const src=name==='Mesen.exe'?sourceExe:path.join(path.dirname(sourceExe),name),dest=path.join(portable,name);if(!fs.existsSync(dest))fs.copyFileSync(src,dest);}
fs.writeFileSync(path.join(portable,'settings.json'),JSON.stringify({Version:'2.1.1',Debug:{ScriptWindow:{AllowIoOsAccess:true,AllowNetworkAccess:false,ScriptTimeout:20}}}));const exe=path.join(portable,'Mesen.exe');
const script=`local out=${JSON.stringify(out.replaceAll('\\','/'))};local mem=emu.memType.snesWorkRam;local bus=emu.memType.snesMemory
local injected=false;local ready=false;local screen=9;local phase=1;local held=0;local frames=0;local phases={-120,-90,-60,-30,0,-120,-120};local brightness={15,15,15,15,15,0,7}
local function write(name,bytes)local f=assert(io.open(out..'/'..name,'wb'));f:write(bytes);f:close()end
local function safe(fn)return function(...)local ok,e=pcall(fn,...);if not ok then if io then local f=io.open(out..'/error.txt','wb');if f then f:write(tostring(e));f:close()end end;emu.log('FAXFAIL '..tostring(e));emu.stop(9001)end end end
local function dump(name,kind,count)local bytes={};for i=0,count-1 do bytes[#bytes+1]=string.char(emu.read(i,assert(kind),false))end;write(name,table.concat(bytes))end
local types={};for k,v in pairs(emu.memType)do if tostring(k):find('snes')then types[#types+1]=tostring(k)end end;table.sort(types);write('mem-types.txt',table.concat(types,string.char(10)))
local function setup()
 ready=false;phase=1;held=0;emu.write(0x4200,0,bus);emu.write(0x420c,0,bus);emu.write(0x2100,0x8f,bus);emu.write(0x2115,0x80,bus)
 for a=0,0x7fff do emu.write(a,0,mem)end
 emu.write(0xb3,0x81,mem);emu.write(0xb1,0x81,mem);emu.write(0x5f,0x8f,mem);emu.write16(0x3e,3,mem);emu.write16(0x40,screen,mem)
 for i,v in ipairs({0x20,0x49,0xdf,0xcb,0x80,0xfd})do emu.write(0x1000+i-1,v,mem)end
 local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s);emu.write(0x4200,0x81,bus)
end
emu.addMemoryCallback(safe(function()
 if not injected or ready then return end;ready=true;held=0
 local states={};for k,v in pairs(emu.getState())do if tostring(k):find('ppu')then states[#states+1]=tostring(k)..'='..tostring(v)end end;table.sort(states);write('state-'..screen..'.txt',table.concat(states,'\\n'))
 dump('vram-'..screen..'.bin',emu.memType.snesVideoRam,65536);dump('cgram-'..screen..'.bin',emu.memType.snesCgRam,512);dump('oam-'..screen..'.bin',emu.memType.snesSpriteRam,544)
end),emu.callbackType.exec,0x031003,0x031003)
emu.addEventCallback(safe(function()
 frames=frames+1;if frames>350 then write('error.txt','Frame limit, ready='..tostring(ready));emu.stop(9002);return end
 if not ready then return end;held=held+1;if held<3 then return end;held=0
 local size=emu.getScreenSize();local buffer=emu.getScreenBuffer();local bytes={};for i=1,#buffer do bytes[#bytes+1]=string.pack('<I4',buffer[i]&0xffffffff)end
 local stem='screen-'..screen..'-phase-'..phase;write(stem..'.argb',table.concat(bytes));write(stem..'.png',emu.takeScreenshot());write(stem..'.json',string.format('{"screen":%d,"scroll":%d,"width":%d,"height":%d,"pixels":%d,"brightness":%d}',screen,phases[phase],size.width,size.height,#buffer,brightness[phase]))
 phase=phase+1;if phase>#phases then screen=screen+1;if screen>11 then emu.stop(0);return else setup();return end end
 emu.write(0x5f,brightness[phase],mem);emu.write16(0x18,phases[phase]&0xffff,mem);emu.write16(0x1c,phases[phase]&0xffff,mem)
end),emu.eventType.endFrame)
emu.addMemoryCallback(safe(function()if injected then return end;injected=true;setup()end),emu.callbackType.exec,0,0xffffff)
`;
const file=path.join(out,'reference.lua');fs.writeFileSync(file,script);
const result=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=30',file,rom],{windowsHide:true,stdio:['ignore','pipe','pipe']}),timer=setTimeout(()=>{p.kill();reject(Error('Fax reference timeout'));},35000);let logs='';for(const stream of[p.stdout,p.stderr])stream.on('data',b=>{logs=(logs+b.toString()).slice(-8000);});p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve({code,logs});});});
fs.writeFileSync(path.join(out,'run.json'),JSON.stringify({romSHA256:sha(rom),mesenSHA256:sha(exe),...result},null,2));console.log({code:result.code,logs:result.logs.slice(0,1500)});if(result.code!==0){const err=path.join(out,'error.txt');if(fs.existsSync(err))console.error(fs.readFileSync(err,'utf8'));process.exitCode=1;}
