# Koridor: Dalga Ağacı — 202610171405

Oyun klasörü: C:\Users\berkan\Desktop\mmofps-online

## Oynama
1. Oyun sayfasını Ctrl+F5 ile yenile.
2. Mod seçimi → **Koridor: Dalga Ağacı** → **Tek Başına**.
3. Kırmızı doğuş ağacına ateş et veya yaklaşarak bıçakla vur. Ağaç kırılınca dalga başlar; dalga bitince sonraki ağaca ilerle.
4. İlk teçhizat M4, tabanca ve bıçak. Mermi sınırlıdır. Sarı kutu yedek mermi, yeşil kutu can verir. R şarjör değiştirir; yedek yoksa doldurmaz.
5. Co-op için güncel `server.js` ile sunucuyu yeniden başlat, aynı sunucuda hesaba giriş yap, **Co-op Oda Aç** seçeneğindeki kodu arkadaşına ver. Arkadaşın **Odaya Katıl** ile kodu girer. En fazla 4 oyuncu; en az biri yaşarken maç sürer. Ölen oyuncu izler ve aynı maçta yeniden doğmaz. Oda sahibi ayrılırsa oda kapanır; kazanılan TL kalır.

Mevcut açık sunucu/oyuncu oturumları zorla kapatılmadı. Tek kişilik mod yeni dosyaları sayfa yenilendiğinde alır; co-op protokolü için sunucu yeniden başlatılmalıdır. Kurulumun `server.js` yanında **server-wavecorridor.js** dosyasını da içermesi gerekir.

## Uygulama
- `js/wave-corridor.js`: gönderilen WaveCorridor modülü klasik script düzenine uyarlandı. 100 tur/100 spawner, 5r zombi (10'un katında yalnız boss), 5/6'lı kuyruk, en çok 12 canlı, 1.2 saniyelik donmuş doğuş, duvar genişlemesi, hasar/ödül/düşüş ihtimalleri korundu. Tekrar ölüm bildirimi etkisiz; son turda da hayattakiler iyileşir; paylaşılan geometri/malzeme çıkışta temizlenir.
- `js/wave-corridor-game.js`: API adaptörü ve solo/co-op seçim ekranı. Mevcut mkE, updZombie, damageEnemy, killEnemy/ragdoll ve SV hesabına TL ekleme/kayıt sistemi kullanılır. Zombi rig havuzu maç boyunca en çok 12 nesnedir. Spawner'lar kırılana kadar raycast hedefidir; bıçak menzili/açısı kontrol edilir. Yedek mermi ve kutu toplama bu moda özeldir. Ayrı koridor zemini, HUD, izleyici kamerası ve çıkışta ortam/teçhizat geri yüklemesi içerir.
- `server-wavecorridor.js`: giriş yapılmış hesaplarla 4 kişilik kodlu odalar; sahibin simülasyonunu iletir. Sunucu kimlik, oda, silah, atış aralığı ve paket sınırını denetler. Hasar menzili oda sahibi tarafından da kontrol edilir. **Bu, mevcut sunucu otoriteli Zombi Co-op'un yerine geçmez; yeni modda simülasyon oda sahibindedir.** Oda sahibi geçişi/host migration yoktur. Oda sahibinin oyunu duraklatması ortak simülasyonu da durdurur.
- `server.js`: WC protokolüne yönlendirme ve bağlantı kapanınca oda temizliği.
- `js/combat.js`: spawner raycast vuruşu; donmuş zombi kontrolü, aynı zombi AI'ının en yakın canlı co-op oyuncusuna yönelmesi ve moda ait hasar değeri. Koridor maçındaki sabit teçhizat kalıcı kuşanımı değiştirmez.
- `js/player.js`: koridorun 3 km'lik uzunluğu için eski Arena sınırı atlanır; asıl X/Z sınırı getBounds ile uygulanır. Kanca/duvar hareketiyle yan duvarları aşmamak için bu modda oyuncu yüksekliği sınırlıdır. Bu kısıt Dust2'ye uygulanmaz.
- `js/main.js`, `index.html`, `css/style.css`: mod girişi, scriptler, seçim/HUD görünümü. Zombi Direnişi ve eski Zombi Co-op ayrı durur.
- `tests/http.cjs`: test sunucusu fixture'ına yeni sunucu bağımlılığı da kopyalanır.

## Dust2 — önceki talebin düzeltmesi
Berkan'ın Paint açıklaması ve 'görünmez duvarları sil veya eski halinde bırak' talebi esas alındı:
- Eklediğim görünmez çatı kenarları, dış duvar ve üst tavan tamamen kaldırıldı.
- mapcol.js özgün üçgen çarpışmasına döndü; yönlü çatı duvarı ve özel kanca ray bayrağı yok.
- Oyuncudaki özel çatı yüksekliği/yer değiştirme engelleri kaldırıldı.
- Daha önce üretilen 8 düz kapak (36 üçgen) korunur; çizimdeki tüm ara boşlukların birebir yeniden modellenmesi iddia edilmez. Dust2 nav 3017 düğüm olarak kaldı.
- **1404 devir notundaki görünmez duvar/tavanı tekrar getirmeyin.** Bu talimat daha yenidir.

## Doğrulama
`test.cjs` gerçek Chrome ve geçici hesap dizini kullanan yeni sunucuyla çalışır; kullanıcının hesaplarını/sunucusunu değiştirmez.
- Gerçek mod menüsü, tek oyunculu başlangıç, spawner kırılmadan 0 zombi: PASS.
- Oyunun gerçek raycast'inden ateş ve gerçek yakın dövüş kodundan spawner kırma: PASS.
- Yerden çıkış sırasında frozen, ardından AI'ın açılması: PASS.
- Mermi/yedek yokken reload yapılamaması; kutuyla yedek gelmesi; 7 yedekle 5→12 şarjör ve 0 yedek: PASS.
- 15 saniyelik kutu süresi: PASS.
- 100 tur hızlandırılmış **modül simülasyonu**: 22.510 doğuş, 10 boss, 100 canlı iyileştirme çağrısı, ara ödüller 107.500 + final 100.000 = 207.500 TL: PASS. Bu, gerçek oyuncuyla 100 tur oynanmış bir denge testi değildir.
- Öldürmeden dolu sahada kuyruk beklemesi; 12 sınırını aşmama; tek boss ve boss hayattayken kapalı ilerleme: PASS.
- İki ayrı tarayıcı/hesap, mod içinden kayıt/giriş, kodlu oda, ortak dalga, iki hesaba +300 TL, ölenin izleyici olması, son oyuncu ölünce bitiş ve yeniden yeni oda açma: PASS.
- Dust2 görünmez sınırlarının olmaması ve düz kapakların kalması: PASS.
- Sayfa JavaScript hatası: 0.
- Genel tests/run.cjs: HTTP/movement/lobi/Aim/atmosfer regresyonları PASS (`regresyon-log.txt`).

Gerçek cihazda uzun oturum dengesi, 3–4 kişilik ağ gecikmesi ve görsel tercihlerin kullanıcı kabulü açık kalır. Oda sahibi simülasyonu prototip co-op içindir; rekabetçi sunucu otoritesi/hile önleme iddiası yoktur.

Yedek: `_yedek/codex-wavecorridor-1405/`. Yeni dosyalar bu yedekte yoktur; önceki dosyalar değişmeden saklandı. Çalışma aynı ana oyun klasörüne uygulandı, ayrı oyun kopyası oluşturulmadı.
