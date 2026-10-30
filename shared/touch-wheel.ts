export const WHEEL_MAX_DEGREES=120;
export function wheelDelta(previous:number,current:number){return Math.atan2(Math.sin(current-previous),Math.cos(current-previous))*180/Math.PI;}
export function wheelInput(current:number,deltaDegrees:number){return Math.max(-1,Math.min(1,current+deltaDegrees/WHEEL_MAX_DEGREES));}
