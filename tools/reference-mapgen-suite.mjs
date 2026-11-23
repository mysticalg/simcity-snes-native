import fs from 'node:fs';import {spawn} from 'node:child_process';
const numbers=[0,1,5,7,9,10,19,21,23,42,99,100,101,123,255,499,500,555,666,777,888,900,990,999],all=[];let header;
fs.mkdirSync('output',{recursive:true});
for(let n=0;n<numbers.length;n+=4){const env={...process.env,MAP_NUMBERS:numbers.slice(n,n+4).join(','),MAP_REPORT:`output/mapgen-reference-${n}.json`};delete env.MAP_COUNT;delete env.MAP_START;delete env.MAP_PREVIOUS;
 const code=await new Promise((resolve,reject)=>{const p=spawn(process.execPath,['tools/reference-mapgen.mjs'],{windowsHide:true,env,stdio:'inherit'});p.on('error',reject);p.on('exit',resolve);});if(code)throw Error('Map reference batch failed at'+n);const {cases,...meta}=JSON.parse(fs.readFileSync(env.MAP_REPORT));header=meta;all.push(...cases);console.log('Verified '+all.length+' complete original maps');}
fs.writeFileSync('research/reference-mapgen.json',JSON.stringify({...header,cases:all},null,2)+'\n');console.log({cases:all.length,exitCode:0});
