import {CONFIG} from './game';
export type SightPoint={x:number;y:number;z:number};
export type SightGeometry={pointAt:(distance:number)=>SightPoint; terrainHeight:(x:number,z:number)=>number; lateralOffset?:number};
/** Approximate the continuous forward view against the visible road and terrain. */
export function geometricSightEnd(position:number,geometry:SightGeometry):number {
 const current=Math.max(0,Math.min(CONFIG.length,position));
 const maxEnd=Math.min(CONFIG.length,current+CONFIG.sight);
 if(current>=maxEnd)return maxEnd;
 const center=geometry.pointAt(current),near=geometry.pointAt(Math.min(CONFIG.length,current+1));
 const dx=near.x-center.x,dz=near.z-center.z,norm=Math.hypot(dx,dz)||1;
 const lateral=geometry.lateralOffset??0;
 const eye={x:center.x-dz/norm*lateral,y:center.y+1.6,z:center.z+dx/norm*lateral};
 const look=geometry.pointAt(Math.min(CONFIG.length,current+18));
 const lookNext=geometry.pointAt(Math.min(CONFIG.length,current+19));const lx=lookNext.x-look.x,lz=lookNext.z-look.z,lookNorm=Math.hypot(lx,lz)||1;
 const fx=look.x-lz/lookNorm*lateral-eye.x,fz=look.z+lx/lookNorm*lateral-eye.z,forward=Math.hypot(fx,fz)||1;
 let visible=current;
 for(let distance=Math.min(4,maxEnd-current);distance<=maxEnd-current+1e-9;distance=Math.min(maxEnd-current,distance+4)){
   const target=geometry.pointAt(current+distance);const vx=target.x-eye.x,vz=target.z-eye.z,horizontal=Math.hypot(vx,vz);
   if(distance>=12&&horizontal>0&&(vx*fx+vz*fz)/(horizontal*forward)<Math.SQRT1_2)break;
   const targetY=target.y+.3;const steps=Math.min(24,Math.max(2,Math.ceil(horizontal/1.2)));let blocked=false;
   for(let i=1;i<steps;i++){const t=i/steps;const x=eye.x+(target.x-eye.x)*t,z=eye.z+(target.z-eye.z)*t,y=eye.y+(targetY-eye.y)*t;if(geometry.terrainHeight(x,z)>y+.08){blocked=true;break}}
   if(blocked)break;
   visible=current+distance;
   if(distance>=maxEnd-current)break;
 }
 return Math.max(current,Math.min(maxEnd,visible));
}
