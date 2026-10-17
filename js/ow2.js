'use strict';
/* ===== Açık dünya: eşyalar, düşenler, envanter, NPC'ler (demirci/tüccar), Genshin tarzı panel ===== */
const ITM={
 ore:{n:'Demir Cevheri',r:1,p:4,ic:'⛏️',d:'Kılıç yükseltmenin temel malzemesi.'},
 polish:{n:'Parlatma Taşı',r:2,p:14,ic:'💎',d:'Daha yüksek seviye yükseltmeler için gerekir.'},
 core:{n:'Güç Çekirdeği',r:3,p:45,ic:'🔮',d:'6. seviyeden sonraki yükseltmelerde kullanılır.'},
 redcore:{n:'Kızıl Çekirdek',r:4,p:140,ic:'♦️',d:'Son yükseltme için gerekli nadir çekirdek. Elit ve zırhlı devlerden düşer.'},
 gem:{n:'Efsane Taşı',r:5,p:450,ic:'🌟',d:'Çok nadir. Tüccar iyi para öder.'},
 fang:{n:'Zombi Dişi',r:1,p:3,ic:'🦷',d:'Yeşil Vadi yaratıklarından düşer.'},
 cloth:{n:'Eski Kumaş',r:1,p:2,ic:'🧵',d:'Yırtık, kirli bir kumaş.'},
 gtooth:{n:'Altın Diş',r:2,p:12,ic:'🪙',d:'Goblinlerin sakladığı küçük bir define.'},
 bone:{n:'Kemik Parçası',r:1,p:3,ic:'🦴',d:'Çöl ve kül diyarı yaratıklarından düşer.'},
 wrap:{n:'Mumya Bandı',r:1,p:3,ic:'🩹',d:'Eski bir sargı bezi.'},
 scarab:{n:'Altın Skarabe',r:3,p:30,ic:'🪲',d:'Çöl mezarlarından kalma süs.'},
 shard:{n:'Buz Parçası',r:1,p:3,ic:'🧊',d:'Erimeyen bir buz kırığı.'},
 ice:{n:'Don Kristali',r:3,p:30,ic:'❄️',d:'İçinde soğuk bir ışık yanar.'},
 slime:{n:'Bataklık Balçığı',r:1,p:3,ic:'🟢',d:'Yapış yapış, kokulu.'},
 venom:{n:'Zehir Bezi',r:2,p:12,ic:'☠️',d:'Zehirli mutantlardan alınır.'},
 ember:{n:'Kor Parçası',r:1,p:3,ic:'🔸',d:'Hâlâ sıcak bir kömür.'},
 magma:{n:'Magma Çekirdeği',r:3,p:30,ic:'🌋',d:'Lav canavarlarının kalbi.'},
 plate:{n:'Zırh Levhası',r:2,p:14,ic:'🛡️',d:'Zırhlı devlerin üstünden sökülür.'},
 med:{n:'İlk Yardım Çantası',r:2,p:0,ic:'✚',d:'H tuşuyla kullanılır: %50 can yeniler.',special:1}
};
const BDROP=[{c:['fang','cloth'],g:'gtooth'},{c:['bone','wrap'],g:'scarab'},{c:['shard','shard'],g:'ice'},{c:['slime','cloth'],g:'venom'},{c:['ember','bone'],g:'magma'}];
const SHOPL=[['med',60],['ore',10],['polish',35],['core',110]];
const OWI=()=>SV.ow.inv;
const invHave=id=>id==='med'?SV.ow.med:(SV.ow.inv[id]||0);
function invAdd(id,n){if(id==='med'){SV.ow.med+=n;return}SV.ow.inv[id]=(SV.ow.inv[id]||0)+n}
function invTake(id,n){if(invHave(id)<n)return false;if(id==='med')SV.ow.med-=n;else{SV.ow.inv[id]-=n;if(SV.ow.inv[id]<=0)delete SV.ow.inv[id]}return true}

