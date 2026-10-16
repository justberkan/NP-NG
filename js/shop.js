'use strict';
/* ===== N.P.N.G: Mağaza + Envanter (sıfırdan) =====
   3B küçük resimli kartlar, canlı dönen vitrin, filtreler, istatistik çubukları, yükleme (loadout) şeridi. */
const SH={tab:'w',sub:'all',sel:null,msg:'',raf:0,sr:null,ss:null,sc:null,so:null,reg:{},selKey:'',t0:0,stOk:false};
const SH_TABS=[['w','Silahlar'],['o','Kılıçlar'],['c','Karakterler'],['h','Şampiyonlar'],['f','Formalar'],['g','Kaplamalar'],['p','Nişangah'],['x','Artı rengi'],['k','Kasalar']];
const SH_SUB=[['all','Tümü'],['ar','Tüfek'],['sn','Nişancı'],['sg','Pompalı'],['smg','SMG'],['pi','Tabanca'],['kn','Bıçak'],['cls','Klasik']];
const SH_RN={common:'SIRADIŞI',rare:'NADİR',epic:'DESTANSI',legendary:'EFSANEVİ'};

/* ----- Liste ----- */
function shList(){
 const t=SH.tab,inv=vm==='inv';let L=[];
 if(t==='w'){
  L=WKEYS.map(k=>({id:'w:'+k,w:k,n:'Klasik '+WP[k].n,p:0,t:'w',r:'common',cat:'cls'}))
   .concat(WMOD.filter(wmOn).map(m=>({id:m.id,n:m.n,p:m.p,t:'m',r:m.r,m,cat:m.cat})));
  const f=SH.sub;
  if(f==='ar')L=L.filter(i=>i.cat==='ar'||i.cat==='br'||i.cat==='lmg');
  else if(f!=='all')L=L.filter(i=>i.cat===f);
  L.sort((a,b)=>a.p-b.p);
 }else if(t==='o'){
  L=SWD.map(s=>({id:'ow:'+s.id,sid:s.id,n:s.n+(swLv(s.id)?' +'+swLv(s.id):''),p:s.p,t:'ws',r:RMAP[s.r]}));
  if(inv)L=L.concat(Object.keys(ITM).filter(id=>!ITM[id].special&&invHave(id)>0).map(id=>({id:'oi:'+id,iid:id,n:ITM[id].n+' ×'+invHave(id),p:ITM[id].p,t:'oi',r:RMAP[ITM[id].r]})));
 }else if(t==='c')L=CHARS.filter(c=>!c.ch).map(c=>({id:c.id,n:c.n,p:c.p,t:'c',r:c.r,c:c.j}));
 else if(t==='h')L=CHARS.filter(c=>c.ch).map(c=>({id:c.id,n:c.n,p:c.p,t:'c',r:c.r,c:c.j,ch:1}));
 else if(t==='f')L=[{id:'f0',n:'Formasız',p:0,t:'f',r:'common',c:0x555d68}].concat(FORMS.map(f=>({id:f.id,n:f.n,p:f.p,t:'f',r:f.r,c:f.c})));
 else if(t==='g')L=SKINS.map(s=>({id:s.id,n:s.n,p:s.p,t:'g',r:s.r,c:s.c,a:s.a}));
 else if(t==='p')L=OPT.map(o=>({id:o.id,n:o.n,p:o.p,t:'op',r:o.r,o}));
 else if(t==='x')L=XH.map(x=>({id:x.id,n:x.n,p:x.p,t:'x',r:x.r,c:x.c}));
 else L=inv?[]:CRATES.map(c=>({id:c.id,n:c.n,p:c.p,t:'k',r:c.r,cr:c}));
 if(inv)L=L.filter(own);
 return L;
}
const shFind=id=>shList().find(x=>x.id===id);

