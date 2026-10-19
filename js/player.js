'use strict';
/* ===== Oyuncu: hareket (kayma, tırmanma, duvar sekme/koşma, kanca), girdi, kamera, görünür model ===== */
const ST=2.5,SPD=.75; // hız ölçeği (1 = eski, çok hızlı)
const HOP_CAP=11.5,BH_GRACE=.1;
const AIR={acc:80,cap:1.8,ignoreW:true}; // hava strafe: ivme (m/s²), yan hız sınırı (m/s) // bhop: zıplama anında en yüksek yatay hız (m/s). Havadaki strafe sınırı 13.5 kalır
const p={x:0,y:0,z:20,vy:0,vx:0,vz:0,yaw:0,pitch:0,g:true,slide:0,st:ST,wcd:0,wj:0,dj:0,climb:0,eye:1.6,hp:100,dead:0};
let wk=null,cw=WP.rifle,ammo=30,reload=0,fireCd=0,kickL=0,kickR=0,flashR=0,flashL=0,ads=false,adsT=0,swU=-1,swHit=false,swCombo=0,comboT=0,swT=1,tp=false,dualSide=0,pRagdoll=null;
const wa={};
let jBuf=0,firing=false,jHeld=false,jPress=false,sPress=false,qPress=false,lastSpd='',lastSt=-1;
let gr=null,grCd=0,lastCh=1;
const gv=V3();
const grLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([V3(),V3()]),new THREE.LineBasicMaterial({color:0xffb020}));
grLine.frustumCulled=false;grLine.visible=false;S.add(grLine);

/* ----- Görünür modeller: birinci şahıs kollar + üçüncü şahıs gövde ----- */
const VM={root:null,h:null};
let pRigObj=null;
function charCols(){return CHAR(chWithKit(SV.eq.c))}
function initVM(){
 if(VM.root)cam.remove(VM.root);
 VM.root=new THREE.Group();VM.root.rotation.y=Math.PI;cam.add(VM.root);
 VM.h=mkHolder(VM.root,V3(0,-.17,0),V3(-.3,-.34,-.2),V3(.3,-.34,-.2),charCols(),true);VM.h.optOn=true;
 if(wk)holderSet(VM.h,wk,undefined,modId(wk));
}
function pRigGet(){
 if(!pRigObj){
  pRigObj=mkHuman(charCols(),false);pRigObj.optOn=true;
  pRigObj.root.visible=false;S.add(pRigObj.root);setShadow(pRigObj.root);
  holderSet(pRigObj,wk||SV.eq.w,undefined,modId(wk||SV.eq.w));
 }
 return pRigObj;
}
function rebuildPlayerModels(){
 if(pRigObj){S.remove(pRigObj.root);pRigObj=null}
 initVM();
}

/* ----- Girdi ----- */
function togglePause(){
 if(state==='play'){state='pause';pauseUI()}
}
addEventListener('keydown',e=>{
 key[e.code]=1;
 if(state!=='play')return;
 if(mode==='ow'){
  const dg=[0,1,2,3,4].find(i=>kMatch(e,'sk'+(i+1)));
  if(dg!=null){if(!e.repeat)skCast(dg);return}
  if(kMatch(e,'dash')&&!e.repeat){skDash();return}
  if(kMatch(e,'interact')&&!e.repeat){owInteract();return}
  if(kMatch(e,'wNext')&&!e.repeat){const L=wList(),i=L.indexOf(wk);setW(L[(i+1)%L.length]);return}
  if(kMatch(e,'auto')&&!e.repeat){toggleAuto();return}
  if(kMatch(e,'map')&&!e.repeat){toggleMap();return}
  if(kMatch(e,'med')&&!e.repeat){owMed();return}
  if(AUTO.on&&(kMatch(e,'fwd')||kMatch(e,'back')||kMatch(e,'left')||kMatch(e,'right')||kMatch(e,'jump')))toggleAuto(false);
 }
 if(kMatch(e,'reload'))startReload();
 const wi=[0,1,2,3,4,5,6].find(i=>kMatch(e,'slot'+(i+1)));
 if(wi!=null){const kk=LO.on?LO.keys[wi]:WKEYS[wi];if(kk)setW(kk)}
 if(kMatch(e,'tp')&&mode!=='cmp'&&!(mode==='mp'&&MPL.kind==='tm'))tp=!tp;
 if(kMatch(e,'grip')&&!e.repeat&&cw.melee&&cw.hold!=='gsword'){const ok=cw.hold==='knife'?[0,1]:[0,1,2];SET.grip=ok[(ok.indexOf(SET.grip)+1)%ok.length]||0;saveSet();const gm=$('msg');if(gm){gm.textContent='Tutuş: '+['Düz (tek el)','Ters (tek el)','Çift el'][SET.grip];setTimeout(()=>{if(gm.textContent.indexOf('Tutuş')===0)gm.textContent=''},1200)}}
 if(kMatch(e,'jump')){e.preventDefault();if(!e.repeat)jPress=true;jHeld=true}
 if(kMatch(e,'crouch')&&!e.repeat){sPress=true;e.preventDefault()}
 if(kMatch(e,'hook')&&!e.repeat)qPress=true;
});
addEventListener('keyup',e=>{key[e.code]=0;if(typeof kMatch==='function'&&kMatch(e,'jump'))jHeld=false});
addEventListener('mousemove',e=>{
 if(state==='play'&&document.pointerLockElement){
  mouseLook(e.movementX,e.movementY);
 }
});
addEventListener('mousedown',e=>{
 if(state!=='play')return;
 if(AUTO.on&&mode==='ow'&&document.pointerLockElement)toggleAuto(false);
 if(e.button===0)firing=true;
 if(e.button===2&&!cw.melee)ads=true;
});
addEventListener('mouseup',e=>{if(e.button===0)firing=false;if(e.button===2)ads=false});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('wheel',e=>{
 if(state!=='play')return;
 const L=wList(),i=L.indexOf(wk);setW(L[(i+(e.deltaY>0?1:L.length-1)+L.length)%L.length]);
},{passive:true});

