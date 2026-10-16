'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');
const baseURL=process.env.TEST_URL||'http://127.0.0.1:3000';
fs.mkdirSync(out,{recursive:true});
(async()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const urls=['index.html',...Array.from(html.matchAll(/(?:src|href)="((?:js|css|lib|assets)\/[^"?]+)(?:\?[^" ]*)?"/g),m=>m[1])];
  for(const file of urls){
    const response=await fetch(`${baseURL}/${file}`);
    assert.equal(response.status,200,file);
    assert.ok(Buffer.from(await response.arrayBuffer()).equals(fs.readFileSync(path.join(root,file))),`${file}: HTTP içerik farklı`);
  }
  const versions=[...html.matchAll(/\?v=(\d+)/g)].map(m=>m[1]);
  const build=html.match(/build (\d+) · ([^<]+)/);
  assert.ok(build);assert.ok(versions.every(v=>v===build[1]),'Build ve önbellek sürümleri farklı');
  let syntaxCount=0;
  for(const dir of ['js','lib','assets'])for(const file of fs.readdirSync(path.join(root,dir))){
    if(!file.endsWith('.js'))continue;
    const r=spawnSync(process.execPath,['--check',path.join(root,dir,file)],{encoding:'utf8',windowsHide:true});
    assert.equal(r.status,0,`${dir}/${file}: ${r.stderr}`);syntaxCount++;
  }
  const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(fs.existsSync(chrome)?chrome:undefined)});
  const page=await browser.newPage({viewport:{width:1365,height:768}});
  const errors=[],failures=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))failures.push({url:r.url(),status:r.status()})});
  try{
    await page.goto(baseURL,{waitUntil:'networkidle'});
    await page.screenshot({path:path.join(out,'lobby.png')});
    // Mevcut loadout akışından gerçek düğmelerle geç; testte oyun işlevini değiştirme.
    // İlk açılış yasal bilgilendirmesi (yeni profilde her zaman çıkar)
    if(await page.locator('#legal').isVisible()){await page.locator('#lgck').check();await page.locator('#lgok').click()}
    await page.locator('#go').click();
    if(await page.locator('#lo-go').isVisible())await page.locator('#lo-go').click();
    await page.waitForFunction(()=>!lobbyOn&&mode==='aim');
    await page.waitForTimeout(600);
    await page.screenshot({path:path.join(out,'aim-training.png')});
    const game=await page.evaluate(()=>({mode,state,loadout:LO.on,weapon:wk,targets:T.filter(t=>t.visible).length,build:document.body.innerText.match(/build [^\n]+/)?.[0]}));
    assert.deepEqual(errors,[],'Tarayıcı hataları');assert.deepEqual(failures,[],'HTTP yükleme hataları');
    fs.writeFileSync(path.join(out,'smoke.json'),JSON.stringify({date:new Date().toISOString(),httpFiles:urls.length,syntaxCount,build:build[0],game,errors,failures},null,2));
    console.log(`PASS ${urls.length} HTTP dosyası birebir, ${syntaxCount} JS sözdizimi, lobi ve Aim Training açılışı`);
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
