# N.P.N.G — Genel hata denetimi ve çözüm yolu
2026-10-17 · Claude · denetlenen sürüm: 202610171807 alternating-gait-fix-v1 · düzeltilmiş sürüm: 202610171808 denetim-v1

## 1. Nasıl denetlendi
Oyun gerçek tarayıcıda (Chromium, yazılım GPU) açıldı. Tarayıcısız (Node VM) testler kabul edilmedi.

| Kontrol | Kapsam | Sonuç |
|---|---|---|
| Mod aç → oyna (yürü, ateş, nişan, zıpla) → lobiye dön | aim, tdm, zom, cmp, ow, wc, race | Sayfa hatası yok, 404 yok |
| Aynı mod 3–4 kez aç/kapa, ekran kartı doku/geometri sayımı | 7 mod | **Sızıntı bulundu → düzeltildi** |
| Lobi: 10 sekme, mağazanın 8 alt sekmesi, 114 düğmeye tıklama | tümü | Hata yok |
| İki istemciyle çevrimiçi: Arena, Takımlı Online, Zombi Co-op | mp, tm, zo | Bağlanma, birbirini görme, ateş, çıkış çalışıyor |
| `tests/run.cjs` (HTTP, hareket, smoke, lobi atmosferi) | tümü | **1 gerileme bulundu → düzeltildi**, şimdi hepsi PASS |
| Vuruş tespiti, 1405 sürümüyle karşılaştırma | tdm | Aynı davranış, gerileme yok |
| Kare başına işlemci maliyeti, 1405 ile karşılaştırma | aim, tdm, zom, ow | Gerileme yok |
| Duraklatma ekranları, Tab tablosu, oyun içi ekran görüntüleri | 5 mod | 2 arayüz hatası → düzeltildi |

Denetim araçları: `tests/audit.cjs` (yeni, kalıcı), ayrıntılı çıktı `test-results/audit/`.

## 2. Bu turda düzeltilenler (Claude)
| No | Hata | Sebep | Düzeltme | Kanıt |
|---|---|---|---|---|
| H-01 | Karşı tuşla duruş 0.25 sn'ye çıkmıştı (hareket "kayıyor") | 1415 athletic-impact yamasındaki kademeli ivme. Codex ve Kimi testin düştüğünü gördü ama düzeltmedi | `js/athletic-motion.js`: 1415 öncesi keskin formül geri geldi, son hızlar aynı | `tests/movement.cjs` 17/17 PASS |
| H-02 | Her bot/mob/zombi kaldırılınca iskelet dokusu ekran kartında kalıyordu (TDM +9, rekabetçi +11, açık dünya +17 doku/maç; açık dünyada mob her uzaklaşıp yaklaştığında). Uzun oyunda bellek ve FPS düşer | Sahneden çıkarılan aktörlerde `skeleton.dispose()` hiç çağrılmıyordu | `freeActor()` (combat.js): combat, world, mp, owmp'deki tüm silme noktaları | 4 tur aç/kapa: doku sayısı sabit |
| H-03 | Bot silah değiştirince eski silahın geometrisi kalıyordu (+6..16 geometri/maç) | `holderSet` eskiyi sahneden çıkarıp atmıyordu | `weaponFree()` (weapons.js) | geometri sabit |
| H-04 | Rekabetçide A/B harf dokuları her maç sızıyordu | işaretler yalnız sahneden çıkarılıyordu | `cmpFreeMeshes()` (compet.js) | doku sabit |
| H-05 | Yarışta sol tarafta tüfek/tabanca/bıçak şeridi görünüyordu | loadout şeridi yarışı ayırmıyordu | `loSync` yarışta kapalı (loadout.js) | ekran görüntüsü |
| H-06 | "Fare kilitlenemedi…" yazısı ekrandan taşıyor, duraklat başlığının üstüne biniyordu | 30 px tek satır | Kısa ipucu, 16 px, alt kısımda; duraklatınca silinir (main.js, style.css) | ekran görüntüsü |

## 3. Açık işler — kim yapacak
Önem: 🔴 oyunu bozuyor · 🟠 belirgin kalite sorunu · 🟡 iyileştirme

