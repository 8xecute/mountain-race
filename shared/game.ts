import {ROAD_CARS} from './cars';
import {validateImportedRoad} from './real-track';
import {generateTrack,validateRoad} from './track';
const SPEED_BASIS_MS=3000;
export const CONFIG = { length:7000, speedBasisMs:SPEED_BASIS_MS, tickMs:100, gameSpeed:1, laneChangeMs:1500, botThinkMs:700, initialSpeed:24, minCruiseKmh:20, maxSpeedKmh:120, maxSpeed:120*SPEED_BASIS_MS/3600, acceleration:25, coasting:5, braking:140, handling:6, brakeTapFraction:.05, brakeHoldDelayMs:100, gap:40, trafficGap:3.5, bodyCorridor:.68/2.25, respawnMs:1800, respawnLaunchFactor:1.8, respawnLaunchUntilKmh:60, sight:700, clearGap:45, clearBonus:6, passBonus:36, dangerousExcess:21, moderateExcess:15, minorSlowdown:9, majorSlowdown:15, cliffSlowdown:18 } as const;
export type Action = 'brake'|'hold'|'accelerate';
export const CAR_STATS:Record<string,{accel:number;brake:number;max:number;handling:number}>=ROAD_CARS;
export type Command = { drift?:boolean; cornerAssist?:boolean; reverse?:boolean; steering?:number;power?:number;action:Action; overtake:boolean; riskConfirmed:boolean; lane?:0|1|2 };
export type Curve = {start:number; end:number; safe:number; danger:'low'|'cliff'; dashed:boolean; kind?:'wide'|'tight'; long?:boolean;insideLane?:0|2};
export type Player = { wrongWay?:boolean; lastPlaceProtection?:boolean; renderPrevious?:{headingError?:number;frontWheelAngle?:number;driftAmount?:number;driftSustainMs?:number;steeringInput?:number}; skillReadyAt?:number; drifting?:boolean;driftAmount?:number;driftSustainMs?:number; cornerAssistActive?:boolean;id:string; name:string; color:string; car:string; ready:boolean; connected:boolean; spectator:boolean; position:number; previous:number; speed:number; status:'racing'|'finished'|'dead'; finishTime?:number;finishAt?:number;lateralVelocity?:number;steeringInput?:number;headingError?:number;neutralMs?:number;trailMs?:number;cornerBoost?:number;wasInBend?:boolean;exitMs?:number;slingshotMs?:number;slingCooldownMs?:number;reversing?:boolean;frontWheelAngle?:number;brakeTapPending?:boolean;brakeHeld?:boolean;brakeHoldMs?:number;rearContactId?:string;impactHoldMs?:number;invulnerableMs?:number;recoveryMs?:number;chaseBonus?:number;draftBonus?:number;draftCarryMs?:number;respawnLaunch?:boolean;recoveryKind?:'post'|'runoff';recoverySide?:number;restartRequired?:boolean;grip?:number;groundSpeedKmh?:number;raceStats?:{passes:number;cleanCorners:number;mistakes:number;lostDistance:number;worstCorner?:number}; passed?:boolean; passFrontId?:string; lane?:0|1|2; previousLane?:0|1|2; lateral?:number; previousLateral?:number; riskCurve?:number; bot?:boolean;botLevel?:'easy'|'medium'|'hard'; lastEvent?:string};
export type Track = {mapId?:string;startKm?:number;endKm?:number;length?:number;pace?:number;mode?:'short'|'long'|'real1081'|'road10'|'road20'|'road30'|'roadFull';source?:'osm1081';name?:string;overtakeZones?:{start:number;end:number;kind:'approach'|'exit'}[];seed:number; curves:Curve[]; dashed:{start:number;end:number}[]; route?:[number,number,number][]};
export const DEFAULT_COMMAND:Command = {action:'hold',overtake:false,riskConfirmed:false,steering:0};
export function makeTrack(seed:number,length:number=CONFIG.length):Track {return generateTrack(seed,length);}
export function validateTrack(t:Track) {return (t.curves.length>0||!!t.route)&&t.curves.every((c,i)=>c.start>=0&&c.start<c.end&&c.end<=(t.length??CONFIG.length)&&c.safe>0&&(!i||t.curves[i-1].end<=c.start))&&t.dashed.every(d=>d.end-d.start>=20)&&t.dashed[0]?.start===0&&t.dashed.at(-1)?.end===(t.length??CONFIG.length)&&(!t.route||(t.source==='osm1081'?validateImportedRoad(t.route):validateRoad(t.route)));}
export function nextCurve(track:Track,pos:number) {return track.curves.find(c=>c.end>=pos);}
export function speedFor(p:Player,c:Command){return Math.max(0,Math.min(CONFIG.maxSpeed,p.speed+(c.action==='accelerate'?CONFIG.acceleration:c.action==='brake'?-CONFIG.braking:0)));}
export function cornerRules(curve:Curve,p:Player){
 if(curve.insideLane===undefined)return {safe:Math.max((curve.safe+CONFIG.handling)*(CAR_STATS[p.car]?.handling??1),(p.cornerBoost??0)*140/1.2),distanceFactor:1,line:'ปกติ'};
 const lane=p.lateral??p.lane??1,relative=curve.insideLane===0?lane-1:1-lane;
 return {safe:Math.max((curve.safe+CONFIG.handling+relative*5)*(CAR_STATS[p.car]?.handling??1),(p.cornerBoost??0)*140/1.2),distanceFactor:1-relative*.055,line:relative<-.4?'ด้านใน':relative>.4?'ด้านนอก':'กลาง'};
}
/** Conservative braking guide, accounting for 100 ms server steps and reaction time. */
export function brakingGuide(track:Track,p:Player){
 const speed=p.speed/CONFIG.speedBasisMs*1000;
 const deceleration=CONFIG.braking*(CAR_STATS[p.car]??CAR_STATS.hatch).brake/CONFIG.speedBasisMs*1000/(CONFIG.speedBasisMs/1000);
 const candidates=track.curves.filter(c=>c.end>=p.position&&c.start<=p.position+CONFIG.sight).map(curve=>{const distance=Math.max(0,curve.start-p.position),safe=cornerRules(curve,p).safe,safeSpeed=safe/CONFIG.speedBasisMs*1000;const brakingDistance=Math.max(0,(speed*speed-safeSpeed*safeSpeed)/(2*deceleration))+speed*.9;return {curve,distance,safe,brakingDistance,margin:p.speed>safe?distance-brakingDistance:Infinity}});
 const urgent=candidates.filter(c=>c.margin<=speed*2).sort((a,b)=>a.margin-b.margin)[0];const chosen=urgent??candidates[0];
 if(!chosen)return {state:'clear' as const,distance:0,brakingDistance:0,curve:undefined};
 const {distance,brakingDistance,curve,safe}=chosen;const state=p.speed<=safe?'safe' as const:distance<=brakingDistance?'brake' as const:distance<=brakingDistance+speed*2?'prepare' as const:'clear' as const;
 return {state,distance,brakingDistance,curve};
}
export function recommendAction(track:Track,p:Player): {action:Action;reason:string} {
 const guide=brakingGuide(track,p),curve=guide.curve;
 if(!curve)return {action:p.speed<CONFIG.maxSpeed?'accelerate':'hold',reason:'ทางข้างหน้าโล่ง'};
 const safe=cornerRules(curve,p).safe,inside=p.position>=curve.start;
 if(guide.state==='brake')return {action:'brake',reason:'ลดความเร็วก่อนเข้าโค้ง'};
 if((inside||guide.state==='prepare')&&p.speed+CONFIG.acceleration*.04>safe)return {action:'hold',reason:'รักษาการเกาะในโค้ง เตรียมเร่งเมื่อพ้นโค้ง'};
 return {action:p.speed<CONFIG.maxSpeed?'accelerate':'hold',reason:'ยังมีระยะให้เร่ง'};
}
export function riskFor(track:Track,p:Player,c:Command){ const speed=speedFor(p,c); const curve=track.curves.find(x=>p.position<=x.end && p.position+speed+CONFIG.clearBonus>=x.start); return curve && curve.danger==='cliff' && speed>curve.safe+CONFIG.handling+CONFIG.dangerousExcess ? 0.25:0; }
export function resolveRound(players:Player[],track:Track,commands:Record<string,Command>,random:()=>number=Math.random,options?:{frontGap?:number}):Player[] {
 const original=players.map(p=>({...p})); const order=original.filter(p=>p.status==='racing'&&!p.spectator).sort((a,b)=>b.position-a.position || a.id.localeCompare(b.id));
 const updated=new Map<string,Player>(); let passingReserved=false;
 for(const p of order){ let cmd=commands[p.id]||DEFAULT_COMMAND; let speed=speedFor(p,cmd); let event=''; let passed=false; let passFrontId:string|undefined;
   if(riskFor(track,p,cmd)>0&&!cmd.riskConfirmed){ speed=Math.min(speed, Math.max(0,(nextCurve(track,p.position)?.safe??speed)+CONFIG.handling)); event='ชะลออัตโนมัติ: ไม่ยืนยันความเสี่ยง'; }
   const ahead=order.find(q=>q.position>p.position); const open=options?.frontGap!==undefined?options.frontGap>CONFIG.clearGap:!ahead || ahead.position-p.position>CONFIG.clearGap; const inCurve=track.curves.some(c=>p.position>=c.start&&p.position<=c.end);
   let distance=Math.max(0,speed+(cmd.action==='accelerate'&&open&&!inCurve?CONFIG.clearBonus:0)); let target=p.position+distance; let status:Player['status']='racing';
   const maneuverSpeed=speed;
   for(const curve of track.curves.filter(c=>p.position<c.start && target>=c.start || p.position>=c.start && p.position<=c.end && speed>c.safe+CONFIG.handling && p.speed<=c.safe+CONFIG.handling)){
     const excess=speed-(curve.safe+CONFIG.handling); if(excess>CONFIG.dangerousExcess&&curve.danger==='cliff'&&cmd.riskConfirmed){if(random()<0.25){status='dead';target=curve.start;event='เสียชีวิตที่โค้งหน้าผา'; break;} speed=Math.max(0,speed-CONFIG.cliffSlowdown); target=Math.min(target,curve.start+5); event='เสียการควบคุม • เสียความเร็ว';}
     else if(excess>CONFIG.moderateExcess){speed=Math.max(0,speed-CONFIG.majorSlowdown);target=Math.min(target,curve.start+8);event='เข้าโค้งเร็วเกิน • เสียความเร็ว';}
     else if(excess>0){speed=Math.max(0,speed-CONFIG.minorSlowdown);target=Math.min(target,curve.start+12);event='เข้าโค้งเร็ว • เสียความเร็ว';}
   }
   // Passing in a bend is possible only at a safe speed for the bend.
   const affectedCurves=track.curves.filter(c=>p.position<=c.end && target>=c.start);
   const passingSafe=affectedCurves.every(c=>maneuverSpeed<=c.safe+CONFIG.handling);
   // Keep a following car behind a finisher until it clears the finish line.
   // A faster follower may use the passing lane only when passing is legal.
   const oldFront=order.filter(q=>q.position>p.position).sort((a,b)=>a.position-b.position)[0];
   const finishedFront=oldFront&&updated.get(oldFront.id);
   if(status==='racing'&&finishedFront?.status==='finished'&&finishedFront.finishTime){
     const frontMove=(CONFIG.length-finishedFront.previous)/finishedFront.finishTime;
     const allowed=frontMove+Math.max(0,finishedFront.previous-p.position-CONFIG.gap)/finishedFront.finishTime;
     const proposed=target-p.position;
     if(proposed>allowed){
       const cross=(finishedFront.previous-p.position)/(proposed-frontMove);
       if(!passingReserved&&cmd.overtake&&passingSafe&&cross>0&&cross<finishedFront.finishTime){passingReserved=true;passed=true;passFrontId=finishedFront.id;event='แซงสำเร็จ';}
       else{target=p.position+Math.max(0,allowed);speed=Math.min(speed,Math.max(0,target-p.position));event=event||'ชะลอต่อท้าย';}
     }
   }
   const blockers=order.filter(q=>q.id!==p.id && q.position>p.position).map(q=>updated.get(q.id)!).filter(Boolean).filter(q=>q.status==='racing').sort((a,b)=>a.position-b.position);
   const front=blockers[0];
   if(status==='racing'&&front){
     const second=blockers[1];
     // Do not let the passing bonus carry a car into a new, unchecked curve.
     const unchecked=track.curves.find(c=>c.start>target && c.start<=target+CONFIG.passBonus);
     const bonus=event.startsWith('เข้าโค้ง')||event.startsWith('เสียการควบคุม')?0:affectedCurves.length?CONFIG.passBonus/2:CONFIG.passBonus;
     const passTarget=Math.min(target+bonus,unchecked?unchecked.start-0.001:Infinity);
     const canPass=!passingReserved&&cmd.overtake&&passingSafe&&passTarget>=front.position+CONFIG.gap&&(!second||passTarget<=second.position-CONFIG.gap);
     if(canPass){target=passTarget;passingReserved=true;passed=true;passFrontId=front.id;event=event||'แซงสำเร็จ';}
     else if(target>=front.position-CONFIG.gap){target=Math.max(p.position,front.position-CONFIG.gap);speed=Math.min(speed,front.speed,Math.max(0,target-p.position));event=event||'ชะลอต่อท้าย';}
   }
   const finishTime=target>=CONFIG.length ? (CONFIG.length-p.position)/Math.max(1,target-p.position) : undefined; if(status==='racing'&&finishTime!==undefined){status='finished';event='เข้าเส้นชัย';}
   updated.set(p.id,{...p,previous:p.position,position:Math.min(CONFIG.length,target),speed,status,finishTime,passed,passFrontId,lastEvent:event||'เดินหน้าตามความเร็ว'});
 }
 return players.map(p=>updated.get(p.id)||p);
}



