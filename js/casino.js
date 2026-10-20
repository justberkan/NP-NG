'use strict';
/* ===== Kumarhane: slot, blackjack, rulet, Aviator (oyun içi para, gerçek para değil) ===== */
let cgGame='dede',cgBet=50,cgTimers=[],cgRaf=0,cgBusy=false;
const cgSet=(fn,ms)=>{const t=setTimeout(fn,ms);cgTimers.push(t);return t};
function casinoStop(){dedeHide();if(typeof lbjLeave==='function')lbjLeave();cgTimers.forEach(clearTimeout);cgTimers=[];cancelAnimationFrame(cgRaf);cgRaf=0;cgBusy=false;if(cgCrash.on&&cgCrash.phase==='fly'){/* uçuş sırasında çıkılırsa bahis yanar */cgCrash.on=false;cgCrash.phase='idle'}}
const cgMsg=(t,cls)=>{const e=$('cgm');if(e){e.textContent=t;e.className='cgm '+(cls||'')}};
function cgBetHTML(){
 return `<div class='row'><label class='note'>Bahis (TL)</label><input type='number' id='bet' value='${cgBet}' min='10' step='10'>${[10,50,100,500,1000].map(v=>`<button class='chip' data-b='${v}'>${v}</button>`).join('')}<button class='chip' data-b='max'>Hepsi</button></div>`;
}
function cgWireBet(){
 document.querySelectorAll('#cg [data-b]').forEach(b=>b.onclick=()=>{const v=b.dataset.b==='max'?Math.floor(SV.tl):+b.dataset.b;$('bet').value=v;cgBet=v});
 $('bet').oninput=()=>{cgBet=+$('bet').value||0};
}
function cgTakeBet(){
 const b=Math.floor(+$('bet').value||0);
 if(b<10){cgMsg('En az 10 TL bahis','lose');return 0}
 if(b>SV.tl){cgMsg('Bakiyen yetmiyor','lose');return 0}
 cgBet=b;SV.tl-=b;casLog(b,0);save();bal();return b;
}
function cgPay(n){if(n>0){SV.tl+=Math.floor(n);casLog(0,Math.floor(n));save();bal()}}

/* ---------- Slot ---------- */
const SLOT=[['🍒',.30,6],['🍋',.25,8],['🔔',.20,14],['⭐',.15,28],['7️⃣',.07,70],['💎',.03,140]];
function slotPick(){let r=Math.random(),a=0;for(const s of SLOT){a+=s[1];if(r<a)return s}return SLOT[0]}
function slotHTML(){
 return `<div class='pn2'><h3>Süper Slot</h3><div class='reels'>${[0,1,2].map(i=>`<div class='reel' id='rl${i}'>🍒</div>`).join('')}</div>
 ${cgBetHTML()}<div class='row' style='margin-top:8px'><button class='btn sm' id='spin'>ÇEVİR</button></div><p class='cgm' id='cgm'>Üçü aynı gelirse bahsin 6x ile 140x arası katlanır. İki aynı sembol bahsin %80'ini geri verir.</p>
 <p class='note'>🍒6x 🍋8x 🔔14x ⭐28x 7️⃣70x 💎140x</p></div>`;
}
function slotWire(){
 cgWireBet();
 $('spin').onclick=()=>{
  if(cgBusy)return;const bet=cgTakeBet();if(!bet)return;
  cgBusy=true;$('spin').disabled=true;cgMsg('Dönüyor...');
  const res=[slotPick(),slotPick(),slotPick()],iv=[];
  for(let i=0;i<3;i++){
   const el=$('rl'+i);el.classList.add('spin');
   iv[i]=setInterval(()=>{el.textContent=SLOT[Math.floor(Math.random()*SLOT.length)][0]},60);
   cgTimers.push(iv[i]);
   cgSet(()=>{clearInterval(iv[i]);el.classList.remove('spin');el.textContent=res[i][0];snd(300+i*120,.08,.05);
    if(i===2)slotEnd(res,bet)},900+i*600);
  }
 };
}
function slotEnd(res,bet){
 let win=0,txt='';
 if(res[0][0]===res[1][0]&&res[1][0]===res[2][0]){win=bet*res[0][2];txt=`ÜÇLÜ! ${res[0][0]} x${res[0][2]} · +${fmt(win)} TL`}
 else if(res[0][0]===res[1][0]||res[1][0]===res[2][0]||res[0][0]===res[2][0]){win=Math.floor(bet*.8);txt=`İkili: ${fmt(win)} TL geri`}
 else txt='Kaybettin. -'+fmt(bet)+' TL';
 cgPay(win);cgBusy=false;const b=$('spin');if(b)b.disabled=false;
 cgMsg(txt,win>bet?'win':'lose');
 if(win>bet)snd(900,.3,.06);
}

