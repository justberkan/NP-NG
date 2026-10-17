# İŞLEM GÜNLÜĞÜ — N.P.N.G
Her AI (Claude, Codex, Kimi, ChatGPT) oyun klasöründe bir şey değiştirdiğinde bu dosyanın EN ALTINA tek kayıt ekler. Eski kayıtlar silinmez/değiştirilmez.

Biçim (saat Türkiye saati, 24 saat):
```
### 2026-10-17 14:05 · Ajan · build 2026101714xx etiket
- İşlem: ne yapıldı, kim istedi
- Eklendi: ... (yoksa "yok")
- Değişti: ...
- Çıkarıldı: ... (silinen dosya/özellik/karakter; yoksa "yok")
- Dosyalar: js/x.js, css/style.css ...
- Test: ne çalıştırıldı, sonuç (PASS/FAIL), test edilemeyenler
- Yedek: _yedek/... (varsa)
```
Not: 2026-10-17 07:00 öncesi kayıtlar dosya değişiklik saatlerinden ve NOTLAR.md'den geriye dönük çıkarıldı; "~" işaretli saatler yaklaşıktır.

---

### 2026-10-17 ~01:30 · Claude · build 202610171300 rekabetci-v1
- İşlem: ChatGPT rekabetçi paketi oyuna eklendi (Berkan isteği).
- Eklendi: js/compet.js (5v5 bombalı raunt, botlarla), mod kartı, satın alma menüsü (B), rütbe ekranı.
- Değişti: main.js, combat.js, maps.js, index.html, style.css
- Çıkarıldı: yok
- Test: raunt sonu, bomba kur/çöz, devre arası, maç sonu ödülü PASS

### 2026-10-17 01:56 · Claude · build 202610171301 nisan-v1
- İşlem: Nişan alınca ana artı kaybolmuyordu, silah sallanıyordu (Berkan bildirimi).
- Değişti: player.js (sağ tıkta ana artı tamamen gizli), weapons.js (nişanda salınım %95 az)
- Çıkarıldı: nişandaki ikinci nişangah
- Ek: GitHub justberkan/NP-NG main'e tam oyun yedeği gönderildi; IS_PLANI'ye GitHub kuralı yazıldı.

### 2026-10-17 02:26 · Claude · build 202610171302 holo-lobi-v1
- İşlem: Holosight XPS ters duruyordu; ChatGPT lobi karakter alanı yaması.
- Eklendi: holosight camına 3B kırmızı nokta + halka
- Değişti: optics.js, lobby3d.js, ui.js, style.css
- Çıkarıldı: yok
- Test: hareket testi PASS (ilk denemede kendi hatam vardı, düzeltildi)

### 2026-10-17 02:28 · Claude · build 202610171303 kasa-v1
- İşlem: Yeni kasa tasarımları (Berkan isteği).
- Eklendi: 7 yeni kasa SVG görseli (crates.js içine gömülü)
- Değişti: kasa fiyatları x10 → 1000/2500/2000/1800/2200/1500/7000; shop.js, ui.js, style.css
- Çıkarıldı: eski kasa çizimleri (yalnız yedek olarak kodda)

### 2026-10-17 ~02:37 · Claude · build 202610171304 odul-v1
- Eklendi: Görevler sayfasında "TÜM ÖDÜLLERİ AL" (görev + battle pass tek tık)
- Değişti: views.js, ui.js
- Çıkarıldı: yok
- Test: 10 görev + 10 BP ödülü tek tıkla PASS

### 2026-10-17 02:56 · Claude · build 202610171305 bp-v2
- Değişti: Battle Pass v2 arayüzü (Berkan'ın CSS'i); ödül kuralları aynı
- Not: Claude'un dosya aktarımı bir kez eski kopya yazdı; 02:56'da düzeltildi ve doğrulandı.

### 2026-10-17 ~03:01 · Codex · ANIMASYON-001 paketi
- İşlem: Animasyon yaması ayrı kopyada hazırlandı (canlı oyun değişmedi). docs/codex-animasyon/

### 2026-10-17 ~04:00–04:20 · Codex · build 202610171402 hareket-bomba-v1
- İşlem: Berkan'ın doğrudan isteği.
- Eklendi: Battle Pass v3 (bp-v2'nin yerine), süzülme/tırmanma/kayma pozları, C4 patlama efekti ve mesafeli hasar, Dust2 A/B sabit bölgeleri
- Değişti: ui.js, style.css, core.js, weapons.js, compet.js, mp.js, owmp.js, player.js, server.js
- Çıkarıldı: Ada Wong (h8) ve Samus (h23) karakterleri + assets/ch_ada.js, ch_samus.js (yedek: _yedek/codex-bp-v3-*)
- Ayrıntı: docs/CODEX_DEVIR_20261017.md

### 2026-10-17 ~04:11–04:20 · Kimi · build 202610171400 anim-v4
- İşlem: Codex'in ANIMASYON YAMASI oyuna uygulandı.
- Eklendi: js/anim-contact.js (ayak teması IK)
- Değişti: glbrig.js, fingers.js, player.js, mp.js, owmp.js, server.js, index.html
- Çıkarıldı: yok

### 2026-10-17 ~04:49–05:05 · Codex · build 202610171404 cati-rekabetci-v3
- Eklendi: rekabetçide her raunt alım, Tab skor tablosu, Dust2 çatı kapakları
- Değişti: compet.js, optics.js (holosight çift nokta giderildi), mapcol.js
- Çıkarıldı: eski 5v5 kartları "Ölüm Maçı" olarak ayrıldı
- Ayrıntı: docs/codex-1403/DEVIR.md

### 2026-10-17 ~05:45–06:10 · Codex · build 202610171405 koridor-v1
- Eklendi: Koridor: Dalga Ağacı modu (js/wave-corridor.js, wave-corridor-game.js, server-wavecorridor.js)
- Değişti: server.js, main.js, maps.js, combat.js, player.js, style.css, index.html
- Çıkarıldı: 1404'teki Dust2 görünmez duvar/tavan ve çatı kısıtları (Berkan istemedi)
- Not: sunucu yeniden başlatılmalı. Ayrıntı: docs/codex-koridor/DEVIR.md

### 2026-10-17 ~06:51 · Kimi · yaris-v1 (YAMA HAZIR, UYGULANMADI)
- İşlem: Yarış modu yaması Masaüstü\YARIS YAMASI klasöründe; taban 1405. Claude uygulayacak.

### 2026-10-17 07:10 · Claude · günlük düzeni
- Eklendi: bu ISLEM_GUNLUGU.md dosyası ve IS_PLANI.md'ye kayıt kuralı
- Değişti: GitHub main, 1405 koridor-v1 dahil güncel hale getirildi (03:00–07:00 arası Codex/Kimi değişiklikleri)
- Çıkarıldı: GitHub'dan ch_ada.js, ch_samus.js (cihazda da silinmişti)
