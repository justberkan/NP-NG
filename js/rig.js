'use strict';
/* ===== İnsan iskeleti: model, yürüyüş/nişan animasyonu, ragdoll ===== */

function mkHuman(cols,zombie){
 const root=new THREE.Group(),hips=new THREE.Group(),spine=new THREE.Group(),head=new THREE.Group();
 hips.position.y=.95;root.add(hips);
 hips.add(mergeBoxes([{w:.34,h:.16,d:.2,x:0,y:0,z:0,c:cols.pa}].concat(cols.hp||[])));
 if(cols.sc)root.scale.setScalar(cols.sc);
 spine.position.y=.06;hips.add(spine);
 spine.add(mergeBoxes([
  {w:.32,h:.2,d:.19,x:0,y:.1,z:0,c:cols.j},
  {w:.38,h:.3,d:.21,x:0,y:.31,z:0,c:cols.j},
  {w:.4,h:.24,d:.235,x:0,y:.33,z:0,c:cols.v},
  {w:.26,h:.28,d:.1,x:0,y:.3,z:-.16,c:cols.v2},
  {w:.36,h:.05,d:.2,x:0,y:.03,z:0,c:cols.v2}
 ].concat(cols.bd||[])));
 head.position.y=.56;spine.add(head);
 head.add(mergeBoxes([{w:.07,h:.08,d:.07,x:0,y:.02,z:0,c:cols.sk}]));
 const ey=cols.ey||(zombie?0xffe14d:0xffffff),pu=cols.pu||(zombie?0xc0261d:0x111111);
 const hp=[{w:.19,h:.22,d:.21,x:0,y:.17,z:0,c:cols.sk},
  {w:.05,h:.035,d:.02,x:-.045,y:.19,z:.108,c:ey},{w:.05,h:.035,d:.02,x:.045,y:.19,z:.108,c:ey},
  {w:.022,h:.022,d:.02,x:-.045,y:.19,z:.118,c:pu},{w:.022,h:.022,d:.02,x:.045,y:.19,z:.118,c:pu}];
 if(cols.hd)cols.hd.forEach(q=>hp.push(q));
 if(!zombie&&!cols.nohat){hp.push({w:.23,h:.09,d:.25,x:0,y:.285,z:-.005,c:cols.h},{w:.23,h:.04,d:.05,x:0,y:.245,z:.125,c:cols.h})}
 else hp.push({w:.2,h:.05,d:.22,x:0,y:.29,z:-.01,c:0x2a2d22});
 const hm=mergeBoxes(hp);hm.userData.head=1;head.add(hm);
 const legs=[-1,1].map(s=>{
  const hip=new THREE.Group();hip.position.set(s*.1,-.02,0);hips.add(hip);
  hip.add(mergeBoxes([{w:.14,h:.46,d:.15,x:0,y:-.23,z:0,c:cols.pa}]));
  const knee=new THREE.Group();knee.position.y=-.46;hip.add(knee);
  knee.add(mergeBoxes([{w:.12,h:.44,d:.13,x:0,y:-.22,z:0,c:cols.pa},{w:.125,h:.08,d:.27,x:0,y:-.43,z:.06,c:cols.bo}]));
  return{hip,knee};
 });
 const h=mkHolder(spine,V3(0,.46,0),V3(-.22,.46,0),V3(.22,.46,0),cols);
 return Object.assign(h,{root,hips,spine,head,legs,cols,zombie:!!zombie,ph:Math.random()*6,sm:{amp:0,air:0,sl:0,cr:0,fl:0}});
}
function setRigColors(h,cols){ /* renkleri değiştirmek için yeniden kur: çağıran taraf eskisini siler */ }

function zombieArms(h,c){
 const t=c.t||0,a=c.atk||0,sw=Math.sin(t*3+h.ph)*.03;
 /* saldırı: kolları yukarı kaldır (hazırlık), hızla aşağı indir (vuruş), toparlan */
 let up=0;
 if(a>0){if(a<.5)up=ease(a/.5);else if(a<.68)up=1-((a-.5)/.18)*1.7;else up=-.7*(1-ease((a-.68)/.32))}
 _tv.set(-.17,.52+.04*Math.sin(t*2)+up*.45,.5+sw-up*.3);solveArm(h.armR,_tv);
 _tv.set(.17,.5+.04*Math.sin(t*2+1)+up*.45,.5-sw-up*.3);solveArm(h.armL,_tv);
}

