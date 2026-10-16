'use strict';
// Tasarım kabul testleri için bağımsız örnek. Oyun sunucusuna bağlanmaz.
const cfg=require('../../docs/codex-rekabetci/competitive-rank.v1.json');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),round=v=>v<0?-Math.round(-v):Math.round(v);
function int(n,min=0){if(!Number.isSafeInteger(n)||n<min)throw Error('INVALID_INTEGER')}
function tier(elo,completed){int(elo);int(completed);if(completed<5)return null;return cfg.ranks.find(r=>elo>=r.minElo&&(r.maxElo===null||elo<=r.maxElo))}
function performance(stats,rounds){
 int(rounds,1);for(const k of ['kills','assists','deaths','enemyDamage','plants','defuses'])int(stats[k]);
 if(stats.plants+stats.defuses>rounds||stats.deaths>rounds||stats.kills>rounds*5)throw Error('IMPOSSIBLE_STATS');
 const p=cfg.performance,kda=clamp((stats.kills+p.kda.assistWeight*stats.assists)/Math.max(1,stats.deaths)/p.kda.normalization,0,1);
 const damage=clamp(stats.enemyDamage/rounds/p.damage.normalizationAdr,0,1),objective=clamp((stats.plants+stats.defuses)/p.objective.normalization,0,1);
 return clamp(kda*p.kda.weight+damage*p.damage.weight+objective*p.objective.weight,0,1);
}
function expected(ours,theirs){if(!Number.isFinite(ours)||!Number.isFinite(theirs)||ours<0||theirs<0)throw Error('INVALID_ELO');return 1/(1+Math.pow(10,(theirs-ours)/cfg.rating.expectedScoreScale))}
function teamMean(elos){if(!Array.isArray(elos)||elos.length!==5)throw Error('FIVE_PLAYER_SNAPSHOT_REQUIRED');elos.forEach(e=>int(e));return elos.reduce((a,b)=>a+b,0)/5}
function outcome(ours,theirs){int(ours);int(theirs);if(ours===15&&theirs===15)return 'draw';if(Math.max(ours,theirs)!==16||Math.min(ours,theirs)>14)throw Error('INVALID_FINAL_SCORE');return ours>theirs?'win':'loss'}
function delta({ours,theirs,teamMean,opponentMean,perf,ebo=false}){
 const result=outcome(ours,theirs);if(!Number.isFinite(perf)||perf<0||perf>1)throw Error('INVALID_PERFORMANCE');const p=expected(teamMean,opponentMean),m=Math.abs(ours-theirs)/16;
 if(result==='draw')return 0;
 if(result==='win'){const w=cfg.rating.win,mult=w.performanceMultiplierMin+(w.performanceMultiplierMax-w.performanceMultiplierMin)*perf;return round(clamp((w.base+w.underdogWeight*(1-p))*mult+w.marginWeight*m,w.minDelta,w.maxDelta))}
 const l=cfg.rating.loss;return -round(clamp((l.base+l.favoriteWeight*p+l.marginWeight*m)*(ebo?l.eboMultiplier:1),l.minMagnitude,l.maxMagnitude));
}
function selectEbo(players,rounds){
 const eligible=players.filter(p=>!p.abandoned&&p.roundsParticipated/rounds>=.8&&(p.stats.enemyDamage>0||p.stats.plants+p.stats.defuses>0));
 const score=p=>performance(p.stats,rounds),objectives=p=>p.stats.plants+p.stats.defuses;
 eligible.sort((a,b)=>score(b)-score(a)||objectives(b)-objectives(a)||b.stats.enemyDamage-a.stats.enemyDamage||b.stats.kills-a.stats.kills||a.stats.deaths-b.stats.deaths||(a.id<b.id?-1:a.id>b.id?1:0));return eligible[0]?.id||null;
}
function apply(profile,match,accountLevelForXp){
 const p=structuredClone(profile);if(!['ranked','unranked'].includes(match.mode))throw Error('UNKNOWN_MODE');
 if(match.cancelled)return{profile:p,nominalDelta:0,actualDelta:0};
 const result=outcome(match.ours,match.theirs),reward=match.abandoned?cfg.accountRewards.abandon:cfg.accountRewards[result];
 // Mevcut hesap XP eğrisi dışarıdan verilir; rekabetçi sistem yeni bir eğri uydurmaz.
 if(typeof accountLevelForXp!=='function')throw Error('ACCOUNT_LEVEL_CURVE_REQUIRED');
 p.Account_XP+=reward.xp;p.Account_TL+=reward.tl;
 int(p.Account_XP);int(p.Account_TL);p.Account_Level=accountLevelForXp(p.Account_XP);int(p.Account_Level,1);
 if(match.mode==='unranked')return{profile:p,nominalDelta:0,actualDelta:0};
 const change=match.abandoned?-25:delta(match);p.Competitive_Elo=Math.max(0,p.Competitive_Elo+change);
 const counter=match.abandoned?'Losses':result==='win'?'Wins':result==='loss'?'Losses':'Draws';p['Ranked_'+counter]++;p['Season_Ranked_'+counter]++;
 if(match.abandoned)p.Ranked_Abandons++;else p.Placement_Matches_Completed=Math.min(5,p.Placement_Matches_Completed+1);
 p.Placement_Matches_Left=Math.max(0,5-p.Placement_Matches_Completed);const r=tier(p.Competitive_Elo,p.Placement_Matches_Completed);
 p.Rank_Tier=r?.tier||null;p.Rank_Division=r?.division||null;p.Rank_Label=r?.label||'Derecelendirilmemiş';p.Last_Competitive_Match_Id=match.matchId;p.Competitive_Rating_Updated_At=match.completedAt;
 return{profile:p,nominalDelta:change,actualDelta:p.Competitive_Elo-profile.Competitive_Elo};
}
function newSeason(profile,seasonId){
 if(seasonId===profile.Competitive_Season)return structuredClone(profile);
 const p=structuredClone(profile);p.Previous_Season={season:profile.Competitive_Season,elo:profile.Competitive_Elo,rank:profile.Rank_Label};
 p.Competitive_Season=seasonId;p.Competitive_Elo=Math.max(0,round(900+.75*(profile.Competitive_Elo-900)));p.Placement_Matches_Completed=0;p.Placement_Matches_Left=5;p.Rank_Tier=null;p.Rank_Division=null;p.Rank_Label='Derecelendirilmemiş';p.Season_Ranked_Wins=p.Season_Ranked_Losses=p.Season_Ranked_Draws=0;return p;
}
class Once{
 constructor(profile,accountLevelForXp){this.profile=structuredClone(profile);this.levelForXp=accountLevelForXp;this.events=new Map()}
 settle(match){const key=this.profile.Competitive_Season+'/'+match.matchId;const old=this.events.get(key);if(old){if(old.input!==JSON.stringify(match))throw Error('RESULT_CONFLICT_REQUIRES_ADMIN_REVISION');return structuredClone(old.result)}
  const result=apply(this.profile,match,this.levelForXp);this.profile=result.profile;this.events.set(key,{input:JSON.stringify(match),result:structuredClone(result)});return structuredClone(result);
 }
}
module.exports={cfg,round,tier,performance,expected,teamMean,outcome,delta,selectEbo,apply,newSeason,Once};
