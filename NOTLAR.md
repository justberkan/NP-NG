# N.P.N.G — Durum Raporu ve Devir Notları

Bu dosya projede çalışan her yapay zekâ (Claude, ChatGPT/Codex) ve insan için ortak hafızadır.
**İşe başlamadan önce oku. İş bitince "Değişiklik günlüğü" bölümüne kısa bir kayıt ekle.**

Son güncelleme: 17.10.2026, Kimi — Claude'un yasal-v1 patch'i entegre edildi (build `202610170400 · yasal-v1`)

---

## 1. Proje özeti

- Tarayıcı tabanlı FPS (Krunker.io tarzı), ileride Electron ile EXE olacak.
- Three.js r128, düz `<script>` dosyaları (derleme yok, modül yok, tüm fonksiyonlar global).
- Sunucu: `server.js` (Node, ek paket yok). Hem dosyaları (HTTP) hem oyuncu bağlantılarını (WebSocket) sunar. Port 3000.
- Başlatma: `SUNUCU-BASLAT.bat`. Sunucu dosyaları `Cache-Control: no-store` ile verir, JS değişiklikleri için sunucuyu yeniden başlatmak gerekmez. `server.js` değişirse gerekir.
- Proje sahibi: Berkan. Kod bilgisi yok, test edip geri bildirim veriyor. Türkçe, kısa ve dürüst iletişim istiyor.

## 2. Çalışma kuralları (proje sahibinin kuralları)

1. Türkçe yaz. Kısa ve dürüst ol, özür döngüsüne girme.
2. Doğrulamadan "oldu" deme. Mümkünse ölç ve ekran görüntüsü al.
3. **Build etiketi:** `index.html` sonunda `build YYYYMMDDHHMM · konu-vN` yazar. Her değişiklikte artır. Aynı değeri tüm `?v=` sorgularına da yaz (tarayıcı önbelleği).
4. **Yedek:** bir dosyayı değiştirmeden önce eski halini `_yedek/<tarih>_<konu>/` altına kopyala.
5. Kod yorumları Türkçe.
6. Gerçek kulüp arması, kulüp adı, sponsor logosu ya da başka markalar oyuna girmez (hukuki risk; oyun çevrimiçi ve mağazada satış var).
7. `data/` klasörü (hesaplar, şifre özetleri) repoya girmez.

## 3. Dosya düzeni (önemliler)

| Dosya | İçerik |
|---|---|
| `index.html` | Script sırası ve build etiketi. Yeni JS dosyası eklersen buraya da ekle. |
| `js/core.js` | Sahne, arena kutuları, çarpışma (`hitBox`, `groundAt`, `PR`, `boxPen`), ses, kayıt (`SV`). |
| `js/settings.js` | Ayarlar (`SET`, `SETDEF`), video/nişangah uygulayıcıları. |
| `js/weapons.js` | Silah tablosu `WP`, karakter listesi `CHARS`, formalar `FORMS`, `CHAR()`, silah tutuşu/poz, birinci şahıs el modeli (`FPH`). |
| `js/player.js` | Oyuncu hareketi (`stepPlayer`), girdi, kamera (`updPlayerView`). |
| `js/combat.js` | Ateş, saçılım, geri tepme, hedefler. |
| `js/main.js` | Ana döngü (sabit 120 Hz fizik + kamera ara kare yumuşatma), duraklatma menüsü. |
| `js/glbrig.js` | GLB karakterler (asker + 13 kahraman), iskelet eşleme, **forma boyama sistemi**. |
| `js/optics.js` | Nişangahlar, ADS yakınlaştırma (`optZoom`), ekrandaki kırmızı nokta. |
| `js/catalog.js` / `models.js` | Silah GLB katalogu, tutuş noktalarının modelden otomatik bulunması (`mdlGrips`). |
| `js/shop.js`, `ui.js`, `views.js` | Mağaza, envanter, lobi ekranları, ayarlar paneli. |
| `js/mp.js`, `owmp.js` | Çevrimiçi (arena/5v5/zombi) ve açık dünya çok oyunculu. |
| `assets/*.js` | GLB modeller base64 olarak (`NPNG_G[id]`). `ch_*` karakter, `lg_/ap_/kn_/sw_` silah, `map_*` harita, `fp_hands` el modeli. |

## 4. Bu oturumda yapılanlar (Claude, 15–17.10.2026)

