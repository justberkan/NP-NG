'use strict';
const {app,BrowserWindow,Menu,ipcMain,session,dialog,powerSaveBlocker,shell,protocol}=require('electron');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const os=require('node:os');
const offline=require('./offline.cjs');
protocol.registerSchemesAsPrivileged([{scheme:'npng',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true,stream:true}}]);
let offlineProgress={state:'idle'};
function cacheProgress(p){offlineProgress=p;if(launcher&&!launcher.isDestroyed())launcher.webContents.send('npng:offline-status',p)}
const offlineHome=()=>app.getPath('userData');
let seedCapture=Promise.resolve();
function captureSeed(win){const task=seedCapture.catch(()=>{}).then(()=>captureSeedNow(win));seedCapture=task;return task}
async function captureSeedNow(win){if(!win||win.isDestroyed()||!/^https?:/.test(win.webContents.getURL()))return;try{const data=await win.webContents.executeJavaScript('(()=>{const o={};for(const k of '+JSON.stringify(offline.SEED_KEYS)+')o[k]=localStorage.getItem(k);if(new TextEncoder().encode(JSON.stringify(o)).length>2097152)throw Error("Seed too large");return o})()');await offline.saveSeed(offlineHome(),data)}catch(e){/* Untrusted/closing renderer: retain the last valid seed. */}}

const {settings,probe,startLocal}=require('./services.cjs');
const {PERFORMANCE_SWITCHES,performanceSwitches,gameURL,canNavigate,shortcut}=require('./policy.cjs');
const {spawn}=require('node:child_process');
/* Sunucu linki (SUNUCU.json) GitHub üzerinden paylaşılır. Token koda gömülmez;
   push yalnızca makinedeki git kimliği (credential manager) ile çalışır. */
