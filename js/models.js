'use strict';
/* ===== N.P.N.G model kütüphanesi =====
   GLB dosyaları assets/<id>.js içinde base64 olarak durur, ilk istekte yüklenir (lazy).
   Her model standart çerçeveye oturtulur: uzunluk +Z (uç/namlu +Z), yukarı +Y, merkez orijin. */
const MDL={cache:{},wait:{},icons:{},fail:{}};
/* Yön düzeltmeleri (otomatik tahmin yanlışsa): z:-1 uç/namlu yönünü çevirir, y:-1 yukarıyı çevirir */
const MDLFIX={};
/* Baş aşağı gelen modeller (otomatik tespit yetmezse elle): P90 kabza/tutamak üstte geliyordu */
const MDLFLIPY={lg_fn_p90:1,lg_s12p8:1};

function mdlScript(id,cb){
 if(window.NPNG_G&&NPNG_G[id])return cb(true);
 const s=document.createElement('script');s.src='assets/'+id+'.js';
 s.onload=()=>cb(!!(window.NPNG_G&&NPNG_G[id]));s.onerror=()=>cb(false);
 document.head.appendChild(s);
}
function mdlB64(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer}

/* En büyük eksen → Z, ortanca → Y, en küçük → X. İşaretleri kütle merkezi ile tahmin eder. */
function mdlNorm(id,scene){
 scene.updateMatrixWorld(true);
 const pts=[],v=new THREE.Vector3(),mn=new THREE.Vector3(1e9,1e9,1e9),mx=new THREE.Vector3(-1e9,-1e9,-1e9),cen=new THREE.Vector3();
 let n=0;
 scene.traverse(o=>{
  if(!o.isMesh)return;
  o.frustumCulled=false;
  const p=o.geometry.attributes.position;
  const st=Math.max(1,Math.floor(p.count/600));
  for(let i=0;i<p.count;i+=st){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);pts.push(v.x,v.y,v.z);cen.add(v);n++}
 });
 // bbox'ı tüm köşelerle hesapla
 scene.traverse(o=>{
  if(!o.isMesh)return;
  const p=o.geometry.attributes.position;
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);mn.min(v);mx.max(v)}
 });
 cen.multiplyScalar(1/Math.max(1,n));
 const ext=[mx.x-mn.x,mx.y-mn.y,mx.z-mn.z],mid=[(mx.x+mn.x)/2,(mx.y+mn.y)/2,(mx.z+mn.z)/2],ct=[cen.x,cen.y,cen.z];
 const ord=[0,1,2].sort((a,b)=>ext[b]-ext[a]); // ord[0]=uzun, ord[1]=orta, ord[2]=ince
 const ax=i=>{const a=new THREE.Vector3();a.setComponent(i,1);return a};
 const fx=MDLFIX[id]||{};
 const isSword=/^(sw_|kn_|lg_(knife|large_knife|tomahawk|katana|trench_mace|morningstar))/.test(id);
 // Z işareti: silahta kütle merkezi dipçik/kabza tarafında, uç tersi; kılıç/bıçakta uç kütle merkezi tarafı
 let sz=Math.sign(ct[ord[0]]-mid[ord[0]])||1;
 sz=isSword?sz:-sz;
 // Y işareti: kütle merkezi ortalamanın altında kalacak şekilde (şarjör/kabza aşağı)
 let sy=(Math.sign(ct[ord[1]]-mid[ord[1]])||1);
 if(isSword)sy=1;
 if(fx.f)sz=-sz;if(fx.z)sz=fx.z;
 if(fx.y)sy=fx.y;
 const Z=ax(ord[0]).multiplyScalar(sz),Y=ax(ord[1]).multiplyScalar(sy),X=new THREE.Vector3().crossVectors(Y,Z);
 // dünya→yerel: yerel eksenler X,Y,Z; matris satırları
 const M=new THREE.Matrix4().makeBasis(X,Y,Z).transpose();
 const T=new THREE.Matrix4().makeTranslation(-mid[0],-mid[1],-mid[2]);
 const g=new THREE.Group();g.add(scene);
 g.matrixAutoUpdate=false;g.matrix.multiplyMatrices(M,T);g.matrixWorldNeedsUpdate=true;
 // Lambert'e çevir (hafif)
 scene.traverse(o=>{
  if(!o.isMesh)return;
  const m=o.material;if(!m)return;
  const nm=new THREE.MeshLambertMaterial({color:m.color?m.color.clone():0xffffff,map:m.map||null,vertexColors:!!o.geometry.attributes.color,side:m.side===THREE.DoubleSide?THREE.DoubleSide:THREE.FrontSide,transparent:!!m.transparent,opacity:m.opacity,emissive:m.emissive?m.emissive.clone():0x000000,emissiveMap:m.emissiveMap||null});
  if(m.map)m.map.encoding=THREE.sRGBEncoding;
  o.material=nm;
 });
 const bake=new THREE.Group();bake.add(g);bake.updateMatrixWorld(true);
 return {obj:bake,L:ext[ord[0]],H:ext[ord[1]],W:ext[ord[2]]};
}


