'use strict';
/* ===== Silahlar: veriler, modeller, görünümler (skin), tutuş pozları, kollar (IK) ===== */
const DARK=0x1d2228,STEEL=0xcfd8e0,STEEL2=0x8fa0b0,BLACK=0x111418;
const VCMAT=new THREE.MeshLambertMaterial({vertexColors:true});

/* Birden çok kutuyu tek mesh'e birleştirir (hafif: tek çizim çağrısı) */
function mergeBoxes(parts){
 let n=0,ni=0;
 const geos=parts.map(p=>{const g=p.cr?(()=>{const q=new THREE.CylinderGeometry(p.cr2||p.cr,p.cr,p.d,12);q.rotateX(Math.PI/2);return q})():new THREE.BoxGeometry(p.w,p.h,p.d);g.translate(p.x||0,p.y||0,p.z||0);n+=g.attributes.position.count;ni+=g.index.count;return g});
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3),idx=new Uint16Array(ni);
 let vo=0,io=0;const c=new THREE.Color();
 geos.forEach((g,i)=>{
  const cnt=g.attributes.position.count;
  pos.set(g.attributes.position.array,vo*3);nor.set(g.attributes.normal.array,vo*3);
  c.setHex(parts[i].c);
  for(let j=0;j<cnt;j++){col[(vo+j)*3]=c.r;col[(vo+j)*3+1]=c.g;col[(vo+j)*3+2]=c.b}
  const ix=g.index.array;for(let j=0;j<ix.length;j++)idx[io+j]=ix[j]+vo;
  vo+=cnt;io+=ix.length;g.dispose();
 });
 const G=new THREE.BufferGeometry();
 G.setAttribute('position',new THREE.BufferAttribute(pos,3));
 G.setAttribute('normal',new THREE.BufferAttribute(nor,3));
 G.setAttribute('color',new THREE.BufferAttribute(col,3));
 G.setIndex(new THREE.BufferAttribute(idx,1));
 G.computeBoundingSphere();G.userData.own=1; /* bu geometri tek nesneye ait: nesne silinince güvenle atılabilir */
 return new THREE.Mesh(G,VCMAT);
}
const boxMesh=(w,h,d,x,y,z,c)=>mergeBoxes([{w,h,d,x,y,z,c}]);

/* ----- Silah verileri ----- */
/* st: [Hasar, İsabet, Tepme, Atış hızı, Mermi]  mg: şarjör boyu  gR/gL: sağ/sol el tutuş noktası  mz: namlu ucu  sh: nişangah yüksekliği */
const WP={
 rifle:{n:'Tüfek',hold:'rifle',mag:30,rate:.1,dmg:25,auto:1,rel:1.6,kick:1,spread:.022,sh:.118,dot:[.118,.14],mg:[.045,.16,.07],well:[0,-.125,.14],gR:[0,-.07,0],gL:[0,-.03,.36],mz:[0,.05,.64],st:[55,60,40,80,30],ic:'🔫',d:'Otomatik tüfek. Dengeli, orta menzilde güçlü. Oyunda 1 tuşu.'},
 smg:{n:'SMG',hold:'rifle',mag:40,rate:.065,dmg:15,auto:1,rel:1.4,kick:.6,spread:.035,sh:.12,dot:[.12,.1],mg:[.04,.2,.06],well:[0,-.15,.1],gR:[0,-.07,0],gL:[0,-.04,.24],mz:[0,.05,.44],st:[35,45,25,95,40],ic:'🔫',d:'Hafif otomatik silah. Çok hızlı ateş eder, yakın dövüşte ölümcül. Oyunda 2 tuşu.'},
 pistol:{n:'Tabanca',hold:'pistol',mag:12,rate:.26,dmg:35,auto:0,rel:1.1,kick:1.4,spread:.012,sh:.087,mg:[.03,.09,.04],well:[0,-.09,-.005],gR:[0,-.05,-.01],gL:[.03,-.075,.02],mz:[0,.045,.2],st:[70,70,60,40,12],ic:'🔫',d:'Yarı otomatik tabanca. Tek atışı güçlüdür. Oyunda 3 tuşu.'},
 dual:{n:'Çift Tabanca',hold:'dual',mag:24,rate:.13,dmg:22,auto:1,rel:2,kick:.8,spread:.03,sh:.087,mg:[.03,.09,.04],well:[0,-.09,-.005],gR:[0,-.05,-.01],gL:[0,-.05,-.01],mz:[0,.045,.2],st:[45,40,45,70,24],ic:'🔫',d:'İki el tabanca. Sırayla ateş eder, yakın menzilde yıkıcı. Oyunda 4 tuşu.'},
 knife:{n:'Bıçak',hold:'knife',melee:1,rate:.32,dmg:50,range:2.6,ang:.55,hitT:.45,gR:[0,0,0],mz:[0,0,.25],st:[40,100,0,90,0],ic:'🔪',d:'Hızlı yakın dövüş silahı. Oyunda 5 tuşu.'},
 sword:{n:'Kılıç',hold:'sword',melee:1,rate:.6,dmg:80,range:4,ang:.8,hitT:.45,gR:[0,0,0],gL:[0,0,-.15],mz:[0,0,.9],st:[70,100,0,60,0],ic:'🗡️',d:'Geniş kesik atar, birden çok düşmana çarpar. Oyunda 6 tuşu.'},
 gsword:{n:'İki El Kılıcı',hold:'gsword',melee:1,rate:1.05,dmg:140,range:4.6,ang:1.05,hitT:.5,gR:[0,0,.08],gL:[0,0,-.1],mz:[0,0,1.5],st:[100,100,0,30,0],ic:'⚔️',d:'Ağır ve yavaş. Tek vuruşta ezer, geniş alanı süpürür. Oyunda 7 tuşu.'}
};
const WNAME=k=>WP[k].n;

