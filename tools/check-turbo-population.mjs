import fs from 'node:fs';import assert from 'node:assert/strict';import {chromium} from 'playwright';
import {createPopulationStressCity} from './population-stress-fixture.mjs';import {romPopulation} from '../src/rom-population.js';
const {city,plots,expected,population}=createPopulationStressCity(),legacy=JSON.parse(city.serialize());
delete legacy.populationMode;legacy.populationBaseline=romPopulation(expected).population;legacy.netMigration=-999;
legacy.scanCensus={rci:expected.map(n=>n&65535),counts:[...city.counts],facilityCounts:[0,0],unpowered:city.unpowered};
fs.mkdirSync('output',{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Users/drhoo/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:55719');await page.waitForFunction(()=>window.render_game_to_text);
 await page.locator('#file').setInputFiles({name:'legacy-megacity-census.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))});
 await page.waitForFunction(()=>JSON.parse(render_game_to_text()).name==='MEGACITY CENSUS TEST');
 if(JSON.parse(await page.evaluate(()=>render_game_to_text())).mode!=='paused')await page.locator('#pause').click();
 const state=()=>page.evaluate(()=>JSON.parse(render_game_to_text()));let s=await state();
 assert.equal(s.population,population);assert.deepEqual(s.populationBands,expected);assert.equal(s.populationBaseline,population);assert.equal(s.netMigration,0);assert.equal(s.citySize,'Megalopolis');
 assert.equal(await page.locator('#population').innerText(),'2,312,800');
 await page.screenshot({path:'output/turbo-population-megacity.png'});
 await page.locator('[data-tool="0"]').click();const box=await page.locator('#game').boundingBox();
 const x=box.x+(3.5-s.camera.x)*box.width/(120/s.zoom),y=box.y+(3.5-s.camera.y)*box.height/(75/s.zoom);
 await page.mouse.move(x,y);await page.mouse.down();await page.waitForTimeout(80);assert.equal((await state()).blueprint.valid,true);await page.mouse.up();
 s=await state();assert.equal(s.population,population-800);assert.equal(s.populationBands[0],expected[0]-40);assert.ok(s.funds<legacy.funds);await page.screenshot({path:'output/turbo-population-demolition.png'});
 await page.evaluate(()=>dispatchEvent(new Event('pagehide')));await page.reload();await page.waitForFunction(()=>window.render_game_to_text&&JSON.parse(render_game_to_text()).session.restored);
 const reloaded=await state();assert.equal(reloaded.population,population-800);assert.equal(reloaded.populationBands[0],expected[0]-40);assert.equal(reloaded.funds,s.funds);
 const pending=page.waitForEvent('download');await page.locator('#save').click();const file=await pending;await file.saveAs('output/turbo-population-saved-v39.json');const saved=JSON.parse(fs.readFileSync('output/turbo-population-saved-v39.json'));
 assert.equal(saved.populationMode,'wide');assert.deepEqual(saved.map.map(n=>n&32767).filter((_,i)=>![2,3,4].some(y=>Math.floor(i/240)===y&&i%240>=2&&i%240<=4)),legacy.map.map(n=>n&32767).filter((_,i)=>![2,3,4].some(y=>Math.floor(i/240)===y&&i%240>=2&&i%240<=4)));
 await page.locator('#file').setInputFiles({name:'wide-megacity.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});await page.waitForFunction(()=>JSON.parse(render_game_to_text()).name==='MEGACITY CENSUS TEST');assert.equal((await state()).population,population-800);
 assert.deepEqual(errors,[]);console.log({plots,legacyPopulation:romPopulation(expected).population,correctedPopulation:population,afterDemolition:population-800,visiblePopulation:true,legacyRepair:true,sessionReload:true,fileReload:true,errors});
}finally{await browser.close();}
