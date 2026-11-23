import fs from 'node:fs';
import {City} from '../src/simulation.js';
import {stampZoneFootprint} from '../src/rom-growth.js';

export function createPopulationStressCity({mixed=false,dense=false}={}){
 const width=240,height=200,map=new Uint16Array(width*height);
 const expected=[0,0,0];let plots=0;
 for(let y=3;y<height-3;y+=dense?3:4)for(let x=3;x<width-3;x+=dense?3:4){
  const type=mixed?plots%3:0;
  // Complete native 3x3 footprints: residential 40, commercial 5, industrial 3.
  stampZoneFootprint(map,x,y,[0x11c,0x1eb,0x20f][type],width,height);
  expected[type]+=[40,5,3][type];plots++;
 }
 const build=JSON.parse(fs.readFileSync(new URL('../assets/tables/build.json',import.meta.url))),flags=JSON.parse(fs.readFileSync(new URL('../assets/tables/city.json',import.meta.url))).flags;
 const city=new City(map,build,flags,{width,height,scenario:'FreeMegacity',name:'MEGACITY CENSUS TEST',year:2008,disastersEnabled:false,autoBudget:true});
 return {city,plots,expected,population:(expected[0]+8*(expected[1]+expected[2]))*20};
}
