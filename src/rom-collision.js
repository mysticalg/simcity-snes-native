import {emergencyBounds} from './emergency.js?v=emergency-1';
// CODE_03A89F..03AA89. Airport's third row has the ROM's unusual $01B8 offset.
const AIRPORT=[0,2,4,6,8,10,240,242,244,246,248,250,440,442,444,446,448,450,720,722,724,726,728,730,960,962,964,966,968,970,1200,1202,1204,1206,1208,1210];
export function burnRomZone(map,index,flags,width=120,height=100){
 const rawId=map[index]&1023;if(rawId===977||rawId===978){const b=emergencyBounds({x:index%width,y:Math.floor(index/width),id:rawId});for(let y=b.y;y<b.y+b.height;y++)for(let x=b.x;x<b.x+b.width;x++)if(x>=0&&x<width&&y>=0&&y<height)map[y*width+x]=0x7f;return;}
 const id=rawId,airport=id===0x2a5,large=id===0x36b||(id>=0x257&&id<0x297);
 const marker=index+width+1;if(marker<map.length)map[marker]&=1023;
 const offsets=airport?AIRPORT.map((n,j)=>n+(Math.floor(j/6)*(width-120)*2)):Array.from({length:large?16:9},(_,i)=>Math.floor(i/(large?4:3))*(width*2)+(i%(large?4:3))*2);
 const start=index-(airport?(width+1)*2:width+1);
 for(let n=offsets.length-1;n>=0;n--){const i=start+offsets[n]/2;if(i>=0&&i<map.length&&(flags[map[i]&1023]&4))map[i]=0x7f;}
}
export function damageRomCollisionTile(map,flags,x,y,nextMenuWord,width=120,height=100){
 // Source inputs are packed bytes; point bounds are checked before accessing WRAM.
 x&=255;y&=255;if(x>=width||y>=height)return 'outside';
 const i=y*width+x,id=map[i]&1023,f=flags[id]||0;
 if(id<20)return id===0?'empty':'terrain';
 if(f&8){map[i]=3;return 'water';}
 if(!(f&4))return 'unchanged';
 if(f&1){burnRomZone(map,i,flags,width,height);return 'zone';}
 map[i]=(nextMenuWord()&3)===0?0x7f:0x28;return 'debris';
}
// CODE_00BA54 / CODE_00AE2E: center, then four diagonal neighbors.
export function applyRomShipCollision(map,flags,x,y,nextMenuWord,width=120,height=100){
 const points=[[0,0],[-1,-1],[1,-1],[-1,1],[1,1]];
 return points.map(([dx,dy])=>damageRomCollisionTile(map,flags,x+dx,y+dy,nextMenuWord,width,height));
}

// CODE_00ADEE -> CODE_00AE2E: Monster already damaged the center.
export function applyRomTrainCollision(map,flags,x,y,nextMenuWord,width=120,height=100){return [[-1,-1],[1,-1],[-1,1],[1,1]].map(([dx,dy])=>damageRomCollisionTile(map,flags,x+dx,y+dy,nextMenuWord,width,height));}
