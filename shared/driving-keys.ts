import type {Action} from './game';
export function keyboardAction(held:ReadonlySet<string>):Action{return held.has('KeyS')?'brake':held.has('KeyW')?'accelerate':'hold'}
export function keyboardLane(lane:number,code:string):0|1|2{return Math.max(0,Math.min(2,lane+(code==='KeyA'?-1:code==='KeyD'?1:0))) as 0|1|2}