/* ---------- Blackjack ---------- */
const BJ={deck:[],p:[],d:[],bet:0,phase:'idle'};
const SUITS=['♠','♥','♦','♣'],RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
function bjShuffle(){BJ.deck=[];for(const s of SUITS)for(const r of RANKS)BJ.deck.push({r,s});for(let i=BJ.deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[BJ.deck[i],BJ.deck[j]]=[BJ.deck[j],BJ.deck[i]]}}
function bjVal(h){let t=0,a=0;for(const c of h){if(c.r==='A'){a++;t+=11}else t+=('JQK'.includes(c.r)?10:+c.r)}while(t>21&&a>0){t-=10;a--}return t}
const bjCard=(c,hide)=>hide?`<span class='card-c bk dealt'>?</span>`:`<span class='card-c dealt ${c.s==='♥'||c.s==='♦'?'red':''}'>${c.r}${c.s}</span>`;
function bjRender(){
 const hide=BJ.phase==='play';
 $('bjd').innerHTML=BJ.d.map((c,i)=>bjCard(c,hide&&i===1)).join('')+(BJ.d.length?` <b>${hide?bjVal([BJ.d[0]]):bjVal(BJ.d)}</b>`:'');
 $('bjp').innerHTML=BJ.p.map(c=>bjCard(c)).join('')+(BJ.p.length?` <b>${bjVal(BJ.p)}</b>`:'');
 $('bjh').disabled=$('bjs').disabled=BJ.phase!=='play';
 $('bjx').disabled=BJ.phase!=='play'||BJ.p.length!==2||SV.tl<BJ.bet;
 $('bjn').disabled=BJ.phase==='play';
}
function bjHTML(){
 return `<div class='pn2'><h3>Blackjack</h3><p class='note'>Krupiye 17'de durur. Blackjack 3:2 öder.</p>
 <div class='bjt'><div class='note'>Krupiye</div><div id='bjd' class='bjr'></div><div class='note' style='margin-top:10px'>Sen</div><div id='bjp' class='bjr'></div></div>
 ${cgBetHTML()}<div class='row' style='margin-top:8px'><button class='btn sm' id='bjn'>YENİ EL</button><button class='btn alt sm' id='bjh'>Kart çek</button><button class='btn alt sm' id='bjs'>Dur</button><button class='btn alt sm' id='bjx'>İkiye katla</button></div><p class='cgm' id='cgm'>Bahsini ayarla ve yeni el başlat.</p></div>`;
}
function bjWire(){
 cgWireBet();
 $('bjn').onclick=()=>{
  const bet=cgTakeBet();if(!bet)return;
  bjShuffle();BJ.p=[];BJ.d=[];BJ.bet=bet;BJ.phase='deal';bjRender();cgMsg('Dağıtılıyor...');
  const seq=[['p'],['d'],['p'],['d']];
  seq.forEach((s,i)=>cgSet(()=>{BJ[s[0]].push(BJ.deck.pop());snd(400,.04,.04);bjRender();if(i===3)bjStart()},350*(i+1)));
 };
 $('bjh').onclick=()=>{BJ.p.push(BJ.deck.pop());snd(420,.04,.04);if(bjVal(BJ.p)>21)bjEnd('bust');else if(bjVal(BJ.p)===21)bjStand();else bjRender()};
 $('bjs').onclick=bjStand;
 $('bjx').onclick=()=>{if(SV.tl<BJ.bet)return;SV.tl-=BJ.bet;BJ.bet*=2;save();bal();BJ.p.push(BJ.deck.pop());if(bjVal(BJ.p)>21)bjEnd('bust');else bjStand()};
 bjRender();
}
function bjStart(){
 BJ.phase='play';
 const pv=bjVal(BJ.p),dv=bjVal(BJ.d);
 if(pv===21||dv===21){BJ.phase='end';bjRender();bjEnd(pv===21&&dv===21?'push':pv===21?'bj':'dealer')}
 else{cgMsg('Sıra sende.');bjRender()}
}
function bjStand(){
 BJ.phase='dealer';bjRender();
 const step=()=>{
  if(bjVal(BJ.d)<17){BJ.d.push(BJ.deck.pop());snd(380,.04,.04);bjRender();cgSet(step,600)}
  else{const pv=bjVal(BJ.p),dv=bjVal(BJ.d);bjEnd(dv>21||pv>dv?'win':pv===dv?'push':'dealer')}
 };
 cgSet(step,500);
}
function bjEnd(r){
 BJ.phase='end';bjRender();
 let pay=0,txt='',cls='lose';
 if(r==='bj'){pay=BJ.bet*2.5;txt='BLACKJACK! +'+fmt(BJ.bet*1.5)+' TL';cls='win'}
 else if(r==='win'){pay=BJ.bet*2;txt='Kazandın! +'+fmt(BJ.bet)+' TL';cls='win'}
 else if(r==='push'){pay=BJ.bet;txt='Berabere, bahis iade'}
 else if(r==='bust'){txt='Battın ('+bjVal(BJ.p)+'). -'+fmt(BJ.bet)+' TL'}
 else txt='Krupiye kazandı. -'+fmt(BJ.bet)+' TL';
 cgPay(pay);cgMsg(txt,cls);bjRender();
}

/* ---------- Rulet ---------- */
const WHEEL=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const REDS=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const rColor=n=>n===0?'#1f9d4c':REDS.includes(n)?'#c0261d':'#15181c';
const RBETS=[['red','Kırmızı','2x'],['blk','Siyah','2x'],['odd','Tek','2x'],['even','Çift','2x'],['lo','1-18','2x'],['hi','19-36','2x'],['d1','1. düzine','3x'],['d2','2. düzine','3x'],['d3','3. düzine','3x'],['num','Tek sayı','36x']];
let rBet='red',rRot=0,rHist=[];
function rWins(t,n,pick){
 if(n===0)return t==='num'&&pick===0;
 switch(t){case 'red':return REDS.includes(n);case 'blk':return !REDS.includes(n);case 'odd':return n%2===1;case 'even':return n%2===0;case 'lo':return n<=18;case 'hi':return n>=19;
  case 'd1':return n<=12;case 'd2':return n>12&&n<=24;case 'd3':return n>24;case 'num':return n===pick}
 return false;
}
const rMult=t=>t==='num'?36:t[0]==='d'?3:2;
function rDraw(ball){
 const c=$('rcv');if(!c)return;const x=c.getContext('2d'),W=c.width,H=c.height,cx=W/2,cy=H/2+8,R=Math.min(W,H)/2-14;
 x.clearRect(0,0,W,H);
 const sl=Math.PI*2/37;
 for(let i=0;i<37;i++){
  const a0=rRot+i*sl,n=WHEEL[i];
  x.beginPath();x.moveTo(cx,cy);x.arc(cx,cy,R,a0,a0+sl);x.closePath();x.fillStyle=rColor(n);x.fill();x.strokeStyle='#d8c27a';x.lineWidth=1;x.stroke();
  x.save();x.translate(cx,cy);x.rotate(a0+sl/2);x.fillStyle='#fff';x.font='bold 11px system-ui';x.textAlign='center';x.fillText(n,R-16,4);x.restore();
 }
 x.beginPath();x.arc(cx,cy,R*.55,0,7);x.fillStyle='#1b1410';x.fill();x.strokeStyle='#d8c27a';x.stroke();
 x.beginPath();x.arc(cx,cy,R*.12,0,7);x.fillStyle='#d8c27a';x.fill();
 /* işaretçi */
 x.beginPath();x.moveTo(cx-8,cy-R-12);x.lineTo(cx+8,cy-R-12);x.lineTo(cx,cy-R+6);x.closePath();x.fillStyle='#ffb020';x.fill();
 if(ball!=null){const br=R*.8+Math.sin(ball.drop)*0;x.beginPath();x.arc(cx+Math.cos(ball.a)*ball.r*R,cy+Math.sin(ball.a)*ball.r*R,6,0,7);x.fillStyle='#fff';x.fill();x.strokeStyle='#999';x.stroke()}
}
function rHTML(){
 return `<div class='pn2'><h3>Rulet</h3><div class='cas'><canvas id='rcv' width='360' height='330' style='max-width:330px'></canvas></div>
 <div class='tabs' style='margin-top:8px'>${RBETS.map(b=>`<button data-r='${b[0]}' class='${rBet===b[0]?'on':''}'>${b[1]} <small>${b[2]}</small></button>`).join('')}</div>
 <div class='row'><label class='note'>Sayı (0-36)</label><input type='number' id='rnum' min='0' max='36' value='7'></div>
 ${cgBetHTML()}<div class='row' style='margin-top:8px'><button class='btn sm' id='rspin'>ÇEVİR</button></div><p class='cgm' id='cgm'>Avrupa ruleti: tek sıfır.</p>
 <div id='rh' class='row'>${rHist.map(n=>`<span class='rn' style='background:${rColor(n)}'>${n}</span>`).join('')}</div></div>`;
}
function rWire(){
 cgWireBet();rDraw(null);
 document.querySelectorAll('#cg [data-r]').forEach(b=>b.onclick=()=>{rBet=b.dataset.r;document.querySelectorAll('#cg [data-r]').forEach(z=>z.classList.toggle('on',z===b))});
 $('rspin').onclick=()=>{
  if(cgBusy)return;
  const pick=Math.max(0,Math.min(36,Math.floor(+$('rnum').value||0)));
  const bet=cgTakeBet();if(!bet)return;
  cgBusy=true;$('rspin').disabled=true;cgMsg('Top dönüyor...');
  const idx=Math.floor(Math.random()*37),n=WHEEL[idx],sl=Math.PI*2/37;
  const rot0=rRot,fin=-Math.PI/2-(idx+.5)*sl;
  let target=fin;while(target<rot0+Math.PI*8)target+=Math.PI*2;
  const T=4200,t0=performance.now();
  const frame=now=>{
   const u=Math.min(1,(now-t0)/T),e=1-Math.pow(1-u,3);
   rRot=rot0+(target-rot0)*e;
   const ball={a:-Math.PI/2-(1-e)*Math.PI*10,r:.8-.08*e};
   rDraw(ball);
   if(u<1)cgRaf=requestAnimationFrame(frame);
   else{
    rRot=target%(Math.PI*2);rDraw({a:-Math.PI/2,r:.72});
    const w=rWins(rBet,n,pick);let pay=0;
    if(w)pay=bet*rMult(rBet);
    cgPay(pay);rHist.unshift(n);rHist=rHist.slice(0,12);cgBusy=false;
    const b=$('rspin');if(b)b.disabled=false;
    cgMsg(`Gelen: ${n} (${n===0?'yeşil':REDS.includes(n)?'kırmızı':'siyah'}). `+(w?`Kazandın! +${fmt(pay-bet)} TL`:`Kaybettin. -${fmt(bet)} TL`),w?'win':'lose');
    const h=$('rh');if(h)h.innerHTML=rHist.map(v=>`<span class='rn' style='background:${rColor(v)}'>${v}</span>`).join('');
    if(w)snd(900,.3,.06);
   }
  };
  cgRaf=requestAnimationFrame(frame);
 };
}

/* ---------- Aviator (crash) ---------- */
const cgCrash={on:false,phase:'idle',bet:0,t:0,cp:2,m:1,hist:[],auto:0,t0:0};
const CRATE=.13;
function crashPoint(){const r=Math.random();return Math.min(300,Math.max(1,Math.floor(100*.96/(1-r))/100))}
function crashDraw(){
 const c=$('acv');if(!c)return;const x=c.getContext('2d'),W=c.width,H=c.height,P=cgCrash;
 const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1a0f1c');g.addColorStop(1,'#0a0d14');x.fillStyle=g;x.fillRect(0,0,W,H);
 x.strokeStyle='#ffffff14';x.lineWidth=1;
 for(let i=1;i<6;i++){x.beginPath();x.moveTo(0,H*i/6);x.lineTo(W,H*i/6);x.stroke()}
 const tMax=Math.max(8,P.t*1.15),mMax=Math.max(2,Math.exp(CRATE*tMax));
 const X=t=>40+(W-70)*t/tMax,Y=m=>H-30-(H-60)*Math.log(m)/Math.log(mMax);
 if(P.phase==='fly'||P.phase==='crash'){
  x.beginPath();x.moveTo(X(0),Y(1));
  const steps=60;for(let i=1;i<=steps;i++){const t=P.t*i/steps;x.lineTo(X(t),Y(Math.exp(CRATE*t)))}
  const ex=X(P.t),ey=Y(Math.exp(CRATE*P.t));
  x.strokeStyle=P.phase==='crash'?'#ff5a5a':'#ff3b56';x.lineWidth=4;x.stroke();
  x.lineTo(ex,H-30);x.lineTo(X(0),H-30);x.closePath();x.fillStyle='#ff3b5633';x.fill();
  if(P.phase==='fly'){x.save();x.translate(ex,ey);x.rotate(-.45);x.font='28px system-ui';x.fillText('✈️',-10,8);x.restore()}
 }
 x.textAlign='center';x.font='800 54px system-ui';
 if(P.phase==='crash'){x.fillStyle='#ff5a5a';x.fillText(P.m.toFixed(2)+'x',W/2,H/2);x.font='700 18px system-ui';x.fillText('UÇAK UÇTU',W/2,H/2+28)}
 else if(P.phase==='fly'){x.fillStyle='#fff';x.fillText(P.m.toFixed(2)+'x',W/2,H/2)}
 else if(P.phase==='wait'){x.fillStyle='#ffb020';x.font='800 40px system-ui';x.fillText(P.cd>0?'Kalkış '+Math.ceil(P.cd):'',W/2,H/2)}
 else{x.fillStyle='#8fa3b5';x.font='700 22px system-ui';x.fillText('Bahis yap ve başlat',W/2,H/2)}
}
function crashHTML(){
 return `<div class='pn2'><h3>Aviator</h3><div class='cas'><canvas id='acv' width='520' height='280'></canvas></div>
 ${cgBetHTML()}<div class='row' style='margin-top:6px'><label class='note'>Otomatik çek (x)</label><input type='number' id='aauto' min='0' step='0.1' value='${cgCrash.auto||0}' title='0 = kapalı'><span class='note'>0 = kapalı</span></div>
 <div class='row' style='margin-top:8px'><button class='btn sm' id='astart'>UÇUŞU BAŞLAT</button><button class='btn alt sm' id='acash' disabled>PARAYI ÇEK</button></div>
 <p class='cgm' id='cgm'>Çarpan yükselir. Uçak düşmeden önce parayı çek.</p>
 <div class='row' id='ah'>${cgCrash.hist.map(v=>`<span class='rn' style='background:${v>=2?'#1f9d4c':'#7a2020'}'>${v.toFixed(2)}x</span>`).join('')}</div></div>`;
}
function crashWire(){
 cgWireBet();crashDraw();
 const P=cgCrash;
 $('astart').onclick=()=>{
  if(P.phase==='wait'||P.phase==='fly')return;
  const bet=cgTakeBet();if(!bet)return;
  P.auto=+$('aauto').value||0;P.bet=bet;P.on=true;P.phase='wait';P.cd=2.2;P.m=1;P.t=0;P.cp=crashPoint();
  $('astart').disabled=true;$('acash').disabled=true;cgMsg('Kalkışa hazırlanıyor...');
  const t0=performance.now();let last=t0;
  const loop=now=>{
   const dt=(now-last)/1000;last=now;
   if(P.phase==='wait'){P.cd-=dt;if(P.cd<=0){P.phase='fly';P.t=0;$('acash').disabled=false;cgMsg('Uçuyor! Parayı çek.')}}
   else if(P.phase==='fly'){
    P.t+=dt;P.m=Math.exp(CRATE*P.t);
    if(P.auto>1&&P.m>=P.auto&&P.bet>0){P.m=P.auto;doCash();}
    else if(P.m>=P.cp){P.m=P.cp;P.phase='crash';crashEnd(false)}
   }
   crashDraw();
   if(P.phase==='wait'||P.phase==='fly')cgRaf=requestAnimationFrame(loop);
   else if(P.phase==='crash'){cgRaf=0}
  };
  cgRaf=requestAnimationFrame(loop);
 };
 const doCash=()=>{
  if(P.phase!=='fly'||!P.bet)return;
  const pay=P.bet*P.m;cgPay(pay);
  cgMsg(`Çektin: ${P.m.toFixed(2)}x · +${fmt(pay-P.bet)} TL`,'win');snd(900,.25,.06);
  P.bet=0;const b=$('acash');if(b)b.disabled=true;
  /* oyuncu çekti; tur uçmaya devam eder, düşüş noktası gösterilir */
  P.phase='fly';P.shown=true;
 };
 $('acash').onclick=doCash;
 /* çekildikten sonra tur bitene kadar canlı göster */
}
function crashEnd(){
 const P=cgCrash;P.hist.unshift(P.cp);P.hist=P.hist.slice(0,12);
 if(P.bet>0){cgMsg(`Uçak ${P.cp.toFixed(2)}x'te düştü. -${fmt(P.bet)} TL`,'lose')}
 P.bet=0;P.on=false;P.shown=false;
 const s=$('astart');if(s)s.disabled=false;const a=$('acash');if(a)a.disabled=true;
 const h=$('ah');if(h)h.innerHTML=P.hist.map(v=>`<span class='rn' style='background:${v>=2?'#1f9d4c':'#7a2020'}'>${v.toFixed(2)}x</span>`).join('');
 P.phase='crash';
}

/* ---------- Kumarhane ekranı ---------- */
/* ---------- DEDE (Kimi PR #10, Claude entegrasyonu 2026-10-19) ----------
   Ayrı sayfa (assets/casino/dede/index.html), aynı köken: NPNG_CASINO API'si doğrudan kullanılır.
   Para yalnız oyunda (SV.tl): sayfa onBet/onWin bildirir, oyun setCredit ile geri yollar.
   iframe #lb içinde bir kez açılır ve yerinde kalır: sekmeden çıkınca süren çevirme arka planda biter ve ödenir
   (yeniden yüklense yarım kalan kazanç kaybolurdu). Çıkışta otomatik çevirme durur. */
/* Ayrı sayfa oyunlar (Claude 2026-10-20: DEDE'ye ek olarak LOKUM ve Çivi Topu) — hepsi aynı API: setCredit/onBet/onWin/stopAuto/spinning.
   Her oyunun iframe'i ilk açılışta bir kez yüklenir, sekme değişince gizlenir (süren çevirme/top arka planda biter ve ödenir). */
const CGF={
 dede:{src:'assets/casino/dede/index.html',title:'DEDE kumarhane',W:1200,H:790,f:null,api:null,ro:null},
 lokum:{src:'assets/casino/lokum/index.html',title:'LOKUM şeker slotu',W:1200,H:790,f:null,api:null,ro:null},
 civi:{src:'assets/casino/civi/index.html',title:'Çivi Topu',W:1200,H:760,f:null,api:null,ro:null},
 roach:{src:'assets/casino/roach/index.html',title:'Böcek Mutfak',W:1200,H:790,f:null,api:null,ro:null},
};
const CGD=CGF.dede; /* eski ad: haftalık bonus ve testler */
let cgfCur='dede',cgfEv=false;
const cgfHTML=k=>()=>`<div id='cgf'><p class='note'>${CGF[k].title} yükleniyor…</p></div>`;
function dedeVer(){const s=document.querySelector('script[src*="js/casino.js"]');return s&&s.src.split('v=')[1]||'1'}
const cgfWire=k=>()=>{
 const o=CGF[k];cgfCur=k;let f=o.f;
 for(const q in CGF)if(q!==k)cgfHideOne(q);
 if(!f){f=o.f=document.createElement('iframe');f.className='cgfr';if(k==='dede')f.id='dedef';else f.id='cgf-'+k;f.title=o.title;f.setAttribute('allow','autoplay');
  f.onload=()=>cgfBind(k);f.src=o.src+'?v='+dedeVer();$('lb').appendChild(f)}
 if(!cgfEv){cgfEv=true;addEventListener('resize',dedePlace);document.addEventListener('scroll',dedePlace,true)}
 f.style.display='block';dedePlace();requestAnimationFrame(dedePlace);setTimeout(dedePlace,350);
 if(window.ResizeObserver){if(o.ro)o.ro.disconnect();o.ro=new ResizeObserver(dedePlace);const h=$('cgf');if(h)o.ro.observe(h)}
 cgfSync(k);
};
const dedeHTML=cgfHTML('dede'),dedeWire=cgfWire('dede');
/* Sayfa tasarım boyutunda çizilir, sekmelerin altındaki alana ölçeklenip ortalanır (kesilme olmaz) */
const DEDE_W=1200,DEDE_H=790;
function dedePlace(){const o=CGF[cgfCur],h=$('cg'),f=o&&o.f;if(!h||!f||f.style.display==='none')return;
 const top=Math.max(0,h.getBoundingClientRect().top),k=Math.max(.3,Math.min(1.25,(innerWidth-32)/o.W,(innerHeight-top-12)/o.H));
 f.style.width=o.W+'px';f.style.height=o.H+'px';f.style.transform='scale('+k.toFixed(4)+')';
 f.style.left=Math.round((innerWidth-o.W*k)/2)+'px';f.style.top=Math.round(top)+'px'}
function cgfHideOne(k){const o=CGF[k];if(!o||!o.f)return;o.f.style.display='none';if(o.ro){o.ro.disconnect();o.ro=null}try{if(o.api)o.api.stopAuto()}catch(e){}}
function dedeHide(){for(const k in CGF)cgfHideOne(k)}
function cgfSync(k){const o=CGF[k];try{if(o&&o.api){o.api.setCredit(Math.max(0,Math.floor(SV.tl)));const w=o.f.contentWindow;if(k==='dede'&&w&&typeof w.weeklyRefresh==='function')w.weeklyRefresh()}}catch(e){}}
function dedeSync(){for(const k in CGF)cgfSync(k)}
function cgfBind(k){
 const o=CGF[k];let api=null;try{api=o.f.contentWindow.NPNG_CASINO}catch(e){}
 if(!api)return;o.api=api;
 api.onBet(b=>{b=Math.floor(+b||0);if(b<=0)return;SV.tl-=b;casLog(b,0);save();bal();dedeSync()});
 api.onWin(w=>{w=Math.floor(+w||0);if(w<=0)return;SV.tl+=w;casLog(0,w);save();bal();dedeSync()});
 if(k==='dede'){api.claimWeeklyBonus=casWeekly;api.weeklyStatus=casWeekStatus}
 if(api.getBet()>Math.max(10,SV.tl))api.setBet(k==='civi'?1:10);
 cgfSync(k);
}
function dedeBind(){cgfBind('dede')}
/* Haftalık kumarhane kayıp bonusu (Kimi önerisi, Berkan varsayılanı: %10, tavan 25.000; kesin oran Berkan'da).
   Tüm kumarhane oyunlarının son 7 günlük net kaybı; haftada bir. Kayıt hesapta (SV.cas). Çevrimdışıyken verilmez. */
const CAS_WEEK={rate:.10,cap:25000};
const casDay=()=>Math.floor(Date.now()/864e5);
function casWeekId(){const d=new Date(),t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())),n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);const y=new Date(Date.UTC(t.getUTCFullYear(),0,1));return t.getUTCFullYear()+'-W'+Math.ceil(((t-y)/864e5+1)/7)}
function casLog(b,w){const c=SV.cas=SV.cas&&typeof SV.cas==='object'?SV.cas:{d:{},wk:''};if(!c.d||typeof c.d!=='object')c.d={};const d=casDay(),e=c.d[d]=c.d[d]||[0,0];e[0]+=b;e[1]+=w;for(const k in c.d)if(+k<d-8)delete c.d[k]}
function casWeekNet(){const c=SV.cas;if(!c||!c.d)return 0;const d=casDay();let n=0;for(const k in c.d)if(+k>d-7)n+=(+c.d[k][0]||0)-(+c.d[k][1]||0);return n}
function casWeekAmount(){return Math.min(Math.round(Math.max(0,casWeekNet())*CAS_WEEK.rate),CAS_WEEK.cap)}
function casWeekStatus(){if(offInf())return 'offline';if(SV.cas&&SV.cas.wk===casWeekId())return 'claimed';return casWeekAmount()>0?'ready':'none'}
function casWeekly(){
 const st=casWeekStatus();
 if(st!=='ready')return Promise.resolve({amount:0,reason:st==='offline'?'offline':st==='claimed'?'already-claimed':'no-loss'});
 const amount=casWeekAmount();SV.cas.wk=casWeekId();SV.tl+=amount;save();bal();dedeSync();
 return Promise.resolve({amount});
}
/* ---------- Canlı Blackjack (Claude 2026-10-20 · Berkan: "canlı oynanabilir, aktif biri varsa masaya katılır, turunu bekler") ----------
   Masa sunucuda (server-blackjack.js): kartları sunucu dağıtır. Para oyuncuda: kabul edilen bahis 'bjok' ile düşer,
   el sonunda kazanç 'bjpay' ile eklenir. Sekmeden/kumarhaneden çıkınca masadan kalkılır (süren el otomatik "dur" ile biter, kazanç ödenir). */
