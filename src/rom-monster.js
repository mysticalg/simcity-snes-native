import {damageRomCollisionTile} from './rom-collision.js';
export function createRomMonster(){return {active:false,departing:false,x:0,y:0,targetX:0,targetY:0,offsetX:0,offsetY:0,direction:0,walk:0,frame:0,surface:0};}
export function startRomMonster(s,targetX,targetY,nextBounded){if(s.active)return false;s.x=nextBounded(100)+10;s.y=nextBounded(90)+5;s.targetX=targetX&65535;s.targetY=targetY&65535;s.active=true;s.departing=false;s.walk=0;s.offsetX=s.offsetY=0;const dy=(s.targetY-s.y)&65535,dx=(s.targetX-s.x)&65535;s.direction=dx>=dy?(s.targetX>=s.x?2:3):(s.targetY>=s.y?1:0);return true;}
// CODE_00AB92..00ACE8. All source motion/animation fields are bytes.
export function stepRomMonster(s,map,flags,nextWord,{phase=3,paused=false,onTileCross=null}={}){
 if(!s.active||(phase&7)!==3||paused)return {changed:false};let roar=false;
 if((s.walk&15)!==0||phase===3){if((s.walk&15)===0){s.walk=0;const dx=s.targetX-s.x,dy=s.targetY-s.y;s.direction=Math.abs(dy)>=Math.abs(dx)?(dy>=0?1:0):(dx>=0?3:2);roar=true;}s.frame=s.direction*8+(s.walk&3)*2;}
 s.walk=(s.walk+1)&255;const horizontal=!!(s.direction&2),coord=horizontal?'x':'y',offset=horizontal?'offsetX':'offsetY';s[offset]=(s[offset]+((s.direction&1)?1:-1))&7;let changed=false,result;
 if(s[offset]===((s.direction&1)?0:7)){s[coord]=(s[coord]+((s.direction&1)?1:-1))&255;result=damageRomCollisionTile(map,flags,s.x,s.y,nextWord);s.surface=result==='outside'?(s.x>=120?s.x:s.y):result==='terrain'||result==='water'?1:0;changed=['water','zone','debris'].includes(result);if(onTileCross?.(s.x,s.y))changed=true;}
 const target=horizontal?s.targetX:s.targetY,limit=horizontal?120:100;if(s[offset]===0&&(s[coord]>=128||s[coord]===target||s[coord]===limit)){
  if(s.departing){s.active=false;return {changed,ended:true,result,roar};}
  do{s.targetX=nextWord()%120;}while(s.targetX===s.x);do{s.targetY=nextWord()%100;}while(s.targetY===s.y);s.departing=true;s.walk=0;const dx=s.targetX-s.x,dy=s.targetY-s.y;s.direction=Math.abs(dy)>=Math.abs(dx)?(dy>=0?1:0):(dx>=0?3:2);return {changed,departed:true,result,roar};
 }
 return {changed,result,roar};
}
// CODE_039C9C records the last tied nonzero pollution cell, then halves
// its 60x50 plane coordinates. Zero pollution retains the previous target.
export function monsterPollutionTarget(pollution,previous={x:0,y:0}){let value=0,target={...previous};for(let y=0;y<50;y++)for(let x=0;x<60;x++){const p=pollution[y*2*120+x*2];if(p&&p>=value){value=p;target={x:x>>1,y:y>>1};}}return target;}
