// Görsel doğrulama: assets/casino/dede/index.html'i gerçek Chrome'da aç, olayları tetikle,
// docs/casino/ altına ekran görüntüsü al. Gereksinim: playwright + Chrome.
// Kullanım: node tests/casino-ui.cjs
const path=require('path');
const fs=require('fs');
process.env.NODE_PATH=process.env.NPNG_PLAYWRIGHT_PATH||'C:\\Users\\berkan\\Desktop\\mmofps-online\\electron\\node_modules';
require('module').Module._initPaths();
const OUT=path.join(__dirname,'..','docs','casino');
fs.mkdirSync(OUT,{recursive:true});
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:false,executablePath:process.env.CHROME_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errs=[];
 page.on('pageerror',e=>errs.push(String(e)));
 page.on('console',m=>{
   if(m.type()!=='error')return;
   const t=m.text();
   const loc=(m.location()&&m.location().url)||'';
   if(t.includes('ERR_FILE_NOT_FOUND')&&loc.includes('/ses/'))return; // mp3 henuz yok: sentez yedege duser, beklenen
   errs.push(t);
 });
 await page.goto('file:///'+path.join(__dirname,'..','assets','casino','dede','index.html').replace(/\\/g,'/'));
 await page.waitForTimeout(900);
 const api=await page.evaluate(()=>typeof window.NPNG_CASINO!=='undefined');
 const cells=await page.locator('#reels .cell').count();
 const dedeOk=await page.evaluate(()=>{const i=document.querySelector('#dede img.on');return i&&i.naturalWidth>0?i.src.split('/').pop():null});
 console.log('API:',api,'| hucre:',cells,'| dede pozu:',dedeOk);
 await page.screenshot({path:path.join(OUT,'dede-idle.png')});

 // kayip: 2 spin (kayıp ihtimali yüksek) ve gul-isaret pozu + kayıp repligi
 for(let i=0;i<2;i++){await page.click('#spin');await page.waitForTimeout(2900)}
 await page.evaluate(()=>{window.NPNG_CASINO._ui.dedePose('kayip',4000);window.NPNG_CASINO._ui.quip('kayip')});
 await page.waitForTimeout(500);
 await page.screenshot({path:path.join(OUT,'dede-kayip.png')});

 // su bardagi
 await page.evaluate(()=>{window.NPNG_CASINO._ui.dedePose('buyuk',4000);window.NPNG_CASINO._ui.quip('buyuk-kayip')});
 await page.waitForTimeout(500);
 await page.screenshot({path:path.join(OUT,'dede-su.png')});

 // simsek pozu + gridde carpmanin dusmesi (100x zorlamali)
 await page.evaluate(()=>{
   const A=window.NPNG_CASINO;
   A._ui.dedePose('spin',4000);
   // 12. hucreye 100x orb koy, carptir
   const c=document.querySelectorAll('#reels .cell')[12];
   c.innerHTML=`<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#1b2a6b" stroke="#7db2ff" stroke-width="3"/><text x="32" y="40" font-size="18" font-weight="900" text-anchor="middle" fill="#fff">×100</text></svg>`;
   A._ui.strikeCell(12,100);
   A._ui.quip('carpan');
 });
 await page.waitForTimeout(350);
 await page.screenshot({path:path.join(OUT,'dede-100x.png')});

 // ses kapali: balonda sabit replik, ses yok
 await page.evaluate(()=>{
   document.getElementById('voice').click(); // kapatir
 });
 await page.waitForTimeout(400);
 await page.screenshot({path:path.join(OUT,'dede-ses-kapali.png')});
 const balon=await page.evaluate(()=>document.getElementById('bubble').textContent);
 console.log('ses-kapali balon:',JSON.stringify(balon));

 // kazanc pozu (sinirli yuruyus)
 await page.evaluate(()=>{document.getElementById('voice').click();window.NPNG_CASINO._ui.dedePose('kazanc',3000);window.NPNG_CASINO._ui.quip('kazanc')});
 await page.waitForTimeout(600);
 await page.screenshot({path:path.join(OUT,'dede-kazanc.png')});

 // haftalik bonus butonu (demo mod: 7 gunluk kayit yok -> mesaj)
 await page.click('#weekly');
 await page.waitForTimeout(400);
 await page.screenshot({path:path.join(OUT,'dede-weekly.png')});

 console.log('kredi:',await page.evaluate(()=>window.NPNG_CASINO.getCredit()));
 console.log('hata sayisi:',errs.length);
 errs.slice(0,6).forEach(e=>console.log('HATA:',e));
 await browser.close();
 if(errs.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
