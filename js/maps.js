'use strict';
/* =====================================================================
   Harita sistemi (5v5 için)
   - Görsel: assets/map_<id>.js içindeki GLB. Çarpışma: GLB'den önceden hesaplanan 0,5 m'lik yükseklik ızgarası
     (H: zemin yüksekliği*4, W: duvar tepe yüksekliği*4). Çalışma anında ızgara birleştirilmiş kutulara çevrilir;
     oyunun mevcut kutu çarpışması (hitBox/groundAt) aynen kullanılır.
   - Botlar: 1 m'lik yürüme ızgarasında BFS ile yol bulur.
   Modeller: "de_dust2 - cs map" ve "cs death match map minecraft" (kullanıcı tarafından sağlandı, bkz. Krediler).
   ===================================================================== */
const MAPS={cur:null,sel:'arena',cache:{},
 defs:{
  arena:{n:'Klasik Arena',d:'Küçük kutulu arena'},
  dust2:{n:'Dust II (mini)',d:'Dar koridorlar, rampalar, iki seviye',fog:[45,150],sky:0xcfe0ee},
  mc:{n:'Minecraft Arena',d:'Büyük açık alan, kutular, kuleler, duvar siperleri',fog:[70,230],sky:0x9cc3de}
 }};
try{const s=localStorage.getItem('npng_map');if(s&&MAPS.defs[s])MAPS.sel=s}catch(e){}
const ARENA={boxes:boxes.slice(),meshes:boxMeshes.slice(),fog:[S.fog.near,S.fog.far],sky:S.background.getHex()};
const _mUnit=new THREE.BoxGeometry(1,1,1);
const _mMat=new THREE.MeshBasicMaterial();

function mapB64(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer}

/* ---------- Izgaradan kutular ---------- */
function mapMakeBoxes(g){
 const {NX,NZ,ox,oz,cs}=g,NO=-999;
 const H=new Int16Array(mapB64(g.H)),W=new Int16Array(mapB64(g.W));
 const key=new Array(NX*NZ).fill(null),hh=new Array(NX*NZ).fill(0);
 const solid=(x,z)=>{if(x<0||z<0||x>=NX||z>=NZ)return false;const i=z*NX+x;return W[i]>0||H[i]!==NO};
 for(let z=0;z<NZ;z++)for(let x=0;x<NX;x++){
  const i=z*NX+x;
  if(W[i]>0){key[i]='w'+W[i];hh[i]=W[i]/4}
  else if(H[i]===NO){
   let near=false;
   for(let a=-1;a<=1&&!near;a++)for(let b=-1;b<=1;b++)if(solid(x+a,z+b)){near=true;break}
   if(near){key[i]='v';hh[i]=40}
  }else if(H[i]/4>.12){key[i]='f'+H[i];hh[i]=H[i]/4}
 }
 const used=new Uint8Array(NX*NZ),out=[];
 for(let z=0;z<NZ;z++)for(let x=0;x<NX;x++){
  const i=z*NX+x;if(used[i]||!key[i])continue;
  const k=key[i];let w=1;
  while(x+w<NX&&!used[i+w]&&key[i+w]===k)w++;
  let d=1;
  outer:while(z+d<NZ){for(let a=0;a<w;a++){const j=(z+d)*NX+x+a;if(used[j]||key[j]!==k)break outer}d++}
  for(let b=0;b<d;b++)for(let a=0;a<w;a++)used[(z+b)*NX+x+a]=1;
  out.push([(x+ox)*cs,(z+oz)*cs,(x+w+ox)*cs,(z+d+oz)*cs,hh[i],k==='v']);
 }
 return {H,W,list:out};
}

