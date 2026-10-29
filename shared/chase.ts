import {CONFIG,type Player,type Track} from './game';
export const CHASE={perRank:.20,max:.80,fadeStart:40,fullGap:100,draftMin:10,draftMax:40,draftAccel:.15,carryMs:2000,transitionMs:2000} as const;
export function chaseAssist(p:Player,players:Player[],track:Track,dt:number,accelerating:boolean){
 const ordered=players.filter(q=>!q.spectator&&(q.status==='racing'||q.status==='finished')).sort((a,b)=>b.position-a.position||a.id.localeCompare(b.id));
 const rank=ordered.findIndex(q=>q.id===p.id),front=ordered.slice(0,Math.max(0,rank)).reverse().find(q=>q.position>p.position),gap=front?front.position-p.position:0;
 const bend=track.curves.some(c=>p.position<=c.end&&p.position+Math.max(20,p.speed*dt/CONFIG.speedBasisMs)>=c.start);
 const valid=accelerating&&!bend&&!(p.recoveryMs??0)&&p.status==='racing';
 const target=valid&&front?Math.min(CHASE.max,Math.max(0,rank)*CHASE.perRank)*Math.max(0,Math.min(1,(gap-CHASE.fadeStart)/(CHASE.fullGap-CHASE.fadeStart))):0;
 const old=p.chaseBonus??0,step=CHASE.max*dt/CHASE.transitionMs;
 const chase=valid&&gap>CHASE.fadeStart?old+Math.max(-step,Math.min(step,target-old)):0;
 const drafting=valid&&!!front&&gap>=CHASE.draftMin&&gap<=CHASE.draftMax&&Math.abs((front.lateral??front.lane??1)-(p.lateral??p.lane??1))<.4;
 const carry=drafting?CHASE.carryMs:Math.max(0,(p.draftCarryMs??0)-dt);
 const draft=valid&&!chase?(drafting?CHASE.draftAccel:CHASE.draftAccel*carry/CHASE.carryMs):0;
 return {chaseBonus:chase,draftBonus:draft,draftCarryMs:valid?carry:0};
}
