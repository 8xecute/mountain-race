import type {Command,Player} from './game';
export const DRIFT={enterKmh:35,exitKmh:25,steerThreshold:.15,buildMs:300,releaseMs:220,steeringBonus:.55,safeBonus:.18,dragKmhPerSecond:6,bodyYaw:.52,counterAngle:.30} as const;
export function driftState(p:Player,cmd:Command,dt:number,cornerAssistActive=false){const speed=p.speed*1.2;const active=cmd.drift===true&&!p.bot&&!cornerAssistActive&&!p.reversing&&!cmd.reverse&&!(p.recoveryMs??0)&&!(p.impactHoldMs??0)&&speed>=((p.driftAmount??0)>.05?DRIFT.exitKmh:DRIFT.enterKmh)&&Math.abs(cmd.steering??0)>=DRIFT.steerThreshold;const old=p.driftAmount??0;const amount=cornerAssistActive||speed<DRIFT.exitKmh?0:Math.max(0,Math.min(1,old+(active?dt/DRIFT.buildMs:-dt/DRIFT.releaseMs)));return {driftAmount:amount,drifting:active&&amount>.05};}
/** Visual oversteer: nose rotates into the bend, front tyres countersteer; rear axle stays fixed. */
export function driftPose(input:number,amount:number,frontAngle:number){const strength=Math.max(0,Math.min(1,amount)),axis=Math.max(-1,Math.min(1,input));return {bodyYaw:-axis*strength*DRIFT.bodyYaw||0,frontAngle:frontAngle*(1-strength)+axis*DRIFT.counterAngle*strength};}

