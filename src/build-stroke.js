// Cardinal staircase keeps network strokes connected even on diagonal drags.
export function strokeCells(from,to){
 const cells=[{...from}];let x=from.x,y=from.y;
 const dx=Math.abs(to.x-x),dy=Math.abs(to.y-y),sx=Math.sign(to.x-x),sy=Math.sign(to.y-y);let error=dx-dy;
 while(x!==to.x||y!==to.y){const twice=2*error;if(twice>-dy&&x!==to.x){error-=dy;x+=sx;cells.push({x,y});}if(twice<dx&&y!==to.y){error+=dx;y+=sy;cells.push({x,y});}}
 return cells;
}

export function shapeCells(from,to,mode='line',spacing=4){
 if(mode==='line'||mode==='freehand')return strokeCells(from,to);
 const left=Math.min(from.x,to.x),right=Math.max(from.x,to.x),top=Math.min(from.y,to.y),bottom=Math.max(from.y,to.y),cells=[];
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
  const edge=x===left||x===right||y===top||y===bottom;
  if(mode==='filled'||edge||(mode==='grid'&&((x-left)%spacing===0||(y-top)%spacing===0)))cells.push({x,y});
 }
 return cells;
}
