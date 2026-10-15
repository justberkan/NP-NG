'use strict';
/* ===== Kumarhane: slot, blackjack, rulet, Aviator (oyun içi para, gerçek para değil) ===== */
let cgGame='slot',cgBet=50,cgTimers=[],cgRaf=0,cgBusy=false;
const cgSet=(fn,ms)=>{const t=setTimeout(fn,ms);cgTimers.push(t);return t};
function casinoStop(){cgTimers.forEach(clearTimeout);cgTimers=[];cancelAnimationFrame(cgRaf);cgRaf=0;cgBusy=false;if(cgCrash.on&&cgCrash.phase==='fly'){/* uçuş sırasında çıkılırsa bahis yanar */cgCrash.on=false;cgCrash.phase='idle'}}
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
 cgBet=b;SV.tl-=b;save();bal();return b;
}
function cgPay(n){if(n>0){SV.tl+=Math.floor(n);save();bal()}}

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
const CGAMES=[['slot','Slot',slotHTML,slotWire],['bj','Blackjack',bjHTML,bjWire],['rl','Rulet',rHTML,rWire],['av','Aviator',crashHTML,crashWire]];
function casinoV(){
 const g=CGAMES.find(x=>x[0]===cgGame)||CGAMES[0];
 return `<div class='pn2'><div class='tabs'>${CGAMES.map(x=>`<button data-g='${x[0]}' class='${x[0]===g[0]?'on':''}'>${x[1]}</button>`).join('')}</div>
 <p class='note'>Burada sadece oyun içi para kullanılır. Gerçek para yoktur. Kaybettiğin para geri gelmez, dikkatli oyna.</p></div><div id='cg'>${g[2]()}</div>`;
}
VIEWS.casino=casinoV;
VIEWWIRE.casino=function(){
 document.querySelectorAll('#av [data-g]').forEach(b=>b.onclick=()=>{if(cgBusy||(cgCrash.on&&cgCrash.phase!=='idle'&&cgCrash.phase!=='crash'))return;casinoStop();cgGame=b.dataset.g;view('casino')});
 const g=CGAMES.find(x=>x[0]===cgGame)||CGAMES[0];
 g[3]();
};
