// Source-derived residential decision points from CODE_03937A.
// The ROM's random words are injected so the branch logic can be tested without
// claiming that the browser RNG reproduces the ROM's $0CCD..$0CDB state.
export const signed16 = value => (value << 16) >> 16;
const word = value => value & 0xffff;

// CODE_039137..0391DB partner check before zone dispatch. CPU byte offsets
// resolve to three map cells horizontally or three rows vertically.
export function repairMergedZone(map,x,y,width=120,height=100){
 const id=map[y*width+x]&1023;
 const rules={0x37a:[3,0,0x383,0x11c],0x383:[-3,0,0x37a,0x11c],0x38c:[0,3,0x395,0x11c],0x395:[0,-3,0x38c,0x11c],0x39e:[3,0,0x3a7,0x1eb],0x3a7:[-3,0,0x39e,0x1eb],0x3b0:[0,3,0x3b9,0x1eb],0x3b9:[0,-3,0x3b0,0x1eb]};
 const rule=rules[id];if(!rule)return false;
 const [dx,dy,partner,base]=rule,cx=x+dx,cy=y+dy;
 if(cx>=0&&cx<width&&cy>=0&&cy<height&&(map[cy*width+cx]&1023)===partner)return false;
 return stampZoneFootprint(map,x,y,base,width,height);
}

// CODE_0397C9/03985A. The USA routine repeatedly reads the first direction
// table entries (north); neither operand is indexed by X in CODE_03987F.
export function placeSmallHome(map,x,y,density,nextWord,nextBelow3,width=120,height=100){
  const offsets=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
  let best=0,selected=null;
  for(const [dx,dy] of offsets){
    const cx=x+dx,cy=y+dy;if(cx<0||cx>=width||cy<0||cy>=height)continue;
    const id=map[cy*width+cx]&1023;if(id!==0&&(id<0x80||id>=0x89))continue;
    const score=1+(cy>0&&(map[(cy-1)*width+cx]&1023)<0x60?4:0);
    if(score<best)continue;
    if(score===best&&(nextWord()&7)!==0)continue;
    best=score;selected=cy*width+cx;
  }
  if(selected===null)return false;
  map[selected]=0x89+3*(density&3)+nextBelow3();return true;
}

// CODE_039504: prefer the right-hand partner, then the lower partner.
export function mergeResidentialZone(map,x,y,width=120,height=100){
  if((map[y*width+x]&1023)!==0x120)return false;
  if(x+3<width&&(map[y*width+x+3]&1023)===0x120){
    const first=stampZoneFootprint(map,x,y,0x376,width,height);
    const second=stampZoneFootprint(map,x+3,y,0x37f,width,height);return first||second;
  }
  if(y+3<height&&(map[(y+3)*width+x]&1023)===0x120){
    const first=stampZoneFootprint(map,x,y,0x388,width,height);
    const second=stampZoneFootprint(map,x,y+3,0x391,width,height);return first||second;
  }
  return false;
}

// CODE_039940: reject blocked 3×3 sites, preserve each source map word's
// sign/high bit, and mark only the final cell with $4000.
export function stampZoneFootprint(map,x,y,baseTile,width=120,height=100){
  const cells=[];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const cx=x+dx,cy=y+dy;
    if(cx<0||cx>=width||cy<0||cy>=height)return false;
    const i=cy*width+cx,id=map[i]&0x03ff;
    if(id===0x007f||id===0x0364||id===0x0365||(id>=0x0028&&id<0x0080))return false;
    cells.push({i,offset:(dy+1)*3+dx+1});
  }
  for(const {i,offset} of cells){
    map[i]=(baseTile+offset)|(map[i]&0x8000)|(offset===8?0x4000:0);
  }
  return true;
}

// CODE_039468: density comes from the 8-bit difference between the two
// half-resolution source planes, with thresholds $1E/$50/$96.
export function residentialDensityBand(valueByte,penaltyByte){
  const value=valueByte&0xff,penalty=penaltyByte&0xff;
  if(value<penalty)return 0;
  const difference=value-penalty;
  if(difference<0x1e)return 0;
  if(difference<0x50)return 1;
  if(difference<0x96)return 2;
  return 3;
}

// DATA_03992B is the byte sequence 0,9,18,...,180. CODE_0398B8 indexes
// it with (density * 4 + populationBand). A zero-population residential tile
// wraps the population band to $FF; its byte is the following ROM byte at
// DATA_03992B+$FF (USA ROM CPU address $039A2A), not a JavaScript negative index.
function residentialDensityOffset(population,density){
  const band=((Math.trunc(population)/8|0)-1)&0xff;
  const index=((density&0xff)*4+band)&0xff;
  if(index===0xff)return 0x0a;
  if(index<=20)return index*9;
  throw new RangeError(`Unexpected CODE_0398B8 table index ${index}`);
}

