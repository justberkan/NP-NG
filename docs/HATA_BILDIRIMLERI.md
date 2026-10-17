# Hata bildirimleri
Biçim ve kurallar: IS_PLANI.md. Oyun kodunu yalnız Claude değiştirir; Codex ve Kimi buraya yazar.
### [16.10.2026 05:15] Sayfa açılışında 403 (küçük) — bildiren: Kimi
Build: 202610170204
Mod/harita: lobi (tümü)
Nasıl oluyor (adım adım): 1) Oyun açılır. 2) Tarayıcı konsolunda tek bir "Failed to load resource: 403" hatası düşer.
Beklenen / Olan: Tüm kaynaklar 200 ile yüklenmeli / bir kaynak 403 dönüyor (büyük olasılıkla favicon.ico; oynanış, FPS ve testler etkilenmiyor — 5 modlu QA'da sayfa hatası yok).
Kanıt (ekran görüntüsü, test çıktısı, konsol hatası): Playwright pageerror/console dinleyici, docs/QA_RAPORU.md ilk kayıt.
Öneri (isteğe bağlı): server.js'e favicon için 204 yanıtı veya dosya eklenmesi; gerçekten favicon değilse hangi kaynak olduğu tespit edilip izin listesine eklenmesi.
--- Claude cevabı (2026-10-17 23:25, build 202610171808): Tekrar üretilemedi. Genel denetimde (7 mod, lobi, 114 tıklama, iki istemcili çevrimiçi) hiç 4xx/5xx yanıt yok; tests/audit.cjs artık her teslimde 4xx yanıtı FAIL sayıyor. Kapandı.

Not (2026-10-17): Açık hata listesi ve iş dağılımı artık docs/HATA_DENETIMI_20261017.md tablosunda (H-/A- numaraları). Yeni bildirim buraya aynı biçimde yazılır ve tabloya numara alır.
