// Görsel doğrulama: casino/index.html'i gerçek Chrome'da aç, spin at,
// docs/casino/ altına ekran görüntüsü al. Gereksinim: playwright + Chrome.
// Kullanım: node tests/casino-ui.cjs
const path=require('path');
process.env.NODE_PATH=process.env.NPNG_PLAYWRIGHT_PATH||'C:\\Users\\berkan\\Desktop\\mmofps-online\\electron\\node_modules';
require('module').Module._initPaths();
const OUT=path.join(__dirname,'..','docs','casino');
fs_mkdir(OUT);
function fs_mkdir(p){require('fs').mkdirSync(p,{recursive:true})}
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:false,executablePath:process.env.CHROME_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errs=[];
 page.on('pageerror',e=>errs.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await page.goto('file:///'+path.join(__dirname,'..','casino','index.html').replace(/\\/g,'/'));
 await page.waitForTimeout(800);
 const api=await page.evaluate(()=>typeof window.NPNG_CASINO!=='undefined');
 const cells=await page.locator('#reels .cell').count();
 console.log('API mevcut:',api,'| hucre:',cells,'(beklenen 30)');
 await page.screenshot({path:path.join(OUT,'idle.png')});
 for(let i=0;i<3;i++){await page.click('#spin');await page.waitForTimeout(3200)}
 console.log('kredi:',await page.evaluate(()=>window.NPNG_CASINO.getCredit()));
 await page.screenshot({path:path.join(OUT,'after-spins.png')});
 await page.click('#turbo');
 for(let i=0;i<5;i++){await page.click('#spin');await page.waitForTimeout(1400)}
 await page.screenshot({path:path.join(OUT,'turbo.png')});
 // MEGA WIN katmanı (doğrudan tetikleyerek katmanın kendisini doğrula)
 await page.evaluate(()=>{
   document.getElementById('bw-title').textContent='MEGA WIN!';
   document.getElementById('bw-amt').textContent='₺78.500';
   document.getElementById('bigwin').classList.add('on');
 });
 await page.waitForTimeout(700);
 await page.screenshot({path:path.join(OUT,'bigwin.png')});
 console.log('hata sayisi:',errs.length);
 errs.slice(0,5).forEach(e=>console.log('HATA:',e));
 await browser.close();
 if(errs.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
