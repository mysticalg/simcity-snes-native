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

// CODE_00B86D..00B9EC. Directions are clockwise, north=0.
const OFFSETS=[-120,-119,1,121,120,119,-1,-121];
const OPEN=new Set([2,0x354,0x355]);
const STRAIGHT=new Set([...OPEN,0x60,0x61,0x70,0x71]);
const TURN=[0,1,1,1,1,-1,-1,-1];
export function navigateRomShip(ship,map,nextMenuWord){
 const origin=ship.y*120+ship.x,opposite=(ship.direction+4)&7;
 // The ROM checks the wrapped linear byte offset, not separate x/y bounds.
 const at=(direction,distance=1)=>{const index=(origin+OFFSETS[direction]*distance)&32767;return index<12000?map[index]&1023:-1;};
 let fallback=-1,straightBridge=false;
 const lookahead=direction=>STRAIGHT.has(at(direction,2))||at(direction,2)===3;
 const choose=direction=>{ship.turnPhase=0;ship.targetDirection=direction;ship.turn=TURN[(direction-ship.direction)&7];return 'route';};
 const tryTurn=direction=>{
  const id=at(direction);
  if(OPEN.has(id))return true;
  if(id===3&&fallback<0&&lookahead(direction))fallback=direction;
  return false;
 };
 const start=nextMenuWord()&7;
 for(let n=0;n<8;n++){
  const direction=(start+n)&7;if(direction===opposite)continue;
  if(direction===ship.direction){const id=at(direction);if(STRAIGHT.has(id))return 'straight';if(id===3&&lookahead(direction))straightBridge=true;}
  else if(tryTurn(direction))return choose(direction);
 }
 if(straightBridge)return 'straight';
 if(fallback>=0){if(fallback===ship.direction)return 'straight';return choose(fallback);}
 if(tryTurn(opposite)||fallback>=0)return choose(opposite);
 const initializing=ship.initializing;ship.active=false;
 return initializing?'despawn':'collision';
}
