'use strict';
/* ===== Admin paneli: sadece sunucu PC'sinden (localhost) giren hesap ya da data/admins.txt'teki isimler ===== */
var ADM={rows:[],fb:'',el:null,t:0,sel:''};
function admMsg(m){
 if(m.t==='alist'){ADM.rows=m.a;admRender();return true}
 if(m.t==='afb'){ADM.fb=m.m;admRender();setTimeout(()=>{if(ADM.fb===m.m){ADM.fb='';admRender()}},4000);return true}
 if(m.t==='adm'){
  if(m.k==='give'){SV.tl=Math.max(0,Math.round(SV.tl+m.amt));save();if(typeof upd==='function')upd();if(typeof bal==='function')bal();alert2('Admin hesabına '+(m.amt>0?'+':'')+m.amt+' TL işledi')}
  else if(m.k==='clrdebt'){SV.eco.debts=[];save();alert2('Admin borçlarını sildi')}
  return true;
 }
 if(m.t==='kickedby'){MPL.manual=true;MPL.reloading=true;alert2('Admin seni oyundan attı'+(m.min?' ('+m.min+' dk giremezsin)':''));setTimeout(()=>location.reload(),1800);return true}
 return false;
}
function admBtn(){
 let b=document.getElementById('admb');
 const on=!!(MPL.authed&&MPL.admin);
 if(!b){if(!on)return;b=document.createElement('button');b.id='admb';b.textContent='🛡 Admin';b.onclick=admOpen;document.getElementById('lb').appendChild(b)}
 b.style.display=on?'block':'none';
 if(!on&&ADM.el)admClose();
}
function admOpen(){
 if(!ADM.el){
  const d=document.createElement('div');d.id='admp';
  d.innerHTML='<div class="card"><h3>Admin paneli <button id="admx">✕</button></h3><div class="admc"><label>Miktar (TL) <input id="admamt" type="number" value="1000" step="100"></label><label>Yasak (dk, 0 = sadece at) <input id="admban" type="number" value="0" min="0" max="1440"></label></div><div id="admfb"></div><div id="admt"></div><p class="note">Para: seçili oyuncuya verilir (eksi yazarsan düşer). Çevrimdışı oyuncuya da verebilirsin, girince görür.</p></div>';
  document.body.appendChild(d);ADM.el=d;
  d.addEventListener('keydown',e=>e.stopPropagation());
  d.addEventListener('click',e=>{
   if(e.target.id==='admx'||e.target===d){admClose();return}
   const b=e.target.closest('[data-a]');if(!b)return;
   const n=b.dataset.n,a=b.dataset.a;
   if(a==='give')mpSend({t:'agive',n,amt:+document.getElementById('admamt').value||0});
   else if(a==='clr')mpSend({t:'aclr',n});
   else if(a==='kick'){if(confirm(n+' oyundan atılsın mı?'))mpSend({t:'akick',n,min:+document.getElementById('admban').value||0})}
   setTimeout(()=>mpSend({t:'alist'}),400);
  });
 }
 ADM.el.style.display='flex';mpSend({t:'alist'});
 clearInterval(ADM.t);ADM.t=setInterval(()=>mpSend({t:'alist'}),3000);
}
function admClose(){if(ADM.el)ADM.el.style.display='none';clearInterval(ADM.t)}
function admRender(){
 if(!ADM.el)return;
 document.getElementById('admfb').textContent=ADM.fb;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmtN=v=>(typeof fmt==='function'?fmt(v):v);
 const rows=ADM.rows.slice().sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 document.getElementById('admt').innerHTML='<table><tr><th>Oyuncu</th><th>Durum</th><th>Lv</th><th>Para</th><th>Borç</th><th></th></tr>'+rows.map(r=>`<tr><td>${esc(r[0])}${r[6]?' 🛡':''}</td><td>${r[1]?'<i class="on"></i>'+esc(r[2]):'<span class="off">çevrimdışı</span>'}</td><td>${r[5]}</td><td>${fmtN(r[3])}</td><td>${r[4]?'-'+fmtN(r[4]):'0'}</td><td><button data-a="give" data-n="${esc(r[0])}">Para ver</button><button data-a="clr" data-n="${esc(r[0])}">Borcu sil</button>${r[1]&&!r[6]?`<button class="red" data-a="kick" data-n="${esc(r[0])}">At</button>`:''}</td></tr>`).join('')+'</table>';
}
