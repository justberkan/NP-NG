'use strict';
// Real browser regression: role selection, full escort route, boundaries and repeat-play cleanup.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),net=require('node:net');
const {spawn}=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results/kbk-forest');
fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 let server,browser,data,url=process.env.TEST_URL;
 const results=[],check=(name,ok,detail)=>{results.push({name,ok,detail});console.log((ok?'PASS ':'FAIL ')+name,detail||'');assert.ok(ok,name)};
 try{
  if(!url){
   const port=await new Promise(r=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p))})});
   data=fs.mkdtempSync(path.join(os.tmpdir(),'npng-kbk-'));let log='';
   server=spawn(process.execPath,['server.js'],{cwd:root,windowsHide:true,env:{...process.env,PORT:String(port),MMOFPS_DATA:data}});
   server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b);
   for(let i=0;!log.includes('sunucusu çalışıyor');i++){if(i>160||server.exitCode!==null)throw Error(log);await sleep(50)}
   url='http://127.0.0.1:'+port;
  }
  const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(fs.existsSync(chrome)?chrome:undefined),args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('npng_legal_v1','1'));
  await page.goto(url);await page.waitForFunction(()=>typeof kbkOpen==='function');await page.waitForTimeout(2000);
  await page.evaluate(()=>{window.requestAnimationFrame=()=>0;kbkOpen(()=>{})});
  await page.fill('#kbkcode','ROOM42');await page.fill('#kbkpass','secret');
  await page.locator('[data-role=kbk]').click();
  check('Role selection retains room input',await page.inputValue('#kbkcode')==='ROOM42'&&await page.inputValue('#kbkpass')==='secret');
  check('Selected role is accessible',await page.locator('[data-role=kbk]').getAttribute('aria-pressed')==='true');
  check('Room password is masked',await page.locator('#kbkpass').getAttribute('type')==='password');
  await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'desktop.png')});
  await page.setViewportSize({width:390,height:844});
  check('Mobile layout fits width',await page.evaluate(()=>{const e=document.querySelector('#kbkselect .kbk-card');return e.scrollWidth<=e.clientWidth+1}));
  await page.locator('#kbksolo').scrollIntoViewIfNeeded();
  check('Mobile play button reachable',await page.locator('#kbksolo').isVisible());
  await page.screenshot({path:path.join(out,'mobile.png')});await page.setViewportSize({width:1365,height:900});
  const cycles=[];
  for(const role of ['guardian','kbk','wolf','wolf']){
   const r=await page.evaluate(role=>{
    if(KBK.on)toLobby();document.getElementById('kbkselect').style.display='none';
    KBK.net=false;KBK.role=role;KBK.chosen=true;KBK.id=0;KBK.host=0;KBK.peers.clear();
    selMode='kbk';loEnsure();loApply();startMatch();
    const before=KBK.kbkNpc&&{x:KBK.kbkNpc.x,z:KBK.kbkNpc.z};
    for(let i=0;i<120;i++)tick(1/60);
    const moved=before?Math.hypot(before.x-KBK.kbkNpc.x,before.z-KBK.kbkNpc.z):0;
    p.x=999;p.z=999;stepPlayer(1/120);
    const inside=Math.hypot(p.x,p.z)<=KBK_WORLD_R-3+.001,chosen=KBK.mine;
    const a=KBK.village,b=KBK.housePos,length=Math.hypot(b.x-a.x,b.z-a.z);
    const cps=KBK.checkpoints.map((c,i)=>{
     const along=((c.x-a.x)*(b.x-a.x)+(c.z-a.z)*(b.z-a.z))/(length*length);
     const cross=Math.abs((c.x-a.x)*(b.z-a.z)-(c.z-a.z)*(b.x-a.x))/length;
     return {along,cross};
    });
    p.x=a.x;p.z=a.z;p.y=0;
    cam.position.set(p.x+8,8,p.z+8);cam.lookAt(b.x,1,b.z);R.render(S,cam);
    return{image:R.domElement.toDataURL(),chosen,inside,cps,moved,geo:R.info.memory.geometries,draws:R.info.render.calls,triangles:R.info.render.triangles};
   },role);
   const png=r.image;delete r.image;
   check('Solo role '+role,r.chosen===role,r);
   check('Real WebGL scene renders',r.geo>10&&r.draws>5);
   check('Player cannot leave forest boundary',r.inside);
   check('Five checkpoints cover village-to-house route',r.cps.length===5&&r.cps.every((c,i)=>c.cross<.01&&c.along>0&&c.along<1&&(!i||c.along>r.cps[i-1].along))&&r.cps[0].along<.2&&r.cps[4].along>.8,r.cps);
   if(role==='wolf')check('VIP escort advances at bounded speed',r.moved>1&&r.moved<5);
   if(role==='guardian')fs.writeFileSync(path.join(out,'forest.png'),Buffer.from(png.split(',')[1],'base64'));
   cycles.push(r);
  }
  check('Repeated forest geometry stays bounded',cycles[3].geo<=cycles[2].geo+5,cycles.map(x=>x.geo));
  const restored=await page.evaluate(()=>{toLobby();return !KBK.on&&!KBK.group&&!KBK.route&&floor.position.y>-100});
  check('Leaving mode restores lobby and removes forest',restored);
  check('No browser errors',errors.length===0,errors);
 }finally{
  if(browser)await browser.close();
  if(server&&server.exitCode===null)await new Promise(r=>{server.once('exit',r);server.kill()});
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
  if(data&&path.dirname(data)===os.tmpdir()&&path.basename(data).startsWith('npng-kbk-'))fs.rmSync(data,{recursive:true,force:true});
 }
})().catch(e=>{console.error(e);process.exitCode=1});
