# N.P.N.G — İş planı ve görev dağılımı

## ZORUNLU KAYIT KURALI (2026-10-17, Berkan)
Her AI, oyun klasöründe yaptığı HER değişiklikten sonra `ISLEM_GUNLUGU.md` dosyasının en altına kayıt ekler:
saat (Türkiye), ajan adı, build, ne yapıldı, Eklendi / Değişti / Çıkarıldı (yoksa "yok"), dosyalar, test sonucu, yedek yeri.
Kayıt yazılmadan iş bitmiş sayılmaz. Eski kayıtlar silinmez. NOTLAR.md günlüğü de tutulmaya devam eder.
GitHub (justberkan/NP-NG main) güncellemesini Claude yapar; Codex/Kimi kendi işleri için dal açabilir.

Tarih: 16.10.2026 · Karar: Berkan

## Temel kural: oyun kodu tek elden
**Oyun kodunun tek sahibi Claude'dur.** Bu gece üç yapay zekâ aynı dosyaları aynı anda değiştirdi; birbirinin işini fark etmeden bozdu ve FPS düştü. Bu yüzden:

- `js/`, `css/`, `index.html`, `server.js`, `assets/`, `lib/` → **yalnız Claude değiştirir.**
- ChatGPT (Codex) ve Kimi bu dosyalara **yazmaz**. Okuyabilir, test edebilir, hata bildirebilir.
- Oyun kodunda hata ya da öneri bulan, düzeltmeyi kendisi yapmaz: `docs/HATA_BILDIRIMLERI.md` dosyasına yazar (biçim aşağıda). Claude okur, düzeltir, sonucu altına yazar.
- Herkes yalnız kendi klasöründe çalışır. Başlamadan önce NOTLAR.md ve bu dosya okunur. Bitince NOTLAR.md günlüğüne bir satır eklenir.
- Doğrulamadan "oldu" denmez. Her teslimde: ne yapıldı, nasıl test edildi, gerçek sonuç.