/* ----- Görünümler (skin) ----- */
const RAR={common:{n:'Sıradışı',c:'#8fa3b5'},rare:{n:'Nadir',c:'#3a9ae0'},epic:{n:'Destansı',c:'#9b6bff'},legendary:{n:'Efsanevi',c:'#ffb020'}};
const SKINS=[
 {id:'g0',n:'Standart',c:0x222a32,a:0x3a4552,r:'common',p:0},
 {id:'g6',n:'Kamuflaj',c:0x5b6b3a,a:0x3a4526,r:'common',p:150},
 {id:'g8',n:'Karbon',c:0x15181c,a:0x2c3138,r:'rare',p:250},
 {id:'g2',n:'Neon yeşil',c:0x39ff88,a:0x1f9e55,r:'rare',p:300},
 {id:'g3',n:'Kızıl',c:0xd8342c,a:0x8a1f1a,r:'rare',p:300},
 {id:'g5',n:'Buz mavisi',c:0x6fd8ff,a:0x2a7fa8,r:'rare',p:300},
 {id:'g4',n:'Mor',c:0x9b6bff,a:0x5f3fb0,r:'epic',p:400},
 {id:'g7',n:'Siber pembe',c:0xff4fd8,a:0x8f2a7a,r:'epic',p:450},
 {id:'g1',n:'Altın',c:0xffb020,a:0xc98a10,r:'legendary',p:800},
 /* skin_catalog.json (renk tabanlı; SVG desenleri henüz yok) */
 {id:'g9',n:'Ejderha Koru',c:0x15151b,a:0xff482e,r:'legendary',p:1200},
 {id:'g10',n:'Buz Kırığı',c:0x102234,a:0x68dfff,r:'epic',p:700},
 {id:'g11',n:'Kraliyet Altını',c:0x17191d,a:0xd9ac4d,r:'legendary',p:1200},
 {id:'g12',n:'Boşluk Nebulası',c:0x101020,a:0xc65cff,r:'epic',p:700},
 {id:'g13',n:'Toksik Çiçek',c:0x151c18,a:0x8ef04a,r:'rare',p:350},
 {id:'g14',n:'Çöl Gölgeliği',c:0xb9a17b,a:0x4e493c,r:'common',p:200},
 {id:'g15',n:'Oni Kızılı',c:0x1a1117,a:0xff3b56,r:'legendary',p:1200},
 {id:'g16',n:'Biyolojik Tehdit',c:0x283a28,a:0xa4db48,r:'rare',p:350}
];
const SKIN=id=>SKINS.find(s=>s.id===id)||SKINS[0];
const skinOf=k=>SKIN((SV.sk&&SV.sk[k])||'g0');
const CHARS=[
 {id:'c0',glb:1,tint:[0.62,0.72,0.95],n:'Gece Mavisi',r:'common',p:0,j:0x2f6fd0,j2:0x2a5fb8,pa:0x27324a,v:0x1e2a3a,v2:0x1a232f,h:0x1b2432,gl:0x161b22,sk:0xe8c9a0,bo:0x14181d},
 {id:'c1',glb:1,tint:[0.85,1.0,0.78],n:'Orman Kamuflaj',r:'common',p:300,j:0x4f7a3a,j2:0x44692f,pa:0x3d4a2c,v:0x2f3a22,v2:0x28321d,h:0x2b3520,gl:0x1d2418,sk:0xd9b48c,bo:0x1d2014},
 {id:'c2',glb:1,tint:[1.35,0.72,0.66],n:'Kızıl Komando',r:'rare',p:400,j:0xc0392b,j2:0xa83225,pa:0x3a2a2a,v:0x5a1f1a,v2:0x3a1612,h:0x2a1a1a,gl:0x1a1010,sk:0xc89a74,bo:0x1a1212},
 {id:'c3',glb:1,tint:[0.8,0.82,0.9],n:'Kent Grisi',r:'epic',p:500,j:0x8e5bff,j2:0x7a49e6,pa:0x2a2250,v:0x3a2a80,v2:0x2a1e5e,h:0x1c1638,gl:0x120e24,sk:0xe8c9a0,bo:0x110d22},
 {id:'c4',glb:1,tint:[1.4,1.15,0.6],n:'Altın Muhafız',r:'legendary',p:800,j:0xe0a030,j2:0xc78a20,pa:0x4a3a1a,v:0x7a5a1a,v2:0x5a4210,h:0x3a2c10,gl:0x2a1f0a,sk:0xe8c9a0,bo:0x2a1f0a},
 {id:'c5',glb:1,tint:[0.3,0.32,0.38],n:'Gece Ajanı',r:'rare',p:450,j:0x252a33,j2:0x1d2128,pa:0x1b1f26,v:0x14171c,v2:0x101216,h:0x14171c,gl:0x0c0e11,sk:0xb88a64,bo:0x0c0e11},
 /* Şampiyonlar: özgün küp karakterler (aksesuarlı) */
 {id:'h1',ch:1,glb:1,tint:[0.9,0.92,0.98],n:'Taş Dev',r:'epic',p:700,j:0x7a7f86,j2:0x6a6f76,pa:0x4a4e54,v:0x5a5f66,v2:0x50555b,h:0x6b7078,gl:0x3c4046,sk:0x8a9097,bo:0x2a2d31,nohat:1,ey:0xffb347,pu:0xff6a00,sc:1.08,
  hd:[{w:.24,h:.07,d:.26,x:0,y:.29,z:0,c:0x6b7078},{w:.08,h:.06,d:.1,x:-.12,y:.24,z:.06,c:0x5a5f66},{w:.08,h:.06,d:.1,x:.12,y:.24,z:.06,c:0x5a5f66}],
  bd:[{w:.16,h:.13,d:.27,x:-.28,y:.5,z:0,c:0x6b7078},{w:.16,h:.13,d:.27,x:.28,y:.5,z:0,c:0x6b7078},{w:.1,h:.08,d:.1,x:-.28,y:.6,z:0,c:0x80858c},{w:.1,h:.08,d:.1,x:.28,y:.6,z:0,c:0x80858c}]},
 {id:'h2',ch:1,glb:1,tint:[1.3,0.9,0.65],n:'Kızıl Tilki',r:'rare',p:450,j:0xd9712a,j2:0xc4601f,pa:0x3a2a20,v:0xf3e6d3,v2:0xd9712a,h:0xc4601f,gl:0x3a2a20,sk:0xe0853a,bo:0x2a1a10,nohat:1,
  hd:[{w:.06,h:.11,d:.05,x:-.07,y:.34,z:0,c:0xd9712a},{w:.06,h:.11,d:.05,x:.07,y:.34,z:0,c:0xd9712a},{w:.03,h:.04,d:.03,x:-.07,y:.41,z:0,c:0x2a1a10},{w:.03,h:.04,d:.03,x:.07,y:.41,z:0,c:0x2a1a10},{w:.11,h:.06,d:.05,x:0,y:.12,z:.13,c:0xf3e6d3},{w:.03,h:.03,d:.02,x:0,y:.14,z:.16,c:0x1a1a1a}],
  hp:[{w:.1,h:.1,d:.34,x:0,y:.02,z:-.27,c:0xd9712a},{w:.1,h:.1,d:.14,x:0,y:.02,z:-.5,c:0xf3e6d3}]},
 {id:'h3',ch:1,glb:1,tint:[0.12,0.12,0.16],n:'Gölge Avcı',r:'legendary',p:1200,j:0x1a1a24,j2:0x14141c,pa:0x101018,v:0x22222e,v2:0x181822,h:0x14141c,gl:0x0c0c12,sk:0x2a2a36,bo:0x0a0a10,nohat:1,ey:0xc060ff,pu:0xe8b0ff,
  hd:[{w:.25,h:.3,d:.08,x:0,y:.17,z:-.14,c:0x14141c},{w:.05,h:.28,d:.2,x:-.13,y:.17,z:-.03,c:0x14141c},{w:.05,h:.28,d:.2,x:.13,y:.17,z:-.03,c:0x14141c},{w:.26,h:.06,d:.27,x:0,y:.31,z:-.01,c:0x14141c}],
  bd:[{w:.38,h:.58,d:.03,x:0,y:.26,z:-.17,c:0x14141c},{w:.3,h:.2,d:.03,x:0,y:-.05,z:-.17,c:0x0c0c12}]},
 {id:'h4',ch:1,glb:1,tint:[1.9,2.0,2.2],n:'Robot RX-9',r:'epic',p:600,j:0xb8c4cf,j2:0x9aa8b5,pa:0x6a7783,v:0x8fa0b0,v2:0x6a7783,h:0x5a6672,gl:0x2a323a,sk:0x8fa0b0,bo:0x2a323a,nohat:1,ey:0x28e0ff,pu:0x28e0ff,
  hd:[{w:.21,h:.04,d:.23,x:0,y:.285,z:0,c:0x5a6672},{w:.02,h:.12,d:.02,x:.06,y:.35,z:0,c:0x8f9aa5},{w:.04,h:.04,d:.04,x:.06,y:.42,z:0,c:0xff4040},{w:.04,h:.07,d:.05,x:-.115,y:.17,z:0,c:0x5a6672},{w:.04,h:.07,d:.05,x:.115,y:.17,z:0,c:0x5a6672}],
  bd:[{w:.22,h:.28,d:.12,x:0,y:.3,z:-.2,c:0x6a7783},{w:.04,h:.1,d:.04,x:-.07,y:.5,z:-.2,c:0xffb020},{w:.04,h:.1,d:.04,x:.07,y:.5,z:-.2,c:0xffb020}]},
 /* Operatörler: konsept görseldeki taktik karakterler */
 /* GLB şampiyonlar (gerçek 3B modeller, aynı animasyon iskeletine bağlı) */
 {id:'c6',glb:1,n:'Klasik Operatör',r:'common',p:0,j:0x5a6b3a,j2:0x4f5f32,pa:0x4a5330,v:0x3b4a2a,v2:0x2f3b22,h:0x4a5a30,gl:0x1e2218,sk:0xd9b48c,bo:0x2a2a20,
  hd:[{w:.27,h:.09,d:.29,x:0,y:.275,z:0,c:0x4a5a30},{w:.25,h:.045,d:.03,x:0,y:.215,z:.14,c:0xffc820},{w:.06,h:.04,d:.03,x:-.07,y:.2,z:.15,c:0x2a1a00},{w:.06,h:.04,d:.03,x:.07,y:.2,z:.15,c:0x2a1a00},{w:.025,h:.1,d:.2,x:-.135,y:.2,z:-.02,c:0x3b4a2a},{w:.025,h:.1,d:.2,x:.135,y:.2,z:-.02,c:0x3b4a2a}],
  bd:[{w:.3,h:.38,d:.14,x:0,y:.3,z:-.2,c:0x3b4a2a},{w:.2,h:.12,d:.08,x:0,y:.12,z:-.27,c:0x2f3b22},{w:.08,h:.1,d:.05,x:-.1,y:.32,z:.14,c:0x2a3320},{w:.08,h:.1,d:.05,x:.1,y:.32,z:.14,c:0x2a3320},{w:.08,h:.09,d:.05,x:-.1,y:.18,z:.14,c:0x2a3320},{w:.08,h:.09,d:.05,x:.1,y:.18,z:.14,c:0x2a3320},{w:.34,h:.04,d:.02,x:0,y:.12,z:.14,c:0x6b5a3a}]},
 {id:'c7',glb:1,tint:[1.35,1.15,0.85],n:'Çöl Operatörü',r:'rare',p:450,j:0x2a2e36,j2:0x22262d,pa:0x1d2026,v:0x33363f,v2:0x262930,h:0x2a2e36,gl:0x14161a,sk:0xe6c4a0,bo:0x14161a,nohat:1,
  hd:[{w:.25,h:.07,d:.26,x:0,y:.275,z:0,c:0x2a1a14},{w:.26,h:.05,d:.28,x:0,y:.23,z:0,c:0xd03a30},{w:.07,h:.24,d:.07,x:0,y:.14,z:-.17,c:0x2a1a14},{w:.05,h:.12,d:.05,x:0,y:-.02,z:-.18,c:0x2a1a14},{w:.24,h:.2,d:.05,x:0,y:.17,z:-.14,c:0x2a1a14}],
  bd:[{w:.26,h:.3,d:.1,x:0,y:.3,z:-.18,c:0x1d2026},{w:.08,h:.1,d:.05,x:-.1,y:.3,z:.14,c:0x1d2026},{w:.08,h:.1,d:.05,x:.1,y:.3,z:.14,c:0x1d2026},{w:.3,h:.03,d:.02,x:0,y:.14,z:.14,c:0xd03a30}]},
 {id:'c8',glb:1,tint:[0.2,0.2,0.22],n:'Siyah Operatör',r:'epic',p:800,j:0x14161b,j2:0x101216,pa:0x0e1014,v:0x1b1e25,v2:0x13151a,h:0x101216,gl:0x0a0b0e,sk:0x1a1c22,bo:0x08090b,nohat:1,ey:0x28e0ff,pu:0x28e0ff,
  hd:[{w:.27,h:.3,d:.08,x:0,y:.17,z:-.14,c:0x101216},{w:.05,h:.28,d:.22,x:-.14,y:.17,z:-.03,c:0x101216},{w:.05,h:.28,d:.22,x:.14,y:.17,z:-.03,c:0x101216},{w:.28,h:.07,d:.29,x:0,y:.31,z:-.01,c:0x101216},{w:.2,h:.03,d:.03,x:0,y:.26,z:.15,c:0x28e0ff}],
  bd:[{w:.4,h:.6,d:.03,x:0,y:.25,z:-.18,c:0x101216},{w:.03,h:.4,d:.02,x:-.09,y:.28,z:.135,c:0x28e0ff},{w:.03,h:.4,d:.02,x:.09,y:.28,z:.135,c:0x28e0ff},{w:.14,h:.04,d:.16,x:-.28,y:.55,z:0,c:0x28e0ff},{w:.14,h:.04,d:.16,x:.28,y:.55,z:0,c:0x28e0ff}]},
 {id:'c9',glb:1,tint:[2.3,2.3,2.4],n:'Beyaz Operatör',r:'legendary',p:1400,j:0x2a2b30,j2:0x222328,pa:0x1e1f24,v:0x3a3b42,v2:0x2a2b30,h:0x1a1b20,gl:0x101114,sk:0xcfc8b8,bo:0x101114,nohat:1,ey:0xff2a2a,pu:0xff2a2a,
  hd:[{w:.27,h:.09,d:.29,x:0,y:.275,z:0,c:0x1a1b20},{w:.23,h:.17,d:.04,x:0,y:.15,z:.125,c:0xe8e4d8},{w:.06,h:.045,d:.03,x:-.055,y:.18,z:.145,c:0x0a0a0c},{w:.06,h:.045,d:.03,x:.055,y:.18,z:.145,c:0x0a0a0c},{w:.03,h:.04,d:.03,x:0,y:.13,z:.145,c:0x0a0a0c},{w:.14,h:.03,d:.03,x:0,y:.09,z:.145,c:0x0a0a0c},{w:.28,h:.03,d:.3,x:0,y:.24,z:0,c:0xc0201a}],
  bd:[{w:.3,h:.34,d:.14,x:0,y:.3,z:-.2,c:0x1a1b20},{w:.12,h:.12,d:.05,x:0,y:.32,z:.14,c:0x1a1b20},{w:.1,h:.03,d:.03,x:0,y:.32,z:.17,c:0xc0201a},{w:.16,h:.1,d:.16,x:-.28,y:.55,z:0,c:0x3a3b42},{w:.16,h:.1,d:.16,x:.28,y:.55,z:0,c:0x3a3b42},{w:.03,h:.3,d:.02,x:-.14,y:.26,z:.14,c:0xc0201a},{w:.03,h:.3,d:.02,x:.14,y:.26,z:.14,c:0xc0201a}]},
 /* GLB şampiyonlar (karakterler klasörü): gerçek 3B modeller, N_ iskeletine çevrildi; sadece görünüm, güç vermez */
 {id:'h5',ch:1,glb:'demiradam',n:'Demir Adam',r:'legendary',p:1600,j:0xb3262a,j2:0xb3262a,pa:0x2a2d33,v:0x33363d,v2:0x26292e,h:0x2a2d33,gl:0x15171a,sk:0xd9b48c,bo:0x15171a,nohat:1},
 {id:'h6',ch:1,glb:'orumcek',n:'Örümcek Adam',r:'legendary',p:1500,j:0xc8202a,j2:0xc8202a,pa:0x2a2d33,v:0x33363d,v2:0x26292e,h:0x2a2d33,gl:0x15171a,sk:0xd9b48c,bo:0x15171a,nohat:1},
 {id:'h7',ch:1,glb:'bsamuray',n:'Beyaz Samuray',r:'legendary',p:1400,j:0xd8dde4,j2:0xd8dde4,pa:0x2a2d33,v:0x33363d,v2:0x26292e,h:0x2a2d33,gl:0x15171a,sk:0xd9b48c,bo:0x15171a,nohat:1},
 {id:'h8',ch:1,glb:'ada',n:'Ada Wong',r:'epic',p:1000,j:0x9a1a24,j2:0x9a1a24,pa:0x2a2d33,v:0x33363d,v2:0x26292e,h:0x2a2d33,gl:0x15171a,sk:0xd9b48c,bo:0x15171a,nohat:1},
 {id:'h9',ch:1,glb:'karadul',n:'Kara Dul',r:'epic',p:1000,j:0x1a1b20,j2:0x1a1b20,pa:0x2a2d33,v:0x33363d,v2:0x26292e,h:0x2a2d33,gl:0x15171a,sk:0xd9b48c,bo:0x15171a,nohat:1},
 {id:'h10',ch:1,glb:'leon',n:'Leon',r:'epic',p:900,j:0x4a5a3a,j2:0x4a5a3a,pa:0x2a2d33,v:0x33363d,v2:0x26292e,h:0x2a2d33,gl:0x15171a,sk:0xd9b48c,bo:0x15171a,nohat:1},
 {id:'h11',ch:1,glb:'siber',n:'Siber Savaşçı',r:'epic',p:900,j:0x6a3ac0,j2:0x6a3ac0,pa:0x2a2d33,v:0x33363d,v2:0x26292e,h:0x2a2d33,gl:0x15171a,sk:0xd9b48c,bo:0x15171a,nohat:1},
 {id:'h12',ch:1,glb:'ronin',n:'Ronin',r:'epic',p:800,j:0x3a4a6a,j2:0x3a4a6a,pa:0x2a2d33,v:0x33363d,v2:0x26292e,h:0x2a2d33,gl:0x15171a,sk:0xd9b48c,bo:0x15171a,nohat:1},
 {id:'h13',ch:1,glb:'uzaypiyade',n:'Uzay Piyadesi',r:'epic',p:800,j:0xc8ccd2,j2:0xc8ccd2,pa:0x2a2d33,v:0x33363d,v2:0x26292e,h:0x2a2d33,gl:0x15171a,sk:0xd9b48c,bo:0x15171a,nohat:1},
 {id:'h14',ch:1,glb:'gotik',n:'Gotik Zarafet',r:'rare',p:600,j:0x2a2a30,j2:0x2a2a30,pa:0x2a2d33,v:0x33363d,v2:0x26292e,h:0x2a2d33,gl:0x15171a,sk:0xd9b48c,bo:0x15171a,nohat:1},
 {id:'h15',ch:1,glb:'heetah',n:'Heetah',r:'rare',p:600,j:0xd98a3a,j2:0xd98a3a,pa:0x2a2d33,v:0x33363d,v2:0x26292e,h:0x2a2d33,gl:0x15171a,sk:0xd9b48c,bo:0x15171a,nohat:1},
 {id:'h16',ch:1,glb:'animekiz',n:'Anime Kız',r:'rare',p:500,j:0x3f6a3a,j2:0x3f6a3a,pa:0x2a2d33,v:0x33363d,v2:0x26292e,h:0x2a2d33,gl:0x15171a,sk:0xd9b48c,bo:0x15171a,nohat:1},
 {id:'h17',ch:1,glb:'swat',n:'SWAT',r:'rare',p:450,j:0x2c3138,j2:0x2c3138,pa:0x2a2d33,v:0x33363d,v2:0x26292e,h:0x2a2d33,gl:0x15171a,sk:0xd9b48c,bo:0x15171a,nohat:1}
];
/* Formalar: karakterden bağımsız kuşanılan aksesuar (glbrig.js: KITS). Her karaktere giyilir, çıkarılabilir. */
const FORMS=[
 {id:'f1',kit:'kartal',n:'Kartal Forması',r:'epic',p:900,c:0x121212},
 {id:'f2',kit:'aslan',n:'Aslan Forması',r:'epic',p:900,c:0xf5b800},
 {id:'f3',kit:'kanarya',n:'Kanarya Forması',r:'epic',p:900,c:0xffd200},
 {id:'f4',kit:'ayyildiz',n:'Ay-Yıldız Forması',r:'legendary',p:1200,c:0xc8102e}
];
const CHAR0=id=>CHARS.find(c=>c.id===id)||CHARS[0],_CHK={};
/* karakter kimliği forma ekiyle gelebilir: 'h8x1' = Ada + 1. forma (sunucu 8 harfe kadar kimlik kabul ediyor, sunucuya dokunmadan ağda taşınır) */
const CHAR=id=>{const m=/^([a-z]+\d+)x(\d)$/i.exec(id||'');if(!m)return CHAR0(id);const f=FORMS[+m[2]-1],b=CHAR0(m[1]);if(!f)return b;const k=b.id+'x'+m[2];return _CHK[k]||(_CHK[k]=Object.assign({},b,{kit:f.kit}))};
/* kuşanılı forma ile karakter kimliği; fid verilirse o forma ile (mağaza önizlemesi), 'f0' = formasız */
function chWithKit(c,fid){const f=fid!==undefined?fid:(typeof SV!=='undefined'&&SV&&SV.eq?SV.eq.f:null);const i=FORMS.findIndex(x=>x.id===f);return c+(i>=0?'x'+(i+1):'')}
const XH=[{id:'x0',n:'Beyaz nişangah',c:0xffffff,r:'common',p:0},{id:'x1',n:'Camgöbeği nişangah',c:0x28e0ff,r:'common',p:150},{id:'x2',n:'Yeşil nişangah',c:0x4dff6a,r:'common',p:150},{id:'x3',n:'Pembe nişangah',c:0xff5ad0,r:'common',p:150},{id:'x4',n:'Sarı nişangah',c:0xffe14d,r:'common',p:150}];
const BOTCOL={
 a:{glb:1,tint:[.62,.72,.95],j:0x2f6fd0,j2:0x2a5fb8,pa:0x27324a,v:0x1e2a3a,v2:0x1a232f,h:0x1b2432,gl:0x161b22,sk:0xd9b48c,bo:0x14181d},
 e:{glb:1,tint:[1.35,.72,.66],j:0xc0392b,j2:0xa83225,pa:0x3a2a2a,v:0x4a2a2a,v2:0x3a1c1c,h:0x2a1a1a,gl:0x1a1010,sk:0xc89a74,bo:0x1a1212},
 z:{glb:1,tint:[.55,1.0,.45],j:0x55603f,j2:0x4a5538,pa:0x3a3f33,v:0x4a5538,v2:0x3a432b,h:0x4a5538,gl:0x6f9a55,sk:0x7fae5f,bo:0x23251d}
};

