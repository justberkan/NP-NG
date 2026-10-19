'use strict';
/* ===== Açık dünya: arazi, kamplar, seviyeli moblar ===== */
const OWH=450,OWCHK=150,OW_ACT=95,OW_DEACT=125,OW_MAXACT=36;
const OW={on:false,built:false,camps:[],mobs:[],act:[],dead:[],solids:[],ground:null,root:null,grid:null,arena:null,bmap:null,
 medCd:0,perfT:0,hitT:99,t:0,sT:0,saveT:0,lastHp:-1,map:false,zone:'',zoneL:1};
const BN=['Yeşil Vadi','Kızıl Çöl','Buz Ovası','Kasvetli Bataklık','Kül Diyarı'];
const BCOLH=[0x5f9a47,0xd2b56c,0xe4edf2,0x4a6a45,0x4a3d3a];
const BRGB=BCOLH.map(h=>[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255]);
const owXpNeed=l=>Math.round((40+18*l+.9*l*l)*(1.6+l*.09));
const owMax=()=>100+(SV.ow.lvl-1)*7;
const owDmgMul=()=>1+(SV.ow.lvl-1)*.05;
/* seviye farkı: güçlü mobdan hasar azalır, mob oyuncuya daha çok vurur */
const owLvDef=m=>clamp(1-.07*(m.L-SV.ow.lvl),.25,1.35),owLvAtk=m=>clamp(1+.1*(m.L-SV.ow.lvl),.5,3);
const owZoneL=(x,z)=>Math.max(1,Math.floor((Math.hypot(x,z)-30)/11));
function mul32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ----- Arazi yüksekliği: köy çevresi düz, uzaklaştıkça yumuşak tepeler ----- */
function owH(x,z){
 const d=Math.hypot(x,z);if(d<28)return 0;
 const f=Math.min(1,(d-28)/45),s=f*f*(3-2*f);
 return s*(Math.sin(x*.011+1.3)*Math.cos(z*.009+.4)*3.4+Math.sin(x*.027+z*.019)*1.5+Math.sin(z*.036-x*.021+2)*.8+Math.cos(x*.061)*Math.sin(z*.057)*.4);
}
/* Biyom ağırlıkları: 0 vadi, 1 çöl(doğu), 2 buz(kuzey), 3 bataklık(batı), 4 kül(güney) */
function owBW(x,z){
 const d=Math.hypot(x,z),t=clamp((d-110)/110,0,1),a=Math.atan2(z,x),c=Math.cos(a),s=Math.sin(a);
 return[1-t,t*Math.pow(Math.max(0,c),2),t*Math.pow(Math.max(0,-s),2),t*Math.pow(Math.max(0,-c),2),t*Math.pow(Math.max(0,s),2)];
}
function owBiome(x,z){const b=owBW(x,z);let bi=0;for(let i=1;i<5;i++)if(b[i]>b[bi])bi=i;return bi}
function owGroundCol(x,z,h){
 const w=owBW(x,z);let r=0,g=0,b=0;
 for(let i=0;i<5;i++){if(!w[i])continue;const c=BRGB[i];r+=c[0]*w[i];g+=c[1]*w[i];b+=c[2]*w[i]}
 const n=.9+.2*(Math.sin(x*.31+z*.17)*Math.sin(z*.23-x*.11)*.5+.5),k=n*(1+h*.015)*.8;
 r*=k;g*=k;b*=k;
 if(w[4]>.45&&Math.sin(x*.07)*Math.sin(z*.083+1)*Math.sin((x+z)*.05)>.62){r=.85;g=.32;b=.07}
 return[r,g,b];
}

/* ----- Yaratık türleri (hepsi yakın dövüşçü; görseldeki zombi / mutant / zırhlı dev havası) ----- */
const CB=(o)=>Object.assign({gl:0x2a2a25,bo:0x1a1a16,h:0x2a2d22},o);
/* sırt dikenleri, omuz dikenleri, boynuz yardımcıları */
const spineSp=(c,n,h)=>{const a=[];for(let i=0;i<n;i++)a.push({w:.05,h:(h||.16)+(i%2)*.05,d:.05,x:(i%2?.09:-.09),y:.14+i*(.36/Math.max(1,n-1)),z:-.15,c});return a};
const shSp=(c,h)=>[{w:.07,h:h||.2,d:.07,x:-.27,y:.56,z:0,c},{w:.07,h:h||.2,d:.07,x:.27,y:.56,z:0,c},{w:.05,h:(h||.2)*.7,d:.05,x:-.3,y:.52,z:.06,c},{w:.05,h:(h||.2)*.7,d:.05,x:.3,y:.52,z:.06,c}];
const horns=(c,h)=>[{w:.04,h:h||.13,d:.04,x:-.08,y:.34,z:.02,c},{w:.04,h:h||.13,d:.04,x:.08,y:.34,z:.02,c}];
const MT={
 zom:{n:'Çürük Zombi',hp:1,dmg:1,sp:1,cols:CB({j:0x6b5a45,j2:0x5d4e3b,pa:0x3a3a35,v:0x4a4033,v2:0x3a3228,sk:0x9a6a55,ey:0xff3030,pu:0xc00000,sc:1})},
 gob:{n:'Goblin',hp:.8,dmg:.9,sp:1.15,cols:CB({j:0x4f6b2a,j2:0x44601f,pa:0x3a2f1d,v:0x6b4a2b,v2:0x553a20,sk:0x6fb04a,ey:0xffe14d,pu:0xc0261d,sc:.82,hd:[{w:.1,h:.05,d:.04,x:-.15,y:.21,z:0,c:0x6fb04a},{w:.1,h:.05,d:.04,x:.15,y:.21,z:0,c:0x6fb04a}]})},
 ske:{n:'İskelet Savaşçı',hp:.9,dmg:1.1,sp:1.1,cols:CB({j:0xd8d0b8,j2:0xcdc4aa,pa:0xbdb59c,v:0xcfc7b0,v2:0xb5ad94,sk:0xe8e2cf,ey:0x111111,pu:0xffa020,sc:1,bd:[{w:.3,h:.03,d:.02,x:0,y:.4,z:.125,c:0x7a7260},{w:.3,h:.03,d:.02,x:0,y:.3,z:.125,c:0x7a7260},{w:.3,h:.03,d:.02,x:0,y:.2,z:.125,c:0x7a7260}]})},
 mum:{n:'Mumya',hp:1.1,dmg:1,sp:.9,cols:CB({j:0xd9cfae,j2:0xcfc3a0,pa:0xcfc3a0,v:0xc9bd98,v2:0xb8ac88,sk:0xcfc3a0,ey:0x30e0ff,pu:0x108aa0,bo:0x6b5a3a})},
 ice:{n:'Buz Zombisi',hp:1.2,dmg:1.05,sp:.95,cols:CB({j:0xaed6e8,j2:0x9ac6da,pa:0x7aa6c0,v:0x8fc0d8,v2:0x7ab0c8,sk:0xcfe8f5,ey:0x30e0ff,pu:0x1a90c0,sc:1.05,bo:0x4a6a80,bd:shSp(0xe8f6ff,.18)})},
 don:{n:'Don Devi',hp:1.7,dmg:1.3,sp:.8,cols:CB({j:0x7aa6c0,j2:0x6a96b0,pa:0x5a86a0,v:0x9ac6da,v2:0x7ab0c8,sk:0xbfe0f0,ey:0x7ff0ff,pu:0x28c0ff,sc:1.32,bo:0x3a5a70,bd:shSp(0xeaf8ff,.3).concat(spineSp(0xeaf8ff,4,.2)),hd:horns(0xeaf8ff,.15)})},
 swp:{n:'Bataklık Yaratığı',hp:1.1,dmg:1,sp:1,cols:CB({j:0x3b4a3a,j2:0x33423a,pa:0x2c3a2c,v:0x2f3d2e,v2:0x263325,sk:0x5d7f4a,ey:0xb0ff40,pu:0x5a9a10,bo:0x1a2418})},
 tox:{n:'Zehirli Mutant',hp:1.3,dmg:1.15,sp:.95,cols:CB({j:0x3a5a2a,j2:0x32502a,pa:0x2a3a22,v:0x44662c,v2:0x34502a,sk:0x6fa040,ey:0xd0ff40,pu:0x80c000,sc:1.12,bo:0x1a2418,bd:spineSp(0xd8e890,6,.2).concat(shSp(0xd8e890,.16))})},
 lav:{n:'Lav Canavarı',hp:1.2,dmg:1.15,sp:.95,cols:CB({j:0x4a1e16,j2:0x3e1812,pa:0x2c1410,v:0x5a2418,v2:0x3a1810,sk:0x7a2a1a,ey:0xffa020,pu:0xff4000,sc:1.15,bo:0x1a0c08,bd:shSp(0xff7a1a,.2)})},
 mut:{n:'Kızıl Mutant',hp:1.35,dmg:1.25,sp:.95,cols:CB({j:0x5a2820,j2:0x4a201a,pa:0x2a1612,v:0x7a3224,v2:0x5a2418,sk:0x8a3a2c,ey:0xff2a1a,pu:0xff2a1a,sc:1.2,bo:0x1a0c08,bd:spineSp(0xd8c8b0,7,.22).concat(shSp(0xd8c8b0,.22)),hd:horns(0xd8c8b0,.16)})},
 /* Minecraft zombisi (açık dünya yaban sürüleri, Berkan 2026-10-20): model assets/corridor/minecraft_zombie.glb (CC BY 4.0, JoohnElkes);
    model yüklenmeden etkinleşen olursa aynı renklerde bloklu insan çizilir. hostile: yakına geleni kendisi kovalar */
 mcz:{n:'Minecraft Zombi',hp:.9,dmg:.95,sp:1.05,mc:true,hostile:9,cols:CB({j:0x2f9a9a,j2:0x2a8c8c,pa:0x3b3f9a,v:0x2f9a9a,v2:0x2a8c8c,sk:0x5f9a4a,ey:0x101010,pu:0x101010,bo:0x4a4a4a,nohat:1})},
 /* zırhlı dev: kızıl gözlü, göğsünde parlayan çekirdek, omuz zırhı */
 gol:{n:'Zırhlı Dev',hp:2.1,dmg:1.5,sp:.7,cols:CB({j:0x2b2d33,j2:0x24262c,pa:0x1e2025,v:0x3a3d45,v2:0x2a2c33,sk:0x5a4a48,ey:0xff2a1a,pu:0xff4a30,sc:1.55,bo:0x15161a,nohat:1,
  bd:[{w:.14,h:.14,d:.03,x:0,y:.33,z:.13,c:0xff3020},{w:.16,h:.14,d:.16,x:-.28,y:.52,z:0,c:0x4a4e58},{w:.16,h:.14,d:.16,x:.28,y:.52,z:0,c:0x4a4e58},{w:.1,h:.1,d:.1,x:-.28,y:.62,z:0,c:0x5a5f6a},{w:.1,h:.1,d:.1,x:.28,y:.62,z:0,c:0x5a5f6a}].concat(spineSp(0x6a4a44,5,.18)),
  hd:[{w:.23,h:.08,d:.25,x:0,y:.29,z:0,c:0x3a3d45},{w:.04,h:.1,d:.04,x:-.1,y:.36,z:.02,c:0x6a4a44},{w:.04,h:.1,d:.04,x:.1,y:.36,z:.02,c:0x6a4a44}]})}
};
const BMOB=[['zom','gob'],['ske','mum'],['ice','don'],['swp','tox'],['lav','mut']];
const tierCol=L=>L<10?0x4dff6a:L<20?0xffe14d:L<35?0xff9a2a:0xff3b3b;

