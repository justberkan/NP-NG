'use strict';
/* ===== Çevrimiçi Arena: WebSocket istemcisi =====
   Sunucu: server.js. Her oyuncu botlarla AYNI animHuman sistemini kullanan bir rig olarak görünür.
   Ağ paketi (animasyon durumu): {x,y,z,yaw,pitch,vx,vz,f(bit:1 yerde,2 çömelme,4 kayma),w,rq(şarjör fazı),sw(savuruş fazı),cb(kombo),ad(nişan)}
   Ateş ve savuruş ayrıca 'fx' olayı olarak iletilir (namlu alevi, tracer, kılıç savurma). */
const MPL={ws:null,ready:false,authed:false,acct:'',id:0,info:new Map(),ents:new Map(),sendT:0,addr:'',board:[],spawn:null,limit:20,cb:null,tags:null,manual:false,q:0,retry:0,win:0,winName:''};
let mpShotId=0,mpShotAt=0,mpClockOffset=0;
function mpHitStamp(){if(!mpShotAt)mpShotAt=Date.now()+mpClockOffset;return {shotId:mpShotId,shotAt:mpShotAt}}
const MP_SAVE='mmofps_srv';
function mpLoad(){try{return JSON.parse(localStorage.getItem(MP_SAVE))||{}}catch(e){return{}}}
function mpStore(o){try{localStorage.setItem(MP_SAVE,JSON.stringify(Object.assign(mpLoad(),o)))}catch(e){}}
function mpDefaultAddr(){
 const l=location;
 if((l.protocol==='http:'||l.protocol==='https:')&&l.host)return(l.protocol==='https:'?'wss://':'ws://')+l.host;
 return'ws://localhost:3000';
}
function mpNormAddr(a){
 a=String(a||'').trim();if(!a)return mpDefaultAddr();
 if(/^https?:\/\//i.test(a))a=a.replace(/^http/i,'ws');
 if(!/^wss?:\/\//i.test(a))a=((/^(localhost|127\.|192\.168\.|10\.)/.test(a))?'ws://':(location.protocol==='https:'?'wss://':'ws://'))+a;
 a=a.replace(/\/+$/,'');
 if(/^ws:\/\/[^/:]+$/i.test(a)&&/^ws:\/\/(localhost|127\.|192\.168\.|10\.)/i.test(a))a+=':3000';
 return a;
}

/* ---------- Hesap chip'i (lobi) ---------- */
function mpChip(){
 if(!MPL.authed)MPL.admin=false;
 if(typeof admBtn==='function')admBtn();
 let c=$('acct');
 if(!c){c=document.createElement('button');c.id='acct';$('lb').appendChild(c);c.onclick=()=>mpOpenDialog()}
 const st=mpLoad();
 c.className=MPL.authed?'ok':(OFFL.pend?'':'offl');
 c.textContent=MPL.authed?'☁ '+MPL.acct+' · ilerlemen sunucuda saklanıyor':(st.tok&&st.name&&!MPL.manual&&OFFL.pend?'☁ '+st.name+' · bağlanılıyor...':'☁ ÇEVRİMDIŞI · ilerleme kaydedilmez — giriş yap / kayıt ol');
 if(typeof offBadge==='function')offBadge();
}

/* ---------- Giriş / Kayıt / Sunucu aç penceresi ---------- */
let mpDlg=null;
function mpDlgBuild(){
 const d=document.createElement('div');d.id='mpd';d.className='off';
 d.innerHTML=`<div class="card">
  <h1>Hesap ve Sunucu</h1>
  <label>Sunucu adresi<input id="mpa" type="text" autocomplete="off" spellcheck="false" placeholder="192.168.1.20:3000"></label>
  <label>Kullanıcı adı<input id="mpn" type="text" maxlength="14" autocomplete="username" spellcheck="false"></label>
  <label>Şifre<input id="mpp" type="password" maxlength="64" autocomplete="current-password"></label>
  <p id="mps" class="mps"></p>
  <button class="btn" id="mpc">GİRİŞ YAP</button> <button class="btn alt" id="mpr">KAYIT OL</button>
  <button class="btn alt" id="mpo">ÇIKIŞ YAP</button> <button class="btn alt" id="mpx">KAPAT</button>
  <button class="btn alt" id="mph">SUNUCU AÇ (nasıl?)</button>
  <div id="mpi" class="off">
   <b>Kendi sunucunu açmak</b>
   <ol>
    <li>Bilgisayarında <b>Node.js</b> olsun (nodejs.org → LTS). Bir kere kurman yeterli.</li>
    <li>Oyun klasöründeki <b>SUNUCU-BASLAT.bat</b> (aynı ağ) ya da <b>SUNUCU-INTERNET.bat</b> (internetten arkadaşlar) dosyasına çift tıkla. Pencerede yazan adresi arkadaşlarına ver.</li>
    <li>Hesaplar sunucunun <b>data</b> klasöründe saklanır. Kayıt olunca ilerlemen (para, eşyalar, skinler...) orada durur, hangi bilgisayardan girersen gir seninle gelir.</li>
   </ol>
   <small>Sunucu penceresi açık kaldığı sürece oyun açık kalır. Tarayıcı tek başına sunucu açamaz; bu yüzden bu küçük program gerekir.</small>
  </div>
 </div>`;
 document.body.appendChild(d);
 $('mpx').onclick=()=>{MPL.cb=null;d.classList.add('off')};
 $('mph').onclick=()=>$('mpi').classList.toggle('off');
 const go=mode=>{
  const a=mpNormAddr($('mpa').value),n=($('mpn').value||'').trim(),pw=$('mpp').value;
  if(n.length<3){mpStatus('Kullanıcı adı en az 3 karakter olmalı.',1);return}
  if(pw.length<4){mpStatus('Şifre en az 4 karakter olmalı.',1);return}
  mpStore({addr:$('mpa').value.trim(),name:n});
  mpConnect(a,n,pw,mode);
 };
 $('mpc').onclick=()=>go('login');$('mpr').onclick=()=>go('register');
 $('mpo').onclick=()=>{mpLogout();mpOpenDialog(MPL.cb)};
 for(const id of['mpa','mpn','mpp'])$(id).addEventListener('keydown',e=>{e.stopPropagation();if(e.code==='Enter')$('mpc').click()});
 return d;
}
function mpOpenDialog(cb){
 if(!mpDlg)mpDlg=mpDlgBuild();
 const sv=mpLoad();
 $('mpa').value=sv.addr||(mpDefaultAddr().replace(/^wss?:\/\//,''));
 $('mpn').value=sv.name||'';$('mpp').value='';
 $('mpo').style.display=MPL.authed?'':'none';
 $('mpc').style.display=$('mpr').style.display=MPL.authed?'none':'';
 $('mps').className='mps';$('mps').textContent=MPL.authed?'Giriş yapıldı: '+MPL.acct+'. Kayıt sunucuda saklanıyor.':'';
 MPL.cb=cb||null;mpDlg.classList.remove('off');
 if(document.exitPointerLock)try{document.exitPointerLock()}catch(e){}
}
function mpStatus(t,bad){if(!mpDlg)return;$('mps').textContent=t;$('mps').className='mps'+(bad?' bad':'')}

/* ---------- Bağlantı ---------- */
function mpArenaReset(){
 MPL.ready=false;MPL.id=0;MPL.info.clear();mpClearEnts();MPL.board=[];
 if(MPL.tags)MPL.tags.style.display='none';
 const b=$('mpb');if(b)b.style.display='none';
 if(typeof lobbySetSlot==='function')for(const i of MP_SLOTS)lobbySetSlot(i,null);
}
function mpQuit(){ // arenadan çık (hesap bağlantısı açık kalır)
 if(MPL.ready)mpSend({t:'quit'});
 mpArenaReset();
}
function mpDisconnect(){
 MPL.manual=true;
 if(MPL.ws){try{MPL.ws.close()}catch(e){}}
 MPL.ws=null;MPL.authed=false;MPL.acct='';mpArenaReset();mpChip();
}
function mpLogout(){mpStore({tok:null,adopted:null});mpDisconnect()}
const MP_SLOTS=[0,2,3];
function mpSend(o){const w=MPL.ws;if(w&&w.readyState===1)try{w.send(JSON.stringify(o))}catch(e){}}
function mpJoin(cb){
 MPL.cb=cb||null;
 const sk={};if(SV.sk)for(const k in SV.sk)if(SV.sk[k]&&(WKEYS.includes(k)||k.indexOf('m:')===0))sk[k]=SV.sk[k];
 const mods={};for(const k of['rifle','smg','pistol','knife']){const id=modId(k);if(id)mods[k]=id}
 MPL.want=selMode==='tm'?'tm':selMode==='zo'?'zo':'ar';
 mpSend({t:'join',room:MPL.want,map:MAPS.sel,ch:chWithKit(SV.eq.c),w:SV.eq.w,sk,mods});
}
function mpConnect(addr,name,pass,mdl,quiet){
 if(MPL.ws){MPL.manual=true;try{MPL.ws.close()}catch(e){}MPL.authed=false;mpArenaReset()}
 if(!quiet)mpStatus('Bağlanılıyor: '+addr+' ...');
 let ws,done=false;
 OFFL.pend=true; /* hesap kararı verilene kadar kayıt bekletilir (bkz. core.js save) */
 try{ws=new WebSocket(addr)}catch(e){if(!quiet)mpStatus('Adres geçersiz.',1);offSettle();return}
 MPL.ws=ws;MPL.manual=false;MPL.addr=addr;
 const to=setTimeout(()=>{if(!done){done=true;if(!quiet)mpStatus('Sunucuya ulaşılamadı. Adres doğru mu? Sunucu açık mı?',1);try{ws.close()}catch(e){}offSettle()}},8000);
 ws.onopen=()=>{
  if(mdl==='token')mpSend({t:'auth',mode:'token',name,tok:mpLoad().tok});
  else mpSend({t:'auth',mode:mdl,name,pass,save:mdl==='register'?SVDEF():undefined}); /* yeni hesap temiz başlar (31 TL); çevrimdışı ilerleme taşınmaz */
 };
 ws.onmessage=ev=>{
  let m;try{m=JSON.parse(ev.data)}catch(e){return}
  if(m.t==='auth'){done=true;clearTimeout(to);m.quiet=quiet;m.addr=addr}
  try{mpMsg(m)}catch(e){console.error('mp',e)}
 };
 ws.onerror=()=>{if(!done){done=true;clearTimeout(to);if(!quiet)mpStatus('Bağlantı kurulamadı. Adres ve sunucu açık mı kontrol et.',1);offSettle()}};
 ws.onclose=()=>{
  clearTimeout(to);
  if(MPL.ws!==ws)return;
  const was=MPL.authed,manual=MPL.manual,wasReady=MPL.ready;
  MPL.ws=null;MPL.authed=false;mpArenaReset();offSettle();mpChip();
  if(!manual&&was){
   if(wasReady&&!lobbyOn&&state!=='menu')toLobby();
   alert2('Sunucu bağlantısı koptu, yeniden deneniyor... (bu arada ilerleme kaydedilmez)');
   if(MPL.retry<12){MPL.retry++;setTimeout(()=>{if(!MPL.ws&&!MPL.manual)mpAuto()},5000)}
  }else if(!done&&!manual&&!quiet){done=true;mpStatus('Bağlantı kapandı.',1)}
 };
}
function mpAuto(){
 const st=mpLoad();
 const ad=st.addr||(/^https?:$/.test(location.protocol)?location.host:'');
 if(!st.tok||!st.name||!ad||MPL.ws){if(!MPL.ws)offSettle();return}
 mpConnect(mpNormAddr(ad),st.name,null,'token',true);
}
function alert2(t){const el=document.createElement('div');el.className='kfi';el.style.cssText='position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:60;font-size:16px';el.textContent=t;document.body.appendChild(el);setTimeout(()=>el.remove(),4000)}

/* ---------- Kayıt senkronu (hesap) ---------- */
function mpFlushSave(){
 if(!MPL.authed||MPL.reloading)return;
 if(MPL.q){clearTimeout(MPL.q);MPL.q=0}
 mpSend({t:'save',data:SV});
}
const _save0=save;
save=function(){
 _save0();
 if(!MPL.authed)return; /* çevrimdışı: hiçbir şey kaydedilmez, hesaba da gitmez */
 try{localStorage.setItem('mmofps_dirty','1')}catch(e){}
 if(!MPL.q)MPL.q=setTimeout(()=>{MPL.q=0;mpFlushSave()},4000);
};
function mpAdopt(m){ // sunucudaki kayıtla yereli karşılaştır
 const st=mpLoad(),same=st.adopted===m.name;
 let dirty='0';try{dirty=localStorage.getItem('mmofps_dirty')}catch(e){}
 let useServer=false;
 if(m.save&&m.ts){
  if(!same||OFFL.touched)useServer=true; /* çevrimdışı oynanan bellekteki durum hesaba asla gitmez */
  else if(m.ts>(st.sts||0)){
   useServer=dirty!=='1'||confirm('Sunucudaki kaydın daha yeni (başka bir yerden oynamışsın).\nTamam: sunucudaki kaydı yükle\nİptal: bu bilgisayardaki kaydı sunucuya yaz');
  }
 }
 const fresh=!m.save&&(!same||OFFL.touched); /* hesapta kayıt yok: 31 TL ile temiz başlangıç */
 if(useServer||fresh){
  try{if(!same)localStorage.setItem('mmofps_sv_backup',localStorage.getItem('mmofps_sv')||'');localStorage.setItem('mmofps_sv',JSON.stringify(fresh?SVDEF():m.save));localStorage.setItem('mmofps_dirty',fresh?'1':'0')}catch(e){}
  mpStore({adopted:m.name,sts:fresh?0:m.ts});
  MPL.reloading=true;if(MPL.q){clearTimeout(MPL.q);MPL.q=0}
  location.reload();return true;
 }
 mpStore({adopted:m.name});
 if(!m.save||dirty==='1')mpFlushSave();
 return false;
}
addEventListener('beforeunload',()=>{if(MPL.authed&&!MPL.reloading)try{MPL.ws.send(JSON.stringify({t:'save',data:SV}))}catch(e){}});

/* ---------- Uzak oyuncular ---------- */
function mpClearZ(){
 if(!MPL.zs)MPL.zs=new Map();
 for(const e of MPL.zs.values()){freeActor(e.g);const i=E.indexOf(e);if(i>=0)E.splice(i,1)}
 MPL.zs.clear();
 for(let i=E.length-1;i>=0;i--)if(E[i].zid){freeActor(E[i].g);E.splice(i,1)}
}
function mpAddZombie(s){
 const e=mkE('z',2,s[1],s[2]);e.zid=s[0];e.hp=e.max=s[4];e.tx=s[1];e.tz=s[2];e.tyaw=s[3];e.yaw=s[3];e.g.rotation.y=s[3];
 MPL.zs.set(s[0],e);return e;
}
function mpZHit(e,d,info){
 if(e.hp<=0)return;
 mpSend({...mpHitStamp(),t:'zhit',id:e.zid,w:wk,hd:!!(info&&info.head)});
 e.flinch=1;
 if(info&&info.player){if(info.pt)dmgNum(info.pt,d,info.head,false);if(!info.melee)snd(info.head?900:600,.08,.05)}
}
function mpClearEnts(){
 mpClearZ();
 for(const e of MPL.ents.values()){freeActor(e.g);const i=E.indexOf(e);if(i>=0)E.splice(i,1);if(e.tag)e.tag.remove()}
 MPL.ents.clear();
}
function mpTagLayer(){
 if(!MPL.tags){const d=document.createElement('div');d.id='mptags';$('hud').appendChild(d);MPL.tags=d}
 MPL.tags.style.display='block';return MPL.tags;
}
function mpAddRemote(info){
 if(MPL.ents.has(info.id))return MPL.ents.get(info.id);
 const w=WP[info.w]?info.w:'rifle';
 const rig=mkHuman(CHAR(info.ch),false);
 const md0=mpModOf(info.mods,w);
 holderSet(rig,w,SKIN((info.sk&&(md0&&info.sk['m:'+md0]||info.sk[w]))||'g0'),md0);
 rig.root.position.set(info.x,info.y,info.z);S.add(rig.root);setShadow(rig.root);
 const tag=document.createElement('div');tag.className='mpt'+((MPL.kind==='zo'||(MPL.kind==='tm'&&info.team===MPL.team))?' ally':'');tag.textContent=info.name;mpTagLayer().appendChild(tag);
 const tm=MPL.kind==='tm',e={rig,g:rig.root,ch:info.ch,kind:'r',team:(MPL.kind==='zo'||(tm&&info.team===MPL.team))?1:2,mods:info.mods||{},hp:info.hp==null?100:info.hp,max:100,mp:info.id,name:info.name,wk:w,sk:info.sk||{},
  flinch:0,vx:0,vz:0,yaw:info.yaw||0,pitch:0,tx:info.x,ty:info.y,tz:info.z,tyaw:info.yaw||0,fl:1,rq:-1,swU:-1,combo:0,ad:0,adsT:0,kR:0,kL:0,flash:0,flashL:0,ph0:Math.random()*10,tag};
 rig.root.userData={tg:1,e};
 if(e.hp<=0)rig.root.visible=false;
 E.push(e);MPL.ents.set(info.id,e);return e;
}
function mpModOf(mods,w){const c=w==='dual'?'pistol':w;return(mods&&mods[c]&&WMID[mods[c]]&&!WM_HIDE.has(mods[c]))?mods[c]:null}
function mpRemoveRemote(id){
 const e=MPL.ents.get(id);if(!e)return;
 freeActor(e.g);const i=E.indexOf(e);if(i>=0)E.splice(i,1);if(e.tag)e.tag.remove();MPL.ents.delete(id);
}
function mpStart(){ // setupMode içinden: maç başlarken
 mpClearEnts();
 for(const inf of MPL.info.values())mpAddRemote(inf);
 mpTagLayer();
 mpPlaceMe(true);p.pitch=0;p.vx=p.vz=0;p.hp=100;hudHp();
 $('msg').textContent='';mpBoardUI();
 WKEYS.forEach(k=>wa[k]=WP[k].mag||0);
}
/* kendi doğuş noktamız: 5v5'te harita noktaları (takım A/B), serbest arenada sunucunun verdiği nokta */
function mpPlaceMe(first){
 if(MPL.kind==='tm'&&typeof mapSpawn==='function'){
  const q=mapSpawn(MPL.team===2?2:1,first?(MPL.id%5):Math.floor(Math.random()*5));
  p.x=q.x;p.z=q.z;p.y=q.y;p.yaw=q.yaw;
 }else{const sp=MPL.spawn||{x:0,z:24};p.x=sp.x;p.z=sp.z;p.y=0;p.yaw=sp.z>0?0:Math.PI}
}
function mpBoardUI(){
 let b=$('mpb');
 if(!b){b=document.createElement('div');b.id='mpb';$('hud').appendChild(b)}
 b.style.display=mode==='mp'?'block':'none';
 const me=MPL.board.findIndex(r=>r[0]===MPL.id);
 b.innerHTML=(MPL.kind==='zo'?'<b>Zombi Co-op</b> · Dalga '+(MPL.wave||0):MPL.kind==='tm'?'<b>Takım '+(MPL.team===1?'A':'B')+'</b> · '+MPL.tk[MPL.team]+' - '+MPL.tk[MPL.team===1?2:1]+' · hedef '+MPL.limit:'<b>Sıralama</b> · hedef '+MPL.limit+' öldürme')+MPL.board.slice(0,MPL.kind==='tm'?10:6).map((r,i)=>'<div'+(r[0]===MPL.id?' class="me"':(MPL.kind==='tm'&&r[4]===MPL.team?' class="ally"':''))+'><span>'+(i+1)+'. '+r[1]+'</span><span>'+r[2]+' / '+r[3]+'</span></div>').join('');
 if(me>=0){kills=MPL.board[me][2];upd()}
}
function mpScoreText(){
 if(MPL.kind==='zo')return 'Dalga '+(MPL.wave||0)+' · Öldürme '+kills+' · Zombi '+(MPL.zs?MPL.zs.size:0);
 if(MPL.kind==='tm')return 'Biz '+(MPL.tk[MPL.team]||0)+' - '+(MPL.tk[MPL.team===1?2:1]||0)+' Onlar · Öldürme '+kills;
 const i=MPL.board.findIndex(r=>r[0]===MPL.id);
 return 'Öldürme '+kills+(i>=0?' · Sıra '+(i+1)+'/'+MPL.board.length:'');
}

/* ---------- Gelen mesajlar ---------- */
function mpLobbySlots(){
 if(typeof lobbySetSlot!=='function')return;
 const others=[...MPL.info.values()];
 MP_SLOTS.forEach((si,k)=>{
  const o=others[k];
  if(o)lobbySetSlot(si,{name:o.name,color:[0x2ee59d,0xffb020,0x27e0ff][k],w:o.w,sk:(o.sk&&o.sk[o.w])||'g0',ch:o.ch});
  else lobbySetSlot(si,null);
 });
}
function mpMsg(m){
 if(typeof chatMsgIn==='function'&&chatMsgIn(m))return;
 if(typeof ownMsg==='function'&&ownMsg(m))return;
 if(typeof admMsg==='function'&&admMsg(m))return;
 if(typeof lbjMsg==='function'&&lbjMsg(m))return; /* canlı blackjack */
 switch(m.t){
 case'auth':
  if(m.ok){
   MPL.authed=true;MPL.acct=m.name;MPL.retry=0;MPL.admin=!!m.admin;
   mpStore({name:m.name});if(!mpLoad().addr)mpStore({addr:m.addr});
   if(m.tok)mpStore({tok:m.tok});
   mpChip();if(typeof frAsk==='function'){frAsk();frRender()}
   if(mpAdopt(m))return;
   offSettle();
   if(mpDlg)mpDlg.classList.add('off');
   {const cb=MPL.cb;MPL.cb=null;if(cb)cb()}
  }else{
   if(m.quiet){mpStore({tok:null});mpChip()}
   mpStatus(m.err||'Giriş başarısız.',1);offSettle();
   if(m.quiet&&mpDlg===null){}
  }
  break;
 case'saved':mpStore({sts:m.ts});if(!MPL.q)try{localStorage.setItem('mmofps_dirty','0')}catch(e){}break;
 case'sfix': /* sunucu geçersiz kaydı reddetti (ör. çevrimdışı sınırsız para): hesaptaki kaydı yükle */
  try{localStorage.setItem('mmofps_sv',JSON.stringify(m.save||SVDEF()));localStorage.setItem('mmofps_dirty','0')}catch(e){}
  mpStore({sts:m.ts||0});MPL.reloading=true;if(MPL.q){clearTimeout(MPL.q);MPL.q=0}
  alert2('Çevrimdışı para hesaba geçemez. Hesabındaki kayıt yükleniyor...');setTimeout(()=>location.reload(),1500);break;
 case'kicked':MPL.manual=true;alert2('Bu hesapla başka yerden giriş yapıldı.');break;
 case'welcome':
  mpClockOffset=Number.isFinite(m.serverAt)?m.serverAt-Date.now():0;
  MPL.id=m.id;MPL.spawn=m.sp;MPL.limit=m.limit||20;MPL.ready=true;MPL.kind=m.kind||'ar';MPL.wave=m.wave||0;mpClearZ();MPL.team=m.team||0;MPL.tk=m.tk||{1:0,2:0};MPL.win=0;
  MPL.info.clear();for(const q of m.players)MPL.info.set(q.id,q);
  mpLobbySlots();
  {const cb=MPL.cb;MPL.cb=null;if(cb)cb()}
  break;
 case'err':alert2(m.m||'Hata');MPL.cb=null;break;
 case'join':
  MPL.info.set(m.p.id,m.p);
  if(mode==='mp'&&!lobbyOn)mpAddRemote(m.p);
  mpLobbySlots();
  if(!lobbyOn&&mode==='mp')alert2(m.p.name+' katıldı');
  break;
 case'leave':{
  const i=MPL.info.get(m.id);MPL.info.delete(m.id);mpRemoveRemote(m.id);mpLobbySlots();
  if(i&&!lobbyOn&&mode==='mp')alert2(i.name+' ayrıldı');
  break}
 case'board':MPL.board=m.b;mpBoardUI();break;
 case'wave':MPL.wave=m.w;mpClearZ();$('msg').textContent='Dalga '+m.w;setTimeout(()=>{if(mode==='mp')$('msg').textContent=''},1500);upd();break;
 case'zs':
  if(mode!=='mp'||MPL.kind!=='zo'||lobbyOn)break;
  for(const s of m.s){let e=MPL.zs.get(s[0]);if(!e)e=mpAddZombie(s);e.tx=s[1];e.tz=s[2];e.tyaw=s[3];e.hp=s[4];if(s[5]&&e.atk<=0)e.atk=.5}
  break;
 case'zd':{
  const e=MPL.zs.get(m.id);
  if(e){e.hp=0;MPL.zs.delete(m.id);spawnRagdoll(e.rig,V3(e.vx||0,0,e.vz||0),V3(m.x,1.3,m.z),V3(m.x-p.x,.3,m.z-p.z).normalize(),m.hd?7:5);e.rig.root.visible=false}
  if(m.by===MPL.id){score+=m.hd?200:100;stkKill(m.w);hitFlash('kill');snd(900,.1,.06)}
  upd();break}
 case'aimtop':
  if(state==='end'&&mode==='aim')$('res').innerHTML+='<br><br><b>Online Aim Sıralaması</b><br>'+m.top.map((r,i)=>(i+1)+'. '+r[0]+' — '+r[1]).join('<br>')+'<br>Senin en iyin: <b>'+m.me+'</b>';
  break;
 case'tk':MPL.tk=m.tk;mpBoardUI();upd();break;
 case'snap':
  for(const s of m.s){
   const id=s[0];if(id===MPL.id)continue;
   const inf=MPL.info.get(id);if(inf){inf.x=s[1];inf.y=s[2];inf.z=s[3];inf.yaw=s[4];inf.w=s[12]}
   const e=MPL.ents.get(id);if(!e||e.hp<=0)continue;
   e.tx=s[1];e.ty=s[2];e.tz=s[3];e.tyaw=s[4];e.pitch=s[5];e.pvx=s[6];e.pvz=s[7];e.fl=s[8];e.pq=s[9];e.psw=s[10];e.pcb=s[11];e.ad=s[13];
   if(WP[s[12]]&&e.wk!==s[12]){e.wk=s[12];const md1=mpModOf(e.mods,e.wk);holderSet(e.rig,e.wk,SKIN((md1&&e.sk['m:'+md1]||e.sk[e.wk])||'g0'),md1);e.swU=-1;e.rq=-1}
   if(e.psw>=0&&e.swU<0&&e.swGate!==true){e.swU=0;e.combo=e.pcb&3;e.grip=e.pcb>>2} // fx olayı kaçtıysa savuruşu başlat
   e.swGate=e.psw>=0; // aynı savuruş için tekrar başlatma
  }
  break;
 case'fx':{
  const e=MPL.ents.get(m.id);if(!e||e.hp<=0)break;
  if(m.k==='f'){
   if(m.side===2){e.kL=1;e.flashL=.05}else{e.kR=1;e.flash=.05}
   if(e.rig.W&&WP[m.w]){
    if(e.wk!==m.w){e.wk=m.w;const md2=mpModOf(e.mods,m.w);holderSet(e.rig,m.w,SKIN((md2&&e.sk['m:'+md2]||e.sk[m.w])||'g0'),md2)}
    muzzleWorld(e.rig,_mz,m.side===2?2:1);_mpt.set(m.pt[0],m.pt[1],m.pt[2]);tracer(_mz,_mpt);
   }
   if(Math.hypot(e.g.position.x-p.x,e.g.position.z-p.z)<45)snd(150,.06,.03);
  }else if(m.k==='s'){e.swU=0;e.combo=(m.cb|0)&3;e.grip=(m.cb|0)>>2;e.swGate=true;if(Math.hypot(e.g.position.x-p.x,e.g.position.z-p.z)<20)snd(220,.08,.03)}
  break}
 case'hp':
  if(m.id===MPL.id){
   const was=p.hp;p.hp=m.hp;hudHp();
   if(m.hp<was){snd(90,.1,.06);hurtFx()}
  }else{const e=MPL.ents.get(m.id);if(e){e.hp=m.hp;e.flinch=1}}
  break;
 case'die':{
  const vi=MPL.info.get(m.id),ki=MPL.info.get(m.by);
  const vn=m.id===MPL.id?'Sen':(vi?vi.name:'?'),kn=m.by===MPL.id?'Sen':m.by===0?'Zombi':(ki?ki.name:'?');
  killfeed(kn,vn,m.w,m.hd);
  const dir=V3(m.x-m.kx,.3,m.z-m.kz);if(dir.lengthSq()>1e-4)dir.normalize();else dir.set(0,.3,1);
  if(m.id===MPL.id){
   p.hp=0;hudHp();
   const h=pRigGet();
   if(h)pRagdoll=spawnRagdoll(h,V3(p.vx,0,p.vz),V3(m.kx,1.3,m.kz),dir,5);
   p.dead=999;$('msg').textContent='Öldün, 3 sn sonra doğarsın';firing=false;
  }else{
   const e=MPL.ents.get(m.id);
   if(e){e.hp=0;spawnRagdoll(e.rig,V3(e.pvx||0,0,e.pvz||0),V3(m.x,m.y+1.3,m.z),dir,m.hd?7:5);e.rig.root.visible=false;if(e.tag)e.tag.style.display='none'}
   if(m.by===MPL.id){score+=m.hd?200:150;stkKill(m.w);hitFlash('kill');snd(900,.1,.06)}
  }
  break}
 case'resp':
  if(m.id===MPL.id){
   p.x=m.x;p.z=m.z;p.y=0;if(MPL.kind==='tm')mpPlaceMe(false);p.vx=p.vz=0;p.vy=0;p.hp=100;p.dead=0;pRagdoll=null;hudHp();$('msg').textContent='';
   WKEYS.forEach(k=>wa[k]=WP[k].mag||0);ammo=cw.mag||0;reload=0;upd();
  }else{
   const e=MPL.ents.get(m.id);
   if(e){e.hp=100;e.tx=e.g.position.x=m.x;e.tz=e.g.position.z=m.z;e.ty=e.g.position.y=0;e.rig.root.visible=true;e.swU=-1;e.rq=-1;if(e.tag)e.tag.style.display=''}
  }
  break;
 case'fix':p.x=m.x;p.y=m.y;p.z=m.z;p.vx=p.vz=0;break;
 case'round':
  MPL.spawn={x:m.sps[MPL.id][0],z:m.sps[MPL.id][1]};if(m.tk)MPL.tk=m.tk;
  for(const e of MPL.ents.values()){e.hp=100;e.rig.root.visible=true;if(e.tag)e.tag.style.display=''}
  kills=0;score=0;shots=hits=0;if(MPL.kind==='zo'){MPL.wave=0;mpClearZ()}
  if(mode==='mp'&&(state==='play'||state==='pause'||state==='end')){
   mpPlaceMe(false);p.vx=p.vz=0;p.hp=100;p.dead=0;pRagdoll=null;hudHp();
   WKEYS.forEach(k=>wa[k]=WP[k].mag||0);ammo=cw.mag||0;reload=0;
   if(state==='end'){state='pause';pauseUI()}
   $('msg').textContent='Yeni tur!';setTimeout(()=>{if(mode==='mp')$('msg').textContent=''},1500);upd();
  }
  break;
 case'end':
  MPL.board=m.b;mpBoardUI();
  MPL.win=m.win;MPL.winName=m.name;MPL.winTeam=m.wt||0;if(m.tk)MPL.tk=m.tk;
  if(mode==='mp'&&state==='play')finish();
  break;
 }
}

/* ---------- Oyundan gönderilenler ---------- */
function mpFire(side,pt){mpShotId++;mpShotAt=0;mpSend({t:'fire',w:wk,side,x:+pt.x.toFixed(2),y:+pt.y.toFixed(2),z:+pt.z.toFixed(2)})}
function mpSwing(cb){mpShotId++;mpShotAt=0;mpSend({t:'sw',cb})}
function mpHit(e,d,info){
 if(e.hp<=0)return;
 mpSend({...mpHitStamp(),t:'hit',id:e.mp,w:wk,hd:!!(info&&info.head),m:!!(info&&info.melee)});
 e.flinch=1;
 if(info&&info.player){if(info.pt)dmgNum(info.pt,d,info.head,false);if(!info.melee)snd(info.head?900:600,.08,.05)}
}

/* ---------- Her karede ---------- */
const _mpv=V3(),_mpt=V3();
function mpUpdate(dt){
 if(!MPL.ready)return;
 // kendi durumumuzu yolla (20 Hz)
 MPL.sendT-=dt;
 if(MPL.sendT<=0){
  MPL.sendT=.05;
  const r=v=>Math.round(v*100)/100;
  mpSend({t:'st',sentAt:Date.now()+mpClockOffset,x:r(p.x),y:r(p.y),z:r(p.z),yaw:r(p.yaw),pitch:r(p.pitch),vx:r(p.vx),vz:r(p.vz),
   f:(p.g?1:0)|(p.cr&&p.g?2:0)|(p.slide>0?4:0)|(p.spr?8:0)|(p.glide?16:0)|(p.wjT>0?32:0)|(p.wr>0?64:p.wr<0?128:0)|(p.climb?256:0),w:wk,rq:reload>0?r(1-reload/cw.rel):-1,sw:swU>=0?r(swU):-1,cb:swCombo|((SET.grip|0)<<2),ad:r(adsT)});
 }
 if(p.dead>0&&p.dead<900){p.dead-=dt;if(p.dead<.05)p.dead=.05} // sunucunun 'resp' mesajını bekle
 const k=1-Math.exp(-14*dt);
 if(MPL.zs)for(const e of MPL.zs.values()){
  if(e.hp<=0)continue;
  const q=e.g.position,px=q.x,pz=q.z,k2=1-Math.exp(-12*dt);
  if(Math.hypot(e.tx-q.x,e.tz-q.z)>8)q.set(e.tx,0,e.tz);else{q.x+=(e.tx-q.x)*k2;q.z+=(e.tz-q.z)*k2}
  e.yaw=angLerp(e.yaw,e.tyaw,Math.min(1,8*dt));e.g.rotation.y=e.yaw;
  e.vx=(q.x-px)/Math.max(dt,.001);e.vz=(q.z-pz)/Math.max(dt,.001);
  if(e.atk>0)e.atk-=dt;e.flinch=Math.max(0,e.flinch-dt*4);
  const _pr=poseRate(e,q.x-p.x,q.z-p.z);
  if(_pr>0)animHuman(e.rig,{t:clock+e.ph0,speed:Math.hypot(e.vx,e.vz),fwd:1,pitch:0,lookYaw:Math.sin((clock+e.ph0)*1.3)*.3,flinch:e.flinch,atk:e.atk>0?1-e.atk/.5:0},dt*_pr);
 }
 for(const e of MPL.ents.values()){
  const q=e.g.position;
  if(e.hp<=0){continue}
  if(Math.hypot(e.tx-q.x,e.tz-q.z)>10){q.set(e.tx,e.ty,e.tz)}
  else{q.x+=(e.tx-q.x)*k;q.z+=(e.tz-q.z)*k;q.y+=(e.ty-q.y)*k}
  e.yaw=angLerp(e.yaw,e.tyaw,k);e.g.rotation.y=e.yaw+Math.PI;
  const w=WP[e.wk]||WP.rifle,vx=e.pvx||0,vz=e.pvz||0,spd=Math.hypot(vx,vz);
  const fx=-Math.sin(e.yaw),fz=-Math.cos(e.yaw);
  // şarjör: yerel zamanlayıcı + paketle hizalama
  if(e.pq>=0){e.rq=e.rq<0||Math.abs(e.pq-e.rq)>.35?e.pq:Math.min(1,e.rq+dt/(w.rel||1.5));e.rq+=(e.pq-e.rq)*.15}else e.rq=-1;
  // savuruş
  if(e.swU>=0){e.swU+=dt/Math.max(.25,w.rate);if(e.swU>=1)e.swU=-1}
  e.kR*=Math.pow(.0005,dt);e.kL*=Math.pow(.0005,dt);e.flash-=dt;e.flashL-=dt;e.flinch=Math.max(0,e.flinch-dt*4);
  e.adsT+=((w.melee?0:e.ad)-e.adsT)*Math.min(1,10*dt);
  const _pr=poseRate(e,q.x-p.x,q.z-p.z);
  if(_pr>0)
  animHuman(e.rig,{t:clock+e.ph0,speed:spd,fwd:(vx*fx+vz*fz)/Math.max(spd,.01),air:!(e.fl&1),crouch:(e.fl&2)?1:0,slide:!!(e.fl&4),sprint:!!(e.fl&8),glide:!!(e.fl&16),wj:(e.fl&32)?1:0,wallrun:(e.fl&64)?1:(e.fl&128)?-1:0,climb:!!(e.fl&256),lat:clamp(((e.pvx||0)*(-fz)+(e.pvz||0)*fx)/7,-1,1),crouch:(e.fl&2)?1:0,
   pitch:e.pitch||0,lookYaw:0,flinch:e.flinch,ads:e.adsT,kick:Math.max(e.kR,e.kL),kickR:e.kR,kickL:e.kL,
   swing:e.swU>=0?e.swU:null,combo:e.combo,grip:e.grip,rq:e.rq,sw:1,bob:clamp(spd/7,0,1)*((e.fl&1)?1:0),flash:e.flash,flashL:e.flashL,lr:0},dt*_pr);
  // isim etiketi
  if(e.tag){
   _mpv.set(q.x,q.y+2.2,q.z).project(cam);
   const d=Math.hypot(q.x-p.x,q.z-p.z);
   if(_mpv.z>1||_mpv.z<-1||d>70){e.tag.style.display='none'}
   else{e.tag.style.display='block';e.tag.style.left=((_mpv.x*.5+.5)*innerWidth)+'px';e.tag.style.top=((-_mpv.y*.5+.5)*innerHeight)+'px'}
  }
 }
}

(function(){
 const b=document.querySelector('.mode[data-m=mp]');
 if(b)b.addEventListener('click',()=>{if(!MPL.authed)mpOpenDialog()});
 mpChip();
 setTimeout(mpAuto,400);
})();
