'use strict';
/* ===== Otomatik savaş (AFK): hedef bul, yaklaş, ateş et, can azalınca kaç/iyileş ===== */
const AUTO={on:false,tgt:null,mode:'hunt',rest:false,retarget:0,stk:0,stkT:0,lx:0,lz:0,side:1,sideT:0,sideF:0,jh:0,roam:null,roamT:0,deaths:[],yawE:0,pitE:0,safe:false,safeL:0};
const aiIn={wx:0,wz:0,fire:false,jump:false};
const AUTO_POL=[0,2,5],AUTO_ENG={rifle:38,smg:26,pistol:24,dual:19};

function toggleAuto(v){
 const on=v===undefined?!AUTO.on:!!v;
 if(on&&mode!=='ow')return;
 if(on===AUTO.on)return;
 AUTO.on=on;AUTO.tgt=null;AUTO.mode='hunt';AUTO.rest=false;AUTO.roam=null;AUTO.stk=0;AUTO.sideT=0;
 if(!on){aiIn.fire=false;aiIn.wx=aiIn.wz=0;firing=false;jHeld=false}
 owAfk(on);
 const b=$('ab');if(b)b.classList.toggle('off',!on);
 if(!window.BGMODE)owToast(on?'Otomatik savaş AÇIK':'Otomatik savaş kapandı');
}

/* Ekranın kapanmasını engelle (destekleyen tarayıcılarda) */
let wakeL=null;
function owAfk(on){
 try{
  if(on&&navigator.wakeLock)navigator.wakeLock.request('screen').then(l=>{wakeL=l}).catch(()=>{});
  else if(!on&&wakeL){wakeL.release();wakeL=null}
 }catch(e){}
}

/* Sekme arka plandayken (rAF durur) geçen süreyi toplu adımlarla simüle et */
let bgT=null,bgLast=0;
function bgStep(){
 const now=performance.now();let el=Math.min(180,(now-bgLast)/1000);bgLast=now;
 window.BGMODE=true;
 try{let n=0;while(el>1e-4&&n<3600){const dt=Math.min(.05,el);tick(dt);el-=dt;n++}}
 finally{window.BGMODE=false}
}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){
  if(mode==='ow'&&AUTO.on&&state==='play'&&!lobbyOn&&!bgT){bgLast=performance.now();bgT=setInterval(bgStep,1000)}
 }else if(bgT){clearInterval(bgT);bgT=null;bgStep();last=performance.now()}
});

