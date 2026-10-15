'use strict';
/* ===== Açık dünya online: ortak mob, boss, PvE/PvP, uzak oyuncular + arkadaş kutusu ===== */
var OWN={on:false,id:0,ents:new Map(),pvp:false,sendT:0,mpT:0,tags:null,hurtBy:0,hurtT:-99,sentDead:false};

/* ---------- Giriş / çıkış ---------- */
function ownJoin(){
 if(!MPL.authed||!MPL.ws||OWN.on||OWN.joining)return;
 OWN.joining=true;
 try{OWN.pvp=localStorage.getItem('mmofps_pvp')==='1'}catch(e){}
 mpSend({t:'ojoin',ch:chWithKit(SV.eq.c),w:SV.ow.mw||'s0',pvp:OWN.pvp,lvl:SV.ow.lvl});
}
function ownLeave(){
 if(OWN.on||OWN.joining)mpSend({t:'oquit'});
 OWN.on=false;OWN.joining=false;ownClear();ownUI();
}
function ownClear(){
 for(const e of OWN.ents.values()){S.remove(e.g);if(e.tag)e.tag.remove()}
 OWN.ents.clear();
 for(const m of OW.mobs){m.net=false;m.nx=null}
}
function ownTagLayer(){
 if(!OWN.tags){const d=document.createElement('div');d.id='mptags';$('owhud').appendChild(d);OWN.tags=d}
 return OWN.tags;
}
function ownAdd(info){
 if(OWN.ents.has(info.id)||info.id===OWN.id)return;
 const w=WP[info.w]?info.w:'s0';
 const rig=mkHuman(CHAR(info.ch),false);
 holderSet(rig,w,SKIN('g0'));
 rig.root.position.set(info.x,info.y,info.z);S.add(rig.root);setShadow(rig.root);
 const tag=document.createElement('div');tag.className='mpt';ownTagLayer().appendChild(tag);
 const e={id:info.id,name:info.name,lvl:info.lvl||1,pvp:!!info.pvp,rig,g:rig.root,ch:info.ch,hp:1,wk:w,flinch:0,yaw:info.yaw||0,pitch:0,tx:info.x,ty:info.y,tz:info.z,tyaw:info.yaw||0,pvx:0,pvz:0,fl:1,psw:-1,pcb:0,swU:-1,combo:0,grip:0,ph0:Math.random()*10,tag};
 ownTag(e);OWN.ents.set(info.id,e);
}
function ownTag(e){e.tag.textContent=(e.pvp?'⚔ ':'')+e.name+' · Lv '+e.lvl;e.tag.style.color=e.pvp?'#ff8a7a':'#9dffb4'}
function ownRemove(id){const e=OWN.ents.get(id);if(!e)return;S.remove(e.g);if(e.tag)e.tag.remove();OWN.ents.delete(id)}

/* ---------- Köyde mi? (PvP köyde kapalı, mod sadece köyde değişir) ---------- */
const ownVillage=()=>Math.hypot(p.x,p.z)<14;
function ownSetPvp(v){
 OWN.pvp=!!v;try{localStorage.setItem('mmofps_pvp',v?'1':'0')}catch(e){}
 mpSend({t:'opvpset',v:v?1:0});ownUI();
}
function ownTogglePvp(){
 if(!OWN.on)return;
 if(!ownVillage()){owToast('PvE/PvP modunu sadece köyde değiştirebilirsin');return}
 ownSetPvp(!OWN.pvp);
 owToast(OWN.pvp?'PvP AÇIK: sadece PvP oynayan oyuncular sana vurabilir':'PvE: oyuncu hasarı almazsın, mob keserek ilerle');
}
function ownUI(){
 let b=$('pvpb');
 if(!b){const h=$('owhud');if(!h)return;b=document.createElement('button');b.id='pvpb';h.appendChild(b);b.addEventListener('click',e=>{e.stopPropagation();ownTogglePvp()})}
 b.style.display=OWN.on&&mode==='ow'?'block':'none';
 b.className=OWN.pvp?'pvp':'pve';
 b.textContent=(OWN.pvp?'⚔ PvP':'🛡 PvE')+' · '+(OWN.ents.size+1)+' oyuncu';
}