function wList(){return mode==='ow'?swOwned():(LO.on?LO.keys:WKEYS)}
/* ----- Hareket yardımcıları ----- */
/* Duvarda koşma (yumuşak): hız birden değil WR_BLEND hızında duvara paralele döner, koşu hızı korunur,
   yerçekiminin WR_GRAV kadarı kesilir (yavaş alçalış), duvara hafifçe tutunur. */
const WR_BLEND=5,WR_GRAV=.8,WR_MIN=6.5,WR_FALL=-2.5,WR_UP=1.2;
function wallSide(w,sn,cs){ /* duvar sağda mı solda mı: +1 sağ, -1 sol, 0 önde/arkada */
 const rx=cs,rz=-sn,d=rx*-w.nx+rz*-w.nz;return d>.6?1:d<-.6?-1:0}
function wallrun(w,sn,cs,dt){
 let tx=-w.nz,tz=w.nx;
 const hs=Math.hypot(p.vx,p.vz),fx=-sn,fz=-cs;
 /* koşu yönü: mevcut hız yönü (yoksa bakış yönü) */
 if((hs>1?p.vx*tx+p.vz*tz:fx*tx+fz*tz)<0){tx=-tx;tz=-tz}
 const r=Math.max(WR_MIN*SPD*1.2,Math.min(13*SPD,hs)),k=Math.min(1,WR_BLEND*dt);
 p.vx+=(tx*r-w.nx*.4-p.vx)*k;p.vz+=(tz*r-w.nz*.4-p.vz)*k;
 p.vy+=22*WR_GRAV*dt; /* yerçekiminin çoğunu kes */
 if((p.wrT||0)<.25&&p.vy<0)p.vy+=-p.vy*Math.min(1,12*dt); /* duvara tutununca ilk anda düşüş durur (geç girişte de koşulabilir) */
 if(p.vy<WR_FALL)p.vy+=(WR_FALL-p.vy)*Math.min(1,6*dt);
 if(p.vy>WR_UP)p.vy+=(WR_UP-p.vy)*Math.min(1,5*dt); /* girişteki zıplama hızı çabuk söner: süzülme değil koşu */
 return true;
}
function probe(){const d=.25;for(const[a,c]of[[d,0],[-d,0],[0,d],[0,-d]]){const b=hitBox(p.x+a,p.z+c,p.y);if(b)return{nx:-Math.sign(a),nz:-Math.sign(c),b}}return null}
function relG(){grCd=gr&&gr.t>=1?3:0;gr=null;grLine.visible=false}
function grapple(){
 if(grCd>0||gr)return;
 rc.setFromCamera({x:0,y:0},cam);rc.far=60;
 const mobs=[];for(const e of E)if(e.hp>0&&e.g&&e.g.visible&&e.team===2&&!e.boss&&!e.mp)mobs.push(e.g);
 const h=rc.intersectObjects(boxMeshes.concat(floor,T.filter(t=>t.visible),mobs,(OW.on&&OW.canopy)||[]),true)[0];
 let gp=h?h.point:null,gd=h?h.distance:1e9,en=null;
 if(h){let o=h.object;while(o&&!o.userData.tg)o=o.parent;if(o&&o.userData.e&&o.userData.e.hp>0&&!o.userData.e.net&&!o.userData.e.boss&&!o.userData.e.mp)en=o.userData.e}
 if(OW.on){const q=owGroundRay(rc.ray,60);if(q<gd&&q<=60){gp=rc.ray.at(q,V3());gd=q;en=null}}
 rc.far=100;
 if(!gp){grCd=.5;return}
 gr={pt:gp.clone(),t:0,d0:gd,on:0,L:0,en};grLine.visible=true;snd(500,.1);
}
/* Kanca bir moba/düşmana tutunduysa: onu kendimize çeker, sersemletir */
function grabStep(dt){
 const e=gr.en;
 if(!e||e.hp<=0||!e.g.visible||e.net){relG();return}
 gr.pt.set(e.g.position.x,e.g.position.y+1.1,e.g.position.z);
 if(!gr.on){if(gr.t*100>=gr.d0){gr.on=1;gr.pull=0;snd(180,.1,.05)}return}
 gr.pull+=dt;
 const ex=e.mob?e.x:e.g.position.x,ez=e.mob?e.z:e.g.position.z,dx=p.x-ex,dz=p.z-ez,d=Math.hypot(dx,dz)||.01;
 if(d<2.4||gr.pull>1.1){
  /* varış: kısa sersemletme + hafif hasar */
  if(e.mob){e.stun=Math.max(e.stun||0,1.6);e.atk=0;if(e.ring)e.ring.visible=false}
  else{e.flinch=1;e.cd=Math.max(e.cd||0,1.2);e.stun=1.2}
  _grDir.set(-dx/d,0,-dz/d);
  damageEnemy(e,12,{player:true,pt:V3(e.g.position.x,e.g.position.y+1.2,e.g.position.z),dir:_grDir.clone(),head:false,melee:true,power:3});
  snd(120,.12,.07);camKick&&camKick(.03);
  grCd=1.2;gr=null;grLine.visible=false;return;
 }
 const s=Math.min(d-2.1,24*dt);
 if(e.mob&&typeof mstep==='function'){mstep(e,dx/d*s,dz/d*s);e.g.position.set(e.x,owH(e.x,e.z),e.z)}
 else{e.g.position.x+=dx/d*s;e.g.position.z+=dz/d*s}
 e.vx=e.vz=0;if(e.mob){e.stun=Math.max(e.stun||0,.4);e.atk=0}else e.stun=Math.max(e.stun||0,.3);
}
const _grDir=V3();