/* ----- Çarpışma ve görsel parçalar ----- */
function owBuild(){
 const r=mul32(20260);
 const CP={};
 const cadd=(x,z,parts)=>{const k=Math.floor((x+OWH)/OWCHK)+','+Math.floor((z+OWH)/OWCHK);const a=CP[k]||(CP[k]=[]);for(const q of parts)a.push(q)};
 const UB=new THREE.BoxGeometry(1,1,1),PM=new THREE.MeshBasicMaterial();
 function solid(x,z,w,d,h){
  const hs=[owH(x-w/2,z-d/2),owH(x+w/2,z-d/2),owH(x-w/2,z+d/2),owH(x+w/2,z+d/2)],lo=Math.min(hs[0],hs[1],hs[2],hs[3]),hi=Math.max(hs[0],hs[1],hs[2],hs[3]),top=hi+h;
  const m=new THREE.Mesh(UB,PM);m.scale.set(w,top-lo,d);m.position.set(x,(top+lo)/2,z);m.matrixAutoUpdate=false;m.updateMatrix();m.matrixWorld.copy(m.matrix);
  OW.solids.push({m,x1:x-w/2,x2:x+w/2,z1:z-d/2,z2:z+d/2,h:top});
  return{lo,top};
 }
 /* --- Köy (başlangıç, güvenli iyileşme alanı) --- */
 {
  const pool=solid(0,0,3.4,3.4,.7);
  cadd(0,0,[{w:3.4,h:.9,d:3.4,x:0,y:.35,z:0,c:0x8a9096},{w:2.8,h:.1,d:2.8,x:0,y:.78,z:0,c:0x3a8ad8},{w:.6,h:2,d:.6,x:0,y:1.3,z:0,c:0xa9afb5},{w:1,h:.3,d:1,x:0,y:2.4,z:0,c:0x4aa8ff}]);
  const wallC=[0xc9b48a,0xb8c4cf,0xd9a679,0xa9c29a,0xc9a0a0,0xb9b2d8];
  for(let i=0;i<6;i++){
   const a=i/6*Math.PI*2+.3,x=Math.cos(a)*21,z=Math.sin(a)*21,top=solid(x,z,6,6,3.2).top;
   cadd(x,z,[{w:6,h:3.4,d:6,x,y:top-1.6,z,c:wallC[i]},{w:7,h:.6,d:7,x,y:top+.3,z,c:0x9a3a2a},{w:5,h:.5,d:5,x,y:top+.8,z,c:0x7a2c20},{w:1.1,h:2,d:.1,x:x+Math.cos(a+Math.PI)*0,y:1,z:z+3.02,c:0x4a3220}]);
  }
  for(let i=0;i<4;i++){const a=i*1.7+.5,x=Math.cos(a)*9,z=Math.sin(a)*9;solid(x,z,1.2,1.2,1.1);cadd(x,z,[{w:1.2,h:1.1,d:1.2,x,y:.55,z,c:0xb8864b},{w:1.25,h:.12,d:1.25,x,y:.9,z,c:0x8a6030}])}
  void pool;
 }
 /* --- Kamplar --- */
 const centers=[];
 for(let k=0;k<6;k++){const a=k*Math.PI/3+r()*.6,dd=58+r()*10;centers.push({x:Math.cos(a)*dd,z:Math.sin(a)*dd})}
 for(let t=0;centers.length<96&&t<9000;t++){
  const x=(r()*2-1)*(OWH-40),z=(r()*2-1)*(OWH-40);
  if(Math.hypot(x,z)<52)continue;
  if(centers.some(q=>Math.hypot(q.x-x,q.z-z)<46))continue;
  centers.push({x,z});
 }
 centers.forEach((c,ci)=>{
  const L0=owZoneL(c.x,c.z),bi=owBiome(c.x,c.z),boss=L0>=5&&r()<.14;
  const camp={id:ci,x:c.x,z:c.z,L:L0,bi,boss,mem:[]};
  const cnt=boss?1:3+Math.floor(r()*3)+(L0>25&&r()<.5?1:0);
  const list=BMOB[bi],prim=list[Math.floor(r()*2)];
  for(let i=0;i<cnt;i++){
   let tk=r()<.7?prim:list[0]===prim?list[1]:list[0];
   if(L0>=8&&r()<.16&&!boss)tk='gol';
   const a=i/cnt*Math.PI*2+r()*.5,rr=2.4+r()*2.6,hx=boss?c.x:c.x+Math.cos(a)*rr,hz=boss?c.z-9:c.z+Math.sin(a)*rr;
   const isBoss=boss&&i===0;
   const L=Math.max(1,L0+Math.floor(r()*3)-1+(isBoss?5:0)+(tk==='gol'?1:0));
   const def=MT[tk];
   const max=Math.round((60+L*38)*def.hp*(isBoss?16:1));
   const m={id:OW.mobs.length,camp,tk,def,L,boss:isBoss,hp:max,max,x:hx,z:hz,hx,hz,yaw:r()*6.28,state:'idle',tx:null,tz:null,wt:r()*4,respT:0,
    dmg:(4+L*.65)*def.dmg*(isBoss?1.6:1),dmgR:(3+L*.5)*def.dmg*(isBoss?1.5:1),spd:Math.min(4.9,(2.6+Math.min(1.6,L*.04))*def.sp),
    sc:isBoss?Math.max(1,def.cols.sc||1)*3:(def.cols.sc||1)*(.95+r()*.1),name:(isBoss?'BOSS ':'')+def.n,
    g:null,rig:null,cd:r(),atk:0,flinch:0,kk:0,flash:0,adsT:0,rs:0,dir:1,ph0:r()*10,mob:true,team:2,kind:'m',agT:0};
   m.hp=m.max;
   camp.mem.push(m);OW.mobs.push(m);
  }
  OW.camps.push(camp);
  if(boss)owBossGlyph(c.x,c.z-9,bi);
  /* kamp süsleri: ateş çukuru, çadır, kasa, bayrak */
  const fc=[0x8a8f94,0xb59a6a,0x9fb2c0,0x4e5a50,0x2b2523][bi];
  cadd(c.x,c.z,[{w:.5,h:.5,d:.5,x:c.x,y:owH(c.x,c.z)+.25,z:c.z,c:0xff8a20},{w:.2,h:.1,d:1.1,x:c.x,y:owH(c.x,c.z)+.05,z:c.z,c:0x4a3220},
   {w:.45,h:.35,d:.45,x:c.x+1,y:owH(c.x+1,c.z)+.17,z:c.z,c:fc},{w:.45,h:.35,d:.45,x:c.x-1,y:owH(c.x-1,c.z)+.17,z:c.z,c:fc},{w:.45,h:.35,d:.45,x:c.x,y:owH(c.x,c.z+1)+.17,z:c.z+1,c:fc},{w:.45,h:.35,d:.45,x:c.x,y:owH(c.x,c.z-1)+.17,z:c.z-1,c:fc}]);
  const tx=c.x+7,tz=c.z-3,tt=solid(tx,tz,3.2,2.6,1.7);
  cadd(tx,tz,[{w:3.2,h:tt.top-tt.lo+.3,d:2.6,x:tx,y:(tt.top+tt.lo)/2-.15,z:tz,c:[0xb08a5a,0xd8c08a,0xc8d6e0,0x5a6a4a,0x6a3a2a][bi]},{w:2.4,h:.7,d:2,x:tx,y:tt.top+.35,z:tz,c:0x6a4a2a}]);
  const kx=c.x-6,kz=c.z+4,kt=solid(kx,kz,1.1,1.1,1);
  cadd(kx,kz,[{w:1.1,h:1.2,d:1.1,x:kx,y:kt.top-.5,z:kz,c:0xb8864b},{w:1.15,h:.1,d:1.15,x:kx,y:kt.top-.05,z:kz,c:0x8a6030}]);
  const fx=c.x+4,fz=c.z+6,fh=owH(fx,fz),ph=boss?8:5.5;
  cadd(fx,fz,[{w:.14,h:ph+.4,d:.14,x:fx,y:fh+ph/2-.2,z:fz,c:0x3a2c20},{w:1.4,h:.8,d:.06,x:fx+.7,y:fh+ph-.5,z:fz,c:boss?0xb040ff:tierCol(L0)}]);
  camp.fx=fx;camp.fz=fz;
 });
 /* --- Ağaçlar ve kayalar --- */
 const near=(x,z,rad)=>{for(const c of OW.camps)if(Math.hypot(c.x-x,c.z-z)<rad)return true;return false};
 const dens=[.7,.3,.55,.8,.28];
 function tree(x,z,bi){
  /* uzun ağaç: GLB modeli (js/trees.js) örneklenir; gövde çarpışma kutusu + kanca için taç kutusu */
  const s=.8+r()*.6,H=10*s+3+r()*2,w=Math.max(1.1,H*.08);
  const t=solid(x,z,w,w,H*.9);
  const cw=H*.34,ch=H*.7,cy=t.lo+H*.27+ch/2;
  const cm=new THREE.Mesh(UB,PM);cm.scale.set(cw,ch,cw);cm.position.set(x,cy,z);cm.matrixAutoUpdate=false;cm.updateMatrix();cm.matrixWorld.copy(cm.matrix);
  (OW.canopy||(OW.canopy=[])).push(cm);
  (OW.trees||(OW.trees=[])).push({x,z,y:t.lo,H,bi,yaw:r()*6.28});
 }
 function rock(x,z,bi){
  const s=1.4+r()*2.6,w=s*(.8+r()*.5),d=s*(.8+r()*.5),h=s*(.5+r()*.6),col=[0x8a8f94,0xb59a6a,0x9fb2c0,0x4e5a50,0x2b2523][bi];
  const t=solid(x,z,w,d,h);
  const parts=[{w,h:t.top-t.lo+.3,d,x,y:(t.top+t.lo)/2-.15,z,c:col},{w:w*.6,h:h*.5,d:d*.6,x:x+w*.1,y:t.top+h*.2,z:z-d*.05,c:col+0x0a0a0a}];
  if(bi===4)parts.push({w:w*.5,h:.12,d:d*.5,x,y:t.top+.02,z,c:0xff6a1a});
  if(bi===2)parts.push({w:w*.9,h:.14,d:d*.9,x,y:t.top+.05,z,c:0xeaf2f6});
  cadd(x,z,parts);
 }
 for(let gx=-OWH+12;gx<OWH-12;gx+=21)for(let gz=-OWH+12;gz<OWH-12;gz+=21){
  const x=gx+r()*21,z=gz+r()*21,d=Math.hypot(x,z);
  if(d<36)continue;
  const bi=owBiome(x,z);
  if(r()>dens[bi]||near(x,z,13))continue;
  tree(x,z,bi);
 }
 for(let gx=-OWH+20;gx<OWH-20;gx+=55)for(let gz=-OWH+20;gz<OWH-20;gz+=55){
  const x=gx+r()*55,z=gz+r()*55;
  if(Math.hypot(x,z)<38||r()<.35||near(x,z,13))continue;
  rock(x,z,owBiome(x,z));
 }
 /* --- Çevre dağları (sadece görsel) --- */
 for(let side=0;side<4;side++)for(let k=-9;k<=9;k++){
  const t=k*52+(r()-.5)*20,off=OWH+22+r()*26,x=side<2?t:(side===2?-off:off),z=side<2?(side===0?-off:off):t;
  const w=60+r()*34,h=32+r()*34,y0=-8;
  cadd(x,z,[{w,h:h*.5,d:w,x,y:y0+h*.25,z,c:0x6a6f74},{w:w*.62,h:h*.45,d:w*.62,x,y:y0+h*.5+h*.2,z,c:0x7d8388},{w:w*.32,h:h*.35,d:w*.32,x,y:y0+h*.95+h*.15,z,c:0xf2f6fa}]);
 }
 /* --- Arazi mesh'i --- */
 const SEG=112,gg=new THREE.PlaneGeometry(OWH*2,OWH*2,SEG,SEG);gg.rotateX(-Math.PI/2);
 const pa=gg.attributes.position,col=new Float32Array(pa.count*3);
 for(let i=0;i<pa.count;i++){
  const x=pa.getX(i),z=pa.getZ(i),h=owH(x,z);pa.setY(i,h);
  const c=owGroundCol(x,z,h);col[i*3]=c[0];col[i*3+1]=c[1];col[i*3+2]=c[2];
 }
 gg.setAttribute('color',new THREE.BufferAttribute(col,3));
 gg.computeVertexNormals();gg.computeBoundingSphere();
 OW.root=new THREE.Group();
 OW.ground=new THREE.Mesh(gg,new THREE.MeshLambertMaterial({vertexColors:true}));
 OW.root.add(OW.ground);if(OW.glyphs)OW.glyphs.forEach(g=>OW.root.add(g));
 for(const k in CP){const m=mergeBoxes(CP[k]);OW.root.add(m)}
 S.add(OW.root);OW.root.visible=false;if(typeof owTreesInit==='function')owTreesInit();
 /* --- Çarpışma ızgarası --- */
 const cs=16,n=Math.ceil((OWH*2+60)/cs),o=OWH+30,gr={cs,n,o,c:new Array(n*n)};
 for(const b of OW.solids){
  for(let gx=Math.floor((b.x1-.6+o)/cs);gx<=Math.floor((b.x2+.6+o)/cs);gx++)for(let gz=Math.floor((b.z1-.6+o)/cs);gz<=Math.floor((b.z2+.6+o)/cs);gz++){
   if(gx<0||gz<0||gx>=n||gz>=n)continue;
   (gr.c[gz*n+gx]||(gr.c[gz*n+gx]=[])).push(b);
  }
 }
 OW.grid=gr;
 owWildPacks(gr);
 owBuildMap();
 OW.built=true;
}
/* ----- Yaban Minecraft zombi sürüleri (Berkan 2026-10-20: "açık dünya çok boş, Minecraft zombilerinden ekleyelim") -----
   Kamplar arasındaki boşluklara 2-4'lük sürüler. AYRI rastgele tohum ve OW.mobs SONUNA eklenir: eski mobların sırası
   (çevrimiçi eşleme bu sıraya göre) değişmez. Köye (45 m) girmez, kampların, ağaçların, kayaların üstüne düşmez. */