/* ---------- Yürüme ızgarası (1 m) ---------- */
function mapNav(g,H,W){
 const {NX,NZ,ox,oz,cs}=g,NO=-999,cw=Math.floor(NX/2),ch=Math.floor(NZ/2);
 const ok=new Uint8Array(cw*ch),F=new Float32Array(cw*ch);
 for(let cz=0;cz<ch;cz++)for(let cx=0;cx<cw;cx++){
  let good=1,f=-1e9;
  for(let a=0;a<2&&good;a++)for(let b=0;b<2;b++){const i=(cz*2+b)*NX+cx*2+a;if(W[i]>0||H[i]===NO){good=0;break}f=Math.max(f,H[i]/4)}
  ok[cz*cw+cx]=good;F[cz*cw+cx]=f;
 }
 const ok2=new Uint8Array(cw*ch);
 for(let z=1;z<ch-1;z++)for(let x=1;x<cw-1;x++){const i=z*cw+x;
  ok2[i]=ok[i]}
 const N={cw,ch,ok:ok2,F,ox,oz,cs,vis:new Uint32Array(cw*ch),par:new Int32Array(cw*ch),q:new Int32Array(cw*ch),st:0};
 N.cell=(x,z)=>{const cx=Math.floor((x/cs-ox)/2),cz=Math.floor((z/cs-oz)/2);return cx<0||cz<0||cx>=cw||cz>=ch?-1:cz*cw+cx};
 N.pos=i=>[((i%cw)*2+ox+1)*cs,(Math.floor(i/cw)*2+oz+1)*cs];
 N.snap=(x,z,r)=>{const c=N.cell(x,z);if(c<0)return -1;if(N.ok[c])return c;const cx=c%cw,cz=(c-cx)/cw;
  for(let rr=1;rr<=r;rr++)for(let a=-rr;a<=rr;a++)for(let b=-rr;b<=rr;b++){if(Math.max(Math.abs(a),Math.abs(b))!==rr)continue;const X=cx+a,Z=cz+b;if(X<0||Z<0||X>=cw||Z>=ch)continue;if(N.ok[Z*cw+X])return Z*cw+X}
  return -1};
 const DX=[1,-1,0,0,1,1,-1,-1],DZ=[0,0,1,-1,1,-1,1,-1];
 N.edge=(i,x,z,d)=>{const X=x+DX[d],Z=z+DZ[d];if(X<0||Z<0||X>=cw||Z>=ch)return -1;const j=Z*cw+X;if(!N.ok[j]||Math.abs(F[j]-F[i])>.8)return -1;
  if(d>=4){const a=(z)*cw+X,b=Z*cw+x;if(!N.ok[a]||!N.ok[b])return -1}return j};
 /* BFS: a→b arası ilk adımlardan birkaçı ileri nokta */
 N.path=(x0,z0,x1,z1)=>{
  const s=N.snap(x0,z0,2),t=N.snap(x1,z1,3);if(s<0||t<0)return null;if(s===t)return [x1,z1];
  const st=++N.st;let qh=0,qt=0;N.q[qt++]=s;N.vis[s]=st;N.par[s]=-1;let found=false,cnt=0;
  while(qh<qt&&cnt++<30000){
   const i=N.q[qh++];if(i===t){found=true;break}
   const x=i%cw,z=(i-x)/cw;
   for(let d=0;d<8;d++){const j=N.edge(i,x,z,d);if(j<0||N.vis[j]===st)continue;N.vis[j]=st;N.par[j]=i;N.q[qt++]=j}
  }
  if(!found)return null;
  const p=[];let c=t;while(c!==s&&c>=0){p.push(c);c=N.par[c]}
  p.reverse();const k=Math.min(p.length-1,2);return N.pos(p[k]);
 };
 /* spawn noktaları: haritanın iki ucundaki yürünebilir bölgeler */
 const far=(si)=>{const st=++N.st;let qh=0,qt=0,last=si;N.q[qt++]=si;N.vis[si]=st;
  while(qh<qt){const i=N.q[qh++];last=i;const x=i%cw,z=(i-x)/cw;for(let d=0;d<8;d++){const j=N.edge(i,x,z,d);if(j<0||N.vis[j]===st)continue;N.vis[j]=st;N.q[qt++]=j}}return last};
 /* en büyük bağlı bölgeyi bul, spawn'ları orada seç */
 const comp=new Int32Array(cw*ch).fill(-1);let best=-1,bn=0;
 for(let s0=0;s0<cw*ch;s0++){if(!ok2[s0]||comp[s0]>=0)continue;const st=[s0];comp[s0]=s0;let n=0;
  while(st.length){const i=st.pop();n++;const x=i%cw,z=(i-x)/cw;for(let d=0;d<8;d++){const j=N.edge(i,x,z,d);if(j>=0&&comp[j]<0){comp[j]=s0;st.push(j)}}}
  if(n>bn){bn=n;best=s0}}
 const A=far(best),B=far(A);
 const spawnsAt=(si)=>{const st=++N.st;let qh=0,qt=0;N.q[qt++]=si;N.vis[si]=st;const dist={};dist[si]=0;const res=[];
  while(qh<qt&&res.length<9){const i=N.q[qh++];const x=i%cw,z=(i-x)/cw;
   if(res.every(r=>Math.hypot(((r%cw)-x),(Math.floor(r/cw)-z))>=2.5))res.push(i);
   for(let d=0;d<4;d++){const j=N.edge(i,x,z,d);if(j<0||N.vis[j]===st)continue;N.vis[j]=st;N.q[qt++]=j}}
  return res.map(i=>{const p=N.pos(i);return {x:p[0],z:p[1],y:F[i]}})};
 N.spA=spawnsAt(A);N.spB=spawnsAt(B);
 return N;
}

