import {roadCar} from './cars';
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export const STEERING={maxAngle:.55,lateralAcceleration:10,responseMs:180,counterResponseMs:90,deadZone:.025,substepMs:20} as const;
/** Front-wheel bicycle model. Integrate wheel response so 100/200 ms server steps agree. */
export function frontSteering(car:string,input:number,previous:number,speedKmh:number,distance:number,dtMs:number,gripAssist=1){
 const wheelbase=roadCar(car).length*1.45*.64,v=Math.max(0,speedKmh)/3.6;
 const limit=Math.min(STEERING.maxAngle,Math.atan(STEERING.lateralAcceleration*roadCar(car).handling*gripAssist*wheelbase/(v*v+10)));
 const axis=Math.abs(input)<=STEERING.deadZone?0:Math.sign(input)*(Math.abs(clamp(input,-1,1))-STEERING.deadZone)/(1-STEERING.deadZone);
 const target=-Math.sign(axis)*Math.abs(axis)**1.2*limit;
 let angle=clamp(previous,-limit,limit),turn=0,slip=0;
 const duration=Math.max(0,dtMs),steps=Math.max(1,Math.ceil(duration/STEERING.substepMs));
 for(let i=0;i<steps;i++){const response=angle*target<0||Math.abs(target)<Math.abs(angle)?STEERING.counterResponseMs:STEERING.responseMs;const next=angle+(target-angle)*(1-Math.exp(-duration/steps/response));const average=(angle+next)/2;turn+=Math.max(0,distance)/steps/wheelbase*Math.tan(average);slip+=Math.atan(.5*Math.tan(average))/steps;angle=next;}
 return {angle,turn,slip};
}
export function ackermannAngle(angle:number,wheelbase:number,side:number){if(Math.abs(angle)<1e-6)return 0;const radius=wheelbase/Math.tan(angle);return Math.atan(wheelbase/(radius-side*.535));}
