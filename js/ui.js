'use strict';
/* ===== Lobi arayüzü: gezinme, mağaza, envanter, battle pass, mod seçimi, ayarlar ===== */
const RK=['Er','Onbaşı','Çavuş','Üstçavuş','Teğmen','Yüzbaşı','Binbaşı','Albay','General','Mareşal'];
const VIEWS={},VIEWWIRE={};
const NAV=[['home','lobi'],['stock','borsa'],['bank','beko bank'],['bp','battle pass'],['quest','görevler'],['shop','mağaza'],['inv','envanter'],['owc','açık dünya'],['casino','kumarhane'],['settings','ayarlar']];
let curView='home',vt='w',vs=null,vm='shop',vmsg='',vw='rifle';

/* ----- Simgeler (SVG) ----- */
function wicon(k,c,a){
 const f=hex(c),g=hex(a||0x3a4552),d='#1d2228',m='#15191e',st='#cfd8e0';
 const B={
  rifle:`<rect x='10' y='15' width='44' height='9' rx='2' fill='${f}'/><rect x='54' y='17' width='34' height='4' fill='${d}'/><rect x='0' y='16' width='14' height='10' rx='2' fill='${f}'/><rect x='34' y='13' width='24' height='6' fill='${g}'/><rect x='24' y='24' width='5' height='12' fill='${d}'/><rect x='40' y='24' width='7' height='14' fill='${m}'/>`,
  smg:`<rect x='20' y='15' width='34' height='10' rx='2' fill='${f}'/><rect x='54' y='17' width='20' height='4' fill='${d}'/><rect x='8' y='17' width='14' height='6' fill='${f}'/><rect x='46' y='14' width='14' height='6' fill='${g}'/><rect x='28' y='25' width='5' height='11' fill='${d}'/><rect x='38' y='25' width='6' height='18' fill='${m}'/>`,
  pistol:`<rect x='26' y='14' width='36' height='8' rx='2' fill='${f}'/><rect x='26' y='22' width='26' height='5' fill='${g}'/><rect x='28' y='26' width='8' height='14' rx='2' fill='${d}'/>`,
  dual:`<rect x='4' y='6' width='30' height='7' rx='2' fill='${f}'/><rect x='6' y='13' width='22' height='4' fill='${g}'/><rect x='6' y='16' width='7' height='11' rx='2' fill='${d}'/><rect x='46' y='20' width='30' height='7' rx='2' fill='${f}'/><rect x='48' y='27' width='22' height='4' fill='${g}'/><rect x='48' y='30' width='7' height='10' rx='2' fill='${d}'/>`,
  knife:`<polygon points='20,17 74,12 78,16 22,24' fill='${st}'/><rect x='10' y='15' width='12' height='7' rx='2' fill='${d}'/><rect x='20' y='12' width='4' height='14' fill='${g}'/>`,
  sword:`<polygon points='26,17 96,17 100,20 96,23 26,23' fill='${st}'/><rect x='18' y='11' width='6' height='18' fill='${g}'/><rect x='6' y='17' width='13' height='6' fill='${d}'/><circle cx='5' cy='20' r='3' fill='${g}'/>`,
  gsword:`<polygon points='30,14 96,14 100,20 96,26 30,26' fill='${st}'/><rect x='22' y='6' width='7' height='28' fill='${g}'/><rect x='2' y='17' width='21' height='6' fill='${d}'/><circle cx='3' cy='20' r='4' fill='${g}'/>`
 };
 return `<svg viewBox='0 0 100 42'>${B[k]||B.rifle}</svg>`;
}
function cicon(c){const f=hex(c);return `<svg viewBox='0 0 40 46'><circle cx='20' cy='9' r='6' fill='#e8c9a0'/><rect x='13' y='7' width='14' height='5' rx='2' fill='#1b2432'/><rect x='11' y='16' width='18' height='15' rx='3' fill='${f}'/><rect x='5' y='17' width='6' height='14' rx='3' fill='${f}'/><rect x='29' y='17' width='6' height='14' rx='3' fill='${f}'/><rect x='12' y='31' width='7' height='14' rx='2' fill='#27324a'/><rect x='21' y='31' width='7' height='14' rx='2' fill='#27324a'/></svg>`}
function xicon(c){const f=hex(c);return `<svg viewBox='0 0 40 40'><circle cx='20' cy='20' r='10' fill='none' stroke='${f}' stroke-width='2'/><path d='M20 2v10M20 28v10M2 20h10M28 20h10' stroke='${f}' stroke-width='3'/></svg>`}
function opticon(o){const c=o.r==='legendary'?'#ffb020':o.r==='epic'?'#b070ff':o.r==='rare'?'#4aa8ff':'#9aa7b3';return `<svg viewBox='0 0 100 42'><rect x='28' y='30' width='44' height='5' rx='1' fill='#39424c'/><rect x='${o.z>=2.5?14:34}' y='${o.z>=2.5?12:8}' width='${o.z>=2.5?72:32}' height='${o.z>=2.5?14:22}' rx='4' fill='#1d232b' stroke='${c}' stroke-width='2'/><circle cx='${o.z>=2.5?82:50}' cy='${o.z>=2.5?19:19}' r='${o.z>=2.5?5:6}' fill='${o.ty==='therm'?'#30ff90':'#ff3030'}' opacity='.8'/></svg>`}
function coinicon(){return `<svg viewBox='0 0 40 40'><circle cx='20' cy='20' r='15' fill='#ffcf3a' stroke='#b88a10' stroke-width='2'/><text x='20' y='26' text-anchor='middle' font-size='18' font-weight='800' fill='#7a5a00'>₺</text></svg>`}
function crateicon(c){return `<svg viewBox='0 0 40 40'><rect x='6' y='10' width='28' height='24' rx='3' fill='${c}'/><rect x='6' y='10' width='28' height='7' fill='#0004'/><rect x='17' y='17' width='6' height='9' fill='#ffe14d'/></svg>`}

