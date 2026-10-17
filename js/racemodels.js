'use strict';
/* ===== Yarış araç modelleri (prosedürel, üçgenlik maliyeti düşük) =====
   Her yapıcı {g,wh,stW,prop,wing,glw} döndürür:
   g: grup (yer merkezli, +Z ileri), wh: tekerlek/pervane dizisi, stW: direksiyona dönen ön tekerlekler,
   prop: pervane (uçak), wing: aktif spoiler, glw: yerden aydınlık. Yer tutuş animasyonu race.js içinde. */
const RACESTY={ // malzeme kalitesi: gövde parıltısı + cam + detay
 body:c=>new THREE.MeshLambertMaterial({color:c}),
 dark:()=>new THREE.MeshLambertMaterial({color:0x14181d}),
 glass:()=>new THREE.MeshLambertMaterial({color:0x9fd8ff,transparent:true,opacity:.55}),
 glow:c=>new THREE.MeshBasicMaterial({color:c}),
 lite:c=>new THREE.MeshBasicMaterial({color:c})
};
function rBox(w,h,d,mat,x,y,z,parent){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
 m.position.set(x||0,y||0,z||0);(parent||this).add(m);return m;
}
function rCyl(r0,r1,h,mat,x,y,z,rx,parent,seg){
 const m=new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,h,seg||10),mat);
 m.position.set(x||0,y||0,z||0);if(rx)m.rotation.x=rx;(parent||this).add(m);return m;
}

