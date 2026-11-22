from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
gfx=(root/'assets/graphics/GFX_Sprite_Tornado.bin').read_bytes()
pal=(root/'assets/palettes/DATA_058B00.bin').read_bytes()
# CODE_00B126 uploads four128-byte rows; CODE_00BCC4 selects
# OAM palette6 over land, palette5 over terrain/water.
out=Image.new('RGBA',(128,64))
for surface,palette in enumerate([6,5]):
 for frame in range(4):
  for y in range(32):
   for x in range(32):
    tile=(y//8)*4+x//8;base=frame*512+tile*32
    value=sum(((gfx[base+(p//2)*16+(y%8)*2+(p&1)]>>(7-x%8))&1)<<p for p in range(4))
    if value:
     color=int.from_bytes(pal[(palette*16+value)*2:(palette*16+value)*2+2],'little')
     out.putpixel((frame*32+x,surface*32+y),tuple(((color>>s)&31)*255//31 for s in(0,5,10))+(255,))
out.save(root/'assets/tornado.png')
