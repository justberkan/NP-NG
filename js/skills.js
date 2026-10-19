'use strict';
/* ===== Açık dünya yetenekleri: dash + 10 yetenek, 5 slot, efektler, otomatik kullanım ===== */
/* ----- Sınıflar ----- */
const CLS={
 war:{n:'Savaşçı',ic:'⚔️',col:'#ffb020',spd:1,dmg:1,red:0,d:'Orta hız, orta hasar. Kombo yaptıkça hasarı artar (en fazla +%24).',st:['Hız ×1,00','Hasar ×1,00 (+kombo)','Hasar azaltma yok']},
 nin:{n:'Ninja',ic:'🥷',col:'#b48cff',spd:1.4,dmg:.7,red:0,d:'Çok hızlı, ama hasarı Savaşçıdan %30 az. Kaçış ve ani saldırı yetenekleri vardır.',st:['Hız ×1,40','Hasar ×0,70','Hasar azaltma yok']},
 heal:{n:'Şifacı',ic:'✚',col:'#2ee59d',spd:1.2,dmg:.9,red:0,d:'Hızlı, hasarı Savaşçıdan %10 az. Kendini ve yakındaki takım arkadaşlarını iyileştirir.',st:['Hız ×1,20','Hasar ×0,90','Hasar azaltma yok']},
 tank:{n:'Tank',ic:'🛡️',col:'#6fb8ff',spd:.82,dmg:1,red:.3,d:'Ağır ama %30 hasar azaltır. Yetenekle geçici hızlanır, takıma %25 koruma verir.',st:['Hız ×0,82','Hasar ×1,00','Gelen hasar −%30']}
};
const clsCur=()=>CLS[(typeof SV!=='undefined'&&SV.ow&&SV.ow.cls)||'war']||CLS.war;
const clsId=()=>(typeof SV!=='undefined'&&SV.ow&&SV.ow.cls)||'war';
const clsSpd=()=>clsCur().spd;
const clsDmg=()=>{if(mode!=='ow')return 1;const c=clsCur();return c.dmg*(clsId()==='war'?1+Math.min(.24,Math.max(0,CMB.tier+1)*.04):1)};
const clsRed=()=>mode!=='ow'?1:(1-clsCur().red)*((SK.act.bulwark>0||SK.guard>0)?.75:1);
const SKD=[
 {id:'mend',cls:'heal',n:'Şifa Dalgası',lv:1,cd:10,ic:'💚',col:'#2ee59d',d:'Kendini ve 18 m içindeki takım arkadaşlarını maksimum canının %35\'i kadar iyileştirir.',st:'Takım şifası · %35 · 18 m · Bekleme 10 sn'},
 {id:'sanct',cls:'heal',n:'Kutsal Alan',lv:6,cd:35,ic:'✨',col:'#9bffd6',d:'8 saniye boyunca saniyede maksimum canın %5\'i kadar iyileştirir; 10 m içindeki takım arkadaşları da aynı etkiyi alır.',st:'Takım şifası · 8 sn · 10 m · Bekleme 35 sn'},
 {id:'bulwark',cls:'tank',n:'Koruma Çağrısı',lv:1,cd:28,dur:8,ic:'🛡️',col:'#6fb8ff',d:'8 saniye boyunca sen ve 20 m içindeki takım arkadaşların %25 daha az hasar alırsın. Bekleme süresi etki bittikten sonra başlar.',st:'Takım koruması · %25 · 8 sn · 20 m · Bekleme 28 sn'},
 {id:'charge',cls:'tank',n:'Demir Hamle',lv:6,cd:16,dur:4,ic:'💨',col:'#9fd4ff',d:'4 saniye boyunca hareket hızın %60 artar. Ağır zırhına rağmen koşabilirsin.',st:'Hız · +%60 · 4 sn · Bekleme 16 sn'},
 {id:'smoke',cls:'nin',n:'Duman Bombası',lv:1,cd:20,ic:'💨',col:'#c9b8ff',d:'Dumana karışırsın: 1,6 saniye hasar almazsın, 6 m içindeki moblar 1,5 saniye sersemler.',st:'Kaçış · 1,6 sn dokunulmaz · 6 m · Bekleme 20 sn'},
 {id:'shadow',cls:'nin',n:'Gölge Adımı',lv:6,cd:14,dur:5,ic:'🌑',col:'#8a6bff',d:'5 saniye boyunca hareket hızın %40, hasarın %25 artar. Bekleme süresi etki bittikten sonra başlar.',st:'Güçlendirme · 5 sn · Bekleme 14 sn'},
 {id:'warcry',cls:'war',n:'Savaş Narası',lv:1,cd:22,dur:10,ic:'📣',col:'#ffb020',d:'10 saniye boyunca hasarın %25 artar. Bekleme süresi etki bittikten sonra başlar.',st:'Güçlendirme · +%25 hasar · 10 sn · Bekleme 22 sn'},
 {id:'crescent',n:'Hilal Fırtınası',lv:2,cd:12,ic:'🌀',col:'#7fe9ff',d:'Kılıcı hızla savurup çevrende kesme dalgaları açar. 10 m içindeki bütün moblar vurulur, hafif düşmanlar savrulur. Bosslar savrulmaz.',st:'Alan · 10 m · Bekleme 12 sn'},
 {id:'wave',n:'Kılıç Dalgası',lv:3,cd:8,ic:'🌙',col:'#9fd4ff',d:'İleri doğru uzun bir kesik dalgası fırlatır. Yolundaki bütün mobları deler geçer.',st:'Çizgi · 27 m · Bekleme 8 sn'},
 {id:'inferno',n:'Cehennem Kılıcı',lv:5,cd:10,dur:60,ic:'🔥',col:'#ff7a2a',d:'Kılıcına alev basar. 60 saniye boyunca kılıç hasarı 2 katına çıkar. Bekleme süresi güçlendirme bittikten sonra başlar.',st:'Güçlendirme · 60 sn · Bekleme 10 sn'},
 {id:'godspeed',n:'İlahî Hız',lv:7,cd:30,dur:180,ic:'⚡',col:'#6fd8ff',d:'Hareket hızı %30, kılıç saldırı hızı %25 artar. Arkanda gölgeli görüntüler kalır. Bekleme süresi bittikten sonra başlar.',st:'Güçlendirme · 3 dk · Bekleme 30 sn'},
 {id:'raijin',n:'Raijin: Şimşek İnfazı',lv:10,cd:45,ic:'🌩️',col:'#b8f0ff',d:'En yakın mobun arkasına ışınlanıp tek darbeyle öldürür, sonra sıradakine geçer. 20 m çevrede en fazla 10 farklı mob. Işınlanırken hasar almazsın. Boss ve elitlere uygulanmaz.',st:'Zincir · 20 m · 10 hedef · Bekleme 45 sn'},
 {id:'quake',n:'Yer Yarığı',lv:12,cd:18,ic:'🪨',col:'#d9a35a',d:'Kılıcı yere saplar. 8 m içindeki moblar ağır hasar alır ve 2 saniye sersemler.',st:'Alan · 8 m · Sersem 2 sn · Bekleme 18 sn'},
 {id:'frost',n:'Buz Çemberi',lv:14,cd:25,ic:'❄️',col:'#aee8ff',d:'Etrafında buz halkası yayılır. 9 m içindeki moblar hasar alır ve 3,5 saniye donar.',st:'Alan · 9 m · Dondurma 3,5 sn · Bekleme 25 sn'},
 {id:'drain',n:'Kan Hasadı',lv:17,cd:30,ic:'🩸',col:'#ff4a5a',d:'6 m içindeki moblardan can çeker. Vurduğun her mob için maksimum canının %5\'i kadar iyileşirsin.',st:'Alan · 6 m · Can çalma · Bekleme 30 sn'},
 {id:'shield',n:'Ruh Kalkanı',lv:20,cd:35,ic:'🛡️',col:'#9fb8ff',d:'8 saniye boyunca maksimum canının %70\'i kadar hasarı emen bir kalkan oluşturur.',st:'Koruma · 8 sn · Bekleme 35 sn'},
 {id:'meteor',n:'Gök Taşı',lv:25,cd:40,ic:'☄️',col:'#ff9a3a',d:'Havaya sıçrayıp yere çakılırsın. 11 m içinde dev bir patlama olur, moblar sersemler ve savrulur.',st:'Alan · 11 m · Bekleme 40 sn'}
];
const SKID={};SKD.forEach(s=>SKID[s.id]=s);
const DASH_CD=2.4;let _shL=0;
const SK={guard:0,hotT:0,hotR:0,hudHp:0,dashT:-99,dashX:0,dashZ:0,cd:{},cdMax:{},act:{},dT:0,dCd:0,dX:0,dZ:0,chain:null,shield:0,shT:0,q:[],waves:[],meteor:0,gT:0,pT:0,hudT:0,hudS:{},dom:false};

