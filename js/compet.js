'use strict';
/* =====================================================================
   N.P.N.G. — Rekabetçi mod (5v5 bombalı raunt), botlarla çevrimdışı ilk sürüm.
   Kaynak: NPNG-Rekabetci-Paketi (Codex) — competitive-economy.v1 / competitive-rank.v1.
   Bu sürümde: Rütbesiz (botlarla), MR15 (16 raunt kazanan; 15-15 beraberlik), taraf değişimi,
   maç cüzdanı ekonomisi (₺800 başlangıç, ₺16.000 tavan, raunt/kill ödülleri, mağlubiyet serisi),
   6 dilimli satın alma menüsü (B), bomba kurma/çözme (E), freeze/raunt/bomba süreleri.
   Rütbeli (Elo) çevrimiçi kuyruk gerektirir: kilitli, yalnız profil/rütbe ekranı gösterilir.
   Bombalar (HE/flaş/sis/molotof/yem) oyunda henüz bomba sistemi olmadığı için menüde "yakında".
   ===================================================================== */
const CMPC={
 start:800,cap:16000,win:3250,objWin:3500,plantBonus:800,lossLadder:[1400,1900,2400,2900,3400],
 freeze:15,buyTime:30,live:115,bomb:40,plant:3.2,defuse:10,defuseKit:5,endPause:5,half:15,winRounds:16,
 siteR:3.5,defuseR:1.8,blastRadius:28,blastPeak:500,blastScale:10.8
};
/* ürünler: [id, ad, kategori, takımlar, fiyat, kill ödülü, slot, model] */
const CMPI=[
 ['t_default','T Başlangıç Tabancası','pistols','T',0,300,'sec','m_g17'],
 ['ct_default','CT Başlangıç Tabancası','pistols','CT',0,300,'sec','m_p9'],
 ['pistol_standard','Standart Tabanca','pistols','T CT',300,300,'sec','m_p2020'],
 ['pistol_piercing','Zırh Delici Tabanca','pistols','T CT',500,300,'sec','m_57'],
 ['pistol_auto','Seri Tabanca','pistols','T CT',600,100,'sec','m_g17'],
 ['pistol_heavy','Ağır Tabanca','pistols','T CT',700,300,'sec','m_deagle'],
 ['smg_budget','Ekonomik SMG','heavy_smg','T CT',1050,600,'pri','m_skor'],
 ['t_smg','T Hücum SMG','heavy_smg','T',1200,600,'pri','m_ump'],
 ['ct_smg','CT Hücum SMG','heavy_smg','CT',1400,600,'pri','m_mp7'],
 ['smg_capacity','Yüksek Şarjörlü SMG','heavy_smg','T CT',2350,300,'pri','m_p90'],
 ['shotgun_basic','Temel Pompalı','heavy_smg','T CT',1200,900,'pri','m_xma'],
 ['t_budget_rifle','T Ekonomik Tüfek','rifles','T',2000,300,'pri','m_galil'],
 ['ct_budget_rifle','CT Ekonomik Tüfek','rifles','CT',2250,300,'pri','m_famas'],
 ['t_main_rifle','T Ana Tüfek','rifles','T',2700,300,'pri','m_ak556'],
 ['ct_main_rifle','CT Ana Tüfek','rifles','CT',3100,300,'pri','m_m4'],
 ['sniper_light','Hafif Keskin Nişancı','rifles','T CT',1700,300,'pri','m_m24'],
 ['sniper_heavy','Ağır Keskin Nişancı','rifles','T CT',4750,100,'pri','m_awm'],
 ['armor_vest','Yelek','equipment','T CT',650,0,'armor',null],
 ['armor_helmet','Yelek + Kask','equipment','T CT',1000,0,'armor',null],
 ['defuse_kit','İmha Kiti','equipment','CT',400,0,'kit',null],
 ['knife','Savaş Bıçağı','equipment','T CT',0,1500,'melee',null],
 ['grenade_he','El Bombası','grenades','T CT',300,300,'gren',null],
 ['grenade_flash','Flaş Bombası','grenades','T CT',200,300,'gren',null],
 ['grenade_smoke','Sis Bombası','grenades','T CT',300,300,'gren',null],
 ['t_molotov','Molotof','grenades','T',400,300,'gren',null],
 ['ct_incendiary','Yanıcı Bomba','grenades','CT',600,300,'gren',null],
 ['grenade_decoy','Yem Bombası','grenades','T CT',50,300,'gren',null]
].map(a=>({id:a[0],n:a[1],cat:a[2],teams:a[3].split(' '),p:a[4],kr:a[5],slot:a[6],mid:a[7]}));
const CMPID={};CMPI.forEach(i=>CMPID[i.id]=i);
const CMPCAT=[['pistols','Tabancalar'],['heavy_smg','SMG / Pompalı'],['rifles','Tüfekler'],['equipment','Ekipman'],['grenades','Bombalar']];
const fmtTL=n=>'₺'+Math.round(n).toLocaleString('tr-TR');

/* ----- Rütbeler (21) ----- */
const CMP_TIERS=[['iron','Demir','#9aa6b2'],['bronze','Bronz','#c98a5a'],['silver','Gümüş','#c9d4dc'],['gold','Altın','#e2bc67'],['platinum','Platin','#5fd6c4'],['diamond','Elmas','#7fb2ff'],['master','Usta','#c58cff']];
function cmpRankOf(elo){const i=Math.min(20,Math.max(0,Math.floor(elo/100)));const t=CMP_TIERS[Math.floor(i/3)];return {tier:t[0],name:t[1],col:t[2],div:i%3+1,label:t[1]+' '+(i%3+1)}}
function cmpBadge(tier,div,sz){
 const c=(CMP_TIERS.find(t=>t[0]===tier)||CMP_TIERS[0])[2],r=['I','II','III'][div-1]||'';
 return `<svg width="${sz||64}" height="${Math.round((sz||64)*1.125)}" viewBox="0 0 128 144"><path d="M64 5 116 25v50c0 30-31 51-52 63C43 126 12 105 12 75V25z" fill="#14202b" stroke="${c}" stroke-width="4"/><path d="M64 18 102 33v40c0 22-21 39-38 49-17-10-38-27-38-49V33z" fill="${c}" opacity=".1"/><path d="m64 30 8 17 19 3-14 13 3 19-16-9-16 9 3-19-14-13 19-3z" fill="${c}"/><text x="64" y="109" text-anchor="middle" fill="${c}" font-family="Arial,sans-serif" font-size="24" font-weight="700">${r}</text></svg>`;
}
function cmpProfile(){if(!SV.cmp)SV.cmp={elo:900,pl:0,w:0,l:0,d:0};return SV.cmp}

/* ----- Durum ----- */
const CMP={on:false,sub:'unranked',chosen:false,phase:'',t:0,round:0,score:{T:0,CT:0},side1:'T',streak:{T:0,CT:0},
 cash:0,inv:{pri:null,sec:null,armor:0,helmet:false,kit:false},menu:false,cat:null,sel:null,bomb:null,sites:[],buyT:0,
 act:null,actT:0,stats:{k:0,d:0,dmg:0,obj:0},msgT:0,loSave:null,meshes:[]};
const cmpSide=team=>team===1?CMP.side1:(CMP.side1==='T'?'CT':'T');
const cmpTeamOf=side=>CMP.side1===side?1:2;

