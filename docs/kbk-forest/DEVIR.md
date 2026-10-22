# KBK orman ve seçim ekranı — devir

23.10.2026 · Dal: codex/kbk-forest-lobby · Taban: 78e33b3

Berkan, Claude onayı şartını bu iş için kaldırdı; yetki kendisinde ve Codex'te. APK çalışması bu teslimin dışında. Çalışma canlı masaüstü klasörüne yazılmadan ayrı checkout'ta yapıldı.

## Son davranış
- Gönderilen üç karakterli referans görseli, değiştirilmeden tek JPEG atlası olarak sınıf kartlarında kullanılır (185.793 bayt). Rol kartı klavye ile seçilebilir, seçili durum erişilebilirdir; oda kodu/şifre rol değişiminde silinmez. Şifre maskelenir.
- Tek oyunculuda kurt, koruma ve VIP seçimi gerçekten uygulanır. Co-op'ta sunucudan gelen hostRole istemci seçimiyle ezilmez.
- Mevcut düz orman düzenlendi: 650 instanced ağaç, 90 mantar (iki instanced çizim), okunabilir gece ışığı/sis ve 6 m genişliğinde köy–ev patikası. Patikaya yakın ağaç/çalı/kayalar yana alınır. Bunlar dekor; yeni ağaç çarpışması eklenmedi.
- Beş yol taşı başlangıç köyünden eve uzanan güzergâha dağıtılır; snapshot gelince patika ve taşlar eşlenir.
- Oyuncu ve solo NPC'ler 167 m yarıçap içinde tutulur. VIP/koruma takip hızları sınırlıdır; NPC'lere yürüme animasyonu gönderilir. Kurt olarak tek oynarken VIP eve yürür; korumalar onu izler.
- Moddan çıkışta orman/tilki geometrileri ve malzemeleri temizlenir; evin sahneye ayrıca eklenen çarpışma mesh'i kaldırılır. Tekrarlı oynama testi vardır.

## Bilinen sınırlar
- Yeni GLB entegre edilmedi. Berkan'ın izin verdiği mevcut haritayı iyileştirme alternatifi seçildi; bu, kredinin kesin yetmediği iddiası değildir.
- Kaynak GLB: kbk_map_merged_noriver.glb, 38.394.256 bayt, 1.292.247 üçgen, 5 mesh/5 primitive/5 texture, dış dosya bağımlılığı yok. SHA-256: 4243c18ffb2087461aa884528a765842ae381eb60bb4b76914a1b03cfea0d1d3.
- VIP/koruma olarak solo oynamak antrenmandır: kurt botu yoktur, kurt rakibi co-op oyuncusudur; seçim ekranı bunu belirtir. Bot savaş yapay zekâsı genişletilmedi.
- Görsel test gerçek Chrome'da yazılımsal WebGL ile yapıldı. Çizim/üçgen sayıları test kamerasına aittir; donanım FPS kazancı ölçümü değildir. APK paketi üretilmedi.

## Doğrulama ve dosyalar
- tests/kbk-forest.cjs: masaüstü/mobil ekranlar, üç solo rol, oda girdisi korunması, sınır dışından dönüş, tam rota, VIP hız sınırı, gerçek WebGL çizimi, tekrar açılış temizliği ve tarayıcı hataları.
- tests/run.cjs yeni testi npm test grubuna dahil eder. Tam çıktı: test-results/kbk-forest/npm-test-full.txt.
- Ekranlar: test-results/kbk-forest/desktop.png, mobile.png, forest.png. Sonuçlar: results.json.
- Oyun: js/kbk.js, css/style.css, index.html; varlık: assets/kbk/roles-reference.jpg.
- Eski sürüm Git tabanı 78e33b3'te korunur. İndirilen GLB ve canlı oyun klasörü değiştirilmedi.

## İlk tam test denemesi
İlk npm test turu, index.html içindeki build ile tüm ?v= sürümlerini eşit isteyen smoke.cjs kontrolünde düştü. Başlangıçta yalnız değişen CSS/KBK sürümleri güncellenmişti. Tüm sürüm işaretleri 202610230001'e eşitlendi; test veya kabul sınırı değiştirilmedi. İlk çıktı npm-test-attempt-1.txt olarak korunur. Son doğrulama ayrı npm-test-full.txt dosyasındadır.

## HTTP test hazırlığı
İkinci tam turda kalan hata, ana daldaki HTTP fixture'ının yeni server-kbk.js bağımlılığını geçici dizine kopyalamamasıydı. Testin kopyalama listesine bu tek dosya eklendi; sunucu kodu ve test beklentileri değişmedi. İzole HTTP grubu düzeltme sonrası 5/5 PASS (http.txt). İkinci turun çıktısı npm-test-attempt-2.txt içinde korunur. Değişen test dosyalarına tests/http.cjs de dahildir.
