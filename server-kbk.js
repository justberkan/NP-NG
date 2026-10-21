'use strict';
// KBK Escort & Hunt co-op odalari: ic_'nin KBK uyarlamasi. KISI SINIRI YOK.
// Rol dagitimi istemcide; sunucu yalnizca rol bilgisini tasir (lobi listesi + hedefli olaylar).
const ROOMS=require('./server-rooms');
module.exports=function({send,weapons}){
 const rooms=new Map();let uid=1;
 const emit=(r,m,except)=>{for(const c of r.members.values())if(c!==except)send(c,m)};
 const peers=r=>[...r.members.values()].map(c=>({id:c.kbkid,name:c.acc.name,role:c.kbkrole||'auto'}));
 function leave(c){const r=c.kbkroom;if(!r)return;delete c.kbkroom;r.members.delete(c.kbkid);if(c.kbkid===r.host||!r.members.size){emit(r,{t:'kbk_closed',reason:'Oda sahibi ayrıldı. Kazanılan ödüller hesabında kaldı.'});for(const o of r.members.values())delete o.kbkroom;rooms.delete(r.code)}else emit(r,{t:'kbk_peers',players:peers(r)})}
 function handle(c,m,now){
  if(!m.t.startsWith('kbk_'))return false;
  if(m.t==='kbk_leave'){leave(c);return true}
  if(!c.acc){send(c,{t:'kbk_error',message:'Co-op için hesabına giriş yap.'});return true}
  if(m.t==='kbk_create'||m.t==='kbk_join'){
   if(c.joined){send(c,{t:'kbk_error',message:'Önce mevcut çevrimiçi maçtan çık.'});return true}
   let code=String(m.code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8),r;
   if(m.t==='kbk_create'){code=require('crypto').randomBytes(3).toString('hex').toUpperCase();r={code,host:0,hostRole:String(m.role||'auto').replace(/[^a-z]/g,'').slice(0,8)||'auto',members:new Map(),snapshot:null};ROOMS.setup(r,c,m,'kbk');rooms.set(code,r)}else r=rooms.get(code);
   if(!r){send(c,{t:'kbk_error',message:'Oda bulunamadı.'});return true} /* kişi sınırı yok */
   if(m.t==='kbk_join'){const e=ROOMS.check(r,c,m);if(e){send(c,{t:'kbk_error',message:ROOMS.errText(e),need:'pass',code});return true}}
   leave(c);c.kbkid=uid++;c.kbkrole=String(m.role||'auto').replace(/[^a-z]/g,'').slice(0,8)||'auto';c.kbkroom=r;r.members.set(c.kbkid,c);if(!r.host)r.host=c.kbkid;
   send(c,{t:'kbk_welcome',id:c.kbkid,host:r.host,code,hostRole:r.hostRole,role:c.kbkrole,players:peers(r),snapshot:r.snapshot});emit(r,{t:'kbk_peers',players:peers(r)});return true;
  }
  const r=c.kbkroom;if(!r)return true;
  const host=r.members.get(r.host);
  if(m.t==='kbk_state'){
   const d=m.d||{},finite=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
   send(host,{t:'kbk_state',id:c.kbkid,d:{x:finite(d.x,-400,400),y:finite(d.y,c.admin&&c.adtools?.noclip?-500:-40,c.admin&&c.adtools?.noclip?500:60),z:finite(d.z,-400,400),yaw:finite(d.yaw,-1000,1000),hp:finite(d.hp,0,100),flash:!!d.flash,skin:d.skin|0,ch:String(d.ch||'').replace(/[^A-Za-z0-9_.-]/g,'').slice(0,40),w:String(d.w||'').replace(/[^A-Za-z0-9_]/g,'').slice(0,16),role:String(d.role||'auto').replace(/[^a-z]/g,'').slice(0,8)}});
  }else if(m.t==='kbk_snapshot'&&c.kbkid===r.host){
   const d=m.d;if(!d||!Array.isArray(d.players)||!Array.isArray(d.foxes)||JSON.stringify(d).length>60000)return true;
   r.snapshot=d;emit(r,{t:'kbk_snapshot',d},c);
  }else if(m.t==='kbk_hit'){
   const w=weapons[m.w];if(!w)return true;const last=c.kbkhit||0;if(now-last<w.r*450)return true;c.kbkhit=now;
   const dmg=w.d*(m.head&&!w.m?2:1);
   if(m.target==='wolf')send(host,{t:'kbk_hit',id:c.kbkid,target:'wolf',damage:dmg,w:m.w});
   else send(host,{t:'kbk_hit',id:c.kbkid,target:Math.max(0,m.target|0),damage:dmg,w:m.w});
  }else if(m.t==='kbk_event'){
   if(JSON.stringify(m).length>1000)return true;
   const targeted=m.id!=null&&r.members.has(m.id|0);
   if(targeted){send(r.members.get(m.id|0),{...m,t:'kbk_event'});return true}
   if(c.kbkid===r.host){if(['reward','end','hitfx','wolfdown','wolfhp'].includes(m.event))emit(r,{...m,t:'kbk_event'},c)}
   else send(host,{...m,t:'kbk_event'}); /* idsiz istemci olayi (kidnap vb.) sahibe */
  }
  return true;
 }
 return{handle,leave,rooms};
}
