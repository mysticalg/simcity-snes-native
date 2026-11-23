import fs from 'node:fs';
import assert from 'node:assert/strict';
import {City} from '../src/simulation.js';
import {stampZoneFootprint} from '../src/rom-growth.js';
import {civicServices,utilityPipeStatus} from '../src/civic.js';

// Synthetic public benchmark, never a private player save. Power is traced by
// the real simulation; pipes, water sources, streets and access are real too.
export function activeUtilityFixture(){
 const build=JSON.parse(fs.readFileSync('assets/tables/build.json'));
 const flags=JSON.parse(fs.readFileSync('assets/tables/city.json')).flags;
 const width=240,height=200,c=new City(new Uint16Array(width*height),build,flags,{width,height,year:2088,scenario:'FreeMegacity',civicEnabled:true,disastersEnabled:false});
 c.funds=1e9;c.autoBudget=true;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x;c.map[i]=x>=220?2:(x%4===2||y%4===2)?0x32:0;
  c.pipes[i]=x<220&&(x%4===2||y%4===2)?1:0;
  if(x>=220&&y>40)c.seaPollution[i]=190;
 }
 const stamp=(tool,x,y)=>{for(const p of c.footprint(tool,x,y))c.map[p.y*width+p.x]=p.id;};
 for(let x=3;x<215;x+=8)stamp(33,x,3);
 for(let y=28;y<188;y+=4)for(let x=4;x<176;x+=4)stampZoneFootprint(c.map,x,y,[0x11c,0x1eb,0x20f][(x/4+y/4)%3],width,height);
 for(let y=11;y<190;y+=4){stamp(61,217,y);stamp(44,209,y);}
 for(let y=11;y<190;y+=8){stamp(45,199,y);stamp(32,187,y);stamp(49,181,y);}
 for(let x=3;x<175;x+=12){stamp(30,x,15);stamp(36,x+4,15);stamp(38,x+10,18);c.busStops[22*width+x+10]=1;}
 c.refresh();c.updateDensityField?.();
 const services=civicServices(c),pumps=services.pumpStatuses.filter(p=>p.working),sewage=c.zones.filter(z=>z.id===973&&utilityPipeStatus(c,z).working);
 assert.ok(c.population>500000);assert.equal(c.powerOverloaded,false);
 assert.equal(c.zones.filter(z=>!c.power[z.i]).length,0);
 assert.equal(pumps.length,45);assert.equal(sewage.length,45);
 assert.ok(services.watered.size>0);assert.ok(services.routes.length>0);
 return c;
}
