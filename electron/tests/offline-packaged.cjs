'use strict';
const {_electron}=require('playwright'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'test-results/v030');fs.mkdirSync(out,{recursive:true});
(async()=>{const home=fs.mkdtempSync(path.join(os.tmpdir(),'npng-v030-')),data=path.join(home,'server-data'),profile=path.join(home,'profile');let server,app;const errors=[],badRequests=[],results=[];let trackingOffline=false;
 const check=(name,ok,details)=>{results.push({name,ok,details});console.log((ok?'PASS ':'FAIL ')+name+(details?' '+JSON.stringify(details):''))};
 try{
  let log='';server=spawn(process.execPath,['server.js'],{cwd:root,windowsHide:true,env:{...process.env,PORT:'3400',MMOFPS_DATA:data}});server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b);const start=Date.now();while(!log.includes('sunucusu çalışıyor')){if(server.exitCode!==null||Date.now()-start>8000)throw Error(log);await new Promise(r=>setTimeout(r,25))}
  const exe=process.env.NPNG_EXE||path.join(root,'electron/dist/win-unpacked/NPNG.exe');assert(fs.existsSync(exe),'Packaged NPNG.exe missing');
  app=await _electron.launch({executablePath:exe,env:{...process.env,NPNG_USER_DATA:profile},args:['--use-gl=swiftshader','--enable-unsafe-swiftshader'],timeout:30000});
  app.on('window',p=>{p.on('pageerror',e=>{if(trackingOffline)errors.push(e.message)});p.on('requestfailed',r=>{if(trackingOffline&&!/^(wss?:)|\/api\//.test(r.url()))badRequests.push(r.url())});p.on('response',r=>{if(trackingOffline&&r.status()>=400&&!/\/api\//.test(r.url()))badRequests.push(r.status()+' '+r.url())})});
  const launcher=await app.firstWindow();await launcher.locator('#offline-play').waitFor();assert(await launcher.locator('#offline-play').isDisabled());await launcher.screenshot({path:path.join(out,'launcher-empty.png')});check('No copy: offline button disabled',true);
  const onlineEvent=app.waitForEvent('window');await launcher.evaluate(()=>window.npngLauncher.connect('http://127.0.0.1:3400/',{fullscreen:false,keepAwake:false}));let game=await onlineEvent;
  await game.waitForFunction(()=>typeof lobbyOn!=='undefined'&&lobbyOn,null,{timeout:30000});
  // Authentic storage formats, plus forbidden account credentials to prove separation.
  await game.evaluate(()=>{localStorage.setItem('npng_legal_v1','1');localStorage.setItem('npng_map','dust2');localStorage.setItem('mmofps_srv',JSON.stringify({token:'DO_NOT_COPY'}));localStorage.setItem('unexpected','DO_NOT_COPY')});
  await launcher.waitForFunction(async()=>{const s=await window.npngLauncher.offlineStatus();return s.available&&s.progress.state==='ready'},null,{timeout:120000});
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().startsWith('http:')).close());await launcher.waitForFunction(()=>!document.querySelector('#offline-play').disabled);
  await launcher.waitForFunction(async()=>{const p=await window.npngLauncher.preferences();return !p.error});await new Promise(r=>setTimeout(r,200));
  const seed=JSON.parse(fs.readFileSync(path.join(profile,'offline-seed.json'),'utf8'));check('Close captures only approved seed keys',seed.npng_map==='dust2'&&!JSON.stringify(seed).includes('DO_NOT_COPY'),Object.keys(seed));
  await new Promise(r=>{server.once('exit',r);server.kill()});server=null;
  // Real Electron session offline network emulation, server stopped; no system firewall changes.
  await app.evaluate(({session})=>session.fromPartition('persist:npng-game').enableNetworkEmulation({offline:true}));
  trackingOffline=true;const offlineEvent=app.waitForEvent('window');const opened=await launcher.evaluate(()=>window.npngLauncher.offlinePlay());check('Offline launch returns success',opened.ok,opened);game=await offlineEvent;
  await game.waitForFunction(()=>typeof lobbyOn!=='undefined'&&lobbyOn,null,{timeout:30000});await game.screenshot({path:path.join(out,'offline-lobby.png')});
  check('Offline origin and no account token',await game.evaluate(()=>location.href==='npng://game/index.html'&&!localStorage.getItem('mmofps_srv')));
  const security=await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().startsWith('npng:'));const p=w.webContents.getLastWebPreferences();return{sandbox:p.sandbox,isolation:p.contextIsolation,node:p.nodeIntegration,preload:p.preload,title:w.getTitle()}});check('Sandboxed offline window, no preload',security.sandbox&&security.isolation&&!security.node&&!security.preload&&security.title==='N.P.N.G. — Çevrimdışı',security);
  for(const md of ['aim','ow']){
   await game.evaluate(md=>{if(typeof legalAccept==='function')legalAccept();const el=document.getElementById('legal');if(el)el.style.display='none';selMode=md;startMatch()},md);
   await game.waitForFunction(md=>mode===md&&state==='play',md,{timeout:30000});await game.waitForTimeout(1500);if(md==='ow'&&await game.locator('#clsm.open').isVisible())await game.locator('#clsm .cc').first().click();await game.screenshot({path:path.join(out,'offline-'+md+'.png')});check('Offline '+md+' starts',true);await game.evaluate(()=>toLobby());
  }
  await game.evaluate(()=>view('casino'));if(await game.locator('#cgage').isVisible()){await game.locator('#cgage').check();await game.locator('#cgok').click()}await game.waitForFunction(()=>typeof CGD!=='undefined'&&CGD.api&&CGD.f.style.display==='block',null,{timeout:20000});await game.screenshot({path:path.join(out,'offline-casino.png')});
  const dede=await game.evaluate(()=>!!document.querySelector('iframe[src*="assets/casino/dede/"]'));check('Casino DEDE iframe exists in current main',dede);
  if(dede){const frame=game.frames().find(f=>f.url().includes('/assets/casino/dede/'));check('DEDE same-origin page loaded',!!frame&&await frame.locator('body').count()>0)}
  check('No page errors',errors.length===0,errors);check('No unexpected failed requests',badRequests.length===0,badRequests);
  await game.close();await launcher.screenshot({path:path.join(out,'launcher-cached.png')});
  await launcher.locator('[data-page=settings]').first().click();await launcher.locator('#vsync').check();await launcher.waitForFunction(()=>document.querySelector('#settings-status').textContent.includes('yeniden başlat'));await launcher.screenshot({path:path.join(out,'vsync-settings.png')});
  await app.close();app=null;
  app=await _electron.launch({executablePath:exe,env:{...process.env,NPNG_USER_DATA:profile},args:['--use-gl=swiftshader','--enable-unsafe-swiftshader'],timeout:30000});const restarted=await app.firstWindow();await restarted.locator('#offline-play').waitFor();
  const switches=await app.evaluate(({app})=>['disable-frame-rate-limit','disable-gpu-vsync','force_high_performance_gpu','disable-background-timer-throttling','disable-renderer-backgrounding'].map(n=>app.commandLine.hasSwitch(n)));
  check('VSync restart changes only two switches',JSON.stringify(switches)===JSON.stringify([false,false,true,true,true]),switches);
  check('Cache available after launcher restart',!(await restarted.locator('#offline-play').isDisabled()));
 }catch(e){check('Packaged integration completed',false,e.stack)}finally{if(app)await app.close();if(server&&server.exitCode===null)await new Promise(r=>{server.once('exit',r);server.kill()});fs.writeFileSync(path.join(out,'packaged.json'),JSON.stringify({results,profile},null,2));if(results.some(r=>!r.ok))process.exitCode=1}
})().catch(e=>{console.error(e);process.exitCode=1});
