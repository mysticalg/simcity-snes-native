from pathlib import Path
from PIL import Image
r=Path(__file__).resolve().parents[1];gfx=(r/'assets/graphics/GFX_Sprite_StatusBarUI.bin').read_bytes();pal=(r/'assets/palettes/DATA_058B00.bin').read_bytes();out=Image.new('RGBA',(256,80))
# CODE_009719 uploads06C000 to VRAM6000. CODE_00BE1C selects body
# tile40/44/48, rotor+0/2, optional8x8 tail4C/5C, palette4 and flips.
base=[0x40,0x48,0x44,0x48,0x40,0x48,0x44,0x48];props=[0x38,0x78,0x78,0xf8,0xb8,0xb8,0x38,0x38]
def tile(t,size,prop):
 im=Image.new('RGBA',(size,size))
 for y in range(size):
  for x in range(size):
   b=(t+(y//8)*16+x//8)*32;v=sum(((gfx[b+(p//2)*16+(y%8)*2+(p&1)]>>(7-x%8))&1)<<p for p in range(4))
   if v:
    c=int.from_bytes(pal[(64+v)*2:(65+v)*2],'little');im.putpixel((x,y),tuple(((c>>s)&31)*255//31 for s in(0,5,10))+(255,))
 if prop&64:im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
 if prop&128:im=im.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
 return im
for d in range(8):
 for phase in range(2):
  frame=Image.new('RGBA',(32,40));frame.alpha_composite(tile(base[d]+phase*2,16,props[d]),(8,8))
  if d%2==0:
   i=d//2;dx=[1,-1,1,2][i];dy=[2,0,-1,0][i];frame.alpha_composite(tile([0x4c,0x5c,0x4c,0x5c][i]+phase,8,props[d]),(8+dx*8,8+dy*8))
  out.alpha_composite(frame,(d*32,phase*40))
out.save(r/'assets/helicopter.png')