/* ----- Veri yardımcıları ----- */
function itemById(id){return SKINS.find(s=>s.id===id)||CHARS.find(c=>c.id===id)||FORMS.find(f=>f.id===id)||XH.find(x=>x.id===id)||OPTID[id]||WMID[id]}
function iconOf(id,wk0){
 const s=SKINS.find(z=>z.id===id);if(s)return wicon(wk0||'rifle',s.c,s.a);
 const c=CHARS.find(z=>z.id===id);if(c)return cicon(c.j);
 const x=XH.find(z=>z.id===id);if(x)return xicon(x.c);
 const op=OPTID[id];if(op)return opticon(op);
 const m=WMID[id];if(m){const k='ic:'+id;if(MDL.icons[m.mid+'@380x210'])return `<img src='${MDL.icons[m.mid+'@380x210']}' style='height:100%;max-width:100%;object-fit:contain'>`;mdlIcon(m.mid,380,210,()=>{});return wicon(m.cls,0x555d68,0x3a4552)}
 return '';
}
const lvl=()=>Math.min(20,1+Math.floor(SV.xp/200));
const own=i=>i.t==='w'||i.t==='oi'||(i.t==='op'&&i.p===0)||(i.t==='f'&&i.p===0)||(i.t==='ws'?SV.ow.sw.includes(i.sid):SV.own.includes(i.id));
const eqd=i=>i.t==='ws'?SV.ow.mw===i.sid:i.t==='oi'?false:i.t==='m'?(SV.mod[i.m.cls]===i.id&&(SV.eq.w===i.m.cls||(i.m.cls==='pistol'&&SV.eq.w==='dual'))):i.t==='w'?(SV.eq.w===i.w&&(i.w==='dual'||!SV.mod[i.w])):i.t==='g'?(SV.sk[vw]||'g0')===i.id:i.t==='c'?SV.eq.c===i.id:i.t==='f'?(SV.eq.f||'f0')===i.id:i.t==='op'?(SV.eq.o||'o0')===i.id:SV.eq.x===i.id;
function bal(){
 const dbt=typeof debtTotal==='function'?debtTotal():0;
 $('bal').innerHTML=`<span class='g'>para<b>${fmt(SV.tl)}</b></span><span class='y'>altın<b>${fmt(SV.gold||0)}</b></span><span class='r'>borç<b>${dbt?'-'+fmt(dbt):'0'}</b></span>`;
}
function applyEq(rebuild){
 const x=XH.find(i=>i.id===SV.eq.x);if(x)document.documentElement.style.setProperty('--cx',hex(x.c));
 if(rebuild){rebuildPlayerModels();lobbyRefresh()}
}
function payFor(price,label,cb){
 if(typeof payDialog==='function')return payDialog(price,label,cb);
 if(SV.tl<price){vmsg='Yetmiyor';return false}
 SV.tl-=price;cb();return true;
}

