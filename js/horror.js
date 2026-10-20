'use strict';
/* Inlı Cinlı (korku modu) — karanlık haritada canavardan kaç, çıkış kapısını bul.
   Dalga Ağacı (wc) deseni: setupMode/stepPlayer/updE/updPlayerView/toLobby kancaları + ic_* oda ağı. */
const IC={on:false,net:false,owner:true,id:0,host:0,code:'',peers:new Map(),avatars:new Map(),
 mapName:'',mapGroup:null,mapMeshes:[],level:1,earned:0,ended:false,pending:null,chosen:false,sendT:0,
 mons:[],monId:0,door:null,doorPos:null,nav:[],stamina:100,stamCd:0,flash:true,skin:0,skins:null,
 hbT:0,snapshot:null,baseBoxes:null,lights:[],spot:null,spotTgt:null,loaded:{},assetsReady:false};

const ICMAPS=['backrooms','lego','starttrack'];
const IC_DOOR_REWARD=1000;
const IC_MON={momo:{hp:420,sp:4.55,dmg:30},slender:{hp:520,sp:4.35,dmg:38}};

/* ---------- Varlık yükleme (oda ekranında, maç öncesi) ---------- */
function icLoadGLB(url){return new Promise((res,rej)=>{new THREE.GLTFLoader().load(url,g=>res(g.scene),undefined,rej)})}
async function icAssets(force){
 if(IC.assetsReady&&!force)return;
 const map=IC.mapName||ICMAPS[0];
 const[sc,mo,sl,sk]=await Promise.all([
  icLoadGLB('assets/horror/map_'+map+'.glb'),
  icLoadGLB('assets/horror/mon_momo.glb'),
  icLoadGLB('assets/horror/mon_slender.glb'),
  icLoadGLB('assets/horror/skins_holo.glb')]);
 const[col,nav,skins]=await Promise.all([
  fetch('assets/horror/map_'+map+'_col.json').then(r=>r.json()),
  fetch('assets/horror/map_'+map+'_nav.json').then(r=>r.json()),
  fetch('assets/horror/skins_holo.json').then(r=>r.json())]);
 IC.loaded={map:sc,mon:{momo:mo,slender:sl},skins:sk};
 IC.col=col;IC.nav=nav.cells;IC.skins=skins;
 IC.assetsReady=true;
}

