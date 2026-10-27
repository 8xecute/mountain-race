import {CONFIG,DEFAULT_COMMAND,type Command,type Curve,type Player,type Track} from './game';
export type RiskTargets=Record<string,number|undefined>;
export type RealtimeResult={players:Player[];consumedRisks:string[]};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const lane=(p:Player)=>clamp(p.lateral??p.lane??0,0,1);
const level=(speed:number,curve:Curve)=>{const over=speed-(curve.safe+CONFIG.handling);return over<=0?0:curve.danger==='cliff'&&over>CONFIG.dangerousExcess?3:over>CONFIG.moderateExcess?2:1};
/** One authoritative real-time step; speed remains metres per three seconds internally. */
export function stepRealtime(players:Player[],track:Track,commands:Record<string,Command>,riskTargets:RiskTargets,dtMs:number,random:()=>number=Math.random):RealtimeResult{
 const dt=clamp(dtMs,0,200),fraction=dt/CONFIG.speedBasisMs,ordered=players.filter(p=>!p.spectator&&p.status==='racing').sort((a,b)=>b.position-a.position||a.id.localeCompare(b.id));
 const proposed=new Map<string,Player>(),consumedRisks:string[]=[];
 // First compute longitudinal acceleration and retain the current physical lane position.
 for(const p of ordered){const cmd=commands[p.id]??DEFAULT_COMMAND;let speed=clamp(p.speed+(cmd.action==='accelerate'?CONFIG.acceleration*fraction:cmd.action==='brake'?-CONFIG.braking*fraction:0),0,CONFIG.maxSpeed);let target=p.position+speed*fraction;
  const dangerous=track.curves.find(c=>c.danger==='cliff'&&p.position<=c.end&&target>=c.start&&level(speed,c)===3);
  if(dangerous&&riskTargets[p.id]!==dangerous.start){speed=Math.min(speed,dangerous.safe+CONFIG.handling);target=p.position+speed*fraction;}
  const currentLane=lane(p);proposed.set(p.id,{...p,previous:p.position,previousLateral:currentLane,lateral:currentLane,speed,position:target});
 }
 // Lane changes take time, and are deferred if another car occupies the target gap.
 for(const p of ordered){const candidate=proposed.get(p.id)!;const cmd=commands[p.id]??DEFAULT_COMMAND;const targetLane=cmd.lane??p.lane??0;const old=lane(p);const direction=Math.sign(targetLane-old);if(!direction)continue;
  const next=clamp(old+direction*dt/CONFIG.laneChangeMs,0,1);let clear=true;
  for(const other of ordered){if(other.id===p.id)continue;const otherNow=lane(other),otherNext=lane(proposed.get(other.id)!);const inTarget=Math.abs(otherNow-targetLane)<.55||Math.abs(otherNext-targetLane)<.55;
   if(!inTarget)continue;const relative=other.position-p.position,projected=relative+(other.speed-candidate.speed)*CONFIG.laneChangeMs/CONFIG.speedBasisMs;
   if(Math.abs(relative)<CONFIG.gap||Math.abs(projected)<CONFIG.gap||relative*projected<0){clear=false;break;}
  }
  if(clear){candidate.lateral=next;if(candidate.lastEvent==='รอช่องว่างเพื่อเปลี่ยนเลน')candidate.lastEvent='กำลังเปลี่ยนเลน';if(Math.abs(next-targetLane)<1e-8){candidate.lane=targetLane;if(candidate.lastEvent==='กำลังเปลี่ยนเลน')candidate.lastEvent='เปลี่ยนเลนสำเร็จ';}}
  else if(Math.abs(old-targetLane)>.001)candidate.lastEvent='รอช่องว่างเพื่อเปลี่ยนเลน';
 }
 // Cars whose occupied lanes overlap cannot pass through the car ahead.
 const finished:Player[]=[];
 for(const original of ordered){const p=proposed.get(original.id)!;let target=p.position;
  for(const front of finished){if((front.status!=='racing'&&front.status!=='finished')||front.previous<=p.previous||Math.abs(lane(front)-lane(p))>=.6)continue;
   const limit=Math.max(p.previous,front.position-CONFIG.gap);if(target>limit){target=limit;p.speed=Math.min(p.speed,front.speed,Math.max(0,(target-p.previous)/(fraction||1)));p.lastEvent='ชะลอต่อท้าย';}
  }
  // Check every bend actually reached after traffic has been resolved.
  for(const curve of track.curves){const entered=p.previous<curve.start&&target>=curve.start;const inside=p.previous>=curve.start&&p.previous<=curve.end;const oldLevel=inside?level(original.speed,curve):0;const newLevel=level(p.speed,curve);if(!entered&&!(inside&&newLevel>oldLevel))continue;
   if(newLevel===3&&riskTargets[p.id]===curve.start){consumedRisks.push(p.id);if(random()<.25){p.status='dead';target=Math.max(p.previous,curve.start);p.lastEvent='เสียชีวิตที่โค้งหน้าผา';break;}p.speed=Math.max(0,p.speed-CONFIG.cliffSlowdown);target=Math.min(target,p.previous+p.speed*fraction);p.lastEvent='เสียการควบคุม • เสียความเร็ว';}
   else if(newLevel===2){p.speed=Math.max(0,p.speed-CONFIG.majorSlowdown);target=Math.min(target,p.previous+p.speed*fraction);p.lastEvent='เข้าโค้งเร็วเกิน • เสียความเร็ว';}
   else if(newLevel===1){p.speed=Math.max(0,p.speed-CONFIG.minorSlowdown);target=Math.min(target,p.previous+p.speed*fraction);p.lastEvent='เข้าโค้งเร็ว • เสียความเร็ว';}
  }
  const uncapped=Math.max(p.previous,target);p.position=Math.min(CONFIG.length,uncapped);
  if(p.status==='racing'&&uncapped>=CONFIG.length){p.finishTime=(CONFIG.length-p.previous)/Math.max(1e-9,uncapped-p.previous);p.status='finished';p.lastEvent='เข้าเส้นชัย';}
  finished.push(p);
 }
 return {players:players.map(p=>proposed.get(p.id)??p),consumedRisks};
}


