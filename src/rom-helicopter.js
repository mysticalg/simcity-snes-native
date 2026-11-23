import {moveRomTornado} from './rom-tornado.js?v=emergency-1';
const TURN=[0,1,1,1,1,-1,-1,-1];
export function createRomHelicopter(){return {active:false,x:0,y:0,offsetX:0,offsetY:0,direction:0,targetX:0,targetY:0,targetDirection:0,turn:0,rotor:0};}
// CODE_03AC32: airport scanner coordinates are incremented in both axes.
// The original does not reset offsets, rotor phase or a pending turn here.
export function spawnRomHelicopter(s,x,y){if(s.active)return false;s.active=true;s.direction=0x8000;s.x=s.targetX=(x+1)&65535;s.y=s.targetY=(y+1)&65535;return true;}
function target(s,next,width,height){s.direction&=255;do{s.targetX=(next()&255)%width;}while(s.targetX===(s.x&255));do{s.targetY=(next()&255)%height;}while(s.targetY===(s.y&255));const d=s.targetX>=(s.x&255)?(s.targetY>=(s.y&255)?3:1):(s.targetY>=(s.y&255)?5:7);if(d!==s.direction){s.targetDirection=(s.targetDirection&0xff00)|d;s.turn=TURN[(d-s.direction)&7];}}
// CODE_00AE83..00B0B8. Like the original, the worker is not pause-gated.
// Caller supplies the shared news timers; no RNG is consumed by blocked news.
export function stepRomHelicopter(s,map,next,{phase=0,mapView=false,newsBusy=false,width=120,height=100}={}){
 if(!s.active||mapView)return {};
 if((phase&3)===0)s.rotor=(s.rotor+2)&65535;
 if((phase&7)!==5)return {};
 if(s.turn){const d=((s.direction&255)+s.turn)&7;s.direction=(s.direction&0xff00)|d;if(d===(s.targetDirection&255))s.turn=0;return {};}
 if(s.direction&0x8000){target(s,next,width,height);return {};}
 if(!moveRomTornado(s,width,height)){s.direction|=0x8000;return {};}
 if(((s.direction&7)===2?s.offsetX:s.offsetY)!==0)return {};
 const id=(map[s.y*width+s.x]||0)&1023;
 if(id>=0x50&&id<0x60&&!newsBusy&&(next()&7)===0)return {trafficReport:true,x:s.x,y:s.y,focusFrames:192,message:28,messageFrames:300};
 return {};
}
