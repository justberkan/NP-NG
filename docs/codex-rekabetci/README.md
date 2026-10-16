# N.P.N.G. — Rekabetçi mod ve rütbe sistemi

Sürüm **1.0.0** · 16.10.2026 · Codex. **Tasarım/konfigürasyon teslimidir; oyun kodu değiştirilmedi.** Claude entegrasyonuna hazır ayrı klasördür. Kimi'nin hareket/animasyon çalışmasına müdahale etmez.

## 1. Mod seçme ekranı

`5v5 Online` kutusunun yeni adı **Rekabetçi** olur. Kutuyu seçince iki seçenek açılır:

| Alt mod | Açıklama | Genel XP / kalıcı TL | Rekabetçi Elo / rütbe |
|---|---|---|---|
| **Rütbesiz** | 5v5 · Pratik · Rütbeni etkilemez | Var | Hiçbir değişiklik yok |
| **Rütbeli** | 5v5 · Elo ve rekabetçi rütbe | Var | Maç sonucuna göre değişir |

İlk seçim Rütbesiz'dir; Rütbeli'ye oyuncu açıkça geçer. Oyna düğmesinin üzerinde seçilen alt mod görünür. Derecelendirme sürüyorsa Rütbeli kartında `Derecelendirme 2/5 · 3 maç kaldı` yazar. Tamamlandıysa örneğin `Platin 2 · 1.342 Elo` gösterilir. Rütbesiz kartı mevcut rank'ı değiştireceği izlenimi vermez.

İki mod ayrı sırada eşleşir. Aynı maçta ranked/unranked oyuncu karışmaz. Aynı haritalar, bombalı raunt kuralları ve TL satın alma ekonomisi kullanılır. Rütbeli maç botla doldurulmaz; maç ortasında yalnız kendi kaydına reconnect eden oyuncu dönebilir.

**Dört veri birbirinden ayrıdır:**

1. `Account_XP / Account_Level`: genel hesap gelişimi; mevcut Onbaşı/Çavuş vb. seviye sistemini kullanır.
2. `Account_TL`: maç tamamlayınca hesaba verilen kalıcı oyun parası.
3. `Match_Cash`: önceki ekonomi paketinin ₺800–₺16.000 maç cüzdanı; maç içinde silah alınır.
4. `Competitive_Elo / Rank_Tier`: yalnız Rütbeli sonuçlarından değişen rekabetçi beceri puanı ve rozeti.

Maçta kalan ₺16.000 hesaba aktarılmaz. Genel seviyenin yüksek olması Elo veya rekabetçi rütbe vermez. Önceden satın alınmış skin/silah sahipliği rekabetçi maçta ücretsiz silah sağlamaz.

## 2. Maç formatı ve hesap ödülleri

Skor örneklerine uygun **MR15**: ilk 16 raunt galibiyeti maçı kazanır; taraflar 15 raunt sonunda değişir. Varsayılan ilk sürümde uzatma yoktur: **15–15 beraberlik** mümkündür ve Elo değişimi **0** olur. `16–15`, `17–15` bu konfigürasyonda geçerli final skorları değildir. Uzatma istenirse ayrı sürüm ve skor doğrulaması gerekir.

Maç içi TL ekonomisi: `../codex-ekonomi/competitive-economy.v1.json`. Taraf değişiminde bu paketteki maç cüzdanı/envanter/mağlubiyet serisi reseti uygulanır; Elo maç sonunda tek kez hesaplanır, her rauntta verilmez.

Aşağıdaki hesap ödülü tutarları kullanıcı tarafından belirtilmediği için **önerilen başlangıç değerleridir**; JSON'da ayrıca işaretlidir. İki alt modda eşittir:

| Tamamlanan maç | Genel XP | Kalıcı hesap TL |
|---|---:|---:|
| Galibiyet | +500 | +₺200 |
| Mağlubiyet | +300 | +₺100 |
| Beraberlik | +400 | +₺150 |
| Terk / sunucu iptali | 0 | ₺0 |

