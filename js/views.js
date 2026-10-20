'use strict';
/* ===== Ekranlar: Beko Bank, borsa, görevler, pazar, ayarlar ===== */
const tl=n=>fmt(n)+' TL';
let bkMsg='',stSel='beko',stMsg='',mkTab='buy',mkMsg='',setTab='game',qTab='d';

/* ----- Beko Bank ----- */
function bankV(){
 ecoTick();
 const E=SV.eco,lim=creditLimit(),debt=debtTotal();
 const rows=E.debts.map(d=>{
  const late=isLate(d);
  return `<tr><td>${d.kind==='loan'?'Kredi':'Taksit'}: ${d.label}</td><td>${d.done}/${d.n}</td><td>${tl(d.per)}${d.fee?` <span class='badge l'>+${tl(d.fee)} gecikme</span>`:''}</td><td>${late?`<span class='badge l'>vadesi geldi</span>`:fmtDue(d.next)}</td><td>${tl(d.total-d.paid)}</td><td><button class='rowb' data-p='${d.id}'>Taksiti öde</button><button class='rowb' data-pa='${d.id}'>Hepsini kapat</button></td></tr>`;
 }).join('');
 return `<div class='dr'><div class='pn2'><h3>Beko Bank</h3>
  <div class='sr'><span>Bakiye</span><b>${tl(SV.tl)}</b></div><div class='sr'><span>Toplam borç</span><b class='dn2'>${tl(debt)}</b></div>
  <div class='sr'><span>Kredi limiti</span><b>${tl(lim)}</b></div><div class='sr'><span>Kalan limit</span><b class='up'>${tl(Math.max(0,lim-debt))}</b></div>
  <div class='bar pbar'><em style='width:${Math.min(100,debt/lim*100)}%'></em></div>
  <p>Limit seviyene göre artar (şu an sv ${lvl()}). Kredi haftalık %${LOAN_RATE*100} faiz, mağaza taksiti haftalık %${INST_RATE*100} faiz işler.</p>
  <label class='row note'><input type='checkbox' id='bkauto' ${E.auto?'checked':''}> Vadesi gelen taksiti otomatik öde (bakiyen yeterliyse)</label></div>
 <div class='pn2'><h3>Kredi çek</h3><div class='row'><input type='number' id='lamt' min='100' step='100' value='500'><select id='lwk'>${[1,2,3,4,5,6].map(w=>`<option value='${w}' ${w===4?'selected':''}>${w} hafta</option>`).join('')}</select></div>
  <p id='lsum' class='note'></p><button class='btn sm' id='lbtn'>KREDİ AL</button><p class='ms'>${bkMsg}</p>
  <hr style='border:0;border-top:1px solid #243242'><p class='note'>Test için zamanı ilerlet (vadeleri, borsayı ve görevleri etkiler):</p>
  <div class='row'><button class='chip' data-t='1'>+1 gün</button><button class='chip' data-t='7'>+1 hafta</button><button class='chip' data-t='0'>Sıfırla</button></div></div></div>
 <div class='pn2'><h3>Borçlarım ve taksitler</h3>${rows?`<div style='overflow-x:auto'><table class='tbl'><tr><th>Ne için</th><th>Taksit</th><th>Tutar</th><th>Vade</th><th>Kalan</th><th></th></tr>${rows}</table></div>`:'<p>Borcun yok.</p>'}</div>`;
}
VIEWS.bank=bankV;
VIEWWIRE.bank=function(){
 const a=$('av'),sum=()=>{const v=+$('lamt').value||0,w=+$('lwk').value,t=Math.ceil(v*(1+LOAN_RATE*w));$('lsum').textContent=`Toplam geri ödeme ${tl(t)} · haftada ${tl(Math.ceil(t/w))}`};
 $('lamt').oninput=sum;$('lwk').onchange=sum;sum();
 $('lbtn').onclick=()=>{
  const v=Math.floor(+$('lamt').value||0),w=+$('lwk').value;
  if(v<100){bkMsg='En az 100 TL';view('bank');return}
  if(!canBorrow(v,LOAN_RATE,w)){bkMsg='Kredi limitin yetmiyor';view('bank');return}
  debtAdd('loan',tl(v),v,w,LOAN_RATE);SV.tl+=v;bkMsg=tl(v)+' hesabına yattı';save();bal();view('bank');
 };
 $('bkauto').onchange=()=>{SV.eco.auto=$('bkauto').checked;save()};
 a.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{bkMsg=debtPay(+b.dataset.p);bal();view('bank')});
 a.querySelectorAll('[data-pa]').forEach(b=>b.onclick=()=>{bkMsg=debtPayAll(+b.dataset.pa);bal();view('bank')});
 a.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{const d=+b.dataset.t;SV.eco.off=d?SV.eco.off+d*DAY:0;questRoll();ecoTick();save();bal();view('bank')});
};

