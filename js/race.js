'use strict';
/* ===== YARIS MODU (Kimi) — kara (araba) + hava (ucak) yarisi =====
   Blur tarzi 3 slotlu item sistemi: mayin, enerji topu, hizlanma, gudumlu top (x3),
   isin topu, kalkan, onarim. Yoldan gecerek alinir; ileri/geri atilir ya da yere birakilir.
   Oyuncu + 5 AI (kara) / 3 AI (hava). Tum kontroller kontrol sistemiyle degistirilebilir. */
const RACE={picked:false,on:false,cfg:{veh:'falcon',laps:3,items:true,ai:'hard'},t:0,count:0,v:null,list:[],pads:[],projs:[],mines:[],drops:[],fx:[],rings:[],buildings:[],grp:null,track:null,air:false,pos:1,finished:false,endT:0,eng:null,msgT:0,lastHud:'',lastSlot:-1};

/* ---------- Item tanimlari ---------- */
const RITEMS={
 mine:{n:'Mayın',i:'💣',d:'Yere bırakılır, dokunanı havaya uçurur (45 hasar)'},
 orb:{n:'Enerji Topu',i:'🔮',d:'Düz giden enerji küresi (35 hasar)'},
 boost:{n:'Hızlanma',i:'⚡',d:'3 sn %45 ekstra hız'},
 homing:{n:'Güdümlü Enerji Topu',i:'🎯',d:'Öndekini kilitler, tek tek 3 atış'},
 beam:{n:'Işın Topu',i:'🔆',d:'İnce huzmede anında vurur (50 hasar + sersemlik)'},
 shield:{n:'Kalkan',i:'🛡',d:'6 sn item hasarına bağışık'},
 repair:{n:'Araç Onarımı',i:'🔧',d:'+40 can'}
};
const RITEMPOOL=['mine','orb','boost','homing','homing','beam','shield','shield','repair','repair','orb','mine'];

/* ---------- Pist: kapali Catmull-Rom, merkez cizgisi + duvar + yüzey ---------- */
function raceCurvePts(air){
 if(air)return[
  [0,14,-90],[46,20,-64],[76,30,-18],[58,34,24],[84,24,64],[44,16,92],[0,26,64],[-44,34,92],[-78,24,48],[-62,34,4],[-86,26,-44],[-44,18,-78]];
 return[
  [0,0,-52],[30,0,-52],[46,0,-38],[46,0,-16],[32,0,-6],[34,0,14],[50,0,26],[50,0,44],[32,0,54],[-6,0,54],[-26,0,44],[-34,0,26],[-22,0,12],[-28,0,-8],[-44,0,-18],[-46,0,-38],[-28,0,-52]];
}
function raceBuildTrack(air){
 const scale=air?1:3; // same circuit, three times the horizontal scale
 const pts=raceCurvePts(air).map(p=>V3(p[0]*scale,p[1],p[2]*scale));
 const curve=new THREE.CatmullRomCurve3(pts,true,'catmullrom',.6);
 const M=1024,samples=[],L=curve.getLength();
 for(let i=0;i<M;i++){
  const u=i/M,p=curve.getPointAt(u),t=curve.getTangentAt(u);
  const rl=Math.hypot(t.x,t.z)||1;
  samples.push({x:p.x,y:p.y,z:p.z,tx:t.x/rl,tz:t.z/rl,rx:-t.z/rl,rz:t.x/rl,s:u*L});
 }
 return{curve,samples,L,halfW:air?0:8.2,M};
}
/* araca en yakin ornek: onceki indeksin cevresinde dar pencere (O(1)) */
function raceNearest(tr,x,z,ci){
 const M=tr.M,s=tr.samples;let best=ci,bd=Infinity;
 for(let o=-64;o<=64;o++){
  const i=((ci+o)%M+M)%M,q=s[i];
  const dx=x-q.x,dz=z-q.z,d=dx*dx+dz*dz;
  if(d<bd){bd=d;best=i}
 }
 return best;
}
/* mermi gibi konumu bilinmeyenler icin tam tarama */
function raceNearestAny(tr,x,z){
 const M=tr.M,s=tr.samples;let best=0,bd=Infinity;
 for(let i=0;i<M;i+=4){const q=s[i];
  const dx=x-q.x,dz=z-q.z,d=dx*dx+dz*dz;
  if(d<bd){bd=d;best=i}}
 return raceNearest(tr,x,z,best);
}
/* pist yüzeyi: asfalt serit + kenar cizgileri + bariyer + start cizgisi */
function raceTrackMesh(tr,grp){
 const M=tr.M,s=tr.samples,HW=tr.halfW;
 const strip=(off0,off1,y,col)=>{
  const g=new THREE.BufferGeometry(),v=[],ix=[];
  for(let i=0;i<=M;i+=4){const q=s[i%M];
   v.push(q.x+q.rx*off0,y,q.z+q.rz*off0,q.x+q.rx*off1,y,q.z+q.rz*off1);
   if(i){const b=v.length/3-2;ix.push(b-2,b-1,b,b-1,b+1,b)}}
  g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:col,side:THREE.DoubleSide}));grp.add(m);return m;
 };
 strip(-HW,HW,.02,0x2b2f36);           // asfalt
 strip(-HW,-HW+.35,.03,0xd8dee6);strip(HW-.35,HW,.03,0xd8dee6); // kenar cizgileri
 // bariyer: kirmizi/beyaz seritler (tek geometry, vertex renk)
 const g=new THREE.BufferGeometry(),v=[],cl=[],ix=[];
 let k=0;
 for(const side of[-1,1]){
  for(let i=0;i<M;i+=4){
   const q=s[i],q2=s[(i+4)%M],o=side*(HW+.25);
   v.push(q.x+q.rx*o,0,q.z+q.rz*o, q.x+q.rx*o,.85,q.z+q.rz*o, q2.x+q2.rx*o,0,q2.z+q2.rz*o, q2.x+q2.rx*o,.85,q2.z+q2.rz*o);
   const c=(i/4)%2?.92:.78;
   for(let j=0;j<4;j++)cl.push(c,side>0?.16:.12,.14);
   ix.push(k,k+2,k+1,k+1,k+2,k+3);k+=4;
  }
 }
 g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));g.setIndex(ix);g.computeVertexNormals();
 grp.add(new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true})));
 // start cizgisi: dama
 const q=s[0],sq=new THREE.Group();
 const tile=HW*2/12;
 for(let a=0;a<12;a++)for(let b=0;b<2;b++){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(tile,tile),new THREE.MeshBasicMaterial({color:(a+b)%2?0xf2f4f6:0x14181d}));
  m.rotation.x=-Math.PI/2;m.position.set(-HW+(a+.5)*tile,.035,(b-.5)*tile);sq.add(m);
 }
 sq.position.set(q.x,0,q.z);sq.rotation.y=Math.atan2(q.tx,q.tz);grp.add(sq);
 // start kapisi
 const D=new THREE.MeshLambertMaterial({color:0x39424e});
 for(const side of[-1,1]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,6,8),D);p.position.set(q.x+q.rx*side*(HW+1.2),3,q.z+q.rz*side*(HW+1.2));grp.add(p)}
 const ban=new THREE.Mesh(new THREE.BoxGeometry(HW*2+2.6,1.1,.2),new THREE.MeshLambertMaterial({color:0xe8b621}));
 ban.position.set(q.x,6,q.z);ban.rotation.y=Math.atan2(q.rx,q.rz)+Math.PI/2;grp.add(ban);
}

