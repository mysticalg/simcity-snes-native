import test from 'node:test';import assert from 'node:assert/strict';import {romPoliceCoverage,romFireCoverage,fireBurnoutMaximum} from '../src/rom-services.js';
test('police service source responds to funding power roads and headquarters',()=>{
 const w=24,h=24,i=12*w+12,m=Array(w*h).fill(0);m[i]=0x8249;m[10*w+12]=0x32;
 const full=romPoliceCoverage(m,100,w,h)[i];assert.ok(full>0);assert.equal(romPoliceCoverage(m,0,w,h)[i],0);
 m[i]=0x249;assert.ok(romPoliceCoverage(m,100,w,h)[i]<full);m[i]=0x8307;assert.ok(romPoliceCoverage(m,100,w,h)[i]>full);
});

test('fire stations use parallel service plane and source burnout thresholds',()=>{
 const m=Array(24*24).fill(0),i=12*24+12;m[i]=0x8252;m[10*24+12]=0x32;
 assert.ok(romFireCoverage(m,100,24,24)[i]>0);assert.equal(romPoliceCoverage(m,100,24,24)[i],0);
 assert.deepEqual([0,1,19,20,99,100,255].map(fireBurnoutMaximum),[10,3,3,2,2,1,1]);
});
