'use strict';
/* Çevrimdışı kayıt kuralı (Claude, 2026-10-19 · Berkan kuralı):
   - Çevrimdışı (hesaba bağlı değil): para sınırsız, HİÇBİR ilerleme kaydedilmez (ne bu bilgisayara ne hesaba).
   - Online hesap 31 TL ile başlar; çevrimdışı ilerleme yeni hesaba taşınmaz.
   - Sunucu 1e9+ parayı reddeder (sfix), eski sızıntıyı girişte onarır, açık dünya 50 kişi.
   Kendi sunucusunu geçici veri klasörüyle açar; var olan oyuna dokunmaz. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results','offline-save');
fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let failed=0;const results=[];
const check=(name,ok,detail)=>{results.push({name,ok,detail});if(!ok)failed++;console.log(`${ok?'PASS':'FAIL'} ${name}${detail!==undefined?' — '+JSON.stringify(detail):''}`)};
let child=null,log='',port=0;const dir=fs.mkdtempSync(path.join(os.tmpdir(),'npng-offline-'));
async function startServer(){
  log='';child=spawn(process.execPath,['server.js'],{cwd:root,windowsHide:true,env:{...process.env,PORT:String(port),MMOFPS_DATA:dir}});
  child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
  const t=Date.now();while(!log.includes('sunucusu çalışıyor')){if(Date.now()-t>8000||child.exitCode!==null)throw Error('sunucu başlamadı: '+log);await sleep(25)}
}
async function stopServer(){if(watcher){try{watcher.ws.close()}catch(e){}watcher=null}if(child&&child.exitCode===null)await new Promise(r=>{child.once('exit',r);child.kill('SIGTERM')});child=null}
function peer(){const ws=new WebSocket(`ws://127.0.0.1:${port}`),p={ws,msgs:[],send:m=>ws.send(JSON.stringify(m))};ws.addEventListener('message',e=>{try{p.msgs.push(JSON.parse(e.data))}catch(x){}});return new Promise((res,rej)=>{ws.addEventListener('open',()=>res(p));ws.addEventListener('error',rej)})}
async function waitMsg(p,f,ms=4000){const t=Date.now();while(Date.now()-t<ms){const m=p.msgs.find(f);if(m)return m;await sleep(10)}return null}
async function auth(mode,name,pass,save){const p=await peer();p.send({t:'auth',mode,name,pass,save});const m=await waitMsg(p,m=>m.t==='auth');return {p,m}}
/* Hesaptaki parayı oturumu bozmadan oku: yerel (admin) gözcü hesabın 'alist' listesi. Giriş yapmak tarayıcıyı atardı. */
let watcher=null;
async function serverTl(name){if(!watcher||watcher.ws.readyState!==1){let r=await auth('login','gozcu',PASS);if(!r.m||!r.m.ok){r.p.ws.close();r=await auth('register','gozcu',PASS,{v:3,tl:0})}watcher=r.p}
  watcher.msgs=[];watcher.send({t:'alist'});const m=await waitMsg(watcher,m=>m.t==='alist');const row=m&&m.a.find(r=>r[0]===name);return row?row[3]:'yok: '+JSON.stringify(m&&m.t)}
const PASS='sifre1234';

