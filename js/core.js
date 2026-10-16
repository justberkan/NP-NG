'use strict';
/* ===== Çekirdek: yardımcılar, sahne, arena, ses, kayıt ===== */
const $=id=>document.getElementById(id);
const touch='ontouchstart' in window||navigator.maxTouchPoints>0;
if(touch)document.body.classList.add('touch');
const V3=(x,y,z)=>new THREE.Vector3(x||0,y||0,z||0);
const hex=c=>'#'+c.toString(16).padStart(6,'0');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const fmt=n=>Math.round(n).toLocaleString('tr-TR');
const rnd=(a,b)=>a+Math.random()*(b-a);

let low=false,baseFov=75;
try{baseFov=+localStorage.getItem('mmofps_fov')||75}catch(e){}

const R=new THREE.WebGLRenderer({canvas:$('c'),antialias:false,powerPreference:'high-performance',stencil:false});
const S=new THREE.Scene();S.background=new THREE.Color(0x9cc3de);S.fog=new THREE.Fog(0x9cc3de,25,70);
const cam=new THREE.PerspectiveCamera(75,1,.1,100);cam.rotation.order='YXZ';S.add(cam);
S.add(new THREE.HemisphereLight(0xffffff,0x4a5a6a,1.05));
const sun=new THREE.DirectionalLight(0xffffff,.55);sun.position.set(10,20,6);S.add(sun);
const resizers=[];
function resize(){
 R.setPixelRatio(typeof pixelRatio==='function'?pixelRatio():Math.min(devicePixelRatio,1.5));
 R.setSize(innerWidth,innerHeight,false);
 cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();
 resizers.forEach(f=>f());
}
addEventListener('resize',resize);

/* --- Arena --- */
const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshLambertMaterial({color:0x6d7b88}));
floor.rotation.x=-Math.PI/2;S.add(floor);
const boxes=[];
function box(x,z,w,h,d,c){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:c}));
 m.position.set(x,h/2,z);S.add(m);
 boxes.push({m,x1:x-w/2,x2:x+w/2,z1:z-d/2,z2:z+d/2,h});
}
box(0,-30.5,62,5,1,0x3b4a58);box(0,30.5,62,5,1,0x3b4a58);box(-30.5,0,1,5,62,0x3b4a58);box(30.5,0,1,5,62,0x3b4a58);
[[-10,8,4,1,4,0xc9892b],[10,10,5,2,3,0x4a7fb5],[0,2,3,1,3,0xc9892b],[-18,-4,3,3,3,0x4a7fb5],[16,-2,4,1,6,0xc9892b],[-6,16,6,1,2,0x4a7fb5],[22,18,3,2,3,0xc9892b],[-8,-14,1,4,8,0x4a7fb5],[-2,-14,1,4,8,0x4a7fb5],[24,-14,8,3.5,1,0xc9892b]].forEach(a=>box(...a));
const boxMeshes=boxes.map(b=>b.m);
/* Büyük harita için çarpışma ızgarası (BG null ise tüm kutular taranır) */
let BG=null;const NOB=[];
function bnear(x,z){
 if(!BG)return boxes;
 const gx=Math.floor((x+BG.o)/BG.cs),gz=Math.floor((z+BG.o)/BG.cs);
 if(gx<0||gz<0||gx>=BG.n||gz>=BG.n)return NOB;
 return BG.c[gz*BG.n+gx]||NOB;
}
let STEPH=.3;
function hitBox(x,z,y){for(const b of bnear(x,z))if(y+STEPH-.3<b.h-.05&&x>b.x1-.4&&x<b.x2+.4&&z>b.z1-.4&&z<b.z2+.4)return b;return null}
/* zemin: oyuncunun yarıçapı (PR) kadar kenara taşsa da kutunun üstünde durur (eskiden kenar şeridine düşüp kilitleniyordu) */
const PR=.4;
function groundAt(x,z,y){let h=(typeof OW!=='undefined'&&OW.on)?owH(x,z):0;for(const b of bnear(x,z))if(x>b.x1-PR&&x<b.x2+PR&&z>b.z1-PR&&z<b.z2+PR&&y>=b.h-STEPH&&b.h>h)h=b.h;return h}
/* kutunun genişletilmiş alanına ne kadar girilmiş (dışarıdaysa <=0) */
function boxPen(b,x,z){return Math.min(x-(b.x1-PR),(b.x2+PR)-x,z-(b.z1-PR),(b.z2+PR)-z)}

/* --- Ses --- */
let ac;
function snd(f,d,v,type){
 try{ac=ac||new AudioContext();const o=ac.createOscillator(),g=ac.createGain();
  if(window.BGMODE)return;
  o.type=type||'square';o.frequency.value=f;g.gain.value=(v||.04)*((typeof SET!=='undefined'&&SET.volume!=null)?SET.volume:1);
  g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);
  o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch(e){}
}