/* ----- Borsa ----- */
function spark(c,days,w,h){
 const N=60,now=eNow(),pts=[];
 for(let i=0;i<=N;i++)pts.push(coinPrice(c,now-days*DAY+i*days*DAY/N));
 const mn=Math.min(...pts),mx=Math.max(...pts),rg=Math.max(1e-6,mx-mn);
 const P=pts.map((v,i)=>[i/N*w,h-3-(v-mn)/rg*(h-6)]);
 const up=pts[N]>=pts[0],col=up?'#7dff9a':'#ff6b6b';
 const line=P.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join('');
 return `<svg class='spark' viewBox='0 0 ${w} ${h}' preserveAspectRatio='none' style='height:${h}px'><path d='${line}L${w} ${h}L0 ${h}Z' fill='${col}22'/><path d='${line}' fill='none' stroke='${col}' stroke-width='2' vector-effect='non-scaling-stroke'/><circle cx='${P[N][0]}' cy='${P[N][1]}' r='3' fill='${col}'/></svg>`;
}
function stockV(){
 const sel=COINS.find(c=>c.id===stSel)||COINS[0],h=coinHold(sel.id),pr=coinPrice(sel),pf=portfolioValue();
 const rows=COINS.map(c=>{
  const p=coinPrice(c),hh=SV.eco.coins[c.id],pc=coinWeekPct(c),up=pc>=0;
  const val=hh?hh.q*p:0;
  return `<tr data-c='${c.id}' class='${c.id===sel.id?'on':''}' style='cursor:pointer'><td><b style='color:${c.col}'>${c.sym}</b> ${c.n}</td><td>${p.toFixed(2)} TL</td><td class='${up?'up':'dn2'}'>${up?'▲':'▼'} bu hafta ${pc>0?'+':''}${pc.toFixed(0)}%</td><td>${hh&&hh.q>0?hh.q.toFixed(4):'-'}</td><td>${val>0?tl(val):'-'}</td></tr>`;
 }).join('');
 const pl=h.q>0?h.q*pr-h.cost:0;
 return `<div class='pn2'><h3>Borsa</h3><p class='note'>Fiyatlar haftalık olarak yön değiştirir. Alım ve satımda %1 komisyon var. Portföy değeri: <b>${tl(pf)}</b></p>
 <div style='overflow-x:auto'><table class='tbl'><tr><th>Coin</th><th>Fiyat</th><th>Hafta</th><th>Adet</th><th>Değer</th></tr>${rows}</table></div></div>
 <div class='dr'><div class='pn2'><h3 style='color:${sel.col}'>${sel.n} (${sel.sym})</h3>${spark(sel,14,420,110)}
  <p class='note'>Son 14 gün · şimdi ${pr.toFixed(2)} TL</p></div>
 <div class='pn2'><div class='sr'><span>Elindeki</span><b>${h.q>0?h.q.toFixed(4)+' '+sel.sym:'yok'}</b></div>${h.q>0?`<div class='sr'><span>Kâr / zarar</span><b class='${pl>=0?'up':'dn2'}'>${pl>=0?'+':''}${tl(pl)}</b></div>`:''}
  <div class='row' style='margin:8px 0'><input type='number' id='stamt' min='1' step='50' value='100'><button class='btn sm' id='stbuy'>AL (TL)</button></div>
  <div class='row'><button class='chip' data-sf='.25'>%25 sat</button><button class='chip' data-sf='.5'>%50 sat</button><button class='chip' data-sf='1'>Hepsini sat</button></div><p class='ms'>${stMsg}</p></div></div>`;
}
VIEWS.stock=stockV;
VIEWWIRE.stock=function(){
 const a=$('av');
 a.querySelectorAll('tr[data-c]').forEach(r=>r.onclick=()=>{stSel=r.dataset.c;stMsg='';view('stock')});
 $('stbuy').onclick=()=>{stMsg=coinBuy(stSel,+$('stamt').value)||'Alındı';bal();view('stock')};
 a.querySelectorAll('[data-sf]').forEach(b=>b.onclick=()=>{stMsg=coinSell(stSel,+b.dataset.sf)||'Satıldı';bal();view('stock')});
};