/* ---------- Mob olayları ---------- */
function ownDmg(m,d){
 const rt=m.boss?100:24+Math.random()*14;
 mpSend({t:'omd',i:m.id,d:Math.round(d*10)/10,max:m.max,rt:Math.round(rt)});
}
function ownSwing(cb){if(OWN.on)mpSend({t:'osw',cb})}
function ownPvpHit(q,d){mpSend({t:'opvp',id:q.id,d:Math.round(d)});q.flinch=1}
function ownHurtRemote(id,d){mpSend({t:'ohm',to:id,d:Math.round(d)})}
OWN.hurtRemote=ownHurtRemote;
function ownCanPvp(q){return OWN.on&&OWN.pvp&&q.pvp&&!ownVillage()&&Math.hypot(q.g.position.x,q.g.position.z)>=14}

/* ---------- Her karede ---------- */
const _owv=V3();
function ownTick(dt){
 if(!OWN.on)return;
 /* kendi durumumuz (12 Hz) */
 OWN.sendT-=dt;
 if(OWN.sendT<=0){
  OWN.sendT=.083;
  const r=v=>Math.round(v*100)/100;
  mpSend({t:'ost',x:r(p.x),y:r(p.y),z:r(p.z),yaw:r(p.yaw),pitch:r(p.pitch),vx:r(p.vx),vz:r(p.vz),f:(p.g?1:0)|(p.cr&&p.g?2:0)|(p.slide>0?4:0)|(p.spr?8:0)|(p.glide?16:0)|(p.wjT>0?32:0),w:wk,sw:swU>=0?r(swU):-1,cb:swCombo|((SET.grip|0)<<2),hp:r(Math.max(0,p.hp)/owMax()),lvl:SV.ow.lvl});
 }
 /* mob konumları: kendi yönettiğimiz saldırgan mobları yayınla (10 Hz) */
 OWN.mpT-=dt;
 if(OWN.mpT<=0){
  OWN.mpT=.1;const out=[];
  for(const m of OW.act){
   if(m.net||m.state==='dead')continue;
   if(m.state==='idle'){if(m.pubA){m.pubA=false;out.push(ownMobRow(m,0))}continue}
   m.pubA=true;out.push(ownMobRow(m,m.state==='aggro'?1:2));
  }
  if(out.length)mpSend({t:'omp',m:out});
 }
 /* uzak oyuncular */
 const k=1-Math.exp(-14*dt);
 for(const e of OWN.ents.values()){
  const q=e.g.position;
  if(Math.hypot(e.tx-q.x,e.tz-q.z)>10)q.set(e.tx,e.ty,e.tz);
  else{q.x+=(e.tx-q.x)*k;q.z+=(e.tz-q.z)*k;q.y+=(e.ty-q.y)*k}
  e.yaw=angLerp(e.yaw,e.tyaw,k);e.g.rotation.y=e.yaw+Math.PI;
  const w=WP[e.wk]||WP.s0,vx=e.pvx,vz=e.pvz,spd=Math.hypot(vx,vz),fx=-Math.sin(e.yaw),fz=-Math.cos(e.yaw);
  if(e.swU>=0){e.swU+=dt/Math.max(.25,w.rate||.6);if(e.swU>=1)e.swU=-1}
  e.flinch=Math.max(0,e.flinch-dt*4);
  e.g.visible=e.hp>0;
  if(!window.BGMODE&&e.hp>0)animHuman(e.rig,{t:clock+e.ph0,speed:spd,fwd:(vx*fx+vz*fz)/Math.max(spd,.01),air:!(e.fl&1),crouch:(e.fl&2)?1:0,slide:!!(e.fl&4),sprint:!!(e.fl&8),glide:!!(e.fl&16),wj:(e.fl&32)?1:0,lat:clamp(((e.pvx||0)*(-fz)+(e.pvz||0)*fx)/7,-1,1),crouch:0,pitch:e.pitch||0,lookYaw:0,flinch:e.flinch,ads:0,kick:0,kickR:0,kickL:0,
   swing:e.swU>=0?e.swU:null,combo:e.combo,grip:e.grip,rq:-1,sw:1,bob:clamp(spd/7,0,1)*((e.fl&1)?1:0),flash:0,flashL:0,lr:0},dt);
  if(e.tag){
   _owv.set(q.x,q.y+2.2,q.z).project(cam);
   const d=Math.hypot(q.x-p.x,q.z-p.z);
   if(_owv.z>1||_owv.z<-1||d>80||e.hp<=0)e.tag.style.display='none';
   else{e.tag.style.display='block';e.tag.style.left=((_owv.x*.5+.5)*innerWidth)+'px';e.tag.style.top=((-_owv.y*.5+.5)*innerHeight)+'px'}
  }
 }
}
function ownMobRow(m,st){
 return[m.id,+m.x.toFixed(2),+m.z.toFixed(2),+m.yaw.toFixed(2),st,m.atk>0?+m.atk.toFixed(2):0,m.atkT||0,+(m.ax||0).toFixed(2),+(m.az||0).toFixed(2),m.atkR||0,(m.nAtk||0)*2+(m.atkType==='slam'?1:0),m.stun>0?1:0];
}
function ownOnDeath(){
 if(!OWN.on)return;
 if(OW.t-OWN.hurtT<8&&OWN.hurtBy){mpSend({t:'opk',by:OWN.hurtBy});OWN.hurtBy=0}
}