function owWildPacks(gr){
 const r=mul32(20261020),camps=OW.camps.slice(),packs=[];
 const blocked=(x,z,pad)=>{
  const gx=Math.floor((x+gr.o)/gr.cs),gz=Math.floor((z+gr.o)/gr.cs);
  if(gx<0||gz<0||gx>=gr.n||gz>=gr.n)return true;
  for(const b of gr.c[gz*gr.n+gx]||[])if(x>b.x1-pad&&x<b.x2+pad&&z>b.z1-pad&&z<b.z2+pad)return true;
  return false;
 };
 for(let t=0;packs.length<120&&t<12000;t++){
  const x=(r()*2-1)*(OWH-30),z=(r()*2-1)*(OWH-30);
  if(Math.hypot(x,z)<45||blocked(x,z,2))continue;
  if(camps.some(c=>Math.hypot(c.x-x,c.z-z)<22)||packs.some(q=>Math.hypot(q.x-x,q.z-z)<24))continue;
  packs.push({x,z});
 }
 const def=MT.mcz;
 for(const c of packs){
  const L0=owZoneL(c.x,c.z),camp={id:OW.camps.length,x:c.x,z:c.z,L:L0,bi:owBiome(c.x,c.z),boss:false,mem:[],wild:true};
  const cnt=2+Math.floor(r()*3);
  for(let i=0;i<cnt;i++){
   let hx=c.x,hz=c.z;
   for(let k=0;k<6;k++){const a=r()*6.2832,rr=1.5+r()*3.5;hx=c.x+Math.cos(a)*rr;hz=c.z+Math.sin(a)*rr;if(!blocked(hx,hz,.8))break;hx=c.x;hz=c.z}
   const L=Math.max(1,L0+Math.floor(r()*3)-1),max=Math.round((60+L*38)*def.hp);
   const m={id:OW.mobs.length,camp,tk:'mcz',def,L,boss:false,hp:max,max,x:hx,z:hz,hx,hz,yaw:r()*6.28,state:'idle',tx:null,tz:null,wt:r()*4,respT:0,
    dmg:(4+L*.65)*def.dmg,dmgR:(3+L*.5)*def.dmg,spd:Math.min(4.9,(2.6+Math.min(1.6,L*.04))*def.sp),
    sc:.95+r()*.1,name:def.n,g:null,rig:null,cd:r(),atk:0,flinch:0,kk:0,flash:0,adsT:0,rs:0,dir:1,ph0:r()*10,mob:true,team:2,kind:'m',agT:0};
   camp.mem.push(m);OW.mobs.push(m);
  }
  OW.camps.push(camp);
 }
}
/* Harita için biyom resmi (3 m/px) */
function owBuildMap(){
 const N=300,cv=document.createElement('canvas');cv.width=cv.height=N;
 const c=cv.getContext('2d'),im=c.createImageData(N,N);
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){
  const x=(i+.5)/N*OWH*2-OWH,z=(j+.5)/N*OWH*2-OWH,h=owH(x,z),sh=1+(owH(x+4,z+4)-owH(x-4,z-4))*.05;
  const w=owBW(x,z);let r=0,g=0,b=0;
  for(let q=0;q<5;q++){const rg=BRGB[q];r+=rg[0]*w[q];g+=rg[1]*w[q];b+=rg[2]*w[q]}
  const k=sh*(1+h*.01)*.8,o=(j*N+i)*4;
  im.data[o]=clamp(r*k*255,0,255);im.data[o+1]=clamp(g*k*255,0,255);im.data[o+2]=clamp(b*k*255,0,255);im.data[o+3]=255;
 }
 c.putImageData(im,0,0);OW.bmap=cv;
}

