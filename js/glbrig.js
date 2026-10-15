'use strict';
/* =====================================================================
   Gerçekçi GLB insan karakteri (prototip)
   - Model: "Soldier Full Tactical Gear" (DanlyVostok, CC-BY 4.0) - 114 kemikli, deri ağırlıklı (skinned) insan.
   - Mevcut animasyon sistemi (animHuman / driveHolder / poseGun / poseMelee) DEĞİŞMEDİ. Her karakterde
     görünmez bir "mantık iskeleti" (mkHuman kutuları) çalışmaya devam eder; GLB kemikleri her karede bu iskeletin
     çıktısını taklit eder (retarget). Bot, oyuncu, uzak oyuncu ve lobi aynı yolu kullanır.
   - Silahlar sağ/sol EL KEMİĞİNE bağlanır (kemiğin çocuğu). Kollar 2 kemikli IK ile avuç içini silah tutuşuna götürür.
   - Model yüklenemezse hiçbir şey değişmez: eski küp karakter görünür (güvenli yedek).
   ===================================================================== */
const ARM_K=1.22;
const GLBR={P:{},loading:{},ready:false,failed:false,err:'',tpl:null,tab:null,palm:{},len:{}};
const GL_PREFIX='CC_Base_';
const GL_BONES={hip:'Hip_01',pelvis:'Pelvis_02',waist:'Waist_033',sp1:'Spine01_034',sp2:'Spine02_035',head:'Head_038',
 thR:'R_Thigh_018',clR:'R_Calf_021',ftR:'R_Foot_022',thL:'L_Thigh_03',clL:'L_Calf_04',ftL:'L_Foot_05',
 uaR:'R_Upperarm_074',faR:'R_Forearm_077',haR:'R_Hand_081',mdR:'R_Mid1_082',
 uaL:'L_Upperarm_050',faL:'L_Forearm_051',haL:'L_Hand_055',mdL:'L_Mid1_056'};
/* sürülen kemik -> sürülen en yakın atası (aradaki kemikler sadece takip eder) */
const GL_ANC={hip:null,pelvis:'hip',waist:'hip',sp1:'waist',sp2:'sp1',head:'sp2',thR:'pelvis',clR:'thR',ftR:'clR',thL:'pelvis',clL:'thL',ftL:'clL',
 uaR:'sp2',faR:'uaR',haR:'faR',uaL:'sp2',faL:'uaL',haL:'faL'};
const GL_DRIVEN=Object.keys(GL_ANC);

const _gq1=new THREE.Quaternion(),_gq2=new THREE.Quaternion(),_gq3=new THREE.Quaternion(),_gq4=new THREE.Quaternion(),_gq5=new THREE.Quaternion();
const _gv1=V3(),_gv2=V3(),_gv3=V3(),_gv4=V3(),_gv5=V3(),_gv6=V3(),_gv7=V3(),_gs=V3();
const _ge=new THREE.Euler(),_gm=new THREE.Matrix4(),_gm2=new THREE.Matrix4();
const _RXN90=new THREE.Quaternion().setFromAxisAngle(V3(1,0,0),-Math.PI/2);
const _RZL=new THREE.Quaternion().setFromAxisAngle(V3(0,0,1),-1.1); // sol el: avuç yukarı bakacak şekilde

/* ---------- Yükleme ---------- */
function glbDecode(b64){const s=atob(b64),n=s.length,u=new Uint8Array(n);for(let i=0;i<n;i++)u[i]=s.charCodeAt(i);return u.buffer}
function glbFail(e,msg){GLBR.failed=true;GLBR.err=String(e&&e.message||e||msg);console.warn('GLB karakter yüklenemedi, küp karakter kullanılacak:',GLBR.err)}
function glbInit(){
 if(typeof THREE.GLTFLoader==='undefined'||typeof THREE.SkeletonUtils==='undefined'||typeof GLB_SOLDIER_B64==='undefined'){glbFail('GLTFLoader/model dosyası yok');return}
 try{
  new THREE.GLTFLoader().parse(glbDecode(GLB_SOLDIER_B64),'',g=>{
   try{glbPrep(g.scene);GLBR.ready=true;glbOnReady('soldier')}
   catch(e){glbFail(e)}
  },e=>glbFail(e));
 }catch(e){glbFail(e)}
}
function glbPrep(scene,pf){
 pf=pf||{id:'soldier',prefix:GL_PREFIX,bones:GL_BONES,bright:1.35};
 let n=0;
 scene.traverse(o=>{
  if(!o.isSkinnedMesh)return;
  n++;
  o.frustumCulled=false;o.raycast=()=>{}; // vuruş testi mantık kutularıyla yapılır
  const m=o.material,map=m.map||null;
  if(map){map.encoding=THREE.LinearEncoding;map.anisotropy=1;map.needsUpdate=true}
  const nm=new THREE.MeshLambertMaterial({map,skinning:true,transparent:!!m.transparent,opacity:m.opacity==null?1:m.opacity,side:THREE.FrontSide});
  if(map)nm.color.setRGB(pf.bright,pf.bright,pf.bright);else nm.color.copy(m.color||new THREE.Color(0x222222));
  if(pf.id!=='soldier'){nm.side=m.side===THREE.DoubleSide?THREE.DoubleSide:THREE.FrontSide;if(m.alphaTest>0){nm.alphaTest=m.alphaTest;nm.transparent=false}if(map){map.minFilter=THREE.LinearMipmapLinearFilter}}
  o.userData.part=m.name||''; /* parça adı (Mark_Kitel_1, Mark_Plate_1…): forma/kıyafet sistemi için */
  o.material=nm;
 });
 if(!n)throw new Error('modelde skinned mesh yok');
 /* iskelet doğrulama */
 scene.updateMatrixWorld(true);
 const tab={},B={};
 for(const k in pf.bones){
  const b=scene.getObjectByName(pf.prefix+pf.bones[k]);
  if(!b)throw new Error('eksik kemik: '+pf.bones[k]);
  B[k]=b;
 }
 const wp=V3(),ws=V3(),q=new THREE.Quaternion();
 const P0={},Q0={},pQ0={},palm={},len={};
 for(const k in B){
  B[k].matrixWorld.decompose(wp,q,ws);P0[k]=wp.clone();Q0[k]=q.clone();
  if(Math.abs(ws.x-ws.y)>1e-4||ws.x<=0)throw new Error('desteklenmeyen kemik ölçeği: '+k);
  B[k].parent.matrixWorld.decompose(wp,q,ws);pQ0[k]=q.clone();
 }
 for(const k of GL_DRIVEN)tab[k]={name:pf.bones[k],anc:GL_ANC[k],Q0:Q0[k],pQ0:pQ0[k],P0:P0[k]};
 for(const s of['R','L']){
  const pal=P0['ha'+s].clone().add(P0['md'+s].clone().sub(P0['ha'+s]).multiplyScalar(.55));
  palm[s]=B['ha'+s].worldToLocal(pal.clone());
  len[s]=[P0['ua'+s].distanceTo(P0['fa'+s]),P0['fa'+s].distanceTo(P0['ha'+s])];
  tab['palmRest'+s]=P0['md'+s].clone().sub(P0['ha'+s]).multiplyScalar(.55);
  tab['rdUA'+s]=P0['fa'+s].clone().sub(P0['ua'+s]).normalize();
  tab['rdFA'+s]=P0['ha'+s].clone().sub(P0['fa'+s]).normalize();
 }
 if(pf.skinFix)glbFixSkin(scene,pf,B,P0);
 const prof={id:pf.id,prefix:pf.prefix,bones:pf.bones,tab,tpl:scene,palm,len,skinFixed:pf.skinFixed||0,skinIslands:pf.skinIslands||[]};
 GLBR.P[pf.id]=prof;
 if(pf.id==='soldier'){GLBR.tab=tab;GLBR.tpl=scene;GLBR.palm=palm;GLBR.len=len}
 return prof;
}
/* Hatalı skin ağırlığı onarımı: bel/kalça kumaşı ve kılıf gibi gövdeye ait AYRI mesh parçalarının (bağlantılı "adalar") köşeleri,
   bind pozunda elin yanında durdukları için kol kemiklerine de bağlanmış; kol kalkınca kumaşı da çekiyor ve kumaş şeritler halinde uzuyor.
   Gövde ana adası (n>=2500) ve eldiven/el gibi alçak adalar (tepe y <= pf.skinFix) dokunulmaz; geri kalan adalarda kol ağırlığı en yakın
   gövde kemiğine (hip/pelvis/waist/uyluk) aktarılır. Yalnızca ağırlık dizisi değişir; kemik/poz/mesh aynı kalır. */
