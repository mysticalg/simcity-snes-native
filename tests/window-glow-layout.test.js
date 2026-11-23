import test from 'node:test';
import assert from 'node:assert/strict';
import {packWindowGlows} from '../src/window-lights.js';

test('shared window bloom pages retain padding and keep every glyph within its page',()=>{
 const entries=Array.from({length:800},(_,n)=>({width:1+n*17%195,height:1+n*31%147})),pages=packWindowGlows(entries);
 assert.ok(pages.length>1);
 for(const [p,size]of pages.entries()){
  assert.ok(size.width<=512&&size.height<=512);
  const glyphs=entries.filter(e=>e.page===p);
  for(const a of glyphs){assert.ok(a.sx>=0&&a.sy>=0&&a.sx+a.width+8<=size.width&&a.sy+a.height+8<=size.height);}
  for(let i=0;i<glyphs.length;i++)for(let j=i+1;j<glyphs.length;j++){
   const a=glyphs[i],b=glyphs[j];assert.ok(a.sx+a.width+16<=b.sx||b.sx+b.width+16<=a.sx||a.sy+a.height+16<=b.sy||b.sy+b.height+16<=a.sy,'Two bloom sources lack their isolation gap');
  }
 }
});

test('oversized future glyphs retain their individual path without consuming shared pages',()=>{
 const entries=[{width:505,height:10},{width:10,height:505},{width:16,height:20},{width:504,height:504}];
 const pages=packWindowGlows(entries);assert.equal(entries[0].page,-1);assert.equal(entries[1].page,-1);assert.ok(entries[2].page>=0&&entries[3].page>=0);assert.equal(pages.length,2);assert.deepEqual(packWindowGlows([]),[]);
});

test('repacking a changed visible set removes stale page references and retains its dimensions',()=>{
 const entries=Array.from({length:40},()=>({width:80,height:70}));packWindowGlows(entries);assert.ok(entries.at(-1).page>0);
 const visible=entries.slice(-2),sizes=visible.map(e=>[e.width,e.height]);assert.equal(packWindowGlows(visible).length,1);assert.ok(visible.every(e=>e.page===0));assert.deepEqual(visible.map(e=>[e.width,e.height]),sizes);
});
