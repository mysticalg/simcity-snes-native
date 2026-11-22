from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
gfx=(ROOT/'assets/graphics/GFX_Sprite_Train.bin').read_bytes()
pal=(ROOT/'assets/palettes/DATA_058B00.bin').read_bytes()
out=Image.new('RGBA',(32,8))
# CODE_00BD15 OAM tile$284E selects sprite palette4; ordinary city
# view displays the first8x8 tile of each128-byte orientation upload.
for frame in range(4):
 for y in range(8):
  for x in range(8):
   value=sum(((gfx[frame*128+(p//2)*16+y*2+(p&1)]>>(7-x))&1)<<p for p in range(4))
   if value:
    i=(64+value)*2;color=int.from_bytes(pal[i:i+2],'little')
    out.putpixel((frame*8+x,y),tuple(((color>>s)&31)*255//31 for s in (0,5,10))+(255,))
out.save(ROOT/'assets/train.png')
