'use strict';
/* A-16 / A-20 regresyon testi (Claude, 2026-10-19) — gerçek tarayıcı, gerçek oyun döngüsü.
   A-16: süzülme (paraşüt) Space basılıyken kapanıp açılmamalı (eskiden 144+ FPS'te 3 sn'de 33 kez), düşüş hızı sıçramamalı,
         birinci şahısta eldeki silah (görünüm modeli) titrememeli; Space bırakılınca süzülme biter.
   A-20: Naruto (ninja) koşusu yalnız açık dünyada; diğer modlarda Shift hızlı koşu, animasyon normal koşu.
   Çalıştırma: npm test (run.cjs) ya da TEST_URL=http://127.0.0.1:3000 node tests/glide-sprint.cjs */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const baseURL=process.env.TEST_URL||'http://127.0.0.1:3000';
const out=path.join(path.resolve(__dirname,'..'),'test-results','glide-sprint');fs.mkdirSync(out,{recursive:true});
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
    await page.evaluate(()=>{window.requestAnimationFrame=()=>0});
    /* A-16 */
    for(const F of [60,165,240]){
      const r=await page.evaluate(F=>{
        if(state!=='play'||mode!=='aim'){if(state!=='menu')toLobby();selMode='aim';startMatch();for(let i=0;i<30;i++)tick(1/60)}
        tp=false;const DT=1/F;p.x=0;p.z=0;p.y=80;p.g=0;p.vy=-3;p.vx=p.vz=0;p.at=1;p.glide=0;jHeld=true;
        let tog=0,prev=null,jumps=0,lastVy=null,handMax=0,last=null,i=0;const N=Math.round(F*3),settle=Math.round(F*.6);
        for(;i<N;i++){tick(DT);if(prev!==null&&p.glide!==prev)tog++;prev=p.glide;
          if(i>settle){if(lastVy!==null&&Math.abs(p.vy-lastVy)>.1)jumps++;
            const h=VM&&VM.root&&VM.root.position;if(h){if(last){handMax=Math.max(handMax,h.distanceTo(last))}last=(last||h.clone()).copy(h)}}
          lastVy=p.vy}
        const during=p.glide;jHeld=false;for(let k=0;k<3;k++)tick(DT);
        return {gecis:tog,vySicrama:jumps,elAdimMax:+handMax.toFixed(4),surerken:during,birakinca:p.glide}},F);
      check(`A-16 ${F} FPS: Space basılıyken süzülme kesintisiz, hız sıçramıyor, el titremiyor`,r.gecis<=1&&r.vySicrama===0&&r.surerken===1&&r.elAdimMax<.002,r);
      check(`A-16 ${F} FPS: Space bırakılınca süzülme biter`,r.birakinca===0,r);
    }
    /* A-20 */
    const sprintIn=async md=>page.evaluate(md=>{
      if(state!=='menu')toLobby();selMode=md;if(md!=='ow'&&md!=='aim'){try{loEnsure();loApply()}catch(e){}}startMatch();
      for(let i=0;i<20;i++)tick(1/60);tp=true;key.KeyW=1;key.ShiftLeft=1;
      let maxSp=0,spr=0;for(let i=0;i<120;i++){tick(1/60);if(pRigObj&&pRigObj.sm)maxSp=Math.max(maxSp,pRigObj.sm.sp||0);spr=Math.max(spr,p.spr||0)}
      key.KeyW=0;key.ShiftLeft=0;const r={mode,spr,naruto:+maxSp.toFixed(3)};toLobby();return r},md);
    let r=await sprintIn('aim');
    check('A-20 Aim: Shift hızlı koşu var, Naruto koşusu yok',r.mode==='aim'&&r.spr===1&&r.naruto<.05,r);
    r=await sprintIn('ow');
    check('A-20 Açık dünya: Naruto koşusu var',r.mode==='ow'&&r.spr===1&&r.naruto>.9,r);
    check('Sayfa hatası yok',!errors.length,errors.slice(0,3));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);failed++}).finally(()=>{
  fs.writeFileSync(path.join(out,'glide-sprint.json'),JSON.stringify({at:new Date().toISOString(),results},null,1));
  console.log(failed?`glide-sprint: ${failed} FAIL`:'glide-sprint: hepsi PASS');
  process.exitCode=failed?1:0;
});