Genel hesap seviyesi mevcut oyunun XP eğrisinden yeniden hesaplanır; yeni bir hesap seviye eğrisi tanımlanmadı. Rütbesiz sonuç işleyicisi rekabetçi Elo'yu, placement sayısını, rank'ı, ranked istatistiklerini ve rekabetçi güncelleme zamanını **hiç yazmaz**. Testte XP nedeniyle genel seviye artarken bütün rekabetçi alanların aynı kaldığı doğrulandı.

## 3. Rütbeler ve tam Elo tablosu

Yedi ana kademe, her biri 1–2–3. Sınırlar dahildir; boşluk/çakışma yoktur.

| Ana kademe | 1 | 2 | 3 |
|---|---:|---:|---:|
| **Demir** | 0–99 | 100–199 | 200–299 |
| **Bronz** | 300–399 | 400–499 | 500–599 |
| **Gümüş** | 600–699 | 700–799 | 800–899 |
| **Altın** | 900–999 | 1.000–1.099 | 1.100–1.199 |
| **Platin** | 1.200–1.299 | 1.300–1.399 | 1.400–1.499 |
| **Elmas** | 1.500–1.599 | 1.600–1.699 | 1.700–1.799 |
| **Usta** | 1.800–1.899 | 1.900–1.999 | 2.000 ve üzeri |

Rütbe ve alt kademe Elo'dan türetilir. 1.199→1.220 doğrudan Altın 3→Platin 1; 1.205→1.185 doğrudan Platin 1→Altın 3. Ek yükselme serisi veya görünmez düşmeme kalkanı yoktur. Elo alt sınırı 0'dır; Usta 3 üst sınırı açıktır. Aynı Elo'ya sahip oyuncu hangi hesap seviyesinde olursa olsun aynı rekabetçi rozeti alır.

## 4. İlk beş derecelendirme maçı

- Yeni oyuncu sunucuda **900 gizli Elo** ile başlar. Bu bir başlangıç tahminidir; ilk ekranda “Altın 1” gösterilmez.
- İlk **5 tamamlanan Rütbeli maç** sayılır. Elo bu sırada aynı normal formülle güncellenir; ekstra placement katsayısı yoktur.
- İlk dört sonuçta `Rank_Tier=null`, `Rank_Division=null`; UI yalnız 1/5, 2/5 ilerlemesini gösterir. Beşinci sonuç commit edilince güncel Elo'dan ilk rozet açılır.
- Kazanma, kaybetme ve tam oynanmış 15–15 beraberlik sayılır. Rütbesiz, ısınma, sunucu iptali/remake, geçersizleştirilmiş maç ve terk sayılmaz.
- İlk sezon beş maç kısa bir başlangıç ölçümüdür. ±15–30 sınırları nedeniyle yeni oyuncunun ilk görünür Elo'su teorik olarak **775–1.050** arasında kalır; beş maçla her kademeye yerleşme iddiası yoktur. Sonraki maçlar puanı taşır.
- Gizli rating eşleştirmede kullanılabilir; placement tamamlanana kadar istemciye gönderilen halka açık profilden Elo/rozet çıkarılır. Sunucu profilinde Elo saklanmaya devam eder.

## 5. Elo/MMR hesabı

Bu tasarım tek beceri puanı kullanır: `Competitive_Elo`, ranked eşleştirmesinin de MMR değeridir. İkinci, oyuncudan gizli ve farklı bir ranked puanı uydurulmaz. Placement döneminde aynı puanın görünürlüğü kapalıdır.

### Rakip gücü

Maç başlamadan önce iki takımın **beş oyuncusunun kilitlenmiş Elo ortalamaları** alınır. Sonuç işlerken önce güncellenen oyuncunun yeni Elo'su ötekinin hesabına girmez.

```text
P = 1 / (1 + 10 ^ ((RakipTakımOrt - KendiTakımOrt) / 400))
M = abs(KendiSkor - RakipSkor) / 16
```

`P` beklenen kazanma olasılığıdır: eşit takımlar .50; daha güçlü rakibe karşı daha küçüktür. Güçlü rakibi yenmek daha fazla kazandırır, favoriyken kaybetmek daha fazla kaybettirir. `M`: 16–0 için 1, 16–14 için .125.

### Bireysel performans (0–1)

Yalnız sunucunun doğruladığı düşman istatistikleri kullanılır:

