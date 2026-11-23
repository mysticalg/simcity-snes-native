import {WIDE_BRUSH,SMALL_BRUSH,SHORE_TILES,FOREST_TILES,TERRAIN_MINIMAP,MAP_PREVIEW_RGB} from './rom-mapgen-data.js?v=mapgen-35';
const word=n=>n&65535;
// CODE_028B34 terrain branch and DATA_02948E, using map-select BG palette7.
const previewColors=TERRAIN_MINIMAP.map(i=>'rgb('+MAP_PREVIEW_RGB[i].join(',')+')');
export function drawRomTerrainPreview(ctx,map){for(let i=0;i<map.length;i++){ctx.fillStyle=previewColors[map[i]&1023]||previewColors[0];ctx.fillRect(i%120*2,Math.floor(i/120)*2,2,2);}}
// CODE_00824F: second ADC retains the carry from the first. A returns B.
export function nextMapgenWord(state){const a=state[0],sum=a+state[1];state[2]=a;state[0]=word(sum);state[1]=word(state[0]+a+(sum>65535?1:0));return state[1];}
// CODE_03D834 uses overlapping16-bit reads of three adjacent digit bytes.
// The previous ones cache byte is the high half of the hundreds read.
export function seedRomMap(number,previousOnes=255){
 if(!Number.isInteger(number)||number<0||number>999)throw Error('Original map number must be000..999');
 if(!Number.isInteger(previousOnes)||previousOnes<0||previousOnes>255)throw Error('Previous map cache must be a byte');
 const ones=number%10,tens=Math.floor(number/10)%10,hundreds=Math.floor(number/100);let value=ones|(tens<<8),carry=0;
 const rol=times=>{for(let n=0;n<times;n++){const old=value;value=word((value<<1)|carry);carry=old>>>15;}};
 const adc=operand=>{const sum=value+operand+carry;value=word(sum);carry=sum>65535?1:0;};
 rol(3);adc(0x5cd6);const a=value;value=(tens|(hundreds<<8))^65535;rol(5);adc(0x1238);const b=value;
 value=hundreds|(previousOnes<<8);carry=value>>>15;value=word(value<<1);adc(tens|(hundreds<<8));adc(ones|(tens<<8));const warmup=(value&31)+1,state=[a,b,0];for(let n=0;n<warmup;n++)nextMapgenWord(state);return {state,warmup};
}
export function generateRomMap(number,{previousOnes=255}={}){
 const {state,warmup}=seedRomMap(number,previousOnes),map=new Uint16Array(12000);let calls=warmup;
 const random=()=>{calls++;return nextMapgenWord(state);},bounded=maximum=>((random()&255)*(maximum+1))>>>8,minBounded=maximum=>Math.min(bounded(maximum),bounded(maximum));
 const inside=(x,y)=>x>=0&&x<120&&y>=0&&y<100,at=(x,y)=>map[y*120+x]&1023;
 let x=0,y=0,current=0,base=0;
 const move=direction=>{const n=direction&7;x=word(x+[0,1,1,1,0,-1,-1,-1][n]);y=word(y+[-1,-1,0,1,1,1,0,-1][n]);};
 // CODE_01F71D/01F794/01F7E7: x/y are the upper-left brush origin.
 const brush=small=>{const side=small?6:9,tiles=small?SMALL_BRUSH:WIDE_BRUSH;for(let dx=side-1;dx>=0;dx--)for(let dy=side-1;dy>=0;dy--){let tile=tiles[dy*side+dx];if(!tile)continue;const cx=word(x+dx),cy=word(y+dy);if(!inside(cx,cy))continue;const old=at(cx,cy);if(tile===2){if(cx===0||cy===0)tile=1;}else if(old===1||old===2)continue;map[cy*120+cx]=tile;}};
 const neighbors=[[-1,0],[0,1],[1,0],[0,-1]];
 const shore=()=>{for(let cx=119;cx>=0;cx--)for(let cy=99;cy>=0;cy--)if(at(cx,cy)===3){let mask=0;for(let n=3;n>=0;n--){const px=(cx+neighbors[n][0])&255,py=(cy+neighbors[n][1])&255;mask=(mask<<1)|Number(!inside(px,py)||at(px,py)===0);}let tile=SHORE_TILES[mask];if(tile!==1&&(random()&1))tile+=8;map[cy*120+cx]=tile;}};
 const forestEdges=()=>{for(let cx=119;cx>=0;cx--)for(let cy=99;cy>=0;cy--){const id=at(cx,cy);if(id<20||id>=38)continue;let mask=0;for(let n=3;n>=0;n--){const px=(cx+neighbors[n][0])&255,py=(cy+neighbors[n][1])&255;mask<<=1;if(inside(px,py)){const id=at(px,py);if(id>=20&&id<38)mask++;}}let tile=FOREST_TILES[mask];if(tile&&!(random()&1))tile+=9;map[cy*120+cx]=tile;}};
 const forest=()=>{let patches=bounded(100)+50;while(patches--){x=bounded(119);y=bounded(99);let steps=bounded(150)+50;while(steps--){move(random()&7);if(!inside(x,y))break;if(at(x,y)===0)map[y*120+x]=24;}}forestEdges();forestEdges();};
 const river=small=>{for(let guard=0;guard<65536;guard++){if(!inside(word(x+(small?3:4)),word(y+(small?3:4))))return;brush(small);const direction=random();if(direction&1)current=word(current+((direction&2)?-1:1));if(bounded(small?12:10)===0)current=base;move(current);}throw Error('River walk did not terminate within65536 steps');};
 const island=(random()&255)<0x56;
 if(island){
  map.fill(1);for(let cx=5;cx<115;cx++)for(let cy=5;cy<95;cy++)map[cy*120+cx]=0;
  for(let cx=0;cx<115;cx+=2){x=cx;y=minBounded(18);brush(false);y=90-minBounded(18);brush(false);y=0;brush(true);y=94;brush(true);}
  for(let cy=0;cy<95;cy+=2){y=cy;x=minBounded(18);brush(false);x=110-minBounded(18);brush(false);x=0;brush(true);x=114;brush(true);}
 }else{
  const startX=bounded(40)+40,startY=bounded(33)+33;x=startX;y=startY;base=random()&3;current=base;river(false);x=startX;y=startY;base^=4;current=base;river(false);x=startX;y=startY;base=random()&3;river(true);
  let lakes=bounded(10)+1;while(lakes--){const lakeX=bounded(99)+10,lakeY=bounded(80)+10;let blobs=bounded(12)+2;while(blobs--){x=word(lakeX+bounded(12)-6);y=word(lakeY+bounded(12)-6);brush((random()&3)===0);}}
 }
 shore();forest();return {map,number,previousOnes,kind:island?'island':'river',rng:[...state],randomCalls:calls};
}