| No | Önem | İş | Sahibi | Durum |
|---|---|---|---|---|
| A-01 | 🟠 | John Wick ve Laz Torretto kolları silah tutarken bozuluyor. Katalogdan çıkarıldılar ama `assets/characters/*.glb` dosyaları (16 MB) duruyor | Kimi (Blender/Mixamo) ya da Berkan "silinsin" der | Karar bekliyor |
| A-02 | 🟠 | 5 GLB karakterde deformasyon şüphesi (Siber, Heetah, Lara ve diğerleri) | Kimi: görsel kontrol | Açık |
| A-03 | 🟠 | Botlar dizleri çok bükük, yengeç gibi yürüyor | Codex: animasyon ayarı, tarayıcıda görüntü kanıtıyla | Açık |
| A-04 | 🟡 | Tab skor tablosu yalnız rekabetçide var; TDM, zombi ve çevrimiçi modlarda yok | Codex | Açık |
| A-05 | 🟡 | Envanter: varsayılan eşyalar görünürken "Bu sekmede henüz eşyan yok" yazıyor, sağ panel boş | Codex | Açık |
| A-06 | 🔴 (yayın öncesi) | Çevrimiçi vuruşu sunucu doğrulamıyor (görüş hattı, mesafe, atış hızı); istemci "vurdum" derse kabul ediliyor | Codex (server.js) | **Aşama 1 bitti (Arena, Takımlı, Zombi Co-op) — PR #8, build 1809.** Claude: testler 39+ PASS, iki tarayıcı istemciyle uçtan uca vuruş doğrulandı |
| A-06b | 🟠 | Koridor co-op vuruşları hâlâ oda sahibine güveniyor (simülasyon oda sahibinde) | Codex: önce mimari öneri, onaysız kod yok | Açık |
| A-07 | 🟠 | Gerçek bilgisayarda mod başına FPS 1405'ten beri ölçülmedi | Kimi | **Bitti** (docs/QA_RAPORU.md): tüm modlar 151–165 FPS (165 Hz sınırı), Açık Dünya 10 dk'da sızıntı yok |
| A-12 | 🔴 (Berkan, 1 dk) | Chrome oyunu **Intel UHD** ile çalıştırıyor, RTX 5050 hiç kullanılmıyor | Berkan: Windows Ayarlar → Ekran → Grafik → Chrome → Yüksek performans | Açık |
| A-13 | 🟡 | Sınırsız FPS'te (vsync kapalı) Dust2'de 60 sn'de 306 kısa takılma; vsync açıkken yok. RTX'e geçince tekrar ölçülecek | Kimi tekrar ölçer; sürerse Claude | Açık |
| A-08 | 🟡 | Rekabetçide duraklatma ekranı ve satın alma menüsü aynı anda açılabiliyor | Codex | Açık |
| A-09 | 🟡 | `animHuman` 5 dosyada üst üste sarmalanmış; her yeni animasyon yaması bir öncekini bozabiliyor | Codex: tek animasyon hattına toplama (davranış aynı, testler PASS) | Açık |
| A-10 | 🟡 | Kullanılmayan büyük dosyalar ve `_yedek` / `docs` şişkinliği | Codex: silme listesi çıkarır, Berkan onaylar | Açık |
| A-11 | — | Kimi'nin favicon 403 bildirimi | — | Kapandı: denetimde 4xx yanıt yok |

## 4. Kök sebep: süreç
Bugün yapılan 20'den fazla yamanın neredeyse hepsi "tarayıcı/mouse kullanılmadı, görsel test yok" notuyla teslim edildi. Düşen test (`counter-strafe`) iki ajan tarafından görüldü, not düşüldü ve öylece bırakıldı. Ajanlar canlı oyun klasörüne doğrudan yazdığı için her yama bir öncekinin üstüne bindi. `IS_PLANI.md` kurallar yerine günlük kayıtlarıyla doldu ve "oyun kodunu yalnız Claude değiştirir" kuralı ile "Codex doğrudan uyguladı" kayıtları çelişiyor.

