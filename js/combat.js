'use strict';
/* ===== Dövüş: ateş, yakın dövüş, hasar sayıları, botlar, zombiler, modlar ===== */
const rc=new THREE.Raycaster();rc.far=100;
const rb=new THREE.Raycaster(),vo=V3(),vd=V3(),_mz=V3(),_dir=V3(),_ev=V3(),_to=V3();
let wave=0,waveCd=0,tk={1:0,2:0},lastT='';
const E=[];

/* ----- Aim training hedefleri ----- */
const T=[],mRed=new THREE.MeshLambertMaterial({color:0xd8342c}),mHead=new THREE.MeshLambertMaterial({color:0xffb020});
for(let i=0;i<8;i++){
 const g=new THREE.Group(),b=new THREE.Mesh(new THREE.BoxGeometry(.8,1.2,.4),mRed),h=new THREE.Mesh(new THREE.SphereGeometry(.28,8,6),mHead);
 b.position.y=.6;h.position.y=1.5;h.userData.head=1;g.add(b,h);
 g.userData={tg:1,bx:(Math.random()-.5)*36,z:-4-Math.random()*22,amp:2+Math.random()*7,sp:.5+Math.random()*1.2,ph:Math.random()*6,dead:0};
 S.add(g);T.push(g);
}
function moveTargets(t,dt){
 for(const g of T){const u=g.userData;
  if(u.dead>0){u.dead-=dt;if(u.dead<=0)g.visible=true;continue}
  g.position.set(clamp(u.bx+Math.sin(t*u.sp+u.ph)*u.amp,-27,27),0,u.z);
 }
}

/* ----- Hasar sayıları, kill feed, geri bildirim ----- */
const dnl=[],_dv=V3();
function dmgNum(pt,d,head,kill){
 if(window.BGMODE)return;
 const el=document.createElement('div');
 el.className='dn'+(kill?' k':head?' h':'');
 el.textContent=Math.round(d)+(head?'!':'');
 $('dn').appendChild(el);
 dnl.push({el,p:pt.clone().add(V3(rnd(-.3,.3),.3+rnd(0,.2),rnd(-.3,.3))),t:0});
 if(dnl.length>40){const o=dnl.shift();o.el.remove()}
}
function updDn(dt){
 for(let i=dnl.length-1;i>=0;i--){
  const q=dnl[i];q.t+=dt;q.p.y+=dt*.9;
  if(q.t>.9){q.el.remove();dnl.splice(i,1);continue}
  _dv.copy(q.p).project(cam);
  if(_dv.z>1||_dv.z<-1){q.el.style.display='none';continue}
  q.el.style.display='block';
  q.el.style.left=((_dv.x*.5+.5)*innerWidth)+'px';
  q.el.style.top=((-_dv.y*.5+.5)*innerHeight)+'px';
  q.el.style.opacity=String(1-q.t/.9);
 }
}
function clearDn(){dnl.forEach(q=>q.el.remove());dnl.length=0}
function killfeed(a,b,w,head){
 const el=document.createElement('div');el.className='kfi';
 el.textContent=a+'  '+(WP[w]?WP[w].ic:'💀')+(head?' 🎯 ':' ')+'  '+b;
 $('kf').appendChild(el);setTimeout(()=>el.remove(),4000);
 while($('kf').children.length>5)$('kf').firstChild.remove();
}
function hitFlash(c){if(window.BGMODE)return;const e=$('ch');e.classList.remove('hit','head','kill');e.classList.add(c);setTimeout(()=>e.classList.remove(c),c==='kill'?200:90)}
/* vuruş hissi: kısa donma (hit-stop), kamera sarsıntısı, katmanlı ses, FOV vuruşu */
function hitFeel(heavy){
 if(window.BGMODE)return;
 hitStopT=Math.max(hitStopT,heavy?.1:.055);
 p.shk=Math.max(p.shk||0,heavy?.03:.014);
 snd(heavy?95:140,.1,.09,'square');snd(heavy?620:520,.08,.05,'sawtooth');snd(1500,.04,.025,'sine');
 if(typeof camKick==='function')camKick((Math.random()<.5?-1:1)*(heavy?.03:.014));
}
function hurtFx(){const v=$('vig');v.style.opacity='.65';setTimeout(()=>v.style.opacity='0',90)}

