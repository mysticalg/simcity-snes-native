// DATA_0096AE selects transition source; DATA_00960E/613 selects the
// following palette as target. Renderer uses target until fades are ported.
export const SEASON_SOURCE=[3,3,0,0,0,1,1,1,2,2,2,3];
export function cityPaletteForMonth(month){if(!Number.isInteger(month)||month<1||month>12)throw Error('Invalid city month');return (SEASON_SOURCE[month-1]+1)&3;}
