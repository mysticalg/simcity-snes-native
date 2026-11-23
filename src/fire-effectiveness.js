// Turbo balance: preserve the ROM service inputs and boost the final field once.
export const FIRE_EFFECTIVENESS=3;
export function boostFireCoverage(field){return Uint16Array.from(field,n=>Math.min(255,n*FIRE_EFFECTIVENESS));}