/* ----- Mod seçimi penceresi ----- */
function cmpOpen(cb){
 const pr=cmpProfile();
 let el=$('cmpsel');if(!el){el=document.createElement('div');el.id='cmpsel';document.body.appendChild(el)}
 const maps=Object.keys(MAPS.defs).map(k=>`<option value='${k}' ${k===MAPS.sel?'selected':''}>${MAPS.defs[k].n}</option>`).join('');
 const rk=pr.pl>=5?cmpRankOf(pr.elo):null;
 el.innerHTML=`<div class='cmpc'><div class='cmpl'><p class='cmpk'>5v5 · BOMBA MODU</p><h2>Oyunun tarzını seç</h2><p class='note'>Aynı haritalar ve maç ekonomisi.</p>
  <div class='cmpsub'><div class='cmpm ${CMP.sub==='unranked'?'on':''}' data-sub='unranked'><h3>Rütbesiz</h3><span class='tag'>RÜTBEN ETKİLENMEZ</span><p>Botlara karşı pratik yap. Genel XP ve hesap TL kazan.</p></div>
  <div class='cmpm cmplock' data-sub='ranked'><h3>Rütbeli</h3><span class='tag'>ELO VE REKABETÇİ RÜTBE</span><p>Çevrimiçi, 10 gerçek oyuncu gerekir. <b>Yakında</b></p></div></div>
  <label class='note'>Harita <select id='cmpmap'>${maps}</select></label>
  <p class='note'>Seçili: Rütbesiz · Rekabetçi Elo ve derecelendirme ilerlemen değişmez. İlk 16 raunt kazanan maçı alır; 15. rauntta taraf değişir.</p>
  <div class='row'><button class='btn' id='cmpgo'>RÜTBESİZ MAÇ BAŞLAT (BOTLARLA)</button><button class='btn alt' id='cmpranks'>Rütbeler</button><button class='btn alt' id='cmpx'>Vazgeç</button></div></div>
  <div class='cmpr'><p class='cmpk'>OYUNCU PROFİLİ</p><p>Genel XP: <b>${fmt(SV.xp||0)}</b></p><p class='note'>Genel XP rekabetçi rütbeden bağımsızdır.</p><hr>
  <p class='cmpk'>REKABETÇİ RÜTBE</p>${rk?`<div class='cmprk'>${cmpBadge(rk.tier,rk.div,72)}<div><b>${rk.label}</b><br>${fmt(pr.elo)} Elo</div></div>`:`<p><b>Derecelendirme ${pr.pl}/5</b><br><span class='note'>${5-pr.pl} maç kaldı · Rütbeli maçlar çevrimiçi açılınca başlar</span></p>`}
  <p class='cmpnote'>Maç cüzdanı ₺800 ile başlar. Lobideki kalıcı hesap paran bu bakiyeden ayrıdır.</p></div></div>`;
 el.style.display='flex';
 el.querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>{if(b.dataset.sub==='ranked'){const n=el.querySelector('.cmpl .note:last-of-type');b.classList.add('shake');setTimeout(()=>b.classList.remove('shake'),400);return}});
 $('cmpmap').onchange=e=>{MAPS.sel=e.target.value;try{localStorage.setItem('npng_map',MAPS.sel)}catch(_){}if(typeof mapSelUI==='function')mapSelUI()};
 $('cmpx').onclick=()=>{el.style.display='none'};
 $('cmpranks').onclick=()=>cmpRanksView();
 $('cmpgo').onclick=()=>{el.style.display='none';CMP.chosen=true;CMP.sub='unranked';cb&&cb()};
}
function cmpRanksView(){
 const el=$('cmpsel');
 let h='';for(let i=0;i<21;i++){const r=cmpRankOf(i*100),hi=i===20?'2.000+':fmt(i*100)+'–'+fmt(i*100+99);h+=`<div class='cmpb'>${cmpBadge(r.tier,r.div,54)}<b>${r.label}</b><small>${hi} Elo</small></div>`}
 el.innerHTML=`<div class='cmpc' style='flex-direction:column'><h2>Rekabetçi rütbeler</h2><p class='note'>Yeni oyuncu gizli 900 Elo ile başlar; rozet 5 derecelendirme maçından sonra açılır. Galibiyet +15…+30, mağlubiyet −15…−25, beraberlik 0.</p><div class='cmpgrid'>${h}</div><div class='row'><button class='btn alt' id='cmpbk'>Geri</button></div></div>`;
 $('cmpbk').onclick=()=>cmpOpen(()=>startMatch());
}

/* ----- Harita: bomba bölgeleri ----- */
const CMP_SITE_LAYOUTS={dust2:[{n:'A',x:43,z:-22},{n:'B',x:-35,z:-27}]};
function cmpSites(){
 const m=MAPS.cur;if(!m||!m.nav)return[{n:'A',x:-18,z:-14,y:0,r:3.5},{n:'B',x:16,z:-12,y:0,r:3.5}];
 const N=m.nav,avg=L=>{const q={x:0,y:0,z:0};for(const p of L){q.x+=p.x;q.y+=p.y;q.z+=p.z}q.x/=L.length;q.y/=L.length;q.z/=L.length;return q},a=avg(N.spA),b=avg(N.spB),dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;
 const goals=CMP_SITE_LAYOUTS[m.id]||[{n:'A',x:a.x+dx*.68-dz/len*14,z:a.z+dz*.68+dx/len*14},{n:'B',x:a.x+dx*.68+dz/len*14,z:a.z+dz*.68-dx/len*14}];
 const result=[];
 for(const goal of goals){
  const candidates=[];for(let i=0;i<N.n;i++){const x=N.X[i],z=N.Z[i],d=Math.hypot(x-goal.x,z-goal.z);if(Math.hypot(x-a.x,z-a.z)<12||Math.hypot(x-b.x,z-b.z)<12||result.some(q=>Math.hypot(x-q.x,z-q.z)<14))continue;candidates.push({i,d})}
  candidates.sort((a,b)=>a.d-b.d);let best=null,score=-Infinity;
  for(const c of candidates.slice(0,160)){const i=c.i,x=N.X[i],z=N.Z[i],y=N.Y[i];let clear=0;for(let k=0;k<8;k++){const xx=x+Math.cos(k*Math.PI/4)*2.8,zz=z+Math.sin(k*Math.PI/4)*2.8,j=N.near(xx,zz,y,1);if(j>=0&&Math.hypot(N.X[j]-xx,N.Z[j]-zz)<1.6&&Math.abs(N.Y[j]-y)<.65)clear++}const value=clear*2-c.d;if(value>score){score=value;best={n:goal.n,x,z,y,r:3.5}}}
  if(!best)throw new Error('Haritada guvenli bomba bolgesi bulunamadi: '+m.id);
  result.push(best);
 }
 return result;
}

function cmpSpawn(side,i){
 const m=MAPS.cur;
 if(!m){const t=side==='T';return {x:-8+i*4,z:t?26:-26,y:0,yaw:t?0:Math.PI}}
 const L=side==='T'?m.nav.spA:m.nav.spB,O=side==='T'?m.nav.spB:m.nav.spA,s=L[i%L.length],o=O[0];
 return {x:s.x,z:s.z,y:s.y,yaw:Math.atan2(-(o.x-s.x),-(o.z-s.z))};
}
function cmpMarkers(){
 for(const o of CMP.meshes)S.remove(o);CMP.meshes.length=0;
 for(const s of CMP.sites){
  const r=new THREE.Mesh(new THREE.RingGeometry((s.r||CMPC.siteR)-.15,s.r||CMPC.siteR,40),new THREE.MeshBasicMaterial({color:0xffb020,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false}));
  r.rotation.x=-Math.PI/2;r.position.set(s.x,(s.y||0)+.06,s.z);S.add(r);CMP.meshes.push(r);
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.font='900 96px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#ffb020';x.strokeStyle='#000';x.lineWidth=6;x.strokeText(s.n,64,68);x.fillText(s.n,64,68);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));sp.scale.set(1.6,1.6,1);sp.position.set(s.x,(s.y||0)+3.2,s.z);S.add(sp);CMP.meshes.push(sp);
 }
}
function cmpBombMesh(){
 const g=new THREE.Group();
 g.add(new THREE.Mesh(new THREE.BoxGeometry(.42,.16,.28),new THREE.MeshLambertMaterial({color:0x2b3a2a})));
 const l=new THREE.Mesh(new THREE.BoxGeometry(.08,.05,.08),new THREE.MeshBasicMaterial({color:0xff2020}));l.position.set(.12,.1,0);g.add(l);g.userData.led=l;
 return g;
}