(async()=>{
  port=await new Promise(r=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const q=s.address().port;s.close(()=>r(q))})});
  await startServer();
  /* ---- Sunucu kuralları (ham istemci) ---- */
  {const {p,m}=await auth('register','yeni1',PASS,{v:3,tl:5000,ow:{lvl:1}});
   check('Yeni hesap 31 TL ile başlar (istemci ne yollarsa yollasın)',m&&m.ok&&m.save&&m.save.tl===31,m&&m.save&&m.save.tl);
   p.send({t:'save',data:{v:3,tl:1e9}});const fx=await waitMsg(p,m=>m.t==='sfix');
   check('1e9 TL kayıt reddedilir ve hesaptaki kayıt geri gönderilir (sfix)',!!fx&&fx.save&&fx.save.tl===31,fx&&fx.save&&fx.save.tl);
   p.send({t:'save',data:{v:3,tl:Infinity}});await sleep(150);
   p.send({t:'save',data:{v:3,tl:131,ow:{lvl:2}}});const sv=await waitMsg(p,m=>m.t==='saved');p.ws.close();
   check('Normal online kayıt hâlâ yazılır',!!sv&&await serverTl('yeni1')===131);}
  {const ps=[];let ok=0,full=null;
   for(let i=0;i<50;i++){const {p,m}=await auth('register','dunya'+i,PASS,{v:3,tl:0});if(!m||!m.ok)break;p.send({t:'ojoin',ch:'c0',w:'s0',pvp:false,lvl:1});
     const r=await waitMsg(p,m=>m.t==='owel'||m.t==='err');if(r&&r.t==='owel')ok++;else full=r;ps.push(p)}
   watcher.send({t:'ojoin',ch:'c0',w:'s0',pvp:false,lvl:1}); /* gözcü de bir oyuncu: 51. */
   {const r=await waitMsg(watcher,m=>m.t==='owel'||m.t==='err');if(r&&r.t==='owel')ok++;else full=r}
   check('Açık dünya tek ortak dünya, 50 oyuncu girer, 51. "dolu" alır',ok===50&&full&&/50/.test(full.m),{giren:ok,son:full&&full.m});
   for(const p of ps)p.ws.close();await sleep(200);}
  await auth('register','sizan1',PASS,{v:3,tl:0}).then(r=>r.p.ws.close());
  await auth('register','sizan2',PASS,{v:3,tl:0}).then(r=>r.p.ws.close());
  await stopServer();
  {const f=path.join(dir,'accounts.json'),acc=JSON.parse(fs.readFileSync(f,'utf8'));
   acc.sizan1.save.tl=1000010548;acc.sizan2.save.tl=1e9;fs.writeFileSync(f,JSON.stringify(acc));}
  await startServer();
  check('Eski sızıntı onarılır: 1.000.010.548 → 10.548',await serverTl('sizan1')===10548);
  check('Eski sızıntı onarılır: 1.000.000.000 → 31',await serverTl('sizan2')===31);

  /* ---- Tarayıcı (gerçek oyun istemcisi) ---- */
  const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const errors=[];
  const open=async()=>{const ctx=await browser.newContext({viewport:{width:1280,height:720}});const page=await ctx.newPage();
    await page.addInitScript(()=>{try{localStorage.setItem('npng_legal_v1','1')}catch(e){}});
    page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,200)));page.on('dialog',d=>d.accept().catch(()=>{}));
    await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'load'});
    await page.waitForFunction(()=>typeof OFFL==='object'&&!OFFL.pend&&typeof MPL==='object',null,{timeout:30000});return {ctx,page}};
  const afterReload=async(page,ms=30000)=>page.waitForFunction(()=>!window.__eski&&typeof OFFL==='object'&&!OFFL.pend&&typeof MPL==='object'&&MPL.authed,null,{timeout:ms});
  try{
    const {ctx,page}=await open();
    let s=await page.evaluate(()=>{const before=localStorage.getItem('mmofps_sv');SV.xp=(SV.xp||0)+500;SV.tl-=1234;save();
      const b=document.getElementById('offb');return {tl:SV.tl,before,after:localStorage.getItem('mmofps_sv'),badge:!!b&&b.style.display!=='none'&&b.textContent,chip:document.getElementById('acct').className}});
    check('Çevrimdışı: para sınırsız',s.tl===1e9,s.tl);
    check('Çevrimdışı: bu bilgisayara hiçbir şey kaydedilmez',s.before===s.after,{once:s.before&&s.before.slice(0,40),sonra:s.after&&s.after.slice(0,40)});
    check('Çevrimdışı: ekranda "ilerleme kaydedilmez" yazısı',/kaydedilmez/.test(s.badge||'')&&s.chip==='offl',s.badge);
    await page.screenshot({path:path.join(out,'cevrimdisi-lobi.png')});
    await page.evaluate(p=>{window.__eski=1;mpConnect('ws://127.0.0.1:'+p,'tarayici1','sifre1234','register',true)},port);
    await afterReload(page);
    s=await page.evaluate(()=>({tl:SV.tl,xp:SV.xp,badge:(document.getElementById('offb')||{style:{display:'none'}}).style.display}));
    check('Kayıt olunca 31 TL ile temiz başlar, çevrimdışı ilerleme taşınmaz',s.tl===31&&!(s.xp>=500)&&s.badge==='none',s);
    await page.waitForTimeout(1000);
    check('Sunucudaki yeni hesap 31 TL',await serverTl('tarayici1')===31);
    await page.evaluate(()=>{SV.tl=231;save();mpFlushSave()});await page.waitForFunction(()=>localStorage.getItem('mmofps_dirty')==='0',null,{timeout:8000}).catch(async e=>{console.log('DEBUG',await page.evaluate(()=>JSON.stringify({a:MPL.authed,q:MPL.q,r:MPL.reloading,d:localStorage.getItem('mmofps_dirty'),ws:MPL.ws&&MPL.ws.readyState,tl:SV.tl,pend:OFFL.pend})),log.slice(-600));throw e});
    check('Online kazanç hesaba yazılır',await serverTl('tarayici1')===231);
    // Bağlantı kopması: kopukken kazanılanlar kaydedilmez, bağlantı gelince hesaptaki kayıt geri gelir
    await page.evaluate(()=>{MPL.ws.close()});
    await page.waitForFunction(()=>!MPL.authed&&!OFFL.pend,null,{timeout:5000});
    s=await page.evaluate(()=>{const before=localStorage.getItem('mmofps_sv');SV.xp+=999;save();window.__eski=1;
      return {tl:SV.tl,same:before===localStorage.getItem('mmofps_sv'),badge:(document.getElementById('offb')||{}).textContent}});
    check('Bağlantı kopunca: para sınırsız, kayıt yazılmaz, yazı görünür',s.tl===1e9&&s.same&&/kaydedilmez/.test(s.badge||''),s);
    await afterReload(page,40000);
    s=await page.evaluate(()=>({tl:SV.tl}));
    check('Bağlantı gelince hesaptaki kayıt geri yüklenir (231 TL)',s.tl===231,s);
    check('Kopukken oynanan hesaba geçmedi',await serverTl('tarayici1')===231);
    // Bozuk/sınırsız para yollanırsa sunucu reddeder, istemci hesaptaki kayda döner
    await page.evaluate(()=>{window.__eski=1;SV.tl=2e9;mpFlushSave()});
    await afterReload(page);
    s=await page.evaluate(()=>SV.tl);
    check('Sınırsız para yollanırsa reddedilir, istemci hesaba döner',s===231&&await serverTl('tarayici1')===231,s);
    await ctx.close();
    // Çevrimdışı oynayıp sonra var olan hesaba giriş: hesaptaki kayıt gelir
    const b=await open();
    await b.page.evaluate(()=>{SV.xp+=777;save()});
    await b.page.evaluate(p=>{window.__eski=1;mpConnect('ws://127.0.0.1:'+p,'tarayici1','sifre1234','login',true)},port);
    await afterReload(b.page);
    s=await b.page.evaluate(()=>SV.tl);
    check('Çevrimdışı oynayıp girişte hesaptaki kayıt gelir (sınırsız para gitmez)',s===231&&await serverTl('tarayici1')===231,s);
    await b.page.screenshot({path:path.join(out,'online-lobi.png')});
    await b.ctx.close();
    check('Sayfa hatası yok',!errors.length,errors.slice(0,3));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);failed++}).finally(async()=>{
  await stopServer();
  try{if(path.basename(dir).startsWith('npng-offline-'))fs.rmSync(dir,{recursive:true,force:true})}catch(e){}
  fs.writeFileSync(path.join(out,'offline-save.json'),JSON.stringify({at:new Date().toISOString(),results},null,1));
  console.log(failed?`offline-save: ${failed} FAIL`:'offline-save: hepsi PASS');
  process.exitCode=failed?1:0;
});
