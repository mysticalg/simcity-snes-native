// Nine controlled ROM-execution fixtures verify bitmap, counters and map
// writeback (research/reference-power.json). Natural scan timing is separate.
// CODE_03AFB0..03B0DC: row-major plant pushes, LIFO branch stack,
// first two available N/E/S/W neighbors, follow the second and revisit
// the junction. Every visit consumes capacity, including revisits.
export function traceRomPower(map,flags,width=120,height=100,{capacity,extraSeeds=[],extraCapacity=0,branchLimit=5000}={}){
 if(!Number.isSafeInteger(branchLimit)||branchLimit<0)throw Error('Invalid power branch limit');
 const power=new Uint8Array(map.length),stack=[];let generated=0,peak=0,dropped=0;
 // CODE_03B0BE caps the native stack at $1388 entries. Turbo callers may
 // supply a larger bounded stack; the original default remains unchanged.
 const push=i=>{if(stack.length<branchLimit){stack.push(i);if(stack.length>peak)peak=stack.length;return true;}dropped++;return false;};
 for(let i=0;i<map.length;i++){const id=map[i]&1023;if((flags[id]&1)&&(id===0x28c||id===0x27c)){generated+=id===0x28c?700:2000;push(i);}}
 if(extraSeeds.length){const seeded=new Set(stack);for(const seed of extraSeeds)if(!seeded.has(seed)){if(push(seed))seeded.add(seed);}}generated+=extraCapacity;
 const limit=capacity??generated;
 // CODE_03B0F8 reads scan register $0B89 (not the neighboring map word).
 // It remains the last tile scanned by CODE_038297 in this integration.
 const scanId=map[map.length-1]&1023;
 let used=0,exhausted=false;
 while(stack.length){let current=stack.pop(),direction=4;
  while(true){
   used++;if(used>limit){exhausted=true;return {power,capacity:generated,used,exhausted,branchLimit,peak,dropped};}
   if(direction===0)current-=width;else if(direction===1)current++;else if(direction===2)current+=width;else if(direction===3)current--;
   power[current]=1;const cx=current%width,cy=Math.floor(current/width);let branches=0,next=-1;
   // Same first-two N/E/S/W decision without allocating neighbor tuples
   // and a candidate array on every charged visit.
   if(scanId!==0x27c&&scanId!==0x28c){
    if(cy>0&&!power[current-width]&&(flags[map[current-width]&1023]&128)){branches++;next=0;}
    if(cx+1<width&&!power[current+1]&&(flags[map[current+1]&1023]&128)){branches++;next=1;}
    if(branches<2&&cy+1<height&&!power[current+width]&&(flags[map[current+width]&1023]&128)){branches++;next=2;}
    if(branches<2&&cx>0&&!power[current-1]&&(flags[map[current-1]&1023]&128)){branches++;next=3;}
   }
   if(!branches)break;
   if(branches===2)push(current);
   direction=next;
  }
 }
 return {power,capacity:generated,used,exhausted,branchLimit,peak,dropped};
}
