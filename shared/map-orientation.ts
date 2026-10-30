export function mapRotation(x:number,z:number,heading=0){return -(Math.atan2(x,-z)-heading)*180/Math.PI;}
export function mapPanDelta(dx:number,dy:number,degrees:number){const r=degrees*Math.PI/180;return {x:Math.cos(r)*dx+Math.sin(r)*dy,y:-Math.sin(r)*dx+Math.cos(r)*dy};}
