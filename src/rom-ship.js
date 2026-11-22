// CODE_03ABDA / CODE_03AC5B..03AD3D, USA v1.0.
// Keep accumulator inputs to CODE_039035: first call receives inactive flag 0;
// later calls receive the preceding masked draw or exhausted scan coordinate.
export function spawnRomShip(ship,map,boundedRandom){
 if(ship.active)return false;
 let accumulator=0;
 const edges=[{x:4,y:0,index:4,step:1,axis:'x',end:118,direction:4},
  {x:0,y:4,index:4,step:120,axis:'y',end:98,direction:2},
  {x:4,y:99,index:11884,step:1,axis:'x',end:118,direction:0},
  {x:119,y:4,index:599,step:120,axis:'y',end:98,direction:6}];
 for(const edge of edges){
  accumulator=boundedRandom(accumulator)&3;
  if(accumulator)continue;
  let {x,y,index}=edge;
  while(true){
   if((map[index]&1023)===2){Object.assign(ship,{active:true,x,y,direction:edge.direction,hornCountdown:100,initializing:true});return true;}
   index+=edge.step;if(edge.axis==='x')x++;else y++;
   accumulator=edge.axis==='x'?x:y;
   if(accumulator===edge.end)break;
  }
 }
 return false;
}
