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
   GOBM.tpl=g.scene;GOBM.clips=g.animations;
  },e=>console.warn('goblin',e))}catch(e){console.warn(e)}
 });
}
if(typeof MT!=='undefined'&&MT.gob)MT.gob.cols.mob='goblin';
const _mkHuman1=mkHuman;
mkHuman=function(cols,zombie){
 const h=_mkHuman1(cols,zombie);
 if(cols&&cols.mob==='goblin'){
  if(!GOBM.tpl){gobmLoad();return h}
  try{
   h.root.traverse(o=>{if(o.isMesh)o.visible=false});
   const mdl=THREE.SkeletonUtils.clone(GOBM.tpl),w=new THREE.Group();
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
const _animHuman1=animHuman;
animHuman=function(h,c,dt){
 _animHuman1(h,c,dt);
 const g=h.gm;if(!g||h.root.visible===false)return;
 const sp=Math.min(1,(c.speed||0)/2.2);
 if(g.walk)g.walk.setEffectiveWeight(sp);if(g.idle)g.idle.setEffectiveWeight(1-sp);
 g.mx.update(dt*(.6+sp*.9));
};
const _spawnRagdoll1=spawnRagdoll;
spawnRagdoll=function(h,vel,hitPt,hitDir,power){
 if(!h.gm)return _spawnRagdoll1(h,vel,hitPt,hitDir,power);
 const g=new THREE.Group();
 h.root.updateWorldMatrix(true,false);
 h.root.matrixWorld.decompose(g.position,g.quaternion,g.scale);
 const w=h.gm.w.clone(true);g.add(w);
 S.add(g);setShadow(g);
 const dir=V3(0,0,0);
 if(hitDir)dir.set(hitDir.x,0,hitDir.z);
 if(dir.lengthSq()<.01&&vel)dir.set(vel.x,0,vel.z);
 if(dir.lengthSq()<.01)dir.set(0,0,-1).applyQuaternion(g.quaternion);
 dir.normalize();
 const r={g,mdl:w,dir,t:0,q0:g.quaternion.clone(),y0:g.position.y,pts:{pel:{p:g.position.clone().setY(g.position.y+.4)}},pw:Math.min(1.6,.9+(power||4)*.08),glb:true};
 GLBDEAD.push(r);
 while(GLBDEAD.length>6){const o=GLBDEAD.shift();S.remove(o.g)}
 return r;
};
setTimeout(gobmLoad,2500);
