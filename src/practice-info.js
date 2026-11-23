import {PRACTICE_LESSONS} from './practice-lessons.js?v=practice-46';
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function practiceStatus(city){
 if(city.scenario!=='PracticeCity')return '';
 const p=city.practiceTutorial,decision=p.decision,population=decision?.population??city.population,met=population>=30000;
 const status=decision?(decision.result==='won'?'Complete':'Review complete'):p.stage===6?'Lessons finished':'In progress';
 const lessons=p.lessons.map(id=>PRACTICE_LESSONS.find(l=>l.id===id)).filter(Boolean);
 return '<section class="scenario-status practice-status"><div class="scenario-heading"><h3>Practice city</h3><strong>'+status+'</strong></div><p>Reach 30,000 residents by January 1905.</p><div class="scenario-requirement '+(met?'met':'unmet')+'"><span>'+(decision?'Population at final review':'Population')+'</span><b>'+Math.max(0,Math.floor(population)).toLocaleString()+' / 30,000</b><small>'+Math.min(5,p.stage)+' of 5 lessons reached</small></div><p>'+(decision?'Final review recorded in '+decision.year+'. You can keep building.':p.stage===6?'This older city predates saved lessons; its original review was not recorded.':'Lessons appear as the city calendar advances. Dismiss the advisor notice to continue.')+'</p>'+lessons.map((l,i)=>'<details class="practice-lesson" data-lesson="'+l.id+'"'+(i===lessons.length-1?' open':'')+'><summary>'+escape(l.title)+'</summary><p>'+escape(l.text)+'</p>'+(l.id===28?'<p class="practice-controls">Browser controls: use Information and City Graphs for reports, SAVE to download your city, and the tool icons to build. Drag a blueprint, then release to place it; right-drag pans the map.</p>':'')+'</details>').join('')+'</section>';
}
