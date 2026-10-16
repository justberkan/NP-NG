# N.P.N.G. — Codex / Claude görev devri
Tarih: 15.10.2026 (Europe/Istanbul)
Depo: https://github.com/justberkan/NP-NG
Yerel oyun: C:\Users\berkan\Desktop\mmofps-online

## Gerçek durum
- Bu belge Codex tarafından oluşturuldu. Claude'un teslim aldığı henüz doğrulanmadı; otomatik Claude bağlantısı yok.
- Yerel oyun klasörü Git deposu değil. GitHub metadata size=0 döndü; oyun kaynakları GitHub'da henüz doğrulanmadı.
- NOTLAR.md mevcut Claude hafızasıdır; üzerine yazılmadı. Orada 16–17 Ekim tarihleri var; bugün 15 Ekim. Tarihleri test kanıtı sayma.
- index.html etiketi: build 202610170100 · forma-v2. Bu teslim yalnız dokümantasyon; oyun kodu/build değiştirilmedi.
- Kodda doğrulanan: js/main.js FIX_DT=1/120; js/player.js HOP_CAP=11.5, BH_GRACE=.1, stepPlayer.
- Önceki notlardaki hareket ölçümleri bu oturumda yeniden çalıştırılmadı. Test betikleri henüz bulunmadı.
- http://localhost:3000/ kontrolü 4 saniyede zaman aşımına uğradı. Sunucunun çalışmadığı kesinleştirilmedi; HTTP teslim doğrulanamadı.
- js/main.js startMatch, selMode!=='ow' koşuluyla loadout açıyor. Kullanıcı sadece zom/zo istiyor; görev sırasına kaydedildi.

## Ortak çalışma sözleşmesi
1. Başlangıçta bu belgeyi ve NOTLAR.md'yi oku; git durumunu ve taban commit'i kaydet.
2. Her görev için ayrı dal/PR kullan. Önerilen adlar codex/T001-baseline, claude/T002-movement-tests.
3. Sorumlu görevi ALINDI olarak kaydetmeden görevi üstlendi sayma. Aynı dosyada aynı anda çalışmayın.
4. Akış: HAZIR → ALINDI → KOD_HAZIR → OTOMATIK_TEST_GECTI → KARSILIKLI_INCELEME → INSAN_TESTI_BEKLIYOR → TAMAM.
5. Codex kodunu Claude, Claude kodunu Codex incelesin. Diğer ajan erişilemiyorsa inceleme BEKLIYOR; sahte onay yok.
6. Her teslimde dal, taban/son commit, dosyalar, test komutu ve gerçek çıktı, build, kalan hata ve sonraki görev zorunlu.
7. Önce yedek al. Kullanıcının değişikliklerini silme. data/, hesaplar, parola özetleri, .env, anahtarlar ve yedekler GitHub'a yüklenmez.
8. Oyun değişikliğinde build ve tüm ?v= değerlerini tutarlı artır. Mevcut gelecekteki build'i geriye düşürme; tarih tutarsızlığını kaydet.
9. Değişen oyun dosyalarının HTTP 200 ve yerel dosyayla içerik eşleşmesini kontrol et. server.js değişirse doğru sunucu sürecini yeniden başlat ve doğrula.
10. Her adımı test etmeden sıradakini tamamlandı sayma. Teknik testleri ajanlar yapar; Berkan'a yalnız insan değerlendirmesi kalır.
11. GitHub'a push etmek Claude'u kendiliğinden çalıştırmaz. Claude bu depoya erişen oturumunda belgeyi okumalıdır.

