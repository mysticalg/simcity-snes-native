import {findZoneTransport} from './rom-growth.js';
// CODE_03AB44..AB84 seeds eighth-resolution police plane; CODE_03A1CC
// runs three neighbor-quarter/self-half passes before crime calculation.
export function romPoliceCoverage(map,fundingPercent,width=120,height=100){
 const w=Math.ceil(width/8),h=Math.ceil(height/8);let field=new Uint16Array(w*h);
 for(let i=0;i<map.length;i++){const id=map[i]&1023;if(id!==0x249&&id!==0x307)continue;
  const x=i%width,y=Math.floor(i/width);let strength=Math.floor(1000*fundingPercent/100);if(id===0x307)strength*=2;
  if(!(map[i]&0x8000))strength>>=1;if(!findZoneTransport(map,x,y,width,height))strength>>=1;
  const p=(y>>3)*w+(x>>3);field[p]=(field[p]+strength)&65535;
 }
 for(let pass=0;pass<3;pass++){const next=new Uint16Array(field.length);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;let n=0;if(x)n+=field[i-1];if(x+1<w)n+=field[i+1];if(y)n+=field[i-w];if(y+1<h)n+=field[i+w];n&=65535;next[i]=(((n>>>2)+field[i]+((n>>>1)&1))&65535)>>>1;}field=next;
 }
 return Uint16Array.from(map,(_,i)=>field[(Math.floor(i/width)>>3)*w+((i%width)>>3)]);
}
