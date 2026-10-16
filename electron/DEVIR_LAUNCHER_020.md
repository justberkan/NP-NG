# Launcher 0.2.0 — Claude / Berkan devir notu

17.10.2026. Oyun dosyaları değiştirilmeden Electron alanında geliştirildi.

- Yeni oyun/ayar/sistem ekranları, karanlık altın arayüz.
- Gerçek HTTP HEAD kontrolü: yanıt süresi, zaman aşımı, HTTP hata/redirect açıklaması.
- Yerel server.js klasörü seçimi ve ELECTRON_RUN_AS_NODE ile gizli sunucu başlatma. Sunucu kullanıcı OYNA demeden otomatik başlatılmaz; başlatma ayrı düğmededir. Var olan port yanıt verirse ikinci sunucu başlatılmaz. Bu kontrol NPNG kimlik doğrulaması değildir; 3000 portunda başka bir web servisi varsa onun yanıtı da görülebilir.
- Sunucu launcher'dan bağımsız çalışır; launcher kapatılınca durdurulmaz. Yeni bir oyun veri kopyası oluşturulmaz; seçilen sunucu kendi data klasörünü kullanır.
- Tam ekran / ekran uyku engeli tercihleri diskte atomik dosya değişimiyle saklanır. Kapanan oyun uyku engelini bırakır.
- Yerel sunucu seçilen klasörün server.js dosyasını çalıştırır. Node ayrıca kurulmadan Electron çalışma zamanı kullanılır. Oyun varlıkları installer içinde değildir.
- Sistem tanısı ve kullanıcı seçimiyle JSON dışa aktarma. Kullanıcı adı/hesap, sohbet, URL veya klasör yolu rapora yazılmaz.
- Önceki güvenlik sınırları korunur: oyun penceresinde Node/preload yok, sandbox+contextIsolation açık, seçilen origin dışına gezinme engelli, popup/indirme engelli. Sesli sohbet mikrofonu ayrı izinle açılır.
- Otomatik launcher güncellemesi henüz yok. Oyunun dosyaları seçilen sunucudan gelir. Kamu dağıtımı öncesi imzalı installer, güvenilir güncelleme manifesti ve geri dönüş tasarımı ayrı aşamadır.

Performans anahtarları korunur, yeni bir FPS kazancı iddiası yoktur. getGPUFeatureStatus bilgisi sürücü/hızlandırma durumu, rAF örneği ise kısa bir ölçümdür. Gerçek ekranda aynı harita/ayar ve güç koşullarında karşılaştırmalı FPS + kare süreleri Berkan kabulünde kontrol edilmeli.

Kaynaklar:
- https://www.electronjs.org/docs/latest/api/structures/gpu-feature-status/
- https://github.com/electron/electron/blob/main/docs/api/power-save-blocker.md
- https://github.com/electron/electron/blob/main/docs/api/structures/web-preferences.md

Test ayrıntıları: tests/policy.cjs, tests/services.cjs, tests/smoke.cjs, tests/launcher-v2.cjs ve test-results/v020/. Sonuç dosyaları gerçek test çıktısıdır. NSIS kurulumu temiz başka cihazda henüz denenmedi; kurulum paketinden çıkan uygulama ayrıca test edilir.