/* ----- Metinler, istatistikler ----- */
function shDesc(i){
 if(i.t==='op')return i.o.d+' Tüfek ve SMG\'lerin üstüne takılır, nişan alırken (sağ tık) yakınlaştırır.';
 if(i.t==='k')return i.cr.d+' Çıkacak eşya rastgele, sahip olmadıkların arasından seçilir.';
 if(i.t==='m')return `${i.m.sub}. ${WM_CLS[i.m.cls]} slotuna bağlanır: kuşanınca o slotun görünümü ve değerleri değişir.`+(i.m.cat==='sg'?' Tek atışta 7 saçma fırlatır.':'')+(i.m.cat==='sn'?' Yavaş ama ağır vurur, uzak menzilde ölümcül.':'');
 return dsc(i);
}
function shStats(i){
 let L=null,V=null,mag=null;
 if(i.t==='op'){L=['Yakınlaştırma'];V=[Math.min(100,Math.round((i.o.z-1)*28))];return `<div class='sr'><span>Yakınlaştırma</span><span class='bar'><em class='c0' style='width:${V[0]}%'></em></span><b>${i.o.z}x</b></div>`}
 if(i.t==='m'&&!i.m.cs.mel){L=['Hasar','İsabet','Tepme','Atış hızı','Mermi'];V=i.m.st;mag=i.m.cs.mag}
 else if(i.t==='m'){L=['Hasar','Hız'];V=[i.m.st[0],i.m.st[3]]}
 else if(i.t==='w'&&!WP[i.w].melee){L=['Hasar','İsabet','Tepme','Atış hızı','Mermi'];V=WP[i.w].st;mag=WP[i.w].mag}
 else if(i.t==='w'){L=['Hasar','Hız'];V=[WP[i.w].st[0],WP[i.w].st[3]]}
 else if(i.t==='ws'){const s=SWID[i.sid];L=['Hasar','Hız','Menzil','Alan'];V=[Math.min(100,Math.round(s.dmg/2.2)),Math.min(100,Math.round(80*Math.pow(.6/s.rate,.6))),Math.min(100,Math.round(s.range*22)),Math.min(100,Math.round(s.ang*85))]}
 if(!L)return '';
 return L.map((l,j)=>`<div class='sr'><span>${l}</span><span class='bar'><em class='c${j}' style='width:${Math.min(100,V[j]*(L[j]==='Mermi'?3:1))}%'></em></span><b>${L[j]==='Mermi'?mag:V[j]}</b></div>`).join('');
}
function shPrice(p){return `<span class='pc'><i>${coinicon()}</i>${fmt(p)}</span>`}
function shLabel(i){
 const o=own(i),e=eqd(i);
 if(i.t==='oi')return `SAT · ${fmt(i.p)} TL`;
 if(i.t==='k')return `AÇ · ${fmt(i.p)} TL`;
 if(o)return e?'KUŞANILDI':'KUŞAN';
 return `SATIN AL · ${fmt(i.p)} TL`;
}

/* ----- Küçük resimler ----- */
function shIconFor(i,el,cb){
 if(i.t==='m')return mdlIcon(i.m.mid,440,200,cb);
 if(i.t==='ws')return mdlIcon(SWMOD[i.sid].mid,440,200,cb);
 const boxW=(k,sk)=>done=>{const W=buildWeapon(k,sk);if(W.flash)W.g.remove(W.flash);done(W.g)};
 /* klasik silah/kaplama: GLB model yüklenmeden çizilirse boş kalıyordu → önce modeli yükle */
 const need=k=>{const sp=typeof mdlSpec==='function'?mdlSpec(k,null):null;return sp&&!MDL.cache[sp.mid]&&!MDL.fail[sp.mid]?sp.mid:null};
 if((i.t==='w'||i.t==='g')&&need(i.t==='w'?i.w:vw))return mdlLoad(need(i.t==='w'?i.w:vw),()=>shIconFor(i,el,cb));
 if(i.t==='w')return mdlIconObj('cw:'+i.w+':'+(SV.sk[i.w]||'g0'),440,200,boxW(i.w,skinOf(i.w)),cb,'sidel');
 if(i.t==='g')return mdlIconObj('sk:'+vw+':'+i.id,440,200,boxW(vw,SKIN(i.id)),cb,'sidel');
 if(i.t==='c'){
  const cc=CHAR(i.id);
  if(typeof glbCharReady==='function'&&!glbCharReady(cc)){glbLoadChar(cc.glb);return cb(null)} /* model yüklenince shFill yeniden çizer */
  return mdlIconObj('ch:'+i.id,220,260,done=>{try{const r=mkHuman(cc,false);done(r.root)}catch(e){done(null)}},cb,'frontl');
 }
 if(i.t==='f'){
  const cc=CHAR(chWithKit(SV.eq.c,i.id));
  if(typeof glbCharReady==='function'&&!glbCharReady(cc)){glbLoadChar(cc.glb);return cb(null)}
  return mdlIconObj('fk:'+i.id+':'+SV.eq.c,220,260,done=>{try{done(mkHuman(cc,false).root)}catch(e){done(null)}},cb,'frontl');
 }
 if(i.t==='op')return mdlIconObj('op:'+i.id,440,200,done=>done(optModel(i.id).g),cb,'sidel');
 if(i.t==='x'){el.innerHTML=xicon(i.c);return cb('svg')}
 if(i.t==='k'){el.innerHTML=crateicon(i.cr.col);return cb('svg')}
 if(i.t==='oi'){el.innerHTML=`<span class='em'>${ITM[i.iid].ic}</span>`;return cb('svg')}
 cb(null);
}
function shFill(){
 mdlIconClear();
 document.querySelectorAll('#av [data-ik]').forEach(el=>{
  const i=SH.reg[el.dataset.ik];if(!i)return;
  shIconFor(i,el,u=>{
   if(!el.isConnected)return;
   if(u&&u!=='svg'){el.innerHTML='';el.style.backgroundImage=`url(${u})`;el.classList.add('ld')}
   else if(u==='svg')el.classList.add('ld');
   else{el.innerHTML=i.t==='c'?cicon(i.c):wicon('rifle',0x555d68,0x3a4552);el.classList.add('ld')}
  });
 });
}