/* Baş aşağı gelen silah modellerini (şarjör/kabza yukarıda) otomatik 180° çevirir (Z ekseni etrafında) */
function mdlKindOf(id){
 if(typeof WMOD==='undefined')return null;
 for(const m of WMOD)if(m.mid===id)return m.cls==='pistol'?'pistol':(m.cls==='smg'?'smg':(m.cls==='knife'?null:'rifle'));
 return null;
}
function mdlAutoFlip(id,r){
 const kd=mdlKindOf(id);if(!kd||!r)return r;
 try{
  const G=mdlGripsObj(r.obj,kd,id);
  if(G.flipY||MDLFLIPY[id]){
   const w=new THREE.Group();w.rotation.z=Math.PI;w.add(r.obj);w.updateMatrixWorld(true);
   r.obj=w;r.flipped=1;
  }
 }catch(e){console.warn('autoflip',id,e)}
 return r;
}
function mdlLoad(id,cb){
 if(MDL.cache[id])return cb(MDL.cache[id]);
 if(MDL.fail[id])return cb(null);
 if(MDL.wait[id])return MDL.wait[id].push(cb);
 MDL.wait[id]=[cb];
 const done=r=>{const w=MDL.wait[id];delete MDL.wait[id];if(r)MDL.cache[id]=r;else MDL.fail[id]=1;w.forEach(f=>f(r))};
 mdlScript(id,ok=>{
  if(!ok)return done(null);
  try{
   new THREE.GLTFLoader().parse(mdlB64(NPNG_G[id]),'',gl=>{
    try{done(mdlAutoFlip(id,mdlNorm(id,gl.scene)))}catch(e){console.warn('mdlNorm',id,e);done(null)}
   },e=>{console.warn('glb',id,e);done(null)});
  }catch(e){console.warn('glb',id,e);done(null)}
 });
}
/* len: istenen uzunluk (m). Dönen grup: merkez orijinde, uç +Z. Yüklenmediyse null */
function mdlMake(id,len){
 const m=MDL.cache[id];if(!m)return null;
 const o=m.obj.clone(true);const g=new THREE.Group();g.add(o);
 g.scale.setScalar(len/m.L);g.userData.L=len;g.userData.H=m.H*len/m.L;g.userData.W=m.W*len/m.L;
 return g;
}

/* ----- Sığdırma: uzunluğu Z ekseninde olan nesneyi Y etrafında ang kadar döndürüp kameraya sığdırır ----- */
/* kutu: iskeletli (skinned) mesh'lerde geometri bağlama pozunda ve başka birimde (asker: santimetre) durduğu için
   Box3.setFromObject yanlış (100 kat büyük) çıkıyordu → kamera çok uzağa gidip küçük resim boş kalıyordu.
   İskeletli parçalarda kemiklerin gerçek konumları kullanılır. */
