import {drawPowerWarnings,unpoweredBuildings} from './power-warnings.js';
import {strokeCells} from './build-stroke.js';
import {cityPaletteForMonth} from './rom-render.js';
import {RomSampleAudio} from './rom-audio.js';
const romAudio=new RomSampleAudio();
import{City,SCENARIOS,TOOLS,W,H,clamp}from'./simulation.js';
const $=s=>document.querySelector(s),canvas=$('#game'),ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=false;
const files=await Promise.all([fetch('assets/tables/city.json').then(r=>r.json()),fetch('assets/tables/build.json').then(r=>r.json()),...['city-0.png','city-1.png','city-2.png','city-3.png'].map(n=>new Promise((ok,no)=>{const i=new Image;i.onload=()=>ok(i);i.onerror=no;i.src='assets/'+n})),...SCENARIOS.map(s=>fetch(`assets/maps/Map_${s.id}.json`).then(r=>r.json()))]);
const[table,build,...rest]=files,atlases=rest.slice(0,4),maps=rest.slice(4),flags=table.flags;
let zoom=1;const speeds=[1,2,3,4,8,16];
let city=null,selected=-1,cursor={x:60,y:50},camera={x:0,y:0},paused=false,mapView=false,modalStep='welcome',onGo=null,sound=false;
function modal(title,text,body='',go='CONTINUE',action=null){$('#modalTitle').textContent=title;$('#modalText').textContent=text;$('#modalBody').innerHTML=body;$('#modalGo').textContent=go;$('#modal').classList.remove('hidden');onGo=action;}
function start(id='PracticeCity'){const i=SCENARIOS.findIndex(s=>s.id===id),s=SCENARIOS[i],name=s.name;city=new City(maps[i],build,flags,{name,scenario:id,year:s.year});camera={x:0,y:0};selected=1;paused=false;$('#modal').classList.add('hidden');paint();}
function menu(){modal('Choose a city','Select an original cartridge map. Scenario objectives and timed events are still being reconstructed.','<div class="choices">'+SCENARIOS.map(s=>`<button class="choice" data-city="${s.id}"><strong>${s.name}</strong><span>${s.year} · ${s.description}</span></button>`).join('')+'</div>','',null);$('#modalGo').style.display='none';$('#modalClose').textContent='CLOSE';document.querySelectorAll('[data-city]').forEach(b=>b.onclick=()=>start(b.dataset.city));}
function setup(){const zb=document.createElement('button');zb.id='zoom';zb.textContent='ZOOM 1×';zb.onclick=()=>setZoom([1,2,4][([1,2,4].indexOf(zoom)+1)%3]);document.querySelector('#view').after(zb);canvas.addEventListener('wheel',e=>{if(!city)return;e.preventDefault();setZoom(clamp(zoom*(e.deltaY<0?2:.5),1,4));},{passive:false});const nav=$('#nav');[['NEW CITY',menu],['INFORMATION',()=>modal('City information','Your city grows when zones connect to roads, power is available, and demand is positive.','Residential, commercial, and industrial zones need roads and electricity.')],['FISCAL BUDGET',budget],['DISASTERS',disasters]].forEach(([label,fn])=>{let b=document.createElement('button');b.textContent=label;b.onclick=fn;nav.append(b)});
TOOLS.forEach((n,i)=>{let b=document.createElement('button');b.textContent=`${String(i+1).padStart(2,'0')}  ${n}`;b.dataset.tool=i;b.onclick=()=>{selected=i;updateTools()};$('#tools').append(b)});
$('#pause').onclick=()=>{paused=!paused;$('#pause').textContent=paused?'▶ RESUME':'Ⅱ PAUSE'};$('#speed').onclick=()=>{city.speed=speeds[(speeds.indexOf(city.speed)+1)%speeds.length];$('#speed').textContent=`SPEED ${city.speed}×`};$('#view').onclick=()=>{mapView=!mapView;paint()};$('#save').onclick=save;$('#load').onclick=()=>$('#file').click();$('#file').onchange=load;$('#sound').onclick=()=>{sound=!sound;$('#sound').textContent=sound?'SOUND ON':'SOUND OFF'};$('#modalGo').onclick=()=>{if(onGo)onGo();else $('#modal').classList.add('hidden')};$('#modalClose').onclick=()=>$('#modal').classList.add('hidden');}
function budget(){if(!city)return;let b=city.budget();modal('Fiscal budget',`Annual revenue $${b.income.toLocaleString()} · projected balance ${b.net<0?'−':''}$${Math.abs(b.net).toLocaleString()}.` ,`Tax rate <input id="tax" type="range" min="0" max="20" value="${city.tax}"> <span id="taxv">${city.tax}%</span><p>Transport <input id="f0" type="range" min="0" max="100" value="${city.funding[0]}"> ${city.funding[0]}%</p><p>Police <input id="f1" type="range" min="0" max="100" value="${city.funding[1]}"> ${city.funding[1]}%　 Fire <input id="f2" type="range" min="0" max="100" value="${city.funding[2]}"> ${city.funding[2]}%</p><button id="loan">REQUEST $5,000 BANK LOAN</button>`,'APPLY',()=>{city.tax=+$('#tax').value;city.funding=[0,1,2].map(i=>+$('#f'+i).value);$('#modal').classList.add('hidden');refresh()});$('#tax').oninput=e=>$('#taxv').textContent=e.target.value+'%';$('#loan').onclick=()=>{city.takeLoan();refresh()};}
function disasters(){const choices=['Fire','Earthquake','Tornado','Flood','Meltdown','Monster'];modal('Disaster control','Trigger a disaster to see the current reconstruction’s effects.',`<div class="choices">${choices.map(t=>`<button data-disaster="${t}">${t}</button>`).join('')}</div>`,'CLOSE');document.querySelectorAll('[data-disaster]').forEach(b=>b.onclick=()=>{city.disaster(b.dataset.disaster,cursor.x,cursor.y);$('#modal').classList.add('hidden')});}
function updateTools(){document.querySelectorAll('#tools button').forEach(b=>b.classList.toggle('selected',+b.dataset.tool===selected));}
function centerCamera(){camera.x=clamp(cursor.x-60/zoom,0,Math.max(0,W-120/zoom));camera.y=clamp(cursor.y-37.5/zoom,0,Math.max(0,H-75/zoom));}
function setZoom(value){zoom=value;centerCamera();document.querySelector('#zoom').textContent='ZOOM '+zoom+'×';paint();}
function cell(x,y){if(x<0||x>=W||y<0||y>=H)return;const id=city.map[y*W+x]&1023;const season=cityPaletteForMonth(city.month),atlas=atlases[season],i=clamp(id,0,957),sx=(i%32)*8,sy=(i>>5)*8,dx=x*8,dy=y*8;if(mapView){ctx.fillStyle=`hsl(${(id*17)%360} 36% ${id<4?38:50}%)`;ctx.fillRect(dx,dy,8,8);return;}ctx.drawImage(atlas,sx,sy,8,8,dx,dy,8,8);}
function paint(){if(!city)return;ctx.fillStyle='#071c33';ctx.fillRect(0,0,960,600);ctx.save();ctx.scale(zoom,zoom);ctx.translate(-camera.x*8,-camera.y*8);const x0=Math.floor(Math.max(0,camera.x)),y0=Math.floor(Math.max(0,camera.y)),x1=Math.min(W,camera.x+120/zoom),y1=Math.min(H,camera.y+75/zoom);for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)cell(x,y);
if(selected>=0&&selected<16){ctx.globalAlpha=.75;for(const c of city.footprint(selected,cursor.x,cursor.y)){if(c.x>=x0&&c.x<x1&&c.y>=y0&&c.y<y1){ctx.fillStyle=city.canBuild(selected,cursor.x,cursor.y).ok?'#d5ff7d':'#ff755e';ctx.fillRect(c.x*8,c.y*8,8,8)}}ctx.globalAlpha=1;}
drawPowerWarnings(ctx,city,Math.floor(performance.now()/500)%2===0);ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.strokeRect(cursor.x*8+.5,cursor.y*8+.5,7,7);ctx.restore();refresh();}
function refresh(){if(!city)return;if(city.scenarioResult&&!city.scenarioDialogSeen){city.scenarioDialogSeen=true;modal(city.scenarioResult==='won'?'Scenario complete':'Scenario failed','The scenario deadline has been reached. You can continue managing this city.');}$('#cityName').textContent=city.name.toUpperCase();$('#date').textContent=`${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][city.month-1]} ${city.year}`;$('#funds').textContent='$'+city.funds.toLocaleString();$('#population').textContent=city.population.toLocaleString();$('#report').textContent=`${['VILLAGE','TOWN','CITY','CAPITAL','METROPOLIS','MEGALOPOLIS'][city.category]}\nR ${city.rci[0]}   C ${city.rci[1]}   I ${city.rci[2]}\nPOWER ${city.powerUsed}/${city.powerCapacity} · UNPOWERED ${unpoweredBuildings(city).length}\nROADS ${city.roadCount} · RAIL ${city.railCount}\nCRIME ${Math.round(city.meanCrime||0)} · SCORE ${city.score}\n${city.notices[0]||'Hold left mouse and drag to build roads, rails or power lines.'}`;updateTools();}
let stroke=null;
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
canvas.onpointerdown=e=>{if(e.button!==0||!city)return;e.preventDefault();try{canvas.setPointerCapture(e.pointerId);}catch{}pointer(e,false);stroke={tool:selected,last:{...cursor},visited:new Set(),occupied:new Set()};pointer(e,true);};
canvas.onpointermove=e=>{pointer(e,!!stroke);};
canvas.onpointerup=e=>{if(stroke)pointer(e,true);stroke=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);};
canvas.onpointercancel=()=>{stroke=null;};
window.addEventListener('pointerup',()=>{stroke=null;});
canvas.addEventListener('dragstart',e=>e.preventDefault());
window.addEventListener('blur',()=>{stroke=null;});window.onkeydown=e=>{if(e.key==='f'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();return}if($('#modal').classList.contains('hidden')===false)return;if(!city)return;const k=e.key.toLowerCase();if(k===' '){e.preventDefault();$('#pause').click()}else if(k==='m')$('#view').click();else if(k==='b')city.place(selected,cursor.x,cursor.y);else if(k>='1'&&k<='9'){selected=+k-1;updateTools()}else{const dx={arrowleft:-1,a:-1,arrowright:1,d:1}[k]||0,dy={arrowup:-1,w:-1,arrowdown:1,s:1}[k]||0;cursor.x=clamp(cursor.x+dx,0,W-1);cursor.y=clamp(cursor.y+dy,0,H-1);centerCamera();paint()}};
function save(){if(!city)return;const a=document.createElement('a'),url=URL.createObjectURL(new Blob([city.serialize()],{type:'application/json'}));a.href=url;a.download='simcity-save.json';a.click();URL.revokeObjectURL(url)}
async function load(e){try{city=City.restore(await e.target.files[0].text(),build,flags);camera={x:0,y:0};$('#modal').classList.add('hidden');paint()}catch(err){modal('Could not load city',err.message)}}
setup();modal('Welcome to SimCity','A native JavaScript reconstruction using graphics, palettes, construction tables, and all nine maps extracted from the matching USA SNES ROM. Choose a scenario to begin.','<p>This playable milestone is still in development. Scenario objectives and several simulation formulas remain approximations.</p>','CHOOSE A CITY',menu);
let lastWarningFrame=0;let last=performance.now(),acc=0;function frame(now){const dt=Math.min(100,now-last);last=now;if(city&&!paused&&$('#modal').classList.contains('hidden')){city.advance(dt);acc+=dt;if(acc>150){acc=0;paint()}}if(city&&Math.floor(now/500)!==Math.floor(lastWarningFrame/500)){paint();}lastWarningFrame=now;requestAnimationFrame(frame)}requestAnimationFrame(frame);
window.render_game_to_text=()=>JSON.stringify(city?{coordinates:'origin top-left; x right, y down; 120×100 tiles',mode:paused?'paused':'city',zoom,speed:city.speed,scenario:city.scenario,name:city.name,year:city.year,month:city.month,funds:city.funds,population:city.population,demand:city.demand,selectedTool:TOOLS[selected],cursor,populationBands:city.rci,powerCapacity:city.powerCapacity,powerUsed:city.powerUsed,disasters:city.disasters,notices:city.notices.slice(0,2)}:{mode:'menu'});window.advanceTime=ms=>{if(city&&!paused)city.advance(ms);paint()};












