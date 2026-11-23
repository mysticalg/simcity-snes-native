// SNES CODE_01B3F3 queues $0CA5 + 1 on music port 0. The first three
// category themes are translated; larger cities retain the City theme until
// their tempo/modulation commands are supported, rather than skipping bytes.
export function cityMusicTrack(category=0,promotionStage=0){
 // The original promotion stage is retained when population later declines.
 const stage=Math.max(Number.isInteger(category)?category:0,Number.isInteger(promotionStage)?promotionStage:0);
 return 1+Math.min(2,Math.max(0,stage));
}
