// RTP/çekirdek doğrulama: assets/casino/dede/index.html içindeki <script>'i çıkar,
// DOM'suz çalıştır, simulate() koş. Kullanım: node tests/casino-rtp.cjs [spinSayisi]
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','assets','casino','dede','index.html'),'utf8'); // Claude: sayfa assets altına taşındı (sunucu yalnız assets/js/css/lib sunar)
const m=html.match(/<script>([\s\S]*?)<\/script>/);
if(!m){console.error('script bulunamadi');process.exit(1)}
const code=m[1];
const windowStub={};
const fn=new Function('window','document','localStorage','CustomEvent','addEventListener',code);
fn(windowStub,undefined,undefined,undefined,undefined);
const API=windowStub.NPNG_CASINO;
if(!API){console.error('API yok');process.exit(1)}
const SEED=20261019;
API.seed(SEED);
console.log('near-miss (yapay kıl payı kaçırma) durumu:',API.config.nearMiss?'ACIK':'KAPALI (varsayilan)');
const N=Number(process.argv[2]||1000000);
const t0=Date.now();
const r=API.simulate(N);
console.log('tohum  :',SEED);
console.log('SPIN   :',r.spins);
console.log('RTP    : %'+r.rtp);
console.log('VURUS  : %'+r.hitRate,'(kazanan spin orani)');
console.log('BONUS  :',r.bonusHits,'adet, sikligi 1/'+(r.bonusHits?Math.round(r.spins/r.bonusHits):'inf'));
console.log('MAXWIN :',r.maxWin,'x bahis');
console.log('SÜRE   :',Date.now()-t0,'ms');
const tw=API._core.CATS.reduce((s,c)=>s+c[1],0);
console.log('CAT_W  :',tw.toFixed(6),tw<0.9999||tw>1.0001?'UYARI: toplam 1 degil':'(toplam ~1 OK)');
const bc=API._core.DBG.byCat;
console.log('KATEGORI DAGILIMI (n / toplam kazanc / ort):');
for(const k in bc)console.log('  ',k.padEnd(6),String(bc[k].n).padStart(8),String(Math.round(bc[k].win)).padStart(11),String(Math.round(bc[k].win/bc[k].n*100)/100).padStart(10)+'x');
const {forceWin,genBoard,cascade}=API._core;
let tutan=0,testN=5000;
for(let i=0;i<testN;i++){
  const b=genBoard();const target=2+Math.random()*200;
  forceWin(b,target);
  const r2=cascade(b);const w=r2.base*(1+r2.orbSum);
  if(w>=target*0.7&&w<=target*1.6)tutan++;
}
console.log('FORCEWIN hedef tutma: %'+Math.round(tutan/testN*100),'('+tutan+'/'+testN+')');
/* Claude (2026-10-19, 2026-10-20 güncel): npm test kapısı.
   Düz simülasyon nadir büyük kategorilerde (jackpot 1/50.000, efsane 1/6.700) çok oynak: 1M çevirmede ±%1.3 sapar,
   kod değişip rastgele sayı sırası kayınca kapı şans eseri geçip kalabilir. Kapı bu yüzden KATMANLI tahmindir:
   her kategori kendi içinde yeterince çevrilir, olasılığıyla tartılır (aynı oyun, daha kesin ölçüm). */
const C=API._core.CATS,orig=C.map(c=>c[1]),nearP=(C.find(c=>c[0]==='near')||[0,0])[1];
let strat=0;const rows=[];
API.seed(SEED+1);
for(let k=0;k<C.length;k++){
  if(C[k][0]==='near'&&!API.config.nearMiss)continue;
  const p=C[k][0]==='loss'&&!API.config.nearMiss?orig[k]+nearP:orig[k];
  C.forEach((c,j)=>c[1]=j===k?1:0);
  const nn=['loss','small'].includes(C[k][0])?80000:C[k][0]==='fs'?12000:8000;
  const q=API.simulate(nn),e=q.totalWin/q.totalBet;strat+=p*e;rows.push(C[k][0].padEnd(6)+' p='+p.toFixed(5)+'  ort='+e.toFixed(3)+'x  pay=%'+(p*e*100).toFixed(2));
}
C.forEach((c,j)=>c[1]=orig[j]);
console.log('KATMANLI (kategori başına):');for(const x of rows)console.log('  ',x);
strat=Math.round(strat*10000)/100;
console.log('KATMANLI RTP: %'+strat);
/* Bedava çevirme satın alma (fiyat 10 × bahis, 10 çevirme): kendi fiyatının ~%96'sını geri vermeli */
API.seed(SEED+2);
const b=API.simulateBuy(100000);
console.log('SATIN ALMA: '+b.buys+' kez, fiyat '+API._core.FS.buyCost+'x bahis, ortalama dönüş '+b.avg+'x, RTP %'+b.rtp+', en büyük '+b.maxWin+'x');
{const ok=strat>=95&&strat<=97&&tw>0.9999&&tw<1.0001&&API.config.nearMiss===false&&API._core.FS.spins===10;
 console.log(ok?'PASS DEDE RTP %'+strat+' (katmanlı, bant %95–97, near-miss kapalı, 10 bedava çevirme)':'FAIL DEDE RTP %'+strat+' / near-miss '+API.config.nearMiss+' / bedava '+API._core.FS.spins);if(!ok)process.exitCode=1}
{const ok=b.rtp>=95&&b.rtp<=97.5&&API._core.FS.buyCost===10;
 console.log(ok?'PASS DEDE bedava çevirme satın alma RTP %'+b.rtp+' (bant %95–97.5, fiyat 10× bahis)':'FAIL DEDE satın alma RTP %'+b.rtp+' / fiyat '+API._core.FS.buyCost);if(!ok)process.exitCode=1}