export function residentialGrowthBase(population,density){
  return 0x95+residentialDensityOffset(population,density);
}

export function residentialDeclineFootprint(map,x,y,population,density,nextRandomBelow3=()=>0,width=120,height=100){
  const center=y*width+x;
  if(population===0)return false;
  if(population===16){
    map[center]=0x84;
    const homeBase=0x89+(density&3)*3;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(dx===0&&dy===0)continue;
      const i=(y+dy)*width+x+dx;
      if(x+dx<0||x+dx>=width||y+dy<0||y+dy>=height)continue;
      if((map[i]&0x03ff)===0x84)continue;
      const variety=Math.max(0,Math.min(2,Math.trunc(nextRandomBelow3())));
      map[i]=(map[i]&0xff00)|(homeBase+variety);
    }
    return true;
  }
  if(population>16){
    const stage=Math.max(0,Math.floor((population-24)/8));
    return stampZoneFootprint(map,x,y,0x95+9*((density&3)*4+stage),width,height);
  }
  let changed=false;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const cx=x+dx,cy=y+dy;
    if(cx<0||cx>=width||cy<0||cy>=height)continue;
    const i=cy*width+cx,id=map[i]&0xff;
    if(id>=0x89&&id<0x95){map[i]=(map[i]&0xff00)|0x80+(dy+1)*3+dx+1;return true;}
  }
  return changed;
}

function cmpNegative(a, b) {
  return ((word(a) - word(b)) & 0x8000) !== 0;
}

function sub16(a, b) {
  const aa = word(a), bb = word(b), result = word(aa - bb);
  const overflow = ((aa ^ bb) & (aa ^ result) & 0x8000) !== 0;
  return {result, overflow};
}

function add16(a, b) {
  const aa = word(a), bb = word(b), result = word(aa + bb);
  const overflow = (~(aa ^ bb) & (aa ^ result) & 0x8000) !== 0;
  return {result, overflow};
}

// CODE_0399D2: unsigned byte difference, clamp to 6000, scale by 32,
// then subtract 3000. Callers provide the two ROM value planes.
export function residentialLocalScore(valueByte, penaltyByte, enabled = true) {
  if (!enabled) return -3000;
  const difference = Math.max(0, (valueByte & 0xff) - (penaltyByte & 0xff));
  return Math.min(6000, difference * 32) - 3000;
}

// CODE_03937A adds $0BAD to the local score only when the map word at $0B87
// has bit 15 set; otherwise it substitutes $FE0C (-500).
export function residentialDemandScore(mapWord, localScore, residentialDemand) {
  if (!(word(mapWord) & 0x8000)) return -500;
  return signed16(word(localScore) + word(residentialDemand));
}

export function residentialUpdateGate(tileId, randomWord) {
  return (tileId & 0x3ff) === 0x84 || (word(randomWord) & 7) === 0;
}

// Mirrors CODE_03937A's signed threshold and random comparisons. `randomWords`
// supplies successive CODE_03907E values after the one-in-eight gate.
export function decideResidentialUpdate({tileId, gateWord, score, population, randomWords = [], nextRandomWord}) {
  if (!residentialUpdateGate(tileId, gateWord)) {
    return {action: 'none', reason: 'gate', randomsUsed: 0};
  }
  const s = word(score);
  let cursor = 0;
  const next = () => {
    const value = nextRandomWord ? nextRandomWord() : (randomWords[cursor] ?? 0);
    cursor++;
    return word(value);
  };

  // CMP #$FEA2 / BMI: the positive-growth test is skipped below -350.
  if (!cmpNegative(s, 0xfea2)) {
    const random = next();
    const {result, overflow} = sub16(s, 0x670c);
    // CMP random, then BVS/BMI. CMP changes N but leaves V from SBC intact.
    if (!overflow && !cmpNegative(result, random)) {
      if (population !== 0) return {action: 'grow', reason: 'positive-demand', randomsUsed: cursor};
      if ((next() & 3) === 0) return {action: 'special', reason: 'empty-zone-special', randomsUsed: cursor};
      return {action: 'grow', reason: 'positive-demand', randomsUsed: cursor};
    }
  }

  // CMP #$015E / BPL: only scores whose signed compare is below +350
  // proceed to the decay comparison.
  if (cmpNegative(s, 0x015e)) {
    const random = next();
    const {result, overflow} = add16(s, 0x670c);
    if (!overflow && cmpNegative(result, random)) {
      return {action: 'decline', reason: 'negative-demand', randomsUsed: cursor};
    }
  }
  return {action: 'none', reason: 'threshold', randomsUsed: cursor};
}