/* ----- Yardımcılar ----- */
const swBase=()=>cw.dmg*(cw.sw?swMul(wk):1);
const skUnlocked=id=>SKID[id]&&SV.ow.lvl>=SKID[id].lv&&(!SKID[id].cls||SKID[id].cls===clsId());
const skMeleeMul=()=>(SK.act.inferno>0?2:1)*(SK.act.warcry>0?1.25:1)*(SK.act.shadow>0?1.25:1);
const skMove=()=>(SK.act.godspeed>0?1.3:1)*clsSpd()*(SK.act.charge>0?1.6:1)*(SK.act.shadow>0?1.4:1);
const skAtkSpd=()=>SK.act.godspeed>0?1.25:1;
const meleeDmg=()=>mode==='ow'?swBase()*skMeleeMul()*clsDmg():cw.dmg;
const _sv=V3(),_sv2=V3();

function skReset(){
 SK.cd={};SK.cdMax={};SK.act={};SK.dT=0;SK.dCd=0;SK.chain=null;SK.shield=0;SK.shT=0;SK.q.length=0;SK.waves.length=0;SK.meteor=0;SK.slam=null;SK.slamCd=0;
 p.inv=0;skClearFx();skFill();
}
/* Seviyeyle açılan yetenekleri boş slotlara yerleştir */
function skFill(){
 const sl=SV.ow.sk;
 for(let i=0;i<5;i++)if(sl[i]&&(!SKID[sl[i]]||!skUnlocked(sl[i])))sl[i]=null;
 for(const s of SKD){
  if(!skUnlocked(s.id)||sl.includes(s.id))continue;
  const e=sl.indexOf(null);if(e<0)break;sl[e]=s.id;
 }
}
function skOnLevel(L){
 const had=SV.ow.sk.slice();skFill();
 for(const s of SKD)if(s.lv===L&&!window.BGMODE)owToast('Yeni yetenek açıldı: '+s.n);
 if(!window.BGMODE)skHud(true);
}