/* ----- İz (tracer): havuzlu — çatışmada her atışta nesne üretip silmek FPS düşürür ----- */
const trs=[],trPool=[];
function tracer(a,b){
 if(!SET.fx||window.BGMODE)return;
 let l=trPool.pop();
 if(!l){
  if(trs.length>=48)return; // iz yağmuru sınırı (yalnız görsel)
  l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([V3(),V3()]),new THREE.LineBasicMaterial({color:0xffe28a,transparent:true,opacity:.9}));
  l.frustumCulled=false;
 }
 const ps=l.geometry.attributes.position;
 ps.setXYZ(0,a.x,a.y,a.z);ps.setXYZ(1,b.x,b.y,b.z);ps.needsUpdate=true;
 l.material.opacity=.9;S.add(l);trs.push({l,t:.09});
}
function updTracers(dt){
 for(let i=trs.length-1;i>=0;i--){
  const r=trs[i];r.t-=dt;r.l.material.opacity=Math.max(0,r.t/.09);
  if(r.t<=0){S.remove(r.l);trs.splice(i,1);trPool.push(r.l)}
 }
}

/* ----- Oyuncu: silah değiştir, şarjör, ateş ----- */
function setW(k,silent){
 if(LO.on&&mode!=='ow'&&!LO.keys.includes(k))k=LO.keys[0];
 if(!WP[k])return;
 if(mode==='ow'&&(!WP[k].sw||!SV.ow.sw.includes(k)))return;
 if(wk)wa[wk]=ammo;
 wk=k;cw=wpx(k);
 ammo=wa[k]==null?(cw.mag||0):Math.min(wa[k],cw.mag||0);
 reload=0;swU=-1;ads=false;swT=0;
 if(VM.h)holderSet(VM.h,k,undefined,modId(k));
 if(pRigGet())holderSet(pRigGet(),k,undefined,modId(k));
 if(mode==='ow'){SV.ow.mw=k}else SV.eq.w=k;
 save();
 hudWeapons();upd();
 if(!silent)snd(250,.05);
}
function startReload(){
 if(cw.melee||reload>0||ammo===cw.mag||p.dead>0)return;
 reload=cw.rel;reloadSound('magout');
}
function targetObjs(){
 const a=boxMeshes.slice();
 for(const t of T)if(t.visible)a.push(t);
 for(const e of E)if(e.hp>0&&e.team===2&&e.g.visible)a.push(e.g);
 return a;
}
/* ----- Geri tepme: sabit desen (Apex tarzı) + bırakınca toparlanma ----- */
let rcI=0,rcP=0,rcY=0,rcT=0,bloom=0;
const SPREAD_K=.7;
function recoilKick(){
 if(AUTO.on&&mode==='ow')return;
 const k=cw.kick*(ads?.7:1),i=rcI++;
 const dy=k*.0042*(i<9?1:.45);
 const dx=k*.0032*Math.sin(i*.85+.4)*Math.min(1,i/3);
 p.pitch=clamp(p.pitch+dy,-1.5,1.5);p.yaw+=dx;rcP+=dy;rcY+=dx;rcT=.14;
}
function recoilTick(dt){
 bloom=Math.max(0,bloom-dt*.01);
 if(rcT>0){rcT-=dt;return}
 if(rcI>0||Math.abs(rcP)>1e-4){
  const f=Math.min(1,dt*7);
  const dp=rcP*f,dy=rcY*f;
  p.pitch-=dp;p.yaw-=dy;rcP-=dp;rcY-=dy;
  if(Math.abs(rcP)<1e-4&&Math.abs(rcY)<1e-4){rcP=rcY=0;rcI=0}
 }
}
function shoot(){
 if(p.dead>0||reload>0||fireCd>0||swT<.25)return;
 if(cw.melee){if(swU>=0)return;swCombo=comboT>0?(swCombo+1)%4:0;comboT=cw.rate*1.9+.5;swU=0;swHit=false;fireCd=cw.rate;shots++;snd(220,.08);if(mode==='mp')mpSwing(swCombo|((SET.grip|0)<<2));else if(mode==='ow'&&OWN.on)ownSwing(swCombo|((SET.grip|0)<<2));upd();return}
 if(ammo<=0){startReload();return}
 ammo--;shots++;fireCd=cw.rate;
 let side=1;
 if(cw.hold==='dual'){dualSide^=1;side=dualSide?1:2}
 if(side===2){kickL=1;flashL=.05}else{kickR=1;flashR=.05}
 recoilKick();
 const spd=Math.hypot(p.vx,p.vz);
 /* saçılım: SPREAD_K ile genel toplama (%30 daha toplu), yerde eğilince ayrıca %20 */
 const sp=(cw.spread*(ads?.12:.3)+Math.min(.006,spd*.0007)+(p.g?0:.004)+bloom)*SPREAD_K*(p.cr&&p.g?.8:1);
 bloom=Math.min(.004,bloom+.0006);
 const NP=cw.pel?7:1;
 for(let pi=0;pi<NP;pi++){
 /* tek mermi tam olarak nişangâhın baktığı noktaya gider (dağılma yok); saçmalı yalnızca saçmada (pellet) kalır */
 const spp=NP>1?sp*2.2+.012:sp;
 rc.setFromCamera(NP>1?{x:(Math.random()-.5)*spp*2,y:(Math.random()-.5)*spp*2}:{x:0,y:0},cam);
 rc.far=100;
 let hit=rc.intersectObjects(targetObjs(),true)[0];
 let pt=hit?hit.point:rc.ray.at(60,_ev);
 if(OW.on){const gd=owGroundRay(rc.ray,hit?hit.distance:100);if(gd<(hit?hit.distance:100)){hit=null;pt=rc.ray.at(gd,_ev)}}
 const hd0=tp?pRigGet():VM.h;
 if(hd0&&hd0.W&&(pi<3)){muzzleWorld(hd0,_mz,side);tracer(_mz,pt)}
 if(pi===0){gunSound(NP>1?'shotgun':(cw.hold==='pistol'||cw.hold==='dual')?'pistol':cw.rate<.08?'smg':(cw.dmg>=70?'sniper':'rifle'));if(mode==='mp')mpFire(side,pt)}
 if(hit){
  let o=hit.object;while(o&&!o.userData.tg)o=o.parent;
  if(o){
   const hd=!!hit.object.userData.head,bd=cw.dmg/NP,dmg=hd?bd*2:bd;
   if(pi===0)hits++;_dir.copy(rc.ray.direction);
   if(o.userData.e)damageEnemy(o.userData.e,dmg,{player:true,pt:hit.point.clone(),dir:_dir.clone(),head:hd});
   else{cmbHit(true);score+=Math.round((hd?200:100)*cmbMul());dmgNum(hit.point,dmg,hd,false);o.visible=false;o.userData.dead=1;hitSound(hd,true)}
   hitFlash(hd?'head':'hit');
  }
 }
 }
 if(ammo===0)startReload();
 upd();
}
function applyMelee(){
 swHit=true;
 cam.getWorldDirection(_dir);
 const md=meleeDmg();
 if(mode==='ow'){slashFx(swCombo,SK.act.inferno>0?'#ff7a2a':null);camKick((swCombo%2?-1:1)*.025);if(!AUTO.on&&p.g){p.vx+=-Math.sin(p.yaw)*3.5;p.vz+=-Math.cos(p.yaw)*3.5}}
 const cs=Math.cos(cw.ang);let any=false;
 const test=(x,y,z,fn)=>{
  _to.set(x-cam.position.x,y-cam.position.y,z-cam.position.z);
  const d=_to.length();if(d>cw.range+.4||d<.01)return;
  _to.divideScalar(d);
  if(_to.dot(_dir)<cs){
   /* çok yakın hedef: dikey fark yüzünden ıskalamasın, yatay açıya bak */
   const hx=x-cam.position.x,hz=z-cam.position.z,hl=Math.hypot(hx,hz),dl=Math.hypot(_dir.x,_dir.z);
   if(!(hl<2.2&&dl>.05&&(hx*_dir.x+hz*_dir.z)/(hl*dl||1)>=cs&&Math.abs(y-cam.position.y)<3.2))return;
  }
  any=true;fn(V3(x,y,z));
 };
 for(const e of E){
  if(e.hp<=0||e.team!==2)continue;
  const q=e.g.position;
  test(q.x,q.y+1.2,q.z,pt=>damageEnemy(e,md,{player:true,pt,dir:_dir.clone(),head:false,melee:true,power:cw.dmg>100?12:7}));
 }
 if(mode==='ow'&&OWN.on&&OWN.pvp)for(const q of OWN.ents.values()){
  if(q.hp<=0||!ownCanPvp(q))continue;
  test(q.g.position.x,q.g.position.y+1.2,q.g.position.z,pt=>{ownPvpHit(q,md*owDmgMul());if(!window.BGMODE){dmgNum(pt,md,false,false)}});
 }
 for(const t of T){
  if(!t.visible)continue;
  test(t.position.x,t.position.y+.9,t.position.z,pt=>{cmbHit(true);score+=Math.round(100*cmbMul());dmgNum(pt,cw.dmg,false,false);t.visible=false;t.userData.dead=1});
 }
 if(any){hits++;hitFlash('hit');hitFeel(swCombo>=2||cw.dmg>100)}
 upd();
}

