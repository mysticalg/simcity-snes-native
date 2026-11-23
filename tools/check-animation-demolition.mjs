import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {City} from '../src/simulation.js';
fs.mkdirSync('output',{recursive:true});
const build=JSON.parse(fs.readFileSync('assets/tables/build.json')),flags=JSON.parse(fs.readFileSync('assets/tables/city.json')).flags;
const fixture=new City(new Uint16Array(12000),build,flags,{year:2004,disastersEnabled:false});
for(let x=10;x<110;x++)fixture.place(1,x,20);
fixture.place(5,25,25);fixture.place(37,24,20);fixture.pipes[20*120+24]=1;fixture.pipes[22*120+28]=1;fixture.place(1,45,30);
fixture.funds=100000;fixture.autoBudget=true;
const browser=await chromium.launch({executablePath:'C:/Users/drhoo/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:55709');await page.waitForFunction(()=>window.render_game_to_text);
 await page.evaluate(async()=>{
  const app=document.querySelector('script[type=module]').src,t=await(await fetch(app)).text();
  const module=async name=>import(new URL(t.match(new RegExp('from\\s*[\'"](\\./'+name+'\\.js[^\'"]*)'))[1],app).href);
  const {City}=await module('simulation'),refresh=City.prototype.refresh;
  City.prototype.refresh=function(){window.testCity=this;return refresh.apply(this,arguments);};
  const {WeatherFX}=await module('weather-fx'),draw=WeatherFX.prototype.draw;
  WeatherFX.prototype.draw=function(ctx,city,...args){const result=draw.call(this,ctx,city,...args);window.testWeather=this;return result;};
 });
 await page.locator('#file').setInputFiles({name:'animation-fixture.json',mimeType:'application/json',buffer:Buffer.from(fixture.serialize())});
 await page.waitForFunction(()=>JSON.parse(render_game_to_text()).year===2004);
 if(JSON.parse(await page.evaluate(()=>render_game_to_text())).mode!=='paused')await page.locator('#pause').click();
 await page.evaluate(()=>{testCity.advance=()=>{};testCity.traffic.fill(0);for(let x=10;x<110;x++)testCity.traffic[20*120+x]=10;});
 await page.locator('#pause').click();
 const speeds=[];
 for(const speed of [1,2,4,8,16]){
  while(JSON.parse(await page.evaluate(()=>render_game_to_text())).speed!==speed)await page.locator('#speed').click();
  speeds.push(await page.evaluate(()=>{
   advanceTime(0);const s=testWeather.states.get(testCity),car=s.cars[0];
   Object.assign(car,{i:20*120+20,x:164,y:164,previous:20*120+19,target:20*120+21,angle:0,heading:0});
   const start=testCity.civic.busFrame,x=car.x;
   for(let n=0;n<60;n++)advanceTime(1000/60);
   return {speed:testCity.speed,frames:testCity.civic.busFrame-start,carDistance:car.x-x,cars:s.cars.length};
  }));
 }
 for(const r of speeds){assert.equal(r.frames,60*r.speed);assert.ok(Math.abs(r.carDistance-(12-10/240*7)*r.speed)<.001,JSON.stringify(r));assert.ok(r.cars>0);}
 await page.locator('#pause').click();
 const paused=await page.evaluate(()=>{advanceTime(0);const frame=testCity.civic.busFrame,s=testWeather.states.get(testCity),x=s.cars[0].x;advanceTime(1000);return {frames:testCity.civic.busFrame-frame,distance:s.cars[0].x-x};});
 assert.deepEqual(paused,{frames:0,distance:0});await page.screenshot({path:'output/animation-speed-cars.png'});
 await page.locator('#demolishTool').click();await page.locator('#drawMode').selectOption('filled');
 const box=await page.locator('#game').boundingBox(),point=(x,y)=>({x:box.x+(x+.5)*box.width/120,y:box.y+(y+.5)*box.height/75});
 const start=point(18,18),end=point(32,29);
 const before=await page.evaluate(()=>Array.from(testCity.map));
 await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:8});
 let state=JSON.parse(await page.evaluate(()=>render_game_to_text()));assert.ok(state.blueprint.valid);assert.ok(state.blueprint.skipped>0);
 assert.deepEqual(await page.evaluate(()=>Array.from(testCity.map)),before);await page.screenshot({path:'output/bulk-demolition-blueprint.png'});
 await page.mouse.up();
 assert.ok(await page.evaluate(()=>{for(let y=18;y<=29;y++)for(let x=18;x<=32;x++){const i=y*120+x;if(testCity.map[i]||testCity.pipes[i]||testCity.busStops[i])return false;}return !!testCity.map[30*120+45]&&!!testCity.map[20*120+17];}));
 await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:4});state=JSON.parse(await page.evaluate(()=>render_game_to_text()));assert.ok(state.blueprint.valid);assert.equal(state.blueprint.cost,0);await page.mouse.up();
 assert.ok(!JSON.parse(await page.evaluate(()=>render_game_to_text())).notices.includes('There is nothing to clear here.'));
 await page.screenshot({path:'output/bulk-demolition-cleared.png'});assert.deepEqual(errors,[]);
 fs.writeFileSync('output/animation-demolition-verification.json',JSON.stringify({speeds,paused,demolition:{preview:true,release:true,allLayers:true,emptySelection:true,outsidePreserved:true},errors},null,2));
 console.log({speeds,paused,demolition:true,errors});
}finally{await browser.close();}
