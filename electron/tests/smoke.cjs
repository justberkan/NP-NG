'use strict';
const {_electron}=require('playwright'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'npng-electron-'));
 const packaged=process.env.NPNG_EXE;
 const app=await _electron.launch({executablePath:packaged||path.join(root,'node_modules/electron/dist/electron.exe'),args:packaged?[]:[root],env:{...process.env,NPNG_USER_DATA:profile},timeout:30000});
 const checks=[];const check=x=>{checks.push(x);console.log("PASS",x.name)};
 try{
  const launcher=await app.firstWindow();await launcher.waitForSelector('#connect');
  await launcher.screenshot({path:path.join(out,packaged?'launcher-packaged.png':'launcher.png')});
  const flags=await app.evaluate(({app})=>['disable-frame-rate-limit','disable-gpu-vsync','force_high_performance_gpu','disable-background-timer-throttling','disable-renderer-backgrounding'].map(s=>[s,app.commandLine.hasSwitch(s)]));
  assert.ok(flags.every(s=>s[1]));check({name:'performance-switches',flags});
  await launcher.locator('[value=remote]').check();await launcher.locator('#address').fill('http://127.0.0.1:65534/');await launcher.locator('#connect').click();await launcher.waitForFunction(()=>document.querySelector('#status').textContent.includes('bağlanılamadı'));
  check({name:'unreachable-server',pass:true});
  await launcher.locator('#address').fill(process.env.TEST_URL||'http://127.0.0.1:3000/');
  const windowEvent=app.waitForEvent('window');await launcher.locator('#connect').click();const game=await windowEvent;
  const gameErrors=[];game.on('pageerror',e=>gameErrors.push(e.message));
  await game.waitForFunction(()=>typeof lobbyOn!=='undefined'&&lobbyOn,{},{timeout:30000});
  const isolation=await game.evaluate(()=>({require:typeof require,process:typeof process,bridge:typeof window.npngLauncher}));assert.deepEqual(isolation,{require:'undefined',process:'undefined',bridge:'undefined'});
  assert.ok(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().some(w=>w.isFullScreen())));check({name:'fullscreen-and-isolation',pass:true});
  const before=await game.evaluate(()=>location.href);await game.keyboard.press('Control+l');assert.equal(await game.evaluate(()=>location.href),before);assert.ok(!game.isClosed());
  const windows=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length);await game.evaluate(()=>window.open('https://example.com/'));await game.waitForTimeout(100);assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length),windows);check({name:'popup-blocked',pass:true});
  if(await game.locator('#legal').isVisible()){await game.locator('#lgck').check();await game.locator('#lgok').click()}
  await game.locator('#go').click();if(await game.locator('#lo-go').isVisible())await game.locator('#lo-go').click();
  await game.waitForFunction(()=>!lobbyOn&&state==='play');
  await game.locator('#c').click({position:{x:500,y:350},force:true});await game.waitForFunction(()=>!!document.pointerLockElement);
  check({name:'lobby-match-pointer-lock',pass:true});
  await game.screenshot({path:path.join(out,packaged?'match-packaged.png':'match.png')});
  await game.keyboard.press('Escape');
  // Electron'un native kısayol katmanı CDP klavyesi yerine sendInputEvent ile sınanır.
  await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().startsWith('http'));w.focus();w.webContents.sendInputEvent({type:'keyDown',keyCode:'F5'});w.webContents.sendInputEvent({type:'keyUp',keyCode:'F5'})});
  await game.waitForFunction(()=>typeof lobbyOn!=='undefined'&&lobbyOn,undefined,{polling:100});check({name:'reload',pass:true});
  const gameClosed=game.waitForEvent('close');
  await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().startsWith('http'));w.focus();w.webContents.sendInputEvent({type:'keyDown',keyCode:'W',modifiers:['control']})});
  await gameClosed;
  await launcher.waitForFunction(()=>!document.querySelector('#connect').disabled,undefined,{polling:100});assert.ok(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().some(w=>w.isVisible()&&w.webContents.getURL().startsWith('file:'))));
  check({name:'return-to-launcher',pass:true});
  const gpu=await app.evaluate(async({app})=>({status:app.getGPUFeatureStatus(),versions:process.versions}));
  fs.writeFileSync(path.join(out,packaged?'report-packaged.json':'report.json'),JSON.stringify({date:new Date().toISOString(),packaged:!!packaged,checks,gpu,gameErrors,hardwareFpsAcceptance:'Berkan kendi ekranda doğrulayacak; rAF sayısı FPS kabulü değildir.'},null,2));
  assert.deepEqual(gameErrors,[],'Oyun sayfasında çalışma hatası');
  console.log('PASS Electron: seçim, bağlantı hatası, lobi, maç, gerçek tam ekran, fare kilidi, kısayollar, izolasyon ve performans anahtarları');
 }finally{await app.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
