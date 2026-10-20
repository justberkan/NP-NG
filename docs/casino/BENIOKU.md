# DEDE — NPNG Kumarhane (Slot Yaması)

Bu klasör, N.P.N.G.'ye kumarhane slotu olarak eklenecek **DEDE** temalı yamadır.
Kendi başına çalışır (tarayıcıda `assets/casino/dede/index.html` açın), oyuna gömülünce
oyunun hesap verisi üzerinden çalışır. **Entegrasyonu Claude yapacaktır** —
bu yama yalnızca yeni dosyalar içerir, oyunun mevcut dosyalarına dokunmaz.

## Tema

Berkan'ın özgün "DEDE" karakteri: asır yaşında, şimşekli, ağız dolusu gülen
kumarhane ağası. Alay eder, gaz vermez. Hiçbir yerde "kesin kazanırsın" türü
bir ifade yoktur. "Gates of Olympus" adı, logosu ve Pragmatic Play'e ait görseller
**hiçbir yerde kullanılmaz**.

## Görsel varlıklar (`assets/casino/dede/`)

Kaynak görseller Berkan'dan geldi (3 adet JPG). `dede-isleme/` çalışma klasöründe
her poz için **rembg ve flood-fill** ile zemin temizleme karşılaştırıldı;
gr/mor zeminde kontrol edildi. **Flood-fill seçildi**: rembg, gövdeden ayrı
duran şimşek parçalarını silmişti; flood-fill kenar halesi ve delik bırakmadan
şimşekleri korudu. Kontrol için gri + mor zemin karşılaştırma tabakaları
`dede-isleme/karsilastirma/` altındadır.

Pozlar (WebP, 720px yükseklik, toplam **416 KB** — 2,5 MB sınırın çok altında):

