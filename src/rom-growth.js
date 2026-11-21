// Source-derived residential decision points from CODE_03937A.
// The ROM's random words are injected so the branch logic can be tested without
// claiming that the browser RNG reproduces the ROM's $0CCD..$0CDB state.
export const signed16 = value => (value << 16) >> 16;
const word = value => value & 0xffff;

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