/* ----- Kurulum ve raunt ----- */
function cmpSetup(){
 CMP.on=true;tp=false;CMP.round=0;CMP.score={T:0,CT:0};CMP.side1='T';CMP.streak={T:0,CT:0};CMP.stats={k:0,d:0,dmg:0,obj:0};
 if(!CMP.loSave)CMP.loSave={ok:LO.ok,keys:LO.keys.slice(),mod:Object.assign({},LO.mod)};
 CMP.sites=cmpSites();cmpMarkers();CMP.boardOpen=false;CMP.stats.a=0;
 for(let i=0;i<4;i++)mkE('a',1,0,0,'pistol');
 for(let i=0;i<5;i++)mkE('e',2,0,0,'pistol');
 for(const e of E){e.cmpStats={k:0,d:0,a:0};e.cmpHits=new Map()}
 CMP.playerHits=new Map();
 cmpHalfReset();cmpNewRound();
}
function cmpHalfReset(){
 CMP.cash=CMPC.start;CMP.inv={pri:null,sec:null,armor:0,helmet:false,kit:false};CMP.streak={T:0,CT:0};
 for(const e of E){e.cash=CMPC.start;e.inv={pri:null,sec:null,armor:0,kit:false}}
}
function cmpDefaultSec(side){return side==='T'?'t_default':'ct_default'}
function cmpApplyPlayer(){
 const side=CMP.side1,inv=CMP.inv;
 if(!inv.sec)inv.sec=cmpDefaultSec(side);
 const keys=[],mod={};
 if(inv.pri){const it=CMPID[inv.pri],cls=WMID[it.mid].cls;keys.push(cls);mod[cls]=it.mid}
 const s=CMPID[inv.sec];keys.push('pistol');mod.pistol=s.mid;
 keys.push('knife');
 if(typeof loEnsure==='function')loEnsure();
 LO.ok=true;LO.keys=keys;LO.mod=mod;LO.on=true;
 if(typeof loSync==='function')loSync();
 const want=keys[0];for(const k of keys)wa[k]=null;
 wk=null;setW(want,true);
}
function cmpBotWeapon(e){
 const it=CMPID[e.inv.pri||e.inv.sec||cmpDefaultSec(cmpSide(e.team))],cls=it.mid&&WMID[it.mid]?WMID[it.mid].cls:'pistol';
 const k=cls==='rifle'||cls==='smg'?cls:'pistol';
 e.wk=k;e.ammo=WP[k].mag;e.rl=0;e.item=it.id;
 try{holderSet(e.rig,k,SKIN('g0'),it.mid)}catch(_){holderSet(e.rig,k,SKIN('g0'))}
}
function cmpBotBuy(e){
 const side=cmpSide(e.team),c=e.cash;
 const pick=ids=>{for(const id of ids){const it=CMPID[id];if(it.teams.includes(side)&&it.p<=e.cash){e.cash-=it.p;return id}}return null};
 if(!e.inv.pri){
  if(c>=3900)e.inv.pri=pick(side==='T'?['t_main_rifle']:['ct_main_rifle']);
  else if(c>=2400)e.inv.pri=pick(side==='T'?['t_budget_rifle','t_smg']:['ct_budget_rifle','ct_smg']);
  else if(c>=1700&&Math.random()<.5)e.inv.pri=pick(['smg_budget']);
 }
 if(!e.inv.armor&&e.cash>=1000)e.inv.armor=pick(['armor_helmet'])?100:0;else if(!e.inv.armor&&e.cash>=650)e.inv.armor=pick(['armor_vest'])?100:0;
 if(side==='CT'&&!e.inv.kit&&e.cash>=400&&Math.random()<.5)e.inv.kit=!!pick(['defuse_kit']);
 if(!e.inv.pri&&!e.inv.sec&&e.cash>=700&&Math.random()<.4)e.inv.sec=pick(['pistol_heavy']);
}
function cmpNewRound(){
 if(CMP.playerHits)CMP.playerHits.clear();cmpBoard(false);
 CMP.round++;CMP.phase='freeze';CMP.t=CMPC.freeze;CMP.buyT=CMPC.buyTime;CMP.bomb=null;CMP.act=null;CMP.actT=0;
 if(typeof clearRags==='function')clearRags();
 /* oyuncu */
 const s1=cmpSpawn(CMP.side1,0);
 if(p.dead>0){p.dead=0;CMP.inv.pri=null;CMP.inv.sec=null;CMP.inv.armor=0;CMP.inv.helmet=false;CMP.inv.kit=false}
 p.hp=100;p.x=s1.x;p.z=s1.z;p.y=s1.y;p.yaw=s1.yaw;p.pitch=0;p.vx=p.vz=p.vy=0;pRagdoll=null;hudHp();
 if(MAPS.cur)MAPS.cur.safePos={x:p.x,y:p.y,z:p.z};
 cmpApplyPlayer();
 /* botlar */
 const idx={T:1,CT:0};idx[CMP.side1]=1;
 const cnt={1:1,2:0};
 for(const e of E){
  e.cmpHits.clear();
  const side=cmpSide(e.team),q=cmpSpawn(side,e.team===1?cnt[1]++:cnt[2]++);
  if(e.hp<=0){e.inv.pri=null;e.inv.sec=null;e.inv.armor=0;e.inv.kit=false}
  e.hp=e.max=100;e.rig.root.visible=true;e.g.position.set(q.x,q.y,q.z);e.sx=q.x;e.sz=q.z;e.sy=q.y;
  e.g.rotation.y=e.yaw=Math.atan2(-Math.sin(q.yaw),-Math.cos(q.yaw));e.obj=null;e.objT=0;e.planting=0;e.defusing=0;
  cmpBotBuy(e);cmpBotWeapon(e);
 }
 /* bomba: oyuncu T ise oyuncuda, değilse rastgele T botunda */
 const tb=E.filter(e=>cmpSide(e.team)==='T');
 CMP.carrier=CMP.side1==='T'?'p':tb[Math.floor(Math.random()*tb.length)]||null;
 cmpMsg(CMP.round===CMPC.half+1?'Taraf değişti! Artık '+CMP.side1+' tarafındasın':'Raunt '+CMP.round+' · Satın alma: B',3);
 cmpHud();
 cmpMenu(true);
}
function cmpMsg(t,s){$('msg').textContent=t;CMP.msgT=s||3}
function cmpAlive(side){
 let n=0;const t=cmpTeamOf(side);
 if(t===1&&p.dead<=0)n++;
 for(const e of E)if(e.team===t&&e.hp>0)n++;
 return n;
}
function cmpEndRound(winner,why){
 if(CMP.phase==='end'||CMP.phase==='over')return;
 CMP.phase='end';CMP.t=CMPC.endPause;CMP.act=null;
 const loser=winner==='T'?'CT':'T';CMP.score[winner]++;
 CMP.streak[winner]=0;CMP.streak[loser]=Math.min(5,CMP.streak[loser]+1);
 const wPay=(why==='bomb'||why==='defuse')?CMPC.objWin:CMPC.win;
 const lPay=CMPC.lossLadder[CMP.streak[loser]-1]+(loser==='T'&&CMP.bomb&&CMP.bomb.planted?CMPC.plantBonus:0);
 const pay=(team,alive)=>{const side=cmpSide(team);if(side===winner)return wPay;if(why==='time'&&side==='T'&&alive)return 0;return lPay};
 CMP.cash=Math.min(CMPC.cap,CMP.cash+pay(1,p.dead<=0));
 for(const e of E)e.cash=Math.min(CMPC.cap,e.cash+pay(e.team,e.hp>0));
 const W={ct_elim:'Tüm CT\'ler öldü',t_elim:'Tüm T\'ler öldü',time:'Süre doldu',bomb:'Bomba patladı',defuse:'Bomba çözüldü'}[why]||'';
 const mine=winner===CMP.side1;
 cmpMsg((mine?'Raunt kazandın! ':'Raunt kaybedildi. ')+W+' · '+winner+' kazandı',CMPC.endPause);
 snd(mine?660:220,.25,.06);
 cmpHud();
 const s1=CMP.score[CMP.side1],s2=CMP.score[CMP.side1==='T'?'CT':'T'];
 if(CMP.score.T>=CMPC.winRounds||CMP.score.CT>=CMPC.winRounds||CMP.round>=CMPC.half*2)CMP.phase='over';
}
function cmpTick(dt){
 if(!CMP.on||state!=='play')return;
 cmpFxTick(dt);
 if(CMP.msgT>0){CMP.msgT-=dt;if(CMP.msgT<=0&&CMP.phase!=='end')$('msg').textContent=''}
 CMP.buyT-=dt;
 if(CMP.menu&&(CMP.buyT<=0||p.dead>0))cmpMenu(false);
 if(CMP.phase==='freeze'){CMP.t-=dt;if(CMP.t<=0){CMP.phase='live';CMP.t=CMPC.live;cmpMsg('Raunt başladı!',1.5)}}
 else if(CMP.phase==='live'){
  CMP.t-=dt;
  if(cmpAlive('CT')===0)return cmpEndRound('T','ct_elim');
  if(cmpAlive('T')===0)return cmpEndRound('CT','t_elim');
  if(CMP.t<=0)return cmpEndRound('CT','time');
  cmpPlantLogic(dt);
 }else if(CMP.phase==='bomb'){
  CMP.t-=dt;
  const led=CMP.bomb.mesh.userData.led;led.visible=(CMP.t%(CMP.t<10?.3:1))<.15;
  if(cmpAlive('CT')===0)return cmpEndRound('T','ct_elim');
  if(CMP.t<=0){cmpExplode();return cmpEndRound('T','bomb')}
  cmpDefuseLogic(dt);
 }else if(CMP.phase==='end'||CMP.phase==='over'){
  CMP.t-=dt;
  if(CMP.t<=0){
   if(CMP.phase==='over')return cmpMatchOver();
   if(CMP.round===CMPC.half){CMP.side1=CMP.side1==='T'?'CT':'T';const a=CMP.score.T;CMP.score.T=CMP.score.CT;CMP.score.CT=a;CMP.streak={T:0,CT:0};cmpHalfReset();for(const e of E)e.hp=0;p.dead=1}
   cmpCleanBomb();cmpNewRound();
  }
 }
 cmpHud();
}
/* ----- Bomba ----- */
function cmpSiteAt(x,z,y){
 for(const s of CMP.sites){if(Math.hypot(x-s.x,z-s.z)>(s.r||CMPC.siteR)||y!=null&&Math.abs(y-s.y)>.65)continue;
  const m=MAPS.cur;if(m&&m.nav){const N=m.nav,i=N.near(x,z,y==null?s.y:y,1);if(i<0||Math.hypot(N.X[i]-x,N.Z[i]-z)>1.35||Math.abs(N.Y[i]-s.y)>.65)continue}return s;
 }return null;
}
function cmpPlantLogic(dt){
 /* yerdeki bomba: T oyuncu/bot üstüne gelince alır */
 if(CMP.bomb&&CMP.bomb.dropped){
  const b=CMP.bomb;
  if(CMP.side1==='T'&&p.dead<=0&&Math.hypot(p.x-b.x,p.z-b.z)<1.3){CMP.carrier='p';cmpCleanBomb();cmpMsg('Bombayı aldın',2)}
  else for(const e of E)if(cmpSide(e.team)==='T'&&e.hp>0&&Math.hypot(e.g.position.x-b.x,e.g.position.z-b.z)<1.3){CMP.carrier=e;cmpCleanBomb();break}
 }
 if(CMP.carrier==='p'){
  const s=cmpSiteAt(p.x,p.z,p.y),hold=typeof kDown==='function'?kDown('interact'):key.KeyE===1;
  if(s&&hold&&p.g&&Math.hypot(p.vx,p.vz)<1){CMP.act='plant';CMP.actT+=dt;if(CMP.actT>=CMPC.plant){cmpPlant(p.x,p.y,p.z,s,'Sen')}}
  else if(CMP.act==='plant'){CMP.act=null;CMP.actT=0}
 }
}
function cmpPlant(x,y,z,s,who){
 if(!s||cmpSiteAt(x,z,y)!==s)return false;
 const m=cmpBombMesh();m.position.set(x,y+.08,z);S.add(m);
 CMP.bomb={planted:true,x,y,z,site:s.n,mesh:m};CMP.carrier=null;CMP.phase='bomb';CMP.t=CMPC.bomb;CMP.act=null;CMP.actT=0;
 if(who==='Sen')CMP.stats.obj++;
 cmpMsg('Bomba '+s.n+' bölgesine kuruldu! ('+who+')',3);snd(880,.3,.05);
}
function cmpDropBomb(x,y,z){
 if(CMP.phase!=='live')return;
 const m=cmpBombMesh();m.position.set(x,(y||0)+.08,z);S.add(m);CMP.bomb={dropped:true,x,y,z,mesh:m};CMP.carrier=null;
}
function cmpCleanBomb(){if(CMP.bomb&&CMP.bomb.mesh)S.remove(CMP.bomb.mesh);if(CMP.bomb&&CMP.bomb.dropped)CMP.bomb=null}
function cmpBlastDamage(distance){return distance>=CMPC.blastRadius?0:Math.round(CMPC.blastPeak*Math.exp(-Math.pow(Math.max(0,distance)/CMPC.blastScale,2)))}
const CMP_FX=[];
function cmpDisposeFx(f){S.remove(f.g);f.g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()})}
function cmpBlastVisual(b){
 const g=new THREE.Group();g.position.set(b.x,b.y+.12,b.z);S.add(g);
 const flash=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),new THREE.MeshBasicMaterial({color:0xffbf55,transparent:true,opacity:.95,depthWrite:false}));g.add(flash);
 const ring=new THREE.Mesh(new THREE.RingGeometry(.93,1,48),new THREE.MeshBasicMaterial({color:0xffd596,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;g.add(ring);
 const smoke=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshBasicMaterial({color:0x423e39,transparent:true,opacity:.45,depthWrite:false}));g.add(smoke);
 const light=new THREE.PointLight(0xffad4a,7,32,2);g.add(light);
 const count=SET.fx===0?20:64,pos=new Float32Array(count*3),velocity=new Float32Array(count*3);for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,v=3+Math.random()*7;velocity[i*3]=Math.cos(a)*v;velocity[i*3+1]=2+Math.random()*7;velocity[i*3+2]=Math.sin(a)*v}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));const sparks=new THREE.Points(geo,new THREE.PointsMaterial({color:0xffbb55,size:.10,transparent:true,opacity:1,depthWrite:false}));g.add(sparks);
 CMP_FX.push({g,flash,ring,smoke,light,sparks,pos,velocity,t:0});
}
function cmpFxTick(dt){for(let i=CMP_FX.length-1;i>=0;i--){const f=CMP_FX[i];f.t+=dt;if(f.t>2.2){cmpDisposeFx(f);CMP_FX.splice(i,1);continue}const t=f.t;f.flash.scale.setScalar(1+t*14);f.flash.material.opacity=Math.max(0,.95-t*2.8);f.ring.scale.setScalar(1+t*24);f.ring.material.opacity=Math.max(0,.8-t);f.smoke.scale.setScalar(1+t*3);f.smoke.position.y=t*1.2;f.smoke.material.opacity=Math.max(0,.45*(1-t/2.2));f.light.intensity=Math.max(0,7-t*15);for(let j=0;j<f.pos.length;j+=3){f.pos[j]+=f.velocity[j]*dt;f.velocity[j+1]-=9*dt;f.pos[j+1]+=f.velocity[j+1]*dt;f.pos[j+2]+=f.velocity[j+2]*dt}f.sparks.geometry.attributes.position.needsUpdate=true;f.sparks.material.opacity=Math.max(0,1-t)}}
function cmpExplode(){
 const b=CMP.bomb;if(!b||b.exploded)return;b.exploded=true;
 cmpBlastVisual(b);const origin=V3(b.x,b.y+.1,b.z),distance=Math.hypot(p.x-b.x,p.y+.9-b.y,p.z-b.z);snd(60,1.2,.12*Math.max(.1,1-distance/70));
 // C4 alan hasari iki takima da uygulanir; duvarlar patlamayi tamamen kesmez.
 const damage=cmpBlastDamage(distance);if(p.dead<=0&&damage>0)hurt(damage,origin);
 for(const e of E)if(e.hp>0){const q=e.g.position,d=cmpBlastDamage(Math.hypot(q.x-b.x,q.y+.9-b.y,q.z-b.z));if(!d)continue;let taken=d;if(e.inv&&e.inv.armor>0&&d<200){const absorbed=Math.min(e.inv.armor,d*.5);e.inv.armor-=absorbed;taken-=absorbed*.9}damageEnemy(e,taken,{by:'C4',w:'bomb',pt:origin,dir:V3(q.x-b.x,.5,q.z-b.z).normalize(),power:9})}
 if(b.mesh)S.remove(b.mesh);
}

