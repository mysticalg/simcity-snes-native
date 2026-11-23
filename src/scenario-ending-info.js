import {SCENARIO_ENDING_TEXT} from './scenario-ending-text.js?v=endings-48';
import {SCENARIO_IDS} from './rom-scenarios.js?v=scenarios-45';
const names=['San Francisco','Bern','Tokyo','Detroit','Boston','Rio de Janeiro','Las Vegas'];
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function scenarioIsCleared(flags,id){const index=SCENARIO_IDS.indexOf(id);return index>=0&&!!(flags&(1<<index));}
export function scenarioEndingStatus(city,{animate=false}={}){
 const text=SCENARIO_ENDING_TEXT.find(t=>t.screen===city.scenarioEnding?.screen);if(!text)return '';
 return '<section class="scenario-status scenario-fax" data-ending="'+text.screen+'"><canvas class="native-fax" width="256" height="224" role="img" aria-label="Original scenario fax" data-native-fax="'+text.screen+'" data-fax-animate="'+Number(animate)+'"></canvas><h3>'+escape(text.title)+'</h3><p>'+escape(text.text)+'</p>'+(text.screen===11?'<p class="bonus-award">★ Bonus-scenario award: Las Vegas and Free City</p><p>Choose either city from NEW CITY.</p>':'')+'</section>';
}
export function scenarioCareerStatus(flags){
 const completed=names.slice(0,6).filter((_,i)=>flags&(1<<i)).length;
 return '<section class="scenario-status scenario-career"><div class="scenario-heading"><h3>Scenario record</h3><strong>'+completed+' / 6 originals cleared</strong></div><div class="career-badges">'+names.map((name,i)=>'<span class="'+(flags&(1<<i)?'cleared':'pending')+'" data-career="'+SCENARIO_IDS[i]+'">'+(flags&(1<<i)?'✓ ':'○ ')+name+'</span>').join('')+'</div><p>'+(flags&0x8000?'★ Bonus-scenario award earned: Las Vegas and Free City.':'Clear the six original challenges to earn the bonus-scenario award.')+'</p></section>';
}
