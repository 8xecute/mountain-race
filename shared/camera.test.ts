import test from 'node:test';
import assert from 'node:assert/strict';
import {boundedVerticalFov} from './camera';
test('horizontal camera view never exceeds 90 degrees across viewport sizes',()=>{for(const aspect of [.5,1,4/3,16/9,21/9,4]){const vertical=boundedVerticalFov(aspect);const horizontal=2*Math.atan(Math.tan(vertical*Math.PI/360)*aspect)*180/Math.PI;assert.ok(horizontal<=90+1e-9,`aspect ${aspect}: ${horizontal}`);assert.ok(vertical<=68)}});
