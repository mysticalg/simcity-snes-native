import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import {generateRomMap,nextMapgenWord,seedRomMap} from '../src/rom-mapgen.js';import {City} from '../src/simulation.js';import {restartCity} from '../src/city-restart.js';
import {TERRAIN_MINIMAP,MAP_PREVIEW_RGB} from '../src/rom-mapgen-data.js';
const digest=map=>{const bytes=Buffer.alloc(map.length*2);map.forEach((v,i)=>bytes.writeUInt16LE(v,i*2));return crypto.createHash('sha256').update(bytes).digest('hex');};
test('numbered terrain replays72 complete original generators, including digit-cache seeding',()=>{
 const ref=JSON.parse(fs.readFileSync('research/reference-mapgen.json'));assert.equal(ref.exitCode,0);assert.equal(ref.cases.length,72);for(const c of ref.cases){const r=generateRomMap(c.number,{previousOnes:c.previousOnes});assert.equal(digest(r.map),c.mapSHA256,JSON.stringify([c.number,c.previousOnes]));assert.equal(r.kind,c.kind);assert.deepEqual(r.rng,c.rng);assert.equal(r.randomCalls,c.randomCalls);}
});
test('all1000 map numbers terminate with a valid original120x100 terrain vocabulary',()=>{
 const kinds=new Set();for(let n=0;n<1000;n++){const r=generateRomMap(n);assert.equal(r.map.length,12000);assert.ok(r.map.every(id=>id>=0&&id<38));assert.ok(r.map.includes(0));kinds.add(r.kind);}assert.deepEqual([...kinds].sort(),['island','river']);
});
test('map RNG retains the first ADC carry; seeds reject invalid digits and preserve the original first-preview quirk',()=>{
 const state=[65535,1,0];assert.equal(nextMapgenWord(state),0);assert.deepEqual(state,[0,0,65535]);for(const n of [-1,1000,1.1,NaN])assert.throws(()=>generateRomMap(n));for(const n of [-1,256,1.5])assert.throws(()=>seedRomMap(0,n));assert.notEqual(digest(generateRomMap(0).map),digest(generateRomMap(0,{previousOnes:0}).map));assert.deepEqual(generateRomMap(5).map,generateRomMap(5).map);
});
test('generated terrain provenance, original starting funds and geography survive saves and restart',()=>{
 const build=JSON.parse(fs.readFileSync('assets/tables/build.json')),flags=JSON.parse(fs.readFileSync('assets/tables/city.json')).flags,r=generateRomMap(5),terrainSource={kind:'numbered',number:5,previousOnes:255};
 for(const [difficulty,funds]of [20000,10000,5000].entries()){const c=new City(r.map,structuredClone(build),[...flags],{scenario:'FreeCity',difficulty,year:1900,terrainSource,rngA:r.rng[0],rngB:r.rng[1]}),saved=City.restore(c.serialize(),c.build,c.flags);assert.equal(c.funds,funds);assert.deepEqual([saved.rngA,saved.rngB],r.rng.slice(0,2));assert.deepEqual(saved.terrainSource,terrainSource);assert.deepEqual(saved.map,r.map);const restarted=restartCity(saved,City);assert.deepEqual(restarted.terrainSource,terrainSource);assert.deepEqual(restarted.map,r.map);}
 const c=new City(r.map,build,[...flags],{terrainSource:{kind:'numbered',number:1000,previousOnes:255}});assert.equal(c.terrainSource,null);const old=JSON.parse(c.serialize());delete old.terrainSource;assert.equal(City.restore(JSON.stringify(old),build,flags).terrainSource,null);
});

test('all38 original minimap terrain colors match CPU output and the map-area palette selection',()=>{
 const ref=JSON.parse(fs.readFileSync('research/reference-mapgen-preview.json'));assert.equal(ref.exitCode,0);assert.deepEqual(TERRAIN_MINIMAP.slice(0,38),ref.colors);assert.deepEqual(MAP_PREVIEW_RGB,ref.rgb);const tilemap=fs.readFileSync('assets/tilemaps/TM_Layer1_MapSelectScreen.bin'),positions=[];for(let i=0;i<tilemap.length/2;i++)if((tilemap.readUInt16LE(i*2)>>10&7)===7)positions.push(i);assert.equal(positions.length,195);assert.ok(positions.every(i=>Math.floor(i/32)>=43&&Math.floor(i/32)<=55&&i%32>=6&&i%32<=20));
});
