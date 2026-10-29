import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
/** Small deterministic shared meshes, instanced throughout the course. */
export function woodlandGeometry(kind:'leaf'|'pine'|'rock'|'trunk'|'grass',simple=false){
 let g:THREE.BufferGeometry;
 if(kind==='trunk')g=new THREE.CylinderGeometry(.35,.65,1,7,4);
 else if(kind==='pine')g=new THREE.LatheGeometry([new THREE.Vector2(.08,-.5),new THREE.Vector2(.92,-.4),new THREE.Vector2(.2,-.18),new THREE.Vector2(.76,-.18),new THREE.Vector2(.12,.06),new THREE.Vector2(.52,.06),new THREE.Vector2(0,.5)],simple?6:9);
 else if(kind==='grass'){const v:number[]=[];for(let i=0;i<4;i++){const a=i*Math.PI/2,dx=Math.cos(a)*.22,dz=Math.sin(a)*.22;v.push(-dx,0,-dz,dx,0,dz,dx*.7,1-(i%2)*.2,dz*.7)}g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));}
 else g=new THREE.IcosahedronGeometry(1,simple?0:1);
 const p=g.getAttribute('position'),colors:number[]=[];for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const n=Math.sin(x*8.3+y*4.1+z*6.8)*Math.cos(z*9.2-y*5.3+x*3.6);
 if(kind==='leaf'){const scale=1+n*.17+Math.sin(x*14+z*11)*.055;x*=scale;y*=scale;z*=scale;}
 if(kind==='rock'){const scale=.9+n*.23;x*=scale;y*=scale;z*=scale;}
 if(kind==='trunk'){x*=1+Math.sin(y*18+z*15)*.10;z*=1+Math.cos(y*20+x*14)*.10;}
 p.setXYZ(i,x,y,z);const light=THREE.MathUtils.clamp(.82+y*.12+n*.10,.52,1);colors.push(light,light,light);
 }g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));if(kind!=='grass'){g.deleteAttribute('normal');g.deleteAttribute('uv');const merged=mergeVertices(g);g.dispose();g=merged;}g.computeVertexNormals();if(kind==='leaf'||kind==='pine'){const pos=g.getAttribute('position'),uv:number[]=[];for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);uv.push(.5+Math.atan2(z,x)/(Math.PI*2),.5+Math.asin(Math.max(-1,Math.min(1,y/Math.max(.001,Math.hypot(x,y,z)))))/Math.PI)}g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));}return g;
}
export function rootShadeTexture(){const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;const ctx=canvas.getContext('2d')!,grad=ctx.createRadialGradient(32,32,3,32,32,31);grad.addColorStop(0,'rgba(14,28,18,.26)');grad.addColorStop(.4,'rgba(14,28,18,.12)');grad.addColorStop(1,'rgba(14,28,18,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;}
/** Fine canopy flecks add leaf-scale variation without external image assets. */
export function canopyTexture(){const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#f8f8f8';ctx.fillRect(0,0,128,128);let seed=173;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};for(let i=0;i<1000;i++){const shade=Math.floor(190+rand()*65);ctx.fillStyle=`rgb(${shade},${shade},${shade})`;ctx.beginPath();ctx.ellipse(rand()*128,rand()*128,1+rand()*2,.5+rand(),rand()*Math.PI,0,Math.PI*2);ctx.fill();}const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(2,2);tex.anisotropy=2;return tex;}
