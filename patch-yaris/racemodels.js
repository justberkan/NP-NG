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

/* ---------- Araç kataloğu ---------- */
const RACECARS={
 falcon:{n:'Beko Falcon GT',k:'Spor araba',type:'car',col:0xe8b621,spd:78,hp:70,grip:75,diff:30,desc:'Dengeli güç. Yeni başlayanlar için ideal spor coupe.'},
 viper:{n:'Yılan S',k:'Drift aracı',type:'car',col:0x9b1c31,spd:72,hp:60,grip:45,diff:65,desc:'Kuyruk atan canavar. Virajda el freniyle yana yatır.'},
 apex:{n:'Apex F1',k:'Yarış arabası',type:'car',col:0xd7263d,spd:95,hp:40,grip:90,diff:80,desc:'Çıplak hız. Pist kralı ama darbe dayanımı zayıf.'},
 mammoth:{n:'Mastodon 4x4',k:'Pickup',type:'car',col:0x2e6e4e,spd:60,hp:100,grip:55,diff:25,desc:'Tank gibi. Çarpmadan çekinmez, yavaş gider.'},
 swift:{n:'Swift Kanat',k:'Yarış uçağı',type:'plane',col:0x27e0ff,spd:80,hp:55,grip:70,diff:45,desc:'Çevik ve hafif. Halkaların arasından süzül.'},
 raptor:{n:'Raptor X',k:'Savaş uçağı',type:'plane',col:0x4a5560,spd:88,hp:85,grip:60,diff:70,desc:'Zırhlı jet. Binalara biraz daha dayanıklı.'}
};
function raceBuildModel(id){const d=RACECARS[id];return d.type==='car'?rmBuildCar(id):rmBuildPlane(id)}