/* ----- Arazi üstü yardımcılar ----- */
function owLOS(x0,y0,z0,x1,y1,z1){
 const dx=x1-x0,dy=y1-y0,dz=z1-z0,n=Math.max(2,Math.ceil(Math.hypot(dx,dy,dz)/1.5));
 for(let i=1;i<n;i++){
  const t=i/n,x=x0+dx*t,y=y0+dy*t,z=z0+dz*t;
  if(y<owH(x,z)+.1)return false;
  for(const b of bnear(x,z))if(x>b.x1&&x<b.x2&&z>b.z1&&z<b.z2&&y<b.h)return false;
 }
 return true;
}
function owGroundRay(ray,maxD){
 const o=ray.origin,d=ray.direction;let prev=0;
 for(let t=1.5;;t+=1.5){
  const tt=Math.min(t,maxD),y=o.y+d.y*tt;
  if(y<owH(o.x+d.x*tt,o.z+d.z*tt)){
   let lo=prev,hi=tt;
   for(let i=0;i<6;i++){const mid=(lo+hi)/2;if(o.y+d.y*mid<owH(o.x+d.x*mid,o.z+d.z*mid))hi=mid;else lo=mid}
   return hi;
  }
  prev=tt;if(tt>=maxD)return Infinity;
 }
}
function mstep(m,dx,dz){
 let nx=m.x+dx,nz=m.z+dz;
 if(!hitBox(nx,m.z,owH(nx,m.z)))m.x=nx;
 if(!hitBox(m.x,nz,owH(m.x,nz)))m.z=nz;
 m.x=clamp(m.x,-OWH+3,OWH-3);m.z=clamp(m.z,-OWH+3,OWH-3);
}

