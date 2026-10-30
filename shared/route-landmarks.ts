export const ROUTE_LANDMARKS=[{km:7,name:'จุดชมวิว ไอเลิฟ · โค้งรูปตัว U'},{km:12.5,name:'ถนนเลข 3 น่าน'},{km:20.2,name:'โค้งเลขศูนย์'},{km:36.1,name:'จุดชมวิวถนนพับผ้า'}] as const;
export function landmarksInRange(mapId:string|undefined,start:number,end:number){return mapId==='road1081'?ROUTE_LANDMARKS.filter(p=>p.km>=start&&p.km<=end):[];}
