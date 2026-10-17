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
