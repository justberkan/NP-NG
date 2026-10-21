'use strict';
/* KBK Escort & Hunt co-op oda ağı: kişi sınırı yok, rol taşıma, hedefli olay yönlendirme, kurt hasarı. */
const WebSocket=(()=>{try{return require('ws')}catch(e){return globalThis.WebSocket}})();
const assert=require('node:assert/strict');
const port=new URL(process.env.TEST_URL||'http://127.0.0.1:3000').port;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,ms=3000){const t0=Date.now();while(Date.now()-t0<ms){const v=fn();if(v)return v;await sleep(25)}throw new Error('Zaman aşımı')}
(async()=>{
 const clients=[];
 async function peer(n){const ws=new WebSocket(`ws://127.0.0.1:${port}`),p={ws,messages:[],send:m=>ws.send(JSON.stringify(m))};clients.push(p);
  ws.addEventListener('message',e=>p.messages.push(JSON.parse(e.data)));
  await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true})});
  p.send({t:'auth',mode:'register',name:'kbk'+n,pass:'test-only-password'});
  await until(()=>p.messages.find(m=>m.t==='auth'&&m.ok));return p}
 const check=(name,cond,extra)=>{assert.ok(cond,name);console.log('PASS',name,extra?'· '+JSON.stringify(extra):'')};

 const ps=[];for(let i=0;i<6;i++)ps.push(await peer(i));   // 6 oyuncu: kurt+3 koruma+KBK+1 yedek
 const host=ps[0];
 host.send({t:'kbk_create',code:'',role:'wolf'});
 const w=await until(()=>host.messages.find(m=>m.t==='kbk_welcome'));
 check('Oda kuruldu, host rolü taşındı',!!w.code&&w.host===w.id&&w.hostRole==='wolf'&&w.role==='wolf',{code:w.code});
 const code=w.code;
 for(let i=1;i<6;i++){
  const before=ps[i].messages.length;
  ps[i].send({t:'kbk_join',code,role:i===1?'kbk':(i===2?'guardian':'auto')});
  const m=await until(()=>ps[i].messages.slice(before).find(x=>x.t==='kbk_welcome'));
  assert.equal(m.code,code);assert.equal(m.hostRole,'wolf');
  ps[i]._id=m.id;
 }
 check('6 oyuncu aynı odada (kişi sınırı yok)',true);
 const peersMsg=await until(()=>host.messages.find(m=>m.t==='kbk_peers'&&m.players.length===6));
 check('Host 6 eşi + rolleri görüyor',peersMsg.players.length===6&&peersMsg.players.some(q=>q.role==='kbk')&&peersMsg.players.filter(q=>q.role==='guardian').length>=1,{roles:peersMsg.players.map(q=>q.role)});

 /* state: oyuncu -> host, rol alanı korunuyor */
 const mid=ps[3];
 mid.send({t:'kbk_state',d:{x:5,y:0,z:-7,yaw:1.2,hp:80,flash:true,role:'guardian'}});
 const st=await until(()=>host.messages.find(m=>m.t==='kbk_state'&&m.id===mid._id));
 check('kbk_state hosta iletildi (rol dahil)',Math.abs(st.d.x-5)<.01&&st.d.hp===80&&st.d.role==='guardian');

 /* snapshot: host -> diğerleri */
 host.send({t:'kbk_snapshot',d:{house:{x:10,z:-20},cps:[1,0,1,0,0],foxes:[{id:1,x:2,z:3,hp:100},{id:2,x:-4,z:1,hp:60}],players:[{id:1,x:0,y:0,z:0,hp:100,role:'guardian'},{id:2,x:1,y:0,z:1,hp:90,role:'kbk'}]}});
 const snap=await until(()=>ps[5].messages.find(m=>m.t==='kbk_snapshot'));
 check('Snapshot eşlere iletildi',snap.d.house.x===10&&snap.d.foxes.length===2&&snap.d.players[1].role==='kbk');

 /* bozuk snapshot reddedilir */
 const beforeBad=ps[5].messages.length;
 host.send({t:'kbk_snapshot',d:{house:{x:0,z:0}}});
 await sleep(300);
 check('Bozuk snapshot reddedildi',!ps[5].messages.slice(beforeBad).some(m=>m.t==='kbk_snapshot'));

 /* hit: tilki -> host */
 ps[2].send({t:'kbk_hit',target:1,w:'rifle'});
 const hit=await until(()=>host.messages.find(m=>m.t==='kbk_hit'&&m.target===1));
 check('Tilki vuruşu hosta iletildi',hit.damage>0,{dmg:hit.damage});
 /* hit: koruma -> kurt (farklı eş: hız sınırı diğer vuruşu engellemesin) */
 ps[3].send({t:'kbk_hit',target:'wolf',w:'rifle',head:true});
 const wh=await until(()=>host.messages.find(m=>m.t==='kbk_hit'&&m.target==='wolf'));
 check('Kurt vuruşu hosta iletildi',wh.damage>0,{dmg:wh.damage});

 /* hedefli event: kurt -> belirli koruma */
 ps[0].send({t:'kbk_event',event:'stun',id:ps[2]._id});
 const stun=await until(()=>ps[2].messages.find(m=>m.t==='kbk_event'&&m.event==='stun'));
 check('Hedefli stun ilgili koruyucuya iletildi',stun.id===ps[2]._id);
 /* idsiz istemci olayı -> host (kidnap); gönderen host değil */
 ps[1].send({t:'kbk_event',event:'kidnap'});
 const kid=await until(()=>host.messages.find(m=>m.t==='kbk_event'&&m.event==='kidnap'));
 check('İdsiz olay sahibe iletildi',kid.event==='kidnap');

 /* host whitelist eventleri -> herkese */
 host.send({t:'kbk_event',event:'wolfhp',hp:55});
 const wp=await until(()=>ps[4].messages.find(m=>m.t==='kbk_event'&&m.event==='wolfhp'));
 check('Kurt canı eşlere iletildi',wp.hp===55);
 /* host whitelist DIŞI event yayınlanmaz */
 const beforeEv=ps[4].messages.length;
 host.send({t:'kbk_event',event:'cheat-hack-xyz'});
 await sleep(300);
 check('Beyaz liste dışı event yayınlanmadı',!ps[4].messages.slice(beforeEv).some(m=>m.t==='kbk_event'&&m.event==='cheat-hack-xyz'));

 /* host ayrılınca oda kapanır */
 host.send({t:'kbk_leave'});
 const closed=await until(()=>ps[4].messages.find(m=>m.t==='kbk_closed'));
 check('Host ayrılınca oda kapandı',!!closed.reason);

 /* var olmayan oda reddedilir */
 ps[1].send({t:'kbk_join',code:'YOK123'});
 const err=await until(()=>ps[1].messages.find(m=>m.t==='kbk_error'));
 check('Bilinmeyen oda reddedildi',/bulunamadı/i.test(err.message));

 for(const p of clients)try{p.ws.close()}catch(e){}
 console.log('kbk: hepsi PASS');
})().catch(e=>{for(const p of clients)try{p.ws.close()}catch(_){ }console.error(e);process.exitCode=1});