/* ---------- Oda / seçim ekranı ---------- */
function icOpen(cb){
 if(IC.on)icDispose();
 let el=$('icselect');if(!el){el=document.createElement('div');el.id='icselect';el.className='wc-dialog';document.body.appendChild(el)}
 el.innerHTML=`<div class="wc-card"><p class="wc-kicker">N.P.N.G. / KORKU MODU</p><h1>INLI CINLI</h1>
 <p>Karanlık harita · El feneri (F) · Canavar seni kovalıyor · Çıkış kapısını bul: <b>+${IC_DOOR_REWARD} TL</b></p>
 <p class="note">Shift: koşu (stamina ile) · Kapı her seferinde rastgele bir yerde belirir; her kapıdan sonra canavar sayısı ve hızı artar. Ölen izler, herkes ölürse maç biter — kazanılan para hesabında kalır.</p>
 <p class="note">Harita: <b>${IC.mapName==='starttrack'?'Starttrack':IC.mapName==='lego'?'Lego':'Backrooms (labirent)'}</b> · Holografik cin görünümü: <b>#${IC.skin+1}</b></p>
 <div class="row"><button class="btn alt" id="icmap">HARİTA DEĞİŞTİR</button><button class="btn alt" id="icskin">GÖRÜNÜM DEĞİŞTİR</button></div>
 <div class="row"><button class="btn" id="icsolo">TEK BAŞINA</button><button class="btn alt" id="iccreate">CO-OP ODA AÇ</button></div>
 <div class="row"><input id="iccode" maxlength="8" placeholder="Arkadaşının oda kodu" aria-label="Co-op oda kodu"><button class="btn alt" id="icjoin">ODAYA KATIL</button></div>
 <p id="icstatus" class="note">Co-op: aynı sunucuda SINIRSIZ oyuncu. Oda sahibi ayrılırsa maç biter.</p>
 <button class="btn alt" id="iccancel">GERİ</button></div>`;
 el.style.display='flex';
 $('icmap').onclick=()=>{IC.mapName=ICMAPS[(ICMAPS.indexOf(IC.mapName)+1)%ICMAPS.length];IC.assetsReady=false;el.style.display='none';icOpen(cb)};
 $('icskin').onclick=()=>{IC.skin=(IC.skin+1)%20;el.style.display='none';icOpen(cb)};
 const go=async()=>{try{$('icstatus').textContent='Harita yükleniyor...';await icAssets()}catch(e){$('icstatus').textContent='Yükleme hatası: '+e.message;return}el.style.display='none';IC.chosen=true;cb()};
 $('icsolo').onclick=()=>{IC.pending=null;IC.net=false;IC.owner=true;IC.id=0;IC.code='';IC.peers.clear();go()};
 const join=create=>{const run=async()=>{if(IC.pending)return;const code=$('iccode').value.trim();if(!create&&!code){$('icstatus').textContent='Oda kodunu yaz.';return}try{$('icstatus').textContent='Harita yükleniyor...';await icAssets()}catch(e){$('icstatus').textContent='Yükleme hatası: '+e.message;return}const pend=()=>{el.style.display='none';IC.chosen=true;cb()};IC.pending=pend;$('icstatus').textContent='Sunucuya bağlanılıyor...';mpSend({t:create?'ic_create':'ic_join',code});setTimeout(()=>{if(IC.pending===pend){IC.pending=null;$('icstatus').textContent='Sunucu yanıt vermedi. Güncel server.js ile sunucuyu yeniden aç.'}},8000)};if(!MPL.authed)mpOpenDialog(run);else run()};
 $('iccreate').onclick=()=>join(true);
 $('icjoin').onclick=()=>join(false);
 $('iccancel').onclick=()=>{IC.pending=null;el.style.display='none'};
}

/* ---------- Oyuncu listesi / para ---------- */
function icPlayers(){const list=[{id:IC.id,position:{x:p.x,y:p.y,z:p.z},alive:p.dead<=0&&p.hp>0,hp:p.hp,name:'Sen'}];for(const [id,q] of IC.peers)if(id!==IC.id)list.push({id,position:{x:q.x||0,y:q.y||0,z:q.z==null?0:q.z},alive:q.hp>0,hp:q.hp,name:q.name});return list}
function icMoney(n){if(!Number.isFinite(n)||n<=0)return;SV.tl+=n;save();bal();if(IC.net&&IC.owner)mpSend({t:'ic_event',event:'reward',amount:n})}

