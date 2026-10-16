'use strict';
/* ===== Ana döngü ve akış ===== */
/* ----- Fare güvenliği: pencere dışına çıkınca basılı kalan tuş/tık sıfırlanır; fare kilidi alınamazsa kenar-bakış devreye girer ----- */
const PL={fail:false,mx:0,my:0,hint:0};
function releaseInputs(){firing=false;ads=false;jHeld=false;jPress=false;sPress=false;qPress=false;jBuf=0;for(const k in key)key[k]=0;joy.x=joy.y=0;PL.mx=PL.my=0}
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
 /* ses sistemi ilk vuruşta değil maç başlarken (tıklamayla) açılsın: ilk hasarda yaşanan takılmayı önler */
 try{if(!ac)ac=new AudioContext();if(ac.state==='suspended')ac.resume()}catch(e){}
 if(typeof cmbReset==='function')cmbReset();
 if(selMode!=='ow'&&typeof loOpen==='function'&&!LO.ok){loOpen(()=>startMatch());return}
 if((selMode==='tdm'||selMode==='tm')&&typeof mapNeed==='function'&&mapNeed(()=>startMatch()))return;
 if((selMode==='mp'||selMode==='tm'||selMode==='zo')&&!MPL.ready){if(!MPL.authed)mpOpenDialog(()=>startMatch());else mpJoin(()=>startMatch());return}
 mode=(selMode==='tm'||selMode==='zo')?'mp':selMode;setLobby(false);begin();shaderWarm();resume()}
/* İlk ateşte/ilk efektte gölgelendirici (shader) derlemesi oyunu bir anlık donduruyordu: maç başlarken önceden derlenir */
function shaderWarm(){
 try{
  const g=new THREE.Group(),bx=new THREE.BoxGeometry(.01,.01,.01),tx=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1);
  const add=m=>g.add(new THREE.Mesh(bx,m));
  add(new THREE.MeshBasicMaterial({transparent:true}));
  add(new THREE.MeshBasicMaterial({transparent:true,side:THREE.DoubleSide}));
  add(new THREE.MeshBasicMaterial({map:tx,transparent:true,side:THREE.DoubleSide}));
  add(new THREE.MeshBasicMaterial({vertexColors:true}));
  add(new THREE.MeshLambertMaterial({transparent:true}));
  add(new THREE.MeshLambertMaterial({map:tx}));
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V3(),V3(0,.01,0)]),new THREE.LineBasicMaterial({transparent:true})));
  g.position.set(0,-80,0);S.add(g);R.compile(S,cam);S.remove(g);
 }catch(e){console.warn('shader ön derleme',e)}
}
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
/* Performans: botların/mobların/oyuncuların animasyonu fizik alt adımlarının içinde çağrılıyordu (60 FPS'te karede 2, 30 FPS'te 4 kez;
   düşük FPS'te iş yükü artıp FPS'i daha da düşürüyordu). Alt adımlar sırasında gelen animasyon istekleri biriktirilir,
   karede bir kez (son durum + toplam süre) uygulanır. */
const ANQ={on:false,m:new Map()};
const _anReal=animHuman;
animHuman=function(h,c,dt){
 if(ANQ.on&&h){const q=ANQ.m.get(h);if(q){q.c=c;q.dt+=dt}else ANQ.m.set(h,{c,dt});return}
 _anReal(h,c,dt);
};
function anqFlush(){
 ANQ.on=false;if(!ANQ.m.size)return;
 for(const [h,q] of ANQ.m){try{_anReal(h,q.c,q.dt)}catch(e){console.warn('animasyon',e)}}
 ANQ.m.clear();
}
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
  // 144 Hz gibi oranlarda yuvarlama hatası tam bir fizik adımını geciktirmesin.
  ANQ.on=true;
  try{while(accP+1e-10>=FIX_DT&&state==='play'&&nSub<8){p.ox=p.x;p.oy=p.y;p.oz=p.z;stepPlayer(FIX_DT);accP=Math.max(0,accP-FIX_DT);nSub++}}
  finally{anqFlush()}
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
let _loopErrN=0,shLast=0;
function loopErr(e){
 _loopErrN++;
 if(_loopErrN<=3||_loopErrN%600===0)console.error('Oyun döngüsü hatası (#'+_loopErrN+'):',e);
 if(_loopErrN===1){const m=$('msg');if(m){m.textContent='Bir hata oluştu ama oyun devam ediyor. Sorun sürerse F12 > Console ekran görüntüsünü gönder.';setTimeout(()=>{if(m.textContent.indexOf('Bir hata')===0)m.textContent=''},6000)}}
}
function loop(now){
 requestAnimationFrame(loop);
 if(fpsSkip(now))return;
 fpsTick(now);
 const dt=Math.min(.05,(now-last)/1000);last=now;
 if(lobbyOn){clock+=dt;ecoLoop(dt);lobbyUpdate(dt);R.shadowMap.autoUpdate=true;R.render(LS,LC);return}
 /* güvenlik: oyun mantığında bir hata çıksa bile çizim sürer, ekran donmaz; hata konsola ve bir kez ekrana yazılır */
 try{tick(dt)}catch(e){loopErr(e)}
 /* gölge açıksa gölge haritası saniyede en fazla 60 kez yenilenir (500 FPS'te her karede yeniden çizmek boşa iş) */
 if(typeof glbCullPass==='function')glbCullPass();
 if(R.shadowMap.enabled){R.shadowMap.autoUpdate=false;if(now-shLast>=16){shLast=now;R.shadowMap.needsUpdate=true}}
 R.render(S,cam);
}
requestAnimationFrame(loop);
