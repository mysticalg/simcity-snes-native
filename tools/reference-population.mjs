import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';import {romPopulation} from '../src/rom-population.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');const hash=sha(fs.readFileSync(rom));if(hash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const cases=[];for(const annual of [false,true])for(const rci of [[0,0,0],[100,0,0],[500,0,0],[2500,0,0],[5000,0,0],[25000,0,0],[65535,65535,65535],[0,8192,0],[65535,8192,0],[1,65535,1]])for(const baseline of [0,123456,0xffffffff])cases.push({annual,rci,baseline,expected:romPopulation(rci,baseline)});
const lua=cases.map(c=>`{annual=${c.annual?'true':'false'},rci={${c.rci}},baseline={${c.baseline&65535},${c.baseline>>>16}},expected={${c.expected.population&65535},${c.expected.population>>>16},${c.expected.netMigration&65535},${c.expected.netMigration>>>16},${c.expected.category}}}`).join(',');
const script=`local cases={${lua}};local n=0;local injected=false;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 emu.write16(0xb8b,c.rci[1],mem);emu.write16(0xb93,c.rci[2],mem);emu.write16(0xb8f,c.rci[3],mem)
 if c.annual then emu.write16(0xba5,c.baseline[1],mem);emu.write16(0xba7,c.baseline[2],mem);emu.write16(0xbcd,123,mem);emu.write16(0xbcf,456,mem)else emu.write16(0xbcd,c.baseline[1],mem);emu.write16(0xbcf,c.baseline[2],mem)end
 local target=c.annual and 0xb562 or 0x8196;for i,v in ipairs({0x20,target%256,math.floor(target/256),0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n];local actual={emu.read16(0xba5,mem),emu.read16(0xba7,mem),emu.read16(0xde3,mem),emu.read16(0xde5,mem),emu.read16(0xdeb,mem)}
 for i,v in ipairs(actual)do if v~=c.expected[i]then emu.stop(100000+n*8+i);return end end
 if emu.read16(0xbcd,mem)~=c.baseline[1]or emu.read16(0xbcf,mem)~=c.baseline[2]then emu.stop(200000+n);return end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'population-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=10',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},15000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log(JSON.stringify({cases:cases.length,exitCode:code}));if(code===0)fs.writeFileSync(path.join(root,'research/reference-population.json'),JSON.stringify({routines:['CODE_038196','CODE_03B562'],valuesCompared:cases.length*7,romSHA256:hash,mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