/* ---------- Başlatma ---------- */
function icStart(){
 if(!IC.assetsReady)throw new Error('Inlı Cinlı varlıkları yüklenmedi');
 IC.on=true;IC.chosen=false;IC.ended=false;IC.level=1;IC.earned=0;IC.mons=[];IC.monId=0;IC.sendT=0;IC.stamina=100;IC.hbT=0;IC.flash=true;
 /* çevre yedekle + arena kutularını gizle */
 IC.baseBoxes=boxes.slice();IC.baseMeshes=boxMeshes.slice();
 for(const b of boxes)b.m.visible=false;boxes.length=0;boxMeshes.length=0;
 IC.env={floor:floor.position.y,fog:[S.fog.near,S.fog.far],fogColor:S.fog.color.getHex(),sky:S.background.getHex()};
 floor.position.y=-500;
 /* ışıkları kıs (gece) */
 IC.lights=[];S.traverse(o=>{if(o.isAmbientLight||o.isDirectionalLight||o.isHemisphereLight||o.isPointLight){IC.lights.push([o,o.intensity]);o.intensity*=.1}});
 S.background.setHex(0x02030a);S.fog.near=4;S.fog.far=IC.mapName==='backrooms'?26:60;S.fog.color.setHex(0x000000);
 /* harita */
 IC.mapGroup=IC.loaded.map.clone(true);S.add(IC.mapGroup);
 IC.mapMeshes=[];IC.mapGroup.traverse(o=>{if(o.isMesh)IC.mapMeshes.push(o)});
 /* çarpışma kutuları (şeffaf mesh: mermi duvarı, görünmez) */
 const tmat=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
 for(const b of IC.col.boxes){const w=b[2]-b[0],d=b[3]-b[1],h=Math.max(1,b[4]);
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),tmat);m.position.set((b[0]+b[2])/2,h/2,(b[1]+b[3])/2);S.add(m);
  const box={m,x1:b[0],x2:b[2],z1:b[1],z2:b[3],h};boxes.push(box);boxMeshes.push(m)}
 /* el feneri */
 IC.spot=new THREE.SpotLight(0xffeecc,3.4,42,.58,.5,1.1);IC.spotTgt=new THREE.Object3D();S.add(IC.spot,IC.spotTgt);IC.spot.target=IC.spotTgt;
 IC.glow=new THREE.PointLight(0xa8c4ff,.55,7,1.6);S.add(IC.glow);
 /* oyuncu */
 p.hp=100;p.dead=0;p.inv=0;p.y=0;p.vy=0;hudHp();timeLeft=999999;
 const sp=icPickCells(1+IC.peers.size,10);p.x=sp[0][0];p.z=sp[0][1];p.vx=p.vz=0;
 icPlaceDoor();
 /* canavarlar */
 if(IC.owner)for(let i=0;i<1;i++)icSpawnMon(i%2?'slender':'momo');
 if(IC.snapshot&&!IC.owner)icApplySnapshot(IC.snapshot);
 IC.snapshot=null;
 icHud();$('msg').textContent='Onu duyabilirsin... Kapıyı bul.';
}
function icPickCells(n,minGap){
 const free=IC.nav.slice();const out=[];let guard=0;
 while(out.length<n&&free.length&&guard++<400){const c=free.splice(Math.floor(Math.random()*free.length),1)[0];
  if(out.every(q=>Math.hypot(q[0]-c[0],q[1]-c[1])>=minGap))out.push(c)}
 while(out.length<n)out.push([0,0]);return out;
}
function icPlaceDoor(){
 const far=IC.nav.filter(c=>icPlayers().every(q=>Math.hypot(q.position.x-c[0],q.position.z-c[1])>14));
 const c=far.length?far[Math.floor(Math.random()*far.length)]:IC.nav[Math.floor(Math.random()*IC.nav.length)]||[0,0];
 IC.doorPos={x:c[0],z:c[1]};
 if(!IC.door){
  const g=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:0x36ff8a});
  const post=new THREE.BoxGeometry(.18,2.6,.18),top=new THREE.BoxGeometry(2.4,.18,.18);
  const l=new THREE.Mesh(post,mat);l.position.set(-1.1,1.3,0);const r=new THREE.Mesh(post,mat);r.position.set(1.1,1.3,0);
  const t=new THREE.Mesh(top,mat);t.position.set(0,2.6,0);const glow=new THREE.PointLight(0x36ff8a,1.6,9);
  glow.position.set(0,1.6,0);g.add(l,r,t,glow);S.add(g);IC.door=g;
 }
 IC.door.position.set(IC.doorPos.x,0,IC.doorPos.z);
}
function icSpawnMon(kind,at){
 const tpl=IC.loaded.mon[kind];const g=tpl.clone(true);
 g.traverse(o=>{if(o.isMesh){o.frustumCulled=true}});
 const e={id:++IC.monId,kind,g,hp:IC_MON[kind].hp,max:IC_MON[kind].hp,sp:IC_MON[kind].sp+IC.level*.12,dmg:IC_MON[kind].dmg,cd:2,atk:0,flinch:0,stuck:0,phase:0,yaw:0,lx:0,lz:0,dead:0};
 g.userData.tg=1;g.userData.e=e;
 const spots=IC.nav.filter(c=>icPlayers().every(q=>Math.hypot(q.position.x-c[0],q.position.z-c[1])>18));
 const c=at||spots[Math.floor(Math.random()*spots.length)]||[0,0];
 g.position.set(c[0],0,c[1]);S.add(g);IC.mons.push(e);return e;
}

