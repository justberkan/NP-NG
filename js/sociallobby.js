'use strict';
/* ===== Sosyal lobi (PUBG tarzı bekleme odası) + oyuncu durumu bildirimi =====
   Sunucu tarafı: server-sociallobby.js (SLNET). Mesajlar: sl_create/sl_join/
   sl_leave/sl_ready/sl_mode/sl_start → sl_welcome/sl_members/sl_go/sl_closed/sl_error */
const SL={on:false,id:0,host:0,code:'',players:[],mode:'aim',cst:''};
const SL_MODES=[['aim','Aim Training'],['zom','Zombi'],['tdm','5v5 (botlar)'],['cmp','Rekabetçi'],['ow','Açık Dünya'],['race','Yarış'],['tm','5v5 Online'],['zo','Zombi Co-op']];
const slModeName=k=>{const f=SL_MODES.find(x=>x[0]===k);return f?f[1]:k};
const slEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* --- durum bildirimi (cst): arkadaş/aktif listelerinde "ne yapıyor" görünsün --- */
function slSetCst(v){
 if(!MPL.authed||SL.cst===v)return;
 SL.cst=v;mpSend({t:'cst',v});
}
if(typeof view==='function'){
 const _slView=view;view=function(n){slSetCst(n==='casino'?'Kumarhane':'');return _slView(n)};
}
if(typeof raceSetup==='function'){
 const _slRaceSetup=raceSetup;raceSetup=function(){slSetCst('Yarış');return _slRaceSetup()};
}
if(typeof raceStop==='function'){
 const _slRaceStop=raceStop;raceStop=function(){slSetCst('');return _slRaceStop()};
}

/* --- ağ kancası --- */
const _slMpMsg=mpMsg;mpMsg=function(m){if(m.t&&m.t.startsWith('sl_'))return slNetMsg(m);return _slMpMsg(m)};
function slNetMsg(m){
 switch(m.t){
 case 'sl_welcome':
  SL.on=true;SL.id=m.id;SL.host=m.host;SL.code=m.code;SL.players=m.players||[];SL.mode=m.mode||'aim';slRender();break;
 case 'sl_members':
  SL.players=m.players||[];SL.mode=m.mode||SL.mode;slRender();break;
 case 'sl_go':
  SL.on=false;slRender();slSetCst('');
  if(SL_MODES.some(x=>x[0]===m.mode)){selMode=m.mode;startMatch()}
  else alert2('Geçersiz mod: '+m.mode);
  break;
 case 'sl_closed':
  SL.on=false;SL.players=[];slRender();if(m.reason)alert2(m.reason);break;
 case 'sl_error':
  alert2(m.message||'Hata');break;
 }
}

/* --- panel (#fr'nin üstüne) --- */
let slBox=null;
function slEnsure(){
 if(slBox)return slBox;
 const fr=$('fr');if(!fr)return null;
 slBox=document.createElement('div');slBox.id='slbox';
 fr.insertAdjacentElement('beforebegin',slBox);
 slBox.addEventListener('click',slClick);
 slBox.addEventListener('change',slChange);
 return slBox;
}
function slClick(e){
 const b=e.target.closest('[data-sla]');if(!b)return;
 const a=b.dataset.sla;
 if(a==='create')mpSend({t:'sl_create'});
 else if(a==='join'){const i=slBox.querySelector('#slcode');if(i&&i.value.trim())mpSend({t:'sl_join',code:i.value.trim()})}
 else if(a==='ready')mpSend({t:'sl_ready',v:b.classList.contains('off')?1:0});
 else if(a==='leave')mpSend({t:'sl_leave'});
 else if(a==='start')mpSend({t:'sl_start'});
}
function slChange(e){
 const s=e.target.closest('[data-slch]');if(!s)return;
 if(s.dataset.slch==='mode'&&SL.on)mpSend({t:'sl_mode',mode:s.value});
}
function slRender(){
 const box=slEnsure();if(!box)return;
 const keep=box.querySelector('#slcode'),val=keep?keep.value:'',foc=keep&&document.activeElement===keep;
 if(!MPL.authed){box.className='off';box.innerHTML='';return}
 box.className='';
 if(!SL.on){
  box.innerHTML=`<div class="frp sl"><div class="frh">Sosyal Lobi <small>moddan önce bekleme odası</small></div>
   <div class="slrow"><button class="chip" data-sla="create">ODA AÇ</button><input id="slcode" maxlength="8" placeholder="oda kodu" autocomplete="off"><button class="chip" data-sla="join">KATIL</button></div>
   <div class="frs">Oda aç, kodu arkadaşına ver; herkes hazır olunca oda sahibi modu başlatır.</div></div>`;
 }else{
  const meReady=SL.players.some(p=>p.id===SL.id&&p.ready);
  const isHost=SL.id===SL.host;
  let rows='';
  for(const p of SL.players){
   rows+=`<div class="fi2"><i class="${p.ready?'on':''}"></i><span>${slEsc(p.name)}${p.host?'<small>oda sahibi</small>':''}</span>${p.ready?'<em>hazır</em>':'<em class="nr">bekliyor</em>'}</div>`;
  }
  box.innerHTML=`<div class="frp sl"><div class="frh">Sosyal Lobi · ODA ${slEsc(SL.code)} <small>${SL.players.length}/16</small></div>
   <div class="frl">${rows}</div>
   <div class="slrow">
    <button class="chip ${meReady?'':'off'}" data-sla="ready">${meReady?'HAZIRIM ✓':'HAZIR OL'}</button>
    ${isHost?`<select data-slch="mode">${SL_MODES.map(x=>`<option value="${x[0]}" ${x[0]===SL.mode?'selected':''}>${x[1]}</option>`).join('')}</select><button class="chip go" data-sla="start">BAŞLAT</button>`:''}
    <button class="chip" data-sla="leave">AYRIL</button>
   </div>
   ${isHost?'<div class="frs">Herkes hazır olunca başlat. Mod: '+slModeName(SL.mode)+'</div>':'<div class="frs">Oda sahibi başlatana kadar bekle.</div>'}</div>`;
 }
 const ni=box.querySelector('#slcode');if(ni){ni.value=val;if(foc)ni.focus()}
}
/* frRender çizildiğinde (giriş/çıkış, liste güncellemeleri) lobi panelini de tazele */
if(typeof frRender==='function'){
 const _slFr=frRender;frRender=function(){const r=_slFr();try{slRender()}catch(e){}return r};
}
slRender();