/* ----- Düşmana hasar / ölüm ----- */
function damageEnemy(e,d,info){
 if(info&&info.player)cmbHit(false);
 if(e.zid){mpZHit(e,d,info);return}
 if(e.mp){mpHit(e,d,info);return}
 if(e.mob){owDamage(e,d,info);return}
 if(e.hp<=0)return;
 e.hp-=d;e.flinch=1;
 if(info&&info.player){dmgNum(info.pt,d,info.head,e.hp<=0);if(!info.melee)hitSound(info.head,e.hp<=0)}
 if(e.hp>0)return;
 killEnemy(e,info);
}
function killEnemy(e,info){
 e.hp=0;
 const vel=V3(e.vx||0,0,e.vz||0);
 const pw=((info&&info.power)||4)*(info&&info.head?1.4:1);
 spawnRagdoll(e.rig,vel,info&&info.pt,info&&info.dir,pw);
 e.rig.root.visible=false;
 if(info&&info.player){kills++;cmbHit(true);score+=Math.round((e.kind==='z'?100:150)*cmbMul());hitFlash('kill');killfeed('Sen',e.name,wk,info.head)}
 else if(info&&info.by)killfeed(info.by,e.name,info.w||'rifle',false);
 if(mode==='tdm'){
  tk[e.team===1?2:1]++;upd();
  if(tk[1]>=20||tk[2]>=20){finish();return}
  setTimeout(()=>{if(mode==='tdm'&&state!=='end'&&state!=='menu'&&E.includes(e)){
   e.hp=e.max;e.rig.root.visible=true;e.g.position.set(e.sx,e.sy||0,e.sz);e.ammo=WP[e.wk].mag;e.rl=0}},4000);
 }else upd();
}
function hurt(d,from){
 if(p.dead>0||state!=='play')return;
 if(p.inv>0)return;
 if(mode==='ow'){d*=clsRed();d=skAbsorb(d);if(d<=.01)return}
 p.hp-=d;cmbHurt();hudHp();snd(90,.1,.06);hurtFx(); /* kamera sarsıntısı kaldırıldı (hasar anında görüşü kaybetme yok) */
 if(mode==='ow')OW.hitT=0;
 if(p.hp<=0){
  const h=pRigGet();
  if(h)pRagdoll=spawnRagdoll(h,V3(p.vx,0,p.vz),from||null,from?V3(p.x-from.x,.3,p.z-from.z).normalize():null,5);
  if(mode==='ow'){owDeath();return}
  if(mode==='zom'){finish();return}
  tk[2]++;p.dead=3;$('msg').textContent='Öldün, 3 sn sonra doğarsın';upd();
  if(tk[2]>=20)finish();
 }
}

