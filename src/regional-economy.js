// Pure regional economic rounds. No zoning, disasters, rendering or calendar catch-up.
import {createEconomyView,economicPatch,applyEconomicPatch} from './economy-view.js?v=background-64';
import {advanceProductionMonth,productionState} from './industry.js?v=background-64';
import {industrySpec} from './industry-tools.js';
import {depotSpec} from './trade-tools.js?v=background-64';
import {advanceTradeMonth,tradePrices} from './trade.js?v=background-64';
import {GOODS} from './commodities.js';
import {regionExchange} from './regions.js?v=background-64';
import {civicServices} from './civic.js?v=background-64';
import {updateWaterStorage} from './water-allocation.js';
import {operationalMap} from './building-operations.js?v=background-64';
export class RegionalEconomy{
 constructor(region,build,flags){this.region=region;this.build=build;this.flags=flags;this.views=new Map(Object.entries(region.cities).map(([slot,rec])=>[String(slot),createEconomyView(rec.save,build,flags)]));this.completedTick=Math.max(0,region.completedEconomyTick||0);}
 checkpoint(slot,record){this.region.cities[slot]=record;this.views.set(String(slot),createEconomyView(record.save,this.build,this.flags));}
 patch(entries){for(const p of entries){const c=this.views.get(String(p.slot));if(c&&(p.economy?.revision||0)>(c.civic.economy?.revision||0))applyEconomicPatch(c,p);}}
 round({tick,activeSlot,patches=[],activePatch,geometry,year,month,period,enabled=true}){if(tick<=this.completedTick)return{tick,completedTick:this.completedTick,patches:[],skipped:true};this.patch(patches);if(geometry){const c=this.views.get(String(activeSlot));if(c){const {waterEnabled,...fields}=geometry;Object.assign(c,fields);c.map=Uint16Array.from(geometry.map);c.pipes=Uint8Array.from(geometry.pipes);c.power=Uint8Array.from(geometry.power);c.civic.waterEnabled=waterEnabled;c.revision++;}}if(activePatch){const c=this.views.get(String(activeSlot));if(c)applyEconomicPatch(c,activePatch);}
  const changed=new Set(patches.map(p=>String(p.slot))),operating=[];if(activePatch)changed.add(String(activeSlot));
  if(enabled)for(const[slot,c]of this.views){if(slot===String(activeSlot)||c.regionalPolicy.backgroundProduction===false)continue;const facilities=c.zones.filter(z=>industrySpec(z.id)||depotSpec(z.id));if(!facilities.length||(!facilities.some(z=>industrySpec(z.id))&&!Object.values(c.civic.economy?.orders||{}).some(o=>o.mode!=='off')))continue;operating.push([slot,c,facilities]);}
  // Update saved utility networks in the worker, using the same regional allocations.
  for(const[slot,c]of operating){c.regionalState=regionExchange(this.region,slot,c,this.views);const map=c.map,zones=c.zones;c.map=operationalMap(c);c.zones=zones.filter(z=>c.disabledBuildings[z.i]!==z.id);const previous=c.power;try{c.updatePower();}finally{if(c.map!==map)for(let i=0;i<map.length;i++)map[i]=(map[i]&0x7fff)|(c.map[i]&0x8000);c.map=map;c.zones=zones;}if(c.power.some((n,i)=>n!==previous[i]))c.revision++;}
  for(const[slot,c,facilities]of operating){const e=productionState(c),s=civicServices(c);c.civicWatered=s.watered;if(c.civic.waterEnabled)updateWaterStorage(c,s.waterNetworks);const annual=facilities.filter(z=>c.disabledBuildings[z.i]!==z.id).reduce((n,z)=>n+(industrySpec(z.id)||depotSpec(z.id)).annual,0),due=annual+(e.backgroundUpkeepRemainder||0),cost=Math.floor(due/12);e.backgroundUpkeepRemainder=due%12;e.background={tick,year,month,upkeep:cost,status:!c.infiniteMoney&&c.funds<cost?'Insufficient funds':'Running'};
   if(c.infiniteMoney||c.funds>=cost){if(!c.infiniteMoney)c.funds-=cost;advanceProductionMonth(c,{regionTick:tick});}else{e.production.lastRegionTick=tick;e.revision=(e.revision||0)+1;}
   changed.add(slot);
  }
  // All production happens before any inactive-city shipments. The active city is handled on the main thread.
  const inactive=new Map(operating.map(([slot,c])=>[slot,c])),buyer=this.views.get(String(activeSlot)),market=tradePrices([...this.views.values()]);for(const[slot,c]of operating){c.regionalState=regionExchange(this.region,slot,c,this.views);const targets={};if(c.regionalState.goodsLinks.some(l=>String(l.slot)===String(activeSlot))){const seller=c.civic.economy,be=buyer?.civic.economy;for(const[g,o]of Object.entries(seller.orders||{})){const buy=be?.orders?.[g];if(o.mode==='export'&&buy?.mode==='import'){const used=be.freightQuota?.stamp==='region:'+tick?be.freightQuota.rates[g]||0:0,need=Math.max(0,Math.min(buy.target-(be.inventory[g]||0),buy.rate-used,buyer.infiniteMoney?Infinity:Math.floor(buyer.funds/market[g])));if(need>0){targets[g]=o.target;o.target=Math.max(o.target,need);}}}}for(const other of advanceTradeMonth(c,{region:this.region,slot,saved:inactive,regionTick:tick,skipProduction:true}))changed.add(String(other));for(const[g,target]of Object.entries(targets))c.civic.economy.orders[g].target=target;}
  this.completedTick=tick;this.region.economyTick=tick;this.region.completedEconomyTick=tick;this.region.lastEconomyYear=year;this.region.lastEconomyMonth=month;this.region.lastEconomyMonths??={};this.region.lastEconomyMonths[activeSlot]=period;
  return{tick,completedTick:tick,backgroundCities:operating.length,patches:[...changed].map(slot=>({slot,...economicPatch(this.views.get(slot))})),year,month};
 }
}
