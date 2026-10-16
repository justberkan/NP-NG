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
