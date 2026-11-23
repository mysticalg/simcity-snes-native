// SNES CODE_01B3F3 queues $0CA5 + 1 on music port 0. All six city
// promotion themes now retain their original order cycles and commands.
export function cityMusicTrack(category=0,promotionStage=0){
 // The original promotion stage is retained when population later declines.
 const stage=Math.max(Number.isInteger(category)?category:0,Number.isInteger(promotionStage)?promotionStage:0);
 return 1+Math.min(5,Math.max(0,stage));
}
