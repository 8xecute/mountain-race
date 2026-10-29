import type {TrafficCar} from './traffic';
import {CONFIG,recommendAction,type Command,type Player,type Track} from './game';
export type BotMemory=Record<string,{since:number;cooldown:number;target?:number}>;
/** Continuous passing paths, evaluated against occupied bodies and relative closing speeds. */
export function botCommands(players:Player[],track:Track,memory:BotMemory={},now=Date.now(),traffic:TrafficCar[]=[]):Record<string,Command>{
 const racing=players.filter(p=>p.status==='racing'&&!p.spectator&&!(p.recoveryMs??0));const commands:Record<string,Command>={};
 for(const p of racing){if(!p.bot)continue;const lateral=p.lateral??p.lane??1;let action=recommendAction(track,p).action;const cap=CONFIG.maxSpeed*(p.botLevel==='easy'?.7:p.botLevel==='hard'?1:.9);if(action==='accelerate'&&p.speed>=cap)action='hold';const state=memory[p.id]??(memory[p.id]={since:now,cooldown:0,target:lateral});const front=racing.filter(q=>q.id!==p.id&&Math.abs((q.lateral??q.lane??1)-lateral)<CONFIG.bodyCorridor&&q.position>p.position).sort((a,b)=>a.position-b.position)[0];
 const clear=(target:number)=>!traffic.some(c=>c.position>p.position-5&&c.position<p.position+Math.max(80,(p.speed+c.speed)*2)&&Math.max(lateral,target)>=c.lateral-CONFIG.bodyCorridor)&&racing.every(q=>{if(q.id===p.id)return true;const ql=q.lateral??q.lane??1;const crossing=ql>=Math.min(lateral,target)-CONFIG.bodyCorridor&&ql<=Math.max(lateral,target)+CONFIG.bodyCorridor;if(!crossing)return true;const gap=q.position-p.position,closing=(q.speed-p.speed)/3;return Math.abs(gap)>CONFIG.trafficGap+2&&Math.abs(gap+closing*1.5)>CONFIG.trafficGap+2&&gap*(gap+closing*1.5)>0;});
 if(state.target!==undefined&&!clear(state.target))state.target=lateral;
 if(front&&front.position-p.position<Math.max(18,p.speed*.7)&&now>=state.cooldown){const candidates=[.05,.35,.65,1,1.35,1.65,1.95].filter(x=>Math.abs(x-lateral)>.3&&Math.abs(x-(front.lateral??front.lane??1))>CONFIG.bodyCorridor+.05&&clear(x));const best=candidates.sort((a,b)=>Math.abs(a-lateral)-Math.abs(b-lateral))[0];if(best!==undefined){state.target=best;state.cooldown=now+1200}else if(front.position-p.position<CONFIG.trafficGap+Math.max(5,(p.speed-front.speed)*.7))action='brake';}
 const wall=[0,1,2].every(l=>racing.some(q=>Math.abs((q.lateral??q.lane??1)-l)<.35&&Math.abs(q.position-p.position)<CONFIG.gap*.7));if(!wall)state.since=now;const designated=racing.filter(q=>q.bot&&Math.abs(q.position-p.position)<CONFIG.gap*.7).sort((a,b)=>(b.lateral??b.lane??1)-(a.lateral??a.lane??1)||a.id.localeCompare(b.id))[0];if(wall&&designated?.id===p.id&&now-state.since>=2500&&!track.curves.some(c=>c.end>=p.position&&c.start<=p.position+p.speed*2)){action='brake';state.target=lateral;}
 if(traffic.some(c=>c.position>p.position&&c.position-p.position<Math.max(120,(p.speed+c.speed)*2)&&Math.abs(c.lateral-lateral)<CONFIG.bodyCorridor)){if(clear(.1))state.target=.1;else action='brake';}
 const target=state.target??lateral,steering=Math.abs(target-lateral)<.065?0:target>lateral?1:-1;
 commands[p.id]={action,steering,overtake:false,riskConfirmed:false};
 }return commands;
}
