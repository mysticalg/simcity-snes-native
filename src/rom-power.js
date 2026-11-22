// Nine controlled ROM-execution fixtures verify bitmap, counters and map
// writeback (research/reference-power.json). Natural scan timing is separate.
// CODE_03AFB0..03B0DC: row-major plant pushes, LIFO branch stack,
// first two available N/E/S/W neighbors, follow the second and revisit
// the junction. Every visit consumes capacity, including revisits.
export function traceRomPower(map,flags,width=120,height=100,{capacity,extraSeeds=[],extraCapacity=0}={}){
 const power=new Uint8Array(map.length),stack=[];let generated=0;
 for(let i=0;i<map.length;i++){const id=map[i]&1023;if((flags[id]&1)&&(id===0x28c||id===0x27c)){generated+=id===0x28c?700:2000;if(stack.length<5000)stack.push(i);}}
 for(const seed of extraSeeds)if(!stack.includes(seed))stack.push(seed);generated+=extraCapacity;
 const limit=capacity??generated;
 // CODE_03B0F8 reads scan register $0B89 (not the neighboring map word).
 // It remains the last tile scanned by CODE_038297 in this integration.
 const scanId=map[map.length-1]&1023;
 let used=0,exhausted=false;
 while(stack.length){let current=stack.pop(),direction=4;
  while(true){
   used++;if(used>limit){exhausted=true;return {power,capacity:generated,used,exhausted};}
   if(direction===0)current-=width;else if(direction===1)current++;else if(direction===2)current+=width;else if(direction===3)current--;
   power[current]=1;const cx=current%width,cy=Math.floor(current/width),candidates=[];
   if(scanId!==0x27c&&scanId!==0x28c){for(const [dir,n,valid]of [[0,current-width,cy>0],[1,current+1,cx+1<width],[2,current+width,cy+1<height],[3,current-1,cx>0]]){if(valid&&!power[n]&&(flags[map[n]&1023]&0x80)){candidates.push(dir);if(candidates.length===2)break;}}}
   if(!candidates.length)break;
   if(candidates.length===2&&stack.length<5000)stack.push(current);
   direction=candidates.at(-1);
  }
 }
 return {power,capacity:generated,used,exhausted};
}
