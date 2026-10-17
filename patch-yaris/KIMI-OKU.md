# YARIS YAMASI (Kimi) — Claude'a Talimat

Bu paket Berkan'ın istediği **Yarış modunu** içerir: kara yarışı (Blur tarzı, 3 item slotu,
mayın / enerji topu / hızlanma / güdümlü enerji topu (3 şarj) / ışın topu / kalkan / onarım),
hava yarışı (uçaklarla halka parkuru, şehir üstü), araç seçim ekranı (hız / HP / yol tutuşu /
kullanım zorluğu istatistikleri, 3B önizleme), "özellik var / yok" seçeneği ve yapay zekâ rakipler.

## Uygulama

- **Taban:** build `202610171404` (cati-rekabetci-v3). Yamayı uygulamadan önce çalışma ağacının
  bu build olduğundan emin ol. `TABAN-SHA256.json` içindeki 466 dosya hash'iyle doğrulayabilirsin.
- Yamayı uygula (oyun klasörünün içinde):
  ```
  git apply --check YARIS-YAMASI.patch
  git apply YARIS-YAMASI.patch
  ```
  (git yoksa herhangi bir patch aracı da olur; patch göreli yollu, klasör kökünden uygulanır.)
- **server.js DEĞİŞMEDİ.** Mevcut sunucunla çalışır, sunucuyu güncellemene gerek yok.
- `index.html`'deki build numarasını (`202610171500`) kendi sıradaki build numaranla değiştir,
  `?v=` değerlerini buna göre ayarla.
- js/race.js ve js/racemodels.js yeni dosyalardır; patch addition olarak ekler.
- Patch, temiz 1404 tabanında `git apply --check` + uygulama + sözdizimi denetimiyle doğrulandı.

## Değişen / eklenen dosyalar (MANIFEST.json'da da var)

Yeni: `js/race.js`, `js/racemodels.js`
Değişen: `index.html`, `js/controls.js` (5 yeni eylem: raceFire=F, raceBack=Q, raceDrop=G,
raceDrift=Space, raceBoost=ShiftLeft; slotlar Digit1-3), `js/main.js` (küçük kancalar:
pointerlock, startMatch/toLobby/ESC, sabit adımda raceStep, kamera, lobi önizleme — hepsi
`mode==='race'` koşullu, mevcut davranışlara dokunmaz), `js/combat.js` (setupMode/finish dalları)

## Test durumu (1404 tabanında, bu paketle birebir)

- Headless doğrulama (oyun gerçekten başlatılıp oynandı): fizik, duvar kilidi, pickup,
  tüm itemler, enkaz+doğuş, AI, sıralama, bitiş ekranı, lobiye temiz dönüş, halka geçişi,
  bina çarpması, itemsiz mod, seçim ekranı kartları + 3B önizleme, canlı uçak uçuşu —
  **PASS, sayfa hatası 0**. Çıktılar: `TEST-SONUCU.json` + `race-*.png`.
- `node tests/run.cjs` → **pass 5 / fail 0** (güncel test dosyalarıyla).
- Hemen denemek istersen: `OYUN-DENEME\1-SUNUCU-BASLAT.bat` → `..\OYUNU-AC.url` (port 3016).

## Bilinen sınırlar (dürüst liste)

- Pist kenarında araç duvara ters bakarken kamera pist dışına taşabiliyor (zararsız).
- Havada koca halkaya çok yaklaşınca halka bir an ekranı kaplıyor.
- Dokunmatik destek minimal (sol joystick = gaz/direksiyon, sağ tuş = item).
- Motor sesi basit osilatörlü; minimap/yön oku yok; uçakta ok göstergesi yok.
- Bu yama goblin/karakter animasyon sistemiyle ilgilenmez; animasyon yaması ayrı.

— Kimi (202610171500 · yaris-v1)
