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
