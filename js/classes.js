'use strict';
/* ===== Açık dünya sınıfları: seçim ekranı, takım yetenekleri (şifa / koruma) ===== */
function clsSend(k,r,a,d){
 if(typeof OWN!=='undefined'&&OWN.on)mpSend({t:'ofx',k,x:Math.round(p.x*10)/10,z:Math.round(p.z*10)/10,r,a,d});
}
function clsRing(col,R){
 if(window.BGMODE)return;
 if(typeof fxRing==='function')fxRing(p.x,p.y+.1,p.z,R,col,.7);
 if(typeof fxBurst==='function')fxBurst(p.x,p.y+1,p.z,col,18,3,.7);
}
function clsHeal(frac){
 const mx=owMax();p.hp=Math.min(mx,p.hp+mx*frac);hudHp();
}
/* yetenek kullanıldığında (skills.js skUse çağırır) */
function clsUse(id){
 switch(id){
  case 'mend':clsHeal(.35);clsRing('#2ee59d',18);snd(700,.2,.06,'sine');snd(1000,.25,.05,'sine');clsSend('heal',18,.35,0);break;
  case 'sanct':SK.hotT=8;SK.hotR=.05;clsRing('#9bffd6',10);snd(520,.3,.06,'sine');clsSend('hot',10,.05,8);break;
  case 'bulwark':SK.guard=0;clsRing('#6fb8ff',20);clsSend('guard',20,.25,8);break;
  case 'smoke':
   p.inv=Math.max(p.inv,1.6);clsRing('#c9b8ff',6);snd(200,.3,.06,'sawtooth');
   if(typeof OW!=='undefined'&&OW.act)for(const m of OW.act){if(m.state==='dead'||!m.g)continue;if(Math.hypot(m.x-p.x,m.z-p.z)<6)owStun(m,1.5)}
   break;
 }
}
/* takım arkadaşından gelen etki */
function clsRecv(m){
 if(typeof p==='undefined'||mode!=='ow'||p.dead>0)return;
 if(Math.hypot(m.x-p.x,m.z-p.z)>m.r)return;
 const who=(typeof OWN!=='undefined'&&OWN.ents.get(m.id))?OWN.ents.get(m.id).name:'Takım';
 if(m.k==='heal'){clsHeal(m.a);if(!window.BGMODE){fxFlash('#2ee59d',.25);owToast(who+' seni iyileştirdi')}}
 else if(m.k==='hot'){SK.hotT=Math.max(SK.hotT,m.d);SK.hotR=Math.max(SK.hotR,m.a);if(!window.BGMODE){fxFlash('#9bffd6',.2);owToast(who+' şifa alanı açtı')}}
 else if(m.k==='guard'){SK.guard=Math.max(SK.guard,m.d);if(!window.BGMODE){fxFlash('#6fb8ff',.25);owToast(who+' sana koruma verdi (%25)')}}
}
/* ----- Sınıf seçim ekranı ----- */
let clsEl=null;
function clsOpen(){
 if(!clsEl){
  clsEl=document.createElement('div');clsEl.id='clsm';
  document.body.appendChild(clsEl);
 }
 const cur=clsId();
 clsEl.innerHTML='<div class="cm"><h2>Sınıfını seç</h2><p>İstediğin zaman HUD\'daki sınıf düğmesinden değiştirebilirsin.</p><div class="cg">'+
  Object.keys(CLS).map(k=>{const c=CLS[k],sk=SKD.filter(s=>s.cls===k);
   return `<button class="cc${k===cur&&SV.ow.cls?' on':''}" data-k="${k}" style="--cc:${c.col}"><i>${c.ic}</i><b>${c.n}</b><span>${c.d}</span><u>${c.st.join(' · ')}</u><em>${sk.map(s=>s.ic+' '+s.n).join('<br>')}</em></button>`}).join('')+
  '</div></div>';
 clsEl.classList.add('open');
 if(state==='play'){state='pause';if(document.exitPointerLock)try{document.exitPointerLock()}catch(e){}}
 clsEl.querySelectorAll('.cc').forEach(b=>b.onclick=ev=>{ev.stopPropagation();clsPick(b.dataset.k)});
}
function clsPick(k){
 SV.ow.cls=k;
 SK.cd={};SK.act={};SK.guard=0;SK.hotT=0;skFill();
 if(typeof save==='function')try{save()}catch(e){}
 clsEl.classList.remove('open');
 hudHp();if(typeof skHud==='function')skHud(true);
 owToast('Sınıf: '+CLS[k].n);
 if(typeof resume==='function'&&mode==='ow'){const o=$('ov');if(o)o.classList.add('off');resume()}
}
function clsChip(){
 if($('clsb')||!$('owhud'))return;
 const b=document.createElement('button');b.id='clsb';b.title='Sınıf değiştir';
 b.onclick=ev=>{ev.stopPropagation();clsOpen()};b.onmousedown=ev=>ev.stopPropagation();
 $('owhud').appendChild(b);
}
setInterval(()=>{
 if(mode!=='ow'||window.BGMODE)return;
 clsChip();const b=$('clsb');if(b){const c=clsCur(),t=c.ic+' '+c.n;if(b.textContent!==t)b.textContent=t;b.style.setProperty('--cc',c.col)}
 if(!SV.ow.cls&&state==='play'&&!(clsEl&&clsEl.classList.contains('open')))clsOpen();
},700);
