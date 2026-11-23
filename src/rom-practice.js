// CODE_03C474..03C4DB. Months are one-based; one lesson advances per call.
export const PRACTICE_DATES=[[1900,1],[1900,6],[1900,11],[1901,1],[1901,6],[1905,1]];
export const PRACTICE_MESSAGES=[0x1b,0x2e,0x32,0x1c,0x33];
export function stepPracticeLesson(year,month,stage,{population=0,mode=1,messagePending=false,messageBusy=false}={}){
 const result={stage,messageId:null,historyId:null,outcome:null};
 if(mode!==1||messagePending||messageBusy||!Number.isInteger(stage)||stage<0||stage>=6)return result;
 const [dueYear,dueMonth]=PRACTICE_DATES[stage],y=year&65535,m=month&65535;
 if(y<dueYear||(y===dueYear&&m<dueMonth))return result;
 result.stage=stage+1;
 if(stage<5)result.messageId=PRACTICE_MESSAGES[stage];
 else {const won=(population>>>0)>=30000;result.messageId=won?0x26:0x27;result.historyId=won?1:null;result.outcome=won?'won':'lost';}
 return result;
}
export function legacyPracticeStage(year,month){return PRACTICE_DATES.filter(([y,m])=>year>y||(year===y&&month>m)).length;}
export function restorePracticeTutorial(saved,year,month,{fresh=false}={}){
 const p={stage:fresh?0:legacyPracticeStage(year,month),pendingId:null,lessons:[],decision:null};
 if(!saved||!Number.isInteger(saved.stage)||saved.stage<0||saved.stage>6)return p;
 p.stage=saved.stage;
 const sequence=[...PRACTICE_MESSAGES,saved.decision?.result==='won'?0x26:0x27];
 if(Array.isArray(saved.lessons)&&saved.lessons.length<=p.stage&&saved.lessons.every((id,i)=>id===sequence[p.stage-saved.lessons.length+i]))p.lessons=[...saved.lessons];
 if(p.lessons.length&&saved.pendingId===p.lessons.at(-1))p.pendingId=saved.pendingId;
 const d=saved.decision;if(p.stage===6&&d&&['won','lost'].includes(d.result)&&Number.isInteger(d.year)&&d.year>=1905&&d.year<=65535&&Number.isInteger(d.month)&&d.month>=1&&d.month<=12&&Number.isInteger(d.population)&&d.population>=0&&d.population<=0xffffffff&&(d.population>=30000)===(d.result==='won'))p.decision={year:d.year,month:d.month,population:d.population,result:d.result};
 return p;
}