/* ----- Düşenler ----- */
const LOOT=[];const LCOL=[0,0xbfc6d0,0x6fe09a,0x5aa8ff,0xb07bff,0xffc23a];const lmat={};
function lootMat(r){return lmat[r]||(lmat[r]=new THREE.MeshBasicMaterial({color:LCOL[r],transparent:true,opacity:.95}))}
let lootG=null,beamG=null,beamM={};
function pkFeed(id,n,extra){
 if(window.BGMODE)return;
 const f=$('pk');if(!f)return;
 const it=ITM[id];if(!it)return;
 const e=document.createElement('div');e.className='pki r'+it.r;
 e.innerHTML=`<i>${it.ic}</i><span>${extra||it.n}</span><b>×${n}</b>`;
 f.appendChild(e);setTimeout(()=>{e.classList.add('out');setTimeout(()=>e.remove(),400)},3200);
 while(f.children.length>6)f.firstChild.remove();
}
function owLootGive(id,n){invAdd(id,n);pkFeed(id,n)}
function owLootSpawn(id,n,x,z){
 if(window.BGMODE||!OW.on){owLootGive(id,n);return}
 if(!lootG){lootG=new THREE.BoxGeometry(.3,.3,.3);beamG=new THREE.BoxGeometry(.06,2.4,.06)}
 const r=ITM[id].r,g=new THREE.Group();
 g.add(new THREE.Mesh(lootG,lootMat(r)));
 if(r>=3){const b=new THREE.Mesh(beamG,new THREE.MeshBasicMaterial({color:LCOL[r],transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false}));b.position.y=1.2;g.add(b)}
 const a=Math.random()*6.28,d=.8+Math.random()*1.4;
 const o={id,n,g,x:x+Math.cos(a)*d,z:z+Math.sin(a)*d,age:0,ph:Math.random()*6,vy:3.5};
 o.y=owH(x,z)+1;g.position.set(x,o.y,z);o.sx=x;o.sz=z;
 OW.root.add(g);LOOT.push(o);
 if(LOOT.length>40){const q=LOOT.shift();OW.root.remove(q.g);owLootGive(q.id,q.n)}
}
function owLootUpd(dt){
 for(let i=LOOT.length-1;i>=0;i--){
  const o=LOOT[i];o.age+=dt;
  /* fırlama: kısa yay çizerek yere düşer */
  const t=Math.min(1,o.age*2.2);
  o.sx+= (o.x-o.sx)*Math.min(1,dt*6);o.sz+=(o.z-o.sz)*Math.min(1,dt*6);
  const gy=owH(o.sx,o.sz)+.55;
  o.vy-=14*dt;o.y+=o.vy*dt;if(o.y<gy){o.y=gy;o.vy=0}
  let px=o.sx,pz=o.sz;
  const dx=p.x-px,dz=p.z-pz,d=Math.hypot(dx,dz);
  if(o.age>.5&&d<7){const k=Math.min(1,(10-d)*1.3*dt);o.x+=dx*k;o.z+=dz*k;o.sx+=dx*k;o.sz+=dz*k}
  o.g.position.set(o.sx,o.y+Math.sin(o.age*3+o.ph)*.08*(o.vy===0?1:0),o.sz);
  o.g.children[0].rotation.y+=dt*2.4;o.g.children[0].rotation.x=.4;
  if((o.age>.45&&d<1.7&&p.dead<=0)||o.age>16){
   OW.root.remove(o.g);LOOT.splice(i,1);owLootGive(o.id,o.n);
  }
 }
}
function owLootFlush(){for(const o of LOOT){if(OW.root)OW.root.remove(o.g);invAdd(o.id,o.n)}LOOT.length=0}

