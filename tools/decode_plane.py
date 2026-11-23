from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1];palette=(root/'assets/palettes/DATA_058B00.bin').read_bytes();out=Image.new('RGBA',(192,64))
for style,name in enumerate(['GFX_Sprite_Airplane.bin','GFX_Sprite_Airplane_01.bin']):
 gfx=(root/'assets/graphics'/name).read_bytes()
 for frame in range(6):
  for y in range(32):
   for x in range(32):
    base=frame*512+((y//8)*4+x//8)*32;value=sum(((gfx[base+(p//2)*16+(y%8)*2+(p&1)]>>(7-x%8))&1)<<p for p in range(4))
    if value:
     color=int.from_bytes(palette[(4*16+value)*2:(4*16+value)*2+2],'little');out.putpixel((frame*32+x,style*32+y),tuple(((color>>s)&31)*255//31 for s in(0,5,10))+(255,))
out.save(root/'assets/plane.png')