```text
KDA = (Kill + 0.5 × Asist) / max(1, Ölüm)
K = clamp(KDA / 3, 0, 1)
D = clamp((DüşmanaVerilenToplamHasar / OynananRaunt) / 120, 0, 1)
O = clamp((GeçerliBombaKurma + GeçerliBombaÇözme) / 3, 0, 1)
Performans = 0.50 × K + 0.35 × D + 0.15 × O
Çarpan = 0.90 + 0.20 × Performans
```

KDA tek başına belirleyici değildir; hasar ve bomba görevleri de hesaba katılır. Takım hasarı, bot/ısınma/skor çiftleme ve istemcinin bildirdiği MVP/EBO bayrağı kullanılmaz. Çarpan .90–1.10 arasında kalır; takım galibiyetinin önüne geçmez.

### Galibiyet

```text
WinElo = yuvarla(clamp((15 + 10 × (1-P)) × Çarpan + 3 × M, 15, 30))
```

**Toplam kazanç +15…+30'dur.** Performans/skor bonusu bu tavanın içindedir; +30'un üstüne ayrıca eklenmez.

### Mağlubiyet ve EBO koruması

```text
KayıpBüyüklüğü = 15 + 8 × P + 2 × M
KaybedenTakımEBO ise KayıpBüyüklüğü ×= 0.80
LossElo = -yuvarla(clamp(KayıpBüyüklüğü, 15, 25))
```

**Normal kayıp -15…-25'tir.** Kaybeden EBO pozitif Elo almaz. Tek uygun EBO; takımın en yüksek Performans değerine sahip oyuncusudur. En az %80 rauntta katılım, pozitif düşman hasarı veya bomba görevi gerekir; maçı terk eden/AFK olarak katılımı yetersiz oyuncu korunmaz. Eşitlikte sırasıyla objektif sayısı, düşman hasarı, kill, daha az ölüm, sunucu oyuncu kimliği kullanılır.

Yuvarlama en yakın tam sayıya, yarımda sıfırdan uzağadır; örneğin 20.5→21, -20.5→-21. C# karşılığı `Math.Round(value, MidpointRounding.AwayFromZero)`.

### Somut örnekler

| Eşit güçte takımlar | Oyuncu durumu | Değişim |
|---|---|---:|
| 16–0 galibiyet | Performans 1 | **+25** |
| 16–14 galibiyet | Performans 1 | **+22** |
| 16–14 galibiyet | Performans .5 | **+20** |
| 0–16 mağlubiyet | Normal oyuncu | **-21** |
| 0–16 mağlubiyet | Takım EBO'su | **-17** |
| 14–16 mağlubiyet | Normal oyuncu | **-19** |
| 14–16 mağlubiyet | Takım EBO'su | **-15** |
| 15–15 beraberlik | Her oyuncu | **0** |

0 Elo sınırında hesaplanan ile uygulanan fark ayrıdır: 10 Elo'ya -21 hesaplanırsa son Elo 0, gerçekten uygulanan değişim -10 olur. UI -21 düşmüş gibi yanlış bakiye göstermez.

Bu, klasik Elo'dan beklenen skor olasılığını kullanan **hibrit ve sıfır toplamlı olmayan** sistemdir. Farklı kazanma/kaybetme sınırları ve bireysel katkı nedeniyle iki takımın toplam farkı her maç 0 olmayabilir. Sezon ortalaması/medyanı ve kademe dağılımı izlenmeli; yeni katsayılar yalnız sonraki config sürümüyle uygulanmalıdır.

## 6. Sezon, terk ve eşleştirme

