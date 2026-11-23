// Integer cells whose pixels can intersect a tile-aligned capture. Keep neighbor
// reads in the original map: this limits drawing, not the terrain calculation.
export function tileDrawBounds(width,height,bounds){
 if(!bounds)return {x0:0,y0:0,x1:width,y1:height};
 const x0=Math.min(width,Math.max(0,Math.floor(bounds.x))),y0=Math.min(height,Math.max(0,Math.floor(bounds.y)));
 return {x0,y0,x1:Math.max(x0,Math.min(width,Math.ceil(bounds.x+bounds.width))),y1:Math.max(y0,Math.min(height,Math.ceil(bounds.y+bounds.height)))};
}