/* ----- Klip örnekleme (js/clips.js: kullanıcı GLB animasyonlarından pişirilmiş açılar) -----
   alan sırası: hl,kl,hr,kr,lean,sl,el,sr,er,hy,hp,roll */
const _cp=new Array(12).fill(0),_cq=new Array(12).fill(0);
function clipAt(name,ph,out,loop){
 const C=CLIPS[name],f=C.f,n=f.length;
 let x;
 if(loop!==false){ph-=Math.floor(ph);x=ph*n}else x=Math.min(Math.max(ph,0),.999)*(n-1);
 const i=Math.floor(x),j=loop!==false?(i+1)%n:Math.min(n-1,i+1),t=x-i,A=f[i],B=f[j];
 for(let k=0;k<12;k++)out[k]=A[k]+(B[k]-A[k])*t;
 return out;
}
const _fr=V3(),_fl=V3();
/* c: {t,speed,fwd,air,slide,crouch,pitch,lookYaw,flinch, ads,kick,kickR,kickL,swing,rq,lr,sw,bob,flash,flashL, atk, sprint, glide, lat, wj} */
function animHuman(h,c,dt){
 const sm=h.sm,k=1-Math.exp(-10*dt),spd=c.speed||0,amp=clamp(spd/6,0,1);
 sm.amp+=(amp-sm.amp)*k;
 sm.air+=((c.air?1:0)-sm.air)*Math.min(1,8*dt);
 sm.sl+=((c.slide?1:0)-sm.sl)*Math.min(1,9*dt);
 sm.cr+=((c.crouch||0)-sm.cr)*k;
 sm.fl+=((c.flinch||0)-sm.fl)*Math.min(1,14*dt);
 const zb=h.zombie;
 /* A-20 (Berkan, 2026-10-19): Naruto (ninja) koşusu yalnız açık dünyada; diğer modlarda Shift hızlı koşu, animasyon normal koşu klibi */
 const naruto=c.sprint&&!zb&&(typeof mode==='undefined'||mode==='ow');
 sm.sp=(sm.sp||0)+((naruto?1:0)-(sm.sp||0))*Math.min(1,9*dt);
 sm.gl=(sm.gl||0)+(((c.glide&&!zb)?1:0)-(sm.gl||0))*Math.min(1,7*dt);
 sm.lat=(sm.lat||0)+((c.lat||0)-(sm.lat||0))*Math.min(1,8*dt);
 if(c.air)h.at=(h.at||0)+dt;else h.at=0;
 if(c.wj>0)h.wjT=1.0;else if(h.wjT>0)h.wjT-=dt;
 const fwdS=(c.fwd==null||c.fwd>=-.3)?1:-1;
 if(spd>.2)h.ph+=dt*(3+spd*.75)*fwdS;
 // klip fazları
 const SPC=.56;
 if(!zb){
  h.cp=((h.cp||0)+dt*fwdS*(spd>2.8?clamp(spd/7,.5,1.5)/CLIPS.run.d:clamp(spd/1.5,.3,2)/CLIPS.walk.d))%1000;
  h.sphs=((h.sphs||0)+dt*clamp(spd/9,.8,1.5)/SPC)%1000;
 }
 const useClips=!zb&&typeof CLIPS!=='undefined';
 const spw=useClips?sm.sp*(1-sm.air*.7)*(1-sm.sl):0,glw=useClips?sm.gl:0;
 const locW=useClips?clamp((sm.amp-.1)/.4,0,1)*(1-sm.cr)*(1-sm.sl)*(1-sm.air)*(1-spw):0;
 const airW=useClips?sm.air*(1-glw)*.85*(1-sm.sl):0;
 let loc=null,nj=null,aj=null;
 if(locW>.001){ // yürüme ↔ koşma klipleri
  const rw=clamp((spd-2.2)/1.4,0,1);
  clipAt('walk',h.cp,_cq);loc=_cp;
  if(rw>0){clipAt('run',h.cp*(CLIPS.run.d>0?1:1),_cp);for(let q=0;q<12;q++)_cp[q]=_cq[q]+(_cp[q]-_cq[q])*rw}else for(let q=0;q<12;q++)_cp[q]=_cq[q];
 }
 const _np=[],_ap=[];
 if(spw>.001){clipAt('run',h.sphs,_np);_np[4]=.16+.08*sm.amp;nj=_np}
 if(airW>.001){
  const wj=h.wjT>0;
  if(wj)clipAt('jumpwall',clamp(1-h.wjT,0,1)*.9,_ap,false);
  else clipAt('jump',.15+.6*clamp(h.at/.95,0,1),_ap,false);
  aj=_ap;
 }
 h.hips.position.y=.95-.36*sm.sl-.25*sm.cr-Math.abs(Math.sin(h.ph))*.03*sm.amp*(1-sm.air)*(1-spw);
 const lean0=.12*sm.amp-.5*sm.sl+.15*sm.cr-sm.fl*.35,pit=c.pitch||0;
 // hedef gövde eğimi (dünya): normal / ninja / süzülme
 let leanT=lean0;
 if(nj)leanT=lerp(leanT,nj[4],spw);
 if(glw>0)leanT=lerp(leanT,.42,glw);
 const tau=useClips?(spw*.32+glw*.15)*leanT:0;   // kalça öne eğilir, kalan omurgaya
 h.hips.rotation.x=tau;
 /* yürüyüş kalça salınımı: gövde yatayda zıt yöne döner, ağırlık adım ritmiyle sağa sola kayar
    (robotik görünümü kırar; koşu/ninja/süzülme/kayma/eğilme anlarında kapalı) */
 const swW=sm.amp*(1-sm.air)*(1-sm.sl)*(1-sm.cr)*(1-Math.max(spw,glw));
 h.hips.rotation.y=Math.sin(h.ph)*.14*swW;
 h.hips.position.x=Math.cos(h.ph)*.024*swW;
 for(let i=0;i<2;i++){
  const L=h.legs[i],ph=h.ph+i*Math.PI,s=Math.sin(ph),co=Math.cos(ph);
  let hip=-s*.8*sm.amp,kn=Math.max(0,co)*1.1*sm.amp+.04;
  hip=lerp(hip,-.9,sm.cr);kn=lerp(kn,1.4,sm.cr);
  hip=lerp(hip,i?-.35:-.9,sm.air);kn=lerp(kn,i?1:.5,sm.air);
  hip=lerp(hip,i?-1.1:-1.35,sm.sl);kn=lerp(kn,.25,sm.sl);
  if(loc){const hh=i?loc[0]:loc[2],kk=i?loc[1]:loc[3];hip=lerp(hip,hh,locW);kn=lerp(kn,kk,locW)}
  if(aj){const hh=i?aj[0]:aj[2],kk=i?aj[1]:aj[3];hip=lerp(hip,hh,airW);kn=lerp(kn,kk,airW)}
  if(nj){const hh=i?nj[0]:nj[2],kk=i?nj[1]:nj[3];hip=lerp(hip,hh,spw);kn=lerp(kn,kk,spw)}
  if(glw>0){hip=lerp(hip,.3+(i?.06:0),glw);kn=lerp(kn,.25,glw)}
  L.hip.rotation.x=hip-tau;L.knee.rotation.x=kn;
 }
 if(nj){ // ninja koşusunda gövde alçalır, çekim yönüne eğilir
  h.hips.position.y-=.035*spw;
 }
 h.hips.rotation.z=(sm.lat||0)*.07+Math.cos(h.ph)*.05*swW; /* kayma eğimi + adım ritminde yan yuvarlanma */
 const lean=leanT-tau;
 sm.leanW=leanT;
 let ex=0,ey=0;
 if(c.swing!=null&&h.wk&&WP[h.wk]&&WP[h.wk].melee&&!h.zombie){const q=swingD(WP[h.wk],c.swing,c.combo,c.grip);ey=-q[4]*.45;ex=(gripOf(WP[h.wk],c.grip)===1?-.5:1)*q[3]*.12}
 else if(h.zombie&&c.atk>0){const a=c.atk;ex=a<.5?-.35*ease(a/.5):a<.68?lerp(-.35,.55,(a-.5)/.18):.55*(1-ease((a-.68)/.32))}
 h.spine.rotation.x=lean+ex*(1-Math.max(spw,glw));h.spine.rotation.y=ey*(1-Math.max(spw,glw))-Math.sin(h.ph)*.09*swW;h.spine.rotation.z=-(sm.lat||0)*.14;
 h.spine.position.y=.06+Math.sin((c.t||0)*1.6+h.ph)*.004;
 h.head.rotation.set(-pit*.7-leanT*(.5+.4*Math.max(spw,glw)),clamp(c.lookYaw||0,-1.1,1.1),0);
 h.aim.rotation.x=-pit-lean*.8;
 if(zb){zombieArms(h,c);return}
 // Atletik koşuda bükülü dirsek ve karşılıklı kol salınımı; süzülmede yukarı.
 const freeLoc=!h.W?sm.amp*(1-sm.air)*(1-sm.sl)*(1-sm.cr):0;
 const fw=Math.max(spw*(h.W&&h.W.g ? .4 : 1),glw,freeLoc);
 h.freeW=fw;h.fR=_fr;h.fL=_fl;
 if(fw>.01){
  const phi=h.hips.rotation.x+h.spine.rotation.x;
  for(let sd=0;sd<2;sd++){
   const arm=sd?h.armL:h.armR,out=sd?_fl:_fr,sg=sd?1:-1;
   out.set(0,0,0);
   if(nj||freeLoc>.01){
    const phase=(h.contact?h.contact.phase:h.sphs)*Math.PI*2+sd*Math.PI;
    out.set(sg*.065,-.32+.045*Math.cos(phase),.22+.15*Math.sin(phase));
   }
   if(glw>0){
    const gx=sg*.2,gy=.46,gz=.04;
    out.x=lerp(out.x,gx,glw/(glw+spw||1));out.y=lerp(out.y,gy,glw/(glw+spw||1));out.z=lerp(out.z,gz,glw/(glw+spw||1));
   }
   out.add(arm.p0);
  }
 }
 driveHolder(h,c);
 // paraşüt/kanat
 if(!c.noCanopy)glideCanopy(h,glw);
}
function glideCanopy(h,w){
 if(w<.02&&!h.cano)return;
 if(!h.cano){
  const g=new THREE.Group();
  const arc=1.7,cv=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.4,1.1,16,1,true,Math.PI-arc/2,arc),new THREE.MeshLambertMaterial({color:0xff7a2a,side:THREE.DoubleSide}));
  cv.rotation.x=Math.PI/2;g.add(cv);
  const st=new THREE.Mesh(new THREE.CylinderGeometry(1.41,1.41,1.12,16,1,true,Math.PI-arc/2,arc*.18),new THREE.MeshLambertMaterial({color:0xffffff,side:THREE.DoubleSide}));
  st.rotation.x=Math.PI/2;g.add(st);
  const m2=new THREE.LineBasicMaterial({color:0xe8e8e8});
  for(const sx of[-1,1])for(const sz of[-.45,.45]){g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V3(sx*1.04,.9,sz),V3(sx*.22,.45,.05)]),m2))}
  g.position.set(0,.55,0);h.hips.add(g);h.cano=g;
 }
 h.cano.visible=w>.3;
 const s=Math.min(1,w*1.4);h.cano.scale.setScalar(.2+.8*s);
 h.cano.rotation.x=-h.hips.rotation.x-h.spine.rotation.x*.2-.1;
}

