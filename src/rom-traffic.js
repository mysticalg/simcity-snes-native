// CODE_0388F3, unsigned byte traffic decay.
export function decayTraffic(value){return value<24?0:value-(value>=200?34:24);}
// CODE_03B1F5 road-only +50, saturation240, half-resolution field.
export function addRouteTraffic(map,traffic,path,width=120,height=100){
 for(const {x,y} of path){const id=map[y*width+x]&1023;if(id<0x30||id>=0x60)continue;
  const left=x&~1,top=y&~1,value=Math.min(240,traffic[top*width+left]+50);
  for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)if(left+dx<width&&top+dy<height)traffic[(top+dy)*width+left+dx]=value;
 }
}
