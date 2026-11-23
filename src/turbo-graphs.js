import {createRomGraphs,recordRomGraphMonth,recordRomGraphYear,GRAPH_SERIES} from './rom-graphs.js?v=graphs-44';
import {usesWideCensus} from './turbo-population.js?v=wide-census-39';

export function createCityGraphs(){return {...createRomGraphs(),monthlySamples:0,annualSamples:0,firstRecorded:null,lastRecorded:null,lastAnnualYear:null};}
// CODE_03894C consumes the newest monthly R/C/I graph words. Its R word is
// already divided by eight; the demand adapter accepts pre-division units.
export function cityGraphDemandHistory(state,fallback=[0,0,0]){return state.monthlySamples?[state.monthly.residential[0]*8,state.monthly.commercial[0],state.monthly.industrial[0]]:fallback;}
function widenPopulations(state,period,rci,cellCount){if(!usesWideCensus(cellCount))return;const values=[Math.floor(rci[0]/8),rci[1],rci[2]];for(let i=0;i<3;i++)state[period][GRAPH_SERIES[i]][0]=values[i];state.longScale=Math.max(state.longScale,...values);}
export function recordCityGraphMonth(state,input,date,cellCount=12000){
 recordRomGraphMonth(state,input);widenPopulations(state,'monthly',input.rci,cellCount);
 // Turbo finances can exceed a signed ROM word. Retain the original index's
 // break-even point and clipping without wrapping a large surplus/deficit.
 const net=Number.isFinite(input.net)?input.net:0;state.monthly.finances[0]=Math.max(0,Math.min(255,Math.floor((net+2560)/20)));
 if(usesWideCensus(cellCount)){const quota=Math.floor(input.rci[0]/256);state.facilityDemand=(input.facilityCounts||[0,0]).map(n=>quota===n?0:quota>n?1:-1);}
 state.monthlySamples=Math.min(120,state.monthlySamples+1);state.firstRecorded??={...date};state.lastRecorded={...date};return state;
}
export function recordCityGraphYear(state,input,year,cellCount=12000){recordRomGraphYear(state,input);widenPopulations(state,'annual',input.rci,cellCount);state.annualSamples=Math.min(120,state.annualSamples+1);state.lastAnnualYear=year;return state;}
export function meanGraphPollution(values,width=120,height=100){let sum=0,count=0;for(let y=0;y<height;y+=2)for(let x=0;x<width;x+=2){const value=values[y*width+x];if(value){sum+=value;count++;}}return count?Math.floor(sum/count):0;}

export function restoreCityGraphs(saved,cellCount=12000){
 const empty=createCityGraphs(),max=Math.max(65535,cellCount*48),uint=(n,cap=max)=>Number.isSafeInteger(n)&&n>=0&&n<=cap,date=d=>d&&uint(d.year,10000000)&&Number.isInteger(d.month)&&d.month>=1&&d.month<=12;
 if(!saved||saved.version!==1)return empty;
 for(const period of['monthly','annual'])for(const key of GRAPH_SERIES)if(!Array.isArray(saved[period]?.[key])||saved[period][key].length!==120||!saved[period][key].every(n=>uint(n,['crime','pollution','finances'].includes(key)?255:max)))return empty;
 if(!['monthlyMax','annualMax'].every(k=>Array.isArray(saved[k])&&saved[k].length===3&&saved[k].every(n=>uint(n)))||!['monthlyScale','longScale'].every(k=>uint(saved[k]))||!['crimeTrend','pollutionTrend'].every(k=>uint(saved[k],65535))||!Array.isArray(saved.facilityDemand)||saved.facilityDemand.length!==2||!saved.facilityDemand.every(n=>[-1,0,1].includes(n)))return empty;
 if(!uint(saved.monthlySamples,120)||!uint(saved.annualSamples,120)||(saved.monthlySamples? !date(saved.firstRecorded)||!date(saved.lastRecorded):saved.firstRecorded!==null||saved.lastRecorded!==null)||(saved.annualSamples?!uint(saved.lastAnnualYear,10000000):saved.lastAnnualYear!==null))return empty;
 const result={...empty};for(const period of['monthly','annual'])result[period]=Object.fromEntries(GRAPH_SERIES.map(k=>[k,[...saved[period][k]]]));for(const key of['monthlyMax','annualMax','facilityDemand'])result[key]=[...saved[key]];for(const key of['monthlyScale','longScale','crimeTrend','pollutionTrend','monthlySamples','annualSamples','lastAnnualYear'])result[key]=saved[key];result.firstRecorded=saved.firstRecorded&&{...saved.firstRecorded};result.lastRecorded=saved.lastRecorded&&{...saved.lastRecorded};return result;
}
