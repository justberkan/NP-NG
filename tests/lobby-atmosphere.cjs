'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results','lobby-atmosphere');fs.mkdirSync(out,{recursive:true});
const context=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'js/lobby-atmosphere.js'),'utf8')+';globalThis.api=LobbyAtmosphere;',context);
const {sample,parts}=context.api;
assert.equal(parts(new Date('2026-12-31T21:15:00Z')).year,2027);assert.equal(parts(new Date('2026-12-31T21:15:00Z')).month,1);
for(const [month,season,weather] of [[1,'winter','snow'],[3,'spring','cloudy'],[6,'summer','clear'],[9,'autumn','rain'],[12,'winter','snow']]){
 const s=sample(new Date(`2026-${String(month).padStart(2,'0')}-15T09:00:00Z`));assert.equal(s.season,season);assert.equal(s.weather,weather);
}
assert.ok(sample(new Date('2026-06-21T09:00:00Z')).daylight>.95);assert.equal(sample(new Date('2026-06-21T21:00:00Z')).daylight,0);
assert.ok(sample(new Date('2026-06-21T03:00:00Z')).elevation>sample(new Date('2026-12-21T03:00:00Z')).elevation);
assert.equal(sample(new Date(),{season:'winter',weather:'rain',time:'night'}).daylight,0);
assert.equal(sample(new Date('2026-01-15T09:00:00Z'),{season:'invalid',weather:'invalid',time:'invalid'}).weather,'snow');
(async()=>{
 const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(fs.existsSync(chrome)?chrome:undefined)});
 const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];
 await page.route('**/favicon.ico',route=>route.fulfill({status:204,body:''}));
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text())});
 const base=process.env.TEST_URL||'http://127.0.0.1:3000';
 try{
  await page.goto(base,{waitUntil:'networkidle'});
  // İlk açılış yasal bilgilendirmesi (yeni profilde her zaman çıkar)
  if(await page.locator('#legal').isVisible()){await page.locator('#lgck').check();await page.locator('#lgok').click()}
  await page.waitForFunction(()=>LB.atmosphere.snapshot().monument==='ready'&&LB.atmosphere.snapshot().flag==='ready');
  const scenarios=[['summer-day',{season:'summer',time:'day',weather:'auto'}],['summer-sunset',{season:'summer',time:'sunset',weather:'clear'}],['winter-snow',{season:'winter',time:'day',weather:'auto'}],['autumn-rain',{season:'autumn',time:'day',weather:'auto'}],['night',{season:'summer',time:'night',weather:'clear'}]];
  const evidence=[];
  for(const [name,opts] of scenarios){
   await page.evaluate(o=>{SET.fx=2;LB.atmosphere.setOptions(o)},opts);await page.waitForTimeout(180);
   const s=await page.evaluate(()=>({snapshot:LB.atmosphere.snapshot(),calls:R.info.render.calls,triangles:R.info.render.triangles,programs:R.info.programs.length}));
   assert.equal(s.snapshot.monument,'ready');assert.equal(s.snapshot.flag,'ready');assert.equal(s.snapshot.errors.length,0);
   assert.equal(s.snapshot.snow,name==='winter-snow');assert.equal(s.snapshot.rain,name==='autumn-rain');
   if(name==='autumn-rain')assert.equal(s.snapshot.rainCount,650);if(name==='winter-snow')assert.equal(s.snapshot.snowCount,450);
   evidence.push({name,...s});await page.screenshot({path:path.join(out,name+'.png')});
  }
  // Kayıtlı seçenekler ve düşük efekt ayarı.
  await page.evaluate(()=>{SET.fx=0;LB.atmosphere.setOptions({season:'winter',weather:'snow',time:'day'})});await page.waitForTimeout(80);
  assert.equal(await page.evaluate(()=>LB.atmosphere.snapshot().snow),false);
  await page.reload({waitUntil:'networkidle'});assert.equal(await page.evaluate(()=>LB.atmosphere.snapshot().options.season),'winter');
  // Menü gerçek kontrollerle değişir ve kapalı lobi görünümünde kaybolur.
  await page.locator('.lobby-atmosphere summary').click();await page.locator('.lobby-atmosphere [name=weather]').selectOption('rain');
  assert.equal(await page.evaluate(()=>LB.atmosphere.snapshot().state.weather),'rain');
  await page.locator('.lobby-atmosphere button').click();assert.equal(await page.evaluate(()=>LB.atmosphere.snapshot().options.season),'auto');
  await page.evaluate(()=>{SET.shadow=true;SET.light=2;applyVideo();LB.atmosphere.setOptions({time:'day'})});await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>LS.getObjectByName('lobby-sunlight').castShadow),true);
  await page.evaluate(()=>{SET.shadow=false;applyVideo()});
  await page.evaluate(()=>lobbySetView('shop'));await page.waitForTimeout(80);assert.equal(await page.locator('.lobby-atmosphere').isVisible(),false);await page.evaluate(()=>lobbySetView('home'));
  await page.locator('.lobby-atmosphere summary').click();
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{SET.fx=2;LB.atmosphere.setOptions({season:'winter',time:'day'})});await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>LB.atmosphere.snapshot().snowCount),270);await page.screenshot({path:path.join(out,'mobile.png')});
  // Ağ/model hatası lobby açılışını engellemez; geometrik silüet kalır.
  await page.route('**/assets/lobby/anitkabir.glb',route=>route.abort());
  const expected=errors.length;await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>LB.atmosphere.snapshot().monument==='fallback');
  assert.equal(await page.evaluate(()=>LB.atmosphere.snapshot().flag),'ready');
  const unexpected=errors.slice(expected).filter(s=>!s.includes('ERR_FAILED'));assert.deepEqual(errors.slice(0,expected),[]);assert.deepEqual(unexpected,[]);
  await page.evaluate(()=>LB.atmosphere.dispose());assert.equal(await page.locator('.lobby-atmosphere').count(),0);assert.equal(await page.evaluate(()=>!!LS.getObjectByName('lobby-atmosphere')),false);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({date:new Date().toISOString(),evidence,errors:errors.slice(0,expected),fallback:true},null,2));
  console.log('PASS İstanbul takvimi, 4 mevsim, gün/gece, 5 görsel senaryo, kayıt/menü, mobil efekt bütçesi, model hata yedeği');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
