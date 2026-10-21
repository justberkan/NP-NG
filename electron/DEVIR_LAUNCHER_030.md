# CODEX-EXE-1 — Launcher 0.3.0 devir

Çalışma yalnız `codex/exe-offline` dalında, canlı klasörün dışında yapıldı. Claude birleştirir. Ortak günlükler, oyun JS/CSS/HTML ve varlıklar değiştirilmedi. Sunucudaki değişiklik yalnız GET/HEAD `/api/manifest` ve ona ait yardımcı/önbellektir. Main'in MIME genişletmesi korundu.

## Davranış
- Başarılı HTTP(S) açılışından sonra public manifest alınır. İlk istek hash üretir; mtime/size/ctime değişmediğinde hash tekrar hesaplanmaz. Dosyalar asenkron okunur; private ve sembolik bağ dosyaları listelenmez.
- Launcher en fazla iki dosyayı aynı anda indirir. SHA-256 ve boyut doğrulanır. Değişmeyen dosyalar diskteki doğrulanmış kopyadan alınır. 5000 dosya / 600 MiB üst sınırı vardır. Manifest 404 ise sessizce atlanır.
- Yeni sürüm `offline-game.new` içinde hazırlanır. Tamamlandığında dizinler değiştirilir, eski tam kopya `offline-game.old` içinde kalır. Aradaki kapanmada eski kopyadan kurtarma yapılır. Yeni sürüm başarısızsa önceki sürüm korunur.
- `offline-meta.json`: build, url, tarih; tamamlanmış kopyanın içinde de aynı metadata tutulur.
- Online oyun açılışında, 60 saniyede bir ve doğal pencere kapanışında yalnız onaylı yedi storage anahtarı alınır. 2 MiB sınırı ve JSON doğrulaması vardır. `npng_map` oyunun kullandığı ham harita kimliği olarak doğrulanır. Hesap/token anahtarı kopyalanmaz.
- `npng://game/__seed` sonrasında offline origin storage temizlenip tohumlanır; sonra index açılır. Offline oturumdan tohum geri alınmaz. Zorla süreç sonlandırmada son periyodik tohum korunur.
- Oyun oturumu `persist:npng-game`; sandbox/context isolation açık, Node ve preload yok. Popup/indirme yasak. Offline HTTP(S)/WebSocket trafiği ayrıca engellenir, yerel `/api/*` 503 döner. DEDE aynı kökten iframe olarak çalışır.
- VSync varsayılan kapalı. Açıkken yalnız iki kare/senkronizasyon kapatma anahtarı kaldırılır; diğer üç performans anahtarı korunur. Yeniden başlatma gerekli ve arayüzde belirtilir.

## Yeniden üretim
1. Kökte `npm ci` ve `npm test`.
2. `electron/` içinde `npm ci`, `npm test`, `npm run build`.
3. Kökte `node electron/tests/offline-packaged.cjs`. Port 3400 boş olmalı. Test yalnız geçici profil ve hesap dizini kullanır, sistemin ağını/firewall ayarını değiştirmez; Electron oyun oturumuna offline ağ emülasyonu uygular.
4. Kanıtlar `test-results/v030/`. Paket `electron/dist/NPNG-Kurulum-0.3.0-x64.exe`; dist Git'e eklenmez.

## Sınırlar
- İlk eşitleme için sunucunun manifest desteği ve bir kez başarılı online açılış gerekir.
- Kopan indirme aynı oturumda otomatik tekrarlanmaz; sonraki online açılışta yeniden denenir.
- Oyun tarafının kayıt/ekonomi kuralları main'den aynen alınmıştır.
- Test donanım hızlandırmalı FPS artışı iddiası içermez; görsel test yazılımsal WebGL ile gerçek Electron'dur.
- Ani elektrik kesintisine karşı disk fsync garantisi verilmez; dizin değiştirme ve yeniden açılış kurtarması uygulanır.
