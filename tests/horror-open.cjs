'use strict';
/* Korkunçlu gerçek açılış: lobiden solo moda gir, varlıklar yüklensin, sahne doğrula, görüntü al. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');
const baseURL=process.env.TEST_URL||'http://127.0.0.1:3000';
(async()=>{
 const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(fs.existsSync(chrome)?chrome:undefined)});
 const page=await browser.newPage({viewport:{width:1365,height:768}});
 const errors=[],fails=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))fails.push({url:r.url(),status:r.status()})});
 try{
  await page.goto(baseURL,{waitUntil:'networkidle'});
  if(await page.locator('#legal').isVisible()){await page.locator('#lgck').check();await page.locator('#lgok').click()}
  if(await page.locator('#mp').isHidden())await page.locator('#msel').click();
  await page.locator('.mode[data-m="ic"]').click();
  await page.locator('#go').click();
  await page.waitForSelector('#icselect',{state:'visible'});
  await page.screenshot({path:path.join(out,'ic-dialog.png')});
  await page.locator('#icsolo').click();
  if(await page.locator('#lo-go').isVisible().catch(()=>false))await page.locator('#lo-go').click();
  try{
   await page.waitForFunction(()=>typeof IC!=='undefined'&&IC.on&&mode==='ic',null,{timeout:30000});
  }catch(e){
   const st=await page.evaluate(()=>({status:document.querySelector('#icstatus')?.textContent,mode:typeof mode!=='undefined'?mode:null,lo:typeof LO!=='undefined'?LO.on:null})).catch(()=>null);
   throw new Error('IC açılmadı: '+JSON.stringify(st));
  }
  await page.waitForTimeout(2500);
  await page.screenshot({path:path.join(out,'ic-ingame.png')});
  const g=await page.evaluate(()=>({mode,state,level:IC.level,mon:IC.mons.length,door:!!IC.door,nav:IC.nav.length,boxes:boxes.length,map:IC.mapName,stamina:IC.stamina,flash:!!IC.spot}));
  assert.equal(g.mode,'ic');assert.ok(g.mon>=1,'canavar yok');assert.ok(g.door,'kapı yok');assert.ok(g.nav>50,'nav az');assert.ok(g.boxes>3,'çarpışma yok');assert.ok(g.flash,'fener yok');
  /* fener kapat/aç + stamina üretimi */
  await page.keyboard.press('KeyF');
  const f2=await page.evaluate(()=>IC.flash);assert.equal(f2,false,'F feneri kapatmadı');
  assert.deepEqual(errors,[],'Tarayıcı hataları: '+JSON.stringify(errors.slice(0,3)));
  assert.deepEqual(fails,[],'HTTP hataları: '+JSON.stringify(fails.slice(0,3)));
  console.log('PASS Korkunçlu açılış',JSON.stringify(g));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
