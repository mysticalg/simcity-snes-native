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
// CODE_03B627: cycle eight problem slots until100 accepted responses or600
// attempts. Slot7 is the zero-filled spare, and still consumes random draws.
export function pollRomProblems(problems,nextBounded){
 const votes=Array(8).fill(0);let total=0,attempts=0,index=0;
 while(total<100&&attempts<600){if(nextBounded(300)<word(problems[index]||0)){votes[index]++;total++;}index=(index+1)&7;attempts++;}
 const selected=new Set(),worst=[];
 for(let n=0;n<4;n++){
  let best=0,winner=7;for(let i=0;i<7;i++)if(!selected.has(i)&&votes[i]>=best){best=votes[i];winner=i;}
  if(best){selected.add(winner);worst.push({id:winner,votes:best});}else worst.push({id:7,votes:0});
 }
 return {votes,worst,total,attempts};
}
// CODE_03B824:100 fresh bounded draws, after score calculation.
export function pollRomApproval(score,nextBounded){let approve=0;for(let i=0;i<100;i++)if(nextBounded(1000)<word(score))approve++;return {approve,disapprove:100-approve};}
