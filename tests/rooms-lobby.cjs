'use strict';
/* Lobi listesi + şifreli oda + arkadaş daveti + Korkunçlu düzeltmeleri (Claude, 2026-10-20 · Berkan isteği).
   1) Ham bağlantılar: oda şifreyle açılır, listede kilitli görünür (üyeler, sahip), şifresiz/yanlış şifreyle girilemez,
      doğru şifreyle girilir; arkadaş daveti şifresiz sokar; yalnız arkadaş davet edilebilir; arkadaş listesinde oda bilgisi.
   2) Tarayıcı: LOBİLER listesinde oda görünür, kilitliye basınca şifre sorulur, girince oda paneli iki kişiyi gösterir.
   3) Korkunçlu: harita büyüdü (2,6×), tüm doğma hücreleri dış duvarların içinde, oyuncu/canavar harita dışına çıkamaz,
      çift zıplama ve kanca kapalı, canavar yürürken bacak/kol salınımı çalışır, dururken durur. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results','rooms-lobby');fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let failed=0;const results=[];
const check=(name,ok,detail)=>{results.push({name,ok,detail});if(!ok)failed++;console.log(`${ok?'PASS':'FAIL'} ${name}${detail!==undefined?' — '+JSON.stringify(detail):''}`)};
let child=null,log='';const dir=fs.mkdtempSync(path.join(os.tmpdir(),'npng-rooms-'));
function peer(port){const ws=new WebSocket(`ws://127.0.0.1:${port}`),p={ws,msgs:[],send:m=>ws.send(JSON.stringify(m))};ws.addEventListener('message',e=>{try{p.msgs.push(JSON.parse(e.data))}catch(x){}});return new Promise((res,rej)=>{ws.addEventListener('open',()=>res(p));ws.addEventListener('error',rej)})}
async function wait(p,f,ms=4000){const t=Date.now();while(Date.now()-t<ms){for(let i=p.msgs.length-1;i>=0;i--)if(f(p.msgs[i]))return p.msgs[i];await sleep(15)}return null}
async function player(port,name){const p=await peer(port);p.send({t:'auth',mode:'register',name,pass:'sifre1234',save:{v:3,tl:0}});p.auth=await wait(p,m=>m.t==='auth');return p}
(async()=>{
  const port=await new Promise(r=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const q=s.address().port;s.close(()=>r(q))})});
  child=spawn(process.execPath,['server.js'],{cwd:root,windowsHide:true,env:{...process.env,PORT:String(port),MMOFPS_DATA:dir}});
  child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
  {const t=Date.now();while(!log.includes('sunucusu çalışıyor')){if(Date.now()-t>8000||child.exitCode!==null)throw Error('sunucu başlamadı: '+log);await sleep(25)}}
  /* ---- 1) ham ---- */
  const A=await player(port,'odaSahibi'),B=await player(port,'odaKonuk'),C=await player(port,'yabanci');
  A.send({t:'ic_create',pass:'gizli42',map:'backrooms'});const wa=await wait(A,m=>m.t==='ic_welcome');
  const code=wa&&wa.code;
  B.send({t:'rl'});const rl=await wait(B,m=>m.t==='rl'&&m.l.length);
  const row=rl&&rl.l.find(r=>r.code===code);
  check('Şifreli oda açılır ve lobi listesinde kilitli görünür (mod, kod, sahip, üyeler, harita)',!!row&&row.mode==='ic'&&row.lock===1&&row.owner==='odaSahibi'&&row.players.join()==='odaSahibi'&&row.map==='backrooms',row);
  check('Şifre sunucuya düz yazılmaz (listede şifre yok)',!JSON.stringify(rl).includes('gizli42'));
  B.send({t:'ic_join',code});const e1=await wait(B,m=>m.t==='ic_error');
  B.msgs.length=0;B.send({t:'ic_join',code,pass:'yanlis'});const e2=await wait(B,m=>m.t==='ic_error');
  check('Şifresiz ve yanlış şifreyle girilemez (şifre sorulur)',!!e1&&e1.need==='pass'&&/şifreli/.test(e1.message)&&!!e2&&/yanlış/.test(e2.message),{e1,e2});
  B.msgs.length=0;B.send({t:'ic_join',code,pass:'gizli42'});const wb=await wait(B,m=>m.t==='ic_welcome');
  const pe=await wait(A,m=>m.t==='ic_peers'&&m.players.length===2);
  check('Doğru şifreyle girilir, iki taraf da üyeleri adlarıyla görür',!!wb&&wb.players.length===2&&!!pe&&pe.players.map(q=>q.name).sort().join()==='odaKonuk,odaSahibi',pe&&pe.players);
  B.send({t:'ic_leave'});await sleep(150);
  /* arkadaşlık + davet */
  A.send({t:'rinv',n:'yabanci'});const notFr=await wait(A,m=>m.t==='fm'&&/arkadaş/.test(m.m));
  check('Arkadaş olmayana davet gönderilemez',!!notFr);
  A.send({t:'fadd',n:'odaKonuk'});await sleep(200);B.send({t:'facc',n:'odaSahibi'});await sleep(300);
  B.msgs.length=0;B.send({t:'fl'});const fl=await wait(B,m=>m.t==='fl'&&m.fr.length);
  const fa=fl&&fl.fr.find(f=>f[0]==='odaSahibi');
  check('Arkadaş listesinde arkadaşın odası (mod, kod, kilit) görünür → Katıl',!!fa&&fa[4]==='ic'&&fa[5]===code&&fa[6]===1,fa);
  await sleep(1600);A.msgs.length=0;A.send({t:'rinv',n:'odaKonuk'});
  const inv=await wait(B,m=>m.t==='rinv'),ack=await wait(A,m=>m.t==='fm'&&/davet edildi/.test(m.m));
  check('Arkadaş odasına davet edilir',!!inv&&inv.code===code&&inv.mode==='ic'&&inv.from==='odaSahibi'&&!!ack,inv);
  B.msgs.length=0;B.send({t:'ic_join',code});const wb2=await wait(B,m=>m.t==='ic_welcome');
  check('Davetli şifre sormadan girer',!!wb2);
  B.send({t:'fl'});const fl2=await wait(B,m=>m.t==='fl'&&m.room);
  check('Odadayken listede kendi odan bilinir (davet düğmesi için)',!!fl2&&fl2.room.code===code);
  /* koridor odası da aynı */
  C.send({t:'wc_create',pass:'k1'});const wc=await wait(C,m=>m.t==='wc_welcome');
  C.send({t:'rl'});const rl2=await wait(C,m=>m.t==='rl'&&m.l.some(r=>r.mode==='wc'));
  const r2=rl2&&rl2.l.find(r=>r.mode==='wc');
  check('Koridor odası da listede (4 kişilik, kilitli)',!!wc&&!!r2&&r2.max===4&&r2.lock===1&&r2.code===wc.code,r2);
  for(const q of [A,B,C])q.ws.close();await sleep(200);
  /* ---- 2) + 3) tarayıcı ---- */
  const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(fs.existsSync(chrome)?chrome:undefined),args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const errors=[];
  try{
    const H=await player(port,'tarayiciOda');H.send({t:'ic_create',pass:'abc',map:'backrooms'});const hw=await wait(H,m=>m.t==='ic_welcome');
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    await page.addInitScript(()=>{try{localStorage.setItem('npng_legal_v1','1')}catch(e){}});
    page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,200)));page.on('dialog',d=>d.accept().catch(()=>{}));
    await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'load'});
    await page.waitForFunction(()=>typeof OFFL==='object'&&!OFFL.pend,null,{timeout:30000});
    await page.evaluate(p=>{window.__eski=1;mpConnect('ws://127.0.0.1:'+p,'lobiTar','sifre1234','register',true)},port);
    await page.waitForFunction(()=>!window.__eski&&typeof OFFL==='object'&&!OFFL.pend&&MPL.authed,null,{timeout:30000});
    await page.click('#rlbtn');
    await page.waitForFunction(c=>document.querySelector('#rlist [data-j*="'+c+'"]'),hw.code,{timeout:8000});
    await page.screenshot({path:path.join(out,'lobiler.png')});
    await page.click(`#rlist [data-j*="${hw.code}"]`);
    await page.waitForSelector('#rlpw',{state:'visible',timeout:5000});
    const asked=await page.evaluate(()=>document.getElementById('rlpass').textContent);
    await page.fill('#rlpw','abc');await page.click('#rlpok');
    await page.waitForFunction(()=>typeof IC!=='undefined'&&IC.on&&IC.net&&mode==='ic',null,{timeout:60000});
    await page.evaluate(()=>{window.requestAnimationFrame=()=>0;const c=document.getElementById('clsm');if(c)c.classList.remove('open');if(state==='pause')state='play'});
    await page.waitForFunction(()=>{const e=document.getElementById('roomPanel');return e&&e.style.display!=='none'&&/tarayiciOda/.test(e.textContent)&&/lobiTar/.test(e.textContent)},null,{timeout:8000});
    const panel=await page.evaluate(()=>document.getElementById('roomPanel').textContent);
    check('Tarayıcı: LOBİLER → kilitli odaya bas → şifre sorulur → girince oda panelinde ikisi de görünür',/Şifreli/.test(asked)&&/tarayiciOda/.test(panel)&&/lobiTar/.test(panel)&&/👑/.test(panel),panel);
    await page.evaluate(()=>R.render(S,cam));await page.screenshot({path:path.join(out,'oda-paneli.png')});
    H.ws.close();await sleep(400);
    /* tek kişilik Korkunçlu: harita, sınırlar, hareket kısıtları, canavar yürüyüşü */
    await page.evaluate(()=>{if(state!=='menu')toLobby()});await sleep(300);
    await page.evaluate(()=>{selMode='ic';IC.chosen=false;startMatch()});
    await page.waitForSelector('#icsolo',{state:'visible',timeout:10000});await page.click('#icsolo');
    await page.waitForFunction(()=>IC.on&&mode==='ic',null,{timeout:60000});
    await page.evaluate(()=>{const c=document.getElementById('clsm');if(c)c.classList.remove('open');if(state==='pause')state='play'});
    const r=await page.evaluate(()=>{
      const b=IC.bounds,inB=(x,z)=>x>=b.x1&&x<=b.x2&&z>=b.z1&&z<=b.z2;
      const safe=icSafeCells(),bad=safe.filter(c=>!inB(c[0],c[1])||hitBox(c[0],c[1],0)).length;
      const sc=IC.mapGroup.scale;const pIn=inB(p.x,p.z),mIn=IC.mons.every(e=>inB(e.g.position.x,e.g.position.z));
      /* harita dışına itmeye çalış */
      for(let i=0;i<200;i++){p.x+=5;p.inv=99;tick(1/60)}const pushed=inB(p.x,p.z);
      /* havada çift zıplama ve kanca */
      const c=safe[0];p.x=c[0];p.z=c[1];p.y=4;p.vy=0;p.g=false;p.dj=0;jPress=true;tick(1/60);const dj=p.dj;
      qPress=true;tick(1/60);const hook=typeof gr!=='undefined'&&!!gr;
      /* canavar yürüyüşü */
      const e=IC.mons[0];e.cd=99;const leg0=e.wu.uLeg.value;
      for(let i=0;i<60;i++){p.inv=99;p.hp=100;tick(1/60)}const legWalk=e.wu.uLeg.value,ph=e.wu.uPh.value;
      const ox=e.g.position.x,oz=e.g.position.z;IC.owner=false;for(let i=0;i<90;i++){e.tx=ox;e.ty=0;e.tz=oz;e.g.position.x=ox;e.g.position.z=oz;p.inv=99;tick(1/60)}IC.owner=true;
      const legStop=e.wu.uLeg.value;
      return {olcek:[+sc.x.toFixed(2),+sc.y.toFixed(2)],bounds:b,safe:safe.length,kotuHucre:bad,pIn,mIn,itildi:pushed,dj,hook,leg0,legWalk:+legWalk.toFixed(3),legStop:+legStop.toFixed(3),ph:+ph.toFixed(2),tur:e.kind}});
    check('Korkunçlu: harita 2,6× büyük, tüm doğma hücreleri dış duvarların içinde ve boş',r.olcek[0]===2.6&&r.safe>50&&r.kotuHucre===0,{olcek:r.olcek,safe:r.safe,kotu:r.kotuHucre});
    check('Oyuncu ve canavar harita içinde doğar; oyuncu dışarı itilse de çıkamaz',r.pIn&&r.mIn&&r.itildi,r);
    check('Bu modda çift zıplama ve kanca kapalı',r.dj===0&&r.hook===false,{dj:r.dj,kanca:r.hook});
    check('Canavar yürürken bacak/kol salınır, dururken salınım söner',r.legWalk>.15&&r.legStop<.05&&r.ph>0,{tur:r.tur,yururken:r.legWalk,dururken:r.legStop});
    /* görünmez duvar yok (Berkan 2026-10-21): her doğma hücresinden 4 yöne, çarpışma kutusu görünen duvardan en fazla 0,7 m önce başlar */
    const gw=await page.evaluate(()=>{IC.mapGroup.updateMatrixWorld(true);const sides=[];for(const m of IC.mapMeshes)for(const q of (Array.isArray(m.material)?m.material:[m.material])){sides.push([q,q.side]);q.side=THREE.DoubleSide}
      const rc=new THREE.Raycaster(),inb=(x,z)=>boxes.some(b=>x>b.x1&&x<b.x2&&z>b.z1&&z<b.z2);let n=0,bad=0;const cells=icSafeCells();
      for(let i=0;i<cells.length;i+=3){const c=cells[i];for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){rc.set(new THREE.Vector3(c[0],1,c[1]),new THREE.Vector3(dx,0,dz));rc.far=30;
        const h=rc.intersectObjects(IC.mapMeshes,false)[0];if(!h)continue;let d=0;while(d<30&&!inb(c[0]+dx*d,c[1]+dz*d))d+=.05;n++;if(h.distance-d>.7)bad++}}
      for(const [q,sd] of sides)q.side=sd;return {olcum:n,gorunmez:bad,kutu:boxes.length}});
    check('Backrooms: duvar çarpışması duvarın kendisinde (görünmez duvar yok)',gw.olcum>100&&gw.gorunmez<=3,gw);
    await page.evaluate(()=>{const e=IC.mons[0];p.x=e.g.position.x;p.z=e.g.position.z+5;p.yaw=Math.PI;p.pitch=0;tick(1/60);R.render(S,cam)});
    await page.screenshot({path:path.join(out,'canavar.png')});
    check('Sayfa hatası yok',!errors.length,errors.slice(0,3));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);failed++}).finally(async()=>{
  if(child&&child.exitCode===null)await new Promise(r=>{child.once('exit',r);child.kill('SIGTERM')});
  try{if(path.basename(dir).startsWith('npng-rooms-'))fs.rmSync(dir,{recursive:true,force:true})}catch(e){}
  fs.writeFileSync(path.join(out,'rooms-lobby.json'),JSON.stringify({at:new Date().toISOString(),results},null,1));
  console.log(failed?`rooms-lobby: ${failed} FAIL`:'rooms-lobby: hepsi PASS');
  process.exitCode=failed?1:0;
});
