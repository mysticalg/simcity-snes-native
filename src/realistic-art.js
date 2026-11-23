import {buildingOff} from './building-operations.js?v=education-traffic-27';
const image=src=>{const i=new Image();i.src=src;return i;};
export function photorealSlot(city,z){
 if(z.type===5){if([0x84,0x129,0x132].includes(z.id))return -1;const population=city.zonePopulation(z);if(population<=0)return -1;if(population<=24)return 0;if(population<=32)return 1;return Math.min(4,1+Math.floor(Math.max(0,z.id-0x99)/36));}
 if(z.type===6){const population=city.zonePopulation(z);if(population<=0)return -1;const exact=[0x144,0x168,0x195,0x1d4,0x1ef].indexOf(z.id);return exact>=0?5+exact:Math.min(9,4+population);}
 if(z.type===7)return city.zonePopulation(z)>0?(city.zonePopulation(z)<3?10:11):-1;
 return z.type===8?12:z.type===14?13:z.type===13?14:-1;
}
const footprintTables=new WeakMap();
export function spriteFootprint(city,z){let table=footprintTables.get(city.build);if(!table){table=new Map();for(const b of city.build.buildings){if(!b)continue;const width=Math.max(...b.x)+1,height=Math.max(...b.y)+1;for(let n=0;n<b.tiles.length;n++)if(!table.has(b.tiles[n]))table.set(b.tiles[n],{x:b.x[n],y:b.y[n],width,height});}footprintTables.set(city.build,table);}const b=table.get(z.id);return b?{x:z.x-b.x,y:z.y-b.y,width:b.width,height:b.height}:{x:z.x-1,y:z.y-1,width:3,height:3};}
export function intactPhotoFootprint(city,b){for(let y=b.y;y<b.y+b.height;y++)for(let x=b.x;x<b.x+b.width;x++){const id=city.id(x,y);if(id<0x80||id===0x364||id===0x365)return false;}return true;}
// Warm luminous pixels are extracted from the selected ImageGen NIGHT art,
// so the bloom comes from its actual individual windows/doors, never plot centres.
export function windowEmission(data){const out=new Uint8ClampedArray(data.length);let pixels=0;for(let p=0;p<data.length;p+=4){const [r,g,b,a]=data.subarray(p,p+4);if(a>120&&r>130&&g>75&&r>b*1.45&&g>b*1.15){out[p]=r;out[p+1]=g;out[p+2]=b;out[p+3]=Math.min(a,Math.round((r-110)*1.5));pixels++;}}return {data:out,pixels};}
export class RealisticBuildings{
 constructor(){this.day=image('assets/realistic/atlas-day-v1.png');this.night=image('assets/realistic/atlas-night-v1.png');this.ready=Promise.all([this.day.decode(),this.night.decode()]);this.emission=[];this.frames=[];this.glows=new Map();this.states=new WeakMap();this.grounds=new Map();this.groundEpoch=0;this.composites=new Map();}
 prepare(){if(this.emission.length||!this.night.complete||!this.night.naturalWidth)return;for(let n=0;n<15;n++){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(this.night,n%5*this.night.width/5,Math.floor(n/5)*this.night.height/3,this.night.width/5,this.night.height/3,0,0,256,256);const mask=windowEmission(ctx.getImageData(0,0,256,256).data);ctx.putImageData(new ImageData(mask.data,256,256),0,0);this.emission.push({canvas:c,pixels:mask.pixels});}}
 frame(slot,night=false){const key=slot+(night?15:0);if(!this.frames[key]){const c=document.createElement('canvas');c.width=c.height=128;const image=night?this.night:this.day;c.getContext('2d').drawImage(image,slot%5*image.width/5,Math.floor(slot/5)*image.height/3,image.width/5,image.height/3,0,0,128,128);this.frames[key]=c;}return this.frames[key];}
 glow(slot,w,h){const key=slot+':'+w+':'+h;if(!this.glows.has(key)){const c=document.createElement('canvas');c.width=w+8;c.height=h+8;const ctx=c.getContext('2d');ctx.shadowColor='#ffd38a';ctx.shadowBlur=2.5;ctx.drawImage(this.emission[slot].canvas,4,4,w,h);this.glows.set(key,c);}return this.glows.get(key);}
 ground(atlas,w,h){const key=w+':'+h;let entry=this.grounds.get(key);if(!entry){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;entry={canvas,epoch:-1};this.grounds.set(key,entry);}if(entry.epoch!==this.groundEpoch){const draw=entry.canvas.getContext('2d');draw.clearRect(0,0,w,h);for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8)draw.drawImage(atlas,0,0,8,8,x,y,8,8);entry.epoch=this.groundEpoch;}return entry.canvas;}
 // Preserve the original sampling grid. Fractional camera/zoom positions use
 // the normal path rather than resampling an already rasterized composition.
 composite(ctx,atlas,slot,x,y,w,h,night,powered,m){
  const pw=Math.round(w*m.a),ph=Math.round(h*m.d);if(!pw||!ph||pw>512||ph>512)return false;
  const key=[slot,w,h,pw,ph,!!powered].join(':');let entry=this.composites.get(key);
  if(!entry){const canvas=document.createElement('canvas');canvas.width=pw;canvas.height=ph;entry={canvas,epoch:-1};this.composites.set(key,entry);if(this.composites.size>128)this.composites.delete(this.composites.keys().next().value);}
  if(entry.epoch!==this.groundEpoch||entry.night!==night){
   const paint=entry.canvas.getContext('2d');paint.setTransform(m.a,0,0,m.d,0,0);paint.clearRect(0,0,w,h);paint.globalAlpha=1;paint.imageSmoothingEnabled=true;paint.drawImage(this.ground(atlas,w,h),0,0,w,h);
   if(night){paint.globalAlpha=night*.7;paint.fillStyle='#031126';paint.fillRect(0,0,w,h);paint.globalAlpha=1;}
   paint.drawImage(this.frame(slot),0,0,w,h);
   if(powered&&night){paint.globalAlpha=night;paint.drawImage(this.frame(slot,true),0,0,w,h);}else if(night){paint.globalAlpha=night*.7;paint.fillStyle='#031126';paint.fillRect(0,0,w,h);}
   paint.globalAlpha=1;entry.epoch=this.groundEpoch;entry.night=night;this.compositeBuilds++;
  }
  ctx.imageSmoothingEnabled=false;ctx.drawImage(entry.canvas,x,y,w,h);ctx.imageSmoothingEnabled=true;return true;
 }
 draw(ctx,city,view,atlas,night,time){const drawn=new Set();let buildings=0,glowing=0,windowPixels=0,cachedBuildings=0;this.compositeBuilds=0;if(!this.day.complete||!this.day.naturalWidth||!this.night.complete||!this.night.naturalWidth)return {drawn,buildings,glowing,windowPixels};this.prepare();const version=atlas.cityGroundVersion;if(!Number.isSafeInteger(version)||this.groundAtlas!==atlas||this.groundVersion!==version){this.groundEpoch++;this.groundAtlas=atlas;this.groundVersion=version;}let state=this.states.get(city);if(!state){state=new Map();this.states.set(city,state);}ctx.save();ctx.imageSmoothingEnabled=true;
  // Check once per draw, so arbitrary smooth zoom/pan retains the original
  // path without per-building matrix allocation or canvas-state queries.
  const m=ctx.getTransform(),aligned=n=>Math.abs(n-Math.round(n))<1e-7,compositeTransform=!m.b&&!m.c&&m.a>0&&m.d>0&&ctx.globalAlpha===1&&ctx.globalCompositeOperation==='source-over'&&ctx.filter==='none'&&ctx.imageSmoothingQuality==='low'&&!ctx.shadowBlur&&!ctx.shadowOffsetX&&!ctx.shadowOffsetY&&ctx.shadowColor==='rgba(0, 0, 0, 0)'&&[8*m.a,8*m.d,m.e,m.f].every(aligned)?m:null;
  for(const z of city.zones){const slot=photorealSlot(city,z);if(slot<0)continue;const b=spriteFootprint(city,z);if(b.x>view.x+view.width||b.y>view.y+view.height||b.x+b.width<view.x||b.y+b.height<view.y||!intactPhotoFootprint(city,b))continue;drawn.add(z.i);buildings++;const x=b.x*8,y=b.y*8,w=b.width*8,h=b.height*8,powered=city.power[z.i]&&!buildingOff(city,z);
   let entry=state.get(z.i);if(!entry||entry.slot!==slot){entry={slot,previous:entry?.slot??slot,start:time};state.set(z.i,entry);}const mix=Math.min(1,Math.max(0,(time-entry.start)/.65));
   const draw=(frame,alpha)=>{ctx.globalAlpha=alpha;ctx.drawImage(this.frame(frame),x,y,w,h);if(powered&&night){ctx.globalAlpha=alpha*night;ctx.drawImage(this.frame(frame,true),x,y,w,h);}else if(night){ctx.globalAlpha=alpha*night*.7;ctx.fillStyle='#031126';ctx.fillRect(x,y,w,h);}};
   if(compositeTransform&&(mix>=1||entry.previous===slot)&&this.composite(ctx,atlas,slot,x,y,w,h,night,powered,compositeTransform))cachedBuildings++;
   else{ctx.drawImage(this.ground(atlas,w,h),x,y,w,h);if(night){ctx.globalAlpha=night*.7;ctx.fillStyle='#031126';ctx.fillRect(x,y,w,h);ctx.globalAlpha=1;}if(mix<1&&entry.previous!==slot)draw(entry.previous,1-mix);draw(slot,mix<1&&entry.previous!==slot?mix:1);ctx.globalAlpha=1;}
   if(powered&&night&&this.emission[slot]?.pixels){const mask=this.emission[slot];ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=night*(.66+.05*Math.sin(time*.7+z.i));ctx.drawImage(this.glow(slot,w,h),x-4,y-4);ctx.restore();glowing++;windowPixels+=mask.pixels;}
  }ctx.restore();return {drawn,buildings,glowing,windowPixels,cachedBuildings,compositeBuilds:this.compositeBuilds,compositeCanvases:this.composites.size};
 }
}
