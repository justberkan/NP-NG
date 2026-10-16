'use strict';
// Konfigürasyonun kabul testleri için bağımsız referans; oyuna yüklenmez.
const cfg=require('../../docs/codex-ekonomi/competitive-economy.v1.json');
const byId=new Map(cfg.items.map(i=>[i.id,i]));
function fail(code){throw new Error(code)}
function integer(v,min,max){if(!Number.isSafeInteger(v)||v<min||v>max)fail('INVALID_INTEGER')}
function credit(balance,amount){integer(balance,0,cfg.wallet.cap);integer(amount,0,1000000);const after=Math.min(cfg.wallet.cap,balance+amount);return{balance:after,requestedDelta:amount,appliedDelta:after-balance}}
function roundReward({team,alive,lossStreakBefore,reason,bombPlanted}){
 if(!['T','CT'].includes(team)||typeof alive!=='boolean'||typeof bombPlanted!=='boolean')fail('INVALID_ROUND_INPUT');integer(lossStreakBefore,0,cfg.rewards.lossStreakMax);
 const outcome=cfg.outcomes.find(o=>o.reason===reason);if(!outcome||outcome.bombPlanted!=='either'&&outcome.bombPlanted!==bombPlanted)fail('IMPOSSIBLE_OUTCOME');
 if(outcome.winner===team)return{base:cfg.rewards.win,bonus:outcome.winExtra,total:cfg.rewards.win+outcome.winExtra,nextLossStreak:0};
 const streak=Math.min(cfg.rewards.lossStreakMax,lossStreakBefore+1),base=cfg.rewards.loss[streak-1];
 if(team==='T'&&alive&&reason==='time_expired')return{base:0,bonus:0,total:0,nextLossStreak:streak};
 const bonus=team==='T'&&bombPlanted?cfg.rewards.plantLossBonusT:0;return{base,bonus,total:base+bonus,nextLossStreak:streak};
}
function killReward({itemId,kind,killerTeam,victimTeam,suicide=false}){
 if(!['T','CT'].includes(killerTeam)||!['T','CT'].includes(victimTeam))fail('INVALID_TEAM');
 if(suicide||killerTeam===victimTeam)return 0;
 if(itemId){const item=byId.get(itemId);if(!item)fail('UNKNOWN_ITEM');return item.killReward}
 if(!Object.hasOwn(cfg.rewards.killDefaults,kind))fail('UNKNOWN_KILL_KIND');return cfg.rewards.killDefaults[kind];
}
function quote(player,context,itemId){
 const item=byId.get(itemId);if(!item)fail('UNKNOWN_ITEM');
 if(!['T','CT'].includes(player.team))fail('INVALID_TEAM');integer(player.money,0,cfg.wallet.cap);integer(player.armor,0,100);
 if(!player.connected)fail('DISCONNECTED');if(!player.alive)fail('DEAD');
 if(!cfg.purchases.allowedPhases.includes(context.phase)||!Number.isFinite(context.buyElapsed)||context.buyElapsed<0||context.buyElapsed>=cfg.purchases.buySeconds)fail('BUY_CLOSED');
 if(!context.inTeamBuyZone)fail('OUTSIDE_BUY_ZONE');if(!item.teams.includes(player.team))fail('WRONG_TEAM');
 if(item.purchasePolicy==='spawn_only')fail('SPAWN_ONLY');
 let cost=item.price;
 if(item.id==='armor_vest'&&player.armor===100)fail('ALREADY_OWNED');
 if(item.id==='armor_helmet'){
  if(player.armor===100&&player.helmet)fail('ALREADY_OWNED');
  cost=player.helmet?cfg.purchases.armor.damagedArmorWithHelmetRepair:player.armor===100?cfg.purchases.armor.fullVestHelmetUpgrade:cfg.purchases.armor.damagedVestHelmetBundle;
 }
 if(item.slot==='defuse'&&player.defuseKit)fail('ALREADY_OWNED');
 if(['primary','secondary'].includes(item.slot)&&player.inventory[item.slot]===item.id)fail('ALREADY_OWNED');
 if(item.slot==='grenade'){
  const grenades=player.inventory.grenades;if(grenades.length>=cfg.purchases.maxGrenades)fail('GRENADE_TOTAL_CAP');
  const count=grenades.filter(id=>byId.get(id)?.grenadeType===item.grenadeType).length;
  if(count>=cfg.purchases.grenadeTypeCaps[item.grenadeType])fail('GRENADE_TYPE_CAP');
 }
 if(player.money<cost)fail('INSUFFICIENT_FUNDS');return{item,cost};
}
function purchase(player,context,itemId){
 const {item,cost}=quote(player,context,itemId),next=structuredClone(player);let dropped=null;
 next.money-=cost;
 if(['primary','secondary'].includes(item.slot)){dropped=next.inventory[item.slot]||null;next.inventory[item.slot]=item.id}
 else if(item.slot==='grenade')next.inventory.grenades.push(item.id);
 else if(item.slot==='defuse')next.defuseKit=true;
 else if(item.slot==='armor'){next.armor=100;if(item.id==='armor_helmet')next.helmet=true}
 return{player:next,cost,dropped};
}
// Sunucu olayları tek kez uygulanmalı: referans testinde aynı anahtar + değişen istek hata verir.
class IdempotentPurchases{
 constructor(player){this.player=structuredClone(player);this.results=new Map()}
 buy(requestId,context,itemId){
  if(typeof requestId!=='string'||!requestId||requestId.length>128)fail('INVALID_REQUEST_ID');
  const key=String(context.roundId)+'/'+requestId,previous=this.results.get(key);
  if(previous){if(previous.itemId!==itemId)fail('REQUEST_ID_CONFLICT');return structuredClone(previous.result)}
  const result=purchase(this.player,context,itemId);this.player=result.player;this.results.set(key,{itemId,result:structuredClone(result)});return structuredClone(result);
 }
}
module.exports={cfg,byId,credit,roundReward,killReward,quote,purchase,IdempotentPurchases};
