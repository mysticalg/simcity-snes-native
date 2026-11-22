// CODE_038F41: Q8 allocated/requested times33; zero request defaults32.
export function romTransportFunding(allocated,requested){if(!requested)return 32;return ((Math.floor((allocated&65535)*256/(requested&65535))&65535)*33>>>8)&65535;}
const H={offsets:[-122,-2,-1,0,1,2,-118],open:[0x356,0x357,1,0x354,1,0x359,0x358],closed:[1,0x30,0x30,0x30,0x30,0x30,1]};
const V={offsets:[-241,-240,-120,0,120,240,239],open:[0x35c,0x35d,1,0x355,1,0x35b,0x35a],closed:[1,0x31,0x31,0x31,0x31,0x31,1]};
// CODE_03A53B..03A70C. Offsets above include the scan's next-word pointer.
// Ship coordinates are source tile coordinates, not screen pixels.
export function updateRomDrawbridge(map,i,nextWord,{shipX=0,shipY=0}={},width=120,height=100){
 const id=map[i]&1023,x=i%width,y=Math.floor(i/width),distance=(Math.abs(shipX-x)+Math.abs(shipY-y))&255;
 const opened=id===0x354||id===0x355,pattern=id===0x355||(!opened&&(id&1))?V:H;
 if(opened){if((nextWord()&3)!==0||distance<21)return false;}else{if(id>=0x80)return false;if(distance>=18&&(nextWord()&7)!==0)return false;if(x<2||x>=width-2||y<2||y>=height-2)return false;const water=i+(id&1?-1:-width);if((map[water]&1023)!==2)return false;}
 // Source tables use fixed120-wide offsets. Convert row deltas for fixtures.
 const offsets=pattern.offsets.map(n=>{const dy=Math.round(n/120);return dy*width+(n-dy*120);});
 if(offsets.some(n=>i+n<0||i+n>=map.length))return false;
 const expected=opened?pattern.open:pattern.closed;
 if(offsets.some((n,j)=>opened?map[i+n]!==expected[j]:(map[i+n]&15)!==(expected[j]&15)))return false;
 const target=opened?pattern.closed:pattern.open;offsets.forEach((n,j)=>{map[i+n]=target[j];});return true;
}
// CODE_03A493/03A73D: maintenance before bridge/traffic graphics.
export function updateRomTransportTile(map,i,flags,strength,traffic,nextWord,ship={},width=120,height=100){
 const word=map[i],id=word&1023,f=flags[id]||0,rail=Boolean(f&0x20),road=!rail&&Boolean(f&0x40);if(!rail&&!road)return null;
 if((rail||id<0x80)&&strength<30&&(nextWord()&511)===0&&!(f&0x10)&&(nextWord()&31)>=strength){map[i]=rail?(id<0x72?3:0x28):((id&15)<2?3:0x28);return {kind:rail?'rail':'road',decayed:true};}
 let bridgeChanged=false;
 if(road){if(id>=0x80||(id&15)<2)bridgeChanged=updateRomDrawbridge(map,i,nextWord,ship,width,height);if(id<0x80&&!bridgeChanged){const base=traffic<100?0x30:traffic<200?0x40:0x50;map[i]=(word&0xff0f)|base;}}
 return {kind:rail?'rail':'road',decayed:false,bridgeChanged};
}