/* --- Silah sesleri (sentez): gürültü patlaması + gövde + gümbürtü; silah türüne göre. c verilirse (OfflineAudioContext) test için o bağlama çizer --- */
let _nzb=null;
function noiseBuf(c){if(_nzb&&_nzb.sampleRate===c.sampleRate)return _nzb;const n=c.sampleRate,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);let s=12345;for(let i=0;i<n;i++){s=(s*16807)%2147483647;d[i]=s/1073741823.5-1}_nzb=b;return b}
/* tek ses katmanı: noise ya da osc, filtre, üstel sönüm, isteğe bağlı frekans süpürme */
function vox(c,t0,o){
 const g=c.createGain(),vol=o.g*((typeof SET!=='undefined'&&SET.volume!=null)?SET.volume:1);
 g.gain.setValueAtTime(Math.max(vol,.0002),t0);g.gain.exponentialRampToValueAtTime(.0002,t0+o.d);
 let src;
 if(o.n){src=c.createBufferSource();src.buffer=noiseBuf(c);src.loop=true}
 else{src=c.createOscillator();src.type=o.t||'sine';src.frequency.setValueAtTime(o.f0,t0);if(o.f1)src.frequency.exponentialRampToValueAtTime(o.f1,t0+o.d)}
 let n=src;
 if(o.hp){const f=c.createBiquadFilter();f.type='highpass';f.frequency.value=o.hp;n.connect(f);n=f}
 if(o.lp){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=o.lp;n.connect(f);n=f}
 n.connect(g);g.connect(o.dest||c.destination);src.start(t0);src.stop(t0+o.d+.02);
}
const GUNS={
 rifle:[{n:1,hp:1800,d:.04,g:.2},{n:1,lp:1000,d:.17,g:.55},{f0:150,f1:45,d:.13,g:.6},{n:1,lp:450,d:.4,g:.1}],
 smg:[{n:1,hp:2600,d:.03,g:.18},{n:1,lp:1500,d:.09,g:.45},{f0:190,f1:70,d:.07,g:.45}],
 pistol:[{n:1,hp:2200,d:.04,g:.22},{n:1,lp:1300,d:.12,g:.5},{f0:210,f1:80,d:.1,g:.5},{n:1,lp:600,d:.22,g:.08}],
 shotgun:[{n:1,hp:1200,d:.06,g:.25},{n:1,lp:700,d:.3,g:.8},{f0:95,f1:30,d:.26,g:.9},{n:1,lp:350,d:.5,g:.12}],
 sniper:[{n:1,hp:1500,d:.05,g:.28},{n:1,lp:800,d:.35,g:.7},{f0:110,f1:30,d:.3,g:.8},{n:1,lp:300,d:.8,g:.12}]
};
function gunSound(kind,c){
 if(window.BGMODE)return;
 try{
  const own=!c;if(own){ac=ac||new AudioContext();c=ac}
  const L=GUNS[kind]||GUNS.rifle,t0=own?c.currentTime:0,r=.94+Math.random()*.12;
  for(const l of L){const o=Object.assign({},l);o.g*=.62;if(o.f0){o.f0*=r;if(o.f1)o.f1*=r}if(o.hp)o.hp*=r;if(o.lp)o.lp*=r;vox(c,t0,o)}
 }catch(e){}
}
/* şarjör sesleri: magout (çıkar), magin (tak), bolt (sürgü), dry (boş tetik) */
function reloadSound(k,c){
 if(window.BGMODE)return;
 try{
  const own=!c;if(own){ac=ac||new AudioContext();c=ac}
  const t=own?c.currentTime:0;
  if(k==='magout'){vox(c,t,{n:1,hp:2500,d:.03,g:.25});vox(c,t,{t:'square',f0:900,f1:450,d:.04,g:.05});vox(c,t+.05,{f0:160,f1:90,d:.06,g:.2})}
  else if(k==='magin'){vox(c,t,{f0:230,f1:110,d:.07,g:.35});vox(c,t,{n:1,hp:2000,d:.025,g:.3});vox(c,t+.06,{n:1,hp:3000,d:.02,g:.22})}
  else if(k==='bolt'){vox(c,t,{n:1,hp:1800,d:.03,g:.3});vox(c,t,{t:'square',f0:1200,f1:700,d:.03,g:.05});vox(c,t+.09,{n:1,hp:2400,d:.035,g:.34});vox(c,t+.09,{f0:200,f1:100,d:.05,g:.2})}
  else{vox(c,t,{n:1,hp:3500,d:.015,g:.3});vox(c,t,{t:'square',f0:1800,f1:1200,d:.012,g:.04})}
 }catch(e){}
}
/* vuruş geri bildirimi: gövde = mat tok, kafa = parlak çınlama, öldürme = çift ton */
function hitSound(head,kill,c){
 if(window.BGMODE)return;
 try{
  const own=!c;if(own){ac=ac||new AudioContext();c=ac}
  const t=own?c.currentTime:0;
  if(head){vox(c,t,{f0:2000,d:.12,g:.2});vox(c,t,{f0:2600,d:.1,g:.12});vox(c,t,{n:1,hp:3000,d:.02,g:.15})}
  else{vox(c,t,{n:1,lp:700,d:.05,g:.4});vox(c,t,{f0:620,f1:380,d:.07,g:.18})}
  if(kill){vox(c,t+.06,{f0:880,d:.18,g:.18});vox(c,t+.06,{f0:1320,d:.18,g:.12})}
 }catch(e){}
}

