'use strict';
/* ===== KBK Escort & Hunt — Kırmızı Başlıklı Kız'ı koru ya da kurt kızı kaçır.
   Korkunçlu (ic) deseni: setupMode/stepPlayer/updE/updPlayerView/toLobby kancaları + kbk_* oda ağı.
   Takım kuralı: 1 kurt / 3 koruma / 1 KBK. Harita prosedürel gece ormanı: 10 aday ev konumundan rastgele 1,
   5 checkpoint. Kurt evin yolunu keser; koruma takımı KBK'yı eve ulaştırmaya çalışır. */
const KBK={on:false,net:false,owner:true,id:0,host:0,code:'',peers:new Map(),avatars:new Map(),
 role:'guardian',rolePicked:false,chosen:false,pending:null,joinReq:null,ended:false,earned:0,sendT:0,
 group:null,meshes:[],housePos:null,house:null,houseBox:null,checkpoints:[],foxes:[],foxId:0,bushPts:[],
 bleed:{on:false,preHp:100,t:0},crippleT:0,stunT:0,stunCd:0,wolfHp:null,wolfRespawnT:0,carry:false,healUsed:false,reviveT:-1,
 stam:100,stamCd:0,flash:true,stillT:0,locked:false,swayT:0,exhausted:false,
 kbkNpc:null,guardNpcs:[],blood:null,bloodLife:null,bloodIdx:0,baseBoxes:null,env:null,lights:[],spot:null,spotTgt:null,glow:null,seed:1};

const KBK_REWARD=1000; /* eve ulaşma / kaçırma ödülü (IC kapı ödülüyle aynı) */
const KBK_WOLF_RESPAWN=15, KBK_STUN_T=5, KBK_CRIPPLE_MIN=3, KBK_CRIPPLE_MAX=5;
const KBK_WORLD_R=170; /* orman yarıçapı */

/* Basit deterministik PRNG (ev konumu oda koduna bağlı: herkeste aynı dursun) */
function kbkSrand(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return()=>{h=Math.imul(h^h>>>15,2246822507);h=Math.imul(h^h>>>13,3266489909);return((h^=h>>>16)>>>0)/4294967296}}

const KBK_Wrap=d=>((d+180)%360+360)%360-180;
const KBK_Dirs=['N','NE','E','SE','S','SW','W','NW'];

/* ---------- Oda / rol seçim ekranı (referans: karanlık orman sınıf kartları) ---------- */
function kbkOpen(cb){
 if(KBK.on)kbkDispose();
 let el=$('kbkselect');if(!el){el=document.createElement('div');el.id='kbkselect';el.className='wc-dialog';document.body.appendChild(el)}
 const card=(r,icon,name,desc)=>`
  <div class="kbk-class ${KBK.role===r?'sel':''}" data-role="${r}" role="button" aria-pressed="${KBK.role===r}" tabindex="0">
   <div class="kbk-class-ic">${icon}</div>
   <div class="kbk-class-portrait" aria-hidden="true"></div>
   <div class="kbk-class-name">${name}</div>
   <div class="kbk-class-desc">${desc}</div>
   <div class="kbk-class-pick"><span class="kbk-class-ring"></span><span class="kbk-class-picktxt">${KBK.role===r?'SEÇİLDİ':'SEÇ'}</span></div>
  </div>`;
 el.innerHTML=`<div class="wc-card kbk-card">
  <p class="wc-kicker">N.P.N.G. / ESKORT & KAVUŞMA</p>
  <h1 class="kbk-title">KBK ESCORT & HUNT</h1>
  <p class="kbk-sub">Karanlık ormanda Kırmızı Başlıklı Kız'ı eve ulaştır ya da <b>kurt</b> olup kızı mağaraya kaçır · Ödül: <b>+${KBK_REWARD} TL</b></p>
  <div class="kbk-classes">
   ${card('wolf','🐺','KURT','Sınırsız sprint · Q sersemletme · E kaçırma')}
   ${card('guardian','🛡️','KORUMA','Silahlı + el feneri · KBK\'yı koru ve eve götür')}
   ${card('kbk','👑','KIRMIZI BAŞLIKLI KIZ','Silahsız VIP · pusulayla yol göster · takımı iyileştir')}
  </div>
  <div class="kbk-expedition"><div><span class="wc-kicker">01 / AY IŞIĞI ORMANI</span><h2>Patikayı izle. Birlikte dön.</h2><p>Başlangıç köyü → 5 yol taşı → orman evi</p></div><div id="kbkroster" aria-live="polite"></div></div>
  <p class="note kbk-note">Tilki ısırığı kanama yapar (H: sargı) · Pusula hareket ederken sallanır, durunca sabitlenir · KBK: 20 HP heal + düşeni kaldırma · Kurt ölürse 15 sn sonra doğar.</p>
  <div class="kbk-actions">
   <button class="kbk-btn kbk-btn-primary" id="kbksolo">▶ TEK BAŞINA BAŞLA</button>
   <button class="kbk-btn" id="kbkcreate">CO-OP ODA AÇ</button>
  </div>
  <div class="kbk-joinrow">
   <input id="kbkcode" maxlength="8" placeholder="Oda kodu" aria-label="KBK oda kodu">
   <input id="kbkpass" type="password" maxlength="32" placeholder="Şifre (isteğe bağlı)" aria-label="Oda şifresi" autocomplete="off">
   <button class="kbk-btn" id="kbkjoin">KATIL</button>
   <button class="kbk-btn kbk-btn-ghost" id="kbklist">AÇIK LOBİLER</button>
  </div>
  <div class="kbk-foot">
   <button class="kbk-btn kbk-btn-ghost" id="kbkcancel">◄ GERİ</button>
   <span id="kbkdlgstatus" class="kbk-status">Co-op: SINIRSIZ oyuncu · Oda sahibi ayrılırsa maç biter · Kurt rolü oda açana verilir</span>
   <span class="kbk-timer">🌙 +${KBK_REWARD} TL</span>
  </div>
 </div>`;
 el.style.display='flex';
 const roster=()=>{$('kbkroster').textContent=KBK.role==='wolf'?'Sen: Kurt · VIP: bot · 3 koruma botu':KBK.role==='kbk'?'Tek oyunculu: Sen VIP · 3 koruma botu. Kurt rakibi co-op’ta.':'Tek oyunculu: Sen koruma · VIP bot. Kurt rakibi co-op’ta.'};
 roster();
 el.querySelectorAll('[data-role]').forEach(b=>{const pick=()=>{KBK.role=b.dataset.role;KBK.rolePicked=true;el.querySelectorAll('[data-role]').forEach(q=>{const on=q===b;q.classList.toggle('sel',on);q.setAttribute('aria-pressed',String(on));q.querySelector('.kbk-class-picktxt').textContent=on?'SEÇİLDİ':'SEÇ'});roster()};b.onclick=pick;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick()}}});
 const go=()=>{el.style.display='none';KBK.chosen=true;cb()};
 $('kbksolo').onclick=()=>{KBK.net=false;KBK.owner=true;KBK.id=0;KBK.host=0;KBK.code='';KBK.peers.clear();go()};
 const join=create=>{const run=()=>{if(KBK.pending)return;const code=$('kbkcode').value.trim();if(!create&&!code){$('kbkdlgstatus').textContent='Oda kodunu yaz.';return}
  const pend=()=>{el.style.display='none';KBK.chosen=true;cb()};
  KBK.pending=pend;$('kbkdlgstatus').textContent='Sunucuya bağlanılıyor...';
  mpSend({t:create?'kbk_create':'kbk_join',code,pass:$('kbkpass').value,role:create?KBK.role:(KBK.rolePicked?KBK.role:'auto')});
  setTimeout(()=>{if(KBK.pending===pend){KBK.pending=null;$('kbkdlgstatus').textContent='Sunucu yanıt vermedi. Güncel server.js ile sunucuyu yeniden aç.'}},8000)};
  if(!MPL.authed)mpOpenDialog(run);else run()};
 $('kbkcreate').onclick=()=>join(true);
 $('kbkjoin').onclick=()=>join(false);
 $('kbklist').onclick=()=>{el.style.display='none';if(typeof roomsOpen==='function')roomsOpen('kbk')};
 if(KBK.joinReq){const q=KBK.joinReq;KBK.joinReq=null;$('kbkcode').value=q.code;$('kbkpass').value=q.pass||'';join(false)}
 $('kbkcancel').onclick=()=>{KBK.pending=null;el.style.display='none'};
}