/* ----- Görevler ----- */
function questV(){
 questRoll();
 const mk=kind=>{
  const[defs,st]=questList(kind);
  return defs.map(q=>{
   const x=st.find(z=>z.id===q.id)||{p:0,c:0},pc=Math.min(100,x.p/q.n*100),ok=x.p>=q.n;
   return `<div class='pn2'><div class='row' style='justify-content:space-between'><b>${q.t}</b><span class='note'>${tl(q.tl)} · ${q.xp} XP</span></div>
   <div class='bar pbar'><em style='width:${pc}%'></em></div><div class='row' style='justify-content:space-between'><span class='note'>${Math.min(x.p,q.n)} / ${q.n}</span>${x.c?`<span class='badge'>✓ alındı</span>`:ok?`<button class='rowb' style='width:auto;padding:5px 14px' data-q='${kind}:${q.id}'>ÖDÜLÜ AL</button>`:''}</div></div>`;
  }).join('');
 };
 const left=k=>{const n=eNow();return k==='d'?fmtDue((Math.floor(n/DAY)+1)*DAY):k==='w'?fmtDue((Math.floor(n/WEEK)+1)*WEEK):'sezon sonuna kadar'};
 const rd=claimAllCount();
 return `<div class='pn2'><div class='row' style='justify-content:space-between;margin-bottom:8px'><b>Toplanabilir ödül: ${rd}</b><button class='btn alt' id='qall' style='width:auto;padding:8px 18px'${rd?'':' disabled'}>TÜM ÖDÜLLERİ AL</button></div>${qAllMsg?`<p class='ms'>${qAllMsg}</p>`:''}<div class='tabs'>${[['d','Günlük'],['w','Haftalık'],['s','Sezon']].map(t=>`<button data-qt='${t[0]}' class='${qTab===t[0]?'on':''}'>${t[1]}</button>`).join('')}</div><p class='note'>Yenilenme: ${left(qTab)}</p></div>${mk(qTab)}`;
}
/* Tek tuşla toplama: günlük + haftalık + sezon görevleri, ardından battle pass (görev XP'si yeni seviye açabilir) */
let qAllMsg='';
function claimAllCount(){
 let n=typeof questsReady==='function'?questsReady():0;
 if(typeof BPF!=='undefined'&&typeof lvl==='function'){const L=lvl();for(let i=0;i<20;i++){if(i<L&&BPF[i]&&!SV.bp.includes('f'+i))n++;if(SV.pm&&i<L&&BPP[i]&&!SV.bp.includes('p'+i))n++}}
 return n;
}
function claimAll(){
 const tl0=SV.tl,bp0=SV.bp.length;let q=0;
 for(let pass=0;pass<3;pass++){ /* görev XP'si seviye atlatırsa yeni BP ödülleri de alınsın */
  for(const k of['d','w','s']){const[defs,st]=questList(k);defs.forEach(d=>{const x=st.find(z=>z.id===d.id);if(x&&!x.c&&x.p>=d.n){questClaim(k,d.id);q++}})}
  if(typeof claim==='function')for(let i=0;i<20;i++){claim('f'+i);claim('p'+i)}
 }
 const b=SV.bp.length-bp0;save();bal();
 return {q,b,tl:SV.tl-tl0};
}
function claimAllMsg(r){return r.q+r.b?`${r.q} görev + ${r.b} battle pass ödülü alındı${r.tl>0?' · +'+fmt(r.tl)+' TL':''}`:'Alınacak ödül yok'}
VIEWS.quest=questV;
VIEWWIRE.quest=function(){
 const a=$('av');
 const qa=$('qall');if(qa)qa.onclick=()=>{qAllMsg=claimAllMsg(claimAll());view('quest')};
 a.querySelectorAll('[data-qt]').forEach(b=>b.onclick=()=>{qTab=b.dataset.qt;qAllMsg='';view('quest')});
 a.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{const[k,id]=b.dataset.q.split(':');questClaim(k,id);bal();view('quest')});
};

