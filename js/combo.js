'use strict';
/* ===== Kombo sayacı: art arda isabet; süre dolunca sıfırlanır, yüksek kombo ödülü artırır ===== */
const CMB={n:0,t:0,win:3.2,best:0,tier:-1};
const CMB_T=[[3,'KOMBO','#cfe3f5'],[8,'İYİ','#7dff9a'],[15,'HARİKA','#27e0ff'],[25,'VAHŞİ','#ffb020'],[40,'DURDURULAMAZ','#ff6a3a'],[60,'EFSANE','#ff4fd8']];
const cmbMul=()=>1+Math.min(.5,CMB.n*.01);          /* en fazla +%50 skor / para / xp */
function cmbTier(){let t=-1;for(let i=0;i<CMB_T.length;i++)if(CMB.n>=CMB_T[i][0])t=i;return t}
function cmbHit(kill){
 if(window.BGMODE)return;
 CMB.n+=kill?2:1;CMB.t=CMB.win+(kill?.6:0);if(CMB.n>CMB.best)CMB.best=CMB.n;
 const el=$('cmb');if(!el)return;
 const ti=cmbTier();
 if(ti<0)return;
 const tt=CMB_T[ti];
 el.classList.remove('off');
 el.style.setProperty('--cc',tt[2]);
 el.innerHTML=`<b>×${CMB.n}</b><span>${tt[1]}${CMB.n>=10?` · +%${Math.round((cmbMul()-1)*100)}`:''}</span><i><u></u></i>`;
 el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');
 if(ti>CMB.tier&&ti>0&&typeof snd==='function'){snd(520+ti*120,.1,.05);snd(780+ti*120,.14,.04)}
 CMB.tier=ti;
}
function cmbHurt(){if(CMB.n>0){CMB.n=Math.floor(CMB.n*.5);CMB.t=Math.min(CMB.t,CMB.win);if(CMB.n<CMB_T[0][0])cmbReset()}}
function cmbReset(){
 CMB.n=0;CMB.t=0;CMB.tier=-1;
 const el=$('cmb');if(el)el.classList.add('off');
}
function cmbTick(dt){
 if(CMB.n<=0)return;
 CMB.t-=dt;
 const el=$('cmb');
 if(CMB.t<=0){cmbReset();return}
 if(el){const u=el.querySelector('u');if(u)u.style.width=Math.min(100,CMB.t/CMB.win*100)+'%'}
}
