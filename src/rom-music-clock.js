// SPC 164D/1657/1669/166E and shared tail 153D..1577. Immediate setters
// clear the fractional byte but deliberately do not cancel an existing fade.
export function createSpcGlobals(){return {tempoQ8:32*256,masterQ8:192*256,globalTranspose:0,instrumentBase:0,tempoFade:{remaining:0},masterFade:{remaining:0}};}
export function applySpcGlobal(s,command){
 const {opcode,value,ticks}=command;
 if(opcode===0xe5)s.masterQ8=value*256;
 else if(opcode===0xe7)s.tempoQ8=value*256;
 else if(opcode===0xe9)s.globalTranspose=value;
 else if(opcode===0xfa)s.instrumentBase=value;
 else if(opcode===0xe6||opcode===0xe8){const key=opcode===0xe6?'master':'tempo',current=s[key+'Q8'];s[key+'Fade']={remaining:ticks,target:value,step:ticks?Math.trunc((value-(current>>>8))*256/ticks):0};}
 else throw Error('Unsupported global SPC command '+opcode.toString(16));
}
export function stepSpcGlobals(s){
 for(const key of ['tempo','master']){const f=s[key+'Fade'];if(f.remaining){s[key+'Q8']=--f.remaining?(s[key+'Q8']+f.step)&65535:f.target*256;}}
 return {tempo:s.tempoQ8>>>8,masterVolume:s.masterQ8>>>8,globalTranspose:s.globalTranspose};
}
function segment(tempos,phase){const pulses=new Uint32Array(tempos.length+1),phases=new Uint8Array(tempos.length+1);phases[0]=phase;for(let i=0;i<tempos.length;i++){const tempo=tempos[i];if(!tempo)throw Error('SPC zero tempo stalls music');const count=Math.ceil((256-phase)/tempo);phase=(phase+count*tempo)&255;pulses[i+1]=pulses[i]+count;phases[i+1]=phase;}return {pulses,phases};}
export function createSpcClock(tempos,loop){
 const base=segment(tempos,0),end=tempos.length;
 if(!loop||loop.endTick!==end||loop.startTick>=end)throw Error('A complete SPC loop is required');
 const initial=base.phases[end];return {...base,tempos:Uint8Array.from(tempos),loop:{...loop},prefixes:new Map(),loopPhases:[initial],loopPulses:[0],seen:new Map([[initial,0]]),cycle:null};
}
// An order-list zero terminates music (CODE_1453 -> CODE_13AD), rather than
// restarting the last pattern. Keep its final phase for the exact end time.
export function createSpcFiniteClock(tempos){if(!tempos.length)throw Error('Empty SPC music');return {...segment(tempos,0),tempos:Uint8Array.from(tempos),loop:null};}
function prefix(clock,phase){let p=clock.prefixes.get(phase);if(!p){p=segment(clock.tempos.subarray(clock.loop.startTick,clock.loop.endTick),phase);clock.prefixes.set(phase,p);}return p;}
function boundary(clock,n){
 while(clock.loopPhases.length<=n&&!clock.cycle){const i=clock.loopPhases.length-1,p=prefix(clock,clock.loopPhases[i]),last=p.phases.at(-1),next=i+1;clock.loopPhases.push(last);clock.loopPulses.push(clock.loopPulses[i]+p.pulses.at(-1));if(clock.seen.has(last))clock.cycle={start:clock.seen.get(last),end:next};else clock.seen.set(last,next);}
 if(n<clock.loopPhases.length)return {phase:clock.loopPhases[n],pulses:clock.loopPulses[n]};
 const {start,end}=clock.cycle,length=end-start,cycles=Math.floor((n-start)/length),i=start+(n-start)%length;return {phase:clock.loopPhases[i],pulses:clock.loopPulses[i]+cycles*(clock.loopPulses[end]-clock.loopPulses[start])};
}
// Relative music-tick zero has phase zero, matching the earlier constant-tempo
// scheduler. Loop-phase tables are bounded by the 256 possible accumulator bytes.
export function spcClockPosition(clock,tick){
 if(!Number.isSafeInteger(tick)||tick<0)throw Error('Invalid SPC tick');const end=clock.tempos.length;
 if(tick<end)return {pulses:clock.pulses[tick],phase:clock.phases[tick],tempo:clock.tempos[tick]};
 if(!clock.loop){if(tick!==end)throw Error('SPC tick beyond finite music');return {pulses:clock.pulses[end],phase:clock.phases[end],tempo:0};}
 const delta=tick-end,length=clock.loop.endTick-clock.loop.startTick,b=boundary(clock,Math.floor(delta/length)),i=delta%length,p=prefix(clock,b.phase);
 return {pulses:clock.pulses[end]+b.pulses+p.pulses[i],phase:p.phases[i],tempo:clock.tempos[clock.loop.startTick+i]};
}
export const spcClockSeconds=(clock,tick)=>spcClockPosition(clock,tick).pulses*.002;
