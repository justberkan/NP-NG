'use strict';
/* Road remains flat for the current vehicle physics. Hills/decor live outside
   the driveable ribbon. Repeated scenery uses instancing; no extra shadow lights. */
const RaceWorld=(()=>{
 function random(seed){let n=seed;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
 function clear(tr,x,z,radius){for(let i=0;i<tr.M;i+=4){const q=tr.samples[i];if(Math.hypot(q.x-x,q.z-z)<tr.halfW+radius)return false}return true}
 function batch(grp,geometry,items,base){
  if(!items.length){geometry.dispose();return null}const material=new THREE.MeshLambertMaterial({color:base||0xffffff}),mesh=new THREE.InstancedMesh(geometry,material,items.length),dummy=new THREE.Object3D();
  items.forEach((o,i)=>{dummy.position.set(o.x,o.y,o.z);dummy.rotation.set(0,o.yaw||0,0);dummy.scale.set(o.sx||1,o.sy||1,o.sz||1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(o.color)mesh.setColorAt(i,new THREE.Color(o.color))});mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;grp.add(mesh);return mesh;
 }
 function sign(text,w,h,color){
  let map=null;if(typeof document!=='undefined'){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');if(c){c.fillStyle=color||'#063f65';c.fillRect(0,0,512,128);c.strokeStyle='#41d6ff';c.lineWidth=8;c.strokeRect(4,4,504,120);c.fillStyle='#fff';c.font='bold 58px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,66);map=new THREE.CanvasTexture(canvas);map.userData={raceOwned:true}}}
  return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,color:map?0xffffff:0x36bfe3,side:THREE.DoubleSide}));
 }
 function station(tr,grp){
  let chosen=null;
  for(const f of [.18,.32,.65,.82]){const q=tr.samples[Math.floor(f*tr.M)];for(const side of [-1,1]){const x=q.x+q.rx*side*57,z=q.z+q.rz*side*57;if(clear(tr,x,z,34)){chosen={x,z,q};break}}if(chosen)break}
  if(!chosen)return null;
  const g=new THREE.Group();g.name='N-Petrol';g.position.set(chosen.x,0,chosen.z);g.rotation.y=Math.atan2(chosen.q.tx,chosen.q.tz);grp.add(g);
  const parts=[],add=(w,h,d,x,y,z,c)=>parts.push({w,h,d,x,y,z,c});
  add(39,.12,49,0,.0,0,0x59616a);add(23,5.4,9,0,2.7,-18,0xd5d9cd);add(24,.5,10,0,5.6,-18,0x0b6086);
  add(17,.55,17,0,5.8,0,0xe1e7e8);add(17,.24,17,0,5.45,0,0x1677a3);
  for(const x of [-7,7])for(const z of [-6,6])add(.36,5.4,.36,x,2.7,z,0xd7e1e8);
  for(const x of [-4.6,4.6])for(const z of [-3.5,3.5]){add(1.25,1.7,.8,x,.9,z,0xe5edf0);add(1.26,.7,.82,x,1.15,z,0x0b6f9e);add(.85,.36,.84,x,1.5,z,0x122d40)}
  for(const x of [-7,0,7])add(5.5,2.8,.15,x,2.8,-13.4,0x14394c);
  add(1.0,10,1.0,16,5,9,0xc9d7df);add(6.0,3.8,.6,16,8.1,9,0x0b6086);
  for(const x of [-14,14])for(const z of [-18,-8,2,12])add(.14,.02,7,x,.09,z,0xe5e2cd);
  g.add(mergeBoxes(parts));const name=sign('N·PETROL',9,1.8);name.position.set(0,6.0,8.55);g.add(name);const market=sign('MARKET',8,1.2);market.position.set(0,4.5,-13.38);g.add(market);
  return chosen;
 }
 function build(tr,grp){
  const rand=random(1803),extent=Math.max(...tr.samples.map(p=>Math.max(Math.abs(p.x),Math.abs(p.z)))),fuel=station(tr,grp),trunks=[],crowns=[],rocks=[],hills=[],posts=[],heads=[];
  for(let i=0;i<20;i++){const a=i/20*Math.PI*2,r=extent+95+rand()*100,x=Math.sin(a)*r,z=Math.cos(a)*r,sx=30+rand()*45,sy=15+rand()*34,sz=25+rand()*40;
   if(clear(tr,x,z,Math.max(sx,sz)+12))hills.push({x,y:-sy*.25,z,sx,sy,sz,color:i%3?0x527358:0x687f65})
  }
  for(let attempt=0;attempt<1600&&trunks.length<150;attempt++){
   const x=(rand()-.5)*(extent*2+140),z=(rand()-.5)*(extent*2+140);if(!clear(tr,x,z,9)||fuel&&Math.hypot(x-fuel.x,z-fuel.z)<36)continue;
   const h=4+rand()*5;trunks.push({x,y:h*.30,z,sx:.22,sy:h*.62,sz:.22});crowns.push({x,y:h*.75,z,sx:1.8+rand(),sy:h*.70,sz:1.8+rand(),color:rand()>.5?0x2c634b:0x477b50});
  }
  for(let attempt=0;attempt<500&&rocks.length<55;attempt++){const x=(rand()-.5)*(extent*2+100),z=(rand()-.5)*(extent*2+100);if(!clear(tr,x,z,7)||fuel&&Math.hypot(x-fuel.x,z-fuel.z)<34)continue;rocks.push({x,y:.4,z,sx:1+rand()*2.8,sy:1+rand()*1.5,sz:1+rand()*2,yaw:rand()*6.28,color:0x7b8582})}
  const count=Math.ceil(tr.L/65);for(let i=0;i<count;i++){const q=tr.samples[Math.floor(i/count*tr.M)],side=i%2?1:-1,x=q.x+q.rx*side*(tr.halfW+3),z=q.z+q.rz*side*(tr.halfW+3);posts.push({x,y:3.6,z,sx:.12,sy:7.2,sz:.12});heads.push({x,y:7.2,z,sx:1.0,sy:.16,sz:.55,yaw:Math.atan2(q.tx,q.tz)})}
  batch(grp,new THREE.SphereGeometry(1,12,6),hills);batch(grp,new THREE.CylinderGeometry(1,1,1,6),trunks,0x51493c);batch(grp,new THREE.ConeGeometry(1,1,7),crowns);batch(grp,new THREE.DodecahedronGeometry(1,0),rocks);batch(grp,new THREE.CylinderGeometry(1,1,1,6),posts,0x82919c);batch(grp,new THREE.BoxGeometry(1,1,1),heads,0xe0e8df);
  for(let i=0;i<8;i++){const q=tr.samples[Math.floor((i+.35)/8*tr.M)],g=new THREE.Group();g.position.set(q.x+q.rx*(tr.halfW+2),2.8,q.z+q.rz*(tr.halfW+2));g.rotation.y=Math.atan2(q.tx,q.tz);const board=sign(i%2?'› › ›':'NPNG RACE',6.5,1.8,i%2?'#155d92':'#122c43');g.add(board);grp.add(g)}
  grp.userData.raceWorld={trackLength:tr.L,trees:trunks.length,hills:hills.length,rocks:rocks.length,station:!!fuel,instancedBatches:6};
 }
 return {build,clear,version:'1.0.0'};
})();
