import {HISTORY_LABELS} from './rom-history.js?v=history-3';
import {AnimatedCityAtlas,cityAnimationState,advanceCityAnimation} from './city-graphics.js';
import {drawPowerWarnings,unpoweredBuildings} from './power-warnings.js?v=power-visible-2';
import {strokeCells} from './build-stroke.js';
import {cityPaletteForMonth} from './rom-render.js';
import {RomSampleAudio} from './rom-audio.js';
const romAudio=new RomSampleAudio();
import{City,SCENARIOS,TOOLS,W,H,clamp}from'./simulation.js?v=history-3';
const $=s=>document.querySelector(s),canvas=$('#game'),ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=false;
const files=await Promise.all([fetch('assets/tables/city.json').then(r=>r.json()),fetch('assets/tables/build.json').then(r=>r.json()),...['city-0.png','city-1.png','city-2.png','city-3.png'].map(n=>new Promise((ok,no)=>{const i=new Image;i.onload=()=>ok(i);i.onerror=no;i.src='assets/'+n})),...SCENARIOS.map(s=>fetch(`assets/maps/Map_${s.id}.json`).then(r=>r.json()))]);
const[table,build,...rest]=files,atlases=rest.slice(0,4),maps=rest.slice(4),flags=table.flags;
const binary=async path=>{const r=await fetch(path);if(!r.ok)throw Error('Graphics unavailable: '+path);return new Uint8Array(await r.arrayBuffer());};
const graphicsData=await Promise.all(['assets/graphics/GFX_Layer1_CitySimulationTiles.bin','assets/graphics/GFX_Layer2_AnimatedCitySimulationTiles.bin',...[0,1,2,3].map(s=>'assets/palettes/DATA_058'+s+'00.bin')].map(binary));
const animatedAtlas=new AnimatedCityAtlas(graphicsData[0],graphicsData[1],graphicsData.slice(2),table);let animation=cityAnimationState(),animationRemainder=0,currentAtlas=atlases[0];
const trainImage=new Image();trainImage.src='assets/train.png';await trainImage.decode();const shipImage=new Image();shipImage.src='assets/ship.png';await shipImage.decode();
let zoom=1;const speeds=[1,2,3,4,8,16];
let city=null,selected=-1,cursor={x:60,y:50},camera={x:0,y:0},paused=false,mapView=false,modalStep='welcome',onGo=null,sound=false;
function modal(title,text,body='',go='CONTINUE',action=null){$('#modalTitle').textContent=title;$('#modalText').textContent=text;$('#modalBody').innerHTML=body;$('#modalGo').textContent=go;$('#modalGo').style.display=go?'':'none';$('#modal').classList.remove('hidden');onGo=action;}
function start(id='PracticeCity'){const i=SCENARIOS.findIndex(s=>s.id===id),s=SCENARIOS[i],name=s.name;city=new City(maps[i],build,flags,{name,scenario:id,year:s.year});camera={x:0,y:0};animation=cityAnimationState();animationRemainder=0;selected=1;paused=false;$('#modal').classList.add('hidden');paint();}
function menu(){modal('Choose a city','Select an original cartridge map. Scenario objectives and timed events are still being reconstructed.','<div class="choices">'+SCENARIOS.map(s=>`<button class="choice" data-city="${s.id}"><strong>${s.name}</strong><span>${s.year} · ${s.description}</span></button>`).join('')+'</div>','',null);$('#modalGo').style.display='none';$('#modalClose').textContent='CLOSE';document.querySelectorAll('[data-city]').forEach(b=>b.onclick=()=>start(b.dataset.city));}
function setup(){const zb=document.createElement('button');zb.id='zoom';zb.textContent='ZOOM 1×';zb.onclick=()=>setZoom([1,2,4][([1,2,4].indexOf(zoom)+1)%3]);document.querySelector('#view').after(zb);canvas.addEventListener('wheel',e=>{if(!city)return;e.preventDefault();setZoom(clamp(zoom*(e.deltaY<0?2:.5),1,4));},{passive:false});const nav=$('#nav');[['NEW CITY',menu],['INFORMATION',()=>modal('City information','Your city grows when zones connect to roads, power is available, and demand is positive.','Residential, commercial, and industrial zones need roads and electricity.')],['CITY HISTORY',cityHistory],['FISCAL BUDGET',budget],['DISASTERS',disasters]].forEach(([label,fn])=>{let b=document.createElement('button');b.textContent=label;b.onclick=fn;nav.append(b)});
const icons=['🚜','🛣','🛤','⚡','🌳','🏠','🏢','🏭','🛡','🚒','🏟','⚓','✈','☢','♨','🎁'];
TOOLS.forEach((n,i)=>{let b=document.createElement('button');b.innerHTML=`<span class="tool-icon" aria-hidden="true">${icons[i]}</span><span>${n}</span>`;b.title=n;b.setAttribute('aria-label',n);b.dataset.tool=i;b.onclick=()=>{if(i===15){giftMenu();return;}selected=i;updateTools()};$('#tools').append(b)});
$('#pause').onclick=()=>{paused=!paused;$('#pause').textContent=paused?'▶ RESUME':'Ⅱ PAUSE'};$('#speed').onclick=()=>{city.speed=speeds[(speeds.indexOf(city.speed)+1)%speeds.length];$('#speed').textContent=`SPEED ${city.speed}×`};$('#view').onclick=()=>{mapView=!mapView;paint()};$('#save').onclick=save;$('#load').onclick=()=>$('#file').click();$('#file').onchange=load;$('#sound').onclick=async()=>{sound=!sound;$('#sound').textContent=sound?'SOUND ON':'SOUND OFF';try{if(sound){await romAudio.start();romAudio.mute(false);await romAudio.playOriginalOpening();}else romAudio.mute(true);}catch(error){sound=false;$('#sound').textContent='SOUND OFF';city?.message('Audio: '+error.message);}};$('#modalGo').onclick=()=>{if(onGo)onGo();else $('#modal').classList.add('hidden')};$('#modalClose').onclick=()=>{if(!city?.pendingBudget)$('#modal').classList.add('hidden');};}
function cityHistory(){if(!city)return;modal('City history','The ten most recent recorded events, oldest first.',city.eventHistory.length?'<ol class="event-history">'+city.eventHistory.map(e=>'<li>'+e.year+' · '+['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][e.month-1]+' — '+(HISTORY_LABELS[e.id]||'Event '+e.id)+'</li>').join('')+'</ol>':'<p>No events recorded yet.</p>');}
function giftMenu(){
 if(!city)return;
 const names={15:'Mayor’s house',16:'City park',17:'Zoo',18:'Gift building',19:'Casino',20:'Landmark',21:'Police headquarters',22:'Fire headquarters',23:'Gift building',24:'Gift building',25:'Gift building',26:'Gift building',27:'Gift building',28:'Gift building',29:'Gift building'};
 modal('Available gifts',city.gifts.length?'Choose a gift, then click the map to place it.':'No gifts are available yet.',city.gifts.map((id,index)=>`<button data-gift="${index}">${names[id]||'Gift'} (${id})</button>`).join(''),'CLOSE');
 document.querySelectorAll('[data-gift]').forEach(button=>button.onclick=()=>{selected=city.gifts[+button.dataset.gift];document.querySelector('#modal').classList.add('hidden');paint();});
}function budget(){if(!city)return;let b=city.budget(false,city.pendingBudget?.taxRate??city.tax);modal(city.pendingBudget?'Annual fiscal budget '+city.pendingBudget.year:'Fiscal budget',`Annual revenue $${b.income.toLocaleString()} · projected balance ${b.net<0?'−':''}$${Math.abs(b.net).toLocaleString()}.` ,`Tax rate <input id="tax" type="range" min="0" max="20" value="${city.tax}"> <span id="taxv">${city.tax}%</span><p>Transport <input id="f0" type="range" min="0" max="100" value="${city.funding[0]}"> <span id="f0v">${city.funding[0]}%</span></p><p>Police <input id="f1" type="range" min="0" max="100" value="${city.funding[1]}"> <span id="f1v">${city.funding[1]}%</span>　 Fire <input id="f2" type="range" min="0" max="100" value="${city.funding[2]}"> <span id="f2v">${city.funding[2]}%</span></p><p><label><input id="autoBudget" type="checkbox" ${city.autoBudget?'checked':''}> Automatic annual budget</label></p><button id="loan">REQUEST $10,000 BANK LOAN</button><p>$500 annually for 21 years.</p>`,'APPLY',()=>{city.tax=+$('#tax').value;city.funding=[0,1,2].map(i=>+$('#f'+i).value);city.autoBudget=$('#autoBudget').checked;if(city.pendingBudget)city.settleAnnualBudget();$('#modal').classList.add('hidden');refresh()});$('#tax').oninput=e=>$('#taxv').textContent=e.target.value+'%';for(let i=0;i<3;i++)$('#f'+i).oninput=e=>$('#f'+i+'v').textContent=e.target.value+'%';$('#loan').onclick=()=>{city.takeLoan();refresh()};}
function disasters(){const choices=['Fire','Earthquake','Tornado','Flood','Meltdown','Monster'];modal('Disaster control','Trigger a disaster to see the current reconstruction’s effects.',`<div class="choices">${choices.map(t=>`<button data-disaster="${t}">${t}</button>`).join('')}</div>`,'CLOSE');document.querySelectorAll('[data-disaster]').forEach(b=>b.onclick=()=>{city.disaster(b.dataset.disaster,cursor.x,cursor.y);$('#modal').classList.add('hidden')});}
function updateTools(){document.querySelectorAll('#tools button').forEach(b=>b.classList.toggle('selected',+b.dataset.tool===selected));}
function centerCamera(){camera.x=clamp(cursor.x-60/zoom,0,Math.max(0,W-120/zoom));camera.y=clamp(cursor.y-37.5/zoom,0,Math.max(0,H-75/zoom));}
function setZoom(value){zoom=value;centerCamera();document.querySelector('#zoom').textContent='ZOOM '+zoom+'×';paint();}
function cell(x,y){if(x<0||x>=W||y<0||y>=H)return;const id=city.map[y*W+x]&1023;const season=cityPaletteForMonth(city.month),atlas=currentAtlas,i=clamp(id,0,957),sx=(i%32)*8,sy=(i>>5)*8,dx=x*8,dy=y*8;if(mapView){ctx.fillStyle=`hsl(${(id*17)%360} 36% ${id<4?38:50}%)`;ctx.fillRect(dx,dy,8,8);return;}ctx.drawImage(atlas,sx,sy,8,8,dx,dy,8,8);}
function paint(){if(!city)return;currentAtlas=animatedAtlas.image(cityPaletteForMonth(city.month),animation);ctx.fillStyle='#071c33';ctx.fillRect(0,0,960,600);ctx.save();ctx.scale(zoom,zoom);if(city.quakeFrames)ctx.translate((city.quakePhase&8)?-2:2,0);ctx.translate(-camera.x*8,-camera.y*8);const x0=Math.floor(Math.max(0,camera.x)),y0=Math.floor(Math.max(0,camera.y)),x1=Math.min(W,camera.x+120/zoom),y1=Math.min(H,camera.y+75/zoom);for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)cell(x,y);
if(selected>=0&&selected<build.buildings.length){ctx.globalAlpha=.75;for(const c of city.footprint(selected,cursor.x,cursor.y)){if(c.x>=x0&&c.x<x1&&c.y>=y0&&c.y<y1){ctx.fillStyle=city.canBuild(selected,cursor.x,cursor.y).ok?'#d5ff7d':'#ff755e';ctx.fillRect(c.x*8,c.y*8,8,8)}}ctx.globalAlpha=1;}
if(city.ship.active&&!city.ship.initializing)ctx.drawImage(shipImage,city.ship.direction*32,0,32,32,city.ship.pixelX-12,city.ship.pixelY-12,32,32);
if(city.train.active&&!city.train.hidden)ctx.drawImage(trainImage,city.train.frame*8,0,8,8,city.train.x-4,city.train.y-4,8,8);
drawPowerWarnings(ctx,city);ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.strokeRect(cursor.x*8+.5,cursor.y*8+.5,7,7);ctx.restore();refresh();}
function refresh(){if(!city)return;if(city.pendingBudget&&$('#modal').classList.contains('hidden'))budget();if(!city.pendingBudget&&city.scenarioResult&&!city.scenarioDialogSeen){city.scenarioDialogSeen=true;modal(city.scenarioResult==='won'?'Scenario complete':'Scenario failed','The scenario deadline has been reached. You can continue managing this city.');}$('#cityName').textContent=city.name.toUpperCase();$('#date').textContent=`${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][city.month-1]} ${city.year}`;$('#funds').textContent='$'+city.funds.toLocaleString();$('#population').textContent=city.population.toLocaleString();$('#report').textContent=`${['VILLAGE','TOWN','CITY','CAPITAL','METROPOLIS','MEGALOPOLIS'][city.category]}\nR ${city.rci[0]}   C ${city.rci[1]}   I ${city.rci[2]}\nDEMAND ${city.demand.join(' / ')}${city.growthCaps.suppressed.some(Boolean)?' · NEEDS '+['STADIUM','AIRPORT','SEAPORT'].filter((_,i)=>city.growthCaps.suppressed[i]).join(', '):''}\nPOWER ${city.powerUsed}/${city.powerCapacity}${city.powerOverloaded?' · OVERLOADED':''} · UNPOWERED ${unpoweredBuildings(city).length}\nROADS ${city.roadCount} · RAIL ${city.railCount}\nCRIME ${Math.round(city.meanCrime||0)} · SCORE ${city.score}\n${city.notices[0]||'Hold left mouse and drag to build roads, rails or power lines.'}`;updateTools();}
let stroke=null,touchMode='pan',panGesture=null;
const mobileControls=document.createElement('div');mobileControls.className='mobile-controls';
mobileControls.innerHTML='<button id="touchPan" aria-pressed="true">✥ PAN</button><button id="touchBuild" aria-pressed="false">BUILD</button><button id="zoomOut" aria-label="Zoom out">− ZOOM</button><button id="zoomIn" aria-label="Zoom in">+ ZOOM</button><span>Pan: drag the map · Build: choose a tool, then tap or drag</span>';
document.querySelector('.screen').after(mobileControls);
function setTouchMode(mode){touchMode=mode;stroke=null;panGesture=null;$('#touchPan').setAttribute('aria-pressed',mode==='pan');$('#touchBuild').setAttribute('aria-pressed',mode==='build');}
$('#touchPan').onclick=()=>setTouchMode('pan');$('#touchBuild').onclick=()=>setTouchMode('build');
$('#zoomOut').onclick=()=>{if(city)setZoom(Math.max(1,zoom/2));};$('#zoomIn').onclick=()=>{if(city)setZoom(Math.min(4,zoom*2));};
document.querySelector('#tools').addEventListener('click',e=>{if(e.target.closest('[data-tool]'))setTouchMode('build');});
function pointer(e,buildNow){
 if(!city)return;
 const r=canvas.getBoundingClientRect(),px=(e.clientX-r.left)*canvas.width/r.width,py=(e.clientY-r.top)*canvas.height/r.height;
 cursor={x:clamp(Math.floor(px/(8*zoom)+camera.x),0,W-1),y:clamp(Math.floor(py/(8*zoom)+camera.y),0,H-1)};
 if(buildNow&&selected>=0){
  const cells=stroke?strokeCells(stroke.last,cursor):[cursor];
  for(const c of cells){
   const key=c.y*W+c.x,tool=stroke?.tool??selected;if(stroke?.visited.has(key))continue;
   const footprint=tool>4?city.footprint(tool,c.x,c.y):[c];
   if(stroke&&footprint.some(p=>stroke.occupied.has(p.y*W+p.x)))continue;
   if(city.place(tool,c.x,c.y)&&stroke){stroke.visited.add(key);for(const p of footprint)stroke.occupied.add(p.y*W+p.x);}
  }
  if(stroke)stroke.last={...cursor};
 }
 paint();
}
canvas.style.touchAction='none';
canvas.onpointerdown=e=>{if(e.button!==0||!city||panGesture||stroke)return;e.preventDefault();try{canvas.setPointerCapture(e.pointerId);}catch{}if(matchMedia('(max-width:900px)').matches&&touchMode==='pan'){panGesture={id:e.pointerId,x:e.clientX,y:e.clientY,camera:{...camera}};return;}pointer(e,false);stroke={id:e.pointerId,tool:selected,last:{...cursor},visited:new Set(),occupied:new Set()};pointer(e,true);};
canvas.onpointermove=e=>{if(panGesture){if(e.pointerId!==panGesture.id)return;const r=canvas.getBoundingClientRect();camera.x=clamp(panGesture.camera.x-(e.clientX-panGesture.x)*960/r.width/(8*zoom),0,Math.max(0,W-120/zoom));camera.y=clamp(panGesture.camera.y-(e.clientY-panGesture.y)*600/r.height/(8*zoom),0,Math.max(0,H-75/zoom));paint();return;}if(stroke&&e.pointerId!==stroke.id)return;pointer(e,!!stroke);};
canvas.onpointerup=e=>{if(panGesture?.id===e.pointerId)panGesture=null;if(stroke?.id===e.pointerId){pointer(e,true);stroke=null;}if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);};
canvas.onpointercancel=()=>{stroke=null;panGesture=null;};
window.addEventListener('pointerup',()=>{stroke=null;});
canvas.addEventListener('dragstart',e=>e.preventDefault());
window.addEventListener('blur',()=>{stroke=null;panGesture=null;});window.onkeydown=e=>{if(e.key==='f'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();return}if($('#modal').classList.contains('hidden')===false)return;if(!city)return;const k=e.key.toLowerCase();if(k===' '){e.preventDefault();$('#pause').click()}else if(k==='m')$('#view').click();else if(k==='b')city.place(selected,cursor.x,cursor.y);else if(k>='1'&&k<='9'){selected=+k-1;updateTools()}else{const dx={arrowleft:-1,a:-1,arrowright:1,d:1}[k]||0,dy={arrowup:-1,w:-1,arrowdown:1,s:1}[k]||0;cursor.x=clamp(cursor.x+dx,0,W-1);cursor.y=clamp(cursor.y+dy,0,H-1);centerCamera();paint()}};
function save(){if(!city)return;const a=document.createElement('a'),url=URL.createObjectURL(new Blob([city.serialize()],{type:'application/json'}));a.href=url;a.download='simcity-save.json';a.click();URL.revokeObjectURL(url)}
async function load(e){try{city=City.restore(await e.target.files[0].text(),build,flags);camera={x:0,y:0};$('#modal').classList.add('hidden');paint()}catch(err){modal('Could not load city',err.message)}}
setup();modal('Welcome to SimCity','A native JavaScript reconstruction using graphics, palettes, construction tables, and all nine maps extracted from the matching USA SNES ROM. Choose a scenario to begin.','<p>This playable milestone is still in development. Scenario objectives and several simulation formulas remain approximations.</p>','CHOOSE A CITY',menu);
let lastWarningFrame=0;let last=performance.now(),acc=0;function frame(now){const dt=Math.min(100,now-last);last=now;if(city){animationRemainder+=dt*60/1000;const frames=Math.floor(animationRemainder);animationRemainder-=frames;advanceCityAnimation(animation,frames,paused);const wasQuaking=city.quakeFrames>0;city.advanceVisualFrames(frames,paused||!$('#modal').classList.contains('hidden'));if(wasQuaking||city.train.active||city.ship.active)paint();}if(city&&!paused&&$('#modal').classList.contains('hidden')){city.advance(dt);acc+=dt;if(acc>150){acc=0;paint()}}if(city&&Math.floor(now/500)!==Math.floor(lastWarningFrame/500)){paint();}lastWarningFrame=now;requestAnimationFrame(frame)}requestAnimationFrame(frame);
window.render_game_to_text=()=>JSON.stringify(city?{coordinates:'origin top-left; x right, y down; 120×100 tiles',mode:city.pendingBudget?'budget':paused?'paused':'city',autoBudget:city.autoBudget,pendingBudget:city.pendingBudget,zoom,camera:{...camera},touchMode,speed:city.speed,baseStep:city.baseStep,scenario:city.scenario,name:city.name,year:city.year,month:city.month,funds:city.funds,population:city.population,demand:city.demand,growthCaps:city.growthCaps.suppressed,selectedTool:TOOLS[selected]||`Gift ${selected}`,availableGifts:city.gifts,cursor,populationBands:city.rci,powerCapacity:city.powerCapacity,powerUsed:city.powerUsed,powerOverloaded:city.powerOverloaded,eventHistory:city.eventHistory,disasters:city.disasters,train:city.train,ship:city.ship,quakeFrames:city.quakeFrames,floodRemaining:city.floodRemaining,notices:city.notices.slice(0,2)}:{mode:'menu'});window.advanceTime=ms=>{if(city){animationRemainder+=ms*60/1000;const frames=Math.floor(animationRemainder);animationRemainder-=frames;advanceCityAnimation(animation,frames,paused);const wasQuaking=city.quakeFrames>0;city.advanceVisualFrames(frames,paused||!$('#modal').classList.contains('hidden'));if(wasQuaking||city.train.active||city.ship.active)paint();if(!paused)city.advance(ms);}paint()};