/* ----- Çarpışma: basamak / kenar yardımı + sıkışınca dışarı çıkabilme ----- */
const STEP_G=.45,STEP_AIR=.75,CROUCH_SPD=.5,CROUCH_EYE=1.1; // yerde otomatik çıkılan basamak, havada üstüne tırmanılan kenar yüksekliği (m)
function canMove(nx,nz){
 const b=hitBox(nx,nz,p.y);if(!b)return true;
 const bh=b.h,isBox=b.x1!=null,up=bh-p.y; /* harita (dust2/MC) çarpışması paylaşılan nesne döndürür: değerleri önce kopyala */
 if(up>0&&up<=(p.g?STEP_G:STEP_AIR)&&!(gr&&gr.on)&&!(MC.cur&&mcCeil(nx,nz,bh)<bh+1.8)&&!hitBox(nx,nz,bh)){p.y=bh;if(p.vy<0)p.vy=0;return true}
 /* zaten kutunun kenar şeridindeysek: içeri değil dışarı doğru gitmeye izin ver */
 if(isBox){const c=hitBox(p.x,p.z,p.y);if(c===b&&boxPen(b,nx,nz)<boxPen(b,p.x,p.z))return true}
 /* yükselirken zıplamayla aşılabilecek kenara çarptıysan hızı sıfırlama: birkaç kare sonra üstüne çıkınca hız korunur */
 canMove.keep=!p.g&&p.vy>0&&up>0&&up<=1.3;
 return false;
}
/* ----- Oyuncu adımı ----- */
function stepPlayer(dt){
 timeLeft-=dt;if(timeLeft<=0){timeLeft=0;upd();finish();return}
 const dead=p.dead>0;let auto=AUTO.on&&mode==='ow';
 if(mode==='ow'){skUpdate(dt);comboT-=dt}
 if(auto&&touch&&(Math.abs(joy.x)>.25||Math.abs(joy.y)>.25)){toggleAuto(false);auto=false}
 if(auto)autoDrive(dt);
 let mx=dead?0:(kDown('right')?1:0)-(kDown('left')?1:0)+joy.x,mz=dead?0:(kDown('fwd')?1:0)-(kDown('back')?1:0)-joy.y;
 if(auto){mx=0;mz=0}
 if(SK.chain&&mode==='ow'){mx=0;mz=0}
 if(dead){jPress=sPress=qPress=false}
 const l=Math.hypot(mx,mz);if(l>1){mx/=l;mz/=l}
 const sn=Math.sin(p.yaw),cs=Math.cos(p.yaw);
 let wx=mx*cs-mz*sn,wz=-mx*sn-mz*cs;const wall=probe();
 /* duvarda koşmaya uygun mu (havada, yan duvar, o yönün tuşu basılı): öyleyse hava strafe'i devre dışı, yoksa koşuyu geri çeker */
 const wsd0=wall&&!p.g?wallSide(wall,sn,cs):0,wrTry=wsd0!==0&&(wsd0>0?(kDown('right')||joy.x>.3):(kDown('left')||joy.x<-.3));
 if(auto&&!dead){wx=aiIn.wx;wz=aiIn.wz}
 if(SK.chain&&mode==='ow'){wx=wz=0}
 /* eğilme: Ctrl / C basılı tut. Koşarken (6,2 m/s üstü) basınca kayma olur */
 const crK=!dead&&!auto&&kDown('crouch');
 p.cr=crK&&p.slide<=0?1:0;
 if(!p.cr&&p.g&&MC.cur&&mcCeil(p.x,p.z,p.y)<p.y+1.8)p.cr=1; /* tavan alçaksa ayağa kalkamaz */
 if(sPress&&!gr&&p.g&&p.slide<=0){const h=Math.hypot(p.vx,p.vz);if(h>6.2){p.cr=0;const s=Math.min(15*SPD,Math.max(h,7*SPD)*1.5);p.vx*=s/h;p.vz*=s/h;p.slide=1.2;snd(80,.2)}}
 if(gr&&(sPress||mz<-.5))relG();
 sPress=false;
 /* hızlanma (koş): Shift basılı ya da İlahî Hız aktifken ileri gidiyorsan */
 const shiftSpr=kDown('sprint'),godSpr=mode==='ow'&&SK.act.godspeed>0;
 p.spr=!dead&&!auto&&!p.cr&&p.slide<=0&&mz>.3&&(shiftSpr||godSpr)&&!firing&&!ads&&!gr&&swU<0&&p.g?1:(p.spr&&!p.g&&!dead&&mz>.3&&(shiftSpr||godSpr)&&!firing?1:0);
 const sprMul=p.spr&&shiftSpr?1.4:1;
 jBuf-=dt;if(jPress)jBuf=.14; // zıplama tamponu (bhop)
 /* bhop: zıplama tamponu ya da Space basılı tutma (otomatik bhop, Ayarlar > Oyun) */
 const bh=p.g&&(jBuf>0||(jHeld&&SET.autoHop!==false&&!auto))&&!gr&&!dead&&p.slide<=0;
 p.landT=p.g?(p.landT||0)+dt:0;
 if(bh){jPress=true;p.wj=0;p.dj=0}
 if(p.g&&!(gr&&gr.on)&&!bh){
  if(p.slide>0){p.slide-=dt;const f=Math.pow(.4,dt);p.vx=p.vx*f+wx*3*dt;p.vz=p.vz*f+wz*3*dt;if(Math.hypot(p.vx,p.vz)<2.7)p.slide=0}
  else if(!(SK.dT>0)){const sm=7*SPD*(mode==='ow'?skMove():1)*sprMul*(p.cr?CROUCH_SPD:1);
   /* iniş toleransı: inişten sonraki BH_GRACE sn içinde koşu hızının üstündeki hız sürtünmeyle silinmez (geç basılan bhop affedilir) */
   if(p.landT<BH_GRACE&&Math.hypot(p.vx,p.vz)>sm){}
   else{AthleticMotion.ground(p,wx,wz,sm,dt,!!p.spr)}}
  p.st=Math.min(ST,p.st+dt*1.5);p.wj=0;p.dj=0;p.climb=0;
 }else{
  p.slide=0;const s0=Math.hypot(p.vx,p.vz);
  const sMx=7*SPD*(mode==='ow'?skMove():1)*sprMul;
  /* düz hava kontrolü sadece A/D basılı değilken: A/D varken hızı strafe yönüne çevirip bhop kazancını yok ediyordu */
  if(wrTry){}else if(mx===0||(gr&&gr.on)||SK.dT>0||dead){p.vx+=wx*12*dt;p.vz+=wz*12*dt;
  const s1=Math.hypot(p.vx,p.vz),cap=Math.max(sMx,s0);if(s1>cap&&!(SK.dT>0)){p.vx*=cap/s1;p.vz*=cap/s1}}
  /* hava strafe (Quake tarzı): A/D + fareyi o yöne çevirerek hız kazanılır → bhop / tap-strafe */
  if(mx!==0&&!wrTry&&!(gr&&gr.on)&&!dead&&!(SK.dT>0)){
   /* W basılıysa bile havada sadece A/D yönü sayılır (W+A ile strafe atan da hız kazanır) */
   const ax=AIR.ignoreW?mx*cs:wx,az=AIR.ignoreW?-mx*sn:wz;
   const wl=Math.hypot(ax,az)||1,ux=ax/wl,uz=az/wl,cur=p.vx*ux+p.vz*uz,add=Math.min(AIR.cap-cur,AIR.acc*dt);
   if(add>0){p.vx+=ux*add;p.vz+=uz*add}
   const hs=Math.hypot(p.vx,p.vz),mxs=13.5;if(hs>mxs){p.vx*=mxs/hs;p.vz*=mxs/hs}
  }
 }
 if(auto&&aiIn.jump&&!dead){jPress=true;jHeld=true;AUTO.jh=.45}
 if(jPress){
  if(p.g){
   /* bhop sınırı: zıplama anında yatay hız HOP_CAP'i aşamaz (art arda zıplayarak sınırsız hız birikmez) */
   const hs0=Math.hypot(p.vx,p.vz);if(hs0>HOP_CAP){p.vx*=HOP_CAP/hs0;p.vz*=HOP_CAP/hs0}
   p.vy=7.5;p.g=false;p.at=0;jBuf=0;if(p.slide>0){p.slide=0;p.vx*=1.1;p.vz*=1.1}}
  else if(wall&&p.wcd<=0&&p.wj<3&&p.st>.3){p.vx=(wall.nx*8-sn*4)*SPD;p.vz=(wall.nz*8-cs*4)*SPD;p.vy=7.6;p.wcd=.3;p.wj++;p.wjT=.5;p.st-=.3;p.climb=0;snd(300,.1)}
  else if(!p.dj){p.dj=1;p.wjT=.5;p.vy=7.5;p.vx+=wx*3;p.vz+=wz*3;snd(260,.1)}
 }
 jPress=false;p.wcd-=dt;
 if(qPress){qPress=false;if(!gr)grapple()}
 if(gr&&gr.en){gr.t+=dt;grabStep(dt)}
 else if(gr){
  gr.t+=dt;
  if(!gr.on){if(gr.t*100>=gr.d0){gr.on=1;gr.L=Math.hypot(gr.pt.x-p.x,gr.pt.y-p.y-1,gr.pt.z-p.z)}}
  else{
   const gx=gr.pt.x-p.x,gh=gr.pt.y-p.y-1,gz=gr.pt.z-p.z,d=Math.hypot(gx,gh,gz)||.01,ux=gx/d,uy=gh/d,uz=gz/d;
   if(d<2.2)relG();
   else{
    gr.L=Math.max(2,Math.min(gr.L,d)-12*dt);
    const ka=22*dt;p.vx+=ux*ka;p.vy+=uy*ka+8.8*dt;p.vz+=uz*ka;
    if(d>=gr.L){const vr=p.vx*ux+p.vy*uy+p.vz*uz;if(vr<0){p.vx-=ux*vr;p.vy-=uy*vr;p.vz-=uz*vr}}
    const sp=Math.hypot(p.vx,p.vy,p.vz);if(sp>22){const k=22/sp;p.vx*=k;p.vy*=k;p.vz*=k}
    p.g=false;p.slide=0;
   }
  }
 }
 grCd-=dt;
 canMove.keep=false;const nx=p.x+p.vx*dt;if(canMove(nx,p.z))p.x=nx;else if(!canMove.keep)p.vx=0;
 canMove.keep=false;const nz=p.z+p.vz*dt;if(canMove(p.x,nz))p.z=nz;else if(!canMove.keep)p.vz=0;
 const bd=mode==='wc'?WC.totalRounds*WC.gap+40:OW.on?OWH-3:(MAPS.cur?MAPS.cur.ext:29.5);p.x=clamp(p.x,-bd,bd);p.z=clamp(p.z,-bd,bd);
 const gy=groundAt(p.x,p.z,p.y);
 p.vy-=22*dt;
 /* tırmanma kameranın duvara bakmasına göre (W+A gibi çapraz tuşlar artık tırmandırmaz) */
p.wr=0;if(!wall||p.g)p.wrT=0;
 const into=wall?(-sn)*-wall.nx+(-cs)*-wall.nz:0;
 const wsd=wall?wallSide(wall,sn,cs):0,sideKey=wsd>0?(kDown('right')||joy.x>.3):wsd<0?(kDown('left')||joy.x<-.3):false;
 /* Apex: havadayken W ile duvara bakıyorsan Space basılı tutmadan da tırmanmaya başlar */
 if(wall&&!gr&&p.st>0&&mz>.3&&(into>.7||(p.climb&&into>.5))&&wall.b.h<=4&&(p.climb||wall.b.h-p.y>STEP_AIR+.4)&&(jHeld||p.climb||(!p.g&&(p.at||0)<.7))){ /* alçak kutuda tırmanma yok: üstüne adım atılır, hız korunur */
  /* Apex tarzı tırmanma: duvara bakıp Space basılı tut; kenara yaklaşınca kendini üstüne çeker */
  p.climb=1;p.cn={x:wall.nx,z:wall.nz};const cf=Math.min(1,p.st/1.2);
  if(p.y>wall.b.h-1.1){p.vy=Math.min(p.vy>0?p.vy:0,4.2+1.3*cf);if(p.vy<3)p.vy=3;p.vx-=wall.nx*25*dt;p.vz-=wall.nz*25*dt}else p.vy=1.2+3.3*cf;
  p.st-=dt;
 }else if(wall&&!gr&&!p.g&&!dead&&p.st>0&&sideKey&&into<.7&&p.y>.3&&wall.b.h>p.y+1.2&&Math.hypot(p.vx,p.vz)>3&&wallrun(wall,sn,cs,dt)){
  /* duvarda koşma: duvar hangi taraftaysa o yön tuşu basılı (sol duvar: A, sağ duvar: D) */
  p.st-=dt*.6;p.dj=0;p.wr=wsd;p.climb=0;p.wrT=(p.wrT||0)+dt;
 }
 else{
  /* kenara ulaşıldı: kısa bir öne itiş + dikey hız kırpma → fırlamadan üstüne oturur */
  if(p.climb&&p.cn&&!gr){p.mt=.28;if(p.vy>1.2)p.vy=1.2}
  p.climb=0;
 }
 if(p.mt>0){
  p.mt-=dt;
  if(p.g||gr||dead)p.mt=0;
  else if(p.cn){p.vx=-p.cn.x*3.4;p.vz=-p.cn.z*3.4;p.vy=Math.max(p.vy,1.1)}
 }
 /* süzülme: havada Space basılı tutulursa paraşüt gibi yavaşça süzül */
 p.at=p.g?0:(p.at||0)+dt;p.wjT=Math.max(0,(p.wjT||0)-dt);
 /* A-16 (2026-10-19): başlama eşiği (vy<-2.2) her alt adımda yeniden sorulunca süzülme hızı -1,9'a oturduğu an kapanıp açılıyordu
    (144+ FPS'te 3 sn'de 33 kez): eller/silah pozu ve paraşüt titriyor, düşüş hızı testere gibi sıçrıyordu. Başladıktan sonra Space bırakılana dek sürer. */
 const glideOk=!dead&&!p.g&&!gr&&jHeld&&!p.climb&&!(SK.chain)&&!(SK.meteor);
 p.glide=glideOk&&(p.glide||(p.at>.9&&p.vy<-2.2))?1:0;
 if(p.glide){
  p.vy+=22*dt;if(p.vy<-1.9)p.vy+=(-1.9-p.vy)*Math.min(1,6*dt);
  const gs=Math.max(8.5*SPD*1.5,Math.hypot(p.vx,p.vz)*.995),hs=Math.hypot(p.vx,p.vz)||1;
  p.vx+=(wx*gs-p.vx)*Math.min(1,1.4*dt);p.vz+=(wz*gs-p.vz)*Math.min(1,1.4*dt);
  if(!wx&&!wz){p.vx*=Math.pow(.6,dt);p.vz*=Math.pow(.6,dt)}
  const h2=Math.hypot(p.vx,p.vz);if(h2>gs){p.vx*=gs/h2;p.vz*=gs/h2}
 }
 const py0=p.y;p.y+=p.vy*dt;
 if(MC.cur){
  if(p.vy>0){const ce=mcCeil(p.x,p.z,py0);if(ce<p.y+1.8){p.y=Math.max(py0,ce-1.8);p.vy=0}}
  if(p.y<MC.cur.minY-25&&!dead){ // haritadan düştü: yeniden doğ
   p.vy=0;p.vx=p.vz=0;
   if(mode==='tdm'){tdmRespawn()}else if(mode==='mp'&&typeof mpPlaceMe==='function'){mpPlaceMe(false)}
  }
 }
 if(p.y<=gy&&p.vy<=0){p.y=gy;p.vy=0;p.g=true}
 else if(p.y>gy+.05){if(OW.on&&p.g&&p.vy<=0&&p.y-gy<.45&&!gr){p.y=gy;p.vy=0}else p.g=false}


 const as=mode==='ow'?skAtkSpd():1;
 fireCd-=dt*as;swT=Math.min(1,swT+dt);
 if(((firing&&!auto)||(auto&&aiIn.fire))&&!dead&&!SK.chain)shoot();
 recoilTick(dt);
 updE(dt);
 if(reload>0){const r0=1-reload/cw.rel;reload-=dt;const r1=1-reload/cw.rel;if(r0<.55&&r1>=.55)reloadSound('magin');if(reload<=0){ammo=cw.mag;reloadSound('bolt');upd()}}
 if(swU>=0){swU+=dt*as/Math.max(.25,cw.rate);if(!swHit&&swU>=cw.hitT)applyMelee();if(swU>=1)swU=-1}
 kickR*=Math.pow(.001,dt);kickL*=Math.pow(.001,dt);flashR-=dt;flashL-=dt;
 hudT();
}