/* ---------- Canavar AI (yalnız oda sahibi simüle eder) ---------- */
function icMonStep(e,dt){
 if(e.dead>0){e.dead-=dt;e.g.rotation.x=Math.min(1.5,e.g.rotation.x+dt*3);e.g.position.y=-(1.2-Math.max(0,e.dead))*.4;if(e.dead<=0){S.remove(e.g);IC.mons.splice(IC.mons.indexOf(e),1)}return}
 let best=null,bd=1e9;const pl=icPlayers();
 for(const q of pl){if(!q.alive)continue;const d=Math.hypot(q.position.x-e.g.position.x,q.position.z-e.g.position.z);if(d<bd){bd=d;best=q}}
 if(!best)return;
 e.cd-=dt;e.flinch=Math.max(0,e.flinch-dt*3);
 const dx=best.position.x-e.g.position.x,dz=best.position.z-e.g.position.z,d=Math.max(bd,.001);
 const ph=e.phase>0;const sp=e.sp*(ph?.55:1)*(e.flinch>0?.35:1)*(e.atk>0?.3:1);
 let nx=e.g.position.x+dx/d*sp*dt,nz=e.g.position.z+dz/d*sp*dt;
 if(!ph){if(!hitBox(nx,e.g.position.z,0))e.g.position.x=nx;if(!hitBox(e.g.position.x,nz,0))e.g.position.z=nz;
  if(Math.hypot(e.g.position.x-e.lx,e.g.position.z-e.lz)<sp*dt*.4)e.stuck+=dt;else e.stuck=0;
  if(e.stuck>2.2){e.phase=2.6;e.stuck=0;icMonFade(e,.25)}
 }else{e.phase-=dt;e.g.position.x=nx;e.g.position.z=nz;icMonFade(e,.25+Math.abs(Math.sin(clock*9))*.35);if(e.phase<=0)icMonFade(e,1)}
 e.lx=e.g.position.x;e.lz=e.g.position.z;
 e.yaw=angLerp(e.yaw,Math.atan2(dx,dz),Math.min(1,8*dt));e.g.rotation.y=e.yaw;
 e.g.position.y=Math.abs(Math.sin(clock*(ph?9:4.2)+e.id))*(ph?.14:.06);
 if(e.atk>0)e.atk-=dt;
 if(d<1.9&&e.cd<=0){e.cd=1.15;e.atk=.4;
  if(best.id===IC.id)hurt(e.dmg,e.g.position);
  else{const q=IC.peers.get(best.id);if(q&&!q.adminGod)q.hp=Math.max(0,q.hp-e.dmg);icSendHitFx(best.id,e.dmg)}}
}
function icMonFade(e,o){e.g.traverse(m=>{if(m.isMesh){m.material.transparent=true;m.material.opacity=o}})}
function icSendHitFx(id,dmg){mpSend({t:'ic_event',event:'hitfx',id,amount:dmg})}

