'use strict';
/* =====================================================================
   Harita çarpışması: haritanın GERÇEK üçgenleri (kutu/ızgara yaklaşımı yok)
   - mcBuild(root): dünya uzayındaki üçgenleri 2 m'lik XZ ızgarasına koyar.
   - hitBox / groundAt: harita açıkken bu üçgenlerden cevap verir (duvar = dik üçgen, zemin = yatay/eğimli üçgen).
   - mcRayMesh: mermi / görüş ışınları (Raycaster) için üçgen tabanlı ışın testi.
   - mcNav: botlar için yürüme grafiği (1,25 m hücre, çok katlı), spawn noktaları.
   ===================================================================== */
const MC={cur:null};
const MC_R=.4;            // oyuncu yarıçapı (eski kutu çarpışmasıyla aynı)
const MC_WALLN=.55;       // |ny| bundan küçükse duvar, büyükse zemin
const MC_STEP=.55;        // yürürken çıkılabilen basamak
const _mcHit={h:0};

function mcBuild(root){
 root.updateMatrixWorld(true);
 let total=0;
 root.traverse(o=>{if(o.isMesh&&o.geometry&&o.geometry.attributes.position){const g=o.geometry;total+=(g.index?g.index.count:g.attributes.position.count)/3}});
 const T=new Float32Array(total*9),NY=new Float32Array(total),D=new Float32Array(total),YN=new Float32Array(total),YX=new Float32Array(total);
 let n=0,x0=1e9,x1=-1e9,z0=1e9,z1=-1e9,ymin=1e9;
 root.traverse(o=>{
  if(!o.isMesh||!o.geometry||!o.geometry.attributes.position)return;
  const g=o.geometry,pos=g.attributes.position,ix=g.index,m=o.matrixWorld.elements,cnt=ix?ix.count:pos.count;
  const tv=new Float32Array(9);
  for(let i=0;i<cnt;i+=3){
   for(let k=0;k<3;k++){
    const q=ix?ix.getX(i+k):i+k,x=pos.getX(q),y=pos.getY(q),z=pos.getZ(q);
    tv[k*3]=m[0]*x+m[4]*y+m[8]*z+m[12];tv[k*3+1]=m[1]*x+m[5]*y+m[9]*z+m[13];tv[k*3+2]=m[2]*x+m[6]*y+m[10]*z+m[14];
   }
   const ux=tv[3]-tv[0],uy=tv[4]-tv[1],uz=tv[5]-tv[2],vx=tv[6]-tv[0],vy=tv[7]-tv[1],vz=tv[8]-tv[2];
   const cx=uy*vz-uz*vy,cy=uz*vx-ux*vz,cz=ux*vy-uy*vx,l=Math.hypot(cx,cy,cz);
   if(l<1e-9)continue;
   T.set(tv,n*9);NY[n]=cy/l;
   D[n]=(tv[5]-tv[8])*(tv[0]-tv[6])+(tv[6]-tv[3])*(tv[2]-tv[8]);
   YN[n]=Math.min(tv[1],tv[4],tv[7]);YX[n]=Math.max(tv[1],tv[4],tv[7]);
   for(let k=0;k<3;k++){x0=Math.min(x0,tv[k*3]);x1=Math.max(x1,tv[k*3]);z0=Math.min(z0,tv[k*3+2]);z1=Math.max(z1,tv[k*3+2])}
   ymin=Math.min(ymin,YN[n]);n++;
  }
 });
 const cs=2,ox=x0-1,oz=z0-1,NXc=Math.ceil((x1-x0+2)/cs)+1,NZc=Math.ceil((z1-z0+2)/cs)+1;
 const cnt=new Int32Array(NXc*NZc+1);
 const rng=(i)=>{const b=i*9;let a=Math.min(T[b],T[b+3],T[b+6]),c=Math.max(T[b],T[b+3],T[b+6]),d=Math.min(T[b+2],T[b+5],T[b+8]),e=Math.max(T[b+2],T[b+5],T[b+8]);
  return [Math.max(0,Math.floor((a-ox)/cs)),Math.min(NXc-1,Math.floor((c-ox)/cs)),Math.max(0,Math.floor((d-oz)/cs)),Math.min(NZc-1,Math.floor((e-oz)/cs))]};
 for(let i=0;i<n;i++){const r=rng(i);for(let gz=r[2];gz<=r[3];gz++)for(let gx=r[0];gx<=r[1];gx++)cnt[gz*NXc+gx+1]++}
 for(let i=0;i<NXc*NZc;i++)cnt[i+1]+=cnt[i];
 const idx=new Int32Array(cnt[NXc*NZc]),fill=cnt.slice(0,NXc*NZc);
 for(let i=0;i<n;i++){const r=rng(i);for(let gz=r[2];gz<=r[3];gz++)for(let gx=r[0];gx<=r[1];gx++)idx[fill[gz*NXc+gx]++]=i}
 return {T,NY,D,YN,YX,n,cs,ox,oz,NXc,NZc,cnt,idx,minY:ymin,ext:Math.max(Math.abs(x0),Math.abs(x1),Math.abs(z0),Math.abs(z1))+2,bb:[x0,z0,x1,z1]};
}

