# ANİMASYON YAMASI — ANIMASYON-001 / v1.0
17.10.2026 · Codex
Taban oyun: 202610171305 bp-v2
Yamalı deneme: 202610171306 animasyon-v1

## Ne düzeldi?
1. Yere basan ayağın dünya konumu adım boyunca korunur. Adım fazı geçen zamandan ziyade gerçek yer değiştirmeye bağlıdır; ileri/geri ve yana hareket aynı temas çözümünü kullanır.
2. Zıplama sırasında yürüyüş, jump ve jumpwall kliplerinin aşırı bacak açısı karışımı yerine sınırlı, yumuşak bir hava pozu uygulanır.
3. Gerçek GLB kemikleri kendi uyluk/kaval uzunluklarıyla ayrıca çözülür. Yalnız görünmez mantık bacağını düzeltmekle yetinilmez. Salınan bacağın dünya matrisi hedef hesabından önce güncellenir; ilk karede ayağın zemine girmesi önlenir.
4. Duvar koşusu sağ/sol bilgisi yerel oyuncudan animasyona ve ağ paketlerine aktarılır. Sunucu bu iki yeni biti kırpmaz. Yakın duvar yerel çarpışma kutularından bulunur; yakın el hedefe gider, gövde yana yatar, ayaklar duvara doğru basıp adım atar.
5. GLB avuç hedefi gerçek kemiklerle tekrar düzeltilir. Duvara yakın elin parmakları açılır; ana silah duvardan uzak ele geçer. Çift tabancada ikinci tabanca temas boyunca gizlenir ve ayrılınca geri gelir. Mekanik olarak silah değiştirilmez; hasar/hız/FPS ayarı değiştirilmez.
6. Açık Dünya uzak oyuncusunda eğilmeyi her kare sıfırlayan yinelenmiş crouch:0 alanı kaldırılır.

## Önce dene
OYUN-DENEME klasörü oyunun yamalı, bağımsız kopyasıdır. Hesap/data, node_modules ve özel dosyalar dahil edilmedi.
1. SUNUCUYU-BASLAT.bat dosyasını aç. Bu pencere test sunucusudur; açık kalsın.
2. OYUNU-AC.url dosyasını aç (http://localhost:3015/).
3. Aim Training'e gir, üçüncü şahıs görünümünü mevcut tuş atamana göre aç. İleri/geri/yana hareket, zıplama ve iki yönde duvar koşusunu dene.
4. Testi bitirince sunucu penceresinde Ctrl+C kullan.
Bu kopyanın hesapları kendi OYUN-DENEME/data klasöründe oluşur; mevcut oyundaki ilerlemeni taşımaz.
Bilgisayarında Node.js bulunmalı. 3015 portunda başka sunucu çalışıyorsa önce o sunucuyu kendi aracından kapat veya test portunu değiştir. Ana oyunun 3000 portuna dokunulmaz.

## Claude için uygulama
ANİMASYON YAMASI.patch dosyası değişikliklerin tamamını içerir. Yeni js/anim-contact.js dosyasını da içerir.
Oyun kökünde:
  git apply --check "ANİMASYON YAMASI.patch"
  git apply "ANİMASYON YAMASI.patch"

Kontrol başarısızsa zorla uygulama veya güncel dosyaların üstüne referans dosyaları topluca kopyalama. Mevcut değişikliklerle küçük yamayı birleştir. TABAN-SHA256.json taban dosya parmak izlerini içerir.
js/anim-contact.js mutlaka rig.js SONRASI ve glbrig.js ÖNCESİ yüklenmeli. Bu sayede eski pozun üzerine uygulanan temas çözümü GLB'ye aktarılmadan başka animasyon tarafından ezilmez.
Sunucu ve istemci aynı yama ile güncellenmeli. server.js değiştiği için sunucu yeniden başlatılmalı. Eski sunucu 64/128 bitlerini 63'e kırpar; yeni istemciyle eski sunucu kullanma.
Farklı bir build sürümüne birleştiriliyorsa index.html içindeki tüm cache sürümlerini yeni ortak build numarasına yükselt.

Geri almak için, uygulamadan sonra başka değişiklik yapılmadıysa:
  git apply --reverse --check "ANİMASYON YAMASI.patch"
  git apply --reverse "ANİMASYON YAMASI.patch"

## Doğrulama
- 30,60,144,240 FPS simülasyonunda asker modeli: basan mantık ayağı ve gerçek GLB ayak kemiği sabit; ölçülen GLB karelik sapma 0.000000004 metrenin altında (sayısal tolerans). Bu sonuç düz zemin, sabit doğrultulu kontrollü test içindir.
- Asker, Black Widow, Lara ve Samus: 4 yön × 2 hız = 32 model/yön/hız testi PASS.
- Sağ/sol duvar: gövde eğimi, yakın el seçimi ve gerçek avuç hedefi kontrolü PASS. Askerde avuç hedefinden sapma ~3 mm.
- Fizik -> oyuncu görünümü: 80/80 gerçek duvar koşusu adımında temas pozu mevcut.
- İki gerçek WebSocket istemcisi arasında Arena ve Açık Dünya sağ/sol duvar bayrakları korunuyor: PASS.
- Çift tabanca: doğru ele geçiş, ikinci tabancayı gizleme ve normal duruşa geri dönüş: PASS.
- Yamalı oyun tests/run.cjs: 5 HTTP testi, 17 hareket kontrolü, 49 HTTP dosyası birebir, 140 JS sözdizimi, lobi/Aim Training ve atmosfer senaryoları PASS. Sayfa hatası: 0.
- ANIMASYON-ONIZLEME.webm ve PNG'ler test sahnesi kaydıdır; çevrimiçi gerçek oyuncu kaydı değildir.

## Kapsamın sınırı
Bu yama mevcut iskelet tabanlı üçüncü şahıs insan animasyonlarını düzeltir. Goblinin ayrı AnimationMixer sistemi değiştirilmez. Kayma ve süzülme özel pozları korunur. Birinci şahıs el modeline yeni duvara basma animasyonu eklenmedi; mevcut kamera eğimi korunur.
Düz zemin temas test edildi. Merdiven, eğimli arazi, tüm farklı şampiyonlar, modeldeki ayakkabının görsel tabanı ve yüksek gecikmede uzun çevrimiçi oyun ayrıca gözle kabul edilmeli. Bütün modellerde ve her koşulda kusursuzluk iddiası yoktur.
Küp yedek karakterde sağ duvar temasında silah gizlenir; GLB insan modelinde ana silah uzak elde kalır. Bu yedek davranış GLB yükleme arızasında geçerlidir.
Mevcut oyun dosyalarına doğrudan uygulanmadı; yamalı kopya ve Claude'a birleştirilebilir kod teslim edildi.
