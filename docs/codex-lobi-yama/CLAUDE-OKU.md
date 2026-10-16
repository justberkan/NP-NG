# Claude'a teslim — Lobi karakter alanı yaması
Tarih: 17.10.2026
Taban: 202610171300 rekabetci-v1

Sorun: Alt menülerde #sa 200px iken karakter ekranın %16.5 noktasında tutuluyor. Menü karakterin üstüne geliyor; 1000px altında #sa tamamen kaldırılıyor.

Çözüm: #sa genişliğini ekrana göre ayır; karakteri bu alanın gerçek merkezine yerleştir; platform ve karakteri alana sığdır. Konumu DOM üretildikten sonra hesapla. Yeni sahne, render döngüsü veya her karede DOM ölçümü eklenmez.

Uygulama (oyun kökünde):
  git apply --check lobi-karakter-alani.patch
  git apply lobi-karakter-alani.patch

Önce patch'i oyun köküne kopyala. Kontrol başarısızsa zorla uygulama: 3 dosyadaki küçük değişiklikleri mevcut sürüme elle birleştir. degisen-dosyalar klasörü referanstır; güncel dosyaları topluca üzerine yazarak yeni değişiklikleri kaybetme.

Değişen dosyalar: css/style.css, js/lobby3d.js, js/ui.js.
index.html içindeki cache sürümünü yeni build numarasıyla güncelle (sunucu/istemci önbelleği nedeniyle). Patch bu numarayı bilerek sabitlemez.

Dar ekran: Alt menülerde arkadaş bölmesi gizlenir; lobiye dönüşte mevcut görünürlük tercihi geri gelir. Karakter küçük önizleme olur. Çok geniş silahlar/özel karakterler için ayrılan güvenli 2.8 dünya birimi payı ek kontrol gerektirebilir. Üst gezinti ve bağımsız açılan pencereler mevcut davranışını korur.

Test: Gerçek mevcut localhost oyunu üzerinde Playwright ile yalnız üç dosya yanıtı yama sürümüne yönlendirildi; canlı oyun dosyalarına yazılmadı. 1920/1366/1024/760/390 genişlik, 900 yükseklik; borsa, banka, battle pass, görevler, mağaza, envanter, açık dünya, kumarhane, ayarlar: 45/45 alan ayrımı ve karakter görünürlüğü kontrolü PASS. Her boyutta lobiye dönüşte ölçek=1 kontrol edildi. Sayfa hatası: 0. Borsa ekran görüntüleri ektedir. Bu kontrol tüm olası donanım/karakter/overlay kombinasyonlarını kapsamaz.

TEST-SONUCU.json ayrıntılı ölçümleri içerir. test.cjs tekrar çalıştırılabilir (localhost:3000 + çalışma alanındaki Electron Playwright kurulumu gerekir).

Canlı oyun dosyaları değiştirilmedi. Bu paket yalnız arayüz yamasıdır; Liyakat sistemi dahil değildir.
