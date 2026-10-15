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

---

# 16 Ekim 2026 — Kimi bağımsız doğrulama ve kod incelemesi (R001)

Dal: `kimi/R001-movement-review` · taban commit: `6d19597` · teslim commit: bu belge

## Bağımsız test yeniden koşumu

Repoyu sıfırdan klonladım (`codex/baseline-movement`), `npm ci` ile kurdum, kurulu Google Chrome ile `npm test` koştum. Playwright'ın kendi Chromium indirmesi gerekmedi; makinedeki Chrome kullanıldı.

| Kontrol | Codex raporu | Kimi yeniden koşumu |
|---|---|---|
| Hareket kontrolleri | 17/17 | 17/17 PASS |
| HTTP testleri | 5/5 | 5/5 (çıkış kodu 0) |
| Açılış / dosya eşleşmesi / sözdizimi | 42/42, 132/132 | PASS (42 dosya, 132 JS) |
| Koşu / tırmanma / duvar koşusu | 5.25 m/s · 1.04167 sn · 7.4219 m/s | Aynı değerler, satır satır eşleşti |

`tests/run.cjs` üç paketi de koşar (http `node --test`, movement, smoke); çıkış kodu 0 = üçü de geçti. Çıktı örnekleri: koşu 5.25 m/s, 30–240 FPS farkı 0.1 mm altında, zıplama anı sınırı 11.5, hava strafe 13.5, tırmanma 1.04167 sn, duvar koşusu son hız 7.4219 m/s. Codex raporundaki tüm ölçümlerle birebir aynı.

## Kod incelemesi (71c7ee3..6d19597 oyun kodu farkı)

- `js/main.js` `releaseInputs`: `sPress`, `qPress`, `jBuf` temizliği eklendi. Değişkenler `player.js:9`'da `let` ile tanımlı ve `index.html` script sırasında `player.js` her zaman `main.js`'ten önce yüklendiği için tanım hatası yok. Değişiklik doğru ve gerekiyordu (blur sonrası kayma/kanca tetiklenme riski kapanıyor). ✓
- `js/main.js` sabit adım döngüsü: `accP+1e-10>=FIX_DT` ve `accP=Math.max(0,accP-FIX_DT)`. Epsilon, `FIX_DT`'nin (≈0.00833) çok altında; yanlış ekstra adım üretmez, 144 Hz birikim kaymasını giderir. `nSub<8` üst sınırı korunmuş. ✓
- `server.js`: yalnız `/index.html`, `/assets/`, `/js/`, `/css/`, `/lib/` sunumu; nokta dizinleri, `\0:`, geçersiz yüzde kodlaması (400), GET/HEAD dışı (405), sembolik bağ gerçek yol denetimi (403). `nosniff` eklendi. `/api/info` allowlist'den önce kontrol ediliyor, kırılmıyor. HEAD için gövde Node tarafından bastırılıyor. ✓
- `index.html`: build `202610170100 → 202610170101`, tüm `?v=` değerleri ve köşe etiketi tutarlı artırılmış, geriye düşüş yok. ✓

## Bulgular (engel değil)

1. **Yükleme anı kenar durumu:** kullanıcı sayfa yüklenirken pencereden çıkarsa `releaseInputs` `player.js`'teki `let` değişkenlerine erişip kısa ReferenceError verebilir. Olasılık çok düşük, işlevsellik etkilenmez; ileride `typeof` korumasıyla kapatılabilir.
2. `fs.realpathSync(ROOT)` her istekte çağrılıyor; tek oyunculu yerel sunucuda önemsiz, not düşüldü.

## Sonuç

Codex'in T001–T003 teslimi bağımsız doğrulamadan **geçti**. Claude'un karşılıklı incelemesi hâlâ açık (kural 5 gereği bu rapor onun yerine geçmez). H001 (Berkan'ın gerçek cihaz/his testi) için teknik taban sağlam.

## Kayıt (devir sözleşmesi formatı)

- Görev ID: T003 incelemesi / R001
- Teslim eden / teslim alan: Kimi → depo (Codex ve Claude okuyacak)
- Durum / tarih-saat: KARSILIKLI_INCELEME (Kimi) · 16.10.2026 ~01:55 Europe/Istanbul
- Dal / taban / teslim commit / PR: `kimi/R001-movement-review` / `6d19597` / bakınız PR
- Build: `202610170101 · hareket-test-v1` (değişmedi; dokümantasyon teslimi)
- Değişen dosyalar: yalnız `docs/TEST_RAPORU.md`, `DEVIR_NOTLARI.md`
- Test komutları ve gerçek sonuçlar: `npm test` → 17/17 hareket, 5/5 HTTP, 42/42 açılış, çıkış 0
- İnsan testi gerekiyor mu: evet, H001 hareket hissi (Berkan)
- Sıradaki tek görev: H001 (Berkan) ve T004 (Claude, silah hissi)
