import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';
import {nextCoreMilestone} from '../src/rom-gifts.js';
const root=path.resolve(import.meta.dirname,'..'),work=path.resolve(root,'../../work/tools/mesen2'),exe=path.join(work,'app/Mesen.exe'),rom=path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const romHash=sha(fs.readFileSync(rom));if(romHash!==JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'))).romSHA256)throw Error('Wrong ROM');
const fields={population:[0xca5,2],mayorHouse:[0xca7,2],bank:[0xca9,2],amusementRoads:[0xcab,1],amusementFacilities:[0xcac,1],zoo:[0xcad,1],zooDelay:[0xcae,1],landfillSpace:[0xcaf,1],landfillPopulation:[0xcb0,1],police:[0xcb1,2],fire:[0xcb3,2],library:[0xcb5,2],cityPark:[0xcb7,2],rail:[0xcb9,2],windmill:[0xcbb,2],mario:[0xcbd,2],exposition:[0xcbf,2],fountain:[0xcc1,2],capitalModel:[0xcc3,2],highPopulation:[0xcc5,2],mayorUpgradePending:[0xcc9,2]};
const defaults={population:0,category:1,police:0,fire:0,rail:0,inventorySize:0,funds:20000,roads:0,hospitals:0,schools:0,stadiums:0,emptyLand:12000,parks:0,developedZones:0,banks:0,airports:0,seaports:0,year:1900};
const base=()=>({population:5,mayorHouse:true,capitalModel:true,highPopulation:true}),cases=[];
function add(name,args={},state=base()){const input={...defaults,...args},before=structuredClone(state),after=structuredClone(state),event=nextCoreMilestone(input,after);cases.push({name,input,before,after,message:event?.message||0,gift:event?.gift??null});}
for(const [key,param,limits] of [['amusementRoads','roads',[300,400,500]],['amusementFacilities','schools',[6,10]],['police','police',[6,12,18]],['fire','fire',[6,12,18]],['library','schools',[3,6,9]],['cityPark','parks',[300,600,900]],['rail','rail',[500,2000]],['windmill','developedZones',[150,500]]])for(const [stage,threshold] of limits.entries())for(const delta of [-1,0,1]){const p={...base(),[key]:stage};if(key==='library')p.amusementFacilities=2;if(key==='amusementFacilities')p.library=3;add(key+' stage'+stage+' '+delta,{[param]:threshold+delta},p);}
for(const [stage,threshold] of [150,100,50,30].entries())for(const value of [0,threshold-1,threshold,threshold+1])add('reclaim empty stage'+stage+' '+value,{emptyLand:value},{...base(),landfillSpace:stage});
for(const [stage,threshold] of [200000,250000,300000,400000,450000].entries())for(const delta of [-1,0,1])add('reclaim population stage'+stage+' '+delta,{population:threshold+delta},{...base(),landfillPopulation:stage});
for(const category of [0,1,2])for(const funds of [1999,2000,2001])add('bank '+category+'/'+funds,{category,funds});
for(const banks of [0,1])add('bank followup '+banks,{banks},{...base(),bank:1});
for(const stadiums of [0,1,2,3])for(const stage of [0,1,2])add('zoo start '+stadiums+'/'+stage,{stadiums},{...base(),zoo:stage});
for(const delay of [24,2,1])for(const full of [false,true])add('zoo countdown '+delay+'/'+full,{stadiums:1,inventorySize:full?4:0},{...base(),zoo:1,zooDelay:delay});
for(const category of [0,1,2,3,4,5])for(const size of [0,3,4])add('capacity '+category+'/'+size,{category,inventorySize:size,police:6});
for(const category of [1,2,5])for(const airports of [0,1])for(const seaports of [0,1])add('expo '+category+'/'+airports+'/'+seaports,{category,airports,seaports});
for(const year of [1949,1950,1951])add('fountain '+year,{year});
for(const category of [2,3])for(const full of [false,true])add('capital model '+category+'/'+full,{category,inventorySize:full?4:0},{...base(),capitalModel:false});
for(const practice of [false,true])for(const population of [99999,100000,599999,600000])add('high population '+practice+'/'+population,{practice,population,inventorySize:4},{...base(),highPopulation:false});
for(const scriptedScenario of [false,true])add('scenario mode '+scriptedScenario,{scriptedScenario,police:6});
for(const [stage,threshold] of [2000,10000,50000,100000,500000].entries())for(const delta of [-1,0,1])add('promotion '+stage+'/'+delta,{population:threshold+delta,inventorySize:4},{...base(),population:stage});
for(const pending of [0,1,65535])for(const population of [1999,2000])add('promotion carry '+pending+'/'+population,{population},{...base(),population:0,mayorUpgradePending:pending});
add('mayor house',{},{...base(),mayorHouse:false});
const rows=cases.map(c=>{
 const writes=[[0x3e,c.input.scriptedScenario?3:c.input.practice?1:0,2],[0xdeb,c.input.category,2],[0xba5,c.input.population&65535,2],[0xba7,Math.floor(c.input.population/65536),1],[0xb9d,c.input.funds&65535,2],[0xb9f,Math.floor(c.input.funds/65536),1],[0xb53,c.input.year,2]];
 for(const [key,addr] of Object.entries({police:0xe07,fire:0xe09,rail:0xe17,roads:0xe15,hospitals:0xe03,schools:0xe05,stadiums:0xe0b,emptyLand:0xe27,parks:0xe23,developedZones:0xe1b,banks:0xca3,airports:0xe13,seaports:0xe11}))writes.push([addr,c.input[key],2]);
 for(let i=0;i<c.input.inventorySize;i++)writes.push([0x3f5+i,1,1]);
 for(const [key,[addr,size]]of Object.entries(fields))writes.push([addr,Number(c.before[key]||0),size]);
 const expected=Object.entries(fields).map(([key,[addr,size]])=>[addr,Number(c.after[key]||0),size]);
 return `{writes={${writes.map(v=>'{'+v+'}')}},expected={${expected.map(v=>'{'+v+'}')}},message=${c.message}}`;
}).join(',');
const script=`local cases={${rows}};local n=0;local injected=false;local mem=emu.memType.snesWorkRam
local function setup(index)
 for at=0,0x1fff do emu.write(at,0,mem)end
 local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 for _,v in ipairs(cases[index].writes)do if v[3]==1 then emu.write(v[1],v[2],mem)else emu.write16(v[1],v[2],mem)end end
 for i,v in ipairs({0x20,0xad,0xc0,0xea})do emu.write(0x1000+i-1,v,mem)end;emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end;local c=cases[n];local message=emu.read16(0x397,mem);if message~=c.message then emu.stop(1000000+n*256+message);return end
 for j,v in ipairs(c.expected)do local actual=0;if v[3]==1 then actual=emu.read(v[1],mem)else actual=emu.read16(v[1],mem)end;if actual~=v[2]then emu.stop(2000000+n*256+j);return end end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031003,0x031003)
emu.addMemoryCallback(function()if injected then return end;n=1;injected=true;setup(n)end,emu.callbackType.exec,0,0xffffff)
`;
const file=path.join(work,'gift-fixtures.lua');fs.writeFileSync(file,script);
const code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=35',file,rom],{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{p.kill();reject(Error('Gift reference exceeded45seconds'));},45000);p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});
const group=Math.floor(code/1000000),index=Math.floor((code%1000000)/256),detail=code%256;
console.log({cases:cases.length,exitCode:code,diagnostic:code?{group,index,detail,case:cases[index-1]}:null});
if(code)process.exitCode=1;else fs.writeFileSync(path.join(root,'research/reference-gifts.json'),JSON.stringify({routines:['CODE_03C0AD','CODE_03C0FA','CODE_03C131..03C424'],scope:'Controlled gift-dispatch calls: message ID and all21 progress fields. UI gift-choice completion and construction not included.',romSHA256:romHash,mesenSHA256:sha(fs.readFileSync(exe)),cases,exitCode:code},null,2)+'\n');
