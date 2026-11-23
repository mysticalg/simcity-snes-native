import {romPopulation} from './rom-population.js';

// The 240x200 Turbo map exceeds the original 120x100 census capacity.
// Keep the executed-ROM helper intact for native-size maps. Mega maps use
// the same zone-unit weights without 16-bit wrap or incidental ASL carry.
export const usesWideCensus=cellCount=>cellCount>12000;
export function cityPopulation(rci,baseline=0,cellCount=12000){
 if(!usesWideCensus(cellCount))return romPopulation(rci,baseline);
 const units=rci[0]+8*(rci[1]+rci[2]),population=units*20;
 return {units,population,netMigration:population-baseline,category:[2000,10000,50000,100000,500000].filter(n=>population>=n).length};
}
