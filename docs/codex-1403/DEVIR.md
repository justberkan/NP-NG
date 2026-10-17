# Codex devir — 202610171404 / çatı-rekabetçi-v3

Berkan'ın doğrudan talepleriyle canlı dosyalara uygulandı. Önceki sürüm: 202610171402. Yedek: `_yedek/codex-rekabetci-harita-1403/` (mapcol.js de dahil).

## Rekabetçi akış
- Canlı tarayıcı kontrolünde 3 ayrı 5v5 kartı bulundu. `tdm` ve `tm` öldürme odaklı eski modlardı; `cmp` bombalı moddu. Rekabetçi kartından botlar, A/B ve rauntlar zaten açılıyordu. Sürüm karşılaştırması olmadan 'silinmiş' veya 'önbellek' varsayılmadı.
- Eski kartlar açıkça Takımlı Ölüm Maçı / Botlar ve Online adını aldı; bomba ve raunt olmadığı altlarında yazıyor. Rekabetçi · 5v5 kartı ilk sıraya alındı ve vurgulandı.
- Rekabetçi ilk girişte Rütbesiz/Rütbeli seçimini gösterir; loadout penceresini atlar. Rütbeli çevrimiçi kuyruk ÖNCEDEN OLDUĞU GİBİ kilitlidir, bu teslimde çevrimiçi rekabetçi sunucu eklenmedi.
- Her doğuş/raunt başında satın alma menüsü açılır; B ile kapanır/açılır. Menü açıkken maç girişinde fare kilidi tekrar alınmaz.
- Tab basılıyken 10 kişilik takım tablosu: K/D/A, K/D oranı, hayatta/ölü, maç TL. Oyuncu ve bot kill/death sayaçları maç boyunca korunur. Aynı hedefe son 10 saniyede en az 40 hasar veren diğer oyuncu/bot asist alır; raundun başında hasar katkıları temizlenir. Bomba kaynaklı ölümler kill/assist üretmez.

## Dust2 çatıları — SON KULLANICI DÜZELTMESİ ESASTIR
Berkan önce erişim kapatma istedi, sonra **çatılara çıkılabilir, sadece aşağı düşülmesin; çevresine görünmez duvar ve üst sınır** diye netleştirdi. Son kod bu ikinci tarife göredir.
- İlk taslaktaki nav alanı / yerel zemin +3.2m erişim kısıtı TAMAMEN KALDIRILDI. `mapPlayableAt` yoktur. Çatıya kanca ve zıplama serbesttir.
- Modelin yüksek, açık ve yatay kapalı kenar halkaları tespit edilerek 8 boş üst yüzeye 36 üçgen düz kapak eklendi; mevcut yüzeyle çakışan parçalar atlanır. Kalıcı GLB varlığı değiştirilmez.
- Üst yüzey kenarlarından 268 görünmez sınır parçası ve dış sınır/tavan üretildi. Birleşik geometri: 546 üçgen. Tavan dünya yüksekliği ~16.47m; oyuncu başı bunun üstüne çıkamaz.
- Kenar çarpışması oyuncunun içeri doğru hareketini engellemez; dışarı doğru hareketi durdurur. `mcWall` isteğe bağlı önceki X/Z alır; `canMove` bu koordinatları verir. Harita normal duvarları değişmez.
- Kanca ışını görünmez sınırları yok sayar; gerçek çatıya tutunur. Diğer ışın testleri bu sınırları içerir. `MC.skipRoofRay` yalnız senkron kanca testi süresince try/finally ile etkinleşir.
- Gerçek model dışına düşülürse son sağlam yere döner. Son konum raunt doğuşunda yenilenir.
- Bu çatı sınırları sadece Dust2 içindir. Minecraft ve Açık Dünya'ya yükseklik kısıtı eklenmedi.

## Tek nişan işareti
- Holosight GLB içinde `UWT2_Holosight_Reticle...` isimli yerleşik bir retikül vardı; önceki kod yalnız sonradan eklenen nokta/halka mesh'lerini gizliyordu. Yerleşik retikül de işaretlendi ve ADS sırasında gizleniyor.
- Silah değişimi / geç yükleme sırasında yeni oluşan mesh'ler her kare kontrol edilir. ADS boyunca ana ekran artısı kapalı; tek ekran optik işareti kalır. Nişanı bırakınca 3B işaretler geri gelir.

## Kanıt ve sınırlar
- `docs/codex-1403/test.cjs`: gerçek menü tıklamalarıyla Arena/Dust2/Minecraft → Rütbesiz → 9 bot / ₺800 / otomatik alım → klavyeyle ürün alımı → Tab 10 satır → E basılı bomba kurma → patlama → sonraki raunt ve alım PASS. Test süre geçişleri hızlandırılır; bu tam maç dengesi testi değildir.
- Kill/death/assist gerçek hasar fonksiyonlarıyla 1/1/1 PASS; Holosight'ta 3 adet yerleşik/ek 3B işaret gizli, tek ekran retikülü PASS; JS sayfa hatası yok.
- Dust2 3017 nav düğümü korundu; 36 kapak üçgeninde zemin teması; 368 yönlü sınır kontrolü, çatı erişimi, tavan ve düşüş kurtarma PASS.
- `tests/run.cjs` genel regresyonu PASS. Ekran görüntüleri ve JSON bu klasörde. Gerçek cihaz FPS etkisi ve Berkan'ın görsel kabulü ayrıca gözlenmeli; performans artışı iddiası yok.

Değişen oyun dosyaları: index.html, css/style.css, js/main.js, js/compet.js, js/maps.js, js/mapcol.js, js/player.js, js/optics.js. Bu teslim için server.js değişmedi; sayfayı Ctrl+F5 yenilemek yeterli. Önceki animasyon ağ biti için sunucu yeniden başlatma gereği ayrı konudur.
