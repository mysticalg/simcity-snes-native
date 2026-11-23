// Defer glows only across building draws whose footprints cannot touch them.
// Keep the original glow order and exact floating-point alpha. A one-cell
// border conservatively covers each source canvas's four-pixel glow margin.
export class PhotoGlowBatch{
 constructor(){this.width=0;this.height=0;this.epoch=0;this.marks=new Uint32Array();this.queue=[];this.count=0;this.batches=0;this.draws=0;}
 begin(width,height){if(this.width!==width||this.height!==height){this.width=width;this.height=height;this.marks=new Uint32Array(width*height);this.epoch=0;this.queue.length=0;}this.count=0;this.batches=0;this.draws=0;this.nextEpoch();}
 nextEpoch(){this.epoch=(this.epoch+1)>>>0;if(!this.epoch){this.marks.fill(0);this.epoch=1;}}
 inside(b){return [b.x,b.y,b.width,b.height].every(Number.isInteger)&&b.x>=0&&b.y>=0&&b.width>0&&b.height>0&&b.x+b.width<=this.width&&b.y+b.height<=this.height;}
 before(ctx,b){if(!this.count)return;if(!this.inside(b)){this.flush(ctx);return;}for(let y=b.y;y<b.y+b.height;y++)for(let x=b.x;x<b.x+b.width;x++)if(this.marks[y*this.width+x]===this.epoch){this.flush(ctx);return;}}
 add(canvas,x,y,alpha,b){const at=this.count;this.queue[at]=canvas;this.queue[at+1]=x;this.queue[at+2]=y;this.queue[at+3]=alpha;this.count+=4;for(let yy=Math.max(0,b.y-1);yy<Math.min(this.height,b.y+b.height+1);yy++)for(let xx=Math.max(0,b.x-1);xx<Math.min(this.width,b.x+b.width+1);xx++)this.marks[yy*this.width+xx]=this.epoch;}
 flush(ctx){if(!this.count)return;const alpha=ctx.globalAlpha,operation=ctx.globalCompositeOperation;ctx.globalCompositeOperation='screen';for(let i=0;i<this.count;i+=4){ctx.globalAlpha=this.queue[i+3];ctx.drawImage(this.queue[i],this.queue[i+1],this.queue[i+2]);this.draws++;}ctx.globalAlpha=alpha;ctx.globalCompositeOperation=operation;this.count=0;this.batches++;this.nextEpoch();}
}
