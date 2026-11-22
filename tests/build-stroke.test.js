import test from 'node:test';import assert from 'node:assert/strict';import {strokeCells} from '../src/build-stroke.js';
test('drag strokes fill fast and diagonal motion with cardinal neighbors',()=>{
 for(const to of [{x:8,y:0},{x:8,y:5},{x:-4,y:-7}]){const cells=strokeCells({x:0,y:0},to);assert.deepEqual(cells.at(-1),to);for(let i=1;i<cells.length;i++)assert.equal(Math.abs(cells[i].x-cells[i-1].x)+Math.abs(cells[i].y-cells[i-1].y),1);assert.equal(new Set(cells.map(c=>c.x+','+c.y)).size,cells.length);}
});