/* ----- Kamera ve görünür modeller ----- */
const _eu=new THREE.Euler(0,0,0,'YXZ'),_cv=V3();
function updPlayerView(dt){
 const firstPersonOnly=mode==='cmp'||(mode==='mp'&&MPL.kind==='tm');if(firstPersonOnly)tp=false;
 const spd=Math.hypot(p.vx,p.vz);
 p.eye+=((p.slide>0?1:p.cr?CROUCH_EYE:1.6)-p.eye)*Math.min(1,15*dt);
 adsT+=((ads&&!cw.melee?1:0)-adsT)*Math.min(1,12*dt);
 p.sA=(p.sA||0)+(((p.spr||p.glide)?1:0)-(p.sA||0))*Math.min(1,9*dt);
 const latN=p.g?clamp((p.vx*Math.cos(p.yaw)-p.vz*Math.sin(p.yaw))/(7*SPD),-1,1):0;p.lt=(p.lt||0)+(latN-(p.lt||0))*Math.min(1,7*dt);
 const fv=baseFov/(1+(optZoom()-1)*adsT); // hızda FOV genişlemesi kapalı; yakınlaştırma nişangaha göre
 if(Math.abs(fv-cam.fov)>.1){cam.fov+=(fv-cam.fov)*Math.min(1,8*dt);cam.updateProjectionMatrix()}
 const chO=cw.melee?1:(ads||adsT>=.05?0:1);if(chO!==lastCh){lastCh=chO;$('ch').style.opacity=chO}
 const si=Math.round(spd),gk=grCd>0?Math.ceil(grCd):0,tx=si+' m/s · kanca '+(gr?'bağlı':gk?gk+' sn':'hazır');
 if(tx!==lastSpd){lastSpd=tx;$('spd').textContent=tx}
 const sp100=Math.max(0,Math.round(p.st/ST*100));if(sp100!==lastSt){lastSt=sp100;$('sti').style.width=sp100+'%'}

 const play=state==='play'||state==='pause'||state==='end';
 const alive=p.dead<=0;
 const rq=reload>0?1-reload/cw.rel:-1,swv=swU>=0?swU:null,sw=swT>=.25?1:swT/.25;
 const ctx={t:clock,ads:adsT,kick:kickR,kickR,kickL,swing:swv,combo:swCombo,grip:SET.grip,rq,sw,bob:clamp(spd/7,0,1)*(p.g?1:0),flash:flashR,flashL,lr:0,sprint:!!p.spr,glide:!!p.glide,lat:p.g?clamp((p.vx*Math.cos(p.yaw)-p.vz*Math.sin(p.yaw))/(7*SPD),-1,1):0,wj:p.wjT>0?1:0,wallrun:p.wr||0,climb:!!p.climb};

 if(p.dead>0&&pRagdoll&&!firstPersonOnly){
  const t=pRagdoll.pts.pel.p;
  _cv.set(t.x+2.2,t.y+2.4,t.z+3);cam.position.lerp(_cv,Math.min(1,4*dt));cam.lookAt(t);
 }else if(tp){
  _eu.set(p.pitch,p.yaw,0);
  _cv.set(.55,.25,2.6).applyEuler(_eu);
  cam.position.set(p.x+_cv.x,p.y+1.5+_cv.y,p.z+_cv.z);cam.rotation.set(p.pitch,p.yaw,0);
 }else{
  cam.position.set(p.x,p.y+p.eye,p.z);
  p.wrR=(p.wrR||0)+((p.wr||0)*.14-(p.wrR||0))*Math.min(1,6*dt); /* duvarda koşarken kamera duvarın tersine yumuşakça yatar */
  let roll=(mode==='ow'?camRollK:0)-p.lt*.035+p.wrR;if(swv!=null&&cw.melee)roll+=swingD(cw,swv,swCombo,SET.grip)[5]*.045;
  cam.rotation.set(p.pitch,p.yaw,roll);
 }
 const fp=play&&!tp&&alive;
 VM.root.visible=fp&&!(optScoped()&&adsT>.9&&!cw.melee);
 if(VM.root){const sA=p.sA||0,b=Math.sin(clock*(p.spr?15:9))*sA;VM.root.rotation.x=.6*sA*(1-adsT);VM.root.position.set(-.06*sA,-.16*sA+.012*b*(p.spr?1:0),.04*sA);VM.root.rotation.z=-.15*sA+(p.lt||0)*.04}
 if(fp)driveHolder(VM.h,ctx);
 const rg=pRigObj;
 if(rg){
  const show=play&&(tp&&alive);
  rg.root.visible=show;
  if(show){
   rg.root.position.set(p.x,p.y,p.z);rg.root.rotation.y=p.yaw+Math.PI;
   const fx=-Math.sin(p.yaw),fz=-Math.cos(p.yaw);
   animHuman(rg,Object.assign({speed:spd,fwd:(p.vx*fx+p.vz*fz)/Math.max(spd,.01),air:!p.g,slide:p.slide>0,crouch:p.cr&&p.g?1:0,pitch:p.pitch},ctx),dt);
  }
 }else if(tp&&alive)pRigGet();
 if((p.shk||0)>.0008&&!tp){cam.rotation.x+=(Math.random()-.5)*p.shk;cam.rotation.y+=(Math.random()-.5)*p.shk;p.shk*=Math.pow(.0004,dt)}else p.shk=0;
 optHud(adsT);
 if(typeof thermScan==='function')thermScan(optCur().th&&optLong()&&adsT>.5&&!p.dead);
 if(window.DBGCAM)window.DBGCAM(cam,p);
 if(gr){
  cam.updateMatrixWorld();
  if(tp)gv.set(p.x,p.y+1.4,p.z);else cam.localToWorld(gv.set(.2,-.25,-.5));
  const ga=grLine.geometry.attributes.position;
  ga.setXYZ(0,gv.x,gv.y,gv.z);
  const tf=gr.on?1:Math.min(1,gr.t*100/gr.d0);
  ga.setXYZ(1,gv.x+(gr.pt.x-gv.x)*tf,gv.y+(gr.pt.y-gv.y)*tf,gv.z+(gr.pt.z-gv.z)*tf);
  ga.needsUpdate=true;
 }
}

