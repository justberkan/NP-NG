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
/* Claude (2026-10-19): npm test kapısı — RTP %95–97 bandı dışında, kategori toplamı 1 değilse ya da near-miss varsayılanı açıksa FAIL */
{const ok=r.rtp>=95&&r.rtp<=97&&tw>0.9999&&tw<1.0001&&API.config.nearMiss===false;console.log(ok?'PASS DEDE RTP %'+r.rtp+' (bant %95–97, near-miss kapalı)':'FAIL DEDE RTP %'+r.rtp+' / near-miss '+API.config.nearMiss);if(!ok)process.exitCode=1}