/* ----- İkinci el pazar ----- */
function mkIcon(id){return iconOf(id,'rifle')}
function marketV(){
 const E=SV.eco,tabs=`<div class='tabs'>${[['buy','Satın al'],['sell','Satış yap'],['mine','İlanlarım']].map(t=>`<button data-mt='${t[0]}' class='${mkTab===t[0]?'on':''}'>${t[1]}${t[0]==='mine'&&E.list.length?` (${E.list.length})`:''}</button>`).join('')}</div>`;
 let body='';
 if(mkTab==='buy'){
  const ls=mkListings().filter(l=>!E.mkBought[l.lid]);
  body=`<p class='note'>Diğer oyuncuların ilanları her gün yenilenir. Taksitle de alabilirsin.</p><div class='grid' style='max-height:none'>${ls.map(l=>{
   const it=itemById(l.item),has=SV.own.includes(l.item),deal=l.price<l.fair?`<span class='up'>%${Math.round((1-l.price/l.fair)*100)} ucuz</span>`:`<span class='dn2'>%${Math.round((l.price/l.fair-1)*100)} pahalı</span>`;
   return `<div class='cell r-${it.r}'><i style='background:#101822'>${mkIcon(l.item)}</i>${it.n}<br><span class='note'>${l.seller}</span><br>${deal}<button data-bl='${l.lid}' ${has?'disabled':''}>${has?'Sende var':tl(l.price)+' · AL'}</button></div>`;
  }).join('')||'<p>Bugünkü ilanlar bitti.</p>'}</div>`;
 }else if(mkTab==='sell'){
  const mine=SV.own.map(itemById).filter(i=>i&&isTradable(i.id));
  body=`<p class='note'>Kuşanılı eşya satılamaz. Satış komisyonu %5. Alıcı bulununca para otomatik hesabına geçer. Adil fiyata yakın ilanlar daha hızlı satılır.</p>
  <div class='grid' style='max-height:none'>${mine.map(i=>`<div class='cell r-${i.r}'><i style='background:#101822'>${mkIcon(i.id)}</i>${i.n}<br><span class='note'>adil: ${tl(i.p)}</span><div class='row' style='margin-top:4px'><input type='number' style='width:70px' data-pr='${i.id}' value='${Math.round(i.p*.9/10)*10}' min='10' step='10'></div><button data-ls='${i.id}'>İLANA KOY</button></div>`).join('')||'<p>Satılabilir eşyan yok.</p>'}</div>`;
 }else{
  body=`<div class='grid' style='max-height:none'>${E.list.map(l=>{const it=itemById(l.item);return `<div class='cell r-${it.r}'><i style='background:#101822'>${mkIcon(l.item)}</i>${it.n}<br>${tl(l.price)}<button data-ul='${l.id}'>İlanı kaldır</button></div>`}).join('')||'<p>Aktif ilanın yok.</p>'}</div>
  <h3 style='margin-top:10px'>Son satışlar</h3>${E.sales.length?`<table class='tbl'>${E.sales.map(s=>`<tr><td>${(itemById(s.item)||{}).n||s.item}</td><td>${s.buyer}</td><td class='up'>+${tl(s.get)}</td></tr>`).join('')}</table>`:'<p>Henüz satış yok.</p>'}`;
 }
 return `<div class='pn2'><h3>İkinci el pazar</h3>${tabs}${body}<p class='ms'>${mkMsg}</p></div>`;
}
VIEWS.market=marketV;
VIEWWIRE.market=function(){
 const a=$('av');
 a.querySelectorAll('[data-mt]').forEach(b=>b.onclick=()=>{mkTab=b.dataset.mt;mkMsg='';view('market')});
 a.querySelectorAll('[data-bl]').forEach(b=>b.onclick=()=>{
  const l=marketBuy(b.dataset.bl);if(typeof l==='string'){mkMsg=l;view('market');return}
  payDialog(l.price,(itemById(l.item)||{}).n||'Eşya',()=>{marketBuyDone(l);mkMsg='Satın alındı';bal();view('market')});
 });
 a.querySelectorAll('[data-ls]').forEach(b=>b.onclick=()=>{const pr=+a.querySelector(`[data-pr='${b.dataset.ls}']`).value;mkMsg=listItem(b.dataset.ls,pr)||'İlana konuldu';bal();view('market')});
 a.querySelectorAll('[data-ul]').forEach(b=>b.onclick=()=>{unlist(+b.dataset.ul);mkMsg='İlan kaldırıldı';view('market')});
};

