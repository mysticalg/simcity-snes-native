import test from 'node:test';
import assert from 'node:assert/strict';
import {City,W,H} from '../src/simulation.js';
import {decideResidentialUpdate,residentialDemandScore,residentialDensityBand,residentialGrowthBase,residentialDeclineFootprint,residentialLocalScore,residentialUpdateGate,stampZoneFootprint} from '../src/rom-growth.js';
import fs from 'node:fs';

const build=JSON.parse(fs.readFileSync(new URL('../assets/tables/build.json',import.meta.url)));
const flags=JSON.parse(fs.readFileSync(new URL('../assets/tables/city.json',import.meta.url))).flags;

test('residential update gate uses one-in-eight low bits and tile $0084 bypass',()=>{
 assert.equal(residentialUpdateGate(0x99,0x1235),false);
 assert.equal(residentialUpdateGate(0x99,0x1238),true);
 assert.equal(residentialUpdateGate(0x84,0x1237),true);
});

test('residential local score and signed map-word fallback follow CODE_0399D2/03937A',()=>{
 assert.equal(residentialLocalScore(100,120),-3000);
 assert.equal(residentialLocalScore(255,0,false),-3000);
 assert.equal(residentialLocalScore(100,0),200);
 assert.equal(residentialLocalScore(255,0),3000);
 assert.equal(residentialLocalScore(255,3),3000); // 252×32 is capped at 6000
 assert.equal(residentialDemandScore(0x0099,2000,1000),-500);
 assert.equal(residentialDemandScore(0x8099,1200,-300),900);
});

test('positive demand random comparison grows only on the signed branch pass',()=>{
 const pass=decideResidentialUpdate({tileId:0x99,gateWord:0,score:0,population:8,randomWords:[0x2000]});
 const fail=decideResidentialUpdate({tileId:0x99,gateWord:0,score:0,population:8,randomWords:[0]});
 assert.equal(pass.action,'grow');assert.equal(pass.reason,'positive-demand');
 assert.equal(fail.action,'none');assert.equal(fail.reason,'threshold');
});

test('negative demand decay is bounded by the ROM signed threshold at +350',()=>{
 const decay=decideResidentialUpdate({tileId:0x99,gateWord:0,score:-351,population:8,randomWords:[0x7000]});
 const lowerBoundary=decideResidentialUpdate({tileId:0x99,gateWord:0,score:-350,population:8,randomWords:[0,0x7000]});
 const upperBoundary=decideResidentialUpdate({tileId:0x99,gateWord:0,score:350,population:8,randomWords:[0]});
 assert.equal(decay.action,'decline');
 assert.equal(lowerBoundary.action,'decline');
 assert.equal(upperBoundary.action,'none');
});

test('city residential map changes only when injected ROM branches confirm growth or decline',()=>{
 const map=Array(W*H).fill(0),center=50*W+60;map[center]=0x8099;
 const city=new City(map,build,flags);const zone=city.zones.find(z=>z.i===center);city.landValue[center]=255;
 let words=[32700,1];const beforeGate=[...city.map];
 assert.equal(city.updateResidentialTile(zone,()=>words.shift()).action,'none');
 assert.deepEqual([...city.map],beforeGate);assert.deepEqual(words,[]);
 words=[32700,0,0];const beforeThreshold=[...city.map];
 assert.equal(city.updateResidentialTile(zone,()=>words.shift()).action,'none');
 assert.deepEqual([...city.map],beforeThreshold);
 words=[32700,0,0x4000];
 assert.equal(city.updateResidentialTile(zone,()=>words.shift()).action,'grow');
 assert.notDeepEqual([...city.map],beforeThreshold);
});

test('CODE_039940 footprint rejects blocked sites and writes the marker bits exactly',()=>{
 const map=Array(W*H).fill(0),x=60,y=50;
 map[y*W+x]=0x8099;map[(y-1)*W+x-1]=0x8099;map[(y+1)*W+x+1]=0x8099;
 assert.equal(stampZoneFootprint(map,x,y,0x95),true);
 const topLeft=(y-1)*W+x-1,bottomRight=(y+1)*W+x+1;
 assert.equal(map[topLeft],0x8095);
 assert.equal(map[bottomRight],0xc09d);

 const blocked=Array(W*H).fill(0);blocked[y*W+x+1]=0x0040;const before=[...blocked];
 assert.equal(stampZoneFootprint(blocked,x,y,0x95),false);
 assert.deepEqual(blocked,before);
 assert.equal(stampZoneFootprint(blocked,0,y,0x95),false);
});