### Ayarlar ve nişan
- ESC menüsüne **AYARLAR** eklendi (oyun içinden Oyun/Nişangah/Video/Mobil sekmeleri). `views.js: setV(ig)`, `wireSettings`, `igsOpen`.
- Ekranda kırmızı nokta artık her zaman çiziliyor (`optics.js: optHud`). Eskiden sadece 3B modeldeydi, görünmüyordu.
- `SET.adsZoom` (varsayılan 0.5): nişan yakınlaştırma oranı. Dürbünlerde en az 0.6.
- Nişanda silah öne ve aşağı alındı (`weapons.js: ADS_ILERI`, `ADS_ALT`), ekranın ortasını kapatmıyor.

### Hareket (player.js) — ölçülerek ayarlandı, keyfi değiştirme
- Koşu 5.25 m/s, karşı tuşla durma 0.05 sn (CS/Valorant hissi).
- **Bhop:** `BH_GRACE=.1` (inişten sonra 0.1 sn sürtünme yok), Space basılı tutunca otomatik bhop (`SET.autoHop`).
- **Hava strafe:** `AIR={acc:80,cap:1.8,ignoreW:true}`. Eski değer (26) sadece yavaş fare dönüşünde hız kazandırıyordu. A/D basılıyken düz hava kontrolü kapalı.
- `HOP_CAP=11.5`, havada en yüksek hız 13.5.
- **Kutu kenarları:** zemin desteği oyuncu yarıçapı kadar genişletildi (`core.js: PR`), kenar şeridinde kilitlenme çözüldü (`canMove`, `boxPen`). Basamak: yerde 0.45 m, havada 0.75 m (`STEP_G`, `STEP_AIR`).
- **Tırmanma:** sadece kamera duvara bakarken (±45°) ve W basılıyken. Alçak kutularda tırmanma yok.
- **Duvarda koşma:** havada, duvar hangi taraftaysa o yön tuşu (sol: A, sağ: D). Yumuşak hizalama (`WR_BLEND=5`), yerçekiminin %80'i kesik (`WR_GRAV`), kamera 8° eğilir. Duvarda iken hava strafe'i kapalı (`wrTry`).
- **Eğilme:** Ctrl/C basılı. Hız %50, göz 1.1 m. 6.2 m/s üstünde basınca kayma. Ağ paketinde bit 2 (`f&2`), diğer oyuncular görür. Not: tarayıcıda Ctrl+W sekmeyi kapatır, C tuşu önerilir.
- Süzülme sadece 0.9 sn'den uzun düşüşte (autohop ile çakışmasın diye).
- Kamera ara kare yumuşatma: `main.js` (`p.ox/oy/oz`).

### Silahlar
- Saçılım %30 daha toplu: `combat.js: SPREAD_K=.7`. Yerde eğilince ayrıca ×0.8.
- **Mozambique (`m_moz`) gizlendi:** tutuş noktası güveni 0.3, sol el silaha değmiyordu. `catalog.js: WM_HIDE`. Kayıt silinmedi (envanter/pazar bozulmasın), satılmaz/kuşanılmaz. Diğer Apex silahları ölçüldü, eller oturuyor.
- **Birinci şahıs eller:** `assets/fp_hands.js` (FPS Military Hands, Electrogamer777, CC-BY). Kemiksiz model; yumruk tutuş noktasına konur, önkol silaha göre yönlenir (`FPH.dR/dL`, `bR/bL`). Yüklenemezse eski kutu kollar.

### Formalar (glbrig.js + weapons.js + shop.js)
- Karakterden bağımsız aksesuar: `SV.eq.f` (`f1` Kartal, `f2` Aslan, `f3` Kanarya, `f4` Ay-Yıldız). Mağazada "Formalar" sekmesi, envanterde "Forma" yuvası, "Formasız" (`f0`) ile çıkarılır.
- Ağda karakter kimliğine eklenir: Ada + Kartal = `h8x1` (`CHAR()` çözer, `chWithKit()` üretir). Sunucu 8 karakterlik kimlik kabul ediyor, sunucuya dokunulmadı.
- Boyama: karakterin kendi dokusunda, vücut bölgesine göre (belden boyna + kısa kol). `kitPaintMap`, `kitFrame`, `kitArm`. Saç/yüz/göz vb. `KIT_SKIP` ile atlanır. Askerde yelek gizlenir (`KIT_HIDE`).
- Teknik tuzaklar (değiştirmeden önce oku):
  - Kahraman modellerinde UV'ler sıkıştırılmış (Uint16 normalize). `kitUV` çözer.
  - Kahramanlarda vücut çerçevesi **ters bağlama matrislerinden** (parçanın kendi uzayı) hesaplanır. Askerde (Character Creator) dünya uzayı yöntemi kullanılır (`kitRestW`, `kitFrameW`). İkisi karıştırılırsa desen yatay/yanlış çıkar.
  - İleri yön: kalça kemiği dönüşümüyle şablon dünyasındaki +Z.
