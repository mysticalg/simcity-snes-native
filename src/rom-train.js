// CODE_03A78B spawn, CODE_00B1AB/00B260..00B4E2 movement.
export function createRomTrain(){return {active:false,x:0,y:0,dx:0,dy:0,reversed:false,hidden:false,frame:0};}
export function spawnRomTrain(train,id,x,y,quakeFrames=0){if(train.active||quakeFrames||!([0x72,0x73].includes(id)))return false;train.active=true;train.x=x*8+4;train.y=y*8+4;train.dx=id===0x72?1:0;train.dy=id===0x73?1:0;return true;}
const JUNCTION=[0,0,0,1,1,3,0,3,0,1,0,0,1,2,0,2,1,3,1,2,0,0,2,3,0,3,0,2,2,3,0,0];
const rail=id=>(id>=0x6d&&id<0x7f&&id!==0x6f)||(id>=0x34b&&id<0x354);
const tunnel=id=>id===0x70||id===0x71||(id>=0x34b&&id<0x354);
function reverse(train){if(train.reversed){train.active=false;train.reversed=false;}else{train.dx=-train.dx||0;train.dy=-train.dy||0;train.reversed=true;}}
export function stepRomTrain(train,map,nextMenuWord,width=120,height=100){
 if(!train.active)return;
 if(train.dy)train.y=(train.y+train.dy)&65535;else train.x=(train.x+train.dx)&65535;
 if(((train.dy?train.y:train.x)&7)!==4){train.frame=train.dx?0:1;return;}
 const at=(x,y)=>x>=0&&x<width&&y>=0&&y<height?map[y*width+x]&1023:0;
 const x=train.x>>>3,y=train.y>>>3,id=at(x,y);train.hidden=tunnel(id);
 if(!rail(id)){reverse(train);return;}
 if(id>=0x74&&id<0x78){train.reversed=false;const {dx,dy}=train;if(id&1){train.dx=-dy||0;train.dy=-dx||0;train.frame=3;}else{train.dx=dy;train.dy=dx;train.frame=2;}return;}
 if(id===0x7c){train.reversed=false;const draw=nextMenuWord()&3;if(draw===0||draw===3)return;if(train.dy){train.dx=train.dy*(draw===1?1:-1);train.dy=0;train.frame=draw===1?2:3;}else{train.dy=train.dx*(draw===1?1:-1);train.dx=0;train.frame=draw===1?3:2;}return;}
 if(id>=0x78&&id<0x7c){
  train.reversed=false;const direction=train.dy<0?0:train.dy>0?2:train.dx<0?3:1;
  const choice=JUNCTION[(id-0x78)*8+direction*2+(nextMenuWord()&1)],oldX=train.dx,oldY=train.dy;
  train.dx=[0,1,0,-1][choice];train.dy=[-1,0,1,0][choice];
  train.frame=choice===0?(oldY===-1?1:oldX<0?2:3):choice===1?(oldX===1?0:oldY<0?3:2):choice===2?(oldY===1?1:oldX<0?3:2):(oldX===-1?0:oldY<0?2:3);return;
 }
 const ahead=at(x+train.dx,y+train.dy);if(!rail(ahead)){reverse(train);return;}if(ahead>=0x34b&&ahead<0x354)train.hidden=true;train.reversed=false;
}