test('CODE_039468 density bands and CODE_0398B8 residential bases match source thresholds',()=>{
 assert.deepEqual([29,30,79,80,149,150].map(v=>residentialDensityBand(v,0)),[0,1,1,2,2,3]);
 assert.equal(residentialDensityBand(5,6),0);
 assert.equal(residentialGrowthBase(8,0),0x95);
 assert.equal(residentialGrowthBase(16,0),0x9e);
 assert.equal(residentialGrowthBase(32,3),0x11c);
 assert.equal(residentialGrowthBase(0,0),0x9f); // wrapped index reads ROM byte $0A
 assert.equal(residentialGrowthBase(0,1),0xb0);
});

test('CODE_039659 downgrades residential blocks by their population band',()=>{
 const width=9,height=9,x=4,y=4,center=y*width+x;
 const high=Array(width*height).fill(0x8099);
 assert.equal(residentialDeclineFootprint(high,x,y,24,0,()=>0,width,height),true);
 assert.equal(high[center],0x8099); // next band: 8 residents
 const dense=Array(width*height).fill(0x8099);
 assert.equal(residentialDeclineFootprint(dense,x,y,32,3,()=>0,width,height),true);
 assert.equal(dense[center],0x810e);
});

test('CODE_039659 turns 16 residents into a special house block and downgrades 8-resident homes',()=>{
 const width=9,height=9,x=4,y=4,center=y*width+x;
 const homes=Array(width*height).fill(0x8089),varieties=[0,1,2,0,1,2,0,1];
 assert.equal(residentialDeclineFootprint(homes,x,y,16,1,()=>varieties.shift(),width,height),true);
 assert.equal(homes[center],0x84);
 assert.deepEqual([homes[center-width-1]&0xff,homes[center-width]&0xff,homes[center-width+1]&0xff],[0x8c,0x8d,0x8e]);
 const small=Array(width*height).fill(0x8089);
 assert.equal(residentialDeclineFootprint(small,x,y,8,0,()=>0,width,height),true);
 assert.equal(small[center-width-1],0x8080);
 assert.equal(small[center+width+1],0x8089);
});

 test('small-home placement and both merge orientations execute through City.grow',()=>{
 const make=()=>new City(Array(W*H).fill(0),build,flags);
 const c=make(),x=60,y=50,i=y*W+x;c.map[i]=0x84;c.landValue[i]=100;c.random=()=>1;
 assert.equal(c.grow({x,y,i,id:0x84,type:5},1),true);
 assert.equal(c.adjacentSmallHomeCount({x,y}),1);
 assert.equal(c.map[i],0x84);
 for(const [dx,dy,left,right] of [[3,0,0x37a,0x383],[0,3,0x38c,0x395]]){
  const m=make();m.map[i]=0x8120;m.map[(y+dy)*W+x+dx]=0x8120;
  assert.equal(m.grow({x,y,i,id:0x120,type:5},1),true);
  assert.equal(m.map[i],0x8000|left);assert.equal(m.map[(y+dy)*W+x+dx],0x8000|right);
  assert.ok(m.map[(y+1)*W+x+1]&0x4000);
 }
 const rejected=make();rejected.map[i]=0x120;const before=[...rejected.map];
 assert.equal(rejected.grow({x,y,i,id:0x120,type:5},1),false);assert.deepEqual([...rejected.map],before);
 const full=make();for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)full.map[(y+dy)*W+x+dx]=0x30;full.map[i]=0x84;
 assert.equal(full.grow({x,y,i,id:0x84,type:5},1),false);
 });
