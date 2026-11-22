// CODE_03BD61 -> CODE_03A89F/03A9A7: nuclear 4x4 damage, followed
// by 200 immediate scatter attempts. Bounded random outputs are injected.
export function applyRomMeltdown(map,flags,x,y,nextBounded,width=120,height=100){
 const at=(cx,cy)=>cx>=0&&cx<width&&cy>=0&&cy<height?cy*width+cx:-1;
 const marker=at(x,y+1);if(marker>=0)map[marker]&=1023;
 // DATA_03A975 is traversed backwards by CODE_03A8F9.
 for(let dy=3;dy>=0;dy--)for(let dx=3;dx>=0;dx--){
  const i=at(x-1+dx,y-1+dy);if(i>=0&&(flags[map[i]&1023]&4))map[i]=0x7f;
 }
 let radiationWrites=0;
 for(let n=0;n<200;n++){
  const cx=(x+nextBounded(40)-20)&255,cy=(y+nextBounded(30)-15)&255,i=at(cx,cy);
  if(i<0)continue;const id=map[i]&1023,f=flags[id]||0;
  if(id!==0&&!(f&1)&&(f&4)){map[i]=0x364;radiationWrites++;}
 }
 return {attempts:200,radiationWrites};
}
// CODE_038336 -> CODE_03AA8B: one bounded 0..4000 draw per radiation tile.
export function decayRomRadiation(map,nextBounded){
 let cleared=0;
 for(let i=0;i<map.length;i++)if((map[i]&1023)===0x364&&nextBounded(4000)===0){map[i]=0;cleared++;}
 return cleared;
}
// CODE_03A7E0 scans live map in row-major order; newly ignited later
// cells can update during the same scan. Zone ignition delegates to caller.
export function updateRomFireTile(map,i,flags,coverage,nextWord,nextBounded,igniteZone,width=120,height=100){
 const x=i%width,y=Math.floor(i/width);
 for(const [dx,dy]of [[-1,0],[0,-1],[1,0],[0,1]]){if((nextWord()&7)!==0)continue;const cx=x+dx,cy=y+dy;if(cx<0||cx>=width||cy<0||cy>=height)continue;const j=cy*width+cx,id=map[j]&1023,f=flags[id]||0;if(!(f&4))continue;if(f&1)igniteZone(cx,cy,id);else map[j]=0x7f;}
 const value=Math.min(255,coverage[i]||0),maximum=value===0?10:value<20?3:value<100?2:1;
 if(nextBounded(maximum)===0)map[i]=0x28;
}
export function scanRomFire(map,flags,coverage,nextWord,nextBounded,igniteZone,width=120,height=100){let burning=0;for(let i=0;i<map.length;i++)if((map[i]&1023)===0x7f){burning++;updateRomFireTile(map,i,flags,coverage,nextWord,nextBounded,igniteZone,width,height);}return burning;}
// CODE_03BAF5/03BB30/03BB4F, using CODE_03BC9F random map coordinates.
// Coordinates are byte-packed; an x endpoint beyond the row wraps into
// the next row as the original address arithmetic does. Out-of-map RAM
// writes are guarded in this native map representation.
export function applyRomEarthquake(map,flags,nextBounded,width=120,height=100){
 const attempts=200+nextBounded(350);let fire=0,rubble=0;
 for(let n=0;n<attempts;n++){
  const x=nextBounded(width-1)&255,y=nextBounded(height-1)&255,i=y*width+x;
  if(i>=map.length)continue;const id=map[i]&1023;
  if(id<0x80||id>=0x2bc||(flags[id]&1))continue;
  if((x&3)===0){map[i]=0x7f;fire++;}else{map[i]=0x28;rubble++;}
 }
 return {attempts,fire,rubble};
}
// CODE_03BC0B..03BC8E: up to300 random shoreline samples, first
// nonzero combustible neighbor in N/E/S/W order starts tile$365.
export function startRomFlood(map,flags,nextBounded,width=120,height=100){
 for(let attempt=1;attempt<=300;attempt++){
  const x=nextBounded(width-1)&255,y=nextBounded(height-1)&255,i=y*width+x;if(i>=map.length)continue;
  const id=map[i]&1023;if(id<4||id>=20)continue;
  for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){const cx=x+dx,cy=y+dy;if(cx<0||cx>=width||cy<0||cy>=height)continue;const n=cy*width+cx,tile=map[n]&1023;if(tile!==0&&(flags[tile]&4)){map[n]=0x365;return {started:true,attempts:attempt,x:cx,y:cy,remaining:60};}}
 }
 return {started:false,attempts:300};
}
// CODE_03AD3F: shared timer decrements once per active flood tile.
// New later cells may be processed in this same row-major tile pass.
export function updateRomFloodTile(map,i,flags,remaining,nextWord,igniteZone,width=120,height=100){
 let cleared=0,spread=0;
 if(!remaining){if((nextWord()&7)===0){map[i]=0;cleared++;}return {remaining,flooded:1,cleared,spread};}
 remaining--;const x=i%width,y=Math.floor(i/width);
 for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){if((nextWord()&3)!==0)continue;const cx=x+dx,cy=y+dy;if(cx<0||cx>=width||cy<0||cy>=height)continue;const j=cy*width+cx,id=map[j]&1023;if(id===0x365)continue;if(id!==0&&!(flags[id]&4))continue;if(id!==0&&(flags[id]&1))igniteZone(cx,cy,id);else{map[j]=0x365;spread++;}}
 return {remaining,flooded:1,cleared,spread};
}
export function scanRomFlood(map,flags,remaining,nextWord,igniteZone,width=120,height=100){let flooded=0,cleared=0,spread=0;for(let i=0;i<map.length;i++)if((map[i]&1023)===0x365){const r=updateRomFloodTile(map,i,flags,remaining,nextWord,igniteZone,width,height);remaining=r.remaining;flooded+=r.flooded;cleared+=r.cleared;spread+=r.spread;}return {remaining,flooded,cleared,spread};}
// CODE_038297/0382B9/03832B/038336 dispatches from each live map
// word in row-major order. Caller handles zone centers when null is returned.
export function dispatchRomDisasterTile(map,i,flags,coverage,remaining,nextWord,nextBounded,igniteZone,width=120,height=100){
 const id=map[i]&1023;
 if(id===0x7f){updateRomFireTile(map,i,flags,coverage,nextWord,nextBounded,igniteZone,width,height);return {kind:'fire',remaining};}
 if(id===0x365)return {kind:'flood',...updateRomFloodTile(map,i,flags,remaining,nextWord,igniteZone,width,height)};
 if(id===0x364){if(nextBounded(4000)===0)map[i]=0;return {kind:'radiation',remaining};}
 return null;
}
// Manual request CODE_03BBB9 (40 tries); random disaster CODE_03BB6A
// (20 tries). CODE_03BC9F draws x then y, packing their low bytes.
export function startRomFire(map,flags,nextBounded,{randomDisaster=false,width=120,height=100}={}){
 const limit=randomDisaster?20:40;
 for(let attempts=1;attempts<=limit;attempts++){
  const x=nextBounded(119)&255,y=nextBounded(99)&255,i=y*width+x;
  if(i>=map.length)continue;
  const id=map[i]&1023,f=flags[id]||0;
  if((f&1)||(randomDisaster?id<0x88:!(f&4)))continue;
  map[i]=0x7f;return {started:true,x,y,attempts};
 }
 return {started:false,attempts:limit};
}
