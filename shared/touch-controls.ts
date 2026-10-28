import type {Command} from './game';
export type TouchControl='left'|'right'|'accelerate'|'brake';
/** Brake takes priority; opposing steering inputs cancel. */
export function touchCommand(held:Iterable<TouchControl>,current:Command):Command{const keys=new Set(held);return {...current,action:keys.has('brake')?'brake':keys.has('accelerate')?'accelerate':'hold',steering:((keys.has('right')?1:0)-(keys.has('left')?1:0)) as -1|0|1,lane:undefined,riskConfirmed:false};}
