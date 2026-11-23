// Execute the user's unchanged ROM RNG in Mesen and compare every state word.
// Requires a preconfigured Mesen2 installation; no emulator code ships in game.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn}from'node:child_process';import{SIMULATION_SEED,nextSimulationWord,boundSimulationWord}from'../src/rom-random.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2');
const exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc');
const iterations=Number(process.argv[2]??256);if(!Number.isInteger(iterations)||iterations<1||iterations>4096)throw Error('Iteration count must be1..4096');
const sha256=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const romHash=sha256(rom),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json')));if(romHash!==manifest.romSHA256)throw Error('Reference ROM hash mismatch');
const maximum=process.argv[3]===undefined?null:Number(process.argv[3]);if(maximum!==null&&(!Number.isInteger(maximum)||maximum<0||maximum>65535))throw Error('Maximum must be0..65535');
const state=[...SIMULATION_SEED],states=[],bounded=[];for(let n=0;n<iterations;n++){const word=nextSimulationWord(state);states.push([...state]);if(maximum!==null)bounded.push(boundSimulationWord(word,maximum));}
const entry=maximum===null?0x03907e:0x039035,returned=maximum===null?0x031006:0x031009,finished=maximum===null?0x031009:0x03100c;
const stub=maximum===null?[0xa2,iterations&255,iterations>>8,0x20,0x7e,0x90,0xca,0xd0,0xfa,0xea]:[0xa2,iterations&255,iterations>>8,0xa9,maximum&255,maximum>>8,0x20,0x35,0x90,0xca,0xd0,0xf7,0xea];
const script=`local injected=false
local rngCalls=0
local checked=0
local mem=emu.memType.snesWorkRam
local bounded={${bounded.join(',')}}
local expected={${states.map(row=>'{'+row.join(',')+'}').join(',')}}
emu.addMemoryCallback(function()if injected then rngCalls=rngCalls+1 end end,emu.callbackType.exec,${entry},${entry})
emu.addMemoryCallback(function()
 if not injected then return end
 if rngCalls<1 or rngCalls>#expected then emu.stop(16);return end
 for i=1,7 do if emu.read16(0x0ccf+(i-1)*2,mem)~=expected[rngCalls][i] then emu.stop(1000+rngCalls*8+i);return end end
 if #bounded>0 and (emu.getState()['cpu.a']&65535)~=bounded[rngCalls] then emu.stop(200000+rngCalls);return end
 checked=checked+1
end,emu.callbackType.exec,${returned},${returned})
emu.addMemoryCallback(function()
 if not injected then return end
 if checked~=#expected or rngCalls~=#expected then emu.stop(17);return end
 emu.stop(0)
end,emu.callbackType.exec,${finished},${finished})
emu.addMemoryCallback(function()
 if injected then return end
 local s=emu.getState()
 local keys={'cpu.k','cpu.d','cpu.dbr','cpu.sp','cpu.ps'}
 for i,k in ipairs(keys)do if s[k]==nil then emu.stop(100+i);return end end
 s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4
 if s['cpu.needNmi']~=nil then s['cpu.needNmi']=false end
 if s['cpu.stopState']~=nil then s['cpu.stopState']=0 end
 emu.setState(s)
 for i,v in ipairs({${SIMULATION_SEED.join(',')}})do emu.write16(0x0ccf+(i-1)*2,v,mem)end
 -- LDX count; JSR original RNG; DEX; BNE JSR; NOP completion sentinel.
 local stub={${stub.join(',')}}
 for i,v in ipairs(stub)do emu.write(0x1000+i-1,v,mem)end
 emu.write(0x4200,0,emu.memType.snesMemory)
 for i,v in ipairs({${SIMULATION_SEED.join(',')}})do if emu.read16(0x0ccf+(i-1)*2,mem)~=v then emu.stop(110+i);return end end
 injected=true
end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,`rng-${iterations}-${maximum??'raw'}.lua`);fs.writeFileSync(file,script);
const started=Date.now();const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=10',file,rom],{windowsHide:true,stdio:'ignore'});const timer=setTimeout(()=>{p.kill();reject(Error('Reference runner exceeded15 seconds'));},15000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',value=>{clearTimeout(timer);resolve(value);});});
const result={routine:maximum===null?'CODE_03907E':'CODE_039035',maximum,calls:iterations,boundedValuesCompared:bounded.length,stateWordsCompared:iterations*7,romSHA256:romHash,mesenSHA256:sha256(exe),fixture:{directPage:0x1800,dataBank:3,stack:0x1eff,status:4,interrupts:false,seed:SIMULATION_SEED},expectedFirstWords:states.slice(0,8).map(row=>row[0]),expectedFinalState:state,exitCode:code,elapsedMs:Date.now()-started};
console.log(JSON.stringify(result));if(code!==0)process.exitCode=1;else fs.writeFileSync(path.join(root,maximum===null?'research/reference-rng.json':`research/reference-bounded-${maximum}.json`),JSON.stringify(result,null,2)+'\n');
