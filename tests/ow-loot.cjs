'use strict';
/* Çevrimiçi açık dünya ortak ganimet testi (Claude, 2026-10-20 · Berkan isteği):
   mobu öldürenin eşyası 15 sn yalnız ona ait; alınmazsa sonra herkes alabilir. Kendi sunucusunu geçici veriyle açar.
   1) Ham WebSocket: yetki, öldürme başına bir kez, 15 sn kilidi, uzaklık, sonradan katılan görür.
   2) Gerçek tarayıcı istemcisi: öldür → ganimet sunucudan gelir → üstüne yürü → envantere girer. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results','ow-loot');fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let failed=0;const results=[];
const check=(name,ok,detail)=>{results.push({name,ok,detail});if(!ok)failed++;console.log(`${ok?'PASS':'FAIL'} ${name}${detail!==undefined?' — '+JSON.stringify(detail):''}`)};
let child=null,log='';const dir=fs.mkdtempSync(path.join(os.tmpdir(),'npng-loot-'));
function peer(port){const ws=new WebSocket(`ws://127.0.0.1:${port}`),p={ws,msgs:[],send:m=>ws.send(JSON.stringify(m))};ws.addEventListener('message',e=>{try{p.msgs.push(JSON.parse(e.data))}catch(x){}});return new Promise((res,rej)=>{ws.addEventListener('open',()=>res(p));ws.addEventListener('error',rej)})}
async function wait(p,f,ms=3000){const t=Date.now();while(Date.now()-t<ms){const m=p.msgs.find(f);if(m)return m;await sleep(10)}return null}
async function player(port,name,x,z){const p=await peer(port);p.send({t:'auth',mode:'register',name,pass:'sifre1234',save:{v:3,tl:0}});const a=await wait(p,m=>m.t==='auth');
  p.send({t:'ojoin',ch:'c0',w:'s0',pvp:false,lvl:5});const w=await wait(p,m=>m.t==='owel');p.id=w&&w.id;p.welcome=w;p.at=(x,z)=>p.send({t:'ost',x,y:0,z,yaw:0,pitch:0,vx:0,vz:0,f:1,w:'s0',sw:-1,cb:0,hp:1,lvl:5});p.at(x,z);await sleep(60);p.ok=a&&a.ok&&!!w;return p}
(async()=>{
  const port=await new Promise(r=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const q=s.address().port;s.close(()=>r(q))})});
  child=spawn(process.execPath,['server.js'],{cwd:root,windowsHide:true,env:{...process.env,PORT:String(port),MMOFPS_DATA:dir}});
  child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
  {const t=Date.now();while(!log.includes('sunucusu çalışıyor')){if(Date.now()-t>8000||child.exitCode!==null)throw Error('sunucu başlamadı: '+log);await sleep(25)}}
  /* ---- 1) Ham istemciler ---- */
  const A=await player(port,'ganA',10,10),B=await player(port,'ganB',12,10);
  check('İki oyuncu açık dünyaya girdi',A.ok&&B.ok);
  A.msgs=[];B.msgs=[];
  A.send({t:'olt',i:7,x:10,z:10,it:[['ore',1]]});await sleep(300);
  check('Öldürmeden ganimet bırakılamaz',!B.msgs.some(m=>m.t==='oln'));
  A.send({t:'omd',i:7,max:50,d:50});await wait(A,m=>m.t==='omk');
  A.send({t:'olt',i:7,x:10,z:10,it:[['ore',2],['fang',1]]});
  const ln=await wait(B,m=>m.t==='oln');
  check('Öldürenin ganimeti herkese görünür, sahibi öldüren',!!ln&&ln.l.length===2&&ln.l.every(r=>r[5]===A.id),ln&&ln.l);
  B.msgs=[];A.send({t:'olt',i:7,x:10,z:10,it:[['gem',5]]});await sleep(300);
  check('Öldürme başına yalnız bir kez ganimet',!B.msgs.some(m=>m.t==='oln'));
  const [l1,l2]=ln.l;
  B.msgs=[];B.send({t:'olp',id:l1[0]});const rj=await wait(B,m=>m.t==='olr'||m.t==='olg');
  check('15 sn dolmadan başkası alamaz',!!rj&&rj.t==='olr'&&rj.w>13000,rj);
  A.msgs=[];B.msgs=[];A.send({t:'olp',id:l1[0]});const g1=await wait(A,m=>m.t==='olg'),x1=await wait(B,m=>m.t==='olx'&&m.id===l1[0]);
  check('Sahibi hemen alır, diğerinden kaybolur',!!g1&&g1.it==='ore'&&g1.n===2&&!!x1,{g1,x1});
  A.msgs=[];A.send({t:'olp',id:l1[0]});const again=await wait(A,m=>m.t==='olg'||m.t==='olx',800);
  check('Aynı ganimet ikinci kez alınamaz',!!again&&again.t==='olx',again);
  /* sonradan katılan görür */
  const C=await player(port,'ganC',40,40);
  check('Sonradan katılan açık ganimeti görür',!!C.welcome&&(C.welcome.loot||[]).some(r=>r[0]===l2[0]),C.welcome&&C.welcome.loot);
  /* 15 sn sonra başkası alabilir; uzaktan alamaz */
  await sleep(15300);
  B.at(80,80);await sleep(80);B.msgs=[];B.send({t:'olp',id:l2[0]});await sleep(400);
  check('Serbest kalsa da uzaktan alınamaz',!B.msgs.some(m=>m.t==='olg'));
  B.at(12,10);await sleep(80);B.msgs=[];A.msgs=[];B.send({t:'olp',id:l2[0]});
  const g2=await wait(B,m=>m.t==='olg'),x2=await wait(A,m=>m.t==='olx'&&m.id===l2[0]);
  check('15 sn sonra başkası alabilir',!!g2&&g2.it==='fang'&&!!x2,{g2,x2});
  for(const q of [A,B,C])q.ws.close();await sleep(200);
  /* ---- 2) Gerçek tarayıcı istemcisi ---- */
  const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(fs.existsSync(chrome)?chrome:undefined),args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const errors=[];
  try{
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    await page.addInitScript(()=>{try{localStorage.setItem('npng_legal_v1','1')}catch(e){}});
    page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,200)));page.on('dialog',d=>d.accept().catch(()=>{}));
    await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'load'});
    await page.waitForFunction(()=>typeof OFFL==='object'&&!OFFL.pend&&typeof MPL==='object',null,{timeout:30000});
    await page.evaluate(p=>{window.__eski=1;mpConnect('ws://127.0.0.1:'+p,'ganTar','sifre1234','register',true)},port);
    await page.waitForFunction(()=>!window.__eski&&typeof OFFL==='object'&&!OFFL.pend&&MPL.authed,null,{timeout:30000});
    await page.evaluate(()=>{if(typeof CLS!=='undefined'&&!SV.ow.cls)SV.ow.cls=Object.keys(CLS)[0];window.requestAnimationFrame=()=>0;selMode='ow';startMatch();for(let i=0;i<20;i++)tick(1/60)});
    await page.waitForFunction(()=>OWN.on,null,{timeout:10000});
    const r=await page.evaluate(async()=>{
      const c=document.getElementById('clsm');if(c)c.classList.remove('open');if(state==='pause')state='play';
      const m=OW.mobs.find(q=>q.state!=='dead'&&!q.boss&&q.camp&&q.camp.bi===0)||OW.mobs.find(q=>q.state!=='dead'&&!q.boss);
      if(OW.act.indexOf(m)<0)owAct(m);
      p.x=m.x-3;p.z=m.z;p.y=owH(p.x,p.z);p.inv=99;for(let i=0;i<10;i++)tick(1/60);
      const inv0=JSON.stringify(SV.ow.inv),R0=Math.random;Math.random=()=>0; /* tüm olası düşüşler */
      owDamage(m,m.max*20,{player:true,pt:V3(m.x,1,m.z),dir:V3(1,0,0),head:false,melee:true,power:5});
      let net=[];for(let i=0;i<120&&!net.length;i++){await new Promise(r=>setTimeout(r,25));net=LOOT.filter(o=>o.lid)}
      Math.random=R0;
      const mine=net.length&&net.every(o=>o.owner===OWN.id);
      for(let i=0;i<240&&LOOT.some(o=>o.lid);i++){const o=LOOT.find(q=>q.lid);p.x=o.sx;p.z=o.sz;p.y=owH(p.x,p.z);p.inv=99;tick(1/60);await new Promise(r=>setTimeout(r,8))}
      return {ganimet:net.length,sahip:!!mine,kalan:LOOT.filter(o=>o.lid).length,envDegisti:JSON.stringify(SV.ow.inv)!==inv0,env:SV.ow.inv}});
    check('Tarayıcı: öldürünce ganimet sunucudan gelir ve öldürene ait',r.ganimet>0&&r.sahip,r);
    check('Tarayıcı: üstüne yürüyünce alınır ve envantere girer',r.kalan===0&&r.envDegisti,r);
    check('Sayfa hatası yok',!errors.length,errors.slice(0,3));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);failed++}).finally(async()=>{
  if(child&&child.exitCode===null)await new Promise(r=>{child.once('exit',r);child.kill('SIGTERM')});
  try{if(path.basename(dir).startsWith('npng-loot-'))fs.rmSync(dir,{recursive:true,force:true})}catch(e){}
  fs.writeFileSync(path.join(out,'ow-loot.json'),JSON.stringify({at:new Date().toISOString(),results},null,1));
  console.log(failed?`ow-loot: ${failed} FAIL`:'ow-loot: hepsi PASS');
  process.exitCode=failed?1:0;
});
