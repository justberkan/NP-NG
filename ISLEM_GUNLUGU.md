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

### 2026-10-17 09:46 · Codex · build 202610171407 koridor-v3
- İşlem: Berkan'ın yalnız Minecraft ve iç içe geçmeme talebi doğrudan ana klasöre uygulandı.
- Eklendi: Uzak doğuş noktası seçimi; mob/mob ve mob/oyuncu daire teması; model hazır olma kapısı.
- Değişti: js/wave-corridor.js, js/wave-corridor-game.js, js/wave-corridor-visuals.js, js/combat.js, index.html, docs/codex-koridor/test.cjs; devir/notlar.
- Çıkarıldı: Bu moddaki asker zombisi üretimi, karışık model seçimi ve asker yükleme yedeği. Diğer modlardan model/dosya silinmedi.
- Test: Solo/iki hesap co-op, asker rig'i 0, Minecraft boss hasarı, 5/15→5/14, duvar, aynı noktadan ayrışma, 600 hareket adımı, 100 tur modül simülasyonu PASS; tests/run.cjs PASS. Gerçek cihaz FPS artış oranı ölçülmedi.
- Yedek: _yedek/codex-koridor-1407/. Güncel devir: docs/codex-koridor/GUNCELLEME_1407.md.

### 2026-10-17 09:55 · Codex · 202610171408 koridor-v4
- Eklendi: Kullanıcı GLB mermi/can modelleri, yazı/halkalar, toplama bildirimi, açık dünya zombi mermi loot ve model atıfları.
- Değişti: Yerel dönüş/sabit dünya ankrajı, yakın toplama, dolu can koruması, co-op koordinat/tekrar deneme; dosyalar GUNCELLEME_1408.md içinde.
- Çıkarıldı: Dünya merkezi etrafında dönen eski kutu ve uzaktan/görünmez toplama davranışı.
- Test: Solo/co-op/100 tur ve yer eşyası testleri PASS; görsel tarayıcı kontrolü yapıldı. Genel regresyon sonucu regresyon-log.txt.
- Yedek: _yedek/codex-koridor-1408/.

### 2026-10-17 10:03 · Codex · 1409
- Eklendi: Parkur, 3 düşüş hakkı, güvenli nokta, üç tema ve fizik/co-op testleri.
- Değişti: js/wave-corridor-game.js, server-wavecorridor.js, index.html; yeni js/wave-corridor-terrain.js.
- Çıkarıldı: Koridordaki kesintisiz düz zemin ve Y=0 altına düşmeyi engelleyen sınırlama.
- Test: Gerçek 4 atlayış, üçüncü düşüşte elenme, co-op kurtarma, önceki mod testleri ve genel regresyon PASS.
- Yedek: _yedek/codex-koridor-1409/.

### 2026-10-17 10:06 · Codex · 1410 parkur-aim-v1
- Eklendi: js/sensitivity.js, CS2/Apex/Valorant aktarımı, DPI/cm360/eDPI, kesin giriş ve ham mouse seçeneği.
- Değişti: js/settings.js, js/player.js, js/main.js, js/views.js, index.html.
- Çıkarıldı: 0.2 altı hassasiyeti engelleyen eski ayar sınırı. Oyun modu/özellik silinmedi.
- Test: Hassasiyet UI/kayıt/dönüş/ham girdi yedeği; koridor solo/co-op/atlayış/düşüş/100 tur testleri PASS. Genel regresyon sonucu regresyon-1410.txt.
- Yedek: _yedek/codex-hassasiyet-1410/. Devir: docs/codex-koridor/GUNCELLEME_1410.md.

### 2026-10-17 10:09 · Codex · 1411 koridor-stream-v1
- Eklendi: Oyuncu/güvenli nokta koruyan aktif pencere ve co-op sınır eşleşmesi; görünür arka kapanış duvarı.
- Değişti: js/wave-corridor-terrain.js, js/wave-corridor-game.js, index.html; test/devir notları.
- Çıkarıldı: Sürekli 3100 m zemin ve arka platform/köprü geometrilerinin bellekte tutulması; sahnede pasif spawner ağaçları.
- Test: Aktif pencere 102 m/144 vertex/1 spawner; yavaş takım arkadaşı korunur; gerçek co-op sınır eşleşmesi, önceki koridor fizik/oyun testleri ve genel regresyon PASS. FPS yüzdesi ölçülmedi.
- Yedek: _yedek/codex-koridor-1411/.

### 2026-10-17 10:24 · Codex · 1412/1413 admin araçları ve uçuş düzeltmesi
- Eklendi: Köşe admin paneli, noclip/ESP/god/ammo, heal/güvenli dönüş, F6/F8, durum bildirimi, eski sunucu yerel uyumu, tarayıcısız uçuş testi.
- Değişti: js/admin-tools.js (yeni), js/main.js, js/wave-corridor-game.js, js/wave-corridor-terrain.js, server.js, server-wavecorridor.js, index.html; test/devir.
- Çıkarıldı: Sonsuz onay bekleme ve panel açıkken uçuşta aşağı düşme.
- Test: Önceki admin/koridor tarayıcı testleri PASS. Genel testte atmosfer görünürlük assert başarısız; tam PASS değil. Bu turda tarayıcı açılmadan Node VM uçuş/kısayol/eski sunucu/normal hesap testi ve sözdizimi PASS.
- Yedek: _yedek/codex-admin-1412/, _yedek/codex-admin-1413/. Canlı eski sunucu kapatılmadı.

### 2026-10-17 10:34 · Codex · 1414 turn-steps-v1
- Eklendi: Yerinde dönüş adım döngüsü, ayak kaldırıp yeniden basma, destek ayağı, GLB ayak yönü aktarımı, tarayıcısız matematik/iskelet testi.
- Değişti: js/anim-contact.js, js/glbrig.js, index.html; test/devir/notlar.
- Çıkarıldı: Hız sıfırken dönüş boyunca her iki ayağın sürekli aynı dünya noktasına kilitli kalması.
- Test: 30/60/144/240 FPS, iki yön 720 derece, temas/denge/durulma/titreşim, hava/yürüme/kayma ve GLB ayak heading PASS; syntax PASS. Görsel oyun testi yapılmadı; tarayıcı açılmadı.
- Yedek: _yedek/codex-turn-1414/.

### 2026-10-17 10:48 · Codex · 1415 athletic-impact-v1
- Eklendi: js/athletic-motion.js, kademeli ivmelenme/fren, atletik kol salınımı, hız pozu filtresi, vuruş işareti önceliği; masaüstü ayrı paket.
- Değişti: js/player.js, js/rig.js, js/anim-contact.js, js/combat.js, index.html.
- Çıkarıldı: Ninja kolları/derin sprint çömelmesi, yakın dövüş hitFeel genel zaman yavaşlatması ve kamera dürtüsü. Hasar/ödül/son hız değişmedi.
- Test: 4 FPS yerde hareket; gerçek rig/ContactAnimation kol/tutuş; vuruş geri bildirimi; dönüş/admin uçuş Node testleri ve syntax PASS. Görsel/tarayıcı/canlı maç testi yapılmadı.
- Yedek: _yedek/codex-athletic-1415/. Devir GUNCELLEME_1415.md.

### 2026-10-17 10:58 · Codex · 1416 wick-laz-v1
- Eklendi: assets/characters/wick.glb, laz.glb; John Wick/Laz Torretto kataloğu, yaklaşık skin/kemik ve Laz renkleri; üretim/test/devir dosyaları.
- Değişti: js/glbrig.js, js/weapons.js, js/views.js, index.html.
- Çıkarıldı: Wick türev modelindeki gömülü silah/kılıç yüzeyleri ve sadeleştirmede gereksiz üçgenler. Kaynak GLB ve mevcut karakter silinmedi.
- Test: glbPrep/mkHumanGLB/glbSync 5 poz, skin ağırlığı/sonlu dönüşüm PASS; HTTP birebir yükleme, syntax/katalog ve önceki atletik/dönüş Node testleri PASS. Gerçek oyun/tutuş görsel testi yapılmadı, tarayıcı açılmadı.
- Yedek: _yedek/codex-characters-1416/. Yaklaşık rig ve yüksek poligon sınırları devirde açıklandı.

