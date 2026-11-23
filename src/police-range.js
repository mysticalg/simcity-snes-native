import {expandRomServicePlane} from './rom-services.js?v=processing-1';
// Turbo extension: stretch the ROM's three-pass police service kernel to twice
// its radius on both axes. Keep the source center strength, rather than dilute
// the same service budget over four times the area. Fire remains ROM-derived.
let kernel=new Map([['0,0',1]]);
for(let pass=0;pass<3;pass++){const next=new Map();for(const [key,v] of kernel){const [x,y]=key.split(',').map(Number);for(const [dx,dy,n] of [[0,0,4],[1,0,1],[-1,0,1],[0,1,1],[0,-1,1]]){const k=(x+dx)+','+(y+dy);next.set(k,(next.get(k)||0)+v*n);}}kernel=next;}
const weights=[];
for(let y=-7;y<=7;y++)for(let x=-7;x<=7;x++){const x0=Math.floor(x/2),y0=Math.floor(y/2),fx=x-2*x0,fy=y-2*y0;let n=0;for(let dy=0;dy<=1;dy++)for(let dx=0;dx<=1;dx++)n+=(kernel.get((x0+dx)+','+(y0+dy))||0)*(dx?fx:2-fx)*(dy?fy:2-fy);if(n)weights.push([x,y,n]);}
export function expandServiceCoverage(raw,kind,width=120,height=100){
 if(kind!=='police')return expandRomServicePlane(raw,kind,width,height);
 const w=Math.ceil(width/8),h=Math.ceil(height/8),sum=new Float64Array(w*h);
 for(let i=0;i<raw.length;i++){if(!raw[i])continue;const sx=i%w,sy=Math.floor(i/w);for(const [dx,dy,n] of weights){const x=sx+dx,y=sy+dy;if(x>=0&&x<w&&y>=0&&y<h)sum[y*w+x]+=raw[i]*n;}}
 const coarse=Uint16Array.from(sum,n=>Math.min(65535,Math.floor(n/2048)));
 return Uint16Array.from({length:width*height},(_,i)=>coarse[(Math.floor(i/width)>>3)*w+((i%width)>>3)]);
}
