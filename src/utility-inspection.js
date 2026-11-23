import {pumpStatus} from './civic.js?v=amenities-gifts-29';
import {sewageServices} from './sewage.js?v=amenities-gifts-29';
export function utilityInspectionHTML(city,z){
 if(![969,973,974,988,989].includes(z.id))return '';
 const s=[969,988,989].includes(z.id)?pumpStatus(city,z):sewageServices(city).statuses.find(p=>p.i===z.i);
 if(!s)return '';
 return `<p class="utility-inspection">Pipe network: <b>${s.connected?'connected':'not connected'}</b><br>Status: ${s.reason}${z.id===974?`<br>Treatment: ${s.treated.toLocaleString()} / ${s.capacity.toLocaleString()} per month`:''}<br>${z.id===988?'Stores surplus water from its pipe network; releases stored water during shortages. Needs electricity and pipes, no shoreline intake.':[969,989].includes(z.id)?'Needs electricity, a water intake beside it and a connected pipe.':z.id===974?'Uses the shared pipe network. Needs electricity and a sewage pump on the same network; drinking-water supply is not required.':'Needs electricity and a connected pipe leading to treatment or a water outfall.'}<br>A pipe may end underneath any part of the footprint or beside an edge. Underground view shows the manifold and connector.</p>`;
}
