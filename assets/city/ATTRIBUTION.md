# ATTRIBUTION · Şehir Modeli

## lowpoly_city_opt.glb ( optimize edilmiş türev )

**Orijinal model:**
- **Ad:** LowPoly City
- **Yazar:** Vira Voloshyn — https://sketchfab.com/viravoloshyn
- **Kaynak:** https://sketchfab.com/3d-models/lowpoly-city-83a2a53009364c179f908eebf13db4d2
- **Lisans:** CC-BY-4.0 — https://creativecommons.org/licenses/by/4.0/
- **İndirilen dosya:** `C:\Users\berkan\Downloads\lowpoly_city.glb` (Sketchfab, 2026-10-19)

**Lisans durumu:** CC-BY-4.0 ticari kullanım ve dağıtıma izin verir.
Koşul: uygun şekilde atıf (bu dosya). Telif saklıdır, lisans değiştirilemez.

**Bu türevte yapılanlar (Kimi, 2026-10-19):**
- Şehrin ~350×350 m'lik bir mahallesi kesildi (merkez koordinatı -150, -250).
- 2,5× ölçeklendirildi (gerçek ölçek: bina katı ~3 m).
- 80 m ızgara hücrelerine bölündü; hücreler tek mesh (toplam 19 çizim çağrısı).
- Üçgen sayısı 178.609 → 56.376 (quadric simplify, hücre başına bütçe).
- UV+128 px palet dokusu → vertex color'a çevrildi (doku dosya boyutundan kurtulur,
  r128 uyumu garanti). Orijinal palet `city_tex.png` olarak referans için bırakıldı.
- Çarpışma kutuları `city_colliders.json` içine çıkarıldı (bina tespiti:
  yükseklik ≥2,5 m, taban ≥1,5×1,5 m).

**Dosyalar:**
- `assets/city/lowpoly_city_opt.glb` — optimize şehir (1,7 MB, draco/meshopt yok)
- `assets/city/city_colliders.json` — 221 çarpışma kutusu
- `assets/city/city_tex.png` — orijinal renk paleti (referans, oyunda kullanılmaz)
- `assets/city/ATTRIBUTION.md` — bu dosya