## Görev kuyruğu
| ID | Önerilen sorumlu | İş / kabul ölçütü | Durum |
|---|---|---|---|
| T000 | Codex | Yerel ve GitHub ortak devir belgesi | GitHub'a ilk belge olarak yayınlandı; yerel kopya hazırlanıyor |
| T001 | Codex | Kaynakları güvenli Git başlangıcına al; özel dosyaları dışla; büyük/base64 varlık boyutlarını incele; yerel ve uzak commit eşleşmesini doğrula | HAZIR |
| T002 | Claude | Mevcut hareketi yeniden yazmadan çalıştırılabilir regresyon testlerini tests/ altında teslim et | HAZIR; T001 sonrası |
| T003 | Codex | T002 testlerini çalıştır, gerçek başarısızlıkları düzelt, Claude incelemesine devret | T002 bekliyor |
| H001 | Berkan | Test edilmiş hareket sürümünde his/kamera/gerçek cihaz değerlendirmesi | T003 bekliyor |
| T004 | Claude | Silah hissi, recoil ve ses; hareket regresyonu bozulmadan | H001 sonrası |
| T005 | Codex | 1 karakter + 1 tüfek + 1 kılıç varlık uçtan uca doğrulaması; geometri/IK ölçümü, uyumsuz modeller raporu | Önceki adım sonrası |
| T006 | Claude | Kılıç komboları ve vuruş pencereleri; ağdan görünen animasyonlar | Önceki adım sonrası |
| T007 | Codex | Aim Training rafları/gerçek hedefler; loadout yalnız zom/zo; diğer modlara regresyon kontrolü | Önceki adım sonrası |
| T008 | Ortak | 5v5 ve online altyapı; önce Berkan'dan satın alma ekranı referansı | Önceki adım sonrası |
| T009 | Kimi | Berkan'ın isteği: açık dünyada otomatik savaş/kılıç menzili yetmiyordu. Kılıç menzili +1 m (10 kılıç), auto: menzilli hedefe dash, auto vuruş menzili +0.3. Ayrıca newchars.js `_animHuman1` çakışması düzeltildi (goblin animasyonları ölüydü). Berkan'ın yerel son hâli depoya eşitlendi | KOD_HAZIR → OTOMATIK_TEST_GECTI (17/17 hareket, 5/5 HTTP, 43 dosya açılış; menzil kanıtı: 4.5 m ve 4.9 m isabet, 5.5 m ıskar). İnsan testi: Berkan |
| T010 | Kimi + Claude | Berkan'ın isteği: FPS limitine "Limitsiz" ayarı + fps kazandıran iyileştirmeler (çözünürlük %25'e indi, pixelRatio tabanı .25, stencil tamponu kapalı, 240 seçeneği). Claude: goblin ölüm donması düzeltmesi (gobDeadStep + try/catch, build 202610170104) | OTOMATIK_TEST_GECTI (18 PASS + HTTP 5/5; fpsSkip 30/60/240/Limitsiz davranışı başsız tarayıcıda doğrulandı). İnsan testi: Berkan |
| T011 | Kimi | Berkan'ın isteği: lobi/arkadaş sistemi incelendi + Xbox tarzı geçici profil resimleri (16 el-çizimi SVG avatar, id a0–a15; arkadaşlar kutusunda ◀▶ ile değiştirilebilir; arkadaş/istek/aktif listesinde görünür; sunucu `save.av` üzerinden otomatik eşitler, şema değişmedi). Lobide davet sistemi YOK (odalar açık katılımlı) — sonraki iş. Ayrıca frRender'da girişsiz yüklenmede `SV` nullken `.av` okuma hatası düzeltildi | OTOMATIK_TEST_GECTI (17/17 hareket, 5/5 HTTP, 44 dosya açılış; avatar doğrulaması: 16 SVG bozuksuz, döngü a1→a2→a1, panelde seçici + SVG var, sayfa hatası yok). İnsan testi: Berkan |

Önerilen sahiplik henüz Claude tarafından kabul edilmedi. Büyük modlar, MMO, yarış, ekonomi, profil, TR/EN ve mobil işlerin tam kapsamı TALEP_ORIJINAL.txt dosyasında korunur; tek teslimde bitmiş sayılmaz.

## T002 — Claude'a ilk somut görev
Kapsam: js/main.js, js/player.js ve js/core.js mevcut davranışını test et; gereksiz yeniden yazım yapma.
- 30/60/120/144 render FPS simülasyonlarında aynı sabit fizik süresinde hareket farkını ölç; toleransı testte açıkla.
- Koşu (önceki notlarda 5.25 m/s), ters yönle duruş, tek zıplama, autoHop açık/kapalı, bhop hız sınırlarını ölç.
- Kutu kenarında iniş/takılma; duvara bakış + W ile tırmanma; bakmadan tırmanmama; alçak engel ve duvarda koşma.
- Blur/sekme gizlenmesi sonrası takılı kalan tuş, uzun frame sonrası fizik, çömelme/kayma.
- Önceki 8.8→11.7→13.5 m/s değerleri yalnız eski not iddiası; sıçrama anı sınırı 11.5 ile hava sınırını ayrı test et.
- Betikleri ve kurulumu depoya koy. Otomatik test çıktısını sakla; başarısızlığı gizleme.
- Tarayıcı console/runtime hataları ve HTTP dosya eşleşmesini denetle; ekran görüntülerini build ile kaydet.
- İnsana teknik test yaptırma; yalnız aşağıdaki kontrol listesini hazır sürümle teslim et.

## Her teslimde doldurulacak kayıt
Görev ID:
Teslim eden / teslim alan:
Durum / tarih-saat:
Dal / taban commit / teslim commit / PR:
Build:
Değişen dosyalar:
Çözülen sorun:
Test komutları ve gerçek sonuçları:
HTTP içerik doğrulaması:
Ekran görüntüsü / rapor yolları:
Bilinen hata / geri alma yöntemi:
İnsan testi gerekiyor mu, neden:
Sıradaki tek görev:
Teslim alanın inceleme sonucu:
