import wave,struct,json
from pathlib import Path
root=Path('outputs/simcity/assets/audio'); info=[]
for p in sorted(root.glob('*.brr')):
 data=p.read_bytes();out=[];p1=p2=0
 assert len(data)%9==0
 for j in range(0,len(data),9):
  head=data[j];shift=head>>4;f=(head>>2)&3
  for byte in data[j+1:j+9]:
   for n in [byte>>4,byte&15]:
    n=n-16 if n&8 else n
    s=(n<<shift)>>1 if shift<=12 else n&~0x7ff
    if f==1:s+=(p1>>1)+((-p1)>>5)
    elif f==2:s+=p1-(p2>>1)+((p2>>1)>>4)+((-3*p1)>>6)
    elif f==3:s+=p1-(p2>>1)+((-13*p1)>>7)+((3*(p2>>1))>>4)
    s=max(-32768,min(32767,s));s=((s*2+32768)&65535)-32768
    out.append(s);p2,p1=p1,s
 with wave.open(str(p.with_suffix('.wav')),'wb') as w:
  w.setparams((1,2,32000,len(out),'NONE','not compressed'));w.writeframes(struct.pack('<'+'h'*len(out),*out))
 info.append(dict(name=p.stem,samples=len(out),seconds=len(out)/32000,loop=bool(data[-9]&2)))
(root/'samples.json').write_text(json.dumps(info,indent=2))
print('Decoded',len(info),'BRR samples')
