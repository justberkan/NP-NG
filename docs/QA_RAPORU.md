# K1 — Gerçek Cihaz Performans / QA Raporu

Ölçümü yapan: **Kimi** · İlk kayıt: 16.10.2026 ~05:15
Yöntem: Berkan'ın bilgisayarında başlı Chrome (gerçek GPU) + Playwright; oyun `node server.js` (PORT=3100, geçici veri). Her modda ~18–22 sn boyunca otomatik senaryo (WASD ile koşma + fareyle bakış + ateş) sürerken `requestAnimationFrame` kare süreleri örneklendi. Sayfa hatası denetimi: `pageerror` dinleyici (5 modda da temiz).

**Ölçüm betiği:** `docs/qa/qa-olcum.cjs` · Ham veriler: `docs/qa/sonuc-*.json` · Ekran görüntüleri: `docs/qa/ekran-*.png`

## Build 202610170204 · anitkabir-lobi-v1+fps-v3 (Claude'un fps-v3'ü + Kimi poseRate birleşimi)

Ortam: 1600×900 pencere, pixelRatio 1.0 (ön ayar: varsayılan/orta, çözünürlük %100), FPS sınırı: Limitsiz, gölgeler kapalı.

| Mod | Harita | Ort. FPS | En kötü %1 kare | En uzun kare | >50 ms takılma | Çizim çağrısı (ort.) | Düşman sayısı (ort.) | Sayfa hatası |
|---|---|---|---|---|---|---|---|---|
| Aim Training | arena | **165.0** | 6.4 ms | 8.8 ms | 0 | 34 | 0 (hedef tahtaları, bot yok) | yok |
| TDM (botlu) | arena | **119.7** | 31.6 ms | 54.2 ms | 2 (ikisi de ~3.5. sn'de, art arda) | ~180 | 9 düşman bot | yok |
| TDM (botlu) | dust2 | **127.3** | 14.4 ms | 24.8 ms | 0 | 109 | 9 düşman bot | yok |
| Zombi | arena | **151.7** | 14.7 ms | 69.4 ms | 2 (0.7. sn dalga başı, 9.6. sn) | ~70 | ~6 zombi | yok |
| Açık dünya | — | **120.1** | 13.2 ms | 25.1 ms | 0 | 99 | ~43 **mob** (goblin/boss; `OW.act`) | yok |

> **Terimler:** "Düşman" sütunu moda göre: TDM'de asker **botları**, zombi modunda **zombiler**, açık dünyada **moblar** (goblin, boss — `OW.act`). Köydeki **NPC'ler** (Demirci Kaan, Tüccar Mira) `OW.npcs`'te tutulur, animasyonlu düşman değildir ve bu sayılara dahil değildir.

### Takılma anları (ne yaparken)
- **TDM arena ~3.5. sn:** tur/bot dalga oluşturma anına denk gelen 2 kısa takılma (54 ms ve hemen ardı 62 ms civarı). Sonrası temiz.
- **Zombi 0.7. sn:** ilk zombi dalgasının spawn'ı (72 ms). **9.6. sn:** ikinci dalga / ölüm-ragdoll anı civarı.

### Gözlemler
- Bot sayısı arttıkça FPS düşüyor ama bu build'de **en düşük ortalama 119 FPS** — önceki "FPS 50'lere iniyor" şikâyetine göre dramatik iyileşme (Claude fps-v2/v3 + iskelet seyreltme).
- Çizim çağrısı TDM arena'da en yüksek (~180); buna rağmen 120 FPS üstü.
- Açık dünyada ~43 **mob** (goblin/boss) ile 120 FPS — mob başına maliyet düşük kalmış. Köy NPC'leri (demirci/tüccar) bu sayıya dahil değil.
- Küçük bulgu: sayfa açılışında bir 403 (büyük olasılıkla favicon; oynanışı etkilemiyor).

### Sınırlar
- Ölçümler yapay senaryoyla (rastgele koşma/ateş); insan oyununun aim kalitesini temsil etmez.
- 5v5 çevrimiçi (gerçek oyunculu) ölçülmedi — ayrıcalık gerektirir; sonraki turda hesapla ölçülebilir.
- Monitör 60 Hz ise tarayıcıda üst sınır 60'tır; bu ölçümler pencere 1600×900'de ve GPU'nun ham kapasitesini yansıtır.

## Karşılaştırma (her yeni build'de güncelle)

| Build | TDM arena ort. FPS | Zombi ort. FPS | Açık dünya ort. FPS | Not |
|---|---|---|---|---|
| 202610170204 | 119.7 | 151.7 | 120.1 | ilk kayıt (baz) |

## Tekrar ölçüm için
```
cd <oyun klasörü> && PORT=3100 MMOFPS_DATA=<geçici> node server.js
node docs/qa/qa-olcum.cjs all   # tek mod: aim | tdm-arena | tdm-dust2 | zombi | acik-dunya
```
(Playwright gerektirir; sonuçlar docs/qa/ altına yazılır.)
