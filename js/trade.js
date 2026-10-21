'use strict';
/* ===== Trade (Berkan 2026-10-21): borsa yerine TradingSim — BTC / EURO / ALTIN.
   Kaynak: Berkan'ın trading-sim.html'i (TradingSim çekirdek + CandleView). Uyarlamalar:
   - Bakiye oyunun parası: SV.tl (alım çöker, satım yatırır, save() ile kalıcı).
   - Pozisyonlar, açık limit emirleri, fiyatlar ve mum geçmişi SV.trade'de saklanır; oyuna dönünce kaldığı yerden sürer.
   - Eski borsa coinleri (SV.eco.coins) ilk açılışta mevcut fiyattan TL'ye çevrilir (tek seferlik göç).
   - Grafik yalnızca trade ekranı açıkken işler; sekme değişince durur. */
const TR_TPC=10,TR_TICK=250,TR_FEE=.0005,TR_MAXC=160,TR_CATCHUP=400;
const TR_SYMS=[
 {s:'BTC',n:'Bitcoin',p:250000,vol:.02,col:'#f7931a'},
 {s:'EUR',n:'Euro',p:38,vol:.003,col:'#4c8dff'},
 {s:'XAU',n:'Altın (gram)',p:3250,vol:.006,col:'#ffd24a'}
];
let TR=null; /* çalışma zamanı: grafik + arayüz durumu (SV.trade kalıcı kısım) */

function trNewSym(c){
 return {s:c.s,price:c.p,open:c.p,vol:c.vol,vf:1,drift:0,shock:0,candles:[],cur:null};
}
function ensureTrade(){
 const d={pos:{},orders:[],id:0,n:0,lastT:0,S:{},mig:0};
 SV.trade=Object.assign(d,SV.trade||{});
 for(const c of TR_SYMS){
  if(!SV.trade.S[c.s]||!(SV.trade.S[c.s].price>0)){
   const y=trNewSym(c);
   for(let i=0;i<90*TR_TPC;i++)trStep(y);
   y.open=y.candles.length?y.candles[0].o:y.price;
   SV.trade.S[c.s]=y;
  }
  if(!SV.trade.pos[c.s]||!(SV.trade.pos[c.s].qty>=0))SV.trade.pos[c.s]={qty:0,avg:0};
 }
 /* göç: eski borsa coinleri → TL (bir kez) */
 if(!SV.trade.mig&&SV.eco&&SV.eco.coins){
  let got=0;
  for(const c of COINS){const h=SV.eco.coins[c.id];if(h&&h.q>0)got+=h.q*coinPrice(c)}
  SV.trade.mig=1;
  if(got>=1){SV.tl+=Math.floor(got*.99);SV.eco.coins={};SV.trade.note='Eski borsa bakiyen '+fmt(Math.floor(got*.99))+' TL olarak hesabına geçti'}
  else SV.eco.coins={};
 }
}