### 2026-10-17 11:42 · Codex · karakter kalite denetimi / ayrı FPS-slot teslimi
- Eklendi: Silah pozunda üçgen gerilme denetimi audit.cjs ve KALITE-INCELEMESI.md. Masaüstü FPS VE KUMARHANE YAMASI + ZIP, özgün 3 slot, FP modülü/önizleme/kurulum/notlar/testler.
- Değişti: Yalnız docs/test/notlar; iki GLB ve üretici scriptteki deneyler 1416 haline geri alındı.
- Çıkarıldı: Kaliteyi artırmayan deneysel ağırlıklar; mevcut karakter/hesap verisi silinmedi. FPS-slot paketi canlı oyuna kurulmadı.
- Test: Slot10.000tur ve FP4FPS rijit tutuş/ADS/fizik PASS, tarayıcı açılmadı. Karakter silah tutuşu kenar gerilme kontrolü kalite RED; kalıcı profesyonel rig düzeltmesi tamamlanmadı.
- Yedek: _yedek/codex-characters-1417/. Ayrıntı: docs/codex-characters-1416/KALITE-INCELEMESI.md.


## 2026-10-17 16:20 İstanbul — Codex — Genel hata incelemesi / 1417
- Değişti: ragdoll koridor sınırı, sınırlı fizik adımı, görünür ceset klonu, kararlı yön tabanı ve klon iskelet temizliği.
- Değişti: silah görseli hitbox dışında; gizli kapı ışın engeli kaldırıldı; yakın dövüş harita/açık dünya duvar kontrolü.
- Değişti: lobi atmosfer panelinin anlık gizlenmesi, mağaza kart yazı/görsel daralma düzeni.
- Eklendi: docs/codex-audit-1417/ testleri, sonuçlar, devir ve dürüst oyun değerlendirmesi.
- Test: audit, gerçek GLB ragdoll, atletik hareket, dönüş ve admin uçuş Node testleri geçti. Tarayıcı/mouse kullanılmadı.
- Açık: Wick/Laz eklem ağırlıkları düzelmedi; görsel oyun testi ve tam sunucu vuruş doğrulaması yapılmadı.
- Yedek: _yedek/codex-audit-1417/. Ana oyun build 202610171417. Sunucu durdurulmadı.


## 2026-10-17 17:06 İstanbul — Codex — Animasyon V2 aday / UYGULANMADI
- Eklendi: masaüstü ANİMASYON YAMASI V2 klasörü ve ZIP; payload/baseline, 19 modelle bağımsız karşılaştırma ekranı, offline hareket GIF/PNG, taşınabilir testler, hash manifesti, Kimi test planı. Kaynak çalışma docs/animation-staging-v2/.
- Değişti (yalnız adayda): temasla korunan gövde geçişleri, erişime uygun adım süresi/mesafesi, dururken adımı tamamlama, silahsız kol akışı/dinlenme geçişi, yan adım ayak ayrımı, zemin callback; silahsız duvar koşusunda null silah quaternion hatası, duvar ayak hedefinin filtrelenmiş pozla eşleşmesi.
- Çıkarıldı (yalnız aday katalogdan): h24 John Wick, h25 Laz Torretto. Canlı hesaplar, varlıklar ve katalog korunuyor. Siber/Heetah/Lara görsel inceleme bekler.
- Reddedildi: topolojiyle otomatik ağırlık onarımı; bazı modellerde bozuk alan oranını büyüttü. Deney sonucu ayrı kayıt, teslim kodunda yok.
- Test: hareket/yan adım/dönüş dört FPS düzeyinde PASS; 19 model sekiz poz yükleme/sonlu poz PASS, beş model deformasyon kalite incelemesine takıldı. Canlı görsel/GPU testi yok. Tarayıcı/mouse kullanılmadı.
- Yedek: paket baseline/js/ ve manifest.json. Ana oyunun hedef dosyaları hash kontrolüyle değişmedi; build 1417 kalır. Kimi raporu gelmeden uygulama yok.


## 2026-10-17 19:37 İstanbul — Codex — 202610171802 animation-v2-arac-v1 / UYGULANDI
- Yetki: Berkan beklenenin animasyon raporu değil Kimi'nin araba yamasının bitmesi olduğunu açıkladı; animasyon ve araç animasyonlarını uygulamamı istedi.
- Eklendi: js/race-motion.js; bağımsız direksiyon/aks/gövde animasyonları, fren/gaz/viraj ağırlık aktarımı, pervane/jet ayrımı ve Mirage art yakıcı.
- Değişti: bekleyen insan Animasyon V2 güncel 1801 üzerine hash eşleşmesiyle uygulandı. GLB araç merkezleme, özgün tekerlek/pervane dönüş-ölçeğini koruma, kaynak temizliği, önizleme ve kamera filtresi.
- Çıkarıldı: h24/h25 yalnız seçim/mağaza katalog girdileri; kaynak modeller/hesaplar korunur. Başarısız otomatik skin onarımı uygulanmadı.
- Dosyalar: js/anim-contact.js, glbrig.js, rig.js, weapons.js, racemodels.js, race-motion.js, race.js, index.html. Kimi yarış/nişangâh ve diğer oyun modları korunuyor.
- Test: dokuz gerçek araç GLB, dört FPS düzeyinde araç/insan hareketi/dönüş; mevcut ragdoll/hitbox/atletik/admin testleri PASS. 19 insan profili sonlu poz testi, beş modelin kalite sorunu not edildi. HTTP 200 + disk eşleşmesi PASS. Tarayıcı/mouse veya GPU testi yok.
- Yedek: _yedek/codex-animation-live-1802/. Ayrıntı docs/animation-live-1802/DEVIR.md. Masaüstü ANİMASYON VE ARAÇ YAMASI 1802 + ZIP. Canlı sunucu kapatılmadı; Ctrl+F5.


## 2026-10-17 20:04 İstanbul — Codex — 202610171804 race-rivals-garage-v1 / UYGULANDI
- Eklendi: RaceAI (viraj, sollama, savunma, pickup ve slot taktikleri), üç kullanıcı MP3'ü ile RaceAudio, instanced tepeler/ağaç/kaya ve N·Petrol benzinlik dekoru, referansa göre canlı 3B garaj + CSS.
- Değişti: aynı kara pisti x3 / 1164m / 16.4m yol; gridde başlangıç turu sayımı, geniş start daması, kamera uzaklığı/geri dönüş, ortak bariyer hasarı. Garaj kart/istatistik/gerçek model seçimi eşleşir.
- Korundu: eşzamanlı eklenen MIG-21 ve model filtreleri, 1802 insan/araç animasyonları, diğer modlar/nişangâh. 1803 numarası MIG işinde kullanıldığı için son sürüm1804.
- Çıkarıldı: hava botlarına rastgele ücretsiz boost, ilk slot item kilidi, eski kart yığını seçim ekranı.
- Test: 150sn 6 sürücü +180sn gerçek raceStep/item/hasar; ses yaşam döngüsü test çiftleri + gerçek MP3 dosyaları; garaj handler/Three geometri test çiftleri; 10 gerçek GLB regresyonu, insan dönüş/atletik testleri PASS. 61 script syntax ve9 HTTP/disk eşleşmesi PASS. Tarayıcı/mouse/gerçek ses dinleme/GPU FPS testi yok.
- Dosyalar: yeni js/race-{ai,audio,world,garage}.js, css/race-garage.css, assets/race/audio; js/race.js/racemodels.js/index.html değişti. Ayrıntı docs/race-upgrade-1803/DEVIR.md; yedek _yedek/codex-race-1803/.
- Teslim: masaüstü YARIŞ PİST BOT SES GARAJ 1804 + ZIP. Ana oyuna uygulandı; canlı sunucu durdurulmadı. Ctrl+F5.