/* ---------- Yükleme ---------- */
function mapLoad(id,cb){
 if(MAPS.cache[id])return cb(MAPS.cache[id]);
 mdlScript('map_'+id,ok=>{
  if(!ok||!window.NPNG_M||!NPNG_M[id])return cb(null);
  try{
   new THREE.GLTFLoader().parse(mapB64(NPNG_G['map_'+id]),'',gl=>{
    try{
     const g=NPNG_M[id],sc=gl.scene;
     sc.traverse(o=>{
      if(!o.isMesh)return;
      const m=o.material;if(m.map){m.map.encoding=THREE.LinearEncoding;if(id==='mc'){m.map.magFilter=THREE.NearestFilter;m.map.minFilter=THREE.NearestMipmapLinearFilter}m.map.needsUpdate=true}
      o.material=new THREE.MeshLambertMaterial({map:m.map||null,color:m.map?0xffffff:(m.color?m.color.getHex():0x888888),side:id==='dust2'?THREE.DoubleSide:THREE.FrontSide,transparent:!!m.transparent,alphaTest:m.alphaTest||0,opacity:m.opacity==null?1:m.opacity});
      o.raycast=()=>{};
     });
     const root=new THREE.Group();root.add(sc);root.scale.setScalar(g.sc);root.position.set(-g.cx*g.sc,-g.y0*g.sc,-g.cz*g.sc);
     root.visible=false;S.add(root);
     root.updateMatrixWorld(true);
     let col=mcBuild(root);
     const roofInfo=id==='dust2'?mapRoofCaps(root,col):{loops:0,triangles:0};
     if(roofInfo.triangles)col=mcBuild(root);

     const rm=mcRayMesh(col);
     const mb=mapMakeBoxes(g),old=mapNav(g,mb.H,mb.W),sd=old.spA[0]||{x:0,z:0,y:0};
     const nav=mcNav(col,sd.x,sd.z,sd.y);
     console.log('harita',id,'üçgen',col.n,'yürüme düğümü',nav.n,'spawnA',nav.spA.length,'spawnB',nav.spB.length);
     MAPS.cache[id]={id,root,boxes:[],meshes:[rm],bg:null,nav,col,ext:col.ext,roofInfo};
     cb(MAPS.cache[id]);
    }catch(e){console.warn('harita hazırlama',id,e);cb(null)}
   },e=>{console.warn('harita glb',id,e);cb(null)});
  }catch(e){console.warn('harita',id,e);cb(null)}
 });
}
function mapRestore(){
 if(!MAPS.cur)return;
 const m=MAPS.cur;m.root.visible=false;MAPS.cur=null;
 boxes.length=0;ARENA.boxes.forEach(b=>boxes.push(b));
 boxMeshes.length=0;ARENA.meshes.forEach(x=>boxMeshes.push(x));
 ARENA.boxes.forEach(b=>b.m.visible=true);floor.position.y=0;BG=null;STEPH=.3;MC.cur=null;
 S.fog.near=ARENA.fog[0];S.fog.far=ARENA.fog[1];S.background.setHex(ARENA.sky);
}
function mapApply(id){
 const m=MAPS.cache[id];
 if(!m||id==='arena'){mapRestore();return}
 if(MAPS.cur===m)return;
 mapRestore();
 ARENA.boxes.forEach(b=>b.m.visible=false);floor.position.y=-500;
 boxes.length=0;m.boxes.forEach(b=>boxes.push(b));
 boxMeshes.length=0;m.meshes.forEach(x=>boxMeshes.push(x));
 BG=null;m.root.visible=true;STEPH=MC_STEP;MAPS.cur=m;MC.cur=m.col;
 m.safePos=null;
 const d=MAPS.defs[id];S.fog.near=d.fog[0];S.fog.far=d.fog[1];S.background.setHex(d.sky);
}