/* ----- Silah modelleri ----- */
function wparts(k,B,A){
 const D=DARK,P=(w,h,d,x,y,z,c)=>({w,h,d,x,y,z,c});
 switch(k){
 case 'rifle':return[P(.06,.09,.42,0,.03,.12,B),P(.03,.03,.3,0,.05,.46,D),P(.055,.09,.22,0,-.005,-.17,B),P(.07,.06,.2,0,0,.34,A),P(.04,.1,.05,0,-.07,0,D)];
 case 'smg':return[P(.06,.1,.3,0,.03,.1,B),P(.028,.028,.14,0,.05,.37,D),P(.05,.05,.1,0,.045,.27,A),P(.04,.07,.1,0,.02,-.1,B),P(.04,.1,.05,0,-.07,0,D)];
 case 'pistol':case 'dual':return[P(.04,.05,.2,0,.045,.06,B),P(.04,.035,.14,0,.005,.04,A),P(.036,.11,.055,0,-.05,-.01,D),P(.02,.02,.04,0,.045,.17,D),P(.02,.015,.02,0,.078,.14,D)];
 case 'knife':return[P(.012,.035,.2,0,0,.15,STEEL),P(.028,.03,.11,0,0,0,D),P(.05,.014,.018,0,0,.07,A)];
 case 'sword':return[P(.018,.05,.78,0,0,.55,STEEL),P(.006,.052,.6,0,0,.5,STEEL2),P(.2,.025,.035,0,0,.15,A),P(.03,.03,.16,0,0,.05,D),P(.045,.045,.045,0,0,-.04,A)];
 case 'gsword':return[P(.03,.1,1.3,0,0,.85,STEEL),P(.01,.102,1,0,0,.8,STEEL2),P(.32,.03,.045,0,0,.2,A),P(.034,.034,.36,0,0,0,D),P(.06,.06,.06,0,0,-.2,A)];
 }
 return typeof swParts==='function'?swParts(k):[];
}
function mkFlash(mz){
 const m=new THREE.Mesh(new THREE.BoxGeometry(.07,.07,.1),new THREE.MeshBasicMaterial({color:0xffd070,transparent:true,opacity:.95}));
 m.position.set(mz[0],mz[1],mz[2]+.05);m.visible=false;return m;
}
function buildWeapon(k,sk,mid,own){
 sk=sk||SKIN('g0');
 const d=WP[k],parts=wparts(k,sk.c,sk.a);
 const g=new THREE.Group();
 /* GLB model varsa kutu modelin yerine kullanılır (catalog.js: mdlSpec/mdlPlace) */
 const sp=typeof mdlSpec==='function'?mdlSpec(k,mid):null;
 const mm=sp?mdlBuild(sp):null,pl=mm?mdlPlace(mm,k,d,sp):null;
 if(mm)g.add(mm); /* kutu (klasik) silah modeli kaldırıldı: GLB yüklenene kadar boş durur */
 const gR=d.gR,gL=pl&&pl.gL?pl.gL:d.gL,mz=pl?pl.mz:d.mz;
 const W={g,g2:null,mag:null,mag2:null,flash:null,flash2:null,gR:V3(...gR),gL:gL?V3(...gL):V3(),well:d.mg?V3(...d.well):V3(),mz:V3(...mz),sh:pl?pl.sh:d.sh,hideMag:!!mm,adsZ:pl&&pl.adsz||0,bk:pl&&pl.bk!=null?pl.bk:null};
 W.support=pl&&pl.support?pl.support.map(p=>V3(...p)):null;
 const optOK=!d.melee&&d.hold!=='pistol'&&d.hold!=='dual';
 if(optOK&&mm&&typeof optModel==='function'&&(own?(SV.eq.o||'o0'):'o0')!=='o0'){
  /* nişangah (optik): kuşanılan model sadece kendi silahında görünür, diğerlerinde standart kırmızı nokta */
  const oid=own?(SV.eq.o||'o0'):'o0',om=optModel(oid);
  const y0=mm?pl.sh:(d.sh-.03),oz=mm?(mm.position.z):(d.dot?d.dot[1]:.1);
  om.g.position.set(0,y0,oz);g.add(om.g);W.sh=y0+om.cy;W.opt=oid;W.dotM=om.dot||null;
 }
 if(d.mg){
  const mg=mm?mdlMagazine(mm,d.hold==='pistol'||d.hold==='dual'?'pistol':k,sp.mid):null;
  if(mg){W.mag=mg.moving;W.nativeMag=mg.source;W.well.copy(mg.center);W.magSize=mg.size}
  else if(!mm)W.mag=boxMesh(d.mg[0],d.mg[1],d.mg[2],0,0,0,0x15191e);
  W.magStatus=mg?'geometry':mm?'integrated-or-unresolved':'loading';
 }
 if(d.hold==='dual'){
  W.g2=new THREE.Group();
  if(mm){const m2=mdlBuild(sp);mdlPlace(m2,k,d,sp);W.g2.add(m2);const mg=mdlMagazine(m2,'pistol',sp.mid);if(mg){W.mag2=mg.moving;W.nativeMag2=mg.source}}
  else W.mag2=boxMesh(d.mg[0],d.mg[1],d.mg[2],0,0,0,0x15191e);
 }
 if(!d.melee){W.flash=mkFlash(mz);g.add(W.flash);if(W.g2){W.flash2=mkFlash(mz);W.g2.add(W.flash2)}}
 return W;
}

