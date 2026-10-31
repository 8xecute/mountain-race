import type {Player} from './game';
import type {TrafficState} from './traffic';

// Fixed-baseline patches remain valid even if any intermediate volatile packet is dropped.
export type RaceWireState={code:string;host:string;phase:'lobby'|'race'|'finished';round:number;players:Player[];traffic?:TrafficState;animationStart:number;animationEnd:number;serverNow:number;leader?:string;startedAt?:number;finishedAt?:number;revealedDistance?:number;result?:string};
type Changes=Record<string,unknown>;
export type RacePacket={kind:'base';id:number;state:RaceWireState}|{kind:'delta';id:number;serverNow:number;state:Changes;players:Changes[]};
const internal=new Set(['brakeTapPending','brakeHeld','brakeHoldMs','rearContactId','respawnLaunch','neutralMs','trailMs','wasInBend','slingCooldownMs','draftCarryMs','renderPrevious']);
export function wirePlayer(p:Player):Player{return Object.fromEntries(Object.entries(p).filter(([key,value])=>!internal.has(key)&&value!==undefined)) as Player;}
function diff(base:Record<string,unknown>,next:Record<string,unknown>):Changes {const out:Changes={};for(const key of new Set([...Object.keys(base),...Object.keys(next)])){if(JSON.stringify(base[key])!==JSON.stringify(next[key]))out[key]=next[key]===undefined?null:next[key];}return out;}
function patch<T>(base:T,changes:Changes):T {const out={...base} as Record<string,unknown>;for(const [key,value] of Object.entries(changes)){if(value===null)delete out[key];else out[key]=value;}return out as T;}
export function makeDelta(id:number,base:RaceWireState,next:RaceWireState):RacePacket {const {players:bp,serverNow:bt,...b}=base,{players:np,serverNow,...n}=next;return {kind:'delta',id,serverNow,state:diff(b,n),players:np.map((p,i)=>diff(bp[i] as unknown as Record<string,unknown>??{},p as unknown as Record<string,unknown>))};}
export function applyRacePacket(packet:RacePacket,base?:{id:number;state:RaceWireState}):{base:{id:number;state:RaceWireState};state:RaceWireState}|undefined {if(packet.kind==='base')return {base:{id:packet.id,state:packet.state},state:packet.state};if(!base||base.id!==packet.id||packet.players.length!==base.state.players.length)return;const state=patch(base.state,packet.state);return {base,state:{...state,serverNow:packet.serverNow,players:packet.players.map((p,i)=>patch(base.state.players[i],p))}};}
