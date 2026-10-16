# N.P.N.G. — 5v5 TL ekonomisi ve satın alma menüsü

Sürüm: **1.0.0** · Hazırlayan: Codex · Tarih: 16.10.2026. Berkan'ın bu mesajındaki rakamlar esas alınmıştır; güncel CS2 fiyatlarıyla değiştirilmemiştir. Paylaşılan üç ekran görüntüsü yalnız menü düzeni referansıdır.

**Teslim hazır; oyuna bağlanmış değildir.** Oyun koduna yazılmadı. Mevcut `tm` sunucu modu 30 takım öldürmesine dayalıdır; bu paket ayrı bir bombalı 5v5 raunt modu içindir. Claude entegrasyonu yapar. Maç cüzdanı, lobinin banka/mağaza parasından ve `SV.tl` hesabından ayrıdır; mağazada silah/skin sahibi olmak maçta ücretsiz silah sağlamaz.

## Dosyalar

| Dosya | Kullanım |
|---|---|
| `competitive-economy.v1.json` | Fiyatlar, ödüller, takımlar, menü, alım sınırları ve sunucu sözleşmesinin ana kaynağı |
| `competitive-economy.v1.sqlite` | JSON ve 27 ürünle doldurulmuş SQLite veritabanı; gerçek hesap/maç verisi içermez |
| `schema.sqlite.sql` | Sıfırdan SQLite şeması; para, envanter, tekrar gelen istek ve olay kayıtları |
| `MENU_TASLAGI.svg` / `.png` | CT menüsü için görsel yerleşim taslağı |
| `../../tests/economy/contract.test.cjs` | Kullanıcı şartları ve sınır durumlarının kabul testleri (proje kökünden `tests/economy/`) |
| `../../tests/economy/reference.cjs` | Testlere ait bağımsız hesaplama örneği; üretim sunucusu değildir |

## 1. Para ve raunt ödülleri

- Para birimi TL; veri tabanında **tam sayı lira**, UI'da `₺800`, `₺2.700`, `₺16.000`. ISO kodu `TRY`, kuruş kullanılmaz.
- İlk tabanca raundu **₺800**, cüzdan tavanı **₺16.000**. Bütün para girişleri tavanda kırpılır.
- Galibiyet takımın her oyuncusuna **₺3.250**. Galibiyetin nedeni bomba patlatma veya çözmeyse kişi başına +₺250 = **₺3.500**. Bu ₺250 takım arasında bölünmez.
- T kaybettiği rauntta bombayı kurmuşsa her T oyuncusuna, canlı/ölü fark etmeksizin, mağlubiyet parasına **+₺800** eklenir. Kurana ayrıca kişisel para eklenmez; istenmediği için kişisel kurma/çözme bonusları 0'dır.
- Süre bombayı kurmadan dolarsa **canlı T yalnız raunt sonu ödemesinden ₺0 alır**. Önceden kazandığı kill parası ve eski bakiyesi silinmez. Ölü T normal seri parasını alır. CT canlı/ölü normal galibiyet parasını, ₺3.250 alır.
- Ödeme, başlama anındaki oyuncu/katılım kaydına göre sunucuda yapılır. Seyirci ve henüz raunda katılmamış geç giriş oyuncusu ödeme alamaz. Bağlantı kopması cüzdanı veya gerçek canlı/ölü durumunu yeniden oluşturmaz.

| Arka arkaya kayıp | Normal mağlubiyet | Bomba kurup kaybeden T |
|---|---:|---:|
| 1 | ₺1.400 | ₺2.200 |
| 2 | ₺1.900 | ₺2.700 |
| 3 | ₺2.400 | ₺3.200 |
| 4 | ₺2.900 | ₺3.700 |
| 5 ve sonrası | ₺3.400 | ₺4.200 |

**Seri kararı:** Mesajdaki “üst üste mağlubiyet” kuralı uygulanır; galibiyet seriyi **0'a sıfırlar**. Kazandıktan sonraki ilk kayıp ₺1.400'dür. CS'nin bazı sürümlerindeki kademeli bir basamak düşürme yöntemi kullanılmaz. Canlı T'nin süre nedeniyle para alamadığı kayıp da takımın serisini artırır.

| Raunt nedeni | Kazanan | Kazanan ödemesi | Diğer taraf |
|---|---|---:|---|
| CT'lerin tamamı öldü | T | ₺3.250 | CT seri ödülü |
| T'lerin tamamı öldü, bomba yok | CT | ₺3.250 | T seri ödülü |
| Süre doldu, bomba yok | CT | ₺3.250 | Canlı T: 0; ölü T: seri ödülü |
| Bomba patladı | T | ₺3.500 | CT seri ödülü |
| Bomba çözüldü | CT | ₺3.500 | T seri ödülü + ₺800 |

