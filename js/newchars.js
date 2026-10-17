'use strict';
/* =====================================================================
   Goblin Mob (GLB) - "Goblin Mob" modeli (Alomare, CC-BY-NC-4.0)
   Eski küp goblin yerine animasyonlu GLB modeli kullanılır (yürüme/bekleme klipleri).
   Model yüklenemezse küp goblin görünür (yedek). Vuruş kutuları aynen kalır.
   ===================================================================== */
const GOBM={tpl:null,clips:null,loading:false};
function gobmLoad(){
 if(GOBM.tpl||GOBM.loading)return;GOBM.loading=true;
 mdlScript('ch_goblin',ok=>{
  if(!ok)return;
  try{new THREE.GLTFLoader().parse(mdlB64(NPNG_G['ch_goblin']),'',g=>{
   g.scene.traverse(o=>{if(!o.isMesh)return;const m=o.material,map=m.map||null;
    if(map){map.encoding=THREE.LinearEncoding;map.magFilter=map.minFilter=THREE.NearestFilter;map.needsUpdate=true}
    o.material=new THREE.MeshLambertMaterial({map,alphaTest:.05,side:THREE.DoubleSide});if(map)o.material.color.setRGB(1.3,1.3,1.3);
    o.frustumCulled=false;o.raycast=()=>{}});
   try{gobMerge(g.scene)}catch(e){console.warn('goblin birleştirme atlandı',e)}
   GOBM.tpl=g.scene;GOBM.clips=g.animations;
  },e=>console.warn('goblin',e))}catch(e){console.warn(e)}
 });
}
/* Performans: goblin modeli 19 ayrı küpten oluşuyor (goblin başına 19 çizim çağrısı). Aynı dokuyu kullanan küpler tek bir
   skinned mesh'te birleştirilir; her küp kendi düğümüne (kemik) %100 bağlanır, animasyon aynen çalışır → goblin başına 1 çizim. */
