import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {planOriginalCityTrack} from '../src/rom-track.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2');
const exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),romHash=sha(fs.readFileSync(rom));
if(romHash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const aram=fs.readFileSync(path.join(root,'assets/audio/aram.bin'));
const cases=[4,5,6].map(trackId=>{const plan=planOriginalCityTrack(aram,trackId,{maxPatterns:trackId===6?18:3});return {trackId,patternCount:plan.patterns.length,endTick:plan.patterns.at(-1).endTick,globals:Array.from(plan.globalState),events:plan.events.map(e=>({tick:e.tick,channel:e.channel,gateEndTick:e.gateEndTick,keyOffTick:e.keyOffTick,mixAutomation:e.mixAutomation,sample:e.sample,pitch:e.pitch,left:e.dspVolumes.left&255,right:e.dspVolumes.right&255,tempo:e.tempo,masterVolume:e.masterVolume}))};});
const lua=cases.map(c=>`{id=${c.trackId},last=${c.endTick-1},globals={${c.globals}},notes={${c.events.map(e=>`{${e.tick},${e.channel},${e.sample},${e.pitch&255},${e.pitch>>>8},${e.left},${e.right},${e.tempo},${e.masterVolume},${e.gateEndTick},${e.keyOffTick??-1},{${e.mixAutomation.map(p=>`{${p.tick},${p.left&255},${p.right&255}}`)}}}`)}}}`).join(',');
const script=`local cases={${lua}};local bytes='${aram.toString('hex')}';local n=0;local tick=0;local stage=0;local injected=false;local main=false;local reg=0;local off=0;local dsp={};local byTick={};local active={};local mixIndex={};local mem=emu.memType.spcRam
local function run(target,a)
 local s=emu.getState();s['spc.pc']=0x500;s['spc.a']=a or 0;s['spc.x']=0;s['spc.y']=0;s['spc.sp']=0xef;s['spc.ps']=0;emu.setState(s);emu.write(0x500,0x3f,mem);emu.write(0x501,target%256,mem);emu.write(0x502,math.floor(target/256),mem);emu.write(0x503,0,mem)
end
local function setup(index)
 n=index;tick=0;stage=0;off=0;dsp={};byTick={};active={};mixIndex={};for i,note in ipairs(cases[n].notes)do byTick[note[1]]=byTick[note[1]]or {};table.insert(byTick[note[1]],{index=i,note=note})end;for i=0,65535 do emu.write(i,tonumber(bytes:sub(i*2+1,i*2+2),16),mem)end;for i=0x200,0x3ff do emu.write(i,0,mem)end;emu.write(0,0,mem);emu.write16(0x0e,0,mem);emu.write(0x1a,0,mem);emu.write(0x1b,0,mem);emu.write(0x45,0,mem);run(0x13c9,cases[n].id)
end
emu.addMemoryCallback(function()if main then return end;main=true;local s=emu.getState();s['cpu.pc']=0x1000;s['cpu.k']=0;s['cpu.dbr']=0;s['cpu.emulationMode']=false;s['cpu.ps']=4;emu.setState(s);emu.write(0x1000,0x80,emu.memType.snesWorkRam);emu.write(0x1001,0xfe,emu.memType.snesWorkRam);emu.write(0x4200,0,emu.memType.snesMemory)end,emu.callbackType.exec,0,0xffffff)
emu.addMemoryCallback(function(address,value)if address==0xf2 then reg=value else dsp[reg]=value;if reg==0x5c then off=off | value end end end,emu.callbackType.write,0xf2,0xf3,emu.cpuType.spc,emu.memType.spcMemory)
emu.addMemoryCallback(function()
 if not injected then return end
 if stage<2 then stage=stage+1;run(0x1440);return end
 local c=cases[n];local mask=0
 for _,item in ipairs(byTick[tick]or {})do local i=item.index;local s=item.note;active[s[2]]=item;mixIndex[s[2]]=1;mask=mask+2^s[2];local base=s[2]*16;local actual={dsp[base+4]or 0,dsp[base+2]or 0,dsp[base+3]or 0,dsp[base]or 0,dsp[base+1]or 0,emu.read(0x53,mem),emu.read(0x59,mem)};for j,value in ipairs(actual)do if value~=s[j+2]then emu.stop(n*100000000+20000000+i*2048+j*256+value);return end end end
 for channel,item in pairs(active)do local i=item.index;local s=item.note;if tick>s[1]and tick<=s[10]then local actualOff=math.floor(off/2^channel)%2==1;local expectedOff=tick==s[11];if tick<s[10]then local left=s[6];local right=s[7];local points=s[12];while mixIndex[channel]<=#points and points[mixIndex[channel]][1]<=tick do mixIndex[channel]=mixIndex[channel]+1 end;local point=points[mixIndex[channel]-1];if point then left=point[2];right=point[3]end;local base=channel*16;if(dsp[base]or 0)~=left or(dsp[base+1]or 0)~=right then emu.stop(n*100000000+60000000+i*2048+tick-s[1]);return end end;if actualOff~=expectedOff then emu.stop(n*100000000+50000000+i*2048+(tick-s[1])*2+(actualOff and 1 or 0));return end end end
 local globals={emu.read16(0x52,mem),emu.read16(0x58,mem),emu.read(0x54,mem),emu.read(0x5a,mem)};for j,v in ipairs(globals)do if v~=c.globals[tick*4+j]then emu.stop(n*100000000+70000000+tick*8+j);return end end
 local actual=emu.read(0x45,mem);if actual~=mask then emu.stop(n*100000000+1000000+tick*256+actual);return end
 if tick==c.last then if n==#cases then emu.stop(0);return end;setup(n+1);return end
 tick=tick+1;off=0;emu.write(0x45,0,mem);run(0x1440)
end,emu.callbackType.exec,0x0503,0x0503,emu.cpuType.spc,emu.memType.spcMemory)
emu.addMemoryCallback(function()if injected then return end;injected=true;setup(1)end,emu.callbackType.exec,0,0xffff,emu.cpuType.spc,emu.memType.spcMemory)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'spc-advanced-themes.lua');fs.writeFileSync(file,script);
const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=60',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},65000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});
console.log({tracks:cases.map(c=>c.trackId),logicalTicks:cases.reduce((n,c)=>n+c.endTick,0),noteSnapshots:cases.reduce((n,c)=>n+c.events.length,0),exitCode:code});
if(code===0)fs.writeFileSync(path.join(root,'research/reference-spc-advanced-themes.json'),JSON.stringify({routines:['SPC_CODE_13C9','SPC_CODE_1440'],scope:'Original driver startup and logical ticks: global tempo/master Q8 and fade countdown every tick, KON masks, active note KOFF/stereo gates, sample/pitch/tempo/master at note starts. Silent SFX; absolute 2ms startup phase/vibrato/echo/PCM waveform not compared',romSHA256:romHash,aramSHA256:sha(aram),mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
