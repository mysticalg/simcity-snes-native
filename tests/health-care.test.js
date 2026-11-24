import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {City} from '../src/simulation.js';import {civicServices,civicBounds} from '../src/civic.js';import {dispatchHealthCare,advanceHealthCare,healthFleetStatus,installHealthCare} from '../src/health-care.js';import {socialFields} from '../src/social-fields.js';
import {stampZoneFootprint} from '../src/rom-growth.js';
import {employmentIncome} from '../src/employment.js';
installHealthCare(City);const build=JSON.parse(fs.readFileSync('assets/tables/build.json')),flags=JSON.parse(fs.readFileSync('assets/tables/city.json')).flags;
const fresh=()=>{const c=new City(new Uint16Array(12000),structuredClone(build),[...flags],{civicEnabled:true});c.funds=200000;c.civic.waterEnabled=false;return c;};
function routeFixture(){const c=fresh();c.place(33,5,10);c.place(30,10,10);c.place(5,40,10);c.map[11*120+41]=0x99;for(let x=6;x<=42;x++)c.map[13*120+x]=0x32;c.refresh();c.pollution=new Uint8Array(c.map.length).fill(150);dispatchHealthCare(c);return c;}
test('all requested health plot sizes build, serve capacity and demolish with exact bounds',()=>{
 for(const [tool,w,h,capacity]of[[51,1,1,2000],[54,1,2,6000],[52,2,2,10000],[53,2,3,14000],[30,3,3,20000]]){const c=fresh();assert.ok(c.place(tool,20,20));const z=c.zones.find(z=>z.type===tool);assert.equal(c.footprint(tool,20,20).length,w*h);assert.deepEqual(civicBounds(z),{x:20,y:20,width:w,height:h});for(let x=19;x<=24;x++)c.map[19*120+x]=0x32;c.refresh();c.power.fill(1);assert.equal(civicServices(c).capacity.health,capacity);c.map[20*120+20+w]=44;assert.ok(c.place(0,20,20));assert.equal(c.id(20+w,20),44);for(let y=20;y<20+h;y++)for(let x=20;x<20+w;x++)assert.equal(c.id(x,y),0);}
});
test('ambulances take connected roads to unhealthy homes and apply care only upon arrival',()=>{
 const c=routeFixture(),home=c.zones.find(z=>z.type===5),hospital=c.zones.find(z=>z.type===30),before=socialFields(c).health[home.i];assert.equal(c.civic.ambulances.length,1);const v=c.civic.ambulances[0];assert.equal(v.target,home.i);assert.ok(v.path.every(i=>c.flags[c.map[i]&1023]&64));assert.equal(healthFleetStatus(c,hospital).served,0);const paused=JSON.stringify(c.civic.ambulances);advanceHealthCare(c,600,true);assert.equal(JSON.stringify(c.civic.ambulances),paused);advanceHealthCare(c,1000);assert.ok(healthFleetStatus(c,hospital).served>0);assert.ok(socialFields(c).health[home.i]>before);assert.ok(c.civic.healthVisits[home.i]>0);
});
test('unpowered, switched-off and disconnected facilities cannot send or retain ambulances',()=>{
 const c=routeFixture(),hospital=c.zones.find(z=>z.type===30);c.power[hospital.i]=0;dispatchHealthCare(c);assert.equal(c.civic.ambulances.length,0);c.power[hospital.i]=1;dispatchHealthCare(c);assert.ok(c.civic.ambulances.length);c.disabledBuildings={[hospital.i]:hospital.id};dispatchHealthCare(c);assert.equal(c.civic.ambulances.length,0);delete c.disabledBuildings[hospital.i];c.map[13*120+30]=0;dispatchHealthCare(c);assert.equal(c.civic.ambulances.length,0);
});
test('ambulance mission progress, care and facility totals survive save/reload',()=>{
 const c=routeFixture();advanceHealthCare(c,100);const missions=structuredClone(c.civic.ambulances),saved=City.restore(c.serialize(),c.build,c.flags);assert.deepEqual(saved.civic.ambulances,missions);assert.deepEqual(saved.civic.healthVisits,c.civic.healthVisits);assert.deepEqual(saved.civic.healthCare,c.civic.healthCare);
});