/* ----- Ana görünüm ----- */
function homeHTML(){
 const L=lvl(),ri=Math.min(9,Math.floor((L-1)/2));
 return `<div id='rk'><svg viewBox='0 0 40 40'><path d='M20 3l15 8v14l-15 12L5 25V11z' fill='#3a4048' stroke='#9aa4ad' stroke-width='2'/><path d='M12 18l8-5 8 5M12 24l8-5 8 5' stroke='#d7dde2' stroke-width='3' fill='none'/></svg><div><small>rüdbe · sv ${L}</small><b>${RK[ri]}</b></div></div>`;
}

/* ----- Mağaza / envanter ----- */
const TABS=[['şampiyonlar','h'],['karakterler','c'],['kaplamalar','g'],['silahlar','w'],['nişangah','x'],['kasalar','k'],['açık dünya','o']];
const RMAP=[0,'common','common','rare','epic','legendary'];
function listFor(){
 if(vt==='o')return SWD.map(s=>({id:'ow:'+s.id,sid:s.id,n:s.n+(swLv(s.id)?' +'+swLv(s.id):''),p:s.p,t:'ws',r:RMAP[s.r]})).concat(Object.keys(ITM).filter(id=>!ITM[id].special&&invHave(id)>0).map(id=>({id:'oi:'+id,iid:id,n:ITM[id].n+' ×'+invHave(id),p:ITM[id].p,t:'oi',r:RMAP[ITM[id].r]})));
 if(vt==='w')return WKEYS.map(k=>({id:'w:'+k,w:k,n:WP[k].n,p:0,t:'w',r:'common'}));
 if(vt==='k')return vm==='shop'?[{id:'k1',n:'Bronz kasa',p:100,t:'k',r:'rare'},{id:'k2',n:'Altın kasa',p:250,t:'k',r:'epic'}]:[];
 if(vt==='c')return CHARS.filter(c=>!c.ch).map(c=>({id:c.id,n:c.n,p:c.p,t:'c',r:c.r,c:c.j}));
 if(vt==='h')return CHARS.filter(c=>c.ch).map(c=>({id:c.id,n:c.n,p:c.p,t:'c',r:c.r,c:c.j,ch:1}));
 if(vt==='g')return SKINS.map(s=>({id:s.id,n:s.n,p:s.p,t:'g',r:s.r,c:s.c,a:s.a}));
 return XH.map(x=>({id:x.id,n:x.n,p:x.p,t:'x',r:x.r,c:x.c}));
}
function cellIcon(i){
 if(i.t==='ws')return swIcon(i.sid);
 if(i.t==='oi')return `<span style='font-size:34px;line-height:60px'>${ITM[i.iid].ic}</span>`;
 if(i.t==='w'){const s=skinOf(i.w);return wicon(i.w,s.c,s.a)}
 if(i.t==='g')return wicon(vw,i.c,i.a);
 if(i.t==='c')return cicon(i.c);
 if(i.t==='x')return xicon(i.c);
 return crateicon(i.id==='k2'?'#c98a10':'#8a5a2a');
}
function dsc(i){
 if(i.t==='ws'){const s=SWID[i.sid];return s.d+' Açık dünyada kullanılır. Hasar '+s.dmg+', menzil '+s.range+' m. Yükseltme için açık dünyadaki Demirci Kaan ya da lobideki Açık Dünya Merkezi.'}
 if(i.t==='oi')return ITM[i.iid].d+' Tüccar alış fiyatı: '+ITM[i.iid].p+' TL. Tıklayınca 1 adet satılır.';
 if(i.t==='w')return WP[i.w].d;
 if(i.t==='f')return i.p?'Forma: tüm karakterlere giyilir. Karakterin üstündeki kıyafet forma desenine dönüşür (gövde ve kısa kol), altı değişmez. Envanterden çıkarabilirsin. Özgün tasarım.':'Formayı çıkar: karakter kendi kıyafetiyle görünür.';
 if(i.t==='c')return (i.ch?(typeof CHAR(i.id).glb==='string'?'Şampiyon: gerçek 3B karakter modeli. ':'Şampiyon: özgün aksesuarlı karakter. '):'Karakter görünümü. ')+'Sadece görünümü değiştirir, güç vermez. Seçince solda 3B olarak önizlenir.';
 if(i.t==='g')return 'Silah kaplaması ('+RAR[i.r].n+'). Seçili silaha uygulanır, hasarı etkilemez.';
 if(i.t==='x')return 'Nişangah rengi.';
 return i.id==='k2'?'Altın kasa: Efsanevi ve Altın eşya şansı yüksek.':'Bronz kasa: rastgele bir eşya verir.';
}
function shopV(){
 let L=listFor();if(vm==='inv')L=L.filter(own);
 const it=L.find(x=>x.id===vs)||L[0];vs=it?it.id:null;
 const cells=L.map(i=>{
  const o=own(i);
  const lab=i.t==='oi'?`SAT · ${i.p} TL`:i.t==='k'?`${fmt(i.p)} TL · AÇ`:o?(eqd(i)?'KUŞANILDI':'KUŞAN'):`${fmt(i.p)} TL · AL`;
  return `<div class='cell r-${i.r}${i.id===vs?' on':''}' data-s='${i.id}'><i style='background:#101822'>${cellIcon(i)}</i>${i.n}<button data-b='${i.id}'>${lab}</button></div>`;
 });
 while(cells.length<10)cells.push(`<div class='cell em'>boş</div>`);
 const st=it&&it.t==='w'?WP[it.w].st:null;
 const chips=vt==='g'?`<div class='tabs'>${WKEYS.map(k=>`<button data-w='${k}' class='${vw===k?'on':''}'>${WP[k].n}</button>`).join('')}</div>`:'';
 return `<div class='pn2'><div class='tabs'>${TABS.map(t=>`<button data-t='${t[1]}' class='${vt===t[1]?'on':''}'>${t[0]}</button>`).join('')}</div>${chips}<div class='grid'>${cells.join('')}</div></div>
 <div class='dr'><div class='pn2'><h3>${it?it.n:'-'}</h3><p>${it?dsc(it):'Bu sekmede eşya yok.'}</p><p class='ms'>${vmsg}</p></div>
 <div class='pn2'>${st?['Hasar','İsabet','Tepme','Atış hızı','Mermi'].map((l,j)=>`<div class='sr'><span>${l}</span><span class='bar'><em class='c${j}' style='width:${Math.min(100,st[j]*(j===4?3:1))}%'></em></span><b>${j===4?(WP[it.w].mag||'-'):st[j]}</b></div>`).join(''):`<p>${it?'Bu eşya hasar ya da can vermez. Sadece görünüm.':''}</p>`}</div></div>`;
}
function act(id){
 vmsg='';
 const i=listFor().find(x=>x.id===id);if(!i)return;
 if(i.t==='oi'){invTake(i.iid,1);SV.tl+=ITM[i.iid].p;vmsg=ITM[i.iid].n+' satıldı +'+ITM[i.iid].p+' TL';save();bal();view(vm);return}
 if(i.t==='ws'){
  if(SV.ow.sw.includes(i.sid)){SV.ow.mw=i.sid;vmsg='Kuşanıldı (açık dünyada geçerli)'}
  else if(SV.tl<i.p)vmsg='Yetmiyor';
  else{SV.tl-=i.p;SV.ow.sw.push(i.sid);vmsg='Satın alındı: '+i.n}
  save();bal();view(vm);return;
 }
 if(i.t==='k'){
  const pool=SKINS.concat(CHARS,XH).filter(x=>!SV.own.includes(x.id)&&(i.id==='k1'||x.r==='epic'||x.r==='legendary'));
  if(SV.tl<i.p)vmsg='Yetmiyor';
  else if(!pool.length)vmsg='Bu kasadan çıkacak eşya kalmadı';
  else{SV.tl-=i.p;const g=pool[Math.floor(Math.random()*pool.length)];SV.own.push(g.id);vmsg='Kasadan çıktı: '+g.n+' ('+RAR[g.r].n+')'}
 }else if(vm==='shop'&&!own(i)){
  const done=payFor(i.p,i.n,()=>{SV.own.push(i.id);equip(i);save();bal();view(vm)});
  if(done!==false&&typeof payDialog==='function')return;
 }else equip(i);
 save();bal();view(vm);
}
function equip(i){
 if(i.t==='w'){SV.eq.w=i.w;applyEq(true)}
 else if(i.t==='g'){SV.sk[vw]=i.id;applyEq(true)}
 else if(i.t==='c'){SV.eq.c=i.id;applyEq(true)}
 else if(i.t==='f'){SV.eq.f=i.id==='f0'?null:i.id;applyEq(true)}
 else if(i.t==='op'){SV.eq.o=i.id;applyEq(true)}
 else{SV.eq.x=i.id;applyEq(false)}
}
VIEWS.shop=VIEWS.inv=shopV;
VIEWWIRE.shop=VIEWWIRE.inv=function(){
 const a=$('av');
 a.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{vt=b.dataset.t;vs=null;vmsg='';view(vm)});
 a.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{vw=b.dataset.w;vmsg='';view(vm)});
 a.querySelectorAll('[data-s]').forEach(c=>c.onclick=()=>{vs=c.dataset.s;vmsg='';const it=listFor().find(x=>x.id===vs);lobbyPreview(it&&it.t==='c'?it.id:null);view(vm)});
 a.querySelectorAll('[data-b]').forEach(b=>b.onclick=e=>{e.stopPropagation();act(b.dataset.b)});
};

