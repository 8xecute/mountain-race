import {type Player} from './game';
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(x:number)=>{const t=clamp(x);return t*t*(3-2*t)};
export function basicPosition(p:Player,progress:number){const fraction=p.status==='finished'&&p.finishTime ? clamp(progress/p.finishTime):clamp(progress);return p.previous+(p.position-p.previous)*fraction;}
/** Interpolate a server-approved pass while retaining the server's travel timing. */
export function motionAt(p:Player,_front:Player|undefined,progress:number):{position:number;lane:number}{
  const end=p.status==='finished'&&p.finishTime?Math.min(1,p.finishTime):1;
  const u=clamp(progress/end);
  if(p.lateral!==undefined){const from=p.previousLateral??p.lateral;return {position:basicPosition(p,progress),lane:from+(p.lateral-from)*clamp(progress)};}
  if(p.lane!==undefined){
    const from=p.previousLane??p.lane;
    const lane=from===p.lane?p.lane:from===0?smooth(u):1-smooth(u);
    return {position:basicPosition(p,progress),lane};
  }
  if(!p.passed)return {position:basicPosition(p,progress),lane:0};
  // Change lanes first, pass in the middle, then return after clearing the car.
  // A finisher stays in the passing lane until it leaves the track.
  const lane=u<.25?smooth(u/.25):u<.75||p.status==='finished'?1:smooth((1-u)/.25);
  return {position:basicPosition(p,progress),lane};
}
