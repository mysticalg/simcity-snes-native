import fs from 'node:fs';import {City} from '../src/simulation.js';import {stampZoneFootprint} from '../src/rom-growth.js';
export function denseUtilityFixture(pumpCount=24){
 const c=new City(new Uint16Array(12000),JSON.parse(fs.readFileSync('assets/tables/build.json')),JSON.parse(fs.readFileSync('assets/tables/city.json')).flags,{year:2088,civicEnabled:true});c.funds=500000;c.disastersEnabled=false;c.autoBudget=true;c.civic.waterEnabled=true;c.civic.sewageEnabled=true;c.pipes.fill(1);
 const stamp=(tool,x,y)=>{for(const cell of c.footprint(tool,x,y))c.map[cell.y*c.width+cell.x]=cell.id;};
 stamp(33,2,12);stamp(39,8,12);for(let n=0;n<pumpCount;n++)stamp(44,4+(n%28)*4,2+Math.floor(n/28)*4);
 for(let n=0;n<8;n++)stamp(45,20+n*5,12);
 for(let y=24;y<96;y+=4)for(let x=4;x<116;x+=4){stampZoneFootprint(c.map,x,y,[0xb0,0x164,0x210][(x+y)%3]);}
 for(let y=0;y<100;y++)for(let x=0;x<120;x++)if((x%4===2||y%4===2)&&!c.map[y*120+x])c.map[y*120+x]=0x32;
 c.map[12*120+11]=2;c.refresh();c.power.fill(1);return c;
}
