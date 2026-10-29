import React,{useEffect,useRef,useState} from 'react';
import type {Command} from '../shared/game';
import {analogueCommand} from '../shared/analogue-controls';
export const MOBILE_QUERY='(max-width: 1000px) and (max-height: 600px), (max-width: 900px) and (orientation: portrait), (pointer: coarse)';
export function useMobileLayout(){const [mobile,setMobile]=useState(()=>matchMedia(MOBILE_QUERY).matches);useEffect(()=>{const query=matchMedia(MOBILE_QUERY);const update=()=>setMobile(query.matches);query.addEventListener('change',update);return()=>query.removeEventListener('change',update)},[]);return mobile;}

export function TouchControls({command,send,enabled}:{command:Command;send:(c:Command)=>void;enabled:boolean}){
 const current=useRef({command,send});current.current={command,send};const axes=useRef({steer:0,pedal:0});const [values,setValues]=useState(axes.current);
 const apply=(axis:'steer'|'pedal',value:number)=>{const next={...axes.current,[axis]:value};axes.current=next;setValues(next);const c=analogueCommand(next.steer,next.pedal,current.current.command);current.current.command=c;current.current.send(c)};
 useEffect(()=>{const reset=()=>{if(!axes.current.steer&&!axes.current.pedal)return;axes.current={steer:0,pedal:0};setValues(axes.current);current.current.send(analogueCommand(0,0,current.current.command))};const visibility=()=>{if(document.hidden)reset()};window.addEventListener('blur',reset);document.addEventListener('visibilitychange',visibility);if(!enabled)reset();return()=>{window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',visibility);reset()}},[enabled]);
 const slider=(axis:'steer'|'pedal',label:string)=><input type="range" min="-1" max="1" step=".01" aria-label={label} value={values[axis]} disabled={!enabled} onChange={e=>apply(axis,Number(e.target.value))} onPointerDown={e=>e.currentTarget.setPointerCapture(e.pointerId)} onPointerUp={()=>apply(axis,0)} onPointerCancel={()=>apply(axis,0)} onLostPointerCapture={()=>{if(axes.current[axis])apply(axis,0)}} onKeyUp={()=>apply(axis,0)}/>;
 return <div className="touch-controls analogue-controls" aria-label="สไลด์ควบคุมรถ"><label className="steer-slider"><span>◀ เลี้ยว {Math.round(Math.abs(values.steer)*100)}% ▶</span>{slider('steer','สไลด์เลี้ยวซ้ายขวา')}<small>ปล่อยเพื่อคืนตรง</small></label><label className="pedal-slider"><span>{values.pedal>0?'เร่ง':values.pedal<0?'เบรก':'รักษา'} {Math.round(Math.abs(values.pedal)*100)}%</span><b>＋ เร่ง</b>{slider('pedal','สไลด์คันเร่งและเบรก')}<b>− เบรก</b></label></div>;
}