/* ----- Botlar ve zombiler ----- */
const BOTN={1:['Ayşe','Kaan','Deniz','Mert'],2:['Efe','Burak','Selin','Can','Zeynep']};
function mkE(kind,team,x,z,wkey){
 const cols=BOTCOL[kind==='z'?'z':team===1?'a':'e'];
 const rig=mkHuman(cols,kind==='z');
 let k=null;
 if(kind!=='z'){
  k=wkey||['rifle','smg','pistol','rifle','dual','smg'][Math.floor(Math.random()*6)];
  holderSet(rig,k,SKIN(['g0','g6','g8','g3','g5'][Math.floor(Math.random()*5)]));
 }
 rig.root.position.set(x,0,z);S.add(rig.root);setShadow(rig.root);
 const nm=kind==='z'?'Zombi':(BOTN[team][E.filter(q=>q.team===team).length%BOTN[team].length]);
 const e={rig,g:rig.root,kind,team,hp:100,max:100,cd:Math.random(),rs:0,dir:1,sp:4,sx:x,sz:z,wk:k,ammo:k?WP[k].mag||0:0,rl:0,kk:0,flinch:0,vx:0,vz:0,yaw:0,look:0,atk:0,flash:0,flashL:0,adsT:0,name:nm,ph0:Math.random()*10,side:0};
 rig.root.userData={tg:1,e};
 E.push(e);return e;
}
function stepE(e,dx,dz){const q=e.g.position,y=q.y;if(!hitBox(q.x+dx,q.z,y))q.x+=dx;if(!hitBox(q.x,q.z+dz,y))q.z+=dz;if(typeof MAPS!=='undefined'&&MAPS.cur){const g=groundAt(q.x,q.z,y+.1);q.y+=(g-q.y)*.5;if(Math.abs(g-q.y)<.02)q.y=g}}
function angLerp(a,b,t){let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return a+d*t}
let _hpL=-1,_hpS=-1;
function hudHp(){
 const mx=mode==='ow'?owMax():100,h=Math.max(0,p.hp),f=Math.min(1,h/mx),sh=mode==='ow'&&typeof SK!=='undefined'?SK.shield:0;
 const e=$('hp');if(!e)return;
 $('hpn').textContent=Math.ceil(h);$('hpm').textContent='/ '+Math.round(mx);
 const bar=$('hpf');bar.style.width=(f*100)+'%';
 $('hpg').style.width=(f*100)+'%';
 $('hps').style.width=Math.min(100,sh/mx*100)+'%';
 $('hps2').textContent=sh>0?'🛡 '+Math.ceil(sh):'';
 e.classList.toggle('low',f<.3);e.classList.toggle('mid',f>=.3&&f<.6);
 const c=typeof clsCur==='function'&&mode==='ow'?clsCur():null;$('hpc').textContent=c?c.ic:'';
 if(f>_hpL&&_hpL>=0){e.classList.add('heal');setTimeout(()=>e.classList.remove('heal'),450)}
 if(f<_hpL){e.classList.add('hit');setTimeout(()=>e.classList.remove('hit'),160)}
 _hpL=f;
}
function hudT(){
 const t=mode==='mp'?(MPL.kind==='tm'?'5v5 Online':MPL.kind==='zo'?'Dalga '+(MPL.wave||0):'Arena'):mode==='ow'?OW.zone:mode==='zom'?'Dalga '+wave:mode==='tdm'?Math.floor(Math.ceil(timeLeft)/60)+':'+String(Math.ceil(timeLeft)%60).padStart(2,'0'):''+Math.ceil(timeLeft);
 if(t!==lastT){lastT=t;$('tm').textContent=t}
}
function hudWeapons(){
 const w=$('wbar');
 if(!w.children.length){WKEYS.forEach((k,i)=>{const s=document.createElement('span');s.className='ws'+(WP[k].melee?'':' gun');s.textContent=(i+1)+' '+WP[k].ic;s.dataset.k=k;w.appendChild(s)})}
 for(const s of w.children)s.classList.toggle('on',s.dataset.k===wk);
 if(LO.on)loHud();
}
function upd(){
 $('scr').textContent=mode==='mp'?mpScoreText():mode==='ow'?'Öldürme '+kills:mode==='tdm'?'Biz '+tk[1]+' - '+tk[2]+' Onlar':'Skor '+score;
 $('acc').textContent='%'+(shots?Math.round(hits/shots*100):0);
 hudT();
 if(reload<=0)$('ammo').textContent=cw.melee?cw.n+(cw.sw&&swLv(wk)?' +'+swLv(wk):''):cw.n+' '+ammo+' / '+cw.mag;
 else $('ammo').textContent=cw.n+' şarjör...';
}

