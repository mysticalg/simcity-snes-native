import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined});
fs.mkdirSync('output',{recursive:true});
const page=await browser.newPage(),base=process.argv[2]||'http://127.0.0.1:55721';
await page.goto(base);await page.waitForFunction(()=>typeof render_game_to_text==='function');
const result=await page.evaluate(async()=>{
 const open=indexedDB.open('simcity-regions',1);
 const db=await new Promise((resolve,reject)=>{open.onupgradeneeded=()=>open.result.createObjectStore('regions',{keyPath:'id'});open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error);});
 const city={name:'Preserved legacy city',year:1987,month:6,baseStep:88,map:[0,42,0],funds:5000,civic:{economy:{revision:0,inventory:{oil:7}}},disabledBuildings:{1:42},resourceSeed:123456};
 const a={id:'legacy-a',name:'Legacy region',size:4,version:1,cities:{0:{name:city.name,year:city.year,population:123,save:JSON.stringify(city)}}},b={...a,id:'legacy-b'};
 await new Promise((resolve,reject)=>{const tx=db.transaction('regions','readwrite');tx.objectStore('regions').put(a);tx.objectStore('regions').put(b);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();
 const {regionStore,writeEconomicRound,openRegionStore}=await import('./src/regions.js?v=background-64');
 const before=await regionStore('get','legacy-a'),first=JSON.parse(before.cities[0].save);
 await writeEconomicRound('legacy-a',[{slot:'0',economy:{revision:1,inventory:{oil:40}},funds:1234,watered:[1],power:{1:1}}],{completedEconomyTick:1,economyTick:1});
 let r=await regionStore('get','legacy-a');const patch1=JSON.parse(r.cities[0].save);await regionStore('put',r);
 const upgraded=await openRegionStore();const version=upgraded.version,counts=await new Promise((resolve,reject)=>{const tx=upgraded.transaction(['economies','economyClocks']);const e=tx.objectStore('economies').count(),c=tx.objectStore('economyClocks').count();tx.oncomplete=()=>resolve([e.result,c.result]);tx.onerror=()=>reject(tx.error);});upgraded.close();
 const compacted=await regionStore('get','legacy-a');
 await writeEconomicRound('legacy-a',[{slot:'0',economy:{revision:2,inventory:{oil:55}},funds:900}],{completedEconomyTick:2,economyTick:2});
 r=await regionStore('get','legacy-a');const patch2=JSON.parse(r.cities[0].save),other=await regionStore('get','legacy-b');
 return{version,counts,first,patch1,compacted:JSON.parse(compacted.cities[0].save),compactedTick:compacted.completedEconomyTick,patch2,tick:r.completedEconomyTick,other:JSON.parse(other.cities[0].save)};
});
assert.equal(result.version,2);assert.deepEqual(result.counts,[0,0]);assert.equal(result.first.funds,5000);assert.equal(result.first.map[1],42);assert.equal(result.patch1.funds,1234);assert.equal(result.patch1.civic.economy.inventory.oil,40);assert.equal(result.patch1.map[1],42|0x8000);assert.equal(result.compacted.funds,1234);assert.equal(result.compactedTick,1);assert.equal(result.patch2.funds,900);assert.equal(result.patch2.civic.economy.inventory.oil,55);assert.equal(result.tick,2);assert.equal(result.other.funds,5000);assert.equal(result.other.civic.economy.inventory.oil,7);
for(const c of[result.patch1,result.compacted,result.patch2]){assert.equal(c.resourceSeed,123456);assert.equal(c.baseStep,88);assert.equal(c.year,1987);assert.equal(c.month,6);assert.deepEqual(c.disabledBuildings,{1:42});}
fs.writeFileSync('output/region-upgrade-v64.json',JSON.stringify(result,null,2));console.log('Legacy v1 region upgrade, atomic economic overlays, compaction and other-region isolation passed.');await browser.close();