/* ----- Mob aktivasyonu (yakındakiler çizilir, uzaktakiler sadece veri) ----- */
function owAct(m){
 const def=m.def,cols=Object.assign({},def.cols);
 cols.sc=m.sc;
 const mc=def.mc&&typeof wcMinecraftRig==='function'?wcMinecraftRig():null;
 if(mc)mc.root.scale.setScalar(m.sc);
 const rig=mc||mkHuman(cols,!def.r);
 if(def.r)holderSet(rig,def.wk,SKIN('g0'));
 m.rig=rig;m.g=rig.root;rig.root.userData={tg:1,e:m};
 rig.root.position.set(m.x,owH(m.x,m.z),m.z);rig.root.rotation.y=m.yaw;
 rig.root.visible=m.state!=='dead';
 S.add(rig.root);setShadow(rig.root);
 E.push(m);OW.act.push(m);
}
function owDeact(m){
 owRingOff(m);
 if(!m.g)return;
 if(OWN.on&&!m.net&&m.state!=='idle'&&m.state!=='dead'&&typeof mpSend==='function')mpSend({t:'omp',m:[ownMobRow(m,0)]});
 freeActor(m.g);
 /* yalnızca bu moba ait geometriler atılır. GLB karakter/goblin/silah modelleri tüm kopyalarca PAYLAŞILIYOR:
    eskiden onlar da atılıyordu, sonraki karede ekran kartına baştan yükleniyordu (mob uzaklaştıkça takılma) */
 m.g.traverse(o=>{if(o.geometry&&o.geometry.userData.own)o.geometry.dispose()});
 const i=E.indexOf(m);if(i>=0)E.splice(i,1);
 const j=OW.act.indexOf(m);if(j>=0)OW.act.splice(j,1);
 m.g=null;m.rig=null;
 if(m.state==='aggro'||m.state==='return'){m.state='idle';m.x=m.hx;m.z=m.hz;if(!OWN.on)m.hp=m.max;m.tx=null;m.net=false}
}
function owStream(dt){
 /* performans: yakına gelen mobları tek karede 4'er 4'er değil, kısa aralıklarla birer birer oluştur (takılma/ani FPS düşüşü olmasın) */
 OW.sT-=dt;if(OW.sT>0)return;OW.sT=window.BGMODE?.3:.08;
 let n=0;
 for(const m of OW.mobs){
  const d=Math.hypot(m.x-p.x,m.z-p.z);
  if(m.g){if(d>OW_DEACT||(m.state==='dead'&&d>70))owDeact(m)}
  else if(d<OW_ACT&&m.state!=='dead'&&OW.act.length<OW_MAXACT&&n<(window.BGMODE?40:1)){owAct(m);n++}
 }
}
function owAggro(m){
 for(const o of m.camp.mem)if(o.hp>0&&o.state!=='dead'){o.state='aggro';o.agT=0}
}

/* ----- Hasar, ölüm, ödüller ----- */
function owDamage(m,d,info){
 if(m.hp<=0||m.state==='dead')return;
 if(info&&info.player)cmbHit(false);
 d*=owDmgMul()*owLvDef(m)*(OW.perfT>0?1.5:1);
 if(OWN.on){ /* ortak can sunucuda: hasarı yolla, kesin sonucu sunucudan al */
  m.flinch=1;ownDmg(m,d);m.hp=Math.max(1,m.hp-d);
  if(info&&info.player&&!window.BGMODE){dmgNum(info.pt,d,info.head,false);if(!info.melee)snd(info.head?900:600,.08,.05)}
  if(m.state!=='aggro')owAggro(m);
  return;
 }
 m.hp-=d;m.flinch=1;
 if(info&&info.player&&!window.BGMODE){dmgNum(info.pt,d,info.head,m.hp<=0);if(!info.melee)snd(info.head?900:600,.08,.05)}
 if(m.state!=='aggro')owAggro(m);
 if(m.hp>0){if(info&&info.melee&&!info.exec&&!info.sk&&info.dir)owKnock(m,cw.dmg>150?4.5:6.5,info.dir.x,info.dir.z);return}
 owKill(m,info);
}
function owKill(m,info,norew){
 m.hp=0;m.state='dead';m.respT=OWN.on?1e9:(m.boss?100:24)+Math.random()*14;if(OW.dead.indexOf(m)<0)OW.dead.push(m);owRingOff(m);m.atk=0;m.net=false;
 if(m.g&&m.rig){
  if(!window.BGMODE)spawnRagdoll(m.rig,V3(0,0,0),info&&info.pt,info&&info.dir,(info&&info.power||5)*(info&&info.head?1.4:1));
  m.g.visible=false;
 }
 if(norew){upd();return}
 kills++;score+=m.L*10;
 const k=m.boss?12:1,coop=info&&info.coop?2:1,cm=info&&info.player?cmbMul():1,tl=Math.max(1,Math.round((1+m.L*.35)*(.8+Math.random()*.5)*k*cm))*coop,xp=Math.round((8+m.L*4)*k*cm);
 if(info&&info.player)cmbHit(true);
 SV.tl+=tl;SV.xp+=Math.ceil(m.L/6)*k;SV.ow.kills++;
 let extra='';
 if(Math.random()<(m.boss?.9:.035)){SV.ow.med++;extra=' +1 ilk yardım'}
 owGain(xp);
 if(typeof owDrops==='function'&&!(info&&info.killer===false))owDrops(m); /* çevrimiçi: eşyalar yalnız öldürenden düşer */
 if(!window.BGMODE){hitFlash('kill');owToast('Lv '+m.L+' '+m.name+' · +'+tl+' TL · +'+xp+' XP'+extra)}
 upd();
 OW.saveT+=1;if(OW.saveT>=6){OW.saveT=0;save()}
}
function owGain(xp){
 const o=SV.ow;o.xp+=xp;
 while(o.lvl<60&&o.xp>=owXpNeed(o.lvl)){
  o.xp-=owXpNeed(o.lvl);o.lvl++;
  skOnLevel(o.lvl);
  p.hp=owMax();hudHp();
  if(!window.BGMODE){owToast('SEVİYE ATLADIN! Lv '+o.lvl+' · maksimum can '+owMax());snd(700,.15,.06);snd(990,.2,.05)}
 }
 if(o.lvl>=60)o.xp=Math.min(o.xp,owXpNeed(59));
}
function owToast(t){
 const k=$('kf'),el=document.createElement('div');el.className='kfi';el.textContent=t;k.appendChild(el);
 setTimeout(()=>el.remove(),4000);while(k.children.length>(touch?3:5))k.firstChild.remove();
}
function owMed(){
 if(p.dead>0||SV.ow.med<=0||OW.medCd>0||p.hp>=owMax())return false;
 SV.ow.med--;OW.medCd=6;p.hp=Math.min(owMax(),p.hp+owMax()*.5);hudHp();
 if(!window.BGMODE){owToast('İlk yardım çantası kullanıldı (+%50 can)');snd(520,.12,.05)}
 return true;
}
function owDeath(){
 if(typeof ownOnDeath==='function')ownOnDeath();
 p.dead=5;AUTO.tgt=null;
 $('msg').textContent='Öldün, köyde yeniden doğacaksın';
 for(const m of OW.act)if(m.state==='aggro')m.state='return';
 AUTO.deaths.push(OW.t);
 hudHp();
}
function owRespawn(){
 p.hp=owMax();p.x=0;p.z=12;p.y=0;p.vx=p.vz=0;p.dead=0;p.yaw=0;p.pitch=0;pRagdoll=null;p.inv=2;
 $('msg').textContent='';OW.hitT=99;hudHp();
}