Bomba kurulunca normal raunt saati sonuç üretmeyi bırakır; bomba sayacı devralır. T'ler öldü diye CT otomatik kazanamaz: bomba çözülmeli veya patlamalıdır. Bomba kurulu olsa bile CT tamamen öldürülerek kazanılmışsa sebep `ct_eliminated` olur ve ödeme ₺3.250'dir; henüz gerçekleşmeyen patlama için +₺250 verilmez.

## 2. Kill ödülleri

| Kaynak | Ödül |
|---|---:|
| Standart tabanca, tüfek, ağır makineli | ₺300 |
| Seri tabanca / ağır keskin nişancı (AWP muadili) | ₺100 |
| SMG | ₺600 |
| Yüksek şarjörlü SMG (P90 muadili) | ₺300 |
| Pompalı | ₺900 |
| Bıçak / yakın dövüş | ₺1.500 |
| HE / molotof / diğer bomba kaynaklı düşman ölümü | ₺300 |

Ürün tablosundaki istisna genel sınıfın önüne geçer. ₺500'lük zırh delici ve ₺700'lük ağır tabancanın ödülü özellikle **₺300** tutulmuştur; **₺100'lük tabanca istisnası seri tabancadır**. Sis/flaş/yem normalde doğrudan öldürmez; bir düşman ölümü bu ürüne gerçekten atfedilebiliyorsa bomba kaynağı ₺300 kuralı uygulanır.

Takım arkadaşını öldürme, intihar ve çevresel ölüm ödülü 0. Mesajda belirtilmediği için ayrıca takım öldürme para cezası eklenmedi. Bomba patlaması takım arkadaşına ödül üretmez. Ödül öldüren hasar olayının silah kimliğine göre belirlenir; sonradan bıçağa geçmek tüfek öldürmesini ₺1.500 yapamaz. Aynı ölüm olayı iki kez para vermez.

## 3. Tam ürün tablosu

### Tabancalar

| Kimlik | Ürün | Takım | Fiyat | Kill |
|---|---|---|---:|---:|
| `t_default` | T Başlangıç Tabancası | T | Ücretsiz | ₺300 |
| `ct_default` | CT Başlangıç Tabancası | CT | Ücretsiz | ₺300 |
| `pistol_standard` | Standart Tabanca | İkisi | ₺300 | ₺300 |
| `pistol_piercing` | Zırh Delici Tabanca | İkisi | ₺500 | ₺300 |
| `pistol_auto` | Seri Tabanca | İkisi | ₺600 | ₺100 |
| `pistol_heavy` | Ağır Tabanca | İkisi | ₺700 | ₺300 |

Başlangıç tabancası spawn'da boş tabanca yuvasına otomatik verilir. Menüde “Ücretsiz · başlangıç” bilgisi görünür; tekrar tekrar alınıp yere atılamaz. “Magnezyum doldurmalı” ifadesi gerçek bir mühimmat özelliğine çevrilmedi; ağır tabanca rolü olarak adlandırıldı.

### SMG / pompalı

| Kimlik | Ürün | Takım | Fiyat | Kill |
|---|---|---|---:|---:|
| `smg_budget` | Ekonomik SMG | İkisi | ₺1.050 | ₺600 |
| `t_smg` | T Hücum SMG | T | ₺1.200 | ₺600 |
| `ct_smg` | CT Hücum SMG | CT | ₺1.400 | ₺600 |
| `smg_capacity` | Yüksek Şarjörlü SMG | İkisi | ₺2.350 | ₺300 |
| `shotgun_basic` | Temel Pompalı | İkisi | ₺1.200 | ₺900 |

### Tüfekler

| Kimlik | Ürün | Takım | Fiyat | Kill |
|---|---|---|---:|---:|
| `t_budget_rifle` | T Ekonomik Tüfek | T | ₺2.000 | ₺300 |
| `ct_budget_rifle` | CT Ekonomik Tüfek | CT | ₺2.250 | ₺300 |
| `t_main_rifle` | T Ana Tüfek (AK rolü) | T | ₺2.700 | ₺300 |
| `ct_main_rifle` | CT Ana Tüfek (M4 rolü) | CT | ₺3.100 | ₺300 |
| `sniper_light` | Hafif Keskin Nişancı | İkisi | ₺1.700 | ₺300 |
| `sniper_heavy` | Ağır Keskin Nişancı | İkisi | ₺4.750 | ₺100 |

### Ekipman

| Kimlik | Ürün | Takım | Fiyat | Kill |
|---|---|---|---:|---|
| `armor_vest` | Yelek | İkisi | ₺650 | — |
| `armor_helmet` | Yelek + Kask | İkisi | ₺1.000 | — |
| `defuse_kit` | İmha Kiti | CT | ₺400 | — |
| `knife` | Savaş Bıçağı | İkisi | Ücretsiz | ₺1.500 |