function gobMerge(root){
 root.updateMatrixWorld(true);
 const groups=new Map();
 root.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh&&o.geometry&&o.geometry.attributes.position){const m=o.material,k=(m.map?m.map.uuid:'-')+'|'+m.side+'|'+m.alphaTest;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(o)}});
 const rInv=new THREE.Matrix4().copy(root.matrixWorld).invert(),M=new THREE.Matrix4(),N3=new THREE.Matrix3(),v=new THREE.Vector3();
 let merged=0;
 for(const list of groups.values()){
  if(list.length<2)continue;
  if(list.some(o=>!o.geometry.attributes.normal||!o.geometry.attributes.uv))continue;
  let nv=0,ni=0;for(const o of list){const g=o.geometry;nv+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count}
  const P=new Float32Array(nv*3),Nn=new Float32Array(nv*3),U=new Float32Array(nv*2),SI=new Uint16Array(nv*4),SW=new Float32Array(nv*4),I=new Uint32Array(ni);
  let ov=0,oi=0;const binv=[];
  list.forEach((o,bi)=>{
   const g=o.geometry,pa=g.attributes.position,na=g.attributes.normal,ua=g.attributes.uv;
   M.multiplyMatrices(rInv,o.matrixWorld);N3.getNormalMatrix(M);
   for(let i=0;i<pa.count;i++){
    v.fromBufferAttribute(pa,i).applyMatrix4(M);P.set([v.x,v.y,v.z],(ov+i)*3);
    v.fromBufferAttribute(na,i).applyMatrix3(N3).normalize();Nn.set([v.x,v.y,v.z],(ov+i)*3);
    U[(ov+i)*2]=ua.getX(i);U[(ov+i)*2+1]=ua.getY(i);
    SI[(ov+i)*4]=bi;SW[(ov+i)*4]=1;
   }
   if(g.index){for(let i=0;i<g.index.count;i++)I[oi+i]=g.index.getX(i)+ov;oi+=g.index.count}
   else{for(let i=0;i<pa.count;i++)I[oi+i]=i+ov;oi+=pa.count}
   ov+=pa.count;
   binv.push(new THREE.Matrix4().multiplyMatrices(rInv,o.matrixWorld).invert());
  });
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('normal',new THREE.BufferAttribute(Nn,3));
  geo.setAttribute('uv',new THREE.BufferAttribute(U,2));geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(SI,4));
  geo.setAttribute('skinWeight',new THREE.BufferAttribute(SW,4));geo.setIndex(new THREE.BufferAttribute(I,1));
  const mat=list[0].material.clone();mat.skinning=true;
  const sm=new THREE.SkinnedMesh(geo,mat);sm.frustumCulled=false;sm.raycast=()=>{};sm.name='gobMerged';
  root.add(sm);sm.bind(new THREE.Skeleton(list,binv),new THREE.Matrix4());
  list.forEach(o=>{o.visible=false});
  merged+=list.length;
 }
 return merged;
}
if(typeof MT!=='undefined'&&MT.gob)MT.gob.cols.mob='goblin';
const _mkHuman1=mkHuman;
mkHuman=function(cols,zombie){
 const h=_mkHuman1(cols,zombie);
 if(cols&&cols.mob==='goblin'){
  if(!GOBM.tpl){gobmLoad();return h}
  try{
   h.root.traverse(o=>{if(o.isMesh)o.visible=false});
   const mdl=(typeof glbShareSkel==='function'?glbShareSkel:x=>x)(THREE.SkeletonUtils.clone(GOBM.tpl)),w=new THREE.Group();
   w.rotation.y=Math.PI;w.scale.setScalar(1.25);w.add(mdl);h.root.add(w);
   const mx=new THREE.AnimationMixer(mdl);
   const find=n=>GOBM.clips.find(c=>c.name.indexOf(n)>=0);
   const aw=find('walk'),ai=find('idle');
   h.gm={mx,w,mdl,walk:aw?mx.clipAction(aw).play():null,idle:ai?mx.clipAction(ai).play():null};
   const bl=find('blink');if(bl)mx.clipAction(bl).play();
   if(h.gm.walk)h.gm.walk.setEffectiveWeight(0);
  }catch(e){console.warn('goblin rig',e)}
 }
 return h;
};
const _animHumanNc=animHuman;
animHuman=function(h,c,dt){
 _animHumanNc(h,c,dt);
 const g=h.gm;if(!g||h.root.visible===false)return;
 const sp=Math.min(1,(c.speed||0)/2.2);
 if(g.walk)g.walk.setEffectiveWeight(sp);if(g.idle)g.idle.setEffectiveWeight(1-sp);
 /* ekran dışındaki goblinin animasyonu biriktirilir; görüşe girdiğinde (çizimden önce) tek seferde uygulanır */
 if(typeof GLBH!=='undefined'){if(!lobbyOn)GLBH.add(h);if(!glbInView(h)){h._stale=1;h._gdt=(h._gdt||0)+dt*(.6+sp*.9);return}}
 h._stale=0;if(!g.w.visible)g.w.visible=true;g.mx.update(dt*(.6+sp*.9)+(h._gdt||0));h._gdt=0;
};
const _spawnRagdoll1=spawnRagdoll;
spawnRagdoll=function(h,vel,hitPt,hitDir,power){
 if(!h.gm)return _spawnRagdoll1(h,vel,hitPt,hitDir,power);
 const g=new THREE.Group();
 h.root.updateWorldMatrix(true,false);
 h.root.matrixWorld.decompose(g.position,g.quaternion,g.scale);
 const w=THREE.SkeletonUtils.clone(h.gm.w);w.visible=true;if(typeof glbShareSkel==='function')glbShareSkel(w);g.add(w);
 S.add(g);setShadow(g);
 const dir=V3(0,0,0);
 if(hitDir)dir.set(hitDir.x,0,hitDir.z);
 if(dir.lengthSq()<.01&&vel)dir.set(vel.x,0,vel.z);
 if(dir.lengthSq()<.01)dir.set(0,0,-1).applyQuaternion(g.quaternion);
 dir.normalize();
 const r={g,mdl:w,dir,t:0,q0:g.quaternion.clone(),y0:g.position.y,pts:{pel:{p:g.position.clone().setY(g.position.y+.4)}},pw:Math.min(1.6,.9+(power||4)*.08),glb:true};
 GLBDEAD.push(r);
 while(GLBDEAD.length>6){const o=GLBDEAD.shift();removeRagdollRoot(o.g)}
 return r;
};
setTimeout(gobmLoad,2500);
