'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve('test-results');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(fs.existsSync(chrome)?chrome:undefined)});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:3000');await page.waitForFunction(()=>GLBR.ready);
  const results=await page.evaluate(async()=>{
   const entries=[...['rifle','smg','pistol','dual'].map(cls=>({cls,id:null,n:'Varsayılan '+cls})),...WMOD.filter(m=>['rifle','smg','pistol'].includes(m.cls))];
   const rows=[],failures=[],unresolved=[];
   const h=mkHuman(CHAR('c1'),false);LS.add(h.root);h.root.position.set(0,0,0);h.root.rotation.y=0;
   const pose=(ads=0,pitch=0,rq=-1)=>{for(let i=0;i<3;i++)animHuman(h,{t:0,speed:0,ads,pitch,rq,sw:1},1/60);h.root.updateWorldMatrix(true,true)};
   const error=(side,target,gun)=>{
    const palm=h.gd.PF.palm[side].clone().applyMatrix4(h.gd.t['ha'+side].b.matrixWorld);
    return palm.distanceTo(target.clone().applyMatrix4(gun.matrixWorld));
   };
   for(const entry of entries){
    const sp=mdlSpec(entry.cls,entry.id);await new Promise(r=>mdlLoad(sp.mid,r));
    if(!MDL.cache[sp.mid]){failures.push({id:entry.id,reason:'Model yüklenemedi'});continue}
    holderSet(h,entry.cls,null,entry.id);
    const W=h.W,G=mdlGrips(sp.mid,entry.cls==='dual'?'pistol':entry.cls);
    const row={id:entry.id||entry.cls,name:entry.n,model:sp.mid,confidence:G.conf,magazine:W.magStatus,poses:[]};
    for(const [name,ads,pitch]of [['hip',0,0],['ads',1,0],['down',0,-.9],['up',1,.9]]){
     pose(ads,pitch);
     const r=error('R',W.gR,W.g),l=error('L',W.g2?W.gR:W.gL,W.g2||W.g);
     row.poses.push({name,rightError:r,leftError:l});
     if(r>.005||l>.005)failures.push({id:row.id,pose:name,rightError:r,leftError:l});
     if(W.mag?.visible||W.mag2?.visible)failures.push({id:row.id,pose:name,reason:'Boşta ikinci şarjör görünür'});
    }
    if(G.conf<.5||W.magStatus!=='geometry')unresolved.push({id:row.id,name:row.name,confidence:G.conf,magazine:W.magStatus,reason:G.why});
    if(W.nativeMag){
     for(const q of [.1,.2,.3,.41,.55,.7,.84,.94,1]){
      pose(0,0,q);
      if(W.nativeMag.visible&&W.mag?.visible)failures.push({id:row.id,q,reason:'İki şarjör aynı anda görünür'});
      if(W.nativeMag2?.visible&&W.mag2?.visible)failures.push({id:row.id,q,reason:'İkinci elde iki şarjör görünür'});
      if(W.mag?.visible&&!Number.isFinite(W.mag.getWorldPosition(new THREE.Vector3()).length()))failures.push({id:row.id,q,reason:'Şarjör konumu geçersiz'});
     }
     pose();if(!W.nativeMag.visible)failures.push({id:row.id,reason:'Değişim sonrası şarjör yerine gelmedi'});
    }
    rows.push(row);
   }
   return {rows,failures,unresolved,build:document.body.innerText.match(/build [^\n]+/)?.[0]};
  });
  fs.writeFileSync(path.join(out,'weapons.json'),JSON.stringify({date:new Date().toISOString(),...results,errors},null,2));
  console.log(`Silah: ${results.rows.length}, poz: ${results.rows.length*4}, hata: ${results.failures.length}, ayrı inceleme: ${results.unresolved.length}`);
  console.log(JSON.stringify({failures:results.failures,unresolved:results.unresolved},null,2));
  assert.deepEqual(errors,[]);assert.deepEqual(results.failures,[]);
 }finally{await browser.close()}
})().catch(e=>{console.error(e.message);process.exitCode=1});
