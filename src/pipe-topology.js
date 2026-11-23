// Internal, read-only connectivity shared by water and sewage. Exactly one
// current topology per city; never a hash-only or revision-only cache.
const cache=new WeakMap();
export function pipeTopology(city,nodes){
 const width=city.width||120,length=nodes.length,old=cache.get(city);
 if(old?.width===width&&old.snapshot.length===length){
  let equal=true;for(let i=0;i<length;i++)if(old.snapshot[i]!==Number(!!nodes[i])){equal=false;break;}
  if(equal)return old.value;
 }
 const snapshot=Uint8Array.from(nodes,n=>Number(!!n)),labels=new Int32Array(length).fill(-1),components=[];
 const visit=(i,id,cells)=>{if(i>=0&&snapshot[i]&&labels[i]<0){labels[i]=id;cells.push(i);}};
 for(let i=0;i<length;i++){
  if(!snapshot[i]||labels[i]>=0)continue;
  const id=components.length,cells=[i];components.push(cells);labels[i]=id;
  // The growing component is also the BFS queue. Preserve the old worker's
  // row-major seeds and N/E/S/W discovery order, including regional roots.
  for(let at=0;at<cells.length;at++){
   const j=cells[at];visit(j>=width?j-width:-1,id,cells);visit(j%width<width-1?j+1:-1,id,cells);
   visit(j+width<length?j+width:-1,id,cells);visit(j%width?j-1:-1,id,cells);
  }
  Object.freeze(cells);
 }
 const value=Object.freeze({labels,components:Object.freeze(components)});
 cache.set(city,{width,snapshot,value});return value;
}