/* ---------- OTOMOBİLLER ---------- */
function rmWheels(g,wh,stW,xr,yr,zf,zr,r,wide){
 const mk=(x,z,steer)=>{
  const w=new THREE.Group();w.position.set(x,yr,z);
  const t=new THREE.Mesh(new THREE.CylinderGeometry(r,r,wide,14),RACESTY.dark());
  t.rotation.z=Math.PI/2;w.add(t);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(r*.55,r*.55,wide+.02,8),RACESTY.body(0x8a939c));
  hub.rotation.z=Math.PI/2;w.add(hub);
  g.add(w);wh.push(w);if(steer)stW.push(w);return w;
 };
 mk(-xr,zf,true);mk(xr,zf,true);mk(-xr,zr,false);mk(xr,zr,false);
}
function rmCarBase(o){ // ortak kasa: alt gövde + burun + kabin + tampon + farlar + egzoz + yer aydınlığı
 const g=new THREE.Group(),B=RACESTY.body(o.col),D=RACESTY.dark(),G=RACESTY.glass();
 rBox(o.w,o.h,o.len,B,0,o.y0+o.h/2,0,g);                    // ana gövde
 rBox(o.w*.92,o.h*.55,o.len*.3,B,0,o.y0+o.h*.78,o.len*.32,g); // burun eğimi taklidi
 if(o.cabin!==false)rBox(o.w*.78,o.h*.62,o.len*.34,G,0,o.y0+o.h+o.h*.3,-o.len*.08,g); // cam tavan
 rBox(o.w+.08,o.h*.28,.28,D,0,o.y0+o.h*.28,o.len/2+.06,g);  // ön tampon
 rBox(o.w+.08,o.h*.28,.28,D,0,o.y0+o.h*.28,-o.len/2-.06,g); // arka tampon
 const hl=RACESTY.lite(0xfff6c8);
 rBox(.3,.12,.06,hl,-o.w*.32,o.y0+o.h*.62,o.len/2+.02,g);rBox(.3,.12,.06,hl,o.w*.32,o.y0+o.h*.62,o.len/2+.02,g);
 const tl=RACESTY.lite(0xff3b30);
 rBox(.34,.12,.06,tl,-o.w*.32,o.y0+o.h*.6,-o.len/2-.02,g);rBox(.34,.12,.06,tl,o.w*.32,o.y0+o.h*.6,-o.len/2-.02,g);
 rCyl(.06,.06,.3,D,-o.w*.28,o.y0+.16,-o.len/2-.14,Math.PI/2,g);rCyl(.06,.06,.3,D,o.w*.28,o.y0+.16,-o.len/2-.14,Math.PI/2,g);
 const glw=new THREE.Mesh(new THREE.PlaneGeometry(o.w*1.5,o.len*1.15),new THREE.MeshBasicMaterial({color:o.glow||0x27e0ff,transparent:true,opacity:.16,blending:THREE.AdditiveBlending,depthWrite:false}));
 glw.rotation.x=-Math.PI/2;glw.position.y=.03;g.add(glw);
 return{g,glw};
}
function rmBuildCar(id){
 const wh=[],stW=[];
 if(id==='falcon'){ // Beko Falcon GT — spor coupe
  const b=rmCarBase({col:0xe8b621,w:1.9,h:.52,len:4.3,y0:.24,glow:0x27e0ff});
  const wing=rBox(1.7,.07,.34,RACESTY.body(0xe8b621),0,.86,-2.0,b.g);
  rBox(.08,.2,.3,RACESTY.dark(),-.6,.72,-2.02,b.g);rBox(.08,.2,.3,RACESTY.dark(),.6,.72,-2.02,b.g);
  rmWheels(b.g,wh,stW,.82,.32,1.38,-1.38,.32,.24);
  return{g:b.g,wh,stW,glw:b.glw,wing};
 }
 if(id==='viper'){ // Yılan S — drift
  const b=rmCarBase({col:0x9b1c31,w:2.0,h:.56,len:4.4,y0:.26,glow:0xff4fd8});
  const wing=rBox(1.9,.06,.42,RACESTY.body(0x22262b),0,.95,-2.05,b.g);
  rBox(.07,.3,.36,RACESTY.dark(),-.72,.78,-2.05,b.g);rBox(.07,.3,.36,RACESTY.dark(),.72,.78,-2.05,b.g);
  rBox(2.04,.1,2.6,RACESTY.body(0x22262b),0,.5,.1,b.g); // geniş gövde şeridi
  rmWheels(b.g,wh,stW,.88,.34,1.4,-1.42,.34,.26);
  return{g:b.g,wh,stW,glw:b.glw,wing};
 }
 if(id==='apex'){ // Apex F1 — açık tekerlekli yarış
  const g=new THREE.Group(),B=RACESTY.body(0xd7263d),D=RACESTY.dark();
  rCyl(.16,.34,2.1,B,0,.42,.5,Math.PI/2,g,8);                 // burun konisi
  rBox(.78,.42,1.5,B,0,.5,-.35,g);                            // göbek + motor kapak
  rBox(.5,.34,.7,RACESTY.glass(),0,.72,.05,g);                // gösterge paneli üstü
  rBox(1.5,.07,.5,B,0,.24,1.45,g);                            // ön kanat
  rBox(.06,.2,.5,B,-.72,.34,1.45,g);rBox(.06,.2,.5,B,.72,.34,1.45,g);
  const wing=rBox(1.1,.06,.42,B,0,1.02,-1.25,g);
  rBox(.06,.3,.42,B,-.5,.86,-1.25,g);rBox(.06,.3,.42,B,.5,.86,-1.25,g);
  const hl=RACESTY.lite(0xfff6c8);rBox(.1,.08,.04,hl,-.12,.5,1.52,g);rBox(.1,.08,.04,hl,.12,.5,1.52,g);
  const tl=RACESTY.lite(0xff3b30);rBox(.5,.06,.04,tl,0,.56,-1.6,g);
  rmWheels(g,wh,stW,.78,.34,1.02,-.88,.34,.3);
  const glw=new THREE.Mesh(new THREE.PlaneGeometry(2.2,4.4),new THREE.MeshBasicMaterial({color:0xd7263d,transparent:true,opacity:.14,blending:THREE.AdditiveBlending,depthWrite:false}));
  glw.rotation.x=-Math.PI/2;glw.position.y=.03;g.add(glw);
  return{g,wh,stW,glw,wing};
 }
 // mammoth — 4x4 pickup
 const b=rmCarBase({col:0x2e6e4e,w:2.05,h:.72,len:4.7,y0:.34,glow:0x8dff57,cabin:false});
 rBox(1.9,.62,1.5,RACESTY.glass(),0,1.06,.65,b.g);            // kabin
 rBox(2.0,.3,1.7,RACESTY.body(0x2e6e4e),0,.78,-1.15,b.g);     // kasa
 rBox(1.7,.26,.1,RACESTY.dark(),0,1.0,-1.9,b.g);              // rollbar
 const wing=rBox(1.9,.08,.3,RACESTY.dark(),0,1.28,-1.95,b.g);
 rmWheels(b.g,wh,stW,.92,.44,1.5,-1.5,.44,.32);
 return{g:b.g,wh,stW,glw:b.glw,wing};
}

