'use strict';
/* ===== Ekonomi: Beko Bank (kredi, taksit), borsa, görevler, ikinci el pazar ===== */
const HOUR=3600e3,DAY=24*HOUR,WEEK=7*DAY;
const eNow=()=>Date.now()+((SV&&SV.eco&&SV.eco.off)||0);

function ensureEco(){
 const d={debts:[],coins:{},auto:true,off:0,dayK:-1,weekK:-1,qd:[],qw:[],qs:null,list:[],sales:[],mkSeed:-1,mkBought:{},tr:{},uid:1};
 SV.eco=Object.assign(d,SV.eco||{});
 if(!SV.eco.qs)SV.eco.qs=SEASON_Q.map(q=>({id:q.id,p:0,c:0}));
 questRoll();
}

/* ---------- Beko Bank ---------- */
const LOAN_RATE=.05,INST_RATE=.02;
const creditLimit=()=>1000+500*lvl();
function debtTotal(){let t=0;for(const d of SV.eco.debts)t+=Math.max(0,d.total-d.paid);return Math.round(t)}
function debtAdd(kind,label,principal,weeks,rate){
 const total=Math.ceil(principal*(1+rate*weeks)),per=Math.ceil(total/weeks);
 SV.eco.debts.push({id:SV.eco.uid++,kind,label,total:per*weeks,paid:0,n:weeks,done:0,per,next:eNow()+WEEK,fee:0});
}
function canBorrow(amount,rate,weeks){
 const total=Math.ceil(amount*(1+rate*weeks));
 return debtTotal()+total<=creditLimit();
}
function debtPay(id){
 const d=SV.eco.debts.find(x=>x.id===id);if(!d)return'Borç bulunamadı';
 const due=Math.min(d.per+d.fee,d.total-d.paid+d.fee);
 if(SV.tl<due)return'Yetmiyor: '+fmt(due)+' TL gerekli';
 SV.tl-=due;d.paid+=Math.min(d.per,d.total-d.paid);d.done++;d.fee=0;d.next+=WEEK;
 if(d.paid>=d.total-0.01)SV.eco.debts.splice(SV.eco.debts.indexOf(d),1);
 save();return '';
}
function debtPayAll(id){
 const d=SV.eco.debts.find(x=>x.id===id);if(!d)return'';
 const rest=d.total-d.paid+d.fee;
 if(SV.tl<rest)return'Yetmiyor: '+fmt(rest)+' TL gerekli';
 SV.tl-=rest;SV.eco.debts.splice(SV.eco.debts.indexOf(d),1);save();return '';
}
/* vadesi gelen taksitler: otomatik ödeme açıksa çek, yoksa gecikme faizi işle */
function ecoTick(){
 const E=SV.eco,now=eNow();let ch=false;
 for(const d of E.debts.slice()){
  let guard=0;
  while(d&&now>=d.next&&E.debts.includes(d)&&guard++<8){
   if(E.auto&&SV.tl>=d.per+d.fee){debtPay(d.id);ch=true}
   else{
    if(!d.fee){d.fee=Math.ceil(d.per*.05);ch=true}
    break;
   }
  }
 }
 if(ch){save();if(typeof bal==='function')bal()}
 return ch;
}
const isLate=d=>eNow()>=d.next;
function fmtDue(ms){
 const t=ms-eNow();
 if(t<=0)return'vadesi geldi';
 const dd=Math.floor(t/DAY),hh=Math.floor((t%DAY)/HOUR);
 return dd+' gün '+hh+' sa';
}

