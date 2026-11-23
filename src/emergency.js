// Turbo footprints. Original station IDs remain 3x3 for existing/scenario cities.
export const compactEmergencyId=id=>id===977?0x249:id===978?0x252:id;
export function emergencyKind(id){id=compactEmergencyId(id);return [0x249,0x307].includes(id)?'police':[0x252,0x310].includes(id)?'fire':null;}
export function emergencyBounds(z){if(!emergencyKind(z.id))return null;const size=z.id===977||z.id===978?2:3;return {x:z.x-1,y:z.y-1,width:size,height:size};}
export function emergencyTransport(map,x,y,id,width=120,height=100){
 const b=emergencyBounds({x,y,id});if(!b)return null;
 for(let cy=b.y-1;cy<=b.y+b.height;cy++)for(let cx=b.x-1;cx<=b.x+b.width;cx++){
  if(cx<0||cx>=width||cy<0||cy>=height)continue;
  if(!((cx>=b.x&&cx<b.x+b.width&&(cy===b.y-1||cy===b.y+b.height))||(cy>=b.y&&cy<b.y+b.height&&(cx===b.x-1||cx===b.x+b.width))))continue;
  const tile=map[cy*width+cx]&1023;if(tile>=0x30&&tile<0x80&&!(tile>=0x60&&tile<0x6d))return {x:cx,y:cy};
 }
 return null;
}
const spriteCache=new WeakMap();
export function compactEmergencySprite(city,id,atlas){
 if(!atlas||![977,978].includes(id))return null;
 let sprites=spriteCache.get(atlas);if(!sprites){sprites=new Map();spriteCache.set(atlas,sprites);}if(sprites.has(id))return sprites.get(id);
 const native=city.build.nativeEmergencyBuildings?.[id===977?8:9];if(!native)return null;
 const source=document.createElement('canvas');source.width=source.height=24;const ctx=source.getContext('2d');
 for(let n=0;n<native.tiles.length;n++){const tile=native.tiles[n];ctx.drawImage(atlas,tile%32*8,(tile>>5)*8,8,8,native.x[n]*8,native.y[n]*8,8,8);}
 const sprite=document.createElement('canvas');sprite.width=sprite.height=16;const target=sprite.getContext('2d');target.imageSmoothingEnabled=false;target.drawImage(source,0,0,16,16);sprites.set(id,sprite);return sprite;
}
