'use strict';
/* Presentation only: physical vehicle position/yaw and race rules remain in race.js.
   Steer pivots, axle spin and sprung body are separate transforms. */
const RaceMotion=(()=>{
 const tau=Math.PI*2,cl=(n,a,b)=>Math.max(a,Math.min(b,n));
 function spring(s,key,target,omega,dt){
  const velocity=key+'V',x=(s[key]||0)-target,v=s[velocity]||0,e=Math.exp(-omega*dt),b=(v+omega*x)*dt;
  s[key]=target+(x+b)*e;s[velocity]=(v-omega*b)*e;return s[key];
 }
 function update(v,dt){
  const m=v&&v.mdl;if(!m)return;
  dt=cl(Number.isFinite(dt)?dt:0,0,.1);if(!dt)return;
  const speed=Number.isFinite(v.spd)?v.spd:0,yaw=Number.isFinite(v.yaw)?v.yaw:0;
  const s=m.motion||(m.motion={lastSpeed:speed,lastYaw:yaw,time:0,distance:0,pitch:0,roll:0,heave:0,steer:0,accel:0});
  let yawDelta=Math.atan2(Math.sin(yaw-s.lastYaw),Math.cos(yaw-s.lastYaw));
  if(Math.abs(speed-s.lastSpeed)>20||Math.abs(yawDelta)>1){s.accel=0;yawDelta=0;s.lastSpeed=speed}
  const a=cl((speed-s.lastSpeed)/dt,-30,22),k=1-Math.exp(-12*dt);
  s.accel+=(a-s.accel)*k;s.lastSpeed=speed;s.lastYaw=yaw;s.time+=dt;s.distance+=speed*dt;
  const steering=spring(s,'steer',v.wreckT>0?0:cl(v.steer||0,-1,1)*.42,18,dt);
  if(m.wh){for(const spin of m.wh){
   const radius=spin.userData.radius||.33;
   spin.rotation.x=(spin.rotation.x+(v.air?0:speed*dt/radius))%tau;
  }}
  if(m.stW)for(const pivot of m.stW)pivot.rotation.y=steering;
  if(m.body&&!v.air){
   const pitch=spring(s,'pitch',cl(-s.accel*.0028,-.065,.085),12,dt);
   const roll=spring(s,'roll',cl(yawDelta/dt*speed*.0038,-.11,.11),11,dt);
   const heave=spring(s,'heave',Math.sin(s.distance*2.8)*.006*cl(Math.abs(speed)/15,0,1),15,dt);
   m.body.rotation.set(pitch,0,roll);m.body.position.y=heave;
  }
  if(m.wing){if(m.wingBase==null)m.wingBase=m.wing.rotation.x;const target=(v.boostT>0||Math.abs(speed)>30||s.accel< -6)?.34:0;m.wing.rotation.x=m.wingBase+spring(s,'spoiler',target,12,dt)}
  if(m.prop&&m.propKind==='rotor')m.prop.rotation.z=(m.prop.rotation.z+dt*(16+Math.abs(speed)*.85))%tau;
  if(m.exhaust){
   const power=(v.boostT>0?1.65:1)+Math.sin(s.time*35)*.06;
   m.exhaust.scale.y=power;m.exhaust.material.opacity=cl(.55+Math.abs(speed)*.005+(v.boostT>0?.18:0),.55,.95);
  }
  if(m.glw)m.glw.material.opacity=.13+Math.sin(s.time*5)*.025+(v.boostT>0?.10:0);
 }
 return {update,spring,version:'1.0.0'};
})();
