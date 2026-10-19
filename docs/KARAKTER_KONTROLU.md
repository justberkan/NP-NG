# KARAKTER KONTROLÜ — KİMİ-2 (A-01 + A-02)

- Tarih: 2026-10-19
- Build: 202610191325 · suzulme-naruto-v1 (ekran köşesi doğrulandı)
- Ajan: Kimi (fiziksel test sorumlusu)
- Yöntem: Kendi test sunucusu (port 3419, geçici MMOFPS_DATA). Playwright ile her karakter kuşanıldı; lobide 1, TDM üçüncü şahısta (tp) 4 kare (yürü / koş / nişan / zıplama). Boy ölçümü: yüklü GLB iskeletinden `head.P0.y − min(ftL.P0.y, ftR.P0.y)` (dinlenme pozu, metre). Oyun koduna sıfır değişiklik.
- Görüntüler: `docs/karakter-kontrol/<id>-{lobi,yuru,kos,nisan,zip}.png`, özet tabakalar `_sheet*.png` / `_zoom*.png`, ham boy verisi `heights-all.json`.

## A-02 · Mağaza karakter tablosu

Durum sınıfları: ✅ sorun yok · ⚠️ omuz-kol bozuk · 🦵 bacak bozuk · 💨 kayıyor · 🔫 silah elde değil · ❌ rig kurulamadı

| id | Ad | Boy (m) | Durum | Not |
|----|----|---------|-------|-----|
| c0 | Gece Mavisi | 1.441 | ✅ | asker GLB, renk varyantı |
| c1 | Orman Kamuflaj | 1.441 | ✅ | |
| c2 | Kızıl Komando | 1.441 | ✅ | |
| c3 | Kent Grisi | 1.441 | ✅ | |
| c4 | Altın Muhafız | 1.441 | ✅ | |
| c5 | Gece Ajanı | 1.441 | ✅ | |
| c6 | Klasik Operatör | 1.441 | ✅ | |
| c7 | Çöl Operatörü | 1.441 | ✅ | |
| c8 | Siyah Operatör | 1.441 | ✅ | |
| c9 | Beyaz Operatör | 1.441 | ✅ | |
| h1 | Taş Dev | 1.441 | ✅ | aksesuarlı küp, glb:1 |
| h2 | Kızıl Tilki | 1.441 | ✅ | |
| h3 | Gölge Avcı | 1.441 | ✅ | |
| h4 | Robot RX-9 | 1.441 | ✅ | |
| h5 | Demir Adam | 1.437 | ✅ | |
| h6 | Örümcek Adam | 1.451 | ✅ | |
| h7 | Beyaz Samuray | 1.357 | ✅ | kısa boylu model |
| h9 | Kara Dul | 1.337 | ✅ | kısa boylu model |
| h10 | Leon | 1.438 | ✅ | |
| h11 | Siber Savaşçı | 1.433 | ✅ | |
| h12 | Ronin | 1.437 | ✅ | |
| h13 | Uzay Piyadesi | 1.438 | ✅ | |
| h14 | Gotik Zarafet | 1.436 | ✅ | |
| h15 | Heetah | 1.438 | ✅ | |
| h16 | Anime Kız | 1.438 | ✅ | |
| h17 | SWAT | 1.364 | ✅ | kısa boylu model |
| h18 | Anime Savaşçı | 1.514 | ✅ | uzun boylu model |
| h19 | Black Widow | 1.337 | ✅ | kısa boylu model |
| h20 | Goblin | ölçülemedi | ❌ | **GLB'de skinned mesh yok** — `karakter hazırlanamadı goblin: modelde skinned mesh yok` (glbrig.js glbPrep). Rig kurulamıyor, oyun küp karaktere düşüyor. Kanıt: `h20-{yuru,kos,nisan,zip}.png` (küp karakter görünüyor). |
| h21 | KB | 1.260 | ✅ | belirgin kısa (1.26 m) |
| h22 | Lara | 1.501 | ✅ | uzun boylu model |

