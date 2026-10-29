import type {Player} from './game';
import type {TrafficState} from './traffic';
export function bufferedPlayer(previous:Player,next:Player):Player{return {...next,previous:previous.position,previousLateral:previous.lateral??previous.lane??0};}

type TimedState={serverNow:number;animationStart:number;animationEnd:number;players:Player[];traffic?:TrafficState};
/** Pick the interpolation bracket on the render frame, not the React update timer. */
export class RenderTimeline<T extends TimedState>{
 private queue:T[]=[];
 private cached?:{a:T;b:T;state:T};
 constructor(readonly delay=200){}
 clear(){this.queue=[];this.cached=undefined;}
 push(state:T){
  const last=this.queue.at(-1);
  if(last&&state.serverNow<last.serverNow)return;
  if(last?.serverNow===state.serverNow)this.queue[this.queue.length-1]=state;
  else this.queue.push(state);
  if(this.queue.length>100)this.queue.shift();
 }
 sample(serverNow:number):T|undefined{
  const at=serverNow-this.delay,q=this.queue;
  while(q.length>2&&q[1].serverNow<=at)q.shift();
  const a=q[0],b=q[1];if(!a)return;
  // The first state has no preceding sample. Hold it until a bracket arrives.
  if(!b||at<a.serverNow)return {...a,players:a.players.map(p=>({...p,previous:p.position,previousLateral:p.lateral})),animationStart:a.serverNow+this.delay,animationEnd:a.serverNow+this.delay+1};
  if(this.cached?.a===a&&this.cached.b===b)return this.cached.state;
  const previous=new Map(a.players.map(p=>[p.id,p]));
  const players=b.players.map(p=>{const prev=previous.get(p.id);return prev?bufferedPlayer(prev,p):p});
  const cars=new Map(a.traffic?.cars.map(c=>[c.id,c]));
  const traffic=b.traffic?{...b.traffic,cars:b.traffic.cars.map(c=>({...c,previous:cars.get(c.id)?.position??c.position}))}:undefined;
  const state={...b,players,traffic,animationStart:a.serverNow+this.delay,animationEnd:b.serverNow+this.delay};
  this.cached={a,b,state};return state;
 }
}
