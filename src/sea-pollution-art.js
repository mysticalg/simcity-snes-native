import {tileDrawBounds} from './tile-draw-bounds.js?v=patch-work-54';
// Pollution changes with simulated months, not animation frames. Retain one
// pixel per map cell and upload only changed data; inspect mutable arrays so
// terraforming, save restores and direct pollution edits cannot leave stale art.
const caches=new WeakMap(),colors=Array.from({length:256},(_,level)=>[Math.round(145-level*.25),Math.round(128-level*.35),Math.round(80-level*.2)]);
export function drawCachedSeaPollution(ctx,city,bounds){
 const width=city.width||120,height=city.map.length/width;let c=caches.get(city);
 if(!c||c.width!==width||c.height!==height){const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):Object.assign(document.createElement('canvas'),{width,height}),paint=canvas.getContext('2d'),pixels=paint.createImageData(width,height);c={width,height,canvas,paint,pixels,levels:new Uint8Array(city.map.length),active:0,uploads:0,draws:0};caches.set(city,c);}
 const {data}=c.pixels,{x0,y0,x1,y1}=tileDrawBounds(width,height,bounds);let dirty=false;
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=y*width+x;const id=city.map[i]&1023,level=id>=1&&id<20&&city.seaPollution[i]>=8?city.seaPollution[i]:0,old=c.levels[i];if(level===old)continue;c.active+=!!level-!!old;c.levels[i]=level;const offset=i*4;if(level){const rgb=colors[level];data[offset]=rgb[0];data[offset+1]=rgb[1];data[offset+2]=rgb[2];data[offset+3]=255;}else data.fill(0,offset,offset+4);dirty=true;}
 if(dirty){c.paint.putImageData(c.pixels,0,0);c.uploads++;}
 if(c.active){const smoothing=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;if(bounds){if(x1>x0&&y1>y0)ctx.drawImage(c.canvas,x0,y0,x1-x0,y1-y0,x0*8,y0*8,(x1-x0)*8,(y1-y0)*8);}else ctx.drawImage(c.canvas,0,0,width*8,height*8);ctx.imageSmoothingEnabled=smoothing;c.draws++;}
 return {cells:c.active,uploads:c.uploads,draws:c.draws,pixels:width*height,updated:dirty};
}
