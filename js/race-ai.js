'use strict';
/* Local racing AI: pursuit, curvature braking, traffic lanes and item tactics.
   No position teleport, no free weapons or free boost. */
const RaceAI=(()=>{
 const cl=(v,a,b)=>Math.max(a,Math.min(b,v)),angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
 function level(){return RACE.cfg.ai||'hard'}
 function skill(index){const d=level();return(d==='easy'?.87:d==='normal'?.96:1.00)+(index%4)*.008}
 function rubber(v){if(!v.ai||!RACE.v)return 1;return 1+cl((RACE.v.prog-v.prog)/180,-1,1)*(level()==='easy'?.01:.025)}
 function init(v){return v.brain||(v.brain={lane:v.lat||0,laneHold:0,scan:0,stuck:0,lastProgress:v.prog,recover:0,targetSpeed:0,passes:0})}
 function traffic(v,b){
  const q=RACE.track.samples[v.ci],limit=RACE.track.halfW-2.0;
  let blocker=null,behind=null,nearest=36,rear=18;
  const others=RACE.list.filter(o=>o!==v&&!o.done&&o.wreckT<=0);
  for(const o of others){const dx=o.x-v.x,dz=o.z-v.z,ahead=dx*q.tx+dz*q.tz,side=dx*q.rx+dz*q.rz;
   if(ahead>1&&ahead<nearest&&Math.abs(side)<2.5){nearest=ahead;blocker=o}
   if(ahead< -4&&ahead> -rear&&Math.abs(side)<5){rear=-ahead;behind=o}
  }
  if(blocker&&blocker.spd<v.spd+3&&b.laneHold<=0){
   let best=b.lane,bestScore=-Infinity;
   for(const lane of [-Math.min(3.3,limit),0,Math.min(3.3,limit)]){
    let score=8-Math.abs(lane-b.lane)*.25;
    for(const o of others){const dx=o.x-v.x,dz=o.z-v.z,ahead=dx*q.tx+dz*q.tz,offset=(o.x-q.x)*q.rx+(o.z-q.z)*q.rz;
     if(ahead> -7&&ahead<32&&Math.abs(offset-lane)<2.5)score-=ahead<8?30:14;
    }
    if(score>bestScore){bestScore=score;best=lane}
   }
   if(Math.abs(best-b.lane)>1){b.passes++;b.lane=best;b.laneHold=1.3}
  }else if(behind&&b.laneHold<=0&&level()==='hard'&&rear>9){
   // Defend a lane early; never swerve into an already side-by-side opponent.
   b.lane=cl((behind.x-q.x)*q.rx+(behind.z-q.z)*q.rz,-limit,limit);b.laneHold=1.7;
  }
  if(!blocker&&b.laneHold<=0&&RACE.cfg.items&&v.slots.filter(Boolean).length<2){
   for(const pad of RACE.pads){if(!pad.active)continue;const dx=pad.x-v.x,dz=pad.z-v.z,ahead=dx*q.tx+dz*q.tz,side=Math.abs(dx*q.rx+dz*q.rz);if(ahead>5&&ahead<55&&side<9){b.lane=0;b.laneHold=.6;break}}
  }
  return blocker?{distance:nearest,speed:blocker.spd}:null;
 }
 function drive(v,dt){
  const tr=RACE.track,b=init(v),speed=Math.abs(v.spd),inp={th:1,br:0,st:0,drift:false,boost:false};
  b.laneHold-=dt;b.scan-=dt;v.aiCd=(v.aiCd||0)-dt;
  if(b.scan<=0){b.blocker=traffic(v,b);b.scan=.14}
  v.lat+=(cl(b.lane,-tr.halfW+2,tr.halfW-2)-v.lat)*(1-Math.exp(-2.2*dt));
  const look=cl(9+speed*.58,10,34),i=(v.ci+Math.round(look/tr.L*tr.M))%tr.M,q=tr.samples[i];
  const tx=q.x+q.rx*v.lat,tz=q.z+q.rz*v.lat,dx=tx-v.x,dz=tz-v.z;
  const alpha=angle(Math.atan2(dx,dz)-v.yaw),steerRate=2.1-v.def.diff*.004;
  inp.st=cl((2*Math.max(4,speed)*Math.sin(alpha)/Math.max(5,Math.hypot(dx,dz)))/(steerRate*Math.max(.35,cl(speed/9,0,1))),-1,1);
  let target=(20+v.def.spd*.22)*v.skill*rubber(v)*.985;
  // Look far enough ahead to brake before the corner, rather than at the wall.
  for(const distance of [12,28,48,72]){const ahead=tr.samples[(v.ci+Math.round(distance/tr.L*tr.M))%tr.M],here=tr.samples[v.ci];
   const turn=Math.abs(angle(Math.atan2(ahead.tx,ahead.tz)-Math.atan2(here.tx,here.tz))),curvature=turn/distance;
   if(curvature>.0001){const corner=Math.sqrt((7.8+v.def.grip*.055)/curvature),allowance=Math.sqrt(corner*corner+2*13*Math.max(0,distance-12));target=Math.min(target,allowance)}
  }
  if(b.blocker&&Math.abs(b.lane-v.lat)<.7&&b.blocker.distance<12)target=Math.min(target,Math.max(8,b.blocker.speed-1));
  const off=(v.x-tr.samples[v.ci].x)*tr.samples[v.ci].rx+(v.z-tr.samples[v.ci].z)*tr.samples[v.ci].rz;
  if(Math.abs(off)>tr.halfW-2.0)target=Math.min(target,18);
  b.targetSpeed=target;
  inp.br=cl((v.spd-target)/6,0,1);inp.th=inp.br>.05?0:cl((target-v.spd)/5,.15,1);
  b.stuck=Math.abs(v.prog-b.lastProgress)<.005&&speed<2?b.stuck+dt:Math.max(0,b.stuck-dt*2);b.lastProgress=v.prog;
  if(b.stuck>2.3){b.recover=1.1;b.stuck=0}
  if(b.recover>0){b.recover-=dt;inp.th=-1;inp.br=v.spd>.5?1:0;inp.st=cl(-alpha*2,-1,1)}
  if(RACE.cfg.items&&v.aiCd<=0&&v.stunT<=0){use(v);v.aiCd=level()==='easy'?2.0:level()==='normal'?1.1:.65}
  return inp;
 }
 function choose(v){
  const fx=Math.sin(v.yaw),fz=Math.cos(v.yaw);let front=null,back=null,fd=80,bd=28;
  for(const o of RACE.list){if(o===v||o.done||o.wreckT>0)continue;const dx=o.x-v.x,dz=o.z-v.z,dy=v.air?(o.y-v.y):0,d=Math.hypot(dx,dz,dy),dot=(dx*fx+dz*fz)/Math.max(.001,d),side=Math.abs(dx*fz-dz*fx);
   if(dot>.78&&d<fd){fd=d;front={v:o,d,dot}}
   if(dot<-.75&&d<bd&&side<3){bd=d;back={v:o,d,dot}}
  }
  const threat=RACE.projs.some(p=>p.owner!==v&&Math.hypot(p.x-v.x,p.z-v.z)<20);
  let best=null;
  for(let slot=0;slot<v.slots.length;slot++){const item=v.slots[slot];if(!item)continue;let priority=0,dir=1;
   if(item.id==='repair'&&v.hp<v.maxhp*.65)priority=100+(1-v.hp/v.maxhp)*20;
   if(item.id==='shield'&&v.shieldT<=0&&(threat||back&&back.d<16||v.hp<v.maxhp*.4))priority=90;
   if(item.id==='homing'&&front&&front.d<70&&front.v.shieldT<=0)priority=80;
   if(item.id==='beam'){const enemy=front&&front.d<44&&front.dot>.987?front:back&&back.d<28&&back.dot<-.987?back:null;if(enemy){priority=85;dir=enemy===back?-1:1}}
   if(item.id==='orb'&&front&&front.d<30&&front.dot>.97)priority=65;
   if(item.id==='mine'&&back&&back.d<24)priority=72;
   if(item.id==='boost'&&v.boostT<=0&&Math.abs(v.steer)<.27&&(!v.brain||v.brain.targetSpeed>v.spd-1))priority=55;
   if(priority&&(!best||priority>best.priority))best={slot,dir,priority};
  }return best;
 }
 function use(v){const action=choose(v);if(!action)return false;v.sel=action.slot;raceUse(v,action.dir);return true}
 return {drive,use,choose,skill,rubber,version:'1.0.0'};
})();
