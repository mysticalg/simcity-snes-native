// City-local preferences survive ordinary saves, region snapshots and browser refresh.
export const SHARING_OPTIONS={demand:'RCI demand and commuting',power:'Electricity',water:'Water',services:'Health and waste services',goods:'Depot goods and resources',backgroundProduction:'Background industry and trade'};
export const sharingEnabled=(city,kind)=>city.regionalPolicy?.[kind]!==false;
export function normalizeSharing(value){return Object.fromEntries(Object.keys(SHARING_OPTIONS).map(k=>[k,value?.[k]!==false]));}