/* ---------- Ödeme penceresi (mağaza): peşin ya da taksit ---------- */
function payDialog(price,label,cb){
 if(price<=0){cb();return true}
 let m=$('pay');if(m)m.remove();
 m=document.createElement('div');m.id='pay';
 const opts=[`<button class='rowb' data-w='0'>Peşin: ${fmt(price)} TL</button>`];
 for(let w=2;w<=6;w++){
  const tot=Math.ceil(price*(1+INST_RATE*w)),per=Math.ceil(tot/w);
  opts.push(`<button class='rowb' data-w='${w}'>${w} hafta: haftada ${fmt(per)} TL (toplam ${fmt(per*w)})</button>`);
 }
 m.innerHTML=`<div class='card2'><h3>${label}</h3><p>Fiyat <b>${fmt(price)} TL</b> · Bakiye <b>${fmt(SV.tl)} TL</b> · Kalan kredi limiti <b>${fmt(Math.max(0,creditLimit()-debtTotal()))} TL</b></p>${opts.join('')}<p class='ms' id='paym'></p><button class='btn alt sm' id='payx'>Vazgeç</button></div>`;
 document.body.appendChild(m);
 $('payx').onclick=()=>m.remove();
 m.onclick=e=>{if(e.target===m)m.remove()};
 m.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{
  const w=+b.dataset.w;
  if(w===0){
   if(SV.tl<price){$('paym').textContent='Bakiye yetmiyor. Taksit seçebilirsin.';return}
   SV.tl-=price;cb();m.remove();return;
  }
  if(!canBorrow(price,INST_RATE,w)){$('paym').textContent='Kredi limitin yetmiyor. Önce borçlarını öde ya da seviyeni artır.';return}
  debtAdd('inst',label,price,w,INST_RATE);cb();m.remove();
 });
 return true;
}

/* ---------- Borsa KALDIRILDI (Berkan 2026-10-21): yerine js/trade.js (TradingSim) geldi.
   COINS + wkPrice + coinPrice yalnızca eski hesaplardaki coin bakiyelerinin TL'ye çevrilmesi (tek seferlik göç) için saklandı. */
const COINS=[
 {id:'beko',n:'Bekocoin',sym:'BKC',base:120,ph:.7,ph2:2.1,col:'#ffb020'},
 {id:'amina',n:'Amınacoin',sym:'AMN',base:35,ph:2.4,ph2:.3,col:'#ff5a5a'},
 {id:'btc',n:'Bitcoin',sym:'BTC',base:2500,ph:4.1,ph2:1.2,col:'#f7931a'},
 {id:'fakir',n:'Fakircoin',sym:'FKR',base:8,ph:5.3,ph2:3.9,col:'#8fa3b5'},
 {id:'vip',n:'Vipcoin',sym:'VIP',base:900,ph:1.5,ph2:5.0,col:'#b86bff'}
];
function wkPrice(c,wk){return c.base*(1+.6*Math.sin(wk*.9+c.ph)+.25*Math.sin(wk*2.3+c.ph2))}
function coinPrice(c,t){
 t=t==null?eNow():t;
 const w=t/WEEK,wk=Math.floor(w),f=w-wk,s=f*f*(3-2*f);
 const base=wkPrice(c,wk)*(1-s)+wkPrice(c,wk+1)*s;
 const noise=1+.025*Math.sin(t/(37*60e3)+c.ph*3)+.015*Math.sin(t/(7*60e3)+c.ph2*2);
 return Math.max(.5,base*noise);
}