/* ----- Kol (2 kemikli IK) ----- */
const DOWN=V3(0,-1,0),_a=V3(),_b=V3(),_c=V3(),_E=V3(),_q=new THREE.Quaternion();
function mkArm(parent,p0,cols,side,fp){
 /* fp: birinci şahıs kolu — daha ince ve uzun (kamera önünde dev blok gibi durmasın, el hedefe ulaşsın) */
 const th=fp?.72:1,ln=fp?1.4:1,L1=.3*ln,L2=.28*ln,sh=new THREE.Group(),el=new THREE.Group();
 sh.position.copy(p0);parent.add(sh);
 sh.add(mergeBoxes([{w:.1*th,h:L1,d:.1*th,x:0,y:-L1/2,z:0,c:cols.j}]));
 el.position.y=-L1;sh.add(el);
 el.add(mergeBoxes([{w:.088*th,h:L2,d:.088*th,x:0,y:-L2/2,z:0,c:cols.j2},{w:.095*th,h:.095*th,d:.11*th,x:0,y:-L2-.03,z:0,c:cols.gl}]));
 return{sh,el,p0:p0.clone(),L1,L2,pole:V3(side*.95,-1,-.2)};
}
function solveArm(arm,T){
 const L1=arm.L1,L2=arm.L2;
 /* el, gövdenin içinden geçmesin: göğüs/karın kutusunun dışına it */
 if(T.z<.17&&T.z>-.17&&Math.abs(T.x)<.23&&T.y>-.15&&T.y<.6){T.z=T.z>=0?.17:-.17}
 _a.copy(T).sub(arm.p0);
 const d=_a.length();
 const dc=Math.min(Math.max(d,Math.abs(L1-L2)+.01),(L1+L2)*.999);
 if(d>1e-5)_a.divideScalar(d);else _a.set(0,0,1);
 const a=(L1*L1-L2*L2+dc*dc)/(2*dc),h=Math.sqrt(Math.max(0,L1*L1-a*a));
 _b.copy(arm.pole);_b.addScaledVector(_a,-_b.dot(_a));
 if(_b.lengthSq()<1e-5)_b.set(0,-1,0);_b.normalize();
 _E.copy(arm.p0).addScaledVector(_a,a).addScaledVector(_b,h);
 _c.copy(_E).sub(arm.p0).normalize();
 arm.sh.quaternion.setFromUnitVectors(DOWN,_c);
 _q.copy(arm.sh.quaternion).invert();
 _c.copy(T).sub(_E).normalize().applyQuaternion(_q);
 arm.el.quaternion.setFromUnitVectors(DOWN,_c);
}

