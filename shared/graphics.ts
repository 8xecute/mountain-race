export const GRAPHICS={low:{label:'ต่ำ',dpr:1,vegetation:.3,description:'เน้นความลื่น · ลดต้นไม้และความละเอียด'},medium:{label:'กลาง',dpr:1.25,vegetation:.6,description:'สมดุลความคมชัดและความลื่น'},high:{label:'สูง',dpr:1.75,vegetation:1,description:'ต้นไม้เต็ม · ภาพคมขึ้น ใช้พลังงานมากขึ้น'}} as const;
export type GraphicsQuality=keyof typeof GRAPHICS;
export function graphicsQuality(value:unknown,mobile:boolean):GraphicsQuality{return value==='low'||value==='medium'||value==='high'?value:mobile?'low':'high'}