/* ---- zemin yüksekliği: y+MC_STEP'e kadar olan en yüksek yatay yüzey; yoksa çok aşağıda ---- */
function mcGround(x,z,y){
 const c=MC.cur;if(!c)return 0;
 const gx=Math.floor((x-c.ox)/c.cs),gz=Math.floor((z-c.oz)/c.cs);
 if(gx<0||gz<0||gx>=c.NXc||gz>=c.NZc)return -300;
 const ci=gz*c.NXc+gx,T=c.T;let best=-300;const lim=y+STEPH;
 for(let k=c.cnt[ci],e=c.cnt[ci+1];k<e;k++){
  const i=c.idx[k];if(Math.abs(c.NY[i])<MC_WALLN)continue;
  if(c.YN[i]>lim&&true){ /* alt kenarı zaten sınırın üstünde: yine de eğimli olabilir, aşağıda yüksekliği hesaplarız */ }
  const b=i*9,d=c.D[i];if(d>-1e-9&&d<1e-9)continue;
  const ax=T[b],ay=T[b+1],az=T[b+2],bx=T[b+3],by=T[b+4],bz=T[b+5],cx=T[b+6],cy=T[b+7],cz=T[b+8];
  const w1=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/d,w2=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/d,w3=1-w1-w2;
  if(w1<-.002||w2<-.002||w3<-.002)continue;
  const h=w1*ay+w2*by+w3*cy;
  if(h<=lim&&h>best)best=h;
 }
 return best;
}
/* ---- baş üstü tavan: y+1.0 üzerindeki en alçak yatay yüzey ---- */
function mcCeil(x,z,y){
 const c=MC.cur;if(!c)return 1e9;
 const gx=Math.floor((x-c.ox)/c.cs),gz=Math.floor((z-c.oz)/c.cs);
 if(gx<0||gz<0||gx>=c.NXc||gz>=c.NZc)return 1e9;
 const ci=gz*c.NXc+gx,T=c.T;let best=1e9;
 for(let k=c.cnt[ci],e=c.cnt[ci+1];k<e;k++){
  const i=c.idx[k];if(Math.abs(c.NY[i])<MC_WALLN)continue;
  const b=i*9,d=c.D[i];if(d>-1e-9&&d<1e-9)continue;
  const ax=T[b],ay=T[b+1],az=T[b+2],bx=T[b+3],by=T[b+4],bz=T[b+5],cx=T[b+6],cy=T[b+7],cz=T[b+8];
  const w1=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/d,w2=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/d,w3=1-w1-w2;
  if(w1<-.002||w2<-.002||w3<-.002)continue;
  const h=w1*ay+w2*by+w3*cy;
  if(h>=y+1.0&&h<best)best=h;
 }
 return best;
}
function _segD2(px,pz,ax,az,bx,bz){
 const dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz;let t=l2>1e-12?((px-ax)*dx+(pz-az)*dz)/l2:0;t=t<0?0:t>1?1:t;
 const qx=ax+dx*t-px,qz=az+dz*t-pz;return qx*qx+qz*qz;
}
/* ---- duvar: oyuncu silindiri (yarıçap 0,4) dik bir üçgenle kesişiyor mu ---- */
function mcWall(x,z,y){
 const c=MC.cur,T=c.T,R=MC_R,R2=R*R;
 const gx0=Math.floor((x-R-c.ox)/c.cs),gx1=Math.floor((x+R-c.ox)/c.cs),gz0=Math.floor((z-R-c.oz)/c.cs),gz1=Math.floor((z+R-c.oz)/c.cs);
 const lo=y+STEPH,hi=y+1.7;let top=-1;
 for(let gz=gz0;gz<=gz1;gz++)for(let gx=gx0;gx<=gx1;gx++){
  if(gx<0||gz<0||gx>=c.NXc||gz>=c.NZc)continue;
  const ci=gz*c.NXc+gx;
  for(let k=c.cnt[ci],e=c.cnt[ci+1];k<e;k++){
   const i=c.idx[k];if(Math.abs(c.NY[i])>=MC_WALLN)continue;
   if(c.YX[i]<=lo||c.YN[i]>=hi)continue;
   const b=i*9,ax=T[b],az=T[b+2],bx=T[b+3],bz=T[b+5],cx=T[b+6],cz=T[b+8];
   // dış sınır kutusu
   if(x+R<Math.min(ax,bx,cx)||x-R>Math.max(ax,bx,cx)||z+R<Math.min(az,bz,cz)||z-R>Math.max(az,bz,cz))continue;
   let hit=_segD2(x,z,ax,az,bx,bz)<R2||_segD2(x,z,bx,bz,cx,cz)<R2||_segD2(x,z,cx,cz,ax,az)<R2;
   if(!hit){ // üçgenin içinde mi (alanı olan üçgenler)
    const d=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);
    if(d>1e-9||d<-1e-9){const w1=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/d,w2=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/d;hit=w1>=0&&w2>=0&&w1+w2<=1}
   }
   if(hit){if(c.YX[i]>top)top=c.YX[i]}
  }
 }
 if(top<0)return null;_mcHit.h=top;return _mcHit;
}
/* oyunun hitBox / groundAt fonksiyonlarını harita açıkken yönlendir */
const _hitBox0=hitBox,_groundAt0=groundAt;
hitBox=function(x,z,y){return MC.cur?mcWall(x,z,y):_hitBox0(x,z,y)};
groundAt=function(x,z,y){return MC.cur?mcGround(x,z,y):_groundAt0(x,z,y)};

