# N.P.N.G — Durum Raporu ve Devir Notları

Bu dosya projede çalışan her yapay zekâ (Claude, ChatGPT/Codex) ve insan için ortak hafızadır.
**İşe başlamadan önce oku. İş bitince "Değişiklik günlüğü" bölümüne kısa bir kayıt ekle.**

Son güncelleme: 17.10.2026, Claude (build `202610170100 · forma-v2`)

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
- 16.10.2026 · Kimi · `202610170102 menzil-v1` · Açık dünya kılıç menzili +1 m (10 kılıç), otomatik savaşta menzilli hedefe dash ile boşluk kapatma, auto vuruş menzili +0.3 · swords, auto
- 16.10.2026 · Kimi · `202610170102 menzil-v1` · newchars.js `_animHuman1` çakışması düzeltildi: fingers.js ile aynı adda const → newchars.js bütünüyle çalışmıyordu (goblin animasyonları ölüydü) · newchars
- 16.10.2026 · Eşitleme · Berkan'ın yerel son hâli (Claude güncellemeleri: glbrig, models, weapons, catalog, fingers.js, index.html) depoya alındı · fingers yeni dosya