const LBJ={st:null,list:[],tb:1,pend:0,at:0,iv:0,on:false};
const LBJ_SUIT={s:'♠',h:'♥',d:'♦',c:'♣'};
const lbjCard=c=>c?`<span class='lbjc ${c[1]==='h'||c[1]==='d'?'red':''}'><b>${c[0]==='T'?'10':c[0]}</b><i>${LBJ_SUIT[c[1]]}</i></span>`:`<span class='lbjc back'></span>`;
const LBJ_DEALER=`<svg viewBox="0 0 200 170" class='lbjdl'><defs><linearGradient id='lbjhair' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#5a3418'/><stop offset='1' stop-color='#2e180a'/></linearGradient></defs>
<path d='M40 170 Q44 112 100 104 Q156 112 160 170 Z' fill='#f4f1ea'/><path d='M40 170 Q44 116 84 106 L100 150 L116 106 Q156 116 160 170 Z' fill='#16181d'/>
<path d='M90 106 L100 120 L110 106 Z' fill='#f4f1ea'/><path d='M88 112 L100 118 L112 112 L112 122 L100 118 L88 122 Z' fill='#b3122e'/>
<circle cx='100' cy='134' r='2' fill='#c9a44a'/><circle cx='100' cy='148' r='2' fill='#c9a44a'/>
<rect x='122' y='124' width='22' height='8' rx='2' fill='#c9a44a'/><text x='133' y='130.5' font-size='5.5' text-anchor='middle' fill='#2a1a08' font-weight='700'>SELİN</text>
<rect x='92' y='88' width='16' height='18' rx='6' fill='#e8b48f'/>
<path d='M64 56 Q62 18 100 16 Q138 18 136 56 Q140 84 128 100 Q126 70 120 50 Q100 40 80 50 Q74 70 72 100 Q60 84 64 56 Z' fill='url(#lbjhair)'/>
<ellipse cx='100' cy='62' rx='28' ry='33' fill='#f0c09c'/>
<path d='M72 52 Q86 28 112 34 Q128 40 129 56 Q118 42 100 44 Q84 46 72 52 Z' fill='url(#lbjhair)'/>
<ellipse cx='89' cy='62' rx='4' ry='4.6' fill='#fff'/><ellipse cx='111' cy='62' rx='4' ry='4.6' fill='#fff'/><circle cx='89.5' cy='63' r='2.6' fill='#3b6f2e'/><circle cx='111.5' cy='63' r='2.6' fill='#3b6f2e'/>
<path d='M83 55 Q89 52 95 55 M105 55 Q111 52 117 55' stroke='#3a2412' stroke-width='1.8' fill='none' stroke-linecap='round'/>
<path d='M100 66 Q98 74 101 76' stroke='#c98d6a' stroke-width='1.5' fill='none'/><path d='M92 82 Q100 88 108 82' stroke='#b3434f' stroke-width='3' fill='none' stroke-linecap='round'/>
<circle cx='84' cy='74' r='4' fill='#f29a9a' opacity='.35'/><circle cx='116' cy='74' r='4' fill='#f29a9a' opacity='.35'/></svg>`;
function lbjHTML(){
 if(!MPL.authed)return `<div class='pn2'><h3>Canlı Blackjack</h3><p>Canlı masada başka oyuncularla aynı masada oynarsın; kartları sunucu dağıtır.</p><p class='note'>Çevrimiçi giriş yapmalısın (lobide ☁ düğmesi). Çevrimdışı tek kişilik masa: "Blackjack" sekmesi.</p></div>`;
 return `<div id='lbj'><div id='lbjstage'><div class='lbjtop'><div id='lbjtabs'></div><div id='lbjst' class='lbjst'>Masaya bağlanılıyor…</div></div>
 <div class='lbjtable'><div class='lbjdealer'>${LBJ_DEALER}</div><div class='lbjdc' id='lbjd'></div><div class='lbjfelt'><div class='lbjrule'>BLACKJACK 3:2 ÖDER · KRUPİYE YUMUŞAK 17'DE DURUR</div></div><div id='lbjseats'></div></div>
 <div class='lbjctl' id='lbjctl'></div><div class='lbjlast' id='lbjlast'></div></div></div>`;
}
/* masa 1000×600 tasarım boyutunda çizilir, kumarhane alanına ölçeklenir (dar ekranda üst üste binmez) */
function lbjFit(){const w=$('lbj'),s=$('lbjstage');if(!w||!s)return;const k=Math.max(.35,Math.min(1.2,w.clientWidth/1000,(innerHeight-w.getBoundingClientRect().top-8)/600));s.style.transform='scale('+k.toFixed(4)+')';w.style.height=Math.round(600*k)+'px';s.style.left=Math.max(0,Math.round((w.clientWidth-1000*k)/2))+'px'}
function lbjWire(){
 if(!MPL.authed)return;
 LBJ.on=true;mpSend({t:'bjjoin',tb:LBJ.tb});lbjFit();requestAnimationFrame(lbjFit);
 if(!LBJ.rs){LBJ.rs=1;addEventListener('resize',lbjFit)}
 clearInterval(LBJ.iv);LBJ.iv=setInterval(()=>{if(!LBJ.on||!$('lbj')){clearInterval(LBJ.iv);return}lbjTick()},250);
 cgSet(()=>mpSend({t:'bjlist'}),3000);
}
function lbjLeave(){if(LBJ.on){LBJ.on=false;clearInterval(LBJ.iv);mpSend({t:'bjleave'})}}
const lbjMe=()=>String(MPL.acct||'').toLowerCase();
function lbjMySeat(st){st=st||LBJ.st;if(!st)return -1;return st.seats.findIndex(x=>x&&x.n.toLowerCase()===lbjMe()&&!x.away)}
function lbjMsg(m){
 if(typeof m.t!=='string'||m.t.slice(0,2)!=='bj')return false;
 switch(m.t){
  case'bjok':{const a=Math.floor(+m.a||0);if(a>0){SV.tl-=a;casLog(a,0);save();bal()}break}
  case'bjpay':{const a=Math.floor(+m.a||0);if(a>0){SV.tl+=a;casLog(0,a);save();bal();alert2((m.pend?'Canlı blackjack (bağlı değilken biten el): ':'Canlı blackjack: ')+'+₺'+a.toLocaleString('tr-TR'))}break}
  case'bjs':LBJ.st=m;LBJ.at=Date.now();if(m.ph==='end')LBJ.endSt=m;if(LBJ.on&&$('lbj'))lbjRender();break;
  case'bjlist':LBJ.list=m.l||[];if(LBJ.on&&$('lbj'))lbjTabs();break;
  case'bjmsg':if($('lbj'))lbjToast(m.m);else alert2(m.m);break;
 }
 return true;
}
function lbjToast(t){const e=$('lbjst');if(!e)return;e.dataset.msg=t;e.dataset.mt=Date.now()+3500;lbjTick()}
function lbjTabs(){const e=$('lbjtabs');if(!e)return;const st=LBJ.st;e.innerHTML=(LBJ.list.length?LBJ.list:[[1,'Masa 1',10,0],[2,'Masa 2',100,0],[3,'Masa 3 · VIP',1000,0]]).map(r=>st&&st.tb===r[0]?[r[0],r[1],r[2],st.seats.filter(Boolean).length]:r).map(r=>`<button class='lbjtab ${r[0]===LBJ.tb?'on':''}' data-tb='${r[0]}'>${r[1]}<small>min ₺${r[2].toLocaleString('tr-TR')} · ${r[3]}/5</small></button>`).join('');
 e.querySelectorAll('[data-tb]').forEach(b=>b.onclick=()=>{const t=+b.dataset.tb;if(t===LBJ.tb)return;const st=LBJ.st;if(st&&lbjMySeat()>=0&&st.ph!=='idle'){lbjToast('Elin sürerken masa değiştiremezsin.');return}LBJ.tb=t;LBJ.pend=0;mpSend({t:'bjjoin',tb:t})})}
