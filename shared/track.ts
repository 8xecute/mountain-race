import {CatmullRomCurve3,Vector3} from 'three';
import type {Curve,Track} from './game';
type Pattern={start:number;end:number;kind:'wide'|'tight';long:boolean;direction:number;amplitude:number};
function random(seed:number){let x=seed>>>0||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}}
const elevationKeys:[[number,number],...Array<[number,number]>]=[[0,1],[.18,15],[.30,11],[.42,19],[.52,17],[.61,25],[.82,7],[.90,10],[1,1]];
export function roadElevation(t:number){for(let i=1;i<elevationKeys.length;i++){const [end,b]=elevationKeys[i], [start,a]=elevationKeys[i-1];if(t<=end){const u=Math.max(0,Math.min(1,(t-start)/(end-start)));return a+(b-a)*u*u*(3-2*u)}}return elevationKeys.at(-1)![1]}
/** Generate a smooth point-to-point mountain road and distance-based rules from the same path. */
export function generateTrack(seed:number,length:number):Track {
 const rand=random(seed);
 const template:[number,number,'wide'|'tight',boolean][]=[[.04,.115,'wide',false],[.14,.195,'tight',false],[.215,.34,'wide',true],[.46,.505,'tight',false],[.535,.69,'wide',true],[.73,.775,'tight',false],[.81,.90,'wide',false]];
 const patterns:Pattern[]=template.map(([start,end,kind,long],i)=>{const jitter=(rand()-.5)*.008;const a=start+jitter,b=end+jitter;const span=(b-a)*300;return {start:a,end:b,kind,long,direction:(i+(rand()<.5?0:1))%2?1:-1,amplitude:span*(kind==='tight'?.17:.24)*(0.9+rand()*.2)}});
 const points=Array.from({length:201},(_,i)=>{const t=i/200;let z=0;for(const p of patterns){if(t<=p.start||t>=p.end)continue;const u=(t-p.start)/(p.end-p.start);z+=p.direction*p.amplitude*(1-Math.cos(2*Math.PI*u))/2}return new Vector3(-150+300*t,roadElevation(t),z)});
 const path=new CatmullRomCurve3(points);path.arcLengthDivisions=2000;const lengths=path.getLengths(2000),total=lengths[lengths.length-1];const distance=(t:number)=>Math.round(lengths[Math.max(0,Math.min(2000,Math.round(t*2000)))]/total*length);
 const curves:Curve[]=patterns.map((p,i)=>({start:distance(p.start),end:distance(p.end),safe:p.kind==='tight'?36+3*Math.floor(rand()*3):54+3*Math.floor(rand()*4),danger:(i===1||i===4||rand()<.18)?'cliff':'low',dashed:true,kind:p.kind,long:p.long,insideLane:p.direction>0?0:2}));
 const overtakeZones:NonNullable<Track['overtakeZones']>=[];for(let i=0;i<curves.length;i++){const c=curves[i],before=curves[i-1]?.end??0,after=curves[i+1]?.start??length;if(c.kind==='tight'&&c.start-before>=180)overtakeZones.push({start:before,end:c.start,kind:'approach'});if(after-c.end>=180)overtakeZones.push({start:c.end,end:after,kind:'exit'});}return {length,seed,curves,overtakeZones,dashed:[{start:0,end:length}],route:points.map(p=>[p.x,p.y,p.z] as [number,number,number])};
}



/** Validate continuity, summit profile and an approximate minimum turn radius. */
export function validateRoad(points:[number,number,number][]):boolean {
 if(points.length<3||points.some((p,i)=>p.length!==3||!p.every(Number.isFinite)||(i>0&&p[0]<=points[i-1][0])))return false;
 const peak=Math.max(...points.map(p=>p[1]));const peakIndex=points.findIndex(p=>p[1]===peak);
 if(peakIndex<points.length*.3||peakIndex>points.length*.7||peak<Math.max(points[0][1],points.at(-1)![1])+5)return false;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],horizontal=Math.hypot(b[0]-a[0],b[2]-a[2]);if(horizontal<=0||horizontal>10||Math.abs(b[1]-a[1])/horizontal>.5)return false;}
 const curve=new CatmullRomCurve3(points.map(p=>new Vector3(...p)));curve.arcLengthDivisions=1000;
 for(let i=1;i<500;i++){const a=curve.getPointAt((i-1)/500),b=curve.getPointAt(i/500),c=curve.getPointAt((i+1)/500),v=b.clone().sub(a),w=c.clone().sub(b),angle=v.angleTo(w);if(angle>1e-5&&(v.length()+w.length())/2/angle<=2.2)return false;}
 return true;
}

