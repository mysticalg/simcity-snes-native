import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {City} from '../src/simulation.js';
const build=JSON.parse(fs.readFileSync('assets/tables/build.json')),flags=JSON.parse(fs.readFileSync('assets/tables/city.json')).flags;
const c=new City(new Uint16Array(12000),build,flags,{year:2007});c.funds=100000;c.gifts=[21,22];c.disastersEnabled=false;c.autoBudget=true;
// Include an old station to verify save compatibility alongside new construction.
const legacy=build.nativeEmergencyBuildings[8];for(let n=0;n<9;n++)c.map[(25+legacy.y[n])*120+20+legacy.x[n]]=legacy.tiles[n];c.refresh();
const browser=await chromium.launch({executablePath:'C:/Users/drhoo/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.TEST_URL||'http://localhost:5198');await page.waitForFunction(()=>window.render_game_to_text);
 await page.evaluate(async()=>{const src=document.querySelector('script[type=module]').src,text=await(await fetch(src)).text(),m=text.match(/from\s*['"](.\/simulation\.js[^'"]*)/),{City}=await import(new URL(m[1],src).href),refresh=City.prototype.refresh;City.prototype.refresh=function(){window.emergencyCity=this;return refresh.apply(this,arguments);};});
 await page.locator('#file').setInputFiles({name:'emergency-fixture.json',mimeType:'application/json',buffer:Buffer.from(c.serialize())});await page.waitForFunction(()=>JSON.parse(render_game_to_text()).year===2007);if(JSON.parse(await page.evaluate(()=>render_game_to_text())).mode!=='paused')await page.locator('#pause').click();
 await page.getByRole('button',{name:'WEATHER / LIGHTING',exact:true}).click();await page.locator('#weatherEnabled').uncheck();await page.locator('#realisticArt').uncheck();await page.locator('#modalGo').click();
 await page.locator('[data-build-category="services"]').click();const box=await page.locator('#game').boundingBox(),point=(x,y)=>({x:box.x+(x+.5)*box.width/120,y:box.y+(y+.5)*box.height/75});
 for(const [tool,id,x,y]of[[8,977,20,20],[9,978,25,20]]){
  await page.locator(`#tools [data-tool="${tool}"]`).click();await page.locator('#drawMode').selectOption('line');const p=point(x,y);await page.mouse.move(p.x,p.y);await page.mouse.down();const held=await page.evaluate(()=>({funds:emergencyCity.funds,footprint:emergencyCity.footprint(+document.querySelector('#tools .selected').dataset.tool,20,20).length}));assert.equal(held.footprint,4);await page.screenshot({path:`output/emergency-blueprint-${tool}.png`});await page.mouse.up();const placed=await page.evaluate(id=>({funds:emergencyCity.funds,z:emergencyCity.zones.find(z=>z.id===id)}),id);assert.equal(placed.funds,held.funds-500);assert.equal(placed.z.x,x+1);assert.equal(placed.z.y,y+1);
 }
 await page.locator('[data-build-category="parks"]').click();for(const [tool,id,x]of[[21,0x307,30],[22,0x310,35]]){await page.locator(`[data-gift-tool="${tool}"]`).click();const p=point(x,20);await page.mouse.click(p.x,p.y);assert.ok(await page.evaluate(id=>emergencyCity.zones.some(z=>z.id===id),id));}
 // Inspect a noncenter tile of every footprint, including the old 3x3 station.
 await page.locator('#inspectTool').click();for(const [x,y,name]of[[20,20,'Police'],[26,20,'Fire station'],[32,22,'Police headquarters'],[37,22,'Fire headquarters'],[22,27,'Police']]){const p=point(x,y);await page.mouse.click(p.x,p.y);assert.equal(await page.locator('#modalTitle').innerText(),name);assert.match(await page.locator('#modalBody').innerText(),/Annual upkeep: \$100/);await page.locator('#modalGo').click();}
 const p=point(25,23);await page.mouse.move(p.x,p.y);await page.mouse.wheel(0,-9999);await page.waitForFunction(()=>JSON.parse(render_game_to_text()).zoom===4);await page.evaluate(()=>advanceTime(1000));await page.screenshot({path:'output/emergency-buildings-v0.2.17.png'});
 await page.evaluate(()=>dispatchEvent(new Event('pagehide')));await page.reload();await page.waitForFunction(()=>window.render_game_to_text&&JSON.parse(render_game_to_text()).session.restored);const state=JSON.parse(await page.evaluate(()=>render_game_to_text()));assert.equal(state.year,2007);assert.equal(state.funds,99000);
 await page.getByRole('button',{name:'WEATHER / LIGHTING',exact:true}).click();await page.locator('#weatherEnabled').check();await page.locator('#realisticArt').check();await page.locator('#weatherTime').selectOption('night');await page.locator('#modalGo').click();await page.evaluate(()=>advanceTime(0));await page.screenshot({path:'output/emergency-buildings-night-v0.2.17.png'});
 await page.locator('[data-build-category="water"]').click();await page.locator('#tools [data-tool="40"]').click();await page.evaluate(()=>advanceTime(0));assert.ok(JSON.parse(await page.evaluate(()=>render_game_to_text())).underground);
 assert.deepEqual(errors,[]);console.log({newStations:'2x2',headquarters:'3x3',cost:500,mouseRelease:true,legacyInspection:true,hqInspection:true,sessionRestored:true,errors});
}finally{await browser.close();}