function glbFixSkin(scene,pf,B,P0){
 const topY=pf.skinFix,armK=new Set(['uaR','faR','haR','mdR','uaL','faL','haL','mdL']),body=['hip','pelvis','waist','thR','thL'];
 const v=V3();let moved=0;pf.skinIslands=[];
 scene.traverse(o=>{
  if(!o.isSkinnedMesh)return;
  const g=o.geometry,pos=g.attributes.position,idx=g.index,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;
  const key=o.skeleton.bones.map(b=>{for(const k in pf.bones)if(pf.prefix+pf.bones[k]===b.name)return k;return null});
  const bodyIdx=body.map(k=>key.indexOf(k));if(bodyIdx.some(i=>i<0))return;
  const pk=i=>Math.round(pos.getX(i)*1e3)+','+Math.round(pos.getY(i)*1e3)+','+Math.round(pos.getZ(i)*1e3);
  const par=new Map(),find=a=>{while(par.get(a)!==a){par.set(a,par.get(par.get(a)));a=par.get(a)}return a};
  for(let i=0;i<pos.count;i++){const k=pk(i);if(!par.has(k))par.set(k,k)}
  const un=(a,b)=>{a=find(a);b=find(b);if(a!==b)par.set(a,b)},n3=idx?idx.count:pos.count;
  for(let t=0;t<n3;t+=3){const a=idx?idx.getX(t):t,b=idx?idx.getX(t+1):t+1,c=idx?idx.getX(t+2):t+2;un(pk(a),pk(b));un(pk(a),pk(c))}
  const gx=[si.getX,si.getY,si.getZ,si.getW],gw=[sw.getX,sw.getY,sw.getZ,sw.getW],st=[si.setX,si.setY,si.setZ,si.setW];
  const isl=new Map();
  for(let i=0;i<pos.count;i++){
   const r=find(pk(i));let e=isl.get(r);if(!e){e={vs:[],arm:0,top:-9};isl.set(r,e)}
   e.vs.push(i);v.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);if(v.y>e.top)e.top=v.y;
   for(let k=0;k<4;k++){const w=gw[k].call(sw,i);if(w>0&&armK.has(key[gx[k].call(si,i)]))e.arm+=w}
  }
  for(const e of isl.values()){
   const mean=e.arm/e.vs.length;
   if(e.vs.length>=2500||mean<=.05||e.top<=topY)continue;
   for(const i of e.vs){
    let bi=bodyIdx[0],bd=9;v.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);
    body.forEach((k,j)=>{const dd=v.distanceTo(P0[k]);if(dd<bd){bd=dd;bi=bodyIdx[j]}});
    for(let k=0;k<4;k++)if(gw[k].call(sw,i)>0&&armK.has(key[gx[k].call(si,i)]))st[k].call(si,i,bi);
    moved++;
   }
   pf.skinIslands.push([o.name,e.vs.length,+mean.toFixed(2),+e.top.toFixed(2)]);
  }
  si.needsUpdate=true;
 });
 pf.skinFixed=moved;
}
function glbOnReady(id){
 if(typeof SV==='undefined'||!SV){setTimeout(()=>glbOnReady(id),800);return}
 if(typeof kitPrebake==='function')setTimeout(kitPrebake,1200);
 try{
  /* id: yeni yüklenen model ('soldier' ya da şampiyon). Sadece o modeli kullananlar yenilenir (maç içinde takılma olmasın) */
  const uses=c=>!id||(id==='soldier'?c.glb===1:c.glb===id);
  if(typeof MDL!=='undefined'&&MDL.icons)for(const c of CHARS)if(uses(c))delete MDL.icons['ch:'+c.id];
  if(typeof rebuildPlayerModels==='function'&&uses(CHAR(SV.eq.c)))rebuildPlayerModels();
  if(typeof LB!=='undefined'&&typeof lobbyBuildSlot==='function')LB.slots.forEach((s,i)=>{const cid=s.d&&(s.d.me?(LB.prev||SV.eq.c):s.d.ch);if(!cid||uses(CHAR(cid)))lobbyBuildSlot(i)});
  /* çevrimiçi oyuncular: modeli yüklenmeden önce küp olarak eklenenleri gerçek modele çevir */
  if(typeof MPL!=='undefined'&&MPL.ents)for(const e of MPL.ents.values())glbSwapRig(e);
  if(typeof OWN!=='undefined'&&OWN.ents)for(const e of OWN.ents.values())glbSwapRig(e);
 }catch(e){console.warn('GLB hazır işlemi',e)}
}
function glbSwapRig(e){
 if(!e||!e.ch||!e.rig||e.rig.gd||e.rig.glbFail)return;
 const c=CHAR(e.ch);if(typeof c.glb!=='string'||!GLBR.P[c.glb])return;
 const nr=mkHuman(c,false);if(!nr.gd)return;
 const sk=(e.sk&&e.sk[e.wk])||'g0',mid=(typeof mpModOf==='function'&&e.mods)?mpModOf(e.mods,e.wk):undefined;
 holderSet(nr,e.wk,SKIN(sk),mid);
 const og=e.g;nr.root.position.copy(og.position);nr.root.rotation.copy(og.rotation);nr.root.visible=og.visible;nr.root.userData=og.userData;
 if(og.parent){og.parent.add(nr.root);og.parent.remove(og)}
 if(typeof setShadow==='function')setShadow(nr.root);
 e.rig=nr;e.g=nr.root;e.swU=-1;e.rq=-1;
}

/* ---------- Rig kurulumu: mantık iskeleti + GLB gövde ---------- */
const _mkHuman0=mkHuman;
mkHuman=function(cols,zombie){
 if(cols&&cols.glb){
  const pid=cols.glb===1?'soldier':cols.glb;
  if(GLBR.P[pid]){try{return mkHumanGLB(cols,GLBR.P[pid],zombie)}catch(e){console.warn('GLB rig kurulamadı, küp karakter kullanılıyor:',e)}}
  else if(pid!=='soldier')glbLoadChar(pid);
 }
 return _mkHuman0(cols,zombie);
};

/* ---------- Taraftar formaları: tüm karakterlere giyilen aksesuar (özgün tasarım: gerçek arma, kulüp adı ve sponsor YOK) ----------
   Forma ayrı bir kuşanma yeridir (SV.eq.f). Hangi karakter seçiliyse onun "tişört bölgesi" boyanır: belden boyna kadar gövde ve
   omuzdan kolun ortasına kadar (kısa kol). Önkol, el, kafa ve belden aşağısı (pantolon/etek/çizme) olduğu gibi kalır.
   Boyama karakterin kendi dokusunun üstüne yapılır: dokunun her pikseli gövdede nereye düşüyorsa desen ona göre seçilir,
   kumaşın kıvrım gölgesi korunur. Saç/yüz/göz/cam gibi ayrı malzemeler boyanmaz. Kıyafetin ŞEKLİ değişmez, deseni değişir. */