function owDrops(m){
 const t=BDROP[m.camp.bi],L=m.L,out=[],R=Math.random;
 if(R()<.7)out.push([t.c[Math.floor(R()*t.c.length)],1+(R()<.4?1:0)]);
 if(R()<.4)out.push(['ore',1+(L>10&&R()<.5?1:0)]);
 if(R()<Math.min(.28,.1+L*.004))out.push([t.g,1]);
 if(R()<.09)out.push(['polish',1]);
 if(m.tk==='gol'||m.boss){out.push(['plate',1+(m.boss?1:0)]);if(R()<(m.boss?.7:.25))out.push(['redcore',1])}
 if(L>=8&&R()<(m.boss?.35:.03))out.push(['core',1]);
 if(m.boss&&R()<.18)out.push(['gem',1]);
 const gy=owH(m.x,m.z);
 for(const o of out)owLootSpawn(o[0],o[1],m.x,m.z);
 /* nadiren yeni kılıç düşer */
 if(R()<(m.boss?.12:.006)){
  const maxR=1+Math.floor(L/8);
  const pool=SWD.filter(s=>s.id!=='s0'&&!SV.ow.sw.includes(s.id)&&s.r<=Math.min(5,maxR+1));
  if(pool.length){
   const s=pool[Math.floor(R()*pool.length)];SV.ow.sw.push(s.id);
   if(!window.BGMODE){owToast('YENİ KILIÇ: '+s.n+' ('+SW_R[s.r].n+')');snd(800,.2,.07,'sine')}
  }
 }
}

/* ===== NPC'ler ===== */
const NPCS=[
 {id:'smith',n:'Demirci Kaan',sub:'Kılıç yükseltme',x:-5.5,z:6,tab:'sword',cols:{j:0x6b4a2b,j2:0x5a3d22,pa:0x3b3027,v:0x2a2220,v2:0x201a18,h:0x3a2a20,gl:0x1a1410,sk:0xd2a074,bo:0x1a1410,nohat:1,
  bd:[{w:.34,h:.42,d:.03,x:0,y:.24,z:.125,c:0x2a2220},{w:.1,h:.1,d:.04,x:.1,y:.3,z:.14,c:0xd9a020}],hd:[{w:.22,h:.05,d:.23,x:0,y:.24,z:0,c:0xa02a20},{w:.2,h:.07,d:.22,x:0,y:.29,z:-.01,c:0x2a1a10}]}},
 {id:'trader',n:'Tüccar Mira',sub:'Al-sat',x:5.5,z:6,tab:'shop',cols:{j:0x2f7a6b,j2:0x276a5c,pa:0x2a3a3a,v:0xd9ac4d,v2:0xb88a30,h:0x2a2a2a,gl:0x1a1a1a,sk:0xe6c4a0,bo:0x2a1a10,nohat:1,
  bd:[{w:.4,h:.46,d:.26,x:0,y:.3,z:-.23,c:0x8a5a2a},{w:.3,h:.1,d:.2,x:0,y:.56,z:-.23,c:0x6a4020}],hd:[{w:.34,h:.04,d:.34,x:0,y:.27,z:0,c:0x2f7a6b},{w:.2,h:.14,d:.2,x:0,y:.35,z:0,c:0x2f7a6b},{w:.04,h:.04,d:.04,x:0,y:.43,z:0,c:0xd9ac4d}]}}
];
function owNpcInit(){
 if(!$('gp'))gpDom();
 if(OW.npcs||!OW.root)return;
 OW.npcs=NPCS.map(d=>{
  const rig=mkHuman(d.cols,false);
  const y=owH(d.x,d.z);rig.root.position.set(d.x,y,d.z);d.yaw=Math.atan2(-d.x,12-d.z);rig.root.rotation.y=d.yaw;
  OW.root.add(rig.root);try{setShadow(rig.root)}catch(e){}
  const el=document.createElement('div');el.className='npcl';el.innerHTML=`<b>${d.n}</b><small>${d.sub}</small>`;el.style.display='none';$('owhud').appendChild(el);
  return Object.assign({},d,{rig,el,near:false});
 });
}
let nearNpc=null;
function owNpcTick(dt){
 if(!OW.npcs)return;
 let best=null,bd=4.2;
 for(const n of OW.npcs){
  const d=Math.hypot(n.x-p.x,n.z-p.z);
  if(d<bd){bd=d;best=n}
  if(window.BGMODE)continue;
  /* yüzünü oyuncuya çevir */
  if(d<9){const ty=Math.atan2(p.x-n.x,p.z-n.z);let e=ty-n.rig.root.rotation.y;while(e>Math.PI)e-=6.2832;while(e<-Math.PI)e+=6.2832;n.rig.root.rotation.y+=e*Math.min(1,4*dt)}
  animHuman(n.rig,{t:clock,speed:0,lookYaw:0,pitch:0},dt);
  _pv.set(n.x,owH(n.x,n.z)+2.2,n.z).project(cam);
  const dx=n.x-p.x,dz=n.z-p.z;cam.getWorldDirection(_cd);
  const vis=_pv.z<1&&d<30&&(dx*_cd.x+dz*_cd.z)/(d||1)>.1&&state==='play';
  n.el.style.display=vis?'block':'none';
  if(vis){n.el.style.left=((_pv.x*.5+.5)*innerWidth)+'px';n.el.style.top=((-_pv.y*.5+.5)*innerHeight)+'px'}
 }
 if(best!==nearNpc){
  nearNpc=best;document.body.classList.toggle('npcnear',!!best);
  const ip=$('ipr');if(ip){ip.style.display=best?'block':'none';if(best)ip.innerHTML=(touch?'Etkileşim düğmesi':'<kbd>E</kbd>')+' · '+best.n}
 }
}
function owInteract(){
 if(mode!=='ow'||state!=='play'||!nearNpc)return false;
 owPanelOpen(nearNpc.tab,nearNpc);return true;
}

