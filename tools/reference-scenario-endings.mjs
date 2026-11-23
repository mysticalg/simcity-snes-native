import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';
import {scenarioEnding,SCENARIO_CLEAR_BITS} from '../src/rom-scenario-ending.js';import {SCENARIO_ENDING_TEXT} from '../src/scenario-ending-text.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),bytes=fs.readFileSync(rom),off=a=>(a>>>16&127)*32768+(a&32767),romSHA256=hash(rom);
if(romSHA256!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const table=SCENARIO_CLEAR_BITS.map((_,i)=>bytes.readUInt16LE(off(0x03e334)+i*2));if(JSON.stringify(table)!==JSON.stringify(SCENARIO_CLEAR_BITS))throw Error('Clear-bit table mismatch');
const decode=n=>n===1023?' ':n<26?String.fromCharCode(65+n):n>=0x290&&n<=0x2a9?String.fromCharCode(65+n-0x290):n>=0x2c0&&n<=0x2d9?String.fromCharCode(97+n-0x2c0):({30:"'",44:'!',29:'!',684:',',685:'.',686:"'",700:'!'})[n];
const textChecks=SCENARIO_ENDING_TEXT.map(text=>{const file=path.join(root,text.path),b=fs.readFileSync(file),lines=[];if(hash(file)!==text.sha256)throw Error('Fax tilemap changed');for(let y=0;y<32;y++){let line='';for(let x=0;x<32;x++){const n=b.readUInt16LE((y*32+x)*2)&1023,c=decode(n);if(c===undefined)throw Error('Unknown fax glyph '+n);line+=c;}if(line.trim())lines.push({row:y,text:line.trim()});}if(JSON.stringify(lines)!==JSON.stringify(text.lines)||text.title!==lines[0].text||text.text!==lines.slice(1).map(l=>l.text).join(' '))throw Error('Fax text mismatch');return {screen:text.screen,path:text.path,sha256:text.sha256,lines:lines.length};});
const cases=[];function add(flags,index,outcome,mode=3){cases.push({flags,index,outcome,mode,expected:scenarioEnding(flags,index,outcome,{mode})});}
for(let flags=0;flags<64;flags++)for(let index=0;index<8;index++)for(const outcome of[1,2])add(flags,index,outcome);
for(const flags of[0x8000,0x803f,0xffff,0x4000,0x5500,0xff00,0x00c0,0x807f])for(let index=0;index<8;index++)for(const outcome of[0,1,2,3])for(const mode of[0,1,2,3])add(flags,index,outcome,mode);
const fixtures=cases.map(c=>`{flags=${c.flags},index=${c.index},outcome=${c.outcome},mode=${c.mode},nextFlags=${c.expected.flags},screen=${c.expected.screen},music=${c.expected.music}}`).join(',');
const script=`local fixtures={${fixtures}};local n=0;local injected=false;local screen=0;local mem=emu.memType.snesWorkRam;local bus=emu.memType.snesMemory
local function setup(index)
 local c=fixtures[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s);screen=0
 for a,v in pairs({[0x3e]=c.mode,[0x40]=c.index,[0x42]=c.flags,[0xd87]=c.outcome})do emu.write16(a,v,mem)end
 for a=0,15 do emu.write(0x700000+a,(a*19+7)%256,bus)end
 for i,v in ipairs({0x20,0xdf,0xe2,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,bus)
end
emu.addMemoryCallback(function()
 if not injected then return end;screen=emu.read16(0x40,mem);local s=emu.getState();local stack=s['cpu.sp'];s['cpu.pc']=emu.read16(stack+1,mem)+1;s['cpu.sp']=stack+2;emu.setState(s)
end,emu.callbackType.exec,0x03df49,0x03df49)
emu.addMemoryCallback(function()
 if not injected then return end;local c=fixtures[n]
 local sum=0;for a=0,13 do sum=sum+emu.read(0x700000+a,bus)end
 local checks={{emu.read16(0x42,mem),c.nextFlags},{screen,c.screen},{emu.read(3,mem),c.music},{emu.read16(0x40,mem),c.index},{emu.read16(0x700007,bus),c.nextFlags},{emu.read16(0x70000e,bus),sum}}
 for a=0,15 do table.insert(checks,{emu.read(0x707ff0+a,bus),emu.read(0x700000+a,bus)})end
 for i,p in ipairs(checks)do if p[1]~=p[2]then emu.stop(100000+n*32+i);return end end
 if n==#fixtures then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if not injected then injected=true;n=1;setup(n)end end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'scenario-ending-fixtures.lua');fs.writeFileSync(file,script);
const exitCode=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=30',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Ending reference timeout'));},35000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});
console.log({cases:cases.length,valuesCompared:cases.length*22,textChecks:textChecks.length,exitCode});if(exitCode===0)fs.writeFileSync(path.join(root,'research/reference-scenario-endings.json'),JSON.stringify({routine:'CODE_03E2DF',scope:'Original clear flags, selected fax, music command, restored scenario ID, SRAM word/checksum and mirrored header. Checksum/mirror children execute; fax renderer intercepted at entry. Text checked against extracted original tilemaps, not a settled PPU capture.',romSHA256,mesenSHA256:hash(exe),table,textChecks,valuesCompared:cases.length*22,cases,exitCode},null,2)+'\n');else process.exitCode=1;
