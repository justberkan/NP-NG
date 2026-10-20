'use strict';
// Inli Cinli (korku) co-op odalari: wc'nin aynisi, KISI SINIRI YOK, daha buyuk snapshot.
const ROOMS=require('./server-rooms');
module.exports=function({send,weapons}){
 const rooms=new Map();let uid=1;
 const emit=(r,m,except)=>{for(const c of r.members.values())if(c!==except)send(c,m)};
 const peers=r=>[...r.members.values()].map(c=>({id:c.icid,name:c.acc.name}));
 function leave(c){const r=c.icroom;if(!r)return;delete c.icroom;r.members.delete(c.icid);if(c.icid===r.host||!r.members.size){emit(r,{t:'ic_closed',reason:'Oda sahibi ayrıldı. Kazanılan ödüller hesabında kaldı.'});for(const o of r.members.values())delete o.icroom;rooms.delete(r.code)}else emit(r,{t:'ic_peers',players:peers(r)})}
 function handle(c,m,now){
  if(!m.t.startsWith('ic_'))return false;
  if(m.t==='ic_leave'){leave(c);return true}
  if(!c.acc){send(c,{t:'ic_error',message:'Co-op için hesabına giriş yap.'});return true}
  if(m.t==='ic_create'||m.t==='ic_join'){
   if(c.joined){send(c,{t:'ic_error',message:'Önce mevcut çevrimiçi maçtan çık.'});return true}
   let code=String(m.code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8),r;
   if(m.t==='ic_create'){code=require('crypto').randomBytes(3).toString('hex').toUpperCase();r={code,host:0,members:new Map(),snapshot:null};ROOMS.setup(r,c,m,'ic');rooms.set(code,r)}else r=rooms.get(code);
   if(!r){send(c,{t:'ic_error',message:'Oda bulunamadı.'});return true} /* kişi sınırı yok */
   if(m.t==='ic_join'){const e=ROOMS.check(r,c,m);if(e){send(c,{t:'ic_error',message:ROOMS.errText(e),need:'pass',code});return true}}
   leave(c);c.icid=uid++;c.icroom=r;r.members.set(c.icid,c);if(!r.host)r.host=c.icid;
   send(c,{t:'ic_welcome',id:c.icid,host:r.host,code,players:peers(r),snapshot:r.snapshot});emit(r,{t:'ic_peers',players:peers(r)});return true;
  }
  const r=c.icroom;if(!r)return true;
  const host=r.members.get(r.host);
  if(m.t==='ic_state'){
   const d=m.d||{},finite=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
   send(host,{t:'ic_state',id:c.icid,d:{x:finite(d.x,-400,400),y:finite(d.y,c.admin&&c.adtools?.noclip?-500:-40,c.admin&&c.adtools?.noclip?500:60),z:finite(d.z,-400,400),yaw:finite(d.yaw,-1000,1000),hp:finite(d.hp,0,100),flash:!!d.flash,skin:d.skin|0,ch:String(d.ch||'').replace(/[^A-Za-z0-9_.-]/g,'').slice(0,40),w:String(d.w||'').replace(/[^A-Za-z0-9_]/g,'').slice(0,16),adminGod:!!(c.admin&&c.adtools?.god),adminFly:!!(c.admin&&c.adtools?.noclip)}});
  }else if(m.t==='ic_snapshot'&&c.icid===r.host){
   const d=m.d;if(!d||!Array.isArray(d.mons)||d.mons.length>8||!Array.isArray(d.players)||JSON.stringify(d).length>60000)return true;
   r.snapshot=d;emit(r,{t:'ic_snapshot',d},c);
  }else if(m.t==='ic_hit'){
   const w=weapons[m.w];if(!w)return true;const last=c.ichit||0;if(now-last<w.r*450)return true;c.ichit=now;
   send(host,{t:'ic_hit',id:c.icid,target:Math.max(0,m.target|0),damage:w.d*(m.head&&!w.m?2:1),w:m.w});
  }else if(m.t==='ic_door')send(host,{t:'ic_door',id:c.icid,door:m.door|0});
  else if(m.t==='ic_event'&&c.icid===r.host){if(['reward','end','dooropen','hitfx'].includes(m.event)&&JSON.stringify(m).length<1000)emit(r,{...m,t:'ic_event'},c)}
  return true;
 }
 return{handle,leave,rooms};
}
