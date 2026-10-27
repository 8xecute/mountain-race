import test from 'node:test';
import assert from 'node:assert/strict';
import {CONFIG} from './game';
import {geometricSightEnd,type SightPoint} from './sight';
const flat=()=>-10;
const straight=(d:number):SightPoint=>({x:d*.2,y:0,z:0});
test('straight road is visible up to the configured maximum',()=>{assert.equal(geometricSightEnd(0,{pointAt:straight,terrainHeight:flat}),CONFIG.sight);assert.equal(geometricSightEnd(CONFIG.length-50,{pointAt:straight,terrainHeight:flat}),CONFIG.length)});
test('a bend opens progressively as the car advances',()=>{const bend=(d:number):SightPoint=>d<=40?{x:d*.2,y:0,z:0}:{x:8,y:0,z:(d-40)*.2};const before=geometricSightEnd(0,{pointAt:bend,terrainHeight:flat});const closer=geometricSightEnd(20,{pointAt:bend,terrainHeight:flat});const inBend=geometricSightEnd(40,{pointAt:bend,terrainHeight:flat});assert.ok(before<CONFIG.sight);assert.notEqual(closer,before);assert.ok(inBend>closer)});
test('terrain blocks the view even on a straight road',()=>{const ridge=(x:number)=>x>8&&x<11?3:-10;const end=geometricSightEnd(0,{pointAt:straight,terrainHeight:ridge});assert.ok(end<CONFIG.sight);assert.ok(end<=60)});
test('visibility reacts to different lane positions',()=>{const bend=(d:number):SightPoint=>d<=40?{x:d*.2,y:0,z:0}:{x:8,y:0,z:(d-40)*.2};const left=geometricSightEnd(10,{pointAt:bend,terrainHeight:flat,lateralOffset:-.98});const right=geometricSightEnd(10,{pointAt:bend,terrainHeight:flat,lateralOffset:.98});assert.notEqual(left,right)});

test('passing a terrain obstruction opens the view without waiting for a decision round',()=>{const ridge=(x:number)=>x>8&&x<11?3:-10;const before=geometricSightEnd(0,{pointAt:straight,terrainHeight:ridge});const beyond=geometricSightEnd(60,{pointAt:straight,terrainHeight:ridge});assert.ok(before<CONFIG.sight);assert.equal(beyond,60+CONFIG.sight)});