/* ---------- Sehir (hava yarisi): binalar + halkalar ---------- */
function raceCityMesh(tr,grp){
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(280,280),new THREE.MeshLambertMaterial({color:0x3a4048}));
 ground.rotation.x=-Math.PI/2;grp.add(ground);
 // binalar: pistten uzak izgaraya yerlestir
 const cells=new Set();
 for(let gx=-6;gx<=6;gx++)for(let gz=-6;gz<=6;gz++){
  const x=gx*19+rnd(-3,3),z=gz*19+rnd(-3,3);
  let ok=true;
  for(let i=0;i<tr.M;i+=8){const q=tr.samples[i];if((x-q.x)*(x-q.x)+(z-q.z)*(z-q.z)<15*15){ok=false;break}}
  if(!ok||Math.random()<.22)continue;
  const w=rnd(8,13),d=rnd(8,13),h=rnd(12,42);
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:new THREE.Color().setHSL(.58,.08,rnd(.28,.42))}));
  m.position.set(x,h/2,z);grp.add(m);cells.add(m);
  RACE.buildings.push({x1:x-w/2,x2:x+w/2,z1:z-d/2,z2:z+d/2,h});
 }
 // pist hizasi boyunca isik direkleri (az sayida)
 for(let i=0;i<tr.M;i+=64){const q=tr.samples[i];
  const p=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,7,6),new THREE.MeshLambertMaterial({color:0x556070}));
  p.position.set(q.x+q.rx*(tr.halfW+2||6),3.5,q.z+q.rz*(6));grp.add(p);
 }
}
function raceRingsMesh(tr,grp){
 RACE.rings=[];
 const N=16;
 for(let k=0;k<N;k++){
  const i=Math.floor(k/N*tr.M),q=tr.samples[i];
  const ring=new THREE.Mesh(new THREE.TorusGeometry(6.2,.45,8,24),new THREE.MeshLambertMaterial({color:0x27e0ff,emissive:0x0d3a44}));
  ring.position.set(q.x,q.y,q.z);
  ring.rotation.y=Math.atan2(q.tx,q.tz);
  grp.add(ring);RACE.rings.push({m:ring,x:q.x,y:q.y,z:q.z});
 }
}

/* ---------- Arac olusturma (oyuncu + AI ortak) ---------- */
function raceNewRacer(id,isAI,slotIdx,total){
 const def=RACECARS[id],air=def.type==='plane';
 const mdl=raceBuildModel(id),v={
  id,def,air,mdl,ai:isAI,
  x:0,y:0,z:0,yaw:0,pitch:0,roll:0,vx:0,vz:0,vy:0,spd:0,
  steer:0,ci:0,prog:0,lastS:0,lap:0,hp:def.hp,maxhp:def.hp,
  slots:[null,null,null],sel:0,boostT:0,shieldT:0,stunT:0,wreckT:0,invT:0,
  nextRing:0,lapStart:0,bestLap:0,rank:slotIdx+1,finT:0,done:false,
  lat:(isAI?(slotIdx%2?1.9:-1.9)*(1+Math.floor(slotIdx/2)*.35):0),
  skill:isAI?RaceAI.skill(slotIdx):1
 };
 const tr=RACE.track;
 // grid: start cizgisinin gerisine kademeli dizil
 const back=8+slotIdx*7;
 const i0=((-Math.floor(back/tr.L*tr.M))%tr.M+tr.M)%tr.M,q=tr.samples[i0];
 v.ci=i0;v.x=q.x+q.rx*v.lat;v.z=q.z+q.rz*v.lat;v.y=air?q.y:0;
 v.yaw=Math.atan2(q.tx,q.tz);
 v.lastS=q.s;v.prog=air?q.s:-back;
 mdl.g.position.set(v.x,v.y,v.z);
 mdl.g.rotation.y=v.yaw;
 RACE.grp.add(mdl.g);
 if(typeof setShadow==='function')setShadow(mdl.g);
 return v;
}

