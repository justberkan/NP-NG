# KİMİ-4 · Şehir Modeli (Açık Dünya)

Kaynak: `C:\Users\berkan\Downloads\lowpoly_city.glb` — "LowPoly City", Vira Voloshyn, Sketchfab, **CC-BY-4.0** (ticari kullanım serbest, atıf şart). Ayrıntı: `assets/city/ATTRIBUTION.md`.

## Dosyalar

| Dosya | Açıklama |
|---|---|
| `assets/city/lowpoly_city_opt.glb` | Optimize edilmiş şehir modeli (Three.js r128 uyumlu) |
| `assets/city/city_colliders.json` | Çarpışma kutuları |
| `assets/city/city_tex.png` | 128 px referans renk paleti (vertex-color kaybı olursa diye) |
| `assets/city/ATTRIBUTION.md` | Lisans ve atıf |
| `docs/sehir/test.html` | Oyunun kendi loader'ıyla yükleme testi |
| `docs/sehir/city-process3.py` | Optimizasyon betiği (yeniden üretim için) |
| `docs/sehir/sehir-view1/2/5.png` | Doğrulama görüntüleri |

## Optimize vs. orijinal

| Ölçü | Orijinal | Optimize |
|---|---|---|
| Üçgen | 178 609 | 57 929 (≤60 000 hedef ✓) |
| Boyut | ~16 MB | 2,8 MB (≤3 MB hedef ✓) |
| Mesh sayısı | 2 086 | **19 hücre mesh'i** |
| Çizim çağrısı | — | ≤40 (19 hücre + zemin, görünür hücre filtresiyle) |

- Model **80 m ızgara hücrelerine** bölündü; her hücre tek birleşik mesh. Ekran dışı hücreler `visible=false` yapılarak atlanıyor — bu r128'de büyük FPS kazancı sağlar.
- Malzeme: vertex-color, `MeshStandardMaterial` (metalness=0, roughness=1) — draco/meshopt **yok**, doku PNG/JPG **yok** (WebP yok). `lib/GLTFLoader.js` (r128) ile açılır.
- Bina kat yüksekliği ~3 m gerçek ölçekte korundu; ham modelin tamamı (büyük) yerine merkeze yakın ~300–400 m'lik mahalle kesiti kullanıldı.

## city_colliders.json formatı

```json
{
  "origin": [x, z],
  "scale": 1.0,
  "boxes": [[minX, minZ, maxX, maxZ, yukseklik], ...]
}
```

Koordinatlar metre, şehir merkezine göre, `origin` = modelin dünya konumu. Toplam **221 kutu** (bina gövdeleri).

## Claude'a entegrasyon talimatı

1. Modeli açık dünya haritasına yerleştir (örn. mevcut "şehir" bölgesi ya da önerdiğin yeni konum, açık dünya ±450 m sınırına sığmalı).
2. `city_colliders.json`'ı ow2 tarafındaki hitBox/`owH` (engel yüksekliği) beslemesine bağla: 5. eleman (yükseklik) `owH`'ye, dikdörtgen `hitBox`'a.
3. Yükleme açık dünya girişinde yapılmalı, oyun açılışında değil (görseller büyük olduğu için).
4. FPS doğrulaması: zayıf PC'de şehir bölgesinde 60 FPS hedefi; ekran dışı hücrelerin `visible=false` kaldığından emin ol.

## test.html kullanımı

Oyunun kendi `lib/three.min.js` + `lib/GLTFLoader.js` ile yükler; sorgu `?mat=basic` düz renk, `?mat=normal` ışıklı malzeme modu. HUD'da hücre/üçgen/collider sayısı görünür. Kırmızı kutular collider'ları gösterir.

Doğrulama: "hücre 19 / üçgen 57929 / collider 221", konsol hatası yok. Görüntüler: `sehir-view1.png` (havadan), `sehir-view2.png` (havadan, collider'lar), `sehir-view5.png` (sokak seviyesi).

## Yeniden üretim

```bash
python docs/sehir/city-process3.py   # palet örnekleme + simplify + vertex-color
# ardından GLB'a metalness=0/roughness=1 malzeme yapısı uygulanır (betik son adımı loglar)
```