/* ---------- Rol dağılımı (her istemci aynı listeyi hesaplar) ---------- */
/* kurt: oda açan kurt seçtiyse o; değilse listedeki ilk oyuncu. kbk: seçen ilk oyuncu; yoksa kurt dışındaki son katılan. */
function kbkRoles(){
 const ids=[KBK.id,...KBK.peers.keys()].filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b);
 const hostPick=KBK.hostRole||'auto';
 let wolf;
 if(hostPick==='wolf')wolf=KBK.host;
 else wolf=ids[0];
 let kbk=null;
 if(hostPick==='kbk'&&KBK.host!==wolf)kbk=KBK.host;
 if(kbk==null){for(const id of ids)if(id!==wolf){const q=id===KBK.id?{role:KBK.role==='auto'?null:KBK.role}:KBK.peers.get(id);if(q&&q.role&&q.role==='kbk'){kbk=id;break}}}
 if(kbk==null){for(let i=ids.length-1;i>=0;i--)if(ids[i]!==wolf){kbk=ids[i];break}}
 return{wolf,kbk};
}
function kbkMyRole(){if(!KBK.net)return ['wolf','guardian','kbk'].includes(KBK.role)?KBK.role:'guardian';const r=kbkRoles();return KBK.id===r.wolf?'wolf':KBK.id===r.kbk?'kbk':'guardian'}

/* Shared route geometry: village, checkpoints and the house use the same axis. */
function kbkRoutePoint(t){const h=KBK.housePos,d=Math.hypot(h.x,h.z)||1,start=-KBK_WORLD_R*.9,n=start+(d-start)*t;return{x:h.x/d*n,z:h.z/d*n}}
function kbkRouteSync(){
 if(!KBK.route)return;
 const a=kbkRoutePoint(0),b=kbkRoutePoint(1),d=Math.hypot(b.x-a.x,b.z-a.z);
 KBK.route.position.set((a.x+b.x)/2,.012,(a.z+b.z)/2);KBK.route.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);KBK.route.scale.set(1,1,d);
}
function kbkKeepInside(q){const d=Math.hypot(q.x,q.z),limit=KBK_WORLD_R-3;if(d>limit){q.x*=limit/d;q.z*=limit/d;if('vx' in q){q.vx=0;q.vz=0}}}
function kbkFreeScenery(root){const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)for(const m of [].concat(o.material))ms.add(m)});if(root.parent)root.parent.remove(root);for(const g of gs)g.dispose();for(const m of ms)m.dispose()}
function kbkNpcMove(n,x,z,dt,speed){const dx=x-n.x,dz=z-n.z,d=Math.hypot(dx,dz),step=Math.min(Math.max(0,d-.6),speed*dt);if(d>.001){n.x+=dx/d*step;n.z+=dz/d*step;if(step>0)n.g.rotation.y=Math.atan2(dx,dz)}kbkKeepInside(n);n.g.position.set(n.x,0,n.z);animHuman(n.rig,{t:clock,speed:step/Math.max(dt,.001),fwd:1,air:false,pitch:0,lookYaw:0,rq:-1,sw:-1},dt)}
function kbkClearTrail(x,z){const h=KBK.housePos,d=Math.hypot(h.x,h.z)||1,nx=-h.z/d,nz=h.x/d,side=x*nx+z*nz;if(Math.abs(side)<5){const shift=(side<0?-5:5)-side;x+=nx*shift;z+=nz*shift}return{x,z}}

/* ---------- Orman kurulumu ---------- */
function kbkBuildWorld(){
 const rnd=kbkSrand(KBK.code||'solo'+((SV&&SV.t0)||1));
 {
  const cands=[];
  for(let i=0;i<10;i++){const a=(i/10)*6.283+rnd()*.5,r=KBK_WORLD_R*(.55+rnd()*.35);cands.push([Math.cos(a)*r,Math.sin(a)*r])}
  const c=cands[Math.floor(rnd()*10)];
  if(!KBK.housePos)KBK.housePos={x:c[0],z:c[1]};
 }
 KBK.group=new THREE.Group();S.add(KBK.group);KBK.meshes=[];
 const G=KBK.group;
 G.add(new THREE.HemisphereLight(0x9abfca,0x233c2b,.85));
 const ground=new THREE.Mesh(new THREE.CircleGeometry(KBK_WORLD_R+40,40),new THREE.MeshLambertMaterial({color:0x14231b}));
 ground.rotation.x=-Math.PI/2;G.add(ground);KBK.meshes.push(ground);
 /* A flat, readable route is cheap: one mesh rather than per-frame terrain rays. */
 const routeGeo=new THREE.PlaneGeometry(6,1);routeGeo.rotateX(-Math.PI/2);
 KBK.route=new THREE.Mesh(routeGeo,new THREE.MeshLambertMaterial({color:0x596052}));G.add(KBK.route);kbkRouteSync();
 /* ağaçlar (instanced) */
 const TN=650,tt=new THREE.Object3D();
 const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.16,.26,2.2,5),new THREE.MeshLambertMaterial({color:0x4a3220}),TN);
 const leaves=new THREE.InstancedMesh(new THREE.ConeGeometry(1.5,4.2,6),new THREE.MeshLambertMaterial({color:0x15311d}),TN);
 for(let i=0;i<TN;i++){
  const a=rnd()*6.283,r=14+rnd()*(KBK_WORLD_R-16),{x,z}=kbkClearTrail(Math.cos(a)*r,Math.sin(a)*r),s=.8+rnd()*.9;
  tt.position.set(x,1.1*s,z);tt.scale.setScalar(s);tt.rotation.y=rnd()*6.28;tt.updateMatrix();trunks.setMatrixAt(i,tt.matrix);
  tt.position.y=(2.2+2.0)*s;tt.updateMatrix();leaves.setMatrixAt(i,tt.matrix);
 }
 G.add(trunks,leaves);KBK.meshes.push(trunks,leaves);
 /* çalılar + tilki dolaşım noktaları */
 const BN=110;
 KBK.bushPts=[];
 const bushes=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.1,0),new THREE.MeshLambertMaterial({color:0x1d3a24}),BN);
 for(let i=0;i<BN;i++){
  const a=rnd()*6.283,r=10+rnd()*(KBK_WORLD_R-14),{x,z}=kbkClearTrail(Math.cos(a)*r,Math.sin(a)*r);
  KBK.bushPts.push([x,z]);
  tt.position.set(x,.55,z);tt.scale.set(1+rnd(),.7+rnd()*.5,1+rnd());tt.rotation.y=rnd()*6.28;tt.updateMatrix();bushes.setMatrixAt(i,tt.matrix);
 }
 G.add(bushes);KBK.meshes.push(bushes);
 /* kayalar */
 const RN=50;
 const rocks=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.9,0),new THREE.MeshLambertMaterial({color:0x3a3f45}),RN);
 for(let i=0;i<RN;i++){
  const a=rnd()*6.283,r=16+rnd()*(KBK_WORLD_R-20);
  const pos=kbkClearTrail(Math.cos(a)*r,Math.sin(a)*r);tt.position.set(pos.x,.35,pos.z);tt.scale.setScalar(.6+rnd()*1.4);tt.rotation.set(rnd()*3,rnd()*3,rnd()*3);tt.updateMatrix();rocks.setMatrixAt(i,tt.matrix);
 }
 G.add(rocks);KBK.meshes.push(rocks);
 /* Low-poly luminous mushrooms: two instanced draws, no extra lights. */
 const stems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.035,.05,.22,4),new THREE.MeshLambertMaterial({color:0x81999a}),90);
 const caps=new THREE.InstancedMesh(new THREE.ConeGeometry(.20,.12,6),new THREE.MeshBasicMaterial({color:0x58b5a8}),90);
 const decor=kbkSrand((KBK.code||'solo')+'mushrooms');
 for(let i=0;i<90;i++){const a=decor()*Math.PI*2,r=18+decor()*140;tt.rotation.set(0,a,0);tt.scale.setScalar(.7+decor()*.8);tt.position.set(Math.cos(a)*r,.11,Math.sin(a)*r);tt.updateMatrix();stems.setMatrixAt(i,tt.matrix);tt.position.y=.25;tt.updateMatrix();caps.setMatrixAt(i,tt.matrix)}
 G.add(stems,caps);
 /* ev: 10 adaydan rastgele 1 (sahip seçer, snapshot ile gelir) */

 const h=new THREE.Group();
 const hb=new THREE.Mesh(new THREE.BoxGeometry(7,4.5,6),new THREE.MeshLambertMaterial({color:0x5a4632}));
 hb.position.y=2.25;
 const hr=new THREE.Mesh(new THREE.ConeGeometry(6,2.8,4),new THREE.MeshLambertMaterial({color:0x33241a}));
 hr.position.y=5.9;hr.rotation.y=Math.PI/4;
 const wm=new THREE.MeshBasicMaterial({color:0xffc86b});
 const w1=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.2),wm);w1.position.set(-1.6,2.4,3.02);
 const w2=w1.clone();w2.position.x=1.6;
 const doorG=new THREE.Mesh(new THREE.PlaneGeometry(1.4,2.6),new THREE.MeshBasicMaterial({color:0x36ff8a}));
 doorG.position.set(0,1.3,3.03);
 h.add(hb,hr,w1,w2,doorG);
 h.position.set(KBK.housePos.x,0,KBK.housePos.z);
 h.lookAt(0,0,0);
 G.add(h);KBK.house=h;KBK.meshes.push(h);
 /* ev çarpışma kutusu */
 {const b={m:null,x1:KBK.housePos.x-3.6,x2:KBK.housePos.x+3.6,z1:KBK.housePos.z-3.6,z2:KBK.housePos.z+3.6,h:5};
  const bm=new THREE.Mesh(new THREE.BoxGeometry(7.2,5,7.2),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
  bm.position.set(KBK.housePos.x,2.5,KBK.housePos.z);S.add(bm);b.m=bm;boxes.push(b);boxMeshes.push(bm);KBK.meshes.push(bm);KBK.houseBox=b}
 /* 5 checkpoint: ev yoluna serili taşlar */
 KBK.checkpoints=[];
 const cpMat=new THREE.MeshLambertMaterial({color:0x2f6b4f,emissive:0x0a2a1a});
 for(let i=1;i<=5;i++){
  const {x,z}=kbkRoutePoint(i/6);
  const cp=new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,3.2,5),cpMat.clone());
  cp.position.set(x,1.6,z);G.add(cp);KBK.meshes.push(cp);
  KBK.checkpoints.push({mesh:cp,x,z,passed:false});
 }
 /* dolunay */
 const moon=new THREE.Mesh(new THREE.CircleGeometry(9,24),new THREE.MeshBasicMaterial({color:0xf5f0d8,fog:false}));
 moon.position.set(-KBK.housePos.x*.4,55,-KBK.housePos.z*.4);moon.lookAt(0,10,0);
 G.add(moon);KBK.moon=moon;KBK.meshes.push(moon);
 /* kan izi havuzu (kurt görür) */
 const N=160;
 KBK.bloodPos=new Float32Array(N*3);KBK.bloodLife=new Float32Array(N);KBK.bloodIdx=0;
 for(let i=0;i<N;i++)KBK.bloodPos[i*3+1]=-50;
 const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.BufferAttribute(KBK.bloodPos,3));
 KBK.blood=new THREE.Points(bg,new THREE.PointsMaterial({color:0xb91c1c,size:.35,transparent:true,opacity:.95}));
 KBK.blood.visible=false;G.add(KBK.blood);KBK.meshes.push(KBK.blood);
}
function kbkDropBlood(x,z){
 const N=160,i=KBK.bloodIdx;
 KBK.bloodPos[i*3]=x+(Math.random()-.5)*.4;KBK.bloodPos[i*3+1]=.06;KBK.bloodPos[i*3+2]=z+(Math.random()-.5)*.4;
 KBK.bloodLife[i]=8;KBK.bloodIdx=(i+1)%N;
 KBK.blood.geometry.attributes.position.needsUpdate=true;
}