/* ----- Kullanım ----- */
function skCast(i){
 const id=SV.ow.sk[i];
 if(!id)return false;
 return skUse(id);
}
function skUse(id){
 if(mode!=='ow'||state!=='play'||p.dead>0||SK.chain||!skUnlocked(id))return false;
 if((SK.cd[id]||0)>0||(SK.act[id]||0)>0)return false;
 const s=SKID[id];let ok=true;
 switch(id){
  case 'crescent':skCrescent();break;
  case 'wave':skWave();break;
  case 'inferno':case 'godspeed':case 'warcry':case 'charge':case 'shadow':case 'bulwark':SK.act[id]=s.dur;SK.cdMax[id]=s.dur;
   if(!window.BGMODE){fxFlash(s.col,.45);snd(id==='inferno'?160:600,.25,.07,'sawtooth');owToast(s.n+' aktif · '+s.dur+' sn');if(typeof clsUse==='function')clsUse(id)}
   return true;
  case 'mend':case 'sanct':case 'smoke':if(typeof clsUse==='function')clsUse(id);break;
  case 'raijin':ok=skRaijin();break;
  case 'quake':skQuake();break;
  case 'frost':skFrost();break;
  case 'drain':skDrain();break;
  case 'shield':SK.shield=owMax()*.7;SK.shT=8;if(!window.BGMODE){fxFlash('#9fb8ff',.4);snd(500,.3,.06,'sine')}break;
  case 'meteor':skMeteor();break;
 }
 if(!ok)return false;
 SK.cd[id]=s.cd;SK.cdMax[id]=s.cd;
 return true;
}
function skQueue(t,fn){SK.q.push({t,fn})}

/* Hasar verme: kılıç hasarının katı */
function skHit(m,mult,o){
 o=o||{};
 const gy=owH(m.x,m.z),dx=m.x-p.x,dz=m.z-p.z,l=Math.hypot(dx,dz)||1;
 const info={player:true,pt:V3(m.x,gy+1.1*m.sc,m.z),dir:V3(dx/l,0,dz/l),head:false,melee:false,power:o.power||8,sk:1};
 if(o.kb)owKnock(m,o.kb,dx/l,dz/l);
 if(o.stun)owStun(m,o.stun);
 owDamage(m,o.raw?mult:swBase()*mult,info);
}
function skAoe(r,mult,o){
 o=o||{};let n=0;
 for(const m of OW.act.slice()){
  if(m.state==='dead'||m.hp<=0)continue;
  if(Math.hypot(m.x-p.x,m.z-p.z)>r+.5||Math.abs(owH(m.x,m.z)-p.y)>6)continue;
  skHit(m,mult,o);n++;
  if(o.each)o.each(m);
  if(o.max&&n>=o.max)break;
 }
 return n;
}

/* ----- Yetenekler ----- */
function skCrescent(){
 const kb=[9,0,0];
 for(let i=0;i<3;i++)skQueue(.05+i*.16,()=>{
  skAoe(10,.55,{kb:i===0?9:0,power:7});
  if(!window.BGMODE){fxRing(p.x,p.y,p.z,10-i*1.2,'#7fe9ff',.45,1);fxCres(p.x,p.y+1.1,p.z,8+i,i);snd(380+i*120,.1,.06,'sawtooth');camKick(i%2?-.05:.05)}
 });
 if(!window.BGMODE){swU=0;swHit=true;swCombo=(swCombo+1)%3}
}
function skWave(){
 const fx=-Math.sin(p.yaw),fz=-Math.cos(p.yaw);
 const w={x:p.x+fx*1.2,z:p.z+fz*1.2,y:p.y+1.0,dx:fx,dz:fz,t:0,hit:new Set(),mesh:null};
 if(!window.BGMODE){w.mesh=fxWaveMesh(w);snd(700,.12,.06,'sawtooth');camKick(.03);swU=0;swHit=true;swCombo=(swCombo+1)%3}
 SK.waves.push(w);
}
function skUpdWaves(dt){
 for(let i=SK.waves.length-1;i>=0;i--){
  const w=SK.waves[i];w.t+=dt;
  const px=w.x,pz=w.z;w.x+=w.dx*34*dt;w.z+=w.dz*34*dt;
  for(const m of OW.act.slice()){
   if(m.state==='dead'||m.hp<=0||w.hit.has(m.id))continue;
   /* yolun çizgisine uzaklık */
   const ax=m.x-px,az=m.z-pz,pr=ax*w.dx+az*w.dz,per=Math.abs(ax*w.dz-az*w.dx);
   if(pr>-.5&&pr<34*dt+.5&&per<2.4&&Math.abs(owH(m.x,m.z)-(w.y-1))<5){w.hit.add(m.id);skHit(m,1.7,{kb:6,power:9})}
  }
  if(w.mesh){w.mesh.position.set(w.x,owH(w.x,w.z)+1.0,w.z);w.mesh.material.opacity=Math.min(.9,(.8-w.t)*2)}
  if(w.t>=.8||hitBox(w.x,w.z,p.y+1)){if(w.mesh){S.remove(w.mesh);w.mesh.material.dispose()}SK.waves.splice(i,1)}
 }
}
function skQuake(){
 skAoe(8,2,{stun:2,kb:7,power:11});
 if(!window.BGMODE){fxRing(p.x,p.y,p.z,8,'#d9a35a',.6,1);fxCracks(p.x,p.z);fxBurst(p.x,p.y+.3,p.z,'#c9a06a',26,5,.8);snd(70,.35,.1,'sawtooth');camKick(.06);swU=0;swHit=true;swCombo=2}
}
function skFrost(){
 skAoe(9,.9,{stun:3.5,kb:4,power:5});
 if(!window.BGMODE){fxRing(p.x,p.y,p.z,9,'#aee8ff',.7,1);fxRing(p.x,p.y,p.z,6,'#ffffff',.5,1);fxBurst(p.x,p.y+.5,p.z,'#cdf4ff',34,6,.9);fxFlash('#aee8ff',.35);snd(1200,.25,.05,'sine')}
}
function skDrain(){
 let heal=0;
 const n=skAoe(6,1.1,{max:10,each:()=>{heal+=owMax()*.05}});
 if(n){p.hp=Math.min(owMax(),p.hp+heal);hudHp()}
 if(!window.BGMODE){fxRing(p.x,p.y,p.z,6,'#ff4a5a',.5,1);fxBurst(p.x,p.y+1,p.z,'#ff5a6a',24,4,.9);fxFlash('#ff2a3a',.3);snd(220,.3,.06,'triangle')}
}
function skMeteor(){
 p.vy=13;p.g=false;p.vx*=.3;p.vz*=.3;SK.meteor=1;p.inv=Math.max(p.inv,1.2);
 if(!window.BGMODE){fxFlash('#ff9a3a',.35);snd(300,.3,.06,'sawtooth')}
}
function skMeteorLand(){
 SK.meteor=0;p.inv=Math.max(p.inv,.4);
 skAoe(11,4,{stun:1.5,kb:12,power:14});
 if(!window.BGMODE){fxRing(p.x,p.y,p.z,11,'#ff9a3a',.7,1);fxRing(p.x,p.y,p.z,7,'#ffd070',.5,1);fxCracks(p.x,p.z);fxBurst(p.x,p.y+.4,p.z,'#ff7a2a',50,8,1);snd(55,.5,.12,'sawtooth');camKick(.09)}
}