/* ---------- Kara arac fizigi ---------- */
function raceCarStep(v,inp,dt){
 const def=v.def,tr=RACE.track;
 if(v.wreckT>0){
  v.wreckT-=dt;v.yaw+=dt*7;v.spd=Math.max(0,v.spd-dt*14);
  const fx=Math.sin(v.yaw),fz=Math.cos(v.yaw);
  v.x+=fx*v.spd*dt;v.z+=fz*v.spd*dt;
  v.mdl.g.position.set(v.x,0,v.z);v.mdl.g.rotation.y=v.yaw;
  raceVehicleAnim(v,dt);
  if(v.wreckT<=0){ // son kontrol noktasinda yeniden dog
   const back=((v.ci-40)%tr.M+tr.M)%tr.M,q=tr.samples[back];
   v.x=q.x+q.rx*v.lat*.3;v.z=q.z+q.rz*v.lat*.3;v.yaw=Math.atan2(q.tx,q.tz);
   v.vx=v.vz=0;v.spd=0;v.hp=Math.round(v.maxhp*.4);v.invT=2;v.stunT=0;
   raceHpSync();
  }
  return;
 }
 if(v.stunT>0)v.stunT-=dt;
 if(v.invT>0)v.invT-=dt;
 if(v.shieldT>0)v.shieldT-=dt;
 let boost=1;
 if(v.boostT>0){v.boostT-=dt;boost=1.45}
 const maxS=(20+def.spd*.22)*boost*(inp.boost?1.18:1)*(v.ai?v.skill*RACE.rubber(v):1);
 const th=v.stunT>0?0:inp.th,br=v.stunT>0?0:inp.br,st=v.stunT>0?0:inp.st,drift=inp.drift&&!v.air;
 // boyuna
 if(th>0)v.spd+= (14*(1-v.spd/maxS)+4)*th*dt;
 else if(th<0&&v.spd<1)v.spd=Math.max(v.spd-8*dt,-9);
 if(br>0){if(v.spd>.5)v.spd-=24*br*dt;else v.spd=Math.max(v.spd-8*dt,-9)}
 v.spd-=v.spd*(v.spd>0?.35:.8)*dt*.4+Math.sign(v.spd)*.4*dt;
 if(Math.abs(v.spd)<.15&&th===0)v.spd=0;
 // donus
 const gripK=3+def.grip*.09,steerRate=2.1-def.diff*.004;
 v.steer+=((st||0)-v.steer)*Math.min(1,10*dt);
 const dir=v.spd>=0?1:-1;
 v.yaw+=v.steer*steerRate*(drift?1.7:1)*dt*clamp(Math.abs(v.spd)/9,0,1)*dir;
 // yanal surtunme: hizi yone hizala (dusuk tutus = kayma)
 const fx=Math.sin(v.yaw),fz=Math.cos(v.yaw),rx=Math.cos(v.yaw),rz2=-Math.sin(v.yaw);
 let vF=v.vx*fx+v.vz*fz,vL=v.vx*rx+v.vz*rz2;
 vF=v.spd;
 vL-=vL*Math.min(1,gripK*(drift?.22:1)*dt);
 v.vx=fx*vF+rx*vL;v.vz=fz*vF+rz2*vL;
 v.x+=v.vx*dt;v.z+=v.vz*dt;
 // pist cercevesi: duvar
 v.ci=raceNearest(tr,v.x,v.z,v.ci);
 const q=tr.samples[v.ci];
 let off=(v.x-q.x)*q.rx+(v.z-q.z)*q.rz;
 const lim=tr.halfW-.7;
 if(Math.abs(off)>lim){
  off=clamp(off,-lim,lim);
  v.x=q.x+q.rx*off;v.z=q.z+q.rz*off;
  const out=(v.vx*q.rx+v.vz*q.rz);
  if(Math.abs(out)>6){raceDamage(v,Math.min(10,(Math.abs(out)-6)*.6),null);if(v.ai)v.stunT=Math.max(v.stunT,.4)}
  v.vx-=q.rx*out;v.vz-=q.rz*out;v.spd*=.82;
 }
 // ilerleme + tur
 let ds=q.s-v.lastS;
 if(ds<-tr.L/2)ds+=tr.L;if(ds>tr.L/2)ds-=tr.L;
 v.prog+=ds;v.lastS=q.s;
 v.mdl.g.position.set(v.x,0,v.z);
 v.mdl.g.rotation.set(0,v.yaw,0);
 raceVehicleAnim(v,dt);
}

/* ---------- Ucak fizigi ---------- */
function racePlaneStep(v,inp,dt){
 const def=v.def,tr=RACE.track;
 if(v.wreckT>0){
  v.wreckT-=dt;v.spd=Math.max(4,v.spd-dt*20);v.y-=dt*8;v.roll+=dt*9;v.pitch-=dt*2;
  if(v.y<0)v.y=0;
  racePlaneMove(v,dt);
  if(v.wreckT<=0){
   const k=Math.max(0,v.nextRing-1),r=RACE.rings[k]||RACE.rings[0];
   v.x=r.x;v.y=r.y;v.z=r.z;v.pitch=0;v.roll=0;v.spd=14;v.invT=2.5;v.hp=Math.round(v.maxhp*.5);
   const nq=tr.samples[Math.floor((k%tr.M))]||tr.samples[0];
   v.yaw=Math.atan2(nq.tx,nq.tz);raceHpSync();
  }
  return;
 }
 if(v.stunT>0)v.stunT-=dt;
 if(v.invT>0)v.invT-=dt;
 if(v.shieldT>0)v.shieldT-=dt;
 const maxS=(19+def.spd*.2)*(v.boostT>0?1.4:1)*(v.ai?v.skill*RACE.rubber(v):1);
 if(v.boostT>0)v.boostT-=dt;
 const th=v.stunT>0?0:inp.th,st=v.stunT>0?0:inp.st;
 v.pitch=clamp(v.pitch+(th<0?-1:th>0?1:0)*1.1*dt,-.62,.62); // W = alcal, S = yuksel
 if(th===0)v.pitch-=v.pitch*Math.min(1,1.4*dt);
 v.yaw+=st*1.5*dt*(1-Math.abs(v.pitch)*.35);
 v.roll+=((-st*.9)-v.roll)*Math.min(1,6*dt);
 v.spd+=(maxS-v.spd)*Math.min(1,.9*dt);
 v.pitch=clamp(v.pitch,-.62,.62);
 racePlaneMove(v,dt);
 // bina carpisma
 for(const b of RACE.buildings){
  if(v.x>b.x1-.8&&v.x<b.x2+.8&&v.z>b.z1-.8&&v.z<b.z2+.8&&v.y<b.h+.8&&v.y>0){
   if(v.invT<=0){raceWreck(v)}break;
  }
 }
 if(v.y<1.1&&v.invT<=0)raceWreck(v);
 if(v.y>70)v.y=70;
 // halka kontrol (sirayla)
 const ring=RACE.rings[v.nextRing];
 if(ring){
  const dx=v.x-ring.x,dy=v.y-ring.y,dz=v.z-ring.z;
  if(dx*dx+dy*dy+dz*dz<6.4*6.4){
   ring.m.material.color.setHex(0x51ff7d);setTimeout(()=>ring.m.material.color.setHex(0x27e0ff),1200);
   v.nextRing=(v.nextRing+1)%RACE.rings.length;
   if(v.nextRing===0){v.lap++;if(v===RACE.v)raceMsg('Tur '+(v.lap+1)+'/'+RACE.cfg.laps)}
   if(v===RACE.v)snd(980,.12,.05);
  }
 }
}
function racePlaneMove(v,dt){
 const cp=Math.cos(v.pitch);
 const fx=Math.sin(v.yaw)*cp,fy=Math.sin(v.pitch),fz=Math.cos(v.yaw)*cp;
 v.x+=fx*v.spd*dt;v.y+=fy*v.spd*dt;v.z+=fz*v.spd*dt;
 v.mdl.g.position.set(v.x,v.y,v.z);
 v.mdl.g.rotation.set(0,v.yaw,0);
 v.mdl.g.rotateX(-v.pitch);v.mdl.g.rotateZ(v.roll);
 raceVehicleAnim(v,dt);
}
function raceWreck(v){
 if(v.invT>0)return;
 v.hp=Math.max(0,v.hp-35);v.wreckT=2.2;raceBoomFx(v.x,v.y+.5,v.z,1.4);raceHpSync();
}