/* ---------- Tilki ---------- */
function kbkMakeFox(x,z){
 const f=new THREE.Group();
 const bodyMat=new THREE.MeshLambertMaterial({color:0xb45309}),dark=new THREE.MeshLambertMaterial({color:0x7c2d12});
 const body=new THREE.Mesh(new THREE.ConeGeometry(.32,1.1,5),bodyMat);body.rotation.x=Math.PI/2;body.position.y=.45;
 const head=new THREE.Mesh(new THREE.BoxGeometry(.32,.3,.42),bodyMat);head.position.set(0,.55,-.62);
 const e1=new THREE.Mesh(new THREE.ConeGeometry(.08,.22,4),dark);e1.position.set(-.1,.78,-.6);
 const e2=e1.clone();e2.position.x=.1;
 const tail=new THREE.Mesh(new THREE.ConeGeometry(.14,.7,4),dark);tail.rotation.x=-Math.PI/2.3;tail.position.set(0,.5,.62);
 f.add(body,head,e1,e2,tail);
 f.position.set(x,0,z);S.add(f);
 const fox={id:++KBK.foxId,g:f,x,z,hp:40,max:40,kind:'fox',kbkFox:1,cd:0,target:null,dead:0,bob:Math.random()*6};
 f.userData={tg:1,e:fox};
 return fox;
}

/* ---------- KBK ve koruma NPC'leri (solo) ---------- */
function kbkMakeNpcGuard(x,z){
 const rig=mkHuman(BOTCOL.e,false);holderSet(rig,'rifle',SKIN('g0'));setShadow(rig.root);
 rig.root.position.set(x,0,z);S.add(rig.root);
 return{rig,g:rig.root,x,z,hp:100,down:0,stunT:0,yaw:0,name:'Koruma'}
}
function kbkMakeNpcKBK(x,z){
 const cols={pa:0x7c3aed,j:0x8b5cf6,v:0xdc2626,v2:0x991b1b,sk:0xe8c39e,h:0xdc2626,ey:0x111111};
 const rig=mkHuman(cols,false);setShadow(rig.root);
 rig.root.position.set(x,0,z);S.add(rig.root);
 return{rig,g:rig.root,x,z,hp:100,down:0,stunT:0,yaw:0,name:'KBK',isKbk:true}
}

/* ---------- Başlatma ---------- */
function kbkStart(){
 KBK.on=true;KBK.chosen=false;KBK.ended=false;KBK.earned=0;KBK.sendT=0;
 KBK.bleed={on:false,preHp:100,t:0};KBK.crippleT=0;KBK.stunT=0;KBK.stunCd=0;KBK.wolfHp=null;KBK.wolfRespawnT=0;KBK.carry=false;
 KBK.healUsed=false;KBK.reviveT=-1;KBK.stam=100;KBK.stamCd=0;KBK.flash=true;KBK.stillT=0;KBK.locked=false;KBK.exhausted=false;
 if(!KBK.net)KBK.hostRole=KBK.role;
 /* çevre yedekle + arena kutularını gizle (ic deseni) */
 KBK.baseBoxes=boxes.slice();KBK.baseMeshes=boxMeshes.slice();
 for(const b of boxes)b.m.visible=false;boxes.length=0;boxMeshes.length=0;
 KBK.env={floor:floor.position.y,fog:[S.fog.near,S.fog.far],fogColor:S.fog.color.getHex(),sky:S.background.getHex()};
 floor.position.y=-500;
 KBK.lights=[];S.traverse(o=>{if(o.isAmbientLight||o.isDirectionalLight||o.isHemisphereLight||o.isPointLight){KBK.lights.push([o,o.intensity]);o.intensity*=.12}});
 S.background.setHex(0x102127);S.fog.near=12;S.fog.far=85;S.fog.color.setHex(0x102127);
 KBK.housePos=KBK.owner||!KBK.net?null:KBK.housePos; /* ev konumunu host belirler */
 kbkBuildWorld();
 /* el feneri (koruma) */
 KBK.spot=new THREE.SpotLight(0xffeecc,3.2,40,.6,.5,1.1);KBK.spotTgt=new THREE.Object3D();S.add(KBK.spot,KBK.spotTgt);KBK.spot.target=KBK.spotTgt;
 KBK.glow=new THREE.PointLight(0xa8c4ff,.5,7,1.6);S.add(KBK.glow);
 /* oyuncu + rol */
 const role=kbkMyRole();KBK.mine=role;
 p.hp=100;p.dead=0;p.inv=0;p.y=0;p.vy=0;p.vx=p.vz=0;hudHp();timeLeft=999999;
 /* köy: evin ters yönünde başlangıç noktası. Koruma/KBK orada başlar; kurt rastgele kenarda */
 const hd=Math.hypot(KBK.housePos.x,KBK.housePos.z)||1,vx=-KBK.housePos.x/hd,vz=-KBK.housePos.z/hd;
 KBK.village={x:vx*KBK_WORLD_R*.9,z:vz*KBK_WORLD_R*.9};
 if(role==='wolf'){const a=Math.random()*6.283;p.x=Math.cos(a)*KBK_WORLD_R*.85;p.z=Math.sin(a)*KBK_WORLD_R*.85}
 else{p.x=KBK.village.x;p.z=KBK.village.z}
 p.yaw=Math.atan2(KBK.housePos.x-p.x,KBK.housePos.z-p.z)+Math.PI;
 setW(role==='wolf'?'sword':role==='kbk'?'knife':SV.eq.w,true);
 /* tilkiler (sahip kurar) */
 KBK.foxes=[];
 if(KBK.owner)for(let i=0;i<4;i++){const b=KBK.bushPts[(i*37)%KBK.bushPts.length];KBK.foxes.push(kbkMakeFox(b[0],b[1]))}
 if(KBK.snapshot&&!KBK.owner)kbkApplySnapshot(KBK.snapshot);
 KBK.snapshot=null;
 /* solo: eksik rolleri NPC doldurur (köyde başlarlar) */
 KBK.kbkNpc=null;KBK.guardNpcs=[];
 if(!KBK.net){
  if(role!=='kbk')KBK.kbkNpc=kbkMakeNpcKBK(KBK.village.x+2,KBK.village.z+2);
  if(role!=='guardian')for(let i=0;i<3;i++)KBK.guardNpcs.push(kbkMakeNpcGuard(KBK.village.x-2-i*1.5,KBK.village.z+2+i));
 }
 KBK.blood.visible=(role==='wolf');
 kbkHudBuild();
 kbkMsg(role==='wolf'?'Kurt sensin. KBK\'yı bul ve kaçır (E). Q: ağır darbe.':role==='kbk'?'Pusulayı takip et, takımı eve götür. H: sargı · Heal: takıma can bas.':'KBK\'yı koru, eve ulaştır. Tilkiye dikkat! H: sargı');
 try{snd(200,.15)}catch(e){}
}

