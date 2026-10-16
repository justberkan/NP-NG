'use strict';
/* ===== 3B Lobi sahnesi: platformlarda gerçek 3D karakterler ===== */
const LS=new THREE.Scene(),LC=new THREE.PerspectiveCamera(32,1,.1,60);
LS.background=new THREE.Color(0x070a12);LS.fog=new THREE.Fog(0x070a12,12,30);
LC.position.set(0,1.55,7.2);LC.lookAt(0,1.1,0);
let lobbyOn=true,lobbyView='home',lmx=0;
const LB={slots:[],camDist:7.2};
const SLOTDEF=[
 {name:'player name',color:0x2ee59d,w:'rifle',sk:'g6',ch:'c1',f:.13,yaw:.3,on:false},
 {name:'Oyuncu',color:0x27e0ff,w:null,sk:null,ch:null,f:.36,yaw:.12,vip:true,me:true},
 {name:'player name',color:0xffb020,w:'smg',sk:'g3',ch:'c2',f:.6,yaw:-.12,on:false},
 {name:'player name',color:0x27e0ff,w:'sword',sk:'g8',ch:'c5',f:.83,yaw:-.3,on:false}
];
function worldX(f){const hw=Math.tan(LC.fov*Math.PI/360)*LB.camDist*LC.aspect;return(f-.5)*2*hw}

function initLobby3D(){
 LB.atmosphere=LobbyAtmosphere.create(LS,LC,R);

 SLOTDEF.forEach((d,i)=>{
  const g=new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(.8,.85,.12,28),new THREE.MeshLambertMaterial({color:0x181e2a})));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.82,.03,6,40),new THREE.MeshBasicMaterial({color:d.color}));
  ring.rotation.x=Math.PI/2;ring.position.y=.07;g.add(ring);
  LS.add(g);
  const nt=document.createElement('div');nt.className='nt';nt.style.borderLeftColor=hex(d.color);
  nt.innerHTML=d.name+(d.vip?"<span class='vip'>VIP</span>":'');
  $('nts').appendChild(nt);
  LB.slots.push({d,plat:g,rig:null,nt});
  lobbyBuildSlot(i);
 });
 resizers.push(lobbyLayout);
 lobbyLayout();
 addEventListener('mousemove',e=>{lmx=(e.clientX/innerWidth-.5)*2});
 /* sürükleyerek 360° döndür (lobide karakterin olduğu boş alana basılı tut) */
 {let dr=false,lx=0;
  const mine=()=>LB.slots.find(z=>z.d.me);
  const ok=t=>t&&(t.id==='av'||t.id==='lb');
  addEventListener('mousedown',e=>{if(ok(e.target)){dr=true;lx=e.clientX}});
  addEventListener('mouseup',()=>{dr=false});
  addEventListener('mousemove',e=>{if(!dr)return;const m=mine();if(m){m.d.yaw+=(e.clientX-lx)*.012}lx=e.clientX});
  addEventListener('touchstart',e=>{if(ok(e.target)&&e.touches[0]){dr=true;lx=e.touches[0].clientX}},{passive:true});
  addEventListener('touchend',()=>{dr=false});
  addEventListener('touchmove',e=>{if(!dr||!e.touches[0])return;const m=mine();if(m){m.d.yaw+=(e.touches[0].clientX-lx)*.012}lx=e.touches[0].clientX},{passive:true});
 }
}
function lobbyBuildSlot(i){
 const s=LB.slots[i],d=s.d;
 if(s.rig)LS.remove(s.rig.root);
 if(d.on===false){s.rig=null;return}
 const cid=d.me?chWithKit(LB.prev||SV.eq.c,LB.prevK):d.ch,wkey=d.me?(LB.pw||SV.eq.w):d.w,skin=d.me?skinOf(wkey):SKIN(d.sk);
 const ch=CHAR(cid);
 s.rig=mkHuman(ch,false);holderSet(s.rig,wkey,skin,d.me?(LB.pw?LB.pm:modId(wkey)):null);
 LS.add(s.rig.root);
 lobbyLayout();
}
function lobbyRefresh(){LB.slots.forEach((s,i)=>{if(s.d.me)lobbyBuildSlot(i)})}
function lobbyLayout(){
 LC.aspect=innerWidth/innerHeight;LC.updateProjectionMatrix();
 const avail=1-204/Math.max(innerWidth,400);
 LB.slots.forEach((s,i)=>{
  const sub=lobbyView!=='home',on=s.d.on!==false,n=LB.slots.filter(z=>z.d.on!==false).length,idx=LB.slots.filter(z=>z.d.on!==false).indexOf(s);
  const f=sub?(s.d.me?.165:.5):(.13+.7*(n<2?.5:idx/(n-1)))*avail/.87;
  const x=worldX(f);
  s.plat.position.set(x,0,s.d.me?(sub?-.4:.5):0);
  if(s.rig){s.rig.root.position.set(x,.1,s.d.me?(sub?-.4:.5):0);s.rig.root.rotation.y=s.d.yaw}
  const vis=on&&(!sub||s.d.me);
  s.plat.visible=vis;if(s.rig)s.rig.root.visible=vis;
  s.nt.style.display=vis&&!sub?'block':'none';
 });
}
function lobbySetView(v){lobbyView=v;lobbyLayout()}
const _lv=V3();
function lobbyUpdate(dt){
 if(LB.atmosphere)LB.atmosphere.update(dt);
 const t=clock;
 LC.position.x+=(lmx*.5-LC.position.x)*Math.min(1,2*dt);LC.lookAt(0,1.1,0);
 LB.slots.forEach((s,i)=>{
  if(!s.rig||!s.rig.root.visible)return;
  const ph=((t+i*1.3)%7)/2.2;
  if(s.d.me)s.rig.root.rotation.y=s.d.yaw;
  animHuman(s.rig,{t:0,speed:0,pitch:0,lookYaw:0,lr:0,ads:0,kick:0,bob:0,sw:1,rq:-1},dt); /* sabit poz: dirsekler yukarıda, sallanma yok */
  if(lobbyView==='home'){
   _lv.set(s.rig.root.position.x,2.12,s.rig.root.position.z);_lv.project(LC);
   s.nt.style.left=((_lv.x*.5+.5)*innerWidth)+'px';s.nt.style.top=((-_lv.y*.5+.5)*innerHeight)+'px';
  }
 });
}