/* ---------- Kapı / seviye ---------- */
function icDoorFound(who){
 if(IC.ended)return;
 icMoney(IC_DOOR_REWARD);IC.earned+=IC_DOOR_REWARD;
 if(IC.net&&IC.owner)mpSend({t:'ic_event',event:'dooropen',amount:IC_DOOR_REWARD});
 IC.level++;
 for(const e of IC.mons){e.sp+=.14;e.hp=Math.min(e.max,e.hp+60)}
 if(IC.level%2===0&&IC.mons.filter(e=>e.dead<=0).length<4)icSpawnMon(IC.level%4===0?'slender':'momo');
 for(const q of icPlayers()){if(q.id===IC.id&&p.hp>0){p.hp=Math.min(100,p.hp+15);hudHp()}else{const a=IC.peers.get(q.id);if(a&&a.hp>0)a.hp=Math.min(100,a.hp+15)}}
 icPlaceDoor();
 $('msg').textContent='Seviye '+IC.level+' · Kapı başka yere taşındı!';
 setTimeout(()=>{if(IC.on&&mode==='ic')$('msg').textContent=''},2500);
 try{snd(880,.12);setTimeout(()=>snd(1320,.15),140)}catch(e){}
}
function icEnd(reason){
 if(IC.ended)return;IC.ended=true;firing=false;state='end';if(document.exitPointerLock)document.exitPointerLock();
 $('ttl').textContent='INLI CINLI bitti';
 $('sub').textContent=reason==='alldead'?'Hepsi öldü...':'Maç sona erdi';
 $('res').innerHTML=`Ulaşılan seviye <b>${IC.level}</b> · Toplam kazanç <b>${fmt(IC.earned)} TL</b> hesabında kaldı.`;
 $('play').textContent='TEKRAR';$('ov').classList.remove('off');
 if(IC.net&&IC.owner)mpSend({t:'ic_event',event:'end',stats:{level:IC.level,earned:IC.earned}});
}

/* ---------- HUD ---------- */
function icHud(){
 let el=$('ichud');if(!el){el=document.createElement('div');el.id='ichud';$('hud').appendChild(el)}
 let near=1e9;for(const e of IC.mons)if(e.dead<=0){const d=Math.hypot(p.x-e.g.position.x,p.z-e.g.position.z);if(d<near)near=d}
 el.style.display='block';
 el.innerHTML=`<div class="wc-kicker">INLI CINLI${IC.net?' · ODA '+IC.code:''}</div>
 <b>Seviye ${IC.level}</b> · ${fmt(IC.earned)} TL · ${IC.mons.filter(e=>e.dead<=0).length} canavar
 <div class="wc-meter"><i style="width:${IC.stamina}%;background:#39dfff"></i></div>
 <small>${IC.flash?'Fener açık (F)':'Fener kapalı (F)'} · Shift koşu${near<14?` · <b style="color:#ff5555">CANAVAR ${near<6?'ÇOK YAKIN':'YAKIN'}!</b>`:''}</small>
 ${p.dead>0?'<p>Öldün · takım arkadaşını izliyorsun</p>':''}`;
}

/* ---------- Kalp atışı + fener titremesi ---------- */
function icFearFx(dt){
 let near=1e9,nd=null;for(const e of IC.mons)if(e.dead<=0){const d=Math.hypot(p.x-e.g.position.x,p.z-e.g.position.z);if(d<near){near=d;nd=e}}
 if(p.dead>0){if(IC.spot)IC.spot.intensity=0;return}
 IC.spot.intensity=IC.flash?3.4:0;
 if(IC.flash){IC.spot.position.copy(cam.position);cam.getWorldDirection(_dir);IC.spotTgt.position.copy(cam.position).addScaledVector(_dir,6);IC.spotTgt.position.y-=1.1}
 if(IC.glow)IC.glow.position.copy(cam.position);
 if(near<14){IC.hbT-=dt;const period=.35+near/14*.8;if(IC.hbT<=0){IC.hbT=period;try{snd(52,.09)}catch(e){}
   const v=$('vig');v.style.opacity=String(Math.max(.0,.5-near*.03));setTimeout(()=>{if(mode==='ic')v.style.opacity='0'},110)}
  if(near<7&&IC.flash&&Math.random()<dt*6)IC.spot.intensity=Math.random()<.5?0:4.6;}
}