/* ---------- AI ---------- */
RACE.rubber=v=>RaceAI.rubber(v);
function raceAIThink(v,dt){
 if(!v.air)return RaceAI.drive(v,dt);
 const tr=RACE.track,inp={th:1,br:0,st:0,drift:false};
 if(v.air){
  const ring=RACE.rings[v.nextRing];
  if(ring){
   const dx=ring.x-v.x,dy=ring.y-v.y,dz=ring.z-v.z;
   const ty=Math.atan2(dx,dz),tp=clamp(Math.asin(clamp(dy/(Math.hypot(dx,dz)+1),-1,1)),-.6,.6);
   let dyaw=ty-v.yaw;while(dyaw>Math.PI)dyaw-=2*Math.PI;while(dyaw<-Math.PI)dyaw+=2*Math.PI;
   inp.st=clamp(dyaw*2,-1,1);
   inp.th=clamp((tp-v.pitch)*2.5,-1,1);
  }
  v.aiCd=(v.aiCd||0)-dt;
  if(RACE.cfg.items&&v.aiCd<=0&&v.slots.some(Boolean)){raceAIUse(v);v.aiCd=2.5}
  return inp;
 }
 return inp;
}
function raceAIUse(v){return RaceAI.use(v)}

/* ---------- Hasar / yikim ---------- */
function raceDamage(v,dmg,src){
 if(v.shieldT>0||v.invT>0||v.done)return;
 v.hp-=dmg;
 raceHitFx(v);
 if(v.hp<=0){v.hp=0;v.wreckT=v.air?2.4:2.2;raceBoomFx(v.x,(v.air?v.y:0)+.6,v.z,1.6)}
 raceHpSync();
}
function raceHitFx(v){
 if(typeof RaceAudio!=='undefined')RaceAudio.hit(v,.25);
 if(v===RACE.v&&!window.BGMODE){const e=$('vig');if(e){e.classList.remove('hit');void e.offsetWidth;e.classList.add('hit')}}
}
function raceHpSync(){if(RACE.v){p.hp=Math.max(0,Math.round(RACE.v.hp));hudHp()}}