function mdlBox(obj){
 const b=new THREE.Box3(),v=new THREE.Vector3(),bb=new THREE.Box3();let sk=false;
 obj.traverse(o=>{
  if(o.isSkinnedMesh&&o.skeleton){sk=true;for(const bn of o.skeleton.bones)b.expandByPoint(v.setFromMatrixPosition(bn.matrixWorld))}
  else if(o.isMesh||o.isLine||o.isPoints){const g=o.geometry;if(!g)return;if(!g.boundingBox)g.computeBoundingBox();if(g.boundingBox.isEmpty())return;bb.copy(g.boundingBox).applyMatrix4(o.matrixWorld);b.union(bb)}
 });
 if(sk&&!b.isEmpty()){const s=b.getSize(v);b.expandByScalar(Math.max(s.x,s.y,s.z)*.06)}
 return b;
}
function mdlFit(obj,ang,aspect,fov,pad){
 obj.updateMatrixWorld(true);
 const b=mdlBox(obj),sz=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());
 const sa=Math.abs(Math.sin(ang)),ca=Math.abs(Math.cos(ang)),th=Math.tan(fov*Math.PI/360);
 const needW=(sz.x*ca+sz.z*sa)*(pad||1.1),needH=sz.y*(pad||1.1);
 const dist=Math.max(needW/(2*th*aspect),needH/(2*th))+(sz.x*sa+sz.z*ca)/2;
 return {dist,sz,c};
}
/* ----- Küçük resimler: tek ortak, ekran dışı renderer; kuyruk sırayla işler ----- */
let _ir=null,_is=null,_ic=null;
function mdlIconInit(){
 if(_ir)return;
 _ir=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
 _ir.outputEncoding=THREE.sRGBEncoding;
 _is=new THREE.Scene();
 _is.add(new THREE.HemisphereLight(0xffffff,0x556070,1.5));
 const d=new THREE.DirectionalLight(0xffffff,1.9);d.position.set(3,4,5);_is.add(d);
 const e=new THREE.DirectionalLight(0x7fd6ff,.9);e.position.set(-4,1,-3);_is.add(e);
 _ic=new THREE.PerspectiveCamera(28,1,.05,80);
}
const _iq=[];let _ib=false;
/* make(done): nesneyi (uzunluk +Z) üretip done(obj) çağırır. view: 'side' (silah) ya da 'front' (karakter) */
function mdlIconObj(key,w,h,make,cb,view){
 if(MDL.icons[key])return cb(MDL.icons[key]);
 _iq.push([key,w,h,make,cb,view||'side']);
 if(!_ib){_ib=true;setTimeout(mdlIconPump,0)}
}
function mdlIcon(id,w,h,cb){
 mdlIconObj(id+'@'+w+'x'+h,w,h,done=>mdlLoad(id,m=>done(m?mdlMake(id,2):null)),cb,'side');
}
function mdlIconClear(){_iq.length=0;_ib=false}
function mdlIconPump(){
 const q=_iq.shift();
 if(!q){_ib=false;return}
 const [key,w,h,make,cb,view0]=q;
 const lin=/l$/.test(view0),view=view0.replace(/l$/,'');
 if(MDL.icons[key]){cb(MDL.icons[key]);return setTimeout(mdlIconPump,0)}
 const fail=()=>{try{cb(null)}catch(e){}setTimeout(mdlIconPump,0)};
 try{make(obj=>{
  if(!obj)return fail();
  try{
   mdlIconInit();_ir.outputEncoding=lin?THREE.LinearEncoding:THREE.sRGBEncoding;
   const pv=new THREE.Group();pv.add(obj);
   const ang=view==='front'?-.45:Math.PI/2-.5;
   _ir.setSize(w,h);_ic.aspect=w/h;
   const f=mdlFit(pv,ang,w/h,_ic.fov,view==='front'?1.06:1.02);
   if(!(f.sz.x+f.sz.y+f.sz.z>0)){try{cb(null)}catch(e){}return setTimeout(mdlIconPump,0)} /* boş model (henüz yüklenmemiş): boş resmi önbelleğe yazma */
   pv.position.set(-f.c.x,-f.c.y,-f.c.z);
   const o=new THREE.Group();o.add(pv);o.rotation.y=ang;_is.add(o);
   _ic.position.set(0,view==='front'?.1*f.sz.y:.2*f.sz.y,f.dist);_ic.lookAt(0,0,0);_ic.updateProjectionMatrix();
   _ir.setClearColor(0x000000,0);_ir.render(_is,_ic);
   const url=_ir.domElement.toDataURL('image/png');
   _is.remove(o);MDL.icons[key]=url;
   cb(url);
  }catch(e){console.warn('icon',key,e);try{cb(null)}catch(_){}}
  setTimeout(mdlIconPump,0);
 })}catch(e){console.warn('icon make',key,e);fail()}
}

