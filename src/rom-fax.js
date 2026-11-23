// Specialized native renderer for CODE_03DF49's mode-0 fax scene. No CPU/PPU
// emulator is used by the game. Data comes from the supplied cartridge assets.
export const FAX_TEXT={9:'TM_FailedScenarioText',10:'TM_CompleteScenarioText',11:'TM_UnlockBonusScenariosText'};
export const FAX_ASSETS={GFX_LayerX_MainMenu:16384,GFX_Layer3_InformationAndBankLoanSubScreens:16384,GFX_Sprite_FamicomLogoAndFaxMachineCord:512,TM_FaxPaper:4096,TM_FaxMachineAndWoodTable:2048,TM_FaxMachineGlass:2048,PAL_FaxMachineScreen:384,TM_FailedScenarioText:4096,TM_CompleteScenarioText:4096,TM_UnlockBonusScenariosText:4096};
export const FAX_OBJECTS=[{address:0x00a5bf,x:264,y:159,hex:'5555f8e00130f0e00030e0f00530f0e80430e8e80330e0e8023000'},{address:0x00a5da,x:50,y:207,hex:'5555fdfc0732f8f80730fb030632f700063000'}];
export const faxAssetPath=name=>'assets/'+(name.startsWith('GFX_')?'graphics':name.startsWith('PAL_')?'palettes':'tilemaps')+'/'+name+'.bin';
const word=(a,i)=>a[i]|a[i+1]<<8;
export function faxOam(){
 const oam=new Uint8Array(544);for(let i=0;i<128;i++)oam[i*4]=128;oam.fill(0x55,512);let slot=0;
 for(const object of FAX_OBJECTS){const data=Uint8Array.from(object.hex.match(/../g),s=>parseInt(s,16));let at=0,done=false;
  while(!done&&at<data.length){let mask=word(data,at);at+=2;for(let n=0;n<8;n++){
   const dx=data[at++]|((mask&1)<<8);mask>>=1;if(dx===256){done=true;break;}const large=mask&1;mask>>=1;
   const x=(object.x+dx)&511,y=(object.y+data[at++])&255,i=slot*4;oam[i]=x&255;oam[i+1]=y;oam[i+2]=data[at++];oam[i+3]=data[at++];
   const hi=512+(slot>>2),shift=(slot&3)*2;oam[hi]=(oam[hi]&~(3<<shift))|((x>>8|large<<1)<<shift);slot++;
  }}
 }
 return oam;
}
export function faxMemory(files,screen){
 if(!FAX_TEXT[screen])throw Error('Unknown fax screen');
 const buffer=new Uint8Array(32768),vram=new Uint8Array(65536),put=(name,offset)=>{const data=files[name];if(!(data instanceof Uint8Array)||data.length!==FAX_ASSETS[name])throw Error('Invalid fax asset '+name);buffer.set(data,offset);};
 put('GFX_LayerX_MainMenu',0);put('GFX_Layer3_InformationAndBankLoanSubScreens',0x4000);vram.set(buffer);
 put(FAX_TEXT[screen],0);put('TM_FaxPaper',0x1000);put('TM_FaxMachineAndWoodTable',0x2000);put('TM_FaxMachineGlass',0x2800);vram.set(buffer.subarray(0,0x3000),0x8000);
 // Original DMA lengths exceed the decompressed sprite and palette lengths.
 // Preserve the same buffer tail, not invented zero padding.
 put('GFX_Sprite_FamicomLogoAndFaxMachineCord',0);vram.set(buffer.subarray(0,0x1000),0xc000);put('PAL_FaxMachineScreen',0);
 return {vram,cgram:buffer.slice(0,512),oam:faxOam()};
}
function background(vram,layer){
 const height=layer<2?512:256,base=layer===0?0x4000:0,map=[0x8000,0x9000,0xa000,0xa800][layer],plane=new Uint16Array(256*height);
 for(let y=0;y<height;y++)for(let x=0;x<256;x++){
  const tile=word(vram,map+(((y>>3)*32+(x>>3))*2)),px=tile&0x4000?7-(x&7):x&7,py=tile&0x8000?7-(y&7):y&7,at=base+(tile&1023)*16+py*2,bit=7-px,color=(vram[at]>>bit&1)|(vram[at+1]>>bit&1)<<1;
  if(color)plane[y*256+x]=(layer*32+(tile>>10&7)*4+color+1)|(tile&0x2000?512:0);
 }
 return plane;
}
function objects(vram,oam){
 const plane=new Uint16Array(65536);
 for(let slot=0;slot<128;slot++){
  const i=slot*4,hi=oam[512+(slot>>2)]>>((slot&3)*2)&3,x=oam[i]+((hi&1)<<8),y=oam[i+1],tile=oam[i+2],prop=oam[i+3];if(x>=256)continue;
  if(hi&2)throw Error('Unexpected large fax sprite');
  for(let yy=0;yy<8;yy++)for(let xx=0;xx<8;xx++){
   const dx=x+xx,dy=(y+yy)&255;if(dx>=256||plane[dy*256+dx])continue;const px=prop&64?7-xx:xx,py=prop&128?7-yy:yy,at=0xc000+(prop&1?0x2000:0)+tile*32+py*2,bit=7-px,color=(vram[at]>>bit&1)|(vram[at+1]>>bit&1)<<1|(vram[at+16]>>bit&1)<<2|(vram[at+17]>>bit&1)<<3;
   if(color)plane[dy*256+dx]=(128+(prop>>1&7)*16+color+1)|((prop>>4&3)<<9);
  }
 }
 return plane;
}
export function faxScene(files,screen){const memory=faxMemory(files,screen);return {...memory,screen,backgrounds:[0,1,2,3].map(n=>background(memory.vram,n)),objects:objects(memory.vram,memory.oam),palette:Uint16Array.from({length:256},(_,i)=>word(memory.cgram,i*2)&32767)};}
export function faxFrame(scene,scroll=0,brightness=15,data=new Uint8ClampedArray(256*224*4)){
 if(!Number.isInteger(scroll)||scroll< -120||scroll>0||!Number.isInteger(brightness)||brightness<0||brightness>15||data.length!==256*224*4)throw Error('Invalid fax frame');
 const [text,paper,machine,glass]=scene.backgrounds,palette=scene.palette,spriteRanks=[3,6,9,12];
 for(let y=0;y<224;y++)for(let x=0;x<256;x++){
  const bgY=y+1,paperAt=((bgY+scroll)&511)*256+x,at=(bgY&255)*256+x;let rank=0,color=palette[0],isObject=false;
  const m=machine[at];if(m){rank=m&512?5:2;color=palette[(m&511)-1];}
  if(y<198){const p=paper[paperAt];if(p){rank=p&512?10:7;color=palette[(p&511)-1];}const t=text[paperAt];if(t&&(t&512?11:8)>rank){rank=t&512?11:8;color=palette[(t&511)-1];}}
  const obj=scene.objects[y*256+x];if(obj&&spriteRanks[obj>>9]>rank){color=palette[(obj&511)-1];isObject=true;}
  const g=glass[at],other=!isObject&&g?palette[(g&511)-1]:0;let r=Math.max(0,(color&31)-(other&31)),green=Math.max(0,(color>>5&31)-(other>>5&31)),b=Math.max(0,(color>>10&31)-(other>>10&31));
  r=Math.floor(r*brightness/15);green=Math.floor(green*brightness/15);b=Math.floor(b*brightness/15);const p=(y*256+x)*4;data[p]=r<<3|r>>2;data[p+1]=green<<3|green>>2;data[p+2]=b<<3|b>>2;data[p+3]=255;
 }
 return data;
}
// CODE_059FBB ignores input while either paper layer is still feeding.
export function faxPaperStep(scroll){if(!Number.isInteger(scroll)||scroll< -120||scroll>0)throw Error('Invalid fax scroll');return scroll===0?0:scroll+1;}
// Original 03D283 -> 03E2DF/03DF49 -> 008E43 -> 03E344/059FBB.
// Frame zero is the first loaded-scene NMI: forced blank, then levels 0..15,
// one full-brightness hold, then 120 synchronized paper/text updates.
export function faxAppearance(frame){
 if(!Number.isInteger(frame)||frame<0)throw Error('Invalid fax frame number');frame=Math.min(137,frame);
 const brightness=frame===0?15:Math.min(15,frame-1),forcedBlank=frame===0;
 return {frame,scroll:Math.min(0,-120+Math.max(0,frame-17)),brightness,forcedBlank,display:brightness|(forcedBlank?128:0),menu:frame<17?19:20,complete:frame===137};
}