/* Online oyuncu katılınca: lobbySetSlot(i,{name,color,w,sk,ch}) ; ayrılınca lobbySetSlot(i,null) */
function lobbySetSlot(i,info){
 const s=LB.slots[i];if(!s||s.d.me)return;
 if(info){Object.assign(s.d,info,{on:true});s.nt.innerHTML=s.d.name;s.nt.style.borderLeftColor=hex(s.d.color)}
 else s.d.on=false;
 lobbyBuildSlot(i);lobbyLayout();
}

/* mağazada seçilen karakteri solda 3B önizle (satın almadan) */
/* mağazada silah/kılıç önizlemesi: cls sınıf (ya da kılıç kimliği), mid model */
function lobbyPreviewGun(cls,mid){
 if((LB.pw||null)===(cls||null)&&(LB.pm||null)===(mid||null))return;
 LB.pw=cls||null;LB.pm=mid||null;LB.slots.forEach((s,i)=>{if(s.d.me)lobbyBuildSlot(i)});
}
function lobbyPreview(id){LB.prev=id||null;LB.slots.forEach((s,i)=>{if(s.d.me)lobbyBuildSlot(i)})}
/* mağazada forma önizlemesi: kuşanılı karakterin üstünde */
function lobbyPreviewKit(fid){if(LB.prevK===fid)return;LB.prevK=fid;LB.slots.forEach((s,i)=>{if(s.d.me)lobbyBuildSlot(i)})}