/* ===== Geometriden otomatik tutuş noktaları =====
   Model, mdlNorm sonrası standart çerçevede: uzunluk +Z (namlu +Z), yukarı +Y, merkez orijin.
   Noktalar (y,z) olarak, modelin kendi birimlerinde döner (x=0 varsayılır). Hiçbiri elle tahmin edilmez:
   - kabza: alta doğru çıkıntıların içinde, aşağı inerken GERİYE yatan (eğimli) olan; şarjör öne/dik gider
   - şarjör: kabza dışındaki alt çıkıntı; ön tutamak: şarjörün de ötesinde, öndeki küçük alt çıkıntı
   - sol el: ön tutamak varsa onun ortası; yoksa şarjör ile namlu arasındaki kundağın ALT yüzü
   - dipçik: en arka dilimin orta noktası, namlu: en ön dilimin orta noktası
   conf (0..1) düşükse model listelenir (sessizce geçilmez). */

/* yüzey örnekleme: üçgenlerin alanı ile orantılı rastgele noktalar (köşe noktası seyrek modellerde de doğru profil verir) */
function mdlSurf(obj,fn,N){
 N=N||60000;obj.updateMatrixWorld(true);
 const tris=[];let tot=0;const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),e1=new THREE.Vector3(),e2=new THREE.Vector3();
 obj.traverse(o=>{
  if(!o.isMesh)return;const g=o.geometry,p=g.attributes.position;if(!p)return;
  const ix=g.index,tc=ix?ix.count/3:p.count/3;
  for(let t=0;t<tc;t++){
   const i0=ix?ix.getX(t*3):t*3,i1=ix?ix.getX(t*3+1):t*3+1,i2=ix?ix.getX(t*3+2):t*3+2;
   a.fromBufferAttribute(p,i0).applyMatrix4(o.matrixWorld);b.fromBufferAttribute(p,i1).applyMatrix4(o.matrixWorld);c.fromBufferAttribute(p,i2).applyMatrix4(o.matrixWorld);
   e1.subVectors(b,a);e2.subVectors(c,a);const ar=e1.cross(e2).length()*.5;if(ar<=0)continue;
   tot+=ar;tris.push(a.y,a.z,b.y,b.z,c.y,c.z,tot);
  }
 });
 const T=tris.length/7;if(!T)return;
 let seed=987654321;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 // köşeleri de ekle (uç noktalar kaçmasın)
 for(let t=0;t<T;t++){fn(tris[t*7],tris[t*7+1]);fn(tris[t*7+2],tris[t*7+3]);fn(tris[t*7+4],tris[t*7+5])}
 for(let k=0;k<N;k++){
  const r=rnd()*tot;let lo=0,hi=T-1;while(lo<hi){const m=(lo+hi)>>1;if(tris[m*7+6]<r)lo=m+1;else hi=m}
  const o=lo*7;let u=rnd(),w=rnd();if(u+w>1){u=1-u;w=1-w}
  fn(tris[o]+(tris[o+2]-tris[o])*u+(tris[o+4]-tris[o])*w,tris[o+1]+(tris[o+3]-tris[o+1])*u+(tris[o+5]-tris[o+1])*w);
 }
}
const MDLG={};
/* bullpup silahlarda kabza şarjörün ÖNÜNDEDİR (şarjör arkada) */
const MDL_BULLPUP={lg_steyr_aug:1,lg_steyr_aug_hbar:1,lg_famas_f1:1,lg_l85a2:1};
/* profil (dilim başına değer) üzerinde çıkıntıları bulur: morfolojik açma → tepe noktaları (belirginlik ≥ %35) → vadilerle sınırlı kümeler */
function mdlPeaks(f,NB,W,thr){
 const er=f.map((_,i)=>{let v=1e9;for(let k=Math.max(0,i-W);k<=Math.min(NB-1,i+W);k++)if(f[k]<v)v=f[k];return v});
 const base=er.map((_,i)=>{let v=-1e9;for(let k=Math.max(0,i-W);k<=Math.min(NB-1,i+W);k++)if(er[k]>v)v=er[k];return v});
 const dep=f.map((v,i)=>v-base[i]);
 const pk=[];
 for(let i=0;i<NB;i++){
  if(dep[i]<thr)continue;
  if((i>0&&dep[i]<dep[i-1])||(i<NB-1&&dep[i]<dep[i+1]))continue;
  if(i>0&&dep[i]===dep[i-1])continue;
  let lm=dep[i],k=i,le=false;while(k>0&&dep[k-1]<=dep[i]){k--;if(dep[k]<lm)lm=dep[k]}if(k===0)le=true;
  let rm=dep[i],re=false;k=i;while(k<NB-1&&dep[k+1]<=dep[i]){k++;if(dep[k]<rm)rm=dep[k]}if(k===NB-1)re=true;
  // dizi kenarına ulaşan taraf sınırlayıcı değildir
  const prom=dep[i]-Math.max(le?-1e9:lm,re?-1e9:rm,0);
  if(prom>=.35*dep[i])pk.push(i);
 }
 const vall=[];
 for(let q=0;q<pk.length-1;q++){let vm=pk[q],mv=1e9;for(let k=pk[q];k<=pk[q+1];k++)if(dep[k]<mv){mv=dep[k];vm=k}vall.push(vm)}
 const out=[];
 for(let q=0;q<pk.length;q++){
  const p=pk[q],lim0=q>0?vall[q-1]:0,lim1=q<pk.length-1?vall[q]:NB-1;
  let lb=p;while(lb>lim0&&dep[lb-1]>=thr)lb--;
  let rb=p;while(rb<lim1&&dep[rb+1]>=thr)rb++;
  let ar=0,d=0;for(let k=lb;k<=rb;k++){ar+=dep[k];if(dep[k]>d)d=dep[k]}
  out.push({b0:lb,b1:rb,d,ar,base:base[p]});
 }
 return out;
}
function mdlGripsObj(obj,kind,id){
 const Y=[],Z=[];
 mdlSurf(obj,(y,z)=>{Y.push(y);Z.push(z)});
 const n=Y.length;if(n<50)return {conf:0,why:'az nokta'};
 let zmin=1e9,zmax=-1e9,ymin=1e9,ymax=-1e9;
 for(let i=0;i<n;i++){if(Z[i]<zmin)zmin=Z[i];if(Z[i]>zmax)zmax=Z[i];if(Y[i]<ymin)ymin=Y[i];if(Y[i]>ymax)ymax=Y[i]}
 const L=zmax-zmin,H=ymax-ymin,NB=100,bw=L/NB,pis=kind==='pistol';
 let lo=new Array(NB).fill(1e9),hi=new Array(NB).fill(-1e9),cnt=new Array(NB).fill(0);
 for(let i=0;i<n;i++){let b=Math.floor((Z[i]-zmin)/bw);if(b>=NB)b=NB-1;cnt[b]++;if(Y[i]<lo[b])lo[b]=Y[i];if(Y[i]>hi[b])hi[b]=Y[i]}
 for(let pass=0;pass<6;pass++)for(let b=0;b<NB;b++)if(cnt[b]<2){const a=b>0&&cnt[b-1]>=2?b-1:-1,c=b<NB-1&&cnt[b+1]>=2?b+1:-1;if(a>=0||c>=0){lo[b]=a<0?lo[c]:(c<0?lo[a]:Math.min(lo[a],lo[c]));hi[b]=a<0?hi[c]:(c<0?hi[a]:Math.max(hi[a],hi[c]));cnt[b]=2}}
 const med=a=>a.map((v,i)=>{const t=[a[Math.max(0,i-1)],v,a[Math.min(NB-1,i+1)]].sort((x,y)=>x-y);return t[1]});
 lo=med(lo);hi=med(hi);
 const W=Math.round((pis?.45:.2)*NB),thr=.08*H;
 const bot=mdlPeaks(lo.map(v=>-v),NB,W,thr),top=mdlPeaks(hi,NB,W,thr);
 const out={zmin,zmax,ymin,ymax,L,H,conf:1,why:'',flipY:false};
 // yukarı çıkıntılar aşağıdakinden çok baskınsa model baş aşağıdır (şarjör/kabza yukarı bakıyor)
 const sa=a=>a.reduce((t,r)=>t+r.ar,0);
 if(sa(top)>1.6*sa(bot)&&top.some(r=>r.d>=.15*H)){out.flipY=true;out.why='Y ters (şarjör/kabza yukarıda)'}
 const R=bot.map(r=>{
  const yb=-r.base,z0=zmin+r.b0*bw,z1=zmin+(r.b1+1)*bw,w=z1-z0;
  let zt=0,ct=0,zb=0,cb=0;
  for(let i=0;i<n;i++){if(Z[i]<z0-bw||Z[i]>z1+bw)continue;const fr=(yb-Y[i])/r.d;if(fr>=.1&&fr<=.4){zt+=Z[i];ct++}else if(fr>=.65&&fr<=1.02){zb+=Z[i];cb++}}
  const zT=ct?zt/ct:(z0+z1)/2,zB=cb?zb/cb:zT;
  return {z0,z1,w,d:r.d,yb,zm:(zT+zB)/2,lean:(zT-zB)/Math.max(r.d,1e-6),bip:(w<.055*L&&r.d>2.2*w)};
 });
 out.runs=R.map(r=>({z0:+r.z0.toFixed(3),z1:+r.z1.toFixed(3),d:+r.d.toFixed(3),lean:+r.lean.toFixed(2),bip:r.bip}));
 const real=R.filter(r=>!r.bip&&(pis||r.z0>zmin+.1*L));
 let grip=null;
 if(real.length){
  if(pis)grip=real.reduce((a,b)=>a.d*a.w>b.d*b.w?a:b);
  else if(MDL_BULLPUP[id]){grip=real.length>=2?real[1]:real[0];out.why+=' bullpup: kabza şarjörün önünde'}
  else{
   const gc=real.filter(r=>r.lean>.1&&r.w<.25*L);
   grip=gc.length?gc.reduce((a,b)=>a.zm<b.zm?a:b):real[0];
   if(!gc.length){out.conf=.55;out.why+=' kabza eğimi belirsiz, en arkadaki çıkıntı seçildi'}
  }
 }
 if(!grip){
  const b=Math.round(.38*NB);out.gR=[lo[b]+.25*(hi[b]-lo[b]),zmin+.38*L];out.conf=.3;out.why+=' belirgin kabza çıkıntısı yok, gövde ortası kullanıldı';
 }else{
  const yg=grip.yb-grip.d*.38;let zs=0,cs=0;
  for(let i=0;i<n;i++)if(Math.abs(Y[i]-yg)<grip.d*.1&&Z[i]>=grip.z0-bw&&Z[i]<=grip.z1+bw){zs+=Z[i];cs++}
  out.gR=[yg,cs?zs/cs:grip.zm];out.grip={z0:grip.z0,z1:grip.z1,d:grip.d};
 }
 let mag=null,fg=null;
 if(!pis&&grip){
  const others=real.filter(r=>r!==grip);
  if(MDL_BULLPUP[id]){const bk=others.filter(r=>r.zm<grip.zm);if(bk.length)mag=bk[bk.length-1];const fr=others.filter(r=>r.zm>grip.zm);if(fr.length){const l=fr[fr.length-1];if(l.w<.12*L)fg=l}}
  else{const fr=others.filter(r=>r.zm>grip.zm);if(fr.length){mag=fr[0];if(fr.length>=2){const l=fr[fr.length-1];if(l.zm>mag.zm+.12*L&&l.w<.12*L)fg=l}}}
 }
 out.mag=mag?[mag.yb-mag.d*.5,mag.zm]:null;
 if(pis)out.gL=null;
 else if(fg){out.gL=[fg.yb-fg.d*.4,fg.zm];out.gLk='ön tutamak'}
 else{
  const frontMost=Math.max(mag?mag.z1:-1e9,grip?grip.z1:zmin);
  const zA=Math.max(frontMost+.03*L,zmin+.36*L),zB=zmax-.14*L;
  if(zB-zA<.07*L){out.gL=[lo[Math.round(.72*NB)],zmin+.72*L];out.conf=Math.min(out.conf,.5);out.why+=' ön kundak dar'}
  else{
   const zl=zA+(zB-zA)*.3,b=Math.max(0,Math.min(NB-1,Math.floor((zl-zmin)/bw)));out.gL=[lo[b],zl];out.gLk='kundak altı';
   out.support=[];
   for(let i=0;i<=8;i++){const z=zA+(zl-zA)*i/8,bi=Math.max(0,Math.min(NB-1,Math.floor((z-zmin)/bw)));out.support.push([lo[bi],z]);}
  }
 }
 // Ayrı ön tutamak erişilemiyorsa onun gerisindeki gerçek kundak yüzeyi de
 // geçerli bir destek alanıdır; şarjör ve kabzanın arkasına geçilmez.
 if(!pis&&!out.support&&out.gL){
  const start=Math.max(mag?mag.z1:-1e9,grip?grip.z1:zmin)+.03*L,end=out.gL[1];
  if(end-start>.07*L){out.support=[];for(let i=0;i<=8;i++){const z=start+(end-start)*i/8,b=Math.max(0,Math.min(NB-1,Math.floor((z-zmin)/bw)));out.support.push([lo[b],z]);}}
 }
 let ys=0,cs2=0,ym=0,cm=0;
 for(let b=0;b<NB;b++){if(b<4){ys+=(lo[b]+hi[b])/2;cs2++}if(b>=NB-3){ym+=(lo[b]+hi[b])/2;cm++}}
 out.st=[ys/cs2,zmin];out.mz=[ym/cm,zmax];out.top=ymax;out.yb=grip?grip.yb:ymin;
 return out;
}
function mdlGrips(id,kind){
 const key=id+'|'+kind;if(MDLG[key])return MDLG[key];
 const m=MDL.cache[id];if(!m)return null;
 return MDLG[key]=mdlGripsObj(m.obj,kind,id);
}

