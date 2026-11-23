import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';
import {createRomGraphs,recordRomGraphMonth,recordRomGraphYear,GRAPH_SERIES,GRAPH_MONTH_ADDRESSES,GRAPH_YEAR_ADDRESSES} from '../src/rom-graphs.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const romSHA256=hash(rom);if(romSHA256!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
let seed=0x614a2b3c;const random=max=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%max;},cases=[];
const scalarKeys=['monthlyMax','annualMax','monthlyScale','longScale','crimeTrend','pollutionTrend','facilityDemand'];
const scalarValues=s=>[...s.monthlyMax,s.monthlyScale,...s.annualMax,s.longScale,s.crimeTrend,s.pollutionTrend,...s.facilityDemand.map(n=>n&65535)];
const scalarAddresses=[0xc5d,0xc5f,0xc61,0xc63,0xc65,0xc67,0xc69,0xc6b,0xc6d,0xc6f,0xb97,0xb99];
for(let n=0;n<72;n++){
 const initial=createRomGraphs();for(const period of['monthly','annual'])for(const key of GRAPH_SERIES)initial[period][key]=Array.from({length:120},(_,i)=>n<8?(i===119?65535:i+n):random(65536));
 initial.monthlyMax=[random(65536),random(65536),random(65536)];initial.annualMax=[random(65536),random(65536),random(65536)];initial.monthlyScale=random(65536);initial.longScale=random(65536);
 initial.crimeTrend=[0,255,1,254,32767,32768,65535,300][n%8];initial.pollutionTrend=[255,0,254,1,65535,32767,32768,300][n%8];
 const input={rci:n<8?[[0,0,0],[65535,65535,65535],[7,8,9],[8,32768,32767],[256,257,255],[800,50,50],[4000,200,100],[1,1,1]][n]:[random(65536),random(65536),random(65536)],crime:n<8?n%2?255:0:random(65536),pollution:n<8?n%2?0:255:random(65536),net:[-32768,-2561,-2560,-1,0,2540,30207,32767][n%8],facilityCounts:n<8?[0,255]:[random(256),random(256)]};
 const monthly=structuredClone(initial);recordRomGraphMonth(monthly,input);const annual=structuredClone(monthly);recordRomGraphYear(annual,input);cases.push({initial,input,monthly,annual});
}
const planes=s=>[...GRAPH_SERIES.map(k=>s.monthly[k]),...GRAPH_SERIES.map(k=>s.annual[k])],array=a=>'{'+a.map(v=>Array.isArray(v)?array(v):v).join(',')+'}';
const fixtures=cases.map(c=>`{initial=${array(planes(c.initial))},scalars=${array(scalarValues(c.initial))},rci=${array(c.input.rci)},crime=${c.input.crime},pollution=${c.input.pollution},net=${c.input.net&65535},targets=${array(c.input.facilityCounts)},monthly=${array(planes(c.monthly))},monthlyScalars=${array(scalarValues(c.monthly))},annual=${array(planes(c.annual))},annualScalars=${array(scalarValues(c.annual))}}`).join(',');
const script=`local fixtures={${fixtures}};local n=0;local injected=false;local mem=emu.memType.snesWorkRam;local addresses=${array([...GRAPH_MONTH_ADDRESSES,...GRAPH_YEAR_ADDRESSES])};local scalarAddresses=${array(scalarAddresses)}
local function setupInit()
 local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 for p,address in ipairs(addresses)do for i=0,119 do emu.write16(address+i*2,65535,mem)end end
 for i,v in ipairs({0x20,0xa1,0xc6,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
local function setup(index)
 local c=fixtures[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 for p,address in ipairs(addresses)do for i,v in ipairs(c.initial[p])do emu.write16(address+(i-1)*2,v,mem)end end
 for i,address in ipairs(scalarAddresses)do emu.write16(address,c.scalars[i],mem)end
 for i,address in ipairs({0xb8b,0xb93,0xb8f})do emu.write16(address,c.rci[i],mem)end
 emu.write16(0xc01,c.crime,mem);emu.write16(0xc07,c.pollution,mem);emu.write16(0xbc1,c.net,mem);emu.write16(0xe03,c.targets[1],mem);emu.write16(0xe05,c.targets[2],mem)
 for i,v in ipairs({0x20,0xd1,0x8b,0xc2,0x30,0x20,0x29,0x8d,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
local function check(phase)
 local c=fixtures[n];local expected=phase==1 and c.monthly or c.annual;local scalars=phase==1 and c.monthlyScalars or c.annualScalars
 for p,address in ipairs(addresses)do for i,v in ipairs(expected[p])do if emu.read16(address+(i-1)*2,mem)~=v then emu.stop(phase*10000000+n*2000+(p-1)*120+i);return false end end end
 for i,address in ipairs(scalarAddresses)do if emu.read16(address,mem)~=scalars[i] then emu.stop(phase*10000000+n*2000+1500+i);return false end end;return true
end
emu.addMemoryCallback(function()if not injected or n~=0 then return end;for p,address in ipairs(addresses)do for i=0,119 do local expected=(p==6 or p==12)and 128 or 0;if emu.read16(address+i*2,mem)~=expected then emu.stop(40000000+p*120+i);return end end end;n=1;setup(n)end,emu.callbackType.exec,0x03c6e3,0x03c6e3)
emu.addMemoryCallback(function()if injected then check(1)end end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if not injected or not check(2)then return end;if n==#fixtures then emu.stop(0);return end;n=n+1;setup(n)end,emu.callbackType.exec,0x031008,0x031008)
emu.addMemoryCallback(function()if not injected then injected=true;setupInit()end end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'graph-history-fixtures.lua');fs.writeFileSync(file,script);
const exitCode=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=30',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Graph reference timeout'));},35000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});
console.log({cases:cases.length,wordsCompared:1440+cases.length*2*(1440+12),exitCode});if(exitCode===0)fs.writeFileSync(path.join(root,'research/reference-graphs.json'),JSON.stringify({routines:['CODE_03C6A6','CODE_038BD1','CODE_038D29'],initialization:{wordsCompared:1440,finances:128,others:0},scope:'Controlled initialization and monthly followed by January graph workers; every history word, maxima, smoothed trends and facility-demand flags. Natural full-loop ordering and original graph-screen PPU composition are separate.',romSHA256,mesenSHA256:hash(exe),wordsCompared:1440+cases.length*2*(1440+12),scalarKeys,cases,exitCode},null,2)+'\n');else process.exitCode=1;