- Yeni sezon: önceki Elo/rozet arşivlenir; geri dönen oyuncu için `round(900 + .75 × (eskiElo - 900))`. Örnek 1.500→1.350. İlk kez gelen oyuncu yine 900.
- Her sezonda **5 yeni derecelendirme** gerekir, rozet o zamana kadar gizlenir. Sezon kazanma/kaybetme/beraberlik sayaçları sıfırlanır; yaşam boyu ranked sayaçları, genel XP/seviye ve hesap TL korunur. Aynı sezon reset olayı ikinci kez uygulanmaz.
- Bağlantı kopmasına **180 sn dönüş süresi** önerildi. Süre geçince terk durumunu yalnız sunucu kesinleştirir. Terk: **-25 Elo**, ranked loss/abandon sayacı +1, XP/TL 0, placement ilerlemesi 0. Takımı sonra kazansa da terk edenin kişisel sonucu ceza kaybıdır; ikinci bir normal maç kaybı daha uygulanmaz.
- Rütbesizde terk bile rekabetçi Elo/sayaçları değiştirmez. Genel hesap ödülü 0'dır. Ek para cezası/otomatik yasak süresi bu tasarıma eklenmedi.
- Sunucunun iptal ettiği/remake maçta Elo, genel ödül, placement ilerlemesi 0; sonuç gelene kadar tahmini puan hesaba yazılmaz.
- Rütbeli eşleşme: takım ortalamaları arasında hedef fark ≤100 Elo; her 30 sn +50 genişleme, en fazla 300. Daha uzun bekleyince sınırsız kötü eşleşmeye dönmez. Grup içi Elo farkı önerilen tavan 300. Bu sayılar denge varsayımlarıdır; gerçek oyuncu nüfusuna göre sürümlenir.
- Rütbesiz Elo/rank okumadan ayrı kuyruğa girer. İleride daha dengeli pratik için kullanılacak `Unranked_Hidden_MMR` tamamen ayrı alandır; `Competitive_Elo` bunun için değiştirilemez.

## 7. Profil verileri — JSON

Makine tarafından okunabilir tam başlangıç profili: `player-profile.example.json`. Ayarlar/rütbeler/formül parametreleri: `competitive-rank.v1.json`. C# veri aktarım sınıfı: `CompetitiveProfile.cs`; Node.js tabanlı mevcut oyunun dilini değiştirmez. C# örneğinde kalan placement salt okunur hesaplanır. JSON'daki `Previous_Season` özet alanları uygulama DTO'suna eşlenir.

| Alan | Tür | Kapsam / anlam |
|---|---|---|
| `Player_Id` | string | Sunucunun hesap kimliği |
| `Account_XP` | int64 | Genel hesap XP'si |
| `Account_Level` | int32 | Mevcut XP eğrisinden türetilen genel seviye |
| `Account_TL` | int64 | Kalıcı oyun parası; maç cüzdanı değildir |
| `Competitive_Elo` | int32, ≥0 | Sunucunun ranked MMR/Elo puanı |
| `Rank_Tier` | string veya null | `iron/bronze/silver/gold/platinum/diamond/master`; placement bitmeden null |
| `Rank_Division` | 1/2/3 veya null | Rekabetçi alt kademe |
| `Rank_Label` | string | Örn. `Altın 2`; Elo/kademe tablosundan türetilir |
| `Placement_Matches_Completed` | int32, 0–5 | Bu sezon sayılan derecelendirme maçları |
| `Placement_Matches_Left` | int32, 0–5 | `max(0, 5 - Completed)`; bağımsız arttırılıp azaltılmaz |
| `Ranked_Wins` | int64 | Yaşam boyu ranked galibiyet |
| `Ranked_Losses` | int64 | Yaşam boyu ranked mağlubiyet, terk cezası dahil |
| `Ranked_Draws` | int64 | Yaşam boyu ranked beraberlik |
| `Competitive_Season` | string | Örn. `S1` |
| `Season_Ranked_Wins/Losses/Draws` | int64 | Sezon sayaçları |
| `Ranked_Abandons` | int64 | Terk kaydı; losses içinde de sayılır |
| `Last_Competitive_Match_Id` | string/null | Son ranked sonuç bağlantısı |
| `Competitive_Rating_Updated_At` | UTC ISO8601/null | Son rekabetçi güncelleme |
| `Previous_Season` | object/null | Önceki sezon, son Elo ve rozet özeti |
| `Unranked_Hidden_MMR` | number/null | Kullanılması isteğe bağlı ayrı pratik ölçüsü |

Başlangıç örneği (kısa):

```json
{
  "Account_XP": 0,
  "Account_Level": 1,
  "Account_TL": 0,
  "Competitive_Elo": 900,
  "Rank_Tier": null,
  "Rank_Division": null,
  "Placement_Matches_Left": 5,
  "Ranked_Wins": 0,
  "Ranked_Losses": 0
}
```

