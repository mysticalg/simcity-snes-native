import {windVector} from './climate.js?v=weather-1';
const water=id=>id>=1&&id<20;
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
export function seaMixture(dose){const n=Math.max(0,Math.min(255,dose))/255;return {murk:n,scum:Math.max(0,(n-.32)/.68)};}
export class WaterSurface{
 constructor(){this.image=new Image();this.image.src='assets/realistic/water-v1.png';this.ready=this.image.decode();this.tiles=[];this.states=new WeakMap();this.tileMasks=new Map();}
 prepare(){if(this.tiles.length||!this.image.complete||!this.image.naturalWidth)return;for(let n=0;n<4;n++){const c=canvas(256,256);c.getContext('2d').drawImage(this.image,n%2*this.image.width/2,Math.floor(n/2)*this.image.height/2,this.image.width/2,this.image.height/2,0,0,256,256);this.tiles.push(c);}}
 tileMask(id,atlas){if(this.tileMasks.has(id))return this.tileMasks.get(id);const c=canvas(8,8),ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(atlas,id%32*8,(id>>5)*8,8,8,0,0,8,8);const data=ctx.getImageData(0,0,8,8);for(let p=0;p<data.data.length;p+=4){const r=data.data[p],g=data.data[p+1],b=data.data[p+2];data.data[p]=data.data[p+1]=data.data[p+2]=255;data.data[p+3]=id<=3||b>r*1.2&&b>g*1.05?255:0;}ctx.putImageData(data,0,0);this.tileMasks.set(id,c);return c;}
 draw(ctx,city,view,atlas,time){
  this.prepare();if(!this.tiles.length)return {cells:0,polluted:0};
  const width=city.width,height=city.height;let s=this.states.get(city);
  if(!s){s={ids:new Uint16Array(city.map.length).fill(65535),levels:new Uint8Array(city.map.length),mask:canvas(width*8,height*8),dose:canvas(width,height),scum:canvas(width,height),flowX:0,flowY:0,vx:0,vy:0,time,revision:-1,waterCount:0,pollutionCount:0,scumCount:0,maskBuilds:0,surfaceBuilds:0};this.states.set(city,s);}
  const dt=Math.max(0,Math.min(1,time-s.time));s.time=time;
  const v=windVector(city.climate),blend=1-Math.exp(-dt/3);s.vx+=(v.x-s.vx)*blend;s.vy+=(v.y-s.vy)*blend;s.flowX+=s.vx*dt*(.6+city.climate.strength*2);s.flowY+=s.vy*dt*(.6+city.climate.strength*2);
  if(s.revision!==city.revision){
   const mc=s.mask.getContext('2d'),dc=s.dose.getContext('2d'),sc=s.scum.getContext('2d');let geometry=false,contamination=false;
   for(let i=0;i<city.map.length;i++){
    const id=city.map[i]&1023,x=i%width,y=Math.floor(i/width);
    if(id!==s.ids[i]){s.waterCount+=Number(water(id))-Number(water(s.ids[i]));mc.clearRect(x*8,y*8,8,8);if(water(id))mc.drawImage(this.tileMask(id,atlas),x*8,y*8);geometry=true;s.ids[i]=id;}
    const level=water(id)?city.seaPollution[i]||0:0;
    if(s.levels[i]!==level){
     s.pollutionCount+=Number(level>0)-Number(s.levels[i]>0);s.scumCount+=Number(level>81)-Number(s.levels[i]>81);
     const m=seaMixture(level);dc.clearRect(x,y,1,1);sc.clearRect(x,y,1,1);dc.fillStyle=`rgba(255,255,255,${m.murk})`;dc.fillRect(x,y,1,1);sc.fillStyle=`rgba(255,255,255,${m.scum})`;sc.fillRect(x,y,1,1);s.levels[i]=level;contamination=true;
    }
   }
   if(geometry&&s.waterCount){
    s.inner??=canvas(width*8,height*8);s.edge??=canvas(width*8,height*8);const ic=s.inner.getContext('2d'),ec=s.edge.getContext('2d');
    ic.globalCompositeOperation='source-over';ic.clearRect(0,0,width*8,height*8);ic.drawImage(s.mask,0,0);ic.globalCompositeOperation='destination-in';for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]])ic.drawImage(s.mask,dx,dy);
    ec.globalCompositeOperation='source-over';ec.clearRect(0,0,width*8,height*8);ec.drawImage(s.mask,0,0);ec.globalCompositeOperation='destination-out';ec.drawImage(s.inner,0,0);
   }
   // Blur pollution only after its field changes; flowing water reuses these masks.
   if(contamination){
    for(const [source,key,count]of [[s.dose,'softDose',s.pollutionCount],[s.scum,'softScum',s.scumCount]]){
     if(!count){s[key]=null;continue;}
     s[key]??=canvas(width*8,height*8);const target=s[key].getContext('2d');target.clearRect(0,0,width*8,height*8);target.filter='blur(6px)';target.drawImage(source,0,0,width*8,height*8);target.filter='none';s.maskBuilds++;
    }
   }
   s.revision=city.revision;s.countKey=null;s.surfaceKey=null;
  }
  if(!s.waterCount)return {cells:0,polluted:0,flowX:s.flowX,flowY:s.flowY,maskBuilds:s.maskBuilds,surfaceBuilds:s.surfaceBuilds};
  const x=view.x*8,y=view.y*8,w=Math.ceil(view.width*8),h=Math.ceil(view.height*8),countKey=[view.x,view.y,view.width,view.height].join(':');
  if(!s.buffer||s.buffer.width!==w||s.buffer.height!==h){s.buffer=canvas(w,h);s.overlay=canvas(w,h);s.patterns=null;s.surfaceKey=null;}
  const surfaceKey=[countKey,s.flowX,s.flowY,time].join(':');
  if(s.surfaceKey!==surfaceKey){
   const bc=s.buffer.getContext('2d'),oc=s.overlay.getContext('2d');
   s.patterns??=this.tiles.map((tile,n)=>(n<2?bc:oc).createPattern(tile,'repeat'));
   const pattern=(target,n,fx,fy)=>{target.imageSmoothingEnabled=true;target.globalCompositeOperation='source-over';target.globalAlpha=1;target.clearRect(0,0,w,h);const p=s.patterns[n];p.setTransform(new DOMMatrix().translate(-x+fx,-y+fy).scale(.75));target.fillStyle=p;target.fillRect(0,0,w,h);};
   pattern(bc,0,s.flowX,s.flowY);bc.globalAlpha=.25;const deep=s.patterns[1];deep.setTransform(new DOMMatrix().translate(-x+s.flowX*.7,-y+s.flowY*.7).scale(.9));bc.fillStyle=deep;bc.fillRect(0,0,w,h);bc.globalAlpha=1;
   for(const [n,mask]of [[2,s.softDose],[3,s.softScum]]){
    if(!mask)continue;pattern(oc,n,s.flowX*(n===2?.8:1.15),s.flowY*(n===2?.8:1.15));oc.globalCompositeOperation='destination-in';oc.drawImage(mask,x,y,w,h,0,0,w,h);bc.drawImage(s.overlay,0,0);
   }
   bc.globalCompositeOperation='destination-in';bc.imageSmoothingEnabled=false;bc.drawImage(s.mask,x,y,w,h,0,0,w,h);bc.globalCompositeOperation='source-over';
   if(s.edge){bc.globalAlpha=.22+.06*Math.sin(time*1.4);bc.drawImage(s.edge,x,y,w,h,0,0,w,h);bc.globalAlpha=1;}
   s.surfaceKey=surfaceKey;s.surfaceBuilds++;
  }
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(s.buffer,x,y,w,h);ctx.restore();
  if(s.countKey!==countKey){let cells=0,polluted=0;for(let yy=Math.max(0,Math.floor(view.y));yy<Math.min(height,view.y+view.height);yy++)for(let xx=Math.max(0,Math.floor(view.x));xx<Math.min(width,view.x+view.width);xx++){const i=yy*width+xx;if(water(city.map[i]&1023)){cells++;if(city.seaPollution[i]>8)polluted++;}}Object.assign(s,{countKey,cells,polluted});}
  return {cells:s.cells,polluted:s.polluted,flowX:s.flowX,flowY:s.flowY,maskBuilds:s.maskBuilds,surfaceBuilds:s.surfaceBuilds};
 }
}