## 2026-10-17 21:34 İstanbul — Codex — 202610171805 garage-controls-fix-v1
- Değişti: garaj canvası genel fixed kuralından ayrılıp kendi sahnesine absolute bağlandı; taşma/katman sınırları ile üst araç şeridi, oklar, geri ve YARIŞA BAŞLA kontrollerinin örtülmesi düzeltildi.
- Eklendi: docs/race-upgrade-1803/GARAJ_KONTROL_DUZELTMESI_1805.md. Çıkarıldı: yok.
- Test: garaj başlat/seçim/iptal handler ve Three geometri testi PASS; HTTP güncel build/CSS eşleşmesi PASS. Canlı tarayıcı/mouse testi yok; önceki test çiftlerinin CSS hatasını yakalamadığı açıkça kaydedildi.
- Dosyalar css/race-garage.css,index.html; yedek _yedek/codex-garage-controls-1805/. Sunucu kapatılmadı.

## 2026-10-17 21:46 İstanbul — Codex — 202610171806 race-start-fix-v1
- Değişti: Three.js r128 CanvasTexture.userData tanımsız olduğundan pist tabelası oluşturulurken yarışın yarıda kalması düzeltildi. userData oluşturularak sahiplik/texture temizliği korundu.
- Eklendi: yarış başlangıç hatasında kaynak temizliği, lobiye dönüş ve yeniden deneme ekranı; docs/race-upgrade-1803/test-startup.cjs, STARTUP-TEST.json, YARIS_BASLATMA_DUZELTMESI_1806.md. Çıkarıldı: yok.
- Test: düzeltme öncesi aynı TypeError tekrar üretildi. Sonrası gerçek Three/CanvasTexture ve raceSetup ile 5 kurulum, geri sayım, oyuncu/AI hareketi, duraklat/devam/çıkış/yeniden başlatma PASS. Gerçek startMatch-begin-setupMode zinciri ve kasıtlı başlangıç hatasından toparlanma PASS. Garaj, 180sn raceStep, 10 GLB regresyonları PASS. DOM/çizim test çifti; canlı tarayıcı/GPU/mouse testi yok.
- Dosyalar: js/race-world.js, js/main.js, index.html; test/raporlar docs/race-upgrade-1803 ve mevcut araç test raporları. Yedek: _yedek/codex-race-start-1806/. Sunucu kapatılmadı; Ctrl+F5.

## 2026-10-17 21:53 İstanbul — Codex — 202610171807 alternating-gait-fix-v1
- Değişti: ayak uzanma/mesafe düzeltmelerinin bağımsız phaseOffset ile iki bacağı aynı faza getirmesi giderildi. Tek saat, sabit yarım döngü sağ-sol farkı; temas/IK korunur.
- Eklendi: docs/animation-gait-1807/ altında öncesi/sonrası ölçüm, 17 gerçek GLB adım testi ve DEVIR.md. Çıkarıldı: bağımsız ayak phaseOffset; karakter/model çıkarılmadı.
- Test: önceki hatada 60FPS sprint faz farkı kayboluyor, iki ayak havada süre yüzde88.9. Sonrası yüzde20.3 normal koşu uçuşu; 16 hız/FPS +32 yön/dur-kalk senaryosu sıralı adım PASS. 17 GLB yürüyüş/sprint ters ayak hareketi PASS; mevcut hareket/dönüş regresyonları PASS. Tarayıcı/GPU görsel kabul testi yok. Önceden bilinen skin deformasyonları ayrı raporda korunuyor.
- Dosyalar: js/anim-contact.js,index.html,test/raporlar. Yedek: _yedek/codex-gait-1807/. Sunucu kapatılmadı; Ctrl+F5.

## 2026-10-17 23:12 İstanbul — Codex — Custom Cars 1 / PAKET, UYGULANMADI
- Kullanıcı yalnız dosya istedi. Ana oyun runtime dosyaları değiştirilmedi; build1807 kaldı.
- Eklendi: Masaüstü ARABA UYARLAMA PAKETI.zip (51dosya,121190113bayt):8 orijinal SHA256 yedek,8 düzenlenebilir normalleştirilmiş kaynak,16 optimize GLB, eklenti, kurucu, tekrar üretme araçları ve raporlar.
- Düzenlendi: +Z yön/ölçek/zemin;4 tekerlek grubu; Doğan mesh parçalama; M3GTR yönü; E30 ön tekerlek hizası; Huracán ayrı glow geometrileri; malzeme bazlı birleştirme;512px dokular; oyuncu/bot ayrı geometri.
- Ölçüm: kaynak1144458 üçgen/3729 çizim -> yüksek439680/190, düşük179043/189. Yüksek GLB77.9MB->31.0MB.
- Test:16GLB validator0 hata0 uyarı; gerçek Three r128 yükleme,4tekerlek2direksiyon,fizik,animasyon;3lüyükleme kuyruğu,bot düşükLOD; ayrı klasörde kurucu,hash,yedek PASS. CPU dokulu önizleme incelendi. Canlı WebGL/GPU FPS testi yok. ZIP CRC+SHA256 PASS.
- Yedek: paketin originals/ ve editable/ klasörleri; kaynak Downloads/arabalar değişmedi. Notlar dışında ana oyuna kurulum yapılmadı.

### 2026-10-17 23:30 · Claude · build 202610171808 denetim-v1
- İşlem: Berkan'ın isteğiyle genel hata denetimi (gerçek tarayıcı: 7 mod aç/oyna/çık, 3–4 tur sızıntı ölçümü, lobi 114 tıklama, 2 istemcili çevrimiçi Arena/Takımlı/Zombi Co-op, tests/run.cjs). Rapor ve ajan promptları: docs/HATA_DENETIMI_20261017.md
- Eklendi: tests/audit.cjs (her teslimde zorunlu; run.cjs içinde), npm run test:audit; freeActor(), weaponFree(), cmpFreeMeshes()
- Değişti: athletic-motion.js (1415 kademeli ivme geri alındı: karşı tuşla duruş tekrar <100 ms), combat/world/mp/owmp.js (aktör silinince iskelet dokusu bırakılır), weapons.js (değişen silahın geometrisi bırakılır), compet.js (A/B işaret dokuları), loadout.js (yarışta silah şeridi gizli), main.js + style.css (fare kilidi ipucu taşmıyor, duraklatınca siliniyor), IS_PLANI.md (yeni çalışma hattı)
- Çıkarıldı: 1415'teki kademeli yer ivmesi/freni (hareket hissi 1405'teki gibi); yarışta loadout silah şeridi
- Dosyalar: js/athletic-motion.js, js/combat.js, js/world.js, js/mp.js, js/owmp.js, js/weapons.js, js/compet.js, js/loadout.js, js/main.js, css/style.css, index.html, tests/audit.cjs, tests/run.cjs, package.json, docs/HATA_DENETIMI_20261017.md, IS_PLANI.md
- Test: tests/run.cjs + audit.cjs tümü PASS, 39/39 (HTTP 5, hareket 17, smoke, lobi atmosferi, audit 7 mod × 2 + lobi). Doku sayısı 4 turda sabit (önce TDM +9, rekabetçi +11, açık dünya +17/maç). Gerçek ekran kartında FPS ölçülmedi (A-07 Kimi).
- Yedek: _yedek/claude-denetim-1808/

### 2026-10-17 23:45 · Claude · kural (build değişmedi: 202610171808)
- İşlem: Berkan'ın yasası IS_PLANI.md'nin en üstüne yazıldı: Claude onayı olmadan hiçbir iş uygulanmaz; önce plan, onay, dal + PR, npm test, Claude birleştirir. Onay metni "ONAY · <hata no> · <kapsam>" başlığını taşır.
- Eklendi: IS_PLANI.md "YASA" bölümü
- Değişti: yok (oyun kodu değişmedi)
- Çıkarıldı: yok
- Dosyalar: IS_PLANI.md, ISLEM_GUNLUGU.md
- Test: gerekmez (yalnız belge)
- Yedek: _yedek/claude-denetim-1808/IS_PLANI.md (önceki hali)


