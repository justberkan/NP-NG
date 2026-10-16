'use strict';
/* K1 — Gerçek cihaz QA/performans ölçümü v2 (Kimi). Mod başına sonucu dosyaya yazar. */
const {chromium}=require('playwright');
const fs=require('fs');
const OUT='C:/Users/berkan/Desktop/mmofps-online/docs/qa';
fs.mkdirSync(OUT,{recursive:true});
const BASE=process.env.QA_URL||'http://127.0.0.1:3100';
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const LOG=f=>fs.appendFileSync(OUT+'/ilerleme.log',new Date().toISOString().slice(11,19)+' '+f+'\n');

async function oyunOyna(page,sureMs){
 return page.evaluate(async ms=>{
  const times=[];let last=performance.now();const t0=last;
  const calls=[];const ents=[];
  while(performance.now()-t0<ms){
   await new Promise(r=>requestAnimationFrame(r));
   const t=performance.now();times.push(t-last);last=t;
   try{
    calls.push(R.info.render.calls);
    ents.push((typeof E!=='undefined'?E.length:0)+(typeof OW!=='undefined'&&OW.on&&OW.act?OW.act.length:0));
   }catch(e){}
  }
  times.shift();
  const top=times.reduce((a,b)=>a+b,0);
  const srt=[...times].sort((a,b)=>a-b);
  const hitch50=[],hitch100=[];
  let acc=0;for(const x of times){acc+=x;if(x>50)hitch50.push(+acc.toFixed(0));if(x>100)hitch100.push(+acc.toFixed(0))}
  return {
   build:(document.body.innerText.match(/build [^\n]+/)||[])[0]||'?',
   px:+(innerWidth*devicePixelRatio).toFixed(0)+'x'+(innerHeight*devicePixelRatio).toFixed(0),
   pr:+R.getPixelRatio().toFixed(2),
   fps:+((times.length)/(top/1000)).toFixed(1),
   p1ms:+srt[Math.floor(srt.length*.99)].toFixed(1),maxms:+srt[srt.length-1].toFixed(1),
   kare:times.length,hit50:hitch50.length,hit100:hitch100.length,
   hit50At:hitch50.slice(0,12),hit100At:hitch100.slice(0,12),
   cizimOrt:Math.round(calls.reduce((a,b)=>a+b,0)/Math.max(1,calls.length)),
   dusmanOrt:+(ents.reduce((a,b)=>a+b,0)/Math.max(1,ents.length)).toFixed(1)
  };
 },sureMs);
}

async function senaryo(page,ms){
 const codes=['KeyW','KeyA','KeyS','KeyD'];
 let ci=0;
 const iv=setInterval(()=>{page.keyboard.up(codes[ci]).catch(()=>{});ci=(ci+1)%codes.length;page.keyboard.down(codes[ci]).catch(()=>{})},2500);
 await page.keyboard.down('KeyW');
 const iv2=setInterval(()=>{
  const a=Math.random()*6.28;
  page.mouse.move(800+Math.cos(a)*260,450+Math.sin(a)*160,{steps:3}).catch(()=>{});
 },700);
 const iv3=setInterval(()=>{
  page.mouse.down().catch(()=>{});setTimeout(()=>page.mouse.up().catch(()=>{}),420);
 },850);
 await page.waitForTimeout(ms);
 clearInterval(iv);clearInterval(iv2);clearInterval(iv3);
 for(const c of codes)await page.keyboard.up(c).catch(()=>{});
}

async function modOlc(browser,ad,mod,ek={},sure=18000){
 LOG('MOD BASLA '+ad);
 const ctx=await browser.newContext({viewport:{width:1600,height:900},deviceScaleFactor:1});
 await ctx.addInitScript(o=>{
  try{const s=JSON.parse(localStorage.getItem('mmofps_set')||'{}');s.fpsShow=true;localStorage.setItem('mmofps_set',JSON.stringify(s))}catch(e){}
  if(o.harita)try{localStorage.setItem('npng_map',o.harita)}catch(e){}
 },ek);
 const page=await ctx.newPage();
 const hatalar=[];
 page.on('pageerror',e=>hatalar.push(String(e.message||e).slice(0,200)));
 await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:20000});
 await page.waitForTimeout(1500);
 const msel=await page.$('#msel');
 if(msel){const mp=await page.$('#mp');const mpOff=mp?await mp.evaluate(el=>el.classList.contains('off')):true;if(mpOff)await msel.click().catch(()=>{});await page.waitForTimeout(300)}
 await page.click('.mode[data-m="'+mod+'"]',{timeout:8000});
 await page.waitForTimeout(300);
 if(await page.$('#go')){await page.click('#go',{timeout:8000})}
 /* loadout ilk girişte açılır: MAÇA GİR bekle ve onayla */
 try{await page.waitForSelector('#lo-go',{state:'visible',timeout:6000});await page.click('#lo-go',{timeout:5000});await page.waitForTimeout(300)}catch(e){LOG(ad+' loadout yok/atlandı')}
 await page.waitForFunction(()=>typeof state!=='undefined'&&state==='play',{timeout:12000}).catch(()=>LOG(ad+' play bekleme zaman aşımı'));
 await page.mouse.click(800,450).catch(()=>{});
 await page.waitForTimeout(500);
 const st=await page.evaluate(()=>({mod:typeof mode!=='undefined'?mode:'?',harita:(typeof MAPS!=='undefined'&&MAPS.sel)||'?'}));
 LOG('MOD OLCUM '+ad+' state='+JSON.stringify(st));
 const r=(await Promise.all([oyunOyna(page,sure),senaryo(page,sure)]))[0];
 LOG('MOD BITTI '+ad+' fps='+r.fps);
 await senaryoKes(page);
 await page.screenshot({path:OUT+'/ekran-'+ad+'.png'});
 await page.evaluate(()=>{try{toLobby()}catch(e){}}).catch(()=>{});
 await page.waitForTimeout(400);
 await ctx.close().catch(()=>{});
 const rec={...r,ad,mod:st.mod,harita:st.harita,hatalar:hatalar.slice(0,5)};
 fs.writeFileSync(OUT+'/sonuc-'+ad+'.json',JSON.stringify(rec,null,1));
 return rec;
}
async function senaryoKes(page){try{for(const c of ['KeyW','KeyA','KeyS','KeyD'])await page.keyboard.up(c)}catch(e){}}

(async()=>{
 const hedef=process.argv[2]||'all';
 fs.writeFileSync(OUT+'/ilerleme.log','');
 const browser=await chromium.launch({headless:false,executablePath:fs.existsSync(CHROME)?CHROME:undefined,
  args:['--window-size=1640,980','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 const plan=[
  ['aim','aim',{},18000],
  ['tdm-arena','tdm',{},22000],
  ['tdm-dust2','tdm',{harita:'dust2'},22000],
  ['zombi','zom',{},22000],
  ['acik-dunya','ow',{},22000]
 ];
 for(const [ad,mod,ek,sure] of plan){
  if(hedef!=='all'&&hedef!==ad)continue;
  try{await modOlc(browser,ad,mod,ek,sure)}
  catch(e){LOG('MOD HATA '+ad+': '+e.message.slice(0,150))}
 }
 await browser.close().catch(()=>{});
 LOG('TAMAM');
})().catch(e=>{console.error(e);process.exitCode=1});