/* ---------- UÇAKLAR ---------- */
function rmBuildPlane(id){
 const wh=[],stW=[];
 if(id==='swift'){ // Swift Kanat — pist yarış uçağı
  const g=new THREE.Group(),B=RACESTY.body(0x27e0ff),D=RACESTY.dark();
  rCyl(.14,.22,4.6,B,0,0,0,Math.PI/2,g,10);                    // gövde
  const prop=new THREE.Group();prop.position.set(0,0,2.32);g.add(prop);
  rBox(.1,1.5,.05,RACESTY.dark(),0,0,0,prop);rBox(1.5,.1,.05,RACESTY.dark(),0,0,0,prop);
  const sp=rCyl(.09,.02,.22,B,0,0,2.42,Math.PI/2,g,8);
  rBox(6.4,.08,.9,B,0,.02,.3,g);                               // kanatlar
  rBox(1.6,.06,.5,B,0,.3,-2.2,g);                              // yatay kuyruk
  rBox(.06,.6,.55,B,0,.32,-2.2,g);                             // dümen
  rBox(.5,.22,.9,RACESTY.glass(),0,.2,.9,g);                   // kanopi
  const hl=RACESTY.lite(0xfff6c8);rBox(.12,.08,.04,hl,-.14,0,2.2,g);rBox(.12,.08,.04,hl,.14,0,2.2,g);
  const glw=new THREE.Mesh(new THREE.PlaneGeometry(3,5),new THREE.MeshBasicMaterial({color:0x27e0ff,transparent:true,opacity:.1,blending:THREE.AdditiveBlending,depthWrite:false}));
  glw.rotation.x=-Math.PI/2;glw.position.y=-.2;g.add(glw);
  const wing=null;
  return{g,wh,stW,prop,glw,wing};
 }
 // raptor — savaş uçağı
 const g=new THREE.Group(),B=RACESTY.body(0x4a5560),D=RACESTY.dark();
 rCyl(.2,.34,5.6,B,0,0,.2,Math.PI/2,g,8);
 rCyl(.1,.2,.5,D,0,0,3.05,Math.PI/2,g,8);                       // jet ağzı
 const prop=new THREE.Group();prop.position.set(0,0,-2.75);g.add(prop); // egzoz alemi (dönen değil, ölçeklenir)
 const flame=new THREE.Mesh(new THREE.ConeGeometry(.16,.9,8),new THREE.MeshBasicMaterial({color:0x66baff,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));
 flame.rotation.x=Math.PI/2;prop.add(flame);
 rBox(5.2,.1,1.5,B,-1.4,0,-.3,g).rotation.z=.12;               // kanatlar (süpürmeli taklidi)
 rBox(5.2,.1,1.5,B,1.4,0,-.3,g).rotation.z=-.12;
 rBox(.5,.16,.9,D,-2.6,-.05,-.35,g);rBox(.5,.16,.9,D,2.6,-.05,-.35,g); // kanat ucu füze kanalı
 rCyl(.05,.05,.8,D,-2.6,-.14,-.4,Math.PI/2,g,6);rCyl(.05,.05,.8,D,2.6,-.14,-.4,Math.PI/2,g,6); // füzeler
 rBox(.08,.7,.8,B,-.85,.4,-2.35,g).rotation.x=.25;rBox(.08,.7,.8,B,.85,.4,-2.35,g).rotation.x=.25; // çift kuyruk
 rBox(1.1,.06,.7,B,0,.28,-2.4,g);
 rBox(.46,.26,1.1,RACESTY.glass(),0,.3,1.35,g);                 // kanopi
 const glw=new THREE.Mesh(new THREE.PlaneGeometry(3,5),new THREE.MeshBasicMaterial({color:0x66baff,transparent:true,opacity:.1,blending:THREE.AdditiveBlending,depthWrite:false}));
 glw.rotation.x=-Math.PI/2;glw.position.y=-.3;g.add(glw);
 const wing=null;
 return{g,wh,stW,prop,glw,wing};
}

/* ---------- Araç kataloğu ----------
   glb: assets/race/ altındaki hazır model dosyası. Yüklenemezse prosedürel modele düşer. */
const RACEGLB={
 falcon:{f:'sport39.glb',len:4.4},
 viper:{f:'muscle10.glb',len:4.5},
 apex:{f:'lamb.glb',len:4.3},
 mammoth:{f:'monster15.glb',len:4.9},
 rally:{f:'rally.glb',len:4.4},
 polis:{f:'police.glb',len:4.5},
 armor:{f:'armor.glb',len:4.6},
 swift:{f:'airplane1.glb',len:7.2},
 raptor:{f:'mirage.glb',len:8.2,yaw:Math.PI/2}, // Sketchfab modeli -X'e bakar: +Z'ye çevir
 mig21:{f:'mig21.glb',len:8.2,yaw:Math.PI/2,only:/master_1_/} // 3 varyantli sahneden tek govde tut; -X burun
};
const RACECARS={
 falcon:{n:'Sport GT-39',k:'Spor araba',type:'car',col:0xe8b621,spd:78,hp:70,grip:75,diff:30,desc:'Dengeli güç. Yeni başlayanlar için ideal spor coupe.'},
 viper:{n:'Kaslı V10',k:'Drift / muscle',type:'car',col:0x9b1c31,spd:72,hp:65,grip:45,diff:60,desc:'Kaslı gövde, gevşek arka aks. Virajda el freniyle yana yatır.'},
 apex:{n:'Boğa V12',k:'Süper spor',type:'car',col:0xd7263d,spd:95,hp:45,grip:88,diff:80,desc:'Çıplak hız. Pist kralı ama darbe dayanımı zayıf.'},
 mammoth:{n:'Canavar 4x4',k:'Canavar kamyonet',type:'car',col:0x2e6e4e,spd:58,hp:105,grip:50,diff:30,desc:'Tank gibi. Çarpmadan çekinmez, yavaş gider.'},
 rally:{n:'Rampage Rally',k:'Rally',type:'car',col:0xe07b1f,spd:74,hp:60,grip:70,diff:55,desc:'Tozlu yol köpeği. İncecik gövde, sert süspansiyon.'},
 polis:{n:'Kobra İnterseptör',k:'Polis aracı',type:'car',col:0x2456c9,spd:82,hp:66,grip:72,diff:40,desc:'Asayiş şahini. Takip etmek için üretilmiş, yakalamak kolay değil.'},
 armor:{n:'Armadillo',k:'Zırhlı araç',type:'car',col:0x4a5560,spd:50,hp:125,grip:40,diff:20,desc:'Hareketli sur. Mermi gibi sağlam, kaplumbağa gibi yavaş.'},
 swift:{n:'Gökyüzü-1',k:'Yarış uçağı',type:'plane',col:0x27e0ff,spd:80,hp:55,grip:70,diff:45,desc:'Klasik pervaneli uçak. Halkaların arasından süzül.'},
 raptor:{n:'Mirage 2000',k:'Savaş uçağı',type:'plane',col:0x8a93a5,spd:92,hp:85,grip:62,diff:70,desc:'Delta kanatlı Fransız jeti. Hızlı ve sağlam.'},
 mig21:{n:'MIG-21 Fishbed',k:'Savaş uçağı',type:'plane',col:0x4a5548,spd:90,hp:78,grip:58,diff:68,desc:'Soğuk Savaş efsanesi. Nokta burun, sıkı viraj, hassas gaz.'}
};
/* ---------- GLB yükleme (assets/race) ----------
   Her şablon: {root, wheelNames, fanName} — klonlama sırasında yeniden sarılır. */
const RACEGLB_TPL={};
const RACE_SHARED_GEOMETRY=new WeakSet(),RACE_SHARED_MATERIAL=new WeakSet();
function raceDisposeGroup(root){
 if(!root)return;
 if(root.parent)root.parent.remove(root);
 const geometry=new Set(),materials=new Set();
 root.traverse(o=>{if(o.geometry&&!RACE_SHARED_GEOMETRY.has(o.geometry))geometry.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])if(!RACE_SHARED_MATERIAL.has(m))materials.add(m)});
 const textures=new Set();for(const m of materials)if(m.map&&m.map.userData&&m.map.userData.raceOwned)textures.add(m.map);
 for(const g of geometry)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();
}
function racePrepGlb(scene,id){
 const root=new THREE.Group();root.add(scene);
 if(RACEGLB[id].only){const re=RACEGLB[id].only,kill=[];scene.traverse(o=>{if(/master/i.test(o.name||'')&&!re.test(o.name))kill.push(o)});kill.forEach(o=>{if(o.parent)o.parent.remove(o)})} // çoklu varyantlı GLB'de tek gövde tut
 if(RACEGLB[id].noMat){const re=RACEGLB[id].noMat,kill=[];scene.traverse(o=>{if(o.isMesh){const ms=Array.isArray(o.material)?o.material:[o.material];if(ms.some(m=>m&&re.test(m.name||'')))kill.push(o)}});kill.forEach(o=>{if(o.parent)o.parent.remove(o)})} // kıvılcım/alev gibi sahne efektlerini at
 if(RACEGLB[id].yaw)scene.rotation.y=RACEGLB[id].yaw; // model +X/-X'e bakıyorsa +Z'ye çevir
 const bb=new THREE.Box3().setFromObject(root);
 const c=new THREE.Vector3();bb.getCenter(c);
 const sz=new THREE.Vector3();bb.getSize(sz);
 const L=Math.max(sz.x,sz.z)||1;
 const scale=RACEGLB[id].len/L;
 root.scale.setScalar(scale);
 root.position.set(-c.x*scale,-bb.min.y*scale,-c.z*scale);
 root.updateMatrixWorld(true);
 root.traverse(o=>{
  if(o.isMesh){o.castShadow=true;if(o.material&&o.material.map&&THREE.SRGBColorSpace)o.material.map.colorSpace=THREE.SRGBColorSpace;
   if(o.geometry)RACE_SHARED_GEOMETRY.add(o.geometry);
   const ms=Array.isArray(o.material)?o.material:[o.material];
   for(const mt of ms){if(mt)RACE_SHARED_MATERIAL.add(mt);if(mt&&'emissive'in mt&&mt.color){mt.emissive=mt.emissive||new THREE.Color();mt.emissive.copy(mt.color).multiplyScalar(.45)}} // karanlık sahnede silikleşmesin
  }
 });
 const wheelNames=[],fanName={n:null};
 root.traverse(o=>{
  if(!o.name)return;
  if(/tire|wheel/i.test(o.name))wheelNames.push(o.name);
  else if(/fan|prop/i.test(o.name))fanName.n=o.name;
 });
 return{root,wheelNames,fan:fanName.n};
}
function raceLoadModels(cb){ // tüm GLB'ler önyüklenir; hata/timeout'ta prosedüre düşülür
 const ids=Object.keys(RACEGLB);let done=0,fin=false;
 const end=()=>{if(!fin){fin=true;window.RACELOADING=false;cb&&cb()}};
 const to=setTimeout(end,9000);
 ids.forEach(id=>{
  try{new THREE.GLTFLoader().load('assets/race/'+RACEGLB[id].f,g=>{
    try{RACEGLB_TPL[id]=racePrepGlb(g.scene,id)}catch(e){}
    if(++done===ids.length){clearTimeout(to);end()}
   },undefined,()=>{if(++done===ids.length){clearTimeout(to);end()}})}
  catch(e){if(++done===ids.length){clearTimeout(to);end()}}
 });
}
function raceGlbClone(tpl,id){ // şablondan yarış aracı örneği üret
 const g=new THREE.Group(),root=tpl.root.clone(true);g.add(root);
 const wh=[],stW=[],wheelPivots=[];let prop=null;
 const wheels=[],fan=[];
 root.traverse(o=>{ // önce topla; traverse sırasında remove() yapmak diziyi bozar
  if(!o.name)return;
  if(tpl.wheelNames.includes(o.name))wheels.push(o);
  else if(tpl.fan&&o.name===tpl.fan)fan.push(o);
 });
 const selected=new Set(wheels);
 const topWheels=wheels.filter(o=>{for(let p=o.parent;p&&p!==root;p=p.parent)if(selected.has(p))return false;return true});
 g.updateMatrixWorld(true);
 for(const o of topWheels){
  const bb=new THREE.Box3().setFromObject(o),wp=bb.getCenter(new THREE.Vector3()),size=bb.getSize(new THREE.Vector3());
  const steer=new THREE.Group(),spin=new THREE.Group();g.add(steer);steer.position.copy(g.worldToLocal(wp));steer.add(spin);
  g.updateMatrixWorld(true);spin.attach(o); // preserve complete world transform, including scale and authored rotation
  spin.userData.radius=Math.max(.08,size.y*.5);wh.push(spin);wheelPivots.push(steer);
 }
 if(RACECARS[id].type==='car'&&wheelPivots.length){const zs=wheelPivots.map(w=>w.position.z),middle=(Math.max(...zs)+Math.min(...zs))/2;for(const w of wheelPivots)if(w.position.z>middle)stW.push(w)}
 const fans=new Set(fan);
 const topFans=fan.filter(o=>{for(let p=o.parent;p&&p!==root;p=p.parent)if(fans.has(p))return false;return true});
 for(const o of topFans){
  prop=new THREE.Group();
  const wp=new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
  g.add(prop);prop.position.copy(g.worldToLocal(wp));g.updateMatrixWorld(true);prop.attach(o);
 }
 const glw=new THREE.Mesh(new THREE.PlaneGeometry(RACEGLB[id].len*.55,RACEGLB[id].len),new THREE.MeshBasicMaterial({color:0x27e0ff,transparent:true,opacity:.15,blending:THREE.AdditiveBlending,depthWrite:false}));
 glw.rotation.x=-Math.PI/2;glw.position.y=.04;g.add(glw);
 return{g,wh,stW,wheelPivots,riggedWheels:true,prop,propKind:prop?'rotor':null,glw,wing:null};
}
/* Split suspension body from wheel steering/spin. A wrapper at the axle keeps
   the original model transforms intact; body motion cannot lift the tires. */