| Dosya                | Poz                            | Kullanıldığı durum                                  |
| -------------------- | ------------------------------ | ---------------------------------------------------- |
| `dede-taht.webp`     | Tahtta duran (nefes/sallanma) | Bekleme; ara sıra şimşeği kaldırır (9–16 sn'de bir)  |
| `dede-simsek-kaldir.webp` | Şimşeği havaya kaldıran   | Spin basılınca; çarpan yıldırımı düşerken            |
| `dede-gul-isaret.webp`   | Parmakla gösterip gülen    | Kayıp                                                |
| `dede-su-bardagi.webp`   | Soğuk su bardağı uzatan    | Üst üste 3+ kayıp veya bet ≥ 10.000'i kaybedince     |
| `dede-simsek-yuru.webp`  | Sinirli yürüyüş (arka)     | Kazanç                                               |
| `dede-arka.webp`         | Arkadan (destek pozu)      | Dosyada hazır                                        |

Orijinal JPG'ler `assets/casino/dede/orijinal/` altında saklanır.
Görseller kumarhane açılınca yüklenir (lazy load), oyun açılışında değil.

Poz geçişleri yumuşak (parlaklık/ölçek solması + balon). Efektleri azalt
seçeneği açıkken yıldırım sarsıntısı ve parçacık sayısı düşer.

## Diyalog balonu

Replikler olay havuzlarından rastgele seçilir; **son 4 id tekrar etmez**.
Kazanacağını vaat eden laf YOK. Sesli replikler `assets/casino/dede/ses/<id>.mp3`
altında — **geçici edge-tts (tr-TR) üretimi — Berkan'ın kayıtlarıyla değiştirilecek**.
Tümü mono, 24 kHz, 64 kbps, toplam ~0,9 MB. Dosya eksikse tarayıcı
`speechSynthesis` tr-TR yedeği devreye girer:

- `spin-1`–`spin-5`: "Hadi bakalım, şansını göreyim!" vb.
- `kayip-1`–`kayip-6`: "Paranı aldım, teşekkürler evlat!", "Ahahah, olmadı yine!" vb.
- `bkayip-1`–`bkayip-4`: "Al şu suyu da kendine gel." vb.
- `kazanc-1`–`kazanc-5`: "Hıh! Bu seferlik kazandın.", "Kim verdi bu çarpanı?!" vb.
- `carpan-1`–`carpan-4`: "Al sana iki kat!", "YÜZ KAT! Ben mi yaptım bunu?!" vb.
- `sessiz-1`: ses kapalıyken: "Aç sesimi, biraz dalga geçeceğim."
- `haftalik-1`–`haftalik-2`: "Al bakalım, dededen kötü gün tazminatı."
- `bonus-1`–`bonus-3`: haftalık bonus kısa açıklaması.
- `don-1`–`don-2` (2026-10-20): 4 dede donu düşünce: "Hey! O benim donum! Al on bedava çevirme, geri ver onu." vb.
- `satin-1`–`satin-2` (2026-10-20): bedava çevirme satın alınınca: "Parayla bedava alıyor, ahahah!" vb.

**Ses yalnızca oyuncu sayfada ilk kez tıkladıktan sonra çalar** (tarayıcı
kısıtı). "Dedenin sesi" kutucuğu kapalıyken ne mp3 ne speechSynthesis konuşur;
balonda `sessiz-1` repliki görünür.

## Para modeli (önceki yamanın aksine)

Sayfa **kendi başına para eklemez ve kalıcı bakiye tutmaz**. Bakiye her zaman
oyundan gelir:

- Oyun çağırır: `NPNG_CASINO.setCredit(tutar)` — bu durumda sayfa demo moddan
  çıkar (`external=true`), `localStorage` kullanılmaz.
- Sayfa yalnızca olay bildirir: `NPNG_CASINO.onBet(miktar)`, `onWin(miktar)`.
- Haftalık bonus butonu `NPNG_CASINO.claimWeeklyBonus()` çağırır; tutarı oyun
  hesaplar ve `setCredit` ile geri bildirir.
- Sayfa tek başına açıldığında (oyuna gömülü değilse) demo para modu devreye girer:
  bakiye ve kayıt yalnızca `npng_casino_demo_*` localStorage anahtarlarında tutulur.

Haftalık bonus (Claude entegrasyonunda oyun tarafında hesaplanacak; sayfadaki
demo yalnızca referans): son 7 günün net kaybının %10'u, tavan `CONFIG.WEEKLY.cap`
(25.000), haftada bir kez butonla alınır.

Sayfada her zaman görünür yerde **"Sanal para — gerçek para değeri yoktur"** yazar.

## Yapay "kıl payı kaçırma"

`CONFIG.nearMiss` ayrı bir ayara bağlıdır ve **varsayılanı KAPALIdır**. RTP
ölcümü bu ayar kapalıyken yapıldı. Açıkken geriye dönük bir ölçümde RTP
%94.83'e inmişti; karar Berkan'a bırakıldı.

## Çarpan değerleri ve RTP

Çarpan küreleri: **2x, 3x, 4x, 5x, 10x, 25x, 50x, 100x**. Düşerken dede
şimşeği kaldırır; çarpanın konduğu kutuya yıldırım çakar (ışık + kısa sarsıntı,
"efektleri azalt" ile kapanır).

`node tests/casino-rtp.cjs` ile 1.000.000 spin simülasyonu:

```
toplam spin      : 1.000.000
toplam bahis     : 1.000.000
toplam kazanç    : 962.825
RTP              : %96,28          (hedef bant %95–97)
vuruş (isabet)   : %33,72
bonus oranı      : 1 / 398
bonus RTP payı   : ~%27
en büyük kazanç  : 2.955x bahis
tohum            : 20261019
near-miss        : KAPALI (varsayılan)
```

## Dosyalar

- `assets/casino/dede/index.html` — tema, mantık, test kancası (UI testlerini çalıştırır).
- `assets/casino/dede/*.webp` — 6 poz (416 KB toplam). `orijinal/` altında kaynak JPG'ler.
- `tests/casino-rtp.cjs` — RTP simülasyonu (yukarıdaki çıktıyı üretir).
- `tests/casino-ui.cjs` — tema kancası/balon/poz/para modeli testleri.
- `docs/casino/` — olay bazlı ekran görüntüleri (`dede-idle`, `dede-kayip`,
  `dede-su`, `dede-100x`, `dede-ses-kapali`, `dede-kazanc`, `dede-weekly`).

## Test

```
npm test                    # tüm testler (önceki oyun testleri dahil)
node tests/casino-rtp.cjs   # yalnız RTP simülasyonu
node tests/casino-ui.cjs    # yalnız tema testi
```

## Oyuna entegrasyon (Claude, 2026-10-19 · build 202610191230)

- Sayfa `casino/` yerine `assets/casino/dede/index.html` altında: sunucu yalnız `index.html`, `assets/`, `js/`, `css/`, `lib/` sunar
  (EXE'nin çevrimdışı kopyası da bu kökleri alır). Görsel/ses yolları aynı klasöre göre (`taht.webp`, `ses/<id>.mp3`).
- Oyunda: Kumarhane → **DEDE ⚡** (ilk sekme, varsayılan). Eski emoji slot "Meyve slot" adıyla duruyor.
- `js/casino.js`: sayfa aynı kökenden iframe ile açılır, `NPNG_CASINO` doğrudan kullanılır. Para yalnız oyunda (`SV.tl`):
  `onBet` → düş, `onWin` → ekle, her olaydan sonra `setCredit` ile geri yollanır. iframe bir kez açılır ve yerinde kalır;
  sekmeden çıkınca süren çevirme arka planda biter ve ödenir, otomatik çevirme durur (`stopAuto`).
- Haftalık bonus oyunda hesaplanır (`casWeekly`): tüm kumarhane oyunlarının son 7 günlük net kaybının %10'u, tavan 25.000,
  haftada bir; kayıt hesapta (`SV.cas`). **Çevrimdışıyken verilmez** (çevrimdışı = para sınırsız, kayıt yok).
- Sayfada yapılan küçük değişiklikler: bahis basamakları 10 TL'den başlar (yeni hesap 31 TL), `stopAuto`/`spinning`/`weeklyStatus`
  API'ye eklendi, bonus adım ödemeleri hesaplanan 5000x tavanını aşamaz, çevrimdışı bonus mesajı.
- Test: `tests/casino-rtp.cjs` (npm test kapısı: RTP %95–97, near-miss kapalı), `tests/casino-dede.cjs` (oyun içi para/bonus/çıkış).

## Bedava çevirme + düşme animasyonu (Claude, 2026-10-20 · build 202610200230 · Berkan isteği)

- **Animasyon:** dönen/bulanık makara kaldırıldı. Çevirince eski taşlar aşağı düşüp çıkar, yenileri tahtanın üstünden
  düşer; her sütun alttan üste dolar, sütunlar soldan sağa kısa arayla (hepsi neredeyse aynı anda). Kazanan taşlar
  patlar, yalnız üstlerindeki taşlar kayar ve boşluğa yukarıdan yeni taş gelir.
- **Dede donu (scatter):** eski şimşek simgesi yerine puanlı, yamalı dede donu. Ekrana aynı anda **4+ don** düşerse
  **10 bedava çevirme** (eskiden 15). Bedava çevirmede 3+ don = +5 çevirme. Çarpan küreleri turu boyunca birikir.
- **Bedava çevirme satın al:** üstteki pembe düğme. Fiyat **10 × bahis** (100 TL bahiste 1.000 TL), 10 çevirme.
  İlk basış "EMİN MİSİN?" der, 3,5 sn içinde ikinci basış satın alır (yanlışlıkla büyük harcama olmasın).
- **Ekonomi:** satın alınan tur kendi fiyatının ortalama ~%96'sını geri verir (normal oyunla aynı). Doğal (4 don ile)
  tur daha cömerttir (~26× bahis); satın alınan tur ~9,6× bahis. Satın alınan tur doğal turla aynı güçte olsaydı
  10× fiyatla her alışta ortalama ~2,6 kat kâr olurdu ve sanal para ekonomisi patlardı. Doğal turun gücünde bir satın
  alma isteniyorsa fiyat ~27× bahis olmalı (karar Berkan'ın).
- Doğal bedava çevirme artık daha sık: ~1/209 çevirme (eskiden ~1/398).
- Çarpan küresi yalnız ilk tahtada düşer (sonradan düşen taşlarda küre yok; zaten sayılmıyorlardı). Kazanç varsa
  küreler en sonda çakar.

`node tests/casino-rtp.cjs` (2026-10-20):

```
düz simülasyon (1M, tohum 20261019) : %96,60   bedava çevirme 1/209, en büyük 2.830x
katmanlı tahmin (kapı)              : %96,46   (bant %95–97)
satın alma (100 bin kez, fiyat 10x)  : %96,32   ortalama dönüş 9,63x, en büyük 248x (bant %95–97,5)
```

Kapı neden katmanlı: jackpot (1/50.000) ve efsane (1/6.700) kategorileri düz simülasyonu 1M çevirmede ±%1,3
oynatıyor; kod değişip rastgele sayı sırası kayınca kapı şans eseri geçip kalabiliyordu. Katmanlı tahmin her
kategoriyi kendi içinde yeterince çevirip olasılığıyla tartar (aynı oyun, daha kesin ölçüm).

Test: `tests/casino-dede.cjs` satın alma (onay, 10× düşüş, kazanç oyuna), yetersiz bakiye, 4 don ile doğal tetikleme.

## Yeni oyunlar: LOKUM, Çivi Topu, Canlı Blackjack (Claude, 2026-10-20 · Berkan isteği)

Gerçek marka adları ve çizimleri kullanılmadı (oynanış tarzı aynı, isimler/çizimler özgün).

**LOKUM** (`assets/casino/lokum/index.html`) — şeker temalı 6×5 düşmeli slot.
- Aynı şekerden ekranın herhangi bir yerinde 8+ = kazanç (8-9 / 10-11 / 12+), kazananlar patlar, yenileri düşer.
- 4+ pamuk şeker = 10 bedava çevirme (bedava çevirmede 3+ = +5). Pamuk şeker ödemesi: 4 → 2×, 5 → 5×, 6+ → 50× bahis.
- Bedava çevirmede çarpan şekerleri (2×–100×) düşer; o çevirmede kazanç varsa ekrandakilerin toplamı kazancı çarpar.
- **Şansı 2× yap:** bahis %25 artar (20 → 25), bedava çevirme 2 kat sık gelir. Açıkken satın alma kapalı.
- **Bedava çevirme satın al:** 100 × bahis (iki kez bas onayı). Satın alınan tur doğal turla aynı.
- Doğal motor: sonuç planlanmaz, her taş ağırlıklı rastgele. Büyük ölçüm (milyonlarca çevirme):
  normal ~%96,5 · şans 2× ~%96,6 · satın alma ~%96,3. Bedava çevirme ~1/400 (şans 2× ile ~1/195), ort. ~96× bahis. Tavan 5.000×.

**Çivi Topu** (`assets/casino/civi/index.html`) — Plinko tarzı.
- Risk düşük/orta/yüksek, 8–16 sıra; top her çivide %50 sola/sağa sapar, düştüğü kutunun çarpanı ödenir.
- 27 çarpan tablosu özgün; her birinin geri ödemesi KESİN hesapla %95,9–%97,0 (yüksek risk 16 sıra: kenar 1.000×, orta 0,1×).
- Manuel / Otomatik (top sayısı, 0 = sınırsız), aynı anda birden çok top. Ödeme çizimden bağımsız: sekme değişse de top öder.

**Canlı Blackjack** (sunucu: `server-blackjack.js`, oyun: Kumarhane → Canlı Blackjack 🃏) — çevrimiçi, çok oyunculu.
- 3 masa: Masa 1 (₺10–10.000), Masa 2 (₺100–100.000), Masa 3 · VIP (₺1.000–1.000.000), her biri 5 koltuk; herkes izleyebilir.
- Akış: oturan bahis koyar → 12 sn bahis süresi (herkes koyunca hemen) → kartlar → soldan sağa sıra, her oyuncuya 15 sn
  (süre dolunca otomatik "dur"; iki el üst üste süre dolarsa masadan kalkar) → krupiye → ödeme → 5 sn sonra yeni el.
- El ortasında oturan sıradaki eli bekler. Hamleler: kart çek, dur, 2× katla, böl (bir kez; bölünen aslara birer kart).
- Kurallar: 6 deste, krupiye yumuşak 17'de durur, blackjack 3:2, sigorta yok. Kartları sunucu karıştırır (hile yapılamaz).
- Para: kabul edilen bahis/katlama/bölme anında düşer, kazanç el sonunda eklenir. Bağlantı koparsa el otomatik biter,
  kazanç hesapta bekler ve sonraki girişte verilir. Sekmeden ya da kumarhaneden çıkınca masadan kalkılır.
- Çevrimdışıyken canlı masa yok (tek kişilik "Blackjack" sekmesi duruyor).

Testler: `tests/casino-games.cjs` (Çivi Topu kesin RTP, LOKUM katmanlı RTP, oyun içi para), `tests/live-blackjack.cjs`
(ham bağlantılarla 3 oyuncu: sıra, bekleme, ödeme kuralları, süre, kopma + tarayıcı).
