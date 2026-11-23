import fs from 'node:fs';import assert from 'node:assert/strict';import {chromium} from 'playwright';
const browser=await chromium.launch({executablePath:'C:/Users/drhoo/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe'});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.TEST_URL||'http://127.0.0.1:55719');await page.waitForFunction(()=>window.render_game_to_text);
 const report=await page.evaluate(async()=>{
  const app=document.querySelector('script[type=module]').src,source=await(await fetch(app)).text(),url=name=>new URL(source.match(new RegExp("from\\s*['\"]([^'\"]*"+name+"\\.js[^'\"]*)['\"]"))[1],app).href;
  const [{CityLayerCache},gfx]=await Promise.all([import(url('city-layer-cache')),import(url('city-graphics'))]),binary=async path=>new Uint8Array(await(await fetch(path)).arrayBuffer()),[base,animated,...palettes]=await Promise.all(['assets/graphics/GFX_Layer1_CitySimulationTiles.bin','assets/graphics/GFX_Layer2_AnimatedCitySimulationTiles.bin',...[0,1,2,3].map(n=>'assets/palettes/DATA_058'+n+'00.bin')].map(binary)),table=await(await fetch('assets/tables/city.json')).json(),producer=new gfx.AnimatedCityAtlas(base,animated,palettes,table),phase=gfx.cityAnimationState(),city={map:Uint16Array.from({length:960},(_,i)=>i%958)},canvases=[0,1].map(()=>Object.assign(document.createElement('canvas'),{width:256,height:240})),contexts=canvases.map(c=>c.getContext('2d',{willReadFrequently:true})),caches=[new CityLayerCache(),new CityLayerCache()];
  let checks=0,legacyDraws=0;const rows=[];
  const compare=(label,{season=0,palette=null,key='',overlay=false,view=[0,0,32,30]}={})=>{
   const atlas=producer.image(season,phase,palette,key);
   for(let n=0;n<2;n++){const ctx=contexts[n],cache=caches[n];ctx.imageSmoothingEnabled=false;cache.begin(city,table,producer.key,producer.paletteVersion,n?{context:ctx,atlas,plain:!overlay}:{});
    for(let y=view[1];y<view[3];y++)for(let x=view[0];x<view[2];x++){const i=y*32+x,id=city.map[i]&1023,color=overlay&&id%3===0?'rgba(255,0,0,.4)':null;if(n)cache.paint(i,id,x*8,y*8,color,atlas,ctx);else if(cache.dirty(i,id,color)){ctx.drawImage(atlas,id%32*8,(id>>5)*8,8,8,x*8,y*8,8,8);if(color){ctx.fillStyle=color;ctx.fillRect(x*8,y*8,8,8);}legacyDraws++;}}
    if(n)cache.flush();
   }
   const a=contexts[0].getImageData(0,0,256,240).data,b=contexts[1].getImageData(0,0,256,240).data;for(let i=0;i<a.length;i++)if(a[i]!==b[i])throw Error(label+' byte '+i+' differs');checks++;rows.push({label,raster:caches[1].raster,uploads:caches[1].stats.rasterUploads});
  };
  for(let season=0;season<4;season++)for(let frame=0;frame<48;frame++){compare('season '+season+' frame '+frame,{season});gfx.advanceCityAnimation(phase,1);}
  compare('overlay on',{overlay:true});city.map[300]=2;city.map[600]=0x120;compare('overlay edit',{overlay:true});compare('normal after overlay');
  compare('overlay partial',{overlay:true,view:[10,5,25,20]});city.map[10]=0x1ef;compare('normal pan left',{view:[0,0,16,15]});compare('normal pan right',{view:[16,15,32,30]});compare('normal full after pan');
  const changed=Uint8Array.from(palettes[0]);changed[1]^=31;compare('palette change',{palette:changed,key:'actual-color'});const uploads=caches[1].stats.rasterUploads;compare('unchanged frame',{palette:changed,key:'actual-color'});if(caches[1].stats.rasterUploads!==uploads)throw Error('Clean frame uploaded pixels');
  // Explicitly unsupported drawing state must keep Canvas compositing.
  for(const props of [{globalAlpha:.5},{globalCompositeOperation:'multiply'},{filter:'blur(1px)'},{shadowBlur:2,shadowColor:'#ff0000'},{translate:1}]){for(const [n,ctx]of contexts.entries()){ctx.save();for(const [k,v]of Object.entries(props))if(k==='translate')ctx.translate(v,0);else ctx[k]=v;caches[n].ids.fill(65535);}compare('fallback '+JSON.stringify(props));if(caches[1].raster)throw Error('Unsupported state used raster');for(const ctx of contexts)ctx.restore();for(const cache of caches)cache.ids.fill(65535);}
  compare('restore normal state');
  for(const canvas of canvases){canvas.width=384;canvas.height=320;}for(const cache of caches)cache.ids.fill(65535);compare('resized surface');
  document.querySelector('#modal').classList.add('hidden');document.querySelector('main').style.display='none';canvases[1].style.cssText='display:block;width:768px;height:640px;image-rendering:pixelated';document.body.append(canvases[1]);canvases[1].id='rasterLayerComparison';return {checks,pixelsEqual:true,legacyDraws,rasterStats:caches[1].stats,retainedBytes:caches[1].pixels.data.byteLength,rows};
 });fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/raster-layer-v41.json',JSON.stringify(report,null,2));await page.locator('#rasterLayerComparison').screenshot({path:'output/raster-layer-v41.png'});assert.deepEqual(errors,[]);assert.equal(report.checks,208);assert.ok(report.rasterStats.rasterTiles>0);console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