/* ===== Genshin tarzı panel ===== */
const GP={tab:'sword',sel:{sword:'s0',skill:'crescent',bag:'ore',shop:'med'},who:'',npc:null,open:false,lobby:false,msg:'',msgT:0,conf:0};
const GTABS=[['sword','🗡️','Kılıçlar'],['skill','✨','Yetenekler'],['bag','🎒','Çanta'],['shop','🛒','Tüccar']];
const SWC={s0:['#cfd8e0','#8a6a2a',6],s1:['#cfd8e0','#d9ac4d',7],s2:['#dfe6ee','#d9ac4d',4],s3:['#e6eaef','#d9ac4d',3],s4:['#cfd8e0','#6a6f78',9],s5:['#3fa34d','#a6ff6a',6],s6:['#aee8ff','#e8f8ff',5],s7:['#2a2224','#ff6a1a',9],s8:['#2a2433','#a060ff',5],s9:['#f0c040','#7fe9ff',7]};
function swIcon(id){
 const c=SWC[id],s=SWID[id],L=Math.min(58,(SWBL[id]||[.2,1])[1]*40),w=c[2],gl=s.gl?'#'+s.gl.toString(16).padStart(6,'0'):null;
 const top=64-L;
 return `<svg viewBox='0 0 100 100'>${gl?`<circle cx='50' cy='50' r='36' fill='${gl}' opacity='.25'/>`:''}<g transform='rotate(40 50 50)'><polygon points='${50-w/2},${top+5} 50,${top-4} ${50+w/2},${top+5} ${50+w/2},64 ${50-w/2},64' fill='${c[0]}' stroke='#0006' stroke-width='.8'/><rect x='${50-.7}' y='${top+5}' width='1.4' height='${59-5}' fill='${c[1]}' opacity='.55'/><rect x='38' y='63' width='24' height='4.5' rx='1.5' fill='${c[1]}'/><rect x='48' y='67.5' width='4' height='14' fill='#3a2a1a'/><circle cx='50' cy='84' r='3.4' fill='${c[1]}'/></g></svg>`;
}
const gpR=r=>SW_R[r];
function gpMsg(t){GP.msg=t;GP.msgT=3}
function gpOpenLobby(tab){owPanelOpen(tab||GP.tab,null,true)}
function owPanelOpen(tab,npc,lobby){
 if(!$('gp'))gpDom();
 if(!lobby){
  if(AUTO.on)toggleAuto(false);
  state='gp';document.exitPointerLock&&document.exitPointerLock();
  firing=false;
 }
 GP.open=true;GP.lobby=!!lobby;GP.npc=npc||null;GP.who=npc?npc.n:'Açık Dünya Merkezi';GP.tab=tab||GP.tab;GP.conf=0;GP.msg='';
 $('gp').classList.remove('off');gpRender();
}
function owPanelClose(viaEsc){
 if(!GP.open)return;
 GP.open=false;$('gp').classList.add('off');save();
 if(GP.lobby){if(typeof bal==='function')bal();return}
 if(viaEsc){state='pause';pauseUI()}else{state='play';resume()}
 if(typeof hudHp==='function')hudHp();upd();
}
function gpDom(){
 const e=document.createElement('div');e.id='gp';e.className='off';document.body.appendChild(e);
 e.addEventListener('click',ev=>{
  const t=ev.target.closest('[data-a]');if(!t)return;
  gpAct(t.dataset.a,t.dataset.v,t.dataset.w);
 });
 e.addEventListener('pointerdown',ev=>ev.stopPropagation());
 addEventListener('keydown',ev=>{if(GP.open&&ev.code==='Escape'){ev.preventDefault();owPanelClose(!GP.lobby)}if(GP.open&&kMatch(ev,'interact')&&!GP.lobby){ev.preventDefault();ev.stopImmediatePropagation();owPanelClose(false)}},true);
 const f=document.createElement('div');f.id='pk';$('hud').appendChild(f);
}
function gpAct(a,v,w){
 const sel=GP.sel;GP.conf=a==='sellall'?GP.conf:0;
 switch(a){
  case 'close':owPanelClose(false);return;
  case 'tab':GP.tab=v;GP.msg='';break;
  case 'sel':sel[GP.tab]=v;GP.msg='';break;
  case 'equip':if(SV.ow.sw.includes(v)){SV.ow.mw=v;if(mode==='ow'&&!GP.lobby)setW(v,true);gpMsg('Kuşanıldı: '+SWID[v].n)}break;
  case 'buysw':{const s=SWID[v];if(SV.ow.sw.includes(v))break;if(SV.tl<s.p){gpMsg('Yeterli paran yok');break}SV.tl-=s.p;SV.ow.sw.push(v);gpMsg('Satın alındı: '+s.n)}break;
  case 'sellsw':{if(v==='s0'||SV.ow.mw===v||!SV.ow.sw.includes(v))break;const pr=swSellPrice(v);SV.tl+=pr;SV.ow.sw=SV.ow.sw.filter(x=>x!==v);delete SV.ow.su[v];gpMsg(SWID[v].n+' satıldı: +'+fmt(pr)+' TL')}break;
  case 'up':gpUpgrade(v);break;
  case 'slot':{const i=+w;const sl=SV.ow.sk;if(!skUnlocked(v))break;const o=sl.indexOf(v);if(o>=0)sl[o]=sl[i];sl[i]=v;gpMsg(SKID[v].n+' → Slot '+(i+1))}break;
  case 'unslot':{const o=SV.ow.sk.indexOf(v);if(o>=0)SV.ow.sk[o]=null}break;
  case 'sell':{const it=ITM[v],n=w==='all'?invHave(v):Math.min(+w,invHave(v));if(!it||it.special||n<=0)break;invTake(v,n);const g=it.p*n;SV.tl+=g;gpMsg(it.n+' ×'+n+' satıldı: +'+fmt(g)+' TL')}break;
  case 'sellall':{
   if(!GP.conf){GP.conf=1;gpMsg('Emin misin? Yükseltme malzemeleri de satılır. Tekrar bas.');break}
   let g=0;for(const id in SV.ow.inv){g+=ITM[id].p*SV.ow.inv[id]}SV.ow.inv={};SV.tl+=g;GP.conf=0;gpMsg('Hepsi satıldı: +'+fmt(g)+' TL')}break;
  case 'buy':{const row=SHOPL.find(x=>x[0]===v);if(!row)break;const n=+w,tot=row[1]*n;if(SV.tl<tot){gpMsg('Yeterli paran yok');break}SV.tl-=tot;invAdd(v,n);gpMsg(ITM[v].n+' ×'+n+' alındı')}break;
 }
 save();gpRender();
 if(GP.lobby&&typeof bal==='function')bal();
}
function gpUpgrade(id){
 const lv=swLv(id);if(!SV.ow.sw.includes(id)||lv>=SW_MAXLV)return;
 const c=swUpCost(id,lv);
 if(SV.tl<c.tl||invHave('ore')<c.ore||invHave('polish')<c.polish||invHave('core')<c.core||invHave('redcore')<c.redcore){gpMsg('Malzeme ya da para yetersiz');return}
 SV.tl-=c.tl;invTake('ore',c.ore);if(c.polish)invTake('polish',c.polish);if(c.core)invTake('core',c.core);if(c.redcore)invTake('redcore',c.redcore);
 SV.ow.su[id]=lv+1;gpMsg(SWID[id].n+' +'+(lv+1)+' oldu!');
}
function gpStars(r){return '<span class="st">'+'★'.repeat(r)+'</span>'}
function gpHead(){
 return `<div class='gph'><div class='gpt'><small>${GP.npc?GP.npc.sub:'Merkez'}</small>${GP.who}</div><div class='gptb'>${GTABS.map(t=>`<button data-a='tab' data-v='${t[0]}' class='${GP.tab===t[0]?'on':''}'><i>${t[1]}</i><span>${t[2]}</span></button>`).join('')}</div><div class='gptl'>🪙 <b>${fmt(SV.tl)}</b></div><button class='gpx' data-a='close'>✕</button></div>`;
}
function gpSwordTab(){
 const sel=SWID[GP.sel.sword]||SWD[0];
 const list=SWD.map(s=>{
  const own=SV.ow.sw.includes(s.id),lv=swLv(s.id),eq=SV.ow.mw===s.id;
  return `<div class='gc r${s.r}${s.id===sel.id?' on':''}${own?'':' lock'}' data-a='sel' data-v='${s.id}'><div class='gci'>${swIcon(s.id)}</div>${lv?`<em class='lv'>+${lv}</em>`:''}${eq?`<u class='eq'>✔</u>`:''}<div class='gcn'>${s.n}</div><div class='gcs'>${'★'.repeat(s.r)}</div>${own?'':`<div class='gcp'>🪙 ${fmt(s.p)}</div>`}</div>`;
 }).join('');
 const own=SV.ow.sw.includes(sel.id),lv=swLv(sel.id),mul=1+.1*lv,nmul=1+.1*(lv+1),eq=SV.ow.mw===sel.id;
 const row=(l,a,b)=>`<div class='gr'><span>${l}</span><b>${a}${b?` <small>→ ${b}</small>`:''}</b></div>`;
 let act='';
 if(!own)act=`<button class='gb big' data-a='buysw' data-v='${sel.id}' ${SV.tl<sel.p?'disabled':''}>Satın al · 🪙 ${fmt(sel.p)}</button>`;
 else{
  act+=eq?`<button class='gb' disabled>Kuşanıldı</button>`:`<button class='gb big' data-a='equip' data-v='${sel.id}'>Kuşan</button>`;
  if(lv<SW_MAXLV){
   const c=swUpCost(sel.id,lv),mt=[['tl',c.tl,SV.tl,'🪙'],['ore',c.ore,invHave('ore'),ITM.ore.ic],['polish',c.polish,invHave('polish'),ITM.polish.ic],['core',c.core,invHave('core'),ITM.core.ic],['redcore',c.redcore,invHave('redcore'),ITM.redcore.ic]].filter(x=>x[1]>0);
   const ok=mt.every(x=>x[2]>=x[1]);
   act+=`<div class='gup'><div class='gut'>Demirci · +${lv} → +${lv+1}</div><div class='gmat'>${mt.map(x=>`<span class='${x[2]>=x[1]?'ok':'no'}'>${x[3]} ${x[0]==='tl'?fmt(x[2])+'/'+fmt(x[1]):x[2]+'/'+x[1]}</span>`).join('')}</div><button class='gb big' data-a='up' data-v='${sel.id}' ${ok?'':'disabled'}>Yükselt</button></div>`;
  }else act+=`<div class='gup'><div class='gut'>Azami seviye</div></div>`;
  if(sel.id!=='s0'&&!eq)act+=`<button class='gb ghost' data-a='sellsw' data-v='${sel.id}'>Sat · 🪙 ${fmt(swSellPrice(sel.id))}</button>`;
 }
 const det=`<div class='gd r${sel.r}'><div class='gdi'>${swIcon(sel.id)}</div><h2>${sel.n}${lv?` <small>+${lv}</small>`:''}</h2>${gpStars(sel.r)}<div class='gtag' style='color:${SW_R[sel.r].c}'>${SW_R[sel.r].n}</div><p>${sel.d}</p>
  ${row('Hasar',Math.round(sel.dmg*mul),own&&lv<SW_MAXLV?Math.round(sel.dmg*nmul):'')}${row('Vuruş hızı',(1/sel.rate).toFixed(2)+' / sn')}${row('Menzil',sel.range+' m')}${row('Vuruş açısı',Math.round(sel.ang*57.3)+'°')}${row('Duruş',sel.pose==='gsword'?'İki elle':'Tek elle')}
  <div class='gact'>${act}</div></div>`;
 return `<div class='gpl'>${list}</div>${det}`;
}
function gpSkillTab(){
 const sel=SKID[GP.sel.skill]||SKD[0];
 const sl=SV.ow.sk;
 const list=SKD.map(s=>{
  const un=skUnlocked(s.id),si=sl.indexOf(s.id);
  return `<div class='gc skc${s.id===sel.id?' on':''}${un?'':' lock'}' data-a='sel' data-v='${s.id}' style='--sc:${s.col}'><div class='gci'><span>${s.ic}</span></div>${si>=0?`<em class='lv'>${si+1}</em>`:''}<div class='gcn'>${s.n.split(':')[0]}</div><div class='gcs'>${un?'Açık':'Lv '+s.lv}</div></div>`;
 }).join('');
 const un=skUnlocked(sel.id),si=sl.indexOf(sel.id);
 const slots=`<div class='gslots'>${[0,1,2,3,4].map(i=>{const id=sl[i],s=id&&SKID[id];return `<div class='gsl${s?'':' em'}' style='--sc:${s?s.col:'#5a6275'}'><i>${s?s.ic:'＋'}</i><b>${i+1}</b></div>`}).join('')}<div class='gsl dash' style='--sc:#cfe8ff'><i>💨</i><b>⇧</b></div></div>`;
 let act='';
 if(un){
  act=`<div class='gut'>Slota yerleştir</div><div class='gbtn'>${[0,1,2,3,4].map(i=>`<button class='gb sm${si===i?' on':''}' data-a='slot' data-v='${sel.id}' data-w='${i}'>Slot ${i+1}</button>`).join('')}</div>`;
  if(si>=0)act+=`<button class='gb ghost' data-a='unslot' data-v='${sel.id}'>Slottan çıkar</button>`;
 }else act=`<div class='gut'>Seviye ${sel.lv} gerekli · şu an Lv ${SV.ow.lvl}</div>`;
 const det=`<div class='gd' style='--sc:${sel.col}'><div class='gdi big'><span>${sel.ic}</span></div><h2>${sel.n}</h2><div class='gtag'>${sel.st}</div><p>${sel.d}</p>${slots}<div class='gact'>${act}</div><p class='gnote'>Dash: Shift (dokunmatikte 💨). Bekleme ${DASH_CD} sn, kısa süre hasar almazsın. Yetenekler 1-5 tuşlarıyla kullanılır.</p></div>`;
 return `<div class='gpl'>${list}</div>${det}`;
}
function gpBagTab(){
 const ids=Object.keys(ITM).filter(id=>invHave(id)>0).sort((a,b)=>ITM[b].r-ITM[a].r);
 const sel=ITM[GP.sel.bag]&&invHave(GP.sel.bag)>0?GP.sel.bag:ids[0];
 const list=ids.map(id=>`<div class='gc r${ITM[id].r}${id===sel?' on':''}' data-a='sel' data-v='${id}'><div class='gci'><span>${ITM[id].ic}</span></div><em class='ct'>${invHave(id)}</em><div class='gcn'>${ITM[id].n}</div><div class='gcs'>${'★'.repeat(ITM[id].r)}</div></div>`).join('')||`<p class='gempty'>Çanta boş. Yaratıkları yen, eşya düşürsünler.</p>`;
 let det=`<div class='gd'><p class='gempty'>Bir eşya seç.</p></div>`;
 if(sel){
  const it=ITM[sel],n=invHave(sel);
  det=`<div class='gd r${it.r}'><div class='gdi big'><span>${it.ic}</span></div><h2>${it.n}</h2>${gpStars(it.r)}<div class='gtag' style='color:${SW_R[it.r].c}'>${SW_R[it.r].n} · elinde ${n}</div><p>${it.d}</p>
   ${it.special?'':`<div class='gr'><span>Tüccar alış fiyatı</span><b>🪙 ${it.p}</b></div><div class='gact'><button class='gb' data-a='sell' data-v='${sel}' data-w='1'>Sat ×1</button><button class='gb' data-a='sell' data-v='${sel}' data-w='10' ${n<2?'disabled':''}>Sat ×10</button><button class='gb big' data-a='sell' data-v='${sel}' data-w='all'>Hepsini sat · 🪙 ${fmt(it.p*n)}</button></div>`}
   <div class='gact'><button class='gb ghost' data-a='sellall'>${GP.conf?'Emin misin? Tekrar bas':'Çantadaki her şeyi sat'}</button></div></div>`;
 }
 return `<div class='gpl'>${list}</div>${det}`;
}
function gpShopTab(){
 const sel=SHOPL.find(x=>x[0]===GP.sel.shop)||SHOPL[0],it=ITM[sel[0]];
 const list=SHOPL.map(x=>`<div class='gc r${ITM[x[0]].r}${x[0]===sel[0]?' on':''}' data-a='sel' data-v='${x[0]}'><div class='gci'><span>${ITM[x[0]].ic}</span></div><div class='gcn'>${ITM[x[0]].n}</div><div class='gcp'>🪙 ${x[1]}</div></div>`).join('');
 const det=`<div class='gd r${it.r}'><div class='gdi big'><span>${it.ic}</span></div><h2>${it.n}</h2>${gpStars(it.r)}<p>${it.d}</p><div class='gr'><span>Fiyat</span><b>🪙 ${sel[1]}</b></div><div class='gr'><span>Elinde</span><b>${invHave(sel[0])}</b></div>
  <div class='gact'><button class='gb big' data-a='buy' data-v='${sel[0]}' data-w='1' ${SV.tl<sel[1]?'disabled':''}>Al ×1</button><button class='gb' data-a='buy' data-v='${sel[0]}' data-w='10' ${SV.tl<sel[1]*10?'disabled':''}>Al ×10 · 🪙 ${fmt(sel[1]*10)}</button></div>
  <p class='gnote'>Satmak için Çanta sekmesini kullan. Eşyalarının değeri burada daha düşüktür, ama hızlı para kazandırır.</p></div>`;
 return `<div class='gpl'>${list}</div>${det}`;
}
function gpRender(){
 const e=$('gp');if(!e)return;
 const old=e.querySelector('.gpl'),sc=old?old.scrollTop:0;
 const body=GP.tab==='sword'?gpSwordTab():GP.tab==='skill'?gpSkillTab():GP.tab==='bag'?gpBagTab():gpShopTab();
 e.innerHTML=`<div class='gpb'>${gpHead()}<div class='gpm'>${body}</div><div class='gpf'>${GP.msg||'&nbsp;'}</div></div>`;
 const nl=e.querySelector('.gpl');if(nl)nl.scrollTop=sc;
}

