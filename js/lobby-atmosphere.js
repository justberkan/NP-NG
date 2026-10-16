'use strict';
/* Lobiye özel: çevrimdışı UTC+3 takvimi, yaklaşık güneş konumu ve sabit bütçeli efektler.
   Oyun sahnesini, ortak renderer ayarlarını ve fizik saatini değiştirmez. */
const LobbyAtmosphere=(()=>{
 const RAD=Math.PI/180,STORE='npng_lobby_atmosphere_v1';
 const DEFAULTS={season:'auto',weather:'auto',time:'auto'};
 const SEASONS=['winter','spring','summer','autumn'];
 const LABEL={winter:'Kış',spring:'İlkbahar',summer:'Yaz',autumn:'Sonbahar',clear:'Açık',cloudy:'Bulutlu',rain:'Yağmur',snow:'Kar'};
 const sat=x=>Math.max(0,Math.min(1,x));
 const smooth=(a,b,x)=>{const t=sat((x-a)/(b-a));return t*t*(3-2*t)};
 function options(value){const o={...DEFAULTS};for(const k of Object.keys(o)){
  const allowed=k==='season'?['auto',...SEASONS]:k==='weather'?['auto','clear','cloudy','rain','snow']:['auto','day','sunset','night'];
  if(value&&allowed.includes(value[k]))o[k]=value[k];
 }return o}
 function parts(date=new Date()){
  const d=new Date(date.getTime()+10800000);
  return{year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate(),hour:d.getUTCHours()+d.getUTCMinutes()/60+d.getUTCSeconds()/3600};
 }
 function sample(date=new Date(),value=DEFAULTS){
  const o=options(value),p=parts(date),month=p.month;
  const season=o.season==='auto'?SEASONS[Math.floor((month%12)/3)]:o.season;
  const weather=o.weather==='auto'?({winter:'snow',spring:'cloudy',summer:'clear',autumn:'rain'})[season]:o.weather;
  const doy=(Date.UTC(p.year,month-1,p.day)-Date.UTC(p.year,0,0))/86400000;
  const decl=23.44*RAD*Math.sin(2*Math.PI*(284+doy)/365.2422),lat=41.0082*RAD;
  // İstanbul 28.9784°E; saat UTC+3. Boylam ve zaman denklemiyle mevsimsel gün uzunluğu.
  const b=2*Math.PI*(doy-81)/364,eot=9.87*Math.sin(2*b)-7.53*Math.cos(b)-1.5*Math.sin(b);
  const noon=12+(45-28.9784)/15-eot/60;
  const halfDay=Math.acos(Math.max(-1,Math.min(1,-Math.tan(lat)*Math.tan(decl))))/RAD/15;
  const hour=o.time==='day'?noon:o.time==='sunset'?noon+halfDay-.15:o.time==='night'?0:p.hour;
  const angle=(hour-noon)*15*RAD;
  const elevation=Math.asin(Math.sin(lat)*Math.sin(decl)+Math.cos(lat)*Math.cos(decl)*Math.cos(angle))/RAD;
  return{...p,season,weather,hour,elevation,daylight:smooth(-7,15,elevation),twilight:1-smooth(0,15,Math.abs(elevation)),
   sun:[-Math.sin(angle)*Math.cos(decl),Math.sin(elevation*RAD),Math.cos(lat)*Math.sin(decl)-Math.sin(lat)*Math.cos(decl)*Math.cos(angle)]};
 }
 function create(scene,camera,renderer){
  let saved;try{saved=JSON.parse(localStorage.getItem(STORE))}catch(e){}
  let opts=options(saved),state,elapsed=0,lastRefresh=-10,disposed=false,panel,flagCloth,flagBase;
  const root=new THREE.Group();root.name='lobby-atmosphere';scene.add(root);
  const report={monument:'loading',flag:'loading',errors:[]},ownedTextures=[],lights=[];
  const previous={background:scene.background,fog:scene.fog,far:camera.far};
  scene.background=new THREE.Color(0x0b182a);scene.fog=new THREE.Fog(0x162334,32,140);
  camera.far=240;camera.updateProjectionMatrix();
  function mesh(geo,mat,x,y,z){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);root.add(m);return m}
  const steel=new THREE.MeshStandardMaterial({color:0x25332f,roughness:.78,metalness:.45});
  const olive=new THREE.MeshStandardMaterial({color:0x333e2c,roughness:.86,metalness:.15});
  const warm=new THREE.MeshBasicMaterial({color:0xffdca1}),amber=new THREE.MeshBasicMaterial({color:0x9c8b60});
  const boxGeometry=new THREE.BoxGeometry(1,1,1),staticBoxes=[];
  function box(w,h,d,x,y,z,mat=steel){const m=mesh(boxGeometry,mat,x,y,z);m.scale.set(w,h,d);staticBoxes.push(m);return m}
  // Açık hangar: orta açıklık ve karakter silüeti serbest kalır.
  [-1,1].forEach(side=>{
   box(.6,8,22,side*10,4,-6);
   for(const z of[-3,-10,-17]){
    box(.38,7.2,.45,side*7.8,3.6,z);
    const strut=box(2.4,.15,.18,side*7,6.7,z);strut.rotation.z=side*.45;
   }
   box(3.6,.35,23,side*9,7.4,-6);
   for(let i=0;i<3;i++){
    box(1.2,.7,.9,side*(5.5+i*.7),.35,-3-i*1.2,olive);
    box(1.24,.05,.94,side*(5.5+i*.7),.62,-3-i*1.2,steel);
   }
   box(.3,.2,2,side*7.5,6.3,-8,warm);
   box(.24,.08,4.5,side*4.6,.025,-2,amber);
   box(.09,.07,12,side*5.4,.02,-10,amber);
  });
  box(16,.28,.5,0,7.2,-15);
  box(5,.12,12,0,7.6,1);
  const ground=new THREE.MeshStandardMaterial({color:0x20282a,roughness:.9,metalness:.08});
  const floor=mesh(new THREE.PlaneGeometry(180,180),ground,0,-.065,-25);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;
  const seams=[];for(let x=-10;x<=10;x+=2)seams.push(x,-.055,6,x,-.055,-18);for(let z=6;z>=-18;z-=3)seams.push(-10,-.055,z,10,-.055,z);
  const seamGeo=new THREE.BufferGeometry();seamGeo.setAttribute('position',new THREE.Float32BufferAttribute(seams,3));
  root.add(new THREE.LineSegments(seamGeo,new THREE.LineBasicMaterial({color:0x394447,transparent:true,opacity:.32})));
  // Küçük çevre küpü: ıslak zeminde gökyüzü/projektör parıltısı, ek sahne render'ı yok.
  const faces=Array.from({length:6},()=>{const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d');return{c,ctx}});
  const environment=new THREE.CubeTexture(faces.map(f=>f.c));environment.needsUpdate=true;ownedTextures.push(environment);ground.envMap=environment;
  const skyUniforms={top:{value:new THREE.Color()},horizon:{value:new THREE.Color()},sunDir:{value:new THREE.Vector3()},day:{value:0},cloud:{value:0},time:{value:0}};
  const sky=mesh(new THREE.SphereGeometry(180,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:skyUniforms,
   vertexShader:'varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:`varying vec3 vDir;uniform vec3 top,horizon,sunDir;uniform float day,cloud,time;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){vec3 d=normalize(vDir);float h=max(d.y,0.);vec3 c=mix(horizon,top,smoothstep(0.,.75,h));
     float glow=pow(max(dot(d,normalize(sunDir)),0.),32.);c+=vec3(1.,.56,.25)*glow*.3*day;
     vec2 uv=vec2(atan(d.z,d.x),asin(d.y));vec2 cell=floor(uv*240.);float star=step(.9985,hash(cell))*pow(max(0.,1.-length(fract(uv*240.)-.5)*2.),5.);
     c+=star*(1.-day)*smoothstep(.04,.3,h)*.7;
     float bands=sin(uv.x*8.+sin(uv.y*24.)*1.2+time*.003)*sin(uv.y*19.+time*.002);
     c=mix(c,mix(horizon,vec3(.7,.75,.79),day*.35),smoothstep(.12,.75,bands)*cloud*smoothstep(.02,.24,h)*.38);
     gl_FragColor=vec4(c,1.);}`}),0,0,0);sky.renderOrder=-10;
  const hemi=new THREE.HemisphereLight(0xc5d9e8,0x313c37,.8);root.add(hemi);
  const sunlight=new THREE.DirectionalLight(0xffe2b3,1);sunlight.name='lobby-sunlight';root.add(sunlight);
  // Tek gölge ışığı; yalnız mevcut gölge ayarı açıksa çalışır.
  sunlight.shadow.mapSize.set(512,512);sunlight.shadow.camera.left=-9;sunlight.shadow.camera.right=9;
  sunlight.shadow.camera.top=8;sunlight.shadow.camera.bottom=-4;sunlight.shadow.camera.near=.5;sunlight.shadow.camera.far=65;sunlight.shadow.bias=-.001;
  sunlight.shadow.camera.updateProjectionMatrix();
  const fill=new THREE.DirectionalLight(0xc0d5eb,.6);fill.position.set(-4,4,8);root.add(fill);
  function spot(x,y,z,tx,ty,tz,color,intensity,distance,angle){
   const l=new THREE.SpotLight(color,intensity,distance,angle,.55,1);l.position.set(x,y,z);l.target.position.set(tx,ty,tz);root.add(l,l.target);lights.push(l);return l;
  }
  const monumentSpots=[spot(-8,1,-48,-4,5,-60,0xffd39a,1.2,35,.6),spot(13,1,-48,5,5,-60,0xffd39a,1.2,35,.6)];
  const hangarSpots=[spot(-5,6,1,-1,1,0,0xd9e6ed,1.5,23,.65),spot(5,6,-2,0,1,0,0xffdfb2,1.3,23,.65)];
  for(const l of lights)box(.34,.18,.24,l.position.x,l.position.y,l.position.z,warm);
  // Hangar, sandıklar ve şeritler malzeme başına tek çizim: aynı birim kutu paylaşılır.
  const batches=new Map();for(const m of staticBoxes){if(!batches.has(m.material))batches.set(m.material,[]);batches.get(m.material).push(m)}
  for(const [material,list] of batches){const group=new THREE.InstancedMesh(boxGeometry,material,list.length);group.frustumCulled=false;
   list.forEach((m,i)=>{m.updateMatrix();group.setMatrixAt(i,m.matrix);root.remove(m)});root.add(group);
  }staticBoxes.length=0;
  // Yumuşak temas gölgesi düşük ayarlarda da tek küçük düzlemle görünür.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;
  const sc=shadowCanvas.getContext('2d'),sg=sc.createRadialGradient(32,32,3,32,32,31);sg.addColorStop(0,'rgba(0,0,0,.55)');sg.addColorStop(1,'rgba(0,0,0,0)');sc.fillStyle=sg;sc.fillRect(0,0,64,64);
  const shadowMap=new THREE.CanvasTexture(shadowCanvas);ownedTextures.push(shadowMap);
  const contact=mesh(new THREE.PlaneGeometry(3.5,2.3),new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false}),0,.005,.5);contact.rotation.x=-Math.PI/2;
  const monument=new THREE.Group();monument.name='anitkabir';monument.position.set(4,0,-60);root.add(monument);
  const fallback=new THREE.Group();monument.add(fallback);
  const stone=new THREE.MeshLambertMaterial({color:0xcab68c});
  function fallbackBox(w,h,d,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),stone);m.position.set(x,y,z);fallback.add(m)}
  fallbackBox(18,.6,13,0,.3,0);fallbackBox(15,.8,10,0,7.5,0);
  for(let i=0;i<10;i++)fallbackBox(.55,6.4,.55,-6.5+i*1.44,3.9,4.5);
  fallbackBox(13,5.8,7,0,3.6,-.4);
  function load(url,onLoad,key){new THREE.GLTFLoader().load(url,g=>{
   if(disposed){release(g.scene);return}
   try{onLoad(g);report[key]='ready'}catch(e){release(g.scene);report[key]='fallback';report.errors.push(key+': '+e.message)}
  },undefined,()=>{if(!disposed){report[key]='fallback';report.errors.push(key+': model yüklenemedi')}})}
  function normalize(object,width,height){
   object.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(object),size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3());
   const scale=height?height/size.y:width/Math.max(size.x,size.z);
   if(!Number.isFinite(scale)||scale<=0)throw new Error('Geçersiz model boyutu');
   const wrapper=new THREE.Group();wrapper.add(object);wrapper.scale.setScalar(scale);object.position.sub(new THREE.Vector3(center.x,b.min.y,center.z));return wrapper;
  }
  load('assets/lobby/anitkabir.glb',g=>{
   const object=normalize(g.scene,18);
   object.rotation.y=-.12;
   object.traverse(m=>{if(!m.isMesh)return;const old=m.material;
    m.material=new THREE.MeshLambertMaterial({color:old.color?old.color.clone().multiplyScalar(.62):0xcab68c,side:THREE.FrontSide});old.dispose();m.receiveShadow=false;m.castShadow=false;
   });fallback.visible=false;monument.add(object);
  },'monument');
  const flagHolder=new THREE.Group();flagHolder.position.set(-7.2,0,-14);root.add(flagHolder);
  load('assets/lobby/turkish-flag.glb',g=>{
   const object=normalize(g.scene,null,6.2);flagHolder.add(object);
   g.scene.traverse(m=>{if(!m.isMesh)return;
    if(/bayrak|flag/i.test(m.name)){flagCloth=m;flagBase=m.geometry.attributes.position.array.slice();}
    m.castShadow=false;m.receiveShadow=false;
   });
  },'flag');
  const maxRain=650,maxSnow=450,rainData=new Float32Array(maxRain*6),rainTail=new Float32Array(maxRain*2),snowData=new Float32Array(maxSnow*3);
  let seed=1697;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
  for(let i=0;i<maxRain;i++){
   const x=random()*56-28,y=random()*18,z=-11-random()*42;
   rainData.set([x,y,z,x+.06,y,z],i*6);rainTail[i*2+1]=.42;
  }
  for(let i=0;i<maxSnow;i++)snowData.set([random()*56-28,random()*18,-11-random()*42],i*3);
  const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainData,3));rainGeo.setAttribute('tail',new THREE.BufferAttribute(rainTail,1));
  const snowGeo=new THREE.BufferGeometry();snowGeo.setAttribute('position',new THREE.BufferAttribute(snowData,3));
  const particleTime={value:0};
  const rain=new THREE.LineSegments(rainGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:particleTime,tint:{value:new THREE.Color(0x99bbd0)}},
   vertexShader:'uniform float time;attribute float tail;void main(){vec3 p=position;p.y=mod(p.y-time*10.+1800.,18.)-tail;p.x+=sin(p.z)*.3;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
   fragmentShader:'uniform vec3 tint;void main(){gl_FragColor=vec4(tint,.38);}'}));rain.frustumCulled=false;root.add(rain);
  const snow=new THREE.Points(snowGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:particleTime,scale:{value:1}},
   vertexShader:'uniform float time,scale;void main(){vec3 p=position;p.y=mod(p.y-time*.9+1800.,18.);p.x+=sin(time*.3+p.z)*.6;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(95.*scale/-mv.z,1.,5.);gl_Position=projectionMatrix*mv;}',
   fragmentShader:'void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.88,.94,1.,smoothstep(.5,.1,d)*.75);}'}));snow.frustumCulled=false;root.add(snow);
  const top=new THREE.Color(),horizon=new THREE.Color(),temp=new THREE.Color();
  function refresh(date){
   state=sample(date,opts);const d=state.daylight,t=state.twilight,w=state.weather,wet=w==='rain',cold=state.season==='winter';
   top.set(0x070f20).lerp(temp.set(cold?0x83aec9:0x4a91c6),d).lerp(temp.set(0x704d78),t*.5);
   horizon.set(0x182334).lerp(temp.set(cold?0xc4d9e1:0xd0dde0),d).lerp(temp.set(0xe99b68),t*.75);
   if(wet||w==='snow'){top.lerp(temp.set(0x7e919a),d*.5);horizon.lerp(temp.set(0x8c9da4),.22)}
   skyUniforms.top.value.copy(top);skyUniforms.horizon.value.copy(horizon);skyUniforms.day.value=d;skyUniforms.cloud.value=w==='clear'?0:w==='cloudy'?.65:.95;skyUniforms.sunDir.value.fromArray(state.sun);
   scene.background.copy(horizon);scene.fog.color.copy(horizon);scene.fog.near=wet||w==='snow'?24:48;scene.fog.far=wet?115:w==='snow'?105:180;
   hemi.color.set(cold?0xb4d7ee:0xc8dce8);hemi.intensity=.35+d*.65;
   sunlight.color.set(t>.3?0xffad6c:cold?0xd2e4f2:0xffe7bd);sunlight.intensity=d*(wet?.55:state.season==='summer'?1.1:.85);
   sunlight.position.fromArray(state.sun).multiplyScalar(24);sunlight.position.y=Math.max(2,sunlight.position.y);
   fill.intensity=.62+d*.2;
   monumentSpots.forEach(l=>{l.intensity=.05+(1-d)*1.65;l.visible=true});hangarSpots.forEach(l=>{l.intensity=.4+(1-d)*1.1});
   ground.roughness=wet?.22:w==='snow'?.74:.88;ground.metalness=wet?.36:.08;ground.envMapIntensity=wet?.8:.17;
   ground.color.set(w==='snow'?0x39464f:wet?0x141f24:0x20282a);
   for(const {ctx} of faces){const g=ctx.createLinearGradient(0,0,0,32);g.addColorStop(0,'#'+top.getHexString());g.addColorStop(.65,'#'+horizon.getHexString());g.addColorStop(1,wet?'#74684e':'#333b34');ctx.fillStyle=g;ctx.fillRect(0,0,32,32)}environment.needsUpdate=true;
   if(panel){panel.querySelector('[data-status]').textContent='İstanbul · '+String(Math.floor(state.hour)).padStart(2,'0')+':'+String(Math.floor(state.hour%1*60)).padStart(2,'0')+' · '+LABEL[state.season]+' / '+LABEL[w];
    panel.querySelector('[data-clock]').textContent=opts.time==='auto'?'Türkiye saati · UTC+3':'Önizleme · gerçek saate dönmek için Otomatik seç';}
  }
  function setOptions(value){opts=options({...opts,...value});try{localStorage.setItem(STORE,JSON.stringify(opts))}catch(e){}
   if(panel)for(const k of Object.keys(opts))panel.querySelector('[name="'+k+'"]').value=opts[k];refresh(new Date());lastRefresh=elapsed;
  }
  function controls(){
   panel=document.createElement('details');panel.className='lobby-atmosphere';panel.innerHTML='<summary>ATMOSFER <span data-status></span></summary><div class="la-controls"><label>Mevsim<select name="season"><option value="auto">Otomatik</option><option value="winter">Kış</option><option value="spring">İlkbahar</option><option value="summer">Yaz</option><option value="autumn">Sonbahar</option></select></label><label>Hava<select name="weather"><option value="auto">Mevsime göre</option><option value="clear">Açık</option><option value="cloudy">Bulutlu</option><option value="rain">Yağmur</option><option value="snow">Kar</option></select></label><label>Işık<select name="time"><option value="auto">Otomatik</option><option value="day">Gündüz</option><option value="sunset">Gün batımı</option><option value="night">Gece</option></select></label><small data-clock></small><button type="button">Otomatiğe dön</button></div>';
   const host=document.getElementById('lb');if(host)host.appendChild(panel);
   for(const k of Object.keys(opts))panel.querySelector('[name="'+k+'"]').value=opts[k];
   panel.addEventListener('change',()=>{const o={};for(const k of Object.keys(opts))o[k]=panel.querySelector('[name="'+k+'"]').value;setOptions(o)});
   panel.querySelector('button').addEventListener('click',()=>setOptions(DEFAULTS));
  }
  controls();refresh(new Date());
  function update(dt,date){
   if(disposed)return;elapsed+=Math.min(Math.max(dt,0),.1);particleTime.value=elapsed;skyUniforms.time.value=elapsed;
   if(elapsed-lastRefresh>=1){refresh(date||new Date());lastRefresh=elapsed}
   const fx=typeof SET==='undefined'?1:SET.fx,small=innerWidth<700,budget=fx===0?0:fx===1?.5:1;
   rain.visible=state.weather==='rain'&&budget>0;snow.visible=state.weather==='snow'&&budget>0;
   rainGeo.setDrawRange(0,Math.floor(maxRain*budget*(small?.6:1))*2);snowGeo.setDrawRange(0,Math.floor(maxSnow*budget*(small?.6:1)));
   snow.material.uniforms.scale.value=renderer.getPixelRatio();
   sunlight.castShadow=renderer.shadowMap.enabled&&state.daylight>.05;
   if(flagCloth&&fx>0){const a=flagCloth.geometry.attributes.position;
    const uv=flagCloth.geometry.attributes.uv;
    // Bayrak dokusunun gönder kenarı sabit; orijinal kıvrımlar korunur.
    for(let i=0;i<a.count;i++){const u=uv?uv.getX(i):0;a.array[i*3+2]=flagBase[i*3+2]+Math.sin(elapsed*1.6+u*7)*u*u*1.4}
    a.needsUpdate=true;
   }
   // Temas gölgesi mevcut oyuncu platformunu izler; mağaza görünümünde de doğru kalır.
   if(typeof LB!=='undefined'){const me=LB.slots.find(s=>s.d.me);if(me){contact.position.x=me.plat.position.x;contact.position.z=me.plat.position.z}}
   if(panel)panel.hidden=typeof lobbyView!=='undefined'&&lobbyView!=='home';
  }
  function release(object){const gs=new Set(),ms=new Set(),ts=new Set();object.traverse(o=>{
   if(o.geometry)gs.add(o.geometry);const mats=Array.isArray(o.material)?o.material:[o.material];
   mats.filter(Boolean).forEach(m=>{ms.add(m);for(const v of Object.values(m))if(v&&v.isTexture)ts.add(v)})});
   gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());
  }
  return{update,setOptions,snapshot:()=>({options:{...opts},state:{...state},...report,rain:rain.visible,snow:snow.visible,rainCount:rain.visible?rainGeo.drawRange.count/2:0,snowCount:snow.visible?snowGeo.drawRange.count:0}),
   dispose(){if(disposed)return;disposed=true;panel.remove();scene.remove(root);release(root);ownedTextures.forEach(t=>t.dispose());lights.forEach(l=>{if(l.shadow.map)l.shadow.map.dispose()});if(sunlight.shadow.map)sunlight.shadow.map.dispose();scene.background=previous.background;scene.fog=previous.fog;camera.far=previous.far;camera.updateProjectionMatrix()}};
 }
 return{create,sample,parts,defaults:DEFAULTS};
})();
