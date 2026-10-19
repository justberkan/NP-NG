'use strict';
/* DEDE kumarhane oyun içi entegrasyon testi (Claude, 2026-10-19).
   Gerçek oyun + gerçek sunucu (geçici veri): yaş onayı, para yalnız oyunda, online kayıt, haftalık bonus,
   kumarhaneden çıkınca otomatik çevirmenin durması, çevrimdışıyken bonus yok. Var olan oyuna dokunmaz. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results','casino-dede');
fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let failed=0;const results=[];
const check=(name,ok,detail)=>{results.push({name,ok,detail});if(!ok)failed++;console.log(`${ok?'PASS':'FAIL'} ${name}${detail!==undefined?' — '+JSON.stringify(detail):''}`)};
let child=null,log='';const dir=fs.mkdtempSync(path.join(os.tmpdir(),'npng-dede-'));
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
    page.on('response',r=>{if(r.status()>=400&&!/\/ses\/[^/]+\.mp3/.test(r.url()))http.push(r.status()+' '+r.url())}); /* mp3 henüz yok: sayfa konuşma sentezine düşer */
    page.on('dialog',d=>d.accept().catch(()=>{}));
    await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'load'});
    await page.waitForFunction(()=>typeof OFFL==='object'&&!OFFL.pend,null,{timeout:30000});
    /* çevrimdışı: bonus yok */
    await page.evaluate(()=>{SV.casOk=Date.now();view('casino')});
    await page.waitForFunction(()=>CGD.api,null,{timeout:20000});
    check('Çevrimdışı: haftalık bonus verilmez',await page.evaluate(async()=>{SV.cas={d:{[casDay()]:[1000,0]},wk:''};const r=await casWeekly();return casWeekStatus()==='offline'&&r.amount===0&&r.reason==='offline'}));
    /* online hesap */
    await page.evaluate(p=>{window.__eski=1;mpConnect('ws://127.0.0.1:'+p,'kumar1','sifre1234','register',true)},port);
    await page.waitForFunction(()=>!window.__eski&&typeof OFFL==='object'&&!OFFL.pend&&MPL.authed,null,{timeout:30000});
    check('Kumarhane ilk girişte 18 yaş onayı ister',await page.evaluate(()=>{view('casino');return !!document.getElementById('cgage')&&!CGD.f}));
    await page.evaluate(()=>{document.getElementById('cgage').click();document.getElementById('cgok').click()});
    await page.waitForFunction(()=>CGD.api&&CGD.f.style.display==='block',null,{timeout:20000});
    await page.waitForTimeout(800);
    let s=await page.evaluate(()=>({tab:cgGame,tl:SV.tl,credit:CGD.api.credit,bet:CGD.api.getBet(),box:CGD.f.getBoundingClientRect().toJSON()}));
    check('DEDE varsayılan sekme, bakiye oyundan (31 TL), bahis 10 TL',s.tab==='dede'&&s.tl===31&&s.credit===31&&s.bet===10,s);
    check('DEDE sayfası ekrana sığıyor (kesilmiyor)',s.box.width>500&&s.box.left>=0&&s.box.right<=1280&&s.box.bottom<=720+1,s.box);
    await page.screenshot({path:path.join(out,'dede-oyunda.png')});
    /* 3 çevirme: para yalnız oyunda, iki taraf eşit, kayıt sunucuya gider */
    s=await page.evaluate(async()=>{const api=CGD.api,doc=CGD.f.contentDocument;api.seed(20261019);const steps=[];
      for(let i=0;i<3;i++){doc.getElementById('spin').click();await new Promise(r=>{const t=setInterval(()=>{if(!api.spinning){clearInterval(t);r()}},50)});await new Promise(r=>setTimeout(r,200));steps.push([SV.tl,api.credit])}
      const net=casWeekNet();mpFlushSave();return {steps,net,bets:SV.cas.d[casDay()][0]}});
    check('Her çevirmede oyun parası = sayfa bakiyesi',s.steps.every(x=>x[0]===x[1]),s.steps);
    check('Bahisler kumarhane kaydına işlendi (3×10)',s.bets===30,s);
    await page.waitForFunction(()=>localStorage.getItem('mmofps_dirty')==='0',null,{timeout:8000});
    /* haftalık bonus: 7 günlük net kaybın %10'u, haftada bir */
    s=await page.evaluate(async()=>{const d=casDay();SV.cas.d[d-2]=[2000,0];SV.cas.d[d-9]=[99999,0];casLog(0,0);
      const before=SV.tl,amt=casWeekAmount(),st=casWeekStatus(),e=SV.cas.d[d],exp=Math.min(Math.round(Math.max(0,e[0]-e[1]+2000)*.1),25000);
      CGD.f.contentWindow.weeklyRefresh();const tag=CGD.f.contentDocument.getElementById('weekly-tag').textContent;
      CGD.f.contentDocument.getElementById('weekly').click();await new Promise(r=>setTimeout(r,300));
      const after=SV.tl,credit=CGD.api.credit,st2=casWeekStatus(),r2=await casWeekly();
      return {before,amt,exp,st,tag,after,credit,st2,r2,old:SV.cas.d[d-9]===undefined}});
    check('Haftalık bonus: son 7 günün net kaybının %10’u, 8+ gün öncesi sayılmaz',s.st==='ready'&&s.tag==='HAZIR'&&s.amt===s.exp&&s.amt>0&&s.after===s.before+s.amt&&s.credit===s.after&&s.old,s);
    check('Haftalık bonus haftada bir alınır',s.st2==='claimed'&&s.r2.amount===0&&s.r2.reason==='already-claimed',{st2:s.st2,r2:s.r2});
    /* Bedava çevirme (Berkan 2026-10-20): satın alma 10 × bahis, iki kez basınca; para yalnız oyunda; 4 dede donu doğal tetikler */
    const until=async(f,ms)=>page.waitForFunction(f,null,{timeout:ms||90000,polling:100});
    s=await page.evaluate(async()=>{const api=CGD.api,doc=CGD.f.contentDocument,w=CGD.f.contentWindow;
      if(!/off/.test(doc.getElementById('turbo').className)){}else doc.getElementById('turbo').click(); /* turbo açık */
      SV.tl=Math.max(SV.tl,500);dedeSync();api.setBet(10);w.renderCredit();
      const price=doc.getElementById('buyfs-p').textContent,t0=SV.tl,b0=SV.cas.d[casDay()][0],w0=SV.cas.d[casDay()][1];
      doc.getElementById('buyfs').click();await new Promise(r=>setTimeout(r,150));
      const armed=/arm/.test(doc.getElementById('buyfs').className),t1=SV.tl;
      doc.getElementById('buyfs').click();await new Promise(r=>setTimeout(r,150));
      const t2=SV.tl,b2=SV.cas.d[casDay()][0];
      window.__fsSeen=0;const iv=setInterval(()=>{if(doc.getElementById('fsbar').classList.contains('on'))window.__fsSeen=1},50);window.__fsIv=iv;
      return {price,t0,armed,t1,t2,bets:b2-b0,w0}});
    check('Satın alma: ilk basış yalnız onay ister, ikinci basış 10 × bahis (₺100) düşer',s.price==='₺100'&&s.armed&&s.t1===s.t0&&s.t2===s.t0-100&&s.bets===100,s);
    await until(()=>!CGD.api.spinning);
    let q=await page.evaluate(async()=>{clearInterval(window.__fsIv);const api=CGD.api,d=SV.cas.d[casDay()];return {fs:window.__fsSeen,tl:SV.tl,credit:api.credit,wins:d[1]}});
    check('Satın alınan 10 bedava çevirme oynar, kazanç oyuna geçer, bakiye eşit',q.fs===1&&q.tl===q.credit&&q.tl===s.t2+(q.wins-s.w0),{...q,once:s.t2,kazanc:q.wins-s.w0});
    s=await page.evaluate(async()=>{const api=CGD.api,doc=CGD.f.contentDocument;SV.tl=50;dedeSync();const t0=SV.tl;
      doc.getElementById('buyfs').click();await new Promise(r=>setTimeout(r,150));doc.getElementById('buyfs').click();await new Promise(r=>setTimeout(r,300));
      return {t0,t1:SV.tl,spinning:api.spinning,msg:doc.getElementById('msg').textContent}});
    check('Bakiye yetmezse satın alınamaz',s.t1===s.t0&&!s.spinning&&/Yetersiz/.test(s.msg),s);
    s=await page.evaluate(async()=>{const api=CGD.api,doc=CGD.f.contentDocument,C=api._core.CATS,orig=C.map(c=>c[1]);
      SV.tl=500;dedeSync();C.forEach(c=>c[1]=c[0]==='fs'?1:0); /* bir sonraki çevirmede 4 dede donu */
      const t0=SV.tl,w0=SV.cas.d[casDay()][1];let scat=0,fs=0;
      const iv=setInterval(()=>{const n=doc.querySelectorAll('.cell.scat').length;if(n>scat)scat=n;if(doc.getElementById('fsbar').classList.contains('on'))fs=1},40);
      doc.getElementById('spin').click();await new Promise(r=>setTimeout(r,300));C.forEach((c,j)=>c[1]=orig[j]);
      await new Promise(r=>{const t=setInterval(()=>{if(!api.spinning){clearInterval(t);r()}},100)});clearInterval(iv);
      const dons=[...doc.querySelectorAll('.cell')].length;
      return {scat,fs,t0,tl:SV.tl,credit:api.credit,kazanc:SV.cas.d[casDay()][1]-w0,dons}});
    check('4 dede donu düşünce donlar parlar ve 10 bedava çevirme başlar',s.scat>=4&&s.fs===1,s);
    check('Doğal bedava çevirme: yalnız bahis düşer, kazanç oyuna geçer',s.tl===s.credit&&s.tl===s.t0-10+s.kazanc,s);
    await page.screenshot({path:path.join(out,'dede-bedava.png')});
    /* kumarhaneden çıkınca otomatik çevirme durur, iframe gizlenir */
    s=await page.evaluate(async()=>{view('casino');await new Promise(r=>setTimeout(r,300));const doc=CGD.f.contentDocument;doc.getElementById('auto').click();
      await new Promise(r=>setTimeout(r,400));view('home');const a=CGD.api;await new Promise(r=>{const t=setInterval(()=>{if(!a.spinning){clearInterval(t);r()}},50)});
      const c1=a.credit,t1=SV.tl;await new Promise(r=>setTimeout(r,2500));return {hidden:CGD.f.style.display==='none',same:a.credit===c1&&SV.tl===t1,eq:a.credit===SV.tl,auto:doc.getElementById('auto').textContent}});
    check('Kumarhaneden çıkınca otomatik çevirme durur, süren çevirme ödenir',s.hidden&&s.same&&s.eq&&/KAPALI/.test(s.auto),s);
    /* Türkçe ses yoksa sentez İngilizce aksanla okumasın (Berkan, 2026-10-19): mp3 yokken yalnız tr sesle konuşur */
    s=await page.evaluate(async()=>{const w=CGD.f.contentWindow,ss=w.speechSynthesis;let n=0;
      w.SpeechSynthesisUtterance=function(t){this.text=t};const T='Test cümlesi 7';ss.speak=u=>{if(u&&u.text===T)n++}; /* yalnız bizim cümleyi say (sayfanın kendi boşta replikleri karışmasın) */w.eval('interacted=true;voiceOn=true');
      ss.getVoices=()=>[{lang:'en-US'}];w.dedeSes('yok-test-1',T);await new Promise(r=>setTimeout(r,800));const en=n;
      ss.getVoices=()=>[{lang:'en-US'},{lang:'tr-TR'}];w.dedeSes('yok-test-2',T);await new Promise(r=>setTimeout(r,800));
      return {yalnizIngilizce:en,turkceVarken:n-en}});
    check('DEDE: Türkçe ses yoksa konuşmaz, varsa Türkçe konuşur',s.yalnizIngilizce===0&&s.turkceVarken===1,s);
    check('Sayfa hatası ve 4xx yok',!errors.length&&!http.length,[...errors,...http].slice(0,4));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);failed++}).finally(async()=>{
  if(child&&child.exitCode===null)await new Promise(r=>{child.once('exit',r);child.kill('SIGTERM')});
  try{if(path.basename(dir).startsWith('npng-dede-'))fs.rmSync(dir,{recursive:true,force:true})}catch(e){}
  fs.writeFileSync(path.join(out,'casino-dede.json'),JSON.stringify({at:new Date().toISOString(),results},null,1));
  console.log(failed?`casino-dede: ${failed} FAIL`:'casino-dede: hepsi PASS');
  process.exitCode=failed?1:0;
});
