import fs from 'node:fs';
import assert from 'node:assert/strict';
import {City} from '../src/simulation.js';
import {civicServices} from '../src/civic.js?v=patch-work-54';
import {installBuildingOperations} from '../src/building-operations.js?v=patch-work-54';

export function truckRoutingFixture(){
 installBuildingOperations(City);
 const build=JSON.parse(fs.readFileSync('assets/tables/build.json')),flags=JSON.parse(fs.readFileSync('assets/tables/city.json')).flags;
 const city=new City(new Uint16Array(12000),build,flags,{year:2091,scenario:'FreeCity',disastersEnabled:false});
 city.funds=1e6;city.autoBudget=true;
 for(let x=2;x<90;x++)city.map[8*120+x]=0x32;
 for(const [tool,x,y]of [[33,4,5],[32,14,5],[50,24,6],[31,34,7],[49,44,6],[5,55,5]])assert.ok(city.place(tool,x,y),'Truck fixture tool '+tool);
 city.civic.busFrame=0;city.civic.garbage=50000;city.civic.generatedGarbage=1000;city.refresh();
 assert.equal(city.powerOverloaded,false);assert.ok(city.zones.every(z=>city.power[z.i]));
 assert.equal(civicServices(city).garbageFacilities.statuses.filter(p=>p.operating).length,4);
 return city;
}
