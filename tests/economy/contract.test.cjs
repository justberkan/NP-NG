'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {cfg,byId,credit,roundReward,killReward,quote,purchase,IdempotentPurchases}=require('./reference.cjs');
const player=(changes={})=>({id:'p1',team:'T',money:16000,armor:0,helmet:false,defuseKit:false,alive:true,connected:true,inventory:{primary:null,secondary:null,grenades:[]},...changes});
const ctx={roundId:'r1',phase:'freeze',buyElapsed:0,inTeamBuyZone:true};
test('Kullanıcı şartı: para, 27 öğe, beş kategori, fiyatlar ve istisnalar',()=>{
 assert.equal(cfg.wallet.start,800);assert.equal(cfg.wallet.cap,16000);assert.deepEqual(cfg.rewards.loss,[1400,1900,2400,2900,3400]);assert.equal(cfg.items.length,27);assert.equal(new Set(cfg.items.map(i=>i.id)).size,27);
 const expected={t_default:[0,300],ct_default:[0,300],pistol_standard:[300,300],pistol_piercing:[500,300],pistol_auto:[600,100],pistol_heavy:[700,300],smg_budget:[1050,600],t_smg:[1200,600],ct_smg:[1400,600],smg_capacity:[2350,300],shotgun_basic:[1200,900],t_budget_rifle:[2000,300],ct_budget_rifle:[2250,300],t_main_rifle:[2700,300],ct_main_rifle:[3100,300],sniper_light:[1700,300],sniper_heavy:[4750,100],armor_vest:[650,0],armor_helmet:[1000,0],defuse_kit:[400,0],knife:[0,1500],grenade_he:[300,300],grenade_flash:[200,300],grenade_smoke:[300,300],t_molotov:[400,300],ct_incendiary:[600,300],grenade_decoy:[50,300]};
 for(const [id,pair] of Object.entries(expected))assert.deepEqual([byId.get(id).price,byId.get(id).killReward],pair,id);
 for(const item of cfg.items){assert.ok(cfg.categories.some(c=>c.id===item.category));assert.ok(Number.isSafeInteger(item.price));assert.ok(item.price>=0);assert.ok(item.teams.length>0)}
});
test('Her takım/kategori en fazla beş öğe + altıncı geri dilimine sığar',()=>{
 for(const team of ['T','CT'])for(const cat of cfg.categories)assert.ok(cfg.items.filter(i=>i.category===cat.id&&i.teams.includes(team)).length<=5);
 assert.deepEqual(cfg.radial.rootSlots,['pistols','heavy_smg','rifles','equipment','grenades','close']);
});
test('Standart zafer 3250; bomba patlatma/çözme galibi 3500',()=>{
 for(const [reason,team,bomb,total] of [['ct_eliminated','T',false,3250],['ct_eliminated','T',true,3250],['t_eliminated','CT',false,3250],['time_expired','CT',false,3250],['bomb_detonated','T',true,3500],['bomb_defused','CT',true,3500]])
  for(const alive of [false,true])assert.equal(roundReward({team,alive,lossStreakBefore:4,reason,bombPlanted:bomb}).total,total);
});
test('Seri 1400/1900/2400/2900/3400/3400; galibiyet sıfırlar',()=>{
 let streak=0;for(const value of [1400,1900,2400,2900,3400,3400,3400]){const r=roundReward({team:'CT',alive:false,lossStreakBefore:streak,reason:'ct_eliminated',bombPlanted:false});assert.equal(r.total,value);streak=r.nextLossStreak}
 assert.equal(roundReward({team:'T',alive:true,lossStreakBefore:5,reason:'ct_eliminated',bombPlanted:false}).nextLossStreak,0);
});
test('Kurulu bomba ile kaybeden her T +800; beşinci kayıp 4200',()=>{
 for(const alive of [true,false])for(const [before,total] of [[0,2200],[1,2700],[2,3200],[3,3700],[4,4200],[5,4200]])assert.equal(roundReward({team:'T',alive,lossStreakBefore:before,reason:'bomb_defused',bombPlanted:true}).total,total);
});
test('Süre doldu: canlı T sıfır, ölü T seri ödülü, CT 3250; T seri yine artar',()=>{
 const r=roundReward({team:'T',alive:true,lossStreakBefore:2,reason:'time_expired',bombPlanted:false});assert.equal(r.total,0);assert.equal(r.nextLossStreak,3);
 assert.equal(roundReward({team:'T',alive:false,lossStreakBefore:2,reason:'time_expired',bombPlanted:false}).total,2400);
 assert.equal(roundReward({team:'CT',alive:true,lossStreakBefore:0,reason:'time_expired',bombPlanted:false}).total,3250);
});
test('Bomba kurulduktan sonra normal süre/eliminasyon CT galibiyeti üretemez',()=>{
 for(const reason of ['time_expired','t_eliminated'])assert.throws(()=>roundReward({team:'T',alive:true,lossStreakBefore:0,reason,bombPlanted:true}),/IMPOSSIBLE_OUTCOME/);
});
test('Kill ödülleri ve P90/seri tabanca/AWP istisnaları',()=>{
 for(const [id,value] of [['pistol_auto',100],['pistol_piercing',300],['pistol_heavy',300],['sniper_heavy',100],['sniper_light',300],['smg_capacity',300],['t_smg',600],['shotgun_basic',900],['knife',1500],['grenade_he',300]])assert.equal(killReward({itemId:id,killerTeam:'T',victimTeam:'CT'}),value);
 assert.equal(killReward({kind:'lmg',killerTeam:'CT',victimTeam:'T'}),300);assert.equal(killReward({itemId:'knife',killerTeam:'T',victimTeam:'T'}),0);assert.equal(killReward({itemId:'knife',killerTeam:'T',victimTeam:'CT',suicide:true}),0);
});
test('16000 tavanı, gerçek eklenen tutar ve tam TL doğrulaması',()=>{
 assert.deepEqual(credit(15900,4200),{balance:16000,requestedDelta:4200,appliedDelta:100});assert.equal(credit(16000,1500).appliedDelta,0);
 for(const v of [-1,NaN,1.5,'800',16001])assert.throws(()=>credit(v,300));
});
test('Ölü, yanlış takım/bölge, süre/faz ve parasız satın alma reddedilir',()=>{
 assert.throws(()=>quote(player({alive:false}),ctx,'t_main_rifle'),/DEAD/);assert.throws(()=>quote(player({connected:false}),ctx,'t_main_rifle'),/DISCONNECTED/);
 assert.throws(()=>quote(player(),ctx,'ct_main_rifle'),/WRONG_TEAM/);assert.throws(()=>quote(player(),{...ctx,inTeamBuyZone:false},'t_main_rifle'),/OUTSIDE_BUY_ZONE/);
 for(const time of [30,31,-1,NaN])assert.throws(()=>quote(player(),{...ctx,buyElapsed:time},'t_main_rifle'),/BUY_CLOSED/);
 for(const phase of ['warmup','postplant','ended'])assert.throws(()=>quote(player(),{...ctx,phase},'t_main_rifle'),/BUY_CLOSED/);
 assert.throws(()=>quote(player({money:2699}),ctx,'t_main_rifle'),/INSUFFICIENT_FUNDS/);
});
test('Başlangıç tabancası/bıçak tekrar ücretsiz alınamaz; kit yalnız CT',()=>{
 for(const id of ['t_default','knife'])assert.throws(()=>quote(player(),ctx,id),/SPAWN_ONLY/);
 assert.throws(()=>quote(player(),ctx,'defuse_kit'),/WRONG_TEAM/);assert.equal(purchase(player({team:'CT'}),ctx,'defuse_kit').player.defuseKit,true);
});
test('800 TL tabanca raundunda yelek sonrası 150 kalır; fazla harcama olmaz',()=>{
 const p=purchase(player({money:800}),ctx,'armor_vest').player;assert.equal(p.money,150);assert.equal(p.armor,100);assert.throws(()=>purchase(p,ctx,'grenade_flash'),/INSUFFICIENT_FUNDS/);
 const q=purchase(player({money:800}),ctx,'pistol_standard').player;assert.equal(q.money,500);assert.equal(purchase(q,ctx,'grenade_flash').player.money,300);
});
test('Zırh 650/1000, kask yükseltmesi 350 ve mevcut kask tamiri 650',()=>{
 assert.equal(quote(player(),ctx,'armor_vest').cost,650);assert.equal(quote(player(),ctx,'armor_helmet').cost,1000);assert.equal(quote(player({armor:100}),ctx,'armor_helmet').cost,350);
 assert.equal(quote(player({armor:35,helmet:true}),ctx,'armor_helmet').cost,650);assert.equal(quote(player({armor:35}),ctx,'armor_helmet').cost,1000);
 assert.throws(()=>quote(player({armor:100,helmet:true}),ctx,'armor_helmet'),/ALREADY_OWNED/);
});
test('En fazla dört bomba, iki flaş; başka türler bir adet',()=>{
 let p=player();for(const id of ['grenade_flash','grenade_flash','grenade_smoke','grenade_he'])p=purchase(p,ctx,id).player;
 assert.equal(p.inventory.grenades.length,4);assert.throws(()=>quote(p,ctx,'t_molotov'),/GRENADE_TOTAL_CAP/);
 assert.throws(()=>quote(player({inventory:{grenades:['grenade_flash','grenade_flash']}}),ctx,'grenade_flash'),/GRENADE_TYPE_CAP/);
 assert.throws(()=>quote(player({inventory:{grenades:['grenade_smoke']}}),ctx,'grenade_smoke'),/GRENADE_TYPE_CAP/);
});
test('Silah değişimi eski silahı düşürür; reddedilen işlem para/envanter değiştirmez',()=>{
 const p=player({inventory:{primary:'t_budget_rifle',secondary:null,grenades:[]}}),before=structuredClone(p),r=purchase(p,ctx,'t_main_rifle');assert.equal(r.dropped,'t_budget_rifle');assert.equal(r.player.money,13300);assert.deepEqual(p,before);
 assert.throws(()=>purchase(p,ctx,'ct_main_rifle'));assert.deepEqual(p,before);
});
test('Tekrar gelen istek bir kez keser; aynı anahtarla farklı ürün reddedilir',()=>{
 const ref=new IdempotentPurchases(player());const first=ref.buy('uuid-1',ctx,'t_main_rifle');assert.deepEqual(ref.buy('uuid-1',{...ctx,phase:'ended'},'t_main_rifle'),first);assert.equal(ref.player.money,13300);
 assert.throws(()=>ref.buy('uuid-1',ctx,'t_smg'),/REQUEST_ID_CONFLICT/);
});
test('SQLite şeması ve 27 katalog satırı: FK, cüzdan tavanı, çift olay ve atomik geri alma',()=>{
 const {DatabaseSync}=require('node:sqlite'),db=new DatabaseSync(':memory:');try{
  const dir=path.resolve(__dirname,'../../docs/codex-ekonomi'),raw=fs.readFileSync(path.join(dir,'competitive-economy.v1.json'),'utf8');db.exec(fs.readFileSync(path.join(dir,'schema.sqlite.sql'),'utf8'));
  db.prepare('INSERT INTO economy_configs VALUES(?,?,?)').run(cfg.version,raw,crypto.createHash('sha256').update(raw).digest('hex'));
  const insert=db.prepare('INSERT INTO catalog_items VALUES(?,?,?,?,?)');for(const i of cfg.items)insert.run(cfg.version,i.id,i.price,i.killReward,JSON.stringify(i));
  assert.equal(db.prepare('SELECT count(*) AS n FROM catalog_items').get().n,27);
  db.exec("INSERT INTO matches VALUES('m1','1.0.0','freeze',1,'arena');INSERT INTO team_state VALUES('m1','T',0),('m1','CT',0);INSERT INTO wallets(match_id,player_id,team) VALUES('m1','p1','T');INSERT INTO rounds(match_id,round_id,round_index) VALUES('m1','r1',1);");
  assert.throws(()=>db.exec("UPDATE wallets SET money=16001"));assert.throws(()=>db.exec("UPDATE wallets SET defuse_kit=1"));
  assert.throws(()=>db.exec("UPDATE rounds SET reason='time_expired',winner='CT',bomb_planted=1"));assert.throws(()=>db.exec("UPDATE rounds SET reason='bomb_defused',winner=NULL,bomb_planted=1"));
  db.exec("BEGIN IMMEDIATE;UPDATE wallets SET money=500 WHERE player_id='p1';");try{db.exec("INSERT INTO economy_ledger VALUES('e1','kill-1','m1','r1','p1','kill',300,300,500,'1.0.0',1);INSERT INTO economy_ledger VALUES('e2','kill-1','m1','r1','p1','kill',300,300,500,'1.0.0',1)");assert.fail('Çift olay reddedilmeliydi')}catch(e){db.exec('ROLLBACK');assert.match(e.message,/UNIQUE/)}
  assert.equal(db.prepare('SELECT money FROM wallets').get().money,800);assert.equal(db.prepare('SELECT count(*) AS n FROM economy_ledger').get().n,0);
 }finally{db.close()}
});
