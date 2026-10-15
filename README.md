# N.P.N.G — No Pain No Gain

Tarayıcıda çalışan çok oyunculu FPS (aim training, zombi, 5v5, açık dünya, ekonomi).
Three.js r128 + saf JavaScript, sunucu tarafı ek paketsiz Node.js.

## Çalıştırma
1. Node.js (LTS) kurulu olmalı.
2. `SUNUCU-BASLAT.bat` (ya da `node server.js`).
3. Tarayıcıda `http://localhost:3000`.

## Önce oku
**[NOTLAR.md](NOTLAR.md)**: projenin durumu, çalışma kuralları, dosya düzeni, alınmış kararlar ve değişiklik günlüğü.
Projede çalışan herkes (insan ya da yapay zekâ) işe başlamadan önce okur, iş bitince günlüğe kayıt düşer.

## Çalışma düzeni
- Doğrudan `main`'e gönderme yok: her iş kendi dalında (`claude/...`, `codex/...`) yapılır, PR ile gelir.
- `main`'e birleştirmeden önce Berkan oyunu açıp test eder.
- Her değişiklikte `index.html` sonundaki build etiketi ve `?v=` değerleri artırılır.

## Lisans notu
Gizli proje. Kullanılan 3B modeller çoğunlukla Sketchfab kaynaklıdır (CC-BY 4.0 vb.), kaynakları oyun içinde Ayarlar > Krediler'de listelenir.
Gerçek marka/kulüp armaları oyuna eklenmez.