### 2026-10-18 14:21 İstanbul · Codex · A-06 aşama 1 / PR adayı
- Yetki: ONAY · CODEX-2; Arena, Takımlı Online ve Zombi Co-op. Koridor/A-06b kapsam dışı. Canlı masaüstü klasörüne yazılmadı. Dal: codex/A-06-sunucu-vurus.
- Eklendi: silaha/modeline göre atış aralığı, menzil, görüş hattı; 350 ms konum geçmişi ve 100 ms sınırlı geri sarma; ret sayaçları ve nedenli günlük. Ban/kick eklenmedi.
- Değişti: mp.js yalnız atış kimliği/zaman ve saat eşleme alanları; hasar/geri tepme/hareket değişmedi. Eski istemciler eski kontrolleri kullanır; yeni protokolü kullanan oturum metadata kaldırarak geri dönemez.
- Çarpışma: istemci mapLoad/mcBuild kaynağından tekrar üretim; Arena kutuları, Dust2 ve mevcut Minecraft takım haritası. 608334 bayt; GLTF yükleme sırası sabitlenerek iki üretimde aynı SHA-256 doğrulandı. Betik: node tests/generate-hit-collision.cjs.
- Test: npm test tam çıktı test-results/npm-test-delivery.txt; tüm kontroller PASS. Sunucu 37 kontrol; 500 köşe çıkışı 499 kabul, 500 Dust2 geçit 500 kabul, 500 sınır menzil 499 kabul. 56 model için 1120 atış aralığı kontrolü PASS. Gerçek iki WebSocket istemcisi; test yerleştirme/iyileştirmesi yerel test adminiyle yapıldı.
- Performans: 1511 ölçüm ortalama 0.043531 ms, p95 0.0819 ms, en yüksek 0.5771 ms. Ortalama/p95 hedef altında; her bir çağrı için 0.2 ms garantisi yok.
- Dosyalar: server.js, server-hit-validation.js, server-hit-collision.js, server-hit-collision.bin, js/mp.js, tests/server-hit.cjs, tests/generate-hit-collision.cjs, tests/http.cjs, tests/run.cjs, ISLEM_GUNLUGU.md, test-results/server-hit.json, test-results/npm-test-delivery.txt, test-results/collision-generation.txt, test-results/audit/audit.json, test-results/audit/aim.png, test-results/audit/tdm.png, test-results/audit/zom.png, test-results/audit/cmp.png, test-results/audit/ow.png, test-results/audit/wc.png, test-results/audit/race.png.
- Çıkarıldı: yok. Yedek: Git başlangıç eddcbd3 ve dal commitleri. HTTP testine yalnız yeni bağımlılıkların fixture kopyası eklendi (Berkan ek onayı).
- Sınır: eski istemci yolu bilerek daha zayıf; sunucu konumuna dayalı baş/gövde görüş hattı tam iskelet hitbox doğrulaması değildir. Koridor değiştirilmedi. Oyuna birleştirme/uygulama Claude'a ait.

### 2026-10-18 14:45 · Claude · build 202610171809 sunucu-vurus-v1 (PR #8 birleştirme)
- İşlem: Codex'in CODEX-2/A-06 PR #8'i incelendi, birleştirildi, canlı klasöre yazıldı.
- İnceleme: kapsam onaylı dosyalarla sınırlı; http.cjs'te yalnız kopyalama listesi değişmiş (assert'ler aynı); eski istemci yolu korunmuş; Koridor'a dokunulmamış.
- Claude değişikliği: server-hit-collision.js — js/mapcol.js okunamazsa sunucu çökmüyor; çarpışma verisi olmayan haritada tüm vuruşlar reddedilmek yerine yalnız duvar kontrolü kapanıyor ve konsola uyarı düşüyor. test-results/ kanıt dosyaları main'e alınmadı (PR'da duruyor).
- Değişti: server.js, js/mp.js, tests/http.cjs, tests/run.cjs, index.html (build 1809); Eklendi: server-hit-validation.js, server-hit-collision.js, server-hit-collision.bin, tests/server-hit.cjs, tests/generate-hit-collision.cjs
- Çıkarıldı: yok
- Test: Claude ortamında npm test baştan sona PASS (sunucu vuruş 27 kontrol, HTTP 5, hareket 17, smoke, atmosfer, audit 7 mod + lobi). İki gerçek tarayıcı istemcisi: A'nın 3 vuruşu B'nin canını 100→25 düşürdü, sunucuda 0 ret. Rekabetçi ve Koridor'da tek oyunculu vuruş da ayrıca doğrulandı (Kimi'nin raporundaki 0 vuruş ölçüm betiğinden: rekabetçide donma süresi, koridorda spawner kırılmadan zombi çıkmıyor).
- NOT: server.js değişti → sunucu YENİDEN BAŞLATILMALI; oyuncular Ctrl+F5.
- Yedek: _yedek/claude-a06-1809/

### 2026-10-19 03:30 İstanbul · Claude · build 202610190325 cevrimdisi-v1
- İşlem: Berkan kuralı uygulandı — çevrimdışı = para sınırsız, HİÇBİR ilerleme kaydedilmez; online hesap 31 TL ile başlar; açık dünya tek ortak dünya, en fazla 50 kişi.
- Bulunan açık (tarayıcıda kanıtlandı): çevrimdışı 1e9 TL, kayıt olurken ya da bağlantı gidip gelince hesaba yazılıyordu (yeni hesap sunucuda 1.000.000.000 TL ile başladı). Canlı hesaplarda neggastr 1.000.010.548, jejjejr 1.000.000.000 TL vardı.
- İstemci: save() çevrimdışıyken ne localStorage'a ne hesaba yazar; hesap bağlanırken (OFFL.pend) kayıt bekletilir. Çevrimdışı oynanmışsa girişte bellek atılır, hesaptaki kayıt yüklenir. Yeni hesap SVDEF (31 TL) ile açılır. Sunucu reddederse (sfix) hesaptaki kayda döner. Oyun içinde "ÇEVRİMDIŞI · ilerleme kaydedilmez · para sınırsız" rozeti, lobide sarı hesap yazısı, para kutusunda ∞.
- Sunucu: 1e9+ / sonlu olmayan para kaydı reddedilir; açılışta ve girişte eski sızıntı onarılır (1e9 düşülür, en az 31); kayıtta para 31'e sabitlenir; admin para verme 1e9 altında kalır; OW_MAX 50.
- Eklendi: tests/offline-save.cjs (18 kontrol), package.json test:offline. Değişti: server.js, js/core.js, js/mp.js, js/ui.js, css/style.css, index.html (build 0325, 60 ?v), tests/run.cjs, server-hit-collision.bin (yalnız js/core.js kaynak özeti; geometri birebir aynı doğrulandı), IS_PLANI.md. Çıkarıldı: kayıt olurken çevrimdışı ilerlemenin hesaba taşınması.
- Test: npm test baştan sona PASS (çıkış 0, 89 PASS, 0 FAIL): sunucu vuruş, HTTP 5/5, hareket, smoke, atmosfer, audit 7 mod + lobi 99 tıklama, offline-save 18/18. Tam çıktı test-results/npm-test-cevrimdisi-0325.txt.
- NOT: server.js değişti → sunucu YENİDEN BAŞLATILMALI (onarım açılışta çalışır: neggastr → 10.548 TL, jejjejr → 31 TL; seviye/eşyalar kalır). Oyuncular Ctrl+F5.
- Bilinen sınır: sunucu istemci kaydına hâlâ güvenir (para dışındaki alanlar doğrulanmıyor); hile koruması ayrı iş. Sızan parayla alınmış eşyalar hesaplarda kaldı.
- Yedek: _yedek/claude-cevrimdisi-0325/

