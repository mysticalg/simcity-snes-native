import {smoothPollution} from './rom-pollution.js';
// CODE_039AD7..039BC0: overwrite half-resolution cell with population*8
// capped254, smooth three times, double/cap255. Center averages flagged
// tile coordinates without population weighting.
export function romDensityField(map,flags,populationFor,width=120,height=100){
 const w=width/2,h=height/2;let field=new Uint8Array(w*h),count=0,sumX=0,sumY=0;
 for(let i=0;i<map.length;i++){const id=map[i]&1023;if(!(flags[id]&1))continue;
  const x=i%width,y=Math.floor(i/width);field[(y>>1)*w+(x>>1)]=Math.min(254,populationFor(id,x,y)*8);count++;sumX+=x;sumY+=y;
 }
 field=smoothPollution(smoothPollution(smoothPollution(field,w,h),w,h),w,h);
 const density=Uint8Array.from(map,(_,i)=>Math.min(255,field[(Math.floor(i/width)>>1)*w+((i%width)>>1)]*2));
 return {density,centerX:count?Math.floor(sumX/count/2):30,centerY:count?Math.floor(sumY/count/2):25};
}
