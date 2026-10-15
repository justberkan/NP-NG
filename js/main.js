'use strict';
/* ===== Ana döngü ve akış ===== */
/* ----- Fare güvenliği: pencere dışına çıkınca basılı kalan tuş/tık sıfırlanır; fare kilidi alınamazsa kenar-bakış devreye girer ----- */
const PL={fail:false,mx:0,my:0,hint:0};
function releaseInputs(){firing=false;ads=false;jHeld=false;jPress=false;for(const k in key)key[k]=0;joy.x=joy.y=0;PL.mx=PL.my=0}
addEventListener('blur',releaseInputs);
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseInputs()});
document.documentElement.addEventListener('mouseleave',()=>{PL.mx=PL.my=0;firing=false;ads=false});
addEventListener('mousemove',e=>{PL.mx=e.clientX/innerWidth*2-1;PL.my=e.clientY/innerHeight*2-1});
document.addEventListener('pointerlockerror',()=>{
 PL.fail=true;
 if(state==='play'&&$('msg')&&!PL.hint){PL.hint=1;$('msg').textContent='Fare kilitlenemedi: bakmak için fareyi ekranın kenarlarına doğru götür. Tıklayınca tekrar denenir.';setTimeout(()=>{if(state==='play'&&mode!=='zom')$('msg').textContent=''},5000)}
});
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement){PL.fail=false;PL.hint=0}});
addEventListener('mousedown',()=>{
 if(state==='play'&&!touch&&!document.pointerLockElement&&!(mode==='ow'&&AUTO.on))try{$('c').requestPointerLock()}catch(e){}
},true);
function edgeLook(dt){
 const dz=v=>Math.abs(v)<.15?0:v-Math.sign(v)*.15;
 p.yaw-=dz(PL.mx)*dt*3.2*SET.sens;
 p.pitch=clamp(p.pitch-dz(PL.my)*dt*2.2*SET.sens*(SET.invY?-1:1),-1.5,1.5);
}
function setLobby(on){
 if(typeof cmbReset==='function')cmbReset();
 lobbyOn=on;
 if(on)LO.ok=false;
 if(typeof loSync==='function')loSync();
 $('lb').classList.toggle('off',!on);
 $('hud').classList.toggle('off',on);
 $('tc').style.display=on?'none':'';
 if(on){$('ov').classList.add('off');view(curView||'home')}
}
function pauseUI(){
 $('ttl').textContent='Duraklatıldı';$('sub').textContent='';$('res').innerHTML='';$('play').textContent='DEVAM';
 $('autob').classList.toggle('off',mode!=='ow');
 $('help').innerHTML=mode==='ow'?'F: otomatik savaş aç/kapat · M: harita · H: ilk yardım<br>'+HELP:HELP;
 $('igsb').classList.remove('off');igsOpen(false);
 $('ov').classList.remove('off');
}
function resume(){state='play';igsOpen(false);$('ov').classList.add('off');if(!touch&&!(mode==='ow'&&AUTO.on))try{$('c').requestPointerLock()}catch(e){}}
function startMatch(){
 if(typeof cmbReset==='function')cmbReset();
 if(selMode!=='ow'&&typeof loOpen==='function'&&!LO.ok){loOpen(()=>startMatch());return}
 if((selMode==='tdm'||selMode==='tm')&&typeof mapNeed==='function'&&mapNeed(()=>startMatch()))return;
 if((selMode==='mp'||selMode==='tm'||selMode==='zo')&&!MPL.ready){if(!MPL.authed)mpOpenDialog(()=>startMatch());else mpJoin(()=>startMatch());return}
 mode=(selMode==='tm'||selMode==='zo')?'mp':selMode;setLobby(false);begin();resume()}