/* Dust2 modelindeki açık, yatay üst kenar halkalarını düz taş kapaklarla kapat.
   Avluların zemini ve alçak kapı/pencere kenarları bu işleme girmez. */
function mapRoofCaps(root,col){
 const edges=new Map(),key=v=>v.map(x=>Math.round(x*500)).join(',');
 for(let i=0;i<col.n;i++){
  const vs=[0,3,6].map(k=>Array.from(col.T.slice(i*9+k,i*9+k+3)));
  for(let a=0;a<3;a++){const v=vs[a],w=vs[(a+1)%3],kv=key(v),kw=key(w);if(kv===kw)continue;const k=kv<kw?kv+'|'+kw:kw+'|'+kv,e=edges.get(k);if(e)e.n++;else edges.set(k,{n:1,v,w,kv,kw})}
 }
 const by=new Map(),open=[...edges.values()].filter(e=>e.n===1&&e.v[1]>=7.5&&Math.abs(e.v[1]-e.w[1])<.01);
 for(const e of open)for(const k of [e.kv,e.kw]){if(!by.has(k))by.set(k,[]);by.get(k).push(e)}
 const used=new Set(),positions=[];let loops=0;
 for(const e of open){
  if(used.has(e))continue;let cur=e.kv,first=cur,ps=[],closed=false;
  for(let n=0;n<4096;n++){const es=(by.get(cur)||[]).filter(q=>!used.has(q));if(!es.length)break;const q=es[0];used.add(q);ps.push(cur===q.kv?q.v:q.w);cur=cur===q.kv?q.kw:q.kv;if(cur===first){closed=true;break}}
  if(!closed||ps.length<3||new Set(ps.map(key)).size!==ps.length)continue;
  let area=0;for(let i=0;i<ps.length;i++){const a=ps[i],b=ps[(i+1)%ps.length];area+=a[0]*b[2]-b[0]*a[2]}
  if(Math.abs(area)*.5<.5||Math.abs(area)*.5>800)continue;
  const faces=THREE.ShapeUtils.triangulateShape(ps.map(v=>new THREE.Vector2(v[0],v[2])),[]);let count=0;
  for(const f of faces){const v=f.map(i=>ps[i]),x=(v[0][0]+v[1][0]+v[2][0])/3,z=(v[0][2]+v[1][2]+v[2][2])/3,y=v[0][1];
   if(mcRayCast(col,x,y+.04,z,0,-1,0,.08))continue;
   for(const p of v)positions.push(p[0],y,p[2]);count++;
  }if(count)loops++;
 }
 if(positions.length){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.computeVertexNormals();const cap=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:0xb39a76,side:THREE.DoubleSide}));cap.name='Dust2 sealed roofs';cap.applyMatrix4(root.matrixWorld.clone().invert());root.add(cap);root.updateMatrixWorld(true);cap.raycast=()=>{}}
 return {loops,triangles:positions.length/9};
}

