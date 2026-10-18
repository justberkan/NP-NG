'use strict';
const fs=require('fs'),os=require('os'),path=require('path'),net=require('net'),assert=require('assert/strict'),{spawn}=require('child_process');
const {LIMITS,createValidator}=require('../server-hit-validation'),collision=require('../server-hit-collision');
const root=path.resolve(__dirname,'..'),results=[],timings=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const check=(name,ok,detail)=>{results.push({name,ok,detail});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?' '+JSON.stringify(detail):''}`);if(!ok)throw Error(name)};
let child,dir,log='',clients=[];
async function until(fn,timeout=3000){const start=Date.now();while(Date.now()-start<timeout){const v=fn();if(v)return v;await sleep(5)}throw Error('Timed out: '+log.slice(-1200))}
async function peer(port,n){const ws=new WebSocket(`ws://127.0.0.1:${port}`),p={ws,messages:[],send:m=>ws.send(JSON.stringify(m))};clients.push(p);ws.addEventListener('message',e=>p.messages.push(JSON.parse(e.data)));await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true})});p.send({t:'auth',mode:'register',name:'hit'+n,pass:'test-only-password'});await until(()=>p.messages.find(m=>m.t==='auth'&&m.ok));p.send({t:'atools',flags:{noclip:true}});await until(()=>p.messages.find(m=>m.t==='atools'));return p}
async function join(p,room,map){p.messages=[];p.send({t:'join',room,map,w:'rifle'});const m=await until(()=>p.messages.find(m=>m.t==='welcome'));p.id=m.id;return m}
function place(p,q,stamp=Date.now()){p.send({t:'st',...q,w:'rifle',sentAt:stamp})}
let sequence=0;
async function attempt(a,b,pa,pb,{delay=0,legacy=false,heal=true,wait=110}={}){
 await sleep(wait);
 if(heal){const index=b.messages.length;b.send({t:'aheal'});await until(()=>b.messages.slice(index).some(m=>m.t==='aheal'))}
 const shotAt=Date.now();place(a,pa,shotAt);place(b,pb,shotAt);await sleep(delay||5);
 const id=++sequence,offset=log.length,mi=b.messages.length;
 a.send({t:'hit',id:b.id,w:'rifle',...(legacy?{}:{shotId:id,shotAt})});
 const event=await until(()=>{const lines=log.slice(offset).split('\n');for(const line of lines)try{const v=JSON.parse(line);if(v.event==='hit-check'&&v.player===a.id&&(legacy||v.shotId===id))return v}catch{}return false});
 timings.push(event.ms);
 if(event.result===true||event.result===null)await until(()=>b.messages.slice(mi).find(m=>m.t==='hp'&&m.by===a.id));
 else{await sleep(5);assert(!b.messages.slice(mi).some(m=>m.t==='hp'&&m.by===a.id),'Rejected hit changed health')}
 return event.result!==false;
}
(async()=>{
 collision.verifySources();check('Collision source hashes match client',true);
 check('Collision data below 2 MiB',fs.statSync(path.join(root,'server-hit-collision.bin')).size<=2*1024*1024);
 const port=await new Promise(r=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})});
 dir=fs.mkdtempSync(path.join(os.tmpdir(),'npng-hit-'));
 child=spawn(process.execPath,['server.js'],{cwd:root,windowsHide:true,env:{...process.env,PORT:String(port),MMOFPS_DATA:dir,MMOFPS_HIT_TEST:'1'}});child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
 await until(()=>log.includes('sunucusu çalışıyor'));
 const a=await peer(port,'a'),b=await peer(port,'b');await join(a,'ar');await join(b,'ar');await sleep(2050);
 check('Legacy client accepted and stays connected',await attempt(a,b,{x:0,y:0,z:20},{x:5,y:0,z:20},{legacy:true}));
 check('Arena normal hit accepted',await attempt(a,b,{x:0,y:0,z:20},{x:5,y:0,z:20}));
 check('Arena wall hit rejected',!await attempt(a,b,{x:-10,y:0,z:-14},{x:-6,y:0,z:-14}));
 await attempt(a,b,{x:0,y:0,z:20},{x:5,y:0,z:20});
 check('10x firing rate rejected',!await attempt(a,b,{x:0,y:0,z:20},{x:5,y:0,z:20},{wait:0}));
 check('300m hit rejected',!await attempt(a,b,{x:0,y:10,z:0},{x:300,y:10,z:0}));
 // Corner: fire after stepping past the end of the tall Arena wall, with 100ms transport delay.
 let accepted=0;for(let i=0;i<500;i++){
  const old=Date.now();place(a,{x:-10,y:0,z:-14},old);place(b,{x:-6,y:0,z:-14},old);
  if(await attempt(a,b,{x:-10,y:0,z:-9},{x:-6,y:0,z:-9},{delay:100,wait:10}))accepted++;
 }
 check('500 legitimate corner-exit shots at 100ms: >=99%',accepted>=495,{accepted,total:500});
 a.send({t:'quit'});b.send({t:'quit'});await sleep(50);await join(a,'tm','dust2');await join(b,'tm','dust2');await sleep(2050);
 const passages=collision.data.dust2.passages;check('Dust2 doorway/passage fixtures from client geometry',passages.length>=3,{passages});
 accepted=0;for(let i=0;i<500;i++){const q=passages[i%passages.length],pa={...q.a,y:q.a.y-1.4},pb={...q.b,y:q.b.y-1.4};if(await attempt(a,b,pa,pb,{delay:100,wait:10}))accepted++}
 check('500 legitimate Dust2 passage shots: >=99%',accepted>=495,{accepted,total:500});
 const q=passages[0],side={x:0,z:1.5};check('Dust2 wall adjacent to passage rejected',!await attempt(a,b,{x:q.a.x+side.x,y:q.a.y-1.4,z:q.a.z+side.z},{x:q.b.x+side.x,y:q.b.y-1.4,z:q.b.z+side.z}));
 accepted=0;for(let i=0;i<500;i++)if(await attempt(a,b,{x:-50,y:100,z:0},{x:50,y:100,z:0},{delay:100,wait:10}))accepted++;
 check('500 legitimate range-boundary shots: >=99%',accepted>=495,{accepted,total:500});
 a.send({t:'quit'});b.send({t:'quit'});await sleep(50);await join(a,'zo');await join(b,'zo');await sleep(2100);
 await until(()=>a.messages.slice().reverse().find(m=>m.t==='zs'&&m.s.length));
 async function zombieHit(kind,wait=110){
  await sleep(wait);
  const zs=a.messages.slice().reverse().find(m=>m.t==='zs'&&m.s.length).s;
  const z=kind==='normal'?(zs.find(z=>!collision.blocked('arena',{x:z[1],y:1.6,z:z[2]+1},{x:z[1],y:1,z:z[2]},.18))||zs[0]):zs[0];
  const pa={x:z[1]+(kind==='range'?300:kind==='wall'?100:0),y:0,z:z[2]+(kind==='normal'?1:0)};
  place(a,pa);await sleep(5);const id=++sequence,offset=log.length;
  a.send({t:'zhit',id:z[0],w:'rifle',shotId:id,shotAt:Date.now()});
  const event=await until(()=>{for(const line of log.slice(offset).split('\n'))try{const m=JSON.parse(line);if(m.event==='hit-check'&&m.shotId===id)return m}catch{}return false});timings.push(event.ms);return event.result;
 }
 check('Zombie Co-op normal hit accepted',await zombieHit('normal'));
 check('Zombie Co-op 10x rate rejected',!await zombieHit('normal',0));
 check('Zombie Co-op 300m rejected',!await zombieHit('range'));
 check('Zombie Co-op wall rejected',!await zombieHit('wall'));
 // Deterministic policy coverage supplements (does not replace) real socket checks.
 const v=createValidator({log:()=>{}}),shooter={x:0,y:20,z:0},victim={x:5,y:20,z:0};
 const w={r:.1};v.record(shooter,1000);v.record(victim,1000);
 check('Modern client cannot downgrade by omitting metadata',v.validate(shooter,victim,{w:'rifle',shotId:1,shotAt:1000},w,'arena',1000)===true&&v.validate(shooter,victim,{w:'rifle'},w,'arena',1200)===false);
 check('Future timestamp rejected',v.validate(shooter,victim,{w:'rifle',shotId:2,shotAt:5000},w,'arena',1200)===false);
 check('Replay rejected',v.validate(shooter,victim,{w:'rifle',shotId:1,shotAt:1200},w,'arena',1200)===false);
 const h=createValidator({log:()=>{}}),p0={x:0,y:0,z:0};for(let t=1000;t<=1350;t+=50){p0.x=t;h.record(p0,t)}
 check('At least 250ms position history retained',LIMITS.historyMs>=250&&h.position(p0,1100).x===1100);
 h.reset(p0,1400);check('Respawn discards previous-life history',h.position(p0,1100).x===1350);
 for(const [weapon,range] of Object.entries(LIMITS.ranges)){
  const policy=createValidator({log:()=>{}}),p={x:0,y:20,z:0},t={x:range,y:20,z:0},W={r:.1,m:['knife','sword','gsword'].includes(weapon)?range:0};
  check(weapon+' range boundary accepted',policy.validate(p,t,{w:weapon,shotId:1,shotAt:1000},W,'arena',1000)===true);
  t.x=range+LIMITS.positionSlack+.1;check(weapon+' beyond range rejected',policy.validate(p,t,{w:weapon,shotId:2,shotAt:1200},W,'arena',1200)===false);
 }

 let modelShots=0;
 for(const [id,profile] of Object.entries(collision.data.weaponProfiles)){
  const policy=createValidator({log:()=>{}}),p={x:0,y:20,z:0,mods:{[profile.cls]:id}},t={x:2,y:20,z:0};
  for(let i=0;i<20;i++){const now=1000+i*profile.rate*1000;assert.equal(policy.validate(p,t,{w:profile.cls,shotId:i,shotAt:now},{r:.1,m:profile.cls==='knife'?3:0},'arena',now),true,id+' legitimate rate');modelShots++}
 }
 check('All catalog model firing rates accepted',true,{modelShots});
 const ordered=timings.slice().sort((a,b)=>a-b),mean=timings.reduce((a,b)=>a+b,0)/timings.length;
 check('Validation mean below 0.2ms',mean<.2,{count:timings.length,meanMs:mean,p95Ms:ordered[Math.floor(ordered.length*.95)],maxMs:ordered.at(-1)});
})().catch(e=>{results.push({name:'exception',ok:false,detail:e.stack});console.error(e);process.exitCode=1}).finally(async()=>{
 for(const p of clients)p.ws.close();if(child&&child.exitCode===null)await new Promise(r=>{child.once('exit',r);child.kill()});
 if(dir&&path.dirname(dir)===os.tmpdir()&&path.basename(dir).startsWith('npng-hit-'))fs.rmSync(dir,{recursive:true,force:true});
 const out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'server-hit.json'),JSON.stringify({results,limits:LIMITS,timingsMs:timings,serverLog:log},null,2));
});
