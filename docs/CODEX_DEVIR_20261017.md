# Codex — doğrudan oyun güncellemesi / 17.10.2026
Build: **202610171402 hareket-bomba-v1**
Berkan'ın açık isteğiyle canlı çalışma klasöründeki dosyalar düzenlendi. Claude/Kimi: eski kaynak paketlerini bu dosyaların üstüne topluca yazmayın.

## Karakterler
- Ada Wong (h8) ve Samus Aran (h23) CHARS listesinden çıkarıldı.
- assets/ch_ada.js ve assets/ch_samus.js kaldırıldı (toplam yaklaşık 4.9 MiB). Geri alınabilir kopyaları _yedek/codex-bp-v3-* altında; web üzerinden sunulmaz.
- Eski kuşanım h8/h23 ise c0 askere geçer. CHAR çözümleyicisi bilinmeyen uzak karakterleri de askere düşürür. Geçmiş satın alma kimlikleri hesaplardan topluca silinmedi.
- glbLoadChar bu iki modeli yeniden yüklemez. Eski Samus'a özel animasyon testleri artık aktif model testi olarak kullanılmamalı; örnek yerine Anime Savaşçı h18 seçilebilir.

## Battle Pass v3
- Yeni sezon başlığı, topografik arka plan, sayısal seviye ve XP bandı, ödül sayacı.
- Ücretsiz/premium ödüller aynı kademe sütununda hizalı ve tek yatay kaydırmada. Önceki/sonraki ve seviyeme git kontrolleri.
- Kilitli/alınmış/alınabilir durumlar ayrıldı. 40 ödül, 1500 TL premium bedeli, claim/claimAll/XP/ödül tabloları korunur.
- js/ui.js ve css/style.css değişti. Masaüstü ve mobil önizlemeler docs/codex-bp-v3 altında.

## Hareket animasyonları
- Süzülme: kontrollü dizler, iki el paraşüt askı noktalarında; silah görünümü serbest el modunda gizlenir.
- Düz tırmanma: dönüşümlü kol/bacak hareketi, duvar doğrultusuna el ve ayak hedefleri, yakın el parmak pozu.
- Kayma: alçak kalça, öne uzanan ayrık bacaklar, zeminle uyumlu ayak yönü; silah tutulur.
- Özel pozlardan çıkışta önbellekteki bacak pozu güncellenir. Yürüyüş/duvar koşusu temas çözümü korunur.
- Tırmanma bayrağı 256: mp.js ve owmp.js gönderir/alır, player.js bağlamına girer. Sunucu animasyon bayrak aralığı 0..511 oldu. Önceki 64/128 sağ/sol duvar bayrakları korunur.

## 5v5 / Rekabetçi
- Dust II A/B hedefleri harita koordinatlarında tanımlandı (CMP_SITE_LAYOUTS): A (43,-22), B (-35,-27); yürünebilir, çevresi uygun yüzeye oturtulur. Diğer GLB haritalarında uzak/bağlantılı/geniş aday seçimi. Arena sabit konumları korunur.
- Kurulumda yatay yarıçap (3.5m), kat/yükseklik (±0.65m) ve yürünebilir yüzey kontrolü var. Doğrudan cmpPlant çağrısı da bölge dışında kurulumu reddeder. Çözmede 3B mesafe kullanılır.
- C4 hasarı 3B mesafeye göre azalır: 500*exp(-(d/10.8)^2), 28m ve ötesinde sıfır. Bu oyunun ayarlanabilir denge değeridir; CS2'nin birebir değerleri iddia edilmez. 10m ~212, 14m ~93, 20m ~16 ham hasar. Mevcut zırh indirimi geçerlidir; her iki takım etkilenir; duvarlar C4 alan hasarını tamamen engellemez.
- Işık, ateş küresi, şok halkası, kıvılcım ve duman eklendi. 2.2 saniye sonra geometri/malzeme temizlenir; maç çıkışında da temizlenir. Düşük efekt ayarında 20, diğerlerinde 64 kıvılcım.
- C4 kaynaklı bot ölümü kill para ödülü vermez. Aynı bomba iki kere patlayıp tekrar hasar veremez.
- Rekabetçi mode=cmp ve çevrimiçi 5v5 mode=mp/kind=tm: üçüncü şahıs tuşu reddedilir, görünüm her güncellemede birinci şahsa zorlanır. Ölümde yerel ragdoll izleme kamerası bu modlarda kullanılmaz. Diğer modların üçüncü şahıs tercihi korunur.

## Test ve kullanım
- docs/codex-bp-v3/test.cjs: kaldırılan karakterler/önceki kayıt, 40 kart, yatay gezinti, premium satın alma, tek ödül alma, mobil taşma: PASS.
- docs/codex-oynanis/test.cjs: Arena/Dust2/MC A-B yüzeyi/yol/kat, yanlış kurulum reddi, patlama hasar mesafesi, yakın oyuncunun ölmesi, tek patlama/FX temizliği, 5v5 FP kilidi/diğer mod TP, 3 hareket pozu, iki gerçek WebSocket istemcisi ile Arena/OW 64/128/256 bayrakları: PASS.
- tests/run.cjs sonucu docs/codex-oynanis/regresyon-log.txt. 5 HTTP, 17 hareket kontrolü; 49 HTTP dosyası/138 JS, lobi/Aim Training, atmosfer kontrolleri.
- Gerçek oyuncuyla maç dengesi ve animasyonların akıcılığı Berkan'ın gözle kabulüne açık. Tam model/geometri etkileşimlerinin tamamı için kusursuzluk iddiası yoktur.

**Sunucu yeniden başlatılmalı (server.js değişti). Ardından oyun sayfası yenilenmeli. Açık sunucu süreci oyuncuların oturumunu kesmemek için bu çalışma sırasında zorla kapatılmadı.**
Yedek yolları: docs/codex-bp-v3/YEDEK.txt, docs/codex-oynanis/YEDEK.txt.

## Daha yeni teslim: 202610171404
Bu belgedeki 1402 teslimi üzerine rekabetçi menü/alım/Tab, tek optik retikülü ve Dust2 çatı çalışması geldi. Çatılara çıkış serbesttir; kenar ve üst sınır görünmez çarpışma yüzeyleriyle korunur. Güncel ayrıntı: docs/codex-1403/DEVIR.md.

## Daha yeni teslim: 202610171405
Dust2 görünmez duvar/tavan ve özel çatı engelleri kullanıcı tarafından istenmediği için kaldırıldı. Yeni Koridor: Dalga Ağacı modu eklendi. Güncel devir: docs/codex-koridor/DEVIR.md. 1404 çatı sınırlarını geri getirmeyin.
