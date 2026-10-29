import test from 'node:test';import assert from 'node:assert/strict';
import {hitRoadsidePost,ROADSIDE} from './roadside-collision';import {stepRealtime} from './realtime';import {CONFIG,type Player,type Track,type Command} from './game';
const p:Player={id:'p',name:'p',car:'hatch',color:'red',ready:true,connected:true,spectator:false,status:'racing',position:14,previous:14,speed:40,lateral:2.6,lane:2};
const track:Track={seed:1,length:1000,curves:[],dashed:[],source:'osm1081',route:[[0,0,0],[500,0,0],[1000,0,0]]};
const command:Command={action:'accelerate',overtake:false,riskConfirmed:false,steering:0};
test('a fast car hits roadside posts on either side without tunnelling, but the middle stays clear',()=>{
 assert.ok(hitRoadsidePost(0,60,2.6,2.6,1000,125));assert.ok(hitRoadsidePost(0,60,-.6,-.6,1000,125));assert.equal(hitRoadsidePost(0,60,1,1,1000,125),undefined);
 assert.equal(hitRoadsidePost(3,4,2.6,2.6,1000,125),undefined);
 assert.ok(hitRoadsidePost(16,16,2,2.6,1000,125));
});
test('post contact stops the car, holds the impact point for the rank-adjusted recovery, then respawns safely at zero',()=>{
 let car=stepRealtime([p],track,{p:command},{},100).players[0];assert.equal(car.recoveryKind,'post');assert.equal(car.recoveryMs,ROADSIDE.blinkMs+2000);assert.equal(car.speed,0);const at=car.position;
 for(let i=0;i<29;i++){car=stepRealtime([car],track,{p:command},{},100).players[0];assert.ok(car.recoveryMs!>0);assert.equal(car.position,at);assert.equal(car.speed,0);}
 car=stepRealtime([car],track,{p:command},{},100).players[0];assert.equal(car.recoveryMs,0);assert.equal(car.speed,0);assert.equal(car.position,at);assert.ok(car.lateral!>=0&&car.lateral!<=2);assert.equal(car.respawnLaunch,true);
});
test('respawn waits when every safe road position is occupied',()=>{
 const recovering={...p,position:100,previous:100,speed:0,recoveryMs:100,recoveryKind:'post' as const};
 const blockers=[0,1,2].map((l,i)=>({...p,id:'b'+i,position:100,previous:100,speed:0,lateral:l}));
 const cmds=Object.fromEntries(blockers.map(b=>[b.id,{...command,action:'brake' as const}]));
 const car=stepRealtime([recovering,...blockers],track,cmds,{},100).players[0];assert.equal(car.recoveryMs,100);assert.equal(car.speed,0);
});
test('respawn launch reaches 60 km/h sooner and its extra acceleration ends at 60',()=>{
 const flat={...track,source:undefined};
 const run=(boost:boolean)=>{let car={...p,lateral:1,speed:1,restartRequired:true,respawnLaunch:boost};let ticks=0;while(car.speed*3600/CONFIG.speedBasisMs<60&&ticks<100){car=stepRealtime([car],flat,{p:command},{},100).players[0] as typeof car;ticks++;}return {car,ticks};};
 const normal=run(false),boosted=run(true);assert.ok(boosted.ticks<normal.ticks);assert.equal(boosted.car.respawnLaunch,false);
 const a={...boosted.car,speed:60*CONFIG.speedBasisMs/3600,respawnLaunch:true},b={...a,respawnLaunch:false};assert.equal(stepRealtime([a],flat,{p:command},{},100).players[0].speed,stepRealtime([b],flat,{p:command},{},100).players[0].speed);
});

test('every stop arms fast launch, including a stop without respawning',()=>{const car={...p,lateral:1,speed:0,respawnLaunch:false,restartRequired:true};const next=stepRealtime([car],{...track,source:undefined},{p:command},{},100).players[0];assert.equal(next.respawnLaunch,true);assert.ok(next.speed>CONFIG.acceleration*100/CONFIG.speedBasisMs);});
