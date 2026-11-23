import {civicServices,civicForId,civicRoadEntry,pumpStatus,educationEffects} from './civic.js?v=processing-1';
import {windPower} from './climate.js?v=weather-1';
import {sewageServices} from './sewage.js?v=processing-1';
import {collectGarbage,monthlyGarbageDemand} from './landfill.js?v=processing-1';
import {employmentIncome} from './employment.js';
import {emergencyKind} from './emergency.js';
const fmt=n=>Math.round(Number(n)||0).toLocaleString();
export function processingMeters(city,z){
 const meters=[],notes=[],custom=civicForId(z.id),off=city.disabledBuildings?.[z.i]===z.id;
 const add=(label,value,capacity,unit='',options={})=>meters.push({label,value,capacity,unit,...options});let status=off?'Switched off':'Enabled';
 if([973,974].includes(z.id)){
  const s=sewageServices(city).statuses.find(p=>p.i===z.i);status=s.reason;
  add(z.id===974?'Sewage treated':'Sewage collected',z.id===974?s.treated:s.collected,s.capacity,'/month');notes.push('Current monthly allocation · shared pipe network','Pipe '+(s.connected?'connected':'not connected')+' · drinking water not required');
 }else if([961,962,975,976].includes(z.id)){
  const services=civicServices(city).garbageFacilities,shadow={...city,civic:{...city.civic,landfillUsed:{...city.civic.landfillUsed}}};collectGarbage(shadow,monthlyGarbageDemand(city,educationEffects(city.civic.education).wasteReduction),services);
  const p=services.statuses.find(p=>p.i===z.i),usage=shadow.civic.garbageFacilityUsage[z.i];status=p.reason;
  if(z.id===961){const site=services.sites.find(s=>s.tiles.some(t=>t.i===z.i));add('Rubbish stored · this tile',city.civic.landfillUsed?.[z.i]||0,10000);if(site)add('Connected landfill site',site.used,site.capacity);notes.push('Storage · shared site');}
  else{add(z.id===962?'Rubbish burned':z.id===975?'Rubbish recycled':'Extra rubbish pickup',usage.processed,{962:6000,975:4000,976:12000}[z.id],'/month');notes.push('Current monthly allocation');if(z.id===976)notes.push('Adds pickup after municipal collection; needs disposal capacity.');}
 }else if(z.id===969){
  const s=pumpStatus(city,z),network=civicServices(city).waterNetworks.find(g=>g.cells.includes(z.i));status=s.reason;add('Water network allocation',network?.used||0,network?.capacity||5000,'/month');notes.push('Shared network · this pump adds '+(s.working?'5,000':'0')+'/month');
 }else if([13,14,33,41].includes(z.type)){
  add('Power grid load',city.powerUsed,city.powerCapacity,'tiles');notes.push('Shared grid · output contribution '+fmt(off?0:z.type===13?2000:z.type===14?700:z.id===972?windPower(city):custom?.capacity));status=off?'Switched off':city.powerOverloaded?'Grid overloaded':'Generating';
 }else if(z.type===5){
  const h=employmentIncome(city).homes.get(z.i);add('Residents',h?.residents||0,(z.id>=0x376?48:40)*20,'people',{fullIsNormal:true});add('Employed residents',h?.employed||0,h?.workers||0,'workers',{fullIsNormal:true});status=h?.workers?(h.employed===h.workers?'All workers employed':'Residents need jobs'):'Vacant';
 }else if(z.type===6||z.type===7){
  const units=city.zonePopulation(z);add(z.type===6?'Commercial jobs':'Industrial jobs',units*160,(z.type===6?(z.id>=0x39a?6:5):4)*160,'jobs',{fullIsNormal:true});notes.push('Job capacity · individual employer attendance is not tracked.');status=city.power[z.i]?'Jobs available':'Needs electricity';
 }else if(emergencyKind(z.id)){
  const police=emergencyKind(z.id)==='police';add(police?'Police funding':'Fire funding',off?0:city.funding[police?1:2],100,'%',{fullIsNormal:true});add(police?'Local crime':'Local fire protection',police?city.crime[z.i]:city.fireCoverage[z.i],255,'points',{fullIsNormal:!police});notes.push('Coverage and funding · no material processing');
 }else if(custom&&['health','education','bus'].includes(custom.kind)){
  const service=civicServices(city),capacity=service.capacity[custom.kind],operating=!off&&(city.power[z.i]||z.id===967)&&civicRoadEntry(city,z)>=0;add('Citywide '+custom.kind+' capacity',Math.min(city.population,capacity),capacity,'people');add(custom.kind==='health'?'City health':custom.kind==='education'?'City education':'City bus routes',custom.kind==='health'?city.civic.health:custom.kind==='education'?city.civic.education:city.busRoutes.length,custom.kind==='bus'?32:100,custom.kind==='bus'?'routes':'%',{fullIsNormal:true});notes.push('Shared city service · this facility contributes '+fmt(operating?custom.capacity:0));status=off?'Switched off':!city.power[z.i]&&z.id!==967?'Needs electricity':!operating?'Needs road access':'Serving the city';
 }else notes.push('No material-processing role');
 return {status:off?'Switched off':status,meters,notes};
}
export function meterHTML(m){
 const ratio=m.capacity>0?Math.max(0,m.value/m.capacity):0,percent=Math.round(ratio*100),full=ratio>=1&&m.capacity>0,state=full&&!m.fullIsNormal?'full':ratio>=.85&&!m.fullIsNormal?'busy':'normal';
 return `<div class="facility-meter ${state}"><div class="meter-heading"><span>${m.label}</span><b>${full?(m.fullIsNormal?'100%':'Full capacity'):percent+'%'}</b></div><div class="meter-track" role="progressbar" aria-label="${m.label}" aria-valuemin="0" aria-valuemax="${Math.max(1,m.capacity)}" aria-valuenow="${Math.min(m.value,Math.max(1,m.capacity))}" aria-valuetext="${fmt(m.value)} of ${fmt(m.capacity)} ${m.unit}"><i style="width:${Math.min(100,percent)}%"></i></div><div class="meter-values"><strong>${fmt(m.value)}</strong><span>/ ${fmt(m.capacity)} ${m.unit}</span></div></div>`;
}
export function facilityMetersHTML(city,z,b){
 const p=processingMeters(city,z);return `<section class="facility-dashboard"><div class="facility-status">${b.enabled?'●':'Ⅱ'} ${p.status}</div><div class="facility-meter-grid">${p.meters.map(meterHTML).join('')}</div><div class="processing-notes">${p.notes.map(n=>`<span>${n}</span>`).join('')}</div><div class="inspection-money"><span>Build <b>$${fmt(b.cost)}</b></span><span>Upkeep <b>$${fmt(b.annualUpkeep)}/yr</b></span><span>Tax <b>$${fmt(b.estimatedTax)}/yr</b></span></div></section>`;
}