/* ----- Raijin: zincirleme şimşek infazı ----- */
const RJ_R=20,RJ_N=10,RJ_DT=.17;
function rjValid(m,c){
 /* her atlamada yeniden doğrulanır: canlı mı, boss/elit değil mi, ilk noktanın 20 m içinde mi, zincirde daha önce var mı */
 return m&&m.state!=='dead'&&m.hp>0&&!m.boss&&!c.used.has(m.id)&&Math.hypot(m.x-c.ox,m.z-c.oz)<=RJ_R+1.5;
}
function skRaijin(){
 const ox=p.x,oz=p.z;
 const cand=OW.act.filter(m=>m.state!=='dead'&&m.hp>0&&!m.boss&&Math.hypot(m.x-ox,m.z-oz)<=RJ_R);
 if(!cand.length){if(!window.BGMODE)owToast('Raijin: 20 m içinde geçerli hedef yok');return false}
 const list=[],used=new Set();let cx=ox,cz=oz;
 while(list.length<RJ_N){
  let best=null,bd=1e9;
  for(const m of cand){if(used.has(m.id))continue;const d=Math.hypot(m.x-cx,m.z-cz);if(d<bd){bd=d;best=m}}
  if(!best)break;used.add(best.id);list.push(best);cx=best.x;cz=best.z;
 }
 SK.chain={list,i:0,t:.08,ox,oz,used:new Set(),n:0};
 p.inv=Math.max(p.inv,.3+list.length*RJ_DT+.3);
 if(!window.BGMODE){fxFlash('#b8f0ff',.55);snd(1500,.1,.07,'sawtooth')}
 return true;
}
function skUpdChain(dt){
 const c=SK.chain;if(!c)return;
 c.t-=dt;if(c.t>0)return;
 let m=null;
 while(c.i<c.list.length){const q=c.list[c.i++];if(rjValid(q,c)){m=q;break}}
 if(!m){SK.chain=null;p.inv=Math.max(p.inv,.35);if(!window.BGMODE)owToast('Raijin: '+c.n+' hedef infaz edildi');return}
 c.used.add(m.id);c.n++;c.t=RJ_DT;
 const px=p.x,py=p.y,pz=p.z,fx=Math.sin(m.yaw),fz=Math.cos(m.yaw);
 /* mobun arkasına geç; engel varsa yana ya da öne */
 const tries=[[-fx,-fz],[fz,-fx],[-fz,fx],[fx,fz]];let bx=m.x,bz=m.z;
 for(const t of tries){const x=m.x+t[0]*1.5,z=m.z+t[1]*1.5;if(!hitBox(x,z,owH(x,z))){bx=x;bz=z;break}}
 p.x=bx;p.z=bz;p.y=owH(bx,bz);p.vx=p.vz=p.vy=0;p.g=true;
 p.yaw=Math.atan2(-(m.x-bx),-(m.z-bz));p.pitch=0;
 if(!window.BGMODE){
  fxBolt(V3(px,py+1,pz),V3(bx,p.y+1,bz),'#9fe8ff');
  fxGhost(px,py,pz,p.yaw,'#4aa8ff',.5);
  fxFlash('#d8f6ff',.4);
  fxBurst(m.x,p.y+1,m.z,'#aee8ff',14,5,.5);
  snd(900+c.n*90,.07,.07,'sawtooth');swU=0;swHit=true;swCombo=(swCombo+1)%3;slashFx(swCombo,'#bff4ff');camKick(.04);
 }
 /* tek vuruşta öldür: normal moblar */
 const gy=owH(m.x,m.z);
 owDamage(m,m.max*50,{player:true,pt:V3(m.x,gy+1.1*m.sc,m.z),dir:V3(m.x-px,0,m.z-pz).normalize(),head:false,melee:true,power:13,sk:1,exec:1});
}

/* ----- Dash ----- */
function skDash(){
 if(mode!=='ow'||state!=='play'||p.dead>0||SK.chain||SK.dCd>0)return false;
 let mx=(kDown('right')?1:0)-(kDown('left')?1:0)+joy.x,mz=(kDown('fwd')?1:0)-(kDown('back')?1:0)-joy.y;
 if(AUTO.on&&(aiIn.wx||aiIn.wz)){SK.dX=aiIn.wx;SK.dZ=aiIn.wz}
 else{
  if(Math.hypot(mx,mz)<.15){mx=0;mz=1}
  const l=Math.hypot(mx,mz);mx/=l;mz/=l;
  const sn=Math.sin(p.yaw),cs=Math.cos(p.yaw);
  SK.dX=mx*cs-mz*sn;SK.dZ=-mx*sn-mz*cs;
 }
 const l=Math.hypot(SK.dX,SK.dZ)||1;SK.dX/=l;SK.dZ/=l;
 SK.dT=.2;SK.dCd=DASH_CD;p.inv=Math.max(p.inv,.3);p.nrT=.45; /* Berkan (2026-10-20): dash atarken Naruto koşusu pozu */SK.dashT=OW.t;SK.dashX=p.x;SK.dashZ=p.z;
 p.vx=SK.dX*30;p.vz=SK.dZ*30;
 if(!window.BGMODE){fxGhost(p.x,p.y,p.z,p.yaw,'#7fb8ff',.4);snd(500,.08,.05,'sawtooth');fxFlash('#ffffff',.12)}
 return true;
}

