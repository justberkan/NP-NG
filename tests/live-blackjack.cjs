'use strict';
/* Canlı Blackjack testi (Claude, 2026-10-20 · Berkan: "canlı oynanabilir, aktif biri varsa masaya katılır, turunu bekler").
   Kendi sunucusunu geçici veri + kısa sürelerle açar (MMOFPS_BJ_FAST, MMOFPS_BJ_SEED).
   1) Ham bağlantılar: iki oyuncu oturur, bahis koyar (bjok ile düşülür), sırayla oynar, krupiye oynar, ödemeler kurallara uygun;
      el ortasında gelen üçüncü oyuncu bekler ve sonraki elde oynar; kurallara aykırı istekler reddedilir;
      süre dolunca otomatik "dur"; el ortasında kopan oyuncunun kazancı sonraki girişte verilir.
   2) Gerçek tarayıcı: Kumarhane → Canlı Blackjack, koltuğa otur, bahis koy, oyna; para oyunda doğru değişir. */
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results','live-blackjack');fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let failed=0;const results=[];
const check=(name,ok,detail)=>{results.push({name,ok,detail});if(!ok)failed++;console.log(`${ok?'PASS':'FAIL'} ${name}${detail!==undefined?' — '+JSON.stringify(detail):''}`)};
let child=null,log='';const dir=fs.mkdtempSync(path.join(os.tmpdir(),'npng-lbj-'));
const cv=c=>c[0]==='A'?11:'TJQK'.includes(c[0])?10:+c[0];
function hv(cs){let t=0,a=0;for(const c of cs){t+=cv(c);if(c[0]==='A')a++}while(t>21&&a){t-=10;a--}return t}
function peer(port){const ws=new WebSocket(`ws://127.0.0.1:${port}`),p={ws,msgs:[],send:m=>ws.send(JSON.stringify(m))};ws.addEventListener('message',e=>{try{p.msgs.push(JSON.parse(e.data))}catch(x){}});return new Promise((res,rej)=>{ws.addEventListener('open',()=>res(p));ws.addEventListener('error',rej)})}
async function wait(p,f,ms=8000){const t=Date.now();while(Date.now()-t<ms){for(let i=p.msgs.length-1;i>=0;i--)if(f(p.msgs[i]))return p.msgs[i];await sleep(15)}return null}
async function player(port,name,mode){const p=await peer(port);p.name=name;p.send({t:'auth',mode:mode||'register',name,pass:'sifre1234',save:{v:3,tl:0}});p.auth=await wait(p,m=>m.t==='auth');return p}
const last=(p,t)=>{for(let i=p.msgs.length-1;i>=0;i--)if(p.msgs[i].t===t)return p.msgs[i];return null};
const sumOk=p=>p.msgs.filter(m=>m.t==='bjok').reduce((s,m)=>s+m.a,0);
const sumPay=p=>p.msgs.filter(m=>m.t==='bjpay').reduce((s,m)=>s+m.a,0);
/* beklenen ödeme (el sonu durumundan) */
function expectPay(st,i){const x=st.seats[i],dv=hv(st.d),dbj=st.d.length===2&&dv===21;let p=0;for(const h of x.hands){const v=hv(h.c),bj=h.c.length===2&&x.hands.length===1&&v===21;
  if(v>21)continue;if(bj&&!dbj)p+=h.bet*2.5;else if(dbj){if(bj)p+=h.bet}else if(dv>21||v>dv)p+=h.bet*2;else if(v===dv)p+=h.bet}return Math.floor(p)}