/* ---------- Ana döngü kancası ---------- */
function icTick(dt){
 if(!IC.on)return;
 icFearFx(dt);
 /* stamina */
 const moving=Math.hypot(p.vx,p.vz)>1&&p.g,sprinting=kDown('sprint')&&moving;
 if(sprinting&&IC.stamina>0){IC.stamina=Math.max(0,IC.stamina-20*dt);IC.stamCd=.9}
 else{IC.stamCd-=dt;if(IC.stamCd<=0)IC.stamina=Math.min(100,IC.stamina+13*dt)}
 /* canavar simülasyonu + kapı (sahip) */
 if(IC.owner&&!IC.ended){
  IC.doorCd=Math.max(0,(IC.doorCd||0)-dt);
  for(const e of IC.mons.slice())icMonStep(e,dt);
  if(IC.doorCd<=0)for(const q of icPlayers()){
   if(!q.alive)continue;
   if(Math.hypot(q.position.x-IC.doorPos.x,q.position.z-IC.doorPos.z)<1.4){IC.doorCd=2.5;icDoorFound(q.id);break}
  }
  if(!icPlayers().some(q=>q.alive))icEnd('alldead');
 }
 /* ölüm yönetimi */
 if(p.hp<=0&&p.dead<=0){p.dead=1e9;firing=false;hudHp()}
 /* ağ senkronu */
 if(IC.net&&!IC.ended){IC.sendT-=dt;if(IC.sendT<=0){IC.sendT=.1;
  mpSend({t:'ic_state',d:{x:p.x,y:p.y,z:p.z,yaw:p.yaw,hp:p.hp,flash:IC.flash,skin:IC.skin}});
  if(IC.owner)mpSend({t:'ic_snapshot',d:icSnapshot()})}}
 /* akran avatarları (holografik cinler) */
 for(const [id,q] of IC.peers){
  if(id===IC.id)continue;
  let av=IC.avatars.get(id);
  if(!av){av=icMakeAvatar(q.skin||0);IC.avatars.set(id,av);S.add(av.root)}
  av.root.visible=q.hp>0;
  const qy=q.y||0;
  av.root.position.set(q.x||0,qy+Math.abs(Math.sin(clock*7+id))*.05,q.z==null?0:q.z);
  av.root.rotation.y=(q.yaw||0)+Math.PI;
 }
 icHud();
}
function icSnapshot(){
 return{level:IC.level,door:{x:IC.doorPos.x,z:IC.doorPos.z},
  mons:IC.mons.filter(e=>e.dead<=0).map(e=>({id:e.id,k:e.kind,x:e.g.position.x,y:e.g.position.y,z:e.g.position.z,hp:e.hp,max:e.max,sp:e.sp})),
  players:icPlayers().map(q=>({id:q.id,x:q.position.x,y:q.position.y,z:q.position.z,hp:q.hp}))};
}
function icApplySnapshot(d){
 IC.snapshot=d;IC.level=d.level;
 if(IC.door){IC.doorPos={x:d.door.x,z:d.door.z};IC.door.position.set(d.door.x,0,d.door.z)}
 const seen=new Set(d.mons.map(m=>m.id));
 for(const e of IC.mons.slice())if(!seen.has(e.id)&&e.dead<=0){S.remove(e.g);IC.mons.splice(IC.mons.indexOf(e),1)}
 for(const m of d.mons){
  let e=IC.mons.find(e=>e.id===m.id);
  if(!e){e=icSpawnMon(m.k,[m.x,m.z]);e.id=m.id}
  e.hp=m.hp;e.tx=m.x;e.ty=m.y;e.tz=m.z;
 }
 for(const q of d.players){
  if(q.id===IC.id){const was=p.hp;p.hp=q.hp;if(p.hp<=0&&was>0){p.dead=1e9;firing=false}hudHp()}
  else{const old=IC.peers.get(q.id)||{};IC.peers.set(q.id,{...old,...q})}
 }
}
/* akran canavarları: sahibin gönderdiği konuma yumuşakça git */
function icPeerMonTick(dt){
 if(IC.owner)return;
 for(const e of IC.mons){if(e.tx==null)continue;
  e.g.position.x+=(e.tx-e.g.position.x)*Math.min(1,dt*8);
  e.g.position.y+=(e.ty-e.g.position.y)*Math.min(1,dt*8);
  e.g.position.z+=(e.tz-e.g.position.z)*Math.min(1,dt*8);
  e.g.rotation.y=angLerp(e.g.rotation.y,Math.atan2(p.x-e.g.position.x,p.z-e.g.position.z),Math.min(1,4*dt));
  e.g.position.y+=Math.abs(Math.sin(clock*9+e.id))*.1;}
}

