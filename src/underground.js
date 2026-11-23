import {waterConsumerBounds} from './water-allocation.js?v=education-traffic-27';
const layerCache=new WeakMap();
export function undergroundRenderStats(city){const s=layerCache.get(city);return s?{builds:s.builds,revision:s.revision,width:s.canvas.width,height:s.canvas.height}:{builds:0};}
import {waterNetwork,utilityPipeStatus,civicBounds} from './civic.js?v=amenities-gifts-29';
const cache=new WeakMap();
// Mirrors waterService's Chebyshev radius3; range alone does not guarantee
// a building's demand fits the network's finite allocation.
export function pipeServiceArea(city){const old=cache.get(city);if(old?.revision===city.revision&&old.water===city.waterField&&old.pipes===city.pipes)return old.area;const width=city.width||120,height=city.height||100,area=new Uint8Array(width*height),nodes=waterNetwork(city).nodes;for(let i=0;i<nodes.length;i++){if(!nodes[i])continue;const value=city.waterField?.[i]?2:1,x=i%width,y=Math.floor(i/width);for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<width&&ny>=0&&ny<height)area[ny*width+nx]=Math.max(area[ny*width+nx],value);}}cache.set(city,{revision:city.revision,water:city.waterField,pipes:city.pipes,area});return area;}
export function drawUnderground(ctx,city,surface,view,{drawSurfaceFacilities,preview=[]}={}){const width=city.width||120,height=city.height||100,area=pipeServiceArea(city),x0=Math.max(0,Math.floor(view.x)),y0=Math.max(0,Math.floor(view.y)),x1=Math.min(width,Math.ceil(view.x+view.width)),y1=Math.min(height,Math.ceil(view.y+view.height));ctx.save();ctx.fillStyle='#132329';ctx.fillRect(x0*8,y0*8,(x1-x0)*8,(y1-y0)*8);ctx.globalAlpha=.16;ctx.drawImage(surface,0,0);drawSurfaceFacilities?.();ctx.globalAlpha=1;let layer=layerCache.get(city);const key=[x0,y0,x1,y1].join(':');
 if(!layer||layer.revision!==city.revision||layer.key!==key||layer.water!==city.waterField||layer.watered!==city.civicWatered||layer.pipes!==city.pipes){
  const canvas=document.createElement('canvas');canvas.width=(x1-x0)*8;canvas.height=(y1-y0)*8;const draw=canvas.getContext('2d');draw.translate(-x0*8,-y0*8);
  drawStaticPipes(draw,city,area,width,x0,y0,x1,y1);
  layer={key,revision:city.revision,water:city.waterField,watered:city.civicWatered,pipes:city.pipes,canvas,builds:(layer?.builds||0)+1};layerCache.set(city,layer);
 }
 ctx.imageSmoothingEnabled=false;ctx.drawImage(layer.canvas,x0*8,y0*8);
 ctx.setLineDash([2,2]);ctx.strokeStyle='#8eeaff';ctx.lineWidth=.65;const proposed=new Set();for(const p of preview)for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const x=p.x+dx,y=p.y+dy;if(x>=0&&x<width&&y>=0&&y<height)proposed.add(y*width+x);}ctx.fillStyle='rgba(116,221,255,.07)';ctx.beginPath();for(const i of proposed){const x=i%width,y=Math.floor(i/width);ctx.fillRect(x*8,y*8,8,8);if(!proposed.has(i-width)){ctx.moveTo(x*8,y*8);ctx.lineTo(x*8+8,y*8);}if(!proposed.has(i+width)){ctx.moveTo(x*8,y*8+8);ctx.lineTo(x*8+8,y*8+8);}if(!x||!proposed.has(i-1)){ctx.moveTo(x*8,y*8);ctx.lineTo(x*8,y*8+8);}if(x===width-1||!proposed.has(i+1)){ctx.moveTo(x*8+8,y*8);ctx.lineTo(x*8+8,y*8+8);}}ctx.stroke();ctx.restore();return area;}

