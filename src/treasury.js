export const TREASURY_CAP=1_000_000_000_000;
export function treasuryAmount(value){const n=Number(value);return Number.isFinite(n)?Math.max(-Number.MAX_SAFE_INTEGER,Math.min(TREASURY_CAP,Math.trunc(n))):n===Infinity?TREASURY_CAP:0;}
