import type {TrafficCar} from './traffic';
import {CONFIG,CAR_STATS,recommendAction,type Command,type Player,type Track} from './game';
export type BotMemory=Record<string,{since:number;cooldown:number;target?:number;frontId?:string;noticedAt?:number}>;
export const BOT_DRIVING={easy:{reactionMs:900,cooldownMs:2600,lookAhead:45,prediction:1,margin:4,pace:.7},medium:{reactionMs:300,cooldownMs:1400,lookAhead:85,prediction:1.6,margin:2.5,pace:.9},hard:{reactionMs:0,cooldownMs:800,lookAhead:140,prediction:2.4,margin:1.5,pace:1}} as const;
/** Continuous passing paths, evaluated against occupied bodies and relative closing speeds. */
export function botCommands(players:Player[],track:Track,memory:BotMemory={},now=Date.now(),traffic:TrafficCar[]=[]):Record<string,Command>{
 const racing=players.filter(p=>p.status==='racing'&&!p.spectator&&!(p.recoveryMs??0));const commands:Record<string,Command>={};
 for(const p of racing){if(!p.bot)continue;const style=BOT_DRIVING[p.botLevel??'medium'];const lateral=p.lateral??p.lane??1;let action=recommendAction(track,p).action;const cap=CONFIG.maxSpeed*(CAR_STATS[p.car]?.max??1)*style.pace*(1+(p.chaseBonus??0));if(action==='accelerate'&&p.speed>=cap)action='hold';const state=memory[p.id]??(memory[p.id]={since:now,cooldown:0,target:lateral});const front=racing.filter(q=>q.id!==p.id&&Math.abs((q.lateral??q.lane??1)-lateral)<CONFIG.bodyCorridor&&q.position>p.position).sort((a,b)=>a.position-b.position)[0];

 const clear=(target:number)=>{
  const low=Math.min(lateral,target)-CONFIG.bodyCorridor,high=Math.max(lateral,target)+CONFIG.bodyCorridor;
  if(traffic.some(c=>c.lateral>=low&&c.lateral<=high&&c.position>p.position-5&&c.position-p.position<Math.max(60,(p.speed+c.speed)/3*style.prediction+20)))return false;
  return racing.every(q=>{if(q.id===p.id)return true;const ql=q.lateral??q.lane??1,qlFuture=ql+(q.lateralVelocity??0)*style.prediction;const crossing=Math.max(ql,qlFuture)>=low&&Math.min(ql,qlFuture)<=high;if(!crossing)return true;const gap=q.position-p.position,closing=(q.speed-p.speed)/3,prediction=Math.abs(ql-target)<CONFIG.bodyCorridor||Math.abs(qlFuture-target)<CONFIG.bodyCorridor?style.prediction:Math.min(style.prediction,(CONFIG.bodyCorridor+Math.abs(ql-lateral))*CONFIG.laneChangeMs/1000),future=gap+closing*prediction;return Math.abs(gap)>CONFIG.trafficGap+style.margin&&Math.abs(future)>CONFIG.trafficGap+style.margin&&gap*future>0;});
 };
 if(state.target!==undefined&&!clear(state.target))state.target=lateral;
 if(state.frontId!==front?.id){state.frontId=front?.id;state.noticedAt=now;}
 const approaching=front&&front.position-p.position<Math.max(style.lookAhead,p.speed*.8)&&(front.speed<p.speed+5||front.position-p.position<18);
 if(approaching&&now>=state.cooldown&&now-(state.noticedAt??now)>=(p.botLevel?style.reactionMs:0)){
  const candidates=[.05,.35,.65,1,1.35,1.65,1.95].filter(x=>Math.abs(x-lateral)>.3&&Math.abs(x-(front.lateral??front.lane??1))>CONFIG.bodyCorridor+.05&&clear(x));
  const score=(target:number)=>{let runway=style.lookAhead*2,pace=CONFIG.maxSpeed;for(const q of racing){if(q.id===p.id||q.position<=p.position||Math.abs((q.lateral??q.lane??1)-target)>=CONFIG.bodyCorridor)continue;const gap=q.position-p.position;if(gap<runway){runway=gap;pace=q.speed;}}for(const c of traffic){if(c.position>p.position&&Math.abs(c.lateral-target)<CONFIG.bodyCorridor)runway=Math.min(runway,Math.max(0,c.position-p.position-(p.speed+c.speed)/3*style.prediction));}return runway+Math.min(pace,p.speed+20)*.5-Math.abs(target-lateral)*(p.botLevel==='easy'?28:12);};
  const best=candidates.sort((a,b)=>score(b)-score(a)||Math.abs(a-lateral)-Math.abs(b-lateral)||a-b)[0];
  if(best!==undefined){state.target=best;state.cooldown=now+style.cooldownMs;}
 }
 if(front&&front.position-p.position<CONFIG.trafficGap+Math.max(5,(p.speed-front.speed)*.7)&&Math.abs((state.target??lateral)-lateral)<.1)action='brake';

 const wall=[0,1,2].every(l=>racing.some(q=>Math.abs((q.lateral??q.lane??1)-l)<.35&&Math.abs(q.position-p.position)<CONFIG.gap*.7));if(!wall)state.since=now;const designated=racing.filter(q=>q.bot&&Math.abs(q.position-p.position)<CONFIG.gap*.7).sort((a,b)=>(b.lateral??b.lane??1)-(a.lateral??a.lane??1)||a.id.localeCompare(b.id))[0];if(wall&&designated?.id===p.id&&now-state.since>=2500&&!track.curves.some(c=>c.end>=p.position&&c.start<=p.position+p.speed*2)){action='brake';state.target=lateral;}
 if(traffic.some(c=>c.position>p.position&&c.position-p.position<Math.max(120,(p.speed+c.speed)*2)&&Math.abs(c.lateral-lateral)<CONFIG.bodyCorridor)){if(clear(.1))state.target=.1;else action='brake';}
 const target=state.target??lateral,steering=Math.abs(target-lateral)<.065?0:target>lateral?1:-1;
 commands[p.id]={action,steering,overtake:false,riskConfirmed:false};
 }return commands;
}
