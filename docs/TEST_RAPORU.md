# 16 Ekim 2026 — Codex teknik doğrulama

Makine: Berkan'ın Windows bilgisayarı. Tarayıcı: kurulu Google Chrome, başsız test.
Build: `202610170101 · hareket-test-v1`.

## Yapılan düzeltmeler

- Odak kaybında `sPress`, `qPress`, `jBuf` da temizlenir. Önceki sürümde kayma/kanca/tamponlanmış zıplama geri dönüşte tetiklenebilirdi.
- Sabit adım birikiminde 144 Hz yuvarlama hatası giderildi; aynı iki saniyelik koşu tüm test FPS değerlerinde aynı mesafeyi verdi.
- HTTP sunucusu `.git`, `.env`, yedek, test, not ve hesap dosyalarını sunmaz. Bozuk URL yüzde kodlaması artık süreci kapatmaz. GET/HEAD dışındaki yöntemler 405 alır.

## Ölçümler

| Kontrol | Sonuç |
|---|---|
| Hareket kontrolleri | 17/17 geçti |
| HTTP testleri | 5/5 geçti |
| HTTP dosyalarının yerel içerikle eşleşmesi | 42/42 |
| JS sözdizimi | 132/132 |
| Koşu | 5.25 m/s |
| Karşı yönle sıfır hızdan geçiş | 0.05833 sn |
| Tek zıplama yüksekliği | 1.24722 m |
| Zıplama anı yatay hız sınırı | 11.5 m/s |
| Hava strafe sınırı | 13.5 m/s |
| Eğilerek hareket | 2.625 m/s |
| 3 m kutuya tırmanıp basma | 1.04167 sn |
| Yan duvarda koşu | 0.8 sn test boyunca; son hız 7.4219 m/s |
| Tarayıcı çalışma hatası / yükleme hatası | 0 / 0 |

Komut: `npm test`. Testlerde gerçek `tick`, `stepPlayer`, çarpışma ve UI kodu çalıştırılır. Hareket sahnesinin başlangıç durumu test tarafından sıfırlanır; otomatik render döngüsü durdurularak zaman adımı kontrollü uygulanır. Açılış testi normal render döngüsünü çalıştırır.

## Sınırlar ve kalanlar

- Hareket hissi, gerçek cihaz/fare ve görsel kalite için Berkan'ın kontrolü bekleniyor.
- Ekran görüntüsü Aim Training'in açıldığını gösterir; el tutuşunun doğru olduğunu kanıtlamaz.
- Aim Training'de loadout hâlâ açılıyor; ayrı düzeltme sırasına alındı.
- İnternet üzerinden iki gerçek cihazla maç ve gecikme telafisi henüz test edilmedi.
- Claude incelemesi yapılmadı; sonuçlar Claude'un onayı olarak sunulmamalı.

Kanıtlar: `docs/evidence/` altındaki JSON raporları ve ekran görüntüleri. Daha yeni çalıştırmalar yerel `test-results/` altındadır.

## 17.10.2026 — Codex Launcher 0.2.0
Paketlenmis EXE ve oyun regresyon testleri PASS. 7 servis/politika testi; 8 paketli launcher kontrol grubu; 7 paketli smoke grubu; oyun tests/run.cjs PASS (5 HTTP, 17 hareket, 48 dosya/139 JS, atmosfer). Ayrinti: electron/TEST_RAPORU_020.md. FPS artisi kanitlanmadi; gercek monitor ve temiz cihaz kurulumu kabul bekliyor.

## 17.10.2026 — ANIMASYON-001
Build 202610171306 animasyon-v1, taban bp-v2 korunarak ayri kopyada. 4 FPS, 32 model/yon/hiz, iki yon duvar/avuc, 80/80 fizik-pozu, Arena ve OW WebSocket bayraklari, cift tabanca geri donusu PASS. Yamanin tests/run.cjs sonucu PASS; 49 HTTP dosyasi ve 140 JS. git apply --check PASS. Masaustu/ANİMASYON YAMASI ve ZIP teslimi; detay ve kapsam sinirlari CLAUDE-OKU.md'de. Ana oyun dosyalarina uygulanmadi.

## 17.10.2026 — Build 202610171402 hareket-bomba-v1 / Codex
Karakter kaldırma/eski kayıt/BP 40 kart-premium-claim-mobil PASS (docs/codex-bp-v3/TEST-SONUCU.json). Üç harita bomba bölgeleri/yol/kat, alan hasarı/FX/çift patlama, FP kilidi, 3 hareket pozu ve Arena/OW ağ bayrakları PASS (docs/codex-oynanis/TEST-SONUCU.json). Regresyon: docs/codex-oynanis/regresyon-log.txt. Devir: docs/CODEX_DEVIR_20261017.md.
