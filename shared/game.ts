import {generateTrack,validateRoad} from './track';
const SPEED_BASIS_MS=3000;
export const CONFIG = { length:2000, speedBasisMs:SPEED_BASIS_MS, tickMs:100, laneChangeMs:1500, botThinkMs:700, initialSpeed:24, maxSpeedKmh:100, maxSpeed:100*SPEED_BASIS_MS/3600, acceleration:12, braking:18, handling:6, gap:10, sight:200, clearGap:45, clearBonus:6, passBonus:36, dangerousExcess:21, moderateExcess:15, minorSlowdown:9, majorSlowdown:15, cliffSlowdown:18 } as const;
export type Action = 'brake'|'hold'|'accelerate';
export type Command = { action:Action; overtake:boolean; riskConfirmed:boolean; lane?:0|1 };
export type Curve = {start:number; end:number; safe:number; danger:'low'|'cliff'; dashed:boolean; kind?:'wide'|'tight'; long?:boolean};
export type Player = {id:string; name:string; color:string; car:string; ready:boolean; connected:boolean; spectator:boolean; position:number; previous:number; speed:number; status:'racing'|'finished'|'dead'; finishTime?:number; passed?:boolean; passFrontId?:string; lane?:0|1; previousLane?:0|1; lateral?:number; previousLateral?:number; riskCurve?:number; bot?:boolean; lastEvent?:string};
export type Track = {seed:number; curves:Curve[]; dashed:{start:number;end:number}[]; route?:[number,number,number][]};
export const DEFAULT_COMMAND:Command = {action:'hold',overtake:false,riskConfirmed:false};
export function makeTrack(seed:number):Track {return generateTrack(seed,CONFIG.length);}
export function validateTrack(t:Track) {return t.curves.length>0&&t.curves.every((c,i)=>c.start>=0&&c.start<c.end&&c.end<=CONFIG.length&&c.safe>0&&(!i||t.curves[i-1].end<c.start))&&t.dashed.every(d=>d.end-d.start>=20)&&t.dashed[0]?.start===0&&t.dashed.at(-1)?.end===CONFIG.length&&(!t.route||validateRoad(t.route));}
export function nextCurve(track:Track,pos:number) {return track.curves.find(c=>c.end>=pos);}
export function speedFor(p:Player,c:Command){return Math.max(0,Math.min(CONFIG.maxSpeed,p.speed+(c.action==='accelerate'?CONFIG.acceleration:c.action==='brake'?-CONFIG.braking:0)));}
export function recommendAction(track:Track,p:Player): {action:Action;reason:string} {
 const curve=nextCurve(track,p.position);
 if(!curve)return {action:p.speed<CONFIG.maxSpeed?'accelerate':'hold',reason:'ทางข้างหน้าโล่ง'};
 const safe=curve.safe+CONFIG.handling, distance=Math.max(0,curve.start-p.position);
 const accelerated=Math.min(CONFIG.maxSpeed,p.speed+CONFIG.acceleration);
 let v=accelerated, brakingDistance=0;
 while(v>safe){v=Math.max(0,v-CONFIG.braking);brakingDistance+=v;}
 if(distance<=accelerated+brakingDistance+CONFIG.clearBonus){
   if(p.speed>safe)return {action:'brake',reason:'เตรียมความเร็วให้พอดีก่อนเข้าโค้ง'};
   if(accelerated>safe)return {action:'hold',reason:'ใกล้โค้งแล้ว รักษาความเร็วปลอดภัย'};
 }
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

