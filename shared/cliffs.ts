export const cliffDepth=(roadHeight:number)=>Math.max(0,Math.min(65,(roadHeight-80)*.6));
export function cliffDrop(distance:number,side:number,height:number){return side>0?cliffDepth(height)*Math.max(0,Math.min(1,(distance-8)/14)):0;}