function cmpDefuseLogic(dt){
 const b=CMP.bomb;
 if(CMP.side1==='CT'&&p.dead<=0){
  const near=Math.hypot(p.x-b.x,p.y-b.y,p.z-b.z)<CMPC.defuseR,hold=typeof kDown==='function'?kDown('interact'):key.KeyE===1;
  if(near&&hold){CMP.act='defuse';CMP.actT+=dt;if(CMP.actT>=(CMP.inv.kit?CMPC.defuseKit:CMPC.defuse)){CMP.stats.obj++;S.remove(b.mesh);cmpMsg('Bombayı çözdün!',2);return cmpEndRound('CT','defuse')}}
  else if(CMP.act==='defuse'){CMP.act=null;CMP.actT=0}
 }
}
/* ----- Bot hedefleri (bomba) ----- */
function cmpBotObjective(e){
 const side=cmpSide(e.team);
 if(CMP.phase==='live'&&side==='T'){
  if(CMP.carrier===e){if(!e.siteT){e.siteT=CMP.sites[Math.random()<.5?0:1]}return e.siteT}
  if(CMP.bomb&&CMP.bomb.dropped){let best=null,bd=1e9;for(const o of E)if(o.team===e.team&&o.hp>0){const d=Math.hypot(o.g.position.x-CMP.bomb.x,o.g.position.z-CMP.bomb.z);if(d<bd){bd=d;best=o}}if(best===e)return CMP.bomb}
 }
 if(CMP.phase==='bomb'&&side==='CT'){
  let best=null,bd=1e9;for(const o of E)if(o.team===e.team&&o.hp>0){const d=Math.hypot(o.g.position.x-CMP.bomb.x,o.g.position.z-CMP.bomb.z);if(d<bd){bd=d;best=o}}
  if(best===e)return CMP.bomb;
 }
 return null;
}
function cmpEnemyNear(e){
 e.vT=(e.vT||0)-1;if(e.vT>0)return e.vis;e.vT=20; /* ~0.17 sn'de bir */
 const q=e.g.position;e.vis=false;
 const chk=(x,y,z)=>Math.hypot(x-q.x,z-q.z)<26&&botLos(e,x,y,z);
 if(e.team===2&&p.dead<=0&&chk(p.x,p.y+1.5,p.z))return e.vis=true;
 for(const o of E)if(o.team!==e.team&&o.hp>0&&chk(o.g.position.x,o.g.position.y+1.4,o.g.position.z))return e.vis=true;
 return false;
}
function cmpBotMove(e,o,dt){
 const q=e.g.position,dx=o.x-q.x,dz=o.z-q.z,d=Math.hypot(dx,dz);
 let mx=dx/(d||1),mz=dz/(d||1);
 if(MAPS.cur&&d>1){const wp=botNav(e,o.x,o.z);if(wp){const wx=wp[0]-q.x,wz=wp[1]-q.z,wl=Math.hypot(wx,wz)||1;mx=wx/wl;mz=wz/wl}}
 const px=q.x,pz=q.z;
 if(d>(o===CMP.bomb?1:1.5)){stepE(e,mx*4*dt,mz*4*dt);e.yaw=angLerp(e.yaw,Math.atan2(mx,mz),Math.min(1,8*dt));e.g.rotation.y=e.yaw}
 e.vx=(q.x-px)/dt;e.vz=(q.z-pz)/dt;
 const sp=Math.hypot(e.vx,e.vz);
 animHuman(e.rig,{t:clock+e.ph0,speed:sp,fwd:1,pitch:0,lookYaw:0,ads:0,kick:0,rq:-1,sw:1,bob:clamp(sp/7,0,1)},dt);
 return d;
}

