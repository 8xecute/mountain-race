/** Vertical field of view that keeps horizontal perspective within a given limit. */
export function boundedVerticalFov(aspect:number, maxHorizontal=90, preferredVertical=68):number {
 const safeAspect=Number.isFinite(aspect)&&aspect>0?aspect:1;
 const horizontal=Math.max(1,Math.min(179,maxHorizontal))*Math.PI/180;
 const verticalLimit=2*Math.atan(Math.tan(horizontal/2)/safeAspect)*180/Math.PI;
 return Math.min(preferredVertical,verticalLimit);
}
/** Fit a bounding sphere with padding even on narrow portrait viewports. */
export function overviewDistance(radius:number,verticalFov:number,aspect:number){const halfV=verticalFov*Math.PI/360,halfH=Math.atan(Math.tan(halfV)*Math.max(.1,aspect));return Math.max(30,radius/Math.sin(Math.min(halfV,halfH)))*1.2;}