/* ---------- Holografik cin avatarı ---------- */
function icMakeAvatar(skinIdx){
 const info=(IC.skins||[])[skinIdx%((IC.skins||[]).length||1)]||{name:null,s:1,cx:0,cz:0};
 let mesh=null;
 if(info.name&&IC.loaded.skins){IC.loaded.skins.traverse(o=>{if(!mesh&&o.isMesh&&o.name===info.name)mesh=o})}
 const root=new THREE.Group();
 if(mesh){
  const geo=mesh.geometry.clone();geo.computeBoundingBox();
  const bb=geo.boundingBox;geo.translate(-(bb.min.x+bb.max.x)/2,-bb.min.y,-(bb.min.z+bb.max.z)/2);
  const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x66f6ff,transparent:true,opacity:.75,wireframe:false}));
  m.scale.setScalar(info.s);root.add(m);
  const wire=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xbffbff,wireframe:true,transparent:true,opacity:.25}));
  wire.scale.setScalar(info.s*1.002);root.add(wire);
 }else{const geo=new THREE.SphereGeometry(.34,8,8);const bm=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x66f6ff}));bm.position.y=1.5;root.add(bm);const bm2=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x66f6ff}));bm2.position.y=.6;root.add(bm2)}
 return{root};
}

/* ---------- Ağ ---------- */
function icNetMsg(m){
 if(m.t==='ic_welcome'){if(!IC.pending){mpSend({t:'ic_leave'});return}
  Object.assign(IC,{net:true,owner:m.id===m.host,id:m.id,host:m.host,code:m.code,snapshot:m.snapshot||null});
  IC.peers=new Map(m.players.map(q=>[q.id,{...q,hp:100,x:0,y:0,z:0,skin:0}]));
  const cb=IC.pending;IC.pending=null;if(cb)cb();else mpSend({t:'ic_leave'});return}
 if(m.t==='ic_error'){IC.pending=null;const el=$('icstatus');if(el)el.textContent=m.message;return}
 if(m.t==='ic_peers'){const ids=new Set(m.players.map(q=>q.id));for(const id of IC.peers.keys())if(!ids.has(id)){IC.peers.delete(id);const av=IC.avatars.get(id);if(av)S.remove(av.root);IC.avatars.delete(id)}for(const q of m.players)IC.peers.set(q.id,{hp:100,x:0,y:0,z:0,skin:0,...IC.peers.get(q.id),...q});return}
 if(!IC.on||mode!=='ic')return;
 if(m.t==='ic_closed'){icEnd('closed');$('sub').textContent=m.reason;return}
 if(m.t==='ic_snapshot'&&!IC.owner){icApplySnapshot(m.d);return}
 if(m.t==='ic_state'&&IC.owner&&m.id!==IC.id){const q=IC.peers.get(m.id);if(q)Object.assign(q,m.d,{x:clamp(m.d.x,-380,380),z:clamp(m.d.z,-380,380)});return}
 if(m.t==='ic_hit'&&IC.owner&&!IC.ended){const mon=IC.mons.find(e=>e.id===m.target&&e.dead<=0);if(mon)icDamageMon(mon,m.damage,{by:'Takım'});return}
 if(m.t==='ic_event'&&!IC.owner){
  if(m.event==='reward')icMoney(m.amount);
  else if(m.event==='dooropen'){IC.level++;icMoney(m.amount);$('msg').textContent='Seviye '+IC.level+' · Kapı başka yere taşındı!';setTimeout(()=>{if(IC.on&&mode==='ic')$('msg').textContent=''},2500);try{snd(880,.12)}catch(e){}}
  else if(m.event==='end')icEnd('closed');
  else if(m.event==='hitfx'&&m.id===IC.id){hurtFx()}
  return}
}
function icDamageMon(e,dmg,info){
 if(!IC.owner){mpSend({t:'ic_hit',target:e.id,w:wk});return}
 e.hp-=dmg;e.flinch=1;
 if(e.hp<=0&&e.dead<=0){e.dead=2.2;icMonFade(e,1);try{snd(140,.3)}catch(e){}}
}
function icDispose(){
 if(!IC.on)return;
 IC.on=false;IC.pending=null;
 if(IC.net)mpSend({t:'ic_leave'});IC.net=false;
 if(IC.spot){S.remove(IC.spot);S.remove(IC.spotTgt);IC.spot=null}
 if(IC.glow){S.remove(IC.glow);IC.glow=null}
 if(IC.door){S.remove(IC.door);IC.door=null}
 for(const e of IC.mons)S.remove(e.g);IC.mons=[];
 for(const av of IC.avatars.values())S.remove(av.root);IC.avatars.clear();IC.peers.clear();
 if(IC.mapGroup){S.remove(IC.mapGroup);IC.mapGroup=null}
 if(IC.baseBoxes){boxes.length=0;boxMeshes.length=0;for(const b of IC.baseBoxes){boxes.push(b);boxMeshes.push(b.m);b.m.visible=true}IC.baseBoxes=null}
 if(IC.env){floor.position.y=IC.env.floor;S.fog.near=IC.env.fog[0];S.fog.far=IC.env.fog[1];S.fog.color.setHex(IC.env.fogColor);S.background.setHex(IC.env.sky);IC.env=null}
 for(const [o,i] of IC.lights)o.intensity=i;IC.lights=[];
 const h=$('ichud');if(h)h.style.display='none';
 const v=$('vig');if(v)v.style.opacity='0';
 IC.assetsReady=false;IC.ended=false;
}