/* ----- Hedef seçimi: yerel oyuncu (çevrimiçiyse uzaktaki oyuncular da) ----- */
const _tg={x:0,y:0,z:0,vx:0,vz:0,ok:true,remote:false,id:0};
function owTgt(m){
 const d0=p.dead>0?1e9:Math.hypot(p.x-m.x,p.z-m.z);
 let bd=d0,rm=null;
 if(window.OWN&&OWN.on){for(const q of OWN.ents.values()){if(q.hp<=0||q.safe)continue;const d=Math.hypot(q.g.position.x-m.x,q.g.position.z-m.z);if(d<bd){bd=d;rm=q}}}
 if(rm){_tg.x=rm.g.position.x;_tg.y=rm.g.position.y;_tg.z=rm.g.position.z;_tg.vx=rm.pvx||0;_tg.vz=rm.pvz||0;_tg.ok=true;_tg.remote=true;_tg.id=rm.id;return _tg}
 _tg.x=p.x;_tg.y=p.y;_tg.z=p.z;_tg.vx=p.vx;_tg.vz=p.vz;_tg.ok=p.dead<=0;_tg.remote=false;_tg.id=0;return _tg;
}
/* ----- Saldırı işareti: yerde kırmızı halka, dolarak vuruşa yaklaşır ----- */
let _ringG=null,_discG=null;
function owRingGet(m){
 if(m.ring)return m.ring;
 if(!_ringG){_ringG=new THREE.RingGeometry(.93,1,48);_ringG.rotateX(-Math.PI/2);_discG=new THREE.CircleGeometry(1,40);_discG.rotateX(-Math.PI/2)}
 const mk=(g,o)=>{const q=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xff3a2a,transparent:true,opacity:o,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));q.frustumCulled=false;return q};
 const g=new THREE.Group(),a=mk(_ringG,.9),b=mk(_discG,.3);g.add(a);g.add(b);g.userData.fill=b;g.userData.ring=a;g.renderOrder=5;
 S.add(g);m.ring=g;return g;
}
function owRingOff(m){if(m.ring){S.remove(m.ring);m.ring.traverse(o=>{if(o.material)o.material.dispose()});m.ring=null}}
function owRingUpd(m,pa){
 if(window.BGMODE)return;
 if(!(m.atk>0)||pa<.28||pa>.72){if(m.ring)m.ring.visible=false;return}
 const g=owRingGet(m),R=m.atkR,f=clamp((pa-.28)/.27,0,1);
 g.visible=true;g.position.set(m.ax,owH(m.ax,m.az)+.14,m.az);g.scale.set(R,1,R);
 g.userData.fill.scale.set(Math.max(.05,f),1,Math.max(.05,f));
 g.userData.fill.material.opacity=pa<.55?.18+.3*f:Math.max(0,.6-(pa-.55)*5);
 g.userData.ring.material.opacity=pa<.55?.9:Math.max(0,.9-(pa-.55)*6);
 g.userData.ring.material.color.setHex(pa<.55&&f>.7?0xff8a2a:0xff3a2a);
}
/* ----- Boss çağırma dairesi: arazi yüksekliğini izleyen, rünlü yer deseni ----- */
function owBossGlyph(cx,cz,bi){
 const cv=document.createElement('canvas');cv.width=cv.height=512;const c=cv.getContext('2d');
 const col=['#b8ff6a','#ffcf5a','#8fe8ff','#9aff9a','#ff6a3a'][bi]||'#c070ff';
 const gr=c.createRadialGradient(256,256,10,256,256,256);gr.addColorStop(0,'rgba(60,10,90,.55)');gr.addColorStop(.7,'rgba(40,0,70,.35)');gr.addColorStop(1,'rgba(20,0,40,0)');
 c.fillStyle=gr;c.fillRect(0,0,512,512);
 c.strokeStyle=col;c.lineWidth=5;c.shadowColor=col;c.shadowBlur=12;
 for(const r of [244,226,150,96]){c.beginPath();c.arc(256,256,r,0,6.2832);c.stroke()}
 c.lineWidth=4;
 for(let k=0;k<2;k++){c.beginPath();for(let i=0;i<3;i++){const a=k*Math.PI/3+i*2.0944-Math.PI/2;const x=256+Math.cos(a)*226,y=256+Math.sin(a)*226;i?c.lineTo(x,y):c.moveTo(x,y)}c.closePath();c.stroke()}
 c.lineWidth=3;
 for(let i=0;i<24;i++){const a=i/24*6.2832,r1=226,r2=i%2?208:196;c.beginPath();c.moveTo(256+Math.cos(a)*r1,256+Math.sin(a)*r1);c.lineTo(256+Math.cos(a)*r2,256+Math.sin(a)*r2);c.stroke()}
 for(let i=0;i<8;i++){const a=i/8*6.2832+.2;c.beginPath();c.arc(256+Math.cos(a)*172,256+Math.sin(a)*172,11,0,6.2832);c.stroke()}
 c.beginPath();c.moveTo(256-40,256+40);c.lineTo(256,256-50);c.lineTo(256+40,256+40);c.closePath();c.stroke();
 const tex=new THREE.CanvasTexture(cv);
 const R=BOSS_R,NA=64,NR=14,pos=[],uv=[],idx=[];
 for(let j=0;j<=NR;j++)for(let i=0;i<=NA;i++){const a=i/NA*6.2832,rr=j/NR*R,x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr;pos.push(x,owH(x,z)+.09,z);uv.push(.5+Math.cos(a)*j/NR*.5,.5-Math.sin(a)*j/NR*.5)}
 for(let j=0;j<NR;j++)for(let i=0;i<NA;i++){const a=j*(NA+1)+i,b=a+NA+1;idx.push(a,b,a+1,a+1,b,b+1)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
 const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
 m.frustumCulled=false;m.renderOrder=2;(OW.glyphs||(OW.glyphs=[])).push(m);
}
const BOSS_R=17;
/* ----- Vuruş anı: kilitli noktadaki alan, içindeki herkes hasar alır; kaçış penceresi ----- */
function owStrike(m){
 const R=m.atkR;let res='whiff';
 if(p.dead<=0){
  const dd=Math.hypot(p.x-m.ax,p.z-m.az),air=p.y-owH(p.x,p.z)>1.15;
  const dashed=OW.t-SK.dashT<.42&&Math.hypot(SK.dashX-m.ax,SK.dashZ-m.az)<R+.7;
  if(dd<R&&!air&&!(p.inv>0)){_mv.set(m.x,owH(m.x,m.z)+1,m.z);hurt(m.dmg*owLvAtk(m)*(m.atkType==='slam'?1.5:1.3),_mv);res='hit'}
  else if(dashed&&p.inv>0){res='perfect'}
  else if(dd<R)res='dodged';
 }
 if(res==='perfect')owPerfect(m);
 else if(res==='whiff'&&m.owner!==false&&window.OWN&&OWN.on){
  for(const q of OWN.ents.values()){if(q.hp>0&&Math.hypot(q.g.position.x-m.ax,q.g.position.z-m.az)<R+.5){res='hit';break}}
 }
 m.res=res;
 if(res==='whiff'&&m.owner!==false)m.whiff=true;
 if(!window.BGMODE&&m.atkType==='slam')camKick(.05);
 return res;
}
function owPerfect(m){
 OW.perfT=3;SK.dCd=0;
 if(!window.BGMODE){owToast('MÜKEMMEL KAÇIŞ! Saldırı gücün arttı');snd(900,.1,.06,'sine');snd(1300,.15,.05,'sine');fxFlash('#9fd8ff',.25);slowT=.2}
 if(m.owner!==false)owStun(m,1.2);
}

/* ----- Mob zekâsı ----- */
const _mv=V3();
function owAtkStart(m,T){
 m.nAtk=(m.nAtk||0)+1;
 m.atkType=(m.boss&&m.nAtk%3===0)?'slam':'strike';
 m.atkT=m.boss?(m.atkType==='slam'?2.3:1.9):1.6;
 m.atk=m.atkT;m.struck=false;m.whiff=false;m.res='';
 m.atkR=m.atkType==='slam'?7.5:(m.boss?3.6:1.55+Math.max(0,m.sc-1)*.7);
 m.ax=T.x;m.az=T.z;
 m.cd=m.atkT+(m.boss?1.3:1.9)+Math.random()*1.2;
}
/* hazırlık (takip) → kilit → işaret → vuruş → toparlanma. owner=false: sadece görüntü ve yerel oyuncunun hasarı */
function owAtkStep(m,dt,T,owner){
 const pa=1-m.atk/m.atkT;m.atk-=dt;
 if(owner&&T){
  if(pa<.3&&m.atkType!=='slam'){m.yaw=angLerp(m.yaw,Math.atan2(T.x-m.x,T.z-m.z),Math.min(1,10*dt));m.ax=T.x+T.vx*.15;m.az=T.z+T.vz*.15}
  if(m.atkType==='slam'){m.ax=m.x;m.az=m.z}
  if(pa>=.5&&pa<.7&&m.atkType!=='slam'){
   const lx=m.ax-m.x,lz=m.az-m.z,ld=Math.hypot(lx,lz);
   if(ld>.6){const st=Math.min(ld-.5,12*dt);mstep(m,lx/ld*st,lz/ld*st)}
  }
 }
 if(!m.struck&&pa>=.55){m.struck=true;m.owner=owner;owStrike(m)}
 owRingUpd(m,pa);
 if(m.atk<=0){m.atk=0;owRingUpd(m,1);if(m.whiff){m.whiff=false;owStun(m,.95)}}
}
const owAtkAnim=pa=>pa<.55?pa/.55*.5:.5+(pa-.55)/.45*.5;
function owMob(m,dt){
 if(m.state==='dead')return;
 const def=m.def,gh=owH(m.x,m.z),ox=m.x,oz=m.z;
 let look=0,adsGoal=0,pitch=0;
 m.flinch=Math.max(0,m.flinch-dt*4);
 if(m.net){owNetStep(m,dt)}
 else{
 const T=owTgt(m),dx=T.x-m.x,dz=T.z-m.z,d=Math.hypot(dx,dz)||.01;
 if(m.kb>0){m.kb-=dt;mstep(m,m.kvx*dt,m.kvz*dt)}
 if(m.stun>0){
  m.stun-=dt;m.cd=Math.max(m.cd,.3);m.flinch=Math.max(m.flinch,.55);
  if(m.atk>0){m.atk=0;m.struck=false;if(m.ring)m.ring.visible=false}
  if(m.g)m.g.position.set(m.x,owH(m.x,m.z),m.z);return;
 }
 if(m.state==='aggro'){
  if(!T.ok||d>85||Math.hypot(m.x-m.camp.x,m.z-m.camp.z)>(m.boss?BOSS_R+10:65)||(m.camp.wild&&Math.hypot(T.x,T.z)<30))m.state='return';
  else{
   const nx=dx/d,nz=dz/d;
   m.cd-=dt;
   if(!def.r){
    if(m.atk>0)owAtkStep(m,dt,T,true);
    else{
     m.yaw=angLerp(m.yaw,Math.atan2(nx,nz),Math.min(1,8*dt));
     const reach=m.boss?5.4:1.8+m.sc*.45;
     if(d>reach*.75)mstep(m,nx*m.spd*dt,nz*m.spd*dt);
     if(d<reach&&Math.abs(T.y-gh)<2.6+m.sc&&m.cd<=0)owAtkStart(m,T);
    }
   }else{
    m.yaw=angLerp(m.yaw,Math.atan2(nx,nz),Math.min(1,8*dt));
    m.rs-=dt;if(m.rs<=0){m.rs=1+Math.random()*1.6;m.dir=Math.random()<.5?1:-1}
    const mv=d>22?1:d<11?-.8:0;
    mstep(m,(nx*mv-nz*m.dir*.6)*m.spd*dt,(nz*mv+nx*m.dir*.6)*m.spd*dt);
    adsGoal=d<30?1:0;pitch=clamp(Math.atan2(T.y+1.2-(gh+1.4),d),-.6,.6);
    if(m.cd<=0&&d<34&&T.ok&&owLOS(m.x,gh+1.4,m.z,T.x,T.y+1.2,T.z)){
     m.cd=((def.wk==='smg'?.75:def.wk==='pistol'?.9:1.1)+Math.random()*.6)*1.5;m.kk=1;m.flash=.05;
     const hitc=Math.random()<clamp(.7-d*.017-Math.hypot(T.vx,T.vz)*.02,.12,.7);
     if(!window.BGMODE&&m.rig&&m.rig.W){muzzleWorld(m.rig,_mz,1);const aim=V3(T.x,T.y+1.2,T.z);if(!hitc)aim.add(V3(rnd(-1,1),rnd(-.5,.5),rnd(-1,1)));tracer(_mz,aim)}
     if(hitc){
      if(T.remote){if(window.OWN)OWN.hurtRemote(T.id,m.dmgR*owLvAtk(m))}
      else{_mv.set(m.x,gh+1.2,m.z);hurt(m.dmgR*owLvAtk(m),_mv)}
     }
    }
   }
   /* yığılmayı önle */
   for(const o of OW.act){if(o===m||o.state!=='aggro')continue;const ax=m.x-o.x,az=m.z-o.z,ad=Math.hypot(ax,az);if(ad<.9&&ad>.001){mstep(m,ax/ad*.9*dt*2,az/ad*.9*dt*2)}}
  }
 }
 if(m.state==='return'){
  const hx=m.hx-m.x,hz=m.hz-m.z,hd=Math.hypot(hx,hz);
  m.hp=Math.min(m.max,m.hp+m.max*.25*dt);
  if(m.atk>0){m.atk=0;if(m.ring)m.ring.visible=false}
  if(hd<.7){m.state='idle';m.tx=null;m.hp=m.max}
  else{m.yaw=angLerp(m.yaw,Math.atan2(hx,hz),Math.min(1,8*dt));mstep(m,hx/hd*5*dt,hz/hd*5*dt)}
 }else if(m.state==='idle'){
  m.wt-=dt;
  if(m.wt<=0){m.wt=2.5+Math.random()*5;const wr=m.camp.wild?7:3;if(Math.random()<.6){m.tx=m.hx+rnd(-wr,wr);m.tz=m.hz+rnd(-wr,wr)}else m.tx=null}
  if(def.hostile&&p.dead<=0&&Math.hypot(p.x,p.z)>32&&Math.hypot(p.x-m.x,p.z-m.z)<def.hostile&&Math.abs(p.y-gh)<4)owAggro(m);
  if(m.tx!=null){
   const wx=m.tx-m.x,wz=m.tz-m.z,wd=Math.hypot(wx,wz);
   if(wd<.3)m.tx=null;else{m.yaw=angLerp(m.yaw,Math.atan2(wx,wz),Math.min(1,5*dt));mstep(m,wx/wd*1.1*dt,wz/wd*1.1*dt)}
  }
  look=Math.sin((clock+m.ph0)*.7)*.9;
 }
 }
 const gy=owH(m.x,m.z),sp=Math.hypot(m.x-ox,m.z-oz)/Math.max(dt,.001);
 if(m.g){
  m.g.position.set(m.x,gy,m.z);m.g.rotation.y=m.yaw;
  if(!window.BGMODE&&m.rig){
   const t=clock+m.ph0,fwd=1,_pr=poseRate(m,m.x-p.x,m.z-p.z);
   if(_pr>0){
   if(def.r){
    m.kk*=Math.pow(.0005,dt);m.flash-=dt;m.adsT+=(adsGoal-m.adsT)*Math.min(1,8*dt);
    animHuman(m.rig,{t,speed:sp,fwd,pitch,lookYaw:look,flinch:m.flinch,ads:m.adsT,kick:m.kk,kickR:m.kk,kickL:m.kk,rq:-1,flash:m.flash,flashL:0,bob:clamp(sp/7,0,1),lr:0,sw:1},dt*_pr);
   }else animHuman(m.rig,{t,speed:sp,fwd,pitch:0,lookYaw:look,flinch:m.flinch,atk:m.atk>0?owAtkAnim(1-m.atk/m.atkT):0},dt*_pr);
   }
  }
 }
}

/* uzaktaki (başka oyuncunun yönettiği) mob: pakete doğru yumuşak ilerle, saldırıyı görüntüle, hasarı yerel oyuncuya uygula */
function owNetStep(m,dt){
 m.netT=(m.netT||0)+dt;
 if(m.netT>3&&m.state==='aggro'){m.net=false;m.netT=0;return}
 if(m.nx!=null){const k=Math.min(1,12*dt);m.x+=(m.nx-m.x)*k;m.z+=(m.nz-m.z)*k;m.yaw=angLerp(m.yaw,m.nyaw,Math.min(1,14*dt))}
 if(m.stun>0){m.stun-=dt;m.flinch=Math.max(m.flinch,.5);if(m.atk>0){m.atk=0;if(m.ring)m.ring.visible=false}}
 else if(m.atk>0)owAtkStep(m,dt,null,false);
}

/* ----- Boss can çubuğu ----- */
let _bb=null;
function owBossBar(){
 if(window.BGMODE)return;
 let b=null,bd=1e9;
 for(const m of OW.act)if(m.boss&&m.state==='aggro'&&m.hp>0){const d=Math.hypot(m.x-p.x,m.z-p.z);if(d<bd){bd=d;b=m}}
 if(!_bb){const h=$('owhud');if(!h)return;_bb=document.createElement('div');_bb.id='bossbar';_bb.innerHTML='<b></b><i><u></u></i>';h.appendChild(_bb)}
 if(!b){if(_bb.style.display!=='none')_bb.style.display='none';return}
 const bt=b.name+'  Lv '+b.L,bw=Math.round(Math.max(0,b.hp/b.max*100))+'%';
 if(_bb.style.display!=='block')_bb.style.display='block';
 if(_bb._t!==bt){_bb._t=bt;_bb.firstChild.textContent=bt}
 if(_bb._w!==bw){_bb._w=bw;_bb.querySelector('u').style.width=bw}
}

/* ----- Dünya adımı ----- */
function owUpdate(dt){
 OW.t+=dt;
 if(p.dead>0){p.dead-=dt;if(p.dead<=0)owRespawn()}
 else{
  OW.hitT+=dt;
  const mx=owMax();
  if(p.hp<mx){
   const r=Math.hypot(p.x,p.z)<14?.14:OW.hitT>5?.02:0;
   if(r){p.hp=Math.min(mx,p.hp+mx*r*dt);const c=Math.ceil(p.hp);if(c!==OW.lastHp){OW.lastHp=c;hudHp()}}
  }
 }
 OW.medCd-=dt;OW.perfT=Math.max(0,(OW.perfT||0)-dt);
 owStream(dt);owBossBar();ownTick(dt);
 owLootUpd(dt);owNpcTick(dt);if(typeof wcCorpseTick==='function')wcCorpseTick(dt);
 for(let i=OW.act.length-1;i>=0;i--)owMob(OW.act[i],dt);
 for(let i=OW.dead.length-1;i>=0;i--){
  const m=OW.dead[i];m.respT-=dt;
  if(m.respT<=0){
   if(Math.hypot(m.hx-p.x,m.hz-p.z)<22){m.respT=4;continue}
   m.hp=m.max;m.state='idle';m.x=m.hx;m.z=m.hz;m.tx=null;m.cd=1;
   if(m.g)m.g.visible=true;
   OW.dead.splice(i,1);
  }
 }
 /* bölge adı */
 const bi=owBiome(p.x,p.z),zl=owZoneL(p.x,p.z),zn=Math.hypot(p.x,p.z)<30?'Başlangıç Köyü':BN[bi]+' · Bölge Lv ~'+zl;
 if(zn!==OW.zone){OW.zone=zn;OW.zoneL=zl;lastT=''}
}

/* ----- Başlat / çık ----- */
function owEnter(){
 if(!OW.built)owBuild();
 if(!OW.arena)OW.arena={boxes:boxes.slice(),meshes:boxMeshes.slice()};
 OW.arena.boxes.forEach(b=>b.m.visible=false);
 floor.position.y=-500;
 boxes.length=0;OW.solids.forEach(b=>boxes.push(b));
 boxMeshes.length=0;OW.solids.forEach(b=>boxMeshes.push(b.m));
 BG=OW.grid;OW.root.visible=true;OW.on=true;
 if(typeof wcLoadMinecraft==='function')wcLoadMinecraft(); /* yaban zombileri için (34 KB, bir kez) */
}
function owLeave(){
 for(const m of OW.act.slice())owDeact(m);
 if(typeof WCMC_CORPSES!=='undefined'){for(const c of WCMC_CORPSES)S.remove(c.root);WCMC_CORPSES.length=0}
 OW.root.visible=false;OW.on=false;BG=null;
 boxes.length=0;OW.arena.boxes.forEach(b=>boxes.push(b));
 boxMeshes.length=0;OW.arena.meshes.forEach(m=>boxMeshes.push(m));
 OW.arena.boxes.forEach(b=>b.m.visible=true);floor.position.y=0;
 AUTO.on=false;skClearFx();owLootFlush();p.inv=0;owUI(false);applyVideo();ownLeave();
}
function owStart(){
 owEnter();
 owNpcInit();owLootFlush();
 for(const m of OW.act.slice())owDeact(m);
 OW.dead.length=0;
 for(const m of OW.mobs){m.hp=m.max;m.state='idle';m.x=m.hx;m.z=m.hz;m.tx=null;m.flinch=0;m.cd=1}
 OW.t=0;OW.hitT=99;OW.medCd=0;OW.lastHp=-1;OW.zone='';
 p.x=0;p.z=12;p.y=0;p.yaw=0;p.pitch=0;p.hp=owMax();
 AUTO.on=false;AUTO.tgt=null;AUTO.mode='hunt';AUTO.deaths.length=0;AUTO.rest=false;
  if(!SV.ow.sw.includes(SV.ow.mw))SV.ow.mw='s0';
 setW(SV.ow.mw,true);
 skReset();
 owUI(true);applyVideo();hudHp();
 ownJoin();
}
function owExit(){
 AUTO.on=false;owAfk(false);
 if(kills>0&&typeof onMatchEnd==='function')onMatchEnd({mode:'ow',kills,score,shots,hits,win:false,wave:0,acc:shots?Math.round(hits/shots*100):0,earn:0,owl:SV.ow.lvl});
 save();owUI(false);
}