- Eski sürümde forma karakter olarak satılmıştı (`k1`–`k4`); `core.js` açılışta `f1`–`f4`'e çevirir.

## 5. Test yöntemi

Claude testleri Playwright + başsız Chromium ile yaptı: oyun yerelde `node server.js` ile açılır, sayfada `stepPlayer(1/120)` doğrudan çağrılarak hareket ölçülür (koşu hızı, bhop hız dizisi, kenar testi, duvar koşusu süresi), sonra ekran görüntüsü alınır. Bu test betikleri henüz repoda değil; eklenecek (`tests/`).

Referans ölçümler (değişiklikten sonra bunlar bozulmamalı):
- Koşu: 5.25 m/s. Bhop (Space basılı, fare dönüşü): 8.8 → 11.7 → 13.5 m/s.
- 3 m'lik kutuya tırmanma: ~1.1 sn, üstüne çıkar.
- Kutu kenarına iniş: kutunun üstünde kalır, her yöne çıkabilir.
- Duvar koşusu (4 m duvar, A basılı): ~1.1 sn, hız ~7.4 m/s korunur.

## 6. Açık işler (Berkan'ın sırası)

1. **Adım 2:** silah hissi, geri tepme ve sesler.
2. Silah tutuşu: üçüncü şahısta eller, dipçik omuzda, iç içe geçme olmasın. Nişanda sol el tüfeklerde 10–15 cm geride (birinci şahısta kollar nişanda gizli olduğu için şimdilik görünmüyor).
3. Kılıç kombinasyonları ve vuruş pencereleri.
4. Aim Training: tüm silahlar rafta, gerçek hedefler, loadout yok (loadout sadece `zom`/`zo`).
5. CS 1.6 tarzı 5v5 satın alma menüsü (başlamadan Berkan'dan referans görüntü iste).
6. Duruş animasyonları.
7. Formalar: Kara Dul'da desen zayıf; ilk görünüşte 0.2–0.7 sn çizim takılması (Web Worker'a taşınabilir); birinci şahıs el kollarına forma rengi; oyuncu numarası/nick seçimi.
8. Uzun vadeli: çevrimiçi altyapı (gecikme telafisi, oda yönetimi, 30/60 Hz tick), Unturned tarzı hayatta kalma, yarış modları, MMORPG modu (ayrıntılar Berkan'ın talimat dosyasında).

## 7. Değişiklik günlüğü

Her iş sonunda bir satır ekle: tarih · kim · build · ne değişti · dokunulan dosyalar.

- 16.10.2026 09:31 · Kimi · `202610170500 s12p8-v1` · **S12P8 mağaza ikonu baş aşağı duruyordu:** GLB modeli ters yükleniyor, otomatik tespit (models.js flipY sezgiseli) bunu yakalayamıyordu. P90'daki gibi elle düzeltme listesine eklendi: `MDLFLIPY={lg_fn_p90:1,lg_s12p8:1}` — model yüklemede 180° Z çevrilmesi tüm kullanımlara (ikon + oyun içi) uygulanır. Doğrulama: mağaza Pompalı sekmesi ekran görüntüsüyle karşılaştırıldı, S12P8 artık diğer pompalılarla aynı yönde; tests/run.cjs 19 PASS / 0 FAIL. · models, index
- 16.10.2026 08:59 · Kimi (Claude'un patch'i) · `202610170400 yasal-v1` · **Claude'un `claude-bekleyen.patch` dosyası uygulandı** (Masaüstü'den, Kimi entegre etti): lobi arka planına neon "KAPALI BETA" yazısı; ilk açılışta yasal bilgilendirme onayı (cihaz başına bir kez, `npng_legal_v1`); kumarhaneye 18 yaş onayı (hesap verisinde `SV.casOk`); market/pazar sekmesi gezinme ve ayarlardan gizlendi; silah kaplamaları artık GLB modellere de uygulanıyor (`skinTint`); iskeletli modellerde ikon sığdırma düzeltildi (`mdlBox` — kemik konumlarına göre kutu, boş model önbelleğe yazılmıyor); mağaza ikonları GLB yüklenmeden çizilmiyor. **Birleştirme notu:** patch kontroller-v1 öncesi tabana göre hazırlandığı için `views.js` (Pazar sekmesi kaldırılırken Kontroller sekmesi korundu) ve `css/style.css` (kb2 stilleri korundu) elle birleştirildi; `tests/lobby-atmosphere.cjs`'e yasal kapı adımı eklendi (Claude smoke.cjs'i güncellemişti, bu testi atlamıştı). Doğrulama: tests/run.cjs 19 PASS / 0 FAIL; tarayıcıda yasal kapı, kumarhane onayı + kalıcılık, neon yazı, Kontroller sekmesinin durduğu doğrulandı. · index.html, css/style, main, casino, models, shop, ui, views, weapons, tests/smoke.cjs, tests/lobby-atmosphere.cjs

