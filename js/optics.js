'use strict';
/* ===== Nişangahlar (optikler): silahın üstüne takılan modeller, nişan alınca yakınlaştırma + artı (reticle) ===== */
const OPT=[
 {id:'o0',n:'Kırmızı nokta',p:0,r:'common',z:1.4,ty:'dot',d:'Standart nişangah (silahların kendi gezineği).'},
 {id:'o7',n:'Modern tüfek dürbünü 4x',p:1700,r:'epic',z:3.4,ty:'tube',mid:'op_scope_modern',d:'Modern keskin nişancı dürbünü: 4 kat yakınlaştırma, ince artı.'},
 {id:'o8',n:'Holosight XPS',p:680,r:'rare',z:1.7,ty:'holo',mid:'op_holosight',d:'Gerçek holografik nişangah modeli: dairenin ortasında nokta.'},
 {id:'o9',n:'CYBER dürbün 4x (Termal)',p:5600,r:'legendary',z:4,ty:'therm',th:1,mid:'op_scope_futur',d:'Geleceğin termal dürbünü: nişan alırken düşmanlar sıcak imza ile parlar; duman/sis eklendiğinde bu dürbünle görünür kalırlar.'}
];
const OPTID={};OPT.forEach(o=>OPTID[o.id]=o);
const optCur=()=>OPTID[SV.eq.o||'o0']||OPT[0];
/* ADS yakınlaştırması: tüfek/SMG'de optiğin değeri, diğerlerinde standart */
function optLong(){return typeof cw!=='undefined'&&cw&&!cw.melee&&cw.hold!=='dual'} /* tekli tabancaya da optik takılır */
function optRawZoom(){return optLong()?optCur().z:1.4}
/* Ayarlar > Nişan yakınlaştırması: 0 = hiç yakınlaşmaz, 1 = optiğin tam değeri. Dürbünlerde (3x+) en az %60 uygulanır */
function optZoom(){const z=optRawZoom(),k=SET.adsZoom==null?.5:+SET.adsZoom;return 1+(z-1)*(z>=3?Math.max(.6,k):k)}
function optScoped(){return optLong()&&optCur().z>=3}