/* Lobi: Açık Dünya Merkezi görünümü */
function owcV(){
 return `<div class='pn2' style='grid-column:1/-1'><h3>Açık Dünya Merkezi</h3><p>Kılıçlarını yükselt, yeteneklerini slotlara yerleştir, düşen eşyalarını sat ya da tüccardan malzeme al. Açık dünyada köydeki Demirci Kaan ve Tüccar Mira ile de konuşabilirsin (E).</p>
 <div class='row' style='display:flex;gap:8px;flex-wrap:wrap'>${GTABS.map(t=>`<button class='btn alt' data-owc='${t[0]}'>${t[1]} ${t[2]}</button>`).join('')}</div>
 <p class='ms'>Seviye ${SV.ow.lvl} · ${SV.ow.sw.length}/10 kılıç · çantada ${Object.values(SV.ow.inv).reduce((a,b)=>a+b,0)} eşya</p></div>`;
}
function owcWire(){document.querySelectorAll('[data-owc]').forEach(b=>b.onclick=()=>gpOpenLobby(b.dataset.owc))}

function owNpcOff(){nearNpc=null;document.body.classList.remove('npcnear');const ip=$('ipr');if(ip)ip.style.display='none';if(OW.npcs)OW.npcs.forEach(n=>n.el.style.display='none')}