/* ----- fiyat motoru (trading-sim.html'den birebir) ----- */
function trStep(y){
 const g=()=>{let u=0;for(let i=0;i<4;i++)u+=Math.random();return(u-2)*1.73};
 y.vf=.97*y.vf+.03*(1+Math.abs(g()));
 const prev=y.price;
 y.price=prev*Math.exp(g()*y.vol*.18*y.vf+y.drift+y.shock);
 y.shock*=.8;y.drift*=.995;
 const c=y.cur||(y.cur={o:prev,h:prev,l:prev,c:prev,k:0});
 c.h=Math.max(c.h,y.price);c.l=Math.min(c.l,y.price);c.c=y.price;
 if(++c.k>=TR_TPC){y.candles.push(c);if(y.candles.length>TR_MAXC)y.candles.shift();y.cur=null;return c}
}
function trTick(){
 SV.trade.n++;
 for(const c of TR_SYMS)trStep(SV.trade.S[c.s]);
 /* haber şoku: seyrek, küçük ve geçici */
 if(Math.random()<TR_TICK/60000){
  const c=TR_SYMS[Math.floor(Math.random()*TR_SYMS.length)],y=SV.trade.S[c.s],up=Math.random()>.5;
  y.shock+=(up?1:-1)*y.vol*.25;
  trLog('<span class="mu">Haber:</span> '+c.n+' — '+(up?'olumlu':'olumsuz')+' haber');
 }
 SV.trade.orders=SV.trade.orders.filter(o=>{
  const p=SV.trade.S[o.symbol].price;
  if(o.side==='buy'?p<=o.price:p>=o.price){trExec(o.side,o.symbol,o.qty,p);trLog((o.side==='buy'?'Limit alış':'Limit satış')+' gerçekleşti: '+trFmtQty(o.qty)+' '+o.symbol+' @ '+trFmtPx(p));return false}
  return true;
 });
 SV.trade.lastT=Date.now();
}
function trExec(side,sym,qty,px){
 const p=SV.trade.pos[sym],v=qty*px,fee=v*TR_FEE;
 if(side==='buy'){
  if(v+fee>SV.tl+1e-9)return{ok:false,reason:'Yetersiz bakiye'};
  SV.tl-=v+fee;p.avg=(p.avg*p.qty+v)/(p.qty+qty);p.qty+=qty;
 }else{
  if(qty>p.qty+1e-9)return{ok:false,reason:'Yetersiz pozisyon'};
  SV.tl+=v-fee;p.qty=Math.max(0,p.qty-qty);if(p.qty<1e-9)p.qty=p.avg=0;
 }
 save();if(typeof bal==='function')bal();
 return{ok:true};
}
function trPlace(o){
 const y=SV.trade.S[o.symbol];
 if(!y||!(o.qty>0))return{ok:false,reason:'Geçersiz emir'};
 if(o.type==='limit'&&!((o.side==='buy'?o.price>=y.price:o.price<=y.price)&&o.price>0)){
  SV.trade.orders.push({id:++SV.trade.id,symbol:o.symbol,side:o.side,qty:o.qty,price:o.price});
  save();return{ok:true,pending:true};
 }
 const r=trExec(o.side,o.symbol,o.qty,y.price*(1+(o.side==='buy'?.0002:-.0002)));
 if(r.ok)trLog((o.side==='buy'?'AL':'SAT')+' '+trFmtQty(o.qty)+' '+o.symbol+' @ '+trFmtPx(y.price));
 return r;
}
function trEquity(){let v=SV.tl;for(const c of TR_SYMS){const p=SV.trade.pos[c.s];if(p&&p.qty>0)v+=p.qty*SV.trade.S[c.s].price}return v}
function trFmtPx(p){return p>=100?p.toLocaleString('tr-TR',{maximumFractionDigits:2}):p.toFixed(4)}
function trFmtQty(q){return +q.toPrecision(5)}

