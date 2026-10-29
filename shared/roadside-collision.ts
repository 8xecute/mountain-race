export const ROADSIDE={postSpacing:8,postOffset:3.65,postHalfWidth:.07,carHalfWidth:.65,carHalfLength:1.75,blinkMs:1000} as const;
export const roadsidePostCount=(worldLength:number)=>Math.max(1,Math.floor(worldLength/ROADSIDE.postSpacing));
/** Swept car rectangle against the same posts used by the scenery, including fast ticks. */
export function hitRoadsidePost(from:number,to:number,fromLane:number,toLane:number,length:number,count:number){
 const spacing=length/count,halfWidth=ROADSIDE.carHalfWidth+ROADSIDE.postHalfWidth,halfLength=ROADSIDE.carHalfLength+ROADSIDE.postHalfWidth;
 const x0=(fromLane-1)*1.96,dx=(toLane-fromLane)*1.96,dz=to-from;
 let first:{fraction:number;side:number}|undefined;
 for(let i=Math.max(0,Math.ceil((Math.min(from,to)-halfLength)/spacing));i<=Math.min(count,Math.floor((Math.max(from,to)+halfLength)/spacing));i++)for(const side of [-1,1]){
  let enter=0,exit=1;
  for(const [origin,delta,centre,half] of [[from,dz,i*spacing,halfLength],[x0,dx,side*ROADSIDE.postOffset,halfWidth]]){
   if(Math.abs(delta)<1e-9){if(Math.abs(origin-centre)>half){enter=2;break;}}
   else{const a=(centre-half-origin)/delta,b=(centre+half-origin)/delta;enter=Math.max(enter,Math.min(a,b));exit=Math.min(exit,Math.max(a,b));}
  }
  if(enter<=exit&&enter<=1&&(!first||enter<first.fraction))first={fraction:enter,side};
 }
 return first;
}
