import {moveRomTornado} from './rom-tornado.js?v=emergency-1';
export function createRomPlane(){return {active:false,x:0,y:0,offsetX:0,offsetY:0,direction:0,targetX:0,targetY:0,targetDirection:0,turn:0,turnPhase:0,taxi:0,frame:0,crashRequested:false};}
const SPRITE=[1,2,0,2,1,2,0,2,3,4,5],TURN=[0,1,1,1,1,-1,-1,-1];
export function spawnRomPlane(s,x,y){if(s.active)return false;s.active=true;s.taxi++;s.direction=6;s.targetX=(x-1)&65535;s.x=(x+2)&65535;s.offsetX=0;s.y=y;s.targetY=y;return true;}
function chooseTarget(s,nextWord,width,height){s.direction&=255;do{s.targetX=(nextWord()&255)%width;}while(s.targetX===s.x);do{s.targetY=(nextWord()&255)%height;}while(s.targetY===s.y);const direction=s.targetX>=s.x?(s.targetY>=s.y?3:1):(s.targetY>=s.y?5:7);if(direction!==s.direction){s.targetDirection=direction;s.turn=TURN[(direction-s.direction)&7];}}
// CODE_00B502 and CODE_00B683. Called on the original phase0/4/8/12/16/20.
export function stepRomPlane(s,map,nextWord,{phase=0,mapView=false,paused=false,crashRequested=s.crashRequested,disastersEnabled=true,other=null,width=120,height=100}={}){
 if(!s.active||(phase&3)!==0)return {};
 if(!mapView&&crashRequested){if(paused)return {};s.crashRequested=false;if(disastersEnabled){s.active=false;return {crashed:true};}}
 if(mapView){s.frame=SPRITE[s.direction&255]??s.frame;return {};}
 if(other?.active&&s.x===other.x&&s.y===other.y){s.active=false;other.active=false;return {crashed:true,other:true};}
 if(s.taxi){let engine=false;if(s.direction===2){s.offsetX=(s.offsetX+1)&7;if(!s.offsetX){s.x=(s.x+1)&65535;if(((s.x-s.targetX)&65535)>=4){s.direction=6;engine=true;}}}else{s.offsetX=(s.offsetX-1)&7;if(s.offsetX===7){s.x=(s.x-1)&65535;if(s.x===s.targetX){s.taxi=0;s.direction=0x8006;}}}const distance=(s.x-s.targetX)&65535;s.frame=SPRITE[distance<1?8:distance<3?9:10];return {engine};}
 if(s.turn){s.turnPhase=(s.turnPhase+1)&1;if(!s.turnPhase){s.direction=(s.direction+s.turn)&7;if(s.direction===s.targetDirection)s.turn=0;s.frame=SPRITE[s.direction];}return {};}
 if(s.direction&0x8000){chooseTarget(s,nextWord,width,height);return {};}
 if(!moveRomTornado(s,width,height)){s.direction|=0x8000;return {};}
 s.frame=SPRITE[s.direction];const id=s.x>=0&&s.x<width&&s.y>=0&&s.y<height?map[s.y*width+s.x]:0;if(id===0x297&&s.direction>0&&s.direction<4){s.taxi++;s.direction=2;s.targetX=(s.x+1)&65535;s.targetY=s.y;}
 return {};
}
