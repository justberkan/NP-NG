'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {cfg,round,tier,performance,expected,teamMean,outcome,delta,selectEbo,apply,newSeason,Once}=require('./reference.cjs');
const base=require('../../docs/codex-rekabetci/player-profile.example.json');
// Yalnız test eğrisi. Gerçek oyunda mevcut genel XP eğrisi çağrılır.
const level=xp=>Math.floor(xp/1000)+1;
const match=(extra={})=>({matchId:'m1',mode:'ranked',ours:16,theirs:14,teamMean:900,opponentMean:900,perf:.5,ebo:false,completedAt:'2026-10-16T12:00:00Z',...extra});
const full={kills:48,assists:0,deaths:8,enemyDamage:4000,plants:3,defuses:0};
test('21 rütbe boşluksuz ve çakışmasız; son kademe açık uçlu',()=>{
 assert.equal(cfg.ranks.length,21);for(let i=0;i<21;i++){const r=cfg.ranks[i];assert.equal(r.minElo,i*100);if(i<20)assert.equal(r.maxElo,(i+1)*100-1)}
 assert.equal(tier(0,5).label,'Demir 1');assert.equal(tier(99,5).label,'Demir 1');assert.equal(tier(100,5).label,'Demir 2');assert.equal(tier(2000,5).label,'Usta 3');assert.equal(tier(9000,5).label,'Usta 3');
 for(let elo=0;elo<=2100;elo++)assert.equal(cfg.ranks.filter(r=>elo>=r.minElo&&(r.maxElo===null||elo<=r.maxElo)).length,1);
});
test('İlk dört maç gizli; beşinci tamamlanan maç rütbe açar',()=>{
 let p=structuredClone(base);for(let i=1;i<=5;i++){p=apply(p,match({matchId:'placement'+i}),level).profile;assert.equal(p.Placement_Matches_Left,Math.max(0,5-i));if(i<5)assert.equal(p.Rank_Tier,null);else assert.ok(p.Rank_Tier)}
 assert.equal(p.Ranked_Wins,5);assert.equal(p.Placement_Matches_Completed,5);assert.ok(p.Competitive_Elo>900);
});
test('Rütbesiz XP/TL verir; rekabetçi durumun her alanı byte düzeyinde aynı kalır',()=>{
 const p={...base,Account_XP:900,Rank_Tier:'platinum',Rank_Division:1,Competitive_Elo:1200,Placement_Matches_Completed:5,Placement_Matches_Left:0};
 const r=apply(p,match({mode:'unranked'}),level).profile;assert.equal(r.Account_XP,1400);assert.equal(r.Account_TL,200);assert.equal(r.Account_Level,2);
 const competitive=o=>Object.fromEntries(Object.entries(o).filter(([k])=>!k.startsWith('Account_')));assert.deepEqual(competitive(r),competitive(p));
});
test('Genel hesap seviyesi Elo sonucunu ve rütbeyi değiştirmez',()=>{
 const a=apply(base,match(),level),b=apply({...base,Account_XP:99000,Account_Level:100},match(),level);assert.equal(a.actualDelta,b.actualDelta);assert.equal(a.profile.Competitive_Elo,b.profile.Competitive_Elo);
});
test('Beklenen kazanma olasılığı yalnız kilitli beşli Elo ortalamasına bağlı',()=>{
 assert.equal(teamMean([800,900,1000,1100,1200]),1000);assert.equal(expected(1000,1000),.5);assert.ok(expected(1000,1400)<.1);assert.throws(()=>teamMean([1,2,3,4]));
});
test('Normal galibiyetler +15..+30, mağlubiyetler -15..-25',()=>{
 for(const a of [0,300,900,2000,9000])for(const b of [0,300,900,2000,9000])for(const perf of [0,.25,.5,1])for(const loser of [0,7,14]){
  const w=delta(match({ours:16,theirs:loser,teamMean:a,opponentMean:b,perf}));assert.ok(w>=15&&w<=30);
  for(const ebo of [false,true]){const l=delta(match({ours:loser,theirs:16,teamMean:a,opponentMean:b,perf,ebo}));assert.ok(l>=-25&&l<=-15)}
 }
});
test('Aynı rakip/performance ile 16-0, 16-14 galibiyetinden fazla kazandırır',()=>{
 assert.equal(delta(match({theirs:0,perf:1})),25);assert.equal(delta(match({theirs:14,perf:1})),22);
 assert.ok(delta(match({theirs:0}))>delta(match({theirs:14})));
});
test('Güçlü rakibi yenmek daha çok; favori kaybetmek daha pahalı',()=>{
 assert.ok(delta(match({teamMean:900,opponentMean:1300}))>delta(match({teamMean:1300,opponentMean:900})));
 assert.ok(delta(match({ours:5,theirs:16,teamMean:1300,opponentMean:900}))<delta(match({ours:5,theirs:16,teamMean:900,opponentMean:1300})));
});
test('Performans çarpanı sınırlı; iyi performans galibiyete ek puan sağlar',()=>{
 assert.equal(performance(full,30),1);assert.equal(performance({kills:0,assists:0,deaths:0,enemyDamage:0,plants:0,defuses:0},30),0);
 assert.ok(delta(match({perf:1}))>delta(match({perf:0})));assert.throws(()=>delta(match({perf:2})));assert.throws(()=>performance({...full,deaths:31},30));
});
test('Mağlup EBO daha az kaybeder; kaybettiği için pozitif Elo alamaz',()=>{
 const normal=delta(match({ours:0,theirs:16})),ebo=delta(match({ours:0,theirs:16,ebo:true}));assert.equal(normal,-21);assert.equal(ebo,-17);assert.ok(ebo<0);
});
test('EBO tek oyuncu; bağ eşitliğinde deterministik, AFK/ayrılan hariç',()=>{
 const a={id:'a',stats:full,roundsParticipated:30,abandoned:false},b={...a,id:'b'};assert.equal(selectEbo([b,a],30),'a');assert.equal(selectEbo([{...a,abandoned:true},b],30),'b');assert.equal(selectEbo([{...a,roundsParticipated:5}],30),null);
});
test('15-15 beraberlik Elo 0; placement sayılır; geçersiz final skorları reddedilir',()=>{
 const r=apply(base,match({ours:15,theirs:15}),level);assert.equal(r.actualDelta,0);assert.equal(r.profile.Ranked_Draws,1);assert.equal(r.profile.Placement_Matches_Left,4);
 for(const [a,b] of [[0,0],[16,15],[17,15],[15,14],[16,-1]])assert.throws(()=>outcome(a,b));
});
test('0 Elo tabanı: nominal kayıp ile gerçek uygulanan kayıp ayrıdır',()=>{
 const r=apply({...base,Competitive_Elo:10},match({ours:0,theirs:16}),level);assert.equal(r.nominalDelta,-21);assert.equal(r.actualDelta,-10);assert.equal(r.profile.Competitive_Elo,0);
});
test('Eşik geçişleri anlık; gizli placement sırasında rozet gösterilmez',()=>{
 const p={...base,Competitive_Elo:1190,Placement_Matches_Completed:5,Placement_Matches_Left:0};assert.equal(apply(p,match(),level).profile.Rank_Tier,'platinum');assert.equal(tier(9000,4),null);
});
test('Yeni sezon 5 placement, soft reset; hesap ve yaşam boyu sayaçlar korunur',()=>{
 const p={...base,Competitive_Elo:1500,Competitive_Season:'S1',Ranked_Wins:70,Account_XP:12345,Account_TL:5000};const r=newSeason(p,'S2');assert.equal(r.Competitive_Elo,1350);assert.equal(r.Placement_Matches_Left,5);assert.equal(r.Rank_Tier,null);assert.equal(r.Ranked_Wins,70);assert.equal(r.Account_XP,12345);assert.equal(r.Account_TL,5000);assert.deepEqual(newSeason(r,'S2'),r);
});
test('Maç terk etmek -25; placement ilerlemez, XP/TL vermez; rütbesizde Elo etkisi yok',()=>{
 const r=apply(base,match({abandoned:true}),level).profile;assert.equal(r.Competitive_Elo,875);assert.equal(r.Placement_Matches_Left,5);assert.equal(r.Account_XP,0);assert.equal(r.Ranked_Losses,1);assert.equal(r.Ranked_Abandons,1);
 const u=apply(base,match({abandoned:true,mode:'unranked'}),level).profile;assert.equal(u.Competitive_Elo,900);assert.equal(u.Ranked_Losses,0);
});
test('Sunucu iptali hiçbir hesap/Elo alanını değiştirmez',()=>assert.deepEqual(apply(base,match({cancelled:true}),level).profile,base));
test('Tekrar sonuç: tek XP/TL/Elo ödemesi; çelişen sonuç ayrı admin revizyonu ister',()=>{
 const once=new Once(base,level),m=match();const a=once.settle(m);assert.deepEqual(once.settle(m),a);assert.equal(once.profile.Ranked_Wins,1);assert.equal(once.profile.Account_TL,200);assert.throws(()=>once.settle(match({ours:14,theirs:16})),/RESULT_CONFLICT/);
});
test('Yuvarlama C#/JSON sözleşmesi: yarımlar sıfırdan uzağa',()=>{assert.equal(round(20.5),21);assert.equal(round(-20.5),-21)});
