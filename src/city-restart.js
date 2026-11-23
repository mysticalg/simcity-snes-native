// Player-requested bankruptcy recovery. Preserve geography; remove the city.
export function restartCity(previous,City,build=previous.build,flags=previous.flags){
 const terrain=Uint16Array.from(previous.map,word=>{const id=word&1023;return id>0&&id<40?id:0;});
 const city=new City(terrain,build,flags,{name:previous.name,scenario:previous.width===240?'FreeMegacity':'FreeCity',width:previous.width,height:previous.height,year:1900,difficulty:previous.difficulty,autoBudget:previous.autoBudget,disastersEnabled:previous.disastersEnabled,civicEnabled:previous.civicEnabled});
 city.elevation=Int8Array.from(previous.elevation);city.terraform=Uint8Array.from(previous.terraform);city.climate=structuredClone(previous.climate);city.refresh();return city;
}
export const RESTART_BACKUP_KEY='simcity.restartBackup.v1';
export function saveRestartBackup(storage,city,region=null){const record={format:'simcity-turbo-restart-backup',version:1,savedAt:Date.now(),city:city.serialize(),region};storage.setItem(RESTART_BACKUP_KEY,JSON.stringify(record));return record;}
export function readRestartBackup(storage){try{const r=JSON.parse(storage.getItem(RESTART_BACKUP_KEY)||'null');return r?.format==='simcity-turbo-restart-backup'&&r.version===1&&typeof r.city==='string'?r:null;}catch{return null;}}
