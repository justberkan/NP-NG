'use strict';
/* Böcek Mutfak (roach) kumarhane entegrasyon testi (Kimi 2026-10-21).
   Gerçek oyun + gerçek sunucu (geçici veri): yaş onayı, sekme, para yalnız oyunda, zorlanmış kazanç tahtası,
   scatter bedava dönüş, sekme değişince otomatik çevirmenin durması. Var olan oyunlara dokunmaz. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results','casino-roach');
fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let failed=0;const results=[];
const check=(name,ok,detail)=>{results.push({name,ok,detail});if(!ok)failed++;console.log(`${ok?'PASS':'FAIL'} ${name}${detail!==undefined?' — '+JSON.stringify(detail):''}`)};
let child=null,log='';const dir=fs.mkdtempSync(path.join(os.tmpdir(),'npng-roach-'));
(async()=>{
  const port=await new Promise(r=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const q=s.address().port;s.close(()=>r(q))})});
  child=spawn(process.execPath,['server.js'],{cwd:root,windowsHide:true,env:{...process.env,PORT:String(port),MMOFPS_DATA:dir}});
  child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
  {const t=Date.now();while(!log.includes('sunucusu çalışıyor')){if(Date.now()-t>8000||child.exitCode!==null)throw Error('sunucu başlamadı: '+log);await sleep(25)}}
  const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(fs.existsSync(chrome)?chrome:undefined),args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const errors=[];
  try{
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    await page.addInitScript(()=>{try{localStorage.setItem('npng_legal_v1','1')}catch(e){}});
    page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,200)));
    page.on('dialog',d=>d.accept().catch(()=>{}));
    await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'load'});
    await page.waitForFunction(()=>typeof OFFL==='object'&&!OFFL.pend,null,{timeout:30000});
    await page.evaluate(()=>{view('casino')});
    check('Kumarhane ilk girişte 18 yaş onayı ister',await page.evaluate(()=>!!document.getElementById('cgage')&&!CGF.roach.f));
    await page.evaluate(()=>{document.getElementById('cgage').click();document.getElementById('cgok').click()});
    /* Böcek Mutfak sekmesine geç */
    await page.evaluate(()=>{document.querySelector("#av [data-g='roach']").click()});
    await page.waitForFunction(()=>CGF.roach.api&&CGF.roach.f.style.display==='block',null,{timeout:20000});
    await page.waitForTimeout(600);
    let s=await page.evaluate(()=>({tl:SV.tl,credit:CGF.roach.api.credit,bet:CGF.roach.api.getBet(),box:CGF.roach.f.getBoundingClientRect().toJSON()}));
    check('Böcek Mutfak açılır, bakiye oyundan gelir (oyun = sayfa), bahis 10 TL',s.credit===s.tl&&s.bet===10&&s.tl>0,s);
    check('Böcek Mutfak ekrana sığıyor (kesilmiyor)',s.box.width>500&&s.box.left>=0&&s.box.right<=1280+1&&s.box.bottom<=720+1,s.box);
    await page.screenshot({path:path.join(out,'roach-oyunda.png')});
    /* 3 çevirme: para yalnız oyunda, iki taraf eşit */
    s=await page.evaluate(async()=>{const api=CGF.roach.api,doc=CGF.roach.f.contentDocument;api.seed(20261021);api.setBet(10);
      const steps=[];
      for(let i=0;i<3;i++){doc.getElementById('spin').click();await new Promise(r=>{const t=setInterval(()=>{if(!api.spinning){clearInterval(t);r()}},50)});await new Promise(r=>setTimeout(r,150));steps.push([SV.tl,api.credit])}
      return{steps,bets:SV.cas.d[casDay()][0]}});
    check('Her çevirmede oyun parası = sayfa bakiyesi',s.steps.every(x=>x[0]===x[1]),s.steps);
    check('Ödenen bahisler kumarhane kaydına işlendi',s.bets>0&&s.bets<=30,s);
    /* zorlanmış kazanç tahtası: 10 pizza (0.5 öder) → net = -bahis + 10×0.5×bahis = +40 (cascade zinciri ekleyebilir) */
    s=await page.evaluate(async()=>{const api=CGF.roach.api,doc=CGF.roach.f.contentDocument;
      api._core.resetFS();api.seed(424242);
      const P=api._core.SYMBOLS;const board=[];
      for(let i=0;i<30;i++)board.push(i<10?P[0]:P[1+(i%3)]); /* 10 pizza + beer/cd/cash karışık (scatter yok) */
      const t0=SV.tl;api._core.fill(board);doc.getElementById('spin').click();
      await new Promise(r=>{const t=setInterval(()=>{if(!api.spinning){clearInterval(t);r()}},50)});await new Promise(r=>setTimeout(r,150));
      return{t0,t1:SV.tl,fs:api.freeSpins,credit:api.credit}});
    check('Kazanç tahtası: 10 pizza, net en az +40 TL',s.t1-s.t0>=40,{s});
    check('Kazanç tahtası bedava dönüş tetiklemez',s.fs===0,s);
    /* scatter tahtası: 4+ böcek → 15 bedava dönüş; bedava dönüş bahis düşürmez */
    s=await page.evaluate(async()=>{const api=CGF.roach.api,doc=CGF.roach.f.contentDocument;
      api._core.resetFS();
      const P=api._core.SYMBOLS;const board=[];
      for(let i=0;i<30;i++)board.push(i<5?P[4]:P[0]); /* 5 scatter + pizza */
      const t0=SV.tl;api._core.fill(board);doc.getElementById('spin').click();
      await new Promise(r=>{const t=setInterval(()=>{if(!api.spinning){clearInterval(t);r()}},50)});await new Promise(r=>setTimeout(r,150));
      const fsAfterScatter=api.freeSpins;
      return{t0,t1:SV.tl,fsAfterScatter,fs:api.freeSpins}});
    check('4+ scatter 15 bedava dönüş verir',s.fsAfterScatter===15,s);
    /* bedava dönüş: garanti kaybeden tahta (7'şer pizza/bira/cd/para + 2 bomba) — bahis düşürmez */
    s=await page.evaluate(async()=>{const api=CGF.roach.api,doc=CGF.roach.f.contentDocument;
      const P=api._core.SYMBOLS;const board=[];
      for(let i=0;i<28;i++)board.push(P[i%4]);
      board.push(P[5],P[5]);
      const t1=SV.tl;api._core.fill(board);doc.getElementById('spin').click();
      await new Promise(r=>{const t=setInterval(()=>{if(!api.spinning){clearInterval(t);r()}},50)});await new Promise(r=>setTimeout(r,150));
      return{t1,t2:SV.tl,fs:api.freeSpins}});
    check('Bedava dönüş bahis düşürmez',s.fs===14&&s.t2>=s.t1,s);
    await page.screenshot({path:path.join(out,'roach-freespin.png')});
    /* otomatik çevirme aç, sekme değişince dursun */
    s=await page.evaluate(async()=>{const api=CGF.roach.api,doc=CGF.roach.f.contentDocument;
      document.querySelector("#av [data-g='slot']").click();
      await new Promise(r=>setTimeout(r,300));
      return{disp:CGF.roach.f.style.display,spinning:api.spinning}});
    check('Sekme değişince Böcek Mutfak gizlenir',s.disp==='none',s);
    check('Sayfa hatası yok',errors.length===0,errors.slice(0,3));
  }catch(e){check('exception',false,String(e&&e.stack||e).slice(0,400))}
  await browser.close();
})().catch(e=>{console.error(e);failed++;process.exitCode=1}).finally(async()=>{
  if(child&&child.exitCode===null)await new Promise(r=>{child.once('exit',r);child.kill()});
  if(dir&&path.dirname(dir)===os.tmpdir()&&path.basename(dir).startsWith('npng-roach-'))fs.rmSync(dir,{recursive:true,force:true});
  fs.writeFileSync(path.join(out,'casino-roach.json'),JSON.stringify({results,serverLog:log.slice(-2000)},null,2));
  if(failed)process.exitCode=1;
});