/* ----- Satın alma menüsü (B) ----- */
function cmpItemsOf(cat){return CMPI.filter(i=>i.cat===cat&&i.teams.includes(CMP.side1)&&i.slot!=='melee'&&!(i.p===0))}
function cmpCan(it){
 if(it.slot==='gren')return [false,'Yakında'];
 if(CMP.buyT<=0)return [false,'Süre bitti'];
 const inv=CMP.inv;
 if(it.slot==='pri'&&inv.pri===it.id)return [false,'Sende var'];
 if(it.slot==='sec'&&inv.sec===it.id)return [false,'Sende var'];
 if(it.slot==='kit'&&inv.kit)return [false,'Sende var'];
 if(it.id==='armor_vest'&&inv.armor>=100)return [false,'Sende var'];
 if(it.id==='armor_helmet'&&inv.armor>=100&&inv.helmet)return [false,'Sende var'];
 const pr=cmpPrice(it);if(pr>CMP.cash)return [false,'Yetersiz para'];
 return [true,''];
}
function cmpPrice(it){if(it.id==='armor_helmet'&&CMP.inv.armor>=100&&!CMP.inv.helmet)return 350;if(it.id==='armor_helmet'&&CMP.inv.helmet&&CMP.inv.armor<100)return 650;return it.p}
function cmpBuy(it){
 const [ok]=cmpCan(it);if(!ok){snd(160,.08,.04);return}
 CMP.cash-=cmpPrice(it);
 if(it.slot==='pri')CMP.inv.pri=it.id;
 else if(it.slot==='sec')CMP.inv.sec=it.id;
 else if(it.slot==='kit')CMP.inv.kit=true;
 else if(it.slot==='armor'){CMP.inv.armor=100;if(it.id==='armor_helmet')CMP.inv.helmet=true}
 if(it.slot==='pri'||it.slot==='sec')cmpApplyPlayer();
 snd(520,.06,.05);cmpMenuRender();cmpHud();
}
function cmpMenu(on,gesture){
 if(on&&(p.dead>0||CMP.buyT<=0||!CMP.on)){if(on&&CMP.on)cmpMsg('Satın alma süresi bitti',1.5);return}
 CMP.menu=!!on;CMP.cat=null;CMP.sel=null;firing=false;
 let el=$('cmpbuy');if(!el){el=document.createElement('div');el.id='cmpbuy';document.body.appendChild(el)}
 el.style.display=on?'flex':'none';
 if(on){try{document.exitPointerLock()}catch(e){}cmpMenuRender()}
 else if(gesture&&state==='play'&&!touch){try{$('c').requestPointerLock()}catch(e){}}
}
function cmpMenuRender(){
 const el=$('cmpbuy');if(!el||!CMP.menu)return;
 const R=150,C=170,slices=[];
 let labels;
 if(!CMP.cat)labels=CMPCAT.map((c,i)=>({k:i+1,t:c[1],sub:'',on:true,cat:c[0]})).concat([{k:6,t:'Kapat',sub:'',on:true,close:1}]);
 else{const L=cmpItemsOf(CMP.cat).slice(0,5);labels=[];for(let i=0;i<5;i++){const it=L[i];if(!it){labels.push({k:i+1,t:'Boş',sub:'',on:false});continue}const [ok,why]=cmpCan(it);labels.push({k:i+1,t:it.n,sub:it.slot==='gren'?'Yakında':fmtTL(cmpPrice(it)),on:ok,why,it})}labels.push({k:6,t:'Geri',sub:'6',on:true,back:1})}
 for(let i=0;i<6;i++){
  const a0=-Math.PI/2+i*Math.PI/3-Math.PI/6,a1=a0+Math.PI/3,L=labels[i];
  const P=(a,r)=>[C+Math.cos(a)*r,C+Math.sin(a)*r];
  const [x0,y0]=P(a0,R),[x1,y1]=P(a1,R),[i0x,i0y]=P(a0,34),[i1x,i1y]=P(a1,34),[tx,ty]=P((a0+a1)/2,98);
  const col=L.on?(L.it&&L.why===''?'#1d3a2c':'#1a242e'):'#151b22',tc=L.on?'#e8f0f5':'#6b7884',pc=L.it?(L.on?'#7dffb0':L.why==='Yetersiz para'?'#ff7070':'#8a96a2'):'#9fb3c3';
  slices.push(`<path data-k='${L.k}' d='M${i0x} ${i0y}L${x0} ${y0}A${R} ${R} 0 0 1 ${x1} ${y1}L${i1x} ${i1y}A34 34 0 0 0 ${i0x} ${i0y}' fill='${CMP.sel===i?'#2c4a3c':col}' stroke='#3a4a58' stroke-width='1.5' style='cursor:${L.on?'pointer':'default'}'/>
   <text x='${tx}' y='${ty-6}' text-anchor='middle' fill='${tc}' font-size='11' font-weight='700' pointer-events='none'>${L.t.length>16?L.t.slice(0,15)+'…':L.t}</text>
   <text x='${tx}' y='${ty+10}' text-anchor='middle' fill='${pc}' font-size='12' font-weight='700' pointer-events='none'>${L.sub}</text>
   <text x='${P((a0+a1)/2,52)[0]}' y='${P((a0+a1)/2,52)[1]+4}' text-anchor='middle' fill='#7f93a3' font-size='10' pointer-events='none'>${L.k}</text>`);
 }
 const si=CMP.sel!=null?labels[CMP.sel]:null,it=si&&si.it;
 const info=it?`<h3>${it.n}</h3><p class='note'>${it.teams.length===1?'Yalnız '+it.teams[0]+' satın alabilir':'İki taraf da alabilir'}${it.slot==='gren'?' · bomba sistemi yakında':''}</p>
  <div class='cbr'><span>Fiyat</span><b style='color:#ffcf6a'>${fmtTL(cmpPrice(it))}</b></div>${it.kr?`<div class='cbr'><span>Kill ödülü</span><b style='color:#7dffb0'>${fmtTL(it.kr)}</b></div>`:''}
  <hr><div class='cbr'><span>Maç cüzdanı</span><b>${fmtTL(CMP.cash)}</b></div><div class='cbr'><span>Alım sonrası</span><b style='color:${CMP.cash-cmpPrice(it)<0?'#ff7070':'#7dffb0'}'>${fmtTL(CMP.cash-cmpPrice(it))}</b></div>${si.why?`<p class='cbw'>${si.why}</p>`:''}`
  :`<h3>${CMP.side1} · ${CMP.cat?CMPCAT.find(c=>c[0]===CMP.cat)[1]:'Satın alma'}</h3><p class='note'>Bir ürünün üstüne gel, tıkla ya da numarasına bas.</p><div class='cbr'><span>Maç cüzdanı</span><b>${fmtTL(CMP.cash)}</b></div>`;
 const inv=CMP.inv,invt=[inv.pri&&CMPID[inv.pri].n,inv.sec&&CMPID[inv.sec].n,inv.armor?(inv.helmet?'Yelek + Kask':'Yelek'):null,inv.kit?'İmha Kiti':null].filter(Boolean).join(' · ');
 el.innerHTML=`<div class='cbw0'><div class='cbtop'><div><p class='cmpk'>N.P.N.G. / MAÇ İÇİ SATIN ALMA</p><h2>${CMP.side1} · ${CMP.cat?CMPCAT.find(c=>c[0]===CMP.cat)[1].toUpperCase():'KATEGORİLER'}</h2></div><div class='cbt'><small>SATIN ALMA SÜRESİ</small><b>00:${String(Math.max(0,Math.ceil(CMP.buyT))).padStart(2,'0')}</b></div></div>
  <div class='cbmid'><svg width='340' height='340' viewBox='0 0 340 340'>${slices.join('')}<circle cx='170' cy='170' r='32' fill='#0c1218' stroke='#c9a35a' stroke-width='1.5' data-k='0' style='cursor:pointer'/><text x='170' y='168' text-anchor='middle' fill='#e2bc67' font-size='11' pointer-events='none'>${CMP.cat?'GERİ':'KAPAT'}</text><text x='170' y='182' text-anchor='middle' fill='#7f93a3' font-size='9' pointer-events='none'>Esc / 0</text></svg>
  <div class='cbinfo'>${info}</div></div><p class='note'>B: aç/kapat · 1–5: seç / al · 6 / Esc: geri · Envanter: ${invt||'—'}</p></div>`;
 el.querySelectorAll('[data-k]').forEach(pth=>{
  const k=+pth.dataset.k;
  pth.onmouseenter=()=>{if(k>=1&&k<=6&&CMP.cat){CMP.sel=k-1;const L2=labels;cmpMenuInfoOnly()}};
  pth.onclick=e=>{e.stopPropagation();cmpKey(k)};
 });
 function cmpMenuInfoOnly(){cmpMenuRender()}
}
function cmpKey(k){
 if(!CMP.menu)return;
 if(k===0||k===6){if(CMP.cat){CMP.cat=null;CMP.sel=null;cmpMenuRender()}else cmpMenu(false,true);return}
 if(!CMP.cat){const c=CMPCAT[k-1];if(c){CMP.cat=c[0];CMP.sel=null;cmpMenuRender()}return}
 const it=cmpItemsOf(CMP.cat)[k-1];if(!it)return;
 CMP.sel=k-1;cmpBuy(it);
}
addEventListener('keydown',e=>{
 if(!CMP.on||mode!=='cmp'||state!=='play')return;
 const isBuy=typeof kMatch==='function'?kMatch(e,'buy'):e.code==='KeyB';
 if(isBuy){e.preventDefault();e.stopImmediatePropagation();cmpMenu(!CMP.menu,true);return}
 if(!CMP.menu)return;
 if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();cmpKey(0);return}
 const m=/^(Digit|Numpad)([0-9])$/.exec(e.code);
 if(m){e.preventDefault();e.stopImmediatePropagation();cmpKey(+m[2])}
},true);
if(typeof KDEF!=='undefined'&&!KDEF.some(d=>d[0]==='buy')){KDEF.push(['buy','Satın alma menüsü (rekabetçi)','KeyB',null]);if(typeof KB!=='undefined'&&!KB.buy)KB.buy={p:'KeyB',s:null}}