const GH_RAW='https://raw.githubusercontent.com/justberkan/NP-NG/main/SUNUCU.json';
let ghUrl='',ghT=0,ghBusy=false;
async function ghFetch(){
 try{
  const r=await fetch(GH_RAW,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);
  const j=await r.json(),u=typeof j.url==='string'?j.url.trim():'';
  if(!/^https:\/\//.test(u)){ghUrl='';ghT=0;return{ok:true,url:'',t:0}}
  ghUrl=u;ghT=j.t|0;return{ok:true,url:u,t:ghT};
 }catch(e){return{ok:false,error:'GitHub’dan link okunamadı.'}}
}
function runGit(folder,args){
 return new Promise(resolve=>{
  const g=spawn('git',args,{cwd:folder,windowsHide:true});
  let out='';g.stdout.on('data',b=>out+=b);g.stderr.on('data',b=>out+=b);
  g.on('error',()=>resolve({ok:false,error:'git komutu bulunamadı.'}));
  g.on('exit',code=>resolve(code===0?{ok:true,out:out.trim()}:{ok:false,error:(out.trim()||'git çıkış kodu '+code).slice(0,220)}));
 })
}
async function ghPublish(url){
 if(ghBusy)return{ok:false,error:'Yayın işlemi sürüyor.'};
 const u=(url||'').trim();
 if(!/^https:\/\//.test(u))return{ok:false,error:'Geçerli bir https:// linki gir.'};
 const folder=readPreferences().localFolder;
 if(!folder||!fs.existsSync(path.join(folder,'server.js')))return{ok:false,error:'Önce oyun klasörünü seç (içinde server.js olan klasör).'};
 if(!fs.existsSync(path.join(folder,'.git')))return{ok:false,error:'Bu oyun klasörü GitHub’a bağlı değil; yayın yapılamaz.'};
 ghBusy=true;
 try{
  fs.writeFileSync(path.join(folder,'SUNUCU.json'),JSON.stringify({url:u,t:Date.now()})+'\n');
  const add=await runGit(folder,['add','SUNUCU.json']);if(!add.ok)return add;
  await runGit(folder,['commit','-m','Sunucu linki güncellendi [launcher]']);
  const push=await runGit(folder,['push']);if(!push.ok)return{ok:false,error:'GitHub’a gönderilemedi: '+(push.error||'')};
  ghUrl=u;ghT=Date.now();return{ok:true,url:u};
 }catch(e){return{ok:false,error:'Yayınlanamadı.'}}
 finally{ghBusy=false}
}
async function autoPublish(){
 try{
  const r=await fetch('http://127.0.0.1:3000/public-url.json',{signal:AbortSignal.timeout(3000)});
  if(!r.ok)return;const j=await r.json();
  if(!j.url||j.url===ghUrl)return;
  await ghPublish(j.url);
 }catch(e){}
}
// GPU ve zamanlama anahtarları Electron hazır olmadan eklenir.

app.setName('NPNG');
if(process.env.NPNG_USER_DATA)app.setPath('userData',path.resolve(process.env.NPNG_USER_DATA));
let startupVsync=false;try{startupVsync=JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'server.json'),'utf8')).vsync===true}catch(e){}
for(const name of performanceSwitches(startupVsync))app.commandLine.appendSwitch(name);
let sleepBlocker=null;
function stopSleepBlocker(){if(sleepBlocker!==null){powerSaveBlocker.stop(sleepBlocker);sleepBlocker=null}}
let launcher,game,quitting=false,connecting=false,gameOrigin='',lastError='',configuredSession;
const launcherFile=path.join(__dirname,'launcher/index.html'),launcherURL=pathToFileURL(launcherFile).href;
function defaultFolder(){const candidates=[path.resolve(__dirname,'..'),path.join(app.getPath('desktop'),'mmofps-online')];return candidates.find(folder=>fs.existsSync(path.join(folder,'server.js')))||''}
const preferences=()=>path.join(app.getPath('userData'),'server.json');
function readPreferences(){try{const o=JSON.parse(fs.readFileSync(preferences(),'utf8'));return{url:gameURL(o.url),...settings(o),localFolder:typeof o.localFolder==='string'&&o.localFolder?o.localFolder:defaultFolder()}}catch(e){return{url:'http://localhost:3000/',...settings(),localFolder:defaultFolder()}}}
function savePreferences(value){fs.mkdirSync(app.getPath('userData'),{recursive:true});const tmp=preferences()+'.tmp';fs.writeFileSync(tmp,JSON.stringify({...readPreferences(),...value},null,2));fs.renameSync(tmp,preferences());}
function showLauncher(error=''){
 lastError=error;if(!launcher||launcher.isDestroyed())makeLauncher();
 launcher.show();launcher.focus();launcher.webContents.send('npng:status',error);
}
function bindKeys(win){
 win.webContents.on('before-input-event',(event,input)=>{
  if(input.type!=='keyDown')return;const action=shortcut(input);
  if(action==='game')return;event.preventDefault();
  if(action==='fullscreen')win.setFullScreen(!win.isFullScreen());
  if(action==='reload')win.webContents.reload();
  if(action==='close')win.close();
 });
}
function makeLauncher(){
 launcher=new BrowserWindow({width:1180,height:820,minWidth:900,minHeight:720,show:false,title:'N.P.N.G. — Launcher',icon:path.join(__dirname,'build/icon.ico'),backgroundColor:'#0c1319',autoHideMenuBar:true,
  webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true,spellcheck:false}});
 launcher.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 launcher.webContents.on('will-navigate',(event,url)=>{if(url!==launcherURL)event.preventDefault()});
 launcher.webContents.on('will-attach-webview',event=>event.preventDefault());
 bindKeys(launcher);launcher.once('ready-to-show',()=>launcher.show());
 launcher.on('close',event=>{if(game&&!game.isDestroyed()&&!quitting){event.preventDefault();quitting=true;captureSeed(game).finally(()=>{if(game&&!game.isDestroyed())game.destroy();launcher.close()});return}quitting=true;});
 launcher.loadFile(launcherFile);
}
function permissions(gameSession){
 if(configuredSession===gameSession)return;configuredSession=gameSession;
 // Fare kilidi ve tam ekran yalnız seçilen oyuna; mikrofon isteği kullanıcıya sorulur.
 gameSession.setPermissionCheckHandler((contents,permission,origin)=>{
  const current=contents===game?.webContents&&canNavigate(contents.getURL(),gameOrigin)&&canNavigate(origin,gameOrigin);
  return !!current&&['pointerLock','fullscreen','clipboard-sanitized-write'].includes(permission);
 });
 gameSession.setPermissionRequestHandler(async(contents,permission,callback,details)=>{
  if(contents!==game?.webContents||!canNavigate(contents.getURL(),gameOrigin)||details?.requestingUrl&&!canNavigate(details.requestingUrl,gameOrigin)){callback(false);return}
  if(['pointerLock','fullscreen','clipboard-sanitized-write'].includes(permission)){callback(true);return}
  if(permission==='media'){
   if(!details?.mediaTypes?.includes('audio')||details.mediaTypes.includes('video')){callback(false);return}
   try{const result=await dialog.showMessageBox(game,{type:'question',title:'NPNG — Sesli sohbet',message:'Bu oyun mikrofonunu kullanmak istiyor.',detail:gameOrigin,buttons:['İzin verme','Mikrofona izin ver'],defaultId:0,cancelId:0});callback(result.response===1)}catch(e){callback(false)}return;
  }callback(false);
 });
 gameSession.on('will-download',event=>event.preventDefault());
}
async function connect(value,options,isOffline=false){
 if(connecting)return{ok:false,error:'Bağlantı zaten hazırlanıyor.'};
 let url;try{url=isOffline?'npng://game/index.html':gameURL(value)}catch(e){return{ok:false,error:e.message}}
 const opts=settings(options||readPreferences());
 connecting=true;gameOrigin=isOffline?'npng://game':new URL(url).origin;let win;
 try{
  if(game&&!game.isDestroyed())game.destroy();
  const gameSession=session.fromPartition('persist:npng-game');permissions(gameSession);
  win=new BrowserWindow({width:1440,height:900,minWidth:800,minHeight:600,show:false,fullscreen:opts.fullscreen,fullscreenable:true,title:isOffline?'N.P.N.G. — Çevrimdışı':'N.P.N.G. — No Pain No Gain',icon:path.join(__dirname,'build/icon.ico'),backgroundColor:'#080d13',autoHideMenuBar:true,
   webPreferences:{session:gameSession,contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true,backgroundThrottling:false,spellcheck:false,navigateOnDragDrop:false}});
  game=win;bindKeys(win);win.setMenuBarVisibility(false);
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-attach-webview',event=>event.preventDefault());
  win.webContents.on('will-navigate',(event,target)=>{if(!canNavigate(target,gameOrigin))event.preventDefault()});
  win.webContents.on('will-redirect',(event,target)=>{if(!canNavigate(target,gameOrigin))event.preventDefault()});
  win.webContents.on('page-title-updated',event=>{event.preventDefault();win.setTitle(isOffline?'N.P.N.G. — Çevrimdışı':'N.P.N.G. — No Pain No Gain')});
  win.webContents.on('render-process-gone',()=>{if(!quitting){if(!win.isDestroyed())win.destroy();showLauncher('Oyun görüntü işlemi kapandı. Yeniden bağlanabilirsin.')}});
  win.on('closed',()=>{if(game===win){stopSleepBlocker();game=null;if(!quitting)showLauncher()}});
  const timeout=new Promise((_,reject)=>{const timer=setTimeout(()=>reject(new Error('Sunucu 20 saniyede yanıt vermedi.')),20000);timer.unref();win.once('closed',()=>clearTimeout(timer));win.webContents.once('did-finish-load',()=>clearTimeout(timer))});
  if(isOffline){
   await win.loadURL('npng://game/__seed');const seed=await offline.readSeed(offlineHome());
   await win.webContents.executeJavaScript('localStorage.clear();for(const [k,v] of Object.entries('+JSON.stringify(seed)+'))localStorage.setItem(k,v);');
  }
  await Promise.race([win.loadURL(url),timeout]);
  if(!isOffline){
   let closing=false;const seedTimer=setInterval(()=>captureSeed(win),60000);seedTimer.unref();
   win.on('close',event=>{if(closing)return;event.preventDefault();closing=true;captureSeed(win).finally(()=>{if(!win.isDestroyed())win.close()})});
   win.once('closed',()=>clearInterval(seedTimer));
   await captureSeed(win);
   offline.sync(offlineHome(),url,cacheProgress).catch(()=>cacheProgress({state:'error'}));
  }
  if(!isOffline)savePreferences({url,...opts});if(opts.keepAwake)sleepBlocker=powerSaveBlocker.start('prevent-display-sleep');lastError='';win.show();win.focus();launcher.hide();return{ok:true};
 }catch(e){if(win&&!win.isDestroyed())win.destroy();const message='Sunucuya bağlanılamadı. Yerel sunucunun açık ve adresin doğru olduğunu kontrol et.';showLauncher(message);return{ok:false,error:message};
 }finally{connecting=false}
}
ipcMain.handle('npng:preferences',event=>{
 if(event.sender!==launcher?.webContents||event.senderFrame?.url!==launcherURL)throw new Error('İzin verilmeyen pencere');
 return{...readPreferences(),error:lastError,version:app.getVersion(),startupVsync};
});
ipcMain.handle('npng:connect',(event,url,options)=>{
 if(event.sender!==launcher?.webContents||event.senderFrame?.url!==launcherURL)throw new Error('İzin verilmeyen pencere');
 return connect(url,options);
});
function trusted(event){if(event.sender!==launcher?.webContents||event.senderFrame?.url!==launcherURL)throw new Error('İzin verilmeyen pencere')}
ipcMain.handle('npng:offline-status',async event=>{trusted(event);return {...await offline.status(offlineHome()),progress:offlineProgress}});
ipcMain.handle('npng:offline-play',async event=>{trusted(event);if(!(await offline.status(offlineHome())).available)return{ok:false,error:'Önce bir kez internetle bağlan.'};return connect('',readPreferences(),true)});
ipcMain.handle('npng:probe',async(event,url)=>{trusted(event);return probe(url)});
ipcMain.handle('npng:settings',(event,value)=>{trusted(event);const opts=settings(value);savePreferences(opts);return {...opts,restartRequired:opts.vsync!==startupVsync}});
async function diagnostics(){
 const gpu=await app.getGPUInfo('basic').catch(()=>({gpuDevice:[]}));
 return {created:new Date().toISOString(),launcher:app.getVersion(),electron:process.versions.electron,os:os.platform()+' '+os.release(),cpu:os.cpus()[0]?.model||'Bilinmiyor',ramGB:Math.round(os.totalmem()/1073741824),graphics:app.getGPUFeatureStatus(),adapters:(gpu.gpuDevice||[]).map(d=>({vendorId:d.vendorId,deviceId:d.deviceId,active:d.active})),switches:PERFORMANCE_SWITCHES.map(name=>({name,active:app.commandLine.hasSwitch(name)})),settings:settings(readPreferences())};
}
ipcMain.handle('npng:diagnostics',async event=>{trusted(event);return diagnostics()});
ipcMain.handle('npng:export',async event=>{trusted(event);const result=await dialog.showSaveDialog(launcher,{title:'Tanı raporunu kaydet',defaultPath:path.join(app.getPath('downloads'),'NPNG-Tani-Raporu.json'),filters:[{name:'JSON raporu',extensions:['json']}]});if(result.canceled)return{ok:false,canceled:true};try{fs.writeFileSync(result.filePath,JSON.stringify(await diagnostics(),null,2));shell.showItemInFolder(result.filePath);return{ok:true}}catch(e){return{ok:false,error:'Rapor kaydedilemedi.'}}});
ipcMain.handle('npng:folder',async event=>{trusted(event);const result=await dialog.showOpenDialog(launcher,{title:'server.js içeren NPNG oyun klasörünü seç',properties:['openDirectory']});if(result.canceled)return{ok:false,canceled:true};const folder=result.filePaths[0];if(!fs.existsSync(path.join(folder,'server.js')))return{ok:false,error:'Bu klasörde server.js bulunamadı.'};savePreferences({localFolder:folder});return{ok:true,folder}});
let startingLocal=false;
ipcMain.handle('npng:start-local',async event=>{
 trusted(event);if(startingLocal)return{ok:false,error:'Sunucu hazırlanıyor.'};startingLocal=true;
 try{
  return await startLocal({folder:readPreferences().localFolder,executable:process.execPath,log:path.join(app.getPath('userData'),'local-server.log')});
 }catch(e){return{ok:false,error:'Yerel sunucu başlatılamadı.'}}finally{startingLocal=false}
});
ipcMain.handle('npng:gh-fetch',async event=>{trusted(event);return ghFetch()});
ipcMain.handle('npng:gh-publish',async(event,url)=>{trusted(event);return ghPublish(url)});
if(!app.requestSingleInstanceLock())app.quit();else{
 app.on('second-instance',()=>{const w=game&&!game.isDestroyed()?game:launcher;if(w){if(w.isMinimized())w.restore();w.show();w.focus()}});
 app.whenReady().then(()=>{Menu.setApplicationMenu(null);const gs=session.fromPartition('persist:npng-game');gs.protocol.handle('npng',request=>offline.serve(offlineHome(),request));gs.webRequest.onBeforeRequest((details,callback)=>{callback({cancel:gameOrigin==='npng://game'&&/^(https?|wss?):/.test(details.url)})});makeLauncher();ghFetch().catch(()=>{});setInterval(()=>{autoPublish().catch(()=>{})},120000).unref?.()});
}
app.on('before-quit',()=>{quitting=true;stopSleepBlocker()});
app.on('window-all-closed',()=>app.quit());
