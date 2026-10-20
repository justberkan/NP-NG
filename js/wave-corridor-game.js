'use strict';
/* Oyun adaptörü: mevcut mkE/updZombie/damageEnemy/ragdoll/hesap kaydı kullanılır. */
const WCG={game:null,chosen:false,net:false,owner:true,id:0,host:0,code:'',peers:new Map(),avatars:new Map(),pool:[],pickups:[],pickId:0,zid:0,reserve:{},sendT:0,lo:null,environment:null,ended:false,snapshot:null,pending:null};
function wcSend(o){mpSend(o)}
function wcOpen(cb){
 if(WCG.game){wcDispose();_wcLobby()}
 let el=$('wcselect');if(!el){el=document.createElement('div');el.id='wcselect';el.className='wc-dialog';document.body.appendChild(el)}
 el.innerHTML=`<div class="wc-card"><p class="wc-kicker">N.P.N.G. / ZOMBİ HAYATTA KALMA</p><h1>Koridor: Dalga Ağacı</h1><p>100 spawner · 100 tur · Her 10 turda boss</p><p class="note">Spawner’ı kır, dalgayı temizle, koridoru genişlet. Mermi sınırlı: kutuları topla, bıçağını unutma.</p><div class="row"><button class="btn" id="wcsolo">TEK BAŞINA</button><button class="btn alt" id="wccreate">CO-OP ODA AÇ</button></div><div class="row"><input id="wcpass" maxlength="32" placeholder="Oda şifresi (isteğe bağlı)" aria-label="Oda şifresi" autocomplete="off"></div><div class="row"><input id="wccode" maxlength="8" placeholder="Arkadaşının oda kodu" aria-label="Co-op oda kodu"><button class="btn alt" id="wcjoin">ODAYA KATIL</button><button class="btn alt" id="wclist">AÇIK LOBİLER</button></div><p id="wcstatus" class="note">Co-op: Aynı sunucuda 2–4 oyuncu. Oda sahibi ayrılırsa maç biter.</p><button class="btn alt" id="wccancel">GERİ</button></div>`;el.style.display='flex';
 $('wcsolo').onclick=async()=>{if(!await wcEnsureMinecraft()||el.style.display!=='flex')return;WCG.pending=null;WCG.net=false;WCG.owner=true;WCG.id=0;WCG.code='';WCG.peers.clear();el.style.display='none';WCG.chosen=true;cb()};
 const join=create=>{const run=async()=>{if(WCG.pending)return;if(!await wcEnsureMinecraft()||el.style.display!=='flex')return;const code=$('wccode').value.trim();if(!create&&!code){$('wcstatus').textContent='Oda kodunu yaz.';return}const pending=()=>{el.style.display='none';WCG.chosen=true;cb()};WCG.pending=pending;$('wcstatus').textContent='Sunucuya bağlanılıyor...';wcSend({t:create?'wc_create':'wc_join',code,pass:$('wcpass').value});setTimeout(()=>{if(WCG.pending===pending){WCG.pending=null;$('wcstatus').textContent='Koridor sunucusu yanıt vermedi. Güncel server.js ile sunucuyu yeniden aç.'}},8000)};if(!MPL.authed)mpOpenDialog(run);else run()};
 $('wccreate').onclick=()=>join(true);$('wcjoin').onclick=()=>join(false);$('wclist').onclick=()=>{el.style.display='none';if(typeof roomsOpen==='function')roomsOpen('wc')};if(WCG.joinReq){const q=WCG.joinReq;WCG.joinReq=null;$('wccode').value=q.code;$('wcpass').value=q.pass||'';join(false)}$('wccancel').onclick=()=>{WCG.pending=null;el.style.display='none'};
}
function wcPlayers(){const list=[{id:WCG.id,position:{x:p.x,y:p.y,z:p.z},alive:p.dead<=0&&p.hp>0,hp:p.hp,name:'Sen'}];for(const [id,q] of WCG.peers)if(id!==WCG.id)list.push({id,position:{x:q.x||0,y:q.y||0,z:q.z==null?8:q.z},alive:q.hp>0,hp:q.hp,name:q.name});return list}
function wcMoney(n){if(!Number.isFinite(n)||n<=0)return;SV.tl+=n;save();bal();if(WCG.net&&WCG.owner)wcSend({t:'wc_event',event:'reward',amount:n})}
function wcPickup(type,pos,lifetime,serverId){
 if(!['ammo','health'].includes(type)||!Number.isFinite(pos.x)||!Number.isFinite(pos.z))return;
 let x=pos.x,z=pos.z;const half=WCG.game?.getBounds().halfWidth||3;
 if(serverId==null){x=clamp(x,-half+.9,half-.9)+(type==='ammo'?-.38:.38);z=clamp(z,(WCG.game?.getBounds().minZ||-3000)+.7,17.3)}
 const id=serverId==null?++WCG.pickId:serverId;WCG.pickId=Math.max(WCG.pickId,id);const m=wcItemModel(type);m.position.set(x,0,z);S.add(m);WCG.pickups.push({id,type,x,y:0,z,t:lifetime,age:serverId==null?0:(pos.age||0),phase:(id*1.7)%6.28,requestCd:0,m});
}
function wcSpawn(opts){
 let e=WCG.pool.find(e=>e.hp<=0);
 if(!e){e=wcCreateMinecraftEntity();WCG.pool.push(e)}
 e.hp=e.max=opts.hp;e.damage=opts.damage;e.sp=opts.speed;e.boss=!!opts.boss;e.wc=true;e.wcid=++WCG.zid;e.alive=true;e.cd=1.5;e.atk=0;e.flinch=0;e.g.visible=true;e.g.scale.setScalar(opts.scale);e.g.position.set(opts.x,opts.y,opts.z);e.object3D=e.g;e.minecraft=true;return e;
}
function wcStart(){
 if(!WCMC.model)throw new Error('Minecraft zombi modeli yüklenmedi');WCG.warmCd=0;
 WCG.chosen=false;WCG.ended=false;WCG.pool=[];WCG.pickups=[];WCG.pickId=WCG.zid=0;WCG.sendT=0;
 WCG.lo={ok:LO.ok,on:LO.on,keys:LO.keys.slice(),mod:{...LO.mod}};
 LO.ok=LO.on=true;LO.keys=['rifle','pistol','knife'];LO.mod={rifle:DEF_MOD.rifle,pistol:DEF_MOD.pistol,knife:DEF_MOD.knife};loSync();
 WCG.reserve={rifle:90,pistol:36};for(const k of LO.keys)wa[k]=WP[k].mag||0;wk=null;setW('rifle',true);
 WCG.environment={boxes:boxes.slice(),meshes:boxMeshes.slice(),floor:floor.position.y,fog:[S.fog.near,S.fog.far],fogColor:S.fog.color.getHex(),sky:S.background.getHex()};for(const b of boxes)b.m.visible=false;boxes.length=0;boxMeshes.length=0;floor.position.y=-500;

 S.background.setHex(0x18252e);S.fog.near=35;S.fog.far=125;p.x=0;p.z=8;p.y=0;p.hp=100;p.dead=0;p.inv=0;p.lives=3;p.rescue=0;p.safe={x:0,z:8};hudHp();timeLeft=999999;
 const api={wallCleared:wcGateDust,getPlayers:wcPlayers,spawnZombie:wcSpawn,addMoney:wcMoney,healAllAlive:()=>{if(p.dead<=0){p.hp=100;hudHp()}for(const q of WCG.peers.values())if(q.hp>0)q.hp=100},dropPickup:wcPickup,endGame:wcEnd,ui:{message:t=>{$('msg').textContent=t},hud:wcHud}};
 WCG.game=new WaveCorridor(S,api);WCG.game.start();wcTerrainBuild();boxMeshes.push(WCG.game.gate);if(WCG.snapshot&&!WCG.owner)wcApplySnapshot(WCG.snapshot);wcHud({round:1,total:100,alive:0,queue:0,spawnerHp:65,spawnerMax:65});
}
function wcEnd(win,stats){
 if(WCG.ended)return;WCG.ended=true;if(WCG.game)WCG.game.state='over';firing=false;state='end';if(document.exitPointerLock)document.exitPointerLock();
 $('ttl').textContent=win?'100 TUR TAMAMLANDI!':'Koridor sona erdi';$('sub').textContent='Koridor: Dalga Ağacı';$('res').textContent=`Tur ${stats.round}/100 · Kazanılan ${fmt(stats.earned)} TL hesabında kaldı.`;$('play').textContent='TEKRAR';$('ov').classList.remove('off');
 if(WCG.net&&WCG.owner)wcSend({t:'wc_event',event:'end',win,stats});
}
function wcHud(d){let el=$('wchud');if(!el){el=document.createElement('div');el.id='wchud';$('hud').appendChild(el)}el.style.display='block';const hudKey=JSON.stringify([d,p.dead>0,WCG.code,p.lives,WCT.theme]);if(el._wcKey===hudKey)return;el._wcKey=hudKey;el.innerHTML=`<div class="wc-kicker">KORİDOR: DALGA AĞACI${WCG.net?' · ODA '+WCG.code:''}</div><b>Tur ${d.round}/${d.total}</b> · ${WCT.theme} · Düşüş hakkı: ${p.lives??3}/3 · ${d.alive} / 5 zombi · Sırada ${d.queue}<div class="wc-meter"><i style="width:${d.spawnerHp==null?0:100*d.spawnerHp/d.spawnerMax}%"></i></div><small>${d.spawnerHp==null?(d.bossHp!=null?'BOSS: '+Math.ceil(d.bossHp)+' CAN':'Dalgayı temizle'):'Spawner: '+Math.ceil(d.spawnerHp)+' / '+d.spawnerMax+' CAN · Ateş et veya bıçakla kır'}</small>${p.dead>0?'<p>İzleyici · Hayatta kalan takım arkadaşını izliyorsun</p>':''}`}
function wcCollect(pick,who){
 if(who==='self'){if(pick.type==='health'){const old=p.hp;p.hp=Math.min(100,p.hp+35);hudHp();if(p.hp>old)wcPickupNotice('Can +'+Math.ceil(p.hp-old))}else{WCG.reserve.rifle+=60;WCG.reserve.pistol+=24;upd();wcPickupNotice('Mermi +60 tüfek / +24 tabanca')}}
 else if(pick.type==='health'){const q=WCG.peers.get(who);if(q)q.hp=Math.min(100,q.hp+35)}
 if(WCG.net&&WCG.owner&&who!=='self')wcSend({t:'wc_event',event:'pickup',id:who,type:pick.type});pick.t=0;
}
function wcSnapshot(){const g=WCG.game;return{rear:WCT.rear,state:g.state,round:g.round,broken:g.broken,earned:g.earned,queue:g.queue,half:g.half,sp:{...g.sp},zombies:WCG.pool.filter(e=>e.hp>0).map(e=>({id:e.wcid,x:e.g.position.x,y:e.g.position.y,z:e.g.position.z,hp:e.hp,max:e.max,boss:e.boss,minecraft:e.minecraft,frozen:e.frozen,sp:e.sp})),players:wcPlayers().map(q=>({id:q.id,x:q.position.x,y:q.position.y,z:q.position.z,hp:q.hp,lives:q.id===WCG.id?p.lives:WCG.peers.get(q.id)?.lives??3,rescue:q.id===WCG.id?p.rescue:WCG.peers.get(q.id)?.rescue||0})),pickups:WCG.pickups.filter(q=>q.t>0).map(q=>({id:q.id,x:q.x,z:q.z,type:q.type,y:q.y,t:q.t,age:q.age}))}}
function wcApplySnapshot(d){
 WCG.snapshot=d;if(Number.isFinite(d.rear))WCT.rear=d.rear;const g=WCG.game;if(!g)return;if(d.round>g.round)wcGateDust();
 for(let i=0;i<g.spawners.length;i++)g.spawners[i].visible=i===d.round-1&&d.state==='spawner';
 Object.assign(g,{state:d.state,round:d.round,idx:d.round-1,broken:d.broken,earned:d.earned,queue:d.queue,half:d.half,targetHalf:d.half});g.sp={...d.sp};g.syncGate();g.wallL.position.x=-d.half-.5;g.wallR.position.x=d.half+.5;
 g.spawnerHitbox=d.state==='spawner'?[g.spawners[g.idx]]:[];if(g.spawnerHitbox[0])g.activateSpawner(g.spawnerHitbox[0]);
 const ids=new Set(d.zombies.map(q=>q.id));for(const e of WCG.pool)if(!ids.has(e.wcid)&&e.hp>0){killEnemy(e,{by:'Takım'});e.alive=false}
 for(const q of d.zombies){let e=WCG.pool.find(e=>e.wcid===q.id&&e.hp>0);if(!e){e=wcSpawn({x:q.x,y:q.y,z:q.z,hp:q.hp,damage:0,speed:q.sp,boss:q.boss,minecraft:q.minecraft,scale:q.boss?2.2:1});e.wcid=q.id}e.hp=q.hp;e.max=q.max;e.frozen=q.frozen;e.g.position.set(q.x,q.y,q.z);e.yaw=Math.atan2(p.x-q.x,p.z-q.z);e.g.rotation.y=e.yaw;animHuman(e.rig,{t:clock,speed:q.frozen?0:q.sp,fwd:1,atk:0},.1)}
 for(const q of d.players){if(q.id===WCG.id&&!WCG.owner){const was=p.hp;p.hp=q.hp;p.lives=q.lives??3;if((q.rescue||0)>(p.rescue||0)){p.rescue=q.rescue;p.x=q.x;p.y=q.y;p.z=q.z;p.vx=p.vy=p.vz=0;p.gr=null;wcPickupNotice(p.lives?"Güvenli noktaya döndün · Hak: "+p.lives:"Düşüş hakların bitti")}if(p.hp<=0){p.dead=1e9;firing=false}else if(was>0)p.dead=0;hudHp()}else if(q.id!==WCG.id){const old=WCG.peers.get(q.id)||{};WCG.peers.set(q.id,{...old,...q})}}
 for(const pick of WCG.pickups)if(!d.pickups.some(q=>q.id===pick.id))pick.t=0;
 for(const q of d.pickups){let pick=WCG.pickups.find(p=>p.id===q.id&&p.t>0);if(!pick){wcPickup(q.type,q,q.t,q.id);pick=WCG.pickups.at(-1)}Object.assign(pick,{x:q.x,y:q.y||0,z:q.z,t:q.t});pick.age=Math.max(pick.age,q.age||0)}
 wcHud({round:g.round,total:100,alive:d.zombies.length,queue:g.queue,spawnerHp:g.state==='spawner'?g.sp.hp:null,spawnerMax:g.sp.max,bossHp:d.zombies.find(z=>z.boss)?.hp});
}
function wcTick(dt){
 const g=WCG.game;if(!g)return;
 if(WCG.net&&!MPL.authed&&!WCG.ended){wcEnd(false,{round:g.round,earned:g.earned});return}
 if(WCG.pickupNoticeT>0){WCG.pickupNoticeT-=dt;if(WCG.pickupNoticeT<=0&&$('wcpickupnotice'))$('wcpickupnotice').style.display='none'}
 wcCorpseTick(dt);wcGateFxTick(dt);wcWarmPool(dt);
 if(!WCG.ended&&WCG.owner){g.update(dt);wcSeparateMobs()}
 const b=g.getBounds();if(!(typeof admToolOn==='function'&&admToolOn('noclip'))){p.x=clamp(p.x,-b.halfWidth,b.halfWidth);p.z=clamp(p.z,b.minZ,Math.min(18,WCT.rear-2));p.y=Math.min(p.y,7.8)}wcTerrainTick();wcTerrainPlayer();if(p.y>=7.8)p.vy=Math.min(0,p.vy);
 for(const e of WCG.pool)if(e.hp>0){e.g.position.x=clamp(e.g.position.x,-b.halfWidth,b.halfWidth);e.g.position.z=Math.max(b.minZ,e.g.position.z)}
 for(let i=WCG.pickups.length-1;i>=0;i--){const q=WCG.pickups[i];q.t-=dt;if(q.t<=0){wcRemovePickup(q);WCG.pickups.splice(i,1);continue}wcAnimatePickup(q,dt);q.requestCd-=dt;
  if(p.dead<=0&&wcCanCollect(q,p.hp,p.x,p.y,p.z)){if(WCG.owner)wcCollect(q,'self');else if(q.requestCd<=0){q.requestCd=.35;wcSend({t:'wc_pick',pick:q.id})}}
 }
 if(WCG.net&&!WCG.ended){WCG.sendT-=dt;if(WCG.sendT<=0){WCG.sendT=.1;wcSend({t:'wc_state',d:{x:p.x,y:p.y,z:p.z,yaw:p.yaw,w:wk,rescue:p.rescue||0}});if(WCG.owner)wcSend({t:'wc_snapshot',d:wcSnapshot()})}}
 for(const [id,q] of WCG.peers){if(id===WCG.id)continue;let av=WCG.avatars.get(id);if(!av){av=mkHuman(BOTCOL.a);S.add(av.root);holderSet(av,'rifle',SKIN('g0'));WCG.avatars.set(id,av)}av.root.visible=q.hp>0;av.root.position.set(q.x||0,q.y||0,q.z==null?8:q.z);av.root.rotation.y=(q.yaw||0)+Math.PI;animHuman(av,{t:clock,speed:0,fwd:1,ads:0,rq:-1,sw:1},dt)}
}
function wcDispose(){
 wcTerrainDispose();
 if(WCG.net)wcSend({t:'wc_leave'});WCG.net=false;WCG.pending=null;
 for(const q of WCG_GATE_FX)S.remove(q.m);WCG_GATE_FX.length=0;
 for(const c of WCMC_CORPSES)S.remove(c.root);WCMC_CORPSES.length=0;
 if(WCG.game)WCG.game.dispose();WCG.game=null;WCG.snapshot=null;
 for(const q of WCG.pickups)wcRemovePickup(q);WCG.pickups=[];const notice=$('wcpickupnotice');if(notice)notice.style.display='none';
 for(const av of WCG.avatars.values())S.remove(av.root);WCG.avatars.clear();WCG.peers.clear();
 if(WCG.ground){S.remove(WCG.ground);WCG.ground.geometry.dispose();WCG.ground.material.dispose();WCG.ground=null}
 if(WCG.environment){const e=WCG.environment;boxes.length=0;boxes.push(...e.boxes);boxMeshes.length=0;boxMeshes.push(...e.meshes);for(const b of boxes)b.m.visible=true;floor.position.y=e.floor;S.fog.near=e.fog[0];S.fog.far=e.fog[1];S.background.setHex(e.sky);S.fog.color.setHex(e.fogColor);WCG.environment=null}
 if(WCG.lo){Object.assign(LO,WCG.lo);WCG.lo=null}const h=$('wchud');if(h)h.style.display='none';
}
function wcNetMsg(m){
 if(m.t==='wc_welcome'){if(!WCG.pending){wcSend({t:'wc_leave'});return}Object.assign(WCG,{net:true,owner:m.id===m.host,id:m.id,host:m.host,code:m.code,snapshot:m.snapshot});WCG.peers=new Map(m.players.map(q=>[q.id,{...q,hp:100,x:0,y:0,z:8}]));const cb=WCG.pending;WCG.pending=null;if(cb)cb();else wcSend({t:'wc_leave'});return}
 if(m.t==='wc_error'){WCG.pending=null;const el=$('wcstatus');if(el)el.textContent=m.message;if(m.need==='pass'&&typeof roomsAskPass==='function')roomsAskPass('wc',m.code,m.message);return}
 if(m.t==='wc_peers'){const ids=new Set(m.players.map(q=>q.id));for(const id of WCG.peers.keys())if(!ids.has(id)){WCG.peers.delete(id);const av=WCG.avatars.get(id);if(av)S.remove(av.root);WCG.avatars.delete(id)}for(const q of m.players)WCG.peers.set(q.id,{hp:100,x:0,y:0,z:8,...WCG.peers.get(q.id),...q});return}
 if(!WCG.game||mode!=='wc')return;
 if(m.t==='wc_admin_heal'&&WCG.owner){if(m.id===WCG.id){p.hp=100;hudHp()}else{const q=WCG.peers.get(m.id);if(q)q.hp=100}return}
 if(m.t==='wc_closed'){wcEnd(false,{round:WCG.game.round,earned:WCG.game.earned});$('sub').textContent=m.reason;return}
 if(m.t==='wc_snapshot'&&!WCG.owner){wcApplySnapshot(m.d);return}
 if(m.t==='wc_state'&&WCG.owner&&m.id!==WCG.id){const q=WCG.peers.get(m.id);if(q&&(m.d.rescue||0)===(q.rescue||0)){const b=WCG.game.getBounds();Object.assign(q,m.d,{x:m.d.adminFly?m.d.x:clamp(m.d.x,-b.halfWidth,b.halfWidth),z:m.d.adminFly?m.d.z:clamp(m.d.z,b.minZ,Math.min(18,WCT.rear-2))});wcFallActor(q)}return}
 if(m.t==='wc_hit'&&WCG.owner&&!WCG.ended){const actor=WCG.peers.get(m.id);if(!actor||actor.hp<=0)return;const target=m.target===0?WCG.game.spawners[WCG.game.idx]:WCG.pool.find(e=>e.wcid===m.target&&e.hp>0)?.g;if(!target)return;const reach=WP[m.w]?.melee?(WP[m.w].range+1):100;if(Math.hypot(actor.x-target.position.x,actor.z-target.position.z)>reach)return;if(m.target===0)WCG.game.damageSpawner(m.damage);else damageEnemy(target.userData.e,m.damage,{by:actor.name,w:m.w,pt:target.position.clone(),dir:V3(0,0,1)});return}
 if(m.t==='wc_pick'&&WCG.owner){const actor=WCG.peers.get(m.id),pick=WCG.pickups.find(q=>q.id===m.pick&&q.t>0);if(actor&&actor.hp>0&&pick&&wcCanCollect(pick,actor.hp,actor.x,actor.y,actor.z))wcCollect(pick,m.id);return}
 if(m.t==='wc_event'&&!WCG.owner){if(m.event==='reward')wcMoney(m.amount);else if(m.event==='pickup'&&m.id===WCG.id)wcCollect({type:m.type},'self');else if(m.event==='end')wcEnd(m.win,m.stats)}
}
const _wcMpMsg=mpMsg;mpMsg=function(m){if(m.t.startsWith('wc_'))return wcNetMsg(m);return _wcMpMsg(m)};
const _wcSetup=setupMode;setupMode=function(){if(WCG.game)wcDispose();_wcSetup();if(mode==='wc')wcStart()};
const _wcLobby=toLobby;toLobby=function(){if(WCG.game)wcDispose();return _wcLobby()};
const _wcTargets=targetObjs;targetObjs=function(){const a=_wcTargets();if(mode==='wc'&&WCG.game)a.push(...WCG.game.spawnerHitbox);return a};
function wcSpawnerDamage(d){if(!WCG.game)return;if(WCG.owner)WCG.game.damageSpawner(d);else wcSend({t:'wc_hit',target:0,w:wk})}
const _wcMelee=applyMelee;applyMelee=function(){_wcMelee();if(mode!=='wc'||!WCG.game||p.dead>0)return;const m=WCG.game.spawnerHitbox[0];if(!m)return;const v=m.position.clone().sub(cam.position);cam.getWorldDirection(_dir);if(v.length()<=cw.range+1&&v.normalize().dot(_dir)>.15)wcSpawnerDamage(meleeDmg())};
const _wcDamage=damageEnemy;damageEnemy=function(e,d,info){if(mode==='wc'&&e.wc&&!WCG.owner){if(info?.player)wcSend({t:'wc_hit',target:e.wcid,w:wk,head:!!info.head});return}return _wcDamage(e,d,info)};
const _wcKill=killEnemy;killEnemy=function(e,info){const live=e.alive;_wcKill(e,info);if(e.wc&&live){e.alive=false;e.onDeath?.(e)}};
const _wcHurt=hurt;hurt=function(d,from){if(mode==='wc'&&!WCG.owner)return;_wcHurt(d,from);if(mode==='wc'&&p.hp<=0){p.hp=0;p.dead=1e9;firing=false;hudHp()}};
const _wcReload=startReload;startReload=function(){if(mode==='wc'&&(WCG.reserve[wk]||0)<=0)return;return _wcReload()};
const _wcEnemies=updE;updE=function(dt){if(mode!=='wc')return _wcEnemies(dt);if(WCG.owner)for(const e of WCG.pool)if(e.hp>0&&!e.frozen)updZombie(e,dt)};
const _wcStep=stepPlayer;stepPlayer=function(dt){const r=reload,a=ammo,k=wk;_wcStep(dt);if(mode!=='wc')return;if(r>0&&reload<=0&&wk===k){const take=Math.min(cw.mag-a,WCG.reserve[k]||0);ammo=a+take;WCG.reserve[k]-=take;wa[k]=ammo;upd()}wcTick(dt)};
const _wcUpd=upd;upd=function(){_wcUpd();if(mode==='wc'&&WCG.game){$('tm').textContent='Tur '+WCG.game.round+'/100';$('scr').textContent='Öldürme '+kills;$('ammo').textContent=cw.melee?cw.n:cw.n+' '+ammo+' / '+(WCG.reserve[wk]||0)+' yedek'}};
const _wcView=updPlayerView;updPlayerView=function(dt){_wcView(dt);if(mode==='wc'&&p.dead>0){const q=wcPlayers().find(q=>q.alive);if(q){cam.position.set(q.position.x+2.5,q.position.y+2.4,q.position.z+3);cam.lookAt(q.position.x,q.position.y+1.2,q.position.z)}}};
function wcZombieTarget(e){let best=null,d=Infinity;for(const q of wcPlayers()){if(!q.alive)continue;const dist=Math.hypot(q.position.x-e.g.position.x,q.position.z-e.g.position.z);if(dist<d){d=dist;best=q}}return best}
function wcDamagePlayer(target,d,from){if(target.id===WCG.id)hurt(d,from);else{const q=WCG.peers.get(target.id);if(q&&!q.adminGod)q.hp=Math.max(0,q.hp-d)}}
const _wcLoHud=loHud;loHud=function(){if(mode!=='wc')return _wcLoHud();let h=$('lohud');if(!h){h=document.createElement('div');h.id='lohud';$('hud').appendChild(h)}h.innerHTML=LO.keys.map((k,i)=>`<div class="lh ${k===wk?'on':''}" data-k="${k}"><b>${i+1}</b><span class="sil">${loIcon({k,m:LO.mod[k]})}</span></div>`).join('');h.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>setW(b.dataset.k))};
const _wcHudT=hudT;hudT=function(){if(mode==='wc'&&WCG.game){$('tm').textContent='Tur '+WCG.game.round+'/100';return}return _wcHudT()};
