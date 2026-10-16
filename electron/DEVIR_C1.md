# C1 — Codex çalışma kaydı

Sorumlu: Codex. İş planı: `../IS_PLANI.md`. Durum: **C1 OTOMATİK TEST GEÇTİ / BERKAN FPS KABULÜ BEKLİYOR**. Oyun kodu Claude'a aittir; istemci kaynakları ve çıktıları yalnız `electron/` altında hazırlandı. Ortak NOTLAR.md günlüğüne teslim satırı eklenir.

## Kapsam

- Yerel sunucu / internet adresi seçimi; başarısız bağlantıda yeniden deneme.
- Tam ekran, fare kilidi ve oyun tuşlarını koruyan kısayol politikası.
- Hazır olmadan önce beş zorunlu performans anahtarı.
- Oyun içeriğinde Node/preload kapalı, sandbox ve contextIsolation açık.
- Windows x64 NSIS kurulum dosyası; üretim paketinde yalnız Electron kabuğu.

## Kabul

Otomatik: adres ve kısayol testleri; geliştirme ve paketlenmiş uygulamada lobi/maç/tam ekran/fare kilidi; hata ekranı ve geri dönüş; performans anahtarlarının ana süreçte bulunduğunun kontrolü.

İnsan: Berkan'ın gerçek ekranda Limitsiz ayarında monitör hızını aşan FPS ve akıcılık değerlendirmesi. Sayısal rAF gözlemi tek başına donanım kabul testi sayılmaz.

## Gerçek teslim / 16 Ekim 2026

- İstemci: v0.1.0, Electron 44.7.2, electron-builder 26.15.3; bağımlılıklar `package-lock.json` ile sabit.
- Kurulum: `dist/NPNG-Kurulum-0.1.0-x64.exe`, **111,121,046 byte**. SHA256: `76b3e7a3ec6840a3b390bee40ef799b235c580097c97b60e0e1c4b8665c47bf9`. Dijital imza yok; `dist/SHA256SUMS.txt` sağlandı.
- `node --test tests/policy.cjs`: **4/4 PASS** (adres/şema, kaynak yönlendirmesi, kısayollar, beş anahtar).
- `node tests/smoke.cjs`: **PASS** geliştirme EXE'sinde gerçek pencerelerle.
- `NPNG_EXE=<dist/win-unpacked/NPNG.exe> node tests/smoke.cjs`: **PASS** paketlenmiş gerçek EXE'de. Bağlantı hatasından dönme, lobi, maç, pointer lock, tam ekran, pencere açma engeli, sandbox/Node izolasyonu, F5 yenileme ve Ctrl+W ile sunucu seçimine dönüş doğrulandı.
- `test-results/report-packaged.json`: `gameErrors: []`, GPU compositing `enabled`, Electron sürümü 44.7.2. FPS/Hz üstünlüğü otomatik olarak tamamlandı sayılmadı.
- Paket içeriği `test-results/package-contents.json` ile kontrol edildi: yalnız istemci dosyaları. Oyun, modeller, hesaplar ve geliştirme node_modules paketlenmedi.
- Ekran görüntüleri: `test-results/launcher-packaged.png`, `test-results/match-packaged.png`. İki test raporu ve ayrıntılı günlükler aynı klasörde.
- Teslimde mevcut oyun etiketi: `202610170204 · anitkabir-lobi-v1+fps-v3`. Oyun kodu değiştirilmedi. Başlangıçta salt okunur hash'i alınan 139 dosyadan `js/glbrig.js`, `js/rig.js`, `index.html` paralel çalışma sırasında değişti; Codex bu dosyalara yazmadı. Sonuç: `test-results/game-files-check.json`.
- İlk otomasyon denemesinde F5'i CDP klavyesinden gönderme ve kapanan pencereyi beklememe test sorunları çıktı. Test Electron `sendInputEvent` yolunu ve pencere kapanış olayını kullanacak şekilde düzeltildi; uygulama davranışı değiştirilmedi. Ardından iki EXE testi de geçti.
- Motor indirmesi yavaş ağda yarıda kaldı; resmi GitHub dosyası devam ettirilip Electron paketindeki sabit SHA256 ile doğrulandı. Tekrar gerekirse `tools/fetch-electron.cjs` aynı kontrolü yapar. TLS/sertifika kontrolü kapatılmadı.

Kurulum dosyası oluşturuldu; Windows kurulumunu kullanıcının sistemine otomatik yüklemedim. Paketlenmiş NPNG.exe doğrudan açılarak sınandı. Yerel sunucu çalışır durumda olmalıdır; gerçek bir internet oyun linki bu teslimde sağlanmadığı için internet üzerindeki bir oyun sunucusuna uçtan uca bağlantı ayrıca ölçülmedi.

## Sonraki sıra

C1 insan kabulünden sonra C2 depo eşitleme ve C3 performans/bozuk test işleri. Oyunda bulunan hatalar `../docs/HATA_BILDIRIMLERI.md` üzerinden Claude'a bildirilir; oyun dosyaları düzeltilmez.
