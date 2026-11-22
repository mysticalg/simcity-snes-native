// CODE_039C39/039CDF/039DCA: 60x50 cells, each covers four map
// tiles. A nonzero tile >=$30 enables a land-value sample; empty cells
// are zeroed and excluded from $0C03's integer mean.
export function aggregateRomLandValue(map,values,width=120,height=100){
 let sum=0,count=0;
 for(let y=0;y<height;y+=2)for(let x=0;x<width;x+=2){
  let developed=false;
  for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)if(x+dx<width&&y+dy<height&&(map[(y+dy)*width+x+dx]&1023)>=0x30)developed=true;
  const value=developed?Math.max(1,Math.min(250,values[y*width+x])):0;
  for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)if(x+dx<width&&y+dy<height)values[(y+dy)*width+x+dx]=value;
  if(developed){sum+=value;count++;}
 }
 return count?Math.floor(sum/count):0;
}

// CODE_039E61 Manhattan distance capped32. CODE_039D50..039DAD:
// (34-distance)*4 + terrain - pollution - (crime>=190 ? 20 : 0).
export function romLandValue(x,y,centerX,centerY,terrain,pollution,crime){
 const distance=Math.min(32,Math.abs(x-centerX)+Math.abs(y-centerY));
 return Math.max(1,Math.min(250,(34-distance)*4+terrain-pollution-(crime>=190?20:0)));
}
// CODE_039DCA terrain accumulation into 30x25 plane, then CODE_039FA6
// neighbor quarter plus self, halved. Byte additions wrap as in source.
export function romTerrainField(map,width=120,height=100){
 const w=width/4,h=height/4,raw=new Uint8Array(w*h),smoothed=new Uint8Array(w*h);
 for(let y=0;y<height;y+=2)for(let x=0;x<width;x+=2){
  let value=0;
  for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
   const id=map[(y+dy)*width+x+dx]&1023;
   if(id>0&&id<0x28)value+=15;
   else if(id>=0x2bf&&id<0x354&&id!==0x307&&id!==0x310)value=255;
  }
  const i=Math.floor(y/4)*w+Math.floor(x/4);raw[i]=(raw[i]+Math.min(255,value))&255;
 }
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x;let neighbors=0;if(x)neighbors+=raw[i-1];if(x+1<w)neighbors+=raw[i+1];if(y)neighbors+=raw[i-w];if(y+1<h)neighbors+=raw[i+w];
  smoothed[i]=((neighbors>>>2)+raw[i])>>>1;
 }
 return Uint8Array.from(map,(_,i)=>smoothed[Math.floor(i/width/4)*w+Math.floor(i%width/4)]);
}