/* ---------- Görevler ---------- */
const DAILY_Q=[
 {id:'d_kill',t:'Maçlarda 5 öldürme yap',k:'kills',n:5,tl:80,xp:40},
 {id:'d_play',t:'2 maç bitir',k:'plays',n:2,tl:60,xp:30},
 {id:'d_aim',t:'Aim Training\'de 600 skor yap',k:'aim',n:600,tl:100,xp:40,max:1},
 {id:'d_zom',t:'Zombi modunda 3. dalgaya ulaş',k:'wave',n:3,tl:90,xp:40,max:1},
 {id:'d_ow',t:'Açık dünyada 30 mob öldür',k:'owk',n:30,tl:90,xp:40}
];
const WEEKLY_Q=[
 {id:'w_kill',t:'Bu hafta 40 öldürme yap',k:'kills',n:40,tl:400,xp:150},
 {id:'w_win',t:'5v5\'te 3 maç kazan',k:'wins',n:3,tl:500,xp:180},
 {id:'w_play',t:'10 maç bitir',k:'plays',n:10,tl:350,xp:120},
 {id:'w_aim',t:'Aim Training\'de 1500 skor yap',k:'aim',n:1500,tl:450,xp:150,max:1},
 {id:'w_ow',t:'Açık dünyada 250 mob öldür',k:'owk',n:250,tl:450,xp:150}
];
const SEASON_Q=[
 {id:'s_kill',t:'Sezon boyunca 300 öldürme',k:'kills',n:300,tl:2000,xp:600},
 {id:'s_play',t:'Sezon boyunca 40 maç bitir',k:'plays',n:40,tl:1500,xp:500},
 {id:'s_win',t:'Sezon boyunca 15 maç kazan',k:'wins',n:15,tl:2500,xp:700},
 {id:'s_zom',t:'Zombi modunda 10. dalgaya ulaş',k:'wave',n:10,tl:1800,xp:600,max:1},
 {id:'s_aim',t:'Aim Training\'de 3000 skor yap',k:'aim',n:3000,tl:1800,xp:600,max:1},
 {id:'s_owl',t:'Açık dünyada 20. seviyeye ulaş',k:'owl',n:20,tl:2200,xp:700,max:1}
];
function questRoll(){
 const E=SV.eco,now=eNow(),dk=Math.floor(now/DAY),wk=Math.floor(now/WEEK);
 if(E.dayK!==dk){E.dayK=dk;E.qd=DAILY_Q.map(q=>({id:q.id,p:0,c:0}))}
 if(E.weekK!==wk){E.weekK=wk;E.qw=WEEKLY_Q.map(q=>({id:q.id,p:0,c:0}))}
 DAILY_Q.forEach(q=>{if(!E.qd.find(x=>x.id===q.id))E.qd.push({id:q.id,p:0,c:0})});
 WEEKLY_Q.forEach(q=>{if(!E.qw.find(x=>x.id===q.id))E.qw.push({id:q.id,p:0,c:0})});
 SEASON_Q.forEach(q=>{if(!E.qs.find(x=>x.id===q.id))E.qs.push({id:q.id,p:0,c:0})});
}
function questList(kind){
 return kind==='d'?[DAILY_Q,SV.eco.qd]:kind==='w'?[WEEKLY_Q,SV.eco.qw]:[SEASON_Q,SV.eco.qs];
}
function questFeed(s){
 const apply=(defs,st)=>defs.forEach(q=>{
  const x=st.find(z=>z.id===q.id);if(!x)return;
  let v=null;
  if(q.k==='kills')v=s.mode==='ow'?0:(s.kills||0);else if(q.k==='plays')v=s.mode==='ow'?0:1;else if(q.k==='wins')v=s.win&&s.mode==='tdm'?1:0;
  else if(q.k==='aim'&&s.mode==='aim')v=s.score||0;else if(q.k==='wave'&&s.mode==='zom')v=s.wave||0;
  else if(q.k==='owk'&&s.mode==='ow')v=s.kills||0;else if(q.k==='owl'&&s.mode==='ow')v=s.owl||0;
  if(v===null)return;
  x.p=q.max?Math.max(x.p,v):x.p+v;
 });
 apply(DAILY_Q,SV.eco.qd);apply(WEEKLY_Q,SV.eco.qw);apply(SEASON_Q,SV.eco.qs);
}
function onMatchEnd(s){try{questRoll();questFeed(s)}catch(e){}}
function questClaim(kind,id){
 const [defs,st]=questList(kind),q=defs.find(z=>z.id===id),x=st.find(z=>z.id===id);
 if(!q||!x||x.c||x.p<q.n)return;
 x.c=1;SV.tl+=q.tl;SV.xp+=q.xp;save();
}
function questsReady(){
 let n=0;for(const k of['d','w','s']){const[defs,st]=questList(k);defs.forEach(q=>{const x=st.find(z=>z.id===q.id);if(x&&!x.c&&x.p>=q.n)n++})}
 return n;
}

