import {FAX_ASSETS,faxAssetPath,faxScene,faxFrame,faxAppearance} from './rom-fax.js?v=fax-53';
let filesPromise;const scenes=new Map();
async function sceneFor(screen){
 if(!scenes.has(screen)){
  filesPromise??=Promise.all(Object.keys(FAX_ASSETS).map(async name=>{const response=await fetch(new URL('../'+faxAssetPath(name),import.meta.url));if(!response.ok)throw Error('Fax graphics unavailable');return [name,new Uint8Array(await response.arrayBuffer())];})).then(Object.fromEntries).catch(error=>{filesPromise=null;throw error;});
  scenes.set(screen,filesPromise.then(files=>faxScene(files,screen)).catch(error=>{scenes.delete(screen);throw error;}));
 }
 return scenes.get(screen);
}
export function mountFax(container){
 const canvas=container.querySelector('[data-native-fax]');if(!canvas)return null;
 const screen=Number(canvas.dataset.nativeFax),animate=canvas.dataset.faxAnimate==='1'&&!matchMedia('(prefers-reduced-motion: reduce)').matches,ctx=canvas.getContext('2d',{alpha:false});
 let active=true,ready=false,error=null,scene=null,image=null,start=0,extra=0,raf=0,state=null;
 const visible=()=>active&&canvas.isConnected&&!canvas.closest('#modal')?.classList.contains('hidden');
 const dispose=()=>{active=false;cancelAnimationFrame(raf);raf=0;scene=null;image=null;};
 function draw(now){
  if(!visible()){dispose();return;}if(!ready)return;
  // The first RAF timestamp can precede a promise's initialization time
  // within that display frame. It still represents fax frame zero.
  const next=faxAppearance(animate?Math.max(0,Math.floor((now-start+extra)*60/1000)):137);
  if(next.frame!==state?.frame){state=next;faxFrame(scene,state.scroll,state.forcedBlank?0:state.brightness,image.data);ctx.putImageData(image,0,0);canvas.dataset.frame=String(state.frame);}
 }
 function tick(now){draw(now);if(active&&!state?.complete)raf=requestAnimationFrame(tick);else raf=0;}
 sceneFor(screen).then(value=>{if(!visible()){dispose();return;}scene=value;image=ctx.createImageData(256,224);ready=true;start=performance.now();canvas.dataset.ready='true';tick(start);}).catch(e=>{error=e.message;canvas.hidden=true;});
 return {dispose,advance(ms){if(active&&ready&&animate&&Number.isFinite(ms)&&ms>=0){extra+=ms;draw(performance.now());}},status(){return visible()?{screen,ready,error,...state}:null;}};
}
