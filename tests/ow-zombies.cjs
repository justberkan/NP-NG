'use strict';
/* Açık dünya yaban Minecraft zombileri (Claude, 2026-10-20 · Berkan: "açık dünya çok boş, çok az yaratık var, Minecraft zombilerinden ekleyelim").
   - Kamplar arasına 2-4'lük sürüler: köye, kampların ve engellerin üstüne düşmez.
   - Eski kamp moblarının sırası ve değerleri aynı (çevrimiçi eşleme mob sırasına göre; değişirse eski/yeni oyuncular karışır).
   - Minecraft modeliyle çizilir, yakına geleni kendisi kovalar, köye girince bırakır, ölünce kısa ceset (ragdoll çökmesi yok).
   Çalıştırma: npm test (run.cjs) ya da TEST_URL=http://127.0.0.1:3000 node tests/ow-zombies.cjs */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const baseURL=process.env.TEST_URL||'http://127.0.0.1:3000';
const out=path.join(path.resolve(__dirname,'..'),'test-results','ow-zombies');fs.mkdirSync(out,{recursive:true});
let failed=0;const results=[];
const check=(name,ok,detail)=>{results.push({name,ok,detail});if(!ok)failed++;console.log(`${ok?'PASS':'FAIL'} ${name}${detail!==undefined?' — '+JSON.stringify(detail):''}`)};
/* Zombiler eklenmeden önceki (build 202610200140) kamp moblarının parmak izi */
const CAMP_FP={n:348,h:'88d53817'};
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
    const play=()=>page.evaluate(()=>{const c=document.getElementById('clsm');if(c)c.classList.remove('open');if(state==='pause')state='play'});
    await play();
    /* 1) yerleşim */
    let r=await page.evaluate(()=>{
      const old=OW.mobs.filter(m=>!m.camp.wild),wild=OW.mobs.filter(m=>m.camp.wild),packs=OW.camps.filter(c=>c.wild);
      let h=0x811c9dc5;const s=old.map(m=>m.tk+','+m.L+','+m.hx.toFixed(2)+','+m.hz.toFixed(2)+','+m.max).join(';');
      for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}
      const inSolid=wild.filter(m=>OW.solids.some(b=>m.hx>b.x1&&m.hx<b.x2&&m.hz>b.z1&&m.hz<b.z2)).length;
      const maxOld=Math.max(...old.map(m=>m.id)),minWild=Math.min(...wild.map(m=>m.id));
      const nearCamp=packs.filter(c=>OW.camps.some(q=>!q.wild&&Math.hypot(q.x-c.x,q.z-c.z)<20)).length;
      return {eski:old.length,fp:h.toString(16),yaban:wild.length,suru:packs.length,koyde:wild.filter(m=>Math.hypot(m.hx,m.hz)<40).length,engelde:inSolid,kampUstunde:nearCamp,
        sira:maxOld<minWild&&OW.mobs.every((m,i)=>m.id===i),tur:[...new Set(wild.map(m=>m.tk))],seviye:[Math.min(...wild.map(m=>m.L)),Math.max(...wild.map(m=>m.L))]}});
    console.log('kamp parmak izi',r.eski,r.fp);
    check('Eski kamp mobları aynı sırada ve aynı (çevrimiçi eşleme bozulmaz)',r.eski===CAMP_FP.n&&r.fp===CAMP_FP.h&&r.sira,r);
    check('Kamplar arasına çok sayıda yaban zombi sürüsü eklendi',r.suru>=100&&r.yaban>=250&&r.tur.length===1&&r.tur[0]==='mcz',{suru:r.suru,yaban:r.yaban,tur:r.tur,seviye:r.seviye});
    check('Sürüler köye, kampların ve engellerin üstüne düşmez',r.koyde===0&&r.engelde===0&&r.kampUstunde===0,r);
    /* 2) model + kovalama */
    await page.waitForFunction(()=>!!(WCMC&&WCMC.model),null,{timeout:20000});
    await play();
    r=await page.evaluate(()=>{
      const m=OW.mobs.filter(q=>q.camp.wild&&q.state!=='dead').sort((a,b)=>Math.hypot(a.hx,a.hz)-Math.hypot(b.hx,b.hz))[0];
      for(const o of OW.act.slice())owDeact(m===o?o:o);
      p.x=m.hx+20;p.z=m.hz;p.y=owH(p.x,p.z);p.vx=p.vz=0;p.hp=owMax();
      owAct(m);
      const rig={mc:!!(m.rig&&m.rig.wcMC),olcek:+m.g.scale.x.toFixed(2)};
      for(let i=0;i<60;i++){p.inv=99;p.x=m.hx+20;p.z=m.hz;tick(1/60)}
      const uzakta=m.state;
      p.x=m.x+6;p.z=m.z;p.y=owH(p.x,p.z);const d0=Math.hypot(p.x-m.x,p.z-m.z);
      for(let i=0;i<40;i++){p.inv=99;tick(1/60)}
      const d1=Math.hypot(p.x-m.x,p.z-m.z);
      return {id:m.id,...rig,uzakta,yakinda:m.state,d0:+d0.toFixed(2),d1:+d1.toFixed(2),suru:m.camp.mem.map(o=>o.state)}});
    check('Yaban zombi Minecraft modeliyle çizilir',r.mc&&r.olcek>.9&&r.olcek<1.1,r);
    check('Uzaktayken saldırmaz, 6 m yaklaşınca sürü kendiliğinden kovalar',r.uzakta==='idle'&&r.yakinda==='aggro'&&r.d1<r.d0&&r.suru.every(s=>s==='aggro'),r);
    r=await page.evaluate(id=>{const m=OW.mobs[id];p.x=0;p.z=12;p.y=0;for(let i=0;i<10;i++){p.inv=99;tick(1/60)}return {durum:m.state}},r.id);
    check('Oyuncu köye girince zombi kovalamayı bırakır',r.durum==='return'||r.durum==='idle',r);
    /* 3) öldürme: kısa ceset, sayfa hatası yok, ganimet */
    await play();
    r=await page.evaluate(()=>{
      const m=OW.mobs.filter(q=>q.camp.wild&&q.state!=='dead').sort((a,b)=>Math.hypot(a.hx,a.hz)-Math.hypot(b.hx,b.hz))[3];
      p.x=m.hx-3;p.z=m.hz;p.y=owH(p.x,p.z);if(OW.act.indexOf(m)<0)owAct(m);for(let i=0;i<5;i++){p.inv=99;tick(1/60)}
      const k0=SV.ow.kills,l0=LOOT.length,R0=Math.random;Math.random=()=>0;
      owDamage(m,m.max*30,{player:true,pt:V3(m.x,1,m.z),dir:V3(1,0,0),head:false,melee:true,power:5});
      Math.random=R0;const ganimet=LOOT.length-l0;
      const c=WCMC_CORPSES[WCMC_CORPSES.length-1],y0=c?+c.root.position.y.toFixed(2):null,zemin=+owH(m.x,m.z).toFixed(2);
      for(let i=0;i<60;i++){p.inv=99;tick(1/60)}
      const yari=c?+c.root.position.y.toFixed(2):null;
      for(let i=0;i<120;i++){p.inv=99;tick(1/60)}
      return {olu:m.state,oldurme:SV.ow.kills-k0,ganimet,ceset:!!c,y0,zemin,yari,kalan:WCMC_CORPSES.length,gorunur:m.g?m.g.visible:null}});
    check('Ölünce kısa ceset zeminde devrilir ve kaybolur (çökme yok)',r.olu==='dead'&&r.oldurme===1&&r.ceset&&Math.abs(r.y0-r.zemin)<.3&&Math.abs(r.yari-r.zemin)<.3&&r.kalan===0&&r.gorunur===false,r);
    check('Yaban zombi de ganimet ve ödül verir',r.ganimet>0,r);
    /* 4) haritalar */
    r=await page.evaluate(()=>{owMini&&owMini();owBig&&owBig();return true}).catch(e=>String(e));
    await page.screenshot({path:path.join(out,'ow-zombiler.png')});
    check('Mini/büyük harita çizimi hatasız',r===true,r);
    check('Sayfa hatası yok',!errors.length,errors.slice(0,3));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);failed++}).finally(()=>{
  fs.writeFileSync(path.join(out,'ow-zombies.json'),JSON.stringify({at:new Date().toISOString(),results},null,1));
  console.log(failed?`ow-zombies: ${failed} FAIL`:'ow-zombies: hepsi PASS');
  process.exitCode=failed?1:0;
});