function drawStaticPipes(ctx,city,area,width,x0,y0,x1,y1){const height=city.height||100;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=y*width+x;if(area[i]){ctx.fillStyle=area[i]===2?'rgba(34,159,211,.28)':'rgba(149,166,174,.10)';ctx.fillRect(x*8,y*8,8,8);}ctx.strokeStyle='rgba(114,157,165,.10)';ctx.lineWidth=.25;ctx.strokeRect(x*8,y*8,8,8);if(city.civicWatered?.has(i)){ctx.strokeStyle='#6cffe1';ctx.lineWidth=.8;ctx.strokeRect(x*8-3,y*8-3,14,14);}}
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=y*width+x;if(!city.pipes[i])continue;const cx=x*8+4,cy=y*8+4;ctx.lineCap='round';for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){const nx=x+dx,ny=y+dy;if(nx<0||nx>=width||ny<0||ny>=height||!city.pipes[ny*width+nx])continue;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+dx*8,cy+dy*8);ctx.strokeStyle=city.waterField?.[i]?'#02080c':'#59636a';ctx.lineWidth=3.4;ctx.stroke();ctx.strokeStyle=city.waterField?.[i]?'#3ab9ff':'#02080c';ctx.lineWidth=1.6;ctx.stroke();}ctx.fillStyle=city.waterField?.[i]?'#9deaff':'#05090c';ctx.fillRect(cx-1.5,cy-1.5,3,3);}
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=y*width+x;if(!city.pipes[i])continue;ctx.fillStyle=city.waterField?.[i]?'#9deaff':'#05090c';ctx.fillRect(x*8+2,y*8+2,4,4);}
 for(const z of city.zones){const a=city.waterAssignments?.get(z.i);if(!a)continue;const b=waterConsumerBounds(city,z);if(b.x+b.width<x0||b.x>x1||b.y+b.height<y0||b.y>y1)continue;ctx.fillStyle=a.supplied?'rgba(68,222,180,.10)':a.code==='capacity'?'rgba(255,170,60,.25)':'rgba(190,123,101,.12)';ctx.strokeStyle=a.supplied?'#63e8bd':a.code==='capacity'?'#ffb84f':'#b88a7c';ctx.lineWidth=.75;ctx.fillRect(b.x*8,b.y*8,b.width*8,b.height*8);ctx.strokeRect(b.x*8+.4,b.y*8+.4,b.width*8-.8,b.height*8-.8);}
 drawUtilityConnectors(ctx,city,{x0,y0,x1,y1});
}

// Show the implicit pipe manifold under each utility footprint, including a
// pipe that terminates underneath it. Cached with the static underground layer.
export function drawUtilityConnectors(ctx,city,{x0=0,y0=0,x1=city.width||120,y1=city.height||100}={}){
 const width=city.width||120;let connectors=0;
 ctx.save();ctx.lineCap='round';
 for(const z of city.zones){if(![969,973,974,988,989].includes(z.id)||z.x<x0-4||z.x>x1+4||z.y<y0-4||z.y>y1+4)continue;
  const s=utilityPipeStatus(city,z),b=civicBounds(z),cx=z.x*8+4,cy=z.y*8+4,color=!s.powered?'#e78b78':!s.connected?'#b6c5cd':[969,988,989].includes(z.id)?'#7de1ff':'#ffc275';
  ctx.setLineDash([1,1]);ctx.lineWidth=1.2;ctx.strokeStyle=color;ctx.beginPath();
  for(const i of s.pipePoints){const x=i%width*8+4,y=Math.floor(i/width)*8+4;ctx.moveTo(x,y);ctx.lineTo(cx,y);ctx.lineTo(cx,cy);}ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#0b1820';ctx.fillRect(cx-3,cy-3,6,6);ctx.strokeStyle=color;ctx.lineWidth=.8;ctx.strokeRect(cx-3,cy-3,6,6);ctx.beginPath();ctx.moveTo(cx-2,cy);ctx.lineTo(cx+2,cy);ctx.moveTo(cx,cy-2);ctx.lineTo(cx,cy+2);ctx.stroke();
  ctx.globalAlpha=.5;ctx.strokeRect(b.x*8+.5,b.y*8+.5,b.width*8-1,b.height*8-1);ctx.globalAlpha=1;connectors++;
 }
 ctx.restore();return connectors;
}