/* ----- mum grafiği (trading-sim.html CandleView, oyunun THREE r128'iyle) ----- */
function trChart(){
 if(TR.cv)return;
 const el=$('trchart');if(!el||typeof THREE==='undefined')return;
 const cv=TR.cv={el,n:60,lo:0,hi:1,snap:true};
 const r=cv.r=new THREE.WebGLRenderer({antialias:true,alpha:true});
 r.setPixelRatio(Math.min(devicePixelRatio||1,2));el.appendChild(r.domElement);
 cv.sc=new THREE.Scene();
 cv.cam=new THREE.OrthographicCamera(-1,cv.n,1,0,-10,10);
 const inst=()=>{const m=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial(),cv.n+1);
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;cv.sc.add(m);return m};
 cv.wick=inst();cv.body=inst();
 const bar=(c,o)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o}));cv.sc.add(m);return m};
 cv.grid=[1,2,3,4].map(()=>bar(0x8896a8,.13));cv.line=bar(0x4c8dff,.6);
 cv.labels=[1,2,3,4].map(()=>{const d=document.createElement('div');d.style.cssText='position:absolute;right:6px;font-size:11px;color:#7d8a9b;transform:translateY(-50%);pointer-events:none';el.appendChild(d);return d});
 cv.tag=document.createElement('div');cv.tag.style.cssText='position:absolute;right:0;transform:translateY(-50%);background:#4c8dff;color:#fff;font-size:11px;padding:1px 6px;border-radius:3px 0 0 3px;pointer-events:none';el.appendChild(cv.tag);
 cv.d=new THREE.Object3D();cv.up=new THREE.Color(0x2ebd85);cv.dn=new THREE.Color(0xf6465d);
 cv.resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(w&&h)r.setSize(w,h,false)};
 new ResizeObserver(()=>cv.resize()).observe(el);cv.resize();
}
function trChartFree(){
 if(!TR.cv)return;
 try{TR.cv.r.dispose()}catch(e){}
 const el=$('trchart');if(el)el.innerHTML='';
 TR.cv=null;
}
function trDraw(){
 const cv=TR.cv;if(!cv)return;
 const y=SV.trade.S[TR.cur];if(!y)return;
 const a=y.candles.slice(-(cv.n-(y.cur?1:0)));if(y.cur)a.push(y.cur);
 let mn=1e99,mx=-1e99;for(const c of a){mn=Math.min(mn,c.l);mx=Math.max(mx,c.h)}
 const pad=(mx-mn)*.12||mx*.001,tl=mn-pad,th=mx+pad;
 if(cv.snap){cv.lo=tl;cv.hi=th;cv.snap=false}
 else{cv.lo+=(tl-cv.lo)*.12;cv.hi+=(th-cv.hi)*.12}
 const{lo,hi,n,d}=cv,rg=hi-lo,off=n-a.length;
 Object.assign(cv.cam,{bottom:lo,top:hi});cv.cam.updateProjectionMatrix();
 cv.r.setSize(cv.el.clientWidth,cv.el.clientHeight,false);
 for(let i=0;i<=n;i++){
  const c=a[i];
  if(!c){d.scale.set(0,0,0);d.updateMatrix();cv.wick.setMatrixAt(i,d.matrix);cv.body.setMatrixAt(i,d.matrix);continue}
  const col=c.c>=c.o?cv.up:cv.dn,x=i+off;
  d.position.set(x,(c.h+c.l)/2,0);d.scale.set(.1,Math.max(c.h-c.l,rg*.003),1);d.updateMatrix();
  cv.wick.setMatrixAt(i,d.matrix);cv.wick.setColorAt(i,col);
  d.position.set(x,(c.o+c.c)/2,.1);d.scale.set(.7,Math.max(Math.abs(c.c-c.o),rg*.004),1);d.updateMatrix();
  cv.body.setMatrixAt(i,d.matrix);cv.body.setColorAt(i,col);
 }
 for(const m of[cv.wick,cv.body]){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}
 cv.grid.forEach((g,k)=>{const p=lo+rg*(k+1)/5;g.position.set((n-1)/2,p,-1);g.scale.set(n+1,rg*.0015,1);
  cv.labels[k].style.top=(1-(k+1)/5)*100+'%';cv.labels[k].textContent=trFmtPx(p)});
 cv.line.position.set((n-1)/2,y.price,.2);cv.line.scale.set(n+1,rg*.0025,1);
 cv.tag.style.top=Math.min(98,Math.max(2,(hi-y.price)/rg*100))+'%';cv.tag.textContent=trFmtPx(y.price);
 cv.r.render(cv.sc,cv.cam);
}

