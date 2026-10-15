'use strict';
// Gerçek tarayıcıdaki oyun kodunu çalıştırır. Render zamanlaması test tarafından sürülür.
const {chromium} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const baseURL = process.env.TEST_URL || 'http://127.0.0.1:3000';
const output = path.resolve('test-results');
fs.mkdirSync(output, {recursive:true});

(async () => {
  const localChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const executablePath = process.env.CHROME_PATH || (fs.existsSync(localChrome) ? localChrome : undefined);
  const browser = await chromium.launch({headless:true, executablePath});
  const page = await browser.newPage({viewport:{width:1280,height:720}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto(baseURL, {waitUntil:'load'});
    await page.waitForFunction(() => typeof stepPlayer === 'function' && typeof tick === 'function');
    const results = await page.evaluate(() => {
      const originalPlayer = {...p};
      const originalBoxes = boxes.slice();
      const rows = [];
      const reset = (overrides={}) => {
        releaseInputs();
        for (const name of Object.keys(p)) delete p[name];
        Object.assign(p, originalPlayer, {x:0,y:0,z:20,vx:0,vy:0,vz:0,g:true,dead:0,st:ST}, overrides);
        boxes.splice(0, boxes.length, ...originalBoxes); BG=null;
        state='play'; mode='aim'; lobbyOn=false; timeLeft=10000;
        accP=0; hitStopT=0; slowT=0; jBuf=0; gr=null; grCd=0;
        SET.autoHop=true; AUTO.on=false; SK.dT=0; SK.chain=null;
        firing=false; ads=false; swU=-1; reload=0;
      };
      const frameRun = (fps, seconds, sample) => {
        for (let i=0;i<Math.round(fps*seconds);i++) { tick(1/fps); if(sample)sample(); }
      };
      const fixedRun = (seconds, sample) => {
        for(let i=0;i<Math.round(seconds/FIX_DT);i++){stepPlayer(FIX_DT);if(sample)sample();}
      };
      const measure = name => ({name,x:p.x,y:p.y,z:p.z,speed:Math.hypot(p.vx,p.vz),remaining:timeLeft});
      for(const fps of [30,60,120,144,240]) {
        reset();key.KeyW=1;frameRun(fps,2);rows.push({...measure('run'),fps});
        reset();SET.autoHop=false;jPress=true;jHeld=true;
        let apex=0,jumps=0,wasGround=p.g;
        frameRun(fps,2,()=>{apex=Math.max(apex,p.y);if(wasGround&&!p.g)jumps++;wasGround=p.g;});
        rows.push({...measure('jump'),fps,apex,jumps,grounded:p.g});
      }
      reset();key.KeyW=1;fixedRun(1);key.KeyW=0;key.KeyS=1;
      let stop=0;while(p.vz<0&&stop<1){stepPlayer(FIX_DT);stop+=FIX_DT;}
      rows.push({name:'counter-strafe',seconds:stop});
      for(const autoHop of [false,true]) {
        reset();SET.autoHop=autoHop;jHeld=true;jPress=true;
        let jumps=0,wasGround=p.g;fixedRun(3,()=>{if(wasGround&&!p.g)jumps++;wasGround=p.g;});
        rows.push({name:'autohop',autoHop,jumps});
      }
      reset({vx:20});jPress=true;stepPlayer(FIX_DT);rows.push(measure('jump-cap'));
      reset({y:8,g:false,vx:13.5});key.KeyD=1;
      let maxSpeed=0;fixedRun(.3,()=>{maxSpeed=Math.max(maxSpeed,Math.hypot(p.vx,p.vz));});
      rows.push({name:'air-cap',maxSpeed});
      reset();key.KeyW=1;key.KeyC=1;fixedRun(2);rows.push({...measure('crouch'),crouching:p.cr});
      reset({x:-18,z:-1.7});key.KeyW=1;jPress=true;jHeld=true;SET.autoHop=false;
      let maxHeight=0,climbed=false,landedOnTop=false,climbSeconds=null,elapsed=0;
      fixedRun(2,()=>{elapsed+=FIX_DT;maxHeight=Math.max(maxHeight,p.y);climbed=climbed||!!p.climb;
        if(p.g&&p.y===3){landedOnTop=true;if(climbSeconds===null)climbSeconds=elapsed;key.KeyW=0;jHeld=false;}
      });
      rows.push({...measure('climb'),maxHeight,climbed,landedOnTop,climbSeconds,grounded:p.g});
      reset({x:-18,z:-1.7,y:1,g:false,yaw:Math.PI/2});key.KeyW=1;jHeld=true;
      let wrongClimb=false;fixedRun(.5,()=>{wrongClimb=wrongClimb||!!p.climb;});
      rows.push({name:'climb-facing-away',climbed:wrongClimb});
      reset({x:-18,z:-2.15,y:3.2,g:false,vy:-1});fixedRun(.3);
      const landed=p.y;key.KeyS=1;fixedRun(.5);
      rows.push({...measure('edge-escape'),landed});
      reset({x:-6.9,z:-11,y:2,g:false,vz:-7.4});key.KeyA=1;
      let wallTime=0;fixedRun(.8,()=>{if(p.wr)wallTime+=FIX_DT;});
      rows.push({...measure('wallrun'),wallTime});
      reset();key.KeyW=1;jHeld=true;jPress=true;sPress=true;qPress=true;jBuf=.14;firing=true;ads=true;
      window.dispatchEvent(new Event('blur'));
      rows.push({name:'blur',key:key.KeyW,jHeld,jPress,sPress,qPress,jBuf,firing,ads});
      reset();tick(1);rows.push({name:'long-frame',simulated:10000-timeLeft,accumulator:accP});
      reset();state='pause';key.KeyW=1;tick(1);rows.push(measure('paused'));
      reset();state='menu';lobbyOn=true;
      return {build:document.body.innerText.match(/build [^\n]+/)?.[0],rows};
    });
    const checks=[];
    const check=(name,fn)=>{try{fn();checks.push({name,ok:true})}catch(e){checks.push({name,ok:false,error:e.message})}};
    const rows=results.rows, select=name=>rows.filter(r=>r.name===name);
    check('Tarayıcı çalışma hatası yok',()=>assert.deepEqual(errors,[]));
    check('Koşu hızı 5.25 m/s',()=>select('run').forEach(r=>assert.ok(Math.abs(r.speed-5.25)<.001,JSON.stringify(r))));
    check('30–240 FPS koşu farkı 0.1 mm altında',()=>assert.ok(Math.max(...select('run').map(r=>r.z))-Math.min(...select('run').map(r=>r.z))<.0001));
    check('30–240 FPS zıplama yüksekliği farkı 1 cm altında',()=>assert.ok(Math.max(...select('jump').map(r=>r.apex))-Math.min(...select('jump').map(r=>r.apex))<.01));
    check('Tek basışta tek zıplama ve yere iniş',()=>select('jump').forEach(r=>assert.ok(r.jumps===1&&r.grounded)));
    check('Karşı tuşla duruş 100 ms altında',()=>assert.ok(select('counter-strafe')[0].seconds<=.1));
    check('Otomatik bhop seçeneği',()=>{assert.equal(select('autohop')[0].jumps,1);assert.ok(select('autohop')[1].jumps>=3)});
    check('Zıplama anında hız sınırı 11.5',()=>assert.ok(select('jump-cap')[0].speed<=11.5+.0001));
    check('Hava strafe sınırı 13.5',()=>assert.ok(select('air-cap')[0].maxSpeed<=13.5+.0001));
    check('Çömelme hızı yarı yarıya',()=>assert.ok(Math.abs(select('crouch')[0].speed-2.625)<.001));
    check('3 metrelik kutunun üstüne tırmanıp basma',()=>{const r=select('climb')[0];assert.ok(r.climbed&&r.landedOnTop&&r.climbSeconds<1.5,JSON.stringify(r))});
    check('Duvara bakmadan tırmanmama',()=>assert.equal(select('climb-facing-away')[0].climbed,false));
    check('Kutu kenarına iniş ve çıkış',()=>{const r=select('edge-escape')[0];assert.equal(r.landed,3);assert.ok(r.z>-1.8,JSON.stringify(r))});
    check('Yan duvarda koşma',()=>assert.ok(select('wallrun')[0].wallTime>.2,JSON.stringify(select('wallrun')[0])));
    check('Odak kaybında tüm eylemler temizlenir',()=>{const r=select('blur')[0];for(const k of ['key','jHeld','jPress','sPress','qPress','jBuf','firing','ads'])assert.ok(!r[k],k+' basılı kaldı')});
    check('Uzun karede en fazla 8 fizik adımı',()=>assert.ok(select('long-frame')[0].simulated<=8/120+.0001));
    check('Duraklatıldığında fizik ilerlemez',()=>assert.equal(select('paused')[0].z,20));
    await page.screenshot({path:path.join(output,'movement-lobby.png')});
    const report={date:new Date().toISOString(),baseURL,...results,checks,errors};
    fs.writeFileSync(path.join(output,'movement.json'),JSON.stringify(report,null,2));
    for(const c of checks)console.log(`${c.ok?'PASS':'FAIL'} ${c.name}${c.error?' — '+c.error:''}`);
    console.log(JSON.stringify(results.rows,null,2));
    if(checks.some(c=>!c.ok))process.exitCode=1;
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