/* ---------- HUD ---------- */
const KBK_PXD=3; /* pusula: derece başına piksel */
function kbkHudBuild(){
 let el=$('kbkhud');if(el)el.remove();
 el=document.createElement('div');el.id='kbkhud';$('hud').appendChild(el);
 const strip=[];
 for(let d=-360;d<=720;d+=15){
  const norm=((d%360)+360)%360,major=norm%45===0;
  strip.push(`<span style="display:inline-block;width:${15*KBK_PXD}px;text-align:center;flex:none;font-size:${major?'13px':'10px'};opacity:${major?1:.55};${norm===0?'color:#ff5555;font-weight:800;':''}">${major?norm+'° '+KBK_Dirs[Math.round(norm/45)%8]:norm+'°'}</span>`);
 }
 el.innerHTML=`
 <div id="kbkcompass"><div id="kbkneedle"></div><div id="kbkstrip">${strip.join('')}</div><div id="kbkhome">⌂<span id="kbkhometext"></span></div></div>
 <div id="kbkstatus"></div>
 <div id="kbkbars">
  <div class="kbkbar"><i id="kbkstam" style="background:#39dfff"></i></div>
 </div>
 <div id="kbkbadge"></div>
 <div id="kbkacts">
  <button class="kbkbtn" id="kbkb1" style="display:none"></button>
  <button class="kbkbtn" id="kbkb2" style="display:none"></button>
 </div>
 <div id="kbkoverlay" style="display:none"></div>
 <div id="kbkcount" style="display:none"></div>
 <div id="kbkmsg"></div>`;
 kbkHudWire();
}
function kbkHudWire(){
 const b1=$('kbkb1'),b2=$('kbkb2'),r=KBK.mine;
 if(r==='wolf'){
  b1.style.display='';b1.innerHTML='⚡ AĞIR DARBE<small>Q · 5 sn stun</small>';
  b1.onclick=()=>kbkWolfStun();
  b2.style.display='';b2.innerHTML='🐺 KAÇIR<small>E · KBK\'ya yaklaş</small>';
  b2.onclick=()=>kbkWolfKidnap();
 }else if(r==='kbk'){
  b1.style.display='';b1.innerHTML='➕ 20 HP HEAL<small>rauntta 1 hak</small>';
  b1.onclick=()=>kbkMedicHeal();
  b2.style.display='';b2.innerHTML='🩹 SARGI<small>H · kanamayı durdur</small>';
  b2.onclick=()=>kbkBandage();
 }else{
  b1.style.display='';b1.innerHTML='🩹 SARGI<small>H · kanamayı durdur</small>';
  b1.onclick=()=>kbkBandage();
  b2.style.display='none';
 }
}
function kbkMsg(t,ms){const m=$('kbkmsg');if(!m)return;m.textContent=t;m.style.opacity=1;if(ms)clearTimeout(kbkMsg._t),kbkMsg._t=setTimeout(()=>{m.style.opacity=0},ms)}
function kbkBadge(t){const b=$('kbkbadge');if(b)b.textContent=t||''}

/* ---------- Yardımcılar ---------- */
function kbkMoney(n){if(!Number.isFinite(n)||n<=0)return;SV.tl+=n;save();bal();if(KBK.net&&KBK.owner)mpSend({t:'kbk_event',event:'reward',amount:n})}
function kbkPlayers(){
 const list=[{id:KBK.id,x:p.x,y:p.y,z:p.z,hp:p.hp,alive:p.dead<=0&&p.hp>0,name:'Sen',ch:icMyChSafe(),w:wk,yaw:p.yaw,role:KBK.mine}];
 for(const[id,q]of KBK.peers)if(id!==KBK.id)list.push({id,x:q.x||0,y:q.y||0,z:q.z==null?0:q.z,hp:q.hp,alive:q.hp>0,name:q.name,ch:q.ch,w:q.w,yaw:q.yaw,role:q.role});
 return list;
}
function icMyChSafe(){return typeof chWithKit==='function'?chWithKit(SV.eq.c):SV.eq.c}
function kbkKbkPos(){ /* KBK'nın konumu: ben KBK'ysem ben, değilsem eş ya da NPC */
 if(KBK.mine==='kbk')return{x:p.x,z:p.z};
 const r=kbkRoles();
 const peer=KBK.peers.get(r.kbk);
 if(peer&&peer.x!=null)return{x:peer.x,z:peer.z};
 if(KBK.kbkNpc)return{x:KBK.kbkNpc.x,z:KBK.kbkNpc.z};
 return KBK.housePos;
}
function kbkKbkDown(){
 if(KBK.mine==='kbk')return p.hp<=0||p.dead>0;
 const r=kbkRoles();const q=KBK.peers.get(r.kbk);
 if(q)return q.hp<=0;
 if(KBK.kbkNpc)return KBK.kbkNpc.hp<=0||KBK.kbkNpc.down>0;
 return false;
}
/* stun kuralı: toplam koruma ≥3 VE ayakta ≥2. Toplam ≤2 → stun kapalı. Son ayakta koruma vurulamaz. */
function kbkGuardCounts(){
 let total=0,down=0;
 for(const q of kbkPlayers())if(q.role==='guardian'){total++;if(!q.alive)down++}
 for(const g of KBK.guardNpcs){total++;if(g.down>0||g.stunT>0)down++}
 return{total,down,awake:total-down};
}
function kbkStunRule(){
 const g=kbkGuardCounts();
 if(g.total<=2)return{ok:false,reason:'Stun kapalı: toplam koruma 2 veya az.'};
 if(g.awake>=2)return{ok:true};
 if(g.awake===1)return{ok:false,reason:'Son ayakta kalan koruma vurulamaz!'};
 return{ok:false,reason:'Ayakta koruma kalmadı.'};
}
function kbkDist2(ax,az,bx,bz){return Math.hypot(ax-bx,az-bz)}

