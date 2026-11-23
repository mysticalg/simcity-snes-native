import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {chromium} from 'playwright';
import {activeUtilityFixture} from './fixtures-active-utilities.mjs';
const fixture=activeUtilityFixture(),source=execFileSync('git',['show','c1f179f:src/civic.js'],{encoding:'utf8'}),original=source.slice(source.indexOf('export function busRoutes('),source.indexOf('\n\nexport function waterService')).replace('export function','function');
const suffix=process.env.UTILITY_CHECK_SUFFIX||'v51',waterText=execFileSync('git',['show','7f36c07:src/water-allocation.js'],{encoding:'utf8'}),sewageText=execFileSync('git',['show','7f36c07:src/sewage.js'],{encoding:'utf8'}),waterOriginal=waterText.slice(waterText.indexOf('export function allocateWater'),waterText.indexOf('// Allocation previews')).replace('export function','function'),sewageOriginal=sewageText.slice(sewageText.indexOf('export function sewageServices'),sewageText.indexOf('export function updateSewageMonth')).replace('export function','function');
const browser=await chromium.launch({executablePath:'C:/Users/drhoo/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:55719');await page.waitForFunction(()=>window.render_game_to_text);
 await page.evaluate(async({original,waterOriginal,sewageOriginal})=>{
  const app=document.querySelector('script[type=module]').src,source=await(await fetch(app)).text(),url=name=>new URL(source.match(new RegExp("from\\s*['\"]([^'\"]*"+name+"\\.js[^'\"]*)['\"]"))[1],app).href;
  const [{City},civic,sewage]=await Promise.all([import(url('simulation')),import(url('civic')),import(url('sewage'))]);
  window.activeCivic=civic;window.previousBusRoutes=Function('civicRoadEntry',original+';return busRoutes;')(civic.civicRoadEntry);
  window.previousWater=Function(waterOriginal+';return allocateWater;')();window.activeSewage=sewage;window.previousSewage=Function('waterNetwork','utilityPipeStatus',sewageOriginal+';return sewageServices;')(civic.waterNetwork,civic.utilityPipeStatus);
  const refresh=City.prototype.refresh;City.prototype.refresh=function(...args){const value=refresh.apply(this,args);if(this.width===240&&this.year===2088)window.activeCity=this;return value;};
 },{original,waterOriginal,sewageOriginal});
 await page.locator('#file').setInputFiles({name:'active-utilities.json',mimeType:'application/json',buffer:Buffer.from(fixture.serialize())});
 await page.waitForFunction(()=>window.activeCity&&JSON.parse(render_game_to_text()).year===2088);
 if(JSON.parse(await page.evaluate(()=>render_game_to_text())).mode!=='paused')await page.locator('#pause').click();
 const inspect=()=>page.evaluate(()=>{
  const c=activeCity,{civicServices,civicRoadEntry,utilityPipeStatus}=activeCivic,services=civicServices(c),stations=c.zones.filter(z=>z.id===968&&c.power[z.i]&&c.disabledBuildings?.[z.i]!==z.id&&civicRoadEntry(c,z)>=0),stops=c.zones.filter(z=>z.id===967&&c.disabledBuildings?.[z.i]!==z.id&&civicRoadEntry(c,z)>=0),expected=previousBusRoutes(c,stations,stops);
  if(JSON.stringify(services.routes)!==JSON.stringify(expected))throw Error('Live bus routes changed');
  for(const route of services.routes)for(const i of route)if(!(c.flags[c.map[i]&1023]&64))throw Error('Bus left the road');
  const normalize=value=>JSON.stringify(value,(_,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v),pumps=[];
  for(const z of c.zones){const b=activeCivic.civicForId(z.id);if(['water','waterStorage'].includes(b?.kind)&&c.disabledBuildings?.[z.i]!==z.id&&activeCivic.pumpStatus(c,z).working)pumps.push({...z,capacity:b.kind==='water'?b.capacity:0,storage:b.kind==='waterStorage'?b.capacity:0,flow:b.flow||0});}
  if(normalize({water:services.water,watered:services.watered,networks:services.waterNetworks,assignments:services.waterAssignments})!==normalize(previousWater(c,activeCivic.waterNetwork(c).nodes,pumps)))throw Error('Live water allocation changed');
  const sewage=activeSewage.sewageServices(c);if(normalize(sewage)!==normalize(previousSewage(c)))throw Error('Live sewage changed');
  return {routes:services.routes.length,pumps:services.pumpStatuses.filter(p=>p.working).length,sewagePumps:c.zones.filter(z=>z.id===973&&utilityPipeStatus(c,z).working).length,watered:services.watered.size,westWatered:c.zones.filter(z=>z.type>=5&&z.type<=7&&z.x<90&&services.watered.has(z.i)).length,waterCapacity:services.capacity.water,sewageCollected:sewage.collected,sewageBacklog:sewage.backlog,powerCapacity:c.powerCapacity,powerUsed:c.powerUsed,overloaded:c.powerOverloaded,frame:c.civic.busFrame||0,month:c.month};
 });
 const initial=await inspect();assert.equal(initial.pumps,45);assert.equal(initial.sewagePumps,45);assert.equal(initial.routes,32);assert.equal(initial.overloaded,false);
 await page.evaluate(()=>advanceTime(0));await page.screenshot({path:'output/active-utilities-'+suffix+'.png'});
 const frozen=await inspect();await page.waitForTimeout(250);assert.deepEqual(await inspect(),frozen);
 await page.locator('#pause').click();await page.waitForTimeout(300);await page.locator('#pause').click();const moving=await inspect();assert.ok(moving.frame>frozen.frame);
 await page.evaluate(()=>{const c=activeCity,route=activeCivic.civicServices(c).routes[0];c.map[route[1]]=0;c.refresh();});const changed=await inspect();
 await page.evaluate(()=>{const c=activeCity,pump=c.zones.find(z=>z.id===989);c.setBuildingEnabled(pump,false);});const pumpOff=await inspect();assert.equal(pumpOff.pumps,44);assert.equal(pumpOff.waterCapacity,changed.waterCapacity-15000);
 await page.evaluate(()=>{const c=activeCity,pump=c.zones.find(z=>z.id===989);c.setBuildingEnabled(pump,true);window.pipesBeforeCut=c.pipes.slice();for(let y=0;y<c.height;y++)c.pipes[y*c.width+100]=0;c.refresh();});const cut=await inspect();assert.equal(cut.westWatered,0);assert.ok(changed.westWatered>0);
 await page.evaluate(()=>{const c=activeCity;c.pipes=pipesBeforeCut;for(const z of c.zones)if(z.id===963)c.disabledBuildings[z.i]=z.id;c.refresh();});const blackout=await inspect();assert.equal(blackout.pumps,0);assert.equal(blackout.sewagePumps,0);assert.equal(blackout.watered,0);
 await page.evaluate(()=>{activeCity.disabledBuildings={};activeCity.refresh();});const recovered=await inspect();assert.equal(recovered.pumps,45);assert.equal(recovered.sewagePumps,45);assert.equal(recovered.westWatered,changed.westWatered);
 const save=await page.evaluate(()=>activeCity.serialize());await page.evaluate(()=>window.activeCity=null);await page.locator('#file').setInputFiles({name:'active-roundtrip.json',mimeType:'application/json',buffer:Buffer.from(save)});await page.waitForFunction(()=>window.activeCity);
 if(JSON.parse(await page.evaluate(()=>render_game_to_text())).mode!=='paused')await page.locator('#pause').click();const restored=await inspect();assert.equal(restored.routes,changed.routes);assert.equal(restored.pumps,changed.pumps);
 assert.deepEqual(errors,[]);const result={initial,moving,changed,pumpOff,cut,blackout,recovered,restored,oldRouteOrderExact:true,waterAndSewageExact:true,allRoutesOnRoads:true,pausedStable:true,reload:true,errors};
 fs.writeFileSync('output/active-utilities-browser-'+suffix+'.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