/* ----- Battle pass ----- */
const BPF=[{tl:50},{tl:50},{i:'g2'},{tl:100},{i:'x1'},{tl:100},{i:'g6'},{tl:150},{tl:150},{i:'c1'},{tl:150},{i:'g5'},{tl:200},{i:'x2'},{tl:200},{i:'g3'},{tl:250},{tl:250},{i:'c2'},{tl:500}];
const BPP=[{i:'g8'},{tl:200},{i:'c5'},{tl:300},{i:'g7'},{tl:300},{i:'x3'},{i:'g4'},{tl:400},{i:'c3'},{tl:400},{i:'g1'},{tl:500},{i:'x4'},{tl:500},{i:'c4'},{tl:600},{tl:600},{tl:700},{tl:1000}];
const PREM_PRICE=1500;
function bpMigrate(){SV.bp=(SV.bp||[]).map(x=>typeof x==='number'?'f'+x:x)}
function rewardCard(r,n,track){
 const key=track+n,done=SV.bp.includes(key),ok=lvl()>n&&(track==='f'||SV.pm);
 let ico,lab,rr='common';
 if(r.tl){ico=coinicon();lab=fmt(r.tl)+' TL'}
 else{const it=itemById(r.i);ico=iconOf(r.i,['rifle','smg','pistol','rifle'][n%4]);lab=it.n;rr=it.r}
 const btn=done?'✓ alındı':ok?`<button data-c='${key}'>AL</button>`:(track==='p'&&!SV.pm?'':'');
 return `<div class='tr${track==='p'?' pm':''}${done?' done':''} r-${rr}'><span class='lv'>${n+1}</span>${ok||done?'':"<span class='lock'>🔒</span>"}${ico}${lab}<br>${btn}</div>`;
}
function bpV(){
 const L=lvl(),px=L>=20?200:SV.xp%200;
 return `<div class='pn2'><div class='bprow'><div class='rowlab pm'>PREMİUM</div><div class='bp'>${BPP.map((r,n)=>rewardCard(r,n,'p')).join('')}</div></div>
 <div class='bprow' style='margin-top:6px'><div class='rowlab fr'>ÜCRETSİZ</div><div class='bp'>${BPF.map((r,n)=>rewardCard(r,n,'f')).join('')}</div></div></div>
 <div class='dr'><div class='pn2'><h3>Sezon 1: İlk Savaş</h3><p>Maç oynayarak XP kazan, ödülleri aç. Premium hat ${fmt(PREM_PRICE)} TL ile açılır; kaplama, karakter ve para ödülleri verir.</p>
 ${SV.pm?'<p class="ms">Premium hat açık</p>':`<button class='btn alt' id='bpp'>PREMİUM AÇ (${fmt(PREM_PRICE)} TL)</button>`}<p class='ms'>${vmsg}</p></div>
 <div class='pn2'><div class='sr'><span>Seviye</span><b>${L} / 20</b></div><div class='sr'><span>XP</span><b>${px} / 200</b></div><div class='bar pbar'><em style='width:${px/2}%'></em></div><button class='btn alt' id='ca'>HEPSİNİ AL</button></div></div>`;
}
function claim(key){
 if(SV.bp.includes(key))return;
 const track=key[0],n=+key.slice(1),r=(track==='f'?BPF:BPP)[n];
 if(lvl()<=n||(track==='p'&&!SV.pm))return;
 SV.bp.push(key);
 if(r.tl)SV.tl+=r.tl;
 else if(!SV.own.includes(r.i))SV.own.push(r.i);
 else SV.tl+=100;
}
VIEWS.bp=bpV;
VIEWWIRE.bp=function(){
 const a=$('av');
 a.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{claim(b.dataset.c);save();bal();view('bp')});
 const ca=$('ca');if(ca)ca.onclick=()=>{for(let n=0;n<20;n++){claim('f'+n);claim('p'+n)}save();bal();view('bp')};
 const bpp=$('bpp');if(bpp)bpp.onclick=()=>{
  if(SV.tl<PREM_PRICE){vmsg='Yetmiyor';view('bp');return}
  SV.tl-=PREM_PRICE;SV.pm=true;vmsg='';save();bal();view('bp');
 };
};

