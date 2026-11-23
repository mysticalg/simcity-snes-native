// CODE_038BD1 / 038D29. Newest samples occupy index zero; 120 words
// represent ten years of months or 120 individual January observations.
export const GRAPH_SERIES=['residential','commercial','industrial','crime','pollution','finances'];
export const GRAPH_MONTH_ADDRESSES=[0x15fc0,0x160b0,0x161a0,0x16470,0x16290,0x16380];
export const GRAPH_YEAR_ADDRESSES=[0x16560,0x16650,0x16740,0x16a10,0x16830,0x16920];
const word=n=>n&65535;
// CODE_03C6A6 initializes finances to the break-even index $0080.
export function createRomGraphs(){return {version:1,monthly:Object.fromEntries(GRAPH_SERIES.map(k=>[k,Array(120).fill(k==='finances'?128:0)])),annual:Object.fromEntries(GRAPH_SERIES.map(k=>[k,Array(120).fill(k==='finances'?128:0)])),monthlyMax:[0,0,0],annualMax:[0,0,0],monthlyScale:0,longScale:0,crimeTrend:0,pollutionTrend:0,facilityDemand:[0,0]};}
function shift(planes){const peaks=GRAPH_SERIES.slice(0,3).map(k=>Math.max(...planes[k].slice(0,119)));for(const key of GRAPH_SERIES)planes[key].copyWithin(1,0,119);return peaks;}
function populations(rci){return [word(rci[0])>>>3,word(rci[1]),word(rci[2])];}
function trend(previous,value){const delta=(word(word(value)-word(previous))<<16)>>16;return word(word(previous)+Math.floor(delta/4));}
export function recordRomGraphMonth(state,{rci,crime=0,pollution=0,net=0,facilityCounts=[0,0]}){
 state.monthlyMax=shift(state.monthly);state.monthlyScale=Math.max(...state.monthlyMax);
 const values=populations(rci);for(let i=0;i<3;i++)state.monthly[GRAPH_SERIES[i]][0]=values[i];state.longScale=Math.max(state.longScale,...values);
 state.crimeTrend=trend(state.crimeTrend,crime);state.pollutionTrend=trend(state.pollutionTrend,pollution);
 state.monthly.crime[0]=Math.min(255,state.crimeTrend);state.monthly.pollution[0]=Math.min(255,state.pollutionTrend);
 const adjusted=word(word(net)+0x0a00);state.monthly.finances[0]=adjusted&0x8000?0:Math.min(255,Math.floor(adjusted/20));
 const residentialHigh=word(rci[0])>>>8;state.facilityDemand=facilityCounts.map(target=>residentialHigh===word(target)?0:residentialHigh>word(target)?1:-1);
 return state;
}
export function recordRomGraphYear(state,{rci}){
 state.annualMax=shift(state.annual);state.longScale=Math.max(...state.annualMax);
 const values=populations(rci);for(let i=0;i<3;i++)state.annual[GRAPH_SERIES[i]][0]=values[i];state.longScale=Math.max(state.longScale,...values);
 for(const key of GRAPH_SERIES.slice(3))state.annual[key][0]=state.monthly[key][0];return state;
}
