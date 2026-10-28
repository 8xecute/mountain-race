import test from 'node:test';import assert from 'node:assert/strict';import {brakingGuide,recommendAction} from './game';
import {CONFIG,DEFAULT_COMMAND,type Player,type Track} from './game';
const p:Player={id:'a',name:'a',position:100,previous:100,speed:120,lateral:1,car:'hatch',color:'red',status:'racing',connected:true,ready:true,spectator:false};
test('braking guidance anticipates a tighter bend after the current wide curve',()=>{const t:Track={seed:1,curves:[{start:0,end:200,safe:140,danger:'low',dashed:true},{start:210,end:400,safe:25,danger:'low',dashed:true}],dashed:[]};assert.equal(brakingGuide(t,p).curve?.start,210);assert.equal(recommendAction(t,p).action,'brake')});