/* ----- Kartlar ve yükleme şeridi ----- */
function shCard(i){
 SH.reg['c:'+i.id]=i;
 const o=own(i),e=eqd(i),rc=(RAR[i.r]||RAR.common).c,sub=i.t==='m'?i.m.sub:i.t==='w'?'Klasik':i.t==='ws'?'Kılıç':i.t==='g'?'Kaplama':i.t==='c'?(i.ch?'Şampiyon':'Karakter'):i.t==='f'?'Forma':i.t==='op'?'Nişangah':i.t==='x'?'Artı rengi':i.t==='k'?'Kasa':'Eşya';
 const st=e?`<b class='tg eq'>KUŞANILDI</b>`:'';
 const foot=(o&&i.t!=='oi')?`<span class='ok'>${e?'Kuşanıldı':'Sahipsin'}</span>`:shPrice(i.p);
 return `<div class='sc${i.id===SH.sel?' on':''}${o?' own':''}' data-s='${i.id}' style='--rc:${rc}'><div class='sc-i' data-ik='c:${i.id}'></div>${st}<div class='sc-n'>${i.n}</div><div class='sc-s'>${sub}</div><div class='sc-f'>${foot}<button data-b='${i.id}'>${i.t==='oi'?'SAT':i.t==='k'?'AÇ':o?(e?'✓':'KUŞAN'):'AL'}</button></div></div>`;
}
function shSlots(){
 const S=[];
 ['rifle','smg','pistol','knife'].forEach(k=>{
  const m=modOf(k);
  S.push({lab:WP[k].n,i:m?{id:m.id,n:m.n,p:m.p,t:'m',r:m.r,m,cat:m.cat}:{id:'w:'+k,w:k,n:'Klasik '+WP[k].n,p:0,t:'w',r:'common',cat:'cls'},tab:'w',sub:{rifle:'ar',smg:'smg',pistol:'pi',knife:'kn'}[k]});
 });
 const sw=SWID[SV.ow.mw]||SWD[0];S.push({lab:'Kılıç',i:{id:'ow:'+sw.id,sid:sw.id,n:sw.n,p:sw.p,t:'ws',r:RMAP[sw.r]},tab:'o'});
 const ch=CHARS.find(c=>c.id===SV.eq.c)||CHARS[0];S.push({lab:'Karakter',i:{id:ch.id,n:ch.n,p:ch.p,t:'c',r:ch.r,c:ch.j,ch:ch.ch},tab:ch.ch?'h':'c'});
 const fm=FORMS.find(f=>f.id===SV.eq.f);S.push({lab:'Forma',i:fm?{id:fm.id,n:fm.n,p:fm.p,t:'f',r:fm.r,c:fm.c}:{id:'f0',n:'Formasız',p:0,t:'f',r:'common',c:0x555d68},tab:'f'});
 return S;
}
function shLoadout(){
 return `<div class='sh-load'>${shSlots().map((s,j)=>{SH.reg['s:'+j]=s.i;const rc=(RAR[s.i.r]||RAR.common).c;
  return `<div class='sl' data-sl='${j}' style='--rc:${rc}'><div class='sc-i' data-ik='s:${j}'></div><small>${s.lab}</small><b>${s.i.n}</b></div>`}).join('')}</div>`;
}