/* ----- 3B model: {g,cy (optik merkezin montaj üstünden yüksekliği)} ----- */
/* GLB'li optikler: mid ile assets/<mid>.js'ten yüklenir, boy OPTGLEN'den (m) */
const OPTGLEN={op_scope_modern:.19,op_holosight:.09,op_scope_futur:.2};
function optModel(id){
 const o=OPTID[id]||OPT[0];
 /* GLB modeli olan optik */
 if(o.mid){
  const B=0x15191e,g=new THREE.Group();
  g.add(mergeBoxes([{w:.04,h:.012,d:.07,x:0,y:.006,z:0,c:0x232a33}])); /* ray */
  const m=typeof MDL!=='undefined'?MDL.cache[o.mid]:null;
  if(m&&typeof mdlMake==='function'){
   const len=OPTGLEN[o.mid]||.18,o2=mdlMake(o.mid,len);
   if(o2){
    if(o.mid==='op_holosight'){o2.rotation.y=Math.PI;o2.rotation.z=Math.PI} /* model arkaya dönük ve baş aşağı geliyor: çevir */
    const bb=new THREE.Box3().setFromObject(o2),bh=bb.max.y-bb.min.y;
    o2.position.y=-bb.min.y;g.add(o2);
    if(o.ty==='holo'){ /* holografik retikül: pencerenin ortasında kırmızı nokta + halka */
     const cy=bh*.68,rm=new THREE.MeshBasicMaterial({color:0xff2a2a,transparent:true,opacity:.9,depthWrite:false});
     const dm=new THREE.Mesh(new THREE.CircleGeometry(.0011,10),rm);dm.position.set(0,cy,.03);
     const rg=new THREE.Mesh(new THREE.RingGeometry(.0046,.0053,28),rm);rg.position.set(0,cy,.03);
     dm.renderOrder=rg.renderOrder=5;dm.userData.holoRet=rg.userData.holoRet=1;g.add(dm,rg);return {g,cy,dot:dm}
    }
    return {g,cy:bh*.55}
   }
  }
  if(typeof mdlLoad==='function'&&m===undefined&&!MDL.fail[o.mid])mdlLoad(o.mid,()=>{}); /* modeli önceden yükle (mdlPreload da yapar) */
  return {g,cy:.05};
 }
 const B=0x15191e,B2=0x232a33,G=0x2a323c,g=new THREE.Group();
 let P=[],cy=.03;
 const glass=(c,w,h,z,y)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,.003),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.55}));
 const rail=(len,z0)=>({w:.04,h:.012,d:len,x:0,y:.006,z:z0||0,c:B2});
 if(o.ty==='dot'||o.ty==='ring'){
  const fp=[rail(.07),{w:.04,h:.01,d:.06,x:0,y:.011,z:0,c:B},{w:.006,h:.045,d:.04,x:-.018,y:.035,z:0,c:B},{w:.006,h:.045,d:.04,x:.018,y:.035,z:0,c:B},{w:.04,h:.006,d:.04,x:0,y:.06,z:0,c:B}];
  const fr=mergeBoxes(fp);if(id==='o0')fr.scale.setScalar(SET.opticSize||1);g.add(fr);
  const dm=new THREE.Mesh(new THREE.BoxGeometry(.003,.003,.002),new THREE.MeshBasicMaterial({color:0xff2222}));dm.position.set(0,.035,.0);dm.scale.setScalar(id==='o0'?(SET.dotSize||1):1);g.add(dm);
  cy=.035;if(o.ty==='ring'){const rg=new THREE.Mesh(new THREE.TorusGeometry(.011,.0012,6,18),new THREE.MeshBasicMaterial({color:0xff2222}));rg.position.set(0,.035,.0);g.add(rg)}
  return {g,cy,dot:dm};
 }
 if(o.ty==='holo'){
  P=[rail(.1),{w:.05,h:.014,d:.09,x:0,y:.014,z:0,c:B},{w:.006,h:.04,d:.09,x:-.022,y:.04,z:0,c:B2},{w:.006,h:.04,d:.09,x:.022,y:.04,z:0,c:B2},{w:.05,h:.01,d:.09,x:0,y:.067,z:0,c:B},{w:.05,h:.03,d:.012,x:0,y:.04,z:.04,c:G}];
  cy=.04;g.add(mergeBoxes(P));return {g,cy};
 }
 if(o.ty==='acog'){
  P=[rail(.15),{w:.03,h:.01,d:.12,x:0,y:.015,z:0,c:B2},{cr:.021,cr2:.021,w:0,h:0,d:.14,x:0,y:.04,z:0,c:G},{cr:.029,cr2:.029,w:0,h:0,d:.04,x:0,y:.04,z:.085,c:B},{cr:.024,cr2:.024,w:0,h:0,d:.03,x:0,y:.04,z:-.085,c:B},{w:.012,h:.016,d:.03,x:0,y:.07,z:.01,c:0x6a5a2a}];
  cy=.04;g.add(mergeBoxes(P));return {g,cy};
 }
 if(o.ty==='tube'||o.ty==='snip'){
  const L=o.ty==='snip'?.3:.2,R=o.ty==='snip'?.026:.02,F=o.ty==='snip'?.038:.03;
  P=[rail(L*.7),{w:.014,h:.018,d:.02,x:0,y:.016,z:L*.22,c:B2},{w:.014,h:.018,d:.02,x:0,y:.016,z:-L*.22,c:B2},
   {cr:R,cr2:R,w:0,h:0,d:L,x:0,y:.03+R,z:0,c:B},{cr:F,cr2:F,w:0,h:0,d:L*.22,x:0,y:.03+R,z:L*.5,c:B2},{cr:R*1.25,cr2:R*1.25,w:0,h:0,d:L*.12,x:0,y:.03+R,z:-L*.5,c:B2},
   {w:.014,h:.014,d:.014,x:0,y:.03+R*2+.006,z:0,c:G},{w:.014,h:.014,d:.014,x:R+.007,y:.03+R,z:0,c:G}];
  cy=.03+R;g.add(mergeBoxes(P));return {g,cy};
 }
 /* termal */
 P=[rail(.16),{w:.06,h:.072,d:.17,x:0,y:.05,z:0,c:0x3a424a},{cr:.03,cr2:.03,w:0,h:0,d:.04,x:0,y:.05,z:.1,c:B},{w:.05,h:.02,d:.02,x:0,y:.092,z:-.07,c:0x2a323a},{w:.012,h:.012,d:.012,x:.036,y:.07,z:.02,c:0x30ff90}];
 cy=.05;g.add(mergeBoxes(P));return {g,cy};
}

