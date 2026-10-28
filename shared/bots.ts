import {CONFIG,recommendAction,type Command,type Player,type Track} from './game';
export type BotMemory=Record<string,{since:number;cooldown:number}>;
/** Bots use the same commands and safety checks as human players. */
export function botCommands(players:Player[],track:Track,memory:BotMemory={},now=Date.now()):Record<string,Command>{
 const racing=players.filter(p=>p.status==='racing'&&!p.spectator).sort((a,b)=>b.position-a.position||a.id.localeCompare(b.id));
 const commands:Record<string,Command>={};let laneChangeChosen=false;
 for(const p of racing){if(!p.bot)continue;const lane=p.lane??0;const recommended=recommendAction(track,p).action;let action=(p.botLevel==='easy'||p.botLevel==='medium')&&recommended==='accelerate'&&p.speed>CONFIG.maxSpeed*(p.botLevel==='easy'?.7:.9)?'hold':recommended;let desired:0|1|2=lane;
  const front=racing.filter(q=>q.id!==p.id&&(q.lane??0)===lane&&q.position>p.position).sort((a,b)=>a.position-b.position)[0];
  const gap=front?front.position-p.position:Infinity;
  const choices=([0,1,2] as const).filter(l=>Math.abs(l-lane)===1);const targetLane=choices.find(l=>racing.every(q=>q.id===p.id||Math.abs((q.lateral??q.lane??0)-l)>.8||Math.abs(q.position-p.position)>=CONFIG.gap*2.5))??lane;
  const safeGap=racing.filter(q=>q.id!==p.id&&(q.lane??0)===targetLane).every(q=>Math.abs(q.position-p.position)>=CONFIG.gap*2.5);
  if(targetLane!==lane&&!laneChangeChosen&&safeGap&&front&&gap<CONFIG.gap+Math.max(20,p.speed*1.5)&&action!=='brake'){
   desired=targetLane;laneChangeChosen=true;
  }
  const wall=([0,1,2] as const).every(l=>racing.some(q=>(q.lane??0)===l&&Math.abs(q.position-p.position)<CONFIG.gap*.7));
  const state=memory[p.id]??(memory[p.id]={since:now,cooldown:0});
  if(!wall)state.since=now;
  const nearCurve=track.curves.some(c=>p.position<=c.end&&p.position+p.speed*2>=c.start);
  const moving=Math.abs((p.lateral??lane)-lane)>.01;
  const designated=racing.filter(q=>q.bot&&Math.abs(q.position-p.position)<CONFIG.gap*.7).sort((a,b)=>(b.lane??0)-(a.lane??0)||a.id.localeCompare(b.id))[0];
  if(wall&&!nearCurve&&!moving&&designated?.id===p.id&&now-state.since>=2500&&now>=state.cooldown){action='brake';desired=lane;state.cooldown=now+1000;}
  commands[p.id]={action,lane:desired,overtake:false,riskConfirmed:false};
 }
 return commands;
}
