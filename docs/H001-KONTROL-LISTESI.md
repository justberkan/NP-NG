# H001 — Berkan'ın his/kamera/gerçek cihaz testi kontrol listesi

Tarih: 16.10.2026 · Hazırlayan: Kimi (R001'in devamı)
Oynatma: `node server.js` → http://localhost:3000 → sağ altta `build 202610170101 · hareket-test-v1` görünmeli.

Bu liste teknik doğruluğu onaylanmış değerleri his testine çevirir. Otomatik testler geçti; burada ölçülen değerlerin **gerçek fare/klavye/monitörde nasıl hissettirdiği** önemli. Her maddeden sonra: beğendin mi, yavaş/hızlı/hafif/ağır mı, notun ne — kısaca yaz.

| # | Test | Nasıl yapılır | Teknik beklenti (otomatik testten) | Ne hissedeceksin / neye bak |
|---|---|---|---|---|
| 1 | Koşu hissi | W ile düz koş | 5.25 m/s; karşı tuşla (S) ~0.05 sn durma | CS/Valorant tarzı "anında duran" his. Ayağı kaygan geliyor mu? |
| 2 | Hızlanma | Durağandan W'ye bas | (ölçülmedi, gözle) | Hız oturması çok uzun mu, çok ani mi? |
| 3 | Tek zıplama | Space tek basış | ~1.25 m yükseklik | Zıplama "boş" mu "ağır" mı? |
| 4 | Bhop | Space BASILI TUT + fareyle düz dönüşler | 8.8 → 11.7 → 13.5 m/s dizisi; zıplama anı sınırı 11.5 | Ritim tutturunca hızın arttığı his. Kopuk/kesikli mi? |
| 5 | Otomatik zıplama kapalıyken | Ayarlardan autoHop kapat, 4 ile karşılaştır | Aynı sınır, elle basışla | Hangisi daha iyi hissettirdi? |
| 6 | Kutu kenarı | Kenara in, kenar şeridinde kal, çıkmaya çalış | Takılma yok; basamak: yerde 0.45 m, havada 0.75 m | Kenarda "yapışkan" ya da "kaygan" his var mı? |
| 7 | Tırmanma | 3 m duvara DİREKT bak + W | ~1 sn'de üstüne çıkma; bakmadan tırmanmama | Tırmanma anlaşılır mı, ani mi? |
| 8 | Duvar koşusu | 4 m yan duvara paralel koş, havada duvar yönü tuşu (sol duvar=A) | ~1.1 sn asılı kalma, ~7.4 m/s; kamera 8° eğilir | "Parkour" hissi var mı, kamera eğikliği rahatsız mı? |
| 9 | Eğilme | C (Ctrl+W sekmeyi kapatır) | Hız yarıya (2.625 m/s), göz 1.1 m | Yavaşlık doğal mı? 6.2 m/s üstü basınca kayma başlıyor. |
| 10 | Sekme değişimi | Koşarken alt-tab yap, dön | Takılı kalan tuş/kayma/kanca tetiklenmemeli | Dönünce karakter kendi kendine hareket ediyor mu? (Eskiden ediyordu, düzeltildi.) |
| 11 | FPS hissi | Aynı koşuyu farklı monitör/hz hissiyle | Fizik FPS'ten bağımsız (30–240 aynı mesafe) | Düşük FPS'te oyun "yavaşlıyor" gibi mi? |
| 12 | Uzun takılma | Bilgisayarı 1-2 sn zorla (ağır program aç) | Frame uzasa da fizik 8 adımla sınırlı, kopma yok | Geri dönünce ışınlanma/çakılma var mı? |
| 13 | Nişan | Sağ tık ADS | Yakınlaştırma SET.adsZoom ile ayarlı | Ekran ortası silahla kapanıyor mu? Kırmızı nokta her zaman görünüyor mu? |

## Bilinen açık sorunlar (bunlar hata değil, sıraya alındı)
- Aim Training'de loadout menüsü hâlâ açılıyor (yalnız zom/zo olmalı — T007).
- Hareket hissi beğenilmezse sayısal değerler (5.25, 11.5, 13.5...) tek tek oynanabilir; otomatik testler koruyucudur.

## Geri bildirim formatı (kısa yeter)
```
1-5: iyi / yavaş / kaygan ... not: ...
6-8: ...
10: takılı tuş var/yok
13: ...
Genel: bhop hissi X, duvar koşusu Y
```
Sonuçlar T004 (silah hissi) başlamadan önce bu listeye göre kayda geçirilmeli.
