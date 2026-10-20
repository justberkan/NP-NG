'use strict';
// Sosyal lobi (PUBG tarzı): mod öncesi ortak bekleme odası. Kişi sınırı 16.
module.exports=function({send}){
 const rooms=new Map();let uid=1;const MAX=16;
 const emit=(r,m,except)=>{for(const c of r.members.values())if(c!==except)send(c,m)};
 const members=r=>[...r.members.values()].map(c=>({id:c.slid,name:c.acc.name,ready:r.ready.has(c.slid)?1:0,host:r.host===c.slid?1:0}));
 function leave(c){const r=c.slroom;if(!r)return;delete c.slroom;r.members.delete(c.slid);r.ready.delete(c.slid);
  if(c.slid===r.host||!r.members.size){emit(r,{t:'sl_closed',reason:'Oda sahibi ayrıldı.'});for(const o of r.members.values())delete o.slroom;rooms.delete(r.code)}else emit(r,{t:'sl_members',players:members(r),mode:r.mode})}
 function handle(c,m,now){
  if(!m.t.startsWith('sl_'))return false;
  if(m.t==='sl_leave'){leave(c);return true}
  if(!c.acc){send(c,{t:'sl_error',message:'Sosyal lobi için hesabına giriş yap.'});return true}
  if(m.t==='sl_create'||m.t==='sl_join'){
   if(c.joined){send(c,{t:'sl_error',message:'Önce mevcut çevrimiçi maçtan çık.'});return true}
   let code=String(m.code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8),r;
   if(m.t==='sl_create'){code=require('crypto').randomBytes(3).toString('hex').toUpperCase();r={code,host:0,members:new Map(),ready:new Set(),mode:'aim'};rooms.set(code,r)}
   else r=rooms.get(code);
   if(!r){send(c,{t:'sl_error',message:'Oda bulunamadı.'});return true}
   if(r.members.size>=MAX){send(c,{t:'sl_error',message:'Oda dolu ('+MAX+' kişi).'});return true}
   leave(c);c.slid=uid++;c.slroom=r;r.members.set(c.slid,c);if(!r.host)r.host=c.slid;
   send(c,{t:'sl_welcome',id:c.slid,host:r.host,code,players:members(r),mode:r.mode});
   emit(r,{t:'sl_members',players:members(r),mode:r.mode});return true;
  }
  const r=c.slroom;if(!r)return true;
  if(m.t==='sl_ready'){
   const v=m.v?1:0;if(v)r.ready.add(c.slid);else r.ready.delete(c.slid);
   emit(r,{t:'sl_members',players:members(r),mode:r.mode});return true;
  }
  if(m.t==='sl_mode'&&c.slid===r.host){
   const mode=String(m.mode||'').slice(0,12);r.mode=mode;
   emit(r,{t:'sl_members',players:members(r),mode:r.mode});return true;
  }
  if(m.t==='sl_start'&&c.slid===r.host){
   if(!r.members.size)return true;
   if(![...r.members.values()].every(o=>r.ready.has(o.slid))){send(c,{t:'sl_error',message:'Hazır olmayan oyuncular var.'});return true}
   const mode=r.mode;
   emit(r,{t:'sl_go',mode});
   for(const o of r.members.values())delete o.slroom;
   rooms.delete(r.code);return true;
  }
  return true;
 }
 return{handle,leave,rooms};
}
