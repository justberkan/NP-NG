'use strict';
/* Genel denetim (Claude, 2026-10-17): her teslimden önce ZORUNLU.
   1) Her mod gerçek tarayıcıda açılır, oynanır, lobiye dönülür: sayfa hatası ve 4xx/5xx yanıt olmamalı.
   2) Aynı mod 4 kez aç-kapa (son iki tur karşılaştırılır): ekran kartı doku/geometri sayısı büyümemeli (bellek sızıntısı).
   3) Lobideki tüm sekmeler açılır, her düğmeye basılır: sayfa hatası olmamalı.
   Çalıştırma: npm test (run.cjs içinden) ya da TEST_URL=http://127.0.0.1:3000 node tests/audit.cjs
   Tarayıcısız (Node VM) testler bunun yerine geçmez. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results','audit');
const baseURL=process.env.TEST_URL||'http://127.0.0.1:3000';
const MODES=(process.env.AUDIT_MODES||'aim,tdm,zom,cmp,ow,wc,race').split(',');
fs.mkdirSync(out,{recursive:true});
const results=[];let failed=0;
const check=(name,ok,detail)=>{results.push({name,ok,detail});if(!ok)failed++;console.log(`${ok?'PASS':'FAIL'} ${name}${detail?' — '+detail:''}`)};

async function openPage(browser){
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  await page.addInitScript(()=>{try{localStorage.setItem('npng_legal_v1','1')}catch(e){}});
  const errors=[],http=[];
  page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,300)));
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))http.push(`${r.status()} ${r.url()}`)});
  page.on('dialog',d=>d.dismiss().catch(()=>{}));
  await page.goto(baseURL+'/index.html',{waitUntil:'load'});
  await page.waitForFunction(()=>typeof startMatch==='function'&&typeof view==='function',null,{timeout:30000});
  await page.waitForTimeout(2500);
  return {page,errors,http};
}

const CYCLE=async md=>{
  const snap=()=>({tex:R.info.memory.textures,geo:R.info.memory.geometries});
  selMode=md;
  if(md!=='ow'&&md!=='aim'){try{loEnsure();loApply()}catch(e){}}
  if(md==='wc'){await wcEnsureMinecraft();WCG.chosen=true;WCG.net=false;WCG.owner=true;WCG.id=0;WCG.code='';WCG.peers.clear()}
  if(md==='cmp')CMP.chosen=true;
  if(md==='race')RACE.picked=true;
  if(md==='tdm'||md==='cmp')await new Promise(r=>{if(!mapNeed(()=>r()))r()});
  startMatch();
  if(mode!==(md==='tm'||md==='zo'?'mp':md))return {err:'mod açılmadı: '+mode};
  key.KeyW=1;
  for(let i=0;i<240;i++){
    if(i===60)firing=true;if(i===90)firing=false;if(i===120)ads=true;if(i===150){ads=false;key.KeyW=0}
    tick(1/60);if(i%30===0)R.render(S,cam);
  }
  key.KeyW=0;firing=false;ads=false;
  toLobby();for(let i=0;i<5;i++)tick(1/60);R.render(S,cam);
  return {state,...snap()};
};

(async()=>{
  const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(fs.existsSync(chrome)?chrome:undefined),args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  try{
    for(const md of MODES){
      const {page,errors,http}=await openPage(browser);
      await page.evaluate(()=>{window.requestAnimationFrame=()=>0});
      const runs=[];
      /* 4 tur: ilk turlar modelleri tembel yükler (paylaşılan GLB'ler); sızıntı son iki tur arasında ölçülür */
      try{for(let c=0;c<4;c++){runs.push(await page.evaluate(CYCLE,md));
        /* tembel model yüklemeleri bitsin (MDL.wait boşalsın), sonra ölç */
        await page.waitForFunction(()=>typeof MDL==='undefined'||!Object.keys(MDL.wait).length,null,{timeout:30000}).catch(()=>{});await page.waitForTimeout(1500)}}
      catch(e){errors.push('evaluate: '+String(e.message).slice(0,300))}
      const bad=runs.find(r=>r.err||r.state!=='menu');
      check(`${md}: aç/oyna/lobiye dön (4 kez) hatasız`,!errors.length&&!http.length&&!bad&&runs.length===4,[...errors,...http,bad&&JSON.stringify(bad)].filter(Boolean).slice(0,3).join(' | '));
      if(runs.length===4){
        const dt=runs[3].tex-runs[2].tex,dg=runs[3].geo-runs[2].geo;
        check(`${md}: maç başına doku/geometri sızıntısı yok`,dt<=2&&dg<=4,`doku ${runs.map(r=>r.tex).join('→')}, geometri ${runs.map(r=>r.geo).join('→')}`);
      }
      await page.screenshot({path:path.join(out,`${md}.png`)});
      await page.close();
    }
    // Lobi: her sekme + her düğme
    {
      const {page,errors,http}=await openPage(browser);
      const navs=await page.evaluate(()=>NAV.map(n=>n[0]));
      let clicks=0;
      for(const n of navs){
        await page.evaluate(v=>view(v),n);await page.waitForTimeout(300);
        const count=await page.evaluate(()=>document.querySelectorAll('#av button,#av [data-s],#av [data-t],#av .chip').length);
        for(let i=0;i<Math.min(count,60);i++){
          await page.evaluate(([v,i])=>{
            if(state!=='menu'){try{toLobby()}catch(e){}}
            const el=[...document.querySelectorAll('#av button,#av [data-s],#av [data-t],#av .chip')][i];
            if(el&&!['rst1','rst2','mpo'].includes(el.id))el.click();
            for(const id of ['lo','cmpsel','wcselect','raceui','crateov'])if(document.getElementById(id))document.getElementById(id).style.display='none';
            if(state!=='menu'){try{toLobby()}catch(e){}}
            if(curView!==v)view(v);
          },[n,i]);
          clicks++;
        }
      }
      check(`Lobi: ${navs.length} sekme, ${clicks} tıklama hatasız`,!errors.length&&!http.length,[...errors,...http].slice(0,3).join(' | '));
      await page.close();
    }
  }finally{await browser.close()}
  fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify({at:new Date().toISOString(),baseURL,results},null,1));
  if(failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
