/** Vertical field of view that keeps horizontal perspective within a given limit. */
export function boundedVerticalFov(aspect:number, maxHorizontal=90, preferredVertical=68):number {
 const safeAspect=Number.isFinite(aspect)&&aspect>0?aspect:1;
 const horizontal=Math.max(1,Math.min(179,maxHorizontal))*Math.PI/180;
 const verticalLimit=2*Math.atan(Math.tan(horizontal/2)/safeAspect)*180/Math.PI;
 return Math.min(preferredVertical,verticalLimit);
}
