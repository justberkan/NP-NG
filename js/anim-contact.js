'use strict';
/* ANIMASYON-001: rig.js SONRASI, glbrig.js ONCESI. Tek alt-govde otoritesi.
   Gorunum katmanidir: fizik, hiz, hasar ve isabet kutusu boyutu degismez. */
const ContactAnimation=(()=>{
 const down=new THREE.Vector3(0,-1,0),dir=V3(),pole=V3(),elbow=V3(),target=V3(),temp=V3(),world=V3(),motion=V3(),ray=V3();
 const axisX=V3(1,0,0),airEuler=new THREE.Euler();
 const invRoot=new THREE.Matrix4(),invH=new THREE.Quaternion(),invS=new THREE.Quaternion(),q1=new THREE.Quaternion(),q2=new THREE.Quaternion(),rootQ=new THREE.Quaternion();
 const AXES=['x','z'];
 const base=animHuman;
 function state(h){return h.contact||(h.contact={last:V3(),ready:false,phase:0,air:0,wall:0,side:0,feet:[0,1].map(()=>({anchor:V3(),wallTarget:V3(),plant:false,hip:new THREE.Quaternion(),knee:new THREE.Quaternion()}))})}
 function leg(h,L,T,w,f,k){
  // Hedef root uzayinda; cozum hips uzayinda yapilir. Diz one bakar.
  target.copy(T).sub(h.hips.position).applyQuaternion(invH).sub(L.hip.position);
  const d=target.length(),dc=clamp(d,.025,.899),a=(.46*.46-.44*.44+dc*dc)/(2*dc),b=Math.sqrt(Math.max(0,.46*.46-a*a));
  dir.copy(target).multiplyScalar(1/Math.max(d,1e-6));pole.set(0,0,1).addScaledVector(dir,-dir.z);if(pole.lengthSq()<1e-6)pole.set(1,0,0);pole.normalize();
  elbow.copy(dir).multiplyScalar(a).addScaledVector(pole,b);q1.setFromUnitVectors(down,temp.copy(elbow).normalize());
  q2.copy(q1).invert();temp.copy(dir).multiplyScalar(dc).sub(elbow).normalize().applyQuaternion(q2);q2.setFromUnitVectors(down,temp);
  f.hip.copy(q1);f.knee.copy(q2);L.hip.quaternion.slerp(f.hip,w);L.knee.quaternion.slerp(f.knee,w);
 }
 function wallDistance(h,wr){
  // Yakindaki kutu duvarina yatay isin; her kare tum harita taranmaz.
  world.set(0,1.40,.10).applyMatrix4(h.root.matrixWorld);ray.set(-wr,0,0).applyQuaternion(rootQ);
  let hit=.42;
  if(typeof bnear!=='function')return hit;
  let nearest=Infinity;
  for(const b of bnear(world.x,world.z)){
   if(world.y>=b.h||world.y<0)continue;
   let lo=0,hi=.85;
   for(const axis of AXES){const r=ray[axis],o=world[axis],mn=b[axis+'1'],mx=b[axis+'2'];if(Math.abs(r)<1e-6){if(o<mn||o>mx){hi=-1;break}}else{let a=(mn-o)/r,z=(mx-o)/r;if(a>z){const t=a;a=z;z=t}lo=Math.max(lo,a);hi=Math.min(hi,z)}}
   if(lo>0&&lo<=hi)nearest=Math.min(nearest,lo);
  }
  return Number.isFinite(nearest)?nearest:hit;
 }
 function arms(h,wr,w){
  const near=wr>0?h.armR:h.armL,far=wr>0?h.armL:h.armR,d=wallDistance(h,wr);
  // Omurganin egimini tersine al: avuc duvar duzleminde kalir.
  if(!h.wallPalm)h.wallPalm=V3();h.wallPalm.set(-wr*d,1.40,.10);
  target.copy(h.wallPalm).sub(h.hips.position).applyQuaternion(invH).sub(h.spine.position).applyQuaternion(invS);
  solveArm(near,target);
  target.copy(far.p0).add(temp.set(wr*.12,-.05,.28));solveArm(far,target);
  h.wallHand=wr>0?'R':'L';h.wallDistance=d;h.freeW=0;
  // GLB'de silah duvardan uzak elde; ikinci tabanca temas sirasinda gizlenir.
  if(h.W){h.W.g.visible=!!h.gd;if(h.W.g2)h.W.g2.visible=false}
 }
 function update(h,c,dt){
  if(!h||!h.legs||h.zombie||h.gm)return;
  dt=clamp(dt||0,0,.12);if(!dt)return;
  const st=state(h),k=1-Math.exp(-20*dt),spd=Math.max(0,c.speed||0),wr=c.wallrun===1?1:c.wallrun===-1?-1:0;
  h.root.updateWorldMatrix(true,false);invRoot.copy(h.root.matrixWorld).invert();h.root.getWorldQuaternion(rootQ);
  world.setFromMatrixPosition(h.root.matrixWorld);
  motion.copy(world).sub(st.last);const distance=st.ready?Math.hypot(motion.x,motion.z):0;
  const reset=!st.ready||distance>2;st.last.copy(world);st.ready=true;
  if(reset){for(const f of st.feet){f.plant=false}st.phase=0}
  st.air+=((c.air?1:0)-st.air)*k;st.wall+=(Math.abs(wr)-st.wall)*k;if(wr)st.side=wr;
  h.wallHand=null;if(h.W&&h.W.g2&&(h.freeW||0)<.6)h.W.g2.visible=true;h.contactGround=false;h.contactWallFeet=false;
  if(c.slide||c.glide){for(const f of st.feet)f.plant=false;return}
  const amp=clamp(spd/6,0,1),moving=spd>.12;
  const cycle=1.1+Math.min(spd,8)*.28,duty=.45-.12*amp,stride=cycle*duty;
  if(!c.air&&moving)st.phase+=distance/cycle;if(wr)st.phase+=dt*1.8;
  if(distance>.00001)motion.y=0;else motion.set(0,0,1).applyQuaternion(rootQ);
  motion.applyQuaternion(q1.copy(rootQ).invert());motion.y=0;motion.normalize();
  if(!moving)motion.set(0,0,1);
  h.hips.position.y=.95-(moving?.025:0)-.19*amp*(1-st.air)-.25*(c.crouch||0);
  h.hips.position.x=0;h.hips.rotation.y=0;
  h.hips.rotation.z=st.side*.24*st.wall;h.spine.rotation.z=-st.side*.10*st.wall;
  invH.copy(h.hips.quaternion).invert();invS.copy(h.spine.quaternion).invert();
  const wallD=wr?wallDistance(h,wr):.42;
  for(let i=0;i<2;i++){
   const L=h.legs[i],f=st.feet[i],side=i?1:-1;
   if(!f.ready){f.hip.copy(L.hip.quaternion);f.knee.copy(L.knee.quaternion);f.ready=true}
   if(wr){
    f.plant=false;const phase=st.phase*Math.PI*2+i*Math.PI,lift=Math.max(0,Math.sin(phase));
    target.set(-wr*(wallD-.08-.07*lift),.24+.13*lift,.22*Math.cos(phase));f.wallTarget.copy(target);
    leg(h,L,target,1,f,k);h.contactWallFeet=true;
   }else if(c.air||st.air>.02||st.wall>.04){
    f.plant=false;
    const wave=Math.sin(st.phase*Math.PI*2+i*Math.PI),a=st.wall>.04?-.15+wave*.32:-.18+(i?.035:0),b=st.wall>.04?.65+Math.max(0,-wave)*.30:.48+(i?.04:0);
    q1.setFromEuler(airEuler.set(a,0,-side*.065));q2.setFromAxisAngle(axisX,b);
    f.hip.slerp(q1,k);f.knee.slerp(q2,k);L.hip.quaternion.copy(f.hip);L.knee.quaternion.copy(f.knee);
   }else{
    const ph=(st.phase+i*.5)%1,stance=ph<duty||!moving;
    const z=!moving?0:stance?stride*.5-ph/duty*stride:-stride*.5+((ph-duty)/(1-duty))*stride;
    target.set(side*.13+motion.x*z,.06+(stance?0:Math.sin(Math.PI*(ph-duty)/(1-duty))*(.10+.07*amp)),motion.z*z);
    if(stance){if(!f.plant){f.anchor.copy(target).applyMatrix4(h.root.matrixWorld);f.plant=true}target.copy(f.anchor).applyMatrix4(invRoot)}else f.plant=false;
    // Asiri donus/teleportta ayagi geride birakma; yeni adima gec.
    if(Math.hypot(target.x-side*.10,target.z)>.57){f.plant=false;target.set(side*.13,.06,0)}
    leg(h,L,target,1,f,k);h.contactGround=true;
   }
  }
  if(wr||st.wall>.15)arms(h,wr||st.side,st.wall);
 }
 animHuman=function(h,c,dt){base(h,c,dt);update(h,c,dt)};
 return {update,version:'1.0.0'};
})();