/* ---------- Motor kancaları ---------- */
const _icMpMsg=mpMsg;mpMsg=function(m){if(typeof m.t==='string'&&m.t.startsWith('ic_'))return icNetMsg(m);return _icMpMsg(m)};
const _icSetup=setupMode;setupMode=function(){if(IC.on)icDispose();_icSetup();if(mode==='ic')icStart()};
const _icLobby=toLobby;toLobby=function(){if(IC.on)icDispose();return _icLobby()};
const _icTargets=targetObjs;targetObjs=function(){const a=_icTargets();if(mode==='ic'&&IC.on)for(const e of IC.mons)if(e.dead<=0)a.push(e.g);return a};
const _icDamage=damageEnemy;damageEnemy=function(e,d,info){if(mode==='ic'&&IC.on&&e&&e.kind&&IC.mons.includes(e))return icDamageMon(e,d,info);return _icDamage(e,d,info)};
const _icHurt=hurt;hurt=function(d,from){if(mode==='ic'&&IC.on&&!IC.owner)return;_icHurt(d,from);if(mode==='ic'&&IC.on&&p.hp<=0){p.hp=0;p.dead=1e9;firing=false;hudHp()}};
const _icEnemies=updE;updE=function(dt){if(mode==='ic')return;return _icEnemies(dt)};
const _icPeer=stepPlayer;stepPlayer=function(dt){_icPeer(dt);if(mode!=='ic'||!IC.on)return;icPeerMonTick(dt);icTick(dt)};
const _icView=updPlayerView;updPlayerView=function(dt){_icView(dt);if(mode!=='ic'||!IC.on||p.dead<=0)return;
 const q=icPlayers().find(q=>q.alive&&q.id!==IC.id)||icPlayers().find(q=>q.alive);
 if(q){cam.position.set(q.position.x+2.4,q.position.y+2.6,q.position.z+2.4);cam.lookAt(q.position.x,q.position.y+1.2,q.position.z)}};
const _icKDown=kDown;kDown=function(a){if(mode==='ic'&&IC.on&&a==='sprint'&&IC.stamina<=0)return false;return _icKDown(a)};
const _icHudT=hudT;hudT=function(){if(mode==='ic'&&IC.on){$('tm').textContent='Seviye '+IC.level;return}return _icHudT()};
addEventListener('keydown',e=>{if(e.code==='KeyF'&&mode==='ic'&&IC.on&&p.dead<=0){IC.flash=!IC.flash;try{snd(600,.04)}catch(e){}}});
