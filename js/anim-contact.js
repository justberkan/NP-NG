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
 // Yürümeden dönme: bir ayak ağırlığı taşır, diğeri kalkıp yeni yöne basar.
 const angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
 function turnStep(h,c,dt,st,eligible,reset){
  const yaw=Math.atan2(2*(rootQ.w*rootQ.y+rootQ.x*rootQ.z),1-2*(rootQ.y*rootQ.y+rootQ.z*rootQ.z));
  const tr=st.turn||(st.turn={yaw,ready:false,debt:0,active:false,next:0,time:0,duration:.28,from:V3(),to:V3(),steps:0});
  const delta=tr.ready?angle(yaw-tr.yaw):0;tr.yaw=yaw;tr.ready=true;
  if(!eligible||reset){if(tr.active)for(const f of st.feet)f.plant=false;tr.active=false;tr.debt=0;for(const f of st.feet){f.heading=yaw;f.yawOffset=0;f.turnLift=0}h.contactTurn=false;return false}
  tr.debt=angle(tr.debt+delta);let maxError=0,worst=tr.next;
  for(let i=0;i<2;i++){const f=st.feet[i];if(!f.plant&&!(tr.active&&tr.leg===i)){target.set(i?.13:-.13,.06,0);f.anchor.copy(target).applyMatrix4(h.root.matrixWorld);groundPoint(f.anchor,h);f.plant=true;f.heading=yaw}if(tr.active&&tr.leg===i)continue;target.copy(f.anchor).applyMatrix4(invRoot);const error=Math.hypot(target.x-(i?.13:-.13),target.z)+Math.abs(angle(yaw-(f.heading??yaw)))*.12;if(error>maxError){maxError=error;worst=i}}
  if(!tr.active&&(Math.abs(tr.debt)>.085||maxError>.045)){
   tr.leg=maxError>.045?worst:tr.next;tr.next=1-tr.leg;tr.from.copy(st.feet[tr.leg].anchor);tr.startHeading=st.feet[tr.leg].heading??yaw;tr.time=0;tr.duration=clamp(.30/(1+Math.abs(delta)/Math.max(dt,.001)*.14),.18,.30);tr.active=true;tr.debt=0;tr.steps++;
  }
  if(tr.active){
   const f=st.feet[tr.leg];tr.time+=dt;const u=Math.min(1,tr.time/tr.duration),ease=u*u*(3-2*u);target.set(tr.leg?.13:-.13,.06,0);tr.to.copy(target).applyMatrix4(h.root.matrixWorld);groundPoint(tr.to,h);
   if(!f.turnTarget)f.turnTarget=V3();f.turnTarget.copy(tr.from).lerp(tr.to,ease);f.turnLift=Math.sin(Math.PI*u)*.105;f.turnTarget.y+=f.turnLift;f.heading=tr.startHeading+angle(yaw-tr.startHeading)*ease;f.plant=false;
   if(u>=1){f.anchor.copy(tr.to);f.heading=yaw;f.plant=true;f.turnLift=0;tr.active=false}
  }
  for(const f of st.feet)f.yawOffset=clamp(angle((f.heading??yaw)-yaw),-.9,.9);
  h.contactTurn=tr.active;return tr.active;
 }
 function leg(h,L,T,w,f,k){
  if(!f.solvedTarget)f.solvedTarget=V3();f.solvedTarget.copy(T);
  // Hedef root uzayinda; cozum hips uzayinda yapilir. Diz one bakar.
  target.copy(T).sub(h.hips.position).applyQuaternion(invH).sub(L.hip.position);
  const d=target.length(),dc=clamp(d,.025,.899),a=(.46*.46-.44*.44+dc*dc)/(2*dc),b=Math.sqrt(Math.max(0,.46*.46-a*a));
  dir.copy(target).multiplyScalar(1/Math.max(d,1e-6));pole.set(0,0,1).addScaledVector(dir,-dir.z);if(pole.lengthSq()<1e-6)pole.set(1,0,0);pole.normalize();
  elbow.copy(dir).multiplyScalar(a).addScaledVector(pole,b);q1.setFromUnitVectors(down,temp.copy(elbow).normalize());
  q2.copy(q1).invert();temp.copy(dir).multiplyScalar(dc).sub(elbow).normalize().applyQuaternion(q2);q2.setFromUnitVectors(down,temp);
  f.hip.copy(q1);f.knee.copy(q2);L.hip.quaternion.slerp(f.hip,w);L.knee.quaternion.slerp(f.knee,w);
 }
 function wallDistance(h,wr,front){
  // Yakindaki kutu duvarina yatay isin; her kare tum harita taranmaz.
  world.set(0,1.40,front?0:.10).applyMatrix4(h.root.matrixWorld);ray.set(front?0:-wr,0,front?1:0).applyQuaternion(rootQ);
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
 function special(h,c,dt,st){
  const mode=c.climb?'climb':c.slide?'slide':c.glide?'glide':null;if(!mode)return false;
  for(const f of st.feet)f.wasSwing=false;
  st.phase+=dt*(mode==='climb'?1.4:.7);for(const f of st.feet)f.plant=false;
  h.contactMode=mode;h.hips.position.x=0;h.hips.rotation.set(mode==='slide'?.10:0,0,0);h.spine.rotation.z=0;
  h.hips.position.y=mode==='slide'?lerp(h.hips.position.y,.54,h.sm.sl):mode==='climb'?.90:.95;h.spine.rotation.x=mode==='climb'?.12:mode==='slide'?-.10:-.06;
  invH.copy(h.hips.quaternion).invert();invS.copy(h.spine.quaternion).invert();
  if(mode==='slide'){
   for(let i=0;i<2;i++){const f=st.feet[i];target.set(i?.18:-.18,.06,i?.52:.67);leg(h,h.legs[i],target,1,f,1)}h.contactGround=true;
  }else if(mode==='glide'){
   for(let i=0;i<2;i++){h.legs[i].hip.rotation.set(.12+(i?.04:0),0,(i?-1:1)*.10);h.legs[i].knee.rotation.set(.55+(i?.08:0),0,0)}
  }else{
   const d=wallDistance(h,0,true);for(let i=0;i<2;i++){const f=st.feet[i],wave=Math.sin(st.phase*6.283+i*Math.PI);target.set(i?.14:-.14,.33+.17*(wave+1),d-.09);f.wallTarget.copy(target);leg(h,h.legs[i],target,1,f,1)}h.contactWallFeet=true;h.contactClimbFeet=true;
  }
  if(mode!=='slide'){
   if(!h.actionPalms)h.actionPalms={R:V3(),L:V3()};const d=mode==='climb'?wallDistance(h,0,true):.08;
   for(let i=0;i<2;i++){const sd=i?'L':'R',arm=i?h.armL:h.armR,phase=Math.sin(st.phase*6.283+i*Math.PI);h.actionPalms[sd].set((i?1:-1)*(mode==='climb'?.27:.22),mode==='climb'?1.73+.12*(phase+1):1.95,mode==='climb'?d:.01);target.copy(h.actionPalms[sd]).sub(h.hips.position).applyQuaternion(invH).sub(h.spine.position).applyQuaternion(invS);solveArm(arm,target)}
   h.actionFree=true;h.freeW=1;if(h.W){h.W.g.visible=false;if(h.W.g2)h.W.g2.visible=false}
  }
  for(let i=0;i<2;i++){st.feet[i].hip.copy(h.legs[i].hip.quaternion);st.feet[i].knee.copy(h.legs[i].knee.quaternion)}
  return true;
 }
 function updateRaw(h,c,dt){
  if(!h||!h.legs||h.zombie||h.gm)return;
  dt=clamp(dt||0,0,.12);if(!dt)return;
  const st=state(h),k=1-Math.exp(-20*dt),spd=Math.max(0,c.speed||0),wr=c.wallrun===1?1:c.wallrun===-1?-1:0;
  h.root.updateWorldMatrix(true,false);invRoot.copy(h.root.matrixWorld).invert();h.root.getWorldQuaternion(rootQ);
  world.setFromMatrixPosition(h.root.matrixWorld);
  motion.copy(world).sub(st.last);const distance=st.ready?Math.hypot(motion.x,motion.z):0;
  const reset=!st.ready||distance>2;st.last.copy(world);st.ready=true;
  if(reset){for(const f of st.feet){f.plant=false;f.wasSwing=false;f.actualReady=false}st.phase=0}
  st.air+=((c.air?1:0)-st.air)*k;st.wall+=(Math.abs(wr)-st.wall)*k;if(wr)st.side=wr;
  h.wallHand=null;if(h.W&&h.W.g2&&(h.freeW||0)<.6)h.W.g2.visible=true;h.contactGround=false;h.contactWallFeet=false;h.contactClimbFeet=false;h.actionFree=false;h.contactMode=null;
  h.contactTurn=false;if(special(h,c,dt,st)){if(st.turn){st.turn.active=false;st.turn.ready=false}return}
  const amp=clamp(spd/6,0,1),moving=spd>.12||st.feet.some(f=>f.wasSwing);
  const turning=turnStep(h,c,dt,st,!moving&&!c.air&&st.air<.02&&!wr&&st.wall<.04,reset);
  const nominalCycle=1.05+Math.min(spd,8)*.25,duty=.53-.13*amp,reachMax=Math.sqrt(Math.max(.01,.885*.885-Math.pow(.87-.075*amp-.25*(c.crouch||0),2))),stride=Math.min(.70,reachMax*1.8,nominalCycle*duty),cycle=stride/duty;
  if(!c.air&&moving)st.phase+=distance>1e-6?distance/cycle:dt*1.4;if(wr)st.phase+=dt*1.8;
  if(distance>.00001)motion.y=0;else motion.set(0,0,1).applyQuaternion(rootQ);
  motion.applyQuaternion(q1.copy(rootQ).invert());motion.y=0;motion.normalize();
  if(!moving)motion.set(0,0,1);
  h.hips.position.y=.95-(moving?.025:0)-.075*amp*(1-st.air)-.25*(c.crouch||0);
  h.hips.position.x=turning?(st.turn.leg?-.018:.018)*Math.sin(Math.PI*st.turn.time/st.turn.duration):0;h.hips.rotation.y=0;
  h.hips.rotation.z=st.side*.24*st.wall+(h.sm.lat||0)*.055*(1-st.air);h.spine.rotation.z=-st.side*.10*st.wall-(h.sm.lat||0)*.10*(1-st.air);
  invH.copy(h.hips.quaternion).invert();invS.copy(h.spine.quaternion).invert();
  const wallD=wr?wallDistance(h,wr):.42;
  for(let i=0;i<2;i++){
   const L=h.legs[i],f=st.feet[i],side=i?1:-1;
   if(!f.ready){f.hip.copy(L.hip.quaternion);f.knee.copy(L.knee.quaternion);f.ready=true}
   if(wr){
    f.wasSwing=false;f.plant=false;const phase=st.phase*Math.PI*2+i*Math.PI,lift=Math.max(0,Math.sin(phase));
    target.set(-wr*(wallD-.08-.07*lift),.24+.13*lift,.22*Math.cos(phase));f.wallTarget.copy(target);
    leg(h,L,target,1,f,k);h.contactWallFeet=true;
   }else if(c.air||st.air>.02||st.wall>.04){
    f.wasSwing=false;f.plant=false;
    const wave=Math.sin(st.phase*Math.PI*2+i*Math.PI),a=st.wall>.04?-.15+wave*.32:-.18+(i?.035:0),b=st.wall>.04?.65+Math.max(0,-wave)*.30:.48+(i?.04:0);
    q1.setFromEuler(airEuler.set(a,0,-side*.065));q2.setFromAxisAngle(axisX,b);
    f.hip.slerp(q1,k);f.knee.slerp(q2,k);L.hip.quaternion.copy(f.hip);L.knee.quaternion.copy(f.knee);
   }else if(turning){
    if(st.turn.leg===i)target.copy(f.turnTarget).applyMatrix4(invRoot);else target.copy(f.anchor).applyMatrix4(invRoot);
    leg(h,L,target,1,f,k);h.contactGround=true;
   }else{
    // Both legs share one clock, exactly half a cycle apart. Reach/spacing
    // corrections must never retime one leg: that synchronizes the feet.
    const ph=(st.phase+i*.5)%1,stance=ph<duty||(spd<=.12&&!f.wasSwing);f.phase=ph;
    const z=!moving?0:stance?stride*.5-ph/duty*stride:-stride*.5+((ph-duty)/(1-duty))*stride;
    if(!f.swingFrom) { f.swingFrom=V3();f.swingTo=V3();f.actual=V3(); }
    target.set(side*.13+motion.x*z,.06,motion.z*z);
    if(stance){
     if(!f.plant){
      if(f.wasSwing) f.anchor.copy(f.swingTo);else f.anchor.copy(target).applyMatrix4(h.root.matrixWorld);
      groundPoint(f.anchor,h);f.plant=true;
     }
     f.wasSwing=false;target.copy(f.anchor).applyMatrix4(invRoot);
    }else{
     const u=clamp((ph-duty)/(1-duty),0,1),ease=u*u*u*(u*(u*6-15)+10);
     if(!f.wasSwing){
      if(f.plant)f.swingFrom.copy(f.anchor);else if(f.actualReady)f.swingFrom.copy(f.actual);else f.swingFrom.copy(target).applyMatrix4(h.root.matrixWorld);
      const travel=cycle*(1-duty);
      f.swingTo.set(side*.13+motion.x*(stride*.5+travel),.06,motion.z*(stride*.5+travel)).applyMatrix4(h.root.matrixWorld);
      groundPoint(f.swingTo,h);f.wasSwing=true;
     }
     world.copy(f.swingFrom).lerp(f.swingTo,ease);
     world.y+=16*u*u*(1-u)*(1-u)*(.105+.055*amp);
     target.copy(world).applyMatrix4(invRoot);f.plant=false;
    }
    // Limit extreme planted reach without snapping the foot to the root origin.
    const reach=Math.hypot(target.x-side*.1,target.z);
    if(reach>reachMax){const scale=reachMax/reach;target.x=side*.1+(target.x-side*.1)*scale;target.z*=scale;if(f.plant){f.anchor.copy(target).applyMatrix4(h.root.matrixWorld)}}
    const other=st.feet[1-i];
    if(!f.plant&&(other.plant||other.actualReady)){
     temp.copy(other.plant?other.anchor:other.actual).applyMatrix4(invRoot);
     dir.copy(target).sub(temp);const spacing=dir.length();
     if(spacing<.20){if(spacing<1e-5)dir.set(side,0,0);else dir.divideScalar(spacing);target.addScaledVector(dir,.20-spacing)}
    }
    f.actual.copy(target).applyMatrix4(h.root.matrixWorld);f.actualReady=true;
    leg(h,L,target,1,f,k);h.contactGround=true;
   }
  }
  if(wr||st.wall>.15)arms(h,wr||st.side,st.wall);
 }
 // Candidate V2: final pose stabilization BEFORE GLB retarget, then restore
 // foot constraints. Never smooth physical root, camera, gun or magazine alone.
 let groundSampler=null;
 function groundPoint(p,h){
  const baseY=h.root.matrixWorld.elements[13];let y=baseY;
  if(groundSampler){const value=groundSampler(p.x,p.z,baseY,h);if(Number.isFinite(value))y=value}
  else if(typeof mode!=='undefined'){
   if(mode==='wc'&&typeof wcTerrainHeight==='function')y=wcTerrainHeight(p.x,p.z);
   else if(typeof OW!=='undefined'&&OW.on&&typeof owH==='function')y=owH(p.x,p.z);
   else if(typeof MC!=='undefined'&&MC.cur&&typeof mcGround==='function')y=mcGround(p.x,p.z,baseY+.3);
  }
  // Discontinuities larger than a step are ledges, not a reason to stretch legs.
  p.y=Number.isFinite(y)&&Math.abs(y-baseY)<.32?y+.06:baseY+.06;
 }
 const poseNodes=h=>[h.hips,h.spine,h.head,...h.legs.flatMap(l=>[l.hip,l.knee])];
 function update(h,c,dt){
  if(!h||!h.legs||h.zombie||h.gm)return;
  const st=state(h),modeKey=c.climb?'climb':c.slide?'slide':c.glide?'glide':c.wallrun?'wall':c.air?'air':'ground';
  const elapsed=clamp(Number.isFinite(dt)?dt:0,0,.12);if(!elapsed)return;
  const nodes=st.pose?st.pose.refs:poseNodes(h);
  if(!st.pose)st.pose={refs:nodes,nodes:nodes.map(n=>n?{q:n.quaternion.clone(),p:n.position.clone()}:null),feet:[V3(),V3()],feetReady:false,last:V3(),ready:false,mode:modeKey,blend:1};
  const p=st.pose;h.root.updateWorldMatrix(true,false);world.setFromMatrixPosition(h.root.matrixWorld);
  const teleport=p.ready&&world.distanceTo(p.last)>2;p.last.copy(world);
  if(p.mode!==modeKey){p.blend=0;p.mode=modeKey}
  updateRaw(h,c,elapsed);
  const alpha=1-Math.exp(-22*elapsed),qa=1-Math.exp(-26*elapsed);
  p.blend=Math.min(1,p.blend+elapsed/.18);
  for(let i=0;i<nodes.length;i++){
   const n=nodes[i],saved=p.nodes[i];
   if(!n)continue;
   if(!p.ready||teleport){saved.p.copy(n.position);saved.q.copy(n.quaternion);continue}
   // Legs track continuous gait exactly. Cross-mode poses use an inertial blend.
   // Aim pitch remains immediate; only hip/spine and action transitions are filtered.
   const legNode=i>=3,shouldBlend=!legNode||p.blend<1;
   if(i===2){saved.p.copy(n.position);saved.q.copy(n.quaternion);continue}
   if(shouldBlend){saved.p.lerp(n.position,alpha);saved.q.slerp(n.quaternion,qa);n.position.copy(saved.p);n.quaternion.copy(saved.q)}
   else{saved.p.copy(n.position);saved.q.copy(n.quaternion)}
  }
  p.ready=true;
  // Smooth body height must not pull planted feet away from their support.
  invH.copy(h.hips.quaternion).invert();invS.copy(h.spine.quaternion).invert();
  if(h.contactGround&&!h.contactTurn&&st.feet.every(f=>f.solvedTarget)){
   const a=st.feet[0],b=st.feet[1];dir.copy(a.solvedTarget).sub(b.solvedTarget);const gap=dir.length();
   if(gap<.18){
    const index=!a.plant?0:!b.plant?1:0,f=st.feet[index];
    if(gap<1e-5)dir.set(-1,0,0);else dir.divideScalar(gap);
    f.solvedTarget.addScaledVector(dir,(index?-1:1)*(.18-gap));
    if(f.plant)f.anchor.copy(f.solvedTarget).applyMatrix4(h.root.matrixWorld);
   }
  }
  if(h.contactGround||h.contactWallFeet){
   for(let i=0;i<2;i++){const f=st.feet[i];if(!f.solvedTarget)continue;
    if(!p.feetReady||teleport)p.feet[i].copy(f.solvedTarget);
    else if(p.blend<1&&!f.plant)p.feet[i].lerp(f.solvedTarget,qa);
    else p.feet[i].copy(f.solvedTarget);
    target.copy(p.feet[i]);leg(h,h.legs[i],target,1,f,1);
    if(f.actual)f.actual.copy(f.solvedTarget).applyMatrix4(h.root.matrixWorld);
    p.nodes[3+i*2].q.copy(h.legs[i].hip.quaternion);p.nodes[4+i*2].q.copy(h.legs[i].knee.quaternion);
   }p.feetReady=true;
  }
  if(h.wallHand)arms(h,c.wallrun||st.side,st.wall);
  if(h.actionFree&&h.actionPalms){for(const side of ['R','L']){
   target.copy(h.actionPalms[side]).sub(h.hips.position).applyQuaternion(invH).sub(h.spine.position).applyQuaternion(invS);
   solveArm(side==='R'?h.armR:h.armL,target);
  }}
  if(!h.W&&h.armR&&h.armL&&!h.wallHand&&!h.actionFree){
   if(!st.handTargets)st.handTargets=[h.armR.p0.clone().add(V3(-.03,-.51,.07)),h.armL.p0.clone().add(V3(.03,-.51,.07))];
   for(let i=0;i<2;i++){
    const arm=i?h.armL:h.armR,free=i?h.fL:h.fR;
    target.copy(arm.p0).add(temp.set(i?.03:-.03,-.51,.07));
    if(free)target.lerp(free,clamp((h.freeW||0)*1.8,0,1));
    st.handTargets[i].lerp(target,alpha);temp.copy(st.handTargets[i]);solveArm(arm,temp);
   }
  }
 }

 animHuman=function(h,c,dt){if(!h?.legs||h.zombie||h.gm){base(h,c,dt);update(h,c,dt);return}const st=state(h),ctx=st.ctx||(st.ctx={});for(const key in ctx)if(!Object.prototype.hasOwnProperty.call(c,key))delete ctx[key];Object.assign(ctx,c);st.visualSpeed=(st.visualSpeed||0)+((c.speed||0)-(st.visualSpeed||0))*(1-Math.exp(-14*Math.min(dt||0,.12)));ctx.speed=st.visualSpeed;base(h,ctx,dt);update(h,ctx,dt)};
 return {update,version:'2.0.1-alternating-gait',setGroundSampler(fn){groundSampler=typeof fn==='function'?fn:null}};
})();

