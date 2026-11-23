import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';import {faxAppearance} from '../src/rom-fax.js';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'output/fax-reference-v53'),exe=path.join(out,'mesen/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
assert.equal(hash(rom),JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256);if(!fs.existsSync(exe))throw Error('Run reference-fax-frames.mjs first');
const script=`local mem=emu.memType.snesWorkRam;local bus=emu.memType.snesMemory;local injected=false;local rows={};local cases={{9,1,0},{10,2,0},{11,2,62}};local n=1;local selected=0
local function write()local f=assert(io.open(${JSON.stringify(path.join(out,'animation-all.json').replaceAll('\\','/'))},'wb'));f:write('['..table.concat(rows,',')..']');f:close()end
local function setup()
 emu.write(0x4200,0,bus);emu.write(0x420c,0,bus);emu.write(0x2100,0x8f,bus);emu.write(0x2115,0x80,bus);for a=0,0x7fff do emu.write(a,0,mem)end;for a=0,15 do emu.write(0x700000+a,0,bus)end
 for a,v in pairs({[0x3e]=3,[0x40]=0,[0x14]=19,[0xd87]=cases[n][2],[0x42]=cases[n][3]})do emu.write16(a,v,mem)end
 emu.write(0xb3,0x81,mem);emu.write(0xb1,0x81,mem);emu.write(0x5f,0x8f,mem);selected=0
 for i,v in ipairs({0x22,0x83,0xd2,0x03,0xcb,0x80,0xfd})do emu.write(0x1000+i-1,v,mem)end
 local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s);emu.write(0x4200,0x81,bus)
end
emu.addMemoryCallback(function()if injected then selected=emu.read16(0x40,mem)end end,emu.callbackType.exec,0x03df49,0x03df49)
emu.addMemoryCallback(function()
 if not injected or emu.read(0x62,mem)~=0x42 then return end
 rows[#rows+1]=string.format('[%d,%d,%d,%d,%d,%d,%d]',n,selected,emu.read(0x5f,mem),emu.read16(0x18,mem),emu.read16(0x1c,mem),emu.read16(0x14,mem),emu.getState()['ppu.frameCount'])
 if #rows>450 then write();emu.stop(99);return end
 if emu.read16(0x18,mem)==0 then if n==3 then write();emu.stop(0)else n=n+1;setup()end end
end,emu.callbackType.exec,0x00833a,0x00833a)
emu.addMemoryCallback(function()if injected then return end;injected=true;setup()end,emu.callbackType.exec,0,0xffffff)`;
const file=path.join(out,'animation-all.lua');fs.writeFileSync(file,script);
const exitCode=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=15',file,rom],{windowsHide:true,stdio:'ignore'}),t=setTimeout(()=>{p.kill();reject(Error('Fax animation reference timeout'));},20000);p.on('error',e=>{clearTimeout(t);reject(e);});p.on('exit',c=>{clearTimeout(t);resolve(c);});});assert.equal(exitCode,0);
const rows=JSON.parse(fs.readFileSync(path.join(out,'animation-all.json'))),cases=[];
for(let c=1;c<=3;c++){const states=rows.filter(r=>r[0]===c);assert.equal(states.length,138);for(let frame=0;frame<states.length;frame++){const r=states[frame],state=faxAppearance(frame);assert.equal(r[1],c+8);assert.equal(r[2],state.display);assert.equal(r[3],state.scroll&65535);assert.equal(r[4],state.scroll&65535);assert.equal(r[5],state.menu);assert.equal(r[6]-states[0][6],frame);}cases.push({screen:c+8,states:states.map(r=>r.slice(2))});}
const report={routine:'03D283 -> 03E2DF/03DF49 -> 008E43 -> 03E344/059FBB; NMI 00833A',scope:'Original complete menu path, COP waits, decompression, fade and feed. Controlled RAM entry; first loaded-scene NMI is frame zero, not natural city/boot command phase.',romSHA256:hash(rom),mesenSHA256:hash(exe),frames:rows.length,valuesCompared:rows.length*5+(rows.length-3),cases,exitCode};
fs.writeFileSync(path.join(root,'research/reference-fax-animation-v0.2.53.json'),JSON.stringify(report,null,2)+'\n');console.log({frames:report.frames,valuesCompared:report.valuesCompared,exitCode});