/* ---------- Kanama / sargı / sakatlık ---------- */
function kbkBite(){
 if(KBK.bleed.on||KBK.mine==='wolf')return;
 KBK.bleed={on:true,preHp:Math.round(p.hp),t:0};
 KBK.crippleT=KBK_CRIPPLE_MIN+Math.random()*(KBK_CRIPPLE_MAX-KBK_CRIPPLE_MIN);
 const min=KBK.mine==='kbk'?0:10;
 p.hp=Math.max(min,p.hp-5);hudHp(); /* ısırık anında −5, sonra kanama */
 kbkDropBlood(p.x,p.z);
 try{snd(160,.2,.08,'sawtooth')}catch(e){}
 kbkMsg('Tilki ısırdı! Kanıyorsun (−1 HP/sn) · H: sargı',3000);
}
function kbkBandage(){
 if(!KBK.bleed.on)return;
 KBK.bleed.on=false;KBK.crippleT=0;
 p.hp=Math.min(100,KBK.bleed.preHp);hudHp();
 try{snd(520,.1,.06,'sine')}catch(e){}
 kbkMsg('Yara sarıldı, kanama durdu.',2000);
}
/* ---------- Medic ---------- */
function kbkMedicHeal(){
 if(KBK.mine!=='kbk'||KBK.healUsed||KBK.ended)return;
 KBK.healUsed=true;
 let best=null;
 for(const q of kbkPlayers())if(q.role==='guardian'&&q.alive&&(!best||q.hp<best.hp))best=q;
 if(best&&best.id===KBK.id)p.hp=Math.min(100,p.hp+20);
 else if(best)mpSend({t:'kbk_event',event:'heal',id:best.id,amount:20});
 else p.hp=Math.min(100,p.hp+20);
 hudHp();try{snd(660,.12)}catch(e){}
 kbkMsg('Heal kullanıldı (rauntta 1 hak).',2500);
}
/* Düşen KBK'yı kaldır: yakındaki kurt-dışı oyuncu E ile 2 sn tutar */
function kbkReviveTry(){
 if(KBK.reviveT>=0||!kbkKbkDown())return;
 const kp=kbkKbkPos();
 if(kbkDist2(p.x,p.z,kp.x,kp.z)>3){kbkMsg('KBK\'ya yaklaş (3 m).',1800);return}
 KBK.reviveT=0;kbkMsg('KBK kaldırılıyor...',2000);
}
function kbkWolfStun(){
 if(KBK.mine!=='wolf'||KBK.stunCd>0||KBK.stunT>0||KBK.ended||KBK.wolfRespawnT>0)return;
 const rule=kbkStunRule();
 if(!rule.ok){kbkMsg('⛔ '+rule.reason,2200);try{snd(140,.15,.07,'sawtooth')}catch(e){}return}
 let best=null,bd=4.5;
 for(const q of kbkPlayers()){if(q.role!=='guardian'||!q.alive)continue;const d=kbkDist2(p.x,p.z,q.x,q.z);if(d<bd){bd=d;best=q}}
 let npc=null;
 for(const g of KBK.guardNpcs){if(g.down>0||g.stunT>0)continue;const d=kbkDist2(p.x,p.z,g.x,g.z);if(d<bd){bd=d;npc=g;best=null}}
 if(!best&&!npc){kbkMsg('Menilde koruma yok (4,5 m).',1800);return}
 if(npc){npc.stunT=KBK_STUN_T;kbkMsg('Koruma sersemledi! ('+KBK_STUN_T+' sn)',2000)}
 if(best){mpSend({t:'kbk_event',event:'stun',id:best.id});kbkMsg(best.name+' sersemledi! ('+KBK_STUN_T+' sn)',2000)}
 KBK.stunCd=8;
 try{snd(90,.3,.1,'sawtooth')}catch(e){}
}
function kbkWolfKidnap(){
 if(KBK.mine!=='wolf'||KBK.ended||KBK.wolfRespawnT>0)return;
 const kp=kbkKbkPos();
 if(kbkDist2(p.x,p.z,kp.x,kp.z)>3.5){kbkMsg('KBK\'ya yaklaş (3,5 m).',1800);return}
 if(KBK.owner){kbkKidnapResolve()}
 else mpSend({t:'kbk_event',event:'kidnap'});
}
function kbkKidnapResolve(){
 const romantic=Math.random()<.05;
 kbkEnd(romantic?'romantic':'banquet');
 if(KBK.net&&KBK.owner)mpSend({t:'kbk_event',event:'end',ending:romantic?'romantic':'banquet'});
}

/* ---------- Tilki AI (yalnız sahip) ---------- */
function kbkFoxStep(f,dt){
 if(f.dead>0){f.dead-=dt;f.g.rotation.z=Math.min(1.4,f.g.rotation.z+dt*2.5);if(f.dead<=0){S.remove(f.g);KBK.foxes.splice(KBK.foxes.indexOf(f),1)}return}
 f.cd=Math.max(0,f.cd-dt);
 let best=null,bd=1e9;
 for(const q of kbkPlayers()){if(!q.alive||q.role==='wolf')continue;const d=kbkDist2(f.x,f.z,q.x,q.z);if(d<bd){bd=d;best=q}}
 f.bob+=dt*8;
 if(best&&bd<15){
  const dx=(best.x-f.x)/bd,dz=(best.z-f.z)/bd,sp=bd<6?3.4:2.2;
  f.x+=dx*sp*dt;f.z+=dz*sp*dt;
  f.g.rotation.y=Math.atan2(dx,dz)+Math.PI;
  if(bd<6&&f.cd<=0){f.cd=6;
   if(best.id===KBK.id)kbkBite();
   else mpSend({t:'kbk_event',event:'bite',id:best.id});
  }
 }else{
  if(!f.target||kbkDist2(f.x,f.z,f.target[0],f.target[1])<2){const b=KBK.bushPts[Math.floor(Math.random()*KBK.bushPts.length)];f.target=b}
  const dx=f.target[0]-f.x,dz=f.target[1]-f.z,d=Math.hypot(dx,dz)||1;
  f.x+=dx/d*1.3*dt;f.z+=dz/d*1.3*dt;f.g.rotation.y=Math.atan2(dx,dz)+Math.PI;
 }
 f.g.position.set(f.x,Math.abs(Math.sin(f.bob))*.07,f.z);
}
function kbkDamageFox(f,d,info){
 if(f.dead>0)return;
 if(!KBK.owner){mpSend({t:'kbk_hit',target:f.id,w:wk});if(info&&info.pt)dmgNum(info.pt,d,!!info.head,false);return}
 f.hp-=d;
 if(info&&info.pt)dmgNum(info.pt,d,!!info.head,f.hp<=0);
 if(f.hp<=0){f.dead=2;try{snd(140,.25)}catch(e){}}
}

