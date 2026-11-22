import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';import {pollRomProblems,pollRomApproval} from '../src/rom-evaluation.js';import {SIMULATION_SEED,nextSimulationWord,boundSimulationWord} from '../src/rom-random.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');const hash=sha(fs.readFileSync(rom));if(hash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const cases=[];for(const score of [0,500,714,1000])for(const problems of [Array(7).fill(0),Array(7).fill(255),[0,0,0,70,0,0,0],[250,50,100,200,300,255,50]])for(const seed of [SIMULATION_SEED,Array(7).fill(65535)]){
 const state=[...seed],next=max=>boundSimulationWord(nextSimulationWord(state),max),survey=pollRomProblems(problems,next),approval=pollRomApproval(score,next);cases.push({score,problems,seed:[...seed],survey,approval,rng:state});
}
const lua=cases.map(c=>`{score=${c.score},problems={${c.problems}},seed={${c.seed}},votes={${c.survey.votes}},worst={${c.survey.worst.map(v=>v.id)}},worstVotes={${c.survey.worst.map(v=>v.votes)}},approval={${c.approval.approve},${c.approval.disapprove}},rng={${c.rng}}}`).join(',');
const script=`local cases={${lua}};local n=0;local injected=false;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 emu.write16(0xded,c.score,mem);for i=0,7 do emu.write16(0xbd1+i*2,c.problems[i+1]or 0,mem)end;for i,v in ipairs(c.seed)do emu.write16(0xccf+(i-1)*2,v,mem)end
 for i,v in ipairs({0x20,0x27,0xb6,0xa2,0,0,0x20,0xc8,0xb5,0x20,0x24,0xb8,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n]
 for i,v in ipairs(c.votes)do if emu.read16(0xbf1+(i-1)*2,mem)~=v then emu.stop(100000+n*32+i);return end end
 for i,v in ipairs(c.worst)do if emu.read(0xdf3+i-1,mem)~=v or emu.read(0xdf7+i-1,mem)~=c.worstVotes[i]then emu.stop(200000+n*8+i);return end end
 if emu.read16(0xddf,mem)~=c.approval[1]or emu.read16(0xde1,mem)~=c.approval[2]then emu.stop(300000+n);return end
 for i,v in ipairs(c.rng)do if emu.read16(0xccf+(i-1)*2,mem)~=v then emu.stop(400000+n*8+i);return end end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x03100c,0x03100c)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'poll-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=10',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},15000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log(JSON.stringify({cases:cases.length,exitCode:code}));if(code===0)fs.writeFileSync(path.join(root,'research/reference-polls.json'),JSON.stringify({routines:['CODE_03B627','CODE_03B5C8','CODE_03B824'],valuesCompared:cases.length*25,romSHA256:hash,mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
