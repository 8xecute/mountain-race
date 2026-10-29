import {CONFIG,CAR_STATS,type Player} from './game';
export const SOLO_MAX_KMH=200;
export function speedCeiling(p:Player,players:Player[]){return players.filter(q=>!q.spectator).length===1&&!p.bot?SOLO_MAX_KMH*CONFIG.speedBasisMs/3600:CONFIG.maxSpeed*(CAR_STATS[p.car]??CAR_STATS.hatch).max*(1+(p.chaseBonus??0));}
export const botAcceleration=(p:Player)=>!p.bot?1:p.botLevel==='hard'?1.28:p.botLevel==='medium'||!p.botLevel?1.18:1.10;