const LBJ_PH={idle:'Bahis bekleniyor',bet:'Bahisler açık',deal:'Kartlar dağıtılıyor',play:'Oyuncular oynuyor',dealer:'Krupiye oynuyor',end:'El bitti'};
const LBJ_RES={win:'KAZANDI',lose:'KAYBETTİ',push:'BERABERE',bj:'BLACKJACK!'};
function lbjRender(){
 const st=LBJ.st;if(!st||st.tb!==LBJ.tb)return;
 lbjTabs();lbjFit();
 $('lbjd').innerHTML=st.d.map(lbjCard).join('')+(st.d.length?`<em class='lbjv'>${st.dv}${st.d.some(c=>!c)?'+?':''}</em>`:'');
 const me=lbjMySeat(st);
 $('lbjseats').innerHTML=st.seats.map((x,i)=>{
  if(!x)return `<div class='lbjseat empty s${i}'>${me<0?`<button class='btn sm' data-sit='${i}'>OTUR</button>`:'<span>boş</span>'}</div>`;
  const mine=i===me,turn=st.turn&&st.turn[0]===i;
  const hands=x.hands.map((h,hi)=>`<div class='lbjhand ${turn&&st.turn[1]===hi?'cur':''} ${h.res}'><div class='lbjcards'>${h.c.map(lbjCard).join('')}</div><div class='lbjhv'>${h.v}${h.s&&h.v<21?' (yumuşak)':''}${h.res?' · '+LBJ_RES[h.res]:h.st==='bust'?' · BATTI':''}</div><div class='lbjchip'>₺${h.bet.toLocaleString('tr-TR')}</div></div>`).join('');
  const tag=x.wait?'sıradaki eli bekliyor':x.away?'masadan kalktı':(!x.bet&&(st.ph==='idle'||st.ph==='bet'))?'bahis bekleniyor':'';
  return `<div class='lbjseat s${i} ${mine?'me':''} ${turn?'turn':''}'><div class='lbjname'>${mine?'⭐ ':''}${x.n}${turn?` <i class='lbjtm' data-tm='1'></i>`:''}</div>${hands||(x.bet?`<div class='lbjchip'>₺${x.bet.toLocaleString('tr-TR')}</div>`:'')}<div class='lbjtag'>${tag}${x.win&&st.ph==='end'?'+₺'+x.win.toLocaleString('tr-TR'):''}</div></div>`;
 }).join('');
 document.querySelectorAll('#lbjseats [data-sit]').forEach(b=>b.onclick=()=>mpSend({t:'bjsit',s:+b.dataset.sit}));
 lbjCtl();
 $('lbjlast').innerHTML=(st.last||[]).slice(0,4).map(r=>`<span>El ${r.rd}: krupiye ${r.d>21?'battı':r.d} · ${r.r.map(q=>q[0]+' '+(q[1]>=0?'+':'')+q[1].toLocaleString('tr-TR')).join(', ')}</span>`).join('');
 lbjTick();
}
function lbjCtl(){
 const st=LBJ.st,c=$('lbjctl');if(!c||!st)return;const me=lbjMySeat(st);
 if(me<0){c.innerHTML=`<p class='note'>İzliyorsun. Oynamak için boş bir koltukta <b>OTUR</b>'a bas. Bakiye ₺${Math.floor(SV.tl).toLocaleString('tr-TR')}</p>`;return}
 const x=st.seats[me];let h='';
 if(x.wait)h=`<p class='note'>El sürüyor: sıradaki elde oynayacaksın.</p>`;
 else if((st.ph==='idle'||st.ph==='bet')&&!x.bet){
  const ch=[1,5,10,50,100].map(k=>k*st.min);
  h=`<div class='row'>${ch.map(v=>`<button class='chip' data-ch='${v}'>₺${v>=1000?(v/1000)+'B':v}</button>`).join('')}<button class='chip' data-ch='0'>Sıfırla</button>
   <button class='btn' id='lbjbet' ${LBJ.pend>=st.min?'':'disabled'}>BAHİS KOY ₺${LBJ.pend.toLocaleString('tr-TR')}</button></div><p class='note'>Masa: ₺${st.min.toLocaleString('tr-TR')} – ₺${st.max.toLocaleString('tr-TR')} · Bakiye ₺${Math.floor(SV.tl).toLocaleString('tr-TR')}</p>`;
 }else if(st.ph==='play'&&st.turn&&st.turn[0]===me){
  const H=x.hands[st.turn[1]],two=H&&H.c.length===2,pair=two&&x.hands.length===1&&lbjCv(H.c[0])===lbjCv(H.c[1]);
  h=`<div class='row lbjact'><button class='btn' data-a='hit'>KART ÇEK</button><button class='btn alt' data-a='stand'>DUR</button>${two&&SV.tl>=H.bet?`<button class='btn' data-a='double'>2× KATLA</button>`:''}${pair&&SV.tl>=H.bet?`<button class='btn' data-a='split'>BÖL</button>`:''}</div>`;
 }else h=`<p class='note'>${x.bet?'Bahsin: ₺'+x.bet.toLocaleString('tr-TR'):'Bu elde bahsin yok'} · ${LBJ_PH[st.ph]||''}</p>`;
 c.innerHTML=h+`<button class='btn sm alt lbjup' id='lbjup'>KALK</button>`;
 c.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>{const v=+b.dataset.ch;LBJ.pend=v?Math.min(st.max,LBJ.pend+v):0;if(LBJ.pend>SV.tl)LBJ.pend=Math.floor(Math.min(SV.tl,st.max));lbjCtl()});
 const bb=$('lbjbet');if(bb)bb.onclick=()=>{if(LBJ.pend<st.min||LBJ.pend>SV.tl){lbjToast('Bakiyen yetmiyor.');return}mpSend({t:'bjbet',a:LBJ.pend,tl:Math.floor(SV.tl)});bb.disabled=true};
 c.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{c.querySelectorAll('[data-a]').forEach(q=>q.disabled=true);mpSend({t:'bjact',a:b.dataset.a,tl:Math.floor(SV.tl)})});
 $('lbjup').onclick=()=>{mpSend({t:'bjstand'});LBJ.pend=0};
}
const lbjCv=c=>c[0]==='A'?11:'TJQK'.includes(c[0])?10:+c[0];
function lbjTick(){
 if(LBJ.on&&MPL.authed&&Date.now()-(LBJ.at||0)>10000&&Date.now()-(LBJ.rj||0)>10000){LBJ.rj=Date.now();mpSend({t:'bjjoin',tb:LBJ.tb})} /* bağlantı yenilendiyse masaya yeniden bağlan */
 const st=LBJ.st,e=$('lbjst');if(!e||!st)return;
 const left=Math.max(0,Math.ceil((st.ms-(Date.now()-LBJ.at))/1000));
 let t=st.n+' · El '+st.rd+' · '+(LBJ_PH[st.ph]||'');
 if(st.ph==='bet')t+=': '+left+' sn';
 if(st.ph==='play'&&st.turn){const x=st.seats[st.turn[0]];t+=' · Sıra: '+(x?x.n:'?')+' ('+left+' sn)'}
 if(st.ph==='end')t+=' · yeni el '+left+' sn sonra';
 if(e.dataset.msg&&Date.now()<+e.dataset.mt)t=e.dataset.msg;
 e.textContent=t;
 const tm=document.querySelector('#lbjseats .lbjtm');if(tm)tm.textContent=left+' sn';
}
const CGAMES=[['dede','DEDE ⚡',dedeHTML,dedeWire],['lokum','LOKUM 🍭',cgfHTML('lokum'),cgfWire('lokum')],['civi','Çivi Topu',cgfHTML('civi'),cgfWire('civi')],['roach','Böcek Mutfak 🪳',cgfHTML('roach'),cgfWire('roach')],['slot','Meyve slot',slotHTML,slotWire],['lbj','Canlı Blackjack 🃏',lbjHTML,lbjWire],['bj','Blackjack',bjHTML,bjWire],['rl','Rulet',rHTML,rWire],['av','Aviator',crashHTML,crashWire]];
/* İlk girişte (hesap başına bir kez) 18 yaş onayı. Onay hesabın kayıtlı verisinde (SV.casOk) tutulur. */
function casinoGateV(){
 return `<div class='pn2 cgate'><h3>Kumarhane · Giriş onayı</h3>
 <p>Kumarhane yalnızca <b>18 yaşından büyük</b> oyuncular içindir.</p>
 <p class='note'>Buradaki oyunlar tamamen eğlence amaçlıdır ve yalnızca oyun içi sanal para (TL) ile oynanır. Sanal para gerçek parayla satın alınamaz, gerçek paraya ya da herhangi bir değere çevrilemez, başka oyunculara aktarılamaz. Gerçek parayla bahis, ödül ya da kazanç yoktur.</p>
 <label class='cgck'><input type='checkbox' id='cgage'> 18 yaşından büyüğüm ve bu koşulları okudum.</label>
 <div class='row'><button class='btn' id='cgok' disabled>Kumarhaneye gir</button><button class='btn alt' id='cgno'>Lobiye dön</button></div></div>`;
}
function casinoV(){
 if(!SV.casOk)return casinoGateV();
 const g=CGAMES.find(x=>x[0]===cgGame)||CGAMES[0];
 return `<div class='pn2'><div class='tabs'>${CGAMES.map(x=>`<button data-g='${x[0]}' class='${x[0]===g[0]?'on':''}'>${x[1]}</button>`).join('')}</div>
 <p class='note'>Burada sadece oyun içi para kullanılır. Gerçek para yoktur. Kaybettiğin para geri gelmez, dikkatli oyna.</p></div><div id='cg'>${g[2]()}</div>`;
}
VIEWS.casino=casinoV;
VIEWWIRE.casino=function(){
 if(!SV.casOk){
  const ck=$('cgage'),ok=$('cgok');
  if(ck)ck.onchange=()=>{ok.disabled=!ck.checked};
  if(ok)ok.onclick=()=>{if(!ck.checked)return;SV.casOk=Date.now();save();view('casino')};
  const no=$('cgno');if(no)no.onclick=()=>view('home');
  return;
 }
 document.querySelectorAll('#av [data-g]').forEach(b=>b.onclick=()=>{if(cgBusy||(cgCrash.on&&cgCrash.phase!=='idle'&&cgCrash.phase!=='crash'))return;casinoStop();cgGame=b.dataset.g;view('casino')});
 const g=CGAMES.find(x=>x[0]===cgGame)||CGAMES[0];
 g[3]();
};
