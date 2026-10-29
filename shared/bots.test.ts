import test from 'node:test';
import assert from 'node:assert/strict';
import {botCommands} from './bots';
import {type Player,type Track} from './game';
const player=(id:string,position:number,lane:0|1=0,bot=true):Player=>({id,name:id,color:'#fff',car:'hatch',ready:true,connected:true,spectator:false,position,previous:position,speed:8,status:'racing',lane,previousLane:lane,bot});
const track:Track={seed:1,curves:[],dashed:[]};
test('bots use ordinary speed and lane commands without confirming fatal risk',()=>{const result=botCommands([player('human',45,0,false),player('bot',30)],track);assert.equal(result.human,undefined);assert.equal(result.bot.action,'accelerate');assert.equal(result.bot.steering,1);assert.equal(result.bot.riskConfirmed,false)});
test('bots do not request a lane with a nearby car',()=>{const result=botCommands([player('a',45,0,false),player('b',30),player('c',30,1,false)],track);assert.equal(result.b.steering,0)});
test('bot decisions warn and brake near a tight corner',()=>{const t:Track={seed:1,curves:[{start:50,end:80,safe:8,danger:'cliff',dashed:false}],dashed:[]};const bot={...player('b',35),speed:24};const result=botCommands([bot],t);assert.equal(result.b.action,'brake');assert.equal(result.b.riskConfirmed,false)});