`Rank_Tier`, alt kademe, etiket ve kalan placement türetilmiş alanlardır: üretimde hesaplanabilir veya sunucunun aynı transaction'da tuttuğu cache olabilir; istemci tarafından ayrı ayrı yazılmaz. Hesap adı/rütbe metni puan hesabına girmez.

## 8. Sunucu sözleşmesi ve Claude devri

1. Yeni `competitive_unranked` / `competitive_ranked` kuyruklarını aç; eski 30-kill `tm` kodunu yalnız etiket değiştirerek bombalı ranked sayma. Aynı görünüm altında doğru ayrı maç akışları bağlanmalıdır.
2. Başlangıçta maç/config/sezon/iki takımın beşli Elo snapshot'ını kilitle. İstemciden Elo, sonuç, MVP/EBO veya fiyat/ödül kabul etme.
3. Tamamlanan maçta sunucu skoru ve düşman istatistiklerini doğrula. Önce alt modu kontrol et; Unranked ranked güncelleme yoluna hiç girmez.
4. Normal sonuç için `(seasonId, matchId, playerId)` bir kez işlenir. Elo farkı, eski/yeni Elo, XP/TL, ranked sayaçları, placement ve rozet **tek transaction** içinde kaydedilir. Tekrar gelen olay eski sonucu döndürür; ikinci kez para/Elo vermez.
5. `competitive_result_ledger` ayrı tutulur; eski TL ekonomi ledger'i rank tablosu olarak kullanılmaz. Önerilen alanlar: sezon/maç/oyuncu, config sürümü, mod, skor, takım Elo snapshot'ları, performans/EBO, nominal/uygulanan delta, eski/yeni Elo, XP/TL ödülü, önceki/yeni placement sayısı, server timestamp.
6. Yanlış/iptal edilmiş sonuç için normal istekte yeni revision açarak tekrar ödeme yapılmaz. Yetkili düzeltme ayrı yönetici olayı/dengeleyici kayıt ile Elo, ödüller ve sayaçları tutarlı düzeltir. Oyuncu sonuç revizyonu isteyemez.
7. Genel seviye hesaplamasında mevcut XP fonksiyonunu çağır. `tests/rank/reference.cjs` bu yüzden `accountLevelForXp` callback ister. Testte kullanılan 1.000 XP eğrisi **yalnız test verisidir**, oyuna kopyalanmaz.
8. İstemciye sunucu onaylı özet yolla: `Sonuç`, `+22 Elo`, `1.198→1.220`, `Platin 1`, `+500 XP`, `+₺200`. Unranked özetinde “Rekabetçi puanın etkilenmedi” yaz; sahte `+0 Elo` animasyonu gösterme.

## 9. Gerçek doğrulama

Proje kökünde:

```sh
node tests/rank/build-config.cjs
node --test tests/rank/contract.test.cjs
```

**19/19 PASS.** Rütbe sınırları, ilk 5 maç, Unranked izolasyonu, hesap seviyesinden bağımsızlık, beşli snapshot, kazanma/kaybetme aralıkları, ezici/yakın skor, rakip gücü, performans çarpanı, EBO, beraberlik, 0 tabanı, eşik değişimi, sezon reseti, terk, iptal, tekrar sonuç ve yuvarlama doğrulandı. Aralık testinde farklı Elo/performans/skor birleşimlerinden **900 kazanma/kaybetme hesabı** tarandı. Çıktı: `TEST_SONUCU.txt`.

C# DTO, bu bilgisayarda PowerShell `Add-Type` ile derlendi; 900 başlangıç Elo'su ve 0/5 placement için 5 kalan, 5/5 için 0 kalan sonuçları doğrulandı. Kanıt: `CSHARP_TEST_SONUCU.txt`. Bu kontrol bütün bir C#/Unity sunucusu entegrasyonu değildir.

Bu bir oyun içi entegrasyon testi değildir. Entegrasyondan sonra gerçek sunucuda iki kuyruk ayrımı, 5 tam placement, reconnect/iptal, eşzamanlı sonuç commit'i ve genel seviye ekranında rekabetçi rozetin ayrı gösterilmesi ayrıca doğrulanmalıdır.
