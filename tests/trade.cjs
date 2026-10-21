'use strict';
/* Trade v1 (2026-10-21): borsa yerine TradingSim — BTC/EURO/ALTIN, piyasa+limit emir, kalıcılık, eski coin göçü. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const baseURL = process.env.TEST_URL || 'http://127.0.0.1:3000';
const fs = require('node:fs'), path = require('node:path');
fs.mkdirSync(path.resolve('test-results'), {recursive: true});
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const localChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const executablePath = process.env.CHROME_PATH || (fs.existsSync(localChrome) ? localChrome : undefined);
  const browser = await chromium.launch({headless: true, executablePath});
  const page = await browser.newPage({viewport: {width: 1280, height: 720}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const check = (name, cond, extra) => {assert.ok(cond, name);console.log('PASS', name, extra ? '· ' + JSON.stringify(extra) : '')};
  try {
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto(baseURL, {waitUntil: 'load'});
    await page.waitForFunction(() => typeof view === 'function' && typeof VIEWS !== 'undefined');

    /* 1) Eski borsa gitti, trade geldi */
    const r1 = await page.evaluate(() => ({
      navTrade: NAV.some(n => n[0] === 'trade'),
      navStock: NAV.some(n => n[0] === 'stock'),
      tradeView: typeof VIEWS.trade === 'function',
      oldStock: typeof stockV === 'function',
      oldBuy: typeof coinBuy === 'function',
      syms: (typeof TR_SYMS !== 'undefined') ? TR_SYMS.map(s => s.s).join(',') : 'yok'
    }));
    check('NAV: "trade" var, "stock" yok', r1.navTrade && !r1.navStock);
    check('Eski borsa fonksiyonları kalktı', !r1.oldStock && !r1.oldBuy);
    check('Semboller BTC/EUR/XAU', r1.syms === 'BTC,EUR,XAU', {syms: r1.syms});

    /* 2) Trade ekranı açılır, grafik çizilir, fiyat canlı */
    await page.evaluate(() => view('trade'));
    await sleep(1200);
    const r2 = await page.evaluate(() => ({
      canvas: !!document.querySelector('#trchart canvas'),
      px: ($('trpx') || {}).textContent || '',
      ticking: typeof TR !== 'undefined' && TR.iv > 0,
      n0: SV.trade.n
    }));
    check('Trade ekranı + mum grafiği açıldı', r2.canvas && /TL/.test(r2.px), {px: r2.px});
    check('Fiyat döngüsü işliyor', r2.ticking);
    await sleep(800);
    const n1 = await page.evaluate(() => SV.trade.n);
    check('Fiyat tick ilerliyor', n1 > r2.n0, {n0: r2.n0, n1});

    /* 3) Piyasa alımı: TL çözülür, pozisyon açılır (save kapalı: çevrimdışı kuralı parayı INF yapar, matematik için finit bakiye kullan) */
    const r3 = await page.evaluate(() => {
      const _save = window.save; window.save = () => {};
      SV.tl = 1000;
      const y = SV.trade.S.BTC, q = 100 / y.price;
      const r = trPlace({symbol: 'BTC', side: 'buy', qty: q, type: 'market'});
      const posQ = SV.trade.pos.BTC.qty, tlB = SV.tl;
      const r2 = trPlace({symbol: 'BTC', side: 'sell', qty: posQ, type: 'market'});
      window.save = _save;
      return {okBuy: r.ok, okSell: r2.ok, tlB, tl1: SV.tl, posQ};
    });
    check('Piyasa alımı çalışıyor (bakiye çözüldü, pozisyon açıldı)', r3.okBuy && r3.posQ > 0 && r3.tlB < 1000 && r3.tlB > 899, {tlB: +r3.tlB.toFixed(2)});
    check('Satış + komisyon doğru (küçük fark kalır)', r3.okSell && r3.tl1 < 1000 && r3.tl1 > 998, {tl1: +r3.tl1.toFixed(3)});

    /* 4) Limit emri: bekler, fiyat düşünce kendiliğinden gerçekleşir */
    const r4 = await page.evaluate(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const y = SV.trade.S.BTC;
      const lim = y.price * .9;
      const r = trPlace({symbol: 'BTC', side: 'buy', qty: 0.0005, type: 'limit', price: lim});
      const pending = SV.trade.orders.length;
      /* fiyatı limit altına indir: büyük olumsuz şok + birkaç tick bekle */
      y.shock = -y.vol * 3;
      const t0 = Date.now();
      while (Date.now() - t0 < 6000 && SV.trade.orders.length) await sleep(200);
      return {ok: r.ok && r.pending, pending, filled: SV.trade.orders.length === 0, qty: SV.trade.pos.BTC.qty};
    });
    check('Limit emri beklemeye alınıyor', r4.ok && r4.pending === 1);
    check('Limit emri fiyat düşünce kendiliğinden gerçekleşiyor', r4.filled && r4.qty > 0, r4);

    /* 5) Kalıcılık: kapat-aç sonrası pozisyon duruyor (çevrimdışı kuralına rağmen SV yükü diske yazılırsa) */
    const posBefore = await page.evaluate(() => {
      try { localStorage.setItem('mmofps_sv', JSON.stringify(SV)) } catch (e) {}
      return SV.trade.pos.BTC.qty;
    });
    await page.reload({waitUntil: 'load'});
    await page.waitForFunction(() => typeof view === 'function');
    const posAfter = await page.evaluate(() => { if (!SV.trade) return -1; return SV.trade.pos.BTC.qty; });
    check('Pozisyon oyunu kapatıp açınca korunuyor', posAfter === posBefore, {posBefore, posAfter});

    /* 6) Eski borsa coinleri TL'ye çevriliyor (tek seferlik göç) */
    const r6 = await page.evaluate(() => {
      const tl0 = SV.tl;
      SV.eco.coins = {btc: {q: 1, cost: 10}};
      SV.trade.mig = 0;
      ensureTrade();
      const gained = SV.tl - tl0;
      const mig1 = SV.trade.mig, coinsCleared = Object.keys(SV.eco.coins).length === 0;
      /* ikinci çalıştırma para vermemeli */
      const tl1 = SV.tl; ensureTrade();
      return {gained, mig1, coinsCleared, twice: SV.tl === tl1};
    });
    check('Eski coin bakiyesi TL\'ye çevriliyor', r6.gained > 2000 && r6.mig1 && r6.coinsCleared, {gained: Math.round(r6.gained)});
    check('Göç yalnızca bir kez çalışıyor', r6.twice);

    check('Sayfa hatası yok', errors.length === 0, errors.slice(0, 3));
  } finally {
    await browser.close();
  }
  console.log('Trade v1 testleri tamam');
})().catch(e => { console.error(e); process.exit(1) });