/* ----- HUD ----- */
let _cmpH='';
function cmpHud(){
 let el=$('cmphud');
 if(!CMP.on||mode!=='cmp'){if(el)el.style.display='none';return}
 if(!el){el=document.createElement('div');el.id='cmphud';$('hud').appendChild(el)}
 el.style.display='block';
 const t=Math.max(0,Math.ceil(CMP.t)),tt=Math.floor(t/60)+':'+String(t%60).padStart(2,'0');
 const ph=CMP.phase==='freeze'?'Hazırlık':CMP.phase==='bomb'?'BOMBA':CMP.phase==='end'||CMP.phase==='over'?'Raunt sonu':'Raunt';
 const me=CMP.side1,op=me==='T'?'CT':'T';
 const act=CMP.act?`<div class='cact'><span>${CMP.act==='plant'?'Bomba kuruluyor':'Bomba çözülüyor'}</span><i><u style='width:${Math.min(100,CMP.actT/(CMP.act==='plant'?CMPC.plant:(CMP.inv.kit?CMPC.defuseKit:CMPC.defuse))*100)}%'></u></i></div>`:'';
 const hint=CMP.carrier==='p'&&CMP.phase==='live'?(cmpSiteAt(p.x,p.z,p.y)?'Bomba sende · E basılı tut: kur':'Bomba sende · A ya da B bölgesine git'):(CMP.phase==='bomb'&&me==='CT'&&p.dead<=0?'Bomba '+CMP.bomb.site+' bölgesinde · yanında E basılı tut: çöz':'');
 const h=`<div class='ctop'><span class='cs ${me==='T'?'me':''}'>T ${CMP.score.T}</span><span class='ct ${CMP.phase==='bomb'?'bm':''}'>${ph}<b>${tt}</b></span><span class='cs ${me==='CT'?'me':''}'>${CMP.score.CT} CT</span></div>
  <div class='csub'>Raunt ${CMP.round}/30 · Sen: ${me} · Canlı ${me} ${cmpAlive(me)} - ${cmpAlive(op)} ${op}</div>
  <div class='ccash'>${fmtTL(CMP.cash)}${CMP.inv.armor?' · 🛡'+(CMP.inv.helmet?'⛑':''):''}${CMP.inv.kit?' · 🔧':''}${CMP.buyT>0&&p.dead<=0?` <small>B: satın al (${Math.ceil(CMP.buyT)} sn)</small>`:''}</div>${act}${hint?`<div class='chint'>${hint}</div>`:''}`;
 if(h!==_cmpH){_cmpH=h;el.innerHTML=h}
}

