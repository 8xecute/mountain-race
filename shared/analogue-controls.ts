import type {Command} from './game';
export function analogueCommand(steer:number,pedal:number,current:Command):Command{const clamp=(v:number)=>Number.isFinite(v)?Math.max(-1,Math.min(1,v)):0;const s=clamp(steer),p=clamp(pedal);return {...current,steering:Math.abs(s)<.03?0:s,lane:undefined,action:p<-.03?'brake':p>.03?'accelerate':'hold',power:Math.abs(p)>.03?Math.abs(p):1,riskConfirmed:false};}
