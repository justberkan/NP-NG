'use strict';
/* Mobil (iPhone yatay) testi (Claude, 2026-10-19) — Chromium iPhone öykünmesi; gerçek iOS Safari değildir.
   - Sayfa yakınlaştırma korumaları: viewport maximum-scale=1, yazı büyütme kapalı, gesture* ve çift dokunma engelleniyor
     (yazı kutularında çift dokunma serbest).
   - Açık dünya yetenek tuşları (k1–k5) yalnız açık dünyada görünür; eskiden her modda ortada boş daireler çıkıyordu.
   - Tuş düzeni paneli küçük ve üstte, sürüklenip küçültülebilir, ekran dışına çıkmaz; düğmeler de dışarı taşmaz.
   Çalıştırma: npm test (run.cjs) ya da TEST_URL=http://127.0.0.1:3000 node tests/mobile.cjs */
const {chromium,devices}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const baseURL=process.env.TEST_URL||'http://127.0.0.1:3000';
const out=path.join(path.resolve(__dirname,'..'),'test-results','mobile');fs.mkdirSync(out,{recursive:true});
let failed=0;const results=[];
const check=(name,ok,detail)=>{results.push({name,ok,detail});if(!ok)failed++;console.log(`${ok?'PASS':'FAIL'} ${name}${detail!==undefined?' — '+JSON.stringify(detail):''}`)};
(async()=>{
  const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(fs.existsSync(chrome)?chrome:undefined),args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const errors=[];
  try{
    const ctx=await browser.newContext({...devices['iPhone 13 landscape']});
    const page=await ctx.newPage();
    await page.addInitScript(()=>{try{localStorage.setItem('npng_legal_v1','1')}catch(e){}});
    page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,200)));
    await page.goto(baseURL+'/index.html',{waitUntil:'load'});
    await page.waitForFunction(()=>typeof startMatch==='function'&&typeof tick==='function',null,{timeout:30000});
    let s=await page.evaluate(()=>{
      const vp=document.querySelector('meta[name=viewport]').content,cs=getComputedStyle(document.documentElement);
      const g=new Event('gesturestart',{cancelable:true,bubbles:true});document.body.dispatchEvent(g);
      const t1=new TouchEvent('touchend',{cancelable:true,bubbles:true}),t2=new TouchEvent('touchend',{cancelable:true,bubbles:true});
      document.body.dispatchEvent(t1);document.body.dispatchEvent(t2);
      const inp=document.createElement('input');document.body.appendChild(inp);
      const t3=new TouchEvent('touchend',{cancelable:true,bubbles:true}),t4=new TouchEvent('touchend',{cancelable:true,bubbles:true});
      inp.dispatchEvent(t3);inp.dispatchEvent(t4);inp.remove();
      return {touch,vp,tsa:cs.webkitTextSizeAdjust||cs.textSizeAdjust,pinch:g.defaultPrevented,ilk:t1.defaultPrevented,cift:t2.defaultPrevented,yaziKutusu:t4.defaultPrevented}});
    check('iOS: yakınlaştırma kapalı (maximum-scale=1, yazı büyütme yok)',s.touch&&/maximum-scale=1/.test(s.vp)&&/100%/.test(s.tsa),s);
    check('iOS: iki parmak ve çift dokunma yakınlaştırması engelleniyor, tek dokunma serbest',s.pinch&&!s.ilk&&s.cift,s);
    check('iOS: yazı kutusunda çift dokunma serbest',s.yaziKutusu===false,s);
    await page.evaluate(()=>{window.requestAnimationFrame=()=>0});
    const vis=md=>page.evaluate(md=>{if(state!=='menu')toLobby();selMode=md;startMatch();for(let i=0;i<20;i++)tick(1/60);
      const v=id=>{const e=document.getElementById(id);return !!e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>0};
      const r={mode,k:['k1','k2','k3','k4','k5'].filter(v).length,ates:v('bf')||[...document.querySelectorAll('#tc .tb')].some(e=>/ATE/.test(e.textContent)&&getComputedStyle(e).display!=='none')};return r},md);
    let r=await vis('aim');await page.screenshot({path:path.join(out,'aim.png')});
    check('Aim (mobil): açık dünya yetenek tuşları gizli, ateş tuşu var',r.mode==='aim'&&r.k===0&&r.ates,r);
    r=await vis('ow');await page.screenshot({path:path.join(out,'ow.png')});
    check('Açık dünya (mobil): yetenek tuşları görünür',r.mode==='ow'&&r.k===5,r);
    /* Mobilde Shift yok: açık dünyada joystick sonuna kadar ileri = Naruto koşusu (Berkan, 2026-10-20) */
    r=await page.evaluate(()=>{const c=document.getElementById('clsm');if(c)c.classList.remove('open');if(state==='pause')state='play';
      tp=true;p.g=true;p.y=owH(p.x,p.z);joy.x=0;joy.y=-1;let spr=0,sp=0;for(let i=0;i<90;i++){p.inv=99;tick(1/60);spr=Math.max(spr,p.spr||0);sp=Math.max(sp,pRigObj.sm.sp||0)}
      joy.y=-.6;let yavas=0;for(let i=0;i<30;i++){tick(1/60);yavas=Math.max(yavas,p.spr||0)}joy.y=0;return {spr,naruto:+sp.toFixed(2),yarimItis:yavas}});
    check('Açık dünya (mobil): joystick sonuna kadar ileri → Naruto koşusu, yarım itişte normal',r.spr===1&&r.naruto>.9&&r.yarimItis===0,r);
    /* Tuş düzeni paneli (Berkan, 2026-10-19): küçük ve üstte, sürüklenip küçültülebilir, ekran dışına çıkmaz; düğmeler de dışarı taşmaz */
    await page.evaluate(()=>{if(state!=='menu')toLobby();startTouchEdit()});await page.waitForTimeout(300);
    const box=()=>page.evaluate(()=>{const r=document.getElementById('tedit').getBoundingClientRect();return {x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height),W:innerWidth,H:innerHeight}});
    let b0=await box();
    check('Tuş düzeni paneli küçük ve üstte',b0.y<=10&&b0.h<=b0.H*.4&&b0.x>=0&&b0.x+b0.w<=b0.W,b0);
    await page.screenshot({path:path.join(out,'tus-duzeni.png')});
    const hd=await page.evaluate(()=>{const r=document.querySelector('#tedit .teg').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}});
    await page.mouse.move(hd.x,hd.y);await page.mouse.down();await page.mouse.move(hd.x+2000,hd.y+2000,{steps:6});await page.mouse.up();
    let b1=await box();
    check('Panel sürüklenir ve ekran dışına çıkmaz',b1.x>b0.x&&b1.y>b0.y&&b1.x+b1.w<=b1.W+1&&b1.y+b1.h<=b1.H+1,{once:b0,sonra:b1});
    await page.evaluate(()=>document.getElementById('te-c').click());
    let b2=await box();
    check('Panel küçültülebilir ve yine ekranda kalır',b2.h<b1.h&&b2.x+b2.w<=b2.W+1&&b2.y+b2.h<=b2.H+1,{acik:b1,kucuk:b2});
    const bt=await page.evaluate(()=>{const r=document.getElementById('bf').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}});
    await page.mouse.move(bt.x,bt.y);await page.mouse.down();await page.mouse.move(bt.x+3000,bt.y+3000,{steps:6});await page.mouse.up();
    const bf=await page.evaluate(()=>{const r=document.getElementById('bf').getBoundingClientRect();return {x:Math.round(r.left),y:Math.round(r.top),r:Math.round(r.right),b:Math.round(r.bottom),W:innerWidth,H:innerHeight}});
    check('Düğme sürüklenince tamamı ekranda kalır',bf.r<=bf.W&&bf.b<=bf.H&&bf.x>=0&&bf.y>=0,bf);
    await page.evaluate(()=>document.getElementById('te-s').click());
    /* Cihaz türü (Berkan 2026-10-20: "bilgisayarı mobil sanıyor"): Chrome dokunmatik sürücülü PC'de maxTouchPoints=10 ama ana işaretçi fare.
       Böyle bir PC bilgisayar sayılmalı; elle seçim (?cihaz=pc / mobil / oto ve Ayarlar → Mobil → Cihaz türü) her şeyi geçersiz kılar. */
    {const pc=await browser.newContext({viewport:{width:1280,height:720}});const q=await pc.newPage();
     await q.addInitScript(()=>{try{localStorage.setItem('npng_legal_v1','1')}catch(e){}Object.defineProperty(Navigator.prototype,'maxTouchPoints',{get:()=>10})});
     q.on('pageerror',e=>errors.push('pc: '+String(e.message||e).slice(0,200)));
     await q.goto(baseURL+'/index.html',{waitUntil:'load'});await q.waitForFunction(()=>typeof touch!=='undefined');
     const r=await q.evaluate(()=>({touch,mtp:navigator.maxTouchPoints,govde:document.body.classList.contains('touch')}));
     check('Dokunmatik sürücülü bilgisayar (maxTouchPoints 10, fare) bilgisayar arayüzü açar',r.mtp===10&&r.touch===false&&!r.govde,r);
     await q.goto(baseURL+'/index.html?cihaz=mobil',{waitUntil:'load'});const m1=await q.evaluate(()=>touch);
     await q.goto(baseURL+'/index.html',{waitUntil:'load'});const m2=await q.evaluate(()=>touch);
     await q.evaluate(()=>{SV.casOk=SV.casOk;setTab='mob';view('settings')});const sel=await q.evaluate(()=>{const s=document.getElementById('cihaz');return s&&s.value});
     await q.evaluate(()=>{document.getElementById('cihaz').value='';document.getElementById('cihazok').click()});await q.waitForLoadState('load');await q.waitForFunction(()=>typeof touch!=='undefined');
     const m3=await q.evaluate(()=>({touch,kayit:localStorage.getItem('npng_cihaz')}));
     check('Elle seçim: ?cihaz=mobil kalıcı olur, Ayarlar → Cihaz türü → Otomatik ile geri döner',m1===true&&m2===true&&sel==='mobil'&&m3.touch===false&&m3.kayit===null,{m1,m2,sel,m3});
     await pc.close()}
    check('Sayfa hatası yok',!errors.length,errors.slice(0,3));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);failed++}).finally(()=>{
  fs.writeFileSync(path.join(out,'mobile.json'),JSON.stringify({at:new Date().toISOString(),results},null,1));
  console.log(failed?`mobile: ${failed} FAIL`:'mobile: hepsi PASS');
  process.exitCode=failed?1:0;
});
