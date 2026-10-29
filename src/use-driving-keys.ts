import {keyboardAction} from '../shared/driving-keys';
import {useEffect,useRef} from 'react';
import type {Command} from '../shared/game';
export function useDrivingKeys(enabled:boolean,command:Command,send:(c:Command)=>void){
 const current=useRef({command,send});current.current={command,send};
 useEffect(()=>{if(!enabled)return;const held=new Set<string>();
 const apply=(c:Command)=>{current.current.command=c;current.current.send(c)};
 const speed=()=>{const c=current.current.command;apply({...c,action:keyboardAction(held),power:1,lane:undefined,steering:(held.has('KeyD')?1:0)-(held.has('KeyA')?1:0) as -1|0|1,riskConfirmed:false})};
 const editing=(e:KeyboardEvent)=>e.target instanceof Element&&!!e.target.closest('input,textarea,select,[contenteditable="true"]');
 const down=(e:KeyboardEvent)=>{if(!['KeyW','KeyA','KeyS','KeyD'].includes(e.code)||editing(e)||e.ctrlKey||e.metaKey||e.altKey)return;e.preventDefault();if(e.repeat||held.has(e.code))return;held.add(e.code);speed()};
 const up=(e:KeyboardEvent)=>{if(!held.delete(e.code))return;e.preventDefault();speed()};
 const reset=()=>{const active=held.size>0;held.clear();if(active)speed()};const visibility=()=>{if(document.hidden)reset()};
 window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',reset);document.addEventListener('visibilitychange',visibility);
 return()=>{reset();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',visibility)};
 },[enabled]);
}
