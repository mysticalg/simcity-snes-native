import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {GarbageVisuals} from '../src/garbage-visuals.js';
import {civicServices,civicRoadEntry} from '../src/civic.js?v=patch-work-54';
import {truckRoutingFixture} from './fixtures-truck-routing.mjs';
import {activeUtilityFixture} from './fixtures-active-utilities.mjs';

const referenceCommit='e8bc78b',source=execFileSync('git',['show',referenceCommit+':src/garbage-visuals.js'],{encoding:'utf8'});
const factory=source.replace(/import[\s\S]*?from\s*['"][^'"]+['"];?/g,'').replace('export class','class')+';return {GarbageVisuals,truckArt};';
const Original=Function('CIVIC_ART_EXTRAS','civicServices','civicRoadEntry',factory)({},civicServices,civicRoadEntry).GarbageVisuals;
const encode=s=>JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const result={referenceCommit,node:{snapshots:0,peakTrucks:0,pickupCountSumAcrossSnapshots:0,phases:[]}};
function compare(city,steps,phase,mutate){
 const old=new Original(),current=new GarbageVisuals(),snapshots=[];
 for(let n=0;n<steps;n++){
  mutate?.(city,n);city.civic.busFrame=(city.civic.busFrame||0)+[1,16,60,120][n%4];city.revision++;
  const save=city.serialize(),a=encode(old.update(city)),b=encode(current.update(city));
  assert.equal(city.serialize(),save,phase+' render changed saved city');
  if(a!==b){fs.writeFileSync('output/truck-reference-failure-v55.json',JSON.stringify({phase,n,old:JSON.parse(a),current:JSON.parse(b)},null,2));throw Error(phase+' visual state mismatch at '+n);}
  const state=current.states.get(city);result.node.snapshots++;result.node.peakTrucks=Math.max(result.node.peakTrucks,state.trucks.length);result.node.pickupCountSumAcrossSnapshots+=state.pickups;
  snapshots.push(sha(a));
 }
 result.node.phases.push({phase,steps,snapshotSHA256:sha(snapshots.join('\n'))});
}
const small=truckRoutingFixture(),originalMap=small.map.slice(),depot=small.zones.find(z=>z.id===976),landfill=small.zones.find(z=>z.id===961),plant=small.zones.find(z=>z.id===963);
compare(small,300,'powered-small-city-and-edits',(c,n)=>{
 if(n===20)c.setBuildingEnabled(depot,false);if(n===30)c.setBuildingEnabled(depot,true);
 if(n===40)c.map[8*120+40]=0;if(n===50)c.map[8*120+40]=0x32;
 if(n===60)c.civic.landfillUsed[landfill.i]=10000;if(n===70)c.civic.landfillUsed[landfill.i]=0;
 if(n===80)c.map[landfill.i]=0;if(n===90)c.place(31,34,7);
 if(n===100)c.place(50,38,6);
 if(n===110)for(const z of c.zones.filter(z=>z.type===5))for(let y=z.y-1;y<=z.y+1;y++)for(let x=z.x-1;x<=z.x+1;x++)c.map[y*120+x]=0;
 if(n===120)for(let y=5;y<8;y++)for(let x=55;x<58;x++)c.map[y*120+x]=originalMap[y*120+x];
 // Keep the original oversized-fleet behavior when an office type changes.
 if(n===140)c.map[depot.i]=975;if(n===150)c.map[depot.i]=976;
 if(n===160)c.setBuildingEnabled(plant,false);if(n===170)c.setBuildingEnabled(plant,true);
 if(n===180)for(let i=0;i<c.map.length;i++)if(c.flags[c.map[i]&1023]&64)c.map[i]=0;
 if(n===190)c.map.set(originalMap);
 if(n===210){for(let x=30;x<=60;x++)c.map[10*120+x]=0x32;for(let y=8;y<=10;y++){c.map[y*120+30]=0x32;c.map[y*120+60]=0x32;}}
 if(n===220)c.map[8*120+40]=0;if(n===230)c.map[8*120+40]=0x32;
 if(n%10===0)c.refresh();
});
compare(small.constructor.restore(small.serialize(),small.build,small.flags),40,'save-reload');
const heavy=activeUtilityFixture();heavy.civic.garbage=1e7;heavy.civic.generatedGarbage=1000;
compare(heavy,40,'active-utility-megacity',c=>c.stepSimulation());
assert.ok(result.node.pickupCountSumAcrossSnapshots>0);

