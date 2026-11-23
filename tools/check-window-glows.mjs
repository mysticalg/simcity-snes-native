import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const nativeAtlas=process.argv.includes('--native-atlas');const reference=process.argv.find(a=>a.startsWith('--baseline='))?.slice(11)||'03eee3c',suffix=process.env.GLOW_CHECK_SUFFIX||'v43',original=execFileSync('git',['show',reference+':src/window-lights.js'],{encoding:'utf8'});
const browser=await chromium.launch({executablePath:'C:/Users/drhoo/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe'});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:55719');await page.waitForFunction(()=>window.render_game_to_text);
 const result=await page.evaluate(async({original,reference,nativeAtlas})=>{
  const app=document.querySelector('script[type=module]').src,text=await(await fetch(app)).text(),moduleURL=(s,base,name)=>new URL(s.match(new RegExp("from\\s*['\"]([^'\"]*"+name+"\\.js[^'\"]*)['\"]"))[1],base).href;
  const weatherURL=moduleURL(text,app,'weather-fx'),weather=await(await fetch(weatherURL)).text(),target=moduleURL(weather,weatherURL,'window-lights');
  const body=original.replace(/(['"])\.\/([^'"]+)\1/g,(_,q,p)=>q+new URL(p,target).href+q),blob=URL.createObjectURL(new Blob([body],{type:'text/javascript'}));
  const [{WindowLights:Before},{WindowLights:After},{City},{CIVIC_TOOLS}]=await Promise.all([import(blob),import(target),import(moduleURL(text,app,'simulation')),import('./src/civic.js')]);URL.revokeObjectURL(blob);
  const [build,table]=await Promise.all(['build','city'].map(n=>fetch('assets/tables/'+n+'.json').then(r=>r.json()))),city=new City(new Uint16Array(240*200),build,table.flags,{width:240,height:200});
  const tools=[...CIVIC_TOOLS.filter(b=>b.kind!=='pipe').map(b=>b.tool),5,6,7,13,14];
  for(const[n,tool]of tools.entries())for(const p of city.footprint(tool,2+n%9*26,2+Math.floor(n/9)*25))city.map[p.y*240+p.x]=p.id;
  city.refresh();city.power.fill(1);
  const renderers=[new Before(),new After()];await Promise.all(renderers.map(r=>r.ready));
  let atlas=new Image();atlas.src='assets/city-0.png';await atlas.decode();if(nativeAtlas){const gfx=await import(moduleURL(text,app,'city-graphics')),binary=async path=>new Uint8Array(await(await fetch(path)).arrayBuffer()),parts=await Promise.all(['assets/graphics/GFX_Layer1_CitySimulationTiles.bin','assets/graphics/GFX_Layer2_AnimatedCitySimulationTiles.bin',...[0,1,2,3].map(n=>'assets/palettes/DATA_058'+n+'00.bin')].map(binary));atlas=new gfx.AnimatedCityAtlas(parts[0],parts[1],parts.slice(2),table).image(0,gfx.cityAnimationState());}
  const canvases=[0,1].map(()=>Object.assign(document.createElement('canvas'),{width:960,height:800})),contexts=canvases.map(c=>c.getContext('2d',{willReadFrequently:true})),rows=[];
  const initialZones=city.zones.slice(),initialMasks=renderers.map(r=>r.mask);let caller={},rotation=0,clip=false,active=-1;const calls=[{},{}],prototype=CanvasRenderingContext2D.prototype,methods={};
  for(const name of['fillRect','putImageData','drawImage','getImageData']){methods[name]=prototype[name];prototype[name]=function(...args){if(active>=0&&this.canvas!==canvases[active]){calls[active][name]=(calls[active][name]||0)+1;if(name==='drawImage'&&this.shadowBlur)calls[active].shadowDraws++;}return methods[name].apply(this,args);};}
  const render=(n,time,zoom,camera,night)=>{
   const ctx=contexts[n];ctx.setTransform(1,0,0,1,0,0);Object.assign(ctx,{globalAlpha:1,globalCompositeOperation:'source-over',filter:'none',shadowBlur:0,shadowColor:'rgba(0, 0, 0, 0)',shadowOffsetX:0,shadowOffsetY:0,imageSmoothingEnabled:true});ctx.fillStyle='#183025';ctx.fillRect(0,0,960,800);ctx.save();ctx.scale(zoom,zoom);ctx.translate(-camera[0]*8,-camera[1]*8);Object.assign(ctx,caller);if(rotation)ctx.rotate(rotation);if(clip){ctx.beginPath();ctx.rect(30,40,250,200);ctx.clip();}const transform=ctx.getTransform(),state=JSON.stringify([ctx.globalAlpha,ctx.globalCompositeOperation,ctx.filter,ctx.imageSmoothingEnabled,...['a','b','c','d','e','f'].map(k=>transform[k])]);
   calls[n]={fillRect:0,putImageData:0,drawImage:0,shadowDraws:0};active=n;const metrics=renderers[n].draw(ctx,city,city.zones,atlas,{x:camera[0],y:camera[1],width:120/zoom,height:100/zoom},night,time);active=-1;const after=ctx.getTransform();if(state!==JSON.stringify([ctx.globalAlpha,ctx.globalCompositeOperation,ctx.filter,ctx.imageSmoothingEnabled,...['a','b','c','d','e','f'].map(k=>after[k])]))throw Error('Caller state changed');ctx.restore();return metrics;
  };
  const compare=(label,time,zoom=.5,camera=[0,0],night=1)=>{
   const a=render(0,time,zoom,camera,night),b=render(1,time,zoom,camera,night),pa=contexts[0].getImageData(0,0,960,800).data,pb=contexts[1].getImageData(0,0,960,800).data;let different=0,maximum=0;
   for(let i=0;i<pa.length;i++){const d=Math.abs(pa[i]-pb[i]);if(d)different++;if(d>maximum)maximum=d;}
   if(JSON.stringify(a)!==JSON.stringify(b))throw Error('Window metrics differ');rows.push({label,time,zoom,camera,night,...b,different,maximum,callsBefore:{...calls[0]},callsAfter:{...calls[1]}});
  };
  for(const time of[0,.01,.1874,.1875,.5,1,1.5,2,2.99,3,44.99,45,45.01,45.1875,46.5,48,89.99,90,91,93])compare('fade',time);
  for(const zoom of[.25,.5,1,1.37,2,4])for(const night of[.43,1])compare('zoom',91.125,zoom,zoom<1?[0,0]:[70.2,50.125],night);
  for(const props of[{globalAlpha:.6},{globalCompositeOperation:'multiply'},{filter:'blur(1px)'},{imageSmoothingEnabled:false},{imageSmoothingQuality:'high'},{shadowBlur:2,shadowColor:'#ff0000',shadowOffsetX:1,shadowOffsetY:-1}]){caller=props;compare('caller '+JSON.stringify(props),92.5,1,[70,50]);}caller={};rotation=.02;compare('rotated',92.5,1,[70,50]);rotation=0;clip=true;compare('clipped',92.5,1,[70,50]);clip=false;
  city.revision++;city.zones=city.zones.slice(1);compare('remove',92.5);compare('paused repeated',92.5);city.revision++;city.zones[0]={...city.zones[0],x:city.zones[0].x+1};compare('moved',93);
  const shared=renderers[1].states.get(city),retained=shared.pages.map(p=>p.glow),bytes=shared.pages.reduce((n,p)=>n+p.source.width*p.source.height*8,0);compare('reuse source storage',94);const reused=retained.every(canvas=>shared.pages.some(p=>p.glow===canvas));
  const duplicate=[{pixels:[{x:2,y:2},{x:3,y:2}]},{pixels:[{x:3,y:2},{x:4,y:2}]}];for(const r of renderers){r.states=new WeakMap();r.mask=()=>({x:16,y:16,windows:duplicate});}city.zones=[{i:30,id:963,x:3,y:3}];compare('overlap fallback',45.5);compare('overlap fallback fade',46.5);
  const wide=[{pixels:[{x:2,y:2},{x:50,y:2},{x:50,y:50}]}];for(const r of renderers){r.states=new WeakMap();r.mask=(_,z)=>({x:z.x*8,y:z.y*8,windows:wide});}city.zones=Array.from({length:100},(_,n)=>({i:n+30,id:963,x:8+n%12*10,y:8+Math.floor(n/12)*10}));compare('multiple pages',45.5);const multiPages=renderers[1].states.get(city).pages.length;compare('multiple pages fade',46.5);compare('multiple pages smooth sampling',46.75,1.37,[70.2,50.125]);
  const huge=[{pixels:[{x:2,y:2},{x:520,y:2}]}];for(const r of renderers){r.states=new WeakMap();r.mask=()=>({x:16,y:16,windows:huge});}city.zones=[{i:30,id:963,x:3,y:3}];compare('oversized original path',45.5);compare('oversized smooth path',46.5,1.37);city.zones=[];compare('empty visible set',46.5);const emptyPages=renderers[1].states.get(city).pages.length;
  city.zones=initialZones;city.revision++;for(const[n,r]of renderers.entries()){r.states=new WeakMap();r.mask=initialMasks[n];}compare('final actual civic gallery',46.5);
  for(const[name,fn]of Object.entries(methods))prototype[name]=fn;
  document.querySelector('#modal').classList.add('hidden');document.querySelector('main').style.display='none';canvases[1].id='windowGlowComparison';document.body.append(canvases[1]);
  return {reference,nativeAtlas,tools:tools.length,rows,sourceStorage:{pages:retained.length,rawCanvasBytes:bytes,reused},multiPages,emptyPages};
 },{original,reference,nativeAtlas});
 fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/window-glow-pixels-'+suffix+'.json',JSON.stringify(result,null,2));await page.locator('#windowGlowComparison').screenshot({path:'output/window-glow-'+suffix+'.png'});
 console.log(JSON.stringify(result,null,2));assert.deepEqual(errors,[]);
 assert.ok(result.rows.every(r=>r.different===0),'Shared glow pixels differ');
 if(reference==='03eee3c')assert.ok(result.rows.some(r=>r.callsBefore.shadowDraws>30&&r.callsAfter.shadowDraws<3));else assert.ok(result.rows.every(r=>r.callsBefore.shadowDraws===r.callsAfter.shadowDraws));
 assert.equal(result.rows.find(r=>r.label==='paused repeated').callsAfter.shadowDraws,0);assert.ok(result.sourceStorage.reused);
 assert.ok(result.multiPages>=3);assert.equal(result.emptyPages,0);
}finally{await browser.close();}
