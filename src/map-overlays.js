export const OVERLAYS={none:'City view',crime:'Crime',pollution:'Pollution',traffic:'Traffic',landValue:'Land value',density:'Population density',power:'Power',policeCoverage:'Police coverage',fireCoverage:'Fire coverage',water:'Water / pipes'};
export function overlayColor(city,mode,i){
 if(mode==='none')return null;
 if(mode==='water'){if(city.pipes?.[i])return city.waterField?.[i]?'rgba(60,190,255,.85)':'rgba(0,0,0,.9)';return city.civicWatered?.has(i)?'rgba(60,220,220,.7)':null;}
 if(mode==='power')return city.power[i]?'rgba(80,240,130,.65)':'rgba(240,75,60,.45)';
 const value=city[mode]?.[i]||0,max=mode.endsWith('Coverage')?1000:255;
 return `hsla(${120*(1-Math.min(1,value/max))},90%,48%,.7)`;
}
