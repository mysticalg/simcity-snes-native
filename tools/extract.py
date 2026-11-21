"""Extract the user's USA ROM using Yoshifanatic1's documented boundaries.
LC_LZ5 translation follows CODE_0090DD..00926D, not a generic guess.
"""
from pathlib import Path
import re,json,hashlib,sys
ROOT=Path(__file__).resolve().parents[1]
ROM=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT.parents[1]/'work/extracted/SimCity (USA).sfc'
SOURCE=ROOT.parents[1]/'work/disassembly/SIMC/AsarScripts/AssetPointersAndFiles.asm'
b=ROM.read_bytes()
assert hashlib.md5(b).hexdigest()=='23715fc7ef700b3999384d5be20f4db5'
def lorom(a): return ((a>>16)&0x7f)*0x8000+(a&0x7fff)
def decompress(src):
 out=bytearray(); p=0
 while True:
  h=src[p];p+=1
  if h==255: return bytes(out),p
  cmd=h>>5; n=(h&31)+1
  if cmd==7:
   cmd=(h>>2)&7;n=(((h&3)<<8)|src[p])+1;p+=1
  if cmd==0:out.extend(src[p:p+n]);p+=n
  elif cmd==1:out.extend([src[p]]*n);p+=1
  elif cmd==2:
   pair=src[p:p+2];p+=2;out.extend(pair[i&1] for i in range(n))
  elif cmd==3:
   start=src[p];p+=1;out.extend((start+i)&255 for i in range(n))
  else:
   if cmd<6:q=src[p]|src[p+1]<<8;p+=2
   else:q=len(out)-src[p];p+=1
   for i in range(n):
    assert 0<=q<len(out),(cmd,q,len(out),p)
    out.append(out[q]^(255 if cmd&1 else 0));q+=1
  assert len(out)<=0x20000
text=SOURCE.read_text(); manifest=[]
sections={'GFX':'graphics','Tilemaps':'tilemaps','Palettes':'palettes','Map':'maps','CompressedSPCData':'audio-packed'}
for section,folder in sections.items():
 body=text.split(section+'PointersStart:')[1].split(section+'PointersEnd:')[0]
 for a,z,name in re.findall(r'dl \$([0-9A-F]+),\$([0-9A-F]+),(\w+),',body):
  start,end=map(lambda s:int(s,16),(a,z));raw=b[lorom(start):lorom(end)]
  filename=re.search(r'^'+name+r':\s*db "([^"]+)"',text,re.M)[1]
  packed=filename.endswith('.lz5'); data,used=decompress(raw) if packed else (raw,len(raw))
  path=ROOT/'assets'/folder/(name+'.bin');path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
  if packed:(path.with_suffix('.lz5')).write_bytes(raw)
  manifest.append(dict(name=name,category=folder,start=f'{start:06X}',end=f'{end:06X}',packed=packed,stored=len(raw),consumed=used,size=len(data),path=path.relative_to(ROOT).as_posix(),sha256=hashlib.sha256(data).hexdigest()))
  print(name,len(raw),'->',len(data))
# SPC transfer blocks: each decompressed piece contains length/address/data chunks, terminated by length zero.
aram=bytearray(0x10000); transfers=[]
combined=b''.join((ROOT/'assets/audio-packed'/f'{name}.bin').read_bytes() for name in ['CompressedSPCBlock1','CompressedSPCBlock2'])
for name in ['combined']:
 data=combined;p=0
 while p+4<=len(data):
  n=int.from_bytes(data[p:p+2],'little');addr=int.from_bytes(data[p+2:p+4],'little');p+=4
  if n==0:break
  assert addr+n<=0x10000 and p+n<=len(data),(name,n,addr,p)
  aram[addr:addr+n]=data[p:p+n];p+=n;transfers.append(dict(block=name,address=addr,size=n))
(ROOT/'assets/audio').mkdir(exist_ok=True);(ROOT/'assets/audio/aram.bin').write_bytes(aram)
for section in ['Music','UnknownSPCData','BRR']:
 body=text.split(section+'PointersStart:')[1].split(section+'PointersEnd:')[0]
 for a,z,name in re.findall(r'dl \$([0-9A-F]+),\$([0-9A-F]+),(\w+),',body):
  # Extractor pointers use linear LoROM positions in its temporary SPC image, not SNES ROM bank addresses.
  start,end=lorom(int(a,16)),lorom(int(z,16)); data=combined[start:end]
  if section=='BRR':
   sample=int(name[-2:],16); directory=0x3500+sample*4; addr=int.from_bytes(aram[directory:directory+2],'little'); stop=next(j+9 for j in range(addr,65528,9) if aram[j]&1); data=bytes(aram[addr:stop])
  path=ROOT/'assets/audio'/(name+('.brr' if section=='BRR' else '.bin'));path.write_bytes(data)
  manifest.append(dict(name=name,category='audio',start=a,end=z,size=len(data),path=path.relative_to(ROOT).as_posix(),sha256=hashlib.sha256(data).hexdigest()))
  # BRR pointers include four transfer-terminator bytes after the final sample; use actual ARAM directory and BRR end bits instead.
(ROOT/'assets/manifest.json').write_text(json.dumps(dict(romSHA256=hashlib.sha256(b).hexdigest(),assets=manifest,spcTransfers=transfers),indent=2))
print('SPC transfers',transfers)


