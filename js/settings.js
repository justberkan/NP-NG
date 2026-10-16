'use strict';
/* ===== Ayarlar: kayıtlı seçenekler + uygulayıcılar ===== */
const SETDEF={
 skipCrate:false,sens:1,adsSens:.8,touchSens:1,invY:false,fov:75,volume:1,
 xhStyle:'cross',xhColor:'',xhSize:9,xhThick:2,xhGap:4,xhDot:false,xhOutline:true,
 opticSize:.85,dotSize:1,adsZoom:.5,autoHop:true,
 preset:'mid',res:100,fpsShow:false,fpsCap:0,light:2,shadow:false,fog:2,fx:2,aa:false,autoPol:1,grip:0
};
const SET=Object.assign({},SETDEF);
try{Object.assign(SET,JSON.parse(localStorage.getItem('mmofps_set'))||{})}catch(e){}
SET.fov=+SET.fov||baseFov;baseFov=SET.fov;
function saveSet(){try{localStorage.setItem('mmofps_set',JSON.stringify(SET));localStorage.setItem('mmofps_fov',SET.fov)}catch(e){}}

const PRESETS={
 low:{res:50,light:0,shadow:false,fog:0,fx:0},
 mid:{res:85,light:1,shadow:false,fog:1,fx:1},
 high:{res:100,light:2,shadow:true,fog:2,fx:2},
 ultra:{res:25,light:0,shadow:false,fog:0,fx:0}
};
const FOGFAR=[0,70,110,170],OWFOG=[0,110,170,260],HEMI=S.children.find(o=>o.isHemisphereLight);
function pixelRatio(){return Math.max(.25,Math.min(devicePixelRatio,1.5)*SET.res/100)}

function applyVideo(){
 baseFov=SET.fov;
 R.setPixelRatio(pixelRatio());
 /* ışık */
 const ow0=typeof OW!=='undefined'&&OW.on;
 if(HEMI)HEMI.intensity=SET.light===0?(ow0?1.2:1.45):(ow0?.8:1.05);
 sun.visible=SET.light>0;
 sun.intensity=SET.light===2?(ow0?.55:.7):(ow0?.4:.5);
 /* gölge */
 const ow=typeof OW!=='undefined'&&OW.on;
 const sh=!!SET.shadow&&SET.light>0&&!ow;
 if(R.shadowMap.enabled!==sh){
  R.shadowMap.enabled=sh;R.shadowMap.type=THREE.PCFShadowMap;
  sun.castShadow=sh;
  if(sh){const c=sun.shadow.camera;c.left=-34;c.right=34;c.top=34;c.bottom=-34;c.near=1;c.far=70;c.updateProjectionMatrix();sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.0006}
  floor.receiveShadow=sh;boxMeshes.forEach(m=>{m.castShadow=sh;m.receiveShadow=sh});
  S.traverse(o=>{if(o.isMesh)o.castShadow=sh;if(o.material)o.material.needsUpdate=true});
 }
 /* sis ve çizim mesafesi */
 const f=SET.fog,FF=ow?OWFOG:FOGFAR;
 S.fog.near=f===0?400:ow?FF[f]*.35:25;S.fog.far=f===0?500:FF[f];
 cam.far=f===0?(ow?170:200):Math.max(100,FF[f]+(ow?50:30));cam.updateProjectionMatrix();
 const fp=$('fps');if(fp)fp.classList.toggle('off',!SET.fpsShow);
}
function setShadow(obj){if(R.shadowMap.enabled)obj.traverse(o=>{if(o.isMesh)o.castShadow=true})}

/* ----- Nişangah ----- */
function xhHTML(){return '<i class="xa"></i><i class="xb"></i><i class="xc"></i><i class="xd"></i><b></b>'}
function crosshairVars(el){
 if(SET.xhColor)el.style.setProperty('--xu',SET.xhColor);else el.style.removeProperty('--xu');
 el.style.setProperty('--xl',SET.xhSize+'px');
 el.style.setProperty('--xt',SET.xhThick+'px');
 el.style.setProperty('--xg',SET.xhGap+'px');
 el.dataset.style=SET.xhStyle;
 el.classList.toggle('dot',!!SET.xhDot||SET.xhStyle==='dot');
 el.classList.toggle('ol',!!SET.xhOutline);
}
function applyCrosshair(){
 const ch=$('ch');if(!ch.firstChild)ch.innerHTML=xhHTML();
 crosshairVars(ch);
 const pv=$('xhprev');if(pv){if(!pv.firstChild)pv.innerHTML=xhHTML();crosshairVars(pv)}
}
function applyAll(){applyVideo();applyCrosshair()}

/* ----- FPS göstergesi ve sınırı ----- */
let fpsN=0,fpsT=0,fpsLast=0;
function fpsTick(now){
 fpsN++;
 if(now-fpsT>=500){
  const f=Math.round(fpsN*1000/(now-fpsT));fpsN=0;fpsT=now;
  const e=$('fps');if(e&&SET.fpsShow)e.textContent=f+' FPS';
 }
}
function fpsSkip(now){
 if(!SET.fpsCap)return false;
 if(now-fpsLast<1000/SET.fpsCap-2)return true;
 fpsLast=now;return false;
}
