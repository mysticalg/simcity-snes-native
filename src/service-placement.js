import {healthCoverage} from './health-coverage.js?v=background-64';
import {transitOverlay} from './transit-render.js?v=growth-60';
import {expandServiceCoverage} from './police-range.js?v=services-57';
import {educationCoverage} from './education.js?v=background-64';
import {CIVIC_TOOLS,civicForId,civicRoadEntry,civicBounds} from './civic.js?v=background-64';
import {seedRomServicePlane} from './rom-services.js';
import {operationalMap,buildingOff} from './building-operations.js?v=background-64';
import {emergencyKind,emergencyBounds} from './emergency.js?v=emergency-1';
import {transportOverlay} from './transport-overlays.js?v=background-64';
const cache=new WeakMap();
export function placementCoverageKind(tool){if(tool===8||tool===21)return 'police';if(tool===9||tool===22)return 'fire';if([1,37,38].includes(tool))return 'traffic';if(tool===2)return 'railTraffic';if(tool===94)return 'traffic';if(tool>=95&&tool<=103)return [97,98,101,103].includes(tool)?'subway':'raisedTransit';if([12,63,64,65].includes(tool))return 'airTraffic';const kind=CIVIC_TOOLS.find(b=>b.tool===tool)?.kind;if(tool===4||tool===10||(tool>=15&&tool<30)||kind==='park')return 'landValue';return ['health','education'].includes(kind)?kind:null;}
const names={police:'Police coverage',fire:'Fire coverage',health:'Health / ambulance coverage',education:'Education coverage',landValue:'Land value'};
export function placementServiceCoverage(city,tool){
 const kind=placementCoverageKind(tool);if(!kind)return null;if(kind==='subway'||kind==='raisedTransit')return transitOverlay(city,tool);
 if(['traffic','railTraffic','airTraffic'].includes(kind))return transportOverlay(city,kind);
 const key=city.revision+':'+city.baseStep+':'+city.serviceStrengths.join(':')+':'+city.policeEffectiveness+':'+Object.entries(city.disabledBuildings||{}).join(';'),old=cache.get(city);
 let entries=old?.key===key&&old.power===city.power?old.entries:new Map();
 if(entries.has(kind))return entries.get(kind);
 const width=city.width||120,height=city.height||100,facilities=city.zones.filter(z=>kind==='police'||kind==='fire'?emergencyKind(z.id)===kind:kind==='landValue'?civicForId(z.id)?.kind==='park'||(z.type>=15&&z.type<30):civicForId(z.id)?.kind===kind);
 let field,max=(kind==='police'||kind==='fire')?255:1000;
 if(kind==='health')field=healthCoverage(city).field;else if(kind==='education')field=educationCoverage(city).field;else if(kind==='landValue'){field=city.landValue;max=250;}
 else if(kind==='police'||kind==='fire')field=expandServiceCoverage(seedRomServicePlane(operationalMap(city),city.serviceStrengths[kind==='police'?0:1]*(kind==='police'?city.policeEffectiveness:1),kind,width,height),kind,width,height);
 else{field=new Uint16Array(city.map.length);const homes=city.zones.filter(z=>z.type===5).map(z=>({...z,residents:(z.id===0x84?city.adjacentSmallHomeCount(z):city.zonePopulation(z))*20}));
  for(const z of facilities){const b=civicForId(z.id);if(buildingOff(city,z)||!city.power[z.i]||civicRoadEntry(city,z)<0)continue;const radius=b.healthRadius||b.radius||(kind==='health'?24:z.id===964?12:z.id===965?20:28),load=homes.reduce((n,h)=>n+(Math.abs(h.x-z.x)+Math.abs(h.y-z.y)<radius?h.residents:0),0),factor=Math.min(1,b.capacity/Math.max(1,load));
   for(let y=Math.max(0,z.y-radius);y<=Math.min(height-1,z.y+radius);y++)for(let x=Math.max(0,z.x-radius);x<=Math.min(width-1,z.x+radius);x++){const influence=Math.max(0,1-(Math.abs(x-z.x)+Math.abs(y-z.y))/radius)*factor,i=y*width+x;field[i]=Math.min(1000,field[i]+Math.round(influence*1000));}
  }
 }
 const value={kind,name:names[kind],field,max,facilities,width,height,canvas:null,goodHigh:true};entries.set(kind,value);cache.set(city,{key,power:city.power,entries});return value;
}
export function placementCoverageLegend(city,tool,x,y){const s=placementServiceCoverage(city,tool);if(!s)return '';if(s.kind==='subway'||s.kind==='raisedTransit')return s.name+' · '+s.facilities.length+' stations · '+(s.routes||0)+' connected routes · stations need power · ramps join ground rail to raised/subway levels';const raw=s.field[y*s.width+x]||0;if(s.kind==='landValue')return `Land value · ${raw}/250 here · green high / red low`;if(s.kind==='traffic')return `Road traffic · ${raw}/240 here · green flowing / red congested`;if(s.kind==='railTraffic')return `Rail traffic · ${raw}% demand / seats · ${city.railStats?.waiting||0} passengers waiting · green spare / red full`;if(s.kind==='airTraffic')return `Air traffic · ${s.traffic.active} aircraft · ${s.traffic.requested} flight demand · green spare / red congested`;return `${s.name} · ${Math.round(Math.min(1,raw/s.max)*100)}% here · ${s.facilities.length} existing · green strong / amber partial / red none`;}
export function drawServicePlacement(ctx,city,tool,view){const s=placementServiceCoverage(city,tool);if(!s)return;
 if(!s.canvas){const canvas=document.createElement('canvas');canvas.width=s.width;canvas.height=s.height;const c=canvas.getContext('2d'),data=c.createImageData(s.width,s.height);for(let i=0;i<s.field.length;i++){const id=city.map[i]&1023;if((!s.includeWater&&id>0&&id<20)||(s.mask&&!s.mask[i]))continue;const level=Math.min(1,s.field[i]/s.max),t=s.goodHigh===false?1-level:level,p=i*4;data.data[p]=Math.round(224-165*t);data.data[p+1]=Math.round(65+165*t);data.data[p+2]=75;data.data[p+3]=s.mask||s.field[i]>0?100:35;}c.putImageData(data,0,0);s.canvas=canvas;}
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(s.canvas,0,0,s.width*8,s.height*8);ctx.lineWidth=.8;
 for(const z of s.facilities){const b=z.bounds||emergencyBounds(z)||civicBounds(z)||{x:z.x-1,y:z.y-1,width:3,height:3};if(b.x>view.x+view.width||b.x+b.width<view.x||b.y>view.y+view.height||b.y+b.height<view.y)continue;ctx.strokeStyle=buildingOff(city,z)?'#f38172':'#e9f9c6';ctx.strokeRect(b.x*8,b.y*8,b.width*8,b.height*8);}
 ctx.restore();
}
