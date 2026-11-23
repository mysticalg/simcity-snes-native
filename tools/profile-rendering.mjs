// Reproducible CPU/render submission timings; these are not user-display FPS.
import {chromium} from 'playwright';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {City} from '../src/simulation.js';
import {stampZoneFootprint} from '../src/rom-growth.js';
const build=JSON.parse(fs.readFileSync('assets/tables/build.json'));
const flags=JSON.parse(fs.readFileSync('assets/tables/city.json')).flags;
const mega=process.argv.includes('--mega'),width=mega?240:120,height=mega?200:100,city=new City(new Uint16Array(width*height),build,flags,{year:2008,width,height});
city.funds=1e7;city.disastersEnabled=false;city.autoBudget=true;
for(let y=3;y<(mega?190:70);y+=4)for(let x=3;x<(mega?158:70);x+=4){
 const slot=(x+y)%3;stampZoneFootprint(city.map,x,y,[0x11c,0x1eb,0x213][slot],width,height);
 for(let n=-1;n<=2;n++)city.map[(y+2)*width+x+n]=0x30;
}
for(let y=0;y<height;y++)for(let x=mega?160:75;x<width;x++){city.map[y*width+x]=2;city.seaPollution[y*width+x]=y>40?190:0;}
city.refresh();city.power.fill(1);city.airPollution.fill(90);if(mega&&city.zones.length<1800)throw Error('Megacity fixture was not fully constructed');
const browser=await chromium.launch({executablePath:'C:/Users/drhoo/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 const baseline=process.argv.includes('--baseline');if(process.argv.includes('--ground-baseline')){const body=execFileSync('git',['show','63397b1:src/realistic-art.js'],{encoding:'utf8'});await page.route('**/src/realistic-art.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body}));}
 if(baseline){for(const name of ['app','realistic-art','window-lights','water-surface']){const body=execFileSync('git',['show','339f219:src/'+name+'.js'],{encoding:'utf8'});await page.route('**/src/'+name+'.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body}));}}
 await page.addInitScript(()=>{
  window.renderTimings={frames:[],paints:[],paintCount:0};const raf=requestAnimationFrame,fill=CanvasRenderingContext2D.prototype.fillRect;
  CanvasRenderingContext2D.prototype.fillRect=function(x,y,w,h){if(this.canvas.id==='game'&&x===0&&y===0&&w===960&&h===600&&this.fillStyle==='#071c33')renderTimings.paintCount++;return fill.call(this,x,y,w,h);};
  window.requestAnimationFrame=cb=>raf(t=>{const start=performance.now(),before=renderTimings.paintCount;cb(t);if(cb.name==='frame'){renderTimings.frames.push(performance.now()-start);renderTimings.paints.push(renderTimings.paintCount-before);}});
 });
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.TEST_URL||'http://localhost:5198');await page.waitForFunction(()=>window.render_game_to_text);
 await page.locator('#file').setInputFiles({name:'dense-performance.json',mimeType:'application/json',buffer:Buffer.from(city.serialize())});
 await page.waitForFunction(()=>JSON.parse(render_game_to_text()).year===2008);await page.locator('#pause').click();if(mega){await page.locator('#game').hover();await page.mouse.wheel(0,462.1);await page.waitForTimeout(750);}
 await page.getByRole('button',{name:'WEATHER / LIGHTING',exact:true}).click();await page.locator('#weatherTime').selectOption('night');await page.locator('#weatherMode').selectOption('rain');await page.locator('#realisticArt').check();await page.locator('#modalGo').click();
 const result=await page.evaluate(async save=>{
  const {WeatherFX}=await import('./src/weather-fx.js');
  const {City}=await import('./src/simulation.js');
  const [build,table]=await Promise.all(['build','city'].map(n=>fetch('assets/tables/'+n+'.json').then(r=>r.json())));
  const city=City.restore(save,build,table.flags);city.power.fill(1);city.airPollution.fill(90);
  const renderer=new WeatherFX();await renderer.ready;const atlas=new Image();atlas.src='assets/city-0.png';await atlas.decode();
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=600;const ctx=canvas.getContext('2d'),zoom=city.width===240?.5:1,view={x:0,y:0,width:120/zoom,height:75/zoom,zoom,atlas};ctx.scale(zoom,zoom);
  const measure=(fn,count=30)=>{for(let n=0;n<5;n++)fn();const times=[];for(let n=0;n<count;n++){const start=performance.now();fn();times.push(performance.now()-start);}times.sort((a,b)=>a-b);return {medianMs:times[Math.floor(count*.5)],p95Ms:times[Math.floor(count*.95)]};};
  const slices={};let time=1;
  for(const [name,night]of [['day',0],['night',1]]){
   slices['buildings-'+name]=measure(()=>renderer.realistic.draw(ctx,city,view,atlas,night,time+=1/60));
  }
  slices.water=measure(()=>renderer.water.draw(ctx,city,view,atlas,time+=1/60));
  slices.weather=measure(()=>{city.civic.busFrame++;renderer.draw(ctx,city,view,{enabled:true,realisticArt:true,timeMode:'night',weatherMode:'rain',quality:'high'});});
  const draw=()=>{city.civic.busFrame++;renderer.draw(ctx,city,view,{enabled:true,realisticArt:true,timeMode:'night',weatherMode:'rain',quality:'high'});};
  for(const name of ['water','windows']){const original=renderer[name].draw;renderer[name].draw=()=>({cells:0,polluted:0,buildings:0,windows:0,pixels:0});slices['without-'+name]=measure(draw,12);renderer[name].draw=original;}
  const originalSprite=renderer.sprite;renderer.sprite=()=>{};slices['without-sprites']=measure(draw,12);renderer.sprite=originalSprite;
  const state=JSON.parse(render_game_to_text());
  return {slices,zones:city.zones.length,metrics:renderer.describe(city),appVersion:document.querySelector('script[type=module]').src,simulationYear:state.year,appZoom:state.zoom,mapWidth:city.width,mapHeight:city.height};
 },city.serialize());
 await page.evaluate(()=>{renderTimings.frames=[];renderTimings.paints=[];});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
 await page.locator('#pause').click();await page.waitForTimeout(5000);
 const {profile}=await cdp.send('Profiler.stop'),counts=new Map();
 for(const n of profile.nodes){if(n.hitCount){const key=n.callFrame.functionName+' '+n.callFrame.url.replace(/.*\/src\//,'');counts.set(key,(counts.get(key)||0)+n.hitCount);}}
 const top=[...counts].sort((a,b)=>b[1]-a[1]).slice(0,18);
 result.appFrames=await page.evaluate(()=>{const sorted=[...renderTimings.frames].sort((a,b)=>a-b);return {count:sorted.length,medianMs:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],maximumPaintsPerFrame:Math.max(...renderTimings.paints)};});result.baseline=baseline;
 result.cpuProfile={durationMs:(profile.endTime-profile.startTime)/1000,top};result.errors=errors;
 fs.mkdirSync('output',{recursive:true});fs.writeFileSync(process.argv[2]||'output/render-profile.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