/* ----- Ana görünüm ----- */
function shopNew(){
 SH.reg={};
 const inv=vm==='inv',L=shList();
 if(!L.find(x=>x.id===SH.sel))SH.sel=L[0]?L[0].id:null;
 const it=L.find(x=>x.id===SH.sel)||null;
 const tabs=SH_TABS.filter(t=>!(inv&&t[0]==='k')).map(t=>`<button data-t='${t[0]}' class='${SH.tab===t[0]?'on':''}'>${t[1]}</button>`).join('');
 const chips=SH.tab==='w'?`<div class='sh-sub'>${SH_SUB.map(c=>`<button data-sub='${c[0]}' class='${SH.sub===c[0]?'on':''}'>${c[1]}</button>`).join('')}</div>`
  :SH.tab==='g'?`<div class='sh-sub'>${WKEYS.map(k=>`<button data-w='${k}' class='${vw===k?'on':''}'>${WP[k].n}</button>`).join('')}</div>`:'';
 const cards=L.map(shCard).join('')||`<div class='sh-empty'>${inv?'Bu sekmede henüz eşyan yok. Mağazadan alabilirsin.':'Bu sekmede eşya yok.'}</div>`;
 return `<div class='sh'>
  <div class='sh-main'>
   <div class='sh-head'><div class='sh-title'>${inv?'ENVANTER':'MAĞAZA'}<small>${inv?'Sahip olduklarını kuşan':'Silah, karakter ve daha fazlası'}</small></div><div class='sh-tabs'>${tabs}</div></div>
   ${inv?shLoadout():''}${chips}
   <div class='sh-grid'>${cards}</div>
  </div>
  <div class='sh-side'>${it?shSide(it):''}</div>
 </div>`;
}
function shSide(it){
 const rc=(RAR[it.r]||RAR.common).c,e=eqd(it),o=own(it);
 const btnCls=e&&it.t!=='oi'?'eq':o||it.t==='oi'||it.t==='k'?'go':'buy';
 const sub=it.t==='m'?it.m.sub+' · '+WM_CLS[it.m.cls]:it.t==='w'?'Klasik · '+WP[it.w].n:it.t==='ws'?'Kılıç · Açık Dünya':it.t==='g'?'Kaplama':it.t==='c'?(it.ch?'Şampiyon':'Karakter'):it.t==='f'?'Forma · tüm karakterlere':it.t==='x'?'Nişangah':it.t==='k'?'Kasa':'Eşya';
 return `<div class='sh-stage' style='--rc:${rc}'><canvas id='shc' width='560' height='300'></canvas><div id='shb' class='sh-big off'></div><span class='sh-rar'>${SH_RN[it.r]||''}</span><span class='sh-pad'></span></div>
 <h2 class='sh-name'>${it.n}</h2><div class='sh-subt'>${sub}</div>
 <p class='sh-desc'>${shDesc(it)}</p>
 <div class='sh-stats'>${shStats(it)}</div>
 ${it.t==='k'?`<label class='sh-skip'><input type='checkbox' id='shskip' ${SET.skipCrate?'checked':''}> Açılış animasyonunu atla</label>`:''}
 <button class='sh-btn ${btnCls}' data-b='${it.id}' ${e&&it.t!=='oi'?'disabled':''}>${shLabel(it)}</button>
 <p class='sh-msg'>${SH.msg||''}</p>`;
}