/* ----- Mobil kontroller ----- */
function initTouch(){
 const knob=$('knob');let jo=null;
 $('joy').addEventListener('pointerdown',e=>{$('joy').setPointerCapture(e.pointerId);jo={x:e.clientX,y:e.clientY};knob.style.display='block';knob.style.left=jo.x+'px';knob.style.top=jo.y+'px'});
 $('joy').addEventListener('pointermove',e=>{if(!jo)return;let dx=(e.clientX-jo.x)/50,dy=(e.clientY-jo.y)/50;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}joy.x=dx;joy.y=dy;knob.style.left=jo.x+dx*35+'px';knob.style.top=jo.y+dy*35+'px'});
 const jend=()=>{jo=null;joy.x=joy.y=0;knob.style.display='none'};
 $('joy').addEventListener('pointerup',jend);$('joy').addEventListener('pointercancel',jend);
 let lo=null;
 $('look').addEventListener('pointerdown',e=>{$('look').setPointerCapture(e.pointerId);lo={x:e.clientX,y:e.clientY}});
 $('look').addEventListener('pointermove',e=>{if(!lo||state!=='play')return;p.yaw-=(e.clientX-lo.x)*.006*SET.touchSens;p.pitch=clamp(p.pitch-(e.clientY-lo.y)*.006*SET.touchSens*(SET.invY?-1:1),-1.5,1.5);lo={x:e.clientX,y:e.clientY}});
 $('look').addEventListener('pointerup',()=>lo=null);$('look').addEventListener('pointercancel',()=>lo=null);
 const hold=(id,on,off)=>{const e=$(id);e.addEventListener('pointerdown',ev=>{if(window.tEditing)return;ev.stopPropagation();on()});e.addEventListener('pointerup',off||(()=>{}));e.addEventListener('pointercancel',off||(()=>{}))};
 hold('bf',()=>firing=true,()=>firing=false);
 hold('bj',()=>{jHeld=true;jPress=true},()=>jHeld=false);
 hold('bs',()=>sPress=true);
 hold('bq',()=>qPress=true);
 hold('ba',()=>{if(!cw.melee)ads=!ads});
 hold('bw',()=>{const L=wList(),i=L.indexOf(wk);setW(L[(i+1)%L.length])});
 hold('bk',()=>togglePause());
 hold('br',()=>{if(state==='play')startReload()});
 hold('bo',()=>{if(state==='play')toggleAuto()});
 hold('bh',()=>{if(state==='play')owMed()});
 hold('bm',()=>{if(state==='play')toggleMap()});
 ['k1','k2','k3','k4','k5'].forEach((id,i)=>hold(id,()=>{if(state==='play')skCast(i)}));
 hold('bd',()=>{if(state==='play')skDash()});
 hold('be',()=>{if(state==='play')owInteract()});
}