### 2026-10-19 12:40 İstanbul · Claude · build 202610191230 dede-v1 (PR #10 birleştirme + oyun içi entegrasyon)
- İşlem: Kimi'nin KİMİ-CASINO-DEDE PR #10'u incelendi, birleştirildi ve oyunun parasına bağlandı. Kumarhane → "DEDE ⚡" ilk/varsayılan sekme; eski emoji slot "Meyve slot" adıyla duruyor.
- İnceleme: PR yalnız yeni dosya içeriyor; RTP Claude ortamında tekrar ölçüldü: 1.000.000 spin, tohum 20261019 → %96,28, near-miss kapalı. Sayfa para tutmuyor (setCredit/onBet/onWin), "Sanal para" yazısı görünür.
- Claude değişiklikleri: sayfa casino/ → assets/casino/dede/index.html (sunucu yalnız index.html/assets/js/css/lib sunar; EXE çevrimdışı kopyası da bu kökleri alır), yollar aynı klasöre göre; bahis basamakları 10 TL'den (yeni hesap 31 TL); API'ye stopAuto/spinning/weeklyStatus; bonus adım ödemeleri 5000x tavanını aşamaz; çevrimdışı bonus mesajı.
- Oyun tarafı (js/casino.js): iframe #lb içinde bir kez açılır, sekmelerin altına 1200×790 tasarımdan ölçeklenir (kesilmez); para yalnız SV.tl, her olayda setCredit ile eşitlenir; sekmeden çıkınca süren çevirme arka planda biter/ödenir, otomatik çevirme durur. Haftalık kayıp bonusu oyunda: tüm kumarhane oyunlarının son 7 gün net kaybının %10'u, tavan 25.000, haftada bir, SV.cas'ta; çevrimdışıyken verilmez.
- Sunucu: MIME tablosuna .webp .jpeg .mp3 .ogg .wav eklendi (DEDE görselleri ve ileride sesler).
- Eklendi: assets/casino/dede/ (6 WebP 416 KB + orijinal JPG'ler + index.html), docs/casino/ (BENIOKU + 7 ekran görüntüsü), tests/casino-rtp.cjs (npm test kapısı: RTP %95–97 + near-miss kapalı), tests/casino-ui.cjs (Kimi'nin Windows görsel aracı, run.cjs'te yok), tests/casino-dede.cjs (10 kontrol). Değişti: js/casino.js, css/style.css, server.js, index.html (build 1230, 60 ?v), tests/run.cjs, package.json (test:casino). Çıkarıldı: yok.
- Test: npm test baştan sona PASS (çıkış 0, 100 PASS, 0 FAIL) — sunucu vuruş, HTTP, hareket, smoke, atmosfer, audit 7 mod + lobi tıklama (DEDE dahil), offline-save 18/18, DEDE RTP %96,28, casino-dede 10/10. Tam çıktı test-results/npm-test-dede-1230.txt.
- Berkan kararı bekleyen: near-miss (öneri: KAPALI kalsın), haftalık bonus oranı/tavanı (şimdilik %10 / 25.000), Kimi'nin edge-tts sesleri.
- NOT: server.js değişti (yalnız MIME) → sunucu yeniden başlatılınca .webp doğru türle gider; oyuncular Ctrl+F5.
- Yedek: _yedek/claude-dede-1230/

### 2026-10-19 13:40 İstanbul · Claude · build 202610191325 suzulme-naruto-v1 (A-16, A-20)
- A-16 Paraşüt titremesi: süzülmenin başlama eşiği (düşüş hızı < -2,2) her fizik alt adımında yeniden soruluyordu; süzülme hızı -1,9'a oturunca kapanıp açılıyordu. Ölçüm (eski kod, 3 sn): 144/165/240 FPS'te 33 kez aç-kapa, tüm FPS'lerde 14–19 hız sıçraması, birinci şahısta silah 6–9 mm/kare titriyordu. Düzeltme: süzülme başladıktan sonra Space bırakılana (ya da yere inene) dek sürer. Sonra: 0–1 geçiş (yalnız giriş), 0 sıçrama, 0 titreme.
- A-20 Naruto koşusu (Berkan kararı a): yalnız açık dünyada. Diğer modlarda Shift hızlı koşu (1,4×) kalır, animasyon normal koşu klibi. Birinci şahıs silah indirme davranışı değişmedi.
- Eklendi: tests/glide-sprint.cjs (11 kontrol; eski kodda A-16 kontrollerinin düştüğü doğrulandı), package.json test:glide. Değişti: js/player.js, js/rig.js, index.html (build 1325, 60 ?v), tests/run.cjs, docs/HATA_DENETIMI_20261017.md (A-14…A-20, Y-01 eklendi; A-16/A-20 bitti). Çıkarıldı: yok.
- Test: npm test baştan sona PASS (çıkış 0, 109 PASS, 0 FAIL) — sunucu vuruş, HTTP, hareket, smoke, atmosfer, audit 7 mod + lobi, offline-save, DEDE RTP + casino-dede, glide-sprint 11/11. Tam çıktı test-results/npm-test-suzulme-1325.txt.
- Yedek: _yedek/claude-suzulme-1325/

### 2026-10-19 13:50 İstanbul · Claude · sunucu paketi (oyun kodu değişmedi, build 1325 aynı)
- İşlem: Berkan yan bilgisayarı sunucu yapıyor; USB ile kopyalanan klasörde bağlantı kurulamadı. Kurulum gerektirmeyen tam sunucu paketi hazırlandı ve sohbete gönderildi: NPNG-SUNUCU-1325.zip (109 MB).
- Paket: oyun dosyaları (main ile aynı), node\node.exe (Node 22.23.1, OpenJS Foundation imzalı), cloudflared.exe (Cloudflare imzalı), data\accounts.json (ana bilgisayardaki son kopya; yeni sunucu açılışta 1e9 sızıntısını onarır), KURULUM.txt.
- Değişti: SUNUCU-BASLAT.bat ve sunucu-link.ps1 — klasördeki node\node.exe varsa onu kullanır (Node kurulumu gerekmez); zip içinden çalıştırılırsa ve beklenmeyen hatada pencere kapanmadan sebebi yazar. .gitignore'a node/ eklendi.
- Test: paket klasöründen sunucu açıldı; gerçek hesap kopyasında onarım çalıştı (neggastr → 10.548, jejjejr → 31); audit 7 mod + lobi 99 tıklama paket sunucusuna karşı PASS (0 sayfa hatası, 0 eksik dosya). PowerShell betiği sözdizimi denetimi PASS. Windows'ta .bat/.ps1 gerçek çalıştırma Berkan'da.
- Yedek: _yedek/claude-sunucu-paketi/

### 2026-10-19 14:10 İstanbul · Claude · sunucu dayanıklılığı + yan bilgisayar güncelleyici (oyun kodu değişmedi, build 1325 aynı)
- Yan bilgisayar (sunucu) hatası: sunucu açılmıştı ama sunucu-link.ps1 ona localhost üzerinden 10 sn içinde ulaşamayıp "başlamadı" dedi. Düzeltme: 127.0.0.1'e doğrudan TCP kontrolü, 60 sn bekleme, zaten açık sunucuyu yeniden kullanma; tünel 127.0.0.1'e bağlanıyor.
- Kimi bulgusu (doğru): Windows'ta SIGTERM/taskkill /f node'u anında öldürür, 'exit' işleyicisi çalışmaz → son 5 sn'lik hesap yazımları kaybolur (offline-save testi Windows'ta bu yüzden düşüyordu; gerçek oyunda da DURDUR.bat aynı kaybı yapıyordu). Düzeltme: server.js yeni hesabı ve açılış onarımını anında diske yazar; SIGHUP (konsol kapatma) ve SIGBREAK'te kayıt yazılıp çıkılır. DURDUR.bat artık yalnız 3000 portunu dinleyen sunucuyu önce kibarca, 3 sn sonra zorla kapatır (bilgisayardaki diğer node programlarına dokunmaz). offline-save testi artık Windows gibi anında öldürüyor (eski kodda düştüğü, yenisinde geçtiği doğrulandı).
- Eklendi: GUNCELLE.bat + guncelle.ps1 — yan bilgisayarda tek tıkla en son main'i GitHub'dan indirir, oyun dosyalarını yeniler (data, node, cloudflared.exe, LINK.txt'ye dokunmaz), sunucuyu yeniden başlatır. Linux PowerShell 7 ile denendi: sürüm 1809→1325 yenilendi, hesap dosyası md5 aynı, node/cloudflared dokunulmadı.
- Değişti: server.js, DURDUR.bat, sunucu-link.ps1, tests/offline-save.cjs. Eklendi: GUNCELLE.bat, guncelle.ps1.
- Test: npm test baştan sona PASS (çıkış 0, 109 PASS, 0 FAIL). Windows'ta .bat gerçek çalıştırması Berkan'da.
- Yedek: _yedek/claude-sunucu-1410/

### 2026-10-19 14:20 İstanbul · Claude · build 202610191415 dede-tts-tr
- DEDE İngilizce aksan (Berkan): mp3'ler henüz yokken sayfa tarayıcı sentezine düşüyordu; tarayıcıda Türkçe ses yoksa varsayılan İngilizce sesle okuyordu. Düzeltme: Türkçe ses yoksa sentez konuşmaz, balon görünür. Kalıcı çözüm: Kimi'nin edge-tts Türkçe mp3'leri (kimi/dede-ses, PR bekleniyor).
- GUNCELLE.bat/guncelle.ps1: yalnız istemci dosyaları değiştiyse sunucu yeniden başlatılmaz (link aynı kalır, oyuncular Ctrl+F5); sunucu dosyaları değiştiyse yeniden başlatılır. Çıkış kodları PowerShell 7 ile denendi (aynı → 0, değişti → 3).
- Değişti: assets/casino/dede/index.html, guncelle.ps1, GUNCELLE.bat, index.html (build 1415, 60 ?v), tests/casino-dede.cjs (Türkçe ses kontrolü; 11 kontrol).
- Test: npm test baştan sona PASS (çıkış 0, 110 PASS, 0 FAIL). Tam çıktı test-results/npm-test-1415.txt.
- Yedek: _yedek/claude-sunucu-1410/ (aynı yayın)

### 2026-10-20 01:00 İstanbul · Claude · build 202610200050 mobil-ganimet-v1
- Not: 19 Ekim 14:40'ta hazırlanan "1450" paketi yayına girmeden Claude'un çalışma alanı sıfırlandı; değişiklikler aynı içerikle yeniden uygulandı ve bu sürüme katıldı.
- Mobil (iOS): iki parmak/çift dokunma yakınlaştırması ve yatayda yazı büyütme kapatıldı (viewport maximum-scale=1, gesture*/çift dokunma engeli; yazı kutuları serbest). Açık dünya yetenek tuşları (k1–k5) diğer modlarda boş daire olarak görünüyordu → yalnız açık dünyada.
- Mobil tuş düzeni paneli: ortada büyük kutu yerine küçük ve üstte; ⠿ ile taşınır, – ile küçülür, ekran dışına çıkmaz; düğmeler sürüklenirken/büyütülürken ve ekran dönünce ekran içinde kalır.
- Açık dünya: havadayken yakın dövüş saldırısı → yere vurma; yükseklik arttıkça alan (3,5→10 m) ve hasar (≈1x→3,2x) büyür, yerdeyken normal saldırı. Kılıç vuruşu büyük mob/boss gövdesini hesaba katıyor (ıskalama). Otomatik savaş yakın dövüşte menzilin ~yarısına + gövde yarıçapına kadar sokuluyor.
- Naruto koşusu (Berkan): açık dünyada Shift ile vardı; artık dash atarken de (0,45 sn, ağ bayrağıyla diğer oyuncular da görür) ve mobilde joystick sonuna kadar ileri itilince.
- Çevrimiçi açık dünya ortak ganimet (Berkan): eşyalar yalnız öldürenden düşer, sunucu herkese gösterir; 15 sn yalnız öldüren alır, sonra herkes; 90 sn sonra kaybolur. Sunucu: öldürme başına bir kez, son 5 sn'de gerçekten öldürene izin; alma uzaklık kontrollü; aynı eşya iki kez alınamaz. Katılımcılar TL/XP almaya devam eder, eşya almaz.
- Lara (h22) kaldırıldı (Berkan isteği, Kimi planında); kuşananlar askere döner.
- Hata: açık dünyada ilk can/mermi kutusu düşüşü, modeller yüklenmeden önce çöküyordu (wave-corridor-visuals.js) → kutu gösterilir. Açık dünyadan çıkınca sınıf seçim penceresi lobide açık kalıyordu → kapanır.
- Kimi KİMİ-2 raporu main'e alındı (docs/KARAKTER_KONTROLU.md + boy ölçümleri; 170 görüntü yalnız dalında). Bulgu: Goblin (h20) iskeletsiz → küp (A-21, karar Berkan'da).
- Eklendi: tests/mobile.cjs, tests/ow-slam-auto.cjs, tests/ow-loot.cjs. Değişti: server.js, js/{auto,combat,controls,core,owmp,owui,ow2,player,skills,ui,wave-corridor-visuals,weapons,world}.js, css/style.css, index.html (build 0050, 60 ?v), server-hit-collision.bin (yalnız core/weapons kaynak özeti; geometri aynı doğrulandı), tests/run.cjs, tests/casino-dede.cjs, package.json, docs/HATA_DENETIMI_20261017.md.
- Test: npm test baştan sona PASS (çıkış 0, 142 PASS, 0 FAIL): sunucu vuruş, HTTP, hareket, smoke, atmosfer, audit 7 mod + lobi, offline-save, DEDE RTP + casino-dede, glide-sprint, mobile 12/12, ow-slam-auto 8/8, ow-loot 13/13.
- NOT: server.js değişti → yan bilgisayarda GUNCELLE.bat (sunucu yeniden başlar, link değişir); oyuncular Ctrl+F5.
- Yedek: _yedek/claude-0050/

