'use strict';
/* Açık dünya: yere vurma + otomatik savaş yaklaşması + Naruto koşusu (Claude, 2026-10-19/20 · Berkan isteği) — gerçek tarayıcı, gerçek oyun döngüsü.
   - Havada yakın dövüş saldırısı → yere çakılış; yükseklik arttıkça hasar ve alan büyür; yerdeyken normal saldırı (yere vurma yok).
   - Otomatik savaş yakın dövüşte hedefe yeterince sokulur ve vurur.
   - Naruto koşusu açık dünyada Shift ile ve dash atarken (ağ bayrağı dahil); mobilde joystick sonuna kadar ileri.
   Çalıştırma: npm test (run.cjs) ya da TEST_URL=http://127.0.0.1:3000 node tests/ow-slam-auto.cjs */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const baseURL=process.env.TEST_URL||'http://127.0.0.1:3000';
const out=path.join(path.resolve(__dirname,'..'),'test-results','ow-slam-auto');fs.mkdirSync(out,{recursive:true});
let failed=0;const results=[];
const check=(name,ok,detail)=>{results.push({name,ok,detail});if(!ok)failed++;console.log(`${ok?'PASS':'FAIL'} ${name}${detail!==undefined?' — '+JSON.stringify(detail):''}`)};
(async()=>{
  const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(fs.existsSync(chrome)?chrome:undefined),args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const errors=[];
  try{
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    await page.addInitScript(()=>{try{localStorage.setItem('npng_legal_v1','1')}catch(e){}});
    page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,200)));
    await page.goto(baseURL+'/index.html',{waitUntil:'load'});
    await page.waitForFunction(()=>typeof startMatch==='function'&&typeof tick==='function',null,{timeout:30000});
    await page.evaluate(()=>{window.requestAnimationFrame=()=>0;if(typeof CLS!=='undefined'&&!SV.ow.cls)SV.ow.cls=Object.keys(CLS)[0];selMode='ow';startMatch();for(let i=0;i<30;i++)tick(1/60)});
    /* sınıf seçim penceresi ya da odak kaybı oyunu duraklatmasın (headless) */
    const play=()=>page.evaluate(()=>{const c=document.getElementById('clsm');if(c)c.classList.remove('open');if(state==='pause')state='play'});
    /* Yere vurma: aynı moba farklı yükseklikten */
    const slam=async(H,off)=>{await play();return page.evaluate(([H,off])=>{
      for(let i=0;i<150;i++){p.inv=99;tick(1/60)} /* önceki vuruşun savurması (knockback) bitsin */
      const ms=OW.mobs.filter(m=>m.state!=='dead'&&m.hp>0&&!m.boss&&!(m.def&&m.def.r));
      let m=ms[0];let bd=1e9;for(const q of ms){const d=Math.hypot(q.x-p.x,q.z-p.z);if(d<bd){bd=d;m=q}}
      if(OW.act.indexOf(m)<0)owAct(m);
      m.hp=m.max;m.state='idle';m.cd=99;m.hx=m.x;m.hz=m.z; /* mob yerinde kalsın (eve dönüş yürüyüşü ölçümü bozmasın) */
      p.x=m.x-off;p.z=m.z;p.vx=p.vz=0;p.yaw=-Math.PI/2;p.inv=99;p.hp=owMax(); /* moba dönük (+x) */
      for(let i=0;i<5;i++)tick(1/60);
      SK.slamCd=0;SK.slam=null;SK.lastSlam=null;swU=-1;fireCd=0;swT=1;
      p.y=owH(p.x,p.z)+H;p.g=false;p.vy=0;
      const hp0=m.hp;shoot();const basladi=!!SK.slam;
      for(let i=0;i<240&&!SK.lastSlam;i++){p.inv=99;tick(1/60)}
      return {H,basladi,son:SK.lastSlam,hasar:Math.round(hp0-m.hp),uzaklik:+off.toFixed(1),inis:{d:+Math.hypot(m.x-p.x,m.z-p.z).toFixed(2),dy:+(owH(m.x,m.z)-p.y).toFixed(2),ms:m.state},dbg:SK.lastSlam?undefined:{y:+p.y.toFixed(2),zemin:+owH(p.x,p.z).toFixed(2),g:p.g,slam:!!SK.slam,state,mode}}},[H,off])};
    const a=await slam(2,1.6),b=await slam(9,1.6);
    check('Havada saldırı yere vurmayı başlatır ve yerdeki mobu vurur',a.basladi&&a.son&&a.son.n>=1&&a.hasar>0,a);
    check('Yükseklik arttıkça hasar ve alan büyür',b.son&&b.son.r>a.son.r&&b.hasar>a.hasar,{iki_m:a,dokuz_m:b});
    const c=await slam(9,5);
    check('Yüksekten vuruş normal kılıç menzilinin dışındaki mobu da vurur (geniş alan)',c.son&&c.son.n>=1&&c.hasar>0,c);
    await play();const g=await page.evaluate(()=>{SK.slam=null;SK.slamCd=0;swU=-1;fireCd=0;swT=1;p.g=true;p.y=owH(p.x,p.z);p.vy=0;shoot();return {yerde:!SK.slam}});
    check('Yerdeyken normal saldırı (yere vurma yok)',g.yerde,g);
    /* Otomatik savaş: hedefe sokulup vurur (en büyük mob seçilir) */
    await play();const r=await page.evaluate(()=>{
      if(typeof toggleAuto!=='function')return {hata:'toggleAuto yok'};
      const ms=OW.mobs.filter(m=>m.state!=='dead'&&m.hp>0&&!m.boss&&!(m.def&&m.def.r));
      let m=ms[0];for(const q of ms){const d=Math.hypot(q.x-p.x,q.z-p.z);if(q.sc>=m.sc&&d<60)m=q}
      if(OW.act.indexOf(m)<0)owAct(m);
      for(const q of OW.act)if(q!==m){q.hp=0;q.state='dead'}
      m.hp=m.max*50;m.max=m.hp;m.state='idle';m.hx=m.x;m.hz=m.z;
      SV.ow.lvl=Math.max(1,m.L||1);AUTO.safe=false; /* hedef otomatik seçim seviye aralığında olsun */
      p.x=m.x-9;p.z=m.z;p.y=owH(p.x,p.z);p.g=true;p.vx=p.vz=0;p.inv=99;p.hp=owMax();
      toggleAuto(true);AUTO.tgt=m;
      const hp0=m.hp;let minD=1e9;
      for(let i=0;i<600;i++){p.inv=99;p.hp=owMax();m.cd=99;tick(1/60);minD=Math.min(minD,Math.hypot(m.x-p.x,m.z-p.z))}
      toggleAuto(false);
      const rad=.45*(m.sc||1),eng=Math.max(1.3,cw.range*.5)+rad;
      return {sc:+m.sc.toFixed(2),silah:wk,menzil:cw.range,hedefMesafe:+eng.toFixed(2),enYakin:+minD.toFixed(2),hasar:Math.round(hp0-m.hp)}});
    check('Otomatik savaş: hedefe yeterince sokulur ve vurur',r.enYakin<=r.hedefMesafe+.4&&r.hasar>0,r);
    /* Naruto koşusu (Berkan, 2026-10-20): açık dünyada Shift ile ve dash atarken; ağ bayrağı 8 */
    await play();const n=await page.evaluate(()=>{
      tp=true;p.g=true;p.y=owH(p.x,p.z);p.vx=p.vz=0;p.dead=0;
      key.KeyW=1;key.ShiftLeft=1;let shift=0;for(let i=0;i<90;i++){p.inv=99;tick(1/60);shift=Math.max(shift,pRigObj.sm.sp||0)}
      key.KeyW=0;key.ShiftLeft=0;for(let i=0;i<90;i++)tick(1/60);
      const once=pRigObj.sm.sp||0;
      SK.dCd=0;const ok=skDash();let dash=0,bayrak=0;
      for(let i=0;i<20;i++){tick(1/60);dash=Math.max(dash,pRigObj.sm.sp||0)}
      bayrak=(p.spr||p.nrT>0)?8:0; /* owmp.js 'ost' paketi aynı ifadeyi yollar */
      return {shift:+shift.toFixed(2),dashOncesi:+once.toFixed(2),dashBasladi:ok!==false,dash:+dash.toFixed(2),agBayragi:bayrak}});
    check('Naruto koşusu açık dünyada Shift ile',n.shift>.9,n);
    check('Dash atarken Naruto koşusu pozu (ağda da görünür)',n.dashBasladi&&n.dashOncesi<.1&&n.dash>.6&&n.agBayragi===8,n);
    check('Sayfa hatası yok',!errors.length,errors.slice(0,3));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);failed++}).finally(()=>{
  fs.writeFileSync(path.join(out,'ow-slam-auto.json'),JSON.stringify({at:new Date().toISOString(),results},null,1));
  console.log(failed?`ow-slam-auto: ${failed} FAIL`:'ow-slam-auto: hepsi PASS');
  process.exitCode=failed?1:0;
});
