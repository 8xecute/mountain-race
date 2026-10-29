import test from 'node:test';import assert from 'node:assert/strict';import {frontSteering,ackermannAngle} from './front-steering';
test('front wheels steer when stopped but do not rotate the body',()=>{const r=frontSteering('hatch',1,0,0,0,100);assert.ok(r.angle<0);assert.equal(r.turn,0)});
test('steering eases, recentres and limits steering travel at high speed',()=>{const low=frontSteering('hatch',1,0,20,1,100),high=frontSteering('hatch',1,0,120,1,100);assert.ok(Math.abs(high.angle)<Math.abs(low.angle));const release=frontSteering('hatch',0,low.angle,20,1,100);assert.ok(Math.abs(release.angle)<Math.abs(low.angle));assert.ok(Math.abs(release.angle)>0)});
test('Ackermann inner wheel turns more and rear wheels need no steering angle',()=>{const left=ackermannAngle(.3,2,-1),right=ackermannAngle(.3,2,1);assert.ok(right>left);assert.equal(ackermannAngle(0,2,-1),0)});

