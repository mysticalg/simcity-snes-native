// AnimatedCityAtlas already owns these opaque RGBA pixels. Copy the same
// integer 8x8 source rectangles as the legacy unsmoothed Canvas path, without
// reading a recently uploaded GPU atlas back into a second canvas.
export function nativeWindowPixels(city,b,atlas){
 const source=atlas?.cityPixels32,width=atlas?.width,height=atlas?.height;
 if(!(source instanceof Uint32Array)||width!==256||!Number.isInteger(height)||height<=0||source.length!==width*height||![b.width,b.height].every(n=>Number.isInteger(n)&&n>0))return null;
 const w=b.width*8,h=b.height*8,data=new Uint8ClampedArray(w*h*4),out=new Uint32Array(data.buffer),bytes=new Uint8Array(source.buffer,source.byteOffset,source.byteLength);
 for(let yy=0;yy<b.height;yy++)for(let xx=0;xx<b.width;xx++){
  const id=city.id(b.x+xx,b.y+yy);if(!Number.isInteger(id)||id<0)return null;
  const sx=id%32*8,sy=(id>>5)*8;if(sy+8>height)continue;
  for(let y=0;y<8;y++){const from=(sy+y)*width+sx,to=(yy*8+y)*w+xx*8;for(let x=0;x<8;x++){const p=from+x,value=source[p];if(bytes[p*4+3]!==255&&value!==0)return null;out[to+x]=value;}}
 }
 return {data,width:w,height:h};
}
