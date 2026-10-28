import {Vector3} from 'three';
import {CONFIG,type Track,type Curve} from './game';
import {worldCurve} from './world';
import {route,metadata} from './data/1081-full';
export const COURSE_LENGTHS={road10:10000,road20:20000,road30:30000,roadFull:39900} as const;
export type RoadMode=keyof typeof COURSE_LENGTHS;
export function make1081Track(length:number=39900):Track{
 const track:Track={seed:10810000+length,length,pace:1,mode:(Object.keys(COURSE_LENGTHS) as RoadMode[]).find(k=>COURSE_LENGTHS[k]===length)??'roadFull',source:'osm1081',name:`${metadata.name} · ${length/1000} กม.`,route:route.slice(0,length/20+1).map(p=>[...p]),curves:[],dashed:[{start:0,end:length}],overtakeZones:[]};
 const path=worldCurve(track);let last:Curve|undefined;
 for(let d=20;d<length-20;d+=20){const a=path.getPointAt((d-10)/length),b=path.getPointAt(d/length),c=path.getPointAt((d+10)/length);const v=b.clone().sub(a),w=c.clone().sub(b);v.y=0;w.y=0;const angle=v.angleTo(w),radius=angle>1e-6?(v.length()+w.length())/2/angle:Infinity;
  if(radius>700){last=undefined;continue;}const insideLane:0|2=v.x*w.z-v.z*w.x>0?2:0;const kind=radius<100?'tight':'wide';const safe=Math.max(30,Math.min(155,Math.sqrt(.6*9.81*radius)*3.6))*CONFIG.speedBasisMs/3600-CONFIG.handling;
  if(last&&last.insideLane===insideLane&&last.kind===kind&&last.end>=d-10){last.end=d+10;last.safe=Math.min(last.safe,safe);last.long=last.end-last.start>120;}
  else {last={start:d-10,end:d+10,safe,danger:'low',dashed:true,insideLane,kind,long:false};track.curves.push(last);}
 }
 for(let i=0;i<track.curves.length;i++){const c=track.curves[i],before=track.curves[i-1]?.end??0,after=track.curves[i+1]?.start??length;if(c.start-before>=150)track.overtakeZones!.push({start:before,end:c.start,kind:'approach'});if(after-c.end>=150)track.overtakeZones!.push({start:c.end,end:after,kind:'exit'});}
 return track;
}
export function validateImportedRoad(points:[number,number,number][]){return points.length>=3&&points.every((p,i)=>p.length===3&&p.every(Number.isFinite)&&(i===0||(()=>{const prev=points[i-1],d=Math.hypot(p[0]-prev[0],p[2]-prev[2]);return d>.05&&d<100&&Math.abs(p[1]-prev[1])/d<.6})()));}
