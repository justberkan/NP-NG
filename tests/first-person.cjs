'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve('test-results/first-person');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(fs.existsSync(chrome)?chrome:undefined)});
 const page=await browser.newPage({viewport:{width:1365,height:768}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:3000');
  await page.evaluate(()=>{mode='aim';setLobby(false);LO.on=false;begin();state='play';fphLoad()});
  await page.waitForFunction(()=>FPH.ready);
  const rows=[];
  for(const weapon of ['rifle','smg','pistol','dual']){
   await page.evaluate(async k=>{await new Promise(r=>mdlLoad(mdlSpec(k,null).mid,r));LO.on=false;setW(k,true);swT=1},weapon);
   for(const [name,adsValue,rq]of [['hip',false,-1],['ads',true,-1],['reload',false,.72]]){
    const row=await page.evaluate(({adsValue,rq})=>{
     ads=adsValue;reload=rq<0?0:cw.rel*(1-rq);p.pitch=0;
     for(let i=0;i<60;i++)updPlayerView(1/60);
     cam.updateMatrixWorld();R.render(S,cam);
     const h=VM.h,W=h.W,fp=h.fph;h.aim.parent.updateWorldMatrix(true,true);
     const target=(W.gL).clone().applyMatrix4(W.g.matrixWorld);
     const left=W.g2?W.gR.clone().applyMatrix4(W.g2.matrixWorld):target;
     return {weapon:wk,ads:adsT,magVisible:W.mag?.visible,mag2Visible:W.mag2?.visible,leftVisible:fp.L.visible,rightVisible:fp.R.visible,
      rightError:fp.R.getWorldPosition(new THREE.Vector3()).distanceTo(W.gR.clone().applyMatrix4(W.g.matrixWorld)),
      leftError:fp.L.getWorldPosition(new THREE.Vector3()).distanceTo(left)};
    },{adsValue,rq});rows.push({name,...row});
    await page.screenshot({path:path.join(out,`${weapon}-${name}.png`)});
    if(rq<0){assert.ok(!row.magVisible&&!row.mag2Visible,`${weapon}: boşta fazla şarjör`);if(row.rightVisible)assert.ok(row.rightError<.001);if(row.leftVisible)assert.ok(row.leftError<.001)}
   }
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({date:new Date().toISOString(),rows,errors},null,2));
  assert.deepEqual(errors,[]);console.log(JSON.stringify(rows,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