function pickTarget(e){
 const q=e.g.position;let tg=null,td=1e9;
 for(const o of E)if(o.hp>0&&o.team!==e.team&&o.kind!=='z'){const d=Math.hypot(o.g.position.x-q.x,o.g.position.z-q.z);if(d<td){td=d;tg=o}}
 if(e.team===2&&p.dead<=0){const d=Math.hypot(p.x-q.x,p.z-q.z);if(d<td){td=d;tg='p'}}
 return{tg,td};
}
function updBot(e,dt){
 const q=e.g.position,px=q.x,pz=q.z,t=clock+e.ph0;
 const{tg,td}=pickTarget(e);
 const w=WP[e.wk];
 let speedOut=0,fwd=1,pitch=0,lookYaw=0,adsGoal=0;
 if(tg){
  const tx=tg==='p'?p.x:tg.g.position.x,tz=tg==='p'?p.z:tg.g.position.z;
  const ty=tg==='p'?p.y+1.5:1.4;
  const dd=td||1,nx=(tx-q.x)/dd,nz=(tz-q.z)/dd;
  e.yaw=angLerp(e.yaw,Math.atan2(nx,nz),Math.min(1,8*dt));
  e.g.rotation.y=e.yaw;
  e.rs-=dt;if(e.rs<=0){e.rs=1+Math.random()*1.5;e.dir=Math.random()<.5?1:-1}
  let mv=dd>12?1:dd<6?-.6:0,mnx=nx,mnz=nz;
  if(MAPS.cur){ // harita: görüş yoksa ya da uzaksa yol bularak ilerle
   e.lt=(e.lt||0)-dt;if(e.lt<=0){e.lt=.3+Math.random()*.2;e.los=botLos(e,tx,ty,tz)}
   if(!e.los||dd>16){
    const wp=botNav(e,tx,tz);
    if(wp){const wx=wp[0]-q.x,wz=wp[1]-q.z,wl=Math.hypot(wx,wz)||1;mnx=wx/wl;mnz=wz/wl;mv=1;e.dir=0}
   }
  }
  const sx=(mnx*mv-mnz*e.dir*.7)*4*dt,sz=(mnz*mv+mnx*e.dir*.7)*4*dt;
  stepE(e,sx,sz);
  e.vx=(q.x-px)/dt;e.vz=(q.z-pz)/dt;
  pitch=clamp(Math.atan2(ty-1.5,dd),-.6,.6);
  adsGoal=dd<26&&e.rl<=0?1:0;
  e.cd-=dt;
  if(e.rl>0){e.rl-=dt;if(e.rl<=0)e.ammo=w.mag}
  else if(e.cd<=0&&dd<32&&(!MAPS.cur||e.los)){
   if(e.ammo<=0){e.rl=w.rel;e.cd=.2}
   else{
    e.ammo--;e.cd=Math.max(.2,w.rate*1.7)+Math.random()*.3;
    const side=w.hold==='dual'?(e.side^=1,e.side?1:2):1;
    if(side===2)e.flashL=.05;else e.flash=.05;
    e.kk=1;
    vo.set(q.x,1.4,q.z);vd.set(tx-q.x,ty-1.4,tz-q.z);const len=vd.length();vd.normalize();rb.set(vo,vd);rb.far=len;
    const blocked=rb.intersectObjects(boxMeshes)[0];
    const hitc=!blocked&&Math.random()<Math.max(.12,.7-dd*.02);
    if(e.rig.W){
     muzzleWorld(e.rig,_mz,side);
     const aim=V3(tx,ty-.3,tz);if(!hitc)aim.add(V3(rnd(-1,1),rnd(-.5,.5),rnd(-1,1)));
     if(blocked&&blocked.distance<len)aim.copy(blocked.point);
     tracer(_mz,aim);
    }
    if(hitc){if(tg==='p')hurt(9,q);else damageEnemy(tg,25,{by:e.name,w:e.wk,pt:V3(tx,1.3,tz),dir:vd.clone()})}
   }
  }
  speedOut=Math.hypot(e.vx,e.vz);
  fwd=(e.vx*nx+e.vz*nz)/Math.max(speedOut,.01);
  lookYaw=0;
 }else{
  e.vx=e.vz=0;lookYaw=Math.sin(t*.7)*.9;
 }
 e.adsT+=(adsGoal-e.adsT)*Math.min(1,8*dt);
 e.kk*=Math.pow(.0005,dt);e.flash-=dt;e.flashL-=dt;e.flinch=Math.max(0,e.flinch-dt*4);
 const _pr=poseRate(e,q.x-p.x,q.z-p.z);
 if(_pr>0)
 animHuman(e.rig,{t,speed:speedOut,fwd,pitch,lookYaw,flinch:e.flinch,ads:e.adsT,kick:e.kk,kickR:e.kk,kickL:e.kk,
  rq:e.rl>0?1-e.rl/w.rel:-1,flash:e.flash,flashL:e.flashL,bob:clamp(speedOut/7,0,1),lr:0,sw:1},dt*_pr);
}
function updZombie(e,dt){
 const q=e.g.position,px=q.x,pz=q.z,t=clock+e.ph0;
 const dx=p.x-q.x,dz=p.z-q.z,d=Math.hypot(dx,dz)||1;
 e.yaw=angLerp(e.yaw,Math.atan2(dx,dz),Math.min(1,6*dt));e.g.rotation.y=e.yaw;
 if(p.dead<=0&&d>1.3)stepE(e,dx/d*e.sp*dt,dz/d*e.sp*dt);
 e.vx=(q.x-px)/dt;e.vz=(q.z-pz)/dt;
 e.cd-=dt;
 if(e.atk>0)e.atk-=dt;
 if(d<1.7&&p.y<2.5&&e.cd<=0&&p.dead<=0){e.cd=.9;e.atk=.5;hurt(10,q)}
 e.flinch=Math.max(0,e.flinch-dt*4);
 const _pr=poseRate(e,q.x-p.x,q.z-p.z);
 if(_pr>0)
 animHuman(e.rig,{t,speed:Math.hypot(e.vx,e.vz),fwd:1,pitch:0,lookYaw:Math.sin(t*1.3)*.3,flinch:e.flinch,atk:e.atk>0?1-e.atk/.5:0},dt*_pr);
}

