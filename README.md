# N.P.N.G. — No Pain No Gain

Three.js r128 ile tarayıcı FPS oyunu. Sunucu Node.js HTTP + WebSocket kullanır; oyun çalışırken npm paketi gerekmez.

## Başlatma

Windows: `SUNUCU-BASLAT.bat` veya `node server.js`. Ardından http://localhost:3000 adresini aç.
Farklı port: `node server.js 3001`. Hesaplar varsayılan olarak `data/` altında tutulur; `MMOFPS_DATA` ile dışarı taşınabilir. Hesap dizini Git'e eklenmez.

## Test

Node.js 22+ ile:

```sh
npm ci
npx playwright install chromium
npm test
```

Testler ayrı bir portta sunucu açar, geçici hesap dizini kullanır ve sonunda kendi sunucusunu kapatır. Windows'ta kurulu Google Chrome varsa otomatik kullanılır. `CHROME_PATH` ile başka Chromium yürütülebilir dosyası seçilebilir. Raporlar ve ekran görüntüleri `test-results/` altına yazılır.

- HTTP testleri: yeni/değişen dosyalar, özel dizinlerin korunması, bozuk URL, HEAD ve yöntem sınırı.
- Hareket: gerçek tarayıcıdaki `tick` ve `stepPlayer` ile 30/60/120/144/240 FPS zamanlaması, koşu, zıplama, bhop, eğilme, kenar, tırmanma, duvarda koşma ve odak kaybı.
- Açılış: 45 istemci dosyasının HTTP içeriği, JS sözdizimi, build tutarlılığı, lobi ve Aim Training ekranı.
- Lobi atmosferi: UTC+3 takvimi, mevsim/gün-gece önizlemeleri, mobil efekt bütçesi, model hata yedeği ve kaynak temizliği.

FPS testleri aynı makinede farklı render zaman adımlarını simüle eder; fiziksel 240 Hz monitör, gerçek ağ gecikmesi veya insanın hareket hissini değerlendirmez.

## Anıtkabir lobisi

Anıtkabir ve Türk bayrağı, açık askeri hangar arkasında gösterilir. Sol alttaki **ATMOSFER** menüsünden mevsim, hava ve ışığı seçebilirsin; otomatik mod Türkiye saati UTC+3 ve aya göre çalışır. Mevsimsel efektler canlı hava tahmini değildir. Adım adım kurulum, modül API'si ve performans sınırları: [docs/LOBI_ATMOSFERI.md](docs/LOBI_ATMOSFERI.md).

## Claude / Codex devri

Önce `DEVIR_NOTLARI.md`, sonra `NOTLAR.md` ve `docs/TEST_RAPORU.md` okunmalı. Eski NOTLAR.md'deki 16–17 Ekim tarihleri doğrulanmış çalışma tarihi değildir. Build numarası eski sürümden geri gitmemesi için artırılır; güncel gerçek test tarihi raporda bulunur.

Yedekler, hesaplar, yerel test çıktıları ve gizli dosyalar depoya yüklenmez. HTTP yalnız `index.html`, `assets/`, `js/`, `css/`, `lib/` yollarını sunar. Yeni oyun varlıklarını bu herkese açık klasörlere koy.

Varlıklar mevcut yerel projeden aktarıldı. Bu depo herkese açık dağıtım için bir varlık lisansı denetimi yapıldığı anlamına gelmez; yeni modeller eklenirken kaynak ve lisans kaydı tutulmalı.