/* ----- Yardımcılar ----- */
function steer(ux,uz){
 if(AUTO.sideT>0)return[-uz*AUTO.side,ux*AUTO.side];
 const ba=Math.atan2(uz,ux),tr=[0,.6,-.6,1.1,-1.1,1.7,-1.7];
 for(const a of tr){
  const c=Math.cos(ba+a),s=Math.sin(ba+a);
  if(!hitBox(p.x+c*1.5,p.z+s*1.5,p.y)&&!hitBox(p.x+c*.8,p.z+s*.8,p.y))return[c,s];
 }
 return[ux,uz];
}
function autoMove(vx,vz,k){
 const l=Math.hypot(vx,vz);
 if(l<.01){aiIn.wx=aiIn.wz=0;return}
 const s=steer(vx/l,vz/l);aiIn.wx=s[0]*k;aiIn.wz=s[1]*k;
}
function autoFace(dt,vx,vz){
 if(Math.hypot(vx,vz)<.01)return;
 let e=Math.atan2(-vx,-vz)-p.yaw;while(e>Math.PI)e-=6.2832;while(e<-Math.PI)e+=6.2832;
 p.yaw+=e*Math.min(1,6*dt);p.pitch*=Math.max(0,1-4*dt);
}
function autoAim(dt,dx,dz,dy,d){
 let e=Math.atan2(-dx,-dz)-p.yaw;while(e>Math.PI)e-=6.2832;while(e<-Math.PI)e+=6.2832;
 const ep=Math.atan2(dy,d)-p.pitch,k=Math.min(1,14*dt);
 p.yaw+=e*k;p.pitch=clamp(p.pitch+ep*k,-1.4,1.4);
 AUTO.yawE=e*(1-k);AUTO.pitE=ep*(1-k);
}
function autoStuck(dt,wanted){
 AUTO.stkT+=dt;
 if(AUTO.stkT<.6)return;
 const moved=Math.hypot(p.x-AUTO.lx,p.z-AUTO.lz);AUTO.lx=p.x;AUTO.lz=p.z;AUTO.stkT=0;
 if(wanted&&moved<.45){
  if(++AUTO.stk>=2){AUTO.sideT=1.2;AUTO.side*=-1;aiIn.jump=true;AUTO.stk=0}
 }else AUTO.stk=0;
}
function autoPol(){return AUTO.safe?0:AUTO_POL[SET.autoPol==null?1:SET.autoPol]}
/* Hedef seviye aralığı: kendi seviyemin 4 altından, politikanın izin verdiği üst sınıra kadar */
function autoBand(){const PL=SV.ow.lvl;return[Math.max(1,PL-4),PL+autoPol()]}
function autoPick(){
 const b=autoBand(),lo=b[0],hi=b[1];let best=null,bs=1e9,fb=null,fs=1e9,bandCamp=false;
 for(const c of OW.camps){
  const cd=Math.hypot(c.x-p.x,c.z-p.z);
  for(const m of c.mem){
   if(m.L>hi)continue;
   if(m.L>=lo)bandCamp=true;
   if(cd>250||m.state==='dead'||m.hp<=0)continue;
   const d=Math.hypot(m.x-p.x,m.z-p.z);
   if(m.L>=lo){if(d<bs){bs=d;best=m}}else if(d<fs){fs=d;fb=m}
  }
 }
 if(best)return best;
 return bandCamp?null:fb;
}
function autoRoam(){
 const b=autoBand(),lo=b[0],hi=b[1];let best=null,bd=1e9;
 for(const c of OW.camps){
  if(!c.mem.some(m=>m.L>=lo&&m.L<=hi))continue;
  const d=Math.hypot(c.x-p.x,c.z-p.z);
  if(d>16&&d<bd){bd=d;best=c}
 }
 if(!best)for(const c of OW.camps){
  if(!c.mem.some(m=>m.L<=hi))continue;
  const d=Math.hypot(c.x-p.x,c.z-p.z);
  if(d>16&&d<bd){bd=d;best=c}
 }
 return best?{x:best.x+4,z:best.z+1}:{x:0,z:14};
}

/* ----- Ana sürücü: stepPlayer içinde her adımda çağrılır ----- */
function autoDrive(dt){
 aiIn.wx=aiIn.wz=0;aiIn.fire=false;aiIn.jump=false;
 if(AUTO.jh>0){AUTO.jh-=dt;if(AUTO.jh<=0)jHeld=false}
 if(p.dead>0){AUTO.tgt=null;return}
 AUTO.retarget-=dt;AUTO.sideT-=dt;AUTO.sideF-=dt;
 if(AUTO.sideF<=0){AUTO.sideF=2+Math.random()*2.5;AUTO.side=Math.random()<.5?1:-1}
 /* üst üste ölürsek güvenli moda geç */
 while(AUTO.deaths.length&&OW.t-AUTO.deaths[0]>150)AUTO.deaths.shift();
 if(AUTO.safe&&SV.ow.lvl>AUTO.safeL)AUTO.safe=false;
 if(!AUTO.safe&&AUTO.deaths.length>=2){AUTO.safe=true;AUTO.safeL=SV.ow.lvl;if(!window.BGMODE)owToast('Üst üste öldün, güvenli hedef seçimine geçtim')}
 const hf=p.hp/owMax();
 if(hf<.45&&SV.ow.med>0&&OW.medCd<=0)owMed();
 /* tehditler */
 let th=null,thd=1e9,ml=null,mld=1e9;
 for(const m of OW.act){
  if(m.state!=='aggro')continue;
  const d=Math.hypot(m.x-p.x,m.z-p.z);
  if(d<thd){thd=d;th=m}
  if(!m.def.r&&d<mld){mld=d;ml=m}
 }
 /* mob saldırısı: kilitlenen halkadan çık; vuruşa çok az kala dash (mükemmel kaçış) */
 {
  let ev=null,evt=9;
  for(const m of OW.act){
   if(!(m.atk>0)||m.struck)continue;
   const pa=1-m.atk/m.atkT;if(pa<.3)continue;
   if(Math.hypot(p.x-m.ax,p.z-m.az)>m.atkR+.9)continue;
   const tts=(.55-pa)*m.atkT;if(tts<evt){evt=tts;ev=m}
  }
  if(ev&&ev.seenN!==ev.nAtk){ev.seenN=ev.nAtk;ev.seen=Math.random()<.8}
  if(ev&&ev.seen){
   let ex=p.x-ev.ax,ez=p.z-ev.az,el=Math.hypot(ex,ez);
   if(el<.4){ex=p.x-ev.x;ez=p.z-ev.z;el=Math.hypot(ex,ez)||1}
   ex/=el;ez/=el;
   const sx=-ez*AUTO.side,sz=ex*AUTO.side;
   const dx2=ex*.8+sx*.6,dz2=ez*.8+sz*.6;
   if(evt<.26&&evt>.0&&SK.dCd<=0){aiIn.wx=dx2;aiIn.wz=dz2;skDash()}
   else if(evt>=.26||SK.dCd>0){autoMove(dx2,dz2,1);autoFace(dt,-dx2,-dz2)}
   aiIn.fire=false;AUTO.dodging=.25;return;
  }
 }
 /* kaçış: saldıranlardan uzaklaş, köye doğru */
 if(AUTO.mode==='flee'){
  if(hf>=.75||(!th&&hf>=.5))AUTO.mode='hunt';
  else{
   let ax=0,az=0;
   if(th){const l=Math.hypot(p.x-th.x,p.z-th.z)||1;ax=(p.x-th.x)/l;az=(p.z-th.z)/l}
   const vl=Math.hypot(p.x,p.z)||1;ax-=p.x/vl*.7;az-=p.z/vl*.7;
   if(th&&thd<5)skDash();
   autoMove(ax,az,1);autoFace(dt,ax,az);autoStuck(dt,true);return;
  }
 }else if(hf<.35&&th){AUTO.mode='flee';AUTO.tgt=null;return}
 /* dinlenme: tehdit yokken can düşükse köye yaklaş ve bekle */
 if(AUTO.rest){
  if(hf>=.85)AUTO.rest=false;
  else if(!th){
   const vd=Math.hypot(p.x,p.z);
   if(vd>11&&vd<170){autoMove(-p.x,-p.z,1);autoFace(dt,-p.x,-p.z);autoStuck(dt,true)}
   return;
  }
 }else if(!th&&hf<.5){AUTO.rest=true;return}
 /* hedef seç */
 let t=AUTO.tgt;
 if(t&&(t.hp<=0||t.state==='dead'))t=null;
 if(th&&(!t||t.state!=='aggro'))t=th;
 if(!t||AUTO.retarget<=0){AUTO.retarget=1.2;if(!t||t.state!=='aggro')t=th||autoPick()}
 AUTO.tgt=t;
 autoSkills(t,hf);
 const w=cw;
 if(!w.melee&&reload<=0&&ammo<=w.mag*.25&&thd>25)startReload();
 /* hedef yoksa gez */
 if(!t){
  AUTO.roamT-=dt;
  if(!AUTO.roam||AUTO.roamT<=0||Math.hypot(AUTO.roam.x-p.x,AUTO.roam.z-p.z)<10){AUTO.roam=autoRoam();AUTO.roamT=30}
  const rx=AUTO.roam.x-p.x,rz=AUTO.roam.z-p.z;
  autoMove(rx,rz,1);autoFace(dt,aiIn.wx,aiIn.wz);autoStuck(dt,true);return;
 }
 /* savaş */
 const dx=t.x-p.x,dz=t.z-p.z,d=Math.hypot(dx,dz)||.01,eye=p.y+p.eye,ty=owH(t.x,t.z)+1.1*t.sc;
 autoAim(dt,dx,dz,ty-eye,d);
 const rad=.45*(t.sc||1); /* Berkan (2026-10-19): otomatikte uzak durup ıskalıyordu → menzilin ~yarısına + gövde yarıçapına kadar sokul */
 const eng=w.melee?Math.max(1.3,w.range*.5)+rad:(AUTO_ENG[wk]||24);
 /* menzilli mob (def.r) varsa geri çekilir: dash ile boşluk kapat, kılıç menziline gir */
 if(w.melee&&t.def&&t.def.r&&SK.dCd<=0&&d>eng+.8){aiIn.wx=dx/d;aiIn.wz=dz/d;skDash()}
 let mx=0,mz=0;
 if(w.melee){if(d>eng){mx=dx/d;mz=dz/d}else if(d<.9+rad){mx=-dx/d;mz=-dz/d}}
 else if(ml&&mld<8&&mld<d+4){
  const ax=p.x-ml.x,az=p.z-ml.z,al=Math.hypot(ax,az)||1;
  mx=ax/al-az/al*AUTO.side*.45;mz=az/al+ax/al*AUTO.side*.45;
 }
 else if(d>eng){mx=dx/d;mz=dz/d}
 else if(d<eng*.4){mx=-dx/d;mz=-dz/d}
 else{mx=-dz/d*AUTO.side*.7;mz=dx/d*AUTO.side*.7}
 autoMove(mx,mz,1);autoStuck(dt,mx!==0||mz!==0);
 /* otomatik modda kılıç biraz erken savrulur; vuruş tespiti zaten +.4 toleranslı, ıskalamaz */
 const range=w.melee?w.range+rad+.3:Math.min(eng+8,60);
 if(d<=range&&Math.abs(AUTO.yawE)<Math.max(.035,Math.atan2(.4,d))&&Math.abs(AUTO.pitE)<.12&&(w.melee||owLOS(p.x,eye,p.z,t.x,ty,t.z)))aiIn.fire=true;
}

/* Otomatik yetenek kullanımı: slotlardaki yetenekler duruma göre */
function autoSkills(t,hf){
 if(SK.chain)return;
 let n6=0,n7=0,n9=0,n10=0,n20=0,ag=0;
 for(const m of OW.act){
  if(m.state!=='aggro')continue;
  ag++;const d=Math.hypot(m.x-p.x,m.z-p.z);
  if(d<6)n6++;if(d<7)n7++;if(d<9)n9++;if(d<10)n10++;if(!m.boss&&d<20)n20++;
 }
 if(!t&&!ag)return;
 const sl=SV.ow.sk,use=id=>sl.includes(id)&&skUse(id);
 const td=t?Math.hypot(t.x-p.x,t.z-p.z):99;
 if(ag>=1&&td<14){use('inferno');use('godspeed')}
 if(hf<.6&&n6>=2)use('drain');
 if(n7>=3)use('quake');
 if(n9>=3&&hf<.7)use('frost');
 if(n10>=3)use('crescent');
 if(n20>=4)use('raijin');
 if(ag>=3&&hf<.75&&n10>=2)use('shield');
 if(n10>=5)use('meteor');
 if(t&&td>6&&td<22)use('wave');
}