/* ---- ışın testi: Raycaster'ın kullandığı sahte mesh ---- */
function mcRayCast(c,ox,oy,oz,dx,dy,dz,far){
 // ışının XZ izdüşümünde hücre hücre ilerle, her hücredeki üçgenleri Möller-Trumbore ile dene
 const T=c.T;let best=far+1,bi=-1;
 const hl=Math.hypot(dx,dz);
 const test=(i)=>{
  const b=i*9,ax=T[b],ay=T[b+1],az=T[b+2];
  const e1x=T[b+3]-ax,e1y=T[b+4]-ay,e1z=T[b+5]-az,e2x=T[b+6]-ax,e2y=T[b+7]-ay,e2z=T[b+8]-az;
  const px=dy*e2z-dz*e2y,py=dz*e2x-dx*e2z,pz=dx*e2y-dy*e2x,det=e1x*px+e1y*py+e1z*pz;
  if(det>-1e-9&&det<1e-9)return;
  const inv=1/det,tx=ox-ax,ty=oy-ay,tz=oz-az,u=(tx*px+ty*py+tz*pz)*inv;if(u<0||u>1)return;
  const qx=ty*e1z-tz*e1y,qy=tz*e1x-tx*e1z,qz=tx*e1y-ty*e1x,v=(dx*qx+dy*qy+dz*qz)*inv;if(v<0||u+v>1)return;
  const t=(e2x*qx+e2y*qy+e2z*qz)*inv;if(t>1e-4&&t<best){best=t;bi=i}
 };
 if(hl<1e-6){ // dikey ışın
  const gx=Math.floor((ox-c.ox)/c.cs),gz=Math.floor((oz-c.oz)/c.cs);
  if(gx>=0&&gz>=0&&gx<c.NXc&&gz<c.NZc){const ci=gz*c.NXc+gx;for(let k=c.cnt[ci];k<c.cnt[ci+1];k++)test(c.idx[k])}
 }else{
  let gx=Math.floor((ox-c.ox)/c.cs),gz=Math.floor((oz-c.oz)/c.cs);
  const sx=dx>0?1:-1,sz=dz>0?1:-1;
  const tdx=Math.abs(dx)>1e-9?c.cs/Math.abs(dx):1e30,tdz=Math.abs(dz)>1e-9?c.cs/Math.abs(dz):1e30;
  let tmx=Math.abs(dx)>1e-9?((dx>0?(gx+1)*c.cs+c.ox-ox:ox-(gx*c.cs+c.ox))/Math.abs(dx)):1e30;
  let tmz=Math.abs(dz)>1e-9?((dz>0?(gz+1)*c.cs+c.oz-oz:oz-(gz*c.cs+c.oz))/Math.abs(dz)):1e30;
  let tcur=0,guard=0;
  while(tcur<=best&&tcur<=far&&guard++<600){
   if(gx>=0&&gz>=0&&gx<c.NXc&&gz<c.NZc){const ci=gz*c.NXc+gx;for(let k=c.cnt[ci];k<c.cnt[ci+1];k++)test(c.idx[k])}
   else if((gx<-2&&sx<0)||(gz<-2&&sz<0)||(gx>c.NXc+2&&sx>0)||(gz>c.NZc+2&&sz>0))break;
   if(tmx<tmz){tcur=tmx;tmx+=tdx;gx+=sx}else{tcur=tmz;tmz+=tdz;gz+=sz}
   // t parametresi XZ hızına göre; gerçek 3B t için hl ile ölçekle
  }
 }
 return bi>=0?{t:best,i:bi}:null;
}
function mcRayMesh(col){
 const m=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial());
 m.userData={mapRay:true};m.frustumCulled=false;
 const nrm=new THREE.Vector3();
 m.raycast=function(rc,out){
  const r=rc.ray,hl=Math.hypot(r.direction.x,r.direction.z);
  // DDA'daki t, birim yön vektörü için XZ'de hl ile çarpılır; mcRayCast dahili olarak t'yi XZ uzunluğu cinsinden kullanır
  const far=rc.far,res=mcRayCast2(col,r.origin,r.direction,far);
  if(!res)return;
  const i=res.i,b=i*9,T=col.T;
  nrm.set(0,col.NY[i]>=0?1:-1,0);
  out.push({distance:res.t,point:r.at(res.t,new THREE.Vector3()),object:m,face:{normal:nrm.clone()},faceIndex:i});
 };
 return m;
}
/* t (3B mesafe) cinsinden DDA: XZ ilerleme parametresi = 3B t * hl */
function mcRayCast2(c,o,d,far){
 const hl=Math.hypot(d.x,d.z);
 if(hl<1e-6)return mcRayCast(c,o.x,o.y,o.z,d.x,d.y,d.z,far);
 // yönü XZ'de birim yap: t' = t*hl
 const s=1/hl,r=mcRayCast(c,o.x,o.y,o.z,d.x*s,d.y*s,d.z*s,far*hl);
 return r?{t:r.t/hl,i:r.i}:null;
}