/* ----- Silah tutucu: bir gövdeye (iskelet ya da kamera) bağlı silah + iki kol ----- */
function mkHolder(parent,aimPos,p0R,p0L,cols,fp){
 const aim=new THREE.Group();aim.position.copy(aimPos);parent.add(aim);
 return{aim,armR:mkArm(parent,p0R,cols,-1,fp),armL:mkArm(parent,p0L,cols,1,fp),W:null,wk:null,dropped:false};
}
function holderSet(h,k,skin,mid){
 if(h.W){h.aim.remove(h.W.g);if(h.W.g2)h.aim.remove(h.W.g2);if(h.W.mag)h.aim.remove(h.W.mag);if(h.W.mag2)h.aim.remove(h.W.mag2)}
 h.W=buildWeapon(k,skin||skinOf(k),mid,h.optOn);h.wk=k;h.mid=mid||null;h.dropped=false;
 if(typeof mdlWant==='function')mdlWant(k,mid,()=>{if(h.wk===k&&h.mid===(mid||null)&&h.W)holderSet(h,k,skin,mid)});
 h.aim.add(h.W.g);if(h.W.g2)h.aim.add(h.W.g2);if(h.W.mag)h.aim.add(h.W.mag);if(h.W.mag2)h.aim.add(h.W.mag2);
}

/* ----- Tutuş pozları (aim uzayı: -x sağ, +y yukarı, +z ileri) ----- */
const _tR=V3(),_m4=new THREE.Matrix4(),_m4b=new THREE.Matrix4(),_qa=new THREE.Quaternion(),_qb=new THREE.Quaternion(),_one=V3(1,1,1);
const _pW=V3(),_pBelow=V3(),_pOut=V3(),_pFg=V3(),_pAway=V3(.24,-.32,.2),_pBelt=V3(.2,-.44,.08),_tv=V3();
const P={wp:V3(),wr:new THREE.Euler(),rh:V3(),lh:V3(),lhOn:true,w2p:V3(),w2r:new THREE.Euler(),magAtt:true,magV:true,magP:V3(),magQ:new THREE.Quaternion(),mag2V:true,mag2P:V3(),mag2Q:new THREE.Quaternion()};

function tilt(q){if(q<.18)return ease(q/.18);if(q<.82)return 1;if(q<.95)return 1-ease((q-.82)/.13);return 0}

/* Şarjör değiştirme: sol el şarjörü tutar, çeker, atar, kemerden yenisini alır, takar */
function reloadHands(h,q,d){
 const W=h.W,mh=W.magSize?W.magSize.y:d.mg[1],w=W.well;
 _pW.set(w.x,w.y,w.z).applyMatrix4(_m4);
 _pBelow.set(w.x,w.y-mh*.75,w.z).applyMatrix4(_m4);
 _pOut.set(w.x,w.y-mh*1.9,w.z).applyMatrix4(_m4);
 _pFg.copy(W.gL).applyMatrix4(_m4);
 P.lhOn=false;P.magAtt=false;P.magV=true;P.magQ.copy(_qa);
 let u;
 if(q<.3)h.dropped=false;
 if(q<.18){u=ease(q/.18);P.lh.lerpVectors(_pFg,_pBelow,u);P.magAtt=true}
 else if(q<.34){u=ease((q-.18)/.16);P.lh.lerpVectors(_pBelow,_pOut,u);P.magP.copy(P.lh);P.magP.y+=.03}
 else if(q<.5){u=ease((q-.34)/.16);P.lh.lerpVectors(_pOut,_pAway,u);
  if(q<.38){P.magP.copy(P.lh);P.magP.y+=.03}else{P.magV=false;if(!h.dropped){h.dropped=true;spawnMagProp(h,1)}}}
 else if(q<.64){u=ease((q-.5)/.14);P.lh.lerpVectors(_pAway,_pBelt,u);P.magV=false}
 else if(q<.82){u=ease((q-.64)/.18);P.lh.lerpVectors(_pBelt,_pOut,u);P.magP.copy(P.lh);P.magP.y+=.03}
 else if(q<.92){u=ease((q-.82)/.1);P.magP.lerpVectors(_pOut,_pW,u);P.lh.copy(P.magP);P.lh.y-=mh*.55}
 else{u=ease((q-.92)/.08);P.lh.lerpVectors(_pBelow,_pFg,u);P.magAtt=true}
}