- 16.10.2026 06:05 · Kimi · `202610170300 kontroller-v1` · **Kontroller (tuş atama) özelliği** (Berkan'ın 05:48 onayıyla): Ayarlar'a "Kontroller" sekmesi; 31 eylem için ana + yedek tuş, fare tuşları dahil; aynı tuş birden çok eyleme verilirse uyarı; "Varsayılana dön"; localStorage'a kalıcı kayıt (`mmofps_kb`). Tuş okuma artık `js/controls.js` eşlemesinden yapılıyor; oyun davranışı değişmedi. Yedekler `_yedek/kontroller/` altında. Doğrulama: tests/run.cjs 19 PASS / 0 FAIL; başsız tarayıcıda atama, çakışma uyarısı, fare tuşu, kalıcılık, varsayılana dönüş test edildi. Not: main/ui/mp/maps/glbrig'te klavye okuması yok ya da sistem tuşu (Escape, giriş ekranı Enter) olduğundan dokunulmadı; ateş/nişan farede sabit kaldı; ayarlar altındaki HELP metni güncellenmedi. · controls.js (yeni), player, skills, chat, loadout, ow2, views, index.html, css/style

- 16.10.2026 05:50 · Claude · `202610170205 yakinda-v1` · Mod ekranına YAKINDA kartları (Yarış, Çarpışan Araba, İt Dalaşı, Zombi: Hayatta Kalma, Zombi Direnişi 2 — tıklanmaz); ikonu olmayan Zombi Co-op/5v5 Online/Açık Dünya kartlarına ikon. Takılma ölçer: FPS göstergesi 'en uzun X ms' gösteriyor, 25 ms üstü kareler sebebiyle (mantık/çizim/tarayıcı) `NPNG_TAKILMA` dizisine yazılıyor (F12 konsolda okunur). · index, css/style, ui, main, settings

- 16.10.2026 04:55 · Claude · `202610170204 fps-v3` · Berkan akıcılık kötüleşti dedi. Dust2 ölçümü: kod eski sürümden ~2.7 kat hızlı (çizim 20.6→7.7 ms, çağrı 267→150). Akıcılığı bozan: önündeki uzak botların animasyonu seyreltiliyordu (poseRate önde 1/2 + glbrig 35/70 m sınırı). Görüşteki karakterler artık her karede; seyreltme yalnız arkadakilerde. · rig, glbrig, index

- 16.10.2026 04:40 · Claude · `202610170202 pose-v1+fps-v2` · **FPS optimizasyonu** (başka ajanın `isabet-v1` iz havuzu/kuaterniyon havuzu/ultra ön ayarıyla birleştirildi). (1) GLB klonlarında her parça ayrı iskelet alıyordu → askerde karakter başına 23 kemik dokusu yüklemesi; aynı kemik listesi tek iskeleti paylaşıyor (`glbShareSkel`). (2) Aynı malzemeli parçalar tek mesh (`glbMergeParts`): asker 23→10 çizim çağrısı. (3) Goblinin 19 küpü tek skinned mesh (`gobMerge`): 19→1. (4) Animasyonlar fizik alt adımı başına değil karede bir kez (`main.js ANQ`); düşük FPS'te iş yükü katlanmıyor. (5) Görüş dışı karakterlerin kemik/IK hesabı ve çizimi atlanıyor; karar çizimden hemen önce güncel kamerayla (`glbCullPass`), hızlı dönüşte geç belirme yok. 35/70 m ötesinde kemik güncellemesi 60/30 Hz. (6) Parmak pozu yalnız değişince. (7) Mob uzaklaşınca PAYLAŞILAN model geometrisi siliniyordu (yeniden yükleme takılması) → yalnız mobun kendi geometrisi siliniyor. (8) Mob oluşturma ve zombi dalgası kareye yayıldı. (9) Maç başında shader ön derleme + ses bağlamı (ilk vuruş takılması). (10) Gölge haritası en fazla 60 Hz. (11) Mob etiketleri/nişan HUD'u yalnız değişince DOM'a yazıyor; kombo ve ekran parlamasındaki `offsetWidth` zorla sayfa düzenlemeleri kaldırıldı (vuruş başına takılma). (12) FPS sınırı 360/500 eklendi, yüksek sınırlarda çalışmayan sınırlayıcı düzeltildi. (13) `OYNA-SINIRSIZ-FPS.bat`: Chrome/Edge V-Sync ve kare sınırı kapalı açar. Ölçüm (yazılımla çizen test makinesi, ms/kare ort.): 5v5 217.9→9.0, zombi 17.8→2.8, açık dünya 8.0→5.8; çizim çağrısı 5v5 247→115, açık dünya 274→56, zombi 132→77. Testler: run.cjs hepsi geçti; first-person.cjs (zaman aşımı) ve weapons.cjs (m_awm/m_moz sol el hatası) ESKİ sürümde de aynı şekilde başarısız. Diğer ajanın aynı anda eklediği `poseRate` (rig.js) ile uyumlu, birlikte test edildi. · glbrig, main, fingers, newchars, world, combat, combo, skills, weapons, settings, views, owui, optics, index, OYNA-SINIRSIZ-FPS.bat

- 16.10.2026 03:15 · Claude · `202610170104` · **Açık dünyada donma düzeltildi:** goblin ölünce `newchars.js` GLBDEAD'e farklı yapıda kayıt ekliyordu; `glbrig.js: glbDeadUpdate` onu insan ragdoll'u sanıp `rgPose`'ta hata fırlatıyor, `main.js` döngüsü her karede çizime ulaşamadan duruyordu. Goblin ölüm animasyonu (`gobDeadStep`) yazıldı, ölü beden güncellemesi try/catch ile korundu, ana döngüde `tick` hatası artık çizimi durdurmuyor (`loopErr`). Test: açık dünyada otomatik savaş 40 sn, 3 goblin öldürüldü, 0 hata, en uzun kare 35 ms · glbrig, main, index

- 17.10.2026 · Claude · `202610170100 forma-v2` · Formalar tüm karakterlere aksesuar oldu · glbrig, weapons, shop, ui, core, player, mp, owmp, lobby3d
- 17.10.2026 · Claude · `202610170000 forma-v1` · Asker için ilk forma denemesi
- 16.10.2026 · Claude · `202610162300 duvar-v1` · Duvar koşusu yeniden yazıldı · player
- 16.10.2026 · Claude · `202610162200 eller-v1` · Birinci şahıs el modeli · weapons, views, assets/fp_hands.js
- 16.10.2026 · Claude · `202610162100 egilme-v1` · Eğilme, saçılım %30, Mozambique gizlendi
- 16.10.2026 · Claude · `202610162000 kenar-v1` · Kutu kenarı takılması · core, player
- 16.10.2026 · Claude · `202610161930 bhop-v2` · Hava strafe ivmesi · player
- 16.10.2026 · Claude · `202610161900 hareket-v1` · Bhop toleransı, autohop, tırmanma, kamera yumuşatma
- 16.10.2026 · Claude · `202610161810 ads-v2` · Nişanda silah konumu
- 16.10.2026 · Claude · `202610161800 ayarlar-v1` · Oyun içi ayarlar, kırmızı nokta

- 16.10.2026 05:03:19 · Codex · C1 EXE v0.1.0 (oyun etiketi teslimde 202610170204) · IS_PLANI.md gereği yalnız electron/ altında Electron kabuğu ve 111 MB NSIS kurulum hazırlandı. Yerel/link seçimi, beş performans anahtarı, tam ekran ve fare kilidi; 4/4 politika testi, geliştirme ve paketlenmiş EXE lobi/maç/F5/Ctrl+W testleri PASS, gameErrors=[] ve GPU etkin. Oyun kodu dosyalarına yazılmadı. Çıktı: electron/dist/NPNG-Kurulum-0.1.0-x64.exe; ayrıntı electron/DEVIR_C1.md ve electron/OKU-BENI.txt. Durum: BERKAN FPS/Hz kabulü bekleniyor; C2–C3 bunun ardından.
- 16.10.2026 05:15 · Kimi · `202610170204 (ölçüm)` · **K1 gerçek cihaz QA:** 5 modda hareket+ateş senaryolu FPS ölçümü yapıldı (başlı Chrome, gerçek GPU). Sonuçlar docs/QA_RAPORU.md: aim 165 / tdm-arena 119.7 / tdm-dust2 127.3 / zombi 151.7 / açık dünya 120.1 ort. FPS; toplam 4 kısa takılma (dalga spawn anları). Sayfa hatası yok. Ölçüm betiği docs/qa/qa-olcum.cjs, ekran görüntüleri docs/qa/. Ayrıca docs/HATA_BILDIRIMLERI.md'ye küçük 403 kaydı eklendi. · yeni dosyalar: docs/QA_RAPORU.md, docs/qa/*
