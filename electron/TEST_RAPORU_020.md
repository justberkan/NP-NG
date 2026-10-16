# Launcher 0.2.0 test sonucu — 17.10.2026

Durum: Windows x64 test kurulum paketi oluşturuldu. Paketlenmiş uygulama testleri PASS.

- 7/7 politika ve servis testi: adres/protokol, origin, kısayol, zorunlu anahtarlar, ayarlar, HTTP hata/redirect/zaman aşımı, gerçek alt süreçle sunucu açma.
- Paketlenmiş NPNG.exe üzerinde 8 kontrol grubu: kalıcı tercihler, GPU tanısı/rapor gizliliği, Electron çalışma zamanıyla gerçek yerel sunucu açma, HTTP kontrolü/var olan sunucu, bağlantı hatası, pencere tercihi, güncel lobi/maç/fare kilidi, tam ekran ve uyku engeli yaşam döngüsü. Sayfa hatası: launcher 0, oyun 0.
- Paketlenmiş eski smoke akışı: 7/7 grup PASS (5 performans anahtarı, erişilemeyen adres, tam ekran/izolasyon, popup engeli, maç/fare kilidi, F5, Ctrl+W dönüş).
- Mevcut tests/run.cjs PASS: 5 HTTP testi, 17 hareket kontrolü; 48 HTTP dosyası birebir, 139 JS sözdizimi, lobi/Aim Training; İstanbul takvimi, mevsim/ışık, atmosfer, mobil ve model hata yedeği.

Kanıtlar: electron/test-results/v020/report-packaged.json, launcher-packaged.png, system-packaged.png, match-packaged.png; electron/test-results/report-packaged.json. 4 saniyelik rAF ölçümü raporda ham örnektir; karşılaştırmalı FPS artışı iddiası değildir.

Kapsam dışı: temiz başka Windows cihazında NSIS kurulum/kaldırma, gerçek monitörde FPS/Hz/akıcılık kabulü ve internet üzerinden çok oyunculu kabul. Otomatik launcher güncellemesi bu sürümde yoktur.

Oyun kodunda değişiklik yapılmadı; değişiklikler electron/ altında. NOTLAR.md ve bu test kaydı teslim için güncellendi.