/* ---------- Ana tick (stepPlayer kancasından çağrılır) ---------- */
function kbkTick(dt){
 if(!KBK.on)return;
 const role=KBK.mine;
 /* fener */
 if(KBK.spot){KBK.spot.intensity=(role==='guardian'&&KBK.flash)?3.2:0;
  if(KBK.flash&&role==='guardian'){KBK.spot.position.copy(cam.position);cam.getWorldDirection(_dir);KBK.spotTgt.position.copy(cam.position).addScaledVector(_dir,6);KBK.spotTgt.position.y-=1.1}}
 if(KBK.glow)KBK.glow.position.copy(cam.position);
 /* stamina: koruma/kbk sprintte −20/sn, dururken +13/sn; kurt sınırsız (feral) */
 const moving=Math.hypot(p.vx,p.vz)>1&&p.g,sprinting=kDown('sprint')&&moving;
 if(role!=='wolf'){
  if(sprinting&&KBK.stam>0){KBK.stam=Math.max(0,KBK.stam-20*dt);KBK.stamCd=.9}
  else{KBK.stamCd-=dt;if(KBK.stamCd<=0)KBK.stam=Math.min(100,KBK.stam+13*dt)}
 }
 /* sakatlık: hız ×0.55 hissi (sürtünme) */
 if(KBK.crippleT>0){KBK.crippleT-=dt;p.vx*=Math.pow(.55,dt*2);p.vz*=Math.pow(.55,dt*2);if(KBK.crippleT<=0)kbkMsg('Bacağın düzeldi.',1500)}
 /* stun (kurt sersemletildiyse — co-opta kurta vurulunca) */
 if(KBK.stunT>0){KBK.stunT-=dt;p.vx=0;p.vz=0}
 /* kanama */
 if(KBK.bleed.on){KBK.bleed.t+=dt;
  if(KBK.bleed.t>=1){KBK.bleed.t=0;const min=role==='kbk'?0:1;p.hp=Math.max(min,p.hp-1);hudHp();if(role==='wolf')kbkDropBlood(p.x,p.z)}
  if(role==='wolf'||Math.random()<dt*.7)kbkDropBlood(p.x,p.z);
 }
 /* kan nokta ömürleri */
 let dirty=false;
 for(let i=0;i<160;i++)if(KBK.bloodLife[i]>0){KBK.bloodLife[i]-=dt;if(KBK.bloodLife[i]<=0){KBK.bloodPos[i*3+1]=-50;dirty=true}}
 if(dirty)KBK.blood.geometry.attributes.position.needsUpdate=true;
 /* kurt yeniden doğuş */
 if(KBK.wolfRespawnT>0){KBK.wolfRespawnT-=dt;p.vx=p.vz=0;
  if(KBK.wolfRespawnT<=0){p.hp=100;p.dead=0;hudHp();const a=Math.random()*6.28;p.x=Math.cos(a)*KBK_WORLD_R*.85;p.z=Math.sin(a)*KBK_WORLD_R*.85;kbkMsg('Kurt geri döndü!',2000)}}
 /* pusula kilidi: durunca 1,2 sn sonra sabitler */
 if(moving){KBK.stillT=0;KBK.locked=false}else{KBK.stillT+=dt*1000;if(KBK.stillT>=1200)KBK.locked=true}
 KBK.swayT+=dt;
 /* revive ilerlemesi */
 if(KBK.reviveT>=0){KBK.reviveT+=dt/2;
  if(KBK.reviveT>=1){KBK.reviveT=-1;
   if(KBK.mine==='kbk'){p.hp=50;p.dead=0;hudHp()}
   else mpSend({t:'kbk_event',event:'revived'});
   kbkMsg('KBK ayağa kalktı (50 HP)!',2500)}
 }
 /* sahip simülasyonu */
 if(KBK.owner&&!KBK.ended){
  for(const f of KBK.foxes.slice())kbkFoxStep(f,dt);
  /* checkpoint + eve ulaşım */
  const kp=kbkKbkPos();
  for(const c of KBK.checkpoints)if(!c.passed&&kbkDist2(kp.x,kp.z,c.x,c.z)<5){c.passed=true;c.mesh.material.color.setHex(0x10b981);try{snd(700+KBK.checkpoints.indexOf(c)*60,.1)}catch(e){}}
  if(kbkDist2(kp.x,kp.z,KBK.housePos.x,KBK.housePos.z)<8){
   KBK.ended=true;kbkMoney(KBK_REWARD);
   kbkEnd('escort');
   if(KBK.net)mpSend({t:'kbk_event',event:'end',ending:'escort'});
  }
  /* solo: NPC kurt yok — NPC koruma/kbk hafif salınır */
 }
 /* solo NPC takip */
 if(!KBK.net){
  if(KBK.kbkNpc&&KBK.mine!=='kbk'){
   const anchor=KBK.mine==='guardian'?{x:p.x,z:p.z}:KBK.housePos;
   kbkNpcMove(KBK.kbkNpc,anchor.x+2,anchor.z+2,dt,2.2);
  }
  for(let i=0;i<KBK.guardNpcs.length;i++){
   const g=KBK.guardNpcs[i];
   if(g.stunT>0){g.stunT-=dt;g.g.rotation.x=Math.min(1.2,g.g.rotation.x+dt*3);continue}
   g.g.rotation.x=0;
   const anchor=KBK.mine==='kbk'?{x:p.x,z:p.z}:KBK.kbkNpc?{x:KBK.kbkNpc.x,z:KBK.kbkNpc.z}:{x:p.x,z:p.z};
   const ox=Math.cos(i*2.1)*2.4,oz=Math.sin(i*2.1)*2.4;
   kbkNpcMove(g,anchor.x+ox,anchor.z+oz,dt,3.2);
  }
  if(KBK.kbkNpc){kbkKeepInside(KBK.kbkNpc);KBK.kbkNpc.g.position.set(KBK.kbkNpc.x,0,KBK.kbkNpc.z)}
  for(const g of KBK.guardNpcs){kbkKeepInside(g);g.g.position.set(g.x,0,g.z)}
 }
 /* ağ senkronu */
 if(KBK.net&&!KBK.ended){KBK.sendT-=dt;if(KBK.sendT<=0){KBK.sendT=.1;
  mpSend({t:'kbk_state',d:{x:p.x,y:p.y,z:p.z,yaw:p.yaw,hp:p.hp,flash:KBK.flash,ch:icMyChSafe(),w:wk,role:KBK.mine}});
  if(KBK.owner)mpSend({t:'kbk_snapshot',d:kbkSnapshot()})}}
 /* akran avatarları */
 for(const[id,q]of KBK.peers){
  if(id===KBK.id)continue;
  const role=q.role||'guardian';
  let av=KBK.avatars.get(id);
  if(av&&(av.ch!==(q.ch||'c0')||av.w!==q.w||av.role!==role)){freeActor(av.root);KBK.avatars.delete(id);av=null}
  if(!av){av=kbkMakeAvatar(q);KBK.avatars.set(id,av);S.add(av.root)}
  av.root.visible=q.hp>0;
  const qy=q.y||0,nx=q.x||0,nz=q.z==null?0:q.z,sp=Math.hypot(nx-(av.px==null?nx:av.px),nz-(av.pz==null?nz:av.pz))/Math.max(dt,1e-3);
  av.px=nx;av.pz=nz;
  av.root.position.set(nx,qy,nz);av.root.rotation.y=q.yaw||0;
  animHuman(av.rig,{t:clock+id,speed:Math.min(sp,9),fwd:1,air:false,pitch:0,lookYaw:0,flinch:0,ads:0,kick:0,kickR:0,kickL:0,rq:-1,flash:0,flashL:0,bob:0,lr:0,sw:-1},dt);
 }
 /* HUD */
 kbkHudTick(dt);
}
function kbkSnapshot(){
 return{house:{x:KBK.housePos.x,z:KBK.housePos.z},
  cps:KBK.checkpoints.map(c=>c.passed?1:0),
  foxes:KBK.foxes.filter(f=>f.dead<=0).map(f=>({id:f.id,x:f.x,z:f.z,hp:f.hp})),
  players:kbkPlayers().map(q=>({id:q.id,x:q.x,y:q.y,z:q.z,hp:q.hp,role:q.role}))};
}
function kbkApplySnapshot(d){
 KBK.snapshot=d;
 if(d.house){KBK.housePos={x:d.house.x,z:d.house.z};
  if(KBK.house)KBK.house.position.set(d.house.x,0,d.house.z);
  /* checkpoint taşları + ev çarpışma kutusu da gerçek konuma taşınır */
  for(let i=0;i<5;i++){const c=KBK.checkpoints[i];if(!c)continue;const pt=kbkRoutePoint((i+1)/6);c.x=pt.x;c.z=pt.z;c.mesh.position.set(c.x,1.6,c.z)}
  if(KBK.houseBox){const b=KBK.houseBox;b.x1=d.house.x-3.6;b.x2=d.house.x+3.6;b.z1=d.house.z-3.6;b.z2=d.house.z+3.6;b.m.position.set(d.house.x,2.5,d.house.z)}
  kbkRouteSync();
  /* ay da eve baksın */
  if(KBK.moon){KBK.moon.position.set(-d.house.x*.4,55,-d.house.z*.4);KBK.moon.lookAt(0,10,0)}
 }
 if(d.cps)for(let i=0;i<Math.min(5,d.cps.length);i++){const c=KBK.checkpoints[i];if(c&&d.cps[i]){c.passed=true;c.mesh.material.color.setHex(0x10b981)}}
 for(const fs of d.foxes||[]){
  let f=KBK.foxes.find(q=>q.id===fs.id);
  if(!f&&KBK.foxes.length<8){f=kbkMakeFox(fs.x,fs.z);f.id=fs.id;KBK.foxes.push(f)}
  if(f){f.tx=fs.x;f.tz=fs.z;f.hp=fs.hp}
 }
 for(const q of d.players||[]){
  if(q.id===KBK.id){const was=p.hp;p.hp=q.hp;if(p.hp<=0&&was>0){p.dead=1e9;firing=false}hudHp()}
  else{const old=KBK.peers.get(q.id)||{};KBK.peers.set(q.id,{...old,...q,role:q.role})}
 }
}
function kbkPeerTick(dt){
 if(KBK.owner)return;
 for(const f of KBK.foxes){if(f.tx==null)continue;
  f.x+=(f.tx-f.x)*Math.min(1,dt*8);f.z+=(f.tz-f.z)*Math.min(1,dt*8);
  f.g.position.set(f.x,Math.abs(Math.sin(clock*8+f.id))*.07,f.z)}
}

/* ---------- Avatarlar (eş görünümü) ---------- */
function kbkMakeAvatar(q){
 const role=q.role||'guardian';
 let rig;
 if(role==='wolf'){
  /* kurt: koyu gövdeli, kırmızı gözlü yaratık görünümü (insan iskeleti üzerinde) */
  const cols={pa:0x1f2430,j:0x141a24,v:0x2a0d0d,v2:0x1a0808,sk:0x39424f,h:0x10141c,ey:0xff2222,hd:[{w:.4,h:.12,d:.3,x:0,y:.32,z:-.02,c:0x10141c},{w:.06,h:.14,d:.06,x:-.1,y:.4,z:.02,c:0x10141c},{w:.06,h:.14,d:.06,x:.1,y:.4,z:.02,c:0x10141c}],sc:1.06};
  rig=mkHuman(cols,false);
 }else{
  rig=mkHuman(CHAR(q.ch||'c0'),false);
  if(role==='guardian')holderSet(rig,WP[q.w]?q.w:'rifle',SKIN('g0'));
 }
 setShadow(rig.root);
 rig.root.userData={tg:1,e:{kbkPeer:q.id}};
 return{root:rig.root,rig,role,ch:q.ch,w:q.w};
}

