import React,{useEffect,useMemo,useRef} from 'react';import {useFrame} from '@react-three/fiber';import * as THREE from 'three';
import {CONFIG,type Player} from '../shared/game';import {motionAt} from '../shared/motion';import {displayedSpeed} from '../shared/world';
type State={players:Player[];track:{length?:number};phase:string;animationStart:number;animationEnd:number};
function Bar({from,to,width=.035}:{from:[number,number,number];to:[number,number,number];width?:number}){const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),d=b.clone().sub(a);return <mesh position={a.add(b).multiplyScalar(.5)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize())}><boxGeometry args={[width,d.length(),width]}/><meshStandardMaterial color="#222b32" roughness={.85}/></mesh>}
/** Interior is anchored to the car, so turning the driver's head reveals the cabin. */
export function Cockpit({live,selected,curve,offset}:{live:React.RefObject<State>;selected:string;curve:THREE.CatmullRomCurve3;offset:number}){
 const group=useRef<THREE.Group>(null),wheel=useRef<THREE.Group>(null),elapsed=useRef(1);
 const dash=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=512;canvas.height=192;return {canvas,texture:new THREE.CanvasTexture(canvas)}},[]);
 useEffect(()=>()=>dash.texture.dispose(),[dash]);
 useFrame((_,dt)=>{const state=live.current,p=state.players.find(p=>p.id===selected);if(!p||!group.current)return;const u=state.phase==='race'?Math.max(0,Math.min(1,(Date.now()+offset-state.animationStart)/Math.max(1,state.animationEnd-state.animationStart))):1,frame=motionAt(p,undefined,u),t=Math.min(1,Math.max(0,frame.position/(state.track.length??CONFIG.length))),point=curve.getPointAt(t),tan=curve.getTangentAt(t),side=new THREE.Vector3(-tan.z,0,tan.x).normalize();group.current.position.copy(point).addScaledVector(side,(frame.lane-1)*1.96);group.current.rotation.set(-Math.atan2(tan.y,Math.hypot(tan.x,tan.z)),Math.atan2(tan.x,tan.z),0,'YXZ');group.current.visible=!(p.recoveryMs??0);
  if(wheel.current)wheel.current.rotation.z=THREE.MathUtils.damp(wheel.current.rotation.z,-(p.steeringInput??0)*.8,10,dt);
  elapsed.current+=dt;if(elapsed.current>.12){elapsed.current=0;const ctx=dash.canvas.getContext('2d')!;ctx.fillStyle='#07151b';ctx.fillRect(0,0,512,192);ctx.strokeStyle='#60cfd0';ctx.lineWidth=8;ctx.beginPath();ctx.arc(100,110,75,Math.PI*.75,Math.PI*2.25);ctx.stroke();ctx.strokeStyle='#f3b459';ctx.beginPath();ctx.arc(410,110,75,Math.PI*.75,Math.PI*.75+Math.PI*1.5*Math.min(1,displayedSpeed(p)/(CONFIG.maxSpeedKmh*(1+(p.chaseBonus??0)))));ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#f1f5f6';ctx.font='bold 74px sans-serif';ctx.fillText(String(Math.round(displayedSpeed(p))),255,112);ctx.font='23px sans-serif';ctx.fillStyle='#93b9c4';ctx.fillText('km/h',255,150);ctx.font='bold 34px sans-serif';ctx.fillText(p.speed>0?'D':'N',100,123);ctx.font='22px sans-serif';ctx.fillText('RPM',410,121);dash.texture.needsUpdate=true;}
 });
 const box=(position:[number,number,number],size:[number,number,number],color='#242c33',rotation:[number,number,number]=[0,0,0])=><mesh position={position} rotation={rotation}><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.78}/></mesh>;
 return <group ref={group} userData={{driverId:selected}}>
  <group position={[-.18,-.08,.55]} scale={.85}>
  {box([0,.72,.52],[1.2,.25,.36])}{box([0,.86,.55],[1.16,.05,.38],'#303941',[-.12,0,0])}
  {box([-.25,1.005,.53],[.41,.16,.035],'#111b23',[.12,0,0])}
  <mesh position={[-.25,1.011,.506]} rotation={[.12,Math.PI,0]}><planeGeometry args={[.37,.139]}/><meshBasicMaterial map={dash.texture}/></mesh>
  {box([.14,.87,.43],[.23,.14,.045],'#0c171f')}
  {box([.14,.875,.404],[.19,.095,.012],'#304c60')}
  {[-.42,-.17,.48].map((x,i)=><group key={i}>{box([x,.85,.36],[.13,.04,.035],'#0b1217')}{[0,1,2].map(j=><group key={j}>{box([x,.838+j*.012,.337],[.12,.003,.006],'#64717a')}</group>)}</group>)}
  {box([.08,.55,.12],[.20,.23,.48],'#252b31')}
  {box([.08,.70,.1],[.045,.12,.045],'#a2abb0')}{box([.08,.77,.1],[.07,.06,.085],'#17222a')}
  {/* Right hand drive wheel, with a three-spoke hub and steering animation. */}
  <group position={[-.25,1.0,.26]} rotation={[-.25,0,0]}><group ref={wheel}>
   <mesh><torusGeometry args={[.125,.014,8,32]}/><meshStandardMaterial color="#11191f" roughness={.7}/></mesh>
   {[Math.PI/2,-Math.PI/2,Math.PI].map(i=><group key={i} rotation={[0,0,i]}>{box([0,.065,0],[.023,.12,.022],'#6b747c')}</group>)}
   {box([0,0,0],[.095,.07,.044],'#202c34')}
  </group></group>
  </group>
  {/* Sloping A pillars and real transparent glass instead of a flat screen border. */}
  {[-1,1].map(side=><group key={side}>
   <Bar from={[side*.59,.77,.76]} to={[side*.49,1.46,.43]} width={.05}/>
   <Bar from={[side*.59,.76,-.38]} to={[side*.49,1.46,-.32]} width={.065}/>
   {box([side*.60,.69,-.05],[.065,.17,1.06])}
   <mesh position={[side*.585,1.10,.08]} rotation={[0,Math.PI/2,0]}><planeGeometry args={[1.04,.6]}/><meshStandardMaterial color="#b8d9df" transparent opacity={.035} roughness={.08} side={THREE.DoubleSide} depthWrite={false}/></mesh>
  </group>)}
  <Bar from={[-.49,1.46,.43]} to={[.49,1.46,.43]} width={.055}/>
  <mesh position={[0,1.11,.60]} rotation={[.45,0,0]}><planeGeometry args={[1.10,.73]}/><meshStandardMaterial color="#bcdfe8" transparent opacity={.035} roughness={.05} depthWrite={false} side={THREE.DoubleSide}/></mesh>
  {box([0,1.39,.39],[.05,.10,.03])}{box([0,1.34,.36],[.25,.075,.035],'#131d25')}
 </group>;
}