/* ---------- Item kullanimi ---------- */
function raceUse(v,dir){
 const i=v.sel;
 const it=v.slots[i]||v.slots.find(Boolean);
 if(!it){if(v===RACE.v)raceMsg('Slot boş — pistteki ışıklı halkalardan özellik topla');return}
 const id=it.id,fx=Math.sin(v.yaw),fz=Math.cos(v.yaw);
 const y=v.air?v.y:.5;
 if(id==='mine'){
  RACE.mines.push({x:v.x-fx*2.4,y:y,z:v.z-fz*2.4,arm:1,life:30,owner:v,m:raceIconMesh('mine')});
  snd(180,.09,.05);
 }else if(id==='orb'){
  raceProjSpawn(v,'orb',fx*dir,fz*dir,null);
  snd(520,.1,.05);
 }else if(id==='homing'){
  it.ch=(it.ch||3)-1;
  let tgt=null,nd=70;
  for(const o of RACE.list){if(o===v||o.done)continue;
   const dx=o.x-v.x,dz=o.z-v.z,d=Math.hypot(dx,dz);
   if(d<nd&&d>4&&(dx*fx+dz*fz)*dir>d*.35){tgt=o;nd=d}}
  raceProjSpawn(v,'homing',fx*dir,fz*dir,tgt);
  snd(760,.12,.05);
  if(it.ch<=0)v.slots[v.slots.indexOf(it)]=null;
 }else if(id==='beam'){
  let tgt=null,bd=.21;
  for(const o of RACE.list){if(o===v||o.done)continue;
   const dx=o.x-v.x,dz=o.z-v.z,d=Math.hypot(dx,dz);
   if(d>44)continue;
   const a=Math.acos(clamp((dx*fx+dz*fz)*dir/d,-1,1));
   if(a<bd){bd=a;tgt=o}}
  const ex=tgt?tgt.x:v.x+fx*dir*44,ez=tgt?tgt.z:v.z+fz*dir*44,ey=(tgt?(tgt.air?tgt.y:.6):(v.air?v.y:.6));
  raceBeamFx(v.x,y+.4,v.z,ex,ey,ez);
  if(tgt){tgt.stunT=Math.max(tgt.stunT,.8);raceDamage(tgt,50,v);snd(1400,.16,.06)}
  else snd(1400,.08,.03);
 }else if(id==='boost'){v.boostT=3;snd(300,.25,.05)}
 else if(id==='shield'){v.shieldT=6;snd(880,.2,.05)}
 else if(id==='repair'){v.hp=Math.min(v.maxhp,v.hp+40);if(v===RACE.v){raceHpSync();raceMsg('+'+(Math.round(v.hp))+' can')}snd(660,.15,.05)}
 if(id!=='homing')v.slots[v.slots.indexOf(it)]=null;
 if(v===RACE.v){raceHudSlots(true);if(id!=='repair'&&RITEMS[id])raceMsg(RITEMS[id].n+' kullanıldı')}
}
function raceDrop(v){
 const it=v.slots[v.sel];if(!it){if(v===RACE.v)raceMsg('Bırakılacak özellik yok');return}
 const m=raceIconMesh(it.id);m.position.set(v.x,(v.air?v.y:.9),v.z);
 RACE.drops.push({x:v.x,y:(v.air?v.y:.9),z:v.z,item:{id:it.id,n:it.n,ch:it.ch},life:30,m});
 v.slots[v.sel]=null;raceHudSlots(true);
 if(v===RACE.v)raceMsg(it.n+' yere bırakıldı — geri alabilir veya rakibe bırakabilirsin');
 snd(240,.1,.05);
}
function raceIconMesh(id){
 const col={mine:0xff5138,orb:0xb44dff,boost:0xffd23f,homing:0xff9d2e,beam:0x4dd2ff,shield:0x51ff7d,repair:0x8dff57}[id]||0xffffff;
 const m=new THREE.Mesh(new THREE.OctahedronGeometry(.5),new THREE.MeshLambertMaterial({color:col,emissive:col,emissiveIntensity:.35}));
 return m;
}
function raceProjSpawn(v,kind,dx,dz,tgt){
 const y=v.air?v.y:.7;
 const p={x:v.x+dx*1.6,y:y,z:v.z+dz*1.6,vx:dx*46,vz:dz*46,life:kind==='homing'?5:2.6,kind,owner:v,tgt,air:v.air};
 p.m=new THREE.Mesh(new THREE.SphereGeometry(kind==='homing'?.42:.36,8,8),new THREE.MeshBasicMaterial({color:kind==='homing'?0xff9d2e:0xb44dff}));
 RACE.grp.add(p.m);RACE.projs.push(p);
}
function raceProjStep(dt){
 for(let i=RACE.projs.length-1;i>=0;i--){
  const p=RACE.projs[i];
  p.life-=dt;
  if(p.kind==='homing'){
   if(p.tgt&&p.tgt.done)p.tgt=null;
   const t=p.tgt;
   if(t){const dx=t.x-p.x,dz=t.z-p.z,d=Math.hypot(dx,dz)||1;
    p.vx+=(dx/d*70-p.vx)*Math.min(1,3.2*dt);p.vz+=(dz/d*70-p.vz)*Math.min(1,3.2*dt);
    if(p.air)p.y+=((t.air?t.y:.5)-p.y)*Math.min(1,3*dt);}
  }
  p.x+=p.vx*dt;p.z+=p.vz*dt;
  if(!p.air){const ci=raceNearestAny(RACE.track,p.x,p.z);const q=RACE.track.samples[ci];
   const off=(p.x-q.x)*q.rx+(p.z-q.z)*q.rz;
   if(Math.abs(off)>RACE.track.halfW){p.life=0;raceBoomFx(p.x,.5,p.z,.7)}}
  p.m.position.set(p.x,p.air?p.y:.7,p.z);
  let hit=null;
  for(const o of RACE.list){if(o===p.owner||o.done)continue;
   const oy=o.air?o.y:.5;
   const r=o.air?2.6:2.1;
   if((o.x-p.x)*(o.x-p.x)+(o.z-p.z)*(o.z-p.z)+(oy-p.y)*(oy-p.y)<r*r){hit=o;break}}
  if(hit){raceDamage(hit,p.kind==='homing'?30:35,p.owner);raceBoomFx(p.x,p.air?p.y:.6,p.z,.9);p.life=0}
  if(p.life<=0){raceDisposeGroup(p.m);RACE.projs.splice(i,1)}
 }
}
function raceMineStep(dt){
 for(let i=RACE.mines.length-1;i>=0;i--){
  const m=RACE.mines[i];
  m.arm-=dt;m.life-=dt;
  m.m.position.set(m.x,m.air?m.y:.45,m.z);
  m.m.rotation.y+=dt*3;
  let boom=m.life<=0;
  if(m.arm<=0)for(const o of RACE.list){if(o===m.owner&&m.life>28.5)continue;
   const oy=o.air?o.y:.5;
   if((o.x-m.x)*(o.x-m.x)+(o.z-m.z)*(o.z-m.z)+(oy-m.y)*(oy-m.y)<2.4*2.4){boom=true;break}}
  if(boom){
   for(const o of RACE.list){if(o.done)continue;
    const oy=o.air?o.y:.5;
    const d=Math.hypot(o.x-m.x,o.z-m.z,(oy-m.y));
    if(d<4.2)raceDamage(o,Math.round(45*(1-d/5)),m.owner)}
   raceBoomFx(m.x,m.air?m.y:.5,m.z,1.5);
   raceDisposeGroup(m.m);RACE.mines.splice(i,1);
  }
 }
}
function raceDropsStep(dt){
 for(let i=RACE.drops.length-1;i>=0;i--){
  const d=RACE.drops[i];d.life-=dt;
  d.m.rotation.y+=dt*2.4;d.m.position.y=d.y+Math.sin(clock*2.4)*.14;
  let taken=false;
  for(const o of RACE.list){if(o.done)continue;
   const oy=o.air?o.y:.5;
   if((o.x-d.x)*(o.x-d.x)+(o.z-d.z)*(o.z-d.z)+(oy-d.y)*(oy-d.y)<2.6*2.6){
    const free=o.slots.findIndex(s=>!s);
    if(free>=0){o.slots[free]={id:d.item.id,n:d.item.n,ch:d.item.ch};o.sel=free;taken=true;
     if(o===RACE.v){raceMsg(d.item.n+' alındı');snd(700,.1,.05);raceHudSlots(true)}
    }break}}
  if(taken||d.life<=0){raceDisposeGroup(d.m);RACE.drops.splice(i,1)}
 }
}
/* ---------- Pickup padleri (pistteki sabit ozellik noktalari) ---------- */
function raceBuildPads(){
 const fr=[.1,.22,.34,.46,.58,.7,.82,.93];
 for(const f of fr){
  let x,y,z;
  if(RACE.air){const r=RACE.rings[Math.floor(f*RACE.rings.length)%RACE.rings.length];x=r.x;y=r.y;z=r.z}
  else{const q=RACE.track.samples[Math.floor(f*RACE.track.M)];x=q.x;y=1;z=q.z}
  const m=raceIconMesh('orb');m.scale.setScalar(1.15);m.position.set(x,y,z);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.3,.09,6,20),new THREE.MeshBasicMaterial({color:0x27e0ff,transparent:true,opacity:.7}));
  ring.position.set(x,RACE.air?y:y+.05,z);if(!RACE.air)ring.rotation.x=-Math.PI/2;
  RACE.grp.add(m);RACE.grp.add(ring);
  RACE.pads.push({x,y,z,m,ring,active:true,resp:0});
 }
}
function racePadsStep(dt){
 for(const p of RACE.pads){
  if(!p.active){p.resp-=dt;if(p.resp<=0){p.active=true;p.m.visible=true;p.ring.visible=true}continue}
  p.m.rotation.y+=dt*2.6;p.m.rotation.x+=dt*1.3;
  for(const o of RACE.list){if(o.done)continue;
   const oy=RACE.air?o.y:.5;
   const r=RACE.air?3.4:2;
   if((o.x-p.x)*(o.x-p.x)+(o.z-p.z)*(o.z-p.z)+(RACE.air?(oy-p.y)*(oy-p.y):0)<r*r){
    const free=o.slots.findIndex(s=>!s);
    if(free>=0){
     const id=RITEMPOOL[Math.floor(Math.random()*RITEMPOOL.length)];
     o.slots[free]={id,n:RITEMS[id].n,ch:id==='homing'?3:null};o.sel=free;
     p.active=false;p.resp=5;p.m.visible=false;p.ring.visible=false;
     if(o===RACE.v){raceMsg(RITEMS[id].i+' '+RITEMS[id].n+' alındı — F ile ileri, Q ile geri kullan');snd(920,.14,.06);raceHudSlots(true)}
     break;
    }}}
 }
}
/* ---------- Efektler ---------- */
function raceBoomFx(x,y,z,s){
 const m=new THREE.Mesh(new THREE.SphereGeometry(.6,10,10),new THREE.MeshBasicMaterial({color:0xffa63f,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));
 m.position.set(x,y,z);RACE.grp.add(m);RACE.fx.push({m,t:0,life:.4,s});
 if(!window.BGMODE)snd(90,.35,.09);
}
function raceBeamFx(x0,y0,z0,x1,y1,z1){
 const g=new THREE.BufferGeometry().setFromPoints([V3(x0,y0,z0),V3(x1,y1,z1)]);
 const m=new THREE.Line(g,new THREE.LineBasicMaterial({color:0x4dd2ff,transparent:true,opacity:.95}));
 RACE.grp.add(m);RACE.fx.push({m,t:0,life:.18,s:0});
}
function raceFxStep(dt){
 for(let i=RACE.fx.length-1;i>=0;i--){
  const f=RACE.fx[i];f.t+=dt;
  const k=f.t/f.life;
  if(f.s){f.m.scale.setScalar(1+k*4*f.s);f.m.material.opacity=.9*(1-k)}
  else f.m.material.opacity=.95*(1-k);
  if(f.t>=f.life){raceDisposeGroup(f.m);RACE.fx.splice(i,1)}
 }
}
/* ---------- Arac animasyonu (tekerlek, spoiler, pervane, egim) ---------- */
function raceVehicleAnim(v,dt){
 const m=v.mdl;RaceMotion.update(v,dt);
 if(v.shieldT>0){
  if(!m.sh){m.sh=new THREE.Mesh(new THREE.SphereGeometry(v.air?2.2:1.9,12,10),new THREE.MeshBasicMaterial({color:0x51ff7d,transparent:true,opacity:.18,blending:THREE.AdditiveBlending,depthWrite:false}));m.g.add(m.sh)}
  m.sh.visible=true;
 }else if(m.sh)m.sh.visible=false;
}
/* ---------- Ana adim (sabit 1/120: main.js cagirir) ---------- */
function raceStep(dt){
 if(!RACE.on)return;
 RACE.t+=dt;
 if(RACE.count>0){
  RACE.count-=dt;
  const c=Math.ceil(RACE.count);
  if(c!==RACE._c){RACE._c=c;$('msg').textContent=c>0?('BAŞLA: '+c):'GO!';if(c>0)snd(440,.09,.05);else snd(880,.2,.06);
   if(c<=0)setTimeout(()=>{if(mode==='race'&&state==='play')$('msg').textContent=''},800)}
 }else if(!RACE.finished)RACE.raceTime+=dt;
 const v=RACE.v;
 if(v&&!v.done&&RACE.count<=0){
  let inp;
  if(touch){
   inp={th:clamp(-joy.y,-1,1),br:0,st:clamp(joy.x,-1,1),drift:jHeld,boost:false};
   if(firing&&!RACE._fHeld){raceUse(v,1)}
   RACE._fHeld=!!firing;
  }
  else{
   const bk=kDown('back');
   inp={th:kDown('fwd')?1:(bk?-1:0),br:bk&&v.spd>.6?1:0,st:(kDown('left')?1:0)-(kDown('right')?1:0),drift:kDown('raceDrift'),boost:kDown('raceBoost')};
  }
  if(inp.boost&&v.air)v.boostT=Math.max(v.boostT,.12);
  if(v.air)racePlaneStep(v,inp,dt);else raceCarStep(v,inp,dt);
 }
 if(RACE.count<=0)for(const a of RACE.list){
  if(!a.ai||a.done)continue;
  const inp=raceAIThink(a,dt);
  if(a.air)racePlaneStep(a,inp,dt);else raceCarStep(a,inp,dt);
 }
 if(!RACE.air&&RACE.count<=0){
  const L=RACE.list;
  for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){
   const a=L[i],b=L[j];
   const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);
   if(d<2.4&&d>.01&&a.wreckT<=0&&b.wreckT<=0){
    const push=(2.4-d)/2,px=dx/d*push,pz=dz/d*push;
    a.x-=px;a.z-=pz;b.x+=px;b.z+=pz;
    if(Math.abs(a.spd-b.spd)>8){a.spd*=.94;b.spd*=.94}
   }
  }
 }
 // Collision correction happens after physics; show the corrected pose in this same step.
 for(const racer of RACE.list)racer.mdl.g.position.set(racer.x,racer.air?racer.y:0,racer.z);
 raceProjStep(dt);raceMineStep(dt);raceDropsStep(dt);raceFxStep(dt);
 if(RACE.cfg.items)racePadsStep(dt);
 const order=RACE.list.slice().sort((a,b)=>raceProgress(b)-raceProgress(a));
 order.forEach((o,i)=>{if(!o.done)o.rank=i+1});
 const total=RACE.cfg.laps*(RACE.air?RACE.rings.length:RACE.track.L);
 for(const o of RACE.list){
  if(o.done)continue;
  if(raceProgress(o)>=total){
   o.done=true;
   if(o===RACE.v){
    RACE.finished=true;RACE.endT=RACE.t;
    raceMsg('BİTTİ! Sıran: '+o.rank+'/'+RACE.list.length);
    snd(o.rank===1?1046:520,.4,.07);
   }
  }
 }
 if(RACE.finished&&!RACE.finDone&&(RACE.t-RACE.endT>6||RACE.list.every(o=>o.done))){RACE.finDone=true;finish()}
 raceEngStep();
 raceHud(dt);
}
function raceProgress(v){return v.air?v.lap*RACE.rings.length+v.nextRing:v.prog}
/* ---------- Kamera ---------- */
function raceCam(dt){
 const v=RACE.v;if(!v)return;
 const fx=Math.sin(v.yaw),fz=Math.cos(v.yaw);
 const dist=v.air?9.5:7.2,h=v.air?3.6:3.1;
 const tx=v.x-fx*dist,ty=(v.air?v.y:0)+h,tz=v.z-fz*dist,k=1-Math.exp(-7*dt);
 cam.position.x+=(tx-cam.position.x)*k;cam.position.y+=(ty-cam.position.y)*k;cam.position.z+=(tz-cam.position.z)*k;
 cam.lookAt(v.x+fx*5,(v.air?v.y:0)+1.3,v.z+fz*5);
 if(v.air)cam.rotateZ(v.roll*.35);
 const fv=baseFov+clamp(Math.abs(v.spd)/45,0,1)*13+(v.boostT>0?6:0);
 if(Math.abs(fv-cam.fov)>.1){cam.fov+=(fv-cam.fov)*(1-Math.exp(-6*dt));cam.updateProjectionMatrix()}
}
/* ---------- Motor sesi ---------- */
function raceEngStart(){
 if(typeof RaceAudio!=='undefined')RaceAudio.start();
 if(window.BGMODE)return;
 try{
  if(!ac)ac=new AudioContext();
  const o=ac.createOscillator(),g=ac.createGain();
  o.type='sawtooth';o.frequency.value=70;g.gain.value=0;
  o.connect(g);g.connect(ac.destination);o.start();
  RACE.eng={o,g};
 }catch(e){}
}
function raceEngStep(){
 if(typeof RaceAudio!=='undefined'&&RaceAudio.update()){if(RACE.eng)RACE.eng.g.gain.value=0;return}
 const e=RACE.eng;if(!e)return;
 try{
  const v=RACE.v;if(!v)return;
  const r=clamp(Math.abs(v.spd)/45,0,1);
  e.o.frequency.value=(v.air?85:58)+r*(v.air?240:150)+(v.boostT>0?45:0);
  e.g.gain.value=(state==='play'?.024+r*.02:0)*(window.BGMODE?0:1);
 }catch(_){}
}
function raceEngStop(){if(typeof RaceAudio!=='undefined')RaceAudio.stop();try{const e=RACE.eng;if(e){e.o.stop();e.g.disconnect()}}catch(_){}RACE.eng=null}
/* ---------- HUD ---------- */
function raceMsg(t){const m=$('msg');if(m)m.textContent=t;RACE.msgT=2.4}
function raceHudBuild(){
 const old=$('racehud');if(old)old.remove();
 const d=document.createElement('div');d.id='racehud';
 d.style.cssText='position:fixed;left:50%;bottom:14px;transform:translateX(-50%);display:flex;gap:10px;align-items:flex-end;pointer-events:none;z-index:9000';
 d.innerHTML=[0,1,2].map(i=>`<div id='rslot${i}' style='width:64px;height:64px;border-radius:12px;background:#0d141cd9;border:2px solid #2a3646;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:26px;position:relative;transition:border-color .15s'>
  <span id='rsic${i}' style='line-height:1'></span>
  <small id='rsk${i}' style='font-size:9px;color:#7f8ea0;position:absolute;bottom:3px'></small>
  <b id='rsn${i}' style='font-size:9px;color:#c8d4e2;position:absolute;top:2px'></b></div>`).join('')+
  `<div id='rstim' style='font:11px monospace;color:#9fe8ff;text-shadow:0 0 6px #0af'></div>`;
 document.body.appendChild(d);
 RACE.lastSlot=-2;RACE.lastHud='';
}
function raceHudSlots(force){
 if(force)RACE.lastSlot=-2;
}
function raceHud(dt){
 const v=RACE.v;if(!v)return;
 RACE.msgT-=dt;
 if(RACE.msgT<=0&&RACE.msgT>-9000){const m=$('msg');if(m&&m.textContent&&m.textContent.indexOf('BAŞLA')!==0&&m.textContent!=='GO!')m.textContent='';RACE.msgT=-1e9}
 RACE.hudAcc=(RACE.hudAcc||0)+dt;
 if(RACE.hudAcc<.08)return;
 RACE.hudAcc=0;
 const lap=clamp((v.air?v.lap:Math.floor(Math.max(0,v.prog)/RACE.track.L))+1,1,RACE.cfg.laps);
 const tm=RACE.count>0?('BAŞLA '+Math.ceil(RACE.count)):(v.done?'BİTTİ':'Tur '+lap+'/'+RACE.cfg.laps+' · '+raceFmtTime(RACE.raceTime));
 const sc=(v.rank||1)+' / '+RACE.list.length;
 const sp=Math.round(Math.abs(v.spd)*3.6)+' km/h';
 const key=tm+'|'+sc+'|'+sp;
 if(key!==RACE.lastHud){RACE.lastHud=key;$('tm').textContent=tm;$('scr').textContent=sc;$('acc').textContent='';$('spd').textContent=sp}
 const skey=v.sel+'|'+v.slots.map(s=>s?s.id+(s.ch?':'+s.ch:''):'').join(',')+'|'+Math.ceil(v.boostT)+'|'+Math.ceil(v.shieldT);
 if(skey!==RACE.lastSlot){
  RACE.lastSlot=skey;
  for(let i=0;i<3;i++){
   const s=v.slots[i],el=$('rslot'+i);
   el.style.borderColor=i===v.sel?'#ffd23f':'#2a3646';
   el.style.boxShadow=i===v.sel?'0 0 12px #ffd23f66':'none';
   $('rsic'+i).textContent=s?RITEMS[s.id].i:'';
   $('rsn'+i).textContent=s?RITEMS[s.id].n.split(' ')[0]:'';
   $('rsk'+i).textContent=(i+1)+(s&&s.ch?' ×'+s.ch:'');
  }
  const t=[];
  if(v.boostT>0)t.push('⚡ '+v.boostT.toFixed(1));
  if(v.shieldT>0)t.push('🛡 '+v.shieldT.toFixed(1));
  const te=$('rstim');if(te)te.textContent=t.join('  ');
 }
}
function raceFmtTime(t){const m=Math.floor(t/60),s=Math.floor(t%60);return m+':'+String(s).padStart(2,'0')}
/* ---------- Kurulum / temizlik ---------- */
function raceSetup(){
 if(RACE.on)raceStop();
 RACE.air=RACECARS[RACE.cfg.veh].type==='plane';
 RACE.grp=new THREE.Group();S.add(RACE.grp);
 RACE.track=raceBuildTrack(RACE.air);
 RACE.saved={fog:[S.fog.near,S.fog.far],sky:S.background.getHex(),far:cam.far};
 S.fog.near=RACE.air?70:100;S.fog.far=RACE.air?330:480;
 cam.far=1000;cam.updateProjectionMatrix();
 S.background.setHex(RACE.air?0x101a2a:0x87b7dd);
 floor.visible=false;ARENA.boxes.forEach(b=>b.m.visible=false);
 if(!RACE.air){
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(1100,1100),new THREE.MeshLambertMaterial({color:0x5d7350}));
  ground.rotation.x=-Math.PI/2;ground.position.y=-.05;RACE.grp.add(ground);
  raceTrackMesh(RACE.track,RACE.grp);
  // cevre: start kapisinin arkasina tribun + pist boyunca reklam panolari
  const q0=RACE.track.samples[0];
  for(const side of[-1,1]){
   const stand=new THREE.Mesh(new THREE.BoxGeometry(20,5,4),new THREE.MeshLambertMaterial({color:0x39424e}));
   stand.position.set(q0.x+q0.rx*side*(RACE.track.halfW+7),2.5,q0.z+q0.rz*side*(RACE.track.halfW+7));
   RACE.grp.add(stand);
  }
  for(let i=0;i<10;i++){
   const q=RACE.track.samples[Math.floor(i/10*RACE.track.M)];
   const side=i%2?1:-1;
   const px=q.x+q.rx*side*(RACE.track.halfW+3.4),pz=q.z+q.rz*side*(RACE.track.halfW+3.4);
   const bill=new THREE.Mesh(new THREE.BoxGeometry(4,2,.2),new THREE.MeshLambertMaterial({color:[0xe8b621,0x27e0ff,0xd7263d,0x51ff7d][i%4]}));
   bill.position.set(px,2.6,pz);bill.rotation.y=Math.atan2(q.rx,q.rz)+Math.PI/2;
   RACE.grp.add(bill);
   const pole=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,2.6,6),new THREE.MeshLambertMaterial({color:0x556070}));
   pole.position.set(px,1.3,pz);RACE.grp.add(pole);
  }
  RaceWorld.build(RACE.track,RACE.grp);
 }else{
  raceCityMesh(RACE.track,RACE.grp);raceRingsMesh(RACE.track,RACE.grp);
 }
 RACE.list=[];RACE.projs=[];RACE.mines=[];RACE.drops=[];RACE.fx=[];RACE.pads=[];RACE.buildings=RACE.buildings||[];
 RACE.v=raceNewRacer(RACE.cfg.veh,false,0);
 RACE.list.push(RACE.v);
 const ids=Object.keys(RACECARS).filter(k=>RACECARS[k].type===(RACE.air?'plane':'car'));
 const n=RACE.air?3:5;
 for(let i=0;i<n;i++){const a=raceNewRacer(ids[i%ids.length],true,i+1);a.skill=RaceAI.skill(i);RACE.list.push(a)}
 if(RACE.cfg.items)raceBuildPads();
 raceHudBuild();
 if(pRigObj)pRigObj.root.visible=false;
 if(typeof VM!=='undefined'&&VM&&VM.root)VM.root.visible=false;
 $('ch').style.opacity=0;
 $('wbar').style.display='none';$('ammo').style.display='none';$('stb').style.display='none';
 p.dead=0;p.hp=RACE.v.hp;hudHp();
 RACE.t=0;RACE.raceTime=0;RACE.count=3.4;RACE._c=4;RACE.finished=false;RACE.finDone=false;RACE.on=true;RACE.msgT=0;
 raceEngStart();
}
function raceStop(){
 if(!RACE.on&&!RACE.grp)return;
 RACE.on=false;
 if(RACE.grp){raceDisposeGroup(RACE.grp);RACE.grp=null}
 RACE.list=[];
 if(RACE.saved){S.fog.near=RACE.saved.fog[0];S.fog.far=RACE.saved.fog[1];S.background.setHex(RACE.saved.sky);cam.far=RACE.saved.far||100;cam.updateProjectionMatrix()}
 floor.visible=true;ARENA.boxes.forEach(b=>b.m.visible=true);
 RACE.pads=[];RACE.projs=[];RACE.mines=[];RACE.drops=[];RACE.fx=[];RACE.rings=[];RACE.buildings=[];
 if(pRigObj)pRigObj.root.visible=false;
 if(typeof VM!=='undefined'&&VM&&VM.root)VM.root.visible=true;
 $('wbar').style.display='';$('ammo').style.display='';$('stb').style.display='';
 const h=$('racehud');if(h)h.remove();
 raceEngStop();
 RACE.picked=false;
 RACE.v=null;
 const m=$('msg');if(m)m.textContent='';
 p.hp=100;hudHp();
}
function raceResult(){
 const v=RACE.v||{rank:RACE.list.length};
 const pos=v.rank||RACE.list.length,n=RACE.list.length;
 return{win:pos===1,earn:60+(n-pos+1)*35,
  t:pos===1?'Yarışı kazandın!':'Yarış bitti — '+pos+'. sıra',
  r:'Sıra <b>'+pos+' / '+n+'</b> · Süre <b>'+raceFmtTime(RACE.raceTime)+'</b>'+(RACE.air?'':' · Araç: '+RACECARS[RACE.cfg.veh].n)}
}
/* ---------- Arac secim ekrani (3B onizlemeli) ---------- */
function raceOpen(cb){RaceGarage.open(cb)}
function raceCloseUI(){
 if(typeof RaceGarage!=='undefined')RaceGarage.close();
 const d=$('raceui');if(d)d.remove();
 racePreviewClear();
}
function racePreviewClear(){
 if(RACE.pv){raceDisposeGroup(RACE.pv);RACE.pv=null}
 RACE.pvM=null;RACE.pvVehicle=null;
 RACE.pvId=undefined;
 cam.fov=baseFov;cam.updateProjectionMatrix();
}
/* Lobi acikken cagrilir (main.js): secili araci dondurerek gosterir */
function racePreviewRender(dt){
 if(typeof RaceGarage!=='undefined'&&RaceGarage.active){RaceGarage.render(dt);return}
 let id=RACE.cfg.veh;
 RACE.pvT=(RACE.pvT||0)+dt;
 if(RACE.pvId!==id){
  racePreviewClear();
  const m=raceBuildModel(id);
  m.g.position.set(0,.9,54);
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.8,.3,24),new THREE.MeshLambertMaterial({color:0x1c2634}));
  disc.position.set(0,.15,54);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(3.6,.07,8,40),new THREE.MeshBasicMaterial({color:RACECARS[id].col}));
  ring.rotation.x=-Math.PI/2;ring.position.set(0,.32,54);
  const g=new THREE.Group();g.add(disc);g.add(ring);g.add(m.g);
  S.add(g);RACE.pv=g;RACE.pvId=id;RACE.pvM=m;RACE.pvVehicle={id,mdl:m,air:RACECARS[id].type==='plane',spd:0,steer:0,yaw:0,shieldT:0,boostT:0};
 }
 if(RACE.pvVehicle)RaceMotion.update(RACE.pvVehicle,dt);
 const t=RACE.pvT*.45;
 cam.position.set(Math.sin(t)*6.4,2.6,54+Math.cos(t)*6.4);
 cam.lookAt(0,.9,54);
 R.render(S,cam);
}
/* ---------- Tus isleyici ---------- */
addEventListener('keydown',e=>{
 if(state!=='play'||mode!=='race')return;
 const v=RACE.v;if(!v)return;
 if(kMatch(e,'raceFire')&&!e.repeat)raceUse(v,1);
 else if(kMatch(e,'raceBack')&&!e.repeat)raceUse(v,-1);
 else if(kMatch(e,'raceDrop')&&!e.repeat)raceDrop(v);
 else{
  const si=[0,1,2].find(i=>kMatch(e,'slot'+(i+1)));
  if(si!=null&&!e.repeat){v.sel=si;RACE.lastSlot=-2;raceHud(1)}
 }
});
