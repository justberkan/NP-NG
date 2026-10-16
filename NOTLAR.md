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

- 16.10.2026 23:55 · Claude · `202610171300 rekabetci-v1` · **Rekabetçi mod (botlarla, ilk sürüm)** — Codex'in NPNG-Rekabetci-Paketi'ne göre. Mod ekranında yeni 'Rekabetçi' kartı → Rütbesiz/Rütbeli seçimi (Rütbeli kilitli: çevrimiçi 10 oyuncu gerekir), harita seçimi, profil/derecelendirme 0/5, 21 rütbe rozeti ekranı. Rütbesiz: 5v5 bombalı raunt, MR15 (16 kazanan, 15-15 beraberlik), 15. rauntta taraf değişimi + cüzdan sıfırlama, freeze 15 sn, satın alma 30 sn, raunt 115 sn, bomba 40 sn, kurma 3,2 sn, çözme 10/5 sn (kit). Ekonomi: ₺800 başlangıç, ₺16.000 tavan, galibiyet ₺3.250 / bombalı ₺3.500, mağlubiyet serisi ₺1.400–₺3.400, kurup kaybeden T +₺800, süre dolunca canlı T ₺0, ürün bazlı kill ödülleri. Satın alma: B ile 6 dilimli menü (1–5 seç/al, 6/Esc geri), 27 ürün; bombalar (HE/flaş/sis/molotof/yem) 'yakında' (oyunda bomba sistemi yok). Yelek/kask hasarın ~%45'ini emer (denge varsayımı). Botlar da para kazanıp silah alır, bomba taşır/kurar, CT botu çözer. Bomba bölgeleri haritanın yürünebilir ağından otomatik seçiliyor (Arena sabit A/B). Maç sonu: Rütbesiz +500/300/400 XP, +₺200/100/150 hesap parası; Elo değişmez. Mevcut '5v5 Online' kartı korunuyor. Test: arena ve Dust2'de raunt sonu, oyuncu kurma, bot kurma, bot çözme, taraf değişimi, maç sonu, lobiye dönüşte loadout geri yükleme. · compet.js (yeni), main, combat, maps, index, css

