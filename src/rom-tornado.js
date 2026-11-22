import {damageRomCollisionTile} from './rom-collision.js';
export function createRomTornado(){return {active:false,initializing:false,x:0,y:0,targetX:0,targetY:0,offsetX:0,offsetY:0,direction:0,frame:0,surface:0};}
// CODE_03B9DB deliberately uses alternating100/90 bounds in this order.
export function startRomTornado(state,nextBounded){
 if(state.active)return false;
 state.x=nextBounded(100)+10;state.targetX=nextBounded(90)+5;state.targetY=nextBounded(100)+10;state.y=nextBounded(90)+5;
 state.active=true;state.initializing=true;state.offsetX=0;state.offsetY=0;return true;
}
// CODE_00AEDB..00AFAF, one pixel along each active axis. Direction can
// change between the horizontal and vertical halves of the same call.
export function moveRomTornado(state){
 const s=state;
 if(s.direction!==0&&s.direction!==4){
  let moved=false;
  if(s.direction<4){s.offsetX=(s.offsetX+1)&7;if(!s.offsetX){if(s.x>=119)return false;s.x++;moved=true;}}
  else{s.offsetX=(s.offsetX-1)&7;if(s.offsetX===7){if(!s.x)return false;s.x--;moved=true;}}
  if(moved&&s.x===s.targetX){if(s.direction===2||s.direction===6)return false;s.direction=s.direction<2||s.direction>=6?0:4;}
 }
 if(s.direction!==2&&s.direction!==6){
  let moved=false;
  if(s.direction>2&&s.direction<6){s.offsetY=(s.offsetY+1)&7;if(!s.offsetY){if(s.y>=99)return false;s.y++;moved=true;}}
  else{s.offsetY=(s.offsetY-1)&7;if(s.offsetY===7){if(!s.y)return false;s.y--;moved=true;}}
  if(moved&&s.y===s.targetY){if(s.direction===0||s.direction===4)return false;s.direction=s.direction<4?2:6;}
 }
 return true;
}
// CODE_00B0C1, called on global phase7/8. Pause stops both animation
// and motion; spawn initialization consumes one eligible call before damage.
export function stepRomTornado(state,map,flags,nextMenuWord,{paused=false}={}){
 const s=state;if(!s.active||paused)return {changed:false};s.frame=(s.frame+1)&3;
 if(s.initializing){s.direction=s.targetX>=s.x?(s.targetY>=s.y?3:1):(s.targetY>=s.y?5:7);s.offsetX=0;s.offsetY=0;s.initializing=false;return {changed:false,initialized:true};}
 if(!moveRomTornado(s)){s.active=false;return {changed:false,ended:true};}
 const result=damageRomCollisionTile(map,flags,s.x,s.y,nextMenuWord);s.surface=result==='terrain'||result==='water'?1:0;return {changed:['water','zone','debris'].includes(result),result};
}