test('ROM merged partner repair retains complete pairs and repairs detached halves',async()=>{
 const {repairMergedZone}=await import('../src/rom-growth.js');
 for(const [id,dx,dy,partner,base] of [[0x37a,3,0,0x383,0x11c],[0x383,-3,0,0x37a,0x11c],[0x38c,0,3,0x395,0x11c],[0x395,0,-3,0x38c,0x11c],[0x39e,3,0,0x3a7,0x1eb],[0x3a7,-3,0,0x39e,0x1eb],[0x3b0,0,3,0x3b9,0x1eb],[0x3b9,0,-3,0x3b0,0x1eb]]){
  const m=Array(W*H).fill(0),x=60,y=50,i=y*W+x,j=(y+dy)*W+x+dx;m[i]=0x8000|id;m[j]=partner;
  assert.equal(repairMergedZone(m,x,y),false);assert.equal(m[i],0x8000|id);
  m[j]=0;assert.equal(repairMergedZone(m,x,y),true);assert.equal(m[i],0x8000|(base+4));assert.ok(m[(y+1)*W+x+1]&0x4000);
 }
});
test('commercial source transitions use value gate, five density levels and merge bases',async()=>{
 const {updateCommercialFootprint}=await import('../src/rom-growth.js');const x=60,y=50,i=y*W+x,m=Array(W*H).fill(0);m[i]=0x8144;
 assert.equal(updateCommercialFootprint(m,x,y,1,2,31,1),false);
 assert.equal(updateCommercialFootprint(m,x,y,1,2,32,1),true);assert.equal(m[i]&1023,0x1a7);
 assert.equal(updateCommercialFootprint(m,x,y,2,0,0,-1),true);assert.equal(m[i]&1023,0x144);
 m[i]=0x81ef;m[i+3]=0x81ef;assert.equal(updateCommercialFootprint(m,x,y,5,3,255,1),true);assert.equal(m[i]&1023,0x39e);assert.equal(m[i+3]&1023,0x3a7);
});
test('industrial ROM progression caps four levels and selects low-bit graphics family',async()=>{
 const {updateIndustrialFootprint}=await import('../src/rom-growth.js');const x=60,y=50,i=y*W+x;
 for(const family of [0,1])for(let pop=0;pop<4;pop++){
  const m=Array(W*H).fill(0);m[i]=0x8201;
  assert.equal(updateIndustrialFootprint(m,x,y,pop,1,()=>family),true);assert.equal(m[i]&1023,0x201+9*(family*4+pop));
 }
 const m=Array(W*H).fill(0);m[i]=0x8201;let calls=0;const rng=()=>{calls++;return 1;};
 assert.equal(updateIndustrialFootprint(m,x,y,4,1,rng),false);assert.equal(calls,0);
 assert.equal(updateIndustrialFootprint(m,x,y,1,-1,rng),true);assert.equal(m[i]&1023,0x1f8);assert.equal(calls,0);
 assert.equal(updateIndustrialFootprint(m,x,y,3,-1,rng),true);assert.equal(m[i]&1023,0x22e);assert.equal(calls,1);
});
test('job-zone source gate has no residential bypass or empty special branch',async()=>{
 const {decideJobZoneUpdate}=await import('../src/rom-growth.js');
 let calls=0;assert.equal(decideJobZoneUpdate({mapWord:0x8144,demand:0,gateWord:1,nextRandomWord:()=>{calls++;return 0x2000;}}).action,'none');assert.equal(calls,0);
 assert.equal(decideJobZoneUpdate({mapWord:0x8144,demand:0,gateWord:0,nextRandomWord:()=>0x2000}).action,'grow');
 assert.equal(decideJobZoneUpdate({mapWord:0x144,demand:2000,gateWord:0,nextRandomWord:()=>0x7000}).action,'decline');
});
test('ROM transport scan uses twelve perimeter cells and excludes pure power lines',async()=>{
 const {findZoneTransport}=await import('../src/rom-growth.js');const m=Array(W*H).fill(0),x=60,y=50;
 m[(y-1)*W+x]=0x32;assert.equal(findZoneTransport(m,x,y),null);
 m[(y-2)*W+x-1]=0x60;assert.equal(findZoneTransport(m,x,y),null);
 m[(y+2)*W+x]=0x72;assert.deepEqual(findZoneTransport(m,x,y),{x,y:y+2});
 m[(y-2)*W+x-1]=0x8032;assert.deepEqual(findZoneTransport(m,x,y),{x:x-1,y:y-2});
});
test('ROM transport destination ranges and bounded route distinguish missing, dead and reachable',async()=>{
 const {traceZoneTransport,isTransportDestination}=await import('../src/rom-growth.js');
 assert.equal(isTransportDestination(0x144,5),true);assert.equal(isTransportDestination(0x27c,5),false);assert.equal(isTransportDestination(0x99,7),true);assert.equal(isTransportDestination(0x144,7),false);
 const x=60,y=50,m=Array(W*H).fill(0);assert.equal(traceZoneTransport(m,x,y,5,()=>1).status,-1);
 m[(y-2)*W+x]=0x32;assert.equal(traceZoneTransport(m,x,y,5,()=>1).status,0);
 m[(y-2)*W+x+1]=0x32;m[(y-3)*W+x+1]=0x144;
 assert.equal(traceZoneTransport(m,x,y,5,()=>1).status,1);
});

test('residential transport precheck declines isolated zones before update gate',()=>{
 const m=Array(W*H).fill(0),x=60,y=50,i=y*W+x;m[i]=0x80a2;
 const c=new City(m,build,flags);let draws=0;
 const result=c.updateResidentialTile({x,y,i,id:0xa2,type:5},()=>{draws++;return 0;});
 assert.equal(result.reason,'missing-transport');assert.equal(draws,1);assert.equal(c.map[i]&1023,0x99);
});

