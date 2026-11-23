import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn} from 'node:child_process';
import {City} from '../src/simulation.js';import {stampZoneFootprint,mergeResidentialZone,updateCommercialFootprint} from '../src/rom-growth.js';import {SIMULATION_SEED} from '../src/rom-random.js';import {romPopulation} from '../src/rom-population.js';
const root=path.resolve(import.meta.dirname,'..'),work=path.resolve(root,'../../work/tools/mesen2'),exe=process.env.MESEN_EXE||path.join(work,'app/Mesen.exe'),rom=process.env.SIMCITY_ROM||path.resolve(root,'../../work/extracted/SimCity (USA).sfc'),bytes=fs.readFileSync(rom),hash=b=>crypto.createHash('sha256').update(b).digest('hex');if(hash(bytes)!==JSON.parse(fs.readFileSync('assets/manifest.json')).romSHA256)throw Error('Wrong ROM');
const build=JSON.parse(fs.readFileSync('assets/tables/build.json')),flags=JSON.parse(fs.readFileSync('assets/tables/city.json')).flags,rle=map=>{const out=[];for(const n of map)if(out.at(-1)?.[1]===n)out.at(-1)[0]++;else out.push([1,n]);return out;};
const layouts=[];const add=(name,make)=>layouts.push({name,make});
add('empty lots',c=>{for(const [x,id]of [[20,0x84],[40,0x13b],[60,0x1f8]])stampZoneFootprint(c.map,x,50,id-4);});
add('low zones without transport',c=>{for(const [x,id]of [[20,0x99],[40,0x144],[60,0x201]])stampZoneFootprint(c.map,x,50,id-4);});
add('high zones without transport',c=>{for(const [x,id]of [[20,0x120],[40,0x1ef],[60,0x21c]])stampZoneFootprint(c.map,x,50,id-4);});
add('full small houses',c=>{stampZoneFootprint(c.map,50,50,0x80);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy)c.map[(50+dy)*120+50+dx]=0x89+(dx+dy+8)%12;});
for(const vertical of [false,true]){
 add('merged residential '+(vertical?'vertical':'horizontal'),c=>{stampZoneFootprint(c.map,50,50,0x11c);stampZoneFootprint(c.map,50+(vertical?0:3),50+(vertical?3:0),0x11c);mergeResidentialZone(c.map,50,50);});
 add('merged commercial '+(vertical?'vertical':'horizontal'),c=>{stampZoneFootprint(c.map,50,50,0x1eb);stampZoneFootprint(c.map,50+(vertical?0:3),50+(vertical?3:0),0x1eb);updateCommercialFootprint(c.map,50,50,5,3,200,1);});
}
add('mixed connected strip',c=>{for(const [x,id]of [[20,0x120],[30,0x1ef],[40,0x21c],[50,0x99]])stampZoneFootprint(c.map,x,50,id-4);for(let x=18;x<53;x++)c.map[48*120+x]=0x32;});
add('top left boundary',c=>{stampZoneFootprint(c.map,1,1,0x11c);stampZoneFootprint(c.map,6,1,0x1eb);});
add('mayor promotion first stage',c=>{stampZoneFootprint(c.map,50,50,0x2bb);c.giftMilestones.mayorUpgradePending=1;});
add('two mayor houses one pending word',c=>{stampZoneFootprint(c.map,50,50,0x2c4);stampZoneFootprint(c.map,60,50,0x2cd);c.giftMilestones.mayorUpgradePending=4;});
add('gift bank casino and repair scars',c=>{for(const [x,id]of [[20,0x2e3],[40,0x2fe],[60,0x334]]){stampZoneFootprint(c.map,x,50,id-4);c.map[49*120+x-1]=0;c.map[51*120+x+1]=0;}c.giftMilestones.mayorUpgradePending=65535;});
add('final mayor house retains promotion',c=>{stampZoneFootprint(c.map,50,50,0x2d6);c.giftMilestones.mayorUpgradePending=1;});
const utilityPlot=(c,id,x,y,side)=>{const offset=Math.floor((side-1)/2),pivot=offset*side+offset;for(let n=0;n<side*side;n++)c.map[(y-offset+Math.floor(n/side))*120+x-offset+n%side]=id-pivot+n;c.map[(y-offset)*120+x-offset]=0;c.map[(y-offset+side-1)*120+x-offset+side-1]=0;};
add('native service and stadium maintenance',c=>{for(const [x,id]of [[20,0x249],[40,0x252],[60,0x307],[80,0x310]])utilityPlot(c,id,x,50,3);utilityPlot(c,0x25c,40,70,4);utilityPlot(c,0x36b,60,70,4);});
add('native utilities and transport maintenance',c=>{utilityPlot(c,0x28c,20,50,4);utilityPlot(c,0x27c,40,50,4);utilityPlot(c,0x2a5,70,50,6);utilityPlot(c,0x26c,90,50,4);});
const cases=[];
for(const layout of layouts.slice(0,Number(process.env.REFERENCE_LAYOUTS)||layouts.length))for(const seed of [SIMULATION_SEED,Array(7).fill(0),Array(7).fill(65535)])for(const demand of [-1500,1500]){
 const c=new City(new Uint16Array(12000),structuredClone(build),[...flags]);layout.make(c);for(let i=0;i<c.map.length;i++)if(c.map[i])c.map[i]|=0x8000;
 c.power.fill(1);c.landValue.fill(200);c.pollution.fill(0);c.density.fill(100);c.commercialRate.fill(64);c.traffic.fill(0);c.growthRate.fill(0);c.simulationRng=[...seed];c.demand=[demand,demand,demand];c.facilityDemand=[0,0];c.census();const giftPending=c.giftMilestones.mayorUpgradePending||0;const initial=[...c.rci],input=rle(c.map),visit=[0,0,0],counts=[0,0,0];
 for(const method of ['updateResidentialTile','updateJobZoneTile']){const original=c[method];c[method]=function(z,...args){const id=z.scanId??this.id(z.x,z.y),pop=z.type===5&&id===0x84?this.adjacentSmallHomeCount(z):this.zonePopulation({...z,id});visit[z.type-5]=(visit[z.type-5]+pop)&65535;counts[z.type-5]++;return original.call(this,z,...args);};}
 c.scanCityTiles();const giftStats={...c.giftStats},giftRemaining=c.giftMilestones.mayorUpgradePending||0;const expected=rle(c.map),rng=[...c.simulationRng];c.census(true);cases.push({name:layout.name,demand,seed:[...seed],input,initial,visit,counts,giftPending,giftRemaining,giftStats,post:[...c.rci],expected,rng});
}
const scriptFile=path.join(work,'scan-census-fixtures.lua');
const fixtures=cases.map(c=>`{runs={${c.input.map(r=>'{'+r+'}')}},seed={${c.seed}},demand=${c.demand&65535},giftPending=${c.giftPending},giftRemaining=${c.giftRemaining},giftStats={${c.giftStats.emptyLand},${c.giftStats.parks},${c.giftStats.developedZones},${c.giftStats.banks}},rci={${c.visit}},counts={${c.counts}},rng={${c.rng}},expected={${c.expected.map(r=>'{'+r+'}')}},population=${romPopulation(c.visit).population}}`).join(',');
const script=`local cases={${fixtures}};local mem=emu.memType.snesWorkRam;local n=0;local injected=false
-- No io/os access is needed: assertions return diagnostic exit codes.
local function setup(index)
 local c=cases[index];for at=0,0x1ffff do emu.write(at,0,mem)end
 local s=emu.getState();s['cpu.emulationMode']=false;s['cpu.pc']=0x1000;s['cpu.k']=3;s['cpu.d']=0x1800;s['cpu.dbr']=3;s['cpu.sp']=0x1eff;s['cpu.ps']=4;s['cpu.needNmi']=false;s['cpu.stopState']=0;emu.setState(s)
 emu.write16(0xcc9,c.giftPending,mem)
 local at=0;for _,run in ipairs(c.runs)do for j=1,run[1]do emu.write16(0x10200+at*2,run[2],mem);at=at+1 end end
 for at=0,2999 do emu.write(0x16b00+at,200,mem);emu.write(0x18270+at,0,mem);emu.write(0x18e28+at,100,mem)end
 for at=0,194 do emu.write16(0x1b47a+at*2,64,mem)end
 emu.write16(0xbc5,32,mem);for at=0xbad,0xbb1,2 do emu.write16(at,c.demand,mem)end
 for j,v in ipairs(c.seed)do emu.write16(0xccf+(j-1)*2,v,mem)end
 for j,v in ipairs({0x20,0x1d,0x82,0x20,0x97,0x82,0x20,0x96,0x81,0xea})do emu.write(0x1000+j-1,v,mem)end
 emu.write(0x4200,0,emu.memType.snesMemory)
end
emu.addMemoryCallback(function()
 if not injected then return end
 local rci,counts,rng={emu.read16(0xb8b,mem),emu.read16(0xb93,mem),emu.read16(0xb8f,mem)},{emu.read16(0xb8d,mem),emu.read16(0xb95,mem),emu.read16(0xb91,mem)},{};for j=0,6 do rng[#rng+1]=emu.read16(0xccf+j*2,mem)end
 local c=cases[n];if emu.read16(0xcc9,mem)~=c.giftRemaining then emu.stop(160000000+n*65536+emu.read16(0xcc9,mem));return end
 local giftStats={emu.read16(0xe27,mem),emu.read16(0xe23,mem),emu.read16(0xe1b,mem),emu.read16(0xca3,mem)};for j,v in ipairs(c.giftStats)do if giftStats[j]~=v then emu.stop((16+j)*10000000+n*65536+giftStats[j]);return end end
 for j,v in ipairs(c.rci)do if rci[j]~=v then emu.stop(j*10000000+n*65536+rci[j]);return end end
 for j,v in ipairs(c.counts)do if counts[j]~=v then emu.stop((j+3)*10000000+n*65536+counts[j]);return end end
 for j,v in ipairs(c.rng)do if rng[j]~=v then emu.stop((j+6)*10000000+n*65536+rng[j]);return end end
 local population=emu.read16(0xba5,mem)+emu.read16(0xba7,mem)*65536;if population~=c.population then emu.stop(140000000+n*65536+(population%65536));return end
 local at=0;for _,run in ipairs(c.expected)do for j=1,run[1]do if emu.read16(0x10200+at*2,mem)~=run[2]then emu.stop(150000000+n*65536+at);return end;at=at+1 end end
 if n==#cases then emu.stop(0);return end;n=n+1;setup(n)
end,emu.callbackType.exec,0x031009,0x031009)
emu.addMemoryCallback(function()if injected then return end;n=1;injected=true;setup(n)end,emu.callbackType.exec,0,0xffffff)
`;
fs.writeFileSync(scriptFile,script);const started=Date.now(),code=await new Promise((resolve,reject)=>{const p=spawn(exe,['--testRunner','--timeout=45',scriptFile,rom],{windowsHide:true,stdio:['ignore','pipe','pipe']}),timer=setTimeout(()=>{p.kill();reject(Error('Full scan reference exceeded55seconds'));},55000);p.stdout.on('data',v=>fs.appendFileSync(path.join(work,'scan-census.stdout.log'),v));p.stderr.on('data',v=>fs.appendFileSync(path.join(work,'scan-census.stderr.log'),v));p.on('error',e=>{clearTimeout(timer);reject(e);});p.on('exit',code=>{clearTimeout(timer);resolve(code);});});
const group=Math.floor(code/10000000),index=Math.floor((code%10000000)/65536),value=(code%10000000)%65536;
console.log({cases:cases.length,exitCode:code,elapsedMs:Date.now()-started,diagnostic:code?{group,index,value,case:cases[index-1]?.name,expectedRci:cases[index-1]?.visit,expectedRng:cases[index-1]?.rng}:null});
if(code)process.exitCode=1;else fs.writeFileSync(path.join(root,'research/reference-scan-census.json'),JSON.stringify({routines:['CODE_03821D','CODE_038297','CODE_0390C5','CODE_038196'],scope:'Controlled complete 120x100 scan: pre-worker RCI totals, R/C/I zone counts, population, final seven-word RNG and all 12000 map words including per-visit merge repair, gift/facility footprint repair, nuclear RNG, Mayor upgrades and redraw markers. Also compares gift-stat counters and the pending promotion word. No natural calendar/actor or custom utility parity claim.',romSHA256:hash(bytes),mesenSHA256:hash(fs.readFileSync(exe)),cases,exitCode:code},null,2));