/* ----- Ayarlar ----- */
const SEL={
 xhStyle:[['cross','Artı'],['dot','Nokta'],['circle','Halka'],['none','Yok']],
 light:[[0,'Düz (en hızlı)'],[1,'Güneş ışığı'],[2,'Güneş ışığı (güçlü)']],
 fog:[[0,'Kapalı'],[1,'Yakın'],[2,'Orta'],[3,'Uzak']],
 fx:[[0,'Düşük (izsiz, az ragdoll)'],[1,'Orta'],[2,'Yüksek']],
 fpsCap:[[0,'Limitsiz'],[30,'30'],[60,'60'],[90,'90'],[120,'120'],[144,'144'],[165,'165'],[240,'240'],[360,'360'],[500,'500']],
 preset:[['ultra','Çok düşük'],['low','Düşük'],['mid','Orta'],['high','Yüksek'],['custom','Özel']]
};
const cRange=(l,k,mn,mx,st,u)=>`<div class='sr2'><span>${l}</span><input type='range' data-k='${k}' min='${mn}' max='${mx}' step='${st}' value='${SET[k]}'><b data-v='${k}'>${SET[k]}${u||''}</b></div>`;
const cCheck=(l,k)=>`<label class='sr2'><span>${l}</span><input type='checkbox' data-k='${k}' ${SET[k]?'checked':''}></label>`;
const cSel=(l,k,o)=>`<div class='sr2'><span>${l}</span><select data-k='${k}'>${o.map(x=>`<option value='${x[0]}' ${String(SET[k])===String(x[0])?'selected':''}>${x[1]}</option>`).join('')}</select></div>`;
const CREDITS=[
 ['ANITKABİR 2','adasamli','https://sketchfab.com/3d-models/anitkabir-2-cfd9c518c550400b9cfd92dbc009663d','Lobi Anıtkabir modeli · CC BY 4.0 · ölçek, yön ve malzeme uyarlandı'],
 ['Turkish Flag - Türk Bayrağı','Veysel Gök','https://sketchfab.com/3d-models/turkish-flag-turk-bayrag-e94fdd812b3a4265ad6b3ca063c52088','Lobi bayrağı · CC BY 4.0 · ölçek ve dalgalanma uyarlandı'],
 ['Soldier Full Tactical Gear','DanlyVostok','https://sketchfab.com/3d-models/soldier-full-tactical-gear-850593a8c7114c188395ba1849a66eb9','Oyuncu / bot karakter modeli'],
 ['10 Genshin Impact Inspired Sword 3D Models','Anime 3D (Anime_CG)','https://sketchfab.com/3d-models/10-genshin-impact-inspired-sword-3d-models-a25cde4706d04e4cb5ea7ff89ceb5dd9','Açık dünya kılıç modelleri'],
 ['Low Poly Knife Collection','BUttERflY_Bee','https://sketchfab.com/3d-models/low-poly-knife-collection-000c0c7c9ee740a28469e3c393ae133d','Bıçak modelleri'],
 ['Low poly Colored Liberator gun pack','blaze71643','https://sketchfab.com/3d-models/low-poly-colored-liberator-gun-pack-7cb8f0f9f3834d4fa071ce9b9070b055','Silah ve yakın dövüş modelleri'],
 ['Hareket animasyonları (koşu, ninja koşusu, yürüyüş, parkur, zıplama)','Kullanıcının sağladığı GLB klipleri (Mixamo / Sketchfab kaynaklı)','https://www.mixamo.com','Karakter hareketlerinin eklem açıları bu kliplerden alınmıştır (lisans bilgisi dosya sahibinde)'],
 ['Jabami Anime Tree v5','Sketchfab (kullanıcı tarafından sağlandı)','https://sketchfab.com/search?q=jabami+anime+tree','Açık dünya ağaçları (lisans bilgisi model sayfasında)'],
 ['Goblin Mob','Alomare','https://sketchfab.com/Alomare','Goblin mobu (CC-BY-NC-4.0)'],
 ['Anime Girl · Black Widow · KB First Gen · Tomb Raider Lara Croft · Zero Suit Samus','Sketchfab sanatçıları (kullanıcı tarafından sağlandı)','https://sketchfab.com','Şampiyon karakterler (lisans bilgisi model sayfalarında)'],
 ['de_dust2 CS Map · CS Death Match Map Minecraft','Sketchfab sanatçıları (kullanıcı tarafından sağlandı)','https://sketchfab.com','5v5 haritaları (lisans bilgisi model sayfalarında)'],
 ['AK74U Free Animation','Sketchfab sanatçısı (kullanıcı tarafından sağlandı)','https://sketchfab.com','Silah modeli kaynağı'],
 ['FPS Military Hands','Electrogamer777','https://sketchfab.com/3d-models/fps-military-hands-b0ffdcca876248edadaf8ec864dff544','Birinci şahıs el ve kol modeli'],
 ['Ammo Boxes [toon - style]','lalit · CC BY 4.0','https://sketchfab.com/3d-models/ammo-boxes-toon-style-bfe1d8b87a8b40e3924547b057fd2c77','Kullanıcının sağladığı mermi kutusu; ölçek ve merkez uyarlandı'],
 ['Medkit','nicholas.cusinato · CC BY 4.0','https://sketchfab.com/3d-models/medkit-2ee84faec92e4046ab8fd35771a2b280','Kullanıcının sağladığı sağlık paketi; ölçek ve merkez uyarlandı'],
 ['John Wick (kullanıcının sağladığı model)','SlimDormouse966 · CC BY 4.0','https://sketchfab.com/3d-models/pulltube-for-mac-download-3d-model-john--wick-3ec303f857044bc5b23c099f8bff13c6','Ölçek, yaklaşık iskelet/ağırlık, sabit aksesuar temizliği ve yüzey sadeleştirme uyarlandı.'],
 ['Laz Torretto (Dominic Toretto modeli)','MEGA_GAMES · CC BY 4.0','https://sketchfab.com/3d-models/dominic-toretto-88a860c2769e45aab5c13251dd903bd3','Oyun içi adı değiştirildi; ölçek, yaklaşık iskelet/ağırlık ve yüzey sadeleştirme uyarlandı.'],
 ['Minecraft Zombie','JoohnElkes · CC BY 4.0','https://sketchfab.com/3d-models/minecraft-zombie-45037ec52b6a4444a0981f916d0dbd43','Kullanıcının sağladığı model; ölçek, yön ve uzuv animasyonu oyuna uyarlandı. Lisans: https://creativecommons.org/licenses/by/4.0/'],
 ['Apex Guns 01','Alex Borisov','https://sketchfab.com/3d-models/apex-guns-01-fea8987bb7e440eab9a26691ee2e0427','P2020, R-301, R-99, Wingman, Mozambique modelleri']
];
function creditsHTML(){
 return `<p class='note'>Aşağıdaki 3B modeller <b>CC BY 4.0</b> lisansıyla paylaşılmıştır (Sketchfab). Oyuna uyarlamak için parçalara ayrıldı, boyutu küçültüldü, yönü ve ölçeği ayarlandı. Three.js kütüphanesi MIT lisanslıdır.</p>
 <div style='display:flex;flex-direction:column;gap:8px;margin-top:8px'>${CREDITS.map(c=>`<div class='sr' style='display:block'><b>${c[0]}</b> · ${c[1]}<br><span class='note'>${c[3]}</span><br><a href='${c[2]}' target='_blank' rel='noopener' style='color:#27e0ff;font-size:12px;word-break:break-all'>${c[2]}</a></div>`).join('')}</div>`;
}
function setV(ig){
 const tabs=ig?[['game','Oyun'],['sens','Hassasiyet'],['xh','Nişangah'],['vid','Video'],['mob','Mobil'],['ctl','Kontroller']]:[['game','Oyun'],['sens','Hassasiyet'],['xh','Nişangah'],['vid','Video'],['mob','Mobil'],['ctl','Kontroller'],['acc','Veri'],['cr','Krediler']];
 if(ig&&!tabs.some(t=>t[0]===setTab))setTab='game';
 let b='';
 if(setTab==='game')b=cRange('Fare hassasiyeti','sens',.00001,Math.max(10,SET.sens),.00001,'x')+cRange('Nişan alırken çarpan','adsSens',.2,1.5,.05,'x')+cRange('Görüş açısı (FOV)','fov',60,120,1,'°')+cRange('Nişan yakınlaştırması (0 = yok, 1 = tam)','adsZoom',0,1,.05,'')+cRange('Ses seviyesi','volume',0,1,.05,'')+cCheck('Y ekseni ters (fare)','invY')+cCheck('Otomatik bhop (Space basılı tut)','autoHop')+cCheck('Kasa açılış animasyonunu atla','skipCrate')+`<hr style='border:0;border-top:1px solid #243242'><h3>Açık dünya</h3>`+cSel('Otomatik savaş hedef seçimi','autoPol',[[0,'Güvenli (kendi seviyem ve altı)'],[1,'Dengeli (+2 seviyeye kadar)'],[2,'Cesur (+5 seviyeye kadar)']])+`<p class='note'>Açık dünyada F: otomatik savaş aç/kapat · M: harita · H: ilk yardım çantası. Açık dünyada ateşli silah yok: bıçak, kılıç ve iki elli kılıçla dövüşürsün. Otomatik savaşta karakter hedef arar, yaklaşıp vurur, canı azalınca kaçıp iyileşir. AFK bırakırken sekmeyi kapatma; arka plana atsan da oyun devam eder.</p>`;
 else if(setTab==='sens')b=sensitivityHTML();
 else if(setTab==='xh')b=`<div class='row' style='align-items:flex-start;gap:16px'><div class='xhp'><div id='xhprev' class='xhs'></div></div><div style='flex:1;min-width:260px'>`+cSel('Nişangah biçimi','xhStyle',SEL.xhStyle)+
  `<div class='sr2'><span>Renk</span><span style='display:flex;gap:6px;align-items:center;flex-wrap:wrap'>${XH.map(x=>{const h='#'+x.c.toString(16).padStart(6,'0');return `<button class='xhsw' data-xh='${h}' title='${x.n}' style='width:22px;height:22px;border-radius:50%;border:2px solid ${(SET.xhColor||'#ffffff').toLowerCase()===h?'#27e0ff':'#243242'};background:${h};cursor:pointer;padding:0'></button>`}).join('')}<input type='color' id='xhcol' value='${SET.xhColor||'#ffffff'}' style='width:36px;height:24px;padding:0;border:1px solid #243242;background:#0b1118;cursor:pointer'></span><button class='chip' id='xhrst'>Varsayılan (beyaz)</button></div>`+
  cRange('Boyut','xhSize',2,30,1,'px')+cRange('Kalınlık','xhThick',1,6,1,'px')+cRange('Merkez boşluğu','xhGap',0,16,1,'px')+cCheck('Orta nokta','xhDot')+cCheck('Siyah kenar çizgisi','xhOutline')+`</div></div>
  <hr style='border:0;border-top:1px solid #243242'><h3>Kırmızı nokta (tüfek ve SMG)</h3>`+cRange('Çerçeve boyutu','opticSize',.3,1.5,.05,'x')+cRange('Nokta boyutu','dotSize',.3,3,.1,'x')+`<p class='note'>Değişiklik silah modeli yenilenince hemen görünür. Nişan alırken (sağ tık) kırmızı nokta kullanılır, normal nişangah silikleşir.</p>`;
 else if(setTab==='vid'){
  const pr=pixelRatio();
  b=cSel('Grafik ön ayarı','preset',SEL.preset)+cRange('Çözünürlük ölçeği','res',25,100,5,'%')+`<p class='note'>Şu an yaklaşık ${Math.round(innerWidth*pr)}×${Math.round(innerHeight*pr)} piksel çiziliyor. FPS kazanmak için en etkili ayar budur: %25-%60 arası zayıf PC'ler için önerilir.</p>`+
  cSel('Işık kalitesi','light',SEL.light)+cCheck('Gölgeler (yavaş PC\'de kapalı tut)','shadow')+cSel('Sis ve çizim mesafesi','fog',SEL.fog)+cSel('Efekt kalitesi','fx',SEL.fx)+
  cSel('FPS sınırı','fpsCap',SEL.fpsCap)+cCheck('FPS göstergesi','fpsShow')+
  `<p class='note'>Doku: modeller şimdilik doku kullanmıyor, renkli yüzeylerle çiziliyor. Silah skin dokuları gelince doku kalitesi ayarı da eklenecek.</p>
  <p class='note'>FPS sınırı "Limitsiz" = yapay sınır yok. V-Sync tarayıcıda otomatik açık ve kapatılamıyor: üst sınır ekranının yenileme hızıdır (örn. 144 Hz ekranda en fazla 144 FPS). Sınır seçince sistem ısınmasını ve fan sesini azaltırsın; Limitsiz'de mümkün olan en yüksek değeri alırsın. Ekranın yenileme hızının üstüne (ör. 300-500 FPS) çıkmak için oyunu klasördeki <b>OYNA-SINIRSIZ-FPS.bat</b> ile aç: Chrome/Edge V-Sync kapalı açılır. EXE sürümünde de bu ayar kapalı gelecek.</p>
  <p class='note'>Zayıf bilgisayar: "Çok düşük" ön ayarını seç. En çok FPS kazandıran ayar çözünürlük ölçeğidir.</p>`;
 }else if(setTab==='mob')b=`<div class='sr2'><span>Cihaz türü</span><span style='display:flex;gap:6px;align-items:center;flex-wrap:wrap'><select id='cihaz'><option value=''${!cihazSecim?' selected':''}>Otomatik (şu an: ${cihazOto?'mobil':'bilgisayar'})</option><option value='pc'${cihazSecim==='pc'?' selected':''}>Bilgisayar (klavye + fare)</option><option value='mobil'${cihazSecim==='mobil'?' selected':''}>Mobil (dokunmatik)</option></select><button class='btn sm' id='cihazok'>Uygula</button></span></div><p class='note'>Şu an <b>${touch?'mobil':'bilgisayar'}</b> arayüzü açık. Uygula sayfayı yeniler (maçtaysan maç biter).</p>`+cRange('Dokunmatik bakış hassasiyeti','touchSens',.4,2.5,.05,'x')+`<div class='row' style='margin-top:10px'><button class='btn alt' id='tle2'>Tuş düzenini değiştir</button></div><p class='note'>Düğmeleri sürükleyip yerleştirir, boyutlarını ayarlarsın. Dokunmatik cihazda en rahat çalışır.</p>`;
 else if(setTab==='ctl')b=typeof kontrollerHTML==='function'?kontrollerHTML():'';
 else if(setTab==='cr')b=creditsHTML();
 else if(setTab==='mk'){
  b=`<p class='note'>İkinci el pazarda hangi eşyaların satılıp alınabileceğini ayarla. Kapalı eşyalar ilanlarda çıkmaz, satılamaz.</p><div class='grid' style='max-height:46vh'>${tradables().map(i=>`<label class='cell r-${i.r}' style='cursor:pointer'><i style='background:#101822'>${iconOf(i.id,'rifle')}</i>${i.n}<br><input type='checkbox' data-tr='${i.id}' ${isTradable(i.id)?'checked':''}> satılabilir</label>`).join('')}</div>`;
 }else b=`<p>Bu tarayıcıdaki kayıtlı verin: para, eşyalar, borç, borsa, görevler. Sıfırlarsan geri gelmez.</p><div class='row'><button class='btn alt' id='rst1'>Tüm verimi sıfırla</button></div><p class='ms' id='rstm'></p>`;
 return `<div class='pn2'><h3>Ayarlar</h3><div class='tabs'>${tabs.map(t=>`<button data-st='${t[0]}' class='${setTab===t[0]?'on':''}'>${t[1]}</button>`).join('')}</div>${b}</div>`;
}
VIEWS.settings=()=>setV(false);
const VIDKEYS=['res','light','shadow','fog','fx','fpsCap','fpsShow','fov'],XHKEYS=['xhStyle','xhSize','xhThick','xhGap','xhDot','xhOutline'],OPKEYS=['opticSize','dotSize'];
VIEWWIRE.settings=()=>wireSettings($('av'),()=>view('settings'));
/* Oyun içi ayarlar (ESC menüsü): aynı panel, duraklatma ekranının içinde */
function igsRender(){const a=$('igs');if(!a)return;a.innerHTML=setV(true);wireSettings(a,igsRender)}
function igsOpen(on){
 const a=$('igs');if(!a)return;
 a.classList.toggle('off',!on);$('ov').classList.toggle('igs',on);
 $('igsb').textContent=on?'AYARLARI KAPAT':'AYARLAR';
 if(on)igsRender();else a.innerHTML='';
}
function wireSettings(a,view){
 const $=id=>a.querySelector('#'+id);
 a.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{setTab=b.dataset.st;view('settings')});
 a.querySelectorAll('[data-k]').forEach(el=>{
  const k=el.dataset.k,isNum=typeof SETDEF[k]==='number',isB=typeof SETDEF[k]==='boolean';
  const ev=el.type==='range'?'input':'change';
  el.addEventListener(ev,()=>{
   let v=isB?el.checked:isNum?+el.value:el.value;
   if(el.tagName==='SELECT'&&isNum)v=+el.value;
   SET[k]=v;
   const lab=a.querySelector(`[data-v='${k}']`);if(lab)lab.textContent=v+(lab.textContent.replace(/[-\d.]/g,''));
   if(k==='preset'){if(v!=='custom')Object.assign(SET,PRESETS[v]);saveSet();applyAll();view('settings');return}
   if(['res','light','shadow','fog','fx'].includes(k)&&SET.preset!=='custom'){SET.preset='custom';const p=a.querySelector("[data-k='preset']");if(p)p.value='custom'}
   if(k==='fpsCap')fpsLast=0;
   saveSet();
   if(VIDKEYS.includes(k)||k==='preset')applyVideo();
   if(XHKEYS.includes(k))applyCrosshair();
   if(OPKEYS.includes(k))rebuildPlayerModels();
   if(k==='xhStyle'||k==='res')view('settings');
  });
 });
 const xc=$('xhcol');if(xc){xc.oninput=()=>{SET.xhColor=xc.value;saveSet();applyCrosshair()};$('xhrst').onclick=()=>{SET.xhColor='';saveSet();applyCrosshair();view('settings')}}
 a.querySelectorAll('.xhsw').forEach(b=>b.onclick=()=>{SET.xhColor=b.dataset.xh;const ci=$('xhcol');if(ci)ci.value=b.dataset.xh;saveSet();applyCrosshair();a.querySelectorAll('.xhsw').forEach(x=>x.style.borderColor=x===b?'#27e0ff':'#243242')});
 wireSensitivity(a);
 const t2=$('tle2');if(t2){t2.onclick=()=>startTouchEdit()}
 const ck=$('cihazok');if(ck)ck.onclick=()=>{const v=$('cihaz').value;try{if(v)localStorage.setItem(CIHAZ_KEY,v);else localStorage.removeItem(CIHAZ_KEY)}catch(e){}const u=new URL(location.href);u.searchParams.delete('cihaz');location.replace(u.toString())};
 if(typeof kontrollerWire==='function')kontrollerWire(a);
 a.querySelectorAll('[data-tr]').forEach(c=>c.onchange=()=>{SV.eco.tr[c.dataset.tr]=c.checked;save()});
 const r1=$('rst1');if(r1)r1.onclick=()=>{
  r1.textContent='Emin misin? Tekrar bas';r1.onclick=()=>{try{localStorage.removeItem('mmofps_sv');localStorage.removeItem('mmofps_best')}catch(e){}location.reload()};
 };
 applyCrosshair();
};

VIEWS.owc=owcV;VIEWWIRE.owc=owcWire;
