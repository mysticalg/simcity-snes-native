// CODE_03BD61 -> CODE_03A89F/03A9A7: nuclear 4x4 damage, followed
// by 200 immediate scatter attempts. Bounded random outputs are injected.
export function applyRomMeltdown(map,flags,x,y,nextBounded,width=120,height=100){
 const at=(cx,cy)=>cx>=0&&cx<width&&cy>=0&&cy<height?cy*width+cx:-1;
 const marker=at(x,y+1);if(marker>=0)map[marker]&=1023;
 // DATA_03A975 is traversed backwards by CODE_03A8F9.
 for(let dy=3;dy>=0;dy--)for(let dx=3;dx>=0;dx--){
  const i=at(x-1+dx,y-1+dy);if(i>=0&&(flags[map[i]&1023]&4))map[i]=0x7f;
 }
 let radiationWrites=0;
 for(let n=0;n<200;n++){
  const cx=(x+nextBounded(40)-20)&255,cy=(y+nextBounded(30)-15)&255,i=at(cx,cy);
  if(i<0)continue;const id=map[i]&1023,f=flags[id]||0;
  if(id!==0&&!(f&1)&&(f&4)){map[i]=0x364;radiationWrites++;}
 }
 return {attempts:200,radiationWrites};
}