/* --- Oyun durumu --- */
let state='menu',mode='aim',selMode='aim',timeLeft=60,score=0,shots=0,hits=0,kills=0,clock=0;
const key={},joy={x:0,y:0};

/* --- Kayıt --- */
const WKEYS=['rifle','smg','pistol','dual','knife','sword','gsword'];
const OWDEF=()=>({lvl:1,xp:0,med:2,kills:0,mw:'s0',sw:['s0'],su:{},inv:{},sk:[null,null,null,null,null]});
const SVDEF=()=>({v:3,tl:200,gold:0,own:['c0','x0','g0','o0'],eq:{c:'c0',x:'x0',w:'rifle',o:'o0'},sk:{},xp:0,bp:[],t0:Date.now(),ow:OWDEF()});
let SV=null;
try{SV=JSON.parse(localStorage.getItem('mmofps_sv'))}catch(e){}
function ensureSV(){
 const d=SVDEF();
 if(!SV||typeof SV!=='object')SV=d;
 for(const k in d)if(SV[k]===undefined)SV[k]=d[k];
 SV.eq=Object.assign({c:'c0',x:'x0',w:'rifle',o:'o0'},SV.eq||{});
 /* eski sürüm: formalar karakterdi (k1-k4) → forma aksesuarına (f1-f4) çevir */
 if(SV.own){SV.own=SV.own.map(i=>/^k[1-4]$/.test(i)?'f'+i[1]:i)}
 if(/^k[1-4]$/.test(SV.eq.c||'')){SV.eq.f='f'+SV.eq.c[1];SV.eq.c='c0'}
 {const _rm=['m1','m2','m3','m4','m5'];if(_rm.includes(SV.eq.c))SV.eq.c='c6';if(Array.isArray(SV.own))SV.own=SV.own.filter(x=>!_rm.includes(x))}
 SV.sk=SV.sk||{};
 SV.mod=SV.mod&&typeof SV.mod==='object'?SV.mod:{};
 SV.ow=Object.assign(OWDEF(),SV.ow||{});
 if(!Array.isArray(SV.ow.sw)||!SV.ow.sw.includes('s0'))SV.ow.sw=['s0'].concat(Array.isArray(SV.ow.sw)?SV.ow.sw.filter(x=>x!=='s0'):[]);
 if(typeof SV.ow.mw!=='string'||!SV.ow.sw.includes(SV.ow.mw))SV.ow.mw='s0';
 if(!SV.ow.su||typeof SV.ow.su!=='object')SV.ow.su={};
 if(!SV.ow.inv||typeof SV.ow.inv!=='object')SV.ow.inv={};
 if(!Array.isArray(SV.ow.sk)||SV.ow.sk.length!==5)SV.ow.sk=[0,1,2,3,4].map(i=>(Array.isArray(SV.ow.sk)&&SV.ow.sk[i])||null);
 if(SV.eq.g){SV.sk.rifle=SV.sk.rifle||SV.eq.g;delete SV.eq.g}
 if(!WKEYS.includes(SV.eq.w))SV.eq.w='rifle';
 ['c0','x0','g0','c6','o0'].forEach(i=>{if(!SV.own.includes(i))SV.own.push(i)});
 if(!SV.op1){SV.op1=1;if(SV.eq.c==='c0')SV.eq.c='c6'}
 if(typeof ensureEco==='function')ensureEco(); if(typeof save==='function')save();
}
/* çevrimdışı (sunucuya giriş yapılmamış) modda para sonsuz; sunucu hesabında normal ekonomi */
const INF_TL=1e9;
function offInf(){try{return !MPL.authed}catch(e){return true}}
function save(){if(SV&&offInf()&&!(SV.tl>=INF_TL))SV.tl=INF_TL;try{localStorage.setItem('mmofps_sv',JSON.stringify(SV))}catch(e){}}
