import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Users/drhoo/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe'});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.TEST_URL||'http://localhost:5198');await page.waitForFunction(()=>window.render_game_to_text);
 const result=await page.evaluate(async()=>{
  const [{City},{WindowLights},{RealisticBuildings},{WaterSurface}]=await Promise.all(['simulation','window-lights','realistic-art','water-surface'].map(n=>import('./src/'+n+'.js')));
  const [build,table]=await Promise.all(['build','city'].map(n=>fetch('assets/tables/'+n+'.json').then(r=>r.json())));
  const city=new City(new Uint16Array(12000),build,table.flags);city.funds=200000;city.place(8,10,10);city.place(14,20,10);
  for(let y=20;y<40;y++)for(let x=30;x<50;x++){city.map[y*120+x]=2;city.seaPollution[y*120+x]=190;}
  city.refresh();city.power.fill(1);const atlas=new Image();atlas.src='assets/city-0.png';await atlas.decode();
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=600;const ctx=canvas.getContext('2d');let liveShadows=0;
  const proxy=new Proxy(ctx,{get:(target,key)=>typeof target[key]==='function'?target[key].bind(target):target[key],set:(target,key,value)=>{if(key==='shadowBlur'&&value>0)liveShadows++;target[key]=value;return true;}});
  const view={x:0,y:0,width:120,height:75,zoom:1,atlas},windows=new WindowLights(),photo=new RealisticBuildings(),water=new WaterSurface();
  await Promise.all([windows.ready,photo.ready,water.ready]);const before=city.serialize();
  const a=windows.draw(proxy,city,city.zones,atlas,view,1,4),entries=windows.states.get(city).entries,first=[...entries.values()][0].canvas;
  const b=windows.draw(proxy,city,city.zones,atlas,view,1,5),reusedWindow=first===[...entries.values()][0].canvas;
  windows.draw(proxy,city,city.zones,atlas,view,1,45.75);const fadedWindow=first!==[...entries.values()][0].canvas;
  photo.draw(proxy,city,view,atlas,1,4);const glows=photo.glows.size;photo.draw(proxy,city,{...view,zoom:2},atlas,1,5);const reusedPhoto=glows===photo.glows.size&&glows>0;
  const initial=water.draw(proxy,city,view,atlas,4),held=water.draw(proxy,city,view,atlas,4);
  let moving;for(let n=1;n<=20;n++)moving=water.draw(proxy,city,view,atlas,4+n/10);
  const pure=before===city.serialize();
  city.revision++;const unchanged=water.draw(proxy,city,view,atlas,6);
  city.seaPollution[25*120+35]=210;city.revision++;const changed=water.draw(proxy,city,view,atlas,6);
  city.seaPollution.fill(0);city.revision++;const clean=water.draw(proxy,city,view,atlas,6),state=water.states.get(city);
  return {liveShadows,windowCount:a.windows,windowCountStable:a.windows===b.windows,reusedWindow,fadedWindow,reusedPhoto,pure,initial,held,moving,unchanged,changed,clean,cleanMasksReleased:!state.softDose&&!state.softScum};
 });
 assert.equal(result.liveShadows,0);assert.ok(result.windowCount>0);assert.equal(result.windowCountStable,true);assert.equal(result.reusedWindow,true);assert.equal(result.fadedWindow,true);assert.equal(result.reusedPhoto,true);assert.equal(result.pure,true);
 assert.equal(result.initial.surfaceBuilds,result.held.surfaceBuilds);assert.ok(result.moving.surfaceBuilds>result.held.surfaceBuilds);assert.equal(result.moving.maskBuilds,result.initial.maskBuilds);assert.equal(result.unchanged.maskBuilds,result.initial.maskBuilds);assert.ok(result.changed.maskBuilds>result.initial.maskBuilds);assert.equal(result.clean.polluted,0);assert.equal(result.cleanMasksReleased,true);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({...result,errors},null,2));
}finally{await browser.close();}
