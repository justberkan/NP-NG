'use strict';
/* ===== Kasalar: çeşitler + CS:GO tarzı açılış animasyonu (dönen şerit, yavaşlayıp durur) ===== */
const CRATES=[
 {id:'k1',n:'Bronz kasa',p:100,r:'rare',col:'#8a5a2a',pool:'all',d:'Rastgele bir eşya: kaplama, karakter, nişangah ya da silah modeli.'},
 {id:'k2',n:'Altın kasa',p:250,r:'epic',col:'#c98a10',pool:'epic',d:'Destansı ve Efsanevi eşya şansı yüksek.'},
 {id:'k3',n:'Silah kasası',p:200,r:'rare',col:'#4a7aa8',pool:'wmod',d:'Yalnızca silah modelleri (tüfek, SMG, tabanca, bıçak...).'},
 {id:'k4',n:'Nişangah kasası',p:180,r:'rare',col:'#8a4aa8',pool:'opt',d:'Silahına takılan nişangahlar: kırmızı nokta, ACOG, dürbünler...'},
 {id:'k5',n:'Karakter kasası',p:220,r:'rare',col:'#3aa86a',pool:'chars',d:'Karakterler ve şampiyonlar.'},
 {id:'k6',n:'Kaplama kasası',p:150,r:'rare',col:'#a84a6a',pool:'skins',d:'Silah kaplamaları.'},
 {id:'k7',n:'Efsane kasası',p:700,r:'legendary',col:'#e04a2a',pool:'leg',d:'Sadece Efsanevi eşya çıkar.'}
];
const CRID={};CRATES.forEach(c=>CRID[c.id]=c);
const CR_W={common:55,rare:28,epic:12,legendary:5};
function crAll(pool){
 const wm=typeof WMOD!=='undefined'?WMOD.filter(wmOn):[];
 const sk=SKINS.filter(s=>s.id!=='g0'),ch=CHARS.filter(c=>c.id!=='c0'&&c.p>0),op=OPT.filter(o=>o.p>0),xh=XH.filter(x=>x.p>0);
 if(pool==='wmod')return wm;if(pool==='opt')return op;if(pool==='chars')return ch;if(pool==='skins')return sk;
 return sk.concat(ch,op,xh,wm);
}
function crPool(c){
 let L=crAll(c.pool).filter(x=>!SV.own.includes(x.id));
 if(c.pool==='epic')L=L.filter(x=>x.r==='epic'||x.r==='legendary');
 if(c.pool==='leg')L=L.filter(x=>x.r==='legendary');
 return L;
}
function crPick(L){
 let tot=0;for(const x of L)tot+=CR_W[x.r]||20;
 let r=Math.random()*tot;for(const x of L){r-=CR_W[x.r]||20;if(r<=0)return x}
 return L[L.length-1];
}
let crEl=null,crBusy=false;
function crCell(it){
 const rc=(RAR[it.r]||RAR.common).c;
 return `<div class='crc' style='--rc:${rc}'><div class='cri'>${iconOf(it.id,'rifle')}</div><span>${it.n}</span></div>`;
}
function crateOpen(id){
 const c=CRID[id];if(!c||crBusy)return;
 const pool=crPool(c);
 if(SV.tl<c.p){SH.msg='Yetmiyor';save();view(vm);return}
 if(!pool.length){SH.msg='Bu kasadan çıkacak eşya kalmadı (hepsine sahipsin)';view(vm);return}
 SV.tl-=c.p;const win=crPick(pool);SV.own.push(win.id);save();bal();
 if(typeof mdlPreload==='function')setTimeout(mdlPreload,50);
 crBusy=true;
 if(!crEl){crEl=document.createElement('div');crEl.id='crm';document.body.appendChild(crEl)}
 const skip=!!SET.skipCrate;
 const all=crAll(c.pool),N=50,WIN=40,strip=[];
 for(let i=0;i<N;i++)strip.push(i===WIN?win:all[Math.floor(Math.random()*all.length)]);
 const rc=(RAR[win.r]||RAR.common).c;
 crEl.innerHTML=`<div class='crb'><h2>${c.n}</h2>
  <div class='crv'><div class='crs' id='crs'>${strip.map(crCell).join('')}</div><i class='crk'></i><u class='crl'></u><u class='crr'></u></div>
  <div class='crres' id='crres'></div>
  <div class='crf'><label><input type='checkbox' id='crskip' ${skip?'checked':''}> Animasyonu atla</label><button id='crok' class='chip' disabled>Tamam</button><button id='cragain' class='chip' disabled>Tekrar aç (${fmt(c.p)} TL)</button></div></div>`;
 crEl.classList.add('open');
 $('crskip').onchange=e=>{SET.skipCrate=e.target.checked;saveSet()};
 const fin=()=>{
  if(fin.d)return;fin.d=1;
  const res=$('crres');
  res.innerHTML=`<div class='crw' style='--rc:${rc}'><div class='cri big'>${iconOf(win.id,'rifle')}</div><b>${win.n}</b><span style='color:${rc}'>${(RAR[win.r]||RAR.common).n}</span></div>`;
  res.classList.add('show');
  $('crok').disabled=false;$('cragain').disabled=false;
  snd(600,.15,.06,'sine');snd(900,.25,.06,'sine');if(win.r==='legendary'||win.r==='epic'){snd(1200,.35,.06,'sine')}
  const cells=document.querySelectorAll('#crs .crc');if(cells[WIN])cells[WIN].classList.add('win');
 };
 const close=()=>{crEl.classList.remove('open');crBusy=false;SH.msg='Kasadan çıktı: '+win.n+' ('+(RAR[win.r]||RAR.common).n+')';view(vm)};
 $('crok').onclick=close;
 $('cragain').onclick=()=>{crEl.classList.remove('open');crBusy=false;crateOpen(id)};
 if(skip||document.hidden){const v=document.querySelector('#crm .crv');if(v)v.style.display='none';fin();return}
 /* animasyon: şerit hızla akar, yavaşlayarak kazanan hücrede durur */
 const strp=$('crs'),cellW=132,vw=strp.parentElement.clientWidth;
 const off=(Math.random()-.5)*(cellW*.7);
 const target=-(WIN*cellW+cellW/2-vw/2+off);
 strp.style.transition='none';strp.style.transform='translateX(0px)';
 void strp.offsetWidth;
 const dur=6.2;
 strp.style.transition=`transform ${dur}s cubic-bezier(.08,.72,.12,1)`;
 strp.style.transform=`translateX(${target}px)`;
 let last=-1;const t0=performance.now();
 const tick=()=>{
  if(!crEl.classList.contains('open'))return;
  const m=new DOMMatrix(getComputedStyle(strp).transform),x=-m.m41+vw/2,ci=Math.floor(x/cellW);
  if(ci!==last){last=ci;snd(260+(ci%3)*40,.035,.03,'square')}
  if(performance.now()-t0<dur*1000+80)requestAnimationFrame(tick);else fin();
 };
 requestAnimationFrame(tick);
 $('crskip').addEventListener('change',e=>{if(e.target.checked){strp.style.transition='none';strp.style.transform=`translateX(${target}px)`;fin()}});
}
