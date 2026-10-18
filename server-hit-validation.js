'use strict';
const collision=require('./server-hit-collision');
// All gameplay tolerances live here. Damage and movement are never changed.
const LIMITS=Object.freeze({historyMs:350,rewindMs:100,futureMs:50,rateSlackMs:5,positionSlack:0.5,wallEndpointSlack:0.18,
 eyeHeight:1.6,crouchEyeHeight:1.05,bodyHeight:1.0,headHeight:1.65,maxHistorySamples:64,maxShotTargets:12,
 ranges:Object.freeze({rifle:100,smg:100,pistol:100,dual:100,knife:3,sword:4.4,gsword:5}),
 legacyGunArenaRange:130,legacyGunTeamRange:320,legacyMeleeSlack:3.5,legacyGunRate:.45,legacyMeleeRate:.5});
function createValidator({log=console.log}={}){
 const histories=new WeakMap(),states=new WeakMap();
 const stats={accepted:0,legacy:0,rejected:0,reasons:{},timing:{count:0,totalMs:0,maxMs:0}};
 function state(c){let s=states.get(c);if(!s){s={modern:false,nextAt:0,shot:null,lastId:-1};states.set(c,s)}return s}
 function record(c,now,stamp){
  let h=histories.get(c);if(!h){h=[];histories.set(c,h)}
  const t=Number.isFinite(stamp)?Math.max(now-LIMITS.rewindMs,Math.min(now,stamp)):now;
  if(h.length&&t<h[h.length-1].t)return;
  h.push({t,x:c.x,y:c.y||0,z:c.z,fl:c.fl||0});
  while(h.length>LIMITS.maxHistorySamples||(h.length>1&&h[1].t<now-LIMITS.historyMs))h.shift();
 }
 function position(c,t){const h=histories.get(c);if(!h||!h.length)return c;
  if(t<=h[0].t)return h[0];for(let i=h.length-1;i>0;i--)if(h[i-1].t<=t){const p=h[i-1],q=h[i],f=Math.min(1,(t-p.t)/Math.max(1,q.t-p.t));return{x:p.x+(q.x-p.x)*f,y:p.y+(q.y-p.y)*f,z:p.z+(q.z-p.z)*f,fl:p.fl}}
  return h[h.length-1];
 }
 function reject(c,m,reason,now){stats.rejected++;stats.reasons[reason]=(stats.reasons[reason]||0)+1;
  log(JSON.stringify({event:'hit-rejected',at:now,player:c.id,room:c.rm&&c.rm.key,weapon:m.w,shotId:m.shotId,reason}));return false}
 function check(c,target,m,W,map,now){
  const s=state(c),fields=Object.hasOwn(m,'shotId')||Object.hasOwn(m,'shotAt');
  if(!fields&&!s.modern)return null; // explicitly retain old-client rules
  if(!Number.isSafeInteger(m.shotId)||m.shotId<0||!Number.isFinite(m.shotAt))return reject(c,m,'shot-fields',now);
  s.modern=true;
  if(m.shotAt>now+LIMITS.futureMs||m.shotAt<now-LIMITS.historyMs)return reject(c,m,'shot-time',now);
  const at=Math.max(now-LIMITS.rewindMs,Math.min(now,m.shotAt));
  const same=s.shot&&s.shot.id===m.shotId;
  if(same){if(!W.m||s.shot.w!==m.w||s.shot.targets.has(target)||s.shot.targets.size>=LIMITS.maxShotTargets||now-s.shot.received>LIMITS.rewindMs)return reject(c,m,'duplicate-shot',now)}
  else{
   if(m.shotId<=s.lastId)return reject(c,m,'replayed-shot',now);
   // Leaky schedule: a small one-off jitter allowance, never a sustained faster fire rate.
   if(at+LIMITS.rateSlackMs<s.nextAt)return reject(c,m,'fire-rate',now);
   const cls=m.w==='dual'?'pistol':m.w,model=collision.data.weaponProfiles&&collision.data.weaponProfiles[c.mods&&c.mods[cls]];
   const rate=model&&model.cls===cls?model.rate:W.r;
   s.nextAt=Math.max(at,s.nextAt)+rate*1000;s.lastId=m.shotId;s.shot={id:m.shotId,w:m.w,received:now,targets:new Set()};
  }
  s.shot.targets.add(target);
  const p=position(c,at),v=position(target,at),range=LIMITS.ranges[m.w];
  if(!range||Math.hypot(p.x-v.x,(p.y||0)-(v.y||0),p.z-v.z)>range+LIMITS.positionSlack)return reject(c,m,'range',now);
  const eye={x:p.x,y:(p.y||0)+((p.fl&2)?LIMITS.crouchEyeHeight:LIMITS.eyeHeight),z:p.z};
  const aim={x:v.x,y:(v.y||0)+(m.hd&&!W.m?LIMITS.headHeight:LIMITS.bodyHeight),z:v.z};
  if(collision.blocked(map,eye,aim,LIMITS.wallEndpointSlack))return reject(c,m,'wall',now);
  stats.accepted++;return true;
 }
 function validate(...args){const start=process.hrtime.bigint();let result;try{return result=check(...args)}finally{const ms=Number(process.hrtime.bigint()-start)/1e6;stats.timing.count++;stats.timing.totalMs+=ms;stats.timing.maxMs=Math.max(stats.timing.maxMs,ms);if(process.env.MMOFPS_HIT_TEST==='1')log(JSON.stringify({event:'hit-check',player:args[0].id,shotId:args[2].shotId,result,ms}))}}
 function reset(c,now){histories.delete(c);const modern=state(c).modern;states.delete(c);state(c).modern=modern;record(c,now)}
 return{validate,record,reset,reject,stats,legacy(){stats.legacy++},position};
}
module.exports={LIMITS,createValidator};