/* ----- Vitrin: dönen 3B model ----- */
function shStageObj(it,cb){
 const boxW=(k,sk)=>{const W=buildWeapon(k,sk,undefined,true);if(W.flash)W.g.remove(W.flash);return W.g};
 if(it.t==='m')return mdlLoad(it.m.mid,m=>cb(m?mdlMake(it.m.mid,2):null,'side'));
 if(it.t==='ws')return mdlLoad(SWMOD[it.sid].mid,m=>cb(m?mdlMake(SWMOD[it.sid].mid,2.2):null,'side'));
 const sp=(it.t==='w'||it.t==='g')&&typeof mdlSpec==='function'?mdlSpec(it.t==='w'?it.w:vw,null):null;
 if(sp&&!MDL.cache[sp.mid]&&!MDL.fail[sp.mid])return mdlLoad(sp.mid,()=>shStageObj(it,cb));
 if(it.t==='w')return cb(boxW(it.w,skinOf(it.w)),'sidel');
 if(it.t==='g')return cb(boxW(vw,SKIN(it.id)),'sidel');
 if(it.t==='op')return cb(optModel(it.id).g,'sidel');
 if(it.t==='c'){try{return cb(mkHuman(CHAR(chWithKit(it.id)),false).root,'frontl')}catch(e){return cb(null)}}
 if(it.t==='f'){try{return cb(mkHuman(CHAR(chWithKit(SV.eq.c,it.id)),false).root,'frontl')}catch(e){return cb(null)}}
 cb(null);
}
function shStageSet(it){
 SH.selKey=it?it.id+'|'+(it.t==='g'?vw:''):'';
 if(SH.so&&SH.ss)SH.ss.remove(SH.so);
 SH.so=null;
 const big=$('shb'),cv=$('shc');if(!it||!cv)return;
 const key=SH.selKey;
 if(it.t==='x'||it.t==='k'||it.t==='oi'){
  cv.classList.add('off');big.classList.remove('off');
  big.innerHTML=it.t==='x'?xicon(it.c):it.t==='k'?crateicon(it.cr.col):`<span class='em'>${ITM[it.iid].ic}</span>`;
  return;
 }
 big.classList.add('off');cv.classList.remove('off');
 shStageObj(it,(obj,view)=>{
  if(key!==SH.selKey||!obj)return;
  if(!SH.sr){
   SH.sr=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});SH.sr.outputEncoding=THREE.sRGBEncoding;
   SH.ss=new THREE.Scene();
   SH.ss.add(new THREE.HemisphereLight(0xffffff,0x556070,1.5));
   const d=new THREE.DirectionalLight(0xffffff,1.9);d.position.set(3,4,5);SH.ss.add(d);
   const e=new THREE.DirectionalLight(0x7fd6ff,1);e.position.set(-4,1,-3);SH.ss.add(e);
   SH.sc=new THREE.PerspectiveCamera(28,560/300,.05,80);
  }
  if(SH.so)SH.ss.remove(SH.so);
  for(const ch of SH.ss.children.slice())if(ch.userData&&ch.userData.stage)SH.ss.remove(ch);
  const pv=new THREE.Group();pv.add(obj);
  const f=mdlFit(pv,Math.PI/2,560/300,SH.sc.fov,1);
  pv.position.set(-f.c.x,-f.c.y,-f.c.z);
  const o=new THREE.Group();o.add(pv);o.userData.stage=1;
  const r=f.sz.length()/2;
  const front=/^front/.test(view);SH.lin=/l$/.test(view);
  SH.cd=Math.max(front?f.sz.y*1.25/(2*Math.tan(SH.sc.fov*Math.PI/360)):0,r*1.02/Math.sin(SH.sc.fov*Math.PI/360)*(front?.7:.72));
  SH.cy=front?0:f.sz.y*.18;
  SH.so=o;SH.ss.add(o);SH.t0=performance.now();
  if(!SH.raf)SH.raf=requestAnimationFrame(shLoop);
 });
}
function shLoop(){
 SH.raf=0;
 if(curView!=='shop'&&curView!=='inv')return;
 const cv=$('shc');
 SH.raf=requestAnimationFrame(shLoop);
 if(!cv||!SH.so||!SH.sr)return;
 const t=(performance.now()-SH.t0)/1000;
 SH.so.rotation.y=t*.8+.4;
 SH.sr.setSize(560,300);SH.sr.setClearColor(0,0);SH.sr.outputEncoding=SH.lin?THREE.LinearEncoding:THREE.sRGBEncoding;
 SH.sc.position.set(0,SH.cy,SH.cd);SH.sc.lookAt(0,0,0);
 SH.sr.render(SH.ss,SH.sc);
 const c2=cv.getContext('2d');c2.clearRect(0,0,560,300);c2.drawImage(SH.sr.domElement,0,0);
}