### 2026-10-20 01:45 İstanbul · Claude · build 202610200140 ses-sunucu-v1
- Sorun (Berkan): "oyun içi ses gitmiyor". Sesli sohbet WebRTC eşler arası ve yalnız STUN ile çalışıyordu; mobil hat / CGNAT / bazı modemlerde eşler doğrudan bağlanamıyor (TURN yok; oyun sunucusu tünelden yalnız HTTP/WS geçiriyor). Ayrıca dinlemek için de mikrofon açmak gerekiyordu ve mobilde ses düğmesine ulaşılamıyordu (yalnız Enter ile açılan kutudaydı).
- Düzeltme: ses artık oyunun kendi WebSocket'inden gider: mikrofon → 16 kHz mono → μ-law 8 bit → 60 ms paket (~21 KB/sn, yalnız konuşurken; sessizlik kapısı) → sunucu aynı odadaki, sesi kapatmamış herkese iletir (saniyede en fazla 25 paket) → WebAudio ile ~80 ms tamponla çalınır. Oyun bağlanabiliyorsa ses de gider.
- Mikrofon kapalıyken de diğerleri duyulur; yeni "🔈 Duy: Açık/Kapalı" düğmesi gelen sesi keser (sunucu da yollamaz). Konuşanın adı "🔊 ad" olarak görünür. Mobilde ses düğmeleri hep görünür; dokunmatikte 🎤 Kapalı ↔ Açık mikrofon.
- Değişti: js/chat.js (eşler arası WebRTC kaldırıldı), server.js ('va' ses aktarma, 'vm' gelen sesi kapat; 'vs' sinyali artık kullanılmıyor), css/style.css, index.html (build 0140, 60 ?v), tests/run.cjs, package.json. Eklendi: tests/voice.cjs (iki gerçek tarayıcı, sahte mikrofon; 7 kontrol).
- Test: npm test baştan sona PASS (çıkış 0, 149 PASS, 0 FAIL); voice 7/7 (iki tarayıcı: bas-konuş, açık mikrofon, Duy kapalı/açık, mikrofon kapatma).
- NOT: server.js değişti → yan bilgisayarda GUNCELLE.bat; oyuncular Ctrl+F5 (eski sürümdeki oyuncu yeniyi duyamaz). Kulaklık önerilir (hoparlörde yankı yapabilir).
- Yedek: _yedek/claude-0140/