/* ----- Mod yönetimi ----- */
function begin(){
 if(typeof loSync==='function')loSync();
 score=shots=hits=kills=0;rcI=rcP=rcY=0;bloom=0;
 timeLeft=mode==='aim'?60:mode==='tdm'?180:99999;
 p.dead=0;p.x=0;p.z=20;p.y=0;p.vy=0;p.yaw=0;p.pitch=0;p.vx=p.vz=0;p.slide=0;p.st=ST;p.dj=0;p.climb=0;
 gr=null;grCd=0;grLine.visible=false;
 T.forEach(t=>{t.visible=mode==='aim';t.userData.dead=mode==='aim'?0:1e9});
 WKEYS.forEach(k=>wa[k]=WP[k].mag||0);
 wk=null;setW(SV.eq.w,true);
 setupMode();upd();
}
function setupMode(){
 if(OW.on&&mode!=='ow')owLeave();
 if(typeof mapApply==='function')mapApply((mode==='tdm'||(mode==='mp'&&MPL.kind==='tm'))?MAPS.sel:'arena');
 E.forEach(e=>S.remove(e.g));E.length=0;clearRags();clearDn();pRagdoll=null;
 tk={1:0,2:0};wave=0;waveCd=1.5;lastT='';zPend=0;zPT=0;
 $('hp').style.display=mode==='aim'?'none':'block';
 $('msg').textContent=mode==='zom'?'Zombiler geliyor':'';
 p.hp=100;hudHp();
 if(mode==='tdm')tdmSetup();
 if(mode==='ow')owStart();
 if(mode==='mp')mpStart();
}
let zPend=0,zPT=0;
function updE(dt){
 if(mode==='ow'){owUpdate(dt);return}
 if(mode==='mp'){mpUpdate(dt);return}
 if(p.dead>0){p.dead-=dt;if(p.dead<=0){p.hp=100;p.x=0;p.z=24;p.y=0;p.vx=p.vz=0;if(mode==='tdm')tdmRespawn();hudHp();$('msg').textContent='';pRagdoll=null}}
 /* performans: dalgadaki zombiler tek karede değil, ~1/40 sn arayla tek tek doğar (büyük dalgada 100+ ms donma olmasın) */
 if(mode==='zom'&&zPend>0){
  zPT-=dt;
  if(zPT<=0){zPT=.025;zPend--;
   let x,z,k=0;
   do{const a=Math.random()*6.28;x=clamp(p.x+Math.cos(a)*22,-28,28);z=clamp(p.z+Math.sin(a)*22,-28,28)}while(hitBox(x,z,0)&&++k<10);
   const e=mkE('z',2,x,z);e.hp=e.max=60+wave*8;e.sp=2.6+Math.min(2,wave*.25)+Math.random();
  }
 }
 else if(mode==='zom'&&!E.some(e=>e.hp>0)){
  waveCd-=dt;
  if(waveCd<=0){
   for(let i=E.length-1;i>=0;i--){S.remove(E[i].g);E.splice(i,1)}
   wave++;waveCd=3;p.hp=Math.min(100,p.hp+30);hudHp();hudT();
   $('msg').textContent='Dalga '+wave;setTimeout(()=>{if(mode==='zom')$('msg').textContent=''},1500);
   zPend=3+wave*2;zPT=0;
  }
 }
 for(const e of E){if(e.hp<=0)continue;if(e.kind==='z')updZombie(e,dt);else updBot(e,dt)}
}
function finish(){
 if(state==='end')return;
 state='end';if(document.exitPointerLock)document.exitPointerLock();
 let earn,t,r,win=false;const acc=shots?Math.round(hits/shots*100):0;
 if(mode==='aim'){
  let best=0;try{best=+localStorage.getItem('mmofps_best')||0;if(score>best){best=score;localStorage.setItem('mmofps_best',best)}}catch(e){best=Math.max(best,score)}
  earn=Math.round(score/20);t='Süre doldu';if(typeof MPL!=='undefined'&&MPL.authed)mpSend({t:'aimscore',s:score});r='Skor <b>'+score+'</b> · En iyi <b>'+best+'</b><br>İsabet %'+acc;
 }else if(mode==='zom'){earn=kills*5+wave*20;t='Dalga '+wave+' ile bitti';r='Öldürülen <b>'+kills+'</b> · Skor <b>'+score+'</b>'}
 else if(mode==='mp'&&MPL.kind==='zo'){earn=kills*5+(MPL.wave||0)*20;t='Dalga '+(MPL.wave||0)+' ile bitti';r='Öldürme <b>'+kills+'</b> · Skor <b>'+score+'</b>'}
 else if(mode==='mp'){win=MPL.kind==='tm'?MPL.winTeam===MPL.team:MPL.win===MPL.id;earn=kills*10+(win?100:0);t=MPL.kind==='tm'?(win?'Takımın kazandı!':'Rakip takım kazandı'):win?'Birinci oldun!':(MPL.winName?MPL.winName+' kazandı':'Tur bitti');r='Öldürme <b>'+kills+'</b> · Sıra <b>'+(1+Math.max(0,MPL.board.findIndex(q=>q[0]===MPL.id)))+'/'+MPL.board.length+'</b>'}
 else{win=tk[1]>tk[2];earn=kills*10+(win?100:0);t=win?'Kazandınız!':tk[1]===tk[2]?'Berabere':'Kaybettiniz';r='Skor '+tk[1]+' - '+tk[2]+' · Öldürme <b>'+kills+'</b>'}
 SV.tl+=earn;SV.xp+=Math.max(20,earn);
 if(typeof onMatchEnd==='function')onMatchEnd({mode,kills,score,shots,hits,win,wave,acc,earn});
 save();
 $('ttl').textContent=t;$('sub').textContent='';
 $('res').innerHTML=r+'<br>Kazanılan: <b>+'+fmt(earn)+' TL</b>';
 $('play').textContent='TEKRAR';$('ov').classList.remove('off');
}
