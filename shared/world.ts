import {CatmullRomCurve3,Vector3} from 'three';
import {CONFIG,type Track,type Player} from './game';
/** One rendered unit is one metre along the road centreline. */
export function worldCurve(track:Track){const source=track.route??Array.from({length:101},(_,i)=>[-150+i*3,1+28*Math.sin(Math.PI*i/100),0] as [number,number,number]);const raw=new CatmullRomCurve3(source.map(p=>new Vector3(...p)));raw.arcLengthDivisions=16000;const scale=(track.length??CONFIG.length)/raw.getLength();const curve=new CatmullRomCurve3(source.map(p=>new Vector3(...p).multiplyScalar(scale)));curve.arcLengthDivisions=16000;return curve;}
export function actualSpeedKmh(previous:number,current:number,dtMs:number){return dtMs>0?Math.max(0,current-previous)*3600/dtMs:0}
export function displayedSpeed(p:Player){return p.groundSpeedKmh??p.speed*3600/CONFIG.speedBasisMs}
