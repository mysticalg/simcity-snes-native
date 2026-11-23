import {transportOverlay} from './transport-overlays.js?v=utility-work-52';
import {cityGrowthRateAt} from './rom-growth-rate.js?v=job-growth-1';
import {socialFields} from './social-fields.js?v=utility-work-52';
export const OVERLAYS={none:'City view',crime:'Crime',pollution:'Pollution',traffic:'Traffic',landValue:'Land value',density:'Population density',power:'Power',policeCoverage:'Police coverage',fireCoverage:'Fire coverage',water:'Water / pipes',wind:'Wind / air pollution',health:'Local health',unemployment:'Unemployment',education:'Education access',sewage:'Sewage / sea pollution',growthRate:'Growth / decline',railTraffic:'Rail traffic',airTraffic:'Air traffic'};
export function overlayColor(city,mode,i){
 if(mode==='none')return null;if(mode==='traffic'||mode==='railTraffic'||mode==='airTraffic'){const s=transportOverlay(city,mode);return s.mask[i]?`hsla(${120*(1-Math.min(1,s.field[i]/s.max))},90%,48%,.65)`:null;}if(mode==='landValue')return `hsla(${120*Math.min(1,city.landValue[i]/250)},90%,48%,.65)`;
 if(mode==='growthRate'){const value=cityGrowthRateAt(city,i%city.width,Math.floor(i/city.width));return value?`hsla(${value>0?120:0},90%,48%,${.2+.55*Math.min(1,Math.abs(value)/200)})`:null;}
 if(['health','unemployment','education'].includes(mode)){const fields=socialFields(city);if(!fields.mask[i])return null;const value=fields[mode][i];return `hsla(${mode==='unemployment'?120*(1-value/100):120*value/100},90%,48%,.72)`;}
 if(mode==='wind')return city.pollution[i]?`rgba(130,65,25,${Math.min(.7,city.pollution[i]/250)})`:null;
 if(mode==='sewage'){if(city.seaPollution?.[i])return `rgba(140,80,30,${Math.max(.3,city.seaPollution[i]/255)})`;if(city.pipes[i])return city.sewageFlow?.[i]?'rgba(180,110,45,.85)':'rgba(0,0,0,.8)';return null;}
 if(mode==='water'){if(city.pipes?.[i])return city.waterField?.[i]?'rgba(60,190,255,.85)':'rgba(0,0,0,.9)';return city.civicWatered?.has(i)?'rgba(60,220,220,.7)':null;}
 if(mode==='power')return city.power[i]?'rgba(80,240,130,.65)':'rgba(240,75,60,.45)';
 const value=city[mode]?.[i]||0,max=mode.endsWith('Coverage')?1000:255;
 return `hsla(${120*(1-Math.min(1,value/max))},90%,48%,.7)`;
}
