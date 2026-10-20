'use strict';
/* Inlı Cinlı (korku) co-op oda ağı: kişi sınırı yok, yönlendirme, kapanma. */
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
  p.send({t:'auth',mode:'register',name:'ic'+n,pass:'test-only-password'});
  await until(()=>p.messages.find(m=>m.t==='auth'&&m.ok));return p}
 const check=(name,cond,extra)=>{assert.ok(cond,name);console.log('PASS',name,extra?'· '+JSON.stringify(extra):'')};

 /* Varlıklar sunuluyor mu */
 for(const f of ['assets/horror/map_backrooms.glb','assets/horror/map_lego.glb','assets/horror/map_starttrack.glb','assets/horror/mon_momo.glb','assets/horror/mon_slender.glb','assets/horror/skins_holo.glb','assets/horror/map_backrooms_col.json','assets/horror/map_lego_nav.json','assets/horror/skins_holo.json']){
  const r=await fetch(`http://127.0.0.1:${port}/${f}`);check(`HTTP 200 ${f}`,r.status===200)}

 const ps=[];for(let i=0;i<6;i++)ps.push(await peer(i));   // wc 4 kişiyle sınırlıydı; ic sınırsız olmalı
 const host=ps[0];
 host.send({t:'ic_create',code:''});
 const w=await until(()=>host.messages.find(m=>m.t==='ic_welcome'));
 check('Oda kuruldu',!!w.code&&w.host===w.id,{code:w.code});
 const code=w.code;
 for(let i=1;i<6;i++){
  const before=ps[i].messages.length;
  ps[i].send({t:'ic_join',code});
  const m=await until(()=>ps[i].messages.slice(before).find(x=>x.t==='ic_welcome'));
  assert.equal(m.code,code);ps[i]._icid=m.id;
 }
 check('6 oyuncu aynı odada (kişi sınırı yok)',true);
 const peersMsg=await until(()=>host.messages.find(m=>m.t==='ic_peers'&&m.players.length===6));
 check('Host 6 eşi görüyor',peersMsg.players.length===6,{n:peersMsg.players.length});

 /* state: oyuncu -> host */
 const mid=ps[3];
 mid.send({t:'ic_state',d:{x:5,y:0,z:-7,yaw:1.2,hp:80,flash:true,skin:3}});
 const st=await until(()=>host.messages.find(m=>m.t==='ic_state'&&m.id===mid._icid));
 check('ic_state hosta iletildi',Math.abs(st.d.x-5)<.01&&st.d.hp===80);

 /* snapshot: host -> diğerleri */
 host.send({t:'ic_snapshot',d:{level:2,door:{x:1,z:2},mons:[{id:1,k:'momo',x:0,y:0,z:0,hp:100,max:100,sp:4.5}],players:[{id:0,x:0,y:0,z:0,hp:100},{id:1,x:1,y:0,z:1,hp:90}]}});
 const snap=await until(()=>ps[5].messages.find(m=>m.t==='ic_snapshot'));
 check('Snapshot eşlere iletildi',snap.d.level===2&&snap.d.mons.length===1&&snap.d.mons[0].k==='momo');

 /* hit: oyuncu -> host */
 ps[2].send({t:'ic_hit',target:1,w:'rifle'});
 const hit=await until(()=>host.messages.find(m=>m.t==='ic_hit'&&m.target===1));
 check('ic_hit hosta iletildi',hit.damage>0,{dmg:hit.damage});

 /* event: host -> diğerleri */
 host.send({t:'ic_event',event:'reward',amount:1000});
 const ev=await until(()=>ps[1].messages.find(m=>m.t==='ic_event'&&m.event==='reward'));
 check('Ödül eventi eşlere iletildi',ev.amount===1000);

 /* host ayrılınca oda kapanır */
 host.send({t:'ic_leave'});
 const closed=await until(()=>ps[4].messages.find(m=>m.t==='ic_closed'));
 check('Host ayrılınca oda kapandı',!!closed.reason);

 /* var olmayan oda reddedilir */
 ps[0].send({t:'ic_join',code:'YOK123'});   // host artık codesiz; yeni oda açmadı
 const err=await until(()=>ps[0].messages.find(m=>m.t==='ic_error'));
 check('Bilinmeyen oda reddedildi',/bulunamadı/i.test(err.message));

 for(const p of clients)try{p.ws.close()}catch(e){}
 console.log('inli-cinli: hepsi PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
