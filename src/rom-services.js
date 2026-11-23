import {findZoneTransport} from './rom-growth.js?v=residential-1';
// CODE_038F78/038FAF: allocated<<8 / requested, multiply1000,
// then read the product at byte offset1. Zero request defaults to1000.
export function romServiceFunding(allocated,requested){if(!requested)return 1000;const ratio=Math.floor(((allocated&65535)*256)/(requested&65535))&65535;return (Math.imul(ratio,1000)>>>8)&65535;}
// CODE_03AAEB/03AB44 adds into cleared 15x13 word planes during tile scan.
export function seedRomServicePlane(map,strength,kind,width=120,height=100){
 const w=Math.ceil(width/8),h=Math.ceil(height/8),field=new Uint16Array(w*h);
 for(let i=0;i<map.length;i++)addRomServiceCenter(field,map,i,strength,kind,width,height);
 return field;
}
export function addRomServiceCenter(field,map,i,strength,kind,width=120,height=100){
 const id=map[i]&1023,station=kind==='fire'?0x252:0x249,hq=kind==='fire'?0x310:0x307;if(id!==station&&id!==hq)return;
 const x=i%width,y=Math.floor(i/width),w=Math.ceil(width/8);let value=id===hq?(strength*2)&65535:strength;
 if(!(map[i]&0x8000))value>>=1;if(!findZoneTransport(map,x,y,width,height))value>>=1;
 const p=(y>>3)*w+(x>>3);field[p]=(field[p]+value)&65535;
}
// CODE_03A14D/03A1CC: neighbor sum wraps; second LSR supplies carry
// to ADC self, then final LSR. Copy scratch plane back after each pass.
export function smoothRomServicePlane(raw,width=120,height=100){
 const w=Math.ceil(width/8),h=Math.ceil(height/8);let field=new Uint16Array(raw);
 for(let pass=0;pass<3;pass++){const next=new Uint16Array(field.length);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;let n=0;if(x)n+=field[i-1];if(x+1<w)n+=field[i+1];if(y)n+=field[i-w];if(y+1<h)n+=field[i+w];n&=65535;next[i]=(((n>>>2)+field[i]+((n>>>1)&1))&65535)>>>1;}field=next;
 }
 return field;
}
export function expandRomServicePlane(raw,kind,width=120,height=100){const field=smoothRomServicePlane(raw,width,height),w=Math.ceil(width/8);return Uint16Array.from({length:width*height},(_,i)=>Math.min(kind==='fire'?255:65535,field[(Math.floor(i/width)>>3)*w+((i%width)>>3)]));}
function coverage(map,percent,kind,width,height){const ids=kind==='fire'?[0x252,0x310]:[0x249,0x307],requested=Math.min(9999,map.reduce((n,id)=>n+(ids.includes(id&1023)?100:0),0)),allocated=Math.round(requested*percent/100);return expandRomServicePlane(seedRomServicePlane(map,romServiceFunding(allocated,requested),kind,width,height),kind,width,height);}
export function romPoliceCoverage(map,percent,width=120,height=100){return coverage(map,percent,'police',width,height);}
export function romFireCoverage(map,percent,width=120,height=100){return coverage(map,percent,'fire',width,height);}
// CODE_03A881: coverage selects inclusive random maximum10/3/2/1.
export function fireBurnoutMaximum(coverage){return coverage===0?10:coverage<20?3:coverage<100?2:1;}