/* ---------- Gelen mesajlar ---------- */
function ownMsg(m){
 const t=m.t;
 if(t==='fl'){frData(m);return true}
 if(t==='fm'){FR.msg=m.m;frRender();setTimeout(()=>{if(FR.msg===m.m){FR.msg='';frRender()}},3500);return true}
 if(t[0]!=='o')return false;
 switch(t){
 case'ofx':clsRecv(m);return true;
 case'owel':
  OWN.id=m.id;OWN.on=true;OWN.joining=false;
  for(const q of m.players)ownAdd(q);
  for(const x of m.mobs){const mb=OW.mobs[x[0]];if(!mb)continue;mb.max=x[2];mb.hp=x[1];if(x[3])ownMobDead(mb)}
  ownUI();if(!window.BGMODE)owToast('Çevrimiçi açık dünya · '+(m.players.length+1)+' oyuncu');
  return true;
 case'ojn':ownAdd(m.p);ownUI();if(!window.BGMODE)owToast(m.p.name+' açık dünyaya katıldı');return true;
 case'oleave':{const e=OWN.ents.get(m.id);if(e&&!window.BGMODE)owToast(e.name+' ayrıldı');ownRemove(m.id);ownUI();return true}
 case'opv':{const e=OWN.ents.get(m.id);if(e){e.pvp=!!m.v;ownTag(e)}return true}
 case'osnap':
  for(const s of m.s){
   const e=OWN.ents.get(s[0]);if(!e)continue;
   e.tx=s[1];e.ty=s[2];e.tz=s[3];e.tyaw=s[4];e.pitch=s[5];e.pvx=s[6];e.pvz=s[7];e.fl=s[8];e.psw=s[9];e.pcb=s[10];e.hp=s[12];
   if(WP[s[11]]&&e.wk!==s[11]){e.wk=s[11];holderSet(e.rig,e.wk,SKIN('g0'))}
   const pv=!!s[13];if(pv!==e.pvp){e.pvp=pv;ownTag(e)}
   if(e.psw>=0&&e.swU<0&&e.swGate!==true){e.swU=0;e.combo=e.pcb&3;e.grip=e.pcb>>2}
   e.swGate=e.psw>=0;
  }
  return true;
 case'ofx':{const e=OWN.ents.get(m.id);if(e){e.swU=0;e.combo=(m.cb|0)&3;e.grip=(m.cb|0)>>2;e.swGate=true}return true}
 case'omh':{
  const mb=OW.mobs[m.i];if(!mb||mb.state==='dead')return true;
  mb.max=m.max;mb.hp=Math.max(1,m.hp);
  if(mb.state!=='aggro'&&!mb.local){mb.net=true;owAggroNet(mb)}
  return true}
 case'omk':{
  const mb=OW.mobs[m.i];if(!mb||mb.state==='dead')return true;
  const mine=m.by===OWN.id||m.part.indexOf(OWN.id)>=0;
  mb.net=false;
  owKill(mb,{coop:mine&&m.part.length>=2},!mine);
  return true}
 case'omr':{
  const mb=OW.mobs[m.i];if(!mb)return true;
  const di=OW.dead.indexOf(mb);if(di>=0)OW.dead.splice(di,1);
  mb.hp=mb.max;mb.state='idle';mb.x=mb.hx;mb.z=mb.hz;mb.tx=null;mb.cd=1;mb.net=false;mb.atk=0;mb.stun=0;if(mb.g)mb.g.visible=true;
  return true}
 case'omp':
  for(const e of m.m){
   const mb=OW.mobs[e[0]];if(!mb||mb.state==='dead')continue;
   mb.net=true;mb.netT=0;mb.nx=e[1];mb.nz=e[2];mb.nyaw=e[3];
   const st=e[4];
   if(st===0){mb.net=false;mb.state='idle';mb.x=e[1];mb.z=e[2];mb.atk=0;continue}
   mb.state=st===1?'aggro':'return';
   if(!mb.g){mb.x=e[1];mb.z=e[2]}
   const nA=Math.floor(e[10]/2),sl=(e[10]&1)===1;
   if(nA!==mb.netN){
    mb.netN=nA;
    if(e[5]>0){mb.atkT=e[6]||1.6;mb.atk=e[5];mb.struck=(1-e[5]/mb.atkT)>=.55;mb.ax=e[7];mb.az=e[8];mb.atkR=e[9]||1.6;mb.atkType=sl?'slam':'strike';mb.res='';mb.whiff=false}
   }else if(mb.atk>0&&!mb.struck){mb.ax=e[7];mb.az=e[8]}
   if(e[11])mb.stun=Math.max(mb.stun||0,.35);
  }
  return true;
 case'omo':{
  const mb=OW.mobs[m.i];if(!mb)return true;
  if(m.o===OWN.id)mb.net=false;
  else if(m.o>0)mb.net=true;
  else if(mb.state==='aggro')mb.net=false; // sahibi ayrıldı: bu istemci devralmayı dener
  return true}
 case'opvh':{
  const a=OWN.ents.get(m.from);
  OWN.hurtBy=m.from;OWN.hurtT=OW.t;
  if(a)_mv.set(a.g.position.x,a.g.position.y+1,a.g.position.z);else _mv.set(p.x,p.y+1,p.z+1);
  if(OWN.pvp&&!ownVillage())hurt(m.d,_mv);
  return true}
 case'ohm':_mv.set(p.x,p.y+1,p.z+2);hurt(m.d,_mv);return true;
 case'okill':if(!window.BGMODE)owToast((m.by===OWN.id?'Sen':m.bn)+' ⚔ '+(m.id===OWN.id?'Sen':m.vn));return true;
 }
 return false;
}
function ownMobDead(mb){
 mb.hp=0;mb.state='dead';mb.respT=1e9;if(OW.dead.indexOf(mb)<0)OW.dead.push(mb);if(mb.g)mb.g.visible=false;
}
function owAggroNet(mb){for(const o of mb.camp.mem)if(o.hp>0&&o.state!=='dead'){o.state='aggro';o.net=true}}