Bıçak spawn ekipmanıdır, sınırsız ücretsiz satın alınamaz. Zırh 100 kapasitedir. Tam sağlam yeleği olup kaskı olmayana **yalnız kask yükseltmesi ₺350** gösterilir. Hasarlı yelek ve kask yoksa tam paket ₺1.000; kaskı olup zırhı hasarlıysa tamir ₺650, mevcut kask korunur. Zırh/kask zaten tamsa tekrar alım reddedilir. İmha kiti bir adettir; T alamaz/kullanamaz.

### Bombalar

| Kimlik | Ürün | Takım | Fiyat | Kill kaynağı |
|---|---|---|---:|---:|
| `grenade_he` | El Bombası | İkisi | ₺300 | ₺300 |
| `grenade_flash` | Flaş Bombası | İkisi | ₺200 | ₺300 |
| `grenade_smoke` | Sis Bombası | İkisi | ₺300 | ₺300 |
| `t_molotov` | Molotof | T | ₺400 | ₺300 |
| `ct_incendiary` | Yanıcı Bomba | CT | ₺600 | ₺300 |
| `grenade_decoy` | Yem Bombası | İkisi | ₺50 | ₺300 |

Toplam **4 bomba**, en fazla **2 flaş**, diğer türlerden **1 adet**. İki farklı yanıcı kimliği tek `fire` türü sayılır. Ölünce harcanmayan envanterin drop/temizleme davranışı raunt kurallarına aittir; sunucu aynı eşyanın iki kişide kopyalanmasına izin vermez.

## 4. Radial menü sözleşmesi

Altı eşit dilim, saat yönünde, ilk dilim tepe noktasından başlar:

| Kök dilim / tuş | İçerik |
|---|---|
| 1 | Tabancalar |
| 2 | SMG / Pompalı |
| 3 | Tüfekler |
| 4 | Ekipman |
| 5 | Bombalar |
| 6 | Kapat |

Alt menü önce oyuncunun takımına göre filtrelenir; sıralama JSON'daki sıradır. En çok beş ürün 1–5'e yerleşir, **6 her zaman Geri**. Kullanılmayan dilimler devre dışıdır. Ortadaki Geri düğmesi de aynı işi yapar.

- **B** aç/kapat; **Esc / 0** alt menüden geri, kökte kapat. Fareyle dilime gelmek yalnız önizlemedir; tıklama veya ilgili sayı tuşu açıkça satın alır. Kategori sayı tuşu ürün satın almaz; yalnız o kategoriye girer.
- Sol üstte **Satın alma: 00:30**, oyuncu takımı ve maç cüzdanı. Sağ bilgi kartında ad, TL fiyatı, kill ödülü, rol, mevcut eşya ve eksik bakiye. Sağ altta maç envanteri.
- Yeşil/alınabilir, gri/mevcut veya süre dışı, kırmızı/yetersiz para. Yanlış takım ürünü gösterilmez. Her durum ayrıca yazıyla belirtilir; yalnız renge dayanmaz.
- Örnek: CT, ₺5.000, ana tüfek seçili → `Fiyat ₺3.100 · Kill ₺300 · Alım sonrası ₺1.900`. İşlem henüz sunucu onayı almadıysa cüzdan kesin düşmüş gibi gösterilmez.
- Ateş, silah değiştirme ve kamera bakışı menü açıkken oyuna iletilmez. Fare kilidi bırakılır; menü kapanınca kullanıcı eylemiyle geri istenir. Süre bitince veya oyuncu ölünce menü kapanır; sunucu gelen geç isteği yine reddeder.
- İlk sürümde otomatik alım/öncekini yeniden alım yok. CS referansındaki müzik, kasa, skin, sezon vb. paneller bu maç menüsüne taşınmaz.

## 5. Belirtilmeyen alanlar için seçilen varsayımlar

Bunlar mesajdaki zorunlu fiyat/ödüllerden ayrı tasarım kararlarıdır; JSON'da ayrı tutulur:

- Alım süresi **30 sn**, freeze başladığında başlar. Freeze **15 sn**; böylece live başladıktan ilk 15 sn hâlâ kendi alım bölgesinde alışveriş yapılabilir.
- Canlı raunt **115 sn**, kurma **3,2 sn**, bomba **40 sn**, çözme kitsiz **10 sn**, kitle **5 sn**. Raunt içinde yeniden doğma yok. Kask/zırhın hasar azaltma oranı bu ekonomi paketinde uydurulmadı; oyun balansı görevidir.
- İki silah yuvası: bir primary + bir secondary; ayrı bıçak. Yeni silah alınca eskisi aynı işlemde yere düşer; satılmaz. Aynı ürün zaten kuşanılmışsa tekrar alım reddedilir. Mermi satış menüsü yok; alımda standart dolu şarjör/yedek mermi dahildir.
- Hayatta kalan silah/zırh/kit ve kullanılmamış bombalarını sonraki rauntta korur; ölü oyuncu yeni spawn'da başlangıç tabancası ve bıçak alır. Devre/takım değişiminde cüzdan ₺800'e, seri 0'a ve envanter başlangıca sıfırlanır.
- Rakip silahı yerden almak satın alma takım kısıtına tabi değildir. T bir CT tüfeğini kullanabilir; imha kiti istisnadır ve yalnız CT kullanır.
- İade, satış, oyuncudan oyuncuya para ve banka transferi yok. Reconnect aynı sunucu cüzdanını bulur; tekrar ₺800 vermez. Geç katılan oyuncu sonraki spawn'da bir kez ₺800 ile başlar, kaçırdığı rauntların parası birikmez.