/* ----- Nişan alırken ekran katmanı: artı + kararma ----- */
let _oh=null,_ot='',_ohS=null,_ohW=null;
function optHudInit(){
 if(_oh)return;
 _oh=document.createElement('div');_oh.id='opt';document.body.appendChild(_oh);
}
const OPT_SVG={
 dot:'',
 ring:'<circle cx="50" cy="50" r="7" fill="none" stroke="#ff3030" stroke-width="1.2"/><circle cx="50" cy="50" r="1.1" fill="#ff3030"/>',
 holo:'<circle cx="50" cy="50" r="9" fill="none" stroke="#ff3030" stroke-width=".8"/><circle cx="50" cy="50" r="1.2" fill="#ff3030"/><path d="M50 38v-3M50 62v3M38 50h-3M62 50h3" stroke="#ff3030" stroke-width=".6"/>',
 acog:'<path d="M50 49 L45 56 M50 49 L55 56" stroke="#ff3030" stroke-width="1.2" fill="none"/><path d="M50 20v22M50 58v22M20 50h22M58 50h22" stroke="#111" stroke-width=".35"/><circle cx="50" cy="49" r=".9" fill="#ff3030"/>',
 tube:'<path d="M50 14v30M50 56v30M14 50h30M56 50h30" stroke="#0a0a0a" stroke-width=".45"/><circle cx="50" cy="50" r=".7" fill="#ff3030"/>',
 snip:'<path d="M50 8v38M50 54v38M8 50h38M54 50h38" stroke="#0a0a0a" stroke-width=".35"/><path d="M50 46v-2M50 54v2M46 50h-2M54 50h2" stroke="#0a0a0a" stroke-width=".7"/><g fill="#0a0a0a"><circle cx="50" cy="38" r=".7"/><circle cx="50" cy="62" r=".7"/><circle cx="38" cy="50" r=".7"/><circle cx="62" cy="50" r=".7"/><circle cx="50" cy="28" r=".7"/><circle cx="50" cy="72" r=".7"/><circle cx="28" cy="50" r=".7"/><circle cx="72" cy="50" r=".7"/></g>',
 therm:'<path d="M50 14v30M50 56v30M14 50h30M56 50h30" stroke="#30ff90" stroke-width=".45"/><circle cx="50" cy="50" r="1" fill="none" stroke="#30ff90" stroke-width=".5"/>'
};
function optHud(adsT){
 if(!_oh){optHudInit()}
 const o=optCur(),on=optLong();
 const a=on?adsT:0;
 /* 3B holografik retikül nişanda gizlenir: ekranda tek retikül (ortadaki SVG) kalsın */
 {const show=a<.3,hw=typeof VM!=='undefined'&&VM.h?(VM.h.W||null):null,rt=typeof VM!=='undefined'?VM.root:null;
  if(rt&&(show!==_ohS||hw!==_ohW)){_ohS=show;_ohW=hw;rt.traverse(q=>{if(q.userData.holoRet)q.visible=show})}}
 if(a<.05){if(_oh._v!==0){_oh._v=0;_oh.style.display='none'}return}
 const ds=+(SET.dotSize||1),k=o.id+(optScoped()?'s':'')+ds;
 if(k!==_ot){
  _ot=k;const sc=optScoped();
  _oh.className=(sc?'sc ':'')+o.ty;
  /* kırmızı nokta: ekranda her zaman görünen parlak nokta (3B nokta görüş dışında kalsa bile) */
  const svg=o.ty==='dot'?`<circle cx="50" cy="50" r="${(1.5*ds).toFixed(2)}" fill="#ff2a2a" stroke="#000" stroke-opacity=".35" stroke-width=".3"/>`:(OPT_SVG[o.ty]||'');
  _oh.innerHTML=`<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">${svg}</svg>`;
 }
 if(_oh._v!==1){_oh._v=1;_oh.style.display='block'}
 const op=Math.round(Math.min(1,a*(optScoped()?1.15:1))*50)/50;if(op!==_oh._o){_oh._o=op;_oh.style.opacity=op}
}

/* ----- Termal vurgu: termal optikle (th) nişan alırken düşmanlar parlak "sıcak" gösterilir.
   Sis/duman eklendiğinde bu katman sayesinde bu optikle görünür kalırlar. ----- */
const _thM=new Map();
function thermScan(on){
 if(typeof E==='undefined')return;
 for(const e of E){
  if(!e||!e.g)continue;
  const hot=!!on&&e.hp>0&&e.team===2&&e.g.visible;
  e.g.traverse(o=>{
   if(!o.isMesh||!o.material)return;
   const ms=Array.isArray(o.material)?o.material:[o.material];
   for(const m of ms){
    if(!m.emissive)continue;
    const k=m.uuid;
    if(!_thM.has(k))_thM.set(k,{h:m.emissive.getHex(),i:'emissiveIntensity' in m?m.emissiveIntensity:1});
    const v=_thM.get(k);
    if(hot){ /* vücut ısısı: parlak kırmızı-sıcak imza */
     const hx=(k.length*7)%3; /* hafif ton farkı: kimi parça turuncu-kırmızı, kimi derin kırmızı */
     const col=hx===0?0xff3a10:(hx===1?0xff2008:0xd81505);
     if(m.emissive.getHex()!==col)m.emissive.setHex(col);
     if('emissiveIntensity' in m&&m.emissiveIntensity!==1.3)m.emissiveIntensity=1.3;
    }
    else{if(m.emissive.getHex()!==v.h)m.emissive.setHex(v.h);if('emissiveIntensity' in m&&m.emissiveIntensity!==v.i)m.emissiveIntensity=v.i}
   }
  });
 }
}