/* ---------- HUD tazeleme ---------- */
function kbkHudTick(dt){
 const el=$('kbkhud');if(!el)return;
 const role=KBK.mine;
 /* pusula */
 const sway=(!KBK.locked&&Math.hypot(p.vx,p.vz)>1)?Math.sin(KBK.swayT*7)*4+(Math.random()-.5)*3:0;
 const yawDeg=(((-p.yaw*180/Math.PI)%360)+360)%360+sway;
 const strip=$('kbkstrip');if(strip)strip.style.transform=`translateX(${-yawDeg*KBK_PXD}px)`;
 const norm=Math.round(((yawDeg%360)+360)%360);
 const homeVec={x:KBK.housePos.x-p.x,z:KBK.housePos.z-p.z};
 const homeDist=Math.round(Math.hypot(homeVec.x,homeVec.z));
 const homeBearing=((Math.atan2(-homeVec.x,-homeVec.z)*180/Math.PI)+360)%360;
 const rel=KBK_Wrap(homeBearing-norm);
 const hm=$('kbkhome');
 if(hm&&role!=='wolf'){
  hm.style.display='block';
  hm.style.left=`calc(50% + ${Math.max(-46,Math.min(46,rel))*.9}% - 14px)`;
  $('kbkhometext').textContent=' EVE '+homeDist+'m';
  hm.style.opacity=Math.abs(rel)>55?.25:1;
 }else if(hm)hm.style.display='none';
 /* durum satırı */
 const st=$('kbkstatus');
 if(st){
  const cpN=KBK.checkpoints.filter(c=>c.passed).length;
  const lockTxt=KBK.locked?'PUSULA SABİT':(Math.hypot(p.vx,p.vz)>1?'PUSULA SALLANIYOR (dursan sabitlenir)':'SABİTLENİYOR...');
  st.textContent=`${role==='wolf'?'🐺 KURT':role==='kbk'?'👑 KBK':'🛡 KORUMA'}${KBK.net?' · ODA '+KBK.code:''} · CP ${cpN}/5 · ${role==='wolf'?'KBK '+Math.round(kbkDist2(p.x,p.z,kbkKbkPos().x,kbkKbkPos().z))+'m':'EV '+homeDist+'m'} · ${lockTxt}${KBK.flash||role!=='guardian'?'':' · FENER KAPALI (F)'}`;
  st.className=KBK.locked?'kbk-ok':'kbk-warn';
 }
 /* stamina */
 const bar=$('kbkstam');if(bar)bar.style.width=(role==='wolf'?100:KBK.stam)+'%';
 /* rozetler */
 let badge='';
 if(KBK.bleed.on)badge+='🩸 KANIYORSUN (−1 HP/sn) · H sargı ';
 if(KBK.crippleT>0)badge+='🦵 SAKAT (hız %45) ';
 if(KBK.stunT>0)badge+='⚡ SERSEMLEDİN '+Math.ceil(KBK.stunT)+'sn ';
 if(KBK.carry)badge+='🐺 KBK TAŞINIYOR (hız %85) ';
 if(KBK.healUsed&&role==='kbk')badge+='✚ heal kullanıldı ';
 kbkBadge(badge);
 /* kaplama */
 const ov=$('kbkoverlay');
 if(ov){
  let html='',show=false;
  if(KBK.stunT>0){show=true;html=`<div class="kbk-big">⚡ SERSEMLETİLDİN!<small>${Math.ceil(KBK.stunT)} sn eylemsizsin</small></div>`}
  else if(KBK.wolfRespawnT>0&&role==='wolf'){show=true;html=`<div class="kbk-big">☠ ÖLDÜN<small>Kurt ${Math.ceil(KBK.wolfRespawnT)} sn sonra doğar</small></div>`}
  else if(role==='wolf'&&KBK.stam!==undefined){/* kurt stamina göstermez */}
  else if(p.dead>0&&role==='kbk'){show=true;html=`<div class="kbk-big">👑 DÜŞTÜN<small>Takım arkadaşın seni kaldırabilir (E)</small></div>`}
  else if(KBK.reviveT>=0){show=true;html=`<div class="kbk-big">⏳ KALDIRILIYORSUN<small>%${Math.min(100,Math.round(KBK.reviveT*100))}</small></div>`}
  ov.style.display=show?'flex':'none';ov.innerHTML=html;
 }
 /* kurt buton cooldown gösterimi */
 const b1=$('kbkb1');
 if(b1&&role==='wolf'){b1.style.opacity=KBK.stunCd>0?.4:1;b1.innerHTML=KBK.stunCd>0?`⚡ AĞIR DARBE<small>${Math.ceil(KBK.stunCd)} sn</small>`:'⚡ AĞIR DARBE<small>Q · 5 sn stun</small>'}
 if(b1&&role==='kbk'){b1.style.opacity=KBK.healUsed?.4:1;b1.innerHTML=KBK.healUsed?'➕ 20 HP HEAL<small>kullanıldı</small>':'➕ 20 HP HEAL<small>rauntta 1 hak</small>'}
}

/* ---------- Bitiş ---------- */
function kbkEnd(kind){
 KBK.ended=true;firing=false;state='end';if(document.exitPointerLock)document.exitPointerLock();
 $('ttl').textContent='KBK ESCORT & HUNT';
 const T2={escort:['KBK EVİNE ULAŞTI!','Koruma takımı kazandı. Gece kurt aç kaldı.'],banquet:['MAĞARA ZİYAFETİ','Kurt kızı karanlık mağaraya sürükledi...'],romantic:['ROMANTİK AY MAĞARASI 💕','Kurt kıyıma kıyamadı! %5 ihtimalli gizli son!'],alldead:['TAKIM YOK OLDU','Kimse hayatta kalmadı.'],closed:['ODA KAPANDı','Oda sahibi ayrıldı.']}[kind]||['MAÇ BİTTİ',''];
 $('sub').textContent=T2[0];
 const cpN=KBK.checkpoints.filter(c=>c.passed).length;
 $('res').innerHTML=`${T2[1]}<br>Checkpoint <b>${cpN}/5</b> · Kazanç <b>${fmt(KBK.earned)} TL</b> hesabında kaldı.`;
 $('play').textContent='TEKRAR';$('ov').classList.remove('off');
 if(kind==='romantic'&&KBK.moon)KBK.moon.material.color.setHex(0xffd6e8);
}

/* ---------- Temizlik ---------- */
function kbkDispose(){
 if(!KBK.on)return;
 KBK.on=false;KBK.pending=null;KBK.ended=false;
 if(KBK.net)mpSend({t:'kbk_leave'});KBK.net=false;
 for(const f of KBK.foxes)kbkFreeScenery(f.g);KBK.foxes=[];
 if(KBK.kbkNpc){freeActor(KBK.kbkNpc.g);KBK.kbkNpc=null}
 for(const g of KBK.guardNpcs)freeActor(g.g);KBK.guardNpcs=[];
 for(const av of KBK.avatars.values())freeActor(av.root);KBK.avatars.clear();KBK.peers.clear();
 if(KBK.spot){S.remove(KBK.spot);S.remove(KBK.spotTgt);KBK.spot=null}
 if(KBK.glow){S.remove(KBK.glow);KBK.glow=null}
 if(KBK.houseBox)kbkFreeScenery(KBK.houseBox.m);KBK.houseBox=null;
 if(KBK.group){kbkFreeScenery(KBK.group);KBK.group=null}KBK.route=null;
 KBK.meshes=[];
 if(KBK.baseBoxes){boxes.length=0;boxMeshes.length=0;for(const b of KBK.baseBoxes){boxes.push(b);boxMeshes.push(b.m);b.m.visible=true}KBK.baseBoxes=null}
 if(KBK.env){floor.position.y=KBK.env.floor;S.fog.near=KBK.env.fog[0];S.fog.far=KBK.env.fog[1];S.fog.color.setHex(KBK.env.fogColor);S.background.setHex(KBK.env.sky);KBK.env=null}
 for(const[o,i]of KBK.lights)o.intensity=i;KBK.lights=[];
 const h=$('kbkhud');if(h)h.remove();
 KBK.housePos=null;KBK.house=null;KBK.checkpoints=[];KBK.blood=null;
}

