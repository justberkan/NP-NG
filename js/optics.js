'use strict';
/* ===== Nişangahlar (optikler): silahın üstüne takılan modeller, nişan alınca yakınlaştırma + artı (reticle) ===== */
const OPT=[
 {id:'o0',n:'Kırmızı nokta',p:0,r:'common',z:1.4,ty:'dot',d:'Hafif ve hızlı. Standart nişangah.'},
 {id:'o1',n:'Reflex',p:220,r:'common',z:1.5,ty:'ring',d:'Dairesel kırmızı artı, geniş camlı küçük nişangah.'},
 {id:'o2',n:'Holografik',p:520,r:'rare',z:1.7,ty:'holo',d:'Dairenin ortasında nokta. Yakın ve orta mesafede çok net.'},
 {id:'o3',n:'ACOG 3,5x',p:1100,r:'rare',z:2.6,ty:'acog',d:'Orta menzil için 3,5 kat yakınlaştırma, şivron artı.'},
 {id:'o4',n:'Tüp dürbün 4x',p:1500,r:'epic',z:3.3,ty:'tube',d:'Klasik dürbün: 4 kat yakınlaştırma, ince artı.'},
 {id:'o5',n:'Nişancı dürbünü 6x',p:2600,r:'epic',z:4.6,ty:'snip',d:'Uzun mesafe için 6 kat, nişan alırken ekran daralır.'},
 {id:'o6',n:'Termal dürbün 3x',p:4200,r:'legendary',z:3,ty:'therm',d:'Yeşil termal görüntü, 3 kat yakınlaştırma.'}
];
const OPTID={};OPT.forEach(o=>OPTID[o.id]=o);
const optCur=()=>OPTID[SV.eq.o||'o0']||OPT[0];
/* ADS yakınlaştırması: tüfek/SMG'de optiğin değeri, diğerlerinde standart */
function optLong(){return typeof cw!=='undefined'&&cw&&!cw.melee&&cw.hold!=='pistol'&&cw.hold!=='dual'}
function optRawZoom(){return optLong()?optCur().z:1.4}
/* Ayarlar > Nişan yakınlaştırması: 0 = hiç yakınlaşmaz, 1 = optiğin tam değeri. Dürbünlerde (3x+) en az %60 uygulanır */
function optZoom(){const z=optRawZoom(),k=SET.adsZoom==null?.5:+SET.adsZoom;return 1+(z-1)*(z>=3?Math.max(.6,k):k)}
function optScoped(){return optLong()&&optCur().z>=3}

/* ----- 3B model: {g,cy (optik merkezin montaj üstünden yüksekliği)} ----- */
function optModel(id){
 const o=OPTID[id]||OPT[0],B=0x15191e,B2=0x232a33,G=0x2a323c,g=new THREE.Group();
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
let _oh=null,_ot='';
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
