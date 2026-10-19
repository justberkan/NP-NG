'use strict';
/* Kullanıcının sağladığı 34 KB GLB; tek yükleme ve paylaşılan geometri/texture. */
const WCMC={model:null,promise:null};
function wcLoadMinecraft(){
 if(WCMC.promise)return WCMC.promise;
 WCMC.promise=new Promise(resolve=>new THREE.GLTFLoader().load('assets/corridor/minecraft_zombie.glb',gl=>{
  const model=gl.scene;model.traverse(o=>{if(!o.isMesh)return;const src=o.material;o.material=new THREE.MeshLambertMaterial({map:src.map,color:src.color||0xffffff,transparent:src.transparent,alphaTest:.1,side:THREE.FrontSide});if(src.map){src.map.magFilter=THREE.NearestFilter;src.map.minFilter=THREE.NearestFilter;src.map.encoding=THREE.LinearEncoding}o.castShadow=o.receiveShadow=false});WCMC.model=model;resolve(model);
 },undefined,e=>{console.warn('Minecraft zombi modeli yüklenemedi',e);WCMC.promise=null;resolve(null)}));return WCMC.promise;
}
function wcMinecraftRig(){
 if(!WCMC.model)return null;const root=new THREE.Group(),model=WCMC.model.clone(true),visual=new THREE.Group();visual.add(model);root.add(visual);visual.rotation.y=Math.PI;
 const box=new THREE.Box3().setFromObject(model),scale=1.85/(box.max.y-box.min.y);model.scale.multiplyScalar(scale);model.position.y-=box.min.y*scale;
 const parts={};for(const [k,n] of Object.entries({legR:'rightLeg_12',legL:'leftLeg_14',armR:'rightArm_7',armL:'leftArm_10',head:'head_4'})){const o=model.getObjectByName(n);if(o)parts[k]={o,rotation:o.rotation.clone()}}
 const head=model.getObjectByName('head_4');if(head)head.traverse(o=>{if(o.isMesh)o.userData.head=true});return{root,model,visual,parts,wcMC:true};
}
async function wcEnsureMinecraft(){
 const el=$('wcstatus');if(el)el.textContent='Minecraft zombi modeli yükleniyor...';
 const [model]=await Promise.all([wcLoadMinecraft(),wcLoadItemModels()]);if(!model&&el)el.textContent='Minecraft modeli yüklenemedi. Sayfayı yenileyip tekrar dene.';return !!model;
}
function wcCreateMinecraftEntity(){
 const rig=wcMinecraftRig();if(!rig)throw new Error('Minecraft modeli hazır olmadan koridor başlatılamaz');
 const e={rig,g:rig.root,object3D:rig.root,kind:'z',team:2,hp:0,max:100,sp:0,cd:0,atk:0,flinch:0,vx:0,vz:0,yaw:0,ph0:Math.random()*10,name:'Minecraft Zombi',wc:true,minecraft:true,alive:false};
 e.g.visible=false;e.g.userData={tg:1,e};S.add(e.g);E.push(e);return e;
}
function wcVariant(e){e.minecraft=true} // Bu modun bütün slotları ve boss'u Minecraft modelidir.
const _wcMcAnim=animHuman;animHuman=function(h,c,dt){
 if(!h.wcMC)return _wcMcAnim(h,c,dt);
 const step=Math.sin((c.t||0)*7)*Math.min(.65,(c.speed||0)*.17),attack=c.atk||0;
 for(const [k,p] of Object.entries(h.parts)){p.o.rotation.copy(p.rotation);if(k==='legR')p.o.rotation.x+=step;if(k==='legL')p.o.rotation.x-=step;if(k==='armR'||k==='armL')p.o.rotation.x+=Math.PI*.5+Math.sin(attack*Math.PI)*.6;if(k==='head')p.o.rotation.y+=(c.lookYaw||0)*.2}
};
// Eski ragdoll'lar 9 sn fizik çalıştırıyordu. Koridorda en çok iki kısa ceset.
const WCMC_CORPSES=[];let wcRagClock=-10;
const _wcMcRagdoll=spawnRagdoll;spawnRagdoll=function(h,...args){
 /* Minecraft modelinin insan iskeleti yok: her modda (açık dünya yaban zombileri dahil) kısa devrilen ceset olur */
 if(!(h&&h.wcMC)&&(mode!=='wc'||!WCG.pool.some(e=>e.rig===h)))return _wcMcRagdoll(h,...args);
 if(h.wcMC){const root=new THREE.Group(),model=h.visual.clone(true);h.root.updateMatrixWorld(true);h.root.matrixWorld.decompose(root.position,root.quaternion,root.scale);root.add(model);S.add(root);WCMC_CORPSES.push({root,t:0,y0:root.position.y});while(WCMC_CORPSES.length>(mode==='wc'?2:6))S.remove(WCMC_CORPSES.shift().root);return null}
 if(clock-wcRagClock<.18)return null;wcRagClock=clock;while(RAGS.length+GLBDEAD.length>=2){if(RAGS.length)S.remove(RAGS.shift().root);else S.remove(GLBDEAD.shift().g)}const r=_wcMcRagdoll(h,...args);if(r)r.t=r.glb?7.6:6.6;return r;
};
function wcCorpseTick(dt){for(let i=WCMC_CORPSES.length-1;i>=0;i--){const c=WCMC_CORPSES[i];c.t+=dt;c.root.rotation.x=Math.min(Math.PI/2,c.t*3);c.root.position.y=(c.y0||0)-Math.max(0,c.t-1.5)*.5;if(c.t>2.4){S.remove(c.root);WCMC_CORPSES.splice(i,1)}}}
function wcWarmPool(dt){
 if(WCG.ended||!['spawner','round'].includes(WCG.game.state)||WCG.pool.length>=WC.maxAlive)return;WCG.warmCd=(WCG.warmCd||0)-dt;if(WCG.warmCd>0)return;WCG.warmCd=.18;const e=wcCreateMinecraftEntity();WCG.pool.push(e);
}
const WCG_GATE_FX=[];
function wcGateDust(){const g=WCG.game;if(!g?.gate)return;const z=g.gate.position.z;for(let i=0;i<6;i++){const m=new THREE.Mesh(g.gate.geometry,g.gate.material);m.scale.set(g.half*2/6*.9,.25,1);m.position.set(-g.half+(i+.5)*g.half*2/6,2+(i%2)*2,z);S.add(m);WCG_GATE_FX.push({m,t:0})}while(WCG_GATE_FX.length>12)S.remove(WCG_GATE_FX.shift().m)}
function wcGateFxTick(dt){for(let i=WCG_GATE_FX.length-1;i>=0;i--){const q=WCG_GATE_FX[i];q.t+=dt;q.m.position.y-=dt*(7+q.t*5);q.m.rotation.z+=dt*(i%2?1:-1);if(q.t>.75){S.remove(q.m);WCG_GATE_FX.splice(i,1)}}}
/* Beş mob için ucuz daire çarpışması; asker rig'i veya fizik kütüphanesi kurmaz. */
function wcSeparateMobs(){
 const g=WCG.game;if(!g)return;const list=WCG.pool.filter(e=>e.hp>0),bounds=g.getBounds(),players=wcPlayers().filter(q=>q.alive&&(q.position.y||0)<2);
 const radius=e=>.59*(e.g.scale.x||1),keep=q=>{q.x=clamp(q.x,-bounds.halfWidth,bounds.halfWidth);q.z=clamp(q.z,bounds.minZ,18)};
 for(let pass=0;pass<10;pass++){
  for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
   const a=list[i],b=list[j],p0=a.g.position,p1=b.g.position,min=radius(a)+radius(b)+.18;let dx=p1.x-p0.x,dz=p1.z-p0.z,dist=Math.hypot(dx,dz);
   if(dist>=min)continue;if(dist<1e-5){const angle=((a.wcid*17+b.wcid*31)%97)*Math.PI*2/97;dx=Math.cos(angle);dz=Math.sin(angle);dist=1}else{dx/=dist;dz/=dist}
   const shift=(min-(Math.hypot(p1.x-p0.x,p1.z-p0.z)))*.5+.0001;
   p0.x-=dx*shift;p0.z-=dz*shift;p1.x+=dx*shift;p1.z+=dz*shift;keep(p0);keep(p1);
  }
  for(const e of list){const q=e.g.position;for(const p0 of players){let dx=q.x-p0.position.x,dz=q.z-p0.position.z,d=Math.hypot(dx,dz),min=radius(e)+.48;if(d>=min)continue;if(d<1e-5){dx=e.wcid%2?1:-1;dz=.5;d=Math.hypot(dx,dz)}q.x=p0.position.x+dx/d*min;q.z=p0.position.z+dz/d*min;keep(q)}}
 }
}
/* Paylaşılan, merkezinde dönen ufak yer eşyaları; dünya konumu parent gruptadır. */
const WCITEM={cache:null};
function wcItemAssets(){
 if(WCITEM.cache)return WCITEM.cache;
 const box=(w,h,d,x,y,z,c)=>({w,h,d,x,y,z,c}),ammo=[box(.62,.36,.42,0,0,0,0x344238),box(.68,.07,.47,0,.205,0,0x657158),box(.07,.38,.45,-.23,0,0,0xd3ac42),box(.07,.38,.45,.23,0,0,0xd3ac42),box(.1,.09,.05,0,.05,.25,0xc7b67a)];
 for(const x of [-.16,0,.16]){ammo.push(box(.075,.19,.075,x,.33,0,0xdab156),box(.06,.065,.06,x,.455,0,0xf5d99a),box(.045,.12,.02,x,-.01,.225,0xf4cd70))}
 const health=[box(.62,.42,.4,0,0,0,0xe7eee7),box(.65,.055,.43,0,.14,0,0xb6d5c3),box(.10,.28,.025,0,0,.22,0x21b56d),box(.29,.10,.026,0,0,.22,0x21b56d),box(.27,.055,.08,0,.31,0,0xb6d5c3),box(.05,.12,.08,-.135,.255,0,0xb6d5c3),box(.05,.12,.08,.135,.255,0,0xb6d5c3)];
 const mat=new THREE.MeshLambertMaterial({vertexColors:true}),ringGeo=new THREE.RingGeometry(.34,.44,28);const assets={mat,ringGeo};
 for(const [type,parts,color,text] of [['ammo',ammo,0xf4c454,'MERMİ'],['health',health,0x46df96,'CAN']]){
  const geo=mergeBoxes(parts).geometry;geo.userData.own=0;
  const canvas=document.createElement('canvas');canvas.width=192;canvas.height=48;const c=canvas.getContext('2d');c.fillStyle='rgba(8,16,20,.85)';c.fillRect(0,0,192,48);c.strokeStyle='#'+color.toString(16);c.lineWidth=3;c.strokeRect(2,2,188,44);c.font='bold 27px Arial';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#'+color.toString(16);c.fillText(text,96,25);
  assets[type]={geo,ringMat:new THREE.MeshBasicMaterial({color,transparent:true,opacity:.35,depthWrite:false,side:THREE.DoubleSide}),labelMat:new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false})};
 }
 WCITEM.cache=assets;return assets;
}
function wcItemModel(type){
 const a=wcItemAssets(),kind=a[type],root=new THREE.Group(),spin=new THREE.Group(),body=new THREE.Mesh(kind.geo,a.mat);spin.add(WCITEM.models&&WCITEM.models[type]?WCITEM.models[type].clone(true):body); /* modeller henüz yüklenmediyse kutu (açık dünyada ilk can/mermi düşüşü çöküyordu, 2026-10-19) */spin.position.y=.25;root.add(spin);
 const ring=new THREE.Mesh(a.ringGeo,kind.ringMat);ring.rotation.x=-Math.PI/2;ring.position.y=.012;root.add(ring);
 const label=new THREE.Sprite(kind.labelMat);label.position.y=.96;label.scale.set(.78,.195,1);root.add(label);root.userData.spin=spin;root.name='Koridor '+type+' pickup';return root;
}
function wcRemovePickup(pick){if(pick?.m)S.remove(pick.m)} // Geometri, malzeme ve yazılar iki tür arasında tekrar kullanılır.
function wcAnimatePickup(pick,dt){pick.age+=dt;const spin=pick.m.userData.spin;spin.rotation.y=pick.phase+pick.age*.85;spin.position.y=.25+Math.sin(pick.age*2.5+pick.phase)*.015;pick.m.position.set(pick.x,pick.y,pick.z);pick.m.visible=pick.t>2||Math.sin(pick.age*12)>-.2}
function wcCanCollect(pick,hp,x,y,z){return pick.t>0&&pick.age>=.65&&Math.abs((y||0)-pick.y)<1&&Math.hypot(x-pick.x,z-pick.z)<.85&&(pick.type!=='health'||hp<100)}
function wcPickupNotice(text){let el=$('wcpickupnotice');if(!el){el=document.createElement('div');el.id='wcpickupnotice';el.style.cssText='position:absolute;bottom:145px;left:50%;transform:translateX(-50%);padding:8px 14px;border:1px solid #648777;border-radius:8px;background:#0c191ee8;color:#c8efce;font-size:14px;pointer-events:none';$('hud').appendChild(el)}el.textContent=text;el.style.display='block';WCG.pickupNoticeT=2}

