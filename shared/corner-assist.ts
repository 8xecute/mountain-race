import type {Player} from './game';
/** Optional assistance is available to the rear half, never the leader or solo driver. */
export function cornerAssistEligible(p:Player,players:Player[]){const racers=players.filter(q=>!q.spectator&&(q.status==='racing'||q.status==='finished')).sort((a,b)=>b.position-a.position||a.id.localeCompare(b.id));const rank=racers.findIndex(q=>q.id===p.id);return !p.bot&&!p.spectator&&p.status==='racing'&&racers.length>=2&&rank>=Math.ceil(racers.length/2);}
