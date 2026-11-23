import {nativeWindowPixels} from './native-window-pixels.js?v=native-windows-50';
import {utilityImagePath} from './utility-art.js?v=health-care-34';
import {compactEmergencySprite} from './emergency.js?v=emergency-1';
import {civicForId,civicBounds} from './civic.js?v=health-care-34';
const hash=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);return ((n^(n>>>16))>>>0)/4294967296;};
// Conservative sprite-pixel masks: small glazing or inset apertures, with
// surrounding wall pixels. Large roofs, ground patches and tanks are rejected.
export function extractWindowPixels(data,width,height,options={}){
 const rgb=i=>[data[i*4],data[i*4+1],data[i*4+2]],luma=([r,g,b])=>r*.3+g*.59+b*.11;
 const result=[],used=new Set();
 for(const kind of options.allowBright?['glass','dark','bright']:['glass','dark']){
  const candidate=i=>{if(data[i*4+3]<180)return false;const [r,g,b]=rgb(i);if(kind==='glass')return b-r>55&&b-g>55&&b>100;if(kind==='dark')return luma([r,g,b])<75&&Math.max(r,g,b)<105&&g<=r*1.1+4;return Math.min(r,g,b)>140&&Math.max(r,g,b)-Math.min(r,g,b)<30;};
  const seen=new Set();
  for(let i=0;i<width*height;i++){
   if(seen.has(i)||!candidate(i))continue;const pixels=[i];seen.add(i);
   for(let at=0;at<pixels.length;at++){const p=pixels[at],x=p%width,y=Math.floor(p/width);for(const n of [x?p-1:-1,x+1<width?p+1:-1,y?p-width:-1,y+1<height?p+width:-1])if(n>=0&&!seen.has(n)&&candidate(n)){seen.add(n);pixels.push(n);}}
   const xs=pixels.map(p=>p%width),ys=pixels.map(p=>Math.floor(p/width)),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys),w=right-left+1,h=bottom-top+1;
   if(left===0||right===width-1||top===0||bottom===height-1||pixels.length>(kind==='glass'?12:6)||w>4||h>5)continue;
   const set=new Set(pixels);let wallLeft=0,wallRight=0;
   for(const p of pixels)for(const side of [-1,1]){const n=p+side;if(set.has(n)||data[n*4+3]<180)continue;const c=rgb(n),v=luma(c),own=luma(rgb(p));const wall=kind==='glass'?v>65&&c[2]-c[0]<35:kind==='dark'?v>own+25&&c[2]-c[0]<25:v<own-35&&v>35;if(wall){if(side<0)wallLeft++;else wallRight++;}}
   if(kind==='glass'?wallLeft+wallRight<1:!wallLeft||!wallRight)continue;
   const fresh=pixels.filter(p=>!used.has(p));if(fresh.length){fresh.forEach(p=>used.add(p));result.push({pixels:fresh.map(p=>({x:p%width,y:Math.floor(p/width)})),kind});}
  }
 }
 return result;
}
export function windowBrightness(seed,time){const phase=Math.floor(time/45),blend=Math.min(1,(time%45)/3),value=n=>hash(seed+n*977)>.27?.55+hash(seed+n*173+11)*.45:0;return value(phase-1)*(1-blend)+value(phase)*blend;}
function footprint(city,z){for(const b of city.build.buildings){if(!b)continue;const n=b.tiles.indexOf(z.id);if(n>=0)return {x:z.x-b.x[n],y:z.y-b.y[n],width:Math.max(...b.x)+1,height:Math.max(...b.y)+1};}return {x:z.x-1,y:z.y-1,width:3,height:3};}
// Each cell retains the original four-pixel bloom margin. An extra eight-pixel
// gap keeps neighbouring sources outside the blur kernel and sampling fringe.
export function packWindowGlows(entries,limit=512){
 const pages=[];let page=null,x=0,y=0,row=0;
 for(const entry of entries){const w=entry.width+8,h=entry.height+8;if(w>limit||h>limit){entry.page=-1;continue;}if(!page){page={width:0,height:0};pages.push(page);x=0;y=0;row=0;}if(x+w>limit){x=0;y+=row+8;row=0;}if(y+h>limit){page={width:0,height:0};pages.push(page);x=0;y=0;row=0;}entry.page=pages.length-1;entry.sx=x;entry.sy=y;page.width=Math.max(page.width,x+w);page.height=Math.max(page.height,y+h);x+=w+8;row=Math.max(row,h);}
 return pages;
}
export class WindowLights{
 constructor(){this.art=Array.from({length:62},(_,i)=>{const image=new Image();image.src=utilityImagePath(i)||'assets/custom/civic-'+(i<17?i:0)+'.png';return image;});this.ready=Promise.all(this.art.map(i=>i.decode()));this.masks=new Map();this.states=new WeakMap();}
 mask(city,z,atlas){
  const custom=civicForId(z.id);if(custom&&[961,967,972,970,990].includes(z.id))return null;const b=custom?civicBounds(z):footprint(city,z);if(!b)return null;
  const w=b.width*8,h=custom?.artHeight||b.height*8,key=custom?'civic:'+z.id+':'+w+':'+h:b.width+','+b.height+':'+Array.from({length:b.width*b.height},(_,n)=>city.id(b.x+n%b.width,b.y+Math.floor(n/b.width))).join(',');let mask=this.masks.get(key);
  if(!mask){let pixels=!custom?nativeWindowPixels(city,b,atlas):null;if(!pixels){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;
   if(custom){const im=custom.nativeTool&&custom.sprite!==60?compactEmergencySprite(city,z.id,atlas):this.art[custom.sprite??custom.tool-30];if(!im||(!(im instanceof HTMLCanvasElement)&&(!im.complete||!im.naturalWidth)))return null;ctx.drawImage(im,0,0,w,h);}
   else{if(!atlas)return null;for(let yy=0;yy<b.height;yy++)for(let xx=0;xx<b.width;xx++){const id=city.id(b.x+xx,b.y+yy);ctx.drawImage(atlas,id%32*8,(id>>5)*8,8,8,xx*8,yy*8,8,8);}}
   pixels=ctx.getImageData(0,0,w,h);}
   mask=extractWindowPixels(pixels.data,w,h,{allowBright:!!custom||z.type===7});
   if(!custom&&z.type===8){const data=pixels.data;mask=[];for(const yy of [16,18])for(let xx=2;xx<w-2;xx++){if(yy===16&&xx>=8&&xx<=12||yy===18&&xx>=8&&xx<=15)continue;const at=(yy*w+xx)*4;if(data[at]>115&&data[at+1]>120&&data[at+2]>135)mask.push({kind:'window',pixels:[{x:xx,y:yy}]});}}
   if(!custom&&z.id===0x1ef){mask=[];for(let yy=10;yy<=20;yy+=2){const left=yy/2-3;for(let xx=left;xx<left+14;xx+=3)mask.push({kind:'window',pixels:[{x:xx,y:yy},{x:Math.min(left+13,xx+1),y:yy}]});}}this.masks.set(key,mask);if(this.masks.size>512)this.masks.delete(this.masks.keys().next().value);
  }return {x:b.x*8,y:b.y*8,windows:mask};
 }
 draw(ctx,city,zones,atlas,view,night,time){
  let buildings=0,windows=0,pixels=0,state=this.states.get(city);
  if(!state){state={revision:-1,entries:new Map()};this.states.set(city,state);}
  if(state.revision!==city.revision){const current=new Map(zones.map(z=>[z.i,z]));for(const [i,entry] of state.entries){const z=current.get(i),mask=z&&entry.id===z.id?this.mask(city,z,atlas):null;if(!mask||mask.windows!==entry.mask.windows||mask.x!==entry.mask.x||mask.y!==entry.mask.y)state.entries.delete(i);}state.revision=city.revision;}
  // Keep the individual windows and the existing quantized fade. Shared bloom
  // pages avoid switching between two tiny canvases for every civic building.
  const phase=Math.floor(time/45),fade=Math.min(16,Math.floor((time%45)/3*16)),key=phase+':'+fade;
  const visible=[];
  for(const z of zones){
   if(z.x<view.x-6||z.x>view.x+view.width+6||z.y<view.y-6||z.y>view.y+view.height+6)continue;
   let entry=state.entries.get(z.i);
   if(!entry){const mask=this.mask(city,z,atlas);if(!mask)continue;const points=mask.windows.flatMap(w=>w.pixels);entry={mask,id:z.id,i:z.i,width:Math.max(1,...points.map(p=>p.x+1)),height:Math.max(1,...points.map(p=>p.y+1))};state.entries.set(z.i,entry);}
   if(!entry.mask.windows.length)continue;
   visible.push(entry);
  }
  if(state.key!==key||visible.length!==state.visible?.length||visible.some((e,i)=>e!==state.visible[i]))this.bake(state,visible,key,phase*45+fade*3/16);
  const m=ctx.getTransform(),aligned=n=>Math.abs(n-Math.round(n))<1e-7,cropSafe=!m.b&&!m.c&&[8*m.a,8*m.d,m.e,m.f].every(aligned)&&ctx.imageSmoothingQuality==='low';
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=night;
  for(const entry of visible)if(entry.windows){const w=entry.width+8,h=entry.height+8;if(entry.page<0)ctx.drawImage(entry.canvas,entry.mask.x-4,entry.mask.y-4);else if(cropSafe)ctx.drawImage(state.pages[entry.page].glow,entry.sx,entry.sy,w,h,entry.mask.x-4,entry.mask.y-4,w,h);else{
   // Fractional source-rectangle sampling can round a few colour bytes. Keep
   // the original full-image sampling grid during smooth zoom/pan/rotation.
   entry.sample??=document.createElement('canvas');if(entry.sample.width!==w)entry.sample.width=w;if(entry.sample.height!==h)entry.sample.height=h;if(entry.sampleGeneration!==state.generation){const sc=entry.sample.getContext('2d');sc.clearRect(0,0,w,h);sc.drawImage(state.pages[entry.page].glow,entry.sx,entry.sy,w,h,0,0,w,h);entry.sampleGeneration=state.generation;}ctx.drawImage(entry.sample,entry.mask.x-4,entry.mask.y-4);
  }buildings++;windows+=entry.windows;pixels+=entry.pixels;}
  ctx.restore();return {buildings,windows,pixels};
 }
 bake(state,entries,key,sampleTime){
  const sizes=packWindowGlows(entries);state.pages??=[];state.pages.length=sizes.length;
  for(const[n,size]of sizes.entries()){let page=state.pages[n];if(!page){page={source:document.createElement('canvas'),glow:document.createElement('canvas')};state.pages[n]=page;}for(const canvas of[page.source,page.glow]){if(canvas.width!==size.width)canvas.width=size.width;if(canvas.height!==size.height)canvas.height=size.height;}const sc=page.source.getContext('2d');sc.clearRect(0,0,size.width,size.height);}
  for(const entry of entries){const legacy=entry.page<0;if(legacy){entry.source??=document.createElement('canvas');entry.canvas??=document.createElement('canvas');if(entry.source.width!==entry.width)entry.source.width=entry.width;if(entry.source.height!==entry.height)entry.source.height=entry.height;}
   const source=legacy?entry.source:state.pages[entry.page].source,sc=source.getContext('2d'),ox=legacy?0:entry.sx+4,oy=legacy?0:entry.sy+4;if(legacy)sc.clearRect(0,0,entry.width,entry.height);let windows=0,pixels=0;
   for(const[n,window]of entry.mask.windows.entries()){const amount=windowBrightness(entry.i*97+n*31,sampleTime);if(amount<.03)continue;sc.fillStyle=hash(entry.i+n*7)>.83?'#b7dfff':'#ffdb89';sc.globalAlpha=amount*.95;for(const p of window.pixels){sc.fillRect(ox+p.x,oy+p.y,1,1);pixels++;}windows++;}entry.windows=windows;entry.pixels=pixels;
   if(legacy){const glow=entry.canvas;if(glow.width!==entry.width+8)glow.width=entry.width+8;if(glow.height!==entry.height+8)glow.height=entry.height+8;const gc=glow.getContext('2d');gc.clearRect(0,0,glow.width,glow.height);gc.shadowColor='#ffc969';gc.shadowBlur=2;gc.drawImage(source,4,4);}
  }
  for(const page of state.pages){const gc=page.glow.getContext('2d');gc.clearRect(0,0,page.glow.width,page.glow.height);gc.shadowColor='#ffc969';gc.shadowBlur=2;gc.drawImage(page.source,0,0);}
  state.visible=entries;state.key=key;state.generation=(state.generation||0)+1;
 }
}
