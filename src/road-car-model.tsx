import {ackermannAngle} from '../shared/front-steering';
import {Canvas,useFrame} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import React,{useMemo,useRef} from 'react';import * as THREE from 'three';import {roadCar} from '../shared/cars';import {CAR_APPEARANCE} from './car-appearance';

type Station=[number,number,number];
function Pillar({from,to,color,ghost}:{from:[number,number,number];to:[number,number,number];color:string;ghost:boolean}){const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),direction=b.clone().sub(a);return <mesh position={a.add(b).multiplyScalar(.5)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize())}><boxGeometry args={[.042,direction.length(),.045]}/><meshStandardMaterial color={color} metalness={.4} roughness={.3} transparent={ghost} opacity={ghost?.26:1} depthWrite={!ghost}/></mesh>}
function shell(stations:Station[],bottom:number){const vertices:number[]=[],indices:number[]=[];for(const [z,w,h] of stations)vertices.push(-w*.86,bottom,z,w*.86,bottom,z,w,h-.055,z,w*.82,h,z,-w*.82,h,z,-w,h-.055,z);for(let i=0;i<stations.length-1;i++)for(let j=0;j<6;j++){const a=i*6+j,b=i*6+(j+1)%6;indices.push(a,b,a+6,b,b+6,a+6)}indices.push(0,2,1,0,5,2,5,4,2,4,3,2);const n=(stations.length-1)*6;indices.push(n,n+1,n+2,n,n+2,n+5,n+5,n+2,n+4,n+4,n+2,n+3);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;}
export function RoadCarModel({car,color,ghost=false,steering,distance}:{car:string;color:string;ghost?:boolean;steering?:React.RefObject<number>;distance?:React.RefObject<number>}){
 const c=roadCar(car),a=CAR_APPEARANCE[car]??CAR_APPEARANCE.hatch,L=c.length*1.45,pickup=c.shape==='pickup',tall=pickup||c.shape==='suv',hatch=c.shape==='hatch'||c.shape==='suv',radius=a.wheel,axle=L*.32,base=.23,roof=a.roof;
 const wheels=useRef<THREE.Group[]>([]),spins=useRef<THREE.Group[]>([]);
 useFrame((_,dt)=>{wheels.current.forEach((wheel,i)=>{if(wheel)wheel.rotation.y=THREE.MathUtils.damp(wheel.rotation.y,i%2===1?ackermannAngle(steering?.current??0,axle*2,i<2?-1:1):0,12,dt)});spins.current.forEach(w=>{if(w)w.rotation.x=(distance?.current??0)/radius})});
 const body=useMemo(()=>shell([[-L*.5,.49,.17],[-L*.43,.58,.26],[-L*.28,.59,.28],[L*.22,.58,.27],[L*.42,.55,.21],[L*.5,.48,.13]],-.19),[L]);
 const cabin=useMemo(()=>{const back=pickup?-L*.12:hatch?-L*.4:-L*.32,front=L*(pickup?.29:.27);const v=[-.51,base,back,.51,base,back,-.5,base,front,.5,base,front,-.43,roof,L*a.rearRoof,.43,roof,L*a.rearRoof,-.42,roof,L*a.frontRoof,.42,roof,L*a.frontRoof];const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex([0,1,4,1,5,4,2,6,3,3,6,7,0,4,2,2,4,6,1,3,5,3,7,5,4,5,6,5,7,6]);g.computeVertexNormals();return g;},[L,a,base,roof,hatch,pickup]);
 React.useEffect(()=>()=>{body.dispose();cabin.dispose()},[body,cabin]);
 const material=(tint:string,metal=.25,rough=.32)=><meshStandardMaterial color={tint} metalness={metal} roughness={rough} transparent={ghost} opacity={ghost?.26:1} depthWrite={!ghost} side={THREE.DoubleSide}/>;
 const box=(p:[number,number,number],size:[number,number,number],tint:string,rotation:[number,number,number]=[0,0,0])=><mesh position={p} rotation={rotation}><boxGeometry args={size}/>{material(tint)}</mesh>;
 const roofZ=L*(a.frontRoof+a.rearRoof)/2,roofLength=L*(a.frontRoof-a.rearRoof),front=L*.5,rear=-front;
 return <group>
  <mesh geometry={body}>{material(color,.4,.27)}</mesh>
  {box([0,-.16,0],[.99,.13,L*.88],'#1d242a')}
  <mesh geometry={cabin}>{material('#172e3b',.55,.14)}</mesh>
  {box([0,roof+.012,roofZ],[.87,.035,roofLength+.03],car==='swift'?'#20272c':color)}
  {/* Pillars, window seals and door lines give the glass a real cabin silhouette. */}
  {[-1,1].map(side=><group key={side}>
   {box([side*.48,(roof+base)/2,L*(pickup?.02:-.08)],[.045,roof-base,.055],color)}
   {box([side*.51,base+.012,L*(pickup?.08:-.04)],[.03,.04,L*(pickup?.38:.60)],'#20282d')}
   {box([side*.59,.03,0],[.018,.026,L*.76],tall?'#313a40':color)}
   {box([side*.58,.09,L*(pickup?.05:-.03)],[.018,.032,.13],a.trim)}
   {!pickup&&box([side*.58,.09,-L*.25],[.018,.032,.12],a.trim)}
   {box([side*.58,base+.1,L*.2],[.13,.09,.17],color)}
   {box([side*.645,base+.1,L*.195],[.012,.065,.125],'#728d9c')}
   {tall&&box([side*.58,-.15,0],[.12,.05,L*.57],'#343d43')}
   <Pillar from={[side*.5,base,L*(pickup?.29:.27)]} to={[side*.42,roof,L*a.frontRoof]} color={color} ghost={ghost}/><Pillar from={[side*.51,base,L*(pickup?-.12:hatch?-.4:-.32)]} to={[side*.43,roof,L*a.rearRoof]} color={color} ghost={ghost}/>
   {/* Front lamps / running lights and red rear lamp signature. */}
   {box([side*.365,.14,front+.006],[.255,a.lamp,.045],'#e2ecf5',[0,-side*.16,0])}
   {box([side*.365,.14+a.lamp*.6,front+.029],[.26,.018,.015],'#f3fbff',[0,-side*.16,0])}
   {box([side*.365,.16,rear-.01],[.25,tall?.12:.075,.035],'#a51f28',[0,side*.12,0])}
   {box([side*.45,.085,rear-.016],[.045,tall?.19:.11,.025],'#ec3f40')}
   {box([side*.43,-.08,front+.014],[.1,.05,.025],'#abbac4')}
   {[-1,1].map((end,index)=>{const i=(side===-1?0:2)+index;return <group key={end} position={[side*.535,-.16,end*axle]} ref={el=>{if(el)wheels.current[i]=el}}><group ref={el=>{if(el)spins.current[i]=el}}>
    <mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[radius,radius,.16,20]}/>{material('#151a20',0,.9)}</mesh>
    <mesh position={[side*.085,0,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[radius*.72,radius*.72,.018,20]}/>{material('#3b444b',.8,.3)}</mesh>
    {[0,1,2,3,4].map(n=><group key={n} position={[side*.099,0,0]} rotation={[n*Math.PI*2/5,0,0]}>{box([0,radius*.3,0],[.018,radius*.65,.035],a.trim)}</group>)}
    <mesh position={[side*.11,0,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[radius*.16,radius*.16,.018,12]}/>{material('#b6c1c9',.8,.2)}</mesh>
   </group></group>})}
  </group>)}
  {/* Each family has a distinct front fascia instead of a shared rectangular nose. */}
  {box([0,.025,front+.026],[a.grille,tall?.24:.17,.045],'#172027')}
  {Array.from({length:tall?3:2},(_,i)=><group key={i}>{box([0,(tall?.1:.055)-i*.065,front+.052],[a.grille*.93,.018,.018],a.trim)}</group>)}
  {a.style==='almera'&&[-1,1].map(side=><group key={side}>{box([side*.19,.04,front+.065],[.035,.23,.02],a.trim,[0,0,side*.75])}</group>)}
  {a.style==='ranger'&&[-1,1].map(side=><group key={side}>{box([side*.43,.07,front+.052],[.025,.2,.02],'#e6f7ff')}</group>)}
  {(a.style==='civic'||a.style==='ativ')&&box([0,-.135,front+.03],[.86,.05,.06],'#252e35')}
  {a.style==='mazda'&&box([0,.14,front+.055],[.49,.025,.02],a.trim)}
  {box([0,-.07,rear-.036],[.29,.09,.02],'#e0e4dc')}
  {box([0,-.14,front+.059],[.29,.075,.018],'#e0e4dc')}
  {box([0,-.19,rear-.02],[1.0,.065,.085],'#28333a')}
  {pickup&&<>{box([0,.25,-L*.32],[.89,.025,L*.29],'#28363d')}{[-1,1].map(side=><group key={side}>{box([side*.51,.29,-L*.32],[.11,.13,L*.31],color)}{box([side*.51,.36,-L*.32],[.11,.018,L*.31],'#343e44')}</group>)}{box([0,.28,-L*.48],[1.02,.14,.06],color)}</>}
  {!hatch&&!pickup&&box([0,.29,-L*.39],[.98,.025,L*.17],color)}
  {hatch&&box([0,roof+.01,-L*.37],[.89,.045,.13],color)}
  {c.shape==='suv'&&[-1,1].map(side=><group key={side}>{box([side*.38,roof+.06,roofZ],[.025,.04,roofLength*.84],a.trim)}</group>)}
 </group>;
}
export function CarPreview({car,color}:{car:string;color:string}){return <div className="car-preview" aria-label={`โมเดลจำลอง ${roadCar(car).name}`}><Canvas frameloop="demand" dpr={[1,1.25]} camera={{position:[2.6,1.65,3.15],fov:40}}><hemisphereLight args={['#e6f1ff','#47503e',1.7]}/><directionalLight position={[3,5,2]} intensity={2.5}/><RoadCarModel car={car} color={color}/><OrbitControls enablePan={false} enableZoom={false} target={[0,.2,0]}/></Canvas><small>{roadCar(car).name} · ลากเพื่อหมุนดู</small></div>}
