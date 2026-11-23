import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {chromium} from 'playwright';
const original=execFileSync('git',['show','3025a5e:src/city-graphics.js'],{encoding:'utf8'}),browser=await chromium.launch({executablePath:'C:/Users/drhoo/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe'});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.TEST_URL||'http://127.0.0.1:55719');await page.waitForFunction(()=>window.render_game_to_text);
 const report=await page.evaluate(async original=>{
  const app=document.querySelector('script[type=module]').src,source=await(await fetch(app)).text(),moduleURL=name=>new URL(source.match(new RegExp("from\\s*['\"]([^'\"]*"+name+"\\.js[^'\"]*)['\"]"))[1],app).href;
  const blob=URL.createObjectURL(new Blob([original],{type:'text/javascript'})),[before,after,{CityLayerCache},season]=await Promise.all([import(blob),import(moduleURL('city-graphics')),import(moduleURL('city-layer-cache')),import(new URL('rom-render.js',app).href)]);URL.revokeObjectURL(blob);
  const binary=async path=>new Uint8Array(await(await fetch(path)).arrayBuffer()),[base,animated,...palettes]=await Promise.all(['assets/graphics/GFX_Layer1_CitySimulationTiles.bin','assets/graphics/GFX_Layer2_AnimatedCitySimulationTiles.bin',...[0,1,2,3].map(n=>'assets/palettes/DATA_058'+n+'00.bin')].map(binary)),table=await(await fetch('assets/tables/city.json')).json();
  const old=new before.AnimatedCityAtlas(base,animated,palettes,table),next=new after.AnimatedCityAtlas(base,animated,palettes,table),phase=after.cityAnimationState(),city={map:Uint16Array.from({length:958},(_,i)=>i)},layers=[0,1].map(()=>Object.assign(document.createElement('canvas'),{width:256,height:240})),draw=layers.map(c=>c.getContext('2d',{willReadFrequently:true})),caches=[new CityLayerCache(),new CityLayerCache()];
  let checks=0,baselineTiles=0,previousKey='',beforeLayerDraws=0,afterLayerDraws=0,paletteVersion=0,previousPalette=null;const rows=[];
  const pixels=canvas=>canvas.getContext('2d').getImageData(0,0,256,240).data;
  const check=(label,which,pal=null,key='')=>{
   const a=old.image(which,phase,pal,key),b=next.image(which,phase,pal,key),changed=old.key!==previousKey;baselineTiles+=changed?958:0;previousKey=old.key;
   const current=pal||palettes[which];if(changed&&(!previousPalette||current.some((n,i)=>n!==previousPalette[i]))){paletteVersion++;previousPalette=Uint8Array.from(current);}if(next.paletteVersion!==paletteVersion)throw Error('Palette version differs: '+label);
   const pa=pixels(a),pb=pixels(b);for(let i=0;i<pa.length;i++)if(pa[i]!==pb[i])throw Error('Atlas pixel differs: '+label+' byte '+i);
   if(a.cityGroundVersion!==b.cityGroundVersion)throw Error('Ground generation differs: '+label);
   for(let n=0;n<2;n++){const atlas=n?b:a;draw[n].imageSmoothingEnabled=false;caches[n].begin(city,table,n?next.key:old.key,n?next.paletteVersion:which+':'+key);for(let id=0;id<958;id++)if(caches[n].dirty(id,id,null)){draw[n].drawImage(atlas,id%32*8,(id>>5)*8,8,8,id%32*8,(id>>5)*8,8,8);if(n)afterLayerDraws++;else beforeLayerDraws++;}}
   const la=pixels(layers[0]),lb=pixels(layers[1]);for(let i=0;i<la.length;i++)if(la[i]!==lb[i])throw Error('Cached map layer differs: '+label+' byte '+i);
   checks++;if(label.startsWith('same-palette'))rows.push({label,paletteVersion:next.paletteVersion,fullBuilds:next.stats.fullBuilds});
  };
  for(let which=0;which<4;which++)for(let frame=0;frame<144;frame++){check('season '+which+' animation '+frame,which);after.advanceCityAnimation(phase,1);}
  for(let which=0;which<4;which++)for(const progress of [0,1,2,3,8,16,32,64,96,133,134,135]){after.advanceCityAnimation(phase,7);check('fade '+which+':'+progress,which,season.romSeasonPalette(palettes,which,progress),'fade-'+which+':'+progress);}
  const unchangedFull=next.stats.fullBuilds;for(let i=0;i<20;i++)check('same-palette '+i,3,Uint8Array.from(previousPalette),'equivalent-'+i);if(next.stats.fullBuilds!==unchangedFull)throw Error('Identical palette bytes rebuilt static pixels');
  const altered=Uint8Array.from(previousPalette);altered[3]^=31;check('changed palette bytes',3,altered,'actual-palette-change');
  document.querySelector('#modal').classList.add('hidden');document.querySelector('main').style.display='none';layers[1].style.cssText='display:block;width:512px;height:480px;image-rendering:pixelated';document.body.append(layers[1]);layers[1].id='atlasDeltaComparison';
  return {checks,channelsPerComparison:256*240*4,atlasAndLayerPixelsEqual:true,groundVersionsEqual:true,paletteVersions:next.paletteVersion,animatedIds:next.animatedIds.length,baselineDecodedTiles:baselineTiles,candidateDecodedTiles:next.stats.tiles,beforeLayerDraws,afterLayerDraws,stats:next.stats,equivalentPaletteChecks:rows};
 },original);fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/atlas-deltas-v41.json',JSON.stringify(report,null,2));await page.locator('#atlasDeltaComparison').screenshot({path:'output/atlas-deltas-v41.png'});assert.deepEqual(errors,[]);assert.equal(report.checks,645);assert.ok(report.candidateDecodedTiles<report.baselineDecodedTiles);assert.ok(report.afterLayerDraws<report.beforeLayerDraws);console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