### 2026-10-20 02:30 · Claude · build 202610200230 zombi-dede-admin-v1
- İşlem: Berkan isteği: komut satırından adminlik; açık dünya çok boş → Minecraft zombileri; DEDE slot düşme animasyonu, dede donu ile 10 bedava çevirme, bedava çevirme satın alma (10 × bahis).
- Eklendi: admin.cjs + ADMIN.bat (`ADMIN.bat ver/al/liste <kullanıcı>` → data/admins.txt). Sunucu admins.txt'yi 3 sn'de bir okur, bağlı oyuncunun admin düğmesi yeniden bağlanmadan açılır/kapanır ('admf'). İnternetten (tünel başlığı olan) bağlantı hiçbir zaman "yerel admin" sayılmaz.
- Eklendi: açık dünyaya 120 yaban Minecraft zombi sürüsü (2-4'lük, toplam 361 zombi; mob sayısı 348 → 709). Ayrı tohum, OW.mobs SONUNA eklenir: eski kamp mobları aynı sırada (çevrimiçi eşleme bozulmaz, testte parmak izi). Köye, kampların ve engellerin üstüne düşmez. Minecraft modeliyle çizilir, 9 m'ye yaklaşanı sürü halinde kendiliğinden kovalar, köye (30 m) girince bırakır; ölünce kısa ceset. Mini haritada küçük nokta, büyük haritada yok.
- Değişti: Minecraft modelinin ragdoll'u her modda kısa cesede düşer (açık dünyada insan iskeleti arayıp çökmesin); ceset zemin yüksekliğinde devrilir.
- Değişti (DEDE): dönen/bulanık makara yerine düşme animasyonu (eski taşlar aşağı düşer, yenileri yukarıdan; sütunlar alttan üste dolar, hepsi neredeyse aynı anda; kazanan taşlar patlar, üsttekiler kayar). Scatter = dede donu; 4+ don → 10 bedava çevirme (eskiden 15), bedava çevirmede her çevirme tahtada oynanır, üstte sayaç/çarpan/toplam. "BEDAVA ÇEVİRME AL" üstte: fiyat 10 × bahis, iki kez bas onayı. Yeni replikler don-1/2, satin-1/2. Dar telefonda (≤560 px) sayfa ekrana sığar.
- Ekonomi: satın alınan tur fiyatının ~%96'sını geri verir (simülasyonla ayarlı, ort. 9,6× bahis); doğal tur ~26× bahis ve artık ~1/209 çevirmede (eskiden ~1/398). Ana RTP katmanlı tahminle %96,46, düz 1M %96,60. Düşüşle gelen yeni taşlarda çarpan küresi yok (zaten sayılmıyordu).
- Değişti (test): tests/casino-rtp.cjs kapısı katmanlı tahmin (düz simülasyon jackpot yüzünden ±%1,3 oynuyordu) + satın alma RTP kapısı (%95–97,5).
- Çıkarıldı: DEDE'de bulanık makara dönüşü (Berkan: "dönme getirme").
- Dosyalar: admin.cjs, ADMIN.bat, server.js, js/admin.js, js/world.js, js/owui.js, js/wave-corridor-visuals.js, assets/casino/dede/index.html, index.html, OKU-BENI.txt, docs/casino/BENIOKU.md, tests/admin-cli.cjs, tests/ow-zombies.cjs, tests/casino-rtp.cjs, tests/casino-dede.cjs, tests/run.cjs
- Test: npm test baştan sona PASS (çıkış 0, 173 PASS, 0 FAIL); yeni: admin-cli 8/8 (internetten giren admin değil, ver/al 3 sn içinde, yanlış ad reddi), ow-zombies 10/10 (eski mob parmak izi aynı, yerleşim, model, kovalama, köyde bırakma, ceset, ganimet), casino-dede +5 (satın alma onayı/10× düşüş/kazanç, yetersiz bakiye, 4 don ile doğal tetik), casino-rtp katmanlı %96,46 + satın alma %96,32. Gerçek iOS Safari ve gerçek telefon denenmedi.
- NOT: server.js değişti → bu bilgisayarda DURDUR.bat sonra SUNUCU-INTERNET.bat; oyuncular Ctrl+F5. Yan bilgisayar: GUNCELLE.bat (sonra).
- Yedek: _yedek/claude-0230/

### 2026-10-20 11:35 · Claude · build 202610201135 kumarhane-canli-v1
- İşlem: Berkan isteği: kumarhaneye Plinko ve Sweet Bonanza tarzı oyunlar ("bunları da ekle") + canlı, çok oyunculu blackjack ("aktif biri varsa masaya katılabilir, turunu bekler").
- Eklendi: assets/casino/lokum/index.html — LOKUM şeker slotu (6×5, 8+ her yerde öder, düşme; 4+ pamuk şeker = 10 bedava çevirme; bedava çevirmede 2×–100× çarpan şekerleri; "Şansı 2× yap" bahis +%25; satın alma 100 × bahis). Doğal motor, büyük ölçümle RTP normal ~%96,5 / şans 2× ~%96,6 / satın alma ~%96,3.
- Eklendi: assets/casino/civi/index.html — Çivi Topu (Plinko tarzı): risk düşük/orta/yüksek, 8–16 sıra, özgün 27 çarpan tablosu (kesin RTP %95,9–97,0), manuel/otomatik, çoklu top; ödeme çizimden bağımsız.
- Eklendi: server-blackjack.js + Kumarhane → Canlı Blackjack 🃏 — 3 masa (min ₺10/₺100/₺1.000), 5 koltuk, izleyici; bahis 12 sn, sıra 15 sn (dolunca otomatik dur), el ortasında gelen sıradaki eli bekler; çek/dur/2× katla/böl; 6 deste, S17, BJ 3:2; kartları sunucu dağıtır. Para: bjok ile düşer, bjpay ile eklenir; koparsa kazanç hesapta bekler, sonraki girişte verilir. Krupiye çizimi özgün (normal krupiye yeleği).
- Değişti: js/casino.js DEDE iframe kodu genelleştirildi (DEDE/LOKUM/Çivi Topu aynı API); yeni sekmeler; js/mp.js canlı masa mesajları; server.js masa modülü bağlandı; css masa ve iframe stilleri.
- Çıkarıldı: yok. Gerçek marka adı/görseli kullanılmadı (Sweet Bonanza, Plinko).
- Dosyalar: assets/casino/lokum/index.html, assets/casino/civi/index.html, server-blackjack.js, server.js, js/casino.js, js/mp.js, css/style.css, index.html, OKU-BENI.txt, docs/casino/BENIOKU.md, tests/casino-games.cjs, tests/live-blackjack.cjs, tests/run.cjs
- Test: npm test baştan sona PASS (çıkış 0; 209 PASS + http 5/5, 0 FAIL). Yeni: casino-games (Çivi Topu 27 tablo kesin RTP, LOKUM katmanlı RTP 3 yol, oyun içi para/satın alma/şans 2×/sekme/oto), live-blackjack 20/20 (ham 3 oyuncu: sıra, bekleme, kurallara uygun ödeme, süre dolunca dur, kopanın kazancı girişte + tarayıcıda oturup oynama). İlk koşuda http testi yeni sunucu modülünü kopyalamadığı için düştü; test kopyalama listesi düzeltildi, tam koşu yeniden yapıldı. Gerçek telefon ve iki gerçek kişiyle canlı masa denenmedi.
- NOT: server.js ve yeni server-blackjack.js → sunucuyu yeniden başlat (DURDUR.bat, SUNUCU-INTERNET.bat); oyuncular Ctrl+F5.
- Yedek: _yedek/claude-1135/

### 2026-10-20 12:25 · Claude · build 202610201225 cihaz-pc-v1
- İşlem: Berkan: "bilgisayarda mobil görünüm var, bilgisayarı mobil sanıyor".
- Neden (Berkan'ın Chrome'unda ölçüldü): navigator.maxTouchPoints = 10 (Windows'ta dokunmatik/kalem sürücüsü), ana işaretçi fare (pointer: fine). Oyun "dokunma desteği varsa mobil" diye bakıyordu.
- Değişti: js/core.js — mobil yalnız ANA işaretçi parmaksa (pointer: coarse); elle seçim localStorage 'npng_cihaz' ve adres ?cihaz=pc / mobil / oto. js/views.js — Ayarlar → Mobil → "Cihaz türü" (Otomatik / Bilgisayar / Mobil, Uygula sayfayı yeniler).
- Eklendi: yok (ayar seçeneği dışında). Çıkarıldı: yok.
- Dosyalar: js/core.js, js/views.js, index.html, server-hit-collision.bin (core.js değişti → yeniden üretildi, geometri birebir aynı), tests/mobile.cjs, tests/casino-dede.cjs
- Test: npm test baştan sona PASS (çıkış 0; 211 PASS + http 5/5, 0 FAIL). mobile +2 (Berkan'ın PC'si gibi maxTouchPoints 10 + fare → bilgisayar; ?cihaz=mobil kalıcı, Ayarlar → Otomatik ile geri). Önceki koşuda: çarpışma verisi yenilenmemişti (yenilendi); casino-dede ses kontrolü yük altında 404 geç gelince iki aşamayı karıştırıyordu (her aşama kendi cevabını bekliyor, ayrı cümleler); smoke bir kez OYNA tıklamasında zaman aşımına düştü, tek başına ve son tam koşuda geçti. Gerçek dokunmatik ekranlı bilgisayarda sonuç Berkan'ın Chrome ölçümüne göre tahmin: pointer fine → bilgisayar.
- Yedek: _yedek/claude-1225/

### 2026-10-20 13:20 · Claude · build 202610201320 inli-cinli-v1
- İşlem: Berkan: Kimi'nin backrooms/korku modunu ekle ("prototip, test amaçlı, ticari hedef yok, ekle gitsin"). kimi/inli-cinli dalı (onaysız, PR'sız yapılmıştı) main'e birleştirildi.
- Eklendi (Kimi): Inlı Cinlı korku modu (js/horror.js, server-horror.js): haritalar Backrooms / Lego / Starttrack, canavarlar, el feneri, stamina, çıkış kapısı +1000 TL, sınırsız co-op; assets/horror/*; tests/horror.cjs, horror-open.cjs.
- Birleştirme (Claude): index.html/server.js/run.cjs/http.cjs/style.css çakışmaları iki taraf korunarak çözüldü (LOKUM/Çivi/Canlı BJ/cihaz düzeltmesi duruyor); eski hesaptan atılan bağlantı korku odasından da çıkarılıyor (HORNET.leave).
- NOT: Model lisansları belirsiz (CS:GO haritaları, Momo, Slenderman); Berkan prototip/ticari değil diye kabul etti. Repo herkese açık.
- Dosyalar: js/horror.js, server-horror.js, assets/horror/*, docs/horror/*, index.html, server.js, js/main.js, css/style.css, tests/run.cjs, tests/http.cjs, tests/horror*.cjs
- Test: npm test baştan sona PASS (çıkış 0; 230 PASS + http 5/5, 0 FAIL; horror ve horror-open dahil). Backrooms açılış görüntüsü test-results/ic-ingame.png.

### 2026-10-20 17:45 · Claude · build 202610201745 lobi-oda-v1
- İşlem: Berkan isteği: Inlı Cinlı haritası büyüsün, harita dışında doğma olmasın, bu modda çift zıplama ve kanca kapalı, Momo/Slenderman yürüme animasyonu; her co-op mod için lobi listesi, oda kodu, şifreli lobi, arkadaşın lobisine katılma/davet, lobidekiler birbirini görsün.
- Değişti (js/horror.js): harita yatayda 1,6×, dikeyde 1,15×; çarpışma/gezinme aynı ölçekte. Sınır = dış duvarların içi (eski gezinme verisinde duvar dışına taşan hücreler vardı → harita dışında doğma). Doğma yalnız sınır içindeki boş hücrelerde; oyuncu/canavar dışarı çıkamaz, düşen geri konur. Canavar yürüyüşü: iskelet yok → parçalar model uzayına pişirildi, köşe gölgelendiricisinde bacak kalçadan, kol omuzdan sallanır; adım gerçek yer değiştirmeye bağlı, durunca durur; her canavarın kendi malzemesi.
- Değişti (js/player.js): modeNoAir() — Inlı Cinlı'da çift zıplama ve kanca yok.
- Eklendi: server-rooms.js (şifre yalnız özetle, davetli şifresiz), server.js 'rl' lobi listesi + 'rinv' davet + arkadaş listesinde oda bilgisi; js/rooms.js (LOBİLER penceresi, kodla bul, şifre sorma, davet bildirimi, oyunda oda paneli 👑); lobide LOBİLER düğmesi; Inlı Cinlı/Koridor oda ekranlarında şifre alanı + AÇIK LOBİLER; arkadaş listesinde Katıl/Davet.
- Dosyalar: js/horror.js, js/player.js, js/rooms.js, js/owmp.js, js/wave-corridor-game.js, server.js, server-rooms.js, server-horror.js, server-wavecorridor.js, index.html, css/style.css, tests/rooms-lobby.cjs, tests/http.cjs, tests/run.cjs
- Test: npm test baştan sona PASS (çıkış 0; 246 PASS + http 5/5, 0 FAIL). Yeni rooms-lobby 16/16: şifreli oda listede kilitli, şifre düz saklanmaz, şifresiz/yanlış giriş reddi, davetli şifresiz girer, yalnız arkadaş davet edilir, arkadaş listesinde oda; tarayıcıda LOBİLER→şifre→oda paneli; Inlı Cinlı 1,6× harita, 250 doğma hücresinin hepsi içeride, dışarı çıkılamaz, çift zıplama/kanca kapalı, canavar yürüme salınımı.
- NOT: sunucu değişti → yeniden başlat; Ctrl+F5.
- Yedek: _yedek/claude-1745/

### 2026-10-21 00:10 · Claude · build 202610201510 inli-harita-v2
- İşlem: Berkan: Inlı Cinlı'da takım arkadaşları silah modeli (holografik silah skin paketi) olarak görünüyordu; harita hâlâ küçük, zıplayarak haritadan çıkılabiliyor.
- Değişti (js/horror.js): takım arkadaşı = envanterde seçtiği karakter + elindeki silah (mkHuman/CHAR, ic_state ve anlık görüntüye ch/w), yürüme animasyonu; harita 2,6× (yükseklik 1,5×); duvar çarpışması en az 9 m (zıplayarak aşılamaz). server-horror.js ch/w alanlarını süzerek iletir.
- Dosyalar: js/horror.js, server-horror.js, index.html, tests/rooms-lobby.cjs
- Test: npm test baştan sona PASS (çıkış 0; 246 PASS + http 5/5). Ek kontrol: takım arkadaşı c1 karakteriyle tüfekli insan modeli; 300 zıplamada en yüksek 1,25 m, harita içinde.
- Yedek: _yedek/claude-1510/
