import fs from 'node:fs';import assert from 'node:assert/strict';import {City} from '../src/simulation.js';import {stampZoneFootprint} from '../src/rom-growth.js';
export function poweredScenarioCity(){
 const read=name=>JSON.parse(fs.readFileSync(new URL('../assets/tables/'+name+'.json',import.meta.url))),city=new City(new Uint16Array(12000),read('build'),read('city').flags,{scenario:'Tokyo',year:1964,autoBudget:true,disastersEnabled:false});city.funds=200000;
 for(let n=0;n<150;n++){const x=10+n%19*4,y=5+Math.floor(n/19)*4;stampZoneFootprint(city.map,x,y,0x11c);for(let xx=x-1;xx<=x+2;xx++)city.map[(y+2)*120+xx]=0x32;}
 for(let y=3;y<42;y++)city.map[y*120+8]=0x32;for(const y of[5,10,15,25,35]){city.place(14,1,y);for(let x=5;x<=8;x++)city.map[(y+2)*120+x]=0x32;}
 for(let y=0;y<100;y++)for(let x=0;x<120;x++)city.connect(x,y);city.refresh();assert.equal(city.population,120000);assert.ok(!city.powerOverloaded&&city.zones.filter(z=>z.type===5).every(z=>city.power[z.i]));return city;
}