## 5. YOL — her ajan için zorunlu teslim hattı
1. **Kaynak tek:** GitHub `justberkan/NP-NG` main. İşe başlamadan `git pull`; iş kendi dalında yapılır (`codex/A-04-tab-tablosu`, `kimi/A-07-fps`).
2. **Bir iş = bir hata numarası.** Bu dosyadaki tablodan alınır. Kapsam dışı değişiklik yok.
3. **Kapı (gate):** teslimden önce `npm test` çalışır (run.cjs + audit.cjs). **Tek bir FAIL varsa teslim yok.** "Benim yamamla ilgili değil" denmez: ya düzelt ya da bu dosyaya yeni hata numarasıyla yaz ve işi durdur.
4. **Gerçek tarayıcı kanıtı:** görsel/animasyon/arayüz işinde önce/sonra ekran görüntüsü veya kısa video şart. Node VM testi tek başına kanıt sayılmaz.
5. **Canlı klasöre yazma yok.** Codex ve Kimi masaüstündeki oyun klasörüne yazmaz; dal + PR açar. Claude PR'ı inceler, testleri kendi çalıştırır, birleştirir, canlı klasöre ve main'e yazar. Berkan bir ajana doğrudan yazma izni verirse yine 3. ve 4. adımlar geçerli.
6. **Kayıt:** `ISLEM_GUNLUGU.md` biçimi (saat, ajan, build, Eklendi / Değişti / Çıkarıldı, dosyalar, test, yedek). Ek olarak bu dosyada ilgili satırın durumu güncellenir.
7. **Görsel kabul Berkan'da:** animasyon ve karakter işleri Berkan "tamam" demeden kapanmaz.

---

## 6. HAZIR PROMPTLAR (kopyala-yapıştır)

### Ortak giriş (her promptun başına eklenir)
```
Proje: N.P.N.G (No Pain No Gain), Three.js r128 tarayıcı FPS'i. Repo: https://github.com/justberkan/NP-NG (main).
Kurallar (pazarlıksız):
- Önce oku: docs/HATA_DENETIMI_20261017.md (bölüm 5 YOL), IS_PLANI.md, ISLEM_GUNLUGU.md son 10 kayıt.
- Masaüstündeki canlı oyun klasörüne YAZMA. git clone/pull → kendi dalın → PR. Claude birleştirir.
- Yalnız sana verilen hata numarasının kapsamında değişiklik yap.
- Teslimden önce: `npm install` (playwright) ve `npm test`. Çıktının tamamı PR açıklamasına. Tek FAIL varsa teslim etme; sebebini yaz.
- Görsel/animasyon/arayüz işinde gerçek tarayıcıda önce/sonra ekran görüntüsü (test-results/ altına) zorunlu. "Tarayıcı açılmadı" diyen teslim reddedilir.
- Bitince ISLEM_GUNLUGU.md biçiminde kayıt (saat, ajan, build, Eklendi/Değişti/Çıkarıldı, dosyalar, test, yedek) ve docs/HATA_DENETIMI_20261017.md tablosunda durum güncelle.
- Kısa ve dürüst yaz. Yapamadığını "yapamadım, sebebi şu" diye yaz.
```

### CODEX-1 · A-03 Bot yürüyüş/koşu pozu
```
Görev A-03: Botlar ve uzak oyuncular dizleri çok bükük, yengeç gibi yürüyor (Krunker/CoD tarzı dik duruş bekleniyor).
Dosyalar: js/rig.js, js/anim-contact.js, js/glbrig.js (animHuman sarmalayıcıları).
Kabul ölçütleri:
1) Normal yürüyüşte kalça yüksekliği ayakta durmanın en az %92'si; diz bükümü 35° altında. Koşuda %88 / 50° altında.
2) Sağ-sol adım fazı ters kalsın (1807'deki düzeltme korunur).
3) Silah tutuşu ve nişan pozu bozulmasın.
4) Kanıt: TDM'de bir botu yandan çeken 16 karelik görüntü şeridi (önce/sonra), 30/60/144 FPS'te aynı görünüm. Asker ve en az 3 GLB karakterde (Leon, SWAT, Siber).
5) npm test PASS.
Kapsam dışı: hareket fiziği (js/player.js, js/athletic-motion.js) DEĞİŞMEZ.
```

### CODEX-2 · A-06 Sunucu tarafı vuruş doğrulama
```
Görev A-06: Çevrimiçi modlarda (Arena, Takımlı Online, Zombi Co-op, Koridor co-op) sunucu, istemcinin hasar mesajına güveniyor.
Dosya: server.js (+ gerekirse js/mp.js mesaj alanları). Oyun hissi değişmemeli.
Kabul ölçütleri:
1) Sunucu her vuruşta silah türüne göre en fazla atış hızını, menzili ve atıcı-hedef mesafesini kontrol eder; aşırısını reddeder ve sayar.
2) Basit görüş hattı: harita kutuları (arena) ve Dust2 çarpışma verisiyle ışın-kutu testi; duvar arkasından vuruş reddedilir.
3) 100 ms'ye kadar gecikme için geriye dönük konum geçmişi (en az 250 ms) tutulur.
4) Test: iki gerçek WebSocket istemcisiyle (a) normal vuruş kabul, (b) duvar arkası red, (c) 10x atış hızı red, (d) 300 m mesafe red. Sonuçlar test-results/server-hit.json.
5) npm test PASS.
```