/* ----- İskelet pozu seyreltme (CPU kazandırır) -----
   Uzak ve/veya kamera arkasındaki varlıklarda animHuman çağrısını azalt; ekranda fark edilmez.
   Dönüş: 0 = bu kareyi atla; >0 = animHuman'a verilecek dt çarpanı (birikmiş zaman telafi edilir,
   yürüyüş fazı ve geçişler hızlanıp yavaşlamaz). */
function poseRate(e,dx,dz){
 if(typeof p==='undefined'||!p)return 1;
 e.skN=(e.skN||0)+1;
 const d2=dx*dx+dz*dz;
 const behind=Math.sin(p.yaw)*dx+Math.cos(p.yaw)*dz>0;
 if(d2>900&&behind)return e.skN%3?0:3; /* 30 m üstü arkada 1/3; ÖNDEKİLER her karede (akıcılık: önde seyreltme bot hareketini kesik gösteriyordu) */
 if(behind&&d2>100)return e.skN%3?0:3;                 /* 10 m üstü arkada: 1/3 */
 return 1;
}

/* ===== Ragdoll (Verlet noktaları + kemik uzunluğu kısıtları) ===== */
const RAGS=[];
const RN=['head','neck','shL','shR','elL','elR','haL','haR','pel','hpL','hpR','knL','knR','anL','anR'];
const RC=[['head','neck'],['neck','shL'],['neck','shR'],['shL','shR'],['neck','pel'],['shL','pel'],['shR','pel'],['shL','hpR'],['shR','hpL'],['shL','hpL'],['shR','hpR'],['pel','hpL'],['pel','hpR'],['hpL','hpR'],['shL','elL'],['elL','haL'],['shR','elR'],['elR','haR'],['hpL','knL'],['knL','anL'],['hpR','knR'],['knR','anR'],['head','shL'],['head','shR']];
const _rx=V3(),_ry=V3(),_rz=V3(),_rm=new THREE.Matrix4(),_rq=new THREE.Quaternion();

