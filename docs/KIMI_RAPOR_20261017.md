# Kimi Raporu — 2026-10-17 (build 202610171801 · yaris-xh-v1)

> Bu rapor masaüstündeki GERÇEK oyun klasöründe (`C:\Users\berkan\Desktop\mmofps-online`) yapılan işlerin özetidir.
> Not: repo (main) şu an build **202610171405** (koridor-v1) tabanında; masaüstü oyun **202610171801**'de. Kod senkronu için bu rapordaki dosya listesi + `NOTLAR.md` kayıtları esas alınmalı. Kod dosyalarını bu rapordan değil, Berkan'ın masaüstü klasöründen alın (ya da Berkan'dan "senkron" talep edin).

## 1. Yapılan işler

### 1a. Yarış modu OYUNA UYGULANDI (build 202610171800 · yaris-v1)
- Kara + hava yarışı (uçaklar daire/bina aralığından geçer), 7 yol itemi / 3 slot (mayın, hız, enerji topu, güdümlü ışın topu, kalkan, onarım), AI rakipler, araç seçim ekranı (hız/HP/yol tutuşu/kullanım zorluğu istatistikleri).
- Araç modundayken fare kilidi istenmiyor: `requestGamePointerLock` içine `if(mode==='race')return;` (mevcut 1417 mimarisiyle birleştirildi).
- Yeni dosyalar: `js/race.js`, `js/racemodels.js`, `assets/race/*.glb` (9 hazır GLB araç; Mirage 2000 dahil, mig-21 bozuk olduğu için ELENDİ).
- Değişen: `js/main.js`, `js/combat.js`, `js/controls.js`, `js/sensitivity.js`, `index.html` (?v= + build 1800).
- Doğrulama: headless yarış testi PASS (0 konsol hatası) + `node tests/run.cjs` 5/0 GERÇEK OYUNDA.

### 1b. Nişangah RENGİ mağazadan kaldırıldı, ayarlara taşındı (build 202610171801 · yaris-xh-v1)
- `js/shop.js`: `SH_TABS`'tan `['x','Artı rengi']` sekmesi kaldırıldı → yeni satın alım yok. Mevcut XH sahipliği/kuşanma kodu DOKUNULMADI (sahiplik korunur).
- `js/views.js`: Ayarlar → Nişangah sekmesine 5 hazır renk swatch'ı (beyaz #ffffff, camgöbeği #28e0ff, yeşil #4dff6a, pembe #ff5ad0, sarı #ffe14d — mağazadaki aynı renkler, artık ücretsiz) + mevcut serbest renk seçici + "Varsayılan (beyaz)" sıfırlama düğmesi. Swatch tıklaması `SET.xhColor`'ı anında uygular (`saveSet` + `applyCrosshair`).
- Değişen: `js/shop.js`, `js/views.js`, `index.html` (tüm ?v= + build etiketi 1801).
- Doğrulama (headless, GERÇEK OYUN): 5 swatch render, tıklama → `SET.xhColor='#28e0ff'`, mağazada "Artı" sekmesi yok, 0 konsol hatası → PASS. `tests/run.cjs` http 5/0 PASS.

### 1c. Animasyon iyileştirme planı (kod henüz DEĞİŞMEDİ)
- `docs/ANİMASYON_IYILESTIRME_PLANI.md`: 6 aşamalı plan — ölçüm altyapısı, genel yumuşaklık (hız sınırlı yaklaşım + durum blend'leri), ayak teması (stride tabanlı adım, kayma=0 hedefi, CS tarzı counter-strafe pozu), zıplama/iniş karuseli, Titanfall 2 tarzı duvar koşusu, cila+final test.
- Doğrulanmış mimari: `js/main.js` FIX_DT=1/120 sabit fizik + kamera ara-kare yumuşatma; `js/anim-contact.js` tek alt-gövde otoritesi (görünüm katmanı, fizik değiştirmez); `js/rig.js` `animHuman(h,c,dt)` prosedürel iskelet.
- Kural: fizik/hız/hasar/isabet kutusu hiçbir aşamada değişmeyecek; her aşama ayrı build + test + Berkan onayı.

## 2. Bilinen açık konular
- **Counter-strafe FAIL (önceden var):** `tests/movement.cjs` "Karşı tuşla duruş 100 ms altında" → ölçülen 0.25 sn. `js/player.js` bu yamalarda hiç değişmedi (son değişiklik 2026-10-17 10:46); sürtünme ayarıyla ilgili mevcut bir durum. Claude'nun listesine girebilir.
- **tests/run.cjs ek betikleri:** `movement.cjs` / `smoke.cjs` / `lobby-atmosphere.cjs` doğrudan `node tests/run.cjs` ile koşulunca `playwright` modülü bulunamıyor (playwright `electron/node_modules` altında; NODE_PATH ile koşulunca çalışıyor). run.cjs'e NODE_PATH eklenmesi veya kök node_modules'e link önerilir.
- Oyunu/sa sunucuyu görmek için yeniden başlatmak gerekir.

## 3. NOTLAR.md kayıtları
Yerel `NOTLAR.md`'nin son iki satırı bu işlerin kaydıdır (`202610171800 yaris-v1` ve `202610171801 yaris-xh-v1`).

— Kimi (fiziksel test + yama uygulama sorumlusu)
