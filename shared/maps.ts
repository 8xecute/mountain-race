import {make1081Track} from './real-track';
export const MAP_CATALOG=[{id:'road1081',name:'ถนน 1081 · สามแยกอวน–บ่อเกลือ',maxKm:39.9}] as const;
export type MapSelection={mapId:string;startKm:number;endKm:number};
export function validateSelection(s:MapSelection){const map=MAP_CATALOG.find(m=>m.id===s.mapId);if(!map)return 'ไม่พบแผนที่';if(typeof s.startKm!=='number'||typeof s.endKm!=='number'||!Number.isFinite(s.startKm)||!Number.isFinite(s.endKm))return 'กรุณาระบุกิโลเมตรเป็นตัวเลข';if(s.startKm<0||s.endKm>map.maxKm||s.startKm>=s.endKm)return `ระบุกม.เริ่มน้อยกว่ากม.สิ้นสุด ภายใน 0–${map.maxKm}`;if(Math.round(s.endKm*1000)-Math.round(s.startKm*1000)<100)return 'ช่วงแข่งต้องยาวอย่างน้อย 0.1 กม.';return '';}
const BUILDERS:Record<string,(start:number,end:number)=>ReturnType<typeof make1081Track>>={road1081:(start,end)=>make1081Track(end-start,start)};
export function makeSelectedTrack(s:MapSelection){const error=validateSelection(s);if(error)throw new Error(error);return BUILDERS[s.mapId](Math.round(s.startKm*1000),Math.round(s.endKm*1000));}
