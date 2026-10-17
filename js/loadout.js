'use strict';
/* =====================================================================
   Loadout (teçhizat) sistemi
   - Maça girmeden önce 5 loadout kartından biri seçilir (Birincil + İkincil + Yakın dövüş).
   - Her slot, sahip olunan modellerden (veya klasik sınıftan) seçilebilir; veriler SV.lo içinde saklanır.
   - Maç içinde yalnız seçili loadout'taki silahlar kullanılabilir; kenarda şeffaf silüet göstergesi çıkar.
   - Açık dünyada (ow) loadout kullanılmaz.
   ===================================================================== */
const LO={on:false,ok:false,keys:[],mod:{},cb:null};
const LO_SLOT=[{t:'Birincil',cls:['rifle','smg']},{t:'İkincil',cls:['pistol']},{t:'Yakın dövüş',cls:['knife']}];
function loDefault(){return[
 {n:'Yakın Çatışma',s:[{k:'smg'},{k:'dual'},{k:'knife'}]},
 {n:'Ağır',s:[{k:'rifle'},{k:'pistol'},{k:'sword'}]},
 {n:'Saldırı',s:[{k:'rifle'},{k:'pistol'},{k:'knife'}]},
 {n:'Uzman',s:[{k:'smg'},{k:'pistol'},{k:'sword'}]},
 {n:'Uzun Menzil',s:[{k:'rifle'},{k:'dual'},{k:'knife'}]}]}
/* bir slotta seçilebilecek her şey: klasik sınıflar + sahip olunan modeller */
function loChoices(si){
 const out=[];
 const cl=si===0?['rifle','smg']:si===1?['pistol','dual']:['knife','sword','gsword'];
 for(const k of cl)out.push({k,m:null,n:'Standart '+WP[k].n});
 const cat=si===0?['rifle','smg']:si===1?['pistol']:['knife'];
 for(const m of WMOD)if(wmOn(m)&&cat.includes(m.cls)&&SV.own.includes(m.id)){
  out.push({k:m.cls,m:m.id,n:m.n});
  if(si===1)out.push({k:'dual',m:m.id,n:'Çift '+m.n});
 }
 return out;
}
function loEnsure(){
 const d=loDefault();
 if(!SV.lo||!Array.isArray(SV.lo.list)||SV.lo.list.length!==5)SV.lo={sel:0,list:d};
 SV.lo.sel=Math.max(0,Math.min(4,SV.lo.sel|0));
 SV.lo.list.forEach((c,i)=>{
  if(!c||!Array.isArray(c.s)||c.s.length!==3)SV.lo.list[i]=c=d[i];
  c.n=typeof c.n==='string'?c.n:d[i].n;
  for(let j=0;j<3;j++){
   const s=c.s[j],ch=loChoices(j);
   if(!s||!ch.some(x=>x.k===s.k&&(x.m||null)===(s.m||null)))c.s[j]=Object.assign({},d[i].s[j]);
  }
 });
}
const loName=s=>s.m&&WMID[s.m]?(s.k==='dual'?'Çift ':'')+WMID[s.m].n:(WP[s.k]?'Standart '+WP[s.k].n:'');
/* silüet: model simgesi ya da klasik sınıf çizimi; CSS ile beyaz silüete çevrilir */
function loIcon(s){
 let mid=null;
 if(s.m&&WMID[s.m])mid=WMID[s.m].mid;else{const sp=mdlSpec(s.k,null);if(sp)mid=sp.mid} // klasik sınıf = varsayılan GLB modeli
 if(mid){
  const key=mid+'@380x210';
  if(MDL.icons[key])return `<img src='${MDL.icons[key]}'>`;
  mdlIcon(mid,380,210,()=>{if(LO.open)loRender();loHud()});
 }
 return wicon(s.k==='dual'?'dual':s.k,0xcfd8e0,0x9aa6b2);
}

