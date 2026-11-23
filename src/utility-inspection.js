import {pumpStatus} from './civic.js?v=water-capacity-1';
import {sewageServices} from './sewage.js?v=water-capacity-1';
export function utilityInspectionHTML(city,z){
 if(![969,973,974].includes(z.id))return '';
 const s=z.id===969?pumpStatus(city,z):sewageServices(city).statuses.find(p=>p.i===z.i);
 if(!s)return '';
 return `<p class="utility-inspection">Pipe network: <b>${s.connected?'connected':'not connected'}</b><br>Status: ${s.reason}${z.id===974?`<br>Treatment: ${s.treated.toLocaleString()} / ${s.capacity.toLocaleString()} per month`:''}<br>${z.id===969?'Needs electricity, a water intake beside it and a connected pipe.':z.id===974?'Uses the shared pipe network. Needs electricity and a sewage pump on the same network; drinking-water supply is not required.':'Needs electricity and a connected pipe leading to treatment or a water outfall.'}<br>A pipe may end underneath any part of the footprint or beside an edge. Underground view shows the manifold and connector.</p>`;
}