/* ---------- Ağ ---------- */
function kbkNetMsg(m){
 if(m.t==='kbk_welcome'){
  if(!KBK.pending){mpSend({t:'kbk_leave'});return}
  Object.assign(KBK,{net:true,owner:m.id===m.host,id:m.id,host:m.host,code:m.code,snapshot:m.snapshot||null,hostRole:m.hostRole||'auto'});
  KBK.peers=new Map(m.players.map(q=>[q.id,{...q,hp:100,x:0,y:0,z:0,role:q.role||'auto'}]));
  KBK.role=m.role||'auto';
  const cb=KBK.pending;KBK.pending=null;if(cb)cb();else mpSend({t:'kbk_leave'});
  return;
 }
 if(m.t==='kbk_error'){KBK.pending=null;const el=$('kbkdlgstatus');if(el)el.textContent=m.message;if(m.need==='pass'&&typeof roomsAskPass==='function')roomsAskPass('kbk',m.code,m.message);return}
 if(m.t==='kbk_peers'){const ids=new Set(m.players.map(q=>q.id));for(const id of KBK.peers.keys())if(!ids.has(id)){KBK.peers.delete(id);const av=KBK.avatars.get(id);if(av)S.remove(av.root);KBK.avatars.delete(id)}for(const q of m.players)KBK.peers.set(q.id,{hp:100,x:0,y:0,z:0,role:q.role||'auto',...KBK.peers.get(q.id),...q});return}
 if(!KBK.on||mode!=='kbk')return;
 if(m.t==='kbk_closed'){kbkEnd('closed');$('sub').textContent=m.reason;return}
 if(m.t==='kbk_snapshot'&&!KBK.owner){kbkApplySnapshot(m.d);return}
 if(m.t==='kbk_state'){if(m.id===KBK.id)return;const q=KBK.peers.get(m.id);if(q)Object.assign(q,m.d,{x:clamp(m.d.x,-200,200),z:clamp(m.d.z,-200,200)});return}
 if(m.t==='kbk_hit'){
  if(m.target==='wolf'){ /* koruma kurta vurdu (hasar sahibin onayıyla) */
   if(!KBK.owner)return;
   KBK.wolfHp=(KBK.wolfHp==null?100:KBK.wolfHp)-m.damage;
   if(KBK.net)mpSend({t:'kbk_event',event:'wolfhp',hp:Math.max(0,KBK.wolfHp)});
   if(KBK.wolfHp<=0){KBK.wolfHp=100;if(KBK.net)mpSend({t:'kbk_event',event:'wolfdown'})}
   return;
  }
  if(KBK.owner){const f=KBK.foxes.find(q=>q.id===m.target&&q.dead<=0);if(f)kbkDamageFoxHost(f,m.damage)}
  return;
 }
 if(m.t==='kbk_event'){
  const ev=m.event;
  if(ev==='reward'){kbkMoney(m.amount);return}
  if(!KBK.ended&&(ev==='end')){kbkEnd(m.ending||'banquet');return}
  if(ev==='bite'&&m.id===KBK.id)kbkBite();
  else if(ev==='stun'&&m.id===KBK.id){KBK.stunT=KBK_STUN_T;try{snd(90,.3,.1,'sawtooth')}catch(e){}}
  else if(ev==='heal'&&m.id===KBK.id&&KBK.mine==='guardian'){p.hp=Math.min(100,p.hp+(m.amount||20));hudHp();kbkMsg('KBK sana can bastı (+20).',2000)}
  else if(ev==='kidnap'&&KBK.owner)kbkKidnapResolve();
  else if(ev==='wolfdown'&&KBK.mine==='wolf'){KBK.wolfRespawnT=KBK_WOLF_RESPAWN;p.dead=1e9;firing=false;kbkMsg('Koruma seni indirdi!',2500)}
  else if(ev==='wolfhp'&&KBK.mine==='wolf'){p.hp=m.hp;hudHp();if(p.hp<=0&&p.dead<=0){p.dead=1e9}}
  else if(ev==='revived'&&KBK.mine==='kbk'){p.hp=50;p.dead=0;hudHp()}
  else if(ev==='hitfx')hurtFx();
  return;
 }
}
function kbkDamageFoxHost(f,d){f.hp-=d;if(f.hp<=0&&f.dead<=0){f.dead=2;try{snd(140,.25)}catch(e){}}}

/* ---------- Motor kancaları ---------- */
const _kbkMp=mpMsg;mpMsg=function(m){if(typeof m.t==='string'&&m.t.startsWith('kbk_'))return kbkNetMsg(m);return _kbkMp(m)};
const _kbkSetup=setupMode;setupMode=function(){if(KBK.on)kbkDispose();_kbkSetup();if(mode==='kbk')kbkStart()};
const _kbkLobby=toLobby;toLobby=function(){if(KBK.on)kbkDispose();return _kbkLobby()};
const _kbkTargets=targetObjs;targetObjs=function(){const a=_kbkTargets();if(mode==='kbk'&&KBK.on){for(const f of KBK.foxes)if(f.dead<=0)a.push(f.g);if(KBK.mine==='guardian')for(const[id,q]of KBK.peers){const r=kbkRoles();if(id===r.wolf){const av=KBK.avatars.get(id);if(av&&av.root.visible)a.push(av.root)}}}return a};
const _kbkDamage=damageEnemy;damageEnemy=function(e,d,info){
 if(mode==='kbk'&&KBK.on){
  if(e&&e.kbkFox){kbkDamageFox(e,d,info);return}
  if(e&&e.kbkPeer!=null){ /* kurta vuruldu (yalnız koruma vurabilir) */
   if(KBK.mine==='guardian'){
    if(!KBK.owner)mpSend({t:'kbk_hit',target:'wolf',w:wk,head:!!(info&&info.head)});
    else{KBK.wolfHp=(KBK.wolfHp==null?100:KBK.wolfHp)-(info&&info.head?d*2:d);if(KBK.net)mpSend({t:'kbk_event',event:'wolfhp',hp:Math.max(0,KBK.wolfHp)});if(KBK.wolfHp<=0){KBK.wolfHp=100;if(KBK.net)mpSend({t:'kbk_event',event:'wolfdown'})}}
    if(info&&info.pt)dmgNum(info.pt,d,!!(info&&info.head),false);
   }
   return;
  }
  if(KBK.mine==='kbk'){if(info&&info.player)kbkMsg('KBK silahsızdır, hasar veremez.',1500);return}
 }
 return _kbkDamage(e,d,info);
};
addEventListener('keydown',e=>{
 if(mode!=='kbk'||!KBK.on||state!=='play')return;
 if(e.code==='KeyF'&&KBK.mine==='guardian'){KBK.flash=!KBK.flash;try{snd(600,.04)}catch(e2){}}
 if(e.code==='KeyH')kbkBandage();
 if(e.code==='KeyQ'&&KBK.mine==='wolf')kbkWolfStun();
 if(e.code==='KeyE'){
  if(KBK.mine==='wolf')kbkWolfKidnap();
  else if(KBK.mine!=='kbk'&&kbkKbkDown())kbkReviveTry();
 }
});
const _kbkHurt=hurt;hurt=function(d,from){
 if(mode==='kbk'&&KBK.on){
  if(p.dead>0||state!=='play'||p.inv>0)return;
  p.hp-=d;hudHp();try{snd(90,.1,.06)}catch(e){}hurtFx();
  if(p.hp<=0){p.hp=0;p.dead=1e9;firing=false;hudHp();
   /* koruma/KBK düştü: takım arkadaşı kaldırır. Hepsi düştüyse sahip maçı bitirir */
   if(KBK.owner&&KBK.net&&!KBK.ended&&!kbkPlayers().some(q=>q.alive&&q.role!=='wolf')){kbkEnd('alldead');mpSend({t:'kbk_event',event:'end',ending:'alldead'})}}
  return;
 }
 _kbkHurt(d,from);
};
const _kbkEnemies=updE;updE=function(dt){if(mode==='kbk')return;return _kbkEnemies(dt)};
const _kbkStep=stepPlayer;stepPlayer=function(dt){_kbkStep(dt);if(mode!=='kbk'||!KBK.on)return;kbkKeepInside(p);kbkPeerTick(dt);kbkTick(dt)};
const _kbkView=updPlayerView;updPlayerView=function(dt){_kbkView(dt);if(mode!=='kbk'||!KBK.on||p.dead<=0)return;
 const q=kbkPlayers().find(q=>q.alive&&q.id!==KBK.id)||kbkPlayers().find(q=>q.alive);
 if(q){cam.position.set(q.x+2.4,q.y+2.6,q.z+2.4);cam.lookAt(q.x,q.y+1.2,q.z)}};
const _kbkKDown=kDown;kDown=function(a){if(mode==='kbk'&&KBK.on){
 if(a==='sprint'){if(KBK.mine==='wolf')return KBK.wolfRespawnT<=0&&KBK.stunT<=0;if(KBK.stam<=0)return false}
 if(['fwd','back','left','right'].includes(a)&&KBK.stunT>0)return false;
 if(a==='fire'&&(KBK.stunT>0||KBK.wolfRespawnT>0))return false;
}return _kbkKDown(a)};
const _kbkHudT=hudT;hudT=function(){if(mode==='kbk'&&KBK.on){const d=Math.round(Math.hypot(KBK.housePos.x-p.x,KBK.housePos.z-p.z));$('tm').textContent=KBK.mine==='wolf'?'AV':('EV '+d+'m');return}return _kbkHudT()};