function poseGun(h,c){
 const W=h.W,d=WP[h.wk],t=c.t||0,ads=c.ads||0,lr=c.lr||0,sw=c.sw==null?1:c.sw,kick=c.kick||0,bob=c.bob||0;
 const pis=d.hold==='pistol';
 let hx=pis?-.1:-.12,hy=pis?-.02:-.0,hz=pis?.5:.46,az=pis?.4:.3,ax=0; /* birinci şahıs kalça pozu: silah ekranın sağ-altında tam görünür */
 /* Başkasının/yansıma karakteri: dipçik omuz çukuruna (sağ omuz hizası), gövdeye girmeden; kabza-dipçik mesafesi modelden (W.bk) */
 const tpAuto=!pis&&W.bk!=null&&!(typeof VM!=='undefined'&&VM.h===h);
 if(tpAuto){hx=-.11;ax=-.08;hz=.08+W.bk-W.gR.z;az=hz-.02}
 P.wp.set(lerp(hx,ax,ads),lerp(hy,.17-W.sh,ads),lerp(hz,az,ads));
 P.wr.set(0,tpAuto?.16:0,0);
 const fpv=typeof VM!=='undefined'&&VM.h===h;
 if(fpv){
  /* BİRİNCİ ŞAHIS: silah kol mesafesinde değil, omuza/yanağa dayalı. Kabza noktası kameraya göre yerleştirilir,
     dipçik (W.bk = kabza→dipçik boyu) kameranın hemen arkasına/yanına gelir → silah gerçek boyunda, büyük görünür. */
  const bk=pis?0:(W.bk!=null?W.bk:.24);
  const smg=h.wk==='smg',gx=pis?-.15:-.2,gy=pis?-.21:-.215,gz=pis?.33:(bk+(smg?-.1:-.04)); /* kalça: kabza kameraya göre (sağ, aşağı, ileri) */
  /* nişan: silah ileri ve hafif aşağı → ekranın ortası açık kalır, kırmızı nokta (ekran katmanı) tam ortada.
     ADS_ILERI: büyütünce silah küçülür/uzaklaşır · ADS_ALT: büyütünce silah ekranın altına iner */
  const ADS_ILERI=pis?.12:.16,ADS_ALT=pis?.03:.045;
  const sx=0,sy=-W.sh-ADS_ALT,sz=(pis?.3:(bk+(smg?-.08:.03)))+ADS_ILERI;
  const tx=lerp(gx,sx,ads),tz=lerp(gz,sz,ads);
  P.wp.x=tx-W.gR.x;P.wp.z=tz-W.gR.z;
  P.wp.y=lerp(gy-W.gR.y,sy,ads)+.17; /* aim grubu kameranın .17 altında */
  P.wr.y=.13*(1-ads);P.wr.x=.04*(1-ads);P.wr.z=-.05*(1-ads);
 }else if(!tpAuto)P.wp.z+=(W.adsZ||0)*(.5+.5*ads)+(W.adsZ?.16*ads:0); /* kabza geri alındı: nişanda/kalçada kabza-arka mesafesini koru (siyah duvar olmasın) */
 P.wp.y+=Math.sin(t*1.7)*.003+Math.sin(t*9)*.012*bob;
 P.wp.x+=Math.cos(t*.9)*.002+Math.cos(t*4.5)*.01*bob;
 P.wp.x+=.03*lr;P.wp.y+=-.16*lr;P.wp.z+=.04*lr;P.wr.x+=.35*lr;
 {const dn=Math.max(0,Math.min(1.2,-(c.pitch||0)));P.wp.z+=.26*dn;P.wp.y+=.06*dn} /* aşağı bakınca silah gövdeden geçmesin */
 P.wp.y-=(1-sw)*.3;P.wr.x+=(1-sw)*.9;
 P.wp.z-=kick*.05;P.wr.x-=kick*.1;
 const rq=c.rq==null?-1:c.rq;
 if(rq>=0){const tl=tilt(rq);P.wr.z+=tl*.5;P.wr.x+=tl*.2;P.wp.x+=tl*.04}
 _qa.setFromEuler(P.wr);_m4.compose(P.wp,_qa,_one);
 P.rh.copy(W.gR).applyMatrix4(_m4);
 P.lh.copy(W.gL).applyMatrix4(_m4);P.lhOn=true;
 P.magAtt=true;P.magV=true;P.mag2V=false;
 if(rq>=0)reloadHands(h,rq,d);else h.dropped=false;
}

function poseDual(h,c){
 const W=h.W,d=WP.dual,t=c.t||0,ads=c.ads||0,lr=c.lr||0,sw=c.sw==null?1:c.sw,bob=c.bob||0,kR=c.kickR||0,kL=c.kickL||0;
 P.wp.set(lerp(-.2,-.07,ads),lerp(-.1,.05,ads),.3);
 P.w2p.set(-P.wp.x,P.wp.y,P.wp.z);
 P.wr.set(0,0,0);P.w2r.set(0,0,0);
 P.wp.y+=Math.sin(t*1.7)*.003+Math.sin(t*9)*.012*bob;
 P.w2p.y+=Math.sin(t*1.7+1)*.003+Math.sin(t*9+3)*.012*bob;
 P.wp.y-=.1*lr;P.w2p.y-=.1*lr;P.wr.x+=.7*lr;P.w2r.x+=.7*lr;
 P.wp.y-=(1-sw)*.3;P.w2p.y-=(1-sw)*.3;P.wr.x+=(1-sw)*.9;P.w2r.x+=(1-sw)*.9;
 P.wp.z-=kR*.05;P.wr.x-=kR*.1;P.w2p.z-=kL*.05;P.w2r.x-=kL*.1;
 const rq=c.rq==null?-1:c.rq,mh=W.magSize?W.magSize.y:d.mg[1],w=W.well;
 if(rq>=0){const tl=tilt(rq);P.wr.z+=tl*.6;P.wr.x+=tl*.5;P.w2r.z-=tl*.6;P.w2r.x+=tl*.5;P.wp.x+=.05*tl;P.w2p.x-=.05*tl;P.wp.y-=.05*tl;P.w2p.y-=.05*tl}
 _qa.setFromEuler(P.wr);_m4.compose(P.wp,_qa,_one);
 _qb.setFromEuler(P.w2r);_m4b.compose(P.w2p,_qb,_one);
 P.rh.copy(W.gR).applyMatrix4(_m4);
 P.lh.copy(W.gR).applyMatrix4(_m4b);P.lhOn=false;
 // Takılı GLB şarjörün üstüne ikinci kutu şarjör çizme; yalnız değişim sırasında ayır.
 P.magAtt=rq<.4||rq>=.85;P.magV=true;P.mag2V=true;
 P.magQ.copy(_qa);P.mag2Q.copy(_qb);
 P.magP.set(w.x,w.y,w.z).applyMatrix4(_m4);
 P.mag2P.set(w.x,w.y,w.z).applyMatrix4(_m4b);
 if(rq<.3)h.dropped=false;
 if(rq>=.4&&rq<.5){P.magV=false;P.mag2V=false;if(!h.dropped){h.dropped=true;spawnMagProp(h,1);spawnMagProp(h,2)}}
 else if(rq>=.5&&rq<.85){const u=ease((rq-.5)/.35);
  _pOut.set(w.x,w.y-mh*2,w.z).applyMatrix4(_m4);P.magP.lerpVectors(_pOut,P.magP,u);
  _pOut.set(w.x,w.y-mh*2,w.z).applyMatrix4(_m4b);P.mag2P.lerpVectors(_pOut,P.mag2P,u)}
}

