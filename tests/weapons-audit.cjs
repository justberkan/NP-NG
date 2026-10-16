'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const output=path.resolve('test-results/weapons');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(fs.existsSync(chrome)?chrome:undefined)});
 const page=await browser.newPage({viewport:{width:1200,height:900}});
 try{
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0});
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:3000');
  await page.waitForFunction(()=>GLBR.ready);
  await page.evaluate(()=>LS.add(new THREE.HemisphereLight(0xffffff,0x777777,.5)));
  const results=[];
  const entries=process.env.AUDIT_MODELS?process.env.AUDIT_MODELS.split(',').map(id=>({weapon:'rifle',id,label:id})):['rifle','smg','pistol','dual'].map(weapon=>({weapon,id:null,label:weapon}));
  for(const {weapon,id,label} of entries){
   await page.evaluate(async ({k,id})=>{
    const sp=mdlSpec(k,id);await new Promise(r=>mdlLoad(sp.mid,r));
    SV.eq.c='c1';SV.eq.w=k;lobbyRefresh();
    const h=LB.slots.find(s=>s.d.me).rig;
    holderSet(h,k,null,id);
    h.root.position.set(0,0,0);h.root.rotation.y=0;
    window.auditRig=h;
    for(let i=0;i<10;i++)animHuman(h,{t:0,speed:0,ads:0,rq:-1,sw:1},1/60);
    document.getElementById('lb').style.display='none';document.getElementById('nts').style.display='none';
   },{k:weapon,id});
   const data=await page.evaluate(()=>{
    const h=auditRig,W=h.W;h.root.updateWorldMatrix(true,true);
    const vec=v=>v.toArray().map(n=>+n.toFixed(5));
    const palm=side=>h.gd.PF.palm[side].clone().applyMatrix4(h.gd.t['ha'+side].b.matrixWorld);
    const targetR=W.gR.clone().applyMatrix4(W.g.matrixWorld),targetL=(W.g2?W.gR:W.gL).clone().applyMatrix4((W.g2||W.g).matrixWorld);
    const meshes=[];W.g.traverse(o=>{if(o.isMesh){const b=new THREE.Box3().setFromObject(o);meshes.push({name:o.name,center:vec(b.getCenter(new THREE.Vector3())),size:vec(b.getSize(new THREE.Vector3()))})}});
    return {weapon:h.wk,model:mdlSpec(h.wk,h.mid).mid,magVisible:W.mag?.visible,mag2Visible:W.mag2?.visible,magPosition:W.mag?vec(W.mag.getWorldPosition(new THREE.Vector3())):null,rightError:palm('R').distanceTo(targetR),leftError:palm('L').distanceTo(targetL),targetR:vec(targetR),palmR:vec(palm('R')),targetL:vec(targetL),palmL:vec(palm('L')),meshes};
   });results.push(data);
   for(const [label,pos]of [['front',[0,1.45,2.3]],['side',[2.3,1.4,.1]],['top',[0,3,.4]]]){
    await page.evaluate(pos=>{LC.position.set(...pos);LC.lookAt(0,1.3,.1);LC.updateMatrixWorld();R.render(LS,LC)},pos);
    await page.screenshot({path:path.join(output,`${id||weapon}-${label}.png`)});
   }
   for(const [state,ads,pitch,rq]of [['ads',1,0,-1],['down',0,-.9,-1],['reload-out',0,0,.25],['reload-in',0,0,.72]]){
    const metric=await page.evaluate(({ads,pitch,rq})=>{
     const h=auditRig;for(let i=0;i<3;i++)animHuman(h,{t:0,speed:0,ads,pitch,rq,sw:1},1/60);
     h.root.updateWorldMatrix(true,true);LC.position.set(2.3,1.4,.1);LC.lookAt(0,1.3,.1);LC.updateMatrixWorld();R.render(LS,LC);
     const palm=h.gd.PF.palm.L.clone().applyMatrix4(h.gd.t.haL.b.matrixWorld);
     return {magVisible:h.W.mag?.visible,nativeVisible:h.W.nativeMag?.visible,palmToMag:h.W.mag?palm.distanceTo(h.W.mag.getWorldPosition(new THREE.Vector3())):null};
    },{ads,pitch,rq});
    data[state]=metric;
    await page.screenshot({path:path.join(output,`${id||weapon}-${state}.png`)});
   }
  }
  fs.writeFileSync(path.join(output,'audit.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify(results.map(({meshes,...r})=>({...r,meshCount:meshes.length})),null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