$('autob').onclick=()=>{if(mode==='ow'){toggleAuto(true);resume()}};
function toLobby(){
 if(mode==='ow'&&OW.on)owExit();
 if(mode==='mp')mpQuit();
 state='menu';if(document.exitPointerLock)try{document.exitPointerLock()}catch(e){}
 firing=false;ads=false;setLobby(true);bal();
}
$('go').onclick=startMatch;
$('play').onclick=()=>{if(state==='pause')resume();else startMatch()};
$('lob').onclick=()=>{igsOpen(false);toLobby()};
$('igsb').onclick=()=>igsOpen($('igs').classList.contains('off'));
document.addEventListener('pointerlockchange',()=>{
 if(!touch&&document.pointerLockElement!==$('c')&&state==='play'&&!(mode==='ow'&&AUTO.on)){state='pause';pauseUI()}
});
addEventListener('keydown',e=>{if(e.code==='Escape'&&state==='play'&&mode==='ow'&&AUTO.on){state='pause';pauseUI()}});
const HELP=touch?'Sol: hareket · Sağ: bakış · KANCA, KAY, ZIPLA düğmeleri':'WASD hareket · Fare bakış · Sol tık ateş · Sağ tık nişan · R şarjör · 1-7 silah · V üçüncü şahıs<br>Ctrl/C basılı: eğil (koşarken basınca: kay) · Space zıpla/çift zıpla · Q kanca · Duvara doğru zıpla: sekme<br>Shift basılı: hızlan (Naruto koşusu) · Space basılı tut: otomatik bhop (havada A/D + fareyi aynı yöne çevir: hız kazanırsın) · Yüksekten düşerken Space basılı: süzül · Havada W ile duvara: tırman<br>Enter: yazılı sohbet · B: bas-konuş (🎤 düğmesinden aç) · Açık dünyada sınıf düğmesi: Savaşçı/Ninja/Şifacı/Tank';
$('help').innerHTML=HELP;

function boot(){
 ensureSV();
 initVM();
 initLobby3D();
 initUI();
 if(typeof mapSelUI==='function')mapSelUI();
 if(touch)initTouch();
 resize();
 applyAll();
 applyEq(false);
 document.querySelectorAll('.mode').forEach(b=>b.classList.toggle('sel',b.dataset.m===selMode));
 setLobby(true);
 save();
}
boot();

const FIX_DT=1/120;let accP=0;
let last=performance.now();
/* Mantık adımı: çizimden bağımsız (arka plan simülasyonu da bunu kullanır) */
function tick(dt){
 if(hitStopT>0&&!window.BGMODE){hitStopT-=dt;dt*=.12}
 if(slowT>0&&!window.BGMODE){slowT-=dt;dt*=.3}
 clock+=dt;ecoLoop(dt);
 moveTargets(clock,dt);
 if(state==='play'){
  /* Sabit zaman adımı: fizik her zaman 1/120 sn'lik adımlarla işlenir (FPS'ten bağımsız hız, zıplama, bhop) */
  accP+=dt;let nSub=0;
  while(accP>=FIX_DT&&state==='play'&&nSub<8){p.ox=p.x;p.oy=p.y;p.oz=p.z;stepPlayer(FIX_DT);accP-=FIX_DT;nSub++}
  if(nSub>=8)accP=0;
 }else{accP=0;if(mode==='mp')mpUpdate(dt)}
 if(state==='play'&&!touch&&!document.pointerLockElement&&PL.fail)edgeLook(dt);
 updTracers(dt);updProps(dt);updRags(dt);
 /* kamera ara kare yumuşatma: fizik 120 Hz, ekran farklı hızdaysa son iki fizik adımı arasında çiz (takılma hissi gider) */
 if(state==='play'&&p.ox!=null&&!window.BGMODE&&Math.abs(p.x-p.ox)+Math.abs(p.y-p.oy)+Math.abs(p.z-p.oz)<2){
  const a=clamp(accP/FIX_DT,0,1),rx=p.x,ry=p.y,rz=p.z;
  p.x=lerp(p.ox,rx,a);p.y=lerp(p.oy,ry,a);p.z=lerp(p.oz,rz,a);
  try{updPlayerView(dt)}finally{p.x=rx;p.y=ry;p.z=rz}
 }else updPlayerView(dt);
 cam.updateMatrixWorld();
 if(window.BGMODE)S.updateMatrixWorld();
 updDn(dt);cmbTick(dt);
 if(mode==='ow'&&!window.BGMODE){owVisual(dt);skVisual(dt)}
}
function loop(now){
 requestAnimationFrame(loop);
 if(fpsSkip(now))return;
 fpsTick(now);
 const dt=Math.min(.05,(now-last)/1000);last=now;
 if(lobbyOn){clock+=dt;ecoLoop(dt);lobbyUpdate(dt);R.render(LS,LC);return}
 tick(dt);
 R.render(S,cam);
}
requestAnimationFrame(loop);