function raceFinalizeModel(m,id){
 if(m.motionReady)return m;
 if(!m.riggedWheels){
  m.wheelPivots=(m.wh||[]).slice();const spins=[];
  for(const pivot of m.wheelPivots){const spin=new THREE.Group();const meshes=pivot.children.slice();pivot.add(spin);for(const mesh of meshes)spin.add(mesh);spin.userData.radius=pivot.position.y||.33;spins.push(spin)}
  m.wh=spins;
 }
 const fixed=new Set([...(m.wheelPivots||[]),m.glw]);
 const body=new THREE.Group();for(const child of m.g.children.slice())if(!fixed.has(child))body.add(child);m.g.add(body);m.body=body;
 if(RACECARS[id].type==='plane'){
  if(id==='swift')m.propKind='rotor';
  else{
   m.propKind='jet';
   if(m.prop&&m.prop.children[0]&&m.prop.children[0].isMesh)m.exhaust=m.prop.children[0];
   else{const jet=new THREE.Group();jet.position.set(0,.5,-RACEGLB[id].len*.47);body.add(jet);m.prop=jet;m.exhaust=new THREE.Mesh(new THREE.ConeGeometry(.20,1.15,10),new THREE.MeshBasicMaterial({color:0x66baff,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));m.exhaust.rotation.x=Math.PI/2;jet.add(m.exhaust)}
  }
 }
 m.motionReady=true;return m;
}
function raceBuildModel(id){
 const d=RACECARS[id];
 if(RACEGLB_TPL[id])return raceFinalizeModel(raceGlbClone(RACEGLB_TPL[id],id),id);
 return raceFinalizeModel(d.type==='car'?rmBuildCar(id):rmBuildPlane(id),id);
}
