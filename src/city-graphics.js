// CODE_008707/008732: increment the 24-slot counter before dispatch.
// CODE_008775/7A8/7DD/81C: four independently uploaded VRAM ranges.
export function cityAnimationState(){return {phase:0,water:0,waterFrame:0,waterTail:0,six:0,sixFrame:0,four:0,fourFrame:0};}
export function advanceCityAnimation(s,frames=1,blocked=false){
 for(let i=0;i<frames;i++){
  s.phase=(s.phase+1)%24;if(blocked)continue;
  if(s.phase===0||s.phase===12)s.waterFrame=s.water&3;
  if(s.phase===1||s.phase===13){s.waterTail=s.water&3;s.water=(s.water+1)&65535;}
  if(s.phase===4){s.sixFrame=s.six;s.six=(s.six+1)%6;}
  if(s.phase===5){s.fourFrame=s.four&3;s.four=(s.four+1)&65535;}
 }
 return s;
}
export function cityAnimationTransfers(s){return [
 {destination:0x6c00,source:[0,0x1400,0x2800,0x3c00,0x2800,0x1400][s.sixFrame],length:0x2c0},
 {destination:0x6ec0,source:0x2c0+s.fourFrame*0x1400,length:0x3e0},
 {destination:0x72a0,source:0x6a0+s.waterFrame*0x1400,length:0x660},
 {destination:0x7900,source:0xd00+s.waterTail*0x1400,length:0x700}
 ];}
export function patchCityGraphics(base,animated,state){
 const gfx=new Uint8Array(base);
 for(const t of cityAnimationTransfers(state)){const bytes=animated.subarray(t.source,t.source+t.length);if(bytes.length!==t.length)throw Error('Truncated city animation data');gfx.set(bytes,t.destination);}
 return gfx;
}
// SNES 4bpp tilemap pixel, retaining palette and flips from ROM lookup words.
export function cityTilePixel(gfx,word,x,y){
 if(word&0x4000)x=7-x;if(word&0x8000)y=7-y;
 const t=(word&1023)*32;let value=0;
 for(let plane=0;plane<4;plane++)value|=((gfx[t+(plane>>1)*16+y*2+(plane&1)]>>(7-x))&1)<<plane;
 return value?((word>>10)&7)*16+value:0;
}
export class AnimatedCityAtlas{
 constructor(base,animated,palettes,table){this.base=base;this.animated=animated;this.palettes=palettes;this.table=table;this.canvas=document.createElement('canvas');this.canvas.width=256;this.canvas.height=240;this.ctx=this.canvas.getContext('2d');this.key='';this.groundPixels=new Uint8ClampedArray(256);this.canvas.cityGroundVersion=0;this.paletteVersion=0;this.animatedIds=Array.from({length:958},(_,id)=>id).filter(id=>(table.top[id]&1023)>=0x360||(table.bottom[id]&1023)>=0x360);this.stats={fullBuilds:0,animatedBuilds:0,tiles:0};}
 image(season,state,paletteOverride=null,paletteKey=''){
  const key=[season,paletteKey,...cityAnimationTransfers(state).map(t=>t.source)].join('/');if(key===this.key)return this.canvas;
  const gfx=patchCityGraphics(this.base,this.animated,state),pal=paletteOverride||this.palettes[season];
  // Animation uploads only replace tiles $360..$3FF. Keep static pixels when
  // the actual palette bytes are unchanged, even during quantized season fades.
  const paletteChanged=!this.paletteBytes||pal.length!==this.paletteBytes.length||pal.some((v,i)=>v!==this.paletteBytes[i]);
  if(paletteChanged){this.paletteBytes=Uint8Array.from(pal);this.paletteVersion++;this.colors=new Uint8Array(pal.length/2*3);for(let n=0;n<pal.length;n+=2){const c=pal[n]|pal[n+1]<<8,i=n/2*3;this.colors[i]=Math.floor((c&31)*255/31);this.colors[i+1]=Math.floor(((c>>5)&31)*255/31);this.colors[i+2]=Math.floor(((c>>10)&31)*255/31);}}
  const full=!this.pixels||paletteChanged,image=this.pixels??=this.ctx.createImageData(256,240),d=image.data,ids=full?null:this.animatedIds;
  if(!this.canvas.cityPixels32)this.canvas.cityPixels32=new Uint32Array(d.buffer,d.byteOffset,d.byteLength/4);
  this.stats[full?'fullBuilds':'animatedBuilds']++;this.stats.tiles+=full?958:ids.length;
  for(let n=0;n<(full?958:ids.length);n++){const id=full?n:ids[n];for(let y=0;y<8;y++)for(let x=0;x<8;x++){
   const top=cityTilePixel(gfx,this.table.top[id],x,y),bottom=cityTilePixel(gfx,this.table.bottom[id],x,y),index=(top||bottom)*3;
   const p=(((id>>5)*8+y)*256+(id%32)*8+x)*4;
   d[p]=this.colors[index];d[p+1]=this.colors[index+1];d[p+2]=this.colors[index+2];d[p+3]=255;
  }}
  // Track the actual opaque ground tile while its CPU pixels are available.
  // This avoids a GPU readback or invalidation from unrelated road animation.
  let groundChanged=false;for(let y=0;y<8;y++)for(let byte=0;byte<32;byte++){const i=y*32+byte,value=d[y*256*4+byte];if(value!==this.groundPixels[i])groundChanged=true;this.groundPixels[i]=value;}
  if(groundChanged)this.canvas.cityGroundVersion++;
  this.ctx.putImageData(image,0,0);this.key=key;return this.canvas;
 }
}
