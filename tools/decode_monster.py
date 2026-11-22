from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
gfx=(root/'assets/graphics/GFX_Sprite_Bowser.bin').read_bytes();pal=(root/'assets/palettes/DATA_058B00.bin').read_bytes();out=Image.new('RGBA',(512,128))
for n in range(64):
 for y in range(32):
  for x in range(32):
   base=n*512+((y//8)*4+x//8)*32
   value=sum(((gfx[base+(p//2)*16+(y%8)*2+(p&1)]>>(7-x%8))&1)<<p for p in range(4))
   if value:
    color=int.from_bytes(pal[(7*16+value)*2:(7*16+value)*2+2],'little');out.putpixel(((n%16)*32+x,(n//16)*32+y),tuple(((color>>s)&31)*255//31 for s in(0,5,10))+(255,))
out.save(root/'assets/monster.png')