/* ----- Görünüm değiştirme ----- */
function view(n){
 if(typeof casinoStop==='function'&&n!=='casino')casinoStop();
 if(n!=='shop'&&n!=='inv'&&(LB.prev||LB.pw)){lobbyPreview(null);lobbyPreviewGun(null,null)}
 curView=n;
 $('lb').classList.toggle('sub',n!=='home');
 document.querySelectorAll('#lt [data-p]').forEach(b=>b.classList.toggle('on',b.dataset.p===n));
 lobbySetView(n==='home'?'home':'sub');
 if(n==='shop'||n==='inv')vm=n;
 if(n==='home')$('av').innerHTML=homeHTML();
 else{
  const f=VIEWS[n]||shopV;
  $('av').innerHTML=`<div id='sv'><div id='sa'></div><div id='scn'>${f()}</div></div>`;
  (VIEWWIRE[n]||(()=>{}))();
 }
 bal();
}

/* ----- Mobil tuş düzeni düzenleyici ----- */
const TBIDS=['bf','bj','br','bs','bq','bk','ba','bw','bo','bh','bm','k1','k2','k3','k4','k5','bd','be'];
const TBDEF={bf:{r:24,b:90,s:84},bj:{r:130,b:150,s:64},br:{r:130,b:50,s:64},bs:{r:30,b:10,s:64},bq:{r:34,b:184,s:64},bk:{r:12,t:50,s:44},ba:{r:215,b:100,s:64},bw:{r:215,b:180,s:64},bo:{l:12,t:168,s:46},bh:{l:12,t:222,s:46},bm:{l:12,t:276,s:46},k1:{r:300,b:20,s:46},k2:{r:300,b:74,s:46},k3:{r:300,b:128,s:46},k4:{r:300,b:182,s:46},k5:{r:300,b:236,s:46},bd:{r:104,b:236,s:50},be:{l:70,t:222,s:46}};
let tlay={},tsel=null;window.tEditing=false;
try{tlay=JSON.parse(localStorage.getItem('mmofps_tl'))||{}}catch(e){}
function applyTouchLayout(){
 TBIDS.forEach(id=>{
  const e=$(id),d=TBDEF[id],s=tlay[id];
  e.style.right=e.style.bottom=e.style.left=e.style.top='';
  const sz=(s&&s.s)||d.s;e.style.width=e.style.height=sz+'px';
  if(s&&s.x!=null){e.style.left=(s.x*innerWidth)+'px';e.style.top=(s.y*innerHeight)+'px'}
  else{if(d.l!=null)e.style.left=d.l+'px';else e.style.right=d.r+'px';if(d.b!=null)e.style.bottom=d.b+'px';else e.style.top=d.t+'px'}
 });
}
function initTouchEdit(){
 applyTouchLayout();resizers.push(applyTouchLayout);
 let drag=null;
 TBIDS.forEach(id=>{
  const e=$(id);
  e.addEventListener('pointerdown',ev=>{
   if(!window.tEditing)return;
   ev.preventDefault();ev.stopPropagation();
   tsel=id;TBIDS.forEach(i=>$(i).classList.toggle('edit',i===id));
   const r=e.getBoundingClientRect();drag={id,dx:ev.clientX-r.left,dy:ev.clientY-r.top};
   e.setPointerCapture(ev.pointerId);
  },true);
  e.addEventListener('pointermove',ev=>{
   if(!window.tEditing||!drag||drag.id!==id)return;
   const x=clamp(ev.clientX-drag.dx,0,innerWidth-20),y=clamp(ev.clientY-drag.dy,0,innerHeight-20);
   e.style.right=e.style.bottom='';e.style.left=x+'px';e.style.top=y+'px';
   tlay[id]=Object.assign(tlay[id]||{},{x:x/innerWidth,y:y/innerHeight});
  });
  e.addEventListener('pointerup',()=>{drag=null});
 });
 window.startTouchEdit=()=>{
  window.tEditing=true;document.body.classList.add('tedit');$('tc').style.display='block';$('joy').style.display=$('look').style.display='none';
  $('lb').classList.add('off');
  const m=document.createElement('div');m.id='tedit';
  m.innerHTML=`<b>Tuş düzeni</b><p>Düğmeleri sürükleyerek yerleştir. Bir düğmeye dokunup boyutunu ayarla.</p><div class='row' style='justify-content:center'><button class='btn alt sm' id='te-m'>Küçült</button><button class='btn alt sm' id='te-p'>Büyüt</button><button class='btn alt sm' id='te-r'>Sıfırla</button><button class='btn sm' id='te-s'>Kaydet</button></div>`;
  document.body.appendChild(m);
  const sz=dl=>{if(!tsel)return;const e=$(tsel),cur=(tlay[tsel]&&tlay[tsel].s)||TBDEF[tsel].s,n=clamp(cur+dl,36,130);tlay[tsel]=Object.assign(tlay[tsel]||{},{s:n});e.style.width=e.style.height=n+'px'};
  $('te-m').onclick=()=>sz(-8);$('te-p').onclick=()=>sz(8);
  $('te-r').onclick=()=>{tlay={};applyTouchLayout()};
  $('te-s').onclick=()=>{
   try{localStorage.setItem('mmofps_tl',JSON.stringify(tlay))}catch(e){}
   window.tEditing=false;document.body.classList.remove('tedit');m.remove();TBIDS.forEach(i=>$(i).classList.remove('edit'));
   $('joy').style.display=$('look').style.display='';
   $('tc').style.display='none';
   $('lb').classList.remove('off');
  };
 };
}

/* ----- Başlatma ----- */
function initUI(){
 $('lt').innerHTML=NAV.map(([k,t])=>`<button data-p='${k}' ${(k==='home'||VIEWS[k])?'':'disabled'}>${t}</button>`).join('');
 document.querySelectorAll('#lt [data-p]').forEach(b=>b.onclick=()=>view(b.dataset.p));
 document.querySelectorAll('.mode:not(.soon)').forEach(b=>b.onclick=()=>{
  selMode=b.dataset.m;
  document.querySelectorAll('.mode').forEach(x=>x.classList.toggle('sel',x===b));
  if(typeof mapSelUI==='function')mapSelUI();
  $('mn').textContent=b.firstChild.textContent;$('mp').classList.add('off');
 });
 $('msel').onclick=()=>$('mp').classList.remove('off');
 $('mp').onclick=e=>{if(e.target===$('mp'))$('mp').classList.add('off')};
 $('fx').onclick=()=>{const l=$('lb').classList.toggle('nf');$('fx').textContent=l?'«':'»';lobbyLayout()};
 bpMigrate();
 initTouchEdit();
}