/* Ayrı şarjör parçasını model geometrisinden bul. Gövde/namlu kadar uzun
   parçaları kabul etme; tek parça modellerde uydurma kutu şarjör üretme. */
function mdlMagazine(mm,kind,id){
 const G=mdlGrips(id,kind);if(!G||G.conf<.5)return null;
 const anchor=G.mag||((kind==='pistol'&&G.gR)?G.gR:null);if(!anchor)return null;
 mm.updateWorldMatrix(true,true);
 const inv=mm.matrixWorld.clone().invert(),mat=new THREE.Matrix4(),box=new THREE.Box3();
 let best=null,volume=Infinity;
 mm.traverse(o=>{
  if(!o.isMesh||!o.geometry.attributes.position)return;
  o.geometry.computeBoundingBox();mat.multiplyMatrices(inv,o.matrixWorld);
  box.copy(o.geometry.boundingBox).applyMatrix4(mat);
  const sz=box.getSize(new THREE.Vector3());
  if(sz.z>G.L*.45||sz.y<G.H*.18||sz.z<G.L*.025)return;
  if(anchor[0]<box.min.y-G.H*.03||anchor[0]>box.max.y+G.H*.03||anchor[1]<box.min.z-G.L*.03||anchor[1]>box.max.z+G.L*.03)return;
  const v=sz.x*sz.y*sz.z;if(v<volume){volume=v;best=o;}
 });
 if(!best)return null;
 const worldBox=new THREE.Box3().setFromObject(best),center=worldBox.getCenter(new THREE.Vector3());
 const moving=new THREE.Group(),copy=best.clone();
 copy.matrixAutoUpdate=false;
 copy.matrix.copy(best.matrixWorld);copy.matrix.premultiply(new THREE.Matrix4().makeTranslation(-center.x,-center.y,-center.z));
 moving.add(copy);moving.visible=false;
 return {source:best,moving,center,size:worldBox.getSize(new THREE.Vector3())};
}
