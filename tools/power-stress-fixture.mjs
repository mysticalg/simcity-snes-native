import fs from 'node:fs';
import {City} from '../src/simulation.js';
import {stampZoneFootprint} from '../src/rom-growth.js';
// A complete, connected city using real construction and generating plants.
// Never force its power bitmap: save/restore must recompute a working grid.
export function createPowerStressCity({mega=true}={}){
 const width=mega?240:120,height=mega?200:100,edge=mega?160:75;
 const build=JSON.parse(fs.readFileSync(new URL('../assets/tables/build.json',import.meta.url))),flags=JSON.parse(fs.readFileSync(new URL('../assets/tables/city.json',import.meta.url))).flags;
 const city=new City(new Uint16Array(width*height),build,flags,{width,height,name:'CONNECTED POWER TEST',scenario:mega?'FreeMegacity':'FreeCity',year:2008,disastersEnabled:false,autoBudget:true});city.funds=1e7;
 for(let y=3;y<(mega?190:70);y+=4)for(let x=3;x<(mega?158:70);x+=4){stampZoneFootprint(city.map,x,y,[0x11c,0x1eb,0x20f][(x+y)%3],width,height);for(let n=-1;n<=2;n++)city.map[(y+2)*width+x+n]=0x32;}
 for(let y=0;y<height;y++){city.map[y*width+1]=0x32;for(let x=edge;x<width;x++)city.map[y*width+x]=2;}
 for(let x=1;x<edge-2;x++)city.map[(height-5)*width+x]=0x32;
 for(let x=3;x<(mega?150:65);x+=7)if(!city.place(33,x,height-8))throw Error('Fusion fixture placement failed');
 for(let y=4;y<height-8;y+=8){for(let x=1;x<edge-2;x++)city.map[(y+1)*width+x]=0x32;if(!city.place(62,edge-2,y))throw Error('Solar fixture placement failed');}
 city.refresh();return city;
}
