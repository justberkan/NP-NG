'use strict';
/* Sesli sohbet testi (Claude, 2026-10-20 · Berkan: "oyun içi ses gitmiyor").
   Ses artık oyun sunucusunun WebSocket'inden gider (eşler arası WebRTC mobil hat / CGNAT'ta bağlanamıyordu).
   İki gerçek tarayıcı (sahte mikrofon), aynı açık dünya: bas-konuş basılı değilken ses gitmez; açık mikrofonda gider ve
   karşı tarafta çalınır; "Duy: Kapalı" gelen sesi keser; mikrofon kapanınca gönderim durur. Kendi sunucusunu geçici veriyle açar. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results','voice');fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let failed=0;const results=[];
const check=(name,ok,detail)=>{results.push({name,ok,detail});if(!ok)failed++;console.log(`${ok?'PASS':'FAIL'} ${name}${detail!==undefined?' — '+JSON.stringify(detail):''}`)};
let child=null,log='';const dir=fs.mkdtempSync(path.join(os.tmpdir(),'npng-voice-'));
(async()=>{
  const port=await new Promise(r=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const q=s.address().port;s.close(()=>r(q))})});
  child=spawn(process.execPath,['server.js'],{cwd:root,windowsHide:true,env:{...process.env,PORT:String(port),MMOFPS_DATA:dir}});
  child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
  {const t=Date.now();while(!log.includes('sunucusu çalışıyor')){if(Date.now()-t>8000||child.exitCode!==null)throw Error('sunucu başlamadı: '+log);await sleep(25)}}
  const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(fs.existsSync(chrome)?chrome:undefined),
    args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
  const errors=[];
  const open=async name=>{
    const ctx=await browser.newContext({viewport:{width:1100,height:650},permissions:['microphone']});
    const page=await ctx.newPage();
    await page.addInitScript(()=>{try{localStorage.setItem('npng_legal_v1','1')}catch(e){}});
    page.on('pageerror',e=>errors.push(name+': '+String(e.message||e).slice(0,200)));page.on('dialog',d=>d.accept().catch(()=>{}));
    await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'load'});
    await page.waitForFunction(()=>typeof OFFL==='object'&&!OFFL.pend&&typeof MPL==='object',null,{timeout:30000});
    await page.evaluate(([p,n])=>{window.__eski=1;mpConnect('ws://127.0.0.1:'+p,n,'sifre1234','register',true)},[port,name]);
    await page.waitForFunction(()=>!window.__eski&&typeof OFFL==='object'&&!OFFL.pend&&MPL.authed,null,{timeout:30000});
    await page.evaluate(()=>{if(typeof CLS!=='undefined'&&!SV.ow.cls)SV.ow.cls=Object.keys(CLS)[0];selMode='ow';startMatch();
      setInterval(()=>{const c=document.getElementById('clsm');if(c)c.classList.remove('open');if(state==='pause')state='play'},200)});
    await page.waitForFunction(()=>OWN.on,null,{timeout:15000});
    /* yazılımsal GPU'da iki sayfanın 3B çizimi ana iş parçacığını tıkayıp mesajları saniyelerce geciktiriyor; ses için çizim gerekmez */
    await page.evaluate(()=>{window.requestAnimationFrame=()=>0});await sleep(300);
    return page;
  };
  try{
    const A=await open('sesA'),B=await open('sesB');
    const aId=await A.evaluate(()=>OWN.id);
    const got=()=>B.evaluate(id=>{const p=CH.peers.get(id);return p?p.got||0:0},aId);
    await A.evaluate(()=>chVoiceCycle());await A.waitForFunction(()=>CH.mode===1&&!!CH.node,null,{timeout:10000});
    await sleep(1500);
    check('Bas-konuş basılı değilken ses gitmez',await got()===0&&await A.evaluate(()=>!(CH.sent>0)));
    await A.evaluate(()=>{CH.ptt=true;chMic()});await sleep(2500);await A.evaluate(()=>{CH.ptt=false;chMic()});
    const g1=await got();
    const bs=await B.evaluate(id=>{const p=CH.peers.get(id),a=ac;return {sira:p?+(p.next-a.currentTime).toFixed(2):null,ctx:a&&a.state,vui:document.getElementById('chv').textContent}},aId);
    check('Bas-konuş basılıyken ses sunucudan geçer ve karşıda çalınır',g1>=5&&bs.ctx==='running',{paket:g1,...bs});
    await sleep(600);const g1b=await got();
    await A.evaluate(()=>chVoiceCycle());await sleep(2500);const g2=await got();
    check('Açık mikrofonda ses sürekli gider',g2-g1b>=5,{once:g1b,sonra:g2,gonderilen:await A.evaluate(()=>CH.sent)});
    await B.evaluate(()=>chHear(false));await sleep(500);const g3=await got();await sleep(1500);const g4=await got();
    check('"Duy: Kapalı" gelen sesi keser (sunucu da yollamaz)',g4===g3,{g3,g4});
    await B.evaluate(()=>chHear(true));await sleep(1500);const g5=await got();
    check('"Duy: Açık" ile ses geri gelir',g5>g4,{g4,g5});
    await A.evaluate(()=>chVoiceCycle());await sleep(500);const g6=await got();await sleep(1500);const g7=await got();
    check('Mikrofon kapanınca gönderim durur',g7===g6&&await A.evaluate(()=>CH.mode===0&&!CH.node),{g6,g7});
    await B.screenshot({path:path.join(out,'ses-alan.png')});
    check('Sayfa hatası yok',!errors.length,errors.slice(0,3));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);failed++}).finally(async()=>{
  if(child&&child.exitCode===null)await new Promise(r=>{child.once('exit',r);child.kill('SIGTERM')});
  try{if(path.basename(dir).startsWith('npng-voice-'))fs.rmSync(dir,{recursive:true,force:true})}catch(e){}
  fs.writeFileSync(path.join(out,'voice.json'),JSON.stringify({at:new Date().toISOString(),results},null,1));
  console.log(failed?`voice: ${failed} FAIL`:'voice: hepsi PASS');
  process.exitCode=failed?1:0;
});
