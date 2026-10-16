'use strict';
/* ===== Aim Training: test & ısınma alanı (Kimi, range-v1) =====
   Loadout sormadan girilir, tabancayla başlanır, tüm silahlar sınırsız kullanılabilir.
   Güney duvarında silah askısı: tüm klasik + model silahlar, bakıp E ile "seç ve dene".
   Batı duvarında mankenler: rastgele karakter/şampiyon/forma, E ile giy-tek-dene.
   Doğu tarafında küçük parkur (zıplama basamakları, tırmanma duvarı, bhop kütükleri). */
const RANGE_MOD={}; /* aim oturumunda duvardan alınan model (modId'de SV.mod'dan öncelikli) */
const RANGE={on:false,grp:null,items:[],mans:[],pads:[],cur:null,hint:null};
const _rr=new THREE.Raycaster();_rr.far=3.6;const _rp=V3(),_rd=V3();

function rangeWeaponList(){
 const L=WKEYS.map(k=>({k,mid:null,n:WP[k].n}));
 for(const m of WMOD)if(wmOn(m))L.push({k:m.cls,mid:m.id,n:m.n});
 return L;
}
function rangeStart(){
 if(RANGE.on)return;RANGE.on=true;
 const g=new THREE.Group();S.add(g);RANGE.grp=g;RANGE.items=[];RANGE.mans=[];RANGE.pads=[];
 /* duvar paneli (güney duvarı — oyuncu spawn'ının arkası, hedeflerin ters yönü) */
 const panel=new THREE.Mesh(new THREE.BoxGeometry(54,4.8,.3),new THREE.MeshLambertMaterial({color:0x232c36}));
 panel.position.set(0,2.4,29.7);g.add(panel);
 const wl=new THREE.PointLight(0xbfd8ee,1.1,34);wl.position.set(0,4,26);g.add(wl); /* duvar ve manken aydınlatması */
 const wl2=new THREE.PointLight(0xffe0b8,.8,22);wl2.position.set(-26,3.4,10);g.add(wl2);
 const proxyMat=new THREE.MeshBasicMaterial({visible:false});
 const addItem=(it,x,y)=>{
  const hold=new THREE.Group();hold.position.set(x,y,29.4);hold.rotation.y=Math.PI/2;g.add(hold); /* uzunluk +Z'yi duvara paralel X'e çevir */
  if(it.mid){
   const mid=WMID[it.mid].mid;
   const place=()=>{const m=MDL.cache[mid];if(!m||!hold.parent)return;const o=m.obj.clone(true);o.scale.setScalar(.95/(m.L||1));hold.add(o)};
   if(MDL.cache[mid]||MDL.fail[mid])place();else mdlLoad(mid,place);
  }else{
   const W=buildWeapon(it.k,SKIN('g0'));if(W.flash)W.g.remove(W.flash);hold.add(W.g);
  }
  const px=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.2,1.4),proxyMat);
  px.position.set(x,y,29.2);px.userData.range=it;g.add(px);RANGE.items.push(px);
 };
 const list=rangeWeaponList();
 list.slice(0,7).forEach((it,i)=>addItem(it,-9+i*3,3.6)); /* klasikler üst sıra */
 const mods=list.slice(7),per=20;
 mods.forEach((it,i)=>{const row=Math.floor(i/per),col=i%per;addItem(it,-24.7+col*2.6,2.4-row*.95)});
 /* mankenler (batı duvarı): rastgele karışım — karakterler, şampiyonlar, formlu olanlar */
 const pool=CHARS.slice();
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=pool[i];pool[i]=pool[j];pool[j]=t}
 const forms=[null].concat(FORMS.map(f=>f.id));
 pool.slice(0,8).forEach((c,i)=>{
  const form=c.ch?null:forms[(Math.random()*forms.length)|0];
  const rig=mkHuman(CHAR(chWithKit(c.id,form)),false);
  rig.root.position.set(-28.4,0,3+i*2.4);rig.root.rotation.y=Math.PI/2;g.add(rig.root);setShadow(rig.root);
  const px=new THREE.Mesh(new THREE.BoxGeometry(1.4,2.2,1.4),proxyMat);
  px.position.set(-28.4,1.1,3+i*2.4);px.userData.range={char:c.id,form,n:c.n+(form?' + Forma':'')};g.add(px);RANGE.items.push(px);
  RANGE.mans.push(rig);
 });
 /* parkur (doğu tarafı): basamaklar, tırmanma duvarı, üst platform, bhop kütükleri */
 const pad=(...a)=>{box(...a);RANGE.pads.push(boxes[boxes.length-1])};
 pad(10,14,2,.5,2,0x2bb5a0);pad(13,14,2,1,2,0x2bb5a0);pad(16,14,2,1.5,2,0x2bb5a0);pad(19,14,2,2,2,0x2bb5a0);
 pad(22,12,2,2.6,2,0xc9892b);pad(24,8,1,3.4,.8,0x4a7fb5);pad(24,5,3,.4,3,0x2bb5a0);
 pad(8,20,1.5,.4,1.5,0xc9892b);pad(11,20,1.5,.4,1.5,0xc9892b);pad(14,20,1.5,.4,1.5,0xc9892b);
 /* ipucu çubuğu */
 let h=$('rhint');if(!h){h=document.createElement('div');h.id='rhint';$('hud').appendChild(h)}
 RANGE.hint=h;
}
function rangeStop(){
 if(!RANGE.on)return;RANGE.on=false;
 if(RANGE.grp){S.remove(RANGE.grp);RANGE.grp=null}
 for(const b of RANGE.pads){S.remove(b.m);const i=boxes.indexOf(b);if(i>=0)boxes.splice(i,1)}
 RANGE.pads=[];RANGE.items=[];RANGE.mans=[];RANGE.cur=null;
 for(const k in RANGE_MOD)delete RANGE_MOD[k];
 if(RANGE.hint)RANGE.hint.textContent='';
 if(RANGE.char!=null){SV.eq.c=RANGE.char;SV.eq.f=RANGE.form;rebuildPlayerModels();RANGE.char=null} /* denenen karakter/forma geri alınır */
}
function rangeTake(it){
 if(it.k){
  const cls=it.k==='dual'?'pistol':it.k;
  if(it.mid)RANGE_MOD[cls]=it.mid;else delete RANGE_MOD[cls];
  wa[it.k]=9999;setW(it.k);
  $('msg').textContent='Deneniyor: '+it.n;setTimeout(()=>{if(mode==='aim')$('msg').textContent=''},1500);
 }else if(it.char){
  if(RANGE.char==null){RANGE.char=SV.eq.c;RANGE.form=SV.eq.f||null}
  SV.eq.c=it.char;SV.eq.f=it.form||null;rebuildPlayerModels();
  $('msg').textContent='Deneniyor: '+it.n;setTimeout(()=>{if(mode==='aim')$('msg').textContent=''},1500);
 }
}
function rangeUpdate(dt){
 if(!RANGE.on)return;
 for(const r of RANGE.mans){r.root.rotation.y+=dt*.5;animHuman(r,{t:0,speed:0,pitch:0,lookYaw:0,lr:0,ads:0,kick:0,bob:0,sw:1,rq:-1},dt)}
 cam.getWorldPosition(_rp);cam.getWorldDirection(_rd);_rr.set(_rp,_rd);
 const hit=_rr.intersectObjects(RANGE.items,false)[0];
 RANGE.cur=hit?hit.object.userData.range:null;
 if(RANGE.hint)RANGE.hint.textContent=RANGE.cur?'[E] Seç ve dene: '+RANGE.cur.n:'';
}
/* Etkileşim: E (Kontroller'den eşleşen tuş) */
addEventListener('keydown',e=>{
 if(typeof state==='undefined'||state!=='play'||typeof mode==='undefined'||mode!=='aim'||!RANGE.on)return;
 if(typeof kMatch==='function'&&kMatch(e,'interact')&&RANGE.cur)rangeTake(RANGE.cur);
});
