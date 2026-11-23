from pathlib import Path
from PIL import Image
r=Path(__file__).resolve().parents[1];g=(r/'assets/graphics/GFX_Sprite_UFO.bin').read_bytes();p=(r/'assets/palettes/DATA_058B00.bin').read_bytes();animated=(r/'assets/palettes/DATA_00C305.bin').read_bytes();out=Image.new('RGBA',(256,32))
# CODE_00C713/00C798: eight512-byte frames, palette5 with colors8..15
# replaced by the matching16-byte palette phase.
for f in range(8):
 for y in range(32):
  for x in range(32):
   b=f*512+((y//8)*4+x//8)*32;v=sum(((g[b+(i//2)*16+(y%8)*2+(i&1)]>>(7-x%8))&1)<<i for i in range(4))
   if v:
    raw=animated[f*16+(v-8)*2:f*16+(v-7)*2] if v>=8 else p[(80+v)*2:(81+v)*2];c=int.from_bytes(raw,'little');out.putpixel((f*32+x,y),tuple(((c>>s)&31)*255//31 for s in(0,5,10))+(255,))
out.save(r/'assets/ufo.png')