/* ----- Maç sonu ----- */
function cmpMatchOver(){
 const me=CMP.side1,op=me==='T'?'CT':'T',a=CMP.score[me],b=CMP.score[op];
 tk[1]=a;tk[2]=b;
 const res=a>b?'w':a<b?'l':'d',xp={w:500,l:300,d:400}[res],tl={w:200,l:100,d:150}[res];
 SV.xp=(SV.xp||0)+xp;SV.tl=(SV.tl||0)+tl;save();
 CMP.result={res,xp,tl,a,b};
 finish();
 setTimeout(()=>{const r=$('res');if(r)r.innerHTML+=`<br><b>Rekabetçi · Rütbesiz</b> · ${a} - ${b}<br>+${xp} XP · +${fmtTL(tl)} hesap parası<br><span class='note'>Rekabetçi puanın etkilenmedi.</span>`},0);
}
function cmpLeave(){
 cmpBoard(false);
 for(const f of CMP_FX)cmpDisposeFx(f);CMP_FX.length=0;
 CMP.on=false;cmpMenu(false);CMP.menu=false;
 for(const o of CMP.meshes)S.remove(o);CMP.meshes.length=0;
 if(CMP.bomb&&CMP.bomb.mesh)S.remove(CMP.bomb.mesh);CMP.bomb=null;
 if(CMP.loSave){LO.ok=CMP.loSave.ok;LO.keys=CMP.loSave.keys;LO.mod=CMP.loSave.mod;CMP.loSave=null}
 const h=$('cmphud');if(h)h.style.display='none';
}

