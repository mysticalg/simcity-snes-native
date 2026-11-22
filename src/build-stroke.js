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

// Zone counts, not tile counts: each R/C/I zone occupies 3x3 tiles.
// Neighboring blocks share their one-tile border corridor.
export function zoneBlockLayout(from,to,columns=3,rows=3,courtyard=true){
 columns=Math.max(1,Math.min(12,Math.trunc(columns)||1));rows=Math.max(1,Math.min(12,Math.trunc(rows)||1));
 const left=Math.min(from.x,to.x),top=Math.min(from.y,to.y),strideX=columns*3+1,strideY=rows*3+1;
 const across=Math.max(1,Math.floor(Math.abs(to.x-from.x)/strideX)),down=Math.max(1,Math.floor(Math.abs(to.y-from.y)/strideY)),zones=[],roads=new Map();
 for(let by=0;by<down;by++)for(let bx=0;bx<across;bx++){
  const x0=left+bx*strideX,y0=top+by*strideY;
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++)if(!courtyard||x===0||y===0||x===columns-1||y===rows-1)zones.push({x:x0+1+x*3,y:y0+1+y*3});
  const add=(x,y)=>roads.set(x+','+y,{x,y});
  for(let x=0;x<=strideX;x++){add(x0+x,y0);add(x0+x,y0+strideY);}
  for(let y=0;y<=strideY;y++){add(x0,y0+y);add(x0+strideX,y0+y);}
 }
 return {zones,roads:[...roads.values()],blocks:across*down,columns,rows,width:across*strideX+1,height:down*strideY+1};
}
