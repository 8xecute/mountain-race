import {useEffect,useRef,useState} from 'react';
export function useRaceAudio(speed:number,racing:boolean,event:string,rank:number){
 const audio=useRef<{context:AudioContext;osc:OscillatorNode;gain:GainNode}|null>(null);const [enabled,setEnabled]=useState(false);const previous=useRef({event:'',rank:0});
 const toggle=()=>{if(!audio.current){const context=new AudioContext(),osc=context.createOscillator(),gain=context.createGain();osc.type='sawtooth';gain.gain.value=0;osc.connect(gain).connect(context.destination);osc.start();audio.current={context,osc,gain}}const next=!enabled;audio.current.context.resume();setEnabled(next)};
 useEffect(()=>{const a=audio.current;if(!a)return;const now=a.context.currentTime;a.osc.frequency.setTargetAtTime(45+speed*1.8,now,.12);a.gain.gain.setTargetAtTime(enabled&&racing?.025:0,now,.1);
 if(enabled&&racing&&((event&&event!==previous.current.event)||(previous.current.rank>rank&&rank>0))){const tone=a.context.createOscillator(),gain=a.context.createGain();tone.frequency.value=previous.current.rank>rank?700:event.includes('เร็วเกิน')?160:440;gain.gain.setValueAtTime(.035,now);gain.gain.exponentialRampToValueAtTime(.001,now+.16);tone.connect(gain).connect(a.context.destination);tone.start();tone.stop(now+.17);tone.onended=()=>{tone.disconnect();gain.disconnect()};}previous.current={event,rank};
 },[speed,racing,event,rank,enabled]);
 useEffect(()=>()=>{audio.current?.context.close()},[]);return {enabled,toggle};
}