/* ---- Bot yürüme grafiği (1,25 m hücre, çok katlı) ---- */
function mcNav(c,seedX,seedZ,seedY){
 const CS=1.25,bb=c.bb,ox=bb[0]-2,oz=bb[1]-2,NXn=Math.ceil((bb[2]-bb[0]+4)/CS),NZn=Math.ceil((bb[3]-bb[1]+4)/CS);
 const keyOf=(ix,iz,h)=>(iz*NXn+ix)*64+Math.max(0,Math.min(63,Math.round((h-c.minY)*2)%64));
 const X=[],Z=[],Y=[],adj=[],map=new Map(),cellMap=new Map();
 const prev=MC.cur,pst=STEPH;MC.cur=c;STEPH=MC_STEP;
 const mk=(ix,iz,h)=>{
  const k=keyOf(ix,iz,h);let id=map.get(k);if(id!==undefined)return id;
  id=X.length;map.set(k,id);X.push(ox+(ix+.5)*CS);Z.push(oz+(iz+.5)*CS);Y.push(h);adj.push(-1,-1,-1,-1);
  const ck=iz*NXn+ix;let a=cellMap.get(ck);if(!a)cellMap.set(ck,a=[]);a.push(id);return id;
 };
 // tohum: yürünebilir yer bul
 let sx=seedX,sz=seedZ,sg=mcGround(sx,sz,seedY+1.2);
 for(let r=0;r<12&&(sg<-100||mcWall(sx,sz,sg));r++){const a=r*2.4;sx=seedX+Math.cos(a)*r*.8;sz=seedZ+Math.sin(a)*r*.8;sg=mcGround(sx,sz,seedY+1.2)}
 const six=Math.floor((sx-ox)/CS),siz=Math.floor((sz-oz)/CS);
 const start=mk(six,siz,sg);X[start]=sx;Z[start]=sz;
 const q=[start],DX=[1,-1,0,0],DZ=[0,0,1,-1],lim=70000;
 for(let qi=0;qi<q.length&&X.length<lim;qi++){
  const i=q[qi],ix=Math.floor((X[i]-ox)/CS),iz=Math.floor((Z[i]-oz)/CS),h=Y[i];
  for(let d=0;d<4;d++){
   const jx=ix+DX[d],jz=iz+DZ[d];if(jx<0||jz<0||jx>=NXn||jz>=NZn)continue;
   const tx=ox+(jx+.5)*CS,tz=oz+(jz+.5)*CS;
   STEPH=1.15;const g=mcGround(tx,tz,h);STEPH=MC_STEP;if(g<-100||g<h-3.5)continue;
   if(mcWall(tx,tz,g))continue;
   const mx=(X[i]+tx)/2,mz=(Z[i]+tz)/2;STEPH=1.15;const gm=mcGround(mx,mz,h);STEPH=MC_STEP;
   if(gm<Math.min(g,h)-.35||mcWall(mx,mz,Math.max(gm,Math.min(h,g))))continue;
   const before=X.length,j=mk(jx,jz,g);adj[i*4+d]=j;
   if(X.length>before)q.push(j);
  }
 }
 MC.cur=prev;STEPH=pst;
 const n=X.length;
 const N={n,X,Z,Y,adj,reach:n};
 N.near=(x,z,y,r)=>{
  const ix=Math.floor((x-ox)/CS),iz=Math.floor((z-oz)/CS);let best=-1,bd=1e9;
  for(let rr=0;rr<=r;rr++){
   for(let a=-rr;a<=rr;a++)for(let b=-rr;b<=rr;b++){
    if(Math.max(Math.abs(a),Math.abs(b))!==rr)continue;
    const l=cellMap.get((iz+b)*NXn+ix+a);if(!l)continue;
    for(const id of l){const dd=Math.hypot(X[id]-x,Z[id]-z)+Math.abs(Y[id]-(y==null?Y[id]:y))*1.5;if(dd<bd){bd=dd;best=id}}
   }
   if(best>=0&&rr>=1)break;
  }
  return best;
 };
 const par=new Int32Array(n),vis=new Uint32Array(n),qq=new Int32Array(n);let stamp=0;
 N.path=(x0,z0,x1,z1,y0,y1)=>{
  const s=N.near(x0,z0,y0,3),t=N.near(x1,z1,y1,4);if(s<0||t<0)return null;if(s===t)return [x1,z1];
  const st=++stamp;let qh=0,qt=0;qq[qt++]=s;vis[s]=st;par[s]=-1;let found=false;
  while(qh<qt){const i=qq[qh++];if(i===t){found=true;break}
   for(let d=0;d<4;d++){const j=adj[i*4+d];if(j<0||vis[j]===st)continue;vis[j]=st;par[j]=i;qq[qt++]=j}}
  if(!found)return null;
  const p=[];let cc=t;while(cc!==s&&cc>=0){p.push(cc);cc=par[cc]}
  p.reverse();const k=Math.min(p.length-1,1);return [X[p[k]],Z[p[k]]];
 };
 // en uzak iki uç (spawn): BFS ile
 const far=(si)=>{const st=++stamp;let qh=0,qt=0,last=si;qq[qt++]=si;vis[si]=st;
  while(qh<qt){const i=qq[qh++];last=i;for(let d=0;d<4;d++){const j=adj[i*4+d];if(j<0||vis[j]===st)continue;vis[j]=st;qq[qt++]=j}}return last};
 // en büyük "karşılıklı erişilebilir" bölge (Kosaraju SCC): spawn'lar yalnız burada seçilir
 const back=new Uint8Array(n);let cstart=start;
 {
  const radj=Array.from({length:n},()=>[]);for(let i=0;i<n;i++)for(let d=0;d<4;d++){const j=adj[i*4+d];if(j>=0)radj[j].push(i)}
  const seen=new Uint8Array(n),order=[];
  for(let r=0;r<n;r++){if(seen[r])continue;const st=[r],it=[0];seen[r]=1;
   while(st.length){const u=st[st.length-1];let d=it[it.length-1];
    if(d<4){it[it.length-1]=d+1;const v=adj[u*4+d];if(v>=0&&!seen[v]){seen[v]=1;st.push(v);it.push(0)}}
    else{order.push(u);st.pop();it.pop()}}}
  const comp=new Int32Array(n).fill(-1);let best=-1,bs=0,cid=0;
  for(let k=n-1;k>=0;k--){const r=order[k];if(comp[r]>=0)continue;let sz=0;const st=[r];comp[r]=cid;
   while(st.length){const u=st.pop();sz++;for(const v of radj[u])if(comp[v]<0){comp[v]=cid;st.push(v)}}
   if(sz>bs){bs=sz;best=cid;cstart=r}cid++}
  for(let i=0;i<n;i++)back[i]=comp[i]===best?1:0;
  N.sccSize=bs;
 }
 const farB=(si)=>{const st=++stamp;let qh=0,qt=0,last=si;qq[qt++]=si;vis[si]=st;
  while(qh<qt){const i=qq[qh++];if(back[i])last=i;for(let d=0;d<4;d++){const j=adj[i*4+d];if(j<0||vis[j]===st||!back[j])continue;vis[j]=st;qq[qt++]=j}}return last};
 let cx0=0,cz0=0,cn=0;for(let i=0;i<n;i++)if(back[i]){cx0+=X[i];cz0+=Z[i];cn++}cx0/=cn;cz0/=cn;
 let A=cstart,ad=-1;for(let i=0;i<n;i++)if(back[i]){const d=Math.hypot(X[i]-cx0,Z[i]-cz0);if(d>ad){ad=d;A=i}}
 let B=A,bd2=-1;for(let i=0;i<n;i++)if(back[i]){const d=Math.hypot(X[i]-X[A],Z[i]-Z[A]);if(d>bd2){bd2=d;B=i}}
 const spawnsAt=(si)=>{const st=++stamp;let qh=0,qt=0;qq[qt++]=si;vis[si]=st;const res=[];
  while(qh<qt&&res.length<9){const i=qq[qh++];
   if(res.every(r=>Math.hypot(X[r]-X[i],Z[r]-Z[i])>=2.6))res.push(i);
   for(let d=0;d<4;d++){const j=adj[i*4+d];if(j<0||vis[j]===st||!back[j])continue;vis[j]=st;qq[qt++]=j}}
  return res.map(i=>({x:X[i],z:Z[i],y:Y[i]}))};
 N.spA=spawnsAt(A);N.spB=spawnsAt(B);
 return N;
}
