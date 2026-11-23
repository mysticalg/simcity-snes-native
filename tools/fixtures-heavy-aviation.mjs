import fs from 'node:fs';
import assert from 'node:assert/strict';
import {City} from '../src/simulation.js';
import {stampZoneFootprint} from '../src/rom-growth.js';
import {aviationFacilities} from '../src/aviation.js';

export function heavyAviationFixture({legacy=true}={}){
 const c=new City(new Uint16Array(48000),JSON.parse(fs.readFileSync('assets/tables/build.json')),JSON.parse(fs.readFileSync('assets/tables/city.json')).flags,{width:240,height:200,year:2096,scenario:'FreeMegacity',disastersEnabled:false});c.funds=1e8;c.autoBudget=true;
 for(let y=0;y<200;y++)for(let x=0;x<240;x++)c.map[y*240+x]=x>=236?2:(x%4===2||y%4===2)?0x32:0;
 const stamp=(tool,x,y)=>{for(const p of c.footprint(tool,x,y))c.map[p.y*240+p.x]=p.id;};
 for(let x=4;x<76;x+=8)stamp(33,x,8);stamp(64,210,12);
 for(let y=36;y<188;y+=4)for(let x=4;x<=200;x+=4)stampZoneFootprint(c.map,x,y,[0x11c,0x1eb,0x20f][(x/4+y/4)%3],240,200);
 c.refresh();const f=aviationFacilities(c)[0];assert.ok(f.operating);assert.equal(c.powerOverloaded,false);assert.ok(c.population>100000);
 if(legacy)c.civic.aviation={version:1,frames:18000,nextId:41,aircraft:Array.from({length:20},(_,n)=>({id:n+1,root:f.i,kind:'jumbo',arrival:true,x:n*9,y:14,heading:0,altitude:1,segment:0,route:[{x:240,y:14,altitude:1,speed:18}]})),schedule:{[f.i]:{next:18001,sequence:40}},stats:{[f.i]:{month:c.year*12+c.month,arrivals:8,departures:6,passengers:3200,cargo:500,sorties:0}}};
 return c;
}
