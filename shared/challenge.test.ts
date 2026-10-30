import test from 'node:test';import assert from 'node:assert/strict';import {makeTrack,recommendAction,type Player} from './game';import {stepRealtime} from './realtime';
const base:Player={id:'a',name:'a',color:'x',car:'hatch',ready:true,connected:true,spectator:false,status:'racing',position:0,previous:0,speed:24,lane:0,lateral:0};
test('grip recovers under controlled cornering rather than accumulating permanent damage',()=>{const track={seed:1,curves:[{start:0,end:500,safe:60,danger:'low' as const,dashed:true}],dashed:[],pace:1};let p:Player={...base,position:100,speed:60,grip:.3};for(let i=0;i<30;i++)p=stepRealtime([p],track,{a:{action:'hold',lane:0,overtake:false,riskConfirmed:false}},{},100).players[0];assert.ok((p.grip??0)>.9)});



