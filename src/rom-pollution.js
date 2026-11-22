// CODE_039E0C source contribution per map tile.
export function tilePollution(id){
 id&=1023;if(id===0x7f)return 60;if(id===0x364)return -40;
 if(id<0x60)return id>=0x50?25:id>=0x40?10:0;
 if(id<0x1fd)return 0;if(id<0x245)return 50;
 if(id>=0x267&&id<0x277)return 60;if(id>=0x287&&id<0x2ba)return 60;return 0;
}
// CODE_03A02F/03A0B5: self+four neighbors, divide4 (not5), cap250.
export function smoothPollution(input,width,height){
 const output=new Uint8Array(input.length);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x;let sum=input[i];if(x)sum+=input[i-1];if(x+1<width)sum+=input[i+1];if(y)sum+=input[i-width];if(y+1<height)sum+=input[i+width];output[i]=Math.min(250,sum>>>2);
 }return output;
}
export function romPollutionField(map,width=120,height=100){
 const w=width/2,h=height/2;let field=new Uint8Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  let sum=0;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)sum=(sum+tilePollution(map[(y*2+dy)*width+x*2+dx]))&65535;
  field[y*w+x]=Math.min(250,sum);
 }
 field=smoothPollution(smoothPollution(field,w,h),w,h);
 return Uint8Array.from(map,(_,i)=>field[Math.floor(i/width/2)*w+Math.floor(i%width/2)]);
}
