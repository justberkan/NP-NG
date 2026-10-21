'use strict';
/* ===== Lobi listesi, şifreli oda, arkadaş davet/katıl, oda üyeleri paneli (Claude 2026-10-20 · Berkan isteği) =====
   Co-op odaları (Koridor: Dalga Ağacı = wc, Korkunçlu = ic) sunucuda; burada yalnız görünüm ve katılma akışı.
   Katılma: roomJoin(mod, kod, şifre) → modu seçer, modun oda ekranını açar, kodu doldurup ODAYA KATIL'a basar. */
const RL={l:[],open:false,filter:'',iv:0,err:''};
const RL_MODE={wc:'Koridor: Dalga Ağacı',ic:'Korkunçlu'};
const rlEsc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function roomsModal(){let el=$('rlist');if(!el){el=document.createElement('div');el.id='rlist';el.className='wc-dialog';document.body.appendChild(el)}return el}
function roomsOpen(filter){
 if(!MPL.authed){if(typeof mpOpenDialog==='function')mpOpenDialog(()=>roomsOpen(filter));return}
 RL.open=true;RL.filter=filter||'';const el=roomsModal();el.style.display='flex';roomsRender();
 mpSend({t:'rl'});clearInterval(RL.iv);RL.iv=setInterval(()=>{if(!RL.open){clearInterval(RL.iv);return}mpSend({t:'rl'})},3000);
}
function roomsClose(){RL.open=false;clearInterval(RL.iv);const el=$('rlist');if(el)el.style.display='none'}
function roomsRender(){
 const el=$('rlist');if(!el||!RL.open)return;
 const keep=el.querySelector('#rlcode'),cv=keep?keep.value:'',foc=keep&&document.activeElement===keep;
 const rows=RL.l.filter(r=>!RL.filter||r.mode===RL.filter);
 const tab=(k,t)=>`<button class="btn sm ${RL.filter===k?'':'alt'}" data-f="${k}">${t}</button>`;
 el.innerHTML=`<div class="wc-card rlcard"><p class="wc-kicker">N.P.N.G. / CO-OP</p><h1>Açık lobiler</h1>
 <div class="row">${tab('','Tümü')}${tab('wc','Koridor')}${tab('ic','Korkunçlu')}</div>
 <div class="row"><input id="rlcode" maxlength="8" placeholder="Oda kodu ile bul / katıl" autocomplete="off"><button class="btn" id="rlgo">KODLA KATIL</button></div>
 <div class="rll">${rows.length?rows.map(r=>`<div class="rlr${r.lock?' lock':''}"><div class="rlm"><b>${rlEsc(r.name)}</b><small>Kod <code>${rlEsc(r.code)}</code>${r.map?' · '+rlEsc(r.map):''} · ${r.max?r.n+'/'+r.max:r.n+' kişi'}${r.lock?' · 🔒 şifreli':''}</small>
   <span class="rlp">${r.players.map((n,i)=>`<i${i===0&&n===r.owner?' class="host"':''}>${i===0&&n===r.owner?'👑 ':''}${rlEsc(n)}</i>`).join('')}</span></div>
   <button class="btn sm" data-j="${rlEsc(r.mode)}|${rlEsc(r.code)}|${r.lock}" ${r.max&&r.n>=r.max?'disabled':''}>${r.max&&r.n>=r.max?'DOLU':'KATIL'}</button></div>`).join(''):`<p class="note">${RL.err?rlEsc(RL.err):'Şu an açık lobi yok. Bir modda "CO-OP ODA AÇ" ile sen aç, arkadaşlarını davet et.'}</p>`}</div>
 <div class="row"><button class="btn alt" id="rlclose">KAPAT</button></div></div>`;
 const ci=el.querySelector('#rlcode');if(ci){ci.value=cv;if(foc)ci.focus()}
 el.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{RL.filter=b.dataset.f;roomsRender()});
 el.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>{const [m,c,l]=b.dataset.j.split('|');if(+l)roomsAskPass(m,c);else{roomsClose();roomJoin(m,c,'')}});
 el.querySelector('#rlclose').onclick=roomsClose;
 el.querySelector('#rlgo').onclick=()=>{const c=(el.querySelector('#rlcode').value||'').trim().toUpperCase();if(!c)return;const r=RL.l.find(q=>q.code===c);if(!r){RL.err='Bu kodla açık oda yok: '+c;roomsRender();return}if(r.lock)roomsAskPass(r.mode,c);else{roomsClose();roomJoin(r.mode,c,'')}};
 el.querySelector('#rlcode').onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')el.querySelector('#rlgo').click()};
}
/* şifre sor: katılmadan önce */
function roomsAskPass(mode,code,msg){
 let el=$('rlpass');if(!el){el=document.createElement('div');el.id='rlpass';el.className='wc-dialog';document.body.appendChild(el)}
 el.innerHTML=`<div class="wc-card" style="max-width:380px"><p class="wc-kicker">${rlEsc(RL_MODE[mode]||mode)} · ODA ${rlEsc(code)}</p><h1>🔒 Şifreli oda</h1>
 <p class="note">${rlEsc(msg||'Bu odaya girmek için şifre gerekiyor.')}</p>
 <div class="row"><input id="rlpw" type="password" maxlength="32" placeholder="Oda şifresi" autocomplete="off"></div>
 <div class="row"><button class="btn" id="rlpok">GİR</button><button class="btn alt" id="rlpno">VAZGEÇ</button></div></div>`;
 el.style.display='flex';const i=el.querySelector('#rlpw');setTimeout(()=>i.focus(),30);
 const go=()=>{const v=i.value;if(!v){i.focus();return}el.style.display='none';roomsClose();roomJoin(mode,code,v)};
 el.querySelector('#rlpok').onclick=go;el.querySelector('#rlpno').onclick=()=>{el.style.display='none'};
 i.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')go();if(e.key==='Escape')el.style.display='none'};
}
/* bir odaya katıl: mevcut maçtan çık, modu seç, modun oda ekranı kodla otomatik katılır */
function roomJoin(mode,code,pass){
 if(!code)return;
 if(typeof state!=='undefined'&&state!=='menu'&&typeof toLobby==='function')toLobby();
 for(const id of ['icselect','wcselect'])if($(id))$(id).style.display='none';
 selMode=mode;document.querySelectorAll('.mode[data-m]').forEach(b=>b.classList.toggle('on',b.dataset.m===mode));
 const req={code:String(code).toUpperCase(),pass:pass||''};
 if(mode==='ic'){IC.chosen=false;IC.joinReq=req}else if(mode==='wc'){WCG.chosen=false;WCG.joinReq=req}else return;
 startMatch();
}
/* sunucu mesajları */
function roomsMsg(m){
 if(m.t==='rl'){RL.l=Array.isArray(m.l)?m.l:[];RL.err=m.err||'';roomsRender();return true}
 if(m.t==='rinv'){roomsInvite(m);return true}
 return false;
}
function roomsInvite(m){
 const el=document.createElement('div');el.className='rlinv';
 el.innerHTML=`<b>${rlEsc(m.from)}</b> seni <b>${rlEsc(m.name||RL_MODE[m.mode]||m.mode)}</b> odasına çağırıyor <small>(kod ${rlEsc(m.code)})</small><div class="row"><button class="btn sm">KATIL</button><button class="btn sm alt">YOKSAY</button></div>`;
 document.body.appendChild(el);const [ok,no]=el.querySelectorAll('button');
 ok.onclick=()=>{el.remove();roomJoin(m.mode,m.code,'')}; /* davetli şifre sorulmadan girer (sunucu davet listesine yazdı) */
 no.onclick=()=>el.remove();setTimeout(()=>el.remove(),30000);
 try{snd(880,.08);setTimeout(()=>snd(1100,.1),120)}catch(e){}
}
/* oyundaki oda üyeleri paneli: kim var, kim oda sahibi */
function roomsPanel(){
 let el=$('roomPanel');
 const net=typeof mode!=='undefined'&&((mode==='ic'&&typeof IC!=='undefined'&&IC.on&&IC.net)||(mode==='wc'&&typeof WCG!=='undefined'&&WCG.net));
 if(!net){if(el&&el.style.display!=='none')el.style.display='none';return}
 if(!el){el=document.createElement('div');el.id='roomPanel';$('hud').appendChild(el)}
 const G=mode==='ic'?IC:WCG,me=MPL.acct||'Sen';
 const list=[...G.peers.entries()].map(([id,q])=>({id,name:id===G.id?me:(q.name||'Oyuncu '+id),host:id===G.host,me:id===G.id,hp:q.hp}));
 if(!list.some(q=>q.me))list.unshift({id:G.id,name:me,host:G.id===G.host,me:true});
 const html=`<div class="rph">${rlEsc(RL_MODE[mode])} · ODA <b>${rlEsc(G.code)}</b> <small>${list.length} kişi</small></div>`+list.map(q=>`<div class="rpi${q.me?' me':''}">${q.host?'👑 ':''}${rlEsc(q.name)}${q.me?' (sen)':''}</div>`).join('')+`<div class="rpk">Arkadaş listesinden <b>Davet</b> ile çağır</div>`;
 if(el._h!==html){el._h=html;el.innerHTML=html}el.style.display='block';
}
setInterval(roomsPanel,500);
/* sunucu mesajlarını yakala (mpMsg zinciri) */
const _rlMpMsg=mpMsg;mpMsg=function(m){if(m&&(m.t==='rl'||m.t==='rinv')&&roomsMsg(m))return;return _rlMpMsg(m)};