- 16.10.2026 11:35 · Kimi · `202610170900 range-v1` · **Aim Training, test + ısınma alanına dönüştü** (Berkan'ın isteği): artık loadout sormadan giriliyor, tabancayla başlanıyor ve tüm silahlar sınırsız mühimmatla kullanılabiliyor. Güney duvarında **silah askısı**: 7 klasik + 56 model silah (toplam 63) asılı, bakıp E ile "seç ve dene" (js/range.js; model alımı `RANGE_MOD` üzerinden oturumluk, `SV.mod`'a dokunmaz, setW aim'de kaydetmez). Batı duvarında 8 **manken**: rastgele karakter/şampiyon/forma karışımı, E ile giy-dene, çıkışta kuşanılan geri yüklenir. Doğu tarafında **parkur**: basamaklar, tırmanma duvarı, üst platform, bhop kütükleri. Etkileşim Kontroller sekmesinden eşleşen tuşla (E) çalışır, ipucu `#rhint`. Kanca: main.js (loadout atlama + tick), combat.js (begin/setW/setupMode), catalog.js (modId RANGE_MOD önceliği), index.html, css (#rhint). Doğrulama: tarayıcıda giriş/duvar/manken/parkur/geri yükleme test edildi, ekran görüntülü; tests/run.cjs 19 PASS / 0 FAIL. · range.js (yeni), main, combat, catalog, index, css
- 16.10.2026 10:52 · Kimi · `202610170800 kilic-v1` · **Kılıç kategorileri birleştirildi** (Berkan'ın isteği): "İki El Kılıcı" kategorisi kaldırıldı; Kaplamalar'da tüm kılıçlar tek çip altında ve adı **"Büyük Kılıç"** (gsword silahının adı da "Büyük Kılıç" oldu — HUD/loadout otomatik güncellenir). Kılıç çipinden kaplama kuşanınca hem `SV.sk.sword` hem `SV.sk.gsword` yazılır (tek kategori = tek kaplama). Oyun içi silah (7 tuşu, ağır hasar) değişmedi, yalnızca adı ve mağaza düzeni. Doğrulama: tarayıcıda çip listesi ve çift yazım doğrulandı; tests/run.cjs 19 PASS / 0 FAIL. · weapons (gsword adı), shop, ui, index
- 16.10.2026 10:05 · Kimi · `202610170700 kaplama-v1` · **Kaplamalar sekmesine tüm silahlar eklendi** (Berkan'ın isteği): önceki 7 sınıf çipi (Tüfek, SMG, Tabanca…) yerine artık 7 klasik + 56 model silahın tamamı (AK-556…Barret M107, XMA-10, S12P8, Katana, Karambit…) çip olarak listeleniyor. Model silahlar artık **kendine özel kaplama** alabiliyor: kayıt anahtarı `SV.sk['m:<modelId>']`, slotun kaplamasına geri düşer (skinFor). Mağaza vitrini, ikonlar, envanter çipleri, lobi önizleme ve çevrimiçi eşitleme (mp.js sk nesnesine 'm:' anahtarları) buna göre güncellendi; `vwCls()`/`vwMid()` çözümleyicileri catalog.js'te. Satın alınmış silahlar ve mevcut kaplamalar etkilenmedi. Doğrulama: tarayıcıda S12P8'e Kızıl kaplama satın alıp kuşanıldı, kayıt ve önizleme doğrulandı; tests/run.cjs 19 PASS / 0 FAIL. · weapons (skinFor), catalog (vwCls/vwMid), shop, ui, lobby3d, mp, index
- 16.10.2026 09:40 · Kimi · `202610170600 sampiyon-v1` · **Mağazadan 4 şampiyon kaldırıldı** (Berkan'ın isteği): Taş Dev (h1), Kızıl Tilki (h2), Gölge Avcı (h3), Robot RX-9 (h4) artık Şampiyonlar sekmesinde listelenmiyor. Kayıtlar silinmedi — `off:1` bayrağı eklendi, shop.js Şampiyonlar filtresi `c.ch&&!c.off` oldu; böylece daha önce satın alanların envanteri/kuşanmış karakteri bozulmuyor. Sekme şimdi Demir Adam ile başlıyor (13 şampiyon kaldı). Doğrulama: tarayıcıda sekme ekran görüntüsüyle kontrol edildi, tests/run.cjs 19 PASS / 0 FAIL. · weapons (h1-h4), shop, index
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
- 16.10.2026 12:20 · Kimi · `202610171000 optik-v1` · **3 yeni GLB dürbün eklendi:** Modern tüfek dürbünü 4x (1.700, o7), Holosight XPS (680, o8), CYBER dürbün 4x Termal (5.600, o9). İndirilen 3 GLB (13.6/4.2/38.7 MB) gltf-transform + meshoptimizer ile sadeleştirilip (0.7/1.9/3.2 MB) `assets/op_*.js` base64 asset'ine çevrildi. `optModel` artık `mid` alanlı optiklerde GLB modeli ray üstüne oturtuyor; `mdlPreload` kuşanılan GLB optiği önceden yüklüyor; mağaza ikonu/vitrin async yüklüyor. **Termal vurgu (`thermScan`):** `th` bayraklı optikle (o6 + o9) nişan alırken takım-2 düşmanları parlak sıcak imza ile vurgulanıyor, bırakınca eski emissive değerine dönüyor; duman/sis eklendiğinde bu optikle düşmanlar görünür kalacak (mantık hazır). Doğrulama: tests/run.cjs 19 PASS; tarayıcıda mağaza 3 yeni kart + vitrin, silaha monte CYBER dürbün, ADS yeşil termal filtre + artı, 26/26 düşman mesh'i termalde parlak/bırakınca 0, sayfa hatası yok. · js/optics.js, js/shop.js, js/catalog.js, js/player.js, index.html, assets/op_scope_modern.js, assets/op_holosight.js, assets/op_scope_futur.js (yedek: _yedek/optik-v1)
- 16.10.2026 14:55 · Kimi · `202610171100 optik-v2` · **Prosedürel dürbünler kaldırıldı:** Nişangah sekmesinde artık sadece Kırmızı nokta (o0, standart) + Berkan'ın verdiği 3 GLB dürbün (o7 Modern 4x 1.700 / o8 Holosight XPS 680 / o9 CYBER 4x Termal 5.600) var; kutudan yapma o1–o6 silindi (eski kayıtlar o0'a düşer). **Aim Training'e optik bankı:** doğu duvarında 3 kaide, E ile tak-çıkar dene, çıkışta kuşanılan optik geri yükleniyor. **6 eksik GLB şampiyon eklendi:** h18 Anime Savaşçı (550), h19 Black Widow (1.000), h20 Goblin (600), h21 KB (900), h22 Lara (1.000), h23 Samus (1.500) — assets/ch_anime,bw,goblin,kb,lara,samus artık oyunda. **Yürüyüş animasyonu:** animHuman'a kalça yatay dönüşü (.14 sin), ağırlık kayması (x .024 cos), yan yuvarlanma (z .05 cos) ve omuz karşı-dönüşü (spine.y −.09 sin) eklendi; koşu/ninja/süzülme/kayma/eğilme/havada kapalı. Doğrulama: tests/run.cjs 19 PASS; tarayıcıda optik sekmesi 4 öğe, şampiyonlarda 6 yeni kart (GLB ikonlu), optik bankında E ile o7 denemesi + geri yükleme, yürüyen botta kalça salınımı ölçüldü, sayfa hatası yok. · js/optics.js, js/range.js, js/weapons.js, js/rig.js, index.html (yedek: _yedek/optik-v2)

- 16.10.2026 15:46:50 · Codex · EKONOMI-001 tasarım v1.0.0 · Berkan'ın TL 5v5 talebine göre 27 öğe/5 kategori, ₺800 başlangıç/₺16.000 tavan, seri ve bomba bonusları, 6 dilimli menü, JSON + 27 ürünlü SQLite/şema hazırlandı. docs/codex-ekonomi/README.md ve competitive-economy.v1.json; tests/economy/ altında 17/17 kabul testi PASS. Oyun koduna yazılmadı; mevcut 30-kill tm moduna bağlanmadı. Claude'a entegrasyon teslimi; Kimi animasyon işi etkilenmez.

- 16.10.2026 16:18:52 · Codex · RANK-001 tasarım v1.0.0 · Rekabetçi → Rütbesiz/Rütbeli ayrımı, bağımsız hesap XP/TL ve Elo, 5 placement, 7x3=21 kademe, +15..+30/-15..-25 sonuç/performance/skor formülü hazırlandı. docs/codex-rekabetci/README.md, competitive-rank.v1.json, player-profile.example.json, CompetitiveProfile.cs; tests/rank/19 kabul testi PASS (900 Elo/skor/performance birleşimi), C# DTO derleme/placement kontrolü PASS. Oyun koduna yazılmadı; menü henüz değiştirilmedi. Claude'a entegrasyon devri; Kimi animasyon işi etkilenmez.
- 16.10.2026 15:50 · Kimi · `202610171200 optik-v3` · **Holosight XPS düzeltildi:** model arkaya dönük takılıyordu (optModel'de y=π çevirisi + kutu sınırlarına göre oturtma). **ADS hizalama:** optik takılıyken nişangah hattı göz hizasına çekildi (ADS_ALT .045→.006, ADS_ILERI .16→.08; ölçüm: nişangah merkezden 12 pik alt). **Tekli tabancaya optik:** optOK ve optLong artık tabancayı kapsıyor; CYBER dürbün tabancada 4x scoped görünüm veriyor, mağaza açıklaması güncellendi. **Termal kırmızı vücut ısısı:** thermScan artık düşmanları sıcak kırmızı tonlarda (0xff3a10/ff2008/d81505 karışımı, emissiveIntensity 1.3) parlatıyor. Doğrulama: tests/run.cjs 19 PASS; tarayıcıda holo çevirisi çalışma anında doğrulandı, ADS nişangah hattı (638,372) merkezde, tabancada o8/o9 takıldı + zoom 1.7/4x, termalde 26/26 mesh kırmızı, sayfa hatası yok. · js/optics.js, js/weapons.js, js/shop.js, index.html (yedek: _yedek/optik-v3)

- 17.10.2026 · Codex · LOBI-ALAN-001 · Berkan için Claude'a uygulanacak ayrı lobi karakter alanı yaması hazırlandı; canlı oyun kodu değişmedi. docs/codex-lobi-yama ve Masaüstü/NPNG-Lobi-Karakter-Yamasi.zip. Tarayıcıda 9 menü x 5 genişlik = 45 PASS, lobi ölçek dönüşü PASS, 0 sayfa hatası; git apply --check PASS.

- 17.10.2026 · Codex · KASA-TASARIM-001 · Kullanici referansina gore 7 SVG kasa, responsive kart modulu, bagimsiz onizleme ve Claude entegrasyon notlari docs/codex-kasa-tasarim ve Masaustu/NPNG-Kasa-Tasarimlari-Claude-v1.zip olarak teslim. 4 ekran genisligi, 28 kart/gorsel, 7 detay acma, Escape, destroy/remount PASS; 0 sayfa hatasi. Canli oyun kodu degismedi.

- 202610171301 nisan-v1 (Claude): Nişan alınca (sağ tık) ana artı tüm silahlarda tamamen gizlenir; nişandayken silah sallanması/yürüme salınımı %95 azaltıldı (player.js chO, weapons.js poseGun).
- 202610171302 holo-lobi-v1 (Claude): Holosight XPS baş aşağıydı, düzeltildi (optics.js); pencereye 3B kırmızı nokta+halka eklendi, nişanda gizlenir (ekranda tek retikül). ChatGPT lobi karakter alanı yaması (LOBI-ALAN-001) uygulandı: style.css, lobby3d.js, ui.js.
- 202610171303 kasa-v1 (Claude): Yeni kasa tasarımları (7 SVG) crates.js içine gömüldü (crateArt); eski crateicon yalnız yedek. Kasa fiyatları x10: 1000/2500/2000/1800/2200/1500/7000.
- GitHub: tam oyun justberkan/NP-NG main dalında; her güncellemede Claude main'i günceller.
