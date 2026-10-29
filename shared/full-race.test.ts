import {advanceTraffic,type TrafficState} from './traffic';
import test from 'node:test';import assert from 'node:assert/strict';
import {make1081Track} from './real-track';import {stepRealtime} from './realtime';import {botCommands,type BotMemory} from './bots';import {CONFIG,type Player} from './game';

for(const withTraffic of [false,true])test(`eight different road cars finish 39.9 km without overlap (traffic=${withTraffic})`,()=>{
const track=make1081Track();let ps:Player[]=Array.from({length:8},(_,i)=>({id:String(i),name:String(i),position:Math.floor((7-i)/3)*40,previous:0,lane:(i%3) as 0|1|2,lateral:i%3,speed:CONFIG.initialSpeed,car:['hatch','sport','pickup','coupe','mazda2','swift','fortuner','ranger'][i],color:'red',status:'racing',connected:true,ready:true,spectator:false,bot:true,botLevel:'medium'}));const mem:BotMemory={};let commands={};let traffic:TrafficState={cars:[],nextSpawn:5000,serial:0};let t=0,falls=0;for(;t<3600000&&ps.some(p=>p.status==='racing');t+=100){if(withTraffic)traffic=advanceTraffic(traffic,ps,track,100);if(t%700===0)commands=botCommands(ps,track,mem,t,traffic.cars);const old=ps;const result=stepRealtime(ps,track,commands,{},100,()=>.5,traffic.cars);ps=result.players;traffic.cars=result.traffic;for(const a of ps)for(const b of traffic.cars)if(a.status==='racing'&&!a.recoveryMs&&!a.invulnerableMs&&Math.abs(a.lateral!-b.lateral)<CONFIG.bodyCorridor-1e-8&&Math.abs(a.position-b.position)<CONFIG.trafficGap-1e-8)throw Error('Traffic overlap at '+t+' '+a.id+'/'+b.id);falls+=ps.filter((p,i)=>p.recoveryMs&&!old[i].recoveryMs).length;for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const a=ps[i],b=ps[j];if(a.status==='racing'&&b.status==='racing'&&!a.recoveryMs&&!b.recoveryMs&&Math.abs(a.lateral!-b.lateral!)<CONFIG.bodyCorridor-1e-8&&Math.abs(a.position-b.position)<CONFIG.trafficGap-1e-8)throw Error('Body overlap at '+t+' '+a.id+'/'+b.id);}for(const p of ps)if(!Number.isFinite(p.position)||!Number.isFinite(p.speed))throw Error('invalid state');}assert.ok(ps.every(p=>p.status==='finished'));assert.ok(t<3600000);assert.ok(falls<20);

});



