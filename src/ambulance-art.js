import {CIVIC_ART_EXTRAS} from './civic-textures.js?v=health-care-34';
const image=typeof Image==='function'?new Image():null;if(image)image.src=CIVIC_ART_EXTRAS.ambulance;
let frames=null,draws=0;
function prepare(){if(frames)return true;if(!image?.complete||!image.naturalWidth)return false;
 frames=[0,1,2].map(phase=>{const canvas=document.createElement('canvas');canvas.width=32;canvas.height=16;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,32,16);if(phase){const color=phase===1?'#ff4a46':'#5ebfff',y=phase===1?5.5:10;ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=4;ctx.beginPath();ctx.arc(22,y,1.1,0,Math.PI*2);ctx.fill();}return canvas;});return true;
}
export function drawAmbulanceSprite(ctx,x,y,angle,phase,responding){if(!prepare())return false;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(frames[responding?(phase&1)+1:0],-4,-2,8,4);ctx.restore();draws++;return true;}
export function ambulanceArtStats(){return {ready:!!image?.complete&&!!image.naturalWidth,canvases:frames?.length||0,draws};}
