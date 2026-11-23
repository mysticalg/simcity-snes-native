import {damageRomCollisionTile,applyRomShipCollision} from './rom-collision.js?v=emergency-1';
const VELOCITY=[0,2,3,3,3,3,3,2,0,-2,-3,-3,-3,-3,-3,-2,-3,-3,-3,-2,0,2,3,3,3,3,3,2,0,-2,-3,-3];
const START_X=[0,-76,-114,-126,-126,-126,-114,-76,0,76,114,126,126,126,114,76];
const START_Y=[114,114,114,84,0,-84,-114,-114,-114,-114,-114,-84,0,84,114,114];
const SWIRL=[[0, 1], [0, 1], [1, 0], [0, 1], [0, 1], [1, 0], [0, 1], [1, 0], [1, 0], [0, 1], [1, 0], [1, 0], [0, -1], [1, 0], [1, 0], [0, -1], [1, 0], [0, -1], [0, -1], [1, 0], [0, -1], [0, -1], [-1, 0], [0, -1], [0, -1], [-1, 0], [0, -1], [-1, 0], [-1, 0], [0, -1], [-1, 0], [-1, 0], [0, 1], [-1, 0], [-1, 0], [0, 1], [-1, 0], [0, 1], [0, 1], [-1, 0]];
const RINGS=[ [[0,-1],[-1,0],[1,0],[0,1]], [[0,-2],[-2,0],[2,0],[0,2]], [[1,-2],[2,-1],[2,1],[1,2]], [[-1,-2],[-2,-1],[-2,1],[-1,2]] ];
const word=n=>n&65535,low=(old,n)=>(old&0xff00)|(n&255);
export function createRomUfo(){return {activeWord:0,request:0,mode:0,counter:0,targetY:0,targetX:0,pixelY:0,pixelX:0,direction:0,visible:0,flags:0,focusFrames:0,x:0,y:0,offsetX:0,offsetY:0,frame:0};}
function position(s){s.offsetY=s.pixelY&7;s.offsetX=s.pixelX&7;s.y=(s.pixelY>>>3)&255;s.x=(s.pixelX>>>3)&255;}
// CODE_00C3F9..00C798. Shared camera/news countdown is supplied in state;
// this routine does not tick it. All low-byte stores preserve the high byte.
export function stepRomUfo(s,map,flags,next,{gameMode=6,blocked=false,cameraX=0,cameraY=0,width=120,height=100}={}){
 if(gameMode!==6||!s.request||!s.activeWord||blocked)return {};
 const event={};
 const move=direction=>{s.pixelX=word(s.pixelX+VELOCITY[direction]);s.pixelY=word(s.pixelY+VELOCITY[direction+16]);position(s);};
 const swirl=()=>{const v=SWIRL[s.counter&255];if(!v)throw Error('Unsupported UFO swirl counter');s.pixelY=low(s.pixelY,s.pixelY+v[0]);s.pixelX=low(s.pixelX,s.pixelX+v[1]);position(s);const n=((s.counter&255)+1)&255;if(n<40)s.counter=low(s.counter,n);return n>=40;};
 const damage=points=>{event.damage=points.map(([dx,dy])=>damageRomCollisionTile(map,flags,s.targetX+dx,s.targetY+dy,next,width,height));};
 switch(s.mode){
 case 0:s.visible=0;s.activeWord=low(s.activeWord,s.flags);s.flags=low(s.flags,s.flags|4);s.focusFrames=low(s.focusFrames,255);event.focus={x:s.targetX&255,y:s.targetY&255};s.mode=low(s.mode,s.mode+1);s.pixelY=1792;break;
 case 1:if(!(s.focusFrames&255)){s.flags=low(s.flags,s.activeWord);s.activeWord&=0xff00;s.mode=low(s.mode,s.mode+1);let d=next()&15;if(d===3||d===9)d++;s.direction=d;s.pixelX=word(s.targetX*8+START_X[d]);s.pixelY=word(s.targetY*8+START_Y[d]);}break;
 case 2:s.visible=65535;move((s.direction*2&255)>>1);if((s.y&255)===(s.targetY&255)&&(s.x&255)===(s.targetX&255)){s.mode=low(s.mode,s.mode+1);s.counter&=0xff00;event.sound=28;}break;
 case 3:if(swirl()){s.mode=low(s.mode,s.mode+1);s.counter&=0xff00;event.damage=applyRomShipCollision(map,flags,s.targetX,s.targetY,next,width,height);}break;
 case 4:case 5:case 6:if(swirl()){const ring=s.mode-4;s.mode=low(s.mode,s.mode+1);s.counter&=0xff00;damage(RINGS[ring]);}break;
 case 7:if(swirl()){s.mode=low(s.mode,s.mode+1);s.counter=low(s.counter,48);damage(RINGS[3]);}else if((s.counter&255)===35){const d=next()&15;s.direction=low(s.direction,((d+8)&15)===(s.direction&255)?(d+8)&15:d);}break;
 case 8:s.counter=low(s.counter,s.counter-1);if(!(s.counter&255)){s.activeWord=0;s.visible=0;break;}move((s.direction+8)&15);{const y=((s.y&255)-cameraY)&255,x=((s.x&255)-cameraX)&255;if((y>=32&&y<253)||(x>=34&&x<252)){s.activeWord=0;s.visible=0;}}break;
 default:throw Error('Unsupported UFO phase '+s.mode);
 }
 if(s.activeWord&&s.visible){if(s.mode>=2)s.activeWord=low(s.activeWord,s.activeWord+1);s.frame=((s.activeWord&12)>>2)+(s.mode>=3&&s.mode<8?4:0);}
 return event;
}
// CODE_03BCB8..03BD4F visits nine prescribed sites the first time and
// three random sites thereafter. Later random coordinates are chosen only
// when the prior visit finishes, preserving simulation-RNG call order.
const FIRST_X=[34,50,30,36,45,68,30,30,30],FIRST_Y=[30,34,40,46,50,30,50,62,70];
export function startRomUfoVisit(s,index,nextBounded,repeat=false,width=120,height=100){
 s.request=0x8000;s.activeWord=0x8000;s.mode=0;
 if(repeat){s.targetX=nextBounded(width-40)+20;s.targetY=nextBounded(height-40)+20;}
 else{s.targetX=Math.floor(FIRST_X[index]*width/120);s.targetY=Math.floor(FIRST_Y[index]*height/100);}
}