## Claude — oyunun kendisi
1. Dust2'de FPS düşüşü ve akıcılık kaybı (öncelik 1): ölç, sebebi bul, düzelt.
2. Silah hissi, geri tepme, sesler.
3. Kılıç kombinasyonları ve vuruş pencereleri.
4. Aim Training: raflar, gerçek hedefler, loadout yalnız zombi modlarında.
5. 5v5 satın alma menüsü (Kimi'nin tasarım belgesine göre).
6. Forma açıkları (Kara Dul deseni, ilk görünüş takılması, FP kollar).
7. Çevrimiçi altyapı (sunucu, gecikme telafisi) — Codex'in test araçlarıyla birlikte.

## ChatGPT (Codex) — EXE, depo ve otomatik testler
Çalışma alanı: `electron/`, `tests/`, `.github/`, `package.json` (yalnız test/build betikleri).

**C1 — EXE istemcisi (öncelik 1, FPS düzeltmesinden bağımsız başlayabilir)**
- `electron/` klasöründe Electron kabuğu. Oyun dosyalarına dokunmadan, oyunu `http://localhost:3000` ya da internet linkinden yükler.
- Ana süreçte zorunlu: `disable-frame-rate-limit`, `disable-gpu-vsync`, `force_high_performance_gpu`, `disable-background-timer-throttling`, `disable-renderer-backgrounding`.
- Ctrl+W / Ctrl+R / F5 / Alt+F4 dışı tarayıcı kısayolları oyunu kapatmaz. Gerçek tam ekran, fare kilidi çalışır.
- Açılışta sunucu adresi seçimi (yerel / link). Dosya boyutu sorun değil.
- `electron-builder` ile tek kurulum dosyası (.exe). Kurulum ve çalıştırma adımları `electron/OKU-BENI.txt`.
- Kabul: EXE açılır, lobiye girilir, maç başlar, FPS göstergesi monitör hızının üstüne çıkar (Berkan doğrular).
- Oyun kodunda EXE için bir değişiklik gerekirse yapmaz, HATA_BILDIRIMLERI.md'ye yazar.

**C2 — GitHub deposu**
- Yerel klasör ile `justberkan/NP-NG` deposunu eşitle. `data/`, hesaplar, `.env`, `cloudflared.exe`, `_yedek/` yüklenmez.
- Claude'un teslimlerini Claude adına değil, olduğu gibi işle (commit mesajında kimin işi olduğu yazsın).

**C3 — Otomatik testler**
- `tests/` altına performans testi ekle: Arena, Dust2, Zombi, Açık Dünya'da 60 sn; ortalama kare süresi, en kötü %1, çizim çağrısı, takılma (>50 ms) sayısı. Sonuç `test-results/perf/` altına tarihli.
- Her yeni build'de tüm testleri çalıştır, sonuçları `docs/TEST_RAPORU.md`'ye ekle. Gerileme varsa HATA_BILDIRIMLERI.md'ye yaz.
- Bozuk iki test var (first-person.cjs zaman aşımı, weapons.cjs m_awm/m_moz sol el): testin mi oyunun mu hatası olduğunu ayır, testse düzelt, oyunsa bildir.

## Kimi — test, araştırma, tasarım belgeleri
Çalışma alanı: `docs/` (oyun kodu yok).

**K1 — Gerçek cihaz performans/QA raporu (öncelik 1)**
- Berkan'ın bilgisayarında her modda FPS sayacıyla oyna, sonuçları `docs/QA_RAPORU.md`'ye yaz: mod, harita, ayar ön ayarı, ortalama FPS, takılma anları (ne yaparken), ekran görüntüsü yolu.
- Her yeni build'de tekrarla; önceki build ile karşılaştır.

**K2 — Satın alma menüsü tasarım belgesi**
- CS 1.6 / Krunker tarzı 5v5 satın alma ekranı: kategoriler, fiyatlar, tuş kısayolları, ekran düzeni (çizim/taslak). Başlamadan Berkan'dan referans görüntü al.
- Çıktı: `docs/TASARIM_SATIN_ALMA.md`. Claude bu belgeye göre kodlar.

**K3 — Varlık ve lisans araştırması**
- Ücretsiz/CC-BY silah sesleri, ayak sesleri, vuruş sesleri; low-poly harita ve karakter modelleri. Her biri için kaynak linki, lisans, boyut.
- Çıktı: `docs/VARLIK_LISTESI.md`. İndirilen dosyalar `docs/varliklar/` altına (oyuna Claude ekler).
- Mevcut modellerin lisanslarını kontrol et (özellikle CC-BY-NC olan goblin: ticari kullanıma engel).

**K4 — Mod tasarımları**
- Berkan'ın talimat dosyasındaki büyük modlar (MMO, yarış, hayatta kalma, ekonomi): her biri için kısa oynanış belgesi, öncelik sırası önerisi. Çıktı: `docs/MOD_TASARIMLARI.md`.

## Hata bildirimi biçimi (docs/HATA_BILDIRIMLERI.md)
```
### [tarih saat] Kısa başlık — bildiren: Codex/Kimi/Berkan
Build: 202610xxxxxx
Mod/harita:
Nasıl oluyor (adım adım):
Beklenen / Olan:
Kanıt (ekran görüntüsü, test çıktısı, konsol hatası):
Öneri (isteğe bağlı):
--- Claude cevabı: (durum, build, ne değişti)
```

## Sıra
1. Claude: Dust2 FPS düzeltmesi · Codex: C1 EXE (paralel, ayrı klasör) · Kimi: K1 ölçüm.
2. Berkan EXE'yi ve FPS'i dener.
3. Codex C2–C3, Kimi K2–K4, Claude listesindeki sıradaki işler.

## GitHub yedeği (2026-10-17)
- Oyunun tam güncel hali `justberkan/NP-NG` reposunun **main** dalında. Hesap verileri (`data/`), `.env`, `cloudflared.exe`, `_yedek/`, electron `dist/` ve `node_modules/` repoya girmez.
- Claude her oyun güncellemesinden sonra main'i günceller (commit mesajında build etiketi olur).
- Codex / Kimi: yerel klasöre bağlı kalmak zorunda değil. `git clone https://github.com/justberkan/NP-NG` ile en güncel kodu alın, kendi işinizi kendi dalınızda (`codex/...`, `kimi/...`) yapıp PR açın. Oyun kodunu (js/css/index.html) yine yalnız Claude değiştirir.

## 17.10.2026 — Berkan'ın doğrudan müdahale yetkisi / Codex teslimi
Berkan animasyonu Codex'e devretti ve ardından Ada Wong/Samus kaldırma, Battle Pass görsel iyileştirme, süzülme/tırmanma/kayma, 5v5 bomba ve kamera düzenlemelerini doğrudan oyun dosyalarına istedi. Bu kapsam 202610171402 hareket-bomba-v1 olarak işlendi. Ayrıntı: docs/CODEX_DEVIR_20261017.md. Claude/Kimi eski animasyon/BP paketlerini bu sürümün üzerine yazmadan önce bu devri okuyun. server.js için yeniden başlatma gerekli.

## 17.10.2026 — Son kullanıcı yönlendirmesi / 202610171404
Çatılar erişilebilir kalacak; yalnız kenarlardan düşüş ve tavan üstüne çıkış engellenecek. Codex son hali buna göre değiştirdi; önceki nav/+3.2m çatı kısıtı kaldırıldı. Rekabetçi giriş/Tab/satın alma ve Holosight çift nokta düzeltmeleriyle birlikte devir: docs/codex-1403/DEVIR.md. NOTLAR.md son kaydı esas alınmalı.

## 17.10.2026 — 1405 yeni koridor modu ve Dust2 geri düzeltmesi
Berkan'ın yeni mod paketiyle doğrudan entegrasyon: docs/codex-koridor/DEVIR.md. Dust2 görünmez duvar/tavan talebi geri alındı; 1404 notları bu konuda geçersiz. Yeni co-op modunun sunucu bağımlılığı server-wavecorridor.js dosyasıdır; dağıtımda unutmayın.