test('replacing a home at the same population redispatches to its new location',()=>{
 const c=routeFixture(),home=c.zones.find(z=>z.type===5);assert.ok(c.civic.ambulances.length);const population=c.population;
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)c.map[(home.y+dy)*120+home.x+dx]=0;
 stampZoneFootprint(c.map,41,15,0x95);c.refresh();assert.equal(c.population,population);assert.ok(c.civic.ambulances.length);assert.ok(c.civic.ambulances.every(v=>v.target===15*120+41));
});

test('nearby busy facilities fall back to another reachable fleet without exceeding ambulance limits',()=>{
 const c=routeFixture();c.place(51,18,12);for(let x=43;x<62;x++)c.map[13*120+x]=0x32;
 for(const x of [45,50,55]){c.place(5,x,10);stampZoneFootprint(c.map,x+1,11,0x95);}c.refresh();dispatchHealthCare(c);
 const facilities=c.zones.filter(z=>[30,51].includes(z.type));assert.equal(c.civic.ambulances.length,4);assert.equal(new Set(c.civic.ambulances.map(v=>v.target)).size,4);for(const z of facilities){const f=healthFleetStatus(c,z);assert.equal(f.active,f.fleet);assert.ok(c.civic.ambulances.filter(v=>v.root===z.i).every(v=>v.path.every(i=>c.flags[c.map[i]&1023]&64)));}
});

test('a pharmacy conserves its monthly patient capacity and opens again next month',()=>{
 const c=fresh();c.place(33,5,10);c.place(51,15,12);c.place(5,40,10);stampZoneFootprint(c.map,41,11,0x11c);for(let x=6;x<=43;x++)c.map[13*120+x]=0x32;c.pollution.fill(255);c.refresh();const pharmacy=c.zones.find(z=>z.type===51);
 for(let n=0;n<20;n++)advanceHealthCare(c,3000);const served=healthFleetStatus(c,pharmacy);assert.equal(served.served,100);assert.equal(served.active,0);assert.equal(served.calls,13);c.month=2;dispatchHealthCare(c);assert.equal(healthFleetStatus(c,pharmacy).served,0);assert.equal(healthFleetStatus(c,pharmacy).active,1);
});

test('previous care decays next month even after the last health facility is demolished',()=>{
 const c=routeFixture();advanceHealthCare(c,1000);const home=c.zones.find(z=>z.type===5),boost=c.civic.healthVisits[home.i],hospital=c.zones.find(z=>z.type===30);assert.ok(boost>0);c.place(0,hospital.x,hospital.y);assert.equal(c.civic.ambulances.length,0);c.month=2;dispatchHealthCare(c);assert.equal(c.civic.healthVisits[home.i],boost*.85);
});

test('original native hospital and school contribute no household residents, workers or ambulance destinations',()=>{
 const c=routeFixture();for(const [id,x]of [[0x129,45],[0x132,50]])stampZoneFootprint(c.map,x,11,id-4);for(let x=43;x<54;x++)c.map[13*120+x]=0x32;c.refresh();const employment=employmentIncome(c);
 for(const id of [0x129,0x132]){const z=c.zones.find(z=>z.id===id);assert.equal(c.zonePopulation(z),0);assert.equal(employment.homes.get(z.i).residents,0);assert.equal(employment.homes.get(z.i).workers,0);assert.ok(c.civic.ambulances.every(v=>v.target!==z.i));}assert.deepEqual(c.facilityCounts,[1,1]);
});

test('an evacuated residential zone cancels its ambulance mission',()=>{
 const c=routeFixture(),home=c.zones.find(z=>z.type===5);stampZoneFootprint(c.map,home.x,home.y,0x80);c.refresh();assert.equal(c.population,0);assert.equal(c.civic.ambulances.length,0);
});
