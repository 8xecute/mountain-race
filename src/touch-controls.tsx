import React,{useEffect,useRef,useState} from 'react';
import type {Command} from '../shared/game';
import {touchCommand,type TouchControl} from '../shared/touch-controls';
export const MOBILE_QUERY='(max-width: 1000px) and (max-height: 600px), (max-width: 900px) and (orientation: portrait), (pointer: coarse)';
export function useMobileLayout(){const [mobile,setMobile]=useState(()=>matchMedia(MOBILE_QUERY).matches);useEffect(()=>{const query=matchMedia(MOBILE_QUERY);const update=()=>setMobile(query.matches);query.addEventListener('change',update);return()=>query.removeEventListener('change',update)},[]);return mobile;}
export function TouchControls({command,send,enabled}:{command:Command;send:(c:Command)=>void;enabled:boolean}){
 const current=useRef({command,send});current.current={command,send};const pointers=useRef(new Map<number,TouchControl>());const [held,setHeld]=useState<TouchControl[]>([]);
 const apply=()=>{const keys=[...pointers.current.values()];setHeld(keys);const next=touchCommand(keys,current.current.command);current.current.command=next;current.current.send(next)};
 const release=(id:number)=>{if(pointers.current.delete(id))apply()};
 useEffect(()=>{const reset=()=>{if(!pointers.current.size)return;pointers.current.clear();apply()};const visibility=()=>{if(document.hidden)reset()};window.addEventListener('blur',reset);document.addEventListener('visibilitychange',visibility);if(!enabled)reset();return()=>{window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',visibility);reset()}},[enabled]);
 const button=(control:TouchControl,label:string,icon:string)=><button key={control} aria-label={label} aria-pressed={held.includes(control)} disabled={!enabled} className={`touch-${control} ${held.includes(control)?'pressed':''}`} onContextMenu={e=>e.preventDefault()} onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,control);apply()}} onPointerUp={e=>release(e.pointerId)} onPointerCancel={e=>release(e.pointerId)} onLostPointerCapture={e=>release(e.pointerId)}><b aria-hidden="true">{icon}</b><span>{label}</span></button>;
 return <div className="touch-controls" aria-label="ปุ่มขับรถบนมือถือ"><div className="touch-steer">{button('left','เลี้ยวซ้าย','◀')}{button('right','เลี้ยวขวา','▶')}</div><small>กดค้างเพื่อขับ · ปล่อยเพื่อรักษา</small><div className="touch-pedals">{button('brake','เบรก','−')}{button('accelerate','เร่ง','＋')}</div></div>;
}
