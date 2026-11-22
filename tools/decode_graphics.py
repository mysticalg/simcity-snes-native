from pathlib import Path
import struct,json,argparse
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description='Rebuild ROM-backed city and title atlases')
parser.add_argument('--rom',type=Path,default=ROOT.parents[1]/'work/extracted/SimCity (USA).sfc')
args=parser.parse_args()
A=ROOT/'assets';rom=args.rom.read_bytes()
def at(a,n):return rom[((a>>16)*32768+(a&32767)):][:n]
def words(b):return list(struct.unpack('<'+'H'*(len(b)//2),b))
def palette(b):return [tuple(((v>>s)&31)*255//31 for s in (0,5,10))+(255,) for v in words(b)]
def tile(gfx,w,pal,bpp=4):
 im=Image.new('RGBA',(8,8));t=w&1023;p=(w>>10)&7
 for y in range(8):
  for x in range(8):
   v=0
   for plane in range(bpp):
    off=t*bpp*8+(plane//2)*16+y*2+(plane&1)
    if off<len(gfx):v|=((gfx[off]>>(7-x))&1)<<plane
   if v:im.putpixel((7-x if w&0x4000 else x,7-y if w&0x8000 else y),pal[p*(1<<bpp)+v])
 return im
# Mapped city tiles from the same tables used by CODE_01C7ED and CODE_01C7F6.
top=words(at(0x02cf2d,0x77c));bottom=words(at(0x02d6a9,0x77c));mini=words(at(0x02de25,0x77c))
(A/'tables').mkdir(exist_ok=True);(A/'tables/city.json').write_text(json.dumps(dict(top=top,bottom=bottom,mini=mini,flags=list(at(0x0384eb,958)))))
gfx=bytearray((A/'graphics/GFX_Layer1_CitySimulationTiles.bin').read_bytes());anim=(A/'graphics/GFX_Layer2_AnimatedCitySimulationTiles.bin').read_bytes()
gfx[0x6c00:0x6ec0]=anim[:0x2c0];gfx[0x6ec0:0x72a0]=anim[0x2c0:0x6a0]
gfx[0x72a0:0x7900]=anim[0x6a0:0xd00] # CODE_008775, VRAM word $3950
gfx[0x7900:0x8000]=anim[0xd00:0x1400] # CODE_0087A8, VRAM word $3C80
# static water/bridge animation groups loaded at runtime; first-frame patches are applied above.
for season in range(4):
 pal=palette((A/f'palettes/DATA_058{season}00.bin').read_bytes());atlas=Image.new('RGBA',(256,240),pal[0])
 for i in range(958):
  im=Image.new('RGBA',(8,8),pal[0]);im.alpha_composite(tile(gfx,bottom[i],pal));im.alpha_composite(tile(gfx,top[i],pal))
  atlas.paste(im,((i%32)*8,(i//32)*8))
 atlas.save(A/f'city-{season}.png')
 if season==0:
  for name in ['PracticeCity','Tokyo']:
   city=json.loads((A/f'maps/Map_{name}.json').read_text());out=Image.new('RGBA',(960,800))
   for i,t in enumerate(city):out.paste(atlas.crop(((t%32)*8,(t//32)*8,(t%32)*8+8,(t//32)*8+8)),((i%120)*8,(i//120)*8))
   out.save(ROOT/f'research/{name}.png')
# Title backgrounds: two 4bpp layers plus the 2bpp layer, using SNES screen-block addressing.
pal=palette((A/'palettes/PAL_TitleScreen.bin').read_bytes());gfx=(A/'graphics/GFX_Layer1_TitleScreen.bin').read_bytes()
def layer(name,w,h,g,bpp=4):
 data=words((A/f'tilemaps/TM_{name}.bin').read_bytes());im=Image.new('RGBA',(w*8,h*8))
 for y in range(h):
  for x in range(w):
   idx=((y//32)*(w//32)+x//32)*1024+(y%32)*32+x%32
   if idx<len(data):im.alpha_composite(tile(g,data[idx],pal,bpp),(x*8,y*8))
 return im
for name,w,h,g,bpp in [('Layer1_TitleScreen',64,64,gfx,4),('Layer2_TitleScreen',32,64,gfx,4),('Layer3_TitleScreen',32,64,(A/'graphics/GFX_Layer3_TitleScreen.bin').read_bytes(),2)]:
 layer(name,w,h,g,bpp).save(A/(name+'.png'))
# Extra build/placement tables. Append after the graphics decoder.
pointers=words(at(0x0098bb,60));counts=list(at(0x018062,16));xs=list(at(0x018072,36));ys=list(at(0x018096,36))
build=[]
for i,p in enumerate(pointers):
 n=counts[i]+1 if i<16 else 9
 build.append(dict(id=i,tiles=words(at(p,n*2)),x=xs[:n],y=ys[:n]))
(A/'tables/build.json').write_text(json.dumps(dict(buildings=build,costs=words(at(0x01886e,32)))))
