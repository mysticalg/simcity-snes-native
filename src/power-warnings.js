// Visible status derives from simulation power, independently of census size.
export function unpoweredBuildings(city){return city.zones.filter(z=>z.type>=5&&z.type<=14&&z.id!==0x27c&&z.id!==0x28c&&!city.power[z.i]);}
export function drawPowerWarnings(ctx,city,visible=true){
 if(!visible)return;
 for(const z of unpoweredBuildings(city)){
  const x=z.x*8,y=z.y*8;ctx.fillStyle='#ffffff';ctx.fillRect(x-2,y-3,13,15);ctx.fillStyle='#151515';ctx.fillRect(x-1,y-2,11,13);
  ctx.fillStyle='#ffe34d';ctx.beginPath();ctx.moveTo(x+5,y-1);ctx.lineTo(x+1,y+5);ctx.lineTo(x+4,y+5);ctx.lineTo(x+2,y+10);ctx.lineTo(x+9,y+3);ctx.lineTo(x+5,y+3);ctx.closePath();ctx.fill();
 }
}