## 6. Sunucu / veritabanı entegrasyonu

1. Yeni maç açılırken config sürümü ve SHA256 sabitlenir; maç ortasında fiyat/ödül değiştirilmez. SQLite hazır dosyası yalnız katalogdur, oyuncu eklemez.
2. Sunucu kendi maç oyuncu kimliğinden takım/canlılık/bölge/envanter/bakiye okur. İstemci yalnız `matchId`, `roundId`, `requestId`, `itemId` yollar. İstemcinin fiyat/para/takım/ödül bilgileri kullanılmaz.
3. `BEGIN IMMEDIATE` ile alım denetlenir. Aynı requestId daha önce işlendiyse eski sonuç dönülür; farklı ürünle aynı anahtar hata verir. Ürün verme, eski silahı düşürme, para kesme ve ledger tek transaction'dır. Her hata ROLLBACK.
4. Ödeme için tek sunucu round-end olayı kullanılır. Raunt zaten kapatıldıysa tekrar para verilmez. İki takımın seri durumu, bütün oyuncuların ödemesi ve `rounds.settled_at` birlikte commit edilir.
5. Ledger hem `requested_delta` hem tavandan sonra gerçekten uygulanan `applied_delta` ve `balance_after` saklar. Örnek: ₺15.900 + ₺4.200 ödül → bakiye ₺16.000, gerçek eklenen ₺100.
6. Sunucu yeniden başlarken son commit edilmiş maç/cüzdan/olay kimlikleri yüklenir; eski ödül tekrar uygulanmaz. Maç silinince hesabın kalıcı mağaza parası etkilenmez.

Şema; tam sayı, cüzdan tavanı, takım, benzersiz istek/olay, tek primary/secondary ve yabancı anahtar sınırları içerir. Bölge, faz/zaman, grenade toplam/tür limiti, item-slot/config eşleşmesi ve işlem yetkisi **sunucu tarafından aynı transaction içinde** uygulanmalıdır. SQL tek başına ağ sunucusu veya bütün oyun kuralları değildir.

Katalogdaki `modelBinding` mevcut GLB'ler için **yalnız görsel adaydır**. Mevcut mağaza fiyatı ve hasar/atış/mühimmat istatistiği maç balansı olarak alınmaz. Seri tabanca varyantı; bomba raunt akışı, alım bölgeleri, zırh/kit etkileri ve bomba davranışları henüz oyun uygulaması ister. AWM/Scout modelleri ekonomik rolü hazır diye mevcut hasarları otomatik doğru sayılmaz.

## 7. Test ve teslim

Proje kökünde, mevcut Node.js 24 ile:

```sh
node tests/economy/build-config.cjs
node --test tests/economy/contract.test.cjs
node tests/economy/build-database.cjs
```

Veritabanı üreticisi mevcut `.sqlite` dosyasının üzerine yazmaz; gerçek maç/hesap verisini silmez. Testler bellek içi ayrı SQLite kullanır. SQLite dosyasında `economy_configs` 1, `catalog_items` 27; maç/cüzdan/ledger tabloları boştur.

**Sonuç: 17/17 PASS.** Kullanıcı fiyatları ve istisnalar, altı dilime sığma, bütün zafer nedenleri, seri/tavan, canlı T süre istisnası, T kurma bonusu, 800 TL tabanca raundu alışverişi, takım/bölge/süre/bakiye engelleri, zırh yükseltme, bomba kapasitesi, atomik silah değişimi, tekrar istek ve SQLite çift olay/rollback doğrulandı. Kanıt: `TEST_SONUCU.txt`.

Sıradaki teslim alan Claude: bu belge/JSON'u bombalı 5v5 moduna bağlar; Kimi hareket/animasyon dosyalarını bu paket değiştirmez. Entegrasyondan sonra gerçek sunucuda iki oyuncunun eşzamanlı alımı, aynı olayın tekrarı ve iki tam raundun uçtan uca testi gerekir. Bu kabul testleri oyuna entegrasyonun tamamlandığı anlamına gelmez.
