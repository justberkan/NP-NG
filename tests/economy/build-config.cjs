'use strict';
// Yalnız tasarım/konfigürasyon çıktısı üretir; oyun dosyalarına yazmaz.
const fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'../../docs/codex-ekonomi');fs.mkdirSync(out,{recursive:true});
const items=[];
function item(id,name,category,teams,price,killReward,slot,role,catalogId=null,extra={}){
 items.push({id,name,category,teams,price,killReward,slot,role,modelBinding:{catalogId,status:catalogId?'visual_candidate_only':'requires_implementation'},...extra});
}
item('t_default','T Başlangıç Tabancası','pistols',['T'],0,300,'secondary','default','m_g17',{purchasePolicy:'spawn_only'});
item('ct_default','CT Başlangıç Tabancası','pistols',['CT'],0,300,'secondary','default','m_p9',{purchasePolicy:'spawn_only'});
item('pistol_standard','Standart Tabanca','pistols',['T','CT'],300,300,'secondary','standard','m_p2020');
item('pistol_piercing','Zırh Delici Tabanca','pistols',['T','CT'],500,300,'secondary','armor_piercing','m_57');
item('pistol_auto','Seri Tabanca','pistols',['T','CT'],600,100,'secondary','automatic',null,{modelBinding:{catalogId:null,candidateVisualCatalogId:'m_g17',status:'requires_gameplay_variant'}});
item('pistol_heavy','Ağır Tabanca','pistols',['T','CT'],700,300,'secondary','heavy','m_deagle');
item('smg_budget','Ekonomik SMG','heavy_smg',['T','CT'],1050,600,'primary','budget_smg','m_skor');
item('t_smg','T Hücum SMG','heavy_smg',['T'],1200,600,'primary','main_smg','m_ump');
item('ct_smg','CT Hücum SMG','heavy_smg',['CT'],1400,600,'primary','main_smg','m_mp7');
item('smg_capacity','Yüksek Şarjörlü SMG','heavy_smg',['T','CT'],2350,300,'primary','p90_equivalent','m_p90');
item('shotgun_basic','Temel Pompalı','heavy_smg',['T','CT'],1200,900,'primary','shotgun','m_xma');
item('t_budget_rifle','T Ekonomik Tüfek','rifles',['T'],2000,300,'primary','budget_rifle','m_galil');
item('ct_budget_rifle','CT Ekonomik Tüfek','rifles',['CT'],2250,300,'primary','budget_rifle','m_famas');
item('t_main_rifle','T Ana Tüfek','rifles',['T'],2700,300,'primary','ak_equivalent','m_ak556');
item('ct_main_rifle','CT Ana Tüfek','rifles',['CT'],3100,300,'primary','m4_equivalent','m_m4');
item('sniper_light','Hafif Keskin Nişancı','rifles',['T','CT'],1700,300,'primary','scout_equivalent','m_m24');
item('sniper_heavy','Ağır Keskin Nişancı','rifles',['T','CT'],4750,100,'primary','awp_equivalent','m_awm');
item('armor_vest','Yelek','equipment',['T','CT'],650,0,'armor','armor',null,{maxPerPlayer:1,armorValue:100});
item('armor_helmet','Yelek + Kask','equipment',['T','CT'],1000,0,'armor','armor_helmet',null,{maxPerPlayer:1,armorValue:100,helmet:true});
item('defuse_kit','İmha Kiti','equipment',['CT'],400,0,'defuse','defuse',null,{maxPerPlayer:1});
item('knife','Savaş Bıçağı','equipment',['T','CT'],0,1500,'melee','melee','m_kcom',{purchasePolicy:'spawn_only',maxPerPlayer:1});
item('grenade_he','El Bombası','grenades',['T','CT'],300,300,'grenade','he',null,{grenadeType:'he',maxPerPlayer:1});
item('grenade_flash','Flaş Bombası','grenades',['T','CT'],200,300,'grenade','flash',null,{grenadeType:'flash',maxPerPlayer:2});
item('grenade_smoke','Sis Bombası','grenades',['T','CT'],300,300,'grenade','smoke',null,{grenadeType:'smoke',maxPerPlayer:1});
item('t_molotov','Molotof','grenades',['T'],400,300,'grenade','incendiary',null,{grenadeType:'fire',maxPerPlayer:1});
item('ct_incendiary','Yanıcı Bomba','grenades',['CT'],600,300,'grenade','incendiary',null,{grenadeType:'fire',maxPerPlayer:1});
item('grenade_decoy','Yem Bombası','grenades',['T','CT'],50,300,'grenade','decoy',null,{grenadeType:'decoy',maxPerPlayer:1});
const config={
 schemaVersion:1,id:'npng-competitive-tl',version:'1.0.0',status:'design_ready_not_integrated',
 currency:{code:'TRY',label:'TL',symbol:'₺',locale:'tr-TR',fractionDigits:0,storage:'integer_lira'},
 wallet:{scope:'match_half',start:800,cap:16000,persistentWallet:'forbidden',bankTransfer:false,playerTradeMoney:false,reconnect:'retain_server_wallet',lateJoin:'800_once_per_half_next_spawn',sideSwitch:'reset_cash_inventory_and_loss_streak'},
 rewards:{win:3250,bombObjectiveWinExtra:250,loss:[1400,1900,2400,2900,3400],lossStreakMax:5,lossStreakOnWin:'reset_to_zero',plantLossBonusT:800,plantIndividualBonus:0,defuseIndividualBonus:0,tAliveOnUnplantedTimeout:0,killDefaults:{rifle:300,pistol:300,lmg:300,smg:600,shotgun:900,melee:1500,grenade:300},killExceptions:{pistol_auto:100,sniper_heavy:100,smg_capacity:300},friendlyKillReward:0,suicideReward:0,environmentReward:0},
 outcomes:[
  {reason:'ct_eliminated',winner:'T',bombPlanted:'either',winExtra:0},
  {reason:'t_eliminated',winner:'CT',bombPlanted:false,winExtra:0},
  {reason:'time_expired',winner:'CT',bombPlanted:false,winExtra:0},
  {reason:'bomb_detonated',winner:'T',bombPlanted:true,winExtra:250},
  {reason:'bomb_defused',winner:'CT',bombPlanted:true,winExtra:250}
 ],
 purchases:{serverAuthoritative:true,allowedPhases:['freeze','live'],clockOrigin:'freeze_start',buySeconds:30,requireAlive:true,requireTeamBuyZone:true,requireConnected:true,maxGrenades:4,grenadeTypeCaps:{he:1,flash:2,smoke:1,fire:1,decoy:1},primarySlots:1,secondarySlots:1,replaceWeapon:'drop_old_in_same_transaction',ammoIncluded:true,refunds:false,resale:false,duplicateRequest:'return_previous_result_without_reapplying',defaultItems:'grant_at_spawn_only_if_slot_empty',armor:{fullVestHelmetUpgrade:350,damagedVestHelmetBundle:1000,damagedArmorWithHelmetRepair:650,fullArmorRebuy:'reject'},droppedWeaponSideLock:false,droppedKitUsableBy:'CT'},
 suggestedMatchDefaults:{freezeSeconds:15,liveRoundSeconds:115,bombSeconds:40,plantSeconds:3.2,defuseSeconds:10,defuseWithKitSeconds:5,respawnDuringRound:false,resetAtHalf:true,note:'Bunlar belirtilmeyen alanlar için önerilen varsayımlardır; fiyat/ödüller kullanıcı şartıdır.'},
 radial:{openKey:'B',closeKey:'B',backKeys:['Escape','0'],autoBuy:false,reBuy:false,sectorCount:6,startAngleDegrees:-90,direction:'clockwise',centerDeadZonePixels:24,outerRadiusPixels:210,purchaseOn:'explicit_click_or_number_confirm',hover:'preview_only',rootSlots:['pistols','heavy_smg','rifles','equipment','grenades','close'],subcategoryBackSlot:6,itemsFilter:'team_before_layout',centerText:'Geri',show:['price','killReward','wallet','buyTimeRemaining','owned','unaffordable','wrongTeam','capacityReached'],disableFireWhileOpen:true,phaseExit:'close_and_reject_late_request',legacyStorePrices:'never_use'},
 categories:[{id:'pistols',name:'Tabancalar',key:1},{id:'heavy_smg',name:'SMG / Pompalı',key:2},{id:'rifles',name:'Tüfekler',key:3},{id:'equipment',name:'Ekipman',key:4},{id:'grenades',name:'Bombalar',key:5}],
 items,
 serverContract:{purchaseRequestFields:['matchId','roundId','requestId','itemId'],ignoreClientFields:['price','money','team','alive','killReward','winner'],transaction:'validate_deduct_grant_log_atomically',roundSettlement:'one_server_event_per_round_all_players_atomically',killAttribution:'weapon_at_damage_event_not_currently_held',spectatorRewards:false,disconnectReward:'preserve_round_participation_and_actual_alive_state',grenadeInventoryAuthority:'server',ledger:['eventId','matchId','roundId','playerId','reason','requestedDelta','appliedDelta','balanceAfter','configVersion'],persistAcrossServerRestart:'restore_committed_match_snapshot_and_event_ids'},
 integration:{mode:'new_bomb_5v5_not_existing_kill_limit_tm',existingAccountCurrency:'SV.tl_must_not_be_used',modelBindings:'visual_candidates_no_existing_shop_price_or_stats_override',pendingGameplay:['bomb_round_state_machine','team_buy_zones','server_match_wallets','armor_and_defuse_effects','grenade_behaviors','automatic_pistol_variant','competitive_weapon_balance']}
};
fs.writeFileSync(path.join(out,'competitive-economy.v1.json'),JSON.stringify(config,null,2)+'\n');
console.log(`Konfigürasyon: ${items.length} öğe, ${config.categories.length} kategori.`);
