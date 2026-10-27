import {CONFIG,DEFAULT_COMMAND,resolveRound,speedFor,type Command,type Player,type Track} from './game';
import {motionAt} from './motion';
type Lane=0|1;
const laneOf=(p:Player):Lane=>p.lane===1?1:0;
/** A slightly conservative lateral threshold keeps changing cars separated. */
const LATERAL_CLEARANCE=.4;
/** Server decides motion independently in both lanes, then reserves safe lane changes. */
export function resolveLanes(players:Player[],track:Track,commands:Record<string,Command>,random:()=>number=Math.random):Player[]{
 const plain=Object.fromEntries(Object.entries(commands).map(([id,c])=>[id,{...c,overtake:false}]));
 const results=new Map<string,Player>();
 for(const lane of [0,1] as const){
  const group=players.filter(p=>!p.spectator&&p.status==='racing'&&laneOf(p)===lane);
  for(const p of resolveRound(group,track,plain,random))results.set(p.id,{...p,previousLane:lane,lane});
 }
 for(const p of players)if(!results.has(p.id))results.set(p.id,p);
 const priority=players.filter(p=>!p.spectator&&p.status==='racing').sort((a,b)=>b.position-a.position||a.id.localeCompare(b.id));
 // Keep the original one-opponent-per-round rule while both lanes remain usable.
 // If a cap slows a car, propagate the lower speed to followers in its lane.
 for(let pass=0;pass<players.length*2;pass++){
  let changed=false;
  for(const old of priority){const car=results.get(old.id)!;if(car.status==='dead')continue;
   const crossed=priority.filter(q=>q.id!==old.id&&(q.position>old.position||(q.position===old.position&&q.id<old.id))).map(q=>results.get(q.id)!).filter(q=>q.status!=='dead'&&(car.status==='finished'&&q.status==='finished'?(car.finishTime??1)<(q.finishTime??1):car.position>q.position+1e-7)).sort((a,b)=>a.previous-b.previous||a.id.localeCompare(b.id));
   if(crossed.length>1){const target=Math.max(car.previous,crossed[1].position-.001);if(target<car.position-1e-7){results.set(car.id,{...car,position:target,speed:Math.min(car.speed,Math.max(0,target-car.previous)),status:'racing',finishTime:undefined,lastEvent:'จำกัดแซงหนึ่งคันต่อรอบ'});changed=true;}}
  }
  for(const lane of [0,1] as const){let front:Player|undefined;for(const old of priority.filter(p=>laneOf(p)===lane)){const car=results.get(old.id)!;if(car.status==='dead')continue;if(front&&front.status==='racing'&&car.position>front.position-CONFIG.gap+1e-7){const target=Math.max(car.previous,front.position-CONFIG.gap);if(target<car.position-1e-7){const slowed:Player={...car,position:target,speed:Math.min(car.speed,front.speed,Math.max(0,target-car.previous)),status:'racing',finishTime:undefined,lastEvent:'ชะลอต่อท้าย'};results.set(car.id,slowed);front=slowed;changed=true;continue;}}front=car;}}
  if(!changed)break;
 }
 for(const old of priority){
  const current=results.get(old.id)!;const desired=commands[old.id]?.lane;
  if(desired===undefined||desired===laneOf(old)||current.status!=='racing')continue;
  let move=current.position-current.previous;
  // A boxed-in car may creep forward into an open lane, without jumping into an unchecked bend.
  if(move<=1e-9&&commands[old.id]?.action==='accelerate'){
   const next=track.curves.find(c=>c.start>old.position&&c.start<=old.position+2);
   move=Math.max(0,Math.min(2,speedFor(old,commands[old.id]??DEFAULT_COMMAND),next?next.start-old.position-.001:Infinity));
  }
  if(move<=1e-9){results.set(old.id,{...current,lastEvent:'ต้องเคลื่อนที่ก่อนเปลี่ยนเลน'});continue;}
  const proposed:Player={...current,position:old.position+move,speed:current.position<=current.previous+1e-9?move:current.speed,lane:desired,previousLane:laneOf(old)};
  let safe=true;
  for(const other of results.values()){
   if(other.id===proposed.id||other.spectator||(other.status!=='racing'&&other.status!=='finished'))continue;
   for(let step=0;step<=100;step++){
    const t=step/100;if(other.status==='finished'&&other.finishTime!==undefined&&t>=other.finishTime)continue;
    const a=motionAt(proposed,undefined,t),b=motionAt(other,undefined,t);
    const required=t>=.95&&desired===(other.lane??0)?CONFIG.gap:CONFIG.gap*.65;
    if(Math.abs(a.lane-b.lane)<LATERAL_CLEARANCE&&Math.abs(a.position-b.position)<required-1e-7){safe=false;break;}
   }
   if(!safe)break;
  }
  if(safe){results.set(old.id,{...proposed,lastEvent:current.lastEvent==='เดินหน้าตามความเร็ว'?`เปลี่ยนไปเลน${desired===0?'ซ้าย':'ขวา'}`:current.lastEvent});}
  else results.set(old.id,{...current,lastEvent:'เลนเป้าหมายยังไม่ว่าง รอจังหวะ'});
 }
 return players.map(p=>results.get(p.id)??p);
}