(async()=>{
  const port=await new Promise(r=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const q=s.address().port;s.close(()=>r(q))})});
  child=spawn(process.execPath,['server.js'],{cwd:root,windowsHide:true,env:{...process.env,PORT:String(port),MMOFPS_DATA:dir,MMOFPS_BJ_FAST:'1',MMOFPS_BJ_SEED:'424242'}});
  child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
  {const t=Date.now();while(!log.includes('sunucusu çalışıyor')){if(Date.now()-t>8000||child.exitCode!==null)throw Error('sunucu başlamadı: '+log);await sleep(25)}}
  /* ---- 1) ham ---- */
  const A=await player(port,'kartA'),B=await player(port,'kartB');
  check('İki oyuncu giriş yaptı',A.auth&&A.auth.ok&&B.auth&&B.auth.ok);
  A.send({t:'bjjoin',tb:1});B.send({t:'bjjoin',tb:1});
  const s0=await wait(A,m=>m.t==='bjs');
  check('Masa durumu gelir (5 koltuk, Masa 1 min ₺10)',!!s0&&s0.seats.length===5&&s0.min===10&&s0.ph==='idle',s0&&{ph:s0.ph,min:s0.min});
  A.send({t:'bjsit',s:0});await sleep(80);B.send({t:'bjsit',s:2});await wait(B,m=>m.t==='bjs'&&m.seats[2]&&m.seats[2].n==='kartB');
  B.send({t:'bjsit',s:3});const twice=await wait(B,m=>m.t==='bjmsg'&&/Zaten/.test(m.m),1500);
  check('Aynı oyuncu iki koltuğa oturamaz',!!twice);
  A.send({t:'bjbet',a:5,tl:1000});const low=await wait(A,m=>m.t==='bjmsg'&&/bahis/i.test(m.m),1500);
  A.send({t:'bjbet',a:100,tl:50});const poor=await wait(A,m=>m.t==='bjmsg'&&/Yetersiz/.test(m.m),1500);
  check('Masa altı bahis ve bakiyeden büyük bahis reddedilir',!!low&&!!poor&&sumOk(A)===0);
  A.send({t:'bjbet',a:100,tl:1000});await wait(A,m=>m.t==='bjok');await sleep(150);
  const sb=last(A,'bjs');
  check('Bahis kabul edilince bjok gelir, bahis süresi başlar',sumOk(A)===100&&sb.ph==='bet'&&sb.ms>0,{ok:sumOk(A),ph:sb.ph});
  B.send({t:'bjbet',a:50,tl:1000});await wait(B,m=>m.t==='bjok');
  /* üçüncü oyuncu el başlarken gelir */
  const play1=await wait(A,m=>m.t==='bjs'&&(m.ph==='play'||m.ph==='end'||m.ph==='dealer'),6000);
  check('Herkes bahis koyunca el başlar, kartlar dağıtılır (krupiyenin bir kartı kapalı)',!!play1&&play1.seats[0].hands[0].c.length>=2&&play1.d.length===2&&(play1.ph!=='play'||play1.d[1]===null),play1&&{ph:play1.ph,d:play1.d});
  const C=await player(port,'kartC');C.send({t:'bjjoin',tb:1});await wait(C,m=>m.t==='bjs');
  C.send({t:'bjsit',s:0});const full=await wait(C,m=>m.t==='bjmsg'&&/dolu/.test(m.m),1500);
  check('Dolu koltuğa oturulamaz',!!full);
  C.send({t:'bjsit',s:4});
  const waitMsg=await wait(C,m=>m.t==='bjmsg'&&/sıradaki/.test(m.m),2000),cs=await wait(C,m=>m.t==='bjs'&&m.seats[4]&&m.seats[4].wait===1,2000);
  C.send({t:'bjbet',a:10,tl:1000});const cRej=await wait(C,m=>m.t==='bjmsg'&&/kapalı/.test(m.m),1500);
  check('El ortasında gelen oyuncu oturur ama sıradaki eli bekler (bahis kapalı)',!!waitMsg&&!!cs&&!!cRej&&sumOk(C)===0);
  /* sırayla oyna: 12 altı çek, sonra dur; sırası olmayanın hamlesi geçmez */
  let wrong=false,acted=0,dealerHidden=true,tested=false;
  for(let g=0;g<60;g++){
    const st=last(A,'bjs');if(!st)break;
    if(st.ph==='end')break;
    if(st.ph==='play'&&st.d[1]!==null)dealerHidden=false;
    if(st.ph==='play'&&st.turn){
      const who=st.turn[0]===0?A:B,other=st.turn[0]===0?B:A,h=st.seats[st.turn[0]].hands[st.turn[1]],v=hv(h.c);
      if(!tested){tested=true;other.send({t:'bjact',a:'hit'});await sleep(200);const st2=last(A,'bjs');if(st2.turn&&st2.turn[0]!==st.turn[0])wrong=true}
      const n0=A.msgs.length;who.send({t:'bjact',a:v<12?'hit':'stand',tl:1000});acted++;
      const t0=Date.now();while(A.msgs.length===n0&&Date.now()-t0<3000)await sleep(15);
    }else await sleep(60);
  }
  const end1=await wait(A,m=>m.t==='bjs'&&m.ph==='end',8000);
  check('Sırası olmayan oyuncunun hamlesi geçmez; oyuncular sırayla oynar, oyun sırasında krupiye kartı kapalı',!wrong&&acted>=1&&dealerHidden,{acted});
  const dv=end1&&hv(end1.d);
  check('Krupiye yumuşak 17\'de durur (17+ olur ya da tüm oyuncular batmışsa çekmez)',!!end1&&(dv>=17||end1.seats.filter(Boolean).every(x=>!x.bet||x.hands.every(h=>hv(h.c)>21||(h.c.length===2&&hv(h.c)===21)))),end1&&{d:end1.d,dv});
  await sleep(300);
  const eA=expectPay(end1,0),eB=expectPay(end1,2);
  check('Ödemeler kurallara uygun (kazanç 2×, beraberlik 1×, blackjack 2,5×) ve bjpay ile gelir',sumPay(A)===eA&&sumPay(B)===eB,{A:[sumPay(A),eA],B:[sumPay(B),eB],d:end1.d,a:end1.seats[0].hands,b:end1.seats[2].hands});
  /* sonraki el: C artık oynayabilir; A süreyi doldurur (otomatik dur); B el ortasında kopar */
  const idle2=await wait(A,m=>m.t==='bjs'&&m.ph==='idle'&&m.rd===end1.rd,6000);
  check('El bitince yeni el başlar, bekleyen oyuncu artık beklemez',!!idle2&&idle2.seats[4]&&idle2.seats[4].wait===0);
  A.msgs.length=0;B.msgs.length=0;C.msgs.length=0;
  A.send({t:'bjbet',a:20,tl:1000});B.send({t:'bjbet',a:30,tl:1000});C.send({t:'bjbet',a:10,tl:1000});
  await wait(A,m=>m.t==='bjok');await wait(C,m=>m.t==='bjok');
  const p2=await wait(A,m=>m.t==='bjs'&&m.ph==='play'&&m.turn,6000);
  check('Üç oyunculu el başladı',!!p2&&p2.seats.filter(x=>x&&x.bet>0).length===3,p2&&p2.seats.map(x=>x&&x.bet));
  /* B'nin elinden önce koparsa da eli otomatik "dur" ile biter, kazancı hesapta bekler */
  let bWasPlaying=!!p2;
  B.ws.close();
  let st=null,autoStand=false;
  for(let g=0;g<80;g++){st=last(A,'bjs');if(st.ph==='end')break;
    if(st.ph==='play'&&st.turn){if(st.turn[0]===0){await sleep(2800);autoStand=true} /* A süreyi doldurur */
      else if(st.turn[0]===4){C.send({t:'bjact',a:'stand',tl:1000});await sleep(250)}else await sleep(100)}else await sleep(80)}
  const end2=await wait(A,m=>m.t==='bjs'&&m.ph==='end',8000);
  const aHand=end2&&end2.seats[0]&&end2.seats[0].hands[0];
  check('Süre dolunca otomatik "dur"',autoStand&&!!aHand&&aHand.c.length===2,aHand);
  check('Kopan oyuncunun eli otomatik biter, koltuğu "kalktı" görünür',bWasPlaying&&!!end2&&end2.seats[2]&&end2.seats[2].away===1&&end2.seats[2].hands.every(h=>h.c.length===2||hv(h.c)>=21),end2&&end2.seats[2]);
  const eB2=end2?expectPay(end2,2):0;
  await sleep(1600);
  const B2=await player(port,'kartB','login');
  const pend=await wait(B2,m=>m.t==='bjpay'&&m.pend===1,1500);
  check('Kopan oyuncunun kazancı sonraki girişte verilir (yoksa hiçbir şey gelmez)',eB2>0?(!!pend&&pend.a===eB2):!pend,{beklenen:eB2,gelen:pend&&pend.a});
  const after=await wait(A,m=>m.t==='bjs'&&m.ph==='idle'&&m.rd===end2.rd,5000);
  check('El sonunda kopanın koltuğu boşalır',!!after&&after.seats[2]===null);
  for(const q of [A,B2,C])q.ws.close();await sleep(150);
  /* ---- 2) tarayıcı ---- */
  const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(fs.existsSync(chrome)?chrome:undefined),args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const errors=[];
  try{
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    await page.addInitScript(()=>{try{localStorage.setItem('npng_legal_v1','1')}catch(e){}});
    page.on('pageerror',e=>errors.push(String(e.message||e).slice(0,200)));page.on('dialog',d=>d.accept().catch(()=>{}));
    await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'load'});
    await page.waitForFunction(()=>typeof OFFL==='object'&&!OFFL.pend,null,{timeout:30000});
    await page.evaluate(p=>{window.__eski=1;mpConnect('ws://127.0.0.1:'+p,'masaTar','sifre1234','register',true)},port);
    await page.waitForFunction(()=>!window.__eski&&typeof OFFL==='object'&&!OFFL.pend&&MPL.authed,null,{timeout:30000});
    await page.evaluate(()=>{SV.casOk=Date.now();SV.tl=5000;casLog(0,0);save();bal();cgGame='lbj';view('casino')});
    await page.waitForFunction(()=>LBJ.st&&document.querySelector('#lbjseats [data-sit]'),null,{timeout:10000});
    await page.screenshot({path:path.join(out,'masa-bos.png')});
    await page.evaluate(()=>document.querySelector('#lbjseats [data-sit="1"]').click());
    await page.waitForFunction(()=>lbjMySeat()===1&&document.querySelector('#lbjctl [data-ch]'),null,{timeout:5000});
    const t0=await page.evaluate(()=>SV.tl);
    await page.evaluate(()=>{const b=[...document.querySelectorAll('#lbjctl [data-ch]')];b[1].click();});
    await page.evaluate(()=>{const b=[...document.querySelectorAll('#lbjctl [data-ch]')];b[0].click();document.getElementById('lbjbet').click()});
    await page.waitForFunction(t0=>SV.tl<t0,t0,{timeout:5000});
    const t1=await page.evaluate(()=>SV.tl);
    check('Tarayıcı: koltuğa otur, fişlerle ₺60 bahis koy → oyun parasından düşer',t1===t0-60,{t0,t1});
    /* oyna: sırası gelince 12 altı çek, sonra dur */
    let shot=false;
    for(let g=0;g<120;g++){
      const r=await page.evaluate(()=>{const st=LBJ.st;if(!st)return {ph:'?'};const a=document.querySelector('#lbjctl [data-a="stand"]');
        if(st.ph==='play'&&st.turn&&st.turn[0]===1&&a){const h=st.seats[1].hands[st.turn[1]];const v=h.v;document.querySelector(`#lbjctl [data-a="${v<12?'hit':'stand'}"]`).click();return {ph:st.ph,acted:1}}return {ph:st.ph}});
      if(r.ph==='play'&&!shot){shot=true;await page.screenshot({path:path.join(out,'masa-oyun.png')})}
      if(r.ph==='end')break;await sleep(150);
    }
    await page.waitForFunction(()=>LBJ.endSt&&LBJ.endSt.seats[1]&&LBJ.endSt.seats[1].hands.length,null,{timeout:10000});
    await sleep(600);
    const r=await page.evaluate(()=>({st:LBJ.endSt,tl:SV.tl}));
    const exp=expectPay(r.st,1);
    check('Tarayıcı: el oynandı, el sonunda kazanç oyun parasına eklenir',r.st.seats[1].hands.length>0&&r.tl===t1+exp,{tl:r.tl,once:t1,kazanc:exp,el:r.st.seats[1].hands,d:r.st.d});
    await page.screenshot({path:path.join(out,'masa-son.png')});
    await page.evaluate(()=>view('home'));await sleep(400);
    check('Kumarhaneden çıkınca masadan kalkılır',await page.evaluate(()=>!LBJ.on));
    check('Sayfa hatası yok',!errors.length,errors.slice(0,3));
  }finally{await browser.close()}
})().catch(e=>{console.error(e);failed++}).finally(async()=>{
  if(child&&child.exitCode===null)await new Promise(r=>{child.once('exit',r);child.kill('SIGTERM')});
  try{if(path.basename(dir).startsWith('npng-lbj-'))fs.rmSync(dir,{recursive:true,force:true})}catch(e){}
  fs.writeFileSync(path.join(out,'live-blackjack.json'),JSON.stringify({at:new Date().toISOString(),results},null,1));
  console.log(failed?`live-blackjack: ${failed} FAIL`:'live-blackjack: hepsi PASS');
  process.exitCode=failed?1:0;
});
