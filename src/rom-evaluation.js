const word=n=>n&65535;
const q8=(a,b)=>Math.floor(word(a)*word(b)/256)&65535;
// CODE_03B708..03B823. Preserve unsigned word wrap and the fire-service
// comparison against $1000 (4096), which differs from police's $03E8.
export function romCityScore({previous=500,problems,caps=[false,false,false],transport=32,police=1000,fire=1000,demand=[0,0,0]}){
 const sum=problems.slice(0,7).reduce((a,b)=>word(a+b),0);
 let target=Math.min(1000,(256-Math.min(256,Math.floor(sum/3)))*4);
 for(const capped of caps)if(capped)target=q8(target,218);
 if(word(transport)<32)target=word(target+word(transport)-32);
 if(word(police)<1000)target=q8(target,230+Math.floor(word(police)*256/10000));
 if(word(fire)<4096)target=q8(target,230+Math.floor(word(fire)*256/10000));
 for(const value of demand)if(word(value+1000)&32768)target=q8(target,218);
 target=Math.min(1000,target);const score=word(target+word(previous))>>>1;
 return {score,change:(word(score-previous)<<16)>>16,target};
}
// CODE_03B573 / 03B66A / 03B6BD / 03B6F7. Expanded browser planes
// represent the ROM's 60x50 byte fields; sample each cell once.
export function romCityProblems({crime=0,landValue=0,pollution,traffic,landValues,tax=7,rci=[0,0,0],fires=0},width=120,height=100){
 let pollutionSum=0,pollutionCount=0,trafficSum=0,trafficCount=0;
 for(let y=0;y<height;y+=2)for(let x=0;x<width;x+=2){const i=y*width+x,p=pollution[i];if(p){pollutionSum+=p;pollutionCount++;}if(landValues[i]){trafficSum+=traffic[i];trafficCount++;}}
 const meanPollution=pollutionCount?Math.floor(pollutionSum/pollutionCount):0,meanTraffic=trafficCount?Math.floor(trafficSum/trafficCount):0;
 const jobs=word(rci[1]+rci[2]),workers=word(jobs*8),residents=word(rci[0]);let unemployment=0;
 if(jobs&&workers<residents){const quotient=workers?Math.floor(residents*256/workers):0xffffffff;unemployment=Math.min(255,word(quotient-256));}
 const fireProblem=Math.min(255,word(word(fires*4)+word(fires)+((fires&0x4000)?1:0)));
 return [word(crime),meanPollution,q8(landValue,179),word(tax*10),q8(meanTraffic,614),unemployment,fireProblem];
}
