// Turbo visual flight plans. Distances/speeds are game units, not aircraft specs.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function flightRandom(seed){let n=Math.imul(seed^(seed>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return ((n^(n>>>16))>>>0)/4294967296;}
const point=(x,y,altitude,speed,phase,runway=false)=>({x,y,altitude,speed,phase,runway});
function curve(route,from,to,tangentIn,tangentOut,speed,phase,steps=12){
 const distance=Math.hypot(to.x-from.x,to.y-from.y),reach=Math.min(phase==='taxi'?2.5:Infinity,Math.max(2,distance*.34)),c1={x:from.x+tangentIn.x*reach,y:from.y+tangentIn.y*reach},c2={x:to.x-tangentOut.x*reach,y:to.y-tangentOut.y*reach};
 for(let n=1;n<=steps;n++){const t=n/steps,u=1-t;route.push(point(u*u*u*from.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*to.x,u*u*u*from.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*to.y,from.altitude+(to.altitude-from.altitude)*t,speed,phase));}
 return to;
}
function edge(width,height,side,seed){
 const along=.15+.7*flightRandom(seed),m=8;
 return side===0?{x:width*along,y:-m,dx:0,dy:1}:side===1?{x:width+m,y:height*along,dx:-1,dy:0}:side===2?{x:width*along,y:height+m,dx:0,dy:-1}:{x:-m,y:height*along,dx:1,dy:0};
}
function runwayTimes(first,route){let seconds=0,start=null,end=0,prior=first;for(const p of route){if(p.runway&&start===null)start=seconds;seconds+=Math.hypot(p.x-prior.x,p.y-prior.y)/p.speed;if(p.runway)end=seconds;prior=p;}return {start:start??0,end};}

export function flightMission(city,f,kind,arrival,id,sequence,frame,freeAfter,model){
 const width=city.width||120,height=city.height||100,b=f.bounds,air=model.speed,wind=Math.sin((city.climate?.direction??90)*Math.PI/180),direction=wind>=0?-1:1;
 const y=b.y+b.height*(f.id===992?.145:f.id===993?.18:.25),left=b.x+b.width*.15,right=b.x+b.width*.85,startX=direction>0?left:right,endX=direction>0?right:left;
 const gate=point(b.x+b.width*(.24+(Math.floor(sequence/2)%3)*.24),b.y+b.height*(f.id===992?.60:.65),0,1.2,'parked');
 const ordinal=Math.floor(sequence/2),side=(ordinal+f.i%4)%4,entry=edge(width,height,side,f.i+sequence*971),out=edge(width,height,(side+2)%4,f.i+sequence*431+17);
 const fix=point(startX-direction*18,y,.45,air*.8,'approach'),center={x:clamp(b.x+b.width/2-direction*12,15,width-15),y:clamp(y+(y<height/2?20:-20),12,height-12)},rx=10,ry=6,clockwise=ordinal%2?1:-1;
 const patrol=kind==='fighter',inbound=arrival&&!patrol;
 let loops=inbound&&ordinal%3===1?1:0,route,first,times;
 const make=()=>{
  route=[];
  if(inbound){
   first=point(entry.x,entry.y,1,air,'cruise');
   if(loops){const join=point(center.x+rx,center.y,1,air*.85,'holding');curve(route,first,join,{x:entry.dx,y:entry.dy},{x:0,y:clockwise},air,'cruise');
    for(let lap=0;lap<loops;lap++)for(let n=1;n<=24;n++){const angle=clockwise*n/24*Math.PI*2;route.push(point(center.x+rx*Math.cos(angle),center.y+ry*Math.sin(angle),1,air*.85,'holding'));}
    curve(route,route.at(-1),fix,{x:0,y:clockwise},{x:direction,y:0},air*.8,'approach');
   }else curve(route,first,fix,{x:entry.dx,y:entry.dy},{x:direction,y:0},air,'cruise');
  }else{
   first=gate;curve(route,first,point(startX,y,0,1.2,'taxi'),{x:0,y:-1},{x:direction,y:0},1.2,'taxi',8);for(const p of route.slice(-2))p.runway=true;
   route.push(point(endX,y,.12,air*.7,'takeoff',true));
   const climb=point(endX+direction*12,y,.8,air,'climb');curve(route,route.at(-1),climb,{x:direction,y:0},{x:direction,y:0},air,'climb',6);
   if(!patrol)curve(route,climb,point(out.x,out.y,1,air,'departure'),{x:direction,y:0},{x:-out.dx,y:-out.dy},air,'departure');
   else{const a=point(width*.25,height*.65,1,air,'patrol'),z=point(width*.7,height*.25,1,air,'patrol');curve(route,climb,a,{x:direction,y:0},{x:1,y:0},air,'patrol');curve(route,a,z,{x:1,y:0},{x:0,y:-1},air,'patrol');curve(route,z,fix,{x:0,y:-1},{x:direction,y:0},air*.8,'approach');}
  }
  if(inbound||patrol){route.push(point(startX-direction*5,y,.18,air*.7,'approach',true),point(startX+direction*2,y,0,air*.55,'landing',true),point(endX-direction*1.5,y,0,2,'landing',true));const exit=route.length;curve(route,route.at(-1),gate,{x:direction,y:0},{x:0,y:1},1.2,'taxi',8);for(const p of route.slice(exit,exit+2))p.runway=true;}
  times=runwayTimes(first,route);
 };
 make();while(inbound&&frame+times.start*60<freeAfter&&loops<4){loops++;make();}
 // If all holding slots are already booked, queue an arrival off-map or a
 // departure at its gate. Never freeze an aircraft on the visible final approach.
 const releaseFrame=frame+Math.max(0,Math.ceil(freeAfter-frame-times.start*60)),runwaySlot={start:Math.ceil(releaseFrame+times.start*60),end:Math.ceil(releaseFrame+times.end*60)};
 return {id,root:f.i,kind,arrival:arrival||patrol,x:first.x,y:first.y,altitude:first.altitude,heading:inbound?Math.atan2(entry.dy,entry.dx):direction>0?0:Math.PI,segment:0,route,phase:first.phase,entrySide:inbound?['north','east','south','west'][side]:null,holdingCircuits:loops,releaseFrame,runwaySlot,passengers:Math.min(model.passengers,Math.ceil(Math.max(0,city.population)/100)),cargo:Math.min(model.cargo,Math.ceil(Math.max(0,city.rci[2])*8))};
}

export function travelFlight(a,seconds){
 let left=seconds,turned=false;for(let n=0;n<16&&left>0&&a.segment<a.route.length;n++){
  const p=a.route[a.segment],dx=p.x-a.x,dy=p.y-a.y,distance=Math.hypot(dx,dy),duration=distance/p.speed;
  a.phase=p.phase;a.inRunway=!!p.runway;
  if(distance>.001&&!turned){turned=true;const target=Math.atan2(dy,dx),delta=Math.atan2(Math.sin(target-a.heading),Math.cos(target-a.heading)),turn=(a.altitude>.2?.7:1.8)*seconds;a.heading+=clamp(delta,-turn,turn);}
  if(duration<=left){a.x=p.x;a.y=p.y;a.altitude=p.altitude;a.segment++;left-=duration;}else{const fraction=left/duration;a.x+=dx*fraction;a.y+=dy*fraction;a.altitude+=(p.altitude-a.altitude)*fraction;left=0;}
 }
}
