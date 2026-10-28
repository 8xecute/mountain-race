import {roadGrade} from './realtime';
import {CONFIG,brakingGuide,type Player,type Track} from './game';
export function passingAdvice(track:Track,driver:Player,players:Player[]){
 const zone=track.overtakeZones?.find(z=>driver.position>=z.start&&driver.position<z.end);
 if(brakingGuide(track,driver).state==='brake')return '⚠ เตรียมเบรกให้ทันโค้งก่อนตัดสินใจแซง';
 if(!zone)return '↪ ช่วงโค้ง: รักษาระยะและเตรียมเร่งออกจากโค้ง';
 const current=driver.lane??0;
 const front=players.find(p=>p.id!==driver.id&&!p.spectator&&p.status==='racing'&&(p.lane??0)===current&&p.position>driver.position&&p.position-driver.position<CONFIG.gap+80);
 const free=[0,1,2].find(l=>Math.abs(l-current)===1&&players.every(p=>p.id===driver.id||p.spectator||p.status!=='racing'||Math.abs((p.lateral??p.lane??0)-l)>.8||Math.abs(p.position-driver.position)>CONFIG.gap*2));
 if(front&&free!==undefined)return `⇄ ช่วงแนะนำแซง · พิจารณาแนว${['ซ้าย','กลาง','ขวา'][free]} · ยังต้องรักษาระยะและเตรียมเบรก`;
 if(front)return '⇄ ช่วงแนะนำแซง แต่ยังไม่มีช่องข้างรถที่ปลอดภัย';
 return zone.kind==='approach'?'⇄ ทางตรงก่อนโค้งช้า · ใช้ระยะนี้ไล่ตามและเตรียมเบรก':'↗ ทางตรงออกโค้ง · โอกาสเร่งสร้างระยะห่าง';
}

export function speedLesson(track:Track,driver:Player,players:Player[],action:string){
 if(driver.lastEvent==='ชะลอต่อท้าย')return 'รถช้าลงเพราะติดคันหน้า: กดเร่งเพิ่มก็ยังต้องรักษาระยะ หาช่องแนวข้างก่อน';
 const inBend=track.curves.find(c=>driver.position>=c.start&&driver.position<=c.end);if(inBend&&action==='accelerate')return 'กำลังเร่งในโค้ง: เมื่อเกินความเร็วปลอดภัยยางจะเสียการเกาะ ควรกดรักษาแล้วเร่งเมื่อพ้นโค้ง';
 if(action==='brake')return 'กำลังเบรก: ลดความเร็วเพื่อเข้าโค้ง เมื่อความเร็วเหมาะสมให้กดรักษาหรือเร่ง';
 const grade=roadGrade(track,driver.position);
 if(grade>.02)return 'ทางขึ้นเขา: แรงต้านทำให้เร่งช้าลง การอยู่แนวซ้ายหรือขวาอย่างเดียวไม่ได้เพิ่มความเร็ว';
 if(grade<-.02)return 'ทางลงเขา: รถมีแรงไหลเพิ่ม เตรียมเบรกก่อนโค้งให้เร็วขึ้น';
 const drafting=players.some(p=>p.id!==driver.id&&p.status==='racing'&&!p.spectator&&Math.abs((p.lateral??p.lane??0)-(driver.lateral??driver.lane??0))<.4&&p.position-driver.position>=CONFIG.gap&&p.position-driver.position<=CONFIG.gap+18);
 const corner=track.curves.some(c=>driver.position<=c.end&&driver.position+driver.speed*.1+10>=c.start);
 if(drafting&&action==='accelerate'&&!corner)return 'เกาะท้ายบนทางตรง: ได้แรงส่งเล็กน้อย แต่ไม่สามารถทะลุคันหน้า ต้องหาช่องแซง';
 return 'ถนนโล่ง: กดเร่งเพื่อเพิ่มความเร็ว แนวทุกแนวไม่มีโบนัสความเร็วอัตโนมัติ';
}
