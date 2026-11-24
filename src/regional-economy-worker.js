import {RegionalEconomy} from './regional-economy.js?v=background-64';
import {economicPatch,patchCitySave} from './economy-view.js?v=background-64';
import {regionStore,writeEconomicRound} from './regions.js?v=background-64';
let engine=null,queue=Promise.resolve();
const clockState=()=>({economyTick:engine.region.economyTick||0,completedEconomyTick:engine.completedTick,lastEconomyYear:engine.region.lastEconomyYear,lastEconomyMonth:engine.region.lastEconomyMonth,lastEconomyMonths:engine.region.lastEconomyMonths||{},backgroundIndustry:engine.region.backgroundIndustry!==false});
function record(slot){const base=engine.region.cities[slot],c=engine.views.get(String(slot));return base&&c?{...base,save:patchCitySave(base.save,economicPatch(c))}:base;}
async function handle(type,data){
 if(type==='init'){engine=new RegionalEconomy(data.region,data.build,data.flags);return{state:clockState(),cities:engine.views.size};}
 if(type==='tick'){const start=performance.now(),result=engine.round(data);await writeEconomicRound(engine.region.id,result.patches,clockState());return{...result,ms:performance.now()-start,state:clockState()};}
 if(type==='patch'){engine.patch(data.patches);const patches=data.patches.map(p=>({slot:String(p.slot),...economicPatch(engine.views.get(String(p.slot)))}));await writeEconomicRound(engine.region.id,patches,clockState());return{state:clockState()};}
 if(type==='checkpoint'){engine.checkpoint(String(data.slot),data.record);return{state:clockState()};}
 if(type==='city')return record(String(data.slot));
 if(type==='persist'||type==='region'){for(const slot of Object.keys(engine.region.cities))engine.region.cities[slot]=record(slot);if(type==='persist')await regionStore('put',engine.region);return type==='region'?engine.region:{state:clockState()};}
 if(type==='setting'){engine.region.backgroundIndustry=data.enabled;return{state:clockState()};}
 if(type==='flush')return{state:clockState()};
 throw Error('Unknown regional economy request');
}
self.onmessage=event=>{const{id,type,data}=event.data;queue=queue.then(async()=>{try{self.postMessage({id,result:await handle(type,data)});}catch(error){self.postMessage({id,error:error?.stack||String(error)});}});};
