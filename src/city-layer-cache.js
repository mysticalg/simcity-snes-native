// Original animation transfers replace VRAM tiles $360..$3FF. Other map
// graphics stay valid until the map, overlay colour or seasonal palette changes.
export class CityLayerCache{
 constructor(){this.stats={rasterTiles:0,rasterUploads:0,rasterUploadBytes:0};}
 begin(city,table,atlasKey,paletteKey,{context=null,atlas=null,plain=false}={}){
  if(this.city!==city||this.ids?.length!==city.map.length){this.city=city;this.table=table;this.ids=new Uint16Array(city.map.length).fill(65535);this.colors=[];this.epochs=new Uint32Array(city.map.length);this.paletteKey=null;}
  if(this.paletteKey!==paletteKey){this.ids.fill(65535);this.paletteKey=paletteKey;}
  if(this.atlasKey!==atlasKey){this.atlasKey=atlasKey;this.epoch=(this.epoch||0)+1;}
  // Native tiles are opaque, integer 8x8 copies. Batch their CPU pixels into
  // one upload instead of issuing thousands of Canvas drawImage calls.
  // Overlays and nonstandard context state retain the original Canvas path.
  const transform=context&&plain&&atlas?.cityPixels32?context.getTransform():null;
  const raster=!!(transform&&transform.a===1&&transform.d===1&&!transform.b&&!transform.c&&!transform.e&&!transform.f&&context.globalAlpha===1&&context.globalCompositeOperation==='source-over'&&context.filter==='none'&&!context.shadowBlur&&!context.shadowOffsetX&&!context.shadowOffsetY);
  if(this.raster!==raster){this.ids.fill(65535);this.raster=raster;}
  if(raster){
   const {width,height}=context.canvas;
   if(this.pixels?.width!==width||this.pixels?.height!==height){this.pixels=context.createImageData(width,height);this.words=new Uint32Array(this.pixels.data.buffer,this.pixels.data.byteOffset,this.pixels.data.byteLength/4);this.ids.fill(65535);}
   this.context=context;this.source=atlas.cityPixels32;this.stride=width;this.left=width;this.top=height;this.right=this.bottom=0;
  }
 }
 dirty(index,id,color){
  const animated=(this.table.top[id]&1023)>=0x360||(this.table.bottom[id]&1023)>=0x360;
  if(this.ids[index]===id&&this.colors[index]===color&&(!animated||this.epochs[index]===this.epoch))return false;
  this.ids[index]=id;this.colors[index]=color;this.epochs[index]=this.epoch;return true;
 }
 paint(index,id,x,y,color,atlas,context){
  if(!this.dirty(index,id,color))return false;
  if(this.raster){
   const source=this.source,dest=this.words,sx=(id%32)*8,sy=(id>>5)*8;
   for(let row=0;row<8;row++){const s=(sy+row)*256+sx,d=(y+row)*this.stride+x;dest[d]=source[s];dest[d+1]=source[s+1];dest[d+2]=source[s+2];dest[d+3]=source[s+3];dest[d+4]=source[s+4];dest[d+5]=source[s+5];dest[d+6]=source[s+6];dest[d+7]=source[s+7];}
   this.left=Math.min(this.left,x);this.top=Math.min(this.top,y);this.right=Math.max(this.right,x+8);this.bottom=Math.max(this.bottom,y+8);this.stats.rasterTiles++;
  }else{context.drawImage(atlas,id%32*8,(id>>5)*8,8,8,x,y,8,8);if(color){context.fillStyle=color;context.fillRect(x,y,8,8);}}
  return true;
 }
 flush(){if(this.raster&&this.right>this.left){const w=this.right-this.left,h=this.bottom-this.top;this.context.putImageData(this.pixels,0,0,this.left,this.top,w,h);this.stats.rasterUploads++;this.stats.rasterUploadBytes+=w*h*4;}}
}