/* Savurma: 3'lü kombo (yatay, ters çapraz, yukarıdan aşağı). Önce geri çekiş, sonra hızlı vuruş, devam hareketi, toparlanma */
const SWK={
 one:[{w:[-.3,.05,-.06,-.1,-1.0,-.55],s:[.55,-.02,.22,0,1.25,.55]},
      {w:[.38,-.12,-.04,.35,1.25,.95],s:[-.52,.17,.2,-.2,-1.1,-.7]},
      {w:[.12,.4,-.12,-1.35,0,.1],s:[.15,-.28,.4,1.0,0,-.05]},
      {w:[.32,.02,-.1,.1,-1.9,-.6],s:[-.7,.05,.3,-.1,2.1,.8]}],
 two:[{w:[-.28,.02,-.08,-.2,-1.2,-.4],s:[.6,-.06,.25,.15,1.45,.45]},
      {w:[.34,-.04,-.05,.3,1.35,.7],s:[-.55,.05,.22,-.1,-1.3,-.5]},
      {w:[0,.5,-.15,-1.55,0,0],s:[.05,-.35,.45,1.1,0,0]},
      {w:[.28,.05,-.1,.15,-2.0,-.5],s:[-.62,0,.34,-.1,2.2,.6]}],
 rev:[{w:[.12,.02,-.02,0,.8,.3],s:[-.5,.06,.2,0,-1.3,-.3]},
      {w:[-.4,-.05,.0,.25,-1.0,-.5],s:[.45,.1,.18,-.3,1.2,.5]},
      {w:[-.1,.35,-.1,-.9,.2,.2],s:[.1,-.3,.3,.9,-.2,-.1]},
      {w:[.3,.0,-.1,0,1.9,.5],s:[-.7,.05,.3,0,-2.0,-.6]}]
};
/* tutuş: 0 düz (tek el), 1 ters (tek el), 2 çift el. Büyük kılıç hep çift el, bıçak çift el olmaz */
function gripOf(d,g){const pk=d.pose||d.hold;if(pk==='gsword')return 2;if(g==null)g=0;if(pk==='knife'&&g===2)g=0;return g}
const _swd=[0,0,0,0,0,0];
function swingD(d,u,combo,grip){
 const pk=d.pose||d.hold,g=gripOf(d,grip),K=(g===2?SWK.two:g===1?SWK.rev:SWK.one)[((combo||0)%4+4)%4],w=K.w,s=K.s,amp=pk==='knife'?.75:1.22;
 const a=Math.max(.12,d.hitT-.15),b=d.hitT+.05;
 for(let i=0;i<6;i++){
  let v;
  if(u<a){const x=u/a;v=w[i]*(ease(x)+.1*Math.sin(x*Math.PI))}
  else if(u<b){const t=(u-a)/(b-a);v=lerp(w[i]*1.0,s[i],1-Math.pow(1-t,4.5))}
  else if(u<.78)v=s[i]*(1+.14*(u-b)/(.78-b));
  else v=s[i]*(1+.14)*(1-ease((u-.78)/.22));
  _swd[i]=v*amp;
 }
 return _swd;
}
function poseMelee(h,c){
 const W=h.W,k=h.wk,d=WP[k],pk=d.pose||k,t=c.t||0,sw=c.sw==null?1:c.sw,lr=c.lr||0,bob=c.bob||0,u=c.swing==null?-1:c.swing,g=gripOf(d,c.grip);
 let ix,iy,iz,irx,iry=0,irz=0;
 if(g===1){ix=-.24;iy=-.04;iz=.3;irx=Math.PI-.55;iry=-.12;irz=0}
 else if(g===2){ix=-.12;iy=-.08;iz=.2;irx=pk==='gsword'?-1.15:-1.0}
 else if(pk==='knife'){ix=-.15;iy=-.2;iz=.3;irx=-.35}
 else{ix=-.18;iy=-.15;iz=.28;irx=-.6}
 P.wp.set(ix,iy,iz);P.wr.set(irx,iry,irz);
 P.wp.y+=Math.sin(t*1.6)*.004+Math.sin(t*9)*.01*bob;P.wp.x+=Math.cos(t*.8)*.003;
 P.wp.y-=.08*lr;P.wr.x+=.4*lr;
 P.wp.y-=(1-sw)*.3;P.wr.x+=(1-sw)*.9;
 if(u>=0){const q=swingD(d,u,c.combo,c.grip);P.wp.set(ix+q[0],iy+q[1],iz+q[2]);P.wr.set(irx+q[3],iry+q[4],irz+q[5])}
 _qa.setFromEuler(P.wr);_m4.compose(P.wp,_qa,_one);
 P.rh.copy(W.gR).applyMatrix4(_m4);
 if(g===2){P.lh.copy(W.gL).applyMatrix4(_m4);P.lhOn=true}
 else{P.lhOn=false;P.lh.set(.16+Math.sin(t*1.3)*.005,-.24+Math.sin(t*1.6)*.006,.16)}
 P.magAtt=false;P.magV=false;P.mag2V=false;
}

function applyPose(h,c){
 const W=h.W,d=WP[h.wk];
 if(d.hold==='dual')poseDual(h,c);else if(d.melee)poseMelee(h,c);else poseGun(h,c);
 W.g.position.copy(P.wp);W.g.rotation.copy(P.wr);
 if(W.g2){W.g2.position.copy(P.w2p);W.g2.rotation.copy(P.w2r)}
 if(W.mag){
  if(P.magAtt&&d.hold!=='dual'){P.magP.set(W.well.x,W.well.y,W.well.z).applyMatrix4(_m4);P.magQ.copy(_qa)}
  W.mag.visible=P.magV&&!(W.hideMag&&P.magAtt);W.mag.position.copy(P.magP);W.mag.quaternion.copy(P.magQ);
 }
 if(W.mag2){W.mag2.visible=P.mag2V&&!(W.hideMag&&P.magAtt);W.mag2.position.copy(P.mag2P);W.mag2.quaternion.copy(P.mag2Q)}
 if(W.nativeMag)W.nativeMag.visible=P.magAtt;
 if(W.nativeMag2)W.nativeMag2.visible=P.magAtt;
 if(W.flash)W.flash.visible=(c.flash||0)>0;
 if(W.flash2)W.flash2.visible=(c.flashL||0)>0;
}
function driveHolder(h,c){
 const fw=h.freeW||0;
 if(!h.W){
  if(fw>.01&&h.fR){solveArm(h.armR,h.fR);solveArm(h.armL,h.fL)}
  return;
 }
 applyPose(h,c);
 const W=h.W,vis=fw<.6;
 if(W.g.visible!==vis){W.g.visible=vis;if(W.g2)W.g2.visible=vis}
 h.aim.updateMatrix();
 const isFP=typeof VM!=='undefined'&&VM.h===h;
 _tv.copy(P.rh).applyMatrix4(h.aim.matrix);if(fw>.01&&h.fR)_tv.lerp(h.fR,fw);solveArm(h.armR,_tv);
 if(isFP)_tR.copy(_tv);
 _tv.copy(P.lh).applyMatrix4(h.aim.matrix);if(fw>.01&&h.fL)_tv.lerp(h.fL,fw);solveArm(h.armL,_tv);
 /* birinci şahıs nişan: eller nişangahı kapatmasın (Valorant/CS gibi: nişanda eller görünmez, kalçada görünür) */
 if(isFP){const sv=(c.ads||0)<.45;h.armR.sh.visible=sv;h.armL.sh.visible=sv;
  if(fphDrive(h,sv)){h.armR.el.updateWorldMatrix(true,false);h.armL.el.updateWorldMatrix(true,false);
   fphPlace(h.fph.R,h.fph.root,h.armR,_tR,h.aim.matrix,FPH.bR,FPH.rollR,FPH.dR);fphPlace(h.fph.L,h.fph.root,h.armL,_tv,h.aim.matrix,FPH.bL,FPH.rollL,P.lhOn!==false?FPH.dL:null)}}
}
/* ----- Birinci şahıs el modeli: fp_hands (FPS Military Hands, Electrogamer777, CC-BY 4.0) -----
   Model kemiksiz iki önkol+eldiven. Her kol ayrı parça yapılır; her karede yumruk merkezi tutuş noktasına (P.rh / P.lh)
   konur, önkol dirseğe doğru çevrilir, elin sırtı silaha göre döndürülür (FPH.bR / FPH.bL: aim uzayında yön).
   Yüklenemezse eski kutu kollar kalır. */
