import type {Player} from './game';
export const LEADER_REVEAL_METRES=100;
export function advanceRevealedDistance(previous:number,players:Player[],length:number){const leader=players.filter(p=>!p.spectator&&p.status==='racing').sort((a,b)=>b.position-a.position||a.id.localeCompare(b.id))[0];return Math.min(length,Math.max(0,previous,leader?leader.position+LEADER_REVEAL_METRES:0));}
