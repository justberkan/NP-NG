# Launcher 0.3.0 test raporu

21.10.2026 · CODEX-EXE-1 · son doğrulama tabanı main 2b0f714.

- Kök npm test: exit 0; tüm kontroller PASS. Audit, offline-save, casino-rtp, casino-dede ve glide-sprint dahil.
- Electron npm test: 12/12 PASS, sıfır skip.
- Paketlenmiş EXE: 13/13 PASS. Sunucu 3400 üzerinde eşitleme sonrası kapatıldı; oyun oturumunun ağı engellendi. Lobi, Aim, Açık Dünya, DEDE aynı-köken iframe, seed ayrımı, sandbox ve VSync yeniden başlatma doğrulandı.
- Sayfa hatası 0; beklenmeyen başarısız istek 0.
- NSIS build: exit 0. Kurulum sihirbazını sisteme kurma/kaldırma testi yapılmadı; dağıtım içindeki paketlenmiş NPNG.exe test edildi.

## Kurulum

electron/dist/NPNG-Kurulum-0.3.0-x64.exe

Boyut: 111130798 bayt. SHA-256: 37910ad10c2c8319f63557d231c38850a071bd160301f4f139db51c7a190b549

## Kanıtlar

Tam çıktılar: ../test-results/v030/npm-test-root.txt, npm-test-electron.txt, packaged.txt, http.txt, build.txt. Sonuçlar: packaged.json ve installer.json. Ekranlar aynı klasörde.

## Önceki denemelerdeki sonuçlar

- Son tekrar sırasında mevcut yerel sunucu başlatma testi bir kez 3 saniyelik sınır içinde yanıt alamadı. Logda hata yoktu; değiştirilmeden tek başına ve tam Electron grubunda tekrarlandı, ikisi de PASS. Zaman sınırı artırılmadı; geçici başlatma başarısızlığının kök nedeni kesinleşmedi.
- İlk tabanda DEDE yoktu; main rebase sonrası test tekrarlandı ve geçti.
- Testin doğrudan Page.close çağrısı native pencere close olayını atlıyordu; gerçek BrowserWindow.close ile doğal kapatma test edildi.
- Açık Dünya sınıf seçimi tamamlanmadan lobiye dönen test düzeltildi; oyun kodu değişmedi.
- EXE çalışırken paketleme dosya kilidine takıldı; test kapandıktan sonra temiz paketleme başarıyla tekrarlandı.

## Değişen kaynaklar

- electron/launcher/index.html
- electron/launcher/launcher.js
- electron/main.cjs
- electron/offline.cjs
- electron/package-lock.json
- electron/package.json
- electron/policy.cjs
- electron/preload.cjs
- electron/services.cjs
- electron/tests/offline-packaged.cjs
- electron/tests/offline.cjs
- electron/tests/policy.cjs
- electron/tests/services.cjs
- server.js
- tests/http.cjs
- electron/DEVIR_LAUNCHER_030.md
- electron/TEST_RAPORU_030.md
- test-results/v030/ (tam çıktılar ve ekran görüntüleri)

Kapsam dışı oyun dosyaları ve ortak günlükler değiştirilmedi. VSync yalnız A–D kabul testi geçtikten sonra eklendi. Canlı klasöre yazılmadı.
