// Original animation transfers replace VRAM tiles $360..$3FF. Other map
// graphics stay valid until the map, overlay colour or seasonal palette changes.
export class CityLayerCache{
 begin(city,table,atlasKey,paletteKey){
  if(this.city!==city||this.ids?.length!==city.map.length){this.city=city;this.table=table;this.ids=new Uint16Array(city.map.length).fill(65535);this.colors=[];this.epochs=new Uint32Array(city.map.length);this.paletteKey=null;}
  if(this.paletteKey!==paletteKey){this.ids.fill(65535);this.paletteKey=paletteKey;}
  if(this.atlasKey!==atlasKey){this.atlasKey=atlasKey;this.epoch=(this.epoch||0)+1;}
 }
 dirty(index,id,color){
  const animated=(this.table.top[id]&1023)>=0x360||(this.table.bottom[id]&1023)>=0x360;
  if(this.ids[index]===id&&this.colors[index]===color&&(!animated||this.epochs[index]===this.epoch))return false;
  this.ids[index]=id;this.colors[index]=color;this.epochs[index]=this.epoch;return true;
 }
}