/* ----- Eylemler ----- */
function shEquip(i){
 setTimeout(mdlPreload,50);
 if(i.t==='m'){SV.mod[i.m.cls]=i.id;SV.eq.w=(i.m.cls==='pistol'&&SV.eq.w==='dual')?'dual':i.m.cls;applyEq(true)}
 else if(i.t==='w'){SV.eq.w=i.w;if(i.w!=='dual')delete SV.mod[i.w];applyEq(true)}
 else equip(i);
}
function shAct(id){
 const i=shFind(id);if(!i)return;
 SH.msg='';
 if(i.t==='oi'){invTake(i.iid,1);SV.tl+=ITM[i.iid].p;SH.msg=ITM[i.iid].n+' satıldı +'+ITM[i.iid].p+' TL';save();bal();view(vm);return}
 if(i.t==='ws'){
  if(SV.ow.sw.includes(i.sid)){SV.ow.mw=i.sid;SH.msg='Kuşanıldı (açık dünyada geçerli)'}
  else{
   const done=payFor(i.p,i.n,()=>{SV.ow.sw.push(i.sid);SV.ow.mw=i.sid;SH.msg='Satın alındı: '+i.n;save();bal();view(vm)});
   if(done!==false&&typeof payDialog==='function')return;
   if(done===false){SH.msg=vmsg||'Yetmiyor'}
  }
  save();bal();view(vm);return;
 }
 if(i.t==='k'){crateOpen(i.id);return}
 if(vm==='shop'&&!own(i)){
  const done=payFor(i.p,i.n,()=>{SV.own.push(i.id);shEquip(i);SH.msg='Satın alındı ve kuşanıldı: '+i.n;save();bal();view(vm)});
  if(done!==false&&typeof payDialog==='function')return;
  if(done===false){SH.msg=vmsg||'Yetmiyor'}
 }else{shEquip(i);SH.msg='Kuşanıldı: '+i.n}
 save();bal();view(vm);
}
function shPreview(i){
 if(typeof lobbyPreviewKit==='function')lobbyPreviewKit(i&&i.t==='f'?i.id:undefined);
 if(i&&i.t==='c')lobbyPreview(i.id);
 else if(lobbyPreview&&LB.prev)lobbyPreview(null);
 if(i&&i.t==='m')lobbyPreviewGun(i.m.cls==='pistol'&&SV.eq.w==='dual'?'dual':i.m.cls,i.id);
 else if(i&&i.t==='w')lobbyPreviewGun(i.w,null);
 else if(i&&i.t==='ws')lobbyPreviewGun(i.sid,null);
 else lobbyPreviewGun(null,null);
}
function shWire(){
 const a=$('av');
 const sk=$('shskip');if(sk)sk.onchange=()=>{SET.skipCrate=sk.checked;saveSet()};
 a.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{SH.tab=b.dataset.t;SH.sel=null;SH.msg='';view(vm)});
 a.querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>{SH.sub=b.dataset.sub;SH.sel=null;SH.msg='';view(vm)});
 a.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{vw=b.dataset.w;SH.msg='';view(vm)});
 a.querySelectorAll('[data-sl]').forEach(c=>c.onclick=()=>{const s=shSlots()[+c.dataset.sl];SH.tab=s.tab;SH.sub=s.sub||'all';SH.sel=s.i.id;SH.msg='';view(vm)});
 a.querySelectorAll('[data-s]').forEach(c=>c.onclick=()=>{
  SH.sel=c.dataset.s;SH.msg='';
  a.querySelectorAll('.sc.on').forEach(x=>x.classList.remove('on'));c.classList.add('on');
  const it=shFind(SH.sel);
  const sd=a.querySelector('.sh-side');if(sd&&it){sd.innerHTML=shSide(it);shSideWire()}
  shStageSet(it);shPreview(it);
 });
 a.querySelectorAll('.sc [data-b]').forEach(b=>b.onclick=e=>{e.stopPropagation();SH.sel=b.dataset.b;shAct(b.dataset.b)});
 shSideWire();
 const it=shFind(SH.sel);
 shStageSet(it);shPreview(it);shFill();
}
function shSideWire(){
 document.querySelectorAll('#av .sh-side [data-b]').forEach(b=>b.onclick=()=>shAct(b.dataset.b));
}
VIEWS.shop=VIEWS.inv=shopNew;
VIEWWIRE.shop=VIEWWIRE.inv=shWire;

setTimeout(mdlPreload,3500);
