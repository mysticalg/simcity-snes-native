// Road vehicles advance in fixed world frames: render frequency never caps game speed.
const hash=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return((n^(n>>>16))>>>0)/4294967296;};
export function updateRoadCars(state,city,enabled=true,quality='high'){
 const frame=Math.floor(city.civic.busFrame||0),width=city.width||120;
 if(!enabled){state.cars=[];state.trafficFrame=frame;return;}
 const roads=state.roads,load=roads.reduce((s,i)=>s+(city.traffic?.[i]||0)/240,0),count=roads.length&&(city.population||load)?Math.min(quality==='low'?48:128,Math.max(1,Math.round(load*.6+city.population/250))):0;
 state.cars=state.cars.filter(c=>city.flags[city.map[c.i]&1023]&64).slice(0,count);
 const busy=roads.filter(i=>(city.traffic?.[i]||0)>=100);
 while(state.cars.length<count){const n=state.cars.length,pool=busy.length&&n%3?busy:roads,i=pool[Math.floor(hash(n+77)*pool.length)];state.cars.push({i,x:i%width*8+4,y:Math.floor(i/width)*8+4,previous:-1,target:null,angle:0,heading:0,color:Math.floor(hash(n+791)*6),seed:n+1});}
 const elapsed=Math.max(0,frame-(state.trafficFrame??frame));state.trafficFrame=frame;
 const neighbors=i=>[i>=width?i-width:-1,i%width<width-1?i+1:-1,i+width<city.map.length?i+width:-1,i%width?i-1:-1].filter(n=>n>=0&&(city.flags[city.map[n]&1023]&64));
 for(let tick=0;tick<elapsed;tick++)for(const car of state.cars){let distance=(12-(city.traffic?.[car.i]||0)/240*7)/60;for(let step=0;step<4&&distance>0;step++){
  if(car.target===null){let choices=neighbors(car.i).filter(i=>i!==car.previous);if(!choices.length)choices=neighbors(car.i);if(!choices.length)break;car.seed=(Math.imul(car.seed,1664525)+1013904223)>>>0;car.target=choices[car.seed%choices.length];}
  const tx=car.target%width*8+4,ty=Math.floor(car.target/width)*8+4,dx=tx-car.x,dy=ty-car.y,len=Math.hypot(dx,dy);if(len<.001){car.previous=car.i;car.i=car.target;car.target=null;continue;}
  car.angle=Math.atan2(dy,dx);const delta=Math.atan2(Math.sin(car.angle-car.heading),Math.cos(car.angle-car.heading));car.heading+=delta*.2;const move=Math.min(len,distance);car.x+=dx/len*move;car.y+=dy/len*move;distance-=move;
 }}
}
export function drawRoadCars(ctx,state,view,night=0,headlights){const visible=(px,py,pad=8)=>px>=view.x*8-pad&&px<(view.x+view.width)*8+pad&&py>=view.y*8-pad&&py<(view.y+view.height)*8+pad;let cars=0;
 for(const car of state.cars){if(!visible(car.x,car.y,8))continue;ctx.save();ctx.translate(car.x+Math.sin(car.heading)*1.2,car.y-Math.cos(car.heading)*1.2);ctx.rotate(car.heading);ctx.globalAlpha=.25;ctx.fillStyle='#07101a';ctx.fillRect(-2.4,-.7,4.8,2.2);ctx.globalAlpha=1;ctx.fillStyle=['#d6dbd7','#d75447','#4c93c3','#e7b64b','#65a48b','#a692c0'][car.color];ctx.beginPath();ctx.roundRect(-2.2,-.9,4.4,1.8,.45);ctx.fill();ctx.fillStyle='#355261';ctx.fillRect(.5,-.7,.65,1.4);ctx.fillRect(-1.3,-.65,.5,1.3);ctx.fillStyle='rgba(246,251,255,.55)';ctx.fillRect(-.6,-.55,1,.3);ctx.fillStyle=night?'#fff5bc':'#d8e7e9';ctx.fillRect(1.8,-.8,.4,.4);ctx.fillRect(1.8,.4,.4,.4);ctx.fillStyle=night?'#ff574b':'#9d3b32';ctx.fillRect(-2.2,-.8,.4,.4);ctx.fillRect(-2.2,.4,.4,.4);if(night){ctx.globalCompositeOperation='screen';headlights?.(ctx,night);}ctx.restore();cars++;}
 return cars;
}