// Bütün ragdoll tipleri aynı harita zemini/sınırlarını kullanır.
const RAG_ENV={floor:0,xmin:-29.4,xmax:29.4,zmin:-29.4,zmax:29.4};
function ragdollEnvironment(x,z,y){
 const e=RAG_ENV;if(typeof mode!=='undefined'&&mode==='wc'&&typeof WCG!=='undefined'&&WCG.game){const b=WCG.game.getBounds();e.floor=typeof wcTerrainHeight==='function'?wcTerrainHeight(x,z):0;e.xmin=-b.halfWidth;e.xmax=b.halfWidth;e.zmin=b.minZ;e.zmax=typeof WCT!=='undefined'?Math.min(18,WCT.rear-2):18;return e}
 const ow=typeof OW!=='undefined'&&OW.on,mc=typeof MC!=='undefined'&&MC.cur,bd=ow?OWH-2:mc?MC.cur.ext:29.4;e.floor=ow?owH(x,z):mc?Math.max(mcGround(x,z,y+.3),MC.cur.minY-1):0;e.xmin=e.zmin=-bd;e.xmax=e.zmax=bd;return e;
}
function removeRagdollRoot(root){if(!root)return;S.remove(root);const skeletons=new Set();root.traverse(o=>{if(o.isSkinnedMesh&&o.skeleton)skeletons.add(o.skeleton)});for(const skeleton of skeletons)skeleton.dispose()}
function spawnRagdoll(h,vel,hitPt,hitDir,power){
 h.root.updateMatrixWorld(true);
 const g=(o,x,y,z)=>o.localToWorld(V3(x,y,z));
 const P0={head:g(h.head,0,.17,0),neck:g(h.head,0,0,0),shL:g(h.spine,.22,.46,0),shR:g(h.spine,-.22,.46,0),
  elL:g(h.armL.el,0,0,0),elR:g(h.armR.el,0,0,0),haL:g(h.armL.el,0,-h.armL.L2,0),haR:g(h.armR.el,0,-h.armR.L2,0),
  pel:g(h.hips,0,0,0),hpL:g(h.hips,.1,-.02,0),hpR:g(h.hips,-.1,-.02,0),
  knL:g(h.legs[1].knee,0,0,0),knR:g(h.legs[0].knee,0,0,0),anL:g(h.legs[1].knee,0,-.45,0),anR:g(h.legs[0].knee,0,-.45,0)};
 const pts={};
 RN.forEach(n=>{
  const p=P0[n],o=p.clone();
  o.addScaledVector(vel||_rx.set(0,0,0),-1/60);
  if(hitDir){const w=1/(1+3*p.distanceTo(hitPt||p));o.addScaledVector(hitDir,-(power||4)*w/60)}
  o.x+=rnd(-.003,.003);o.z+=rnd(-.003,.003);
  pts[n]={p,o};
 });
 const cons=RC.map(([a,b])=>[pts[a],pts[b],P0[a].distanceTo(P0[b])]);
 const root=new THREE.Group();
 const cl=m=>{const c=m.clone();c.visible=true;root.add(c);return c};
 const M={head:cl(h.head.children[1]),torso:cl(h.spine.children[0]),pelvis:cl(h.hips.children[0]),
  uaL:cl(h.armL.sh.children[0]),faL:cl(h.armL.el.children[0]),uaR:cl(h.armR.sh.children[0]),faR:cl(h.armR.el.children[0]),
  thL:cl(h.legs[1].hip.children[0]),shL:cl(h.legs[1].knee.children[0]),thR:cl(h.legs[0].hip.children[0]),shR:cl(h.legs[0].knee.children[0])};
 S.add(root);
 const r={pts,cons,M,root,t:0,acc:0};
 while(RAGS.length>=[3,6,12][SET.fx]){const o=RAGS.shift();S.remove(o.root)}
 RAGS.push(r);
 updRagMeshes(r);
 return r;
}
function segMesh(m,a,b){
 m.position.copy(a.p);_rx.copy(b.p).sub(a.p);
 if(_rx.lengthSq()<1e-8)return;
 _rx.normalize();m.quaternion.setFromUnitVectors(DOWN,_rx);
}
function updRagMeshes(r){
 const p=r.pts,M=r.M;
 _ry.copy(p.neck.p).sub(p.pel.p).normalize();
 _rx.copy(p.shL.p).sub(p.shR.p).normalize();
 _rz.crossVectors(_rx,_ry).normalize();
 _rx.crossVectors(_ry,_rz).normalize();
 _rm.makeBasis(_rx,_ry,_rz);_rq.setFromRotationMatrix(_rm);
 M.torso.quaternion.copy(_rq);M.torso.position.copy(p.pel.p).addScaledVector(_ry,.06);
 M.pelvis.quaternion.copy(_rq);M.pelvis.position.copy(p.pel.p);
 M.head.quaternion.copy(_rq);M.head.position.copy(p.neck.p);
 segMesh(M.uaL,p.shL,p.elL);segMesh(M.faL,p.elL,p.haL);segMesh(M.uaR,p.shR,p.elR);segMesh(M.faR,p.elR,p.haR);
 segMesh(M.thL,p.hpL,p.knL);segMesh(M.shL,p.knL,p.anL);segMesh(M.thR,p.hpR,p.knR);segMesh(M.shR,p.knR,p.anR);
 // kemikler kendi eksenlerinde dönmediği için forearm/shin konumlarını eklem noktasına çek
 M.faL.position.copy(p.elL.p);M.faR.position.copy(p.elR.p);M.shL.position.copy(p.knL.p);M.shR.position.copy(p.knR.p);
 M.uaL.position.copy(p.shL.p);M.uaR.position.copy(p.shR.p);M.thL.position.copy(p.hpL.p);M.thR.position.copy(p.hpR.p);
}
function stepRagdoll(r,dt){
 r.acc+=Math.min(Math.max(dt,0),.1);const g=18/3600;let substeps=0;
 while(r.acc>=1/60&&substeps++<6){
  r.acc-=1/60;
  for(const n of RN){
   const q=r.pts[n],p=q.p,o=q.o;
   const nx=p.x+(p.x-o.x)*.993,ny=p.y+(p.y-o.y)*.993-g,nz=p.z+(p.z-o.z)*.993;
   o.copy(p);p.set(nx,ny,nz);
  }
  for(let it=0;it<6;it++){
   for(const [a,b,rest] of r.cons){
    _rx.copy(b.p).sub(a.p);const len=_rx.length()||1e-6,df=(len-rest)/len*.5;
    a.p.addScaledVector(_rx,df);b.p.addScaledVector(_rx,-df);
   }
  }
  for(const n of RN){
   const q=r.pts[n],p=q.p,o=q.o;
   const env=ragdollEnvironment(p.x,p.z,p.y),gyR=env.floor;
   if(p.y<gyR+.06){p.y=gyR+.06;o.x+=(p.x-o.x)*.3;o.z+=(p.z-o.z)*.3;o.y=p.y}
   p.x=clamp(p.x,env.xmin,env.xmax);p.z=clamp(p.z,env.zmin,env.zmax);
   for(const b of bnear(p.x,p.z)){
    if(p.x>b.x1-.05&&p.x<b.x2+.05&&p.z>b.z1-.05&&p.z<b.z2+.05&&p.y<b.h+.05){
     const d=[p.x-(b.x1-.05),(b.x2+.05)-p.x,p.z-(b.z1-.05),(b.z2+.05)-p.z,(b.h+.05)-p.y];
     let mi=0;for(let i=1;i<5;i++)if(d[i]<d[mi])mi=i;
     if(mi===0){p.x=b.x1-.05;o.x=p.x}else if(mi===1){p.x=b.x2+.05;o.x=p.x}
     else if(mi===2){p.z=b.z1-.05;o.z=p.z}else if(mi===3){p.z=b.z2+.05;o.z=p.z}
     else{p.y=b.h+.05;o.y=p.y;o.x+=(p.x-o.x)*.3;o.z+=(p.z-o.z)*.3}
    }
   }
  }
 }
}
function updRags(dt){
 for(let i=RAGS.length-1;i>=0;i--){
  const r=RAGS[i];r.t+=dt;stepRagdoll(r,dt);updRagMeshes(r);
  if(r.t>9){S.remove(r.root);RAGS.splice(i,1)}
 }
}
function clearRags(){for(const r of RAGS)S.remove(r.root);RAGS.length=0}
