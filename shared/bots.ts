import {CONFIG,recommendAction,type Command,type Player,type Track} from './game';
/** Bots use the same commands and safety checks as human players. */
export function botCommands(players:Player[],track:Track):Record<string,Command>{
 const racing=players.filter(p=>p.status==='racing'&&!p.spectator).sort((a,b)=>b.position-a.position||a.id.localeCompare(b.id));
 const commands:Record<string,Command>={};let laneChangeChosen=false;
 for(const p of racing){if(!p.bot)continue;const lane=p.lane===1?1:0;const action=recommendAction(track,p).action;let desired:0|1=lane;
  const front=racing.filter(q=>q.id!==p.id&&(q.lane??0)===lane&&q.position>p.position).sort((a,b)=>a.position-b.position)[0];
  const gap=front?front.position-p.position:Infinity;
  const targetLane:0|1=lane===0?1:0;
  const safeGap=racing.filter(q=>q.id!==p.id&&(q.lane??0)===targetLane).every(q=>Math.abs(q.position-p.position)>=CONFIG.gap*2.5);
  if(!laneChangeChosen&&safeGap&&front&&gap<CONFIG.gap+Math.max(20,p.speed*1.5)&&action!=='brake'){
   desired=targetLane;laneChangeChosen=true;
  }else if(!laneChangeChosen&&lane===1&&!front&&safeGap){desired=0;laneChangeChosen=true;}
  commands[p.id]={action,lane:desired,overtake:false,riskConfirmed:false};
 }
 return commands;
}