/* startMatch: seçili harita yüklenmediyse yükle, bitince cb. true dönerse yükleme başladı demektir. */
function mapNeed(cb){
 const id=MAPS.sel;if(id==='arena'||MAPS.cache[id])return false;
 const msg=document.getElementById('msg');if(msg)msg.textContent='Harita yükleniyor...';
 $('go').disabled=true;
 mapLoad(id,m=>{$('go').disabled=false;if(msg)msg.textContent='';if(!m){MAPS.sel='arena';mapSelUI();alert2&&alert2('Harita yüklenemedi, klasik arena kullanılacak')}cb()});
 return true;
}
/* Takım başlangıç noktası: team 1 = A ucu, 2 = B ucu */
function mapSpawn(team,i){
 const m=MAPS.cur;
 if(!m){return team===1?{x:-8+i*5,z:26,y:0,yaw:0}:{x:-10+i*5,z:-26,y:0,yaw:Math.PI}}
 const L=team===1?m.nav.spA:m.nav.spB,O=team===1?m.nav.spB:m.nav.spA;
 const s=L[i%L.length],o=O[0];
 return {x:s.x,z:s.z,y:s.y,yaw:Math.atan2(-(o.x-s.x),-(o.z-s.z))};
}
function tdmSetup(){
 const s=mapSpawn(1,0);p.x=s.x;p.z=s.z;p.y=s.y;p.yaw=s.yaw;p.pitch=0;
 if(!MAPS.cur){p.x=0;p.z=24;p.y=0;p.yaw=0}
 for(let i=0;i<4;i++){const q=mapSpawn(1,i+1),e=mkE('a',1,q.x,q.z);e.sy=q.y;e.g.position.y=q.y;e.g.rotation.y=e.yaw=Math.atan2(-Math.sin(q.yaw),-Math.cos(q.yaw))}
 for(let i=0;i<5;i++){const q=mapSpawn(2,i),e=mkE('e',2,q.x,q.z);e.sy=q.y;e.g.position.y=q.y;e.g.rotation.y=e.yaw=Math.atan2(-Math.sin(q.yaw),-Math.cos(q.yaw))}
}
/* oyuncu yeniden doğuş noktası (tdm) */
function tdmRespawn(){const s=mapSpawn(1,Math.floor(Math.random()*5));p.x=s.x;p.z=s.z;p.y=s.y;p.yaw=s.yaw;if(!MAPS.cur){p.x=0;p.z=24;p.y=0}}
/* botlar için: hedefe giden yolda sıradaki nokta, yoksa null */
function botNav(e,tx,tz){
 const N=MAPS.cur&&MAPS.cur.nav;if(!N)return null;
 if(!e.nw||clock-(e.nwT||0)>.45+(e.ph0%.2)){e.nwT=clock;e.nw=N.path(e.g.position.x,e.g.position.z,tx,tz,e.g.position.y,null)}
 return e.nw;
}
function botLos(e,tx,ty,tz){
 const q=e.g.position;vo.set(q.x,q.y+1.4,q.z);vd.set(tx-q.x,ty-q.y-1.4,tz-q.z);const len=vd.length();if(len<.1)return true;vd.normalize();rb.set(vo,vd);rb.far=len;
 return !rb.intersectObjects(boxMeshes)[0];
}

/* ---------- Harita seçimi arayüzü: "Seçili mod" düğmesinin altında, yalnız 5v5 seçiliyken ---------- */
function mapSelUI(){
 let el=document.getElementById('mapbtn');
 if(!el){const ms=document.getElementById('msel');if(!ms)return;el=document.createElement('button');el.id='mapbtn';ms.parentNode.insertBefore(el,ms.nextSibling);
  el.onclick=()=>{const k=Object.keys(MAPS.defs);MAPS.sel=k[(k.indexOf(MAPS.sel)+1)%k.length];try{localStorage.setItem('npng_map',MAPS.sel)}catch(e){}mapSelUI()}}
 el.style.display=(selMode==='tdm'||selMode==='tm'||selMode==='cmp')?'block':'none';
 el.innerHTML='<small>5v5 haritası (değiştirmek için bas)</small><span>'+MAPS.defs[MAPS.sel].n+'</span>';
}
