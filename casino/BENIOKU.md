# DEDE — NPNG Kumarhane (Slot Yaması)

Bu klasör, N.P.N.G.'ye kumarhane slotu olarak eklenecek **DEDE** temalı yamadır.
Kendi başına çalışır (tarayıcıda `casino/index.html` açın), oyuna gömülünce
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
Kazanacağını vaat eden laf YOK. Ses sesli replik id listesi (mp3'ler sonraki
adımda `edge-tts` ile üretilecek, dosya yoksa tarayıcı `speechSynthesis` tr-TR
yedek kullanır):

- `spin-1`–`spin-5`: "Hadi bakalım, şansını göreyim!" vb.
- `kayip-1`–`kayip-6`: "Paranı aldım, teşekkürler evlat!", "Ahahah, olmadı yine!" vb.
- `bkayip-1`–`bkayip-4`: "Al şu suyu da kendine gel." vb.
- `kazanc-1`–`kazanc-5`: "Hıh! Bu seferlik kazandın.", "Kim verdi bu çarpanı?!" vb.
- `carpan-1`–`carpan-4`: "Al sana iki kat!", "YÜZ KAT! Ben mi yaptım bunu?!" vb.
- `sessiz-1`: ses kapalıyken: "Aç sesimi, biraz dalga geçeceğim."
- `haftalik-1`–`haftalik-2`: "Al bakalım, dededen kötü gün tazminatı."
- `bonus-1`–`bonus-3`: haftalık bonus kısa açıklaması.

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

- `casino/index.html` — tema, mantık, test kancası (UI testlerini çalıştırır).
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
