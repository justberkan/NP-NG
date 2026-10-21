'use strict';
/* Korkunçlu v1 (2026-10-21): mod adı, starttrack harita değil silah eklentisi, lego zemin ofseti. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const baseURL = process.env.TEST_URL || 'http://127.0.0.1:3000';
const fs = require('node:fs'), path = require('node:path');
fs.mkdirSync(path.resolve('test-results'), {recursive: true});

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
    await page.waitForFunction(() => typeof buildWeapon === 'function' && typeof shList === 'function' && typeof icAssets === 'function');

    /* 1) Mod adı: Inlı Cinlı yok, Korkunçlu var */
    const src = await page.evaluate(async () => {
      const html = await fetch('index.html').then(r => r.text());
      const horror = await fetch('js/horror.js').then(r => r.text());
      return {hasInli: /Inlı Cinlı|INLI CINLI/.test(html + horror), hasKorkunclu: /Korkunçlu/.test(html + horror),
              icmaps: (typeof ICMAPS !== 'undefined') ? ICMAPS.join(',') : 'yok'};
    });
    check('İsim: "Inlı Cinlı" kaldırıldı', !src.hasInli);
    check('İsim: "Korkunçlu" geçiyor', src.hasKorkunclu);
    check('starttrack harita listesinde yok', src.icmaps === 'backrooms,lego', {icmaps: src.icmaps});

    /* 2) StartTrack eklentisi: sayaç mantığı + kalıcılık */
    const r1 = await page.evaluate(() => {
      if (!SV.own.includes('st1')) SV.own.push('st1');
      SV.eq.st = null; SV.stk = {};
      stkKill('rifle');                       /* takılı değil: saymaz */
      const offCount = Object.keys(SV.stk).length;
      SV.eq.st = 'st1';
      stkKill('rifle'); stkKill('rifle'); stkKill('smg');
      const on = {rifle: SV.stk.rifle, smg: SV.stk.smg};
      /* çevrimdışı kuralı gereği yerel kayıt yok; kalıcılık sunucuya giden SV yükünde olduğu için öyle doğrula */
      save(); offSettle();
      const persisted = JSON.parse(JSON.stringify(SV)).stk || {};
      return {offCount, on, persisted};
    });
    check('Sayaç takılı değilken saymıyor', r1.offCount === 0);
    check('Sayaç takılıyken slot başına sayıyor', r1.on.rifle === 2 && r1.on.smg === 1, r1.on);
    check('Sayaç kayıtta kalıcı', r1.persisted.rifle === 2 && r1.persisted.smg === 1, r1.persisted);

    /* 3) Mağaza: Eklentiler sekmesinde st1, kuşan/sök */
    const r2 = await page.evaluate(() => {
      SH.tab = 'e';
      const L = shList();
      const it = L.find(x => x.id === 'st1');
      const tabOk = !!it && SH_TABS.some(t => t[0] === 'e');
      SV.eq.st = null;
      shEquip(it); const on = SV.eq.st === 'st1';
      shEquip(it); const off = SV.eq.st === null;
      SH.tab = 'w';
      return {tabOk, on, off};
    });
    check('Mağazada "Eklentiler" sekmesi ve st1 var', r2.tabOk);
    check('Eklenti tak/sök çalışıyor', r2.on && r2.off);

    /* 4) Viewmodel: takılınca sayaç görünür, sayı değişince ekran yenilenir */
    const r3 = await page.evaluate(() => {
      SV.eq.st = null;
      const W0 = buildWeapon('rifle', SKIN('g0'), null, true);
      const noStk = !W0.stk;
      SV.eq.st = 'st1';
      const W1 = buildWeapon('rifle', SKIN('g0'), null, true);
      const hasStk = !!(W1.stk && W1.stk.userData.slot === 'rifle');
      const before = SV.stk.rifle || 0;
      const oldCw = cw; cw = W1;
      stkKill('rifle');
      cw = oldCw;
      const bumped = SV.stk.rifle === before + 1;
      let redrawOk = true;
      try { W1.stk.userData.redraw() } catch (e) { redrawOk = false }
      SV.eq.st = null;
      return {noStk, hasStk, bumped, redrawOk};
    });
    check('Sayaç sökülüyken viewmodelde yok', r3.noStk);
    check('Sayaç takılıyken viewmodelde var (slot=rifle)', r3.hasStk);
    check('Kill anında sayaç artıyor ve ekran güncelleniyor', r3.bumped && r3.redrawOk);

    /* 5) Lego harita: zemin ofseti nav hücrelerinde y≈0 */
    const r4 = await page.evaluate(async () => {
      IC.mapName = 'lego';
      await icAssets(true);
      const g = IC.loaded.map.clone(true);
      g.scale.set(IC_SX, IC_SY, IC_SX);
      g.position.y = -(IC.floorY || 0);
      const sc2 = new THREE.Scene();
      sc2.add(g); sc2.updateMatrixWorld(true);
      /* oyunla aynı kural: gökyüzü kutusu atlanır, yukarı bakan en alçak vuruş zemin */
      const rc = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), n = new THREE.Vector3(), ys = [];
      for (const c of IC.nav.slice(0, 80)) {
        rc.set(new THREE.Vector3(c[0], 1200, c[1]), down);
        let best = null;
        for (const h of rc.intersectObject(g, true)) {
          if (!h.face) continue;
          let sky = false, o = h.object;
          while (o) { if (o.name && /sky/i.test(o.name)) { sky = true; break } o = o.parent }
          if (sky) continue;
          n.copy(h.face.normal).transformDirection(h.object.matrixWorld);
          if (n.y < .7) continue;
          const y = h.point.y;
          if (best === null || y < best) best = y;
        }
        if (best !== null) ys.push(best);
      }
      ys.sort((a, b) => a - b);
      const med = ys.length ? ys[Math.floor(ys.length / 2)] : null;
      return {floorY: IC.floorY, n: ys.length, med};
    });
    check('Lego zemin ofseti hesaplandı', typeof r4.floorY === 'number' && isFinite(r4.floorY), {floorY: r4.floorY});
    check('Lego zemin nav hücrelerinde y≈0 (map altı boşluk yok)', r4.n > 20 && Math.abs(r4.med) < .5, r4);

    /* 6) Backrooms: ofset ≈0, davranış değişmedi */
    const r5 = await page.evaluate(async () => {
      IC.mapName = 'backrooms';
      await icAssets(true);
      return {floorY: IC.floorY};
    });
    console.log('BİLGİ backrooms floorY =', JSON.stringify(r5));
    check('Backrooms ofseti ≈0 (eski davranış korundu)', Math.abs(r5.floorY) < .5, r5);

    check('Sayfa hatası yok', errors.length === 0, errors.slice(0, 3));
  } finally {
    await browser.close();
  }
  console.log('Korkunçlu v1 testleri tamam');
})().catch(e => { console.error(e); process.exit(1) });
