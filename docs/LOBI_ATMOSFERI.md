# Anıtkabir ve askeri hangar lobisi

Build: `202610170203 · anitkabir-lobi-v1`

## Kullanım / kurulum

1. Projenin tamamını aynı klasöre yerleştir; `js/lobby-atmosphere.js`, `js/lobby3d.js`, `index.html`, `css/style.css` ve `assets/lobby/` birlikte güncellenmelidir. Elle ek model indirmeye veya npm paketi kurmaya gerek yoktur.
2. `SUNUCU-BASLAT.bat` veya `node server.js` ile mevcut sunucuyu aç. Tarayıcıda `http://localhost:3000` adresine git. GLB yüklemesi için HTTP kullan; dosyaya çift tıklayarak `file://` üzerinden açma.
3. Açık sekmede `Ctrl+F5` yap. Sağ altta `202610170203 · anitkabir-lobi-v1` yazmalı.
4. Sol alttaki **ATMOSFER** menüsünü aç. **Mevsim**, **Hava** ve **Işık** ayrı ayrı seçilebilir. **Otomatiğe dön** hepsini takvime bağlar. Seçimler bu tarayıcıda kaydedilir.
5. Otomatik ışık bilgisayarın tarih/saatinden UTC+3 hesaplar; bilgisayarın seçili saat diliminden bağımsızdır. Kış: kar, ilkbahar: hafif bulut, yaz: açık, sonbahar: yağmur. Bunlar mevsim senaryolarıdır; canlı meteoroloji servisi kullanılmaz.

## Modüler yapı

- `LobbyAtmosphere.sample(date, options)`: sahne oluşturmadan UTC+3 tarihi, İstanbul güneş yüksekliği, mevsim, hava, aydınlık ve alacakaranlık oranı üretir. İstanbul için enlem 41.0082°N, boylam 28.9784°E; güneş hesabı yaklaşık görsel modeldir. Yaz/kış gün uzunluğunu ve yerel güneş öğlesini hesaba katar.
- `LobbyAtmosphere.create(scene, camera, renderer)`: sahneyi kurar; `update(dt)`, `setOptions(options)`, `snapshot()` ve `dispose()` döndürür. Mevcut lobi yalnız `initLobby3D` ve `lobbyUpdate` üzerinden bağlanır.
- `LB.atmosphere.setOptions({season:'winter', weather:'snow', time:'night'})`: elle önizleme. Değerler `season: auto/winter/spring/summer/autumn`, `weather: auto/clear/cloudy/rain/snow`, `time: auto/day/sunset/night`.
- Mevsim seçimi paleti ve varsayılan havayı değiştirir. Güneşin mevsimsel konumu gerçek tarihten hesaplanır; ışık önizlemesi aynı tarihin öğle/gün batımı/gece konumunu gösterir.
- `assets/lobby/anitkabir.glb`: 32,220 byte, 3 mesh / 604 üçgen. Arka planda yaklaşık 60 metre uzakta, 18 metre genişliğe normalize edilir. Yükleme başarısızsa basit geometrik silüet kalır.
- `assets/lobby/turkish-flag.glb`: 125,200 byte, gömülü doku. Bayrağın orijinal kıvrımına hafif rüzgâr eklenir.
- `assets/lobby/ATTRIBUTION.md` ve oyun içi Krediler kaynak/lisans bilgilerini saklar.

## Görünüm ve performans

- Tek gökyüzü shader'ı: gradient, gün batımı, hafif bulut ve gece yıldızları. Gökyüzü rengi ve mevsimsel sis ışıklarla birlikte güncellenir.
- Hangar statik geometrisi malzeme başına `InstancedMesh` ile birleştirilir. Sabit parçalar için her kare yeni nesne/geometri oluşturulmaz.
- En fazla 650 yağmur damlası **veya** 450 kar tanesi; GPU shader'ında hareket eden sabit tamponlar, efekt başına tek çizim. Orta efekt ayarı yarı bütçe; dar ekranda ayrıca %60; düşükte yağış ve bayrak deformasyonu kapanır.
- Parçacıklar hangarın dışındadır; lobi kapalıyken atmosfer güncellenmez/render edilmez. Oyun sahnesinin ışık, sis, fizik ve renderer kalitesi değiştirilmez.
- Gündüz yumuşak temas gölgesi her ayarda bulunur. Oyunun gölge ayarı açıksa tek 512×512 güneş gölge haritası kullanılır. Gece projektörleri ek gölge haritası üretmez.
- Yağmurda PBR zemin roughness `.22`, metalness `.36`; kuru zeminde `.88` / `.08`. Küçük çevre küpü gökyüzü parıltısı verir. Bu yöntem karakteri/Anıtkabir'i aynen yansıtan bir ayna veya SSR değildir; ek yansıma render geçişi kullanılmaz.
- Ücretsiz/yerel varlıklar ve mevcut Three.js r128 kullanılır. Her donanımda sıfır FPS farkı garanti edilemez; gerçek cihazda son görsel akıcılık kontrolü Berkan'a aittir.

## Doğrulama

`npm ci`, `npx playwright install chromium`, ardından `npm test`. Mevcut hareket, HTTP ve açılış testlerine `tests/lobby-atmosphere.cjs` eklendi. Test sunucusu ayrı port ve geçici hesap dizini kullanır.

Atmosfer testi: UTC+3 yıl/ay sınırı, dört mevsim, güneşin yaz/kış değişimi, gündüz/gece, elle geçersiz değer koruması, seçim kaydı, menü etkileşimi, mobil parçacık bütçesi, yüksek ayarda gölge, başarısız model yükleme yedeği ve dispose. Beş görsel senaryonun ekran görüntüsü ve gerçek çizim/üçgen sayaçları `test-results/lobby-atmosphere/` içine yazılır; CI bunları artifact olarak saklar.

İnsan kontrolü: otomatik gerçek saat görünümünü ve gün batımı/gece önizlemelerini beğenme, kendi çözünürlüğünde metin/karakter okunurluğu ve akıcılık. Teknik kurulum/testler ajan tarafından yapılır.