const KITS={
 kartal:{pat:'stripes',a:'#121212',b:'#f4f4f4',sl:'#121212',col:'#121212',sw:.046,num:'#ffffff',numBg:'#121212',emb:'eagle',embC:'#ffffff',embBg:'#121212'},
 aslan:{pat:'halves',a:'#f5b800',b:'#b5121b',sl:'side',col:'#b5121b',num:'#ffffff',numBg:null,emb:'lion',embC:'#f5b800',embBg:'#b5121b'},
 kanarya:{pat:'stripes',a:'#ffd200',b:'#0c1f52',sl:'#0c1f52',col:'#0c1f52',sw:.042,num:'#ffffff',numBg:'#0c1f52',emb:'bird',embC:'#ffd200',embBg:'#0c1f52'},
 ayyildiz:{pat:'panels',a:'#c8102e',b:'#ffffff',sl:'#c8102e',col:'#c8102e',num:'#ffffff',numBg:'#c8102e',emb:'crescent',embC:'#ffffff',embBg:'#c8102e'}
};
const KITNO={kartal:3,aslan:10,kanarya:9,ayyildiz:7};
const KIT_HIDE={soldier:/Plate|Pouches/}; /* forma giyilince gizlenen parçalar (gövdeyi kapatan yelek vb.) */
const KIT_SKIP=/hair|eye|face|lash|brow|teeth|tooth|mouth|glass|glus|transparent|gun|holster|watch|tag|mask|helmet|env_|emissive/i;
const KITTEX={};
function hexRGB(h){const n=parseInt(h.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255]}
/* göğüs sembolü (soyut, özgün çizim) */
function kitEmblem(ctx,k,s){
 const K=KITS[k],c=s/2;ctx.clearRect(0,0,s,s);
 ctx.fillStyle=K.embBg;ctx.beginPath();ctx.arc(c,c,c*.96,0,7);ctx.fill();
 ctx.strokeStyle=K.embC;ctx.lineWidth=s*.05;ctx.beginPath();ctx.arc(c,c,c*.82,0,7);ctx.stroke();
 ctx.fillStyle=K.embC;ctx.beginPath();
 if(K.emb==='eagle'){ /* açık kanatlı kuş: kanatlar + baş */
  ctx.moveTo(c,c*.8);ctx.lineTo(c*.28,c*.62);ctx.lineTo(c*.55,c*1.02);ctx.lineTo(c*.82,c*.98);ctx.lineTo(c,c*1.45);
  ctx.lineTo(c*1.18,c*.98);ctx.lineTo(c*1.45,c*1.02);ctx.lineTo(c*1.72,c*.62);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.arc(c,c*.66,c*.13,0,7);ctx.fill();
 }else if(K.emb==='lion'){ /* yele (yıldız) + yüz */
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2,r=i%2?c*.38:c*.6;ctx.lineTo(c+Math.cos(a)*r,c+Math.sin(a)*r)}ctx.closePath();ctx.fill();
  ctx.fillStyle=K.embBg;ctx.beginPath();ctx.arc(c,c*1.04,c*.26,0,7);ctx.fill();
 }else if(K.emb==='bird'){ /* oturan kuş silueti */
  ctx.ellipse(c*.98,c*1.08,c*.42,c*.3,-.35,0,7);ctx.fill();ctx.beginPath();ctx.arc(c*1.32,c*.74,c*.19,0,7);ctx.fill();
  ctx.beginPath();ctx.moveTo(c*1.5,c*.7);ctx.lineTo(c*1.72,c*.78);ctx.lineTo(c*1.5,c*.84);ctx.fill();
  ctx.beginPath();ctx.moveTo(c*.62,c*1.2);ctx.lineTo(c*.3,c*1.45);ctx.lineTo(c*.7,c*1.36);ctx.fill();
 }else{ /* ay-yıldız */
  ctx.arc(c*.92,c,c*.5,0,7);ctx.fill();ctx.fillStyle=K.embBg;ctx.beginPath();ctx.arc(c*1.04,c,c*.4,0,7);ctx.fill();
  ctx.fillStyle=K.embC;ctx.beginPath();for(let i=0;i<10;i++){const a=i/10*Math.PI*2-Math.PI/2,r=i%2?c*.07:c*.18;ctx.lineTo(c*1.42+Math.cos(a)*r,c+Math.sin(a)*r)}ctx.closePath();ctx.fill();
 }
}
/* sırt numarası */
function kitNumber(ctx,k,w,h,no){
 const K=KITS[k];ctx.clearRect(0,0,w,h);
 ctx.font=`900 ${Math.round(h*.92)}px Arial Black, Arial, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
 if(K.numBg){ctx.fillStyle=K.numBg;ctx.fillRect(w*.08,0,w*.84,h)}
 ctx.lineWidth=h*.06;ctx.strokeStyle=K.numBg||'#000';ctx.strokeText(no,w/2,h*.54);
 ctx.fillStyle=K.num;ctx.fillText(no,w/2,h*.54);
}
/* parçanın kendi uzayında köşe konumları. glTF'de kemiklerin ters bağlama matrisleri de bu uzayda tanımlıdır:
   kemik konumları ile köşeler aynı uzayda olur. İskelet hesabı yok: hızlı ve kemiklerin o anki durumundan bağımsız. */
function kitBind(o,PF){
 if(PF&&PF.id==='soldier')return kitRestW(o);
 const g=o.geometry;if(g.userData.kitB)return g.userData.kitB;
 const pos=g.attributes.position,arr=new Float32Array(pos.count*3);
 for(let i=0;i<pos.count;i++){arr[i*3]=pos.getX(i);arr[i*3+1]=pos.getY(i);arr[i*3+2]=pos.getZ(i)}
 return g.userData.kitB=arr;
}
/* sıkıştırılmış (normalize tamsayı) UV'yi 0..1'e çevir */
function kitUV(uv){
 if(!uv.normalized)return(i,c)=>c?uv.getY(i):uv.getX(i);
 const A=uv.array,d=A instanceof Uint16Array?65535:A instanceof Uint8Array?255:A instanceof Int16Array?32767:A instanceof Int8Array?127:1;
 return(i,c)=>(c?uv.getY(i):uv.getX(i))/d;
}
/* gövde çerçevesi: kemiklerin BAĞLAMA POZU konumlarından (boneInverse'in tersi), köşelerle aynı uzayda */
const KITF=new WeakMap();
/* asker (Character Creator iskeleti, parçalarda dönüşüm var): dünya uzayında dinlenme pozu + kemik dünya konumları */
function kitRestW(o){
 const g=o.geometry;if(g.userData.kitW)return g.userData.kitW;
 o.updateMatrixWorld(true);o.skeleton.update();
 const pos=g.attributes.position,v=V3(),arr=new Float32Array(pos.count*3);
 for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i);o.boneTransform(i,v);v.applyMatrix4(o.matrixWorld);arr[i*3]=v.x;arr[i*3+1]=v.y;arr[i*3+2]=v.z}
 return g.userData.kitW=arr;
}
function kitFrameW(PF){
 if(PF.kitFW)return PF.kitFW;
 const T=PF.tab,P=k=>T[k].P0,bp={};for(const k of ['hip','head','uaR','uaL','faR','faL','haR','haL','sp2','waist','ftR'])bp[k]=P(k).clone();
 const up=bp.head.clone().sub(bp.hip).normalize(),rt=bp.uaR.clone().sub(bp.uaL);rt.addScaledVector(up,-rt.dot(up)).normalize();
 const fw=V3().crossVectors(rt,up).normalize();
 let eye=null;PF.tpl.traverse(o=>{if(!eye&&o.isSkinnedMesh&&/Eye/.test(o.userData.part||''))eye=o});
 if(eye){const W=kitRestW(eye),c=V3();for(let i=0;i<W.length;i+=3)c.x+=W[i],c.y+=W[i+1],c.z+=W[i+2];c.divideScalar(W.length/3);if(c.sub(bp.head).dot(fw)<0)fw.negate()}
 return PF.kitFW=kitFrameMake(bp,up,rt,fw);
}
function kitFrameMake(bp,up,rt,fw){
 const ctr=bp.sp2.clone(),H=bp.head.clone().sub(bp.ftR).dot(up),sh=bp.uaR.clone().sub(bp.uaL).dot(rt)/2;
 const bc=v=>{const q=v.clone().sub(ctr);return[q.dot(rt),q.dot(up),q.dot(fw)]};
 const arms=[];for(const sd of['R','L']){const a=bc(bp['ua'+sd]),b=bc(bp['fa'+sd]),c=bc(bp['ha'+sd]);arms.push([a,b,1],[b,c,2])}
 const waistY=bp.waist.clone().sub(ctr).dot(up),hipY=bp.hip.clone().sub(ctr).dot(up);
 return {up,rt,fw,H,ctr,sh,arms,chestY:0,hemY:waistY-.35*(waistY-hipY),neckY:bp.head.clone().sub(ctr).dot(up)-.1*H};
}
function kitFrame(PF,o){
 if(PF.id==='soldier')return kitFrameW(PF);
 const sk=o.skeleton;if(KITF.has(sk))return KITF.get(sk);
 const m=new THREE.Matrix4(),bp={};
 for(const k of ['hip','head','uaR','uaL','faR','faL','haR','haL','sp2','waist','ftR','ftL']){
  const nm=PF.prefix+PF.bones[k],i=sk.bones.findIndex(b=>b.name===nm);if(i<0){KITF.set(sk,null);return null}
  bp[k]=V3().setFromMatrixPosition(m.copy(sk.boneInverses[i]).invert());
 }
 const up=bp.head.clone().sub(bp.hip).normalize(),rt=bp.uaR.clone().sub(bp.uaL);rt.addScaledVector(up,-rt.dot(up)).normalize();
 const fw=V3().crossVectors(rt,up).normalize();
 /* ileri yön: oyunda bütün karakterler şablon dünyasında +Z'ye bakar. Kalça kemiğinin (dünya × ters bağlama) dönüşümüyle
    +Z yönünü parçanın uzayına taşı, işaretini ona göre seç */
 {const hi=sk.bones.findIndex(b=>b.name===PF.prefix+PF.bones.hip);PF.tpl.updateMatrixWorld(true);
  const Mh=new THREE.Matrix4().multiplyMatrices(sk.bones[hi].matrixWorld,sk.boneInverses[hi]),inv=Mh.clone().invert();
  const d=V3(0,0,1).applyMatrix4(inv).sub(V3(0,0,0).applyMatrix4(inv));if(d.dot(fw)<0)fw.negate();}
 const F=kitFrameMake(bp,up,rt,fw);
 KITF.set(sk,F);return F;
}
/* nokta kolda mı: 0 hayır, 1 üst kol (t: omuzdan dirseğe 0..1), 2 önkol */
function kitArm(F,x,y,z,o){
 const R=Math.min(.06*F.H,.5*F.sh);if(Math.abs(x)<F.sh*.55)return 0; /* dar omuzlu karakterlerde kol yarıçapı küçülür */
 let best=0,bd=R*R;
 for(const[a,b,seg]of F.arms){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],L=dx*dx+dy*dy+dz*dz||1;
  let t=((x-a[0])*dx+(y-a[1])*dy+(z-a[2])*dz)/L;t=Math.max(0,Math.min(1,t));
  const bx=a[0]+dx*t,ex=bx-x,ey=a[1]+dy*t-y,ez=a[2]+dz*t-z,d=ex*ex+ey*ey+ez*ez;
  if(Math.abs(x)<Math.abs(bx)-.35*R)continue; /* kol kemiğinin gövdeye bakan iç tarafı: gövde (kolları gövdeye yakın karakterler) */
  if(d<bd){bd=d;best=seg;if(o)o.t=t}}
 return best;
}
/* bir dokunun formalı kopyası: sadece tişört bölgesine düşen pikseller boyanır */
function kitPaintMap(PF,map,meshes,k,no,bright){
 const key=PF.id+'|'+map.uuid+'|'+k+'|'+no;if(KITTEX[key]!==undefined)return KITTEX[key];
 const K=KITS[k],F=kitFrame(PF,meshes[0]),src=map.image;
 if(!F||!src||!src.width){KITTEX[key]=null;return null}
 const N=Math.max(512,Math.min(1024,src.width)); /* küçük dokular büyütülür: desen ve numara okunur kalsın */
 const sc=document.createElement('canvas');sc.width=sc.height=N;const sx=sc.getContext('2d');sx.drawImage(src,0,0,N,N);
 const img=sx.getImageData(0,0,N,N),sd=img.data,out=new Uint8ClampedArray(sd),mask=new Uint8Array(N*N);
 /* yerel parlaklık ortalaması (kutu bulanıklığı): kıvrım gölgesi kalsın ama ceket/gömlek renk farkı formaya geçmesin */
 const lum=new Float32Array(N*N);for(let i=0;i<N*N;i++)lum[i]=(sd[i*4]+sd[i*4+1]+sd[i*4+2])/3+1;
 const I=new Float64Array((N+1)*(N+1));for(let y=0;y<N;y++){let r=0;for(let x=0;x<N;x++){r+=lum[y*N+x];I[(y+1)*(N+1)+x+1]=I[y*(N+1)+x+1]+r}}
 const br=Math.max(3,N>>6),loc=(x,y)=>{const x0=Math.max(0,x-br),x1=Math.min(N,x+br+1),y0=Math.max(0,y-br),y1=Math.min(N,y+br+1);return(I[y1*(N+1)+x1]-I[y0*(N+1)+x1]-I[y1*(N+1)+x0]+I[y0*(N+1)+x0])/((x1-x0)*(y1-y0))};
 const ec=document.createElement('canvas');ec.width=ec.height=128;kitEmblem(ec.getContext('2d'),k,128);const ed=ec.getContext('2d').getImageData(0,0,128,128).data;
 const nc=document.createElement('canvas');nc.width=256;nc.height=160;kitNumber(nc.getContext('2d'),k,256,160,String(no));const nd=nc.getContext('2d').getImageData(0,0,256,160).data;
 const A=hexRGB(K.a),B=hexRGB(K.b),SL=K.sl==='side'?null:hexRGB(K.sl),COL=hexRGB(K.col);
 const H=F.H,sw=(K.sw||.045)*H,embR=.045*H,embX=-.085*H,embY=F.chestY+.06*H,numW=.17*H,numH=.11*H,numY=F.chestY-.055*H,ao={t:0};
 /* desen rengi; null = bu nokta tişört bölgesinde değil (dokunma) */
 const col=(lx,ly,lz)=>{
  if(ly>F.neckY+.02*H||ly<F.hemY)return null;
  const arm=kitArm(F,lx,ly,lz,ao);
  if(arm===2||(arm===1&&ao.t>.58))return null; /* kısa kol: üst kolun yarısından sonrası ve önkol boyanmaz */
  if(arm===1){if(K.sl==='side')return lx<0?A:B;return SL}
  if(ly>F.neckY)return COL;
  if(lz>0){
   const ex=(lx-embX)/embR,ey=(embY-ly)/embR;
   if(ex*ex+ey*ey<1){const px=Math.min(127,Math.max(0,Math.round((-ex*.5+.5)*127))),py=Math.min(127,Math.max(0,Math.round((ey*.5+.5)*127))),j=(py*128+px)*4;if(ed[j+3]>40)return[ed[j],ed[j+1],ed[j+2]]}
  }else{
   const u=(lx/numW)+.5,v=(numY+numH/2-ly)/numH;
   if(u>0&&u<1&&v>0&&v<1){const px=Math.round(u*255),py=Math.round(v*159),j=(py*256+px)*4;if(nd[j+3]>40)return[nd[j],nd[j+1],nd[j+2]]}
  }
  if(K.pat==='stripes')return(Math.floor(lx/sw+.5)&1)?A:B;
  if(K.pat==='halves')return lx<0?A:B;
  if(K.pat==='panels')return Math.abs(lx)>F.sh*.62&&ly<F.chestY-.02*H?B:A;
  return A;
 };
 const p=V3(),ib=1/(bright||1);let painted=0;
 for(const o of meshes){
  const W=kitBind(o,PF),uv0=o.geometry.attributes.uv;if(!uv0)continue;const U=kitUV(uv0),uv={getX:i=>U(i,0),getY:i=>U(i,1),count:uv0.count};
  const idx=o.geometry.index,n3=idx?idx.count:uv.count,BC=new Float32Array(uv.count*3);
  for(let i=0;i<uv.count;i++){p.set(W[i*3],W[i*3+1],W[i*3+2]).sub(F.ctr);BC[i*3]=p.dot(F.rt);BC[i*3+1]=p.dot(F.up);BC[i*3+2]=p.dot(F.fw)}
  const wrap=v=>v-Math.floor(v);
  for(let t=0;t<n3;t+=3){
   const a=idx?idx.getX(t):t,b=idx?idx.getX(t+1):t+1,c=idx?idx.getX(t+2):t+2;
   /* üçgenin hiçbir köşesi bölgeye yakın değilse atla (hız) */
   const ya=BC[a*3+1],yb=BC[b*3+1],yc=BC[c*3+1];if(Math.max(ya,yb,yc)<F.hemY||Math.min(ya,yb,yc)>F.neckY+.03*H)continue;
   let ax=uv.getX(a),ay=uv.getY(a),bx=uv.getX(b),by=uv.getY(b),cx=uv.getX(c),cy=uv.getY(c);
   const ox=Math.floor(Math.min(ax,bx,cx)),oy=Math.floor(Math.min(ay,by,cy));ax=(ax-ox)*N;bx=(bx-ox)*N;cx=(cx-ox)*N;ay=(ay-oy)*N;by=(by-oy)*N;cy=(cy-oy)*N; /* tekrar eden UV */
   const d=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(d)<1e-9)continue;
   const x0=Math.max(0,Math.floor(Math.min(ax,bx,cx))),x1=Math.min(N-1,Math.ceil(Math.max(ax,bx,cx))),y0=Math.max(0,Math.floor(Math.min(ay,by,cy))),y1=Math.min(N-1,Math.ceil(Math.max(ay,by,cy)));
   for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const X=x+.5,Y=y+.5,w1=((by-cy)*(X-cx)+(cx-bx)*(Y-cy))/d,w2=((cy-ay)*(X-cx)+(ax-cx)*(Y-cy))/d,w3=1-w1-w2;
    if(w1<-.02||w2<-.02||w3<-.02)continue;
    const j=y*N+x;
    const C=col(w1*BC[a*3]+w2*BC[b*3]+w3*BC[c*3],w1*ya+w2*yb+w3*yc,w1*BC[a*3+2]+w2*BC[b*3+2]+w3*BC[c*3+2]);
    if(!C){if(!mask[j])mask[j]=2;continue}
    const sh=Math.max(.55,Math.min(1.3,lum[j]/loc(x,y)))*ib;
    out[j*4]=C[0]*sh;out[j*4+1]=C[1]*sh;out[j*4+2]=C[2]*sh;out[j*4+3]=255;mask[j]=1;painted++;
   }
  }
 }
 if(!painted){KITTEX[key]=null;return null}
 /* dikiş yerlerinde eski renk sızmasın: boyanmış alanı, hiçbir üçgene ait olmayan boşluğa 3 piksel taşır */
 for(let it=0;it<3;it++){const m2=mask.slice();for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){const i=y*N+x;if(mask[i])continue;
  for(const q of[i-1,i+1,i-N,i+N])if(mask[q]===1){out[i*4]=out[q*4];out[i*4+1]=out[q*4+1];out[i*4+2]=out[q*4+2];m2[i]=1;break}}mask.set(m2)}
 const oc=document.createElement('canvas');oc.width=oc.height=N;oc.getContext('2d').putImageData(new ImageData(out,N,N),0,0);
 const tx=new THREE.CanvasTexture(oc);tx.flipY=map.flipY;tx.wrapS=map.wrapS;tx.wrapT=map.wrapT;tx.encoding=map.encoding;tx.anisotropy=1;
 KITTEX[key]=tx;return tx;
}
/* karaktere formayı giydir: klon modelin parçaları, şablondaki aynı sıradaki parçalarla eşlenir */
function kitApply(mdl,PF,cols){
 const k=cols.kit;if(!KITS[k])return;
 const tm=[],cm=[];PF.tpl.traverse(o=>{if(o.isSkinnedMesh)tm.push(o)});(mdl||PF.tpl).traverse(o=>{if(o.isSkinnedMesh)cm.push(o)}); /* mdl yoksa sadece önceden çiz */
 if(tm.length!==cm.length)return;
 const hide=KIT_HIDE[PF.id],groups=new Map();
 tm.forEach((o,i)=>{
  const pt=o.userData.part||'';
  if(hide&&hide.test(pt)){if(mdl)cm[i].visible=false;return}
  if(KIT_SKIP.test(pt))return;
  const m=o.material.map;if(!m)return;
  if(!groups.has(m))groups.set(m,[]);groups.get(m).push(i);
 });
 for(const [map,ids] of groups){
  let tx=null;try{tx=kitPaintMap(PF,map,ids.map(i=>tm[i]),k,cols.kitNo||KITNO[k]||10,tm[ids[0]].material.color.r)}catch(e){console.warn('forma',PF.id,e)}
  if(!tx||!mdl)continue;
  for(const i of ids){const c=cm[i];const col=c.material.color.clone();c.material=tm[i].material.clone();c.material.map=tx;c.material.color.copy(tm[i].material.color);c.material.needsUpdate=true}
 }
}
/* boşta önceden çiz: kuşanılı karakter + forma (ilk giyildiğinde takılma olmasın) */
function kitPrebake(){try{if(typeof SV==='undefined'||!SV||!SV.eq||!SV.eq.f)return;const f=FORMS.find(x=>x.id===SV.eq.f),c=CHAR(SV.eq.c),pid=c.glb===1?'soldier':c.glb;if(f&&GLBR.P[pid])kitApply(null,GLBR.P[pid],{kit:f.kit})}catch(e){}}

function mkHumanGLB(cols,PF,zombie){
 const h=_mkHuman0(cols,!!zombie);
 h.root.traverse(o=>{if(o.isMesh)o.visible=false}); // kutular görünmez ama isabet kutusu olarak kalır
 const mdl=THREE.SkeletonUtils.clone(PF.tpl);
 if(cols.tint){ // renk varyantı: aynı model/doku, malzeme kopyası çarpanla boyanır (şablon bozulmaz)
  mdl.traverse(o=>{if(o.isSkinnedMesh&&o.material){o.material=o.material.clone();o.material.color.r*=cols.tint[0];o.material.color.g*=cols.tint[1];o.material.color.b*=cols.tint[2]}});
 }
 if(cols.kit)kitApply(mdl,PF,cols); /* taraftar forması */
 h.root.add(mdl);
 const t={};
 for(const k of GL_DRIVEN){
  const b=mdl.getObjectByName(PF.prefix+PF.bones[k]);if(!b)throw new Error('klon kemik yok '+k);
  t[k]=Object.assign({b,cur:new THREE.Quaternion()},PF.tab[k]);
 }
 for(const s of['R','L'])t['md'+s]=mdl.getObjectByName(PF.prefix+PF.bones['md'+s]);
 h.glb=mdl;h.gd={t,boxes:[],PF,ak:1};
 /* kollar kısa: silahı iki elle tutabilmek için kol boyunu uzat (sadece kol ekseninde; el eski boyutunda kalır) */
 if(PF.id==='soldier'){
  const K=ARM_K;
  const axOf=(b,c)=>{const p=c.position,ax=Math.abs(p.x)>=Math.abs(p.y)&&Math.abs(p.x)>=Math.abs(p.z)?'x':Math.abs(p.y)>=Math.abs(p.z)?'y':'z';return ax};
  for(const sd of['R','L']){
   const ua=t['ua'+sd].b,fa=t['fa'+sd].b,ha=t['ha'+sd].b;
   const a1=axOf(ua,fa),a2=axOf(fa,ha);
   ua.scale[a1]=K;fa.scale[a2]=K;ha.scale[a2]=1/(K*K);
  }
  h.gd.ak=K;
 }
 h.root.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh&&o.visible===false)h.gd.boxes.push(o)});
 return h;
}
/* bir kemiğe rig-uzayında MUTLAK yönelim ver */
function gSet(d,key,Q){
 const e=d.t[key];e.cur.copy(Q);
 if(e.anc){const a=d.t[e.anc];_gq1.copy(a.Q0).invert().premultiply(a.cur).multiply(e.pQ0)}else _gq1.copy(e.pQ0);
 _gq1.invert().multiply(e.cur);e.b.quaternion.copy(_gq1);
}

/* ---------- Silah eline (kemiğe) bağlanır ---------- */
const _holderSet0=holderSet;
holderSet=function(h,k,skin,mid){
 if(h.gd&&h.W)for(const o of[h.W.g,h.W.g2,h.W.mag,h.W.mag2])if(o&&o.parent)o.parent.remove(o);
 _holderSet0(h,k,skin,mid);
 if(h.gd){
  h.gd.t.haR.b.add(h.W.g);
  if(h.W.g2)h.gd.t.haL.b.add(h.W.g2);
 }
};
/* silahı, tutuş noktası avuç içine gelecek şekilde, el kemiğine göre yerleştir */
function gAttach(h,d,side,obj,Qw_rig){
 const hb=d.t['ha'+side].b;
 hb.updateWorldMatrix(true,false);
 _gv1.copy(d.PF.palm[side]);hb.localToWorld(_gv1); // avuç içi (dünya)
 h.root.getWorldQuaternion(_gq3);_gq3.multiply(Qw_rig); // silahın dünya yönelimi
 const sc=h.root.matrixWorld.getMaxScaleOnAxis();
 _gv2.copy(h.W.gR).multiplyScalar(sc).applyQuaternion(_gq3);
 _gv1.sub(_gv2);
 _gs.set(sc,sc,sc);
 _gm.compose(_gv1,_gq3,_gs);
 _gm2.copy(hb.matrixWorld).invert().multiply(_gm);
 _gm2.decompose(obj.position,obj.quaternion,obj.scale);
}

/* ---------- Kol IK: mantık kolunun el hedefine, GLB kol kemikleriyle ulaş ---------- */
/* mantık kolunun avuç konumu (spine orijinine göre, rig yönü): iki el aynı silahı tutarken aralarındaki GERÇEK mesafeyi korumak için */
const _pR=V3(),_pL=V3(),_pT=V3();
function gPalm(h,side,out){
 const a=side==='R'?h.armR:h.armL;
 _gq1.copy(h.hips.quaternion).multiply(h.spine.quaternion);
 out.copy(a.p0).applyQuaternion(_gq1);
 _gq2.copy(_gq1).multiply(a.sh.quaternion);_gv2.set(0,-a.L1,0).applyQuaternion(_gq2);
 _gq3.copy(_gq2).multiply(a.el.quaternion);_gv3.set(0,-a.L2,0).applyQuaternion(_gq3).add(_gv2);
 return out.add(_gv3);
}
function gArm(h,d,side,mode,Qw,Tov){
 const a=side==='R'?h.armR:h.armL,ua=d.t['ua'+side],fa=d.t['fa'+side],ha=d.t['ha'+side];
 const hq=h.hips.quaternion,sq=h.spine.quaternion;
 _gq1.copy(hq).multiply(sq); // spine yönelimi (rig)
 // mantık: omuz, dirsek, el
 _gv1.copy(a.p0).applyQuaternion(_gq1);                 // omuz (spine-uzayı → rig yönü)
 _gq2.copy(_gq1).multiply(a.sh.quaternion);
 _gv2.set(0,-a.L1,0).applyQuaternion(_gq2);              // omuz→dirsek
 _gq3.copy(_gq2).multiply(a.el.quaternion);
 _gv3.set(0,-a.L2,0).applyQuaternion(_gq3).add(_gv2);    // omuz→el (mantık)
 // GLB omuz konumu (rig-uzayı)
 ua.b.updateWorldMatrix(true,false);
 _gv4.setFromMatrixPosition(ua.b.matrixWorld);h.root.worldToLocal(_gv4);
 const S=_gv4;
 // el yönelimi
 let Qh=null;
 if(mode==='w'){Qh=_gq4.copy(Qw).multiply(_RXN90);if(side==='L'&&mode==='w'&&h.gd.lrifle)Qh.multiply(_RZL);Qh.multiply(ha.Q0)}
 // hedef (avuç) ve bilek
 // mantık kolu (L1+L2) ile GLB kolu (len) farklı uzunlukta: el hedefi vektörünü gerçek kol oranıyla ölçekle,
 // yoksa hedef GLB kolunun erişiminin dışında kalır ve kol hep düz/gergin uzanır
 const kS=(d.PF.len[side][0]+d.PF.len[side][1])*d.ak/(a.L1+a.L2);
 const T=_gv5.copy(S).addScaledVector(_gv3,kS);
 if(!d.tp)d.tp={R:V3(),L:V3()};
 if(Tov)T.copy(Tov);        // sol el: sağ avuç + mantıktaki gerçek el aralığı (silah ölçeklenmediği için el tutacağa ulaşsın)
 d.tp[side].copy(T);        // avuç hedefi (bilek düzeltmesinden önce)
 if(Qh){ // bileği, avuç içi hedefe gelecek şekilde geri çek
  _gq5.copy(ha.Q0).invert().premultiply(Qh);            // el dönüşü (delta)
  _gv6.copy(d.PF.tab['palmRest'+side]).applyQuaternion(_gq5);T.sub(_gv6);
 }
 /* gövde koruması: el hedefi gövde kutusunun içindeyse öne/arkaya it (solveArm ile aynı kutu, rig uzayı; y: spine-uzayı -.15..+.6 → rig .86..1.61) */
 if(Math.abs(T.x)<.23&&T.z>-.17&&T.z<.17&&T.y>.86&&T.y<1.61)T.z=T.z>=0?.17:-.17;
 const L1=d.PF.len[side][0]*d.ak,L2=d.PF.len[side][1]*d.ak;
 _gv6.copy(T).sub(S);let dist=_gv6.length();
 if(dist>1e-5)_gv6.divideScalar(dist);else _gv6.set(0,0,1);
 const dc=Math.min(Math.max(dist,Math.abs(L1-L2)+.01),(L1+L2)*.999);
 const aa=(L1*L1-L2*L2+dc*dc)/(2*dc),hh=Math.sqrt(Math.max(0,L1*L1-aa*aa));
 _gv7.copy(_gv2);_gv7.addScaledVector(_gv6,-_gv7.dot(_gv6)); // kutu rigin dirsek yönü → kutup
 if(_gv7.lengthSq()<1e-6)_gv7.copy(a.pole).applyQuaternion(_gq1); // a.pole spine-uzayında; _gq1=hq*sq ile rig uzayına çevir
 _gv7.normalize();
 const E=_gv2.copy(S).addScaledVector(_gv6,aa).addScaledVector(_gv7,hh);   // dirsek (rig)
 const W=_gv3.copy(S).addScaledVector(_gv6,dc);                            // bilek (rig)
 // üst kol
 _gv1.copy(E).sub(S).normalize();
 _gq2.setFromUnitVectors(d.PF.tab['rdUA'+side],_gv1);
 gSet(d,'ua'+side,_gq2.multiply(ua.Q0));
 // ön kol
 _gv1.copy(W).sub(E).normalize();
 _gq2.setFromUnitVectors(d.PF.tab['rdFA'+side],_gv1);
 const Rfa=_gq5.copy(_gq2);
 gSet(d,'fa'+side,_gq2.multiply(fa.Q0));
 // el
 if(Qh)gSet(d,'ha'+side,Qh);else gSet(d,'ha'+side,_gq3.copy(Rfa).multiply(ha.Q0));
}

/* ---------- Her karede: mantık iskeleti → GLB kemikleri ---------- */
function glbSync(h,c){
 const d=h.gd,hq=h.hips.quaternion,sq=h.spine.quaternion,hdq=h.head.quaternion,t=d.t;
 h.glb.position.y=h.hips.position.y-.95;
 // gövde
 gSet(d,'hip',_gq1.copy(hq).multiply(t.hip.Q0));
 gSet(d,'pelvis',_gq1.copy(hq).multiply(t.pelvis.Q0));
 gSet(d,'waist',_gq1.copy(hq).multiply(_gq2.identity().slerp(sq,1/3)).multiply(t.waist.Q0));
 gSet(d,'sp1',_gq1.copy(hq).multiply(_gq2.identity().slerp(sq,2/3)).multiply(t.sp1.Q0));
 _gq3.copy(hq).multiply(sq);
 gSet(d,'sp2',_gq1.copy(_gq3).multiply(t.sp2.Q0));
 gSet(d,'head',_gq1.copy(_gq3).multiply(hdq).multiply(t.head.Q0));
 // bacaklar (mantık: legs[0] sağ, legs[1] sol)
 for(let i=0;i<2;i++){
  const L=h.legs[i],s=i?'L':'R';
  _gq4.copy(hq).multiply(L.hip.quaternion);                       // uyluk
  gSet(d,'th'+s,_gq1.copy(_gq4).multiply(t['th'+s].Q0));
  _gq5.copy(_gq4).multiply(L.knee.quaternion);                    // kaval
  gSet(d,'cl'+s,_gq1.copy(_gq5).multiply(t['cl'+s].Q0));
  _ge.setFromQuaternion(_gq5,'XYZ');
  _gq1.setFromAxisAngle(V3(1,0,0),-_ge.x*.85).multiply(t['ft'+s].Q0); // ayak yere yatık kalsın
  gSet(d,'ft'+s,_gq1);
 }
 // silah / kol modu
 const W=h.W,hasW=!!W&&!((h.freeW||0)>.5);
 let QwR=null,QwL=null,modeR='f',modeL='f';
 if(hasW){
  _gq1.copy(hq).multiply(sq).multiply(h.aim.quaternion);                // aim yönelimi (rig)
  QwR=new THREE.Quaternion().copy(_gq1).multiply(W.g.quaternion);      // silah yönelimi (aim uzayında hesaplanmıştı)
  modeR='w';
  if(W.g2){QwL=new THREE.Quaternion().copy(_gq1).multiply(W.g2.quaternion);modeL='w';d.lrifle=false}
  else if(typeof P!=='undefined'&&P.lhOn){QwL=QwR;modeL='w';d.lrifle=true}
 }
 gArm(h,d,'R',modeR,QwR);
 let TovL=null;
 if(hasW&&modeL==='w'&&!W.g2){ // iki el tek silahta: sol avuç = sağ avuç + (mantık sol avuç − mantık sağ avuç)
  TovL=_pT.copy(W.gL).sub(W.gR).applyQuaternion(QwR).add(d.tp.R); /* sol avuç: silah üzerindeki gerçek tutacak noktası (sağ avuca göre) */
 }
 gArm(h,d,'L',modeL,QwL,TovL);
 if(hasW){
  gAttach(h,d,'R',W.g,QwR);
  if(W.g2)gAttach(h,d,'L',W.g2,QwL);
 }
}
const _animHuman0=animHuman;
animHuman=function(h,c,dt){
 _animHuman0(h,c,dt);
 if(h.gd&&h.root.visible!==false){
  try{glbSync(h,c)}
  catch(e){ // güvenli yedek: bu karakteri küp görünüme döndür
   console.warn('GLB animasyon hatası, küp karaktere dönüldü',e);
   h.glb.visible=false;for(const m of h.gd.boxes)m.visible=true;h.gd=null;h.glbFail=1;
  }
 }
};

/* ---------- Ölüm animasyonu (klon gövde yere devrilir) ---------- */
/* ---------- GLB ragdoll: Verlet eklem parçacıkları + gerçek kemik sürme ----------
   Ölüm anında canlı iskeletin eklem konumları parçacık olur (animasyon durur, fizik devralır; ikisi savaşmaz).
   Kısıtlar: kemik uzunlukları, sert gövde, dirsek/diz açı sınırı + menteşe yönü, uzuv-gövde/uzuv-uzuv kapsül çarpışması
   (iç içe geçmeyi önler), zemin/harita/sınır. Kemikler her karede parçacık yönlerinden sürülür (gSet). */
const GLBDEAD=[];
const RG_R={pel:.12,chest:.12,head:.08,top:.1,shR:.08,shL:.08,elR:.05,elL:.05,haR:.045,haL:.045,hpR:.09,hpL:.09,knR:.07,knL:.07,anR:.06,anL:.06};
const RG_SRC={pel:'hip',chest:'sp2',head:'head',shR:'uaR',shL:'uaL',elR:'faR',elL:'faL',haR:'haR',haL:'haL',hpR:'thR',hpL:'thL',knR:'clR',knL:'clL',anR:'ftR',anL:'ftL'};
const RG_LINK=[['pel','chest'],['chest','shR'],['chest','shL'],['shR','shL'],['pel','shR'],['pel','shL'],['pel','hpR'],['pel','hpL'],['hpR','hpL'],
 ['chest','hpR'],['chest','hpL'],['shR','hpL'],['shL','hpR'],['chest','head'],['head','top'],['head','shR'],['head','shL'],['top','chest'],
 ['shR','elR'],['elR','haR'],['shL','elL'],['elL','haL'],['hpR','knR'],['knR','anR'],['hpL','knL'],['knL','anL']];
/* çarpışma kapsülleri [a,b,yarıçap,grup]; aynı parçacığı paylaşan ya da bağışık çiftler atlanır */
const RG_CAP=[['pel','chest',.12,'T'],['shR','shL',.06,'T'],['hpR','hpL',.08,'T'],['head','top',.1,'H'],
 ['shR','elR',.05,'UA'],['elR','haR',.045,'FA'],['shL','elL',.05,'UA'],['elL','haL',.045,'FA'],
 ['hpR','knR',.08,'TH'],['knR','anR',.065,'SH'],['hpL','knL',.08,'TH'],['knL','anL',.065,'SH']];
const _rgA=V3(),_rgB=V3(),_rgC=V3(),_rgD=V3(),_rgE=V3(),_rgF=V3(),_rgM=new THREE.Matrix4();
function rgBasis(up,rx,out){ // up, rx → ortonormal taban kuaterniyonu (x=rx, y=up)
 _rgA.copy(up).normalize();_rgB.copy(rx).addScaledVector(_rgA,-rx.dot(_rgA)).normalize();_rgC.crossVectors(_rgB,_rgA);
 _rgM.makeBasis(_rgB,_rgA,_rgC);return out.setFromRotationMatrix(_rgM);
}
spawnRagdoll=(function(prev){return function(h,vel,hitPt,hitDir,power){
 if(!h.gd)return prev(h,vel,hitPt,hitDir,power);
 const PF=h.gd.PF,t0=h.gd.t;
 const g=new THREE.Group();
 h.root.updateWorldMatrix(true,false);
 h.root.matrixWorld.decompose(g.position,g.quaternion,g.scale);
 const mdl=THREE.SkeletonUtils.clone(h.glb);g.add(mdl);
 S.add(g);setShadow(g);g.updateMatrixWorld(true);
 // klon için sürülen kemik tablosu (gSet kullanır)
 const t={};for(const k of GL_DRIVEN){const b=mdl.getObjectByName(PF.prefix+PF.bones[k]);if(!b)return prev(h,vel,hitPt,hitDir,power);t[k]=Object.assign({b,cur:new THREE.Quaternion()},PF.tab[k])}
 const d={t,PF};
 // canlı pozdan parçacıklar (dünya)
 h.glb.updateMatrixWorld(true);
 const P={};
 for(const n in RG_SRC){
  const src=h.gd.t[RG_SRC[n]].b;const p=V3();src.getWorldPosition(p);
  P[n]={p,o:p.clone(),r:RG_R[n]};
 }
 const up=V3().copy(P.head.p).sub(P.chest.p).normalize();
 P.top={p:V3().copy(P.head.p).addScaledVector(up,.2),o:null,r:RG_R.top};P.top.o=P.top.p.clone();
 // başlangıç hızı + vuruş itkisi
 const v=vel||_rgA.set(0,0,0);
 for(const n in P){
  const q=P[n];q.o.addScaledVector(v,-1/60);
  if(hitDir){const w=1/(1+3*q.p.distanceTo(hitPt||q.p));q.o.addScaledVector(hitDir,-(power||4)*w/60)}
  q.o.x+=rnd(-.002,.002);q.o.z+=rnd(-.002,.002);
 }
 const cons=RG_LINK.map(([a,b])=>[P[a],P[b],P[a].p.distanceTo(P[b].p)]);
 // dirsek/diz uzuvları: açı sınırı için en küçük mesafe
 const lim=[];
 const hinge=(s,sh,el,ha,ang,sign)=>{const L1=P[sh].p.distanceTo(P[el].p),L2=P[el].p.distanceTo(P[ha].p);lim.push({a:P[sh],m:P[el],c:P[ha],min:Math.sqrt(L1*L1+L2*L2-2*L1*L2*Math.cos(ang)),sign})};
 hinge('R','shR','elR','haR',.5,-1);hinge('L','shL','elL','haL',.5,-1);   // dirsek: el öne, dirsek geriye (menteşe işareti -)
 hinge('R','hpR','knR','anR',.4,1);hinge('L','hpL','knL','anL',.4,1);     // diz: diz öne (+)
 // dinlenme (bind) tabanları: gövde ve baş
 const T0=PF.tab,r0={};
 r0.torsoInv=rgBasis(_rgD.copy(T0.sp2.P0).sub(T0.hip.P0),_rgE.copy(T0.uaL.P0).sub(T0.uaR.P0),new THREE.Quaternion()).invert();
 r0.headInv=rgBasis(_rgD.copy(T0.head.P0).sub(T0.sp2.P0),_rgE.copy(T0.uaL.P0).sub(T0.uaR.P0),new THREE.Quaternion()).invert();
 r0.dir={};for(const s of['R','L']){
  r0.dir['ua'+s]=T0['rdUA'+s].clone();r0.dir['fa'+s]=T0['rdFA'+s].clone();
  r0.dir['th'+s]=V3().copy(T0['cl'+s].P0).sub(T0['th'+s].P0).normalize();r0.dir['cl'+s]=V3().copy(T0['ft'+s].P0).sub(T0['cl'+s].P0).normalize();
 }
 const r={g,mdl,d,P,cons,lim,r0,t:0,acc:0,glb:true,pts:{pel:P.pel},lp:{}};
 for(const n in P)r.lp[n]=V3();
 GLBDEAD.push(r);
 while(GLBDEAD.length>6){const o=GLBDEAD.shift();S.remove(o.g)}
 rgPose(r);
 return r;
}})(spawnRagdoll);
function rgPose(r){
 const d=r.d,P=r.P,g=r.g,L=r.lp,t=d.t,R0=r.r0;
 for(const n in P)g.worldToLocal(L[n].copy(P[n].p));
 // gövde
 _rgD.copy(L.chest).sub(L.pel);_rgE.copy(L.shL).sub(L.shR);
 const Bt=rgBasis(_rgD,_rgE,_gq4),Rt=_gq5.copy(Bt).multiply(R0.torsoInv);
 const rt=Rt.clone();
 for(const k of['hip','pelvis','waist','sp1','sp2'])gSet(d,k,_gq1.copy(rt).multiply(t[k].Q0));
 // baş
 _rgD.copy(L.top).sub(L.head);
 const Bh=rgBasis(_rgD,_rgE,_gq4);gSet(d,'head',_gq1.copy(Bh).multiply(R0.headInv).multiply(t.head.Q0));
 // uzuvlar: dinlenme yönünden yeni yöne döndür (kemiğin kendi Q0'ı korunur)
 const lm=[['ua','sh','el'],['fa','el','ha'],['th','hp','kn'],['cl','kn','an']];
 for(const s of['R','L']){
  const rot={};
  for(const [bn,a,b] of lm){
   _rgD.copy(L[b+s]).sub(L[a+s]).normalize();
   const q=new THREE.Quaternion().setFromUnitVectors(R0.dir[bn+s],_rgD);rot[bn]=q;
   gSet(d,bn+s,_gq1.copy(q).multiply(t[bn+s].Q0));
  }
  gSet(d,'ha'+s,_gq1.copy(rot.fa).multiply(t['ha'+s].Q0));
  gSet(d,'ft'+s,_gq1.copy(rot.cl).multiply(t['ft'+s].Q0));
 }
 // pelvis parçacığına taşı
 r.mdl.updateMatrixWorld(true);
 t.hip.b.getWorldPosition(_rgF);g.worldToLocal(_rgF);
 r.mdl.position.add(_rgD.copy(L.pel).sub(_rgF));
}
function rgGround(x,z,y){
 if(typeof OW!=='undefined'&&OW.on)return owH(x,z);
 const mcr=typeof MC!=='undefined'&&MC.cur;
 return mcr?Math.max(mcGround(x,z,y+.3),MC.cur.minY-1):0;
}
function rgSegSeg(a0,a1,b0,b1,out){ // iki doğru parçası arası en yakın noktalar: out.s,out.t,out.d
 const d1=_rgA.copy(a1).sub(a0),d2=_rgB.copy(b1).sub(b0),r=_rgC.copy(a0).sub(b0);
 const a=d1.dot(d1),e=d2.dot(d2),f=d2.dot(r);let s,u;
 if(a<1e-9&&e<1e-9){s=u=0}
 else if(a<1e-9){s=0;u=clamp(f/e,0,1)}
 else{
  const c=d1.dot(r);
  if(e<1e-9){u=0;s=clamp(-c/a,0,1)}
  else{const b=d1.dot(d2),den=a*e-b*b;s=den>1e-9?clamp((b*f-c*e)/den,0,1):0;u=(b*s+f)/e;
   if(u<0){u=0;s=clamp(-c/a,0,1)}else if(u>1){u=1;s=clamp((b-c)/a,0,1)}}
 }
 out.s=s;out.t=u;
 out.d=_rgD.copy(a0).addScaledVector(d1,s).sub(_rgE.copy(b0).addScaledVector(d2,u)).length();
 return out;
}
const _rgR={s:0,t:0,d:0};
function rgStep(r){
 const P=r.P,g=18/3600;
 for(const n in P){const q=P[n],p=q.p,o=q.o;const nx=p.x+(p.x-o.x)*.992,ny=p.y+(p.y-o.y)*.992-g,nz=p.z+(p.z-o.z)*.992;o.copy(p);p.set(nx,ny,nz)}
 const F=_rgF;
 for(let it=0;it<8;it++){
  // kemik uzunlukları / sert gövde
  for(const [a,b,rest] of r.cons){_rgA.copy(b.p).sub(a.p);const len=_rgA.length()||1e-6,df=(len-rest)/len*.5;a.p.addScaledVector(_rgA,df);b.p.addScaledVector(_rgA,-df)}
  // eklem açısı sınırı + menteşe yönü (torso ileri ekseni: sağ × yukarı)
  _rgD.copy(P.shL.p).sub(P.shR.p);_rgE.copy(P.chest.p).sub(P.pel.p);F.crossVectors(_rgD,_rgE).normalize();
  for(const l of r.lim){
   _rgA.copy(l.c.p).sub(l.a.p);const dd=_rgA.length()||1e-6;
   if(dd<l.min){const k=(l.min-dd)/dd*.5;l.a.p.addScaledVector(_rgA,-k);l.c.p.addScaledVector(_rgA,k)}
   _rgB.copy(l.a.p).add(l.c.p).multiplyScalar(.5);const off=_rgC.copy(l.m.p).sub(_rgB).dot(F)*l.sign; // <0: ters yöne bükülmüş
   if(off<0)l.m.p.addScaledVector(F,-off*l.sign*.6);
  }
  // uzuv çarpışmaları
  for(let i=0;i<RG_CAP.length;i++){
   const A=RG_CAP[i];
   for(let j=i+1;j<RG_CAP.length;j++){
    const B=RG_CAP[j];
    if(A[0]===B[0]||A[0]===B[1]||A[1]===B[0]||A[1]===B[1])continue;
    const ga=A[3],gb=B[3];
    if(ga==='T'&&gb==='T')continue;
    if((ga==='TH'&&gb==='T')||(ga==='T'&&gb==='TH')||(ga==='H'&&gb==='T')||(ga==='T'&&gb==='H'))continue;
    if((ga==='UA'&&gb==='T')||(ga==='T'&&gb==='UA'))continue; // omuz parçacığı gövde eksenine zaten yakın (dar GLB omuzu); dirsek/ön kol aşağıda korunur
    const pa=P[A[0]].p,pb=P[A[1]].p,pc=P[B[0]].p,pd=P[B[1]].p;
    rgSegSeg(pa,pb,pc,pd,_rgR);
    const need=A[2]+B[2];
    if(_rgR.d>=need||_rgR.d<1e-6)continue;
    // itme yönü: yakın noktalar arası
    const cA=_gv1.copy(pa).addScaledVector(_gv2.copy(pb).sub(pa),_rgR.s),cB=_gv3.copy(pc).addScaledVector(_gv2.copy(pd).sub(pc),_rgR.t);
    _gv4.copy(cA).sub(cB).normalize();const push=(need-_rgR.d)*.5;
    const wA0=1-_rgR.s,wA1=_rgR.s,wB0=1-_rgR.t,wB1=_rgR.t;
    P[A[0]].p.addScaledVector(_gv4,push*wA0);P[A[1]].p.addScaledVector(_gv4,push*wA1);
    P[B[0]].p.addScaledVector(_gv4,-push*wB0);P[B[1]].p.addScaledVector(_gv4,-push*wB1);
   }
  }
 }
 // zemin, harita, sınırlar
 const bd=(typeof OW!=='undefined'&&OW.on)?OWH-2:((typeof MC!=='undefined'&&MC.cur)?MC.cur.ext:29.4);
 for(const n in P){
  const q=P[n],p=q.p,o=q.o,rad=q.r;
  const gy=rgGround(p.x,p.z,p.y);
  if(p.y<gy+rad){p.y=gy+rad;o.x+=(p.x-o.x)*.35;o.z+=(p.z-o.z)*.35;o.y=p.y}
  p.x=clamp(p.x,-bd,bd);p.z=clamp(p.z,-bd,bd);
  if(typeof bnear==='function')for(const b of bnear(p.x,p.z)){
   if(p.x>b.x1-rad&&p.x<b.x2+rad&&p.z>b.z1-rad&&p.z<b.z2+rad&&p.y<b.h+rad){
    const dm=[p.x-(b.x1-rad),(b.x2+rad)-p.x,p.z-(b.z1-rad),(b.z2+rad)-p.z,(b.h+rad)-p.y];
    let mi=0;for(let i=1;i<5;i++)if(dm[i]<dm[mi])mi=i;
    if(mi===0){p.x=b.x1-rad;o.x=p.x}else if(mi===1){p.x=b.x2+rad;o.x=p.x}
    else if(mi===2){p.z=b.z1-rad;o.z=p.z}else if(mi===3){p.z=b.z2+rad;o.z=p.z}
    else{p.y=b.h+rad;o.y=p.y;o.x+=(p.x-o.x)*.3;o.z+=(p.z-o.z)*.3}
   }
  }
 }
}
function glbDeadUpdate(dt){
 for(let i=GLBDEAD.length-1;i>=0;i--){
  const r=GLBDEAD[i];r.t+=dt;r.acc+=dt;
  let n=0;while(r.acc>=1/60&&n<4){r.acc-=1/60;rgStep(r);n++}
  if(r.acc>.1)r.acc=0;
  rgPose(r);
  if(r.t>10){S.remove(r.g);GLBDEAD.splice(i,1)}
 }
}
const _updRags0=updRags;
updRags=function(dt){_updRags0(dt);if(GLBDEAD.length)glbDeadUpdate(dt)};
const _clearRags0=clearRags;
clearRags=function(){_clearRags0();for(const r of GLBDEAD)S.remove(r.g);GLBDEAD.length=0};

/* ---------- Şampiyon karakterleri (assets/ch_<id>.js, tembel yüklenir) ---------- */
const CH_BONES={};for(const k of['hip','pelvis','waist','sp1','sp2','head','thR','clR','ftR','thL','clL','ftL','uaR','faR','haR','mdR','uaL','faL','haL','mdL'])CH_BONES[k]=k;
const CH_SKINFIX={lara:.9}; // karakter başına skin onarım eşiği (m); 0/yok = dokunma
const CH_BRIGHT={bw:1.25,kb:1.2,anime:1.1,samus:1.0,lara:1.15,
 demiradam:1.3,orumcek:1.2,bsamuray:1.15,ada:1.3,karadul:1.35,leon:1.2,siber:1.4,ronin:1.15,uzaypiyade:1.05,gotik:1.25,heetah:1.1,animekiz:1.05,swat:1.3};
function glbLoadChar(id){
 if(GLBR.loading[id]||GLBR.P[id])return;
 GLBR.loading[id]=1;
 mdlScript('ch_'+id,ok=>{
  if(!ok){console.warn('karakter dosyası yok',id);return}
  try{
   new THREE.GLTFLoader().parse(mdlB64(NPNG_G['ch_'+id]),'',g=>{
    try{
     const bones={};for(const k in CH_BONES)bones[k]='N_'+k;
     const bn={};for(const k in CH_BONES)bn[k]=k;
     glbPrep(g.scene,{id,prefix:'N_',bones:bn,bright:CH_BRIGHT[id]||1.2,skinFix:CH_SKINFIX[id]||0});
     glbOnReady(id);
     /* mağaza açıksa küçük resimleri gerçek modelle yeniden çiz (art arda yüklemelerde tek sefer) */
     clearTimeout(GLBR.shT);GLBR.shT=setTimeout(()=>{if(typeof shFill==='function'&&document.querySelector('#av [data-ik]'))shFill()},400);
    }catch(e){console.warn('karakter hazırlanamadı',id,e)}
   },e=>console.warn('karakter ayrıştırılamadı',id,e));
  }catch(e){console.warn(e)}
 });
}
/* sadece kuşanılı karakteri önceden yükle; diğerleri ilk görüldüğü yerde (mağaza, lobi, rakip oyuncu) tembel yüklenir */
function glbPreloadChars(){const e=typeof SV!=='undefined'&&SV&&SV.eq?CHAR(SV.eq.c):null;if(e&&typeof e.glb==='string')glbLoadChar(e.glb)}
const glbCharReady=c=>!c||typeof c.glb!=='string'||!!GLBR.P[c.glb];
glbInit();
setTimeout(glbPreloadChars,2500);
