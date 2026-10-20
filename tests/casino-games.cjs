'use strict';
/* LOKUM (şeker slotu) + ÇİVİ TOPU (Plinko tarzı) testi (Claude, 2026-10-20 · Berkan isteği).
   1) Ekonomi kapısı (tarayıcısız):
      - Çivi Topu: 27 çarpan tablosunun (3 risk × 8-16 sıra) KESİN geri ödemesi %95,5–97,5; tablolar simetrik, kenara doğru büyür.
      - LOKUM: katmanlı ölçüm — çevirme kazancı + (bedava çevirme sıklığı × bedava çevirme ortalaması).
        Normal, "şansı 2× yap" (bahis 1,25) ve satın alma (100 × bahis) geri ödemeleri %95–97,8
        (büyük ölçümle: normal ~%96,5, şans 2× ~%96,2, satın alma ~%96,3; örnek gürültüsü ±%0,4).
   2) Oyun içi (gerçek oyun + geçici sunucu): para yalnız oyunda, sayfa bakiyesi = oyun parası, satın alma 100×, şans 2× = 1,25×,
      Çivi Topu'nda top düştüğü kutunun çarpanını öder, sekme değişince diğer oyun gizlenir, kumarhaneden çıkınca otomatik durur. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results','casino-games');fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let failed=0;const results=[];
const check=(name,ok,detail)=>{results.push({name,ok,detail});if(!ok)failed++;console.log(`${ok?'PASS':'FAIL'} ${name}${detail!==undefined?' — '+JSON.stringify(detail):''}`)};
/* ---------- 1) ekonomi ---------- */
{
  const html=fs.readFileSync(path.join(root,'assets','casino','civi','index.html'),'utf8');
  const T=new Function('return '+html.match(/const TABLES=(\{[^;]*\});/)[1])();
  const C=(n,k)=>{let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return r};
  const rows=[];let ok=true,shape=true,cnt=0;
  for(const risk of ['low','medium','high'])for(let n=8;n<=16;n++){
    const m=T[risk]&&T[risk][n];if(!m||m.length!==n+1){ok=false;continue}cnt++;
    const r=m.reduce((s,v,k)=>s+v*C(n,k)/2**n,0)*100;rows.push(risk+n+':'+r.toFixed(2));if(r<95.5||r>97.5)ok=false;
    for(let k=0;k<=n;k++){if(m[k]!==m[n-k])shape=false;if(k<n/2-.5&&m[k]<m[k+1])shape=false}
  }
  check('Çivi Topu: 27 tablonun kesin geri ödemesi %95,5–97,5',ok&&cnt===27,rows.join(' '));
  check('Çivi Topu: tablolar simetrik, ortadan kenara büyür',shape);
}
{
  const html=fs.readFileSync(path.join(root,'assets','casino','lokum','index.html'),'utf8');
  const w={};new Function('window','document','localStorage','CustomEvent','addEventListener',html.match(/<script>([\s\S]*?)<\/script>/)[1])(w);
  const A=w.NPNG_CASINO,K=A._core,t0=Date.now();
  const spinPart=(mode,n,seed)=>{A.seed(seed);let s=0,f=0;for(let i=0;i<n;i++){const r=K.spinOnce(mode,false);s+=r.win;if(r.scat>=4)f++}return {s:s/n,f:f/n}};
  A.seed(20261020);let fsS=0;const FSN=80000;for(let i=0;i<FSN;i++)fsS+=K.runFS(false).total;const ev=fsS/FSN;
  const b=spinPart('base',2000000,101),a=spinPart('ante',2000000,102);
  const rb=(b.s+b.f*ev)*100,ra=(a.s+a.f*ev)/K.CFG.anteCost*100,rbuy=ev/K.CFG.buyCost*100;
  const info={normal:+rb.toFixed(2),sans2x:+ra.toFixed(2),satinAlma:+rbuy.toFixed(2),fsOrt:+ev.toFixed(1),fsSiklik:'1/'+Math.round(1/b.f),fsSiklik2x:'1/'+Math.round(1/a.f),sn:Math.round((Date.now()-t0)/1000)};
  console.log('LOKUM ölçüm',JSON.stringify(info));
  check('LOKUM: normal oyun geri ödemesi %95–97,8',rb>=95&&rb<=97.8,info.normal);
  check('LOKUM: "şansı 2× yap" (bahis 1,25) geri ödemesi %95–97,8 ve bedava çevirme ~2 kat sık',ra>=95&&ra<=97.8&&a.f/b.f>1.7&&a.f/b.f<2.4,{sans2x:info.sans2x,oran:+(a.f/b.f).toFixed(2)});
  check('LOKUM: satın alma (100 × bahis) geri ödemesi %95–97,5',rbuy>=95&&rbuy<=97.5&&K.CFG.buyCost===100,info.satinAlma);
}
/* ---------- 2) oyun içi ---------- */
let child=null,log='';const dir=fs.mkdtempSync(path.join(os.tmpdir(),'npng-games-'));
(async()=>{
  const port=await new Promise(r=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const q=s.address().port;s.close(()=>r(q))})});
  child=spawn(process.execPath,['server.js'],{cwd:root,windowsHide:true,env:{...process.env,PORT:String(port),MMOFPS_DATA:dir}});
  child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
  {const t=Date.now();while(!log.includes('sunucusu çalışıyor')){if(Date.now()-t>8000||child.exitCode!==null)throw Error('sunucu başlamadı: '+log);await sleep(25)}}
  const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(fs.existsSync(chrome)?chrome:undefined),args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const errors=[],http=[];
  try{
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    await page.addInitScript(()=>{try{localStorage.setItem('npng_legal_v1','1')}catch(e){}});
    page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,200)));
    page.on('response',r=>{if(r.status()>=400&&!/\/ses\/[^/]+\.mp3/.test(r.url()))http.push(r.status()+' '+r.url())});
    page.on('dialog',d=>d.accept().catch(()=>{}));
    await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'load'});
    await page.waitForFunction(()=>typeof OFFL==='object'&&!OFFL.pend,null,{timeout:30000});
    await page.evaluate(p=>{window.__eski=1;mpConnect('ws://127.0.0.1:'+p,'seker1','sifre1234','register',true)},port);
    await page.waitForFunction(()=>!window.__eski&&typeof OFFL==='object'&&!OFFL.pend&&MPL.authed,null,{timeout:30000});
    await page.evaluate(()=>{SV.casOk=Date.now();SV.tl=100000;casLog(0,0);save();bal();cgGame='lokum';view('casino')});
    await page.waitForFunction(()=>CGF.lokum.api&&CGF.lokum.f.style.display==='block',null,{timeout:20000});
    await page.waitForTimeout(500);
    let s=await page.evaluate(()=>{const tabs=[...document.querySelectorAll('#av [data-g]')].map(b=>b.textContent);return {tabs,credit:CGF.lokum.api.credit,tl:SV.tl,box:CGF.lokum.f.getBoundingClientRect().toJSON(),dede:!CGF.dede.f||CGF.dede.f.style.display==='none'}});
    check('Kumarhanede LOKUM ve Çivi Topu sekmeleri var, LOKUM bakiyesi oyundan',s.tabs.some(t=>/LOKUM/.test(t))&&s.tabs.some(t=>/Çivi/.test(t))&&s.credit===100000&&s.dede,s.tabs);
    check('LOKUM sayfası ekrana sığıyor',s.box.width>500&&s.box.left>=0&&s.box.right<=1280&&s.box.bottom<=721,s.box);
    await page.screenshot({path:path.join(out,'lokum-oyunda.png')});
    /* çevirme: para iki tarafta eşit */
    const waitIdle=k=>page.waitForFunction(k=>!CGF[k].api.spinning,k,{timeout:120000,polling:100});
    s=await page.evaluate(async()=>{const api=CGF.lokum.api,doc=CGF.lokum.f.contentDocument;api.setBet(20);doc.getElementById('turbo').click();
      const t0=SV.tl,d0=SV.cas.d[casDay()]?SV.cas.d[casDay()].slice():[0,0];doc.getElementById('spin').click();await new Promise(r=>setTimeout(r,100));const t1=SV.tl;return {t0,t1,d0}});
    await waitIdle('lokum');
    let q=await page.evaluate(()=>({tl:SV.tl,credit:CGF.lokum.api.credit,d:SV.cas.d[casDay()]}));
    check('LOKUM çevirme: bahis (₺20) düşer, kazanç oyuna geçer, bakiye eşit',s.t1===s.t0-20&&q.tl===q.credit&&q.tl===s.t0-20+(q.d[1]-s.d0[1]),{...s,...q});
    /* şansı 2× yap: maliyet 1,25 × bahis; satın alma kapalı */
    s=await page.evaluate(async()=>{const api=CGF.lokum.api,doc=CGF.lokum.f.contentDocument;api.setAnte(true);const t0=SV.tl,cost=api.spinCost(),buyOff=doc.getElementById('buy').classList.contains('off');
      doc.getElementById('spin').click();await new Promise(r=>setTimeout(r,100));return {t0,t1:SV.tl,cost,buyOff,bet:doc.getElementById('bet-v').textContent}});
    check('Şansı 2× yap: çevirme 1,25 × bahis (₺25), açıkken satın alma kapalı',s.cost===25&&s.t1===s.t0-25&&s.buyOff&&/25/.test(s.bet),s);
    await waitIdle('lokum');
    /* satın alma: iki basış, 100 × bahis */
    s=await page.evaluate(async()=>{const api=CGF.lokum.api,doc=CGF.lokum.f.contentDocument;api.setAnte(false);const t0=SV.tl,d0=SV.cas.d[casDay()].slice();
      doc.getElementById('buy').click();await new Promise(r=>setTimeout(r,150));const t1=SV.tl,arm=doc.getElementById('buy').classList.contains('arm');
      doc.getElementById('buy').click();await new Promise(r=>setTimeout(r,150));
      let fs=0;const iv=setInterval(()=>{if(doc.getElementById('fsbar').classList.contains('on'))fs=1},60);window.__lkIv=iv;window.__lkFs=()=>fs;
      return {t0,t1,arm,t2:SV.tl,d0}});
    await waitIdle('lokum');
    q=await page.evaluate(()=>{clearInterval(window.__lkIv);return {fs:window.__lkFs(),tl:SV.tl,credit:CGF.lokum.api.credit,d:SV.cas.d[casDay()]}});
    check('LOKUM satın alma: ilk basış onay ister, ikinci basış 100 × bahis (₺2.000) düşer',s.arm&&s.t1===s.t0&&s.t2===s.t0-2000,s);
    check('Satın alınan 10 bedava çevirme oynar, kazanç oyuna geçer, bakiye eşit',q.fs===1&&q.tl===q.credit&&q.tl===s.t2+(q.d[1]-s.d0[1]),{...q,once:s.t2});
    await page.screenshot({path:path.join(out,'lokum-bitti.png')});
    /* Çivi Topu */
    await page.evaluate(()=>{const b=[...document.querySelectorAll('#av [data-g]')].find(x=>x.dataset.g==='civi');b.click()});
    await page.waitForFunction(()=>CGF.civi.api&&CGF.civi.f.style.display==='block',null,{timeout:20000});
    await page.waitForTimeout(400);
    s=await page.evaluate(async()=>{const api=CGF.civi.api,T=api._test;const hid=CGF.lokum.f.style.display==='none';
      api.setBet(10);T.setRisk('high');T.setRows(16);const t0=SV.tl,d0=SV.cas.d[casDay()].slice();
      const kenar=Array(16).fill(1),orta=[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0];
      T.drop(kenar);T.drop(orta);T.drop(Array(16).fill(0));const t1=SV.tl;
      await new Promise(r=>setTimeout(r,T.flightMs(16)+400));
      return {hid,t0,t1,t2:SV.tl,credit:api.credit,beklenen:t0-30+Math.round(10*1000)+Math.round(10*.1)+Math.round(10*1000),kaz:SV.cas.d[casDay()][1]-d0[1]}});
    check('Çivi Topu: sekme değişince LOKUM gizlenir; 3 top = 3 bahis düşer',s.hid&&s.t1===s.t0-30,s);
    check('Çivi Topu: top düştüğü kutunun çarpanını öder (16 sıra yüksek: kenar 1000×, orta 0,1×)',s.t2===s.beklenen&&s.credit===s.t2&&s.kaz===20001,s);
    s=await page.evaluate(async()=>{const doc=CGF.civi.f.contentDocument;doc.getElementById('t-auto').click();doc.getElementById('cnt').value='0';doc.getElementById('play').click();
      await new Promise(r=>setTimeout(r,700));const on=CGF.civi.api.spinning;view('home');await new Promise(r=>setTimeout(r,CGF.civi.api._test.flightMs(16)+600));
      const t=SV.tl;await new Promise(r=>setTimeout(r,1200));return {on,hidden:CGF.civi.f.style.display==='none',same:SV.tl===t,eq:CGF.civi.api.credit===SV.tl,spin:CGF.civi.api.spinning}});
    check('Kumarhaneden çıkınca otomatik top durur, havadaki toplar ödenir',s.on&&s.hidden&&s.same&&s.eq&&!s.spin,s);
    check('Sayfa hatası ve 4xx yok',!errors.length&&!http.length,[...errors,...http].slice(0,4));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);failed++}).finally(async()=>{
  if(child&&child.exitCode===null)await new Promise(r=>{child.once('exit',r);child.kill('SIGTERM')});
  try{if(path.basename(dir).startsWith('npng-games-'))fs.rmSync(dir,{recursive:true,force:true})}catch(e){}
  fs.writeFileSync(path.join(out,'casino-games.json'),JSON.stringify({at:new Date().toISOString(),results},null,1));
  console.log(failed?`casino-games: ${failed} FAIL`:'casino-games: hepsi PASS');
  process.exitCode=failed?1:0;
});
