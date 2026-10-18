# OLİMPOS ALTINI — NPNG Kumarhane Slotu (Yama Notu)

**Tarih:** 19.10.2026 · **Hazırlayan:** Kimi (KİMİ-CASINO) · **Durum:** yalnızca kontrol için.
Claude onayı olmadan oyuna EKLENMEZ (Berkan kuralı, 17.10.2026). Canlı oyun klasörüne yazılmadı.

## İçerik

| Dosya | Açıklama |
|---|---|
| `casino/index.html` | Tek dosyalık, bağımlılıksız (CDN yok) slot simülasyonu |
| `tests/casino-rtp.cjs` | Çekirdek doğrulama: `node tests/casino-rtp.cjs 1000000` |
| `tests/casino-ui.cjs` | Gerçek Chrome'da arayüz turu + ekran görüntüleri (`docs/casino/`) |
| `docs/casino/*.png` | idle / after-spins / turbo / bigwin görüntüleri |

Oyunun mevcut dosyalarına (`js/`, `index.html`, `server.js`, ...) **dokunulmadı**; entegrasyonu Claude yapacak.

## Özellikler

- 6×5 grid, **scatter-pays** (8+ eşleşme öder), sembol değer tablosu kodda (`SYM`).
- **Çarpan küreleri** (2×–500×) kazanca eklenir; **düşürme (tumble)** zinciri:
  kazanan semboller patlar, yenileri yukarıdan düşer, zincir 12 adıma kadar sürer.
- **4+ scatter = 15 bedava çevirme**: küresel çarpan birikir, 3+ scatter +5 tur.
- BIG / MEGA / EPIC / LEGENDARY kazanma katmanları + altın partikül (canvas).
- Sentez ses (WebAudio, dosyasız), turbo, otomatik oynatma (50 spin).
- Sayfanın altında görünür uyarı: **"Sanal para ile oynanır — gerçek para değeri yoktur."**

## Marka notu

"Gates of Olympus" adı, Pragmatic Play logosu/yazısı ve orijinal Zeus karakter
görseli **kullanılmaz**. Oyun kendi adını ("OLİMPOS ALTINI — NPNG Kumarhane") ve
el çizimi SVG sembollerini (mücevherler, taç, kupa, yüzük, kum saati, tapınak,
yıldırım) kullanır. Mekanik fikirler (düşen semboller, çarpan küreleri, bedava
çevirme) tür standardıdır ve korunur.

## Yapay "kıl payı kaçırma" (near-miss) ayarı

Yapay near-miss (7 taç dikerek "neredeyse" hissi) **`CONFIG.nearMiss`** ile
yönetilir ve **varsayılanı KAPALI'dır** — açma kararı Berkan'a aittir.
Doğal oyun sonuçları bu ayardan etkilenmez; kapalıyken near olasılığı loss
kategorisine devredilir (diğer olasılıklar korunur).

```js
NPNG_CASINO.config.nearMiss = true;  // açmak için (yalnız oyun sahibi kararı)
```

## Doğrulananlar (1.000.000 spin, near-miss KAPALI)

- **Tohum:** 20261019 (yeniden üretilebilir: `NPNG_CASINO.seed(20261019)`)
- **RTP:** %96.56 · kumarhane lehine (hedef %96)
- **Vuruş oranı:** %33.74 · **Bonus:** 1/405 spinde
- **Maksimum kazanç:** 1970× bahis (tavan 5000×)
- **forceWin hedef isabeti:** %92 (kategori hedefleri gerçekten ödeniyor)
- Karşılaştırma: near-miss AÇIKken RTP %94.83 (aynı tohum, 1M spin)
- Tarayıcı testi: 0 konsol hatası, spin akışı tamamlanıyor, buton kilitlenmiyor.

Tam test çıktısı PR açıklamasındadır.

## Oyuna entegrasyon (Claude yapacak)

1. `casino/index.html` olduğu gibi kalır; oyun UI'dan iframe/webview ile açılır.
2. Kumarhane açılırken para bağlantısı:

   ```js
   const c = iframe.contentWindow.NPNG_CASINO;
   c.setCredit(oyuncuParasi);                    // bakiyeyi eşitle
   c.onChange(yeniBakiye => { oyuncuParasi = yeniBakiye; kaydet(); });
   ```

3. `document`'te `npng-casino-ready` CustomEvent'i API hazır olduğunda düşer.
4. API: `getCredit/setCredit/getBet/setBet/onChange/spin/simulate/seed/unseed`,
   test için `_core` (runSpin, runBonus, cascade, evaluate, CATS, DBG, forceWin).
5. Bakiye/bahis/ses localStorage'da (`npng_casino_*`). Oyun kendi kaydını
   kullanacaksa localStorage eşitlemesi entegrasyonda kapatılmalı.

## RTP ayarı

RTP'yi belirleyen tablo `CATS` (kategori olasılıkları). Değişiklik sonrası
`node tests/casino-rtp.cjs 1000000` ile yeniden doğrula; hedef %96 ± 2.