// GLB kaynakları bir kez yüklenir; düşen kopyalar aynı geometri ve dokuları paylaşır.
function wcLoadItemModels(){
 if(WCITEM.promise)return WCITEM.promise;WCITEM.models={};
 WCITEM.promise=Promise.all([['ammo','ammo_boxes__toon_-_style.glb'],['health','medkit.glb']].map(([type,file])=>new Promise(resolve=>{
 new THREE.GLTFLoader().load('assets/corridor/'+file,g=>{
 const model=g.scene;if(type==='ammo'){for(const name of ['Shotgun_Ammo_Box','Secondary_Ammo_Box','SMG_Ammo_Box','Special_Ammo_Box']){const part=model.getObjectByName(name);if(part)part.parent.remove(part)}}const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),scale=.65/Math.max(size.x,size.y,size.z),center=box.getCenter(new THREE.Vector3());
 model.scale.multiplyScalar(scale);model.position.set(-center.x*scale,-box.min.y*scale-.22,-center.z*scale);model.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=false});
 const root=new THREE.Group();root.add(model);root.name=type+' GLB';WCITEM.models[type]=root;resolve(true);
 },undefined,e=>{console.warn('Yer eşyası modeli yüklenemedi',file,e);resolve(false)});
 })));return WCITEM.promise;
}