/* ===================== Arkadaşlar + aktif oyuncular ===================== */
var FR={fr:[],rq:[],act:[],msg:'',sig:''};
function frData(m){
 const s=JSON.stringify([m.fr,m.rq,m.act]);
 FR.fr=m.fr;FR.rq=m.rq;FR.act=m.act;
 if(s!==FR.sig){FR.sig=s;frRender()}
}
function frAsk(){if(MPL.authed)mpSend({t:'fl'})}
const frEsc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function frRender(){
 const el=$('fr');if(!el)return;
 const keep=el.querySelector('#frin'),val=keep?keep.value:'',foc=keep&&document.activeElement===keep;
 if(!MPL.authed){
  el.innerHTML='<div class="frp"><div class="frh">Arkadaşlar</div><div class="frs">Arkadaş eklemek ve diğer oyuncuları görmek için çevrimiçi hesabına giriş yap.</div><button class="chip" data-a="login">Giriş yap</button></div><div class="frp"><div class="frh">Aktif oyuncular</div><div class="frs">—</div></div>';
  return;
 }
 const st=n=>n[1]?'<i class="on"></i>':'<i></i>';
 let top='<div class="frh">Arkadaşlar <small>'+FR.fr.filter(f=>f[1]).length+'/'+FR.fr.length+' aktif</small></div>';
 top+='<div class="frad"><input id="frin" maxlength="14" placeholder="oyuncu adı" autocomplete="off"><button data-a="send">+</button></div>';
 if(FR.msg)top+='<div class="frm">'+frEsc(FR.msg)+'</div>';
 let lst='';
 for(const q of FR.rq)lst+='<div class="fi2 rq"><span>'+frEsc(q)+'<small>istek</small></span><b data-a="acc" data-n="'+frEsc(q)+'">✓</b><b data-a="rej" data-n="'+frEsc(q)+'">✕</b></div>';
 const frs=FR.fr.slice().sort((a,b)=>b[1]-a[1]);
 for(const f of frs)lst+='<div class="fi2">'+st(f)+'<span>'+frEsc(f[0])+(f[1]?'<small>'+frEsc(f[2])+'</small>':'<small>çevrimdışı</small>')+'</span><b data-a="del" data-n="'+frEsc(f[0])+'" title="Arkadaşlıktan çıkar">✕</b></div>';
 if(!lst)lst='<div class="frs">Henüz arkadaşın yok. Aşağıdaki aktif oyunculardan ya da isim yazarak ekle.</div>';
 let bot='<div class="frh">Aktif oyuncular <small>'+FR.act.length+'</small></div>';
 let al='';
 for(const a of FR.act)al+='<div class="fi2"><i class="on"></i><span>'+frEsc(a[0])+'<small>'+frEsc(a[1])+'</small></span>'+(a[2]?'<em>arkadaş</em>':'<b data-a="add" data-n="'+frEsc(a[0])+'" title="Arkadaş ekle">+</b>')+'</div>';
 if(!al)al='<div class="frs">Şu an başka aktif oyuncu yok.</div>';
 el.innerHTML='<div class="frp">'+top+'<div class="frl">'+lst+'</div></div><div class="frp">'+bot+'<div class="frl">'+al+'</div></div>';
 const ni=el.querySelector('#frin');if(ni){ni.value=val;if(foc)ni.focus()}
}
(function(){
 const el=document.getElementById('fr');if(!el)return;
 el.addEventListener('click',e=>{
  const b=e.target.closest('[data-a]');if(!b)return;
  const a=b.dataset.a,n=b.dataset.n;
  if(a==='login'){if(typeof mpOpenDialog==='function')mpOpenDialog();return}
  if(a==='send'){const i=el.querySelector('#frin');const v=i?i.value.trim():'';if(v){mpSend({t:'fadd',n:v});i.value=''}return}
  if(a==='add')mpSend({t:'fadd',n:n});
  else if(a==='acc')mpSend({t:'facc',n:n});
  else if(a==='rej')mpSend({t:'frej',n:n});
  else if(a==='del'){if(confirm(n+' arkadaşlıktan çıkarılsın mı?'))mpSend({t:'fdel',n:n})}
 });
 el.addEventListener('keydown',e=>{if(e.target.id==='frin'){e.stopPropagation();if(e.key==='Enter'){const v=e.target.value.trim();if(v){mpSend({t:'fadd',n:v});e.target.value=''}}}});
 frRender();
 setInterval(()=>{if(MPL.authed&&lobbyOn)frAsk()},5000);
})();
