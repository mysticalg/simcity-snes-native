from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
gfx=(ROOT/'assets/graphics/GFX_Sprite_Boat.bin').read_bytes()
pal=(ROOT/'assets/palettes/DATA_058B00.bin').read_bytes()
# CODE_00BA17 VRAM upload and CODE_00BEE2 OAM arrangement, ordinary city.
offsets=[512,1536,0,2048,512,2048,0,1024]
groups=[3,3,3,0,1,0,3,3]
orders=[[0,2,4,6],[2,0,6,4],[6,4,2,0],[4,6,0,2]]
attrs=[0x78,0xb8,0xf8,0x38]
order_offsets=[8,24,16,0]
out=Image.new('RGBA',(256,32))
for direction,offset in enumerate(offsets):
 vram=bytearray(1024)
 for source,target in [(0,0),(128,512),(256,128),(384,640)]:vram[target:target+128]=gfx[offset+source:offset+source+128]
 group=groups[direction];order=orders[order_offsets[group]//8];attr=attrs[group]
 # OAM writes table entries 0,1,3,2 into TL,TR,BR,BL objects.
 for position,entry in enumerate([0,1,3,2]):
  tile=order[entry];px=[0,16,16,0][position];py=[0,0,16,16][position]
  for y in range(16):
   for x in range(16):
    sx=15-x if attr&0x40 else x;sy=15-y if attr&0x80 else y
    base=(tile+(sx//8)+(sy//8)*16)*32
    value=sum(((vram[base+(p//2)*16+(sy%8)*2+(p&1)]>>(7-sx%8))&1)<<p for p in range(4))
    if value:
     color=int.from_bytes(pal[(64+value)*2:(65+value)*2],'little')
     out.putpixel((direction*32+px+x,py+y),tuple(((color>>s)&31)*255//31 for s in (0,5,10))+(255,))
out.save(ROOT/'assets/ship.png')