Notlar:
- Kuşanılabilir 31 karakterin tamamında yürü/koşu/nişan/zıplama kareleri çekildi; bacak bozukluğu, kayma veya silahın elde olmaması görünen karakter yok. Koşu diz bükümü A-03 kapsamında ayrıca Codex'e verildi; bu turda yeniden ölçüm yapılmadı.
- Boy farklılıkları (1.26 – 1.51) A-15 "tek standart boy" işi için yukarıdaki ölçüler kullanılabilir.

## A-01 · Wick / Laz Torretto

İkisi de `assets/characters/{wick,laz}.glb`; CHARS kataloğunda **yok** (kuşanılamıyor, mağazada görünmüyor). Bu yüzden maç içinde rig'i elle sahneye koyup aynı animasyon iskeletiyle poz verilerek incelendi (oyuncu rigi gizlendi).

- Boy: ikisi de **1.57 m** (standart asker 1.441 m — ~%9 uzun).
- **Wick** (`wick-{yuru,kos,nisan,zip}.png`): koşu karesinde sağ kol omuz hizasında kalkık, silah tutuş pozu bozuk (⚠️ omuz-kol). Bacaklar koşuda normal.
- **Laz** (`laz-{yuru,kos,nisan,zip}.png`): yürüyüşte kollar ileride çıkık, dirsek pozu doğal değil; nişan karesinde silah tutuşu belirsiz (⚠️ omuz-kol).
- Yeniden rig (Mixamo: T-poz → otomatik rig → GLB) **Berkan'ın Adobe hesabını gerektirir**. Hesap olmadan Mixamo'ya girilmedi. Blender komut satırıyla otomatik rig denenmedi (gerçekçi sonuç vermez; T-poz/eklem tahmini Mixamo'nun işi).
- **Karar Berkan'ın:** (a) Adobe hesabı verilirse Mixamo ile yeniden rig'lenip `docs/varliklar/` altına konur, Claude oyuna ekler; (b) olmazsa "silinsin" önerisi geçerli. Silme işlemi yapılmadı.

## Ek bulgu · ada / samus

- `CHARS` listesinde `ada` ve `samus` id'leri yok (`js/weapons.js` 69–121 satırları tarandı); mağaza `CHARS`'tan dolduğu için mağazada da görünmüyorlar. `glbLoadChar` içinde erken return ile koddan kaldırılmışlar. Mağazada bu iki karakterin göründüğüne dair kanıt bulunamadı — ekran görüntüsündekiler bu ikili değilse ayrıca belirtilmeli.

## Yöntem kaydı (tekrar üretilebilirlik)

- Betik: Kimi çalışma alanındaki `k2-capture.cjs`; koşumu: `node k2-capture.cjs <çıktıDizini> <id1,id2,...>`.
- wick/laz dalı: oyuncu rigi `pRigGet().root.visible=false` (her tick'te oyun geri açtığı için kare çekimi öncesinde tekrar gizlendi), wick/laz rigi `mkHumanGLB(charCols(), GLBR.P[id], false)` ile S'e eklendi, her karede `position.set(p.x,p.y,p.z)` + `rotation.y=p.yaw+π` + `animHuman` ile poz verildi.
- Konsol uyarıları yakalandı: yalnızca `h20 goblin → modelde skinned mesh yok`. Sayfa hatası yok.

## Claude notu (2026-10-20)
- Rapor main'e alındı; 170 kanıt görüntüsü depo şişmesin diye yalnız `kimi/karakter-kontrol` dalında duruyor.
- Lara (h22) Berkan isteğiyle kaldırıldı (build 202610200050); kuşananlar askere döner.
- Goblin (h20) GLB'sinde iskelet yok → oyunda küp; karar Berkan'da (gizle / düzelt).
- Boy ölçümleri A-15 (tek standart boy) işine girdi.
