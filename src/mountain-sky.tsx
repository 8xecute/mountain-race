import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
// One sky draw call, no downloaded textures or volumetric ray marching.
const vertexShader=`varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position.z=gl_Position.w;}`;
const fragmentShader=`varying vec3 direction;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void main(){vec3 d=normalize(direction);float h=max(0.0,d.y);vec3 sky=mix(vec3(.72,.84,.90),vec3(.21,.49,.76),pow(h,.5));
vec2 uv=d.xz/max(.12,d.y)*1.8;float n=noise(uv)*.55+noise(uv*2.1)*.30+noise(uv*4.3)*.15;
float clouds=smoothstep(.48,.72,n)*smoothstep(.02,.18,h)*(1.0-smoothstep(.7,.95,h));sky=mix(sky,vec3(.95,.96,.94),clouds*.85);
float sun=pow(max(0.0,dot(d,normalize(vec3(-.5,.65,-.35)))),64.0);sky+=vec3(.10,.08,.035)*sun;
gl_FragColor=vec4(sky,1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
export function MountainSky(){const mesh=useRef<THREE.Mesh>(null);useFrame(({camera})=>{mesh.current?.position.copy(camera.position)});return <mesh ref={mesh} renderOrder={-1000} frustumCulled={false}><sphereGeometry args={[450,24,16]}/><shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} side={THREE.BackSide} depthWrite={false} depthTest={false} fog={false}/></mesh>}
