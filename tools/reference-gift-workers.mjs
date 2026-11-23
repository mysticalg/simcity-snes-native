import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';import {updateRomGiftCenter} from '../src/rom-gift-worker.js';import {romGiftEffects} from '../src/rom-gifts.js';
const root=path.resolve(import.meta.dirname,'..'),work=path.resolve(root,'../../work/tools/mesen2'),exe=path.join(work,'app/Mesen.exe'),rom=path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),romHash=sha(fs.readFileSync(rom));if(romHash!==JSON.parse(fs.readFileSync('assets/manifest.json')).romSHA256)throw Error('Wrong ROM');
const flags=JSON.parse(fs.readFileSync('assets/tables/city.json')).flags,indices=Array.from({length:9},(_,n)=>(49+Math.floor(n/3))*120+59+n%3),cases=[];
for(const id of [0x2bf,0x2c8,0x2d1,0x2da,0x2e3,0x2ec,0x2f5,0x2fe,0x319,0x322,0x32b,0x334,0x33d,0x346,0x34f])for(const prefix of [0,0x4000,0x8000,0xc000])for(const pending of [0,1,4,65535])for(const baseStep of [0,1])for(const damage of ['intact','empty','fire']){
 const map=new Uint16Array(12000);indices.forEach((i,n)=>map[i]=(id-4+n)|(n%2?0:32768)|(n===8?16384:0));map[indices[4]]=id|prefix;if(damage!=='intact'){map[indices[0]]=0x8000;map[indices[8]]=0x4000;}if(damage==='fire')map[indices[1]]=0x7f;const input=indices.map(i=>map[i]),result=updateRomGiftCenter(map,60,50,pending,{baseStep}),expected=indices.map(i=>map[i]);cases.push({id,prefix,pending,baseStep,damage,input,result,expected,income:romGiftEffects(map,flags).income,bank:id===0x2e3?1:0});
}
const rows=cases.map(c=>`{input={${c.input}},id=${c.id},pending=${c.pending},baseStep=${c.baseStep},expected={${c.expected}},remaining=${c.result.pending},income=${c.income},bank=${c.bank}}`).join(',');
const script=`local cases={${rows}};local indices={${indices}};local mem=emu.memType.snesWorkRam;local n=0;local injected=false
local function setup(index)
 for at=0,0x1fff do emu.write(at,0,mem)end;local c=cases[index];local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 for j,v in ipairs(c.input)do emu.write16(0x10200+indices[j]*2,v,mem)end;emu.write16(0xb85,60+50*256,mem);emu.write16(0xb87,c.input[5],mem);emu.write16(0xb89,c.id,mem);emu.write16(0xb51,c.baseStep,mem);emu.write16(0x1800,6060*2+2,mem);emu.write16(0xcc9,c.pending,mem)
 for j,v in ipairs({0x20,0x25,0xae,0xea})do emu.write(0x1000+j-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n];for j,v in ipairs(c.expected)do if emu.read16(0x10200+indices[j]*2,mem)~=v then emu.stop(100000+n*32+j);return end end
 if emu.read16(0xcc9,mem)~=c.remaining then emu.stop(200000+n);return end;if emu.read16(0xddd,mem)~=c.income then emu.stop(300000+n);return end;if emu.read16(0xca3,mem)~=c.bank then emu.stop(400000+n);return end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if injected then return end;n=1;injected=true;setup(n)end,emu.callbackType.exec,0,0xffffff)
`;
const file=path.join(work,'gift-worker-fixtures.lua');fs.writeFileSync(file,script);const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=20',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Gift worker reference exceeded25seconds'));},25000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});
console.log({cases:cases.length,exitCode:code,diagnostic:code?cases[Math.floor((code%100000)/32)-1]:null});if(code)process.exitCode=1;else fs.writeFileSync('research/reference-gift-workers.json',JSON.stringify({routines:['CODE_03AE25','CODE_03AEA1','CODE_039940'],scope:'1440 controlled native gift-worker calls. All nine map words, promotion flag, source special income and bank count. No natural calendar/UI parity claim.',indices,romSHA256:romHash,mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode:code},null,2)+'\n');