/* ---------- İkinci el pazar ---------- */
const SELLERS=['Kaan_TR','ProAvcı','Zeynep.K','BekoBaba','GölgeAv','Mert34','FakirKral','AslanBey','Selin_FPS','Tuna06','KaçakGöç','NoScope_Ali'];
function tradables(){return SKINS.concat(CHARS,XH,WMOD.filter(wmOn)).filter(i=>i.p>0)}
function isTradable(id){const v=SV.eco.tr[id];if(v!==undefined)return v;const it=itemById(id);return !!(it&&it.p>0)}
function rng(seed){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function mkListings(){
 const dk=Math.floor(eNow()/DAY),r=rng(dk*7919+13),pool=tradables().filter(i=>isTradable(i.id));
 const out=[];
 for(let i=0;i<14&&pool.length;i++){
  const it=pool[Math.floor(r()*pool.length)];
  if(out.find(o=>o.item===it.id))continue;
  const f=.55+r()*.95;
  out.push({lid:'b'+dk+'_'+i,item:it.id,price:Math.max(10,Math.round(it.p*f/10)*10),seller:SELLERS[Math.floor(r()*SELLERS.length)],fair:it.p});
 }
 return out;
}
function marketBuy(lid){
 const E=SV.eco,l=mkListings().find(x=>x.lid===lid);
 if(!l||E.mkBought[lid])return'Satıldı';
 if(SV.own.includes(l.item))return'Bu eşyaya zaten sahipsin';
 return l;
}
function marketBuyDone(l){SV.eco.mkBought[l.lid]=1;SV.own.push(l.item);save()}
function listItem(id,price){
 const E=SV.eco;
 if(!SV.own.includes(id))return'Eşya sende yok';
 if(!isTradable(id))return'Bu eşya satılamaz';
 if(SV.eq.c===id||SV.eq.x===id||Object.values(SV.sk).includes(id))return'Kuşanılı eşya satılamaz. Önce başka eşya kuşan.';
 if(!(price>=10))return'En az 10 TL';
 SV.own.splice(SV.own.indexOf(id),1);
 E.list.push({id:E.uid++,item:id,price:Math.round(price),t:eNow(),real:Date.now()});
 save();return'';
}
function unlist(lid){
 const E=SV.eco,l=E.list.find(x=>x.id===lid);if(!l)return;
 E.list.splice(E.list.indexOf(l),1);SV.own.push(l.item);save();
}
/* botlar belli sürede alıcı olur: adil fiyatın altı hızlı, üstü yavaş/hiç */
function marketTick(dtSec){
 const E=SV.eco;let ch=false;
 for(const l of E.list.slice()){
  const it=itemById(l.item),fair=it?it.p:100,ratio=l.price/Math.max(10,fair);
  if(ratio>1.6)continue;
  const mean=Math.max(8,45*ratio*ratio*ratio);
  if(Math.random()<dtSec/mean){
   const get=Math.floor(l.price*.95);
   SV.tl+=get;E.sales.unshift({item:l.item,price:l.price,get,t:Date.now(),buyer:SELLERS[Math.floor(Math.random()*SELLERS.length)]});
   E.sales.length=Math.min(E.sales.length,12);
   E.list.splice(E.list.indexOf(l),1);ch=true;
  }
 }
 if(ch){save();if(typeof bal==='function')bal();if(typeof curView!=='undefined'&&curView==='market'&&typeof view==='function')view('market')}
}
let ecoAcc=0;
function ecoLoop(dt){
 ecoAcc+=dt;
 if(ecoAcc>=1){marketTick(ecoAcc);ecoTick();ecoAcc=0}
}