/* ---------- Seçim ekranı ---------- */
function loOpen(cb){
 loEnsure();LO.cb=cb;LO.open=true;
 let el=$('lo');
 if(!el){el=document.createElement('div');el.id='lo';document.body.appendChild(el)}
 el.style.display='flex';loRender();
}
function loRender(){
 const el=$('lo');if(!el)return;
 const L=SV.lo;
 el.innerHTML=`<h2>LOADOUT SEÇ</h2><div class='lo-row'>${L.list.map((c,i)=>`<div class='lo-c ${L.sel===i?'sel':''}' data-c='${i}'><h3><i>${i+1}</i>${c.n}</h3>${c.s.map((s,j)=>`<div class='lo-w' data-c='${i}' data-s='${j}'><em>${LO_SLOT[j].t}</em><span class='sil'>${loIcon(s)}</span><small>${loName(s)}</small></div>`).join('')}</div>`).join('')}</div>
 <p class='lo-h'>Karta bas: seç · Silaha bas: değiştir · 1-5: kart · Enter: başla</p>
 <div class='lo-b'><button class='btn' id='lo-go'>MAÇA GİR</button><button id='lo-x'>Vazgeç</button></div>`;
 el.querySelectorAll('.lo-c').forEach(c=>c.onclick=()=>{L.sel=+c.dataset.c;save();loRender()});
 el.querySelectorAll('.lo-w').forEach(w=>w.onclick=e=>{e.stopPropagation();L.sel=+w.dataset.c;loPick(+w.dataset.c,+w.dataset.s)});
 $('lo-go').onclick=loConfirm;$('lo-x').onclick=loClose;
}
function loPick(ci,si){
 const ch=loChoices(si),cur=SV.lo.list[ci].s[si];
 let p=$('lop');if(!p){p=document.createElement('div');p.id='lop';document.body.appendChild(p)}
 p.style.display='flex';
 p.innerHTML=`<div class='lop-b'><h3>${SV.lo.list[ci].n} · ${LO_SLOT[si].t}</h3><div class='lop-g'>${ch.map((x,i)=>`<button data-i='${i}' class='${x.k===cur.k&&(x.m||null)===(cur.m||null)?'on':''}'><span class='sil'>${loIcon(x)}</span><small>${x.n}</small></button>`).join('')}</div><button id='lop-x'>Kapat</button></div>`;
 p.querySelectorAll('.lop-g button').forEach(b=>b.onclick=()=>{const x=ch[+b.dataset.i];SV.lo.list[ci].s[si]={k:x.k,m:x.m};save();p.style.display='none';loRender()});
 $('lop-x').onclick=()=>{p.style.display='none'};
 p.onclick=e=>{if(e.target===p)p.style.display='none'};
}
function loClose(){LO.open=false;const el=$('lo');if(el)el.style.display='none';const p=$('lop');if(p)p.style.display='none';LO.cb=null}
function loConfirm(){
 const cb=LO.cb;loApply();loClose();save();if(cb)cb();
}
/* seçili loadout'u uygula */
function loApply(){
 const c=SV.lo.list[SV.lo.sel];
 LO.keys=c.s.map(s=>s.k);LO.mod={};
 for(const s of c.s)LO.mod[s.k==='dual'?'pistol':s.k]=s.m||null;
 LO.ok=true;loSync();
}
/* her modda/lobide çağrılır: mod açık dünya değilse ve loadout seçildiyse etkin */
function loSync(){
 LO.on=!!(LO.ok&&typeof mode!=='undefined'&&mode!=='ow'&&mode!=='race'&&!lobbyOn); /* yarışta silah şeridi görünmez (araçta silah yok) */
 document.body.classList.toggle('lo-on',LO.on);
 if(LO.on){if(wk&&!LO.keys.includes(wk))setW(LO.keys[0],true);loHud()}
 else{const h=$('lohud');if(h)h.innerHTML=''}
}
document.addEventListener('keydown',e=>{
 if(!LO.open)return;
 if(kMatch(e,'chat')){e.preventDefault();loConfirm()}
 else if(e.code==='Escape'){loClose()}
 else{const i=[0,1,2,3,4].find(i=>kMatch(e,'sk'+(i+1)));if(i!=null){SV.lo.sel=i;save();loRender()}}
},true);

/* ---------- Maç içi kenar göstergesi: yalnız loadout silahları, şeffaf silüet ---------- */
function loHud(){
 if(!LO.on)return;
 let h=$('lohud');
 if(!h){h=document.createElement('div');h.id='lohud';$('hud').appendChild(h)}
 const c=SV.lo.list[SV.lo.sel];
 h.innerHTML=c.s.map((s,i)=>`<div class='lh ${s.k===wk?'on':''}' data-k='${s.k}'><b>${i+1}</b><span class='sil'>${loIcon(s)}</span></div>`).join('');
 h.querySelectorAll('.lh').forEach((d,i)=>{d.onclick=()=>setW(c.s[i].k)});
}
