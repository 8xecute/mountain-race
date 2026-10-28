import test from 'node:test';
import assert from 'node:assert/strict';
import {makeTrack,validateTrack,type Player} from './game';
import {passingAdvice} from './race-advice';
test('seeded tracks provide overtaking straights outside bends',()=>{for(let seed=1;seed<=30;seed++){const t=makeTrack(seed);assert.ok(validateTrack(t));assert.ok(t.overtakeZones!.length>0);for(const z of t.overtakeZones!){assert.ok(z.end-z.start>=180);assert.ok(!t.curves.some(c=>c.start<z.end&&c.end>z.start))}}});
test('advice distinguishes a clear adjacent lane from blocked lanes',()=>{const p:Player={id:'a',name:'a',color:'x',car:'hatch',ready:true,connected:true,spectator:false,status:'racing',position:100,previous:100,speed:24,lane:0};const t={seed:1,curves:[],dashed:[],overtakeZones:[{start:0,end:1000,kind:'approach' as const}]};const front={...p,id:'b',position:150};assert.match(passingAdvice(t,p,[p,front]),/เลนกลาง/);assert.match(passingAdvice(t,p,[p,front,{...p,id:'c',lane:1}]),/ไม่มีช่อง/)});
