import {actualSpeedKmh} from './world';
import {CatmullRomCurve3,Vector3} from 'three';
import {CONFIG,DEFAULT_COMMAND,CAR_STATS,cornerRules,type Command,type Curve,type Player,type Track} from './game';
export type RiskTargets=Record<string,number|undefined>;
export type RealtimeResult={players:Player[];consumedRisks:string[]};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const lane=(p:Player)=>clamp(p.lateral??p.lane??0,0,2);
const routeCache=new WeakMap<Track,CatmullRomCurve3>();
export function roadGrade(track:Track,position:number){if(!track.route||track.route.length<3)return 0;let path=routeCache.get(track);if(!path){path=new CatmullRomCurve3(track.route.map(p=>new Vector3(...p)));path.arcLengthDivisions=2000;routeCache.set(track,path)}const tangent=path.getTangentAt(clamp(position/(track.length??CONFIG.length),0,1));return clamp(tangent.y/Math.max(.001,Math.hypot(tangent.x,tangent.z)),-.2,.2)}
const level=(speed:number,curve:Curve,p:Player)=>{const over=speed-cornerRules(curve,p).safe;return over<=0?0:curve.danger==='cliff'&&over>CONFIG.dangerousExcess?3:over>CONFIG.moderateExcess?2:1};
/** One authoritative real-time step; speed remains metres per three seconds internally. */
export function stepRealtime(players:Player[],track:Track,commands:Record<string,Command>,riskTargets:RiskTargets,dtMs:number,random:()=>number=Math.random):RealtimeResult{
 const dt=clamp(dtMs,0,200),fraction=dt*(track.pace??CONFIG.gameSpeed)/CONFIG.speedBasisMs,ordered=players.filter(p=>!p.spectator&&p.status==='racing').sort((a,b)=>b.position-a.position||a.id.localeCompare(b.id));
 const proposed=new Map<string,Player>(),consumedRisks:string[]=[];
 // First compute longitudinal acceleration and retain the current physical lane position.
 for(const p of ordered){const cmd=commands[p.id]??DEFAULT_COMMAND;const stats=CAR_STATS[p.car]??CAR_STATS.hatch;const gravity=-roadGrade(track,p.position)*30*fraction;let speed=clamp(p.speed+gravity+(cmd.action==='accelerate'?CONFIG.acceleration*stats.accel*fraction:cmd.action==='brake'?-CONFIG.braking*stats.brake*fraction:0),0,CONFIG.maxSpeed*stats.max);if(cmd.action!=='brake')speed=Math.max(speed,CONFIG.minCruiseKmh*CONFIG.speedBasisMs/3600);const bend=track.curves.find(c=>p.position>=c.start&&p.position<=c.end);let grip=p.grip??1;const seconds=dt*(track.pace??CONFIG.gameSpeed)/1000;const excess=bend?Math.max(0,speed-cornerRules(bend,p).safe):0;if(excess>0)grip=clamp(grip-Math.min(1.5,excess/20)*seconds,.35,1);else grip=clamp(grip+.5*seconds,.35,1);const factor=(bend?cornerRules(bend,p).distanceFactor:1)*grip;let target=p.position+speed*fraction*factor;const front=ordered.find(q=>q.id!==p.id&&Math.abs(lane(q)-lane(p))<.4&&q.position>p.position&&q.position-p.position>=CONFIG.gap&&q.position-p.position<=CONFIG.gap+18);if(front&&cmd.action==='accelerate'&&!track.curves.some(c=>p.position<=c.end&&target+10>=c.start))target+=2*fraction;
  target=Math.min(target,p.position+CONFIG.maxSpeed*stats.max*fraction);
  const dangerous=track.curves.find(c=>c.danger==='cliff'&&p.position<=c.end&&target>=c.start&&level(speed,c,p)===3);
  if(dangerous&&riskTargets[p.id]!==dangerous.start){speed=Math.min(speed,cornerRules(dangerous,p).safe);grip=.25;target=p.position+speed*fraction*grip;}
  const currentLane=lane(p);proposed.set(p.id,{...p,previous:p.position,previousLateral:currentLane,lateral:currentLane,grip,speed,position:target});
 }
 // Lane changes take time, and are deferred if another car occupies the target gap.
 for(const p of ordered){const candidate=proposed.get(p.id)!;const cmd=commands[p.id]??DEFAULT_COMMAND;const requested=cmd.lane??p.lane??0;const old=lane(p);const targetLane=Math.abs(requested-old)>1?(requested>old?Math.floor(old+1e-8)+1:Math.ceil(old-1e-8)-1):requested;const direction=Math.sign(targetLane-old);if(Math.abs(targetLane-old)<1e-6){candidate.lateral=targetLane;candidate.lane=targetLane as 0|1|2;continue;}
  const travel=Math.min(Math.abs(targetLane-old),dt*(track.pace??CONFIG.gameSpeed)/CONFIG.laneChangeMs);const raw=clamp(old+direction*travel,0,2);const next=Math.abs(raw-targetLane)<1e-6?targetLane:raw;let clear=true;
  for(const other of ordered){if(other.id===p.id)continue;const otherNow=lane(other),otherNext=lane(proposed.get(other.id)!);const inTarget=Math.min(otherNow,otherNext)<=Math.max(old,next)+.8&&Math.max(otherNow,otherNext)>=Math.min(old,next)-.8;
   if(!inTarget)continue;const relative=other.position-p.position,projected=relative+(other.speed-candidate.speed)*CONFIG.laneChangeMs/CONFIG.speedBasisMs;
   if(Math.abs(relative)<CONFIG.gap||Math.abs(projected)<CONFIG.gap||relative*projected<0){clear=false;break;}
  }
  if(clear){candidate.lateral=next;if(candidate.lastEvent==='รอช่องว่างเพื่อเปลี่ยนเลน')candidate.lastEvent='กำลังเปลี่ยนเลน';if(Math.abs(next-targetLane)<1e-8){candidate.lane=targetLane as 0|1|2;if(candidate.lastEvent==='กำลังเปลี่ยนเลน')candidate.lastEvent='เปลี่ยนเลนสำเร็จ';}}
  else if(Math.abs(old-targetLane)>.001)candidate.lastEvent='รอช่องว่างเพื่อเปลี่ยนเลน';
 }
 // Cars whose occupied lanes overlap cannot pass through the car ahead.
 const finished:Player[]=[];
 for(const original of ordered){const p=proposed.get(original.id)!;let target=p.position;
  for(const front of finished){if((front.status!=='racing'&&front.status!=='finished')||front.previous<=p.previous||Math.abs(lane(front)-lane(p))>=.8)continue;
   const limit=Math.max(p.previous,front.position-CONFIG.gap);if(target>limit){target=limit;p.speed=Math.min(p.speed,front.speed,Math.max(0,(target-p.previous)/(fraction||1)));p.lastEvent='ชะลอต่อท้าย';}
  }
  // Check every bend actually reached after traffic has been resolved.
  for(const curve of track.curves){const entered=p.previous<curve.start&&target>=curve.start;const inside=p.previous>=curve.start&&p.previous<=curve.end;const oldLevel=inside?level(original.speed,curve,original):0;const newLevel=level(p.speed,curve,p);if(!entered&&!(inside&&newLevel>oldLevel))continue;
   if(newLevel===3&&riskTargets[p.id]===curve.start){consumedRisks.push(p.id);if(random()<.25){p.status='dead';target=Math.max(p.previous,curve.start);p.lastEvent='เสียชีวิตที่โค้งหน้าผา';break;}p.speed=Math.max(0,p.speed-CONFIG.cliffSlowdown);target=Math.min(target,p.previous+p.speed*fraction);p.lastEvent='เสียการควบคุม • เสียความเร็ว';}
   else if(newLevel===2){p.speed=Math.max(0,p.speed-CONFIG.majorSlowdown);target=Math.min(target,p.previous+p.speed*fraction);p.lastEvent='เข้าโค้งเร็วเกิน • เสียความเร็ว';}
   else if(newLevel===1){p.speed=Math.max(0,p.speed-Math.min(CONFIG.minorSlowdown,Math.max(0,p.speed-cornerRules(curve,p).safe)*.3));target=Math.min(target,p.previous+p.speed*fraction);p.lastEvent='เข้าโค้งเร็ว • เสียความเร็ว';}
  }
  const stats={passes:0,cleanCorners:0,mistakes:0,lostDistance:0,...original.raceStats};
  for(const c of track.curves){if(original.position<c.end&&target>=c.end&&level(original.speed,c,original)===0){stats.cleanCorners++;p.lastEvent='✓ ผ่านโค้งสะอาด · เตรียมเร่งออกโค้ง';}if(original.position<c.start&&target>=c.start&&level(original.speed,c,original)>0){stats.mistakes++;stats.worstCorner=c.start;}}
  const lost=Math.max(0,(original.position+original.speed*fraction)-target);stats.lostDistance+=lost;
  stats.passes+=ordered.filter(q=>q.id!==p.id&&q.position>original.position&&q.position<target&&(proposed.get(q.id)?.position??Infinity)<target).length;
  p.raceStats=stats;
  const uncapped=Math.max(p.previous,target);p.position=Math.min(track.length??CONFIG.length,uncapped);
  if(p.status==='racing'&&uncapped>=(track.length??CONFIG.length)){p.finishTime=((track.length??CONFIG.length)-p.previous)/Math.max(1e-9,uncapped-p.previous);p.status='finished';p.lastEvent='เข้าเส้นชัย';}
  p.groundSpeedKmh=actualSpeedKmh(p.previous,p.position,dt);if(p.status==='racing'&&fraction>0)p.speed=Math.min(CONFIG.maxSpeed,(p.position-p.previous)/fraction);finished.push(p);
 }
 return {players:players.map(p=>proposed.get(p.id)??p),consumedRisks};
}


