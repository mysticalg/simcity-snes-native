"""Decode original history strings from DATA_02B8B4 and DATA_02BAD9."""
from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1]
source=(root/'research/disassembly/Routine_Macros_SIMC.asm').read_text()
block=source.split('DATA_02B8B4:\n',1)[1].split('DATA_02BAB9:',1)[0]
data=bytes(int(h,16) for h in re.findall(r'\$([0-9A-F]{2})(?![0-9A-F])',block))
table=source.split('DATA_02BAD9:\n',1)[1].split('CODE_02BB23:',1)[0]
offsets=[int(h,16) for h in re.findall(r'\$([0-9A-F]{4})',table)][16:]
def character(value):
 if value<26:return chr(65+value)
 if 0x30<=value<=0x49:return chr(97+value-0x30)
 if 0x20<=value<=0x29:return chr(48+value-0x20)
 return {0x1f:' ',0xfe:' ',0x2c:'.',0x1c:',',0x1e:"'"}[value]
records=[]
for i,offset in enumerate(offsets):
 end=data.index(255,offset)
 records.append({'id':i,'offset':offset,'text':' '.join(''.join(character(v) for v in data[offset:end]).split())})
(root/'assets/tables/history.json').write_text(json.dumps({'source':'DATA_02B8B4 / DATA_02BAD9; history indices 16..36','records':records},indent=2)+'\n')