### CODEX-3 · A-04 + A-05 + A-08 Arayüz eksikleri
```
Görev A-04: Tab basılıyken skor tablosu TDM, zombi, Zombi Co-op ve Arena'da da açılsın (rekabetçideki tablo tasarımı ortak bileşene çıkarılsın; rekabetçi görünümü değişmesin).
Görev A-05: Envanter boş durumu: varsayılan eşyalar sahip olunan sayılsın, "henüz eşyan yok" yalnız gerçekten boşken görünsün; sağ panel ilk eşyayı seçili göstersin.
Görev A-08: Rekabetçide duraklatma ekranı açılırken satın alma menüsü kapansın.
Kanıt: her biri için tarayıcı ekran görüntüsü (1600x900 ve 390x844). npm test PASS.
Dosyalar: js/compet.js, js/ui.js, js/views.js, js/main.js, css/style.css. Başka dosyaya dokunma.
```

### CODEX-4 · A-09 + A-10 Teknik borç (en son)
```
Görev A-09: animHuman, mkHuman ve spawnRagdoll şu an rig.js, anim-contact.js, glbrig.js, fingers.js, newchars.js ve main.js içinde üst üste sarmalanıyor. Davranışı birebir koruyarak tek, sıralı bir animasyon hattına (js/anim-pipeline.js) taşı.
Kabul: sarmalayıcı sayısı 1; öncesi/sonrası 16 karelik görüntü şeritleri (asker + 3 GLB karakter; yürü, koş, nişan, duvar koşusu) piksel olarak çok yakın; npm test PASS; kare süresi artmasın (tests/audit.cjs çıktısı).
Görev A-10: Kullanılmayan dosyaların listesini çıkar (index.html'den ve koddan erişilmeyen assets/*, _yedek/*, docs/* altındaki eski yamalar). SİLME; listeyi boyutlarıyla docs/TEMIZLIK_LISTESI.md'ye yaz, Berkan onaylayınca Claude siler.
```

### KİMİ-1 · A-07 Gerçek cihaz FPS ölçümü
```
Görev A-07: Berkan'ın bilgisayarında gerçek FPS ölçümü (senin fiziksel test yeteneğin burada lazım).
Hazırlık: Ekran kaydı/OBS KAPALI. Chrome'da oyun, Ctrl+F5, Ayarlar varsayılan. Sağ alttaki FPS sayacını kullan.
Her mod için 60 sn oyna, şu tabloyu doldur: mod | harita | ortalama FPS | en düşük FPS | takılma anı (ne yaparken) | ekran görüntüsü yolu.
Modlar: Aim, TDM Arena, TDM Dust2, Rekabetçi Dust2, Zombi, Açık Dünya (2 dk, şehre koş), Koridor (5 tur), Yarış (1 tur).
Ayrıca: Açık Dünya'da 10 dk oyna, başında ve sonunda FPS; düşüş varsa yaz (bellek sızıntısı kontrolü).
Çıktı: docs/QA_RAPORU.md başına tarihli bölüm. Oyun koduna dokunma.
```

### KİMİ-2 · A-01 + A-02 Karakter görsel kontrolü
```
Görev A-02: Mağazadaki her karakteri (Karakterler + Şampiyonlar) sırayla kuşan; lobide ve TDM'de üçüncü şahısta (V) yürü, koş, nişan al, zıpla. Her karakter için 4 ekran görüntüsü.
Tablo: karakter | sorun yok / omuz-kol bozuk / bacak bozuk / kayıyor / silah elde değil | ekran görüntüsü.
Görev A-01: John Wick ve Laz Torretto için iki seçenek hazırla: (a) Mixamo ile yeniden rigleme (T-poz, otomatik rig, GLB çıktı); adım adım dene, sonucu ekran görüntüsüyle göster. (b) Olmuyorsa "silinsin" öner. Karar Berkan'ın.
Çıktı: docs/KARAKTER_KONTROLU.md + docs/karakter-kontrol/ altına görüntüler. Oyun koduna dokunma; yeni GLB'leri docs/varliklar/ altına koy, oyuna Claude ekler.
```