/* ----- Zamanlayıcılar ve yetenek adımı (oyun zamanıyla) ----- */
function skUpdate(dt){
 SK.gT+=dt;
 if(p.inv>0)p.inv-=dt;
 if(SK.dCd>0)SK.dCd-=dt;
 if(SK.dT>0){SK.dT-=dt;if(!window.BGMODE&&(SK.gT-SK.pT)>.05){SK.pT=SK.gT;fxGhost(p.x,p.y,p.z,p.yaw,'#7fb8ff',.3)}}
 for(const id in SK.cd)if(SK.cd[id]>0)SK.cd[id]-=dt;
 for(const id in SK.act)if(SK.act[id]>0){
  SK.act[id]-=dt;
  if(SK.act[id]<=0){SK.act[id]=0;SK.cd[id]=SKID[id].cd;SK.cdMax[id]=SKID[id].cd;if(!window.BGMODE)owToast(SKID[id].n+' sona erdi')}
 }
 if(SK.shT>0){SK.shT-=dt;if(SK.shT<=0)SK.shield=0}
 if(SK.guard>0)SK.guard-=dt;
 if(SK.hotT>0){SK.hotT-=dt;const mx=owMax();if(p.hp>0)p.hp=Math.min(mx,p.hp+mx*SK.hotR*dt);SK.hudHp-=dt;if(SK.hudHp<=0){SK.hudHp=.25;hudHp()}}
 if(SK.shield!==_shL){_shL=SK.shield;hudHp()}
 for(let i=SK.q.length-1;i>=0;i--){const e=SK.q[i];e.t-=dt;if(e.t<=0){SK.q.splice(i,1);e.fn()}}
 skUpdWaves(dt);
 skUpdChain(dt);
 if(SK.meteor){
  if(SK.meteor===1&&p.vy<0){SK.meteor=2;p.vy=-30}
  else if(SK.meteor===2&&p.g)skMeteorLand();
 }
 if(SK.slamCd>0)SK.slamCd-=dt;
 if(SK.slam){if(p.dead>0)SK.slam=null;else if(p.g)skSlamLand();else{p.vy=Math.min(p.vy,-24);SK.slam.t+=dt;if(SK.slam.t>4)SK.slam=null}}
}

/* ----- Yere vurma (Berkan, 2026-10-19): açık dünyada havadayken yakın dövüş saldırısı → yere çakılış.
   Yükseklik arttıkça hasar ve alan büyür (1 m: ~3,5 m alan, ~1x; 10 m: ~7,5 m, ~2,4x; tavan 10 m alan, 3,2x). ----- */
const SLAM_MINH=1;
function skSlamTry(){
 if(mode!=='ow'||!cw.melee||p.g||p.dead>0||SK.meteor||SK.slam||SK.slamCd>0||SK.chain)return false;
 const h=p.y-owH(p.x,p.z);if(!(h>=SLAM_MINH))return false;
 SK.slam={y0:p.y,t:0};p.vy=Math.min(p.vy,-24);p.vx*=.4;p.vz*=.4;p.glide=0;
 if(!window.BGMODE)snd(420,.12,.05,'sawtooth');
 return true;
}
function skSlamHit(H){return {r:Math.min(10,3+H*.45),mult:Math.min(3.2,.8+H*.16),stun:.3+Math.min(1,H*.06),kb:6+Math.min(10,H),power:8+Math.min(10,H)}}
function skSlamLand(){
 const H=Math.max(0,SK.slam.y0-p.y),k=skSlamHit(H);
 SK.slam=null;SK.slamCd=1.2;p.inv=Math.max(p.inv,.25);
 const n=skAoe(k.r,k.mult,{stun:k.stun,kb:k.kb,power:k.power});
 SK.lastSlam={H:+H.toFixed(2),r:+k.r.toFixed(2),mult:+k.mult.toFixed(2),n};
 if(!window.BGMODE){fxRing(p.x,p.y,p.z,k.r,'#d9a35a',.5,1);if(H>4){fxRing(p.x,p.y,p.z,k.r*.6,'#ffd070',.4,1);fxCracks(p.x,p.z)}fxBurst(p.x,p.y+.3,p.z,'#c9a06a',Math.round(12+H*2),4+H*.3,.7);snd(Math.max(45,90-H*4),.3,.1,'sawtooth');camKick(Math.min(.09,.03+H*.005))}
 return n;
}
/* Kalkan hasarı emer; true dönerse hasar tamamen emildi */
function skAbsorb(d){
 if(SK.shield<=0)return d;
 const a=Math.min(SK.shield,d);SK.shield-=a;
 if(SK.shield<=0)SK.shT=0;
 if(!window.BGMODE)snd(900,.05,.04,'sine');
 return d-a;
}

/* ----- Mob etkileri ----- */
function owKnock(m,sp,dx,dz){
 if(m.boss||m.def.hp>=1.5)return;
 const l=Math.hypot(dx,dz)||1;m.kvx=dx/l*sp;m.kvz=dz/l*sp;m.kb=.2;
}
function owStun(m,t){
 m.stun=Math.max(m.stun||0,m.boss?t*.35:t);
}