/* ===== Mevcut sisteme bağlantılar (sarmalayıcılar) ===== */
const _cmpSetupMode=setupMode;
setupMode=function(){
 if(mode!=='cmp'&&CMP.on)cmpLeave();
 _cmpSetupMode();
 if(mode==='cmp')cmpSetup();
};
const _cmpUpdBot=updBot;
updBot=function(e,dt){
 if(mode!=='cmp')return _cmpUpdBot(e,dt);
 if(CMP.phase==='freeze'){animHuman(e.rig,{t:clock+e.ph0,speed:0,fwd:1,pitch:0,lookYaw:0,ads:0,kick:0,rq:-1,sw:1},dt);return}
 if(CMP.phase==='end'||CMP.phase==='over'){animHuman(e.rig,{t:clock+e.ph0,speed:0,fwd:1,pitch:0,lookYaw:0,ads:0,kick:0,rq:-1,sw:1},dt);return}
 /* bomba kuran / çözen bot */
 if(e.planting>0||e.defusing>0){
  if(cmpEnemyNear(e)){e.planting=e.defusing=0}else{
   if(e.planting>0){e.planting+=dt;if(e.planting>=CMPC.plant){e.planting=0;const q=e.g.position;cmpPlant(q.x,q.y,q.z,cmpSiteAt(q.x,q.z,q.y)||CMP.sites[0],e.name)}}
   else{e.defusing+=dt;if(e.defusing>=(e.inv.kit?CMPC.defuseKit:CMPC.defuse)){e.defusing=0;if(CMP.bomb&&CMP.bomb.mesh)S.remove(CMP.bomb.mesh);cmpMsg('Bomba çözüldü ('+e.name+')',2);cmpEndRound('CT','defuse')}}
   animHuman(e.rig,{t:clock+e.ph0,speed:0,fwd:1,pitch:-.4,lookYaw:0,ads:0,kick:0,rq:-1,sw:1,crouch:1},dt);return}
 }
 const o=cmpBotObjective(e);
 if(o&&!cmpEnemyNear(e)){
  const d=cmpBotMove(e,o,dt);
  if(o===CMP.bomb&&CMP.phase==='bomb'&&d<CMPC.defuseR)e.defusing=.001;
  else if(CMP.carrier===e&&o!==CMP.bomb&&cmpSiteAt(e.g.position.x,e.g.position.z,e.g.position.y)&&d<2.5)e.planting=.001;
  return;
 }
 _cmpUpdBot(e,dt);
};
const _cmpKill=killEnemy;
killEnemy=function(e,info){
 if(mode!=='cmp')return _cmpKill(e,info);
 if(e.hp<=0&&e.rig.root.visible===false)return;
 const q=e.g.position;
 if(e.cmpStats){e.cmpStats.d++;const killer=info&&info.player?'p':info&&info.by?E.find(x=>x.name===info.by&&x.team!==e.team):null;
  if(killer&&killer!=='p'&&killer.cmpStats)killer.cmpStats.k++;
  if(killer)cmpAssists(e.cmpHits,killer);if(e.cmpHits)e.cmpHits.clear()}
 _cmpKill(e,info);
 if(CMP.carrier===e)cmpDropBomb(q.x,q.y,q.z);
 e.planting=e.defusing=0;
 /* kill ödülü */
 if(info&&info.player){
  if(cmpSide(e.team)!==CMP.side1){const slot=WP[wk]&&WP[wk].melee?'knife':wk==='pistol'||wk==='dual'?CMP.inv.sec:CMP.inv.pri;const kr=slot==='knife'?1500:(CMPID[slot]||{kr:300}).kr;CMP.cash=Math.min(CMPC.cap,CMP.cash+kr);CMP.stats.k++}
 }else if(info&&info.by){const k=E.find(x=>x.name===info.by&&x.team!==e.team);if(k)k.cash=Math.min(CMPC.cap,k.cash+((CMPID[k.item]||{kr:300}).kr))}
 cmpHud();
};
const _cmpHurt=hurt;
hurt=function(d,from){
 if(mode!=='cmp')return _cmpHurt(d,from);
 if(p.dead>0||state!=='play'||CMP.phase==='freeze')return;
 if(CMP.inv.armor>0&&d<200){const ab=Math.min(CMP.inv.armor,d*.5);CMP.inv.armor-=ab;d-=ab*.9;if(CMP.inv.armor<=0){CMP.inv.armor=0;CMP.inv.helmet=false}}
 if(from&&CMP.playerHits&&!(CMP.bomb&&CMP.bomb.exploded)){const who=E.find(e=>e.team===2&&Math.hypot(e.g.position.x-from.x,e.g.position.z-from.z)<.1);if(who){const h=CMP.playerHits.get(who)||{d:0,t:clock};h.d+=Math.min(p.hp,d);h.t=clock;CMP.playerHits.set(who,h)}}
 if(p.hp-d>0){p.hp-=d;cmpHurtFx();return}
 p.hp=0;hudHp();CMP.stats.d++;
 const killer=from&&!(CMP.bomb&&CMP.bomb.exploded)?E.find(e=>e.team===2&&Math.hypot(e.g.position.x-from.x,e.g.position.z-from.z)<.1):null;
 if(killer&&killer.cmpStats)killer.cmpStats.k++;
 if(killer)cmpAssists(CMP.playerHits,killer);CMP.playerHits.clear();
 const h=pRigGet();if(h)pRagdoll=spawnRagdoll(h,V3(p.vx,0,p.vz),from||null,from?V3(p.x-from.x,.3,p.z-from.z).normalize():null,5);
 p.dead=1e9;cmpMenu(false);CMP.act=null;CMP.actT=0;
 if(CMP.carrier==='p')cmpDropBomb(p.x,p.y,p.z);
 cmpMsg('Öldün · raunt sonunu bekle',4);killfeed('Düşman','Sen','rifle',false);
};
function cmpHurtFx(){cmbHurt();hudHp();snd(90,.1,.06);hurtFx()}
const _cmpUpd=upd;
upd=function(){_cmpUpd();if(mode==='cmp'&&CMP.on){$('scr').textContent=''}}; /* skor üstteki rekabetçi göstergesinde */
const _cmpStep=stepPlayer;
stepPlayer=function(dt){
 if(mode==='cmp'&&CMP.on){
  if(CMP.menu)firing=false;
  if(CMP.phase==='freeze'||(CMP.act&&CMP.act!=='')){const x=p.x,z=p.z;_cmpStep(dt);if(CMP.phase==='freeze'){p.x=x;p.z=z;p.vx=p.vz=0}cmpTick(dt);return}
  _cmpStep(dt);cmpTick(dt);return;
 }
 _cmpStep(dt);
};
const _cmpToLobby=toLobby;
toLobby=function(){_cmpToLobby();if(CMP.on)cmpLeave()};

/* loadout kenar göstergesi: rekabetçide kayıtlı loadout yerine o anki maç envanteri */
const _cmpLoHud=loHud;
loHud=function(){
 if(mode!=='cmp'||!CMP.on)return _cmpLoHud();
 if(!LO.on)return;
 let h=$('lohud');if(!h){h=document.createElement('div');h.id='lohud';$('hud').appendChild(h)}
 const L=LO.keys.map(k=>({k,m:LO.mod[k]||null}));
 h.innerHTML=L.map((s,i)=>`<div class='lh ${s.k===wk?'on':''}' data-k='${s.k}'><b>${i+1}</b><span class='sil'>${loIcon(s)}</span></div>`).join('');
 h.querySelectorAll('.lh').forEach((d,i)=>{d.onclick=()=>setW(L[i].k)});
};

/* TAB: gerçek maç sayaçları; aynı hedefte 40 hasar ve son 10 saniye asist verir. */
function cmpAssists(hits,killer){if(!hits)return;for(const [who,h] of hits){if(who===killer||h.d<40||clock-h.t>10)continue;if(who==='p')CMP.stats.a++;else if(who&&who.cmpStats)who.cmpStats.a++}}
const _cmpDamage=damageEnemy;
damageEnemy=function(e,d,info){
 if(mode==='cmp'&&CMP.on&&e.hp>0&&e.cmpHits&&info){const who=info.player?'p':info.by?E.find(x=>x.name===info.by&&x.team!==e.team):null;
  if(who&&(who!=='p'||e.team===2)){const h=e.cmpHits.get(who)||{d:0,t:clock};h.d+=Math.min(e.hp,d);h.t=clock;e.cmpHits.set(who,h)}}
 return _cmpDamage(e,d,info);
};
function cmpBoard(on){
 CMP.boardOpen=!!on;let el=$('cmpboard');if(!el&&on){el=document.createElement('div');el.id='cmpboard';el.setAttribute('aria-label','Maç oyuncu tablosu');document.body.appendChild(el)}if(!el)return;
 el.style.display=on?'flex':'none';if(!on)return;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const rows=[{name:'Sen',team:1,hp:p.hp,stats:CMP.stats,cash:CMP.cash},...E.map(e=>({name:e.name+' · BOT',team:e.team,hp:e.hp,stats:e.cmpStats||{k:0,d:0,a:0},cash:e.cash}))];
 el.innerHTML=`<div class="cmpboard-card"><h2>Rekabetçi · Rütbesiz</h2><p>Raunt ${CMP.round} · T ${CMP.score.T} — ${CMP.score.CT} CT</p>${[1,2].map(team=>`<h3>${cmpSide(team)}</h3><table><thead><tr><th>Oyuncu</th><th>K</th><th>D</th><th>A</th><th>K/D</th><th>Durum</th><th>TL</th></tr></thead><tbody>${rows.filter(r=>r.team===team).sort((a,b)=>b.stats.k-a.stats.k).map(r=>`<tr><td>${esc(r.name)}</td><td>${r.stats.k}</td><td>${r.stats.d}</td><td>${r.stats.a||0}</td><td>${(r.stats.k/Math.max(1,r.stats.d)).toFixed(2)}</td><td>${r.hp>0?'Hayatta':'Ölü'}</td><td>${fmtTL(r.cash||0)}</td></tr>`).join('')}</tbody></table>`).join('')}<p class="note">Tab tuşunu bırak: kapat</p></div>`;
}
addEventListener('keydown',e=>{if(e.code==='Tab'&&mode==='cmp'&&CMP.on&&state==='play'){e.preventDefault();e.stopImmediatePropagation();cmpBoard(true)}},true);
addEventListener('keyup',e=>{if(e.code==='Tab')cmpBoard(false)},true);
addEventListener('blur',()=>cmpBoard(false));
const _cmpBoardHud=cmpHud;
cmpHud=function(){_cmpBoardHud();if(CMP.boardOpen)cmpBoard(CMP.on&&mode==='cmp'&&state==='play')};
