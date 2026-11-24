import {stampZoneFootprint} from './rom-growth.js?v=processing-1';
// Turbo: a full zone may improve its building family when local desirability
// rises. Keep occupancy fixed; do not wrap into the hospital/school tile range.
export function upgradeFullZoneFamily(city,z,population,density){
 const id=z.scanId??city.id(z.x,z.y);let current,target;
 if(z.type===5&&population===40&&id>=0x99&&id<=0x120){current=Math.floor((id-0x99)/36);target=0x95+9*(density*4+3);}
 else if(z.type===6&&population===5&&id>=0x144&&id<=0x1ef&&((city.landValue[z.i]||0)>>>5)>=population){current=Math.floor((id-0x144)/45);target=0x140+9*(density*5+4);}
 else return false;
 return density>current&&stampZoneFootprint(city.map,z.x,z.y,target,city.width,city.height);
}
