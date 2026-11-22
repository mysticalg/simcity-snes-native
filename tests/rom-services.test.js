import test from 'node:test';import assert from 'node:assert/strict';import {romPoliceCoverage} from '../src/rom-services.js';
test('police service source responds to funding power roads and headquarters',()=>{
 const w=24,h=24,i=12*w+12,m=Array(w*h).fill(0);m[i]=0x8249;m[10*w+12]=0x32;
 const full=romPoliceCoverage(m,100,w,h)[i];assert.ok(full>0);assert.equal(romPoliceCoverage(m,0,w,h)[i],0);
 m[i]=0x249;assert.ok(romPoliceCoverage(m,100,w,h)[i]<full);m[i]=0x8307;assert.ok(romPoliceCoverage(m,100,w,h)[i]>full);
});
