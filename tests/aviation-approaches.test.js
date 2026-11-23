import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {City} from '../src/simulation.js';
import {AIRCRAFT,advanceAviation,aviationFacilities,aviationSummary,reconcileAviation} from '../src/aviation.js';
import {transportOverlay} from '../src/transport-overlays.js';

function airport(){
 const c=new City(new Uint16Array(48000),JSON.parse(fs.readFileSync('assets/tables/build.json')),JSON.parse(fs.readFileSync('assets/tables/city.json')).flags,{width:240,height:200,year:2099,disastersEnabled:false});c.funds=1e6;
 for(let x=4;x<239;x++)c.map[19*240+x]=0x32;
 assert.ok(c.place(33,4,20));assert.ok(c.place(64,210,20));c.refresh();c.population=1e6;c.rci=[40000,10000,10000];assert.ok(aviationFacilities(c)[0].operating);return c;
}

test('busy international airport has slow heavy jets, varied edges, holding circuits and separated runway use',()=>{
 const c=airport(),seen=new Map(),sides=new Set(),phases=new Set();let peak=0,priorSlot=null;
 assert.ok(AIRCRAFT.jumbo.speed<=4);assert.ok(AIRCRAFT.jumbo.length>=36);assert.ok(AIRCRAFT.jumbo.span>=32);
 for(let n=0;n<36000;n++){
  const before=new Map((c.civic.aviation?.aircraft||[]).map(a=>[a.id,{x:a.x,y:a.y,heading:a.heading}]));advanceAviation(c,1);const s=c.civic.aviation;
  peak=Math.max(peak,s.aircraft.length);assert.ok(s.aircraft.length<=4);assert.ok(s.aircraft.filter(a=>a.inRunway).length<=1,'Runway overlap at '+n);
  for(const a of s.aircraft){
   phases.add(a.phase);assert.ok(a.route.length<=160);assert.ok(a.altitude>=0&&a.altitude<=1);
   if(!seen.has(a.id)){seen.set(a.id,{frame:s.frames,slot:{...a.runwaySlot},kind:a.kind,loops:a.holdingCircuits});if(a.entrySide)sides.add(a.entrySide);if(priorSlot)assert.ok(a.runwaySlot.start>=priorSlot.end+480);priorSlot=a.runwaySlot;
    const hold=a.route.filter(p=>p.phase==='holding');if(hold.length){assert.ok(hold.length>=24);assert.ok(Math.max(...hold.map(p=>p.x))-Math.min(...hold.map(p=>p.x))>=19);assert.ok(Math.max(...hold.map(p=>p.y))-Math.min(...hold.map(p=>p.y))>=11);}
   }
   const b=before.get(a.id);if(b){assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<=AIRCRAFT[a.kind].speed/60+1e-7);assert.ok(Math.abs(Math.atan2(Math.sin(a.heading-b.heading),Math.cos(a.heading-b.heading)))<=1.8/60+1e-7);}
  }
 }
 assert.equal(sides.size,4);assert.ok(peak>=2);assert.ok([...seen.values()].some(a=>a.loops>0));assert.ok([...seen.values()].some(a=>a.kind==='jumbo'));assert.ok([...seen.values()].some(a=>a.kind==='cargo'));
 const arrivals=[...seen.values()];assert.ok(arrivals.length>10);for(let n=1;n<arrivals.length;n++)assert.ok(arrivals[n].frame-arrivals[n-1].frame>=28*60);
 for(const phase of ['holding','approach','landing','taxi','takeoff','departure'])assert.ok(phases.has(phase),phase);
 const stat=Object.values(c.civic.aviation.stats)[0];assert.ok(stat.arrivals>2&&stat.departures>2);
});

test('legacy conga-line flights are replaced once without losing airport totals or sequence',()=>{
 const c=airport(),f=aviationFacilities(c)[0],month=c.year*12+c.month,stats={month,arrivals:7,departures:5,passengers:1200,cargo:300,sorties:0};
 c.civic.aviation={version:1,frames:9000,nextId:43,aircraft:[{id:42,root:f.i,kind:'jumbo',x:20,y:20,altitude:1,heading:0,segment:0,route:[{x:230,y:22,altitude:1,speed:18}]}],schedule:{[f.i]:{next:9001,sequence:40}},stats:{[f.i]:stats}};
 reconcileAviation(c);const s=c.civic.aviation;assert.equal(s.version,2);assert.equal(s.aircraft.length,0);assert.equal(s.frames,9000);assert.equal(s.nextId,43);assert.equal(s.schedule[f.i].sequence,40);assert.ok(s.schedule[f.i].next>=9300);assert.deepEqual(s.stats[f.i],stats);
 const saved=c.serialize(),r=City.restore(saved,c.build,c.flags);assert.deepEqual(r.civic.aviation,s);const pause=JSON.stringify(s);advanceAviation(c,300,true);assert.equal(JSON.stringify(c.civic.aviation),pause);
 advanceAviation(c,700);assert.equal(c.civic.aviation.aircraft[0].id,43);assert.ok(c.civic.aviation.aircraft[0].route.some(p=>p.phase==='approach'));
});

test('air-traffic overlay follows curved routes instead of coloring a full-width runway stripe',()=>{
 const c=airport();advanceAviation(c,12000);const a=c.civic.aviation.aircraft.find(a=>a.route.some(p=>p.phase==='holding'));assert.ok(a);
 const overlay=transportOverlay(c,'airTraffic');let checked=0;
 for(const p of a.route.filter(p=>p.phase==='holding')){const x=Math.floor(p.x),y=Math.floor(p.y);assert.equal(overlay.mask[y*c.width+x],1);checked++;}assert.ok(checked>=24);
 const f=aviationFacilities(c)[0],y=Math.floor(f.bounds.y+f.bounds.height*.145);assert.equal(overlay.mask[y*c.width],0);
 const saved=JSON.stringify(c.civic.aviation);aviationSummary(c);assert.equal(JSON.stringify(c.civic.aviation),saved);
});
