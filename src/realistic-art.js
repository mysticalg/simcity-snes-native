import {buildingOff} from './building-operations.js';
const image=src=>{const i=new Image();i.src=src;return i;};
export function photorealSlot(city,z){
 if(z.type===5){if([0x84,0x129,0x132].includes(z.id))return -1;const population=city.zonePopulation(z);if(population<=0)return -1;if(population<=24)return 0;if(population<=32)return 1;return Math.min(4,1+Math.floor(Math.max(0,z.id-0x99)/36));}
 if(z.type===6){const population=city.zonePopulation(z);if(population<=0)return -1;const exact=[0x144,0x168,0x195,0x1d4,0x1ef].indexOf(z.id);return exact>=0?5+exact:Math.min(9,4+population);}
 if(z.type===7)return city.zonePopulation(z)>0?(city.zonePopulation(z)<3?10:11):-1;
 return z.type===8?12:z.type===14?13:z.type===13?14:-1;
}
export function spriteFootprint(city,z){for(const b of city.build.buildings){if(!b)continue;const n=b.tiles.indexOf(z.id);if(n>=0)return {x:z.x-b.x[n],y:z.y-b.y[n],width:Math.max(...b.x)+1,height:Math.max(...b.y)+1};}return {x:z.x-1,y:z.y-1,width:3,height:3};}
export function intactPhotoFootprint(city,b){for(let y=b.y;y<b.y+b.height;y++)for(let x=b.x;x<b.x+b.width;x++){const id=city.id(x,y);if(id<0x80||id===0x364||id===0x365)return false;}return true;}
// Warm luminous pixels are extracted from the selected ImageGen NIGHT art,
// so the bloom comes from its actual individual windows/doors, never plot centres.
export function windowEmission(data){const out=new Uint8ClampedArray(data.length);let pixels=0;for(let p=0;p<data.length;p+=4){const [r,g,b,a]=data.subarray(p,p+4);if(a>120&&r>130&&g>75&&r>b*1.45&&g>b*1.15){out[p]=r;out[p+1]=g;out[p+2]=b;out[p+3]=Math.min(a,Math.round((r-110)*1.5));pixels++;}}return {data:out,pixels};}
export class RealisticBuildings{
 constructor(){this.day=image('assets/realistic/atlas-day-v1.png');this.night=image('assets/realistic/atlas-night-v1.png');this.ready=Promise.all([this.day.decode(),this.night.decode()]);this.emission=[];this.states=new WeakMap();}
 prepare(){if(this.emission.length||!this.night.complete||!this.night.naturalWidth)return;for(let n=0;n<15;n++){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(this.night,n%5*this.night.width/5,Math.floor(n/5)*this.night.height/3,this.night.width/5,this.night.height/3,0,0,256,256);const mask=windowEmission(ctx.getImageData(0,0,256,256).data);ctx.putImageData(new ImageData(mask.data,256,256),0,0);this.emission.push({canvas:c,pixels:mask.pixels});}}
 draw(ctx,city,view,atlas,night,time){const drawn=new Set();let buildings=0,glowing=0,windowPixels=0;if(!this.day.complete||!this.day.naturalWidth||!this.night.complete||!this.night.naturalWidth)return {drawn,buildings,glowing,windowPixels};this.prepare();let state=this.states.get(city);if(!state){state=new Map();this.states.set(city,state);}ctx.save();ctx.imageSmoothingEnabled=true;
  for(const z of city.zones){const slot=photorealSlot(city,z);if(slot<0)continue;const b=spriteFootprint(city,z);if(b.x>view.x+view.width||b.y>view.y+view.height||b.x+b.width<view.x||b.y+b.height<view.y||!intactPhotoFootprint(city,b))continue;drawn.add(z.i);buildings++;const x=b.x*8,y=b.y*8,w=b.width*8,h=b.height*8,powered=city.power[z.i]&&!buildingOff(city,z);
   // Clear original roof pixels before placing the transparent replacement.
   for(let yy=0;yy<b.height;yy++)for(let xx=0;xx<b.width;xx++)ctx.drawImage(atlas,0,0,8,8,x+xx*8,y+yy*8,8,8);if(night){ctx.globalAlpha=night*.7;ctx.fillStyle='#031126';ctx.fillRect(x,y,w,h);ctx.globalAlpha=1;}
   let entry=state.get(z.i);if(!entry||entry.slot!==slot){entry={slot,previous:entry?.slot??slot,start:time};state.set(z.i,entry);}const mix=Math.min(1,Math.max(0,(time-entry.start)/.65));
   const draw=(frame,alpha)=>{ctx.globalAlpha=alpha;ctx.drawImage(this.day,frame%5*this.day.width/5,Math.floor(frame/5)*this.day.height/3,this.day.width/5,this.day.height/3,x,y,w,h);if(powered&&night){ctx.globalAlpha=alpha*night;ctx.drawImage(this.night,frame%5*this.night.width/5,Math.floor(frame/5)*this.night.height/3,this.night.width/5,this.night.height/3,x,y,w,h);}else if(night){ctx.globalAlpha=alpha*night*.7;ctx.fillStyle='#031126';ctx.fillRect(x,y,w,h);}};
   if(mix<1&&entry.previous!==slot)draw(entry.previous,1-mix);draw(slot,mix<1&&entry.previous!==slot?mix:1);ctx.globalAlpha=1;
   if(powered&&night&&this.emission[slot]?.pixels){const mask=this.emission[slot];ctx.save();ctx.globalCompositeOperation='screen';ctx.shadowColor='#ffd38a';ctx.shadowBlur=2.5*(view.zoom||1);ctx.globalAlpha=night*(.66+.05*Math.sin(time*.7+z.i));ctx.drawImage(mask.canvas,x,y,w,h);ctx.restore();glowing++;windowPixels+=mask.pixels;}
  }ctx.restore();return {drawn,buildings,glowing,windowPixels};
 }
}
