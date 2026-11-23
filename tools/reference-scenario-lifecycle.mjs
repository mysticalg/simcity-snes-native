import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';
import {SCENARIO_IDS,SCENARIO_DEADLINES,SCENARIO_EVENT_COUNTS,SCENARIO_REMINDER_CODES,stepScenarioProgress,stepScenarioEvent} from '../src/rom-scenarios.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),romBytes=fs.readFileSync(rom),romSHA256=hash(rom);
if(romSHA256!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const words=(address,count)=>Array.from({length:count},(_,n)=>romBytes.readUInt16LE((address>>>16&127)*32768+(address&32767)+n*2));
const tables={deadlines:words(0x03c5b3,7),thresholds:words(0x03c5c3,6),reminders:words(0x03c5db,5),eventCounts:words(0x03cec9,7)};
for(const[id,n]of SCENARIO_IDS.map((id,n)=>[id,n]))if(tables.deadlines[n]!==SCENARIO_DEADLINES[id]||tables.eventCounts[n]!==SCENARIO_EVENT_COUNTS[id])throw Error('Scenario table mismatch');if(JSON.stringify(tables.thresholds)!==JSON.stringify([5,4,3,2,1,0])||JSON.stringify(tables.reminders)!==JSON.stringify(SCENARIO_REMINDER_CODES))throw Error('Reminder table mismatch');
const cases=[];function progress(id,year,stage,options={}){const input={category:4,traffic:79,crime:59,score:500,mode:3,messageBusy:false,newsBusy:false,drawBusy:false,...options};cases.push({kind:'progress',id,scenario:SCENARIO_IDS.indexOf(id),year,stage,input,expected:stepScenarioProgress(id,year,stage,input)});}
for(const id of SCENARIO_IDS){const deadline=SCENARIO_DEADLINES[id];for(let stage=0;stage<6;stage++){for(const delta of[-1,0,1])for(const messageBusy of[false,true])progress(id,deadline-(5-stage)+delta,stage,{messageBusy});progress(id,deadline-(5-stage),stage,{newsBusy:true});}for(const mode of[1,2])progress(id,deadline,5,{mode});for(const category of[0,3,4,5])for(const change of[{}, {traffic:80},{crime:60},{score:499}])progress(id,deadline,5,{category,...change});progress(id,deadline-5,0,{drawBusy:true});}
for(const id of SCENARIO_IDS)for(const remaining of[0,1,2,15,16,17,255,256,257,258,383,384,385,65535])for(const population of[0,84999,85000,0xffffffff])cases.push({kind:'event',id,scenario:SCENARIO_IDS.indexOf(id),remaining,population,expected:stepScenarioEvent(id,remaining,population)});
const eventIds={Earthquake:1,Monster:2,Meltdown:3,Flood:4,UFO:5};
const fixtures=cases.map(c=>c.kind==='progress'?`{kind=1,scenario=${c.scenario},year=${c.year},stage=${c.stage},mode=${c.input.mode},category=${c.input.category},traffic=${c.input.traffic},crime=${c.input.crime},score=${c.input.score},busy=${c.input.messageBusy?1:0},news=${c.input.newsBusy?1:0},draw=${c.input.drawBusy?1:0},nextStage=${c.expected.stage},notice=${c.expected.notice??-1},outcome=${c.expected.outcome==='won'?2:c.expected.outcome==='lost'?1:0}}`:`{kind=2,scenario=${c.scenario},remaining=${c.remaining},population=${c.population},nextRemaining=${c.expected.remaining},event=${eventIds[c.expected.event]||0}}`).join(',');
const script=`local fixtures={${fixtures}};local n=0;local injected=false;local notice=-1;local event=0;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=fixtures[index];notice=-1;event=0;local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 emu.write16(0x40,c.scenario,mem)
 if c.kind==1 then
  for address,value in pairs({[0x3e]=c.mode,[0xb53]=c.year,[0xccb]=c.stage,[0xdeb]=c.category,[0xc05]=c.traffic,[0xc01]=c.crime,[0xded]=c.score,[0xd7]=c.busy,[0xab5]=c.news,[0x387]=c.draw,[0x381]=65535,[0x389]=0,[0xd87]=0,[0x6]=0})do emu.write16(address,value,mem)end
  for i,v in ipairs({0x20,0x00,0xc5,0xea})do emu.write(0x1000+i-1,v,mem)end
 else
  emu.write16(0xc0d,c.remaining,mem);emu.write16(0xba5,c.population%65536,mem);emu.write16(0xba7,math.floor(c.population/65536),mem)
  for i,v in ipairs({0x20,0x6f,0xb9,0xea})do emu.write(0x1000+i-1,v,mem)end
 end
 emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()if injected and fixtures[n].kind==1 then notice=emu.getState()['cpu.a']end end,emu.callbackType.exec,0x03c030,0x03c030)
for address,id in pairs({[0x03baf5]=1,[0x03ba47]=2,[0x03bac1]=3,[0x03bc0b]=4,[0x03bcb8]=5})do emu.addMemoryCallback(function()if not injected or fixtures[n].kind~=2 then return end;event=id;local s=emu.getState();local stack=s['cpu.sp'];s['cpu.pc']=emu.read16(stack+1,mem)+1;s['cpu.sp']=stack+2;emu.setState(s)end,emu.callbackType.exec,address,address)end
emu.addMemoryCallback(function()
 if not injected then return end;local c=fixtures[n]
 if c.kind==1 then
  if emu.read16(0xccb,mem)~=c.nextStage then emu.stop(100000+n*8+1);return end
  if emu.read16(0xd87,mem)~=c.outcome then emu.stop(100000+n*8+2);return end
  if notice~=c.notice then emu.stop(100000+n*8+3);return end
 else
  if emu.read16(0xc0d,mem)~=c.nextRemaining then emu.stop(200000+n*8+1);return end
  if event~=c.event then emu.stop(200000+n*8+2);return end
 end
 if n==#fixtures then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if not injected then injected=true;n=1;setup(n)end end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'scenario-lifecycle-fixtures.lua');fs.writeFileSync(file,script);
const exitCode=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=30',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Scenario reference timeout'));},35000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});
const progressCases=cases.filter(c=>c.kind==='progress').length,eventCases=cases.length-progressCases,valuesCompared=progressCases*3+eventCases*2;console.log({progressCases,eventCases,valuesCompared,exitCode});if(exitCode===0)fs.writeFileSync(path.join(root,'research/reference-scenario-lifecycle.json'),JSON.stringify({routines:['CODE_03C500','CODE_03B96F'],scope:'Controlled scenario-stage/attempted-notice/outcome and scripted event/countdown comparisons. Event handlers intercepted at entry; disaster effects, global notification routing and natural full-loop timing are separate.',romSHA256,mesenSHA256:hash(exe),tables,valuesCompared,cases,exitCode},null,2)+'\n');else process.exitCode=1;
