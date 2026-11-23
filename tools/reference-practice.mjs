import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';
import {PRACTICE_DATES,PRACTICE_MESSAGES,stepPracticeLesson} from '../src/rom-practice.js';
import {PRACTICE_LESSONS} from '../src/practice-lessons.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),bytes=fs.readFileSync(rom),romSHA256=hash(rom),off=a=>(a>>>16&127)*32768+(a&32767),words=(a,n)=>Array.from({length:n},(_,i)=>bytes.readUInt16LE(off(a)+i*2));
if(romSHA256!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const tables={years:words(0x03c4dc,6),months:words(0x03c4e8,6),messages:words(0x03c4f4,6)};
if(JSON.stringify(PRACTICE_DATES)!==JSON.stringify(tables.years.map((year,i)=>[year,tables.months[i]]))||JSON.stringify([...PRACTICE_MESSAGES,38])!==JSON.stringify(tables.messages))throw Error('Practice table mismatch');
const textChecks=PRACTICE_LESSONS.map(l=>{const address=0x0f0000+words(0x0fa800+l.id*2,1)[0],start=off(address),raw=bytes.subarray(start,bytes.indexOf(255,start)).toString('ascii'),text=l.rows.join('');if(text!==raw||parseInt(l.address,16)!==address||l.text!==l.rows.map(row=>row.trim().replaceAll('*',"'")).join(' ').replace(/\s+/g,' ').trim())throw Error('Original lesson text mismatch '+l.id);return {id:l.id,address:l.address,bytes:raw.length,sha256:crypto.createHash('sha256').update(raw).digest('hex')};});
const cases=[];function add(year,month,stage,input={}){input={population:30000,mode:1,messagePending:false,messageBusy:false,...input};cases.push({year,month,stage,input,expected:stepPracticeLesson(year,month,stage,input)});}
for(let stage=0;stage<=6;stage++)for(const[year,month]of[[1899,12],[1900,1],[1900,5],[1900,6],[1900,10],[1900,11],[1900,12],[1901,1],[1901,5],[1901,6],[1904,12],[1905,1],[1950,12]])for(const population of[0,29999,30000,30001,65536,0xffffffff])for(const flags of[{}, {messagePending:true},{messageBusy:true}])add(year,month,stage,{population,...flags});
for(const mode of[0,2,3])for(let stage=0;stage<=6;stage++)add(1950,1,stage,{mode});
const fixtures=cases.map(c=>`{year=${c.year},month=${c.month},stage=${c.stage},population=${c.input.population},mode=${c.input.mode},pending=${c.input.messagePending?1:0},busy=${c.input.messageBusy?1:0},nextStage=${c.expected.stage},message=${c.expected.messageId??0x7777},flag=${c.expected.messageId!==null?1:c.input.messagePending?1:0},history=${c.expected.historyId??65535}}`).join(',');
const script=`local fixtures={${fixtures}};local n=0;local injected=false;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=fixtures[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 for a,v in pairs({[0x3e]=c.mode,[0xb53]=c.year,[0xb55]=c.month,[0xcc7]=c.stage,[0x395]=c.pending,[0x397]=0x7777,[0xd7]=c.busy,[0xba5]=c.population%65536,[0xba7]=math.floor(c.population/65536)})do emu.write16(a,v,mem)end
 for a=0xced,0xd27,2 do emu.write16(a,65535,mem)end
 for i,v in ipairs({0x20,0x74,0xc4,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=fixtures[n]
 for i,p in ipairs({{0xcc7,c.nextStage},{0x397,c.message},{0x395,c.flag},{0xced,c.history}})do if emu.read16(p[1],mem)~=p[2]then emu.stop(100000+n*8+i);return end end
 if c.history==1 and (emu.read16(0xcef,mem)~=c.year or emu.read16(0xcf1,mem)~=c.month)then emu.stop(100000+n*8+5);return end
 if n==#fixtures then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if not injected then injected=true;n=1;setup(n)end end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'practice-fixtures.lua');fs.writeFileSync(file,script);
const exitCode=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=30',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Practice reference timeout'));},35000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});
const valuesCompared=cases.reduce((n,c)=>n+4+(c.expected.historyId===1?2:0),0);console.log({cases:cases.length,valuesCompared,textChecks:textChecks.length,exitCode});if(exitCode===0)fs.writeFileSync(path.join(root,'research/reference-practice.json'),JSON.stringify({routine:'CODE_03C474',scope:'Controlled original Practice worker execution: stage, Wright message/flag and history entry/date. Seven complete original text pointer/byte checks. Browser presentation and global scheduler are separate.',romSHA256,mesenSHA256:hash(exe),tables,textChecks,valuesCompared,cases,exitCode},null,2)+'\n');else process.exitCode=1;