const browser=await chromium.launch({executablePath:'C:/Users/drhoo/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:55719');await page.waitForFunction(()=>window.render_game_to_text);
 await page.evaluate(async factory=>{
  const app=document.querySelector('script[type=module]').src,source=await(await fetch(app)).text(),url=n=>new URL(source.match(new RegExp("from\\s*['\"]([^'\"]*"+n+"\\.js[^'\"]*)['\"]"))[1],app).href;
  const [{City},civic,{GarbageVisuals},textures]=await Promise.all([import(url('simulation')),import(url('civic')),import(url('garbage-visuals')),import('./src/civic-textures.js?v=health-care-34')]);
  const old=Function('CIVIC_ART_EXTRAS','civicServices','civicRoadEntry',factory)(textures.CIVIC_ART_EXTRAS,civic.civicServices,civic.civicRoadEntry);await old.truckArt.decode();
  const reference=new old.GarbageVisuals(),draw=GarbageVisuals.prototype.draw,canvas=document.createElement('canvas');canvas.width=canvas.height=1;const context=canvas.getContext('2d'),encode=s=>JSON.stringify(s,(_,v)=>v instanceof Map?[...v]:v);
  window.truckRoutingCheck={snapshots:0,peakTrucks:0,pixels:0,channels:0,nonBackgroundChannels:0};
  GarbageVisuals.prototype.draw=function(ctx,city,view){
   const expected=reference.draw(context,city,view),result=draw.call(this,ctx,city,view);
   if(encode(reference.states.get(city))!==encode(this.states.get(city)))throw Error('Actual app garbage-truck state differs from release');
   if(JSON.stringify(expected)!==JSON.stringify(result))throw Error('Actual app garbage metrics differ from release');
   truckRoutingCheck.snapshots++;truckRoutingCheck.peakTrucks=Math.max(truckRoutingCheck.peakTrucks,this.states.get(city).trucks.length);return result;
  };
  const restore=City.restore;City.restore=function(...args){const city=restore.apply(this,args);if(city.year===2091)window.truckTestCity=city;return city;};
  window.truckReferenceType=old.GarbageVisuals;window.truckCurrentType=GarbageVisuals;window.truckCurrentDraw=draw;
 },factory);
 const fixture=truckRoutingFixture();
 await page.locator('#file').setInputFiles({name:'truck-routing.json',mimeType:'application/json',buffer:Buffer.from(fixture.serialize())});
 await page.waitForFunction(()=>window.truckTestCity&&JSON.parse(render_game_to_text()).year===2091);
 if(JSON.parse(await page.evaluate(()=>render_game_to_text())).mode!=='paused')await page.locator('#pause').click();
 await page.locator('#inspectTool').click();
 await page.evaluate(()=>{
  for(let n=0;n<45;n++){truckTestCity.advanceVisualFrames(60,false);advanceTime(0);}
  const c=truckTestCity,depot=c.zones.find(z=>z.id===976),plant=c.zones.find(z=>z.id===963);c.setBuildingEnabled(depot,false);advanceTime(0);
  c.setBuildingEnabled(depot,true);advanceTime(0);c.map[8*120+40]=0;c.refresh();advanceTime(0);
  c.map[8*120+40]=0x32;c.refresh();advanceTime(0);c.setBuildingEnabled(plant,false);advanceTime(0);c.setBuildingEnabled(plant,true);advanceTime(0);
 });
 result.browser=await page.evaluate(()=>{
  const city=truckTestCity,old=new truckReferenceType(),current=new truckCurrentType(),a=document.createElement('canvas'),b=document.createElement('canvas');a.width=b.width=960;a.height=b.height=240;
  const ac=a.getContext('2d'),bc=b.getContext('2d'),view={x:0,y:0,width:120,height:75},save=city.serialize();
  for(let n=0;n<24;n++){
   city.civic.busFrame+=16;city.revision++;
   for(const zoom of [.5,1,1.375]){
    for(const [fx,ctx]of [[old,ac],[current,bc]]){ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#273e4d';ctx.fillRect(0,0,960,240);ctx.scale(zoom,zoom);if(fx===current)truckCurrentDraw.call(fx,ctx,city,view);else fx.draw(ctx,city,view);}
    const pa=ac.getImageData(0,0,960,240).data,pb=bc.getImageData(0,0,960,240).data;for(let i=0;i<pa.length;i++){if(pa[i]!==pb[i])throw Error('Truck pixels differ '+n+'/'+zoom+'/'+i);if(pb[i]!==[39,62,77,255][i%4])truckRoutingCheck.nonBackgroundChannels++;}
    truckRoutingCheck.pixels++;truckRoutingCheck.channels+=pa.length;
   }
  }
  // Only the explicit synthetic clock/revision inputs above may change state.
  const now=city.serialize();current.update(city);if(city.serialize()!==now)throw Error('Browser truck renderer changed city save');
  return {...truckRoutingCheck,pickups:current.states.get(city).pickups,photorealTrucks:current.describe(city).photorealTrucks,cityWasAdvanced:save!==now};
 });
 await page.evaluate(()=>advanceTime(0));await page.locator('#game').hover({position:{x:200,y:85}});await page.mouse.wheel(0,-900);await page.waitForFunction(()=>JSON.parse(render_game_to_text()).zoom>3);await page.waitForTimeout(400);await page.screenshot({path:'output/garbage-routing-v55.png'});
 const before=await page.evaluate(()=>({garbage:truckTestCity.civic.garbage,generated:truckTestCity.civic.generatedGarbage}));
 await page.evaluate(()=>dispatchEvent(new Event('pagehide')));await page.reload();await page.waitForFunction(()=>window.render_game_to_text&&JSON.parse(render_game_to_text()).session.restored);
 const restored=JSON.parse(await page.evaluate(()=>render_game_to_text()));assert.equal(restored.civic.garbage,before.garbage);assert.equal(restored.civic.generatedGarbage,before.generated);assert.equal(restored.year,2091);
 result.browser.session=true;assert.ok(result.browser.snapshots>45);assert.ok(result.browser.peakTrucks>=10);assert.ok(result.browser.pickups>0);assert.ok(result.browser.photorealTrucks>0);assert.ok(result.browser.nonBackgroundChannels>0);assert.equal(result.browser.pixels,72);assert.deepEqual(errors,[]);result.errors=errors;
 fs.writeFileSync('output/garbage-routing-v55.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
