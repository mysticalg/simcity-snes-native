// Reports may notify without taking control of the player's build/pan gesture.
// Consume suppressed requests now; never queue a surprise jump for later.
export function consumeCameraFocus(city,{advisorsEnabled=true,building=false,panning=false}={}){
 const request=city.focusRequest;if(!request)return null;city.focusRequest=null;
 if(request.source==='helicopter-traffic'&&(!advisorsEnabled||building||panning))return null;
 return {x:request.x,y:request.y};
}
