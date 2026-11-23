import {generateRomDemand} from './rom-demand.js?v=processing-1';
import {romFacilityDemand} from './rom-facilities.js?v=gift-workers-31';
import {romCityProblems} from './rom-evaluation.js?v=facilities-1';
import {usesWideCensus} from './turbo-population.js?v=wide-census-39';

// Explicit large-map and linked-region extensions of CODE_03894C's fixed-point equations.
// Keep native helpers and their register-width quirks for native-size maps.
export function generateCityDemand(rci,history=[0,0,0],difficulty=0,cellCount=12000,{regional=false}={}){
 if(!usesWideCensus(cellCount)&&!regional)return generateRomDemand(rci,history,difficulty);
 const residential=Math.floor(rci[0]/8),commercial=rci[1],industrial=rci[2];
 const oldResidential=Math.floor(history[0]/8),oldJobs=history[1]+history[2];
 const total=residential+commercial+industrial;
 const residentialRatio=Math.min(512,residential?Math.floor(oldJobs*256/residential)+5:332);
 const historyRatio=oldJobs?Math.min(332,Math.floor(oldResidential*256/oldJobs)):256;
 const commercialNumerator=Math.floor(total*65536/947)+historyRatio;
 const commercialRatio=Math.min(512,commercial?Math.floor(commercialNumerator/commercial):commercialNumerator);
 let industrialRatio=512;
 if(industrial){const first=Math.floor(industrial*historyRatio/256),adjusted=Math.max(5,Math.floor(first*[307,282,251][difficulty]/256));industrialRatio=Math.min(512,Math.floor(adjusted*256/industrial));}
 const ratios=[residentialRatio,commercialRatio,industrialRatio];
 return {ratios,scores:ratios.map(n=>Math.floor(n*600/256)),totalUnits:total};
}
export function cityFacilityDemand(residential,counts,cellCount=12000){
 if(!usesWideCensus(cellCount))return romFacilityDemand(residential,counts);
 const quota=Math.floor(residential/256);return counts.map(n=>quota===n?0:quota>n?1:-1);
}
export function cityProblems(input,width=120,height=100){
 const problems=romCityProblems(input,width,height);
 if(usesWideCensus(width*height)){
  const rci=input.rci||[0,0,0],jobs=rci[1]+rci[2],workers=jobs*8,residents=rci[0];
  problems[5]=jobs&&workers<residents?Math.min(255,Math.floor(residents*256/workers)-256):0;
  problems[6]=Math.min(255,(input.fires||0)*5);
 }
 return problems;
}