/* ===== Etkiler ===== */
const FX=[],GH=[],PT=[];let fxInit=false,ghGeo=null,ringGeo=null,cresGeo=[];
const ADD=()=>THREE.AdditiveBlending;
function fxEnsure(){
 if(fxInit)return;fxInit=true;
 ringGeo=new THREE.RingGeometry(.78,1,56);ringGeo.rotateX(-Math.PI/2);
 const P=(w,h,d,x,y,z,c)=>({w,h,d,x,y,z,c});
 ghGeo=mergeBoxes([P(.34,.16,.2,0,.95,0,0xffffff),P(.38,.5,.21,0,1.4,0,0xffffff),P(.2,.22,.2,0,1.82,0,0xffffff),P(.1,.55,.1,-.26,1.35,.06,0xffffff),P(.1,.55,.1,.26,1.35,.06,0xffffff),P(.14,.9,.15,-.1,.45,0,0xffffff),P(.14,.9,.15,.1,.45,0,0xffffff)]).geometry;
 /* hilal şerit geometrileri: 0 yatay, 1 çapraz, 2 dikey (kamera önüne yerleşir) */
 [0,1,2].forEach(i=>cresGeo.push(mkCres(i)));
 for(let i=0;i<90;i++){
  const m=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.1),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:1,blending:ADD(),depthWrite:false}));
  m.visible=false;S.add(m);PT.push({m,t:0,life:1,vx:0,vy:0,vz:0,g:0});
 }
 for(let i=0;i<14;i++){
  const m=new THREE.Mesh(ghGeo,new THREE.MeshBasicMaterial({color:0x4aa8ff,transparent:true,opacity:.5,blending:ADD(),depthWrite:false}));
  m.visible=false;S.add(m);GH.push({m,t:0,life:.4});
 }
}
/* Hilal şerit: uçlara doğru incelen bir yay */
function mkCres(kind){
 const seg=22,R=1,wd=.16,a0=kind===2?-1.2:-1.15,a1=kind===2?1.2:1.15;
 const pos=new Float32Array((seg+1)*2*3),idx=[];
 for(let i=0;i<=seg;i++){
  const t=i/seg,a=a0+(a1-a0)*t,th=wd*Math.sin(Math.PI*t);
  const ox=Math.sin(a)*R,oy=-Math.cos(a)*R+R*.92,ix=Math.sin(a)*(R-th),iy=-Math.cos(a)*(R-th)+R*.92;
  pos.set([ox,oy,0,ix,iy,0],i*6);
  if(i<seg){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2)}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setIndex(idx);g.userData.n=idx.length;return g;
}
function fxAdd(m,dur,upd){S.add(m);FX.push({m,t:0,dur,upd})}
function fxRing(x,y,z,R,col,dur){
 if(window.BGMODE||!SET.fx)return;fxEnsure();
 const m=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:new THREE.Color(col),transparent:true,opacity:.85,blending:ADD(),depthWrite:false,side:THREE.DoubleSide}));
 m.position.set(x,owH(x,z)+.12,z);m.scale.setScalar(.3);
 fxAdd(m,dur,f=>{const e=1-Math.pow(1-f,3);m.scale.setScalar(.3+(R-.3)*e);m.material.opacity=.85*(1-f)});
}
/* çevrede dönen hilal kesikler */
function fxCres(x,y,z,R,i){
 if(window.BGMODE||!SET.fx)return;fxEnsure();
 const m=new THREE.Mesh(cresGeo[0],new THREE.MeshBasicMaterial({color:0xbff4ff,transparent:true,opacity:.9,blending:ADD(),depthWrite:false,side:THREE.DoubleSide}));
 m.position.set(x,y,z);m.rotation.y=Math.random()*6.28;m.rotation.z=(i-1)*.25;
 const r0=m.rotation.y;
 fxAdd(m,.45,f=>{m.scale.setScalar(1+(R-1)*Math.min(1,f*1.6));m.rotation.y=r0+f*5;m.material.opacity=.9*(1-f)});
}
/* yerde çatlaklar */
function fxCracks(x,z){
 if(window.BGMODE||!SET.fx)return;fxEnsure();
 const parts=[];
 for(let i=0;i<10;i++){const a=i/10*6.28+Math.random()*.4,l=2+Math.random()*4;parts.push({w:.14,h:.05,d:l,x:Math.sin(a)*(l/2+.6),y:0,z:Math.cos(a)*(l/2+.6),c:0x20120a,a})}
 const g=new THREE.Group();
 parts.forEach(q=>{const b=new THREE.Mesh(new THREE.BoxGeometry(q.w,q.h,q.d),new THREE.MeshBasicMaterial({color:0x20120a,transparent:true,opacity:.9}));b.position.set(q.x,0,q.z);b.rotation.y=q.a;g.add(b)});
 g.position.set(x,owH(x,z)+.08,z);
 fxAdd(g,1.6,f=>{g.children.forEach(b=>b.material.opacity=.9*(1-f))});
}
function fxWaveMesh(w){
 fxEnsure();
 const m=new THREE.Mesh(cresGeo[2],new THREE.MeshBasicMaterial({color:0xcfeeff,transparent:true,opacity:.9,blending:ADD(),depthWrite:false,side:THREE.DoubleSide}));
 m.scale.set(2.4,2.4,2.4);m.rotation.y=p.yaw+Math.PI/2;m.rotation.z=0;
 m.position.set(w.x,w.y,w.z);S.add(m);return m;
}
function fxGhost(x,y,z,yaw,col,life){
 if(window.BGMODE||!SET.fx)return;fxEnsure();
 const g=GH.find(o=>!o.m.visible);if(!g)return;
 g.m.visible=true;g.t=0;g.life=life||.4;g.m.material.color.set(col||'#4aa8ff');g.m.material.opacity=.5;
 g.m.position.set(x,y,z);g.m.rotation.y=yaw+Math.PI;
}
function fxBolt(a,b,col){
 if(window.BGMODE||!SET.fx)return;fxEnsure();
 const n=9,pts=[];
 for(let i=0;i<=n;i++){const t=i/n,j=i===0||i===n?0:.5;pts.push(V3(lerp(a.x,b.x,t)+rnd(-j,j),lerp(a.y,b.y,t)+rnd(-j,j),lerp(a.z,b.z,t)+rnd(-j,j)))}
 const grp=new THREE.Group();
 [[col,.9],['#ffffff',1]].forEach((c,i)=>{
  const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(q=>q.clone().add(V3(0,i?0:.03,0)))),new THREE.LineBasicMaterial({color:new THREE.Color(c[0]),transparent:true,opacity:c[1],blending:ADD(),depthWrite:false}));
  ln.frustumCulled=false;grp.add(ln);
 });
 fxAdd(grp,.3,f=>{grp.children.forEach(l=>l.material.opacity=1-f)});
 fxAdd(new THREE.Group(),.01,()=>{});
}
function fxBurst(x,y,z,col,n,sp,life){
 if(window.BGMODE||!SET.fx)return;fxEnsure();
 const c=new THREE.Color(col);
 for(let i=0;i<n;i++){
  const q=PT.find(o=>!o.m.visible);if(!q)return;
  const a=Math.random()*6.28,e=Math.random()*sp;
  q.m.visible=true;q.t=0;q.life=life*(.6+Math.random()*.6);q.vx=Math.cos(a)*e;q.vz=Math.sin(a)*e;q.vy=Math.random()*sp*.8+1;q.g=9;
  q.m.material.color.copy(c);q.m.material.opacity=1;q.m.position.set(x,y,z);q.m.scale.setScalar(.6+Math.random()*1.2);
 }
}
function fxPart(x,y,z,col,vy,life,size){
 const q=PT.find(o=>!o.m.visible);if(!q)return;
 q.m.visible=true;q.t=0;q.life=life;q.vx=rnd(-.5,.5);q.vz=rnd(-.5,.5);q.vy=vy;q.g=-1;
 q.m.material.color.set(col);q.m.material.opacity=1;q.m.position.set(x,y,z);q.m.scale.setScalar(size);
}
/* ekran parlaması ve kenar ışıması */
function fxFlash(col,a){
 const e=$('fxo');if(!e||window.BGMODE)return;
 /* performans: offsetWidth ile zorla sayfa düzenlemesi yerine Web Animations (her çağrıda takılma yok) */
 e.style.transition='none';e.style.background='radial-gradient(circle,'+col+'00 25%,'+col+' 130%)';e.style.opacity=0;
 if(e.animate){if(e._fa)e._fa.cancel();e._fa=e.animate([{opacity:a},{opacity:0}],{duration:350,easing:'ease'})}
}
let camRollK=0;
function camKick(v){camRollK=v}
/* kılıç izi: kamera önünde hızla açılan hilal */
function slashFx(combo,col){
 if(window.BGMODE||!SET.fx)return;fxEnsure();
 const kind=combo%3,g=cresGeo[kind===1?1:kind===2?2:0];
 const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:new THREE.Color(col||(cw.glow?cw.glow:0xdff6ff)),transparent:true,opacity:.95,blending:ADD(),depthWrite:false,side:THREE.DoubleSide}));
 const rz=[.15,-.7,Math.PI/2][kind];
 if(tp){m.position.set(p.x-Math.sin(p.yaw)*1.8,p.y+1.2,p.z-Math.cos(p.yaw)*1.8);m.rotation.set(0,p.yaw,rz)}
 else{m.position.set(0,0,-1.7);m.rotation.z=rz;cam.add(m)}
 m.scale.set(1.5,1.5,1.5);m.geometry.setDrawRange(0,0);
 const par=tp?S:cam;
 FX.push({m,t:0,dur:.26,par,upd:f=>{const r=Math.min(1,f*3.2);m.geometry.setDrawRange(0,Math.floor(g.userData.n/6*r)*6);m.material.opacity=.95*(1-Math.max(0,f-.35)/.65)}});
 if(tp)S.add(m);
}
function skClearFx(){
 for(const f of FX){if(f.m.parent)f.m.parent.remove(f.m)}FX.length=0;
 for(const g of GH)g.m.visible=false;
 for(const q of PT)q.m.visible=false;
 for(const w of SK.waves)if(w.mesh)S.remove(w.mesh);
 SK.waves.length=0;
}

