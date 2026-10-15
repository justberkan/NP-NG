/* ---------- Parmak pozları (soldat GLB eli): işaret parmağı tetikte, diğerleri kabzada, sol el tutamakta ---------- */
/* Eğilme ekseni elle yazılmadı: her el için ilk kullanımda 6 yönü dener, parmak ucunu avuca en çok yaklaştıran eksen "kapanma" ekseni seçilir. */
const FNG_N={idx:'Index',mid:'Mid',ring:'Ring',pinky:'Pinky',thumb:'Thumb'};
const FNG_POSE={
 /* sağ el: kabzayı sarar, işaret parmağı tetikte (hafif bükük) */
 rGun:{idx:[.3,.4,.3],mid:[1.05,1.25,.95],ring:[1.15,1.3,.95],pinky:[1.2,1.3,.95],thumb:[.25,.55,.35]},
 /* sol el: ön kundağı alttan sarar */
 lGrip:{idx:[.85,1.1,.8],mid:[1,1.2,.9],ring:[1.1,1.25,.9],pinky:[1.15,1.25,.9],thumb:[.3,.4,.25]},
 /* yumruk (kılıç/bıçak sapı) */
 fist:{idx:[1.1,1.3,.9],mid:[1.15,1.3,.9],ring:[1.2,1.3,.9],pinky:[1.25,1.3,.9],thumb:[.5,.6,.4]},
 /* boş el: rahat, hafif kıvrık */
 free:{idx:[.25,.3,.25],mid:[.35,.4,.3],ring:[.45,.45,.3],pinky:[.55,.5,.3],thumb:[.15,.2,.15]}
};
const _fq=new THREE.Quaternion(),_fv=new THREE.Vector3(),_fp=new THREE.Vector3();
const _FAX=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].map(a=>new THREE.Vector3(...a));
function fngInit(h){
 const d=h.gd;if(d.fg)return d.fg;
 const fg=d.fg={};
 for(const s of['R','L']){
  const ha=d.t['ha'+s].b,o={Q0:{},ch:{},ax:{}};
  ha.updateWorldMatrix(true,true);
  for(const k in FNG_N){
   const b=[1,2,3].map(i=>{let r=null;ha.traverse(x=>{if(x.name&&x.name.indexOf('CC_Base_'+s+'_'+FNG_N[k]+i+'_')===0)r=x});return r});
   if(b.some(x=>!x)){o.ch[k]=null;continue}
   o.ch[k]=b;b.forEach(x=>o.Q0[x.uuid]=x.quaternion.clone());
   // eğilme ekseni
   _fp.copy(d.PF.palm[s]);ha.localToWorld(_fp);
   let best=1e9,bi=0;
   for(let i=0;i<6;i++){
    const q0=b[1].quaternion.clone();
    b[1].quaternion.multiply(_fq.setFromAxisAngle(_FAX[i],.9));b[1].updateWorldMatrix(true,true);
    _fv.setFromMatrixPosition(b[2].matrixWorld);const dd=_fv.distanceTo(_fp);
    if(dd<best){best=dd;bi=i}
    b[1].quaternion.copy(q0);b[1].updateWorldMatrix(true,true);
   }
   o.ax[k]=_FAX[bi].clone();
  }
  fg[s]=o;
 }
 return fg;
}
function fngApply(h,s,pose){
 const o=h.gd.fg[s];
 for(const k in FNG_N){
  const b=o.ch[k];if(!b)continue;
  const a=pose[k];
  for(let i=0;i<3;i++){
   b[i].quaternion.copy(o.Q0[b[i].uuid]).multiply(_fq.setFromAxisAngle(o.ax[k],a[i]));
  }
 }
}
function fngSync(h){
 const d=h.gd;if(!d)return;
 try{fngInit(h)}catch(e){d.fg=null;return}
 const W=h.W,hasW=!!W&&!((h.freeW||0)>.5);
 let pr=FNG_POSE.free,pl=FNG_POSE.free;
 if(hasW){
  const mel=!!(WP[h.wk]&&WP[h.wk].melee);
  pr=mel?FNG_POSE.fist:FNG_POSE.rGun;
  const two=!!W.g2||(typeof P!=='undefined'&&P.lhOn);
  if(two)pl=mel?FNG_POSE.fist:(W.g2?FNG_POSE.rGun:FNG_POSE.lGrip);
  else if(mel&&W.g2)pl=FNG_POSE.fist;
  if(h.holdingMag)pl=FNG_POSE.lGrip;
 }
 fngApply(h,'R',pr);fngApply(h,'L',pl);
}
const _animHuman1=animHuman;
animHuman=function(h,c,dt){
 _animHuman1(h,c,dt);
 if(h.gd&&h.root.visible!==false)fngSync(h);
};
