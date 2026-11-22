// CODE_03A89F..03AA89. Airport's third row has the ROM's unusual $01B8 offset.
const AIRPORT=[0,2,4,6,8,10,240,242,244,246,248,250,440,442,444,446,448,450,720,722,724,726,728,730,960,962,964,966,968,970,1200,1202,1204,1206,1208,1210];
export function burnRomZone(map,index,flags){
 const id=map[index]&1023,airport=id===0x2a5,large=id===0x36b||(id>=0x257&&id<0x297);
 const marker=index+121;if(marker<map.length)map[marker]&=1023;
 const offsets=airport?AIRPORT:Array.from({length:large?16:9},(_,i)=>Math.floor(i/(large?4:3))*240+(i%(large?4:3))*2);
 const start=index-(airport?242:121);
 for(let n=offsets.length-1;n>=0;n--){const i=start+offsets[n]/2;if(i>=0&&i<map.length&&(flags[map[i]&1023]&4))map[i]=0x7f;}
}
export function damageRomCollisionTile(map,flags,x,y,nextMenuWord){
 // Source inputs are packed bytes; point bounds are checked before accessing WRAM.
 x&=255;y&=255;if(x>=120||y>=100)return 'outside';
 const i=y*120+x,id=map[i]&1023,f=flags[id]||0;
 if(id<20)return id===0?'empty':'terrain';
 if(f&8){map[i]=3;return 'water';}
 if(!(f&4))return 'unchanged';
 if(f&1){burnRomZone(map,i,flags);return 'zone';}
 map[i]=(nextMenuWord()&3)===0?0x7f:0x28;return 'debris';
}
// CODE_00BA54 / CODE_00AE2E: center, then four diagonal neighbors.
export function applyRomShipCollision(map,flags,x,y,nextMenuWord){
 const points=[[0,0],[-1,-1],[1,-1],[-1,1],[1,1]];
 return points.map(([dx,dy])=>damageRomCollisionTile(map,flags,x+dx,y+dy,nextMenuWord));
}
