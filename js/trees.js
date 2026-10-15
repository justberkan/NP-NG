
'use strict';
/* ===== Uzun ağaçlar: kullanıcının GLB ağacı, bölgelere ayrılmış örneklemeli çizim ===== */
const TREEM={parts:null,failed:false,chunks:[],T:0};
const TREE_TINT=[[1,1,1],[1.25,1.0,.55],[.8,.95,1.15],[.85,1.0,.8],[.8,.74,.72]];
function owTreesInit(){
 if(!OW.trees||TREEM.started)return;TREEM.started=true;
 const done=ok=>{try{owTreesBuild(ok)}catch(e){console.warn('ağaçlar',e);owTreesBuild(false)}};
 const go=()=>{
  try{
   new THREE.GLTFLoader().parse(mdlB64(NPNG_G.tree),'',gl=>{
    try{
     gl.scene.updateMatrixWorld(true);
     const parts=[],mn=new THREE.Vector3(1e9,1e9,1e9),mx=new THREE.Vector3(-1e9,-1e9,-1e9),v=new THREE.Vector3();
     gl.scene.traverse(o=>{
      if(!o.isMesh)return;
      const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);
      const pa=g.attributes.position;for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i);mn.min(v);mx.max(v)}
      const m=o.material,leaf=/leave|leaf/i.test(m.name||'');
      if(m.map)m.map.encoding=THREE.sRGBEncoding;
      const nm=new THREE.MeshLambertMaterial({map:m.map||null,color:0xffffff,side:THREE.DoubleSide,alphaTest:leaf?.45:0,transparent:false});
      parts.push({g,m:nm});
     });
     const hgt=mx.y-mn.y,cx=(mn.x+mx.x)/2,cz=(mn.z+mx.z)/2;
     for(const q of parts){q.g.translate(-cx,-mn.y,-cz);q.g.scale(1/hgt,1/hgt,1/hgt)}
     TREEM.parts=parts;done(true);
    }catch(e){console.warn('ağaç modeli',e);done(false)}
   },e=>{console.warn('ağaç glb',e);done(false)});
  }catch(e){done(false)}
 };
 mdlScript('tree',ok=>ok?go():done(false));
}
function owTreesBuild(ok){
 const CS=120,groups=new Map();
 for(const t of OW.trees){const k=Math.floor(t.x/CS)+','+Math.floor(t.z/CS);(groups.get(k)||groups.set(k,[]).get(k)).push(t)}
 const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),P=new THREE.Vector3(),S3=new THREE.Vector3(),C=new THREE.Color(),Y=new THREE.Vector3(0,1,0);
 let fbG=null,fbMT=null,fbML=null;
 if(!ok){fbG=[new THREE.BoxBufferGeometry(1,1,1),new THREE.BoxBufferGeometry(1,1,1)];fbMT=new THREE.MeshLambertMaterial({color:0x6b4a2b});fbML=new THREE.MeshLambertMaterial({color:0x4aa044})}
 for(const [k,list] of groups){
  const grp=new THREE.Group();let cx=0,cz=0;
  const parts=ok?TREEM.parts.map(q=>({g:q.g,m:q.m})):[{g:fbG[0],m:fbMT,f:0},{g:fbG[1],m:fbML,f:1}];
  for(const q of parts){
   const im=new THREE.InstancedMesh(q.g,q.m,list.length);im.frustumCulled=false;
   list.forEach((t,i)=>{
    Q.setFromAxisAngle(Y,t.yaw);P.set(t.x,t.y,t.z);
    if(ok)S3.set(t.H,t.H,t.H);
    else if(q.f===0){S3.set(t.H*.08,t.H*.6,t.H*.08);P.y+=t.H*.3}
    else{S3.set(t.H*.34,t.H*.5,t.H*.34);P.y+=t.H*.7}
    M.compose(P,Q,S3);im.setMatrixAt(i,M);
    const c=TREE_TINT[t.bi]||TREE_TINT[0];im.setColorAt(i,C.setRGB(c[0],c[1],c[2]));
   });
   im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;
   grp.add(im);
  }
  for(const t of list){cx+=t.x;cz+=t.z}
  grp.userData.c=[cx/list.length,cz/list.length];
  OW.root.add(grp);TREEM.chunks.push(grp);
 }
 TREEM.ok=ok;owTreesCull();
}
function owTreesCull(){
 if(!TREEM.chunks.length)return;
 const px=p.x,pz=p.z;
 for(const g of TREEM.chunks){const c=g.userData.c;g.visible=Math.hypot(c[0]-px,c[1]-pz)<260}
}
setInterval(()=>{if(typeof OW!=='undefined'&&OW.on&&TREEM.chunks.length)owTreesCull()},400);
