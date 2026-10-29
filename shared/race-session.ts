export const ROOM_IDLE_MS=10*60*1000;
export function recoveryRankDelay(rank:number){return rank===0?2000:rank===1?1500:rank===2?1000:0;}
export function shouldExpireRoom(lastHumanSeen:number,now:number){return now-lastHumanSeen>=ROOM_IDLE_MS;}
