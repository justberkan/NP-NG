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
| T001 | Claude (Berkan'ın isteğiyle Codex'ten devralındı) | Kaynakları güvenli Git başlangıcına al; özel dosyaları dışla; büyük/base64 varlık boyutlarını incele; yerel ve uzak commit eşleşmesini doğrula | KOD_HAZIR · PR açık · Codex incelemesi BEKLIYOR |
| T002 | Claude | Mevcut hareketi yeniden yazmadan çalıştırılabilir regresyon testlerini tests/ altında teslim et | HAZIR; T001 sonrası |
| T003 | Codex | T002 testlerini çalıştır, gerçek başarısızlıkları düzelt, Claude incelemesine devret | T002 bekliyor |
| H001 | Berkan | Test edilmiş hareket sürümünde his/kamera/gerçek cihaz değerlendirmesi | T003 bekliyor |
| T004 | Claude | Silah hissi, recoil ve ses; hareket regresyonu bozulmadan | H001 sonrası |
| T005 | Codex | 1 karakter + 1 tüfek + 1 kılıç varlık uçtan uca doğrulaması; geometri/IK ölçümü, uyumsuz modeller raporu | Önceki adım sonrası |
| T006 | Claude | Kılıç komboları ve vuruş pencereleri; ağdan görünen animasyonlar | Önceki adım sonrası |
| T007 | Codex | Aim Training rafları/gerçek hedefler; loadout yalnız zom/zo; diğer modlara regresyon kontrolü | Önceki adım sonrası |
| T008 | Ortak | 5v5 ve online altyapı; önce Berkan'dan satın alma ekranı referansı | Önceki adım sonrası |

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

---
## Teslim kaydı — T001
Görev ID: T001
Teslim eden / teslim alan: Claude → Codex (inceleme)
Durum / tarih-saat: KOD_HAZIR · 16.10.2026 ~02:50 (Europe/Istanbul)
Dal / taban commit / teslim commit / PR: `claude/T001-ilk-gonderim` / taban `d463f2a` / teslim: bu daldaki son commit / PR: bu dal için açılan PR
Build: `202610170100 · forma-v2` (oyun kodu değişmedi; sadece depoya alındı)
Değişen dosyalar: tüm oyun kaynakları (143 dosya) + `.gitignore`, `README.md`; `NOTLAR.md` tarih düzeltmesi; bu belge (T001 satırı + bu kayıt)
Çözülen sorun: oyun kaynakları GitHub'da yoktu.
Kaynak: Berkan'ın `C:\Users\berkan\Desktop\mmofps-online` klasörü, 16.10.2026 ~02:45'te bağlantılı bilgisayardan dosya dosya kopyalandı. `_yedek/` hariç. `data/` klasörü o anda yoktu (hesap verisi yok); yine de `.gitignore`'da.
Varlık boyutları: toplam ~66 MB; en büyükler `assets/map_mc.js` 4,5 MB, `assets/ch_samus.js` 3,4 MB, `js/model_soldier.js` 2,8 MB. GitHub'ın 100 MB dosya sınırının çok altında; Git LFS gerekmiyor.
Test komutları ve gerçek sonuçları: oyun kodu değişmedi, oyun testi yapılmadı. Dosya sayısı yerel klasörle karşılaştırıldı: 143 = 143.
HTTP içerik doğrulaması: yapılmadı (kod değişmedi).
Bilinen hata / geri alma: Berkan'ın yerel klasörü Git deposu değil; GitHub Desktop ile bu depoyu klonlayıp oradan çalıştırması gerekecek. Geri alma: PR'ı birleştirmemek yeterli.
İnsan testi gerekiyor mu: Hayır.
Sıradaki tek görev: T002 (Claude) — hareket regresyon testleri `tests/` altında.
Teslim alanın inceleme sonucu: BEKLIYOR (Codex)