/* ----- Görsel adım (çizim sırasında) ----- */
function skVisual(dt){
 skHud(false,dt);
 if(!fxInit)return;
 for(let i=FX.length-1;i>=0;i--){
  const f=FX[i];f.t+=dt;const k=Math.min(1,f.t/f.dur);f.upd(k);
  if(k>=1){if(f.m.parent)f.m.parent.remove(f.m);if(f.m.material)f.m.material.dispose();FX.splice(i,1)}
 }
 for(const g of GH)if(g.m.visible){g.t+=dt;if(g.t>=g.life)g.m.visible=false;else g.m.material.opacity=.5*(1-g.t/g.life)}
 for(const q of PT)if(q.m.visible){
  q.t+=dt;if(q.t>=q.life){q.m.visible=false;continue}
  q.vy-=q.g*dt;q.m.position.x+=q.vx*dt;q.m.position.y+=q.vy*dt;q.m.position.z+=q.vz*dt;
  q.m.material.opacity=1-q.t/q.life;
 }
 /* kılıç parlaması ve ateş parçacıkları */
 const hs=[VM.h,pRigObj];
 for(const h of hs){
  if(!h||!h.W||!h.wk||!WP[h.wk].sw)continue;
  let col=null;
  if(SK.act.inferno>0)col=0xff5a14;else if(SK.act.godspeed>0)col=0x6fd8ff;else if(WP[h.wk].glow)col=WP[h.wk].glow;
  const bl=SWBL[h.wk]||[.2,1];
  if(!h.W.glowM){
   const m=new THREE.Mesh(new THREE.BoxGeometry(.08,.115,bl[1]),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.35,blending:ADD(),depthWrite:false}));
   m.position.set(0,0,bl[0]+bl[1]/2);h.W.g.add(m);h.W.glowM=m;
  }
  const gm=h.W.glowM;gm.visible=!!col&&(h===VM.h?VM.root.visible:pRigObj&&pRigObj.root.visible);
  if(col){gm.material.color.setHex(col);gm.material.opacity=.28+.12*Math.sin(SK.gT*14)}
  if(col&&gm.visible&&SK.act.inferno>0&&SET.fx){
   h.W.g.updateWorldMatrix(true,false);
   _sv.set(rnd(-.03,.03),rnd(-.03,.03),bl[0]+Math.random()*bl[1]).applyMatrix4(h.W.g.matrixWorld);
   fxPart(_sv.x,_sv.y,_sv.z,Math.random()<.5?'#ff7a1a':'#ffd070',rnd(.8,2),.4,rnd(.18,.4));
  }
 }
 if(SK.act.godspeed>0&&SET.fx&&Math.hypot(p.vx,p.vz)>4&&(SK.gT-SK.pT)>.09){SK.pT=SK.gT;fxGhost(p.x,p.y,p.z,p.yaw,'#4aa8ff',.45)}
 /* kenar ışıması: aktif güçlendirmeler */
 const b=$('fxb');
 if(b){
  let sh='';
  if(SK.act.inferno>0)sh+='inset 0 0 110px rgba(255,90,20,.45)';
  if(SK.act.godspeed>0)sh+=(sh?',':'')+'inset 0 0 130px rgba(80,200,255,.4)';
  if(SK.shield>0)sh+=(sh?',':'')+'inset 0 0 90px rgba(150,180,255,.55)';
  if(sh!==b.dataset.s){b.dataset.s=sh;b.style.boxShadow=sh||'none'}
 }
 camRollK*=Math.pow(.0005,dt);
}

/* ----- Arayüz: slot çubuğu ve dokunmatik düğmeler ----- */
function skDom(){
 if(SK.dom)return;SK.dom=true;
 const h=$('hud');
 const fo=document.createElement('div');fo.id='fxo';h.appendChild(fo);
 const fb=document.createElement('div');fb.id='fxb';h.appendChild(fb);
 const bar=document.createElement('div');bar.id='skbar';
 bar.innerHTML=[0,1,2,3,4].map(i=>`<div class='sk' data-i='${i}'><i></i><b></b><s></s><em>${i+1}</em></div>`).join('')+`<div class='sk dash'><i>💨</i><b></b><s></s><em>⇧</em></div>`;
 h.appendChild(bar);
 bar.querySelectorAll('.sk').forEach(e=>{e.style.pointerEvents='auto';e.addEventListener('pointerdown',ev=>{ev.stopPropagation();if(state!=='play')return;if(e.classList.contains('dash'))skDash();else skCast(+e.dataset.i)})});
 ['k1','k2','k3','k4','k5','bd'].forEach(id=>{const e=$(id);if(e)e.innerHTML='<i></i><b></b><s></s>'});
 const ip=document.createElement('div');ip.id='ipr';h.appendChild(ip);
}
function skSlotSet(el,ic,col,frac,txt,on,empty){
 const k=ic+'|'+col+'|'+(Math.round(frac*60))+'|'+txt+'|'+on+'|'+empty;
 if(el.dataset.k===k)return;el.dataset.k=k;
 el.children[0].textContent=ic;el.children[1].style.background=frac>0?`conic-gradient(rgba(10,14,24,.78) ${frac*360}deg,transparent 0)`:'none';
 el.children[2].textContent=txt;
 el.classList.toggle('on',!!on);el.classList.toggle('empty',!!empty);
 el.style.setProperty('--sc',col||'#ece5d8');
}
function skHud(force,dt){
 if(mode!=='ow')return;
 skDom();
 SK.hudT-=dt||0;if(SK.hudT>0&&!force)return;SK.hudT=.05;
 const sl=SV.ow.sk,bar=$('skbar');
 const slots=[];
 for(let i=0;i<5;i++){
  const id=sl[i],el=bar.children[i],tb=$('k'+(i+1));
  const set=(e)=>{
   if(!e)return;
   if(!id){skSlotSet(e,'＋','#5a6275',0,'',false,true);return}
   const s=SKID[id],a=SK.act[id]||0,c=SK.cd[id]||0;
   if(a>0)skSlotSet(e,s.ic,s.col,a/(s.dur||1),Math.ceil(a)+'',true,false);
   else if(c>0)skSlotSet(e,s.ic,s.col,c/(SK.cdMax[id]||s.cd),Math.ceil(c)+'',false,false);
   else skSlotSet(e,s.ic,s.col,0,'',false,false);
  };
  set(el);set(tb);
 }
 const dc=Math.max(0,SK.dCd);
 [bar.children[5],$('bd')].forEach(e=>{if(e)skSlotSet(e,'💨','#cfe8ff',dc/DASH_CD,dc>0?dc.toFixed(1):'',false,false)});
}

let hitStopT=0,slowT=0;
