import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';import {romCommercialRate,commercialLocalScore,industrialLocalScore} from '../src/rom-commercial.js';
const root=path.resolve(import.meta.dirname,'..'),work=process.env.REFERENCE_WORK||path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');const hash=sha(fs.readFileSync(rom));if(hash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const cases=[];for(const center of [[30,25],[0,0],[59,49],[60,50],[15,12],[255,255],[128,128]])for(const coordinate of [[0,0],[7,7],[8,8],[119,99],[60,50]])for(const transport of [0,1]){
 const rates=romCommercialRate(...center);cases.push({center,coordinate,transport,rates:Array.from(rates),expected:[commercialLocalScore(rates,...coordinate,transport)&65535,industrialLocalScore(transport)&65535]});
}
const lua=cases.map(c=>`{center={${c.center}},coordinate={${c.coordinate}},transport=${c.transport},rates={${c.rates.map(v=>v&65535)}},expected={${c.expected}}}`).join(',');
const script=`local cases={${lua}};local n=0;local injected=false;local mem=emu.memType.snesWorkRam
local function setup(index)
 local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 emu.write(0xbab,c.center[1],mem);emu.write(0xbac,c.center[2],mem);emu.write16(0xb85,c.coordinate[1]+c.coordinate[2]*256,mem)
 local program={0x20,0x4b,0xa2,0xc2,0x20,0xa9,c.transport,0,0x20,0x0e,0x9a,0x8d,0,0x17,0xa9,c.transport,0,0x20,0x31,0x9a,0x8d,2,0x17,0xea}
 for i,v in ipairs(program)do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n]
 for i,v in ipairs(c.rates)do if emu.read16(0x1b47a+(i-1)*2,mem)~=v then emu.stop(100000+n*256+i);return end end
 for i,v in ipairs(c.expected)do if emu.read16(0x1700+(i-1)*2,mem)~=v then emu.stop(200000+n*4+i);return end end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031017,0x031017)
emu.addMemoryCallback(function()if injected then return end;n=1;setup(n);injected=true end,emu.callbackType.exec,0,0xffffff)
`;
fs.mkdirSync(work,{recursive:true});const file=path.join(work,'commercial-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=10',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Reference timeout'));},15000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});console.log(JSON.stringify({cases:cases.length,exitCode:code}));if(code===0)fs.writeFileSync(path.join(root,'research/reference-commercial.json'),JSON.stringify({routines:['CODE_03A24B','CODE_039A0E','CODE_039A31'],valuesCompared:cases.length*197,romSHA256:hash,mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode:code},null,2)+'\n');else process.exitCode=1;