const FPH={ready:false,tried:false,R:null,L:null,len:.36,bR:[-1,.35,0],bL:[.55,-1,0],rollR:0,rollL:0,
 dR:[-.35,-.6,-.7],dL:[.45,-.55,-.7]}; /* dR/dL: yumruktan dirseğe yön (aim uzayında: -x sağ, +y yukarı, +z ileri) */
function fphSplit(g){
 const n=g.index?g.toNonIndexed():g,P=n.attributes.position,names=Object.keys(n.attributes),out={L:{},R:{}};
 for(const k of names){out.L[k]=[];out.R[k]=[]}
 for(let t=0;t<P.count;t+=3){
  const cx=(P.getX(t)+P.getX(t+1)+P.getX(t+2))/3,side=cx<0?'R':'L'; /* ileri +Z, yukarı +Y bakınca sağ taraf -X */
  for(const k of names){const A=n.attributes[k];for(let v=t;v<t+3;v++)for(let c=0;c<A.itemSize;c++)out[side][k].push(A.array[v*A.itemSize+c])}
 }
 const mk=o=>{const q=new THREE.BufferGeometry();for(const k of names)if(o[k].length)q.setAttribute(k,new THREE.Float32BufferAttribute(o[k],n.attributes[k].itemSize));return q};
 return {L:mk(out.L),R:mk(out.R)};
}
function fphBuild(scene){
 scene.updateMatrixWorld(true);
 const parts={L:[],R:[]};
 scene.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);const sp=fphSplit(g);
  const mat=new THREE.MeshLambertMaterial({map:o.material.map||null,side:THREE.DoubleSide});
  for(const k of ['L','R'])if(sp[k].attributes.position&&sp[k].attributes.position.count)parts[k].push({g:sp[k],mat})});
 for(const k of ['L','R']){
  /* yumruk merkezi (en öndeki %28) ve dirsek ucu (en arkadaki %6) */
  let zmin=1e9,zmax=-1e9;for(const p of parts[k]){const P=p.g.attributes.position;for(let i=0;i<P.count;i++){const z=P.getZ(i);if(z<zmin)zmin=z;if(z>zmax)zmax=z}}
  const C=V3(),E=V3();let nc=0,ne=0;const L0=zmax-zmin;
  for(const p of parts[k]){const P=p.g.attributes.position;for(let i=0;i<P.count;i++){const z=P.getZ(i);if(z>zmax-.28*L0){C.x+=P.getX(i);C.y+=P.getY(i);C.z+=z;nc++}if(z<zmin+.06*L0){E.x+=P.getX(i);E.y+=P.getY(i);E.z+=z;ne++}}}
  C.divideScalar(nc);E.divideScalar(ne);
  const f=C.clone().sub(E),len=f.length();f.normalize();
  const u=V3(0,1,0).addScaledVector(f,-f.y).normalize(),r=V3().crossVectors(u,f);
  /* model → yerel: yumruk orijinde, önkol -Z yönünde (dirsek arkada), elin sırtı +Y */
  const B=new THREE.Matrix4().makeBasis(r,u,f).invert(),sc=FPH.len/len;
  const M=new THREE.Matrix4().makeScale(sc,sc,sc).multiply(B).multiply(new THREE.Matrix4().makeTranslation(-C.x,-C.y,-C.z));
  const grp=new THREE.Group();
  for(const p of parts[k]){p.g.applyMatrix4(M);const m=new THREE.Mesh(p.g,p.mat);m.frustumCulled=false;grp.add(m)}
  FPH[k]=grp;
 }
 FPH.ready=true;
}
function fphLoad(){
 if(FPH.tried||typeof mdlScript!=='function')return;FPH.tried=true;
 mdlScript('fp_hands',ok=>{
  if(!ok){console.warn('fp_hands yüklenemedi: kutu kollar kullanılıyor');return}
  try{new THREE.GLTFLoader().parse(mdlB64(NPNG_G.fp_hands),'',gl=>{try{fphBuild(gl.scene)}catch(e){console.warn('fp_hands',e)}},e=>console.warn('fp_hands',e))}catch(e){console.warn('fp_hands',e)}
 });
}
const _fT=V3(),_fE=V3(),_fF=V3(),_fU=V3(),_fX=V3(),_fA=V3(),_fM=new THREE.Matrix4();
/* bir kol: hedef (kök uzayında), kol (dirsek için), aim matrisi (silahın eksenleri), elin sırtı (aim uzayında), ek dönüş */
function fphPlace(mesh,root,arm,tgt,aimM,back,roll,dir){
 _fT.copy(tgt);
 if(dir){_fF.set(-dir[0],-dir[1],-dir[2]).transformDirection(aimM)}
 else{arm.el.getWorldPosition(_fE);root.worldToLocal(_fE);_fF.copy(_fT).sub(_fE)}if(_fF.lengthSq()<1e-6)_fF.set(0,0,1);_fF.normalize();
 _fA.set(back[0],back[1],back[2]).transformDirection(aimM);
 _fU.copy(_fA).addScaledVector(_fF,-_fA.dot(_fF));if(_fU.lengthSq()<1e-6)_fU.set(0,1,0);_fU.normalize();
 if(roll){_fX.crossVectors(_fU,_fF);_fU.multiplyScalar(Math.cos(roll)).addScaledVector(_fX,Math.sin(roll)).normalize()}
 _fX.crossVectors(_fU,_fF);
 _fM.makeBasis(_fX,_fU,_fF).setPosition(_fT);
 mesh.matrixAutoUpdate=false;mesh.matrix.copy(_fM);mesh.matrixWorldNeedsUpdate=true;
}
function fphDrive(h,sv){
 if(!FPH.ready){fphLoad();return false}
 const root=h.aim.parent;
 if(!h.fph||h.fph.root!==root){
  if(h.fph){h.fph.root.remove(h.fph.R);h.fph.root.remove(h.fph.L)}
  h.fph={root,R:FPH.R.clone(),L:FPH.L.clone()};root.add(h.fph.R);root.add(h.fph.L);
  for(const a of [h.armR,h.armL])a.sh.traverse(o=>{if(o.isMesh)o.visible=false}); /* kutu kolları gizle */
 }
 h.fph.R.visible=sv;h.fph.L.visible=sv;
 return true;
}
function muzzleWorld(h,out,side){
 const W=h.W,g=(side===2&&W.g2)?W.g2:W.g;
 g.updateWorldMatrix(true,false);
 return out.copy(W.mz).applyMatrix4(g.matrixWorld);
}

/* ----- Düşen şarjör parçaları ----- */
const props=[];
function spawnMagProp(h,which){
 if(window.BGMODE)return;
 if(!SET.fx)return;
 const m=which===2?h.W.mag2:h.W.mag;if(!m)return;
 const p=m.clone(true);p.visible=true;
 m.updateWorldMatrix(true,false);
 m.matrixWorld.decompose(p.position,p.quaternion,p.scale);
 S.add(p);
 props.push({m:p,v:V3(rnd(-.8,.8),rnd(.2,1.2),rnd(-.8,.8)),w:V3(rnd(-6,6),0,rnd(-6,6)),t:3});
}
function updProps(dt){
 for(let i=props.length-1;i>=0;i--){
  const q=props[i];q.t-=dt;q.v.y-=14*dt;
  q.m.position.addScaledVector(q.v,dt);q.m.rotation.x+=q.w.x*dt;q.m.rotation.z+=q.w.z*dt;
  if(q.m.position.y<.04){q.m.position.y=.04;q.v.y*=-.35;q.v.x*=.6;q.v.z*=.6;q.w.multiplyScalar(.6)}
  if(q.t<=0){S.remove(q.m);props.splice(i,1)}
 }
}