/* ----- arayüz ----- */
function trLog(t){if(!TR)return;TR.logs.unshift(t);TR.logs=TR.logs.slice(0,8);const el=$('trlog');if(el)el.innerHTML=TR.logs.map(l=>'<div>'+l+'</div>').join('')}
function tradeV(){
 if(!SV.trade&&typeof ensureTrade==='function')ensureTrade();
 TR=TR||{cur:'BTC',type:'market',logs:[],msg:''};
 const tabs=TR_SYMS.map(c=>`<button class='chip${c.s===TR.cur?' on':''}' data-ts='${c.s}' style='${c.s===TR.cur?'border-color:'+c.col+';color:'+c.col:''}'>${c.s}</button>`).join('');
 return `<div class='pn2'><h3>Trade <small style='color:#7d8a9b;font-weight:400'>BTC · EURO · ALTIN — canlı fiyat, piyasa ve limit emir</small></h3>
 ${SV.trade.note?`<p class='ms' style='color:#7dff9a'>${SV.trade.note}</p>`:''}
 <div class='row' style='flex-wrap:wrap;gap:6px'><span id='trtabs'>${tabs}</span><b id='trpx' style='font-size:20px'></b><span id='trchg'></span><span class='sp' style='flex:1'></span>
 <span class='note'>Toplam değer <b id='treq'></b> · Nakit <b id='trcash'></b></span></div>
 <div id='trchart' style='position:relative;height:280px;border:1px solid #243242;border-radius:6px;overflow:hidden;margin:6px 0'></div>
 <div class='dr'>
  <div class='pn2'>
   <div class='row' style='gap:6px;margin-bottom:6px'><button class='chip${TR.type==='market'?' on':''}' data-tt='market'>Piyasa</button><button class='chip${TR.type==='limit'?' on':''}' data-tt='limit'>Limit</button></div>
   <div class='row' id='trlimrow' style='display:${TR.type==='limit'?'flex':'none'};margin-bottom:6px'><input type='number' id='trlim' step='any' placeholder='Limit fiyatı' style='width:100%'></div>
   <div class='row' style='margin-bottom:6px'><input type='number' id='trqty' step='any' min='0' value='0.001' style='width:100%'></div>
   <div class='row' style='gap:6px;margin-bottom:6px'><button class='chip' data-tp='.25'>%25</button><button class='chip' data-tp='.5'>%50</button><button class='chip' data-tp='1'>Tümü</button><span class='note' style='margin-left:auto'>Tahmini tutar <b id='trcost'></b></span></div>
   <div class='row' style='gap:8px'><button class='btn sm' id='trbuy' style='background:#1d7a52;flex:1'>AL</button><button class='btn sm' id='trsell' style='background:#a03040;flex:1'>SAT</button></div>
   <p class='ms' id='trmsg' style='min-height:16px;margin-top:4px'>${TR.msg||''}</p>
  </div>
  <div class='pn2'>
   <div class='sr'><span>Pozisyonlar</span></div><div id='trpos'></div>
   <div class='sr' style='margin-top:8px'><span>İşlem günlüğü</span></div><div id='trlog' class='note'></div>
  </div>
 </div></div>`;
}
VIEWS.trade=tradeV;
function trUI(){
 if(!TR)return;
 const y=SV.trade.S[TR.cur],ch=(y.price/y.open-1)*100;
 const px=$('trpx'),chg=$('trchg');
 if(px){px.textContent=trFmtPx(y.price)+' TL';px.style.color=ch>=0?'#7dff9a':'#ff6b6b'}
 if(chg){chg.textContent=(ch>=0?'+':'')+ch.toFixed(2)+'%';chg.style.color=ch>=0?'#7dff9a':'#ff6b6b'}
 const eq=$('treq'),cs=$('trcash');
 if(eq)eq.textContent=fmt(Math.round(trEquity()))+' TL';
 if(cs)cs.textContent=fmt(Math.floor(SV.tl))+' TL';
 const qtyEl=$('trqty'),limEl=$('trlim'),cost=$('trcost');
 if(qtyEl&&cost){const q=+qtyEl.value||0,p=TR.type==='limit'?(+limEl.value||y.price):y.price;cost.textContent=fmt(Math.round(q*p))+' TL'}
 const posEl=$('trpos');
 if(posEl){
  const rows=TR_SYMS.map(c=>{const p=SV.trade.pos[c.s];if(!p||p.qty<=0)return'';
   const v=(SV.trade.S[c.s].price-p.avg)*p.qty;
   return `<tr><td style='color:${c.col}'>${c.s}</td><td>${trFmtQty(p.qty)}</td><td>${trFmtPx(p.avg)}</td><td class='${v>=0?'up':'dn2'}'>${v>=0?'+':''}${fmt(Math.round(v))} TL</td></tr>`}).join('');
  posEl.innerHTML=rows?`<table class='tbl'><tr class='note'><td>Sembol</td><td>Miktar</td><td>Ort.</td><td>K/Z</td></tr>${rows}</table>`:'<span class="note">Açık pozisyon yok.</span>';
  const od=SV.trade.orders;
  if(od.length)posEl.innerHTML+=`<p class='note' style='margin-top:4px'>Bekleyen limit: ${od.map(o=>(o.side==='buy'?'al':'sat')+' '+trFmtQty(o.qty)+' '+o.symbol+' @ '+trFmtPx(o.price)).join(' · ')}</p>`;
 }
}
VIEWWIRE.trade=function(){
 const a=$('av');
 a.querySelectorAll('[data-ts]').forEach(b=>b.onclick=()=>{TR.cur=b.dataset.ts;if(TR.cv)TR.cv.snap=true;
  a.querySelectorAll('[data-ts]').forEach(x=>{x.classList.toggle('on',x===b);x.style.borderColor=x===b?'':'';x.style.color=x===b?'':''});
  const c=TR_SYMS.find(s=>s.s===TR.cur);b.style.borderColor=c.col;b.style.color=c.col;
  const lim=$('trlim');if(lim)lim.value=SV.trade.S[TR.cur].price.toFixed(2);TR.msg='';trUI();trDraw()});
 a.querySelectorAll('[data-tt]').forEach(b=>b.onclick=()=>{TR.type=b.dataset.tt;
  a.querySelectorAll('[data-tt]').forEach(x=>x.classList.toggle('on',x===b));
  $('trlimrow').style.display=TR.type==='limit'?'flex':'none';trUI()});
 a.querySelectorAll('[data-tp]').forEach(b=>b.onclick=()=>{
  const y=SV.trade.S[TR.cur],p=SV.trade.pos[TR.cur],f=+b.dataset.tp;
  $('trqty').value=trFmtQty((p.qty>0?p.qty:SV.tl/y.price/(1+TR_FEE))*f);trUI()});
 $('trbuy').onclick=()=>trDo('buy');
 $('trsell').onclick=()=>trDo('sell');
 const lim=$('trlim');if(lim)lim.value=SV.trade.S[TR.cur].price.toFixed(2);
 const q=$('trqty');if(q)q.oninput=trUI;
 trLog('');trUI();trOpen();
};
function trDo(side){
 const qty=+$('trqty').value||0,price=+$('trlim').value||0;
 const r=trPlace({symbol:TR.cur,side,qty,type:TR.type,price});
 TR.msg=r.ok?(r.pending?'Limit emri beklemede':(side==='buy'?'Alındı':'Satıldı')):r.reason;
 const m=$('trmsg');if(m){m.textContent=TR.msg;m.style.color=r.ok?'#7d8a9b':'#ff6b6b'}
 trUI();
}
/* döngü: yalnızca trade ekranı açıkken işler; ayrılınca kendini durdurur */
function trOpen(){
 ensureTrade();
 const miss=Math.min(TR_CATCHUP,Math.max(0,Math.floor((Date.now()-(SV.trade.lastT||0))/TR_TICK)));
 for(let i=0;i<miss;i++)trTick();
 trChart();if(TR.cv)TR.cv.snap=true;
 clearInterval(TR.iv);
 TR.iv=setInterval(()=>{
  if(typeof curView==='undefined'||curView!=='trade'||(typeof state!=='undefined'&&state==='play')){trStop();return}
  trTick();trUI();trDraw();
 },TR_TICK);
}
function trStop(){
 if(!TR)return;
 clearInterval(TR.iv);TR.iv=0;
 try{save()}catch(e){}
}
