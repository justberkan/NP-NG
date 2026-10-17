'use strict';
// Küçük, ayrı co-op odaları: simülasyon oda sahibinde, kimlik/mesaj yönlendirmesi sunucuda.
module.exports=function({send,weapons}){
 const rooms=new Map();let uid=1;
 const emit=(r,m,except)=>{for(const c of r.members.values())if(c!==except)send(c,m)};
 const peers=r=>[...r.members.values()].map(c=>({id:c.wcid,name:c.acc.name}));
 function leave(c){const r=c.wcroom;if(!r)return;delete c.wcroom;r.members.delete(c.wcid);if(c.wcid===r.host||!r.members.size){emit(r,{t:'wc_closed',reason:'Oda sahibi ayrıldı. Kazanılan ödüller hesabında kaldı.'});for(const o of r.members.values())delete o.wcroom;rooms.delete(r.code)}else emit(r,{t:'wc_peers',players:peers(r)})}
 function handle(c,m,now){
  if(!m.t.startsWith('wc_'))return false;
  if(m.t==='wc_leave'){leave(c);return true}
  if(!c.acc){send(c,{t:'wc_error',message:'Co-op için hesabına giriş yap.'});return true}
  if(m.t==='wc_create'||m.t==='wc_join'){
   if(c.joined){send(c,{t:'wc_error',message:'Önce mevcut çevrimiçi maçtan çık.'});return true}
   let code=String(m.code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8),r;
   if(m.t==='wc_create'){code=require('crypto').randomBytes(3).toString('hex').toUpperCase();r={code,host:0,members:new Map(),snapshot:null};rooms.set(code,r)}else r=rooms.get(code);
   if(!r||r.members.size>=4){send(c,{t:'wc_error',message:'Oda bulunamadı veya dolu (4 kişi).'});return true}
   leave(c);c.wcid=uid++;c.wcroom=r;r.members.set(c.wcid,c);if(!r.host)r.host=c.wcid;
   send(c,{t:'wc_welcome',id:c.wcid,host:r.host,code,players:peers(r),snapshot:r.snapshot});emit(r,{t:'wc_peers',players:peers(r)});return true;
  }
  const r=c.wcroom;if(!r)return true;
  const host=r.members.get(r.host);
  if(m.t==='wc_state'){
   const d=m.d||{},finite=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
   send(host,{t:'wc_state',id:c.wcid,d:{x:finite(d.x,-17,17),y:finite(d.y,0,8),z:finite(d.z,-3030,18),yaw:finite(d.yaw,-1000,1000),w:weapons[d.w]?d.w:'rifle'}});
  }else if(m.t==='wc_snapshot'&&c.wcid===r.host){
   const d=m.d;if(!d||!Array.isArray(d.zombies)||d.zombies.length>12||!Array.isArray(d.players)||d.players.length>4||JSON.stringify(d).length>30000)return true;
   r.snapshot=d;emit(r,{t:'wc_snapshot',d},c);
  }else if(m.t==='wc_hit'){
   const w=weapons[m.w];if(!w)return true;const last=c.wchit||0;if(now-last<w.r*450)return true;c.wchit=now;
   send(host,{t:'wc_hit',id:c.wcid,target:Math.max(0,m.target|0),damage:w.d*(m.head&&!w.m?2:1),w:m.w});
  }else if(m.t==='wc_pick')send(host,{t:'wc_pick',id:c.wcid,pick:m.pick|0});
  else if(m.t==='wc_event'&&c.wcid===r.host){if(['reward','pickup','end'].includes(m.event)&&JSON.stringify(m).length<1000)emit(r,{...m,t:'wc_event'},c)}
  return true;
 }
 return{handle,leave,rooms};
};
