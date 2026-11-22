import test from 'node:test';import assert from 'node:assert/strict';import {strokeCells} from '../src/build-stroke.js';
test('drag strokes fill fast and diagonal motion with cardinal neighbors',()=>{
 for(const to of [{x:8,y:0},{x:8,y:5},{x:-4,y:-7}]){const cells=strokeCells({x:0,y:0},to);assert.deepEqual(cells.at(-1),to);for(let i=1;i<cells.length;i++)assert.equal(Math.abs(cells[i].x-cells[i-1].x)+Math.abs(cells[i].y-cells[i-1].y),1);assert.equal(new Set(cells.map(c=>c.x+','+c.y)).size,cells.length);}
});

test('drawing shapes include connected line, rectangle perimeter, fill and spaced grid',async()=>{const {shapeCells}=await import('../src/build-stroke.js');const a={x:1,y:2},b={x:5,y:6};assert.equal(shapeCells(a,b,'rectangle').length,16);assert.equal(shapeCells(b,a,'filled').length,25);assert.equal(shapeCells(a,b,'grid',2).length,21);assert.deepEqual(shapeCells(a,b,'line'),strokeCells(a,b));assert.equal(new Set(shapeCells(a,b,'rectangle').map(c=>c.x+','+c.y)).size,16);});
