import {roadCar} from './cars';
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
/** Kinematic front-steered bicycle model, with speed-sensitive steering travel. */
export function frontSteering(car:string,input:number,previous:number,speedKmh:number,distance:number,dtMs:number,gripAssist=1){const wheelbase=roadCar(car).length*1.45*.64,v=Math.max(0,speedKmh)/3.6;const limit=Math.min(.55,Math.atan(8*roadCar(car).handling*gripAssist*wheelbase/(v*v+10)));const target=-Math.sign(input)*Math.abs(clamp(input,-1,1))**1.35*limit;const angle=previous+(target-previous)*(1-Math.exp(-Math.max(0,dtMs)/200));const average=(previous+angle)/2;return {angle,turn:distance>0?distance/wheelbase*Math.tan(average):0,slip:Math.atan(.5*Math.tan(average))};}
export function ackermannAngle(angle:number,wheelbase:number,side:number){if(Math.abs(angle)<1e-6)return 0;const radius=wheelbase/Math.tan(angle);return Math.atan(wheelbase/(radius-side*.535));}

